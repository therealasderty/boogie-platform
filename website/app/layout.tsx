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
import { openGraphImageUrl } from "@/lib/imagekit-delivery";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const media = await fetchMedia('og-image')
  const ogImage = openGraphImageUrl(media[0]?.url ?? '/og-image.jpg')
  return {
    title: "Boogie Bistrot",
    description: "Ristorante con giardino a Colle Brianza",
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      ],
      shortcut: '/favicon.ico',
      apple: [{ url: '/apple-icon-180.png', sizes: '180x180', type: 'image/png' }],
      other: [
        { rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { rel: 'icon', url: '/icon_512.png', sizes: '512x512', type: 'image/png' },
      ],
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
    ...eventiRaw.filter(e => !e.ricorrente && e.data && e.data >= oggi && e.stato === 'attivo').slice(0, 3),
    ...eventiRaw.filter(e => e.ricorrente && e.stato === 'attivo').slice(0, 2),
  ]

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Boogie Bistrot',
    url: 'https://boogiebistrot.com',
    telephone: ['+390399260568', '+393465813309'],
    email: 'info@boogiebistrot.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Via Europa, 2',
      addressLocality: 'Colle Brianza',
      addressRegion: 'LC',
      postalCode: '23886',
      addressCountry: 'IT',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 45.7593,
      longitude: 9.3620,
    },
    hasMap: 'https://maps.google.com/?cid=6154073069839278986',
    servesCuisine: ['Italiana', 'Brianzola', 'Pizza'],
    priceRange: '€€',
    sameAs: [
      'https://www.facebook.com/boogiebistrot',
      'https://www.instagram.com/boogiebistrot',
    ],
  }

  return (
    <html lang="it" className={`${raleway.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
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
