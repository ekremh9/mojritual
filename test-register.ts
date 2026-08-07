import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { registerUser } = await import('./lib/domain/auth');

  const user = await registerUser({
    email: 'test@mojritual.ba',
    password: 'testlozinka123',
    ime: 'Test Korisnik',
    role: 'customer',
  });
  console.log('Kreiran korisnik:', user);
}

main();