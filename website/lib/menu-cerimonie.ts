export type PortataCerimonia = {
  tipo: string
  piatti: string[]
}

export type MenuCerimonia = {
  nome: string
  prezzo: number
  portate: PortataCerimonia[]
}

export type AlternativeCerimonie = {
  primiTerra: string[]
  primiMare: string[]
  secondiTerra: string[]
  secondiMare: string[]
}

export const MENU_CERIMONIE: MenuCerimonia[] = [
  {
    nome: 'Menu Carne',
    prezzo: 45,
    portate: [
      {
        tipo: 'Tris di antipasti impiattati',
        piatti: [
          'Sformatino di zucchine con fonduta al parmigiano',
          'Torretta di parmigiana di melanzane',
          'Cestino di piadina con ricotta, cipolla caramellata e speck croccante',
        ],
      },
      {
        tipo: 'Centro tavola (uno a scelta)',
        piatti: [
          'Affettati del territorio con gnocco fritto o focacce',
          'Sciatt',
          'Sarde fritte con maionese al lime',
        ],
      },
      {
        tipo: 'Primo o bis di primi',
        piatti: [
          'Risotto con crema di asparagi e le sue punte, ciuffi di caprino e crumble di crudo',
          'Pappardelle al ragù bianco',
        ],
      },
      { tipo: 'Dolce', piatti: ['Torta cerimonia'] },
    ],
  },
  {
    nome: 'Menu Pesce',
    prezzo: 50,
    portate: [
      {
        tipo: 'Tris di antipasti impiattati',
        piatti: [
          'Sformatino di zucchine con fonduta al parmigiano',
          'Torretta di parmigiana di melanzane',
          'Polpo scottato su crema di cavolo nero',
        ],
      },
      {
        tipo: 'Centro tavola (uno a scelta)',
        piatti: [
          'Affettati del territorio con gnocco fritto o focacce',
          'Sciatt',
          'Sarde fritte con maionese al lime',
        ],
      },
      {
        tipo: 'Primo o bis di primi',
        piatti: [
          'Risotto con cavolo viola e tartare di tonno',
          'Trofie con pomodorini gialli, ricciola e bottarga',
        ],
      },
      { tipo: 'Dolce', piatti: ['Torta cerimonia'] },
    ],
  },
]

export const ALTERNATIVE_CERIMONIE: AlternativeCerimonie = {
  primiTerra: [
    'Risotto barbabietola e salsa al taleggio',
    'Risotto crema di asparagi, ciuffi di caprino e crumble di crudo',
    'Risotto carciofi, raspadura di Parmigiano e carciofi fritti',
    'Fusilli alla nerano',
    'Pappardelle al ragù bianco',
  ],
  primiMare: [
    'Risotto crema di spinaci e tartare di gamberi',
    'Risotto cavolo viola e tartare di tonno',
    'Risotto alla parmigiana con filetti di pesce persico',
    'Scialatiello allo scoglio con salicornia',
    'Trofie con pomodorini gialli, ricciola e bottarga',
  ],
  secondiTerra: [
    'Punta di vitello e la sua salsa con scarola ripassata',
    'Filetto di maialino e patate al forno',
  ],
  secondiMare: [
    'Filetti di branzino gratinato e sformatino di asparagi',
    'Cubotti di salmone, salsa allo zafferano e crumble di pistacchi',
  ],
}
