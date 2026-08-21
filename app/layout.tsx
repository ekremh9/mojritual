import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/auth";
import { jeOdobreniPartner } from "@/lib/domain/brand-access";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ritual — tvoj ritual zdravijeg života",
  description:
    "Ritual je najveća ponuda suplemenata na jednom mjestu, uz Ritual Vodič koji predlaže personalizirana rješenja za vaše zdravstvene ciljeve.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Izračunato JEDNOM ovdje, ne po klijentskoj promjeni količine — korpa je
  // globalno mount-ovana (Providers), a klijent nema pouzdan način da sam
  // utvrdi svoj partner status (vidi CartProvider). React `cache()` na
  // getUserBrand dedupe-uje ovo sa bilo kojim drugim pozivom u istom
  // zahtjevu (npr. app/(shop)/proizvod/[slug]/page.tsx).
  const session = await auth();
  const jePartner = session?.user?.id ? await jeOdobreniPartner(session.user.id) : false;

  return (
    <html
      lang="bs"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers jePartner={jePartner}>{children}</Providers>
        {process.env.NODE_ENV === "development" && (
          <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-orange-500 py-1 text-center text-xs font-bold tracking-wide text-white">
            DEV ENVIRONMENT
          </div>
        )}
      </body>
    </html>
  );
}
