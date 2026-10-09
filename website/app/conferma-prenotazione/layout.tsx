import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ConfermaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        nav, [class*="lg:hidden"] { display: none !important; }
        body { padding-top: 0 !important; }
      `}</style>
      {children}
    </>
  )
}
