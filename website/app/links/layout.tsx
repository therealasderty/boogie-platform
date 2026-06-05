export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        nav, [class*="lg:hidden"]:not(.banner-chiusure-mobile) { display: none !important; }
        body { padding-top: 0 !important; }
      `}</style>
      {children}
    </>
  )
}
