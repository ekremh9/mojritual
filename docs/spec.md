# SPECIFIKACIJA — Ritual (marketplace suplemenata)

> Domena: **mojritual.ba** · Verzija 2.0 · 6. avgust 2026.
> Model podataka: `docs/schema.md` · Pravila za razvoj: `CLAUDE.md`

## 0. Brend: Ritual

**Ime:** Ritual (domena: mojritual.ba)

Naziv platforme je **Ritual**. Nazivi funkcionalnosti zadržavaju
postojeću terminologiju iz prototipa: **Ritual Vodič**, **Ritual Blog**.

**Pozicioniranje:** Ritual je najveća ponuda suplemenata na jednom mjestu —
sve što ti treba, pretraživo po nazivu, sastojku ili cilju, uz Ritual Vodič
koji za par klikova pretvara nepregledne police u jasan, lični prijedlog.
Jedna platforma, hiljade rješenja, jedan ritual koji ti odgovara.

**Slogan:** *"Započnite svoj Ritual zdravijeg života."*

**Ton komunikacije:** direktan, stručan, bez pretjerivanja. Konkretno o
koristima — širok asortiman, brza personalizacija, provjereni proizvodi,
jednostavna kupovina — bez fraza koje zvuče izmišljeno ili "coach" stilski
naglašene.

**Vizuelni identitet:**
- Svijetla, čista pozadina, zemljana/topla paleta boja (vidi tabelu ispod),
  fotografije proizvoda na neutralnoj pozadini
- Jedan naglašeniji font za naslove (topliji, editorijalni dojam), čist
  sans-serif za tijelo teksta
- AI vodič naziva se **"Ritual Vodič"** — treba djelovati kao praktičan
  alat koji brzo daje prijedlog, a ne kao chatbot

**Slogan:** *"Započnite svoj Ritual zdravijeg života."*

**Homepage hero (finalni copy):**
> **Naslov:** "Započnite svoj Ritual zdravijeg života."
>
> **Podnaslov:** "Ispunite kratki Ritual Vodič i otkrijte stručno odabrane
> preporuke za svoje zdravstvene ciljeve — ili jednostavno pretražite
> najveći izbor dodataka prehrani i kozmetičkih proizvoda na jednom mjestu."
>
> **CTA dugme:** "Pokreni Ritual Vodič"
>
> **Mikro-oznake ispod CTA:** ✓ Stručno kreirane preporuke · ✓ Provjereni
> proizvodi · ✓ Brza dostava

**Napomena uz copy:** tvrdnje „stručno odabrane" i „stručno kreirane
preporuke" moraju imati pokriće — medicinski recenzent koji stoji iza
logike Vodiča (`medical_reviewers`). Dok recenzent nije potvrđen,
koristiti neutralniju formulaciju. Vidi 17.2.

**Sekcija za buduću marketplace fazu** (prikazuje se kao najava, bez
funkcije u MVP-u):
> "Postanite dio Ritual ponude. Predstavite svoj brend korisnicima
> koji već kupuju na Ritualu."

**Paleta i tipografija (na osnovu poslanog screenshota — hex vrijednosti su
procjena iz slike, provjeriti/fino podesiti kad se otvori dizajn u alatu s
color pickerom):**

| Element | Boja | Približan hex |
|---|---|---|
| Pozadina (glavna) | Vrlo blaga krem/mint bijela | `#F2F5ED` |
| Banner / tamni blok (npr. Ritual Vodič sekcija) | Tamna šumsko-zelena | `#16332A` |
| Kartica kategorije (npr. "Hormone Balance" stil) | Prigušena salvija zelena | `#C7D6BA` |
| Tekst na svijetloj pozadini | Tamna maslinasto-crna | `#1C2B22` |
| Tekst/dugme na tamnoj pozadini | Krem/off-white | `#F2F5ED` |
| Sitni natpisi/labele (npr. "PHARMACIST REVIEWED") | Prigušena siva | `#8A9086` |

**Tipografija:**
- **Naslovi:** elegantan serif s italic akcentom za istaknute riječi (kao na
  screenshotu — "*every*" u kurzivu) — preporuka: **Fraunces** ili
  **Newsreader** (obje besplatne, Google Fonts, podržavaju italic rez)
- **Tijelo teksta / UI elementi (dugmad, labele, navigacija):** čist,
  geometrijski sans-serif — preporuka: **Inter** ili **Manrope**

Stil dugmadi: pill-oblik (potpuno zaobljeni rubovi), kontrastna boja u
odnosu na pozadinu bloka (npr. krem dugme na tamnozelenoj pozadini banera).

