'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Empresa } from '../core/models/types';
import { authService, dbService } from '../core/services/firebase';
import { useAuth } from './useAuth';

interface CompanyContextType {
  company: Empresa | null;
  loadingCompany: boolean;
  refreshCompany: () => Promise<void>;
  updateCompanyDetails: (details: Partial<Empresa>) => Promise<void>;
  selectCompany: (empresa: Empresa | null) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [company, setCompany] = useState<Empresa | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  const fetchCompany = async () => {
    if (!user) {
      setCompany(null);
      setLoadingCompany(false);
      return;
    }

    try {
      setLoadingCompany(true);
      const activeCompany = await authService.getCurrentCompany();
      setCompany(activeCompany);
    } catch (err) {
      console.error('Error fetching company details:', err);
      setCompany(null);
    } finally {
      setLoadingCompany(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [user]);

  const refreshCompany = async () => {
    await fetchCompany();
  };

  const updateCompanyDetails = async (details: Partial<Empresa>) => {
    if (!company) return;
    try {
      await dbService.updateDocument<Empresa>('empresas', company.id, details);
      setCompany(prev => prev ? { ...prev, ...details } : null);
    } catch (err) {
      console.error('Error updating company details:', err);
      throw err;
    }
  };

  const selectCompany = (emp: Empresa | null) => {
    setCompany(emp);
    if (emp && typeof window !== 'undefined') {
      const session = localStorage.getItem('sv_auth_session');
      if (session) {
        const parsed = JSON.parse(session);
        parsed.empresaId = emp.id;
        localStorage.setItem('sv_auth_session', JSON.stringify(parsed));
      }
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        loadingCompany,
        refreshCompany,
        updateCompanyDetails,
        selectCompany
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
