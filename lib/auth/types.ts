import type { DefaultSession } from 'next-auth';
import type { User as DbUser } from '@/lib/db/schema';

type UserRole = DbUser['role'];

declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
