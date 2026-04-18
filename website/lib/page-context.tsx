'use client'

import { createContext, useContext, useState } from 'react'

interface PageContextValue {
  eventoTitolo: string
  setEventoTitolo: (t: string) => void
}

const PageContext = createContext<PageContextValue>({
  eventoTitolo: '',
  setEventoTitolo: () => {},
})

export function PageContextProvider({ children }: { children: React.ReactNode }) {
  const [eventoTitolo, setEventoTitolo] = useState('')
  return (
    <PageContext.Provider value={{ eventoTitolo, setEventoTitolo }}>
      {children}
    </PageContext.Provider>
  )
}

export function usePageContext() {
  return useContext(PageContext)
}
