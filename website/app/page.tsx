import type { Metadata } from 'next'
import Hero from '@/components/Hero'

export const metadata: Metadata = {
  title: 'Boogie Bistrot | Ristorante con Giardino a Colle Brianza | Cucina e Pizza',
  description: 'Boogie Bistrot a Colle Brianza: ristorante con giardino, cucina del territorio rivisitata, pizza tradizionale cotta nel forno a legna, birre locali ed eventi tutto l\'anno.',
  openGraph: {
    title: 'Boogie Bistrot | Ristorante con Giardino a Colle Brianza | Cucina e Pizza',
    description: 'Boogie Bistrot a Colle Brianza: ristorante con giardino, cucina del territorio rivisitata, pizza tradizionale cotta nel forno a legna, birre locali ed eventi tutto l\'anno.',
    locale: 'it_IT',
    siteName: 'Boogie Bistrot',
  },
}
import Calendario from '@/components/Calendario'
import SezioneIntro from '@/components/SezioneIntro'
import SezioneMenu from '@/components/SezioneMenu'
import SezioneFAQ from '@/components/SezioneFAQ'
import SezioneBlog from '@/components/SezioneBlog'
import SezioneContatti from '@/components/SezioneContatti'
import SezioneRecensioni from '@/components/SezioneRecensioni'
import Footer from '@/components/Footer'
import { fetchOrari, fetchChiusure, buildOrariLines } from '@/lib/orari'
import { fetchMedia } from '@/lib/media'
import { fetchEventi } from '@/lib/agenda'

const GIORNI_ESTESI  = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const GIORNI_BREVI   = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const GIORNI_LABEL   = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const GIORNI_FULL    = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
const MESI_FULL      = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const ORDINE_SETTIMANA = [1, 2, 3, 4, 5, 6, 0]

function formatGiorniSettimana(giorniStr: string): string {
  const nums = giorniStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (!nums.length) return ''
  const sorted = ORDINE_SETTIMANA.filter(g => nums.includes(g))
  const ranges: string[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j + 1 < sorted.length && ORDINE_SETTIMANA.indexOf(sorted[j + 1]) === ORDINE_SETTIMANA.indexOf(sorted[j]) + 1) j++
    const chunk = sorted.slice(i, j + 1)
    ranges.push(chunk.length === 1 ? GIORNI_LABEL[chunk[0]] : `${GIORNI_LABEL[chunk[0]]}–${GIORNI_LABEL[chunk[chunk.length - 1]]}`)
    i = j + 1
  }
  return ranges.join(', ')
}

function formatGiornaliera(esclusiEvento: number[], giorniChiusi: number[]): string {
  const tuttiEsclusi = [...new Set([...esclusiEvento, ...giorniChiusi])]
  const attivi = ORDINE_SETTIMANA.filter(d => !tuttiEsclusi.includes(d))
  if (attivi.length === 0) return ''
  if (attivi.length === 7) return 'Tutti i giorni'
  const firstIdx = ORDINE_SETTIMANA.indexOf(attivi[0])
  const lastIdx  = ORDINE_SETTIMANA.indexOf(attivi[attivi.length - 1])
  const inRange  = ORDINE_SETTIMANA.slice(firstIdx, lastIdx + 1)
  const esclusiInRange = inRange.filter(d => !attivi.includes(d))
  const rangeLabel = firstIdx === lastIdx ? GIORNI_LABEL[attivi[0]] : `${GIORNI_LABEL[attivi[0]]}–${GIORNI_LABEL[attivi[attivi.length - 1]]}`
  return esclusiInRange.length === 0 ? rangeLabel : `${rangeLabel} (escluso ${esclusiInRange.map(n => GIORNI_BREVI[n]).join(', ')})`
}

function formatLabelEvento(e: { data: string | null; ricorrente: boolean; ricorrenza: string; giornoSettimana: string; giorniEsclusione: string; dataFine: string | null }, giorniChiusi: number[] = []): string {
  if (e.data && !e.ricorrente) {
    const d = new Date(e.data + 'T00:00:00')
    return `${GIORNI_ESTESI[d.getDay()]} ${d.getDate()} ${MESI_FULL[d.getMonth()]}`
  }
  if (e.ricorrenza === 'giornaliera') {
    const esclusi = e.giorniEsclusione ? e.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n)) : []
    return formatGiornaliera(esclusi, giorniChiusi)
  }
  if (e.ricorrenza === 'settimanale' && e.giornoSettimana) {
    const nums = e.giornoSettimana.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
    const baseLabel = nums.length === 1 ? GIORNI_ESTESI[nums[0]] : (formatGiorniSettimana(e.giornoSettimana) || '')
    let label = baseLabel ? `ogni ${baseLabel}` : ''
    if (e.giorniEsclusione) {
      const esclusi = e.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n) && GIORNI_BREVI[n])
      if (esclusi.length > 0) label += ` (escluso ${esclusi.map(n => GIORNI_BREVI[n]).join(', ')})`
    }
    return label || 'Appuntamento fisso'
  }
  return 'Appuntamento fisso'
}

