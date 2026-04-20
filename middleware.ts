export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!api/auth|auth/signin|api/cron|api/dev|api/data|api/notes|api/tasks|api/projects|api/links|_next/static|_next/image|favicon.ico|logo.svg|favicon.svg).*)",
  ],
};
