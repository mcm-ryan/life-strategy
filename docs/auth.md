# Authentication & Authorization

This document explains how auth works end-to-end in the Life Strategy app.

---

## Stack

| Layer | Tool | Role |
|-------|------|------|
| Identity | [Clerk](https://clerk.com) | Sign-in / sign-up UI, session management, JWT issuance |
| Database | [Convex](https://convex.dev) | Persists strategies per user; enforces ownership server-side |
| API route | `@clerk/backend` | Verifies Clerk JWTs on the Nitro server before calling Claude |
| Rate limiting | Redis (ioredis) | Caps strategy generation per user (not per IP) |

---

## Auth flow

```
Browser                    Clerk CDN              Convex cloud         Nitro server
  │                           │                       │                     │
  │── sign in ───────────────►│                       │                     │
  │◄─ session token ──────────│                       │                     │
  │                           │                       │                     │
  │── useMutation (Convex) ───────────────────────────►│                    │
  │   (token auto-attached by ConvexProviderWithClerk) │                    │
  │◄─ strategyId ─────────────────────────────────────│                    │
  │                           │                       │                     │
  │── POST /api/strategy (Authorization: Bearer <token>) ──────────────────►│
  │                           │                       │  verify JWT         │
  │                           │                       │◄────────────────────│
  │◄─ streamed text ──────────────────────────────────────────────────────-─│
  │                           │                       │                     │
  │── useMutation saveStrategyText ───────────────────►│                    │
```

---

## Provider setup (`src/routes/__root.tsx`)

The root shell wraps the entire app with both providers:

```tsx
<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    {children}
  </ConvexProviderWithClerk>
</ClerkProvider>
```

**`ClerkProvider`** (from `@clerk/clerk-react`) — bootstraps the Clerk JS SDK in the browser, manages the session cookie, and makes `useUser` / `useAuth` / `UserButton` available everywhere in the tree.

**`ConvexProviderWithClerk`** (from `convex/react-clerk`) — wraps Convex's standard `ConvexProvider`. It reads the active Clerk session via the `useAuth` hook and automatically attaches the Clerk JWT to every Convex query and mutation. This means you never manually pass a token to Convex calls.

The `ConvexReactClient` is created once at module scope with the `VITE_CONVEX_URL` env var, which points to your Convex deployment.

---

## Route protection (client-side)

Protected pages — questionnaire, strategy view, dashboard — all use the same pattern:

```tsx
const { isSignedIn, isLoaded } = useUser()

useEffect(() => {
  if (isLoaded && !isSignedIn) {
    void navigate({ to: '/sign-in' })
  }
}, [isLoaded, isSignedIn, navigate])

if (!isLoaded || !isSignedIn) return <Spinner />
```

- **`isLoaded`** is `false` during the initial hydration tick while Clerk reads the session from the cookie. Rendering nothing prevents a flash of authenticated content.
- Once loaded, if the user is not signed in they are redirected to `/sign-in` before any Convex queries fire.

This is intentionally client-side only. TanStack Start supports SSR-level auth guards via `beforeLoad` on the router, but that requires passing auth into the router context — added complexity that isn't needed here.

---

## Convex mutations & queries (`convex/strategies.ts`)

Every server function starts by calling:

```ts
const identity = await ctx.auth.getUserIdentity()
if (!identity) throw new Error('Not authenticated')
```

`ctx.auth.getUserIdentity()` decodes the Clerk JWT that `ConvexProviderWithClerk` automatically attached. It returns `null` if no valid token is present.

**Ownership enforcement:** queries and mutations additionally check that the record's `userId` matches `identity.subject` (the Clerk user ID):

```ts
const strategy = await ctx.db.get(id)
if (!strategy || strategy.userId !== identity.subject) {
  throw new Error('Not found')
}
```

This means a signed-in user cannot read or modify another user's strategy even if they know the ID.

---

## API route auth (`src/routes/api/strategy.ts`)

The `/api/strategy` POST endpoint runs server-side in Nitro. Convex's automatic token attachment does not apply here — the browser must send the token explicitly.

**Client side** (`src/routes/strategy.$id.tsx`):

```ts
const token = await getToken()   // from useAuth()
fetch('/api/strategy', {
  headers: { Authorization: `Bearer ${token}` },
  ...
})
```

**Server side** (`src/routes/api/strategy.ts`):

```ts
async function getUserId(request: Request): Promise<string | null> {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  const state = await clerk.authenticateRequest(request, {
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
  })
  if (!state.isSignedIn) return null
  return state.toAuth().userId
}
```

`createClerkClient` + `authenticateRequest` (from `@clerk/backend`) verifies the JWT signature against Clerk's public keys, checks expiry, and returns the `userId`. A missing or invalid token returns a `401` before any call to Claude.

---

## Rate limiting

Previously rate-limited by IP address, the limiter now keys on the authenticated user ID:

```ts
const key = `rl:user:${userId}`
```

**Why user ID instead of IP?**
- IP-based limiting breaks for users behind NAT or shared networks (multiple users share one IP, or one user has multiple IPs).
- User ID is stable and unique — it accurately represents one account's usage.
- Users must be authenticated before hitting the limit, so there's no unauthenticated bypass.

The window is 3 requests per hour per user, stored as a Redis counter with a 1-hour TTL.

---

## Sign-in page (`src/routes/sign-in.tsx`)

Renders Clerk's hosted `<SignIn />` component using hash routing (so deep-linking still works with TanStack Router):

```tsx
<SignIn routing="hash" fallbackRedirectUrl="/questionnaire" />
```

Clerk handles the full sign-in / sign-up / password reset / OAuth flow. After a successful auth, the user lands on `/questionnaire`.

---

## Environment variables

| Variable | Where used | Notes |
|----------|-----------|-------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Client (`ClerkProvider`) + Server (JWT verification) | Safe to expose publicly — it's a publishable key |
| `CLERK_SECRET_KEY` | Server only (`@clerk/backend`) | Never sent to the browser |
| `VITE_CONVEX_URL` | Client (`ConvexReactClient`) | Public cloud endpoint URL |

`VITE_` prefixed variables are exposed to the browser by Vite. Non-prefixed variables (`CLERK_SECRET_KEY`) are only accessible in the Nitro server process via `process.env`.