---

## 1. Opći koncept

Web aplikacija (kasnije i mobilna, iOS/Android) za prodaju dodataka prehrani i
proizvoda koji ne zahtijevaju medicinski recept, po uzoru na iHerb / DM.
Faza 1: web shop s vlastitom/hybrid nabavkom (dropshipping + eventualno
vlastito skladište). Faza 2: proširenje u marketplace gdje farmaceutske
kompanije i brendovi samostalno objavljuju svoje proizvode.

Tržište: Bosna i Hercegovina (start), jezik aplikacije: bosanski.

Ključna diferencijacija: **AI Wellness vodič** — kratka procjena (25–30 sekundi)
koja korisniku predlaže grupe proizvoda na osnovu cilja/problema, bez potrebe
za prijavom.

**Obavezan disclaimer** (mora biti vidljiv na homepage, na svakoj kategoriji,
u AI vodiču i pri checkout-u):

> Suplementi služe kao podrška općem zdravlju i ne mogu biti zamjena za
> dijagnozu niti propisanu terapiju. Kod ozbiljnih ili dugotrajnih simptoma
> obratite se zdravstvenom stručnjaku.

---

## 2. Homepage — struktura

Tri jednako istaknute opcije za pronalazak proizvoda, vidljive "above the fold":

1. **Tražilica** — pretraga po nazivu, sastojku ili brendu (npr. "vitamin C",
   "magnezij glicinat", "OsteoCare").
2. **Ritual Vodič** (AI wellness vodič, CTA dugme, istaknuto, naslovljeno
   npr. "Pronađi svoj ritual") — vodi na kratki upitnik.
3. **Kategorije** ("Kupujte po cilju") — 5 glavnih kategorija kao kartice s
   fotografijom/ikonom:
   - Imunitet i Energija
   - Kosa, Koža i Nokti
   - Kosti, Zglobovi, Mišići
   - Probava i Metabolizam
   - San i Opuštanje

Dodatno na headeru/homepage:
- Ikona korpe (broj artikala, vidljivo bez prijave)
- Opcije za nalog: "Prijavi se" / "Kreiraj nalog" s isticanjem pogodnosti
  (spremljeni rezultat Ritual Vodiča, historija narudžbi, personalizirane
  preporuke — vidi sekciju 5 za detalje i buduće pogodnosti)
- Kratka istaknuta linija disclaimera ili info-ikona uz nju

Ispod fold-a: preporučeni/bestseller proizvodi, eventualno sekcija "Novo",
i banner koji objašnjava kako radi AI Wellness vodič (edukativno, gradi
povjerenje pošto nema recepta/ljekara u procesu).

---

## 2a. Odjeljak za zdravstvene i promotivne članke ("Ritual Blog")

Zaseban odjeljak na sajtu (link u glavnom meniju, npr. "Blog" ili "Savjeti"),
sa člancima, video sadržajem i promotivnim tekstovima o zdravlju i važnosti
personaliziranog pristupa suplementaciji. Svrha: edukacija, izgradnja
povjerenja, SEO, i priprema korisnika prije nego dođe do AI Wellness vodiča
ili kupovine.

**Struktura odjeljka:**
- Lista članaka s naslovnom slikom, kratkim uvodom (2-3 rečenice), kategorijom
  članka (npr. Imunitet, San, Ishrana, Novosti)
- Filter/tabovi: Članci, Video sadržaj, Novosti o proizvodima
- Svaki članak ima disclaimer na dnu (isti kao standardni zdravstveni
  disclaimer), i CTA ka relevantnoj kategoriji proizvoda ili Ritual Vodiču

**Status:** prva 2 članka za lansiranje su razrađena u punom obliku (uvod,
razrada, CTA, disclaimer) — vidi zaseban dokument `ritual-blog-clanci.md`.
Drugi članak (o imunitetu) uključuje i scenario za kratki video (60–90s) koji
prati tekst.

**Primjer 1 — edukativni članak:**

