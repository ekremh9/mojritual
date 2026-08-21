'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@/lib/storage/image-constants';
import { removeHeroImageAction, uploadHeroImageAction } from '@/lib/storage/upload-actions';
import { bs } from '@/lib/i18n/bs';

type HeroImageUploadProps = {
  trenutniUrl: string | null;
};

/** Jedna hero slika, globalna — zamjenjuje se novim uploadom, ili se uklanja (vraća homepage na gradient fallback). Isti obrazac kao ImageUpload (logo/cover brenda), plus dugme za uklanjanje. */
export function HeroImageUpload({ trenutniUrl }: HeroImageUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(trenutniUrl);
  const [ucitavaSe, setUcitavaSe] = useState(false);
  const [uklanjaSe, setUklanjaSe] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const poruke = bs.admin.postavke.heroSlika;
  const zakljucano = ucitavaSe || uklanjaSe;

  async function odaberiFajl(event: ChangeEvent<HTMLInputElement>) {
    const fajl = event.target.files?.[0];
    event.target.value = '';

    if (!fajl) {
      return;
    }

    setGreska(null);

    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(fajl.type)) {
      setGreska(bs.portal.slike.greskaTip);
      return;
    }

    if (fajl.size > MAX_UPLOAD_SIZE_BYTES) {
      setGreska(bs.portal.slike.greskaVelicina);
      return;
    }

    setUcitavaSe(true);

    try {
      const formData = new FormData();
      formData.set('file', fajl);

      const rezultat = await uploadHeroImageAction(formData);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setUrl(rezultat.url);
      router.refresh();
    } catch {
      setGreska(poruke.greskaOpsta);
    } finally {
      setUcitavaSe(false);
    }
  }

  async function ukloni() {
    setGreska(null);
    setUklanjaSe(true);

    try {
      const rezultat = await removeHeroImageAction();

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setUrl(null);
      router.refresh();
    } catch {
      setGreska(poruke.greskaOpsta);
    } finally {
      setUklanjaSe(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={zakljucano}
        className="relative h-48 w-full max-w-xl overflow-hidden rounded-2xl border border-dashed border-[#1C2B22]/20 bg-[#F2F5ED] transition hover:border-[#16332A]/40 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {url ? (
          <Image
            src={url}
            alt=""
            fill
            sizes="(min-width: 640px) 36rem, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center px-2 text-center text-sm text-[#8A9086]">
            {poruke.dodaj}
          </span>
        )}

        {ucitavaSe ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-[#1C2B22]">
            {poruke.ucitavanje}
          </span>
        ) : null}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={odaberiFajl}
        className="hidden"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#1C2B22]/60">{poruke.napomena}</p>
        {url ? (
          <button
            type="button"
            onClick={ukloni}
            disabled={zakljucano}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#B3261E]/40 px-4 py-1.5 text-xs font-medium text-[#B3261E] transition-colors hover:bg-[#B3261E]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uklanjaSe ? poruke.uklanjanje : poruke.ukloni}
          </button>
        ) : null}
      </div>

      {greska ? (
        <p role="alert" className="text-xs text-[#B3261E]">
          {greska}
        </p>
      ) : null}
    </div>
  );
}
