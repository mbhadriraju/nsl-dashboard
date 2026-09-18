import type { Metadata } from "next";
import "./globals.css";
import { LeagueProvider } from "@/components/league-provider";
import { Shell } from "@/components/shell";
export const metadata: Metadata = {
  title: { default: "NSL | Nobaglagi Soccer League", template: "%s | NSL" },
  description:
    "Fixtures. Rankings. Rivalries. The home of the Nobaglagi Soccer League.",
  icons: { icon: "/logos/nsl_logo.png", apple: "/logos/nsl_logo.png" },
  manifest: "/manifest.webmanifest",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <LeagueProvider>
          <Shell>{children}</Shell>
        </LeagueProvider>
      </body>
    </html>
  );
}
