'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario } from '../core/models/types';
import { authService, dbService } from '../core/services/firebase';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, password_dummy: string) => Promise<Usuario>;
  loginWithGoogle: () => Promise<Usuario>;
  register: (
    email: string, 
    contrasenia: string,
    nombre: string, 
    razonSocial: string, 
    ruc: string,
    plan?: string,
    cuponDescuento?: string,
    porcentajeDescuento?: number,
    costoMensual?: number
  ) => Promise<void>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Sync company in background
        authService.getCurrentCompany().catch(err => {
          console.warn('Failed to sync company on session fetch:', err);
        });
        // Sync other tenant collections in background
        dbService.syncFromCloudFirestore(currentUser.empresaId).catch(err => {
          console.warn('Failed to sync collections on session fetch:', err);
        });
        dbService.syncGlobalCollections().catch(err => {
          console.warn('Failed to sync globals on session fetch:', err);
        });
      }
    } catch (err) {
      console.error('Error fetching auth session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password_dummy: string) => {
    setLoading(true);
    try {
      const loggedUser = await authService.login(email, password_dummy);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const loggedUser = await authService.loginWithGoogle();
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string, 
    contrasenia: string,
    nombre: string, 
    razonSocial: string, 
    ruc: string,
    plan?: string,
    cuponDescuento?: string,
    porcentajeDescuento?: number,
    costoMensual?: number
  ) => {
    setLoading(true);
    try {
      const { usuario } = await authService.register(
        email, 
        contrasenia,
        nombre, 
        razonSocial, 
        ruc, 
        'Administrador',
        plan,
        cuponDescuento,
        porcentajeDescuento,
        costoMensual
      );
      setUser(usuario);
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setLoading(false);
    }
  };

  const recoverPassword = async (email: string) => {
    setLoading(true);
    try {
      await authService.recoverPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const reloadUser = async () => {
    const updatedUser = await authService.getCurrentUser();
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        recoverPassword,
        reloadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
