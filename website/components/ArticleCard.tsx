import Image from 'next/image'
import Link from 'next/link'
import ArrowRightIcon from '@/components/ArrowRightIcon'

interface ArticleCardProps {
  image?: string
  imageAlt?: string
  badge?: string
  titolo: string
  descrizione?: string
  href: string
  ctaLabel: string
}

export default function ArticleCard({ image, imageAlt = '', badge, titolo, descrizione, href, ctaLabel }: ArticleCardProps) {
  return (
    <article className="group flex flex-col bg-white rounded-card overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {image && (
        <div className="card-img">
          <Image src={image} alt={imageAlt || titolo} fill className="object-cover img-zoom" sizes="(max-width: 768px) 100vw, 50vw" />
          {badge && <span className="card-badge">{badge}</span>}
        </div>
      )}
      <div className="card-body">
        <h3 className="font-semibold text-neutral-900 leading-snug" style={{ fontSize: 'var(--text-lead)' }}>
          {titolo}
        </h3>
        {descrizione && (
          <p className="text-neutral-500 font-light leading-relaxed flex-1" style={{ fontSize: 'var(--text-meta)' }}>
            {descrizione}
          </p>
        )}
        <Link href={href} className="article-link">
          {ctaLabel}
          <ArrowRightIcon />
        </Link>
      </div>
    </article>
  )
}
