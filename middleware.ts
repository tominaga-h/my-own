export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!api/auth|auth/signin|api/cron|_next/static|_next/image|favicon.ico).*)",
  ],
};
