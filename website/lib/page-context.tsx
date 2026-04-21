'use client'

import { createContext, useContext, useState } from 'react'

interface PageContextValue {
  eventoTitolo: string
  setEventoTitolo: (t: string) => void
  eventoDormiente: boolean
  setEventoDormiente: (v: boolean) => void
}

const PageContext = createContext<PageContextValue>({
  eventoTitolo: '',
  setEventoTitolo: () => {},
  eventoDormiente: false,
  setEventoDormiente: () => {},
})

export function PageContextProvider({ children }: { children: React.ReactNode }) {
  const [eventoTitolo, setEventoTitolo] = useState('')
  const [eventoDormiente, setEventoDormiente] = useState(false)
  return (
    <PageContext.Provider value={{ eventoTitolo, setEventoTitolo, eventoDormiente, setEventoDormiente }}>
      {children}
    </PageContext.Provider>
  )
}

export function usePageContext() {
  return useContext(PageContext)
}
