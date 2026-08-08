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
  korisnickiMeni: {
    otvoriMeni: 'Otvori korisnički meni',
    mojNalog: 'Moj nalog',
    mojeNarudzbe: 'Moje narudžbe',
    adminPanel: 'Admin panel',
    portalBrenda: 'Portal za brend',
    odjava: 'Odjava',
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
  prijava: {
    naslov: 'Prijava',
    podnaslov: 'Prijavite se da pratite svoje narudžbe i spremljene preporuke.',
    email: 'Email',
    emailPlaceholder: 'vas@email.com',
    lozinka: 'Lozinka',
    dugme: 'Prijavi se',
    dugmeUcitavanje: 'Prijavljivanje…',
    nematePitanje: 'Nemate nalog?',
    registrujteSe: 'Registrujte se',
    greskaKredencijali: 'Neispravan email ili lozinka.',
    greskaOpsta: 'Došlo je do greške. Pokušajte ponovo.',
  },
  registracija: {
    naslov: 'Registracija',
    podnaslov: 'Kreirajte nalog i sačuvajte svoje rezultate Ritual Vodiča.',
    ime: 'Ime i prezime',
    imePlaceholder: 'Vaše ime i prezime',
    email: 'Email',
    emailPlaceholder: 'vas@email.com',
    lozinka: 'Lozinka',
    lozinkaPomoc: 'Najmanje 8 karaktera.',
    potvrdaLozinke: 'Potvrdite lozinku',
    dugme: 'Kreiraj nalog',
    dugmeUcitavanje: 'Kreiranje naloga…',
    imatePitanje: 'Već imate nalog?',
    prijaviteSe: 'Prijavite se',
    validacija: {
      imeObavezno: 'Unesite ime i prezime.',
      emailObavezan: 'Unesite email adresu.',
      emailNeispravan: 'Unesite ispravnu email adresu.',
      lozinkaObavezna: 'Unesite lozinku.',
      lozinkaKratka: 'Lozinka mora imati najmanje 8 karaktera.',
      potvrdaObavezna: 'Potvrdite lozinku.',
      potvrdaNePoklapa: 'Lozinke se ne poklapaju.',
    },
    greskaEmailZauzet: 'Korisnik sa ovom email adresom već postoji.',
    greskaOpsta: 'Registracija nije uspjela. Pokušajte ponovo.',
    greskaAutomatskePrijave:
      'Nalog je kreiran, ali automatska prijava nije uspjela. Prijavite se ručno.',
  },
  brend: {
    metaNaslov: (naziv: string) => `Brend – ${naziv}`,
    verifikovan: 'Verifikovan brend',
    oBrendu: 'O brendu',
    certifikati: 'Certifikati',
    pogledajDokument: 'Pogledaj dokument',
    ponudaBrenda: 'Ponuda brenda',
    prazno: 'Ovaj brend trenutno nema dostupnih proizvoda.',
  },
} as const;
