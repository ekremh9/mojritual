/**
 * Statične opcije koraka 3 Ritual Vodiča, po slugu cilja iz `goals` —
 * IZVORNO korištene direktno u korisničkom toku, sada zamijenjene bazom
 * (`guide_option_templates`, uređivo kroz `/admin/vodic`, vidi
 * `guide-data.ts#getGuideOptionsByGoal`).
 *
 * Ovaj fajl više ne učestvuje u korisničkom toku. Zadržan je kao
 * jednokratni seed izvor (`lib/db/seed-guide-options.ts`) i kao referenca
 * na originalne tekstove opcija.
 */

export type GuideDodatnoPitanje = {
  pitanje: string;
  opcije: readonly string[];
};

export const GUIDE_DODATNA_PITANJA: Record<string, GuideDodatnoPitanje> = {
  'vise-energije': {
    pitanje: 'Šta je glavni uzrok umora?',
    opcije: ['Loš san', 'Stres i posao', 'Neredovna ishrana', 'Kombinacija'],
  },
  'jaci-imunitet': {
    pitanje: 'Koliko često se razbolite?',
    opcije: [
      'Rijetko, želim prevenciju',
      'Često se prehlađujem',
      'Trenutno se osjećam "na pragu"',
    ],
  },
  'zdrava-kosa-koza-nokti': {
    pitanje: 'Šta vas najviše brine?',
    opcije: ['Opadanje kose', 'Problematična koža', 'Lomljivi nokti', 'Sve pomalo'],
  },
  'zglobovi-i-pokretljivost': {
    pitanje: 'Kakav je karakter tegoba?',
    opcije: ['Bol nakon aktivnosti', 'Jutarnja ukočenost', 'Hronične tegobe'],
  },
  'probava-i-metabolizam': {
    pitanje: 'Šta vas najviše muči?',
    opcije: ['Nadutost', 'Neredovna probava', 'Sporiji metabolizam'],
  },
  'bolji-san': {
    pitanje: 'Šta vam je veći problem?',
    opcije: ['Teško zaspim', 'Budim se tokom noći', 'Ne osjećam se odmorno'],
  },
  'podrska-kod-treninga': {
    pitanje: 'Šta vam je prioritet?',
    opcije: ['Energija prije treninga', 'Oporavak nakon', 'Izgradnja mišića'],
  },
};

/**
 * Redoslijed ciljeva u koraku 2 — `goals` tabela nema polje za sortiranje,
 * a redoslijed iz specifikacije je čitljiviji korisniku od abecednog.
 */
export const GUIDE_GOAL_SLUG_REDOSLIJED = [
  'vise-energije',
  'jaci-imunitet',
  'zdrava-kosa-koza-nokti',
  'zglobovi-i-pokretljivost',
  'probava-i-metabolizam',
  'bolji-san',
  'podrska-kod-treninga',
] as const;
