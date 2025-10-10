import "~/styles/globals.css";

import { type Metadata } from "next";
import { Lato } from "next/font/google";
import Sidebar from "~/components/Sidebar";

export const metadata: Metadata = {
  title: "Polyhedg - Hedge Anything",
  description: "Hedge your bets with Polyhedg",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lato.variable}`}>
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
