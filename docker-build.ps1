# Reads VITE_* vars from .env and passes them as build args
$envVars = @{}
Get-Content .env | Where-Object { $_ -match "^\s*[^#].*=" } | ForEach-Object {
    $k, $v = $_ -split "=", 2
    $envVars[$k.Trim()] = $v.Trim()
}

$viteConvexUrl       = $envVars["VITE_CONVEX_URL"]
$clerkPublishableKey = $envVars["VITE_CLERK_PUBLISHABLE_KEY"]

docker build `
    --build-arg "VITE_CONVEX_URL=$viteConvexUrl" `
    --build-arg "VITE_CLERK_PUBLISHABLE_KEY=$clerkPublishableKey" `
    -t life-strategy .
