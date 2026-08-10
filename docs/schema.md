# Model podataka — Ritual

Verzija 1.0 · 6. avgust 2026.

Novčani iznosi su **cijeli brojevi u fening** (100 fening = 1 KM). Nikad
`float`. Procenti su `numeric(5,2)`.

---

## 1. Korisnici i pristup

### `users`
| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| email | text unique | |
| password_hash | text | |
| role | enum | `customer` \| `brand` \| `admin` |
| ime | text | |
| telefon | text | |
| email_verifikovan_at | timestamptz | |
| created_at | timestamptz | |

Kupac **ne mora** imati nalog. Narudžba gosta nema `user_id`.

### `brand_users`
Veza korisnika s brendom. Jedan brend može imati više ljudi.

| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| brand_id | uuid FK → brands | |
| uloga | enum | `vlasnik` \| `urednik` |

### `business_accounts`
Firme koje kupuju na veliko. **Zahtijeva odobrenje admina.**

| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| naziv | text | |
| tip | enum | `farmaceutska_kuca` \| `medicinska_ustanova` \| `ostalo` |
| jib | text | |
| pdv_broj | text | nullable |
| adresa, grad, postanski_broj | text | |
| kontakt_osoba, kontakt_telefon | text | |
| status | enum | `na_cekanju` \| `odobreno` \| `odbijeno` \| `suspendovano` |
| odobrio_user_id | uuid FK → users | |
| odobreno_at | timestamptz | |
| napomena_admina | text | |

Veleprodajne cijene vidi **samo** korisnik čiji je `business_account` u
statusu `odobreno`.

`medicinska_ustanova` je **rezervisan tip** za buduće partnerstvo (Sanasa,
Agram). Tip postoji u šemi, funkcionalnost preporuka na osnovu nalaza
**se ne implementira** — vidi sekciju 10.

---

## 2. Brendovi

### `brands`
| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| slug | text unique | |
| naziv | text | |
| kratki_opis | text | |
| prica | text | duži tekst, brend storefront |
| logo_url, cover_url | text | |
| web, email, telefon | text | |
| jib, pdv_broj, adresa | text | pravni podaci |
| status | enum | `na_cekanju` \| `odobren` \| `suspendovan` |
| verifikovan | boolean | značka na storefrontu |
| **provizija_mp_posto** | numeric(5,2) | **default 20.00** |
| **provizija_vp_posto** | numeric(5,2) | **default 20.00**, admin mijenja |
| **prag_besplatne_dostave** | integer | fening, `null` = nema besplatne |
| **cijena_dostave** | integer | fening, brend definiše |
| **naknada_prisustvo_mjesecno** | integer | fening, **default 0** |
| naknada_stepen_velicina | integer | **default 50** artikala po stepenu |
| naknada_aktivna_od | date | nullable |
| created_at | timestamptz | |

Sve tri komercijalne stavke (provizija MP, provizija VP, mjesečna naknada)
mijenja **isključivo admin**. Brend ih vidi, ne edituje.

### `brand_certificates`
| id, brand_id, naziv, opis, dokument_url, redoslijed |

---

## 3. Katalog

### `categories`
| id, slug, naziv, opis, parent_id, ikona, redoslijed |

Kategorija opisuje **šta proizvod jeste**. Hijerarhija je dva nivoa:
top-level (`parent_id IS NULL`) → podkategorija. Proizvod se veže za
podkategoriju, ali se u prikazu broji i za njenog roditelja.

Pet top-level: Suplementi · Sport · Higijena · Kozmetika · Bebe —
sa ukupno 23 podkategorije.

`ikona` je ime lucide ikone (`Pill`, `Dumbbell`, `Droplets`, `Sparkles`,
`Baby`); mapa poznatih imena je u `app/(shop)/_components/CategoryIcon.tsx`.

Kategorije se koriste za navigaciju i filter kataloga. **Ciljevi (`goals`)
su odvojen model** — šta proizvod *rješava* — i žive isključivo u Ritual
Vodiču. Ciljevi se ne prikazuju kao filter ni kao navigacija.

