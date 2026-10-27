import React, { createContext, useContext, useState } from 'react';
import { UserRole } from '../types';
import { APP_CONFIG } from '../config/appConfig';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

interface AuthContextType {
  role: UserRole;
  userId: number;
  userName: string;
  userEmail: string;
  setRole: (role: UserRole) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_ROLE) as UserRole | null;
    return saved === 'ADMIN' ? 'ADMIN' : 'CLIENT';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_ROLE, newRole);
  };

  const currentUser = role === 'ADMIN' ? APP_CONFIG.users.admin : APP_CONFIG.users.client;

  return (
    <AuthContext.Provider
      value={{
        role,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        setRole,
        isAdmin: role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
