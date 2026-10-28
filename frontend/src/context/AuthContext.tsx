import React, { createContext, useContext, useState } from 'react';
import { UserRole } from '../types';
import { APP_CONFIG } from '../config/appConfig';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole;
  userId: number;
  userName: string;
  userEmail: string;
  login: (email: string) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_LOGGED_IN) === 'true';
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_ROLE) as UserRole | null;
    return saved === 'ADMIN' ? 'ADMIN' : 'CLIENT';
  });

  const [userId, setUserId] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
    return saved ? Number(saved) : (role === 'ADMIN' ? APP_CONFIG.users.admin.id : APP_CONFIG.users.client.id);
  });

  const [userName, setUserName] = useState<string>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_NAME);
    return saved || (role === 'ADMIN' ? APP_CONFIG.users.admin.name : APP_CONFIG.users.client.name);
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_EMAIL);
    return saved || (role === 'ADMIN' ? APP_CONFIG.users.admin.email : APP_CONFIG.users.client.email);
  });

  const login = (emailInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const isAdminUser = cleanEmail === 'admin@lumni.com' || cleanEmail.includes('admin');

    const newRole: UserRole = isAdminUser ? 'ADMIN' : 'CLIENT';
    const newId = isAdminUser ? APP_CONFIG.users.admin.id : APP_CONFIG.users.client.id;
    const newName = isAdminUser
      ? APP_CONFIG.users.admin.name
      : (cleanEmail === 'cliente@lumni.com' ? APP_CONFIG.users.client.name : cleanEmail.split('@')[0]);

    setIsAuthenticated(true);
    setRoleState(newRole);
    setUserId(newId);
    setUserName(newName);
    setUserEmail(cleanEmail);

    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_LOGGED_IN, 'true');
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_ROLE, newRole);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ID, String(newId));
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_NAME, newName);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_EMAIL, cleanEmail);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRoleState('CLIENT');
    setUserId(APP_CONFIG.users.client.id);
    setUserName(APP_CONFIG.users.client.name);
    setUserEmail(APP_CONFIG.users.client.email);

    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_LOGGED_IN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACTIVE_ROLE);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_ID);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_EMAIL);
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    const userConfig = newRole === 'ADMIN' ? APP_CONFIG.users.admin : APP_CONFIG.users.client;
    setUserId(userConfig.id);
    setUserName(userConfig.name);
    setUserEmail(userConfig.email);

    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_ROLE, newRole);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ID, String(userConfig.id));
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_NAME, userConfig.name);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_EMAIL, userConfig.email);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        userId,
        userName,
        userEmail,
        login,
        logout,
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
