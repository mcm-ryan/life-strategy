import { HeadContent, Scripts, createRootRoute, Link } from '@tanstack/react-router'
import { ClerkProvider } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { useAuth } from '@clerk/clerk-react'

import Header from '../components/Header'

import appCss from '../styles.css?url'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-gray-500">Page not found.</p>
      <Link to="/" className="text-sm underline underline-offset-4">
        Go home
      </Link>
    </div>
  )
}

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Life Strategy AI</title>
        <link rel="icon" href="/brain.svg" type="image/svg+xml" />
        <HeadContent />
      </head>
      <body>
        <ClerkProvider
          publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}
        >
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <Header />
            {children}
          </ConvexProviderWithClerk>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}
