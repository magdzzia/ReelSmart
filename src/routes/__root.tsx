import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { StoreProvider } from "@/lib/store";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ReelSmart — Study. Earn Reels." },
      { name: "description", content: "Flashcards that unlock YouTube Shorts. Study harder, earn more reels." },
      { name: "author", content: "ReelSmart" },
      { property: "og:title", content: "ReelSmart — Study. Earn Reels." },
      { property: "og:description", content: "Flashcards that unlock YouTube Shorts. Study harder, earn more reels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "ReelSmart — Study. Earn Reels." },
      { name: "twitter:description", content: "Flashcards that unlock YouTube Shorts. Study harder, earn more reels." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b21c457e-7366-4b60-b0fb-c395284dc9a8/id-preview-f0e034ad--f0395a43-fc0a-4c6c-95a6-32719bacb49c.lovable.app-1777137305529.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b21c457e-7366-4b60-b0fb-c395284dc9a8/id-preview-f0e034ad--f0395a43-fc0a-4c6c-95a6-32719bacb49c.lovable.app-1777137305529.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <StoreProvider>
      <Outlet />
    </StoreProvider>
  );
}
