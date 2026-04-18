import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.prod.website-files.com' },
      // Cloudinary (ottimizzazione immagini)
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Airtable attachments
      { protocol: 'https', hostname: 'v5.airtableusercontent.com' },
      { protocol: 'https', hostname: 'v4.airtableusercontent.com' },
      { protocol: 'https', hostname: 'dl.airtable.com' },
      { protocol: 'https', hostname: 'content.airtable.com' },
      { protocol: 'https', hostname: '*.airtableusercontent.com' },
    ],
  },
  async redirects() {
    return [
      // Menu slug redirects
      { source: '/menu-alla-carta', destination: '/menu/specialita', permanent: true },
      { source: '/la-nostra-pizza', destination: '/menu/pizza', permanent: true },
      { source: '/carta-birre', destination: '/menu/birre', permanent: true },
      { source: '/carta-vini', destination: '/menu/vini', permanent: true },
      // Galleria
      { source: '/galleria-fotografica', destination: '/galleria', permanent: true },
      // Alias comuni
      { source: '/menu', destination: '/menu/specialita', permanent: false },
    ]
  },
};

export default nextConfig;
