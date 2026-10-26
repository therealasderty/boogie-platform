import type { ReactNode } from 'react'

type Bg = 'white' | 'warm' | 'dark'

const bgClass: Record<Bg, string> = {
  white: 'bg-white',
  warm:  'bg-surface-warm',
  dark:  'bg-surface-dark',
}

interface SectionContainerProps {
  bg?: Bg
  children: ReactNode
  className?: string
  innerClassName?: string
  as?: 'section' | 'div'
}

export default function SectionContainer({
  bg = 'white',
  children,
  className = '',
  innerClassName = '',
  as: Tag = 'section',
}: SectionContainerProps) {
  return (
    <Tag className={`py-20 md:py-28 ${bgClass[bg]} ${className}`}>
      <div className={`max-w-7xl mx-auto px-6 md:px-14 ${innerClassName}`}>
        {children}
      </div>
    </Tag>
  )
}
