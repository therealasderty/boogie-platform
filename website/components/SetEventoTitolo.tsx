'use client'

import { useEffect } from 'react'
import { usePageContext } from '@/lib/page-context'

export default function SetEventoTitolo({ titolo }: { titolo: string }) {
  const { setEventoTitolo } = usePageContext()
  useEffect(() => {
    setEventoTitolo(titolo)
    return () => setEventoTitolo('')
  }, [titolo, setEventoTitolo])
  return null
}
