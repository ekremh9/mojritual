'use client';

import { useEffect } from 'react';
import { markAllAsReadAction } from '@/lib/domain/notifications-actions';

/**
 * Ne renderuje ništa — samo pokreće `markAllAsReadAction` čim se stranica
 * obavještenja montira na klijentu. Mora biti klijentska komponenta jer
 * Server Action ne smije biti pozvan tokom render-a Server Component
 * page-a (vidi komentar u notifications-actions.ts); `useEffect` na mount
 * je najjednostavnija tačka koja se izvršava strogo nakon što je stranica
 * već poslala korisniku listu obavještenja.
 *
 * Dijeli je i /nalog/obavjestenja i /portal/obavjestenja — ista logika,
 * isti obrazac kao KorisnickiMeni koji se takođe uvozi preko granice
 * (shop)/portal ruta.
 */
export function MarkNotificationsReadOnView() {
  useEffect(() => {
    void markAllAsReadAction();
  }, []);

  return null;
}
