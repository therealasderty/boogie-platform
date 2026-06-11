import { fetchMedia } from '@/lib/media'
import SezioneMenuCards from '@/components/SezioneMenuCards'

const VOCI_CONFIG = [
  {
    titolo: 'Specialità alla carta',
    descrizione: 'Specialità brianzole reinterpretate con creatività.\nIngredienti freschi e prodotti locali selezionati.',
    tag: 'carta',
    fallback: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif',
    href: '/menu/specialita',
    ctaLabel: 'Scopri il menù',
  },
  {
    titolo: 'Pizza',
    descrizione: 'Impasto a lunga lievitazione, forno a legna e ingredienti selezionati\nper una pizza leggera e dal gusto inconfondibile.',
    tag: 'pizza',
    fallback: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif',
    href: '/menu/pizza',
    ctaLabel: 'Scopri le pizze',
  },
  {
    titolo: 'Carta dei Vini',
    descrizione: 'Etichette italiane e locali selezionate con cura\nper esaltare i nostri piatti.',
    tag: 'vino',
    fallback: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif',
    href: '/menu/vini',
    ctaLabel: 'Scopri la carta',
  },
  {
    titolo: 'Birre',
    descrizione: 'Birre selezionate con cura dalla Lombardia e oltre.',
    tag: 'birra',
    fallback: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif',
    href: '/menu/birre',
    ctaLabel: 'Scopri le birre',
    mezza: true,
  },
  {
    titolo: 'Cocktail',
    descrizione: 'Aperitivi, long drink e signature cocktail preparati al momento.',
    tag: 'cocktail',
    fallback: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif',
    href: '/menu/cocktails',
    ctaLabel: 'Scopri i cocktail',
    mezza: true,
  },
]

export default async function SezioneMenu() {
  const fotos = await Promise.all(
    VOCI_CONFIG.map(v => fetchMedia(v.tag))
  )

  const voci = VOCI_CONFIG.map((v, i) => ({
    titolo: v.titolo,
    descrizione: v.descrizione,
    images: fotos[i].map(m => ({ url: m.url, soloMobile: m.soloMobile })),
    fallback: v.fallback,
    href: v.href,
    ctaLabel: v.ctaLabel,
    mezza: v.mezza,
  }))

  return <SezioneMenuCards voci={voci} />
}
