import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components';
import { bs } from '@/lib/i18n/bs';

type StavkaNarudzbe = {
  naziv: string;
  kolicina: number;
  cijena: string;
};

type PotvrdaNarudzbeEmailProps = {
  kupacIme: string;
  brojNarudzbe: string;
  stavke: StavkaNarudzbe[];
  ukupno: string;
};

export function PotvrdaNarudzbeEmail({
  kupacIme,
  brojNarudzbe,
  stavke,
  ukupno,
}: PotvrdaNarudzbeEmailProps) {
  const poruke = bs.email.narudzba;

  return (
    <Html>
      <Head />
      <Preview>{poruke.preview(brojNarudzbe)}</Preview>
      <Body style={{ backgroundColor: '#F2F5ED', fontFamily: 'sans-serif', padding: '32px 0' }}>
        <Container
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
          }}
        >
          <Heading style={{ color: '#1C2B22', fontSize: '20px', margin: '0 0 16px' }}>
            {poruke.pozdrav(kupacIme)}
          </Heading>
          <Text style={{ color: '#1C2B22', fontSize: '14px', lineHeight: '22px', margin: '0 0 16px' }}>
            {poruke.tekstBroj} <strong>{brojNarudzbe}</strong>.
          </Text>

          <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {stavke.map((stavka, indeks) => (
                <tr key={indeks}>
                  <td
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(28, 43, 34, 0.1)',
                      color: '#1C2B22',
                      fontSize: '14px',
                    }}
                  >
                    {stavka.naziv} × {stavka.kolicina}
                  </td>
                  <td
                    align="right"
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(28, 43, 34, 0.1)',
                      color: '#1C2B22',
                      fontSize: '14px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {stavka.cijena}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: '12px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#1C2B22', fontSize: '16px', fontWeight: 700 }}>
                  {poruke.ukupno}
                </td>
                <td align="right" style={{ color: '#1C2B22', fontSize: '16px', fontWeight: 700 }}>
                  {ukupno}
                </td>
              </tr>
            </tbody>
          </table>

          <Text style={{ color: '#1C2B22', fontSize: '13px', lineHeight: '20px', marginTop: '20px' }}>
            {poruke.napomenaPlacanje}
          </Text>

          <Hr style={{ borderColor: '#1C2B22', opacity: 0.1, margin: '24px 0 16px' }} />
          <Text style={{ color: '#8A9086', fontSize: '12px', margin: 0 }}>{poruke.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PotvrdaNarudzbeEmail;
