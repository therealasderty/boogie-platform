'use client'

import { usePathname } from 'next/navigation'

const STANDALONE_PATHS = ['/feedback']

export default function NavbarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (STANDALONE_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return null
  return <>{children}</>
}
