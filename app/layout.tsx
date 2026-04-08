import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "my-own",
  description: "Personal knowledge inbox",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