> **Naslov:** Zašto "jedan suplement za sve" ne postoji
>
> Svako tijelo ima drugačije potrebe — zavisno od godina, načina života,
> ishrane i trenutnog stanja organizma. Ono što pomaže kolegi s posla ne mora
> značiti isto za vas. Zato pristup "uzmi ono što svi uzimaju" često ne daje
> očekivane rezultate.
>
> Personalizirani pristup počinje jednostavnim pitanjima: Koliko spavate?
> Da li imate energije tokom dana? Kako izgleda vaša ishrana? Na osnovu
> odgovora moguće je suziti izbor na par grupa proizvoda koje zaista
> odgovaraju vašem cilju, umjesto nasumičnog biranja s police.
>
> Ritual Vodič postoji upravo zbog toga — kratak upitnik koji u manje od
> minute predlaže smjer, a vi odlučujete šta dalje.
>
> *Suplementi služe kao podrška općem zdravlju i ne mogu biti zamjena za
> dijagnozu niti propisanu terapiju. Kod ozbiljnih ili dugotrajnih simptoma
> obratite se zdravstvenom stručnjaku.*

**Primjer 2 — sezonski/promotivni članak:**

> **Naslov:** Jesen i zima: na šta obratiti pažnju kod imuniteta
>
> Padom temperature i kraćim danima, tijelo se drugačije nosi s virusima i
> umorom. Uobičajene navike koje pomažu uključuju dovoljno sna, redovnu
> ishranu bogatu voćem i povrćem, i po potrebi dodatnu podršku kroz vitamin
> C, vitamin D3 ili cink — sastojke koji se najčešće spominju u kontekstu
> imuniteta tokom hladnijih mjeseci.
>
> Prije nego što nasumično kombinujete više proizvoda, provjerite koji
> sastojci vam zaista trebaju — Ritual Vodič može predložiti 3 do 5 grupa
> proizvoda prilagođenih vašem trenutnom stanju i cilju.
>
> *Suplementi služe kao podrška općem zdravlju i ne mogu biti zamjena za
> dijagnozu niti propisanu terapiju. Kod ozbiljnih ili dugotrajnih simptoma
> obratite se zdravstvenom stručnjaku.*

**Za kasnije faze:**
- Video sadržaj (kratki klipovi, npr. "kako čitati deklaraciju suplementa")
- Gostujući tekstovi od farmaceuta/nutricionista (gradi kredibilitet)
- Povezivanje članaka s konkretnim proizvodima/kategorijama (in-content
  linkovi ka shopu)

---

## 3. Kategorizacija proizvoda

| Kategorija | Primjeri grupa proizvoda |
|---|---|
| Imunitet i Energija | vitamin C, vitamin D3, cink, beta-glukan, propolis, med s dodacima |
| Kosa, Koža i Nokti | kolagen, biotin, cink, vitamin C, omega-3 |
| Kosti, Zglobovi, Mišići | kalcij, vitamin D3, vitamin K2, magnezij, OsteoCare-tip kompleksi, kolagen tip II, glukozamin, hondroitin |
| Probava i Metabolizam | probiotici, prebiotici, digestivni enzimi, biljne tinkture za probavu, čajevi za probavu, psilijum, simetikon (nadutost) |
| San i Opuštanje | magnezij glicinat, melatonin, ashwagandha, L-teanin, valerijana, matičnjak, pasiflora |

Ovo su konačnih 5 kategorija za lansiranje.

Svaka kategorija treba:
- Kratak uvodni tekst (šta pokriva, disclaimer)
- **Primarni filter:** cilj/problem, aktivni sastojak, brend, cijena, ocjena,
  dostupnost (odmah dostupno / na upit)
- **Sekundarni filter:** oblik proizvoda (kapsule, prah, tečnost, žvake,
  krema/gel gdje je primjenjivo) — koristan za suženje rezultata, ali ne
  primarni način pretrage jer korisnici prije svega traže po cilju/sastojku
- Sortiranje: popularnost, cijena, ocjena, novo

