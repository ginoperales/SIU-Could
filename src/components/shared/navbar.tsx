'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { Sun, Moon, LogOut, Shield, Building2, User } from 'lucide-react';
import { Badge } from '../ui/custom';

export function Navbar() {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const [darkMode, setDarkMode] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Initialize theme from system preference or local storage
  useEffect(() => {
    const isDark = localStorage.getItem('sv_theme') === 'dark' || 
      (!localStorage.getItem('sv_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sv_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sv_theme', 'light');
    }
  };

  const getRoleColor = (rol: string) => {
    switch (rol) {
      case 'Super Administrador': return 'danger';
      case 'Administrador': return 'secondary';
      case 'Contador': return 'success';
      case 'Gerente': return 'info';
      default: return 'neutral';
    }
  };

  return (
    <header className="sticky top-0 right-0 left-0 z-20 flex items-center justify-between px-6 py-4 glass-panel border-b border-border h-16 w-full">
      {/* Active Company Name or SaaS Control Status */}
      <div className="flex items-center gap-2">
        {user?.rol === 'Super Administrador' ? (
          <>
            <Shield className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="font-bold text-sm md:text-base text-foreground tracking-tight">
              ContaCould SaaS Master
            </span>
            <Badge variant="danger" className="scale-90 px-1.5 py-0">SaaS Admin</Badge>
          </>
        ) : (
          <>
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm md:text-base text-foreground truncate max-w-[200px] md:max-w-xs">
              {company ? company.razonSocial : 'Cargando Empresa...'}
            </span>
            {company && (
              <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                RUC: {company.ruc}
              </span>
            )}
          </>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer outline-none transition-colors border border-transparent hover:border-border"
          aria-label="Alternar tema oscuro"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-[1px] bg-border hidden sm:block" />

        {/* User Profile Info & Avatar */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 hover:bg-muted/60 p-1.5 px-2.5 rounded-lg border border-transparent hover:border-border cursor-pointer outline-none transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col items-start gap-0.5">
                <span className="text-sm font-semibold text-foreground line-clamp-1">{user.nombre}</span>
                <Badge variant={getRoleColor(user.rol)} className="scale-90 origin-left px-1.5 py-0">
                  {user.rol}
                </Badge>
              </div>
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl p-2 z-20 flex flex-col gap-1 animate-slide-up">
                  <div className="px-3 py-2 border-b border-border flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Sesión Activa</span>
                    <span className="text-sm font-bold text-foreground line-clamp-1">{user.nombre}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                  
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      Permisos: {user.rol}
                    </div>
                  </div>

                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-left cursor-pointer outline-none transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
