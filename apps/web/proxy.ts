import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isWebhookRoute = createRouteMatcher(["/api/polar/webhook"]);

export default clerkMiddleware((auth, req) => {
  // Skip Clerk for webhook routes
  if (isWebhookRoute(req)) return;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