**Bundle ponude (grupe proizvoda):**
- Dobavljač/brend može ponuditi bundle — više svojih proizvoda spojenih u
  jednu ponudu (npr. "Kompletna podrška za san: magnezij glicinat + melatonin
  + L-teanin"), s posebnom cijenom u odnosu na kupovinu proizvoda pojedinačno
- Bundle se prikazuje kao zasebna kartica u kategoriji i/ili kao prijedlog
  unutar rezultata Ritual Vodiča, uz jasan popis šta sadrži i uštedu u odnosu
  na pojedinačnu cijenu

**Labele proizvoda:**
- **"Preporučeno"** — ističe proizvod/bundle koji tim odabere kao najbolji
  izbor za datu kategoriju ili cilj
- Dodatne labele po potrebi (npr. "Premium", "Najprodavanije", "Novo",
  "Ograničena zaliha") — vidljive na kartici proizvoda, koriste se
  selektivno da ne izgube značaj

---

## 4. Ritual Vodič (AI Wellness vodič) — tok

**Cilj:** brza personalizacija bez naloga, max 25–30 sekundi.

**Korak 1 — Osnovni podaci** (opciono, ne blokirajuće):
- Spol (M/Ž/preskoči)
- Starosna grupa (raspon, ne tačna godina): <18*, 18–30, 31–45, 46–60, 60+
  (*ako se selektuje <18, jasno navesti da je kupovinu i konzumaciju
  proizvoda potrebno obaviti uz prisustvo/odobrenje roditelja ili staratelja,
  te da se prije upotrebe obavezno konsultuje pedijatar. Preporuke za ovu
  grupu treba dodatno suziti i formulisati opreznije nego za odrasle.)

**Korak 2 — Cilj/problem** (multiple choice, ikone, brzo klikanje):
- Želim više energije / manje umora
- Jača imunost
- Zdravlja koža, kosa, nokti
- Zglobovi i mišići (bol, pokretljivost)
- Probavne tegobe (nadutost, neredovna probava)
- Bolji san / opuštanje

**Korak 3 — 1-2 dodatna pitanja ovisno o odabranom cilju**
(npr. za "san": "Da li vam je problem uspavljivanje ili prekinut san?")

**Rezultat:**
- Prikaz 3–5 preporučenih grupa proizvoda (ne dijagnoza, nego "za vaš cilj
  obično se koriste...")
- Svaka preporuka: kratko objašnjenje zašto, link na proizvode iz te grupe
- Gdje postoji odgovarajući bundle (vidi sekciju 3), prikazati ga uz
  pojedinačne proizvode, jasno označen labelom (npr. "Preporučeno" ili
  "Bundle")
- Disclaimer ponovljen ispod rezultata, jasno i vidljivo
- Poziv na akciju: "Dodaj u korpu" po grupi/proizvodu + "Kreiraj nalog da
  sačuvaš ovaj rezultat" (nije obavezno)

Bez naloga korisnik i dalje može odraditi kompletan tok i kupiti — nalog je
samo dodatna pogodnost (spremljeni rezultat, historija, buduće pogodnosti).

**Praćenje rezultata — faza 1:** bez anonimnog praćenja/kolačića za Ritual
Vodič u prvoj fazi. Rezultat se čuva samo u okviru trenutne sesije (da bi
korisnik mogao vidjeti i naručiti predložene proizvode), i ne povezuje se s
identitetom niti se koristi za remarketing dok se korisnik izričito ne
prijavi/registruje. Ovo pojednostavljuje pitanja privatnosti za MVP; opcija
agregatnog/anonimnog praćenja radi poboljšanja preporuka može se razmotriti
u kasnijoj fazi, uz jasnu politiku privatnosti i opt-out.

---

## 5. Nalog i prijava

- **Guest checkout je podrazumijevani i potpuno funkcionalan put.**
- Nalog nije obavezan ni za jedan korak, uključujući AI vodič i kupovinu.
- Poticaji za kreiranje naloga u MVP-u (bez novčanog popusta):
  - Spremanje rezultata Ritual Vodiča
  - Historija narudžbi i lakše ponavljanje kupovine
  - Personalizirane preporuke vremenom, na osnovu prošlih rezultata Ritual
    Vodiča i kupovina
- Prijava putem email/telefon + lozinka, opciono social login (kasnije).

**Buduća faza — praćenje zdravlja i pogodnosti za prijavljene korisnike**
(nije dio MVP-a, dodaje se nakon lansiranja):
- Praćenje zdravstvenih navika u aplikaciji: streak (npr. koliko dana
  zaredom korisnik unosi da je uzeo suplement), dnevne aktivnosti, mogućnost
  dijeljenja postignuća
- Dodatna personalizacija preporuka na osnovu praćenja i ponovljenih Ritual
  Vodič procjena
- Posebne pogodnosti za prijavljene korisnike kod nas i u odabranim
  partnerskim prodavnicama (fizičkim ili online) — cilj je da članstvo
  donosi opipljivu vrijednost, ne samo popust, i da bude jasan razlog za
  pridruživanje
- Ovaj dio treba razraditi zasebno (koje partnerske mreže, kakav format
  pogodnosti, tehnička integracija)

---

## 6. Proces narudžbe (checkout)

**Model:** hybrid — dropshipping/konsignacija za većinu asortimana, moguće
vlastito skladište za brzo pokretne artikle kasnije.

**Plaćanje:** pouzećem (plaćanje pri dostavi) kao primarna opcija za BiH tržište.
- Ostaviti prostor u arhitekturi za kasnije dodavanje kartičnog plaćanja i
  online plaćanja (za marketplace fazu, gdje će različiti prodavci možda
  tražiti različite metode).

**Tok checkout-a (guest, bez naloga):**
1. Korpa — pregled artikala, količine, ukupna cijena + dostava
2. Podaci za dostavu: ime, telefon, adresa, grad, napomena za dostavljača
3. Odabir metode plaćanja (pouzećem, default)
4. Pregled i potvrda narudžbe
5. Potvrda narudžbe (email/SMS ako je dat kontakt), broj narudžbe za praćenje

**Za buduću marketplace fazu:**
- Korpa treba moći grupisati stavke po prodavcu (ako iz više izvora), sa
  jasnom naznakom "Prodaje: [Kompanija X]"
- Svaki prodavac može imati svoj status dostave/rok isporuke
- Provizija/naplata prodavcima — odvojen dio specifikacije za kasnije

---

## 8. Admin Dashboard

Interni panel za tebe (i buduće članove tima) za upravljanje platformom.
Nije vidljiv korisnicima, odvojen login/pristup.

**Upravljanje ponudom:**
- Dodavanje, izmjena i uklanjanje proizvoda (naziv, opis, cijena, kategorija,
  slike, dostupnost, labele poput "Preporučeno"/"Premium"/"Novo")
- Kreiranje i uređivanje bundle ponuda (odabir proizvoda koji ulaze u bundle,
  cijena bundle-a, period trajanja ponude)
- Upravljanje kategorijama i filterima (dodavanje novih sastojaka/ciljeva
  kako se asortiman širi)
- Upravljanje Ritual Blog sadržajem (objava, izmjena, arhiviranje članaka)

**Praćenje i izvještavanje (reporting) — potvrđen obim za MVP:**
- Za lansiranje je dovoljan **osnovni pregled** narudžbi i statistike (bez
  naprednog analitičkog sloja u prvoj fazi):
- Pregled narudžbi (status, vrijednost, metoda plaćanja, dostava)
- Statistika korištenja Ritual Vodiča: koliko puta je pokrenut, koji su
  najčešći odabrani ciljevi, koji proizvodi/bundle-i se najčešće dodaju u
  korpu nakon rezultata
- Pregled najprodavanijih proizvoda i kategorija, po periodu (dan/sedmica/
  mjesec)
- Osnovni pregled ponašanja korisnika na platformi (koje kategorije/članke
  najviše posjećuju) — u skladu s politikom privatnosti, agregatno, ne na
  nivou pojedinačnog identiteta osim ako je korisnik prijavljen i pristao na
  praćenje
- Napredniji analitički sloj (kohorte, predviđanja, segmentacija) ostaje za
  kasniju fazu, nakon što se vidi stvarni obim podataka

**Stranica-pokazni za buduće dobavljače/brendove ("Postanite dio Ritual
ponude"):**
- Iako samostalna prijava i objava proizvoda od strane dobavljača **nije
  dio MVP funkcionalnosti**, MVP treba sadržavati javnu informativnu
  stranicu koja najavljuje i predstavlja tu buduću mogućnost — koristi se
  za rano prikupljanje interesa (lead generation) prije nego što se
  marketplace faza tehnički razvije
- Sadržaj stranice:
  - Kratak pitch: zašto se pridružiti Ritualu (dostupna baza kupaca, Ritual
    Vodič kao kanal preporuke, jednostavan proces objave proizvoda kad
    funkcija bude spremna)
  - Ilustracija/mockup kako će izgledati "Prodaje: [Vaš brend]" oznaka na
    kartici proizvoda (vidi sekciju 6)
  - Kratak formular za izražavanje interesa: naziv kompanije, kontakt
    osoba, email, telefon, kategorija proizvoda — šalje se timu na
    obradu (ručno kontaktiranje u ovoj fazi, bez automatskog onboardinga)
  - CTA: "Prijavite interes" (ne "Registrujte se" — jer funkcija još nije
    aktivna)
- Ova stranica se vodi/prati kroz admin dashboard: lista prijavljenih
  interesenata, status kontakta (novo / kontaktirano / u pregovorima)

**Korisnička podrška:**
- Sva pitanja korisnika (kontakt forma na sajtu, ili direktni upit) usmjeravaju
  se na email **pomoc@mojritual.ba**
- U MVP-u dovoljno je da kontakt forma šalje email na ovu adresu; napredniji
  ticketing sistem (npr. status upita, historija komunikacije) može doći u
  kasnijoj fazi

---


---

## 10. Marketplace — portal za brend

Brend upravlja svojim prisustvom sam. Sve što unese ide **na odobrenje
admina** prije nego postane javno vidljivo.

### 10.1 Registracija i pristup

1. Brend se prijavljuje kroz formu „Postanite dio Ritual ponude"
2. Admin pregleda i kreira nalog, ili odbija
3. Brend dobija pristup na `/brend`

Nema samostalne registracije bez pregleda. Odgovaramo za sadržaj koji
stoji na platformi.

### 10.2 Šta brend može

| Sekcija | Sadržaj |
|---|---|
| **Profil brenda** | Naziv, kratki opis, priča, logo, naslovna slika, kontakt, web |
| **Certifikati** | Naziv, opis, dokument — prikazuju se na storefrontu |
| **Proizvodi** | Unos, izmjena, slike, sastojci, doziranje, upozorenja, cijena |
| **Veleprodajne cijene** | Količinski pragovi po proizvodu |
| **Paketi** | Sastavljanje paketa i cijena |
| **Dostava** | Vlastiti prag besplatne dostave i cijena dostave (cijena dostave je **obavezno polje** — vidi 10.5) |
| **Narudžbe** | Samo vlastite pošiljke — status, broj pošiljke, kurir |
| **Statistika** | Pregledi, prodaja, pozicija u kategorijama |

### 10.3 Šta brend ne može

- Vidjeti narudžbe ili podatke drugih brendova
- Mijenjati svoju proviziju ili naknadu za prisustvo
- Uticati na redoslijed u Ritual Vodiču
- Objaviti proizvod bez odobrenja admina
- Vidjeti pune podatke kupca izvan vlastite pošiljke

### 10.5 Obavezna polja prije prve objave

Brend ne može poslati proizvod na odobrenje dok profil nije kompletan:

- Naziv, kratki opis, logo
- **Cijena dostave** — mora biti eksplicitno unesena, i kad je 0
- Prag besplatne dostave — ili iznos, ili izričito „nema besplatne dostave"
- Kontakt email i telefon
- JIB (brend izdaje račun kupcu, vidi 16.1)

U bazi `cijena_dostave` ima default 0 da checkout nikad ne pukne. Ali
default nije isto što i odluka brenda — nula unesena greškom znači da
kupac vidi besplatnu dostavu, a brend očekuje naplatu. Zato forma traži
eksplicitan unos.

### 10.4 Tok odobrenja

```
nacrt → na_cekanju → odobren      (javno vidljivo)
                   → odbijen      (uz razlog, brend ispravlja i šalje ponovo)
```

Izmjena odobrenog proizvoda vraća ga u `na_cekanju`. Do novog odobrenja
javno ostaje **prethodna odobrena verzija**.

---

## 11. Veleprodaja

### 11.1 Nalog za firmu

Poseban tip naloga, **obavezno odobrenje admina**. Tipovi:
- `farmaceutska_kuca` — aktivno od početka
- `medicinska_ustanova` — rezervisano, vidi 13.2
- `ostalo`

Firma unosi naziv, JIB, PDV broj, adresu i kontakt osobu. Do odobrenja
vidi samo maloprodajne cijene.

### 11.2 Cjenovni pragovi (Tok A)

Brend za svaki proizvod definiše stepenice, npr.:

| Količina | Cijena po komadu |
|---|---|
| 1+ | 24,90 KM (maloprodaja) |
| 50+ | 19,90 KM |
| 200+ | 17,50 KM |
| 1000+ | 14,90 KM |

Odobrena firma vidi cijene odmah i naručuje sama, bez pregovora.
Primjenjuje se najviši prag koji količina zadovoljava.

### 11.3 Plaćanje

**Pouzeće, kao i maloprodaja.** Faktura, virman i rok plaćanja dolaze
zajedno s online plaćanjem u sljedećoj fazi.

Provizija platforme na veleprodaju: **20% (default), admin konfiguriše
po brendu.**

---

## 12. Dostava i lomljenje narudžbe

**Svaki brend definiše svoj prag besplatne dostave i cijenu dostave.**

Posljedica: korpa s proizvodima od tri brenda = tri isporuke i tri
troška dostave. To mora biti vidljivo kupcu **prije** checkouta.

### 12.1 Prikaz korpe

Korpa se dijeli u vizuelne grupe po brendu:

```
┌─ Nordic Labs ──────────────────────────────┐
│  Magnezij Bisglicinat    ×2        69,80 KM │
│  B Kompleks Forte        ×1        26,90 KM │
│  ──────────────────────────────────────────│
│  Dostava                            6,00 KM │
│  ⓘ Još 23,30 KM do besplatne dostave       │
└────────────────────────────────────────────┘

┌─ SemiChem ─────────────────────────────────┐
│  Vitamin D3 2000       ×1          21,50 KM │
│  ──────────────────────────────────────────│
│  Dostava                   BESPLATNO ✓      │
└────────────────────────────────────────────┘

UKUPNO                               124,20 KM
```

Poruka „još X KM do besplatne dostave" je i korisna i prodajno korisna —
podiže vrijednost korpe po brendu.

### 12.2 Nakon narudžbe

- Narudžba se u bazi lomi na **pošiljke po brendu**
- Svaki brend vidi samo svoju pošiljku
- Brend pakuje i šalje sam, unosi broj pošiljke i kurira
- Kupac prati status po pošiljkama, jasno označeno koji brend šalje šta

---

## 13. Komercijalni model

### 13.1 Provizija

- **Default 20%** na maloprodaju i veleprodaju
- Admin je konfiguriše **po brendu** (ugovorom)
- Zamrzava se u trenutku narudžbe — kasnija promjena ne dira stare narudžbe
- Obračun ulazi **samo za isporučene pošiljke**

Novac ide **brendu** (kupac plaća kuriru brenda). Ritual naknadno
fakturiše proviziju po obračunskom periodu.

### 13.2 Naknada za prisustvo — kasnija faza

Polje postoji u admin panelu od početka, **default 0**. Model: stepenasto
po broju aktivnih proizvoda, naplata mjesečno, iznos po ugovoru.

**Ne naplaćuje se prvim partnerima.** Uvodi se kad platforma ima promet
kojim se može argumentovati.

### 13.3 Plaćeno izdvajanje — granica

Brend može platiti dodatnu vidljivost na:
- početnoj stranici (baneri, istaknute pozicije)
- stranicama kategorija
- rezultatima pretrage

Svako plaćeno mjesto mora biti **jasno označeno kao promocija**.

**Ritual Vodič je izuzet.** Redoslijed preporuke u Vodiču određuje
isključivo zdravstvena logika (`product_goals.relevantnost`, koju
postavlja admin ili medicinski recenzent — nikad brend). Ovo nije
tehničko ograničenje nego poslovna odluka: Vodič je procjena, ne oglas.
Ako plaćeni redoslijed uđe u Vodič, gubi se i povjerenje kupca i
mogućnost da ljekari stanu iza sistema.

---

## 14. Reklamacije

**Reklamaciju rješava brend.** Od brenda je roba, od brenda je račun, kod
brenda je novac. Platforma zadržava uvid i pravo eskalacije.

### 14.1 Tok

```
kupac otvara reklamaciju (uz broj narudžbe)
   → tiket ide direktno brendu čija je pošiljka   [kod_brenda]
   → brend odgovara i predlaže rješenje            [u_obradi]
   → zamjena / povrat novca / popust / odbijeno    [rijeseno]

ako brend ne odgovori u 48h            → automatska eskalacija na admina
ako kupac nije zadovoljan rješenjem    → ručna eskalacija na admina
```

Kupac ne mora znati ko rješava — u interfejsu vidi da je reklamacija
primljena i ko je pošiljalac proizvoda.

### 14.2 Podjela odgovornosti

| | Brend | Ritual |
|---|---|---|
| Prima i rješava reklamaciju | ✓ | |
| Komunicira s kupcem | ✓ | kod eskalacije |
| Vraća novac kupcu | ✓ | |
| Snosi trošak zamjene | ✓ | |
| Vidi sve tikete | | ✓ |
| Preuzima nakon 48h ćutanja | | ✓ |
| Mjeri odziv brenda | | ✓ |

### 14.3 Zašto ipak pratimo

Kupac je kupio „na Ritualu" i tebe vidi kao odgovornog bez obzira
čiji je račun. Ako brend ignoriše reklamacije, to se vraća platformi
kroz recenzije i ugled.

Zato admin dashboard prikazuje po brendu:
- broj otvorenih reklamacija
- prosječno vrijeme odgovora
- udio eskaliranih tiketa
- udio odbijenih reklamacija

Ovi brojevi su osnov za razgovor s brendom i, ako treba, za suspenziju.

### 14.4 Storniranje provizije

Kod odobrenog povrata novca provizija na tu stavku se **stornira** i
izlazi iz obračunskog perioda. Ako je period već fakturisan, ide kao
umanjenje u sljedećem.

**Za ugovor s brendom:** maksimalan rok za povrat novca kupcu, šta se
dešava kad brend odbije opravdanu reklamaciju, i ko plaća povratnu
dostavu.

---

## 15. Admin dashboard — dopuna

Uz postojeći opseg (proizvodi, kategorije, paketi, blog, osnovni izvještaji):

| Sekcija | Šta radi |
|---|---|
| **Odobrenja** | Red čekanja: novi brendovi, proizvodi, izmjene, paketi |
| **Brendovi** | Provizija MP i VP, naknada za prisustvo, status, verifikacija |
| **Firme (B2B)** | Odobravanje veleprodajnih naloga, JIB, status |
| **Obračun** | Promet i provizija po brendu i periodu, status naplate |
| **Reklamacije** | Uvid u sve tikete, eskalacije, statistika odziva po brendu |
| **Izdvajanje** | Plaćene pozicije na katalogu — **ne dira Vodič** |
| **Leadovi** | Prijave brendova sa javne forme |

---

## 16. Odluke — riješeno

| Pitanje | Odluka |
|---|---|
| Povrat novca kupcu | **Brend.** Brend je primio novac, brend vraća. |
| Trošak povratne dostave | **Brend.** |
| Fiskalni račun i PDV | **Brend** izdaje račun kupcu. Platforma fakturiše samo proviziju brendu. |
| Odustajanje od kupovine (Zakon o zaštiti potrošača) | **Brend** obrađuje, u zakonskom roku. |
| Stepen naknade za prisustvo | **50 artikala po stepenu.** Iznosi se unose kasnije. |

### 16.1 Šta ovo znači u praksi

Platforma **nije prodavac.** Ugovor o kupoprodaji je između kupca i
brenda. Ritual je posrednik koji naplaćuje proviziju za posredovanje.

Posljedice koje moraju biti vidljive u interfejsu i uslovima korištenja:
- Na stranici proizvoda i u checkoutu jasno stoji **ko je prodavac**
- Račun stiže od brenda, ne od Rituala
- Uslovi povrata se prikazuju uz podatke brenda
- Uslovi korištenja moraju eksplicitno definisati ulogu posrednika

**Za pravnika prije lansiranja:** provjeriti da li Zakon o zaštiti
potrošača FBiH tretira platformu kao suodgovornu, čak i kad je prodavac
brend. U EU praksi platforma često dijeli odgovornost bez obzira na
ugovorni odnos. Ovo ne mijenja model, ali može promijeniti tekst uslova
korištenja i način na koji se prodavac prikazuje.

---

## 17. Kasnije faze

### 17.1 Loyalty program

Razlog zašto kupac otvara nalog. **Ne gradi se u MVP-u**, ali šema
ostavlja mjesta.

Koncept:
- Bodovi se sakupljaju po isporučenoj narudžbi
- Bodovi se troše na popust pri sljedećoj kupovini
- Moguća dodatna pravila: prva narudžba, recenzija proizvoda,
  popunjen Ritual Vodič, preporuka prijatelju

Otvoreno prije implementacije:
- **Ko finansira popust** — platforma iz provizije ili brend iz cijene.
  Ovo je komercijalno pitanje, ne tehničko, i mora u ugovor.
- Vrijednost boda i rok isteka
- Da li bodovi vrijede i na veleprodaji (preporuka: ne)

Tabele koje će trebati: `loyalty_accounts`, `loyalty_transactions`,
`loyalty_rules`.

### 17.2 Medicinski recenzenti

Tabela `medical_reviewers` postoji od početka. Dok nije popunjena
stvarnim imenima, **ne koristiti tvrdnje koje impliciraju ljekarsku
validaciju** u marketinškom copyju.

### 17.3 Ostalo

| Šta | Kada |
|---|---|
| Online plaćanje (Monri) | nakon MVP-a — tada platforma postaje posrednik u plaćanju |
| Veleprodaja Tok B (zahtjev za ponudu) | po potrebi |
| Naknada za prisustvo — aktivacija | kad platforma ima promet |
| Partnerstvo s medicinskim ustanovama | tek uz pravno mišljenje |
| Mobilna aplikacija | konzumira isti `/api` |

---

## 18. Otvorena pitanja

| Pitanje | Blokira |
|---|---|
| Je li platforma suodgovorna po Zakonu o zaštiti potrošača | uslove korištenja |
| Iznosi naknade za prisustvo po stepenu od 50 artikala | kasniju fazu |
| Ko finansira loyalty popust — platforma ili brend | loyalty fazu |
| Finalne hex vrijednosti boja i fontovi | dizajn |
| Prava na sadržaj i slike koje brend uploaduje | uslove korištenja |