import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import { bs } from '@/lib/i18n/bs';

type PotvrdaRegistracijeEmailProps = {
  ime: string;
  linkZaVerifikaciju: string;
};

export function PotvrdaRegistracijeEmail({ ime, linkZaVerifikaciju }: PotvrdaRegistracijeEmailProps) {
  const poruke = bs.email.registracija;

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
            {poruke.tekstNalog}
          </Text>
          <Text style={{ color: '#1C2B22', fontSize: '14px', lineHeight: '22px' }}>
            {poruke.tekstPotvrda}
          </Text>
          <Button
            href={linkZaVerifikaciju}
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
          <Hr style={{ borderColor: '#1C2B22', opacity: 0.1, margin: '24px 0 16px' }} />
          <Text style={{ color: '#8A9086', fontSize: '12px', margin: 0 }}>{poruke.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PotvrdaRegistracijeEmail;
