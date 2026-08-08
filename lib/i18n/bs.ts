export const bs = {
  header: {
    logo: 'MojRitual',
    kategorije: 'Kategorije',
    ritualVodic: 'Ritual Vodič',
    blog: 'Blog',
    korpa: 'Korpa',
    prijava: 'Prijava',
    otvoriMeni: 'Otvori meni',
  },
  homepage: {
    hero: {
      naslov: 'Započnite svoj Ritual zdravijeg života.',
      podnaslov:
        'Ispunite kratki Ritual Vodič i otkrijte stručno odabrane preporuke za svoje zdravstvene ciljeve — ili jednostavno pretražite najveći izbor dodataka prehrani i kozmetičkih proizvoda na jednom mjestu.',
      cta: 'Pokreni Ritual Vodič',
      mikroOznake: ['Stručno kreirane preporuke', 'Provjereni proizvodi', 'Brza dostava'],
    },
    kategorije: {
      naslov: 'Kupujte po cilju',
    },
    istaknutiProizvodi: {
      naslov: 'Istaknuti proizvodi',
    },
  },
  proizvod: {
    dodajUKorpu: 'Dodaj u korpu',
    prodaje: 'Prodaje',
    opis: 'Opis proizvoda',
    sastojciIDoziranje: 'Sastojci i doziranje',
    upozorenja: 'Upozorenja',
    kategorije: 'Kategorije',
  },
  kategorija: {
    brojProizvoda: (broj: number) => {
      const zadnjaCifra = broj % 10;
      const zadnjeDvijeCifre = broj % 100;
      const jednina = zadnjaCifra === 1 && zadnjeDvijeCifre !== 11;
      return `${broj} ${jednina ? 'proizvod' : 'proizvoda'}`;
    },
    prazno: 'Trenutno nema proizvoda u ovoj kategoriji',
    nazadNaPocetnu: 'Nazad na početnu',
    opisGenericki: 'Pregledajte proizvode u ovoj kategoriji na MojRitualu.',
  },
} as const;