### `products`
| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| brand_id | uuid FK → brands | |
| slug | text unique | |
| naziv | text | |
| kratki_opis, opis | text | |
| forma | enum | `kapsula` \| `tableta` \| `prah` \| `tecnost` \| `gel` \| `krema` \| `zvakaca` |
| sastojci | text | |
| doziranje | text | |
| upozorenja | text | kontraindikacije, trudnoća, interakcije |
| **cijena** | integer | fening, maloprodajna, brend postavlja |
| stara_cijena | integer | nullable, za prikaz sniženja |
| dostupnost | enum | `dostupno` \| `nedostupno` \| `uskoro` |
| **status** | enum | `nacrt` \| `na_cekanju` \| `odobren` \| `odbijen` |
| razlog_odbijanja | text | |
| odobrio_user_id, odobreno_at | | |
| oznake | text[] | `preporuceno`, `premium`, `najprodavanije`, `novo` |
| created_at, updated_at | | |

**Svaki novi proizvod i svaka izmjena postojećeg ide na odobrenje admina.**
Do odobrenja proizvod nije javno vidljiv.

### `product_images`
| id, product_id, url, alt, redoslijed |

### `product_categories`
m2m: | product_id, category_id |

### `ingredients` / `product_ingredients`
Zaseban rječnik sastojaka — omogućava pretragu po sastojku i logiku Vodiča.

| ingredients: id, slug, naziv, opis |
| product_ingredients: product_id, ingredient_id, kolicina, jedinica |

---

## 4. Veleprodaja (Tok A — količinski pragovi)

### `wholesale_price_tiers`
| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| product_id | uuid FK → products | |
| min_kolicina | integer | npr. 50, 200, 1000 |
| cijena | integer | fening, po komadu |

Unique na `(product_id, min_kolicina)`. Brend definiše stepenice sam.
Primjenjuje se najviši prag koji količina zadovoljava.

Veleprodajna narudžba u ovoj fazi **također ide pouzećem**. Faktura,
virman i rok plaćanja dolaze s Monri integracijom u sljedećoj fazi —
vidi sekciju 10.

---

## 5. Paketi

### `bundles`
| id, brand_id, naziv, opis, slika_url, cijena, status, created_at |

Brend sam sastavlja pakete i postavlja cijenu. Paket ide kroz isto
odobrenje kao proizvod.

### `bundle_items`
| bundle_id, product_id, kolicina |

---

## 6. Narudžbe — lomljenje po brendu

Ovo je najvažniji dio šeme. **Jedna narudžba, više pošiljki.**

### `orders`
| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| broj | text unique | čitljiv, npr. `MR-2026-00421` |
| user_id | uuid FK → users | **nullable** — gost |
| business_account_id | uuid FK | nullable — veleprodaja |
| **tip** | enum | `maloprodaja` \| `veleprodaja` |
| kupac_ime, kupac_email, kupac_telefon | text | |
| adresa, grad, postanski_broj | text | |
| napomena | text | |
| iznos_stavki | integer | zbir svih pošiljki |
| iznos_dostave | integer | zbir dostave po pošiljkama |
| ukupno | integer | |
| nacin_placanja | enum | `pouzece` (jedina vrijednost zasad) |
| status | enum | izvedeni status iz pošiljki |
| created_at | | |

### `order_shipments`
Jedna po brendu unutar narudžbe.

| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| order_id | uuid FK → orders | |
| brand_id | uuid FK → brands | |
| iznos_stavki | integer | |
| cijena_dostave | integer | snapshot iz `brands` |
| besplatna_dostava | boolean | prag dostignut |
| **status** | enum | `novo` \| `potvrdjeno` \| `poslano` \| `isporuceno` \| `otkazano` \| `vraceno` |
| kurir | text | |
| broj_posiljke | text | brend unosi |
| poslano_at, isporuceno_at | timestamptz | |

**Brend pakuje i šalje sam.** Brend unosi broj pošiljke i mijenja status
svoje pošiljke. Ne vidi pošiljke drugih brendova iz iste narudžbe.

