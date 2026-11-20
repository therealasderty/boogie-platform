export type PortataMenu = {
  tipo: string
  piatti: string[]
}

export type MenuNatale = {
  nome: string
  prezzo: number
  bevande?: string
  portate: PortataMenu[]
}

export const MENU_NATALE: MenuNatale[] = [
  {
    nome: 'Menu 1',
    prezzo: 45,
    portate: [
      { tipo: 'Antipasto', piatti: ['Affettato misto del territorio con gnocco fritto e verdurine croccanti'] },
      { tipo: 'Primo', piatti: ['Risotto alla zucca, zola e amaretti'] },
      { tipo: 'Secondo', piatti: ['Punta di vitello e patate al forno'] },
      { tipo: 'Dolce', piatti: ['Tiramisù di panettone'] },
    ],
  },
  {
    nome: 'Menu 2',
    prezzo: 50,
    portate: [
      { tipo: 'Antipasti', piatti: ['Sfoglia con tuorlo fondente, crema al Parmigiano e bacon croccante', 'Parmigiana di melanzane'] },
      { tipo: 'Primo', piatti: ['Tagliolini al ragù di cervo'] },
      { tipo: 'Secondo', piatti: ['Filetto di maialino con la sua salsa e patate al forno'] },
      { tipo: 'Dolce', piatti: ['Tortino di pere e amaretti con crema allo zabaione'] },
    ],
  },
  {
    nome: 'Menu 3',
    prezzo: 55,
    portate: [
      { tipo: 'Antipasti', piatti: ['Cestino di pasta fillo con pere, taleggio e speck croccante', 'Affettato del territorio con Casera e gnocco fritto'] },
      { tipo: 'Bis di primi', piatti: ['Risotto ai porcini', 'Fagottino ripieno di radicchio, taleggio e crumble di noci'] },
      { tipo: 'Secondo', piatti: ['Brasato con polenta'] },
      { tipo: 'Dolce', piatti: ['Tortino di cioccolato dal cuore caldo con gelato al fior di latte'] },
    ],
  },
  {
    nome: 'Menu Pesce',
    prezzo: 60,
    bevande: 'acqua e caffè inclusi',
    portate: [
      { tipo: 'Bis di Antipasti', piatti: ['Cestino di pasta fillo con burrata, tartare di salmone alla teriaki, maionese all\'avocado', 'Flan di broccoli e gamberi su insalatina di seppie e mousse di caprino'] },
      { tipo: 'Centro Tavola', piatti: ['Sarde fritte e maionese al lime'] },
      { tipo: 'Primo', piatti: ['Risotto cavolo viola e tartare di tonno'] },
      { tipo: 'Secondo', piatti: ['Polpo arrostito su vellutata di patate e zafferano e polvere di olive taggiasche'] },
      { tipo: 'Dolce', piatti: ['Tiramisù di panettone'] },
    ],
  },
]
