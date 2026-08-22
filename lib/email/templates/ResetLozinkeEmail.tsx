import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';
import { bs } from '@/lib/i18n/bs';

type ResetLozinkeEmailProps = {
  ime: string;
  linkZaReset: string;
};

export function ResetLozinkeEmail({ ime, linkZaReset }: ResetLozinkeEmailProps) {
  const poruke = bs.email.resetLozinke;

  return (
    <Html>
      <Head />
      <Preview>{poruke.preview}</Preview>
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
            {poruke.pozdrav(ime)}
          </Heading>
          <Text style={{ color: '#1C2B22', fontSize: '14px', lineHeight: '22px' }}>
            {poruke.tekstZahtjev}
          </Text>
          <Button
            href={linkZaReset}
            style={{
              backgroundColor: '#16332A',
              color: '#F2F5ED',
              borderRadius: '999px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              margin: '8px 0 4px',
            }}
          >
            {poruke.dugme}
          </Button>
          <Text style={{ color: '#8A9086', fontSize: '12px', margin: '16px 0 0' }}>
            {poruke.napomenaIsticanje}
          </Text>
          <Text style={{ color: '#8A9086', fontSize: '12px', margin: '4px 0 0' }}>
            {poruke.napomenaIgnorisi}
          </Text>
          <Hr style={{ borderColor: '#1C2B22', opacity: 0.1, margin: '24px 0 16px' }} />
          <Text style={{ color: '#8A9086', fontSize: '12px', margin: '0 0 4px' }}>{poruke.footer}</Text>
          <Text style={{ color: '#8A9086', fontSize: '12px', margin: 0 }}>
            {poruke.kontaktPrefiks}{' '}
            <Link href={`mailto:${bs.footer.kontakt.email}`} style={{ color: '#8A9086' }}>
              {bs.footer.kontakt.email}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetLozinkeEmail;
