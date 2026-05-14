export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        nav, [class*="lg:hidden"] { display: none !important; }
        body { padding-top: 0 !important; padding-bottom: 0 !important; }
      `}</style>
      {children}
    </>
  )
}
