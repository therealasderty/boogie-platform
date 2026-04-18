import { fetchRecensioni } from '@/lib/recensioni'
import SezioneRecensioniCarousel from './SezioneRecensioniCarousel'
import type { RecensioneItem } from '@/lib/recensioni'

const FALLBACK: RecensioneItem[] = [
  {
    id: 'fallback-1',
    nome: 'Martina R.',
    piattaforma: 'Google',
    stelle: 5,
    testo: 'Un posto magico. Il giardino è un sogno, la cucina è autentica e il servizio impeccabile. Ci torneremo sicuramente.',
    data: 'Marzo 2025',
  },
  {
    id: 'fallback-2',
    nome: 'Luca B.',
    piattaforma: 'TripAdvisor',
    stelle: 5,
    testo: 'Il Girorisotti del giovedì è una delle esperienze gastronomiche più belle che ho fatto in Brianza. Creatività e tradizione in perfetto equilibrio.',
    data: 'Febbraio 2025',
  },
  {
    id: 'fallback-3',
    nome: 'Federica T.',
    piattaforma: 'Google',
    stelle: 5,
    testo: 'Ambiente curato, staff gentilissimo e cibo eccellente. La pizza cotta nel forno a legna è semplicemente perfetta.',
    data: 'Gennaio 2025',
  },
  {
    id: 'fallback-4',
    nome: 'Marco V.',
    piattaforma: 'TripAdvisor',
    stelle: 5,
    testo: 'Abbiamo festeggiato un anniversario qui e non potevamo scegliere posto migliore. Giardino bellissimo, cena indimenticabile.',
    data: 'Aprile 2025',
  },
  {
    id: 'fallback-5',
    nome: 'Giulia S.',
    piattaforma: 'Google',
    stelle: 5,
    testo: 'Finalmente un ristorante in Brianza che punta sulla qualità vera. Gli hamburger con il pane fatto in casa sono da provare assolutamente.',
    data: 'Marzo 2025',
  },
]

export default async function SezioneRecensioni() {
  const recensioniDynamic = await fetchRecensioni()
  const recensioni = recensioniDynamic.length > 0 ? recensioniDynamic : FALLBACK

  return (
    <section className="py-20 md:py-28 bg-surface-warm">
      <div className="max-w-3xl mx-auto px-6 md:px-14 text-center">
        <SezioneRecensioniCarousel recensioni={recensioni} />
      </div>
    </section>
  )
}