const HERO_FALLBACK = [
  { src: '/images/hero/1.webp', alt: 'Boogie Bistrot' },
  { src: '/images/hero/2.avif', alt: 'Il giardino del Boogie Bistrot' },
]

export default async function Home() {
  const [orari, chiusure, mediaHero, mediaLocation, mediaChiSiamoIntro, eventi, mediaCarta, mediaPizza, mediaBirra, mediaVino, mediaCocktail] = await Promise.all([
    fetchOrari(),
    fetchChiusure(),
    fetchMedia('hero'),
    fetchMedia('location'),
    fetchMedia('chi-siamo'),
    fetchEventi(),
    fetchMedia('carta'),
    fetchMedia('pizza'),
    fetchMedia('birra'),
    fetchMedia('vino'),
    fetchMedia('cocktail'),
  ])
  const orariDisplay = buildOrariLines(orari, chiusure)
  const giorniConOrari = new Set(orari.filter(o => o.attivo && o.giorno !== null).map(o => o.giorno as number))
  const chiusiOrdinari = [0,1,2,3,4,5,6].filter(d => !giorniConOrari.has(d))
  const chiusiSettimanali = chiusure
    .filter(c => c.tipo === 'Giorno della settimana' && c.tipoApertura === 'Chiusura' && c.giorno !== null)
    .map(c => c.giorno as number)
  const giorniChiusi = [...new Set([...chiusiOrdinari, ...chiusiSettimanali])]
  const heroImages = mediaHero.length > 0
    ? mediaHero.map(m => ({ src: m.url, alt: m.alt || m.nome }))
    : HERO_FALLBACK

  const oggi = new Date().toISOString().split('T')[0]
  const heroNews = eventi
    .filter(e => e.fotoHero && e.descrizioneBreve && (e.stato === 'attivo' || (e.stato === 'dormiente' && e.mostraInNews)))
    .sort((a, b) => {
      const aF = a.stato === 'attivo' && !a.ricorrente && a.data && a.data >= oggi
      const bF = b.stato === 'attivo' && !b.ricorrente && b.data && b.data >= oggi
      if (aF && !bF) return -1
      if (!aF && bF) return 1
      return 0
    })
    .slice(0, 5)
    .map(e => {
      const isDormiente = e.stato === 'dormiente'
      const giornoLabel = isDormiente ? 'Prossimamente' : formatLabelEvento(e, giorniChiusi)
      const oraLabel = !isDormiente && e.orario ? (e.orarioFine ? `${e.orario}–${e.orarioFine}` : e.orario) : ''
      const label = oraLabel ? `${giornoLabel}\n${oraLabel}` : giornoLabel
      return {
        label,
        titolo: e.titolo,
        descrizione: e.descrizioneBreve,
        href: e.slug ? `/eventi-speciali/${e.slug}` : '/eventi-speciali',
        ctaLabel: isDormiente ? 'Rimani aggiornato' : 'Scopri di più',
        image: e.fotoHero,
      }
    })

  const menuFallback = heroNews.length === 0 ? [
    { label: 'I nostri menù', titolo: 'Specialità alla Carta', descrizione: 'Cucina del territorio rivisitata con creatività e ingredienti freschi selezionati.', href: '/menu/specialita', ctaLabel: 'Scopri', image: mediaCarta[0]?.url ?? '/images/hero/1.webp' },
    { label: 'I nostri menù', titolo: 'La Pizza',              descrizione: 'Impasto a lunga lievitazione, cotto nel forno a legna.',                              href: '/menu/pizza',      ctaLabel: 'Scopri', image: mediaPizza[0]?.url  ?? '/images/hero/2.avif' },
    { label: 'I nostri menù', titolo: 'Le Birre',              descrizione: 'Birre selezionate dalla Lombardia e oltre.',                                          href: '/menu/birre',      ctaLabel: 'Scopri', image: mediaBirra[0]?.url  ?? '/images/hero/1.webp' },
    { label: 'I nostri menù', titolo: 'Carta dei Vini',        descrizione: 'Etichette italiane e locali selezionate con cura.',                                   href: '/menu/vini',       ctaLabel: 'Scopri', image: mediaVino[0]?.url   ?? '/images/hero/2.avif' },
    { label: 'I nostri menù', titolo: 'Cocktails',             descrizione: 'Aperitivi, long drink e signature cocktail preparati al momento.',                    href: '/menu/cocktails',  ctaLabel: 'Scopri', image: mediaCocktail[0]?.url ?? '/images/hero/1.webp' },
  ] : []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Boogie Bistrot',
    url: 'https://boogiebistrot.com',
    telephone: ['+390399260568', '+393465813309'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Via Europa, 2',
      addressLocality: 'Colle Brianza',
      addressRegion: 'LC',
      postalCode: '23886',
      addressCountry: 'IT',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 45.7593,
      longitude: 9.3620,
    },
    servesCuisine: ['Italiana', 'Brianzola', 'Pizza'],
    priceRange: '€€',
    hasMap: 'https://maps.google.com/?cid=6154073069839278986',
    sameAs: [
      'https://www.facebook.com/boogiebistrot',
      'https://www.instagram.com/boogiebistrot',
    ],
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero orariDisplay={orariDisplay} heroImages={heroImages} newsItems={heroNews.length > 0 ? heroNews : menuFallback} />
      <Calendario orari={orari} chiusure={chiusure} />
      <SezioneIntro
        fullWidth
        immagini={
          mediaChiSiamoIntro.length > 0
            ? mediaChiSiamoIntro.map(m => ({ src: m.url, alt: m.alt || m.nome }))
            : [
                { src: '/images/hero/1.webp', alt: 'Boogie Bistrot' },
                { src: '/images/hero/2.avif', alt: 'Il giardino' },
              ]
        }
        label="Chi siamo"
        titolo="L'essenza della cucina del territorio in una location storica con giardino"
        testo="<p>Dal 2019, nel cuore verde di <strong>Colle Brianza</strong>, il Boogie Bistrot è un punto di riferimento gastronomico che unisce tradizione del territorio e innovazione culinaria. La nostra cucina, reinterpretata con creatività e passione, trova la sua casa in una <strong>location storica immersa nel verde della provincia di Lecco</strong>, dove ogni piatto racconta una storia di territorio e autenticità.</p><br/><p>L'esperienza si compone di tante sfaccettature: dai piatti della <strong>cucina del territorio</strong> preparati con ingredienti freschi selezionati dai produttori locali, alle <strong>pizze a lunga lievitazione cotte nel forno a legna</strong>, fino alle <a href='/eventi-speciali'>serate ed eventi speciali</a> che animano il locale durante tutto l'anno.</p><br/><p>Nella bella stagione il <strong>giardino</strong> diventa un'oasi di tranquillità dove gustare pranzi e cene all'aperto, circondati dal panorama collinare della Brianza. In inverno, le sale interne accolgono gli ospiti in un'atmosfera calda e conviviale, ideale per cene romantiche o serate in compagnia.</p>"
      />
      <SezioneIntro
        fullWidth
        inverti
        immagini={
          mediaLocation.length > 0
            ? mediaLocation.map(m => ({ src: m.url, alt: m.alt || m.nome }))
            : [
                { src: '/images/hero/1.webp', alt: 'La location' },
                { src: '/images/hero/2.avif', alt: 'Il giardino' },
              ]
        }
        cta={{ label: 'Vai alla galleria fotografica', href: '/galleria' }}
        label="La location"
        titolo="Location storica con giardino a Colle Brianza | Un'oasi di freschezza"
        testo="<p>La magia del Boogie Bistrot si svela attraverso i suoi <strong>spazi unici</strong>: dalle sale interne dal design contemporaneo che valorizza gli elementi architettonici storici, al nostro fiore all'occhiello, l'<strong>ampio giardino immerso nel verde della Brianza lecchese</strong>. Ogni angolo racconta una storia, ogni dettaglio è stato pensato per rendere indimenticabile la tua esperienza.</p><br/><p>La <strong>posizione privilegiata a Colle Brianza</strong> garantisce un clima fresco anche durante i mesi estivi, trasformando il giardino nel luogo ideale per pranzi e cene all'aperto — una cornice naturale che attira ospiti da Lecco, Monza e Milano.</p><br/><p>Il <strong>perfetto equilibrio tra tradizione e atmosfera informale</strong> rende il Boogie ideale per ogni occasione: dalle cene con amici alle celebrazioni speciali, dai momenti più intimi alle serate in compagnia.</p>"
      />
      <SezioneMenu />
      <SezioneRecensioni />
      <SezioneFAQ />
      <SezioneBlog />
      <SezioneContatti />
      <Footer />
    </main>
  )
}
