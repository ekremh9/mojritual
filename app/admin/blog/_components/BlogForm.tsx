'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveBlogPostAction } from '@/lib/domain/blog-actions';
import { generisiSlug } from '@/lib/domain/slug';
import type { MedicalReviewerOpcija } from '@/lib/domain/blog';
import type { Post } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

export type ClanakVrijednosti = {
  naslov: string;
  slug: string;
  sazetak: string;
  sadrzaj: string;
  autor: string;
  recenzentId: string;
  status: Post['status'];
};

type BlogFormProps = {
  /** `null` = novi članak (insert). Inače id članka koji se uređuje (update). */
  postId: string | null;
  pocetneVrijednosti: ClanakVrijednosti;
  recenzenti: MedicalReviewerOpcija[];
};

const KLASE_POLJA =
  'w-full rounded-xl border border-[#1C2B22]/15 bg-white px-4 py-2.5 text-sm text-[#1C2B22] outline-none transition placeholder:text-[#1C2B22]/40 focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

const KLASE_LABELE = 'text-sm font-medium text-[#1C2B22]';

/**
 * Forma za kreiranje/uređivanje članka. Slug je editabilan SAMO pri
 * kreiranju (`postId === null`) i auto-popunjava se iz naslova dok ga
 * admin ručno ne dotakne (`slugTaknut`) — nakon prvog snimanja slug je
 * zaključan (prikazan kao read-only tekst), isti princip kao proizvodi:
 * stabilan javni URL, izmjena naslova kasnije ga ne mijenja.
 */
export function BlogForm({ postId, pocetneVrijednosti, recenzenti }: BlogFormProps) {
  const router = useRouter();
  const poruke = bs.admin.blog.forma;

  const [vrijednosti, setVrijednosti] = useState<ClanakVrijednosti>(pocetneVrijednosti);
  const [slugTaknut, setSlugTaknut] = useState(postId !== null);
  const [ucitavanje, setUcitavanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState(false);

  function postaviNaslov(naslov: string) {
    setVrijednosti((prethodne) => ({
      ...prethodne,
      naslov,
      slug: slugTaknut ? prethodne.slug : generisiSlug(naslov),
    }));
    setUspjeh(false);
  }

  function postavi<K extends keyof ClanakVrijednosti>(polje: K, vrijednost: ClanakVrijednosti[K]) {
    setVrijednosti((prethodne) => ({ ...prethodne, [polje]: vrijednost }));
    setUspjeh(false);
  }

  async function sacuvaj() {
    setGreska(null);
    setUspjeh(false);

    if (vrijednosti.naslov.trim() === '') {
      setGreska(poruke.greskaNaslov);
      return;
    }

    if (vrijednosti.sadrzaj.trim() === '') {
      setGreska(poruke.greskaSadrzaj);
      return;
    }

    setUcitavanje(true);

    try {
      const rezultat = await saveBlogPostAction(postId, vrijednosti);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      if (postId === null) {
        router.push(`/admin/blog/${rezultat.postId}`);
        return;
      }

      setUspjeh(true);
      router.refresh();
    } catch {
      setGreska(poruke.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="naslov" className={KLASE_LABELE}>
            {poruke.polja.naslov}
          </label>
          <input
            id="naslov"
            type="text"
            value={vrijednosti.naslov}
            onChange={(event) => postaviNaslov(event.target.value)}
            disabled={ucitavanje}
            className={KLASE_POLJA}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="slug" className={KLASE_LABELE}>
            {poruke.polja.slug}
          </label>
          {postId === null ? (
            <input
              id="slug"
              type="text"
              value={vrijednosti.slug}
              onChange={(event) => {
                setSlugTaknut(true);
                postavi('slug', generisiSlug(event.target.value));
              }}
              disabled={ucitavanje}
              className={KLASE_POLJA}
            />
          ) : (
            <p className="rounded-xl bg-[#F2F5ED] px-4 py-2.5 text-sm text-[#1C2B22]/70">
              /blog/{vrijednosti.slug}
            </p>
          )}
          <p className="text-xs text-[#1C2B22]/60">{poruke.polja.slugPomoc}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sazetak" className={KLASE_LABELE}>
            {poruke.polja.sazetak}
          </label>
          <textarea
            id="sazetak"
            rows={2}
            value={vrijednosti.sazetak}
            onChange={(event) => postavi('sazetak', event.target.value)}
            placeholder={poruke.polja.sazetakPlaceholder}
            disabled={ucitavanje}
            className={`${KLASE_POLJA} resize-y`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sadrzaj" className={KLASE_LABELE}>
            {poruke.polja.sadrzaj}
          </label>
          <textarea
            id="sadrzaj"
            rows={16}
            value={vrijednosti.sadrzaj}
            onChange={(event) => postavi('sadrzaj', event.target.value)}
            placeholder={poruke.polja.sadrzajPlaceholder}
            disabled={ucitavanje}
            className={`${KLASE_POLJA} resize-y font-mono`}
          />
          <p className="text-xs text-[#1C2B22]/60">{poruke.polja.sadrzajPomoc}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.sekcijaAutor}</h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="autor" className={KLASE_LABELE}>
            {poruke.polja.autor}
          </label>
          <input
            id="autor"
            type="text"
            value={vrijednosti.autor}
            onChange={(event) => postavi('autor', event.target.value)}
            placeholder={poruke.polja.autorPlaceholder}
            disabled={ucitavanje}
            className={KLASE_POLJA}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="recenzentId" className={KLASE_LABELE}>
            {poruke.polja.recenzent}
          </label>
          <select
            id="recenzentId"
            value={vrijednosti.recenzentId}
            onChange={(event) => postavi('recenzentId', event.target.value)}
            disabled={ucitavanje}
            className={KLASE_POLJA}
          >
            <option value="">{poruke.polja.recenzentNijeIzabran}</option>
            {recenzenti.map((recenzent) => (
              <option key={recenzent.id} value={recenzent.id}>
                {recenzent.ime}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#1C2B22]/60">{poruke.polja.recenzentPomoc}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className={KLASE_LABELE}>
            {poruke.polja.status}
          </label>
          <select
            id="status"
            value={vrijednosti.status}
            onChange={(event) => postavi('status', event.target.value as Post['status'])}
            disabled={ucitavanje}
            className={KLASE_POLJA}
          >
            <option value="nacrt">{bs.admin.blog.status.nacrt}</option>
            <option value="objavljeno">{bs.admin.blog.status.objavljeno}</option>
          </select>
        </div>
      </section>

      {greska ? (
        <p role="alert" className="rounded-xl bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E]">
          {greska}
        </p>
      ) : null}

      {uspjeh ? (
        <p role="status" className="rounded-xl bg-[#C7D6BA]/50 px-4 py-3 text-sm font-medium text-[#16332A]">
          {poruke.uspjeh}
        </p>
      ) : null}

      <div>
        <button
          type="button"
          onClick={sacuvaj}
          disabled={ucitavanje}
          className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-6 py-3 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {ucitavanje ? poruke.sacuvajUcitavanje : postId === null ? poruke.kreiraj : poruke.sacuvaj}
        </button>
      </div>
    </div>
  );
}