### `order_items`
| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| shipment_id | uuid FK → order_shipments | |
| product_id | uuid FK → products | |
| naziv_snapshot | text | naziv u trenutku kupovine |
| cijena_snapshot | integer | |
| kolicina | integer | |
| **provizija_posto_snapshot** | numeric(5,2) | zamrznuto pri narudžbi |
| **provizija_iznos** | integer | izračunato pri narudžbi |
| bundle_id | uuid | nullable, ako stavka dolazi iz paketa |

Snapshot polja su obavezna. Kad admin sutra promijeni proviziju brendu,
stare narudžbe se ne smiju promijeniti.

---

## 7. Obračun provizije

Novac ide **brendu** (kupac plaća kuriru brenda). Platforma naknadno
fakturiše proviziju.

### `commission_periods`
| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| brand_id | uuid FK → brands | |
| period_od, period_do | date | obično kalendarski mjesec |
| iznos_prometa | integer | zbir isporučenih pošiljki |
| iznos_provizije | integer | |
| iznos_naknade | integer | mjesečna naknada za prisustvo |
| ukupno_za_naplatu | integer | |
| status | enum | `nacrt` \| `poslano` \| `placeno` \| `sporno` |
| faktura_broj | text | |
| placeno_at | timestamptz | |

U obračun ulaze **samo pošiljke sa statusom `isporuceno`.** Otkazane i
vraćene ne generišu proviziju.

---

## 8. Ritual Vodič

**Redoslijed preporuke određuje isključivo zdravstvena logika. Ni jedno
polje iz `brands` koje se tiče plaćanja ne smije ući u rangiranje.**

### `goals`
| id, slug, naziv, opis |
Ciljevi: više energije, bolji san, jači imunitet, zdrava kosa/koža/nokti,
zglobovi i pokretljivost, probava i metabolizam, podrška kod treninga.

Cilj opisuje **šta proizvod rješava** i koristi se samo u Vodiču — nije
kategorija i ne pojavljuje se u navigaciji ni u filteru kataloga.

### `product_goals`
| product_id, goal_id, relevantnost (integer 1–100) |

Relevantnost postavlja admin ili medicinski recenzent — **ne brend.**

### `guide_sessions`
| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| anon_id | text | kolačić, za goste |
| user_id | uuid | nullable |
| odgovori | jsonb | |
| rezultat | jsonb | grupe + objašnjenja + proizvodi |
| sacuvano | boolean | kupac spasio rezultat |
| created_at | | |

---

## 9. Podrška, sadržaj, ostalo

### `support_tickets`
Reklamacije rješava **brend** — od njega je roba i račun. Platforma ima
uvid i može eskalirati.

| Polje | Tip | Napomena |
|---|---|---|
| id | uuid PK | |
| broj | text unique | npr. `REK-2026-00087` |
| order_id | uuid FK → orders | |
| shipment_id | uuid FK → order_shipments | određuje **koji brend** rješava |
| brand_id | uuid FK → brands | denormalizovano, vlasnik tiketa |
| tip | enum | `reklamacija` \| `povrat` \| `ostecena_posiljka` \| `upit` |
| status | enum | vidi tok ispod |
| kupac_ime, kupac_email, kupac_telefon | text | gost nema nalog |
| predmet, opis | text | |
| slike | text[] | kupac prilaže fotografije |
| **rok_odgovora_at** | timestamptz | `created_at` + 48h |
| **eskalirano** | boolean | brend probio rok ili kupac tražio |
| eskalirano_at | timestamptz | |
| rjesenje | enum | `zamjena` \| `povrat_novca` \| `popust` \| `odbijeno` |
| iznos_povrata | integer | fening, nullable |
| zatvoreno_at | timestamptz | |
| created_at | | |

Tok statusa:
```
novo → kod_brenda → u_obradi → rijeseno
                             → odbijeno
     → eskalirano (admin preuzima)
```

Tiket se otvara direktno na brendu (`kod_brenda`). Admin **ne mora**
intervenisati, ali vidi sve.

