export type UserRole = 'CLIENT' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

