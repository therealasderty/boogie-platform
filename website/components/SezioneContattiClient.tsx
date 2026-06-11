'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import FormContatti from '@/components/FormContatti'

export default function SezioneContatti({ fotoSrc = '/images/hero/giardino-boogie-bistrot-colle-brianza.avif', fotoAlt = 'Boogie Bistrot' }: { fotoSrc?: string; fotoAlt?: string }) {

  return (
    <section className="flex flex-col md:flex-row min-h-[600px]">

      {/* Form */}
      <motion.div
        className="md:flex-1 flex flex-col justify-center px-8 py-16 md:px-16 md:py-20 bg-white order-last md:order-first"
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >

        <span
          className="uppercase text-black/40 font-medium"
          style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
        >
          Contattaci
        </span>
        <h2
          className="font-semibold text-neutral-900 leading-snug mt-4 mb-2"
          style={{ fontSize: 'var(--text-section)' }}
        >
          Organizza il tuo evento speciale al Boogie Bistrot di Colle Brianza
        </h2>
        <div className="w-10 h-px bg-neutral-200 mb-4" />
        <p className="text-neutral-500 font-light leading-relaxed mb-8" style={{ fontSize: 'var(--text-meta)' }}>
          Stai organizzando una festa di compleanno, un evento di lavoro o qualsiasi evento speciale?<br />Ci impegneremo a rendere la tua serata unica e memorabile.<br /><br />Completa il modulo di seguito, ci assicureremo di rispondere prontamente a tutte le tue richieste.
        </p>
        <FormContatti />
      </motion.div>

      {/* Foto */}
      <motion.div
        className="relative h-72 md:h-auto md:flex-1 order-first md:order-last"
        initial={{ opacity: 0, x: 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
      >
        <Image
          src={fotoSrc}
          alt={fotoAlt}
          fill
          className="object-cover"
          sizes="50vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3) 100%)' }}
        />
      </motion.div>

    </section>
  )
}
