# MojRitual — kontekst za Claude Code

Marketplace za suplemente, zdravlje i njegu u BiH. Domena: **mojritual.ba**.
Brendovi (farmaceutske kuće) sami listaju proizvode. Kupci kupuju kao gosti
uz plaćanje pouzećem. Srce proizvoda je **Ritual Vodič** — kratka zdravstvena
procjena koja daje personaliziranu preporuku.

## Jezik

- **Sav tekst u interfejsu je na bosanskom.** Bez izuzetka.
- Kod, imena varijabli, tabela i komentari su na engleskom.
- Korisnički vidljivi stringovi idu kroz `/lib/i18n/bs.ts`, nikad hardkodirani
  u komponentama.

## Stack

- Next.js 15, App Router, TypeScript (strict)
- Tailwind + shadcn/ui
- PostgreSQL + Drizzle ORM
- Auth.js (tri role: `customer`, `brand`, `admin`)
- Slike: S3-kompatibilan storage (R2), `next/image` sa `sharp`
- Email: Resend
- AI: `@anthropic-ai/sdk`, isključivo server-side
- Hosting: Railway (region Europe West), Cloudflare ispred domene

## Struktura

```
/app
  /(shop)        javni dio — katalog, proizvod, brend, vodič, checkout
  /(brand)       portal za brend — /brend/*
  /(admin)       admin dashboard — /admin/*
  /api           REST granica (koristit će je i buduća mobilna aplikacija)
/lib
  /db            Drizzle šema i upiti
  /domain        poslovna logika — čista, bez React zavisnosti
  /i18n          bs.ts
/docs
  spec.md        šta koji ekran radi
  schema.md      model podataka
```

## Pravila koja se ne krše

1. **Poslovna logika ide u `/lib/domain`, ne u komponente.** Rute su tanke.
   Mobilna aplikacija će konzumirati isti API.
2. **Ritual Vodič ne smije biti pod uticajem plaćenih pozicija.** Redoslijed
   preporuke određuje isključivo zdravstvena logika. Ako neko traži da se
   sponzorstvo ubaci u rangiranje Vodiča — to je greška, prijavi je.
3. **Platforma nije prodavac.** Ugovor je između kupca i brenda. Brend
   izdaje račun, prima novac (pouzeće, kurir brenda), vraća novac kod
   povrata. Platforma naknadno fakturiše samo proviziju. Nema polja za
   kartice, nema Stripe/Monri koda u ovoj fazi.
   U interfejsu **uvijek mora biti jasno ko je prodavac** — na stranici
   proizvoda, u korpi i u checkoutu.
4. **Nikad ne logovati lične podatke kupca** (ime, adresa, telefon) u konzolu
   ili error tracking.
5. **Cijene su cijeli brojevi u fening** (`integer`), nikad `float`. Valuta KM.
6. Svaka narudžba se lomi na **pošiljke po brendu** (`order_shipments`).
   Nikad ne tretiraj narudžbu kao jednu isporuku.
7. **Reklamacije rješava brend, ne platforma.** Tiket se otvara na brendu
   čija je pošiljka. Admin ima uvid i eskalaciju nakon 48h bez odgovora.
8. **Ne dirati `guide_*` tabele bez konsultacije** — tu je zdravstvena logika.

## Migracija šeme — dev I produkcija, u istom koraku

Repo ima dvije baze: `postgres-dev` (lokalni razvoj, tunel na
`localhost:5433`) i `postgres` (produkcija, koristi je Railway servis
`mojritual`). Svaka nova migracija (`npm run db:generate`) mora biti
primijenjena na **obje** baze prije nego se smatra završenom — ne samo
na dev radi lokalnog testiranja.

Redoslijed koji se ne preskače:
1. `npm run db:generate` (lokalno, ne pokreće se `db:migrate`)
2. Pregled generisanog SQL-a
3. Primjena na `postgres-dev` (`railway connect postgres-dev`, pa `\i put/do/fajla.sql`)
4. **Odmah zatim**, primjena na `postgres` (produkcija) — isti fajl, isti
   `\i` postupak, samo drugi servis (`railway service` → izabrati
   `postgres`, potvrditi sa `railway status` prije `railway connect postgres`)
