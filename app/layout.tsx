import type { ReactNode } from "react";
import "./globals.css";
import Header from "./components/Header";
import Providers from "./providers";

export const metadata = {
  title: "my-own",
  description: "Personal knowledge inbox",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Providers apiKey={process.env.API_KEY ?? ""}>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
