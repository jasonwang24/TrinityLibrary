import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { Montserrat, Source_Serif_4 } from "next/font/google";
import { Providers } from "./providers";
import NavBar from "./components/NavBar";
import BugReportButton from "./components/BugReportButton";
import SplashScreen from "./components/SplashScreen";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["italic"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trinity Library",
  description: "Manage your library catalog, checkouts, and holds",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${sourceSerif.variable}`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Q0GP59L2Q7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Q0GP59L2Q7');
          `}
        </Script>
      </head>
      <body>
        <Providers>
          <SplashScreen />
          <NavBar />
          {children}
          <BugReportButton />
        </Providers>
      </body>
    </html>
  );
}
