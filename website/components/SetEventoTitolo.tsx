'use client'

import { useEffect } from 'react'
import { usePageContext } from '@/lib/page-context'

export default function SetEventoTitolo({ titolo, dormiente = false }: { titolo: string; dormiente?: boolean }) {
  const { setEventoTitolo, setEventoDormiente } = usePageContext()
  useEffect(() => {
    setEventoTitolo(titolo)
    setEventoDormiente(dormiente)
    return () => {
      setEventoTitolo('')
      setEventoDormiente(false)
    }
  }, [titolo, dormiente, setEventoTitolo, setEventoDormiente])
  return null
}
