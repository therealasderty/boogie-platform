export default function LinksLayout({ children }: { children: React.ReactNode }) {
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