**Automatska eskalacija:** ako brend ne odgovori u 48 sati, tiket dobija
`eskalirano = true`, pojavljuje se u admin redu čekanja i brend dobija
email. Kupac uvijek ima dugme „Nisam zadovoljan rješenjem" koje eskalira
ručno.

### `ticket_messages`
| id, ticket_id, autor_user_id, autor_tip (`kupac` \| `brend` \| `admin`),
poruka, slike, interno (boolean), created_at |

`interno = true` — bilješka između admina i brenda, kupac je ne vidi.

### `product_reviews`
| id, product_id, order_item_id, ocjena (1–5), komentar, status (`na_cekanju` \| `objavljeno` \| `odbijeno`) |

Recenziju može ostaviti samo kupac s isporučenom narudžbom.

### `posts` — Ritual Blog
| id, slug, naslov, sazetak, sadrzaj, cover_url, autor, recenzent_id,
status, objavljeno_at |

### `medical_reviewers`
| id, ime, titula, specijalnost, biografija, foto_url, aktivan |

### `vendor_leads`
Forma sa stranice „Postanite dio ponude".
| id, naziv_firme, kontakt_osoba, email, telefon, kategorija, poruka,
status (`novo` \| `kontaktirano` \| `u_pregovorima` \| `zatvoreno`), created_at |

### `settings`
| kljuc, vrijednost (jsonb) | — globalne postavke koje admin mijenja

---

## 10. Namjerno izostavljeno

Ovo **ne gradimo sada**, ali šema ostavlja mjesta:

| Šta | Zašto čeka |
|---|---|
| Online plaćanje (Monri) | Sljedeća faza. Tada `orders.nacin_placanja` dobija nove vrijednosti, a platforma postaje posrednik u plaćanju. |
| Veleprodaja Tok B (zahtjev za ponudu) | Tok A pokriva većinu. Dodaje se kad se ukaže potreba. |
| Fakturisanje i rok plaćanja za veleprodaju | Ide zajedno s Monri integracijom. |
| Preporuke na osnovu nalaza (Sanasa, Agram) | **Zdravstveni podatak.** Traži izričitu saglasnost, jasan pravni osnov i pravo na brisanje. Ne dirati bez pravnog mišljenja. |
| Loyalty program (bodovi) | Razlog za otvaranje naloga. Tabele `loyalty_accounts`, `loyalty_transactions`, `loyalty_rules`. Prvo riješiti ko finansira popust — platforma ili brend. |
| Praćenje zdravlja, streakovi, dostignuća | Kasnija faza. |
| Mobilna aplikacija | Konzumira isti `/api`. |

---

## 11. Riješeno — utiče na šemu

| Odluka | Posljedica u šemi |
|---|---|
| Brend vraća novac i snosi povratnu dostavu | `support_tickets.iznos_povrata` vodi brend, ne platforma |
| Brend izdaje fiskalni račun | Platforma **ne** čuva podatke o fiskalnom računu kupca; `commission_periods` pokriva samo fakturu prema brendu |
| Brend obrađuje odustajanje od kupovine | `support_tickets.tip` dobija vrijednost `odustajanje` |
| Stepen naknade = 50 artikala | `brands.naknada_stepen_velicina` default 50 |

**Platforma nije prodavac.** Ugovor je između kupca i brenda. To znači da
model podataka nikad ne smije implicirati da Ritual naplaćuje robu —
jedini novčani tok prema platformi je provizija u `commission_periods`.

---

## 12. Otvoreno — treba odluka

1. **Je li platforma suodgovorna** po Zakonu o zaštiti potrošača FBiH,
   iako je prodavac brend. Za pravnika prije lansiranja.
2. **Iznosi naknade** po stepenu od 50 artikala.
3. **Ko finansira loyalty popust** — platforma iz provizije ili brend iz
   cijene. Komercijalno pitanje, mora u ugovor prije nego se gradi.
4. **Prava na slike i opise** koje brend uploaduje — u uslove korištenja.
