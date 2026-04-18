import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar"
import CookieBanner from "@/components/CookieBanner";
import { fetchOrari, fetchChiusure, buildOrariLines } from "@/lib/orari";
import { fetchEventi } from "@/lib/agenda";
import type { EventoAgenda } from "@/lib/agenda";
import { PageContextProvider } from "@/lib/page-context"
import PopupManager from "@/components/PopupManager";
import { fetchMedia } from "@/lib/media";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const media = await fetchMedia('og-image')
  const ogImage = media[0]?.url ?? '/og-image.jpg'
  return {
    title: "Boogie Bistrot",
    description: "Ristorante con giardino a Colle Brianza",
    icons: {
      icon: '/favicon-circle.svg',
      shortcut: '/favicon-circle.svg',
      apple: '/favicon-circle.svg',
    },
    openGraph: {
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'Boogie Bistrot' }],
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [orari, chiusure, eventiRaw] = await Promise.all([fetchOrari(), fetchChiusure(), fetchEventi()])
  const orariDisplay = buildOrariLines(orari, chiusure)
  const oggi = new Date().toISOString().split('T')[0]
  const eventiNavbar: EventoAgenda[] = [
    ...eventiRaw.filter(e => !e.ricorrente && e.data && e.data >= oggi).slice(0, 3),
    ...eventiRaw.filter(e => e.ricorrente).slice(0, 2),
  ]

  return (
    <html lang="it" className={`${raleway.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <PageContextProvider>
          <Navbar orariDisplay={orariDisplay} eventi={eventiNavbar} />
          {children}
          <PopupManager />
          <CookieBanner />
        </PageContextProvider>
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || 'https://cloud.umami.is/script.js'}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
