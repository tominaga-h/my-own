export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!api/auth|auth/signin|api/cron|api/dev|api/data|api/notes|api/tasks|api/links|_next/static|_next/image|favicon.ico).*)",
  ],
};
