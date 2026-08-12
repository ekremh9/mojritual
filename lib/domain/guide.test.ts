import { describe, expect, it } from 'vitest';
import {
  mozeNastavitiIzKorak1,
  poredakOznakaIRelevantnosti,
  validanBrojCiljeva,
  zahtjevaPotvrduMaloljetnosti,
  type GuideOsnovniPodaci,
} from './guide';

describe('zahtjevaPotvrduMaloljetnosti', () => {
  it('traži potvrdu samo za grupu <18', () => {
    expect(zahtjevaPotvrduMaloljetnosti('<18')).toBe(true);
    expect(zahtjevaPotvrduMaloljetnosti('18-30')).toBe(false);
    expect(zahtjevaPotvrduMaloljetnosti(null)).toBe(false);
  });
});

describe('mozeNastavitiIzKorak1', () => {
  const osnova: GuideOsnovniPodaci = {
    spol: null,
    starosnaGrupa: null,
    potvrdaMaloljetnosti: false,
  };

  it('dozvoljava nastavak kad korak nije popunjen (opcion korak)', () => {
    expect(mozeNastavitiIzKorak1(osnova)).toBe(true);
  });

  it('dozvoljava nastavak za odrasle bez ikakve potvrde', () => {
    expect(mozeNastavitiIzKorak1({ ...osnova, starosnaGrupa: '31-45' })).toBe(true);
  });

  it('blokira nastavak za <18 dok checkbox nije označen', () => {
    expect(mozeNastavitiIzKorak1({ ...osnova, starosnaGrupa: '<18' })).toBe(false);
  });

  it('dozvoljava nastavak za <18 kad je checkbox označen', () => {
    expect(
      mozeNastavitiIzKorak1({ ...osnova, starosnaGrupa: '<18', potvrdaMaloljetnosti: true }),
    ).toBe(true);
  });
});

describe('validanBrojCiljeva', () => {
  it('odbija prazan izbor', () => {
    expect(validanBrojCiljeva([])).toBe(false);
  });

  it('prihvata 1 do 3 jedinstvena cilja', () => {
    expect(validanBrojCiljeva(['a'])).toBe(true);
    expect(validanBrojCiljeva(['a', 'b', 'c'])).toBe(true);
  });

  it('odbija više od 3 jedinstvena cilja', () => {
    expect(validanBrojCiljeva(['a', 'b', 'c', 'd'])).toBe(false);
  });

  it('duplikati se ne broje dvaput', () => {
    expect(validanBrojCiljeva(['a', 'a', 'a'])).toBe(true);
  });
});

describe('poredakOznakaIRelevantnosti', () => {
  it('stavlja primarne proizvode prije sekundarnih bez obzira na relevantnost', () => {
    const primarni = { relevantnost: 10, oznaka: 'primarni' as const };
    const sekundarni = { relevantnost: 90, oznaka: 'sekundarni' as const };

    const sortirano = [sekundarni, primarni].sort(poredakOznakaIRelevantnosti);

    expect(sortirano).toEqual([primarni, sekundarni]);
  });

  it('unutar iste oznake sortira opadajuće po relevantnosti', () => {
    const nizak = { relevantnost: 20, oznaka: 'primarni' as const };
    const visok = { relevantnost: 80, oznaka: 'primarni' as const };

    const sortirano = [nizak, visok].sort(poredakOznakaIRelevantnosti);

    expect(sortirano).toEqual([visok, nizak]);
  });
});
