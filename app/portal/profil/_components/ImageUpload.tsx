'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@/lib/storage/image-constants';
import { uploadBrandImageAction } from '@/lib/storage/upload-actions';
import { bs } from '@/lib/i18n/bs';

type ImageUploadProps = {
  label: string;
  trenutniUrl: string | null;
  tip: 'logo' | 'cover';
  brandId: string;
  /** Brend je suspendovan — upload se prikazuje, ali se ne može koristiti. */
  onemoguceno?: boolean;
};

export function ImageUpload({ label, trenutniUrl, tip, brandId, onemoguceno }: ImageUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(trenutniUrl);
  const [ucitavaSe, setUcitavaSe] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const poruke = bs.portal.profil.slike;
  const okvirKlase = tip === 'logo' ? 'h-24 w-24' : 'h-32 w-full';
  const velicinaSlike = tip === 'logo' ? '96px' : '(min-width: 640px) 32rem, 100vw';

  async function odaberiFajl(event: ChangeEvent<HTMLInputElement>) {
    const fajl = event.target.files?.[0];
    event.target.value = '';

    if (!fajl || onemoguceno) {
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
      formData.set('brandId', brandId);
      formData.set('file', fajl);

      const rezultat = await uploadBrandImageAction(formData, tip);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setUrl(rezultat.url);
      router.refresh();
    } catch {
      setGreska(bs.portal.slike.greskaOpsta);
    } finally {
      setUcitavaSe(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#1C2B22]">{label}</span>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={ucitavaSe || onemoguceno}
        className={`relative ${okvirKlase} overflow-hidden rounded-2xl border border-dashed border-[#1C2B22]/20 bg-[#F2F5ED] transition hover:border-[#16332A]/40 disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {url ? (
          <Image src={url} alt="" fill sizes={velicinaSlike} className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-[#8A9086]">
            {poruke.dodaj}
          </span>
        )}

        {ucitavaSe ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-medium text-[#1C2B22]">
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

      <p className="text-xs text-[#1C2B22]/60">{poruke.napomena}</p>

      {greska ? (
        <p role="alert" className="text-xs text-[#B3261E]">
          {greska}
        </p>
      ) : null}
    </div>
  );
}