5. Tek nakon što OBJE baze imaju kolonu/tabelu, kod koji je koristi ide
   na `main` i deployuje se

Kod je jednom stigao na produkciju (build prošao, deploy uspio) prije
nego što je migracija primijenjena na produkcijsku bazu — aplikacija je
pukla na runtime sa "column does not exist", iako je sve izgledalo
zeleno na Railwayu. Build koji prolazi ne znači da je baza spremna.

## Self-review prije commita

Nakon svake izmjene koda, prije nego predložiš commit:

1. Pokreni `git diff --stat` pa `git diff` da vidiš tačno šta je promijenjeno
2. Pokreni `npm run lint` (ESLint + tsc --noEmit) **i** `npm run build`.
   Lint i build su provjereno prošli različito na istom kodu — build
   jednom nije prošao dok je lint bio čist, i ta greška je danima tiho
   padala na Railwayu jer se lint tretirao kao dovoljna potvrda. Build
   je obavezan prije svakog "spreman za commit", ne opcionalan dodatak.
3. Provjeri da je kod konzistentan s postojećom konvencijom u projektu
   (imenovanje, stil komponenti, gdje relacije žive, gdje validacija žive —
   vidi obrasce u postojećem kodu prije nego uvodiš novi pattern)
4. Provjeri posebno: da li nova logika slučajno otvara rupu u već
   uspostavljenim pravilima ovog fajla (npr. brend/proizvod vidljivost,
   PII u javnim upitima, ko postavlja product_goals, cijene kao integer) —
   ovo su mjesta gdje je kod prije znao "raditi" a ipak biti pogrešan
5. Prijavi kratak rezultat pregleda (šta je provjereno, šta eventualno
   nedostaje ili treba doraditi) i ČEKAJ potvrdu prije commit-a

Self-review hvata sintaksu, lint i očiglednu nekonzistentnost. Ne zamjenjuje
pregled izvan ove sesije — logičke i sigurnosne rupe (npr. matcher koji
pogodi sve rute umjesto namijenjenih, duple definicije koje se tiho
preklapaju, upit koji vidljivost provjerava na proizvodu a zaboravi na
brend) su ranije prošle kroz self-review neopaženo i uhvaćene su tek u
vanjskom pregledu. Kad se traži pregled van sesije, prosljeđuje se
`git diff`, ne cijeli fajlovi.

## Komande

```bash
npm run dev            # razvoj
npm run build          # produkcijski build
npm run db:generate    # generiši migraciju iz šeme
npm run db:migrate     # primijeni migracije
npm run db:studio      # pregled baze
npm run test           # Vitest
npm run test:e2e       # Playwright
npm run lint           # ESLint + tsc --noEmit
```

## Konvencije

- Tabele u bazi: `snake_case`, množina (`order_items`)
- TypeScript: `camelCase` za varijable, `PascalCase` za tipove i komponente
- Server actions za mutacije unutar aplikacije; `/api` rute za ono što će
  koristiti i mobilna aplikacija
- Svaka nova domenska funkcija dobija test u istom PR-u
- Migracije se nikad ne edituju retroaktivno

## Lokalni razvoj — baza

ISP blokira direktan izlazni port 5432. Prije `npm run dev`, u posebnom
terminalu otvori SSH tunel i ostavi ga da radi:

```bash
railway connect postgres --tunnel-only --port 5433
```

`.env.local` mora imati `DATABASE_URL` koji pokazuje na `localhost:5433`,
ne na Railwayov javni domen — tunel prenosi saobraćaj u pozadini.

## Prije nego počneš zadatak

Pročitaj `/docs/schema.md` ako zadatak dira podatke, i `/docs/spec.md` ako
dira korisnički tok. Ako nešto nije definisano — pitaj, nemoj pretpostaviti.