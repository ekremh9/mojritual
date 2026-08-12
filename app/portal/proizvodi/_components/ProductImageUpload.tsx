'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { ALLOWED_IMAGE_TYPES, MAX_PRODUCT_IMAGES, MAX_UPLOAD_SIZE_BYTES } from '@/lib/storage/image-constants';
import { deleteProductImageAction, uploadProductImageAction } from '@/lib/storage/upload-actions';
import { bs } from '@/lib/i18n/bs';

type ProizvodSlika = { id: string; url: string; alt: string | null };

type ProductImageUploadProps = {
  productId: string;
  slike: ProizvodSlika[];
  /** Brend je suspendovan — upload se prikazuje, ali se ne može koristiti. */
  onemoguceno?: boolean;
};

export function ProductImageUpload({ productId, slike, onemoguceno }: ProductImageUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [ucitavaSe, setUcitavaSe] = useState(false);
  const [brisanjeUToku, setBrisanjeUToku] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  const poruke = bs.portal.proizvodi.slike;
  const dostignutMaksimum = slike.length >= MAX_PRODUCT_IMAGES;
  const zakljucano = onemoguceno || ucitavaSe;

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
      formData.set('file', fajl);

      const rezultat = await uploadProductImageAction(formData, productId);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      router.refresh();
    } catch {
      setGreska(bs.portal.slike.greskaOpsta);
    } finally {
      setUcitavaSe(false);
    }
  }

  async function obrisiSliku(imageId: string) {
    if (onemoguceno) {
      return;
    }

    setGreska(null);
    setBrisanjeUToku(imageId);

    try {
      const rezultat = await deleteProductImageAction(imageId, productId);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      router.refresh();
    } catch {
      setGreska(bs.portal.slike.greskaOpsta);
    } finally {
      setBrisanjeUToku(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4">
        {slike.map((slika) => (
          <div
            key={slika.id}
            className="relative h-24 w-24 overflow-hidden rounded-2xl border border-[#1C2B22]/10 bg-[#F2F5ED]"
          >
            <Image src={slika.url} alt={slika.alt ?? ''} fill sizes="96px" className="object-cover" />

            <button
              type="button"
              onClick={() => obrisiSliku(slika.id)}
              disabled={onemoguceno || brisanjeUToku !== null}
              aria-label={poruke.ukloni}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#1C2B22]/70 text-white transition hover:bg-[#B3261E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {brisanjeUToku === slika.id ? (
                <span className="text-[10px]">…</span>
              ) : (
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        ))}

        {!dostignutMaksimum ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={zakljucano}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[#1C2B22]/20 bg-[#F2F5ED] px-2 text-center text-xs text-[#8A9086] transition hover:border-[#16332A]/40 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {ucitavaSe ? poruke.ucitavanje : poruke.dodajSliku}
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={odaberiFajl}
        className="hidden"
      />

      {slike.length === 0 ? <p className="text-xs text-[#1C2B22]/60">{poruke.nema}</p> : null}

      <p className="text-xs text-[#1C2B22]/60">
        {dostignutMaksimum ? poruke.maxDostignut : poruke.napomena}
      </p>

      {greska ? (
        <p role="alert" className="text-xs text-[#B3261E]">
          {greska}
        </p>
      ) : null}
    </div>
  );
}
