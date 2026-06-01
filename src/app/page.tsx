'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCompany } from '../hooks/useCompany';
import { Sidebar } from '../components/shared/sidebar';
import { Navbar } from '../components/shared/navbar';
import { PromoBanner } from '../components/shared/promobanner';
import { SetupWizardModal } from '../components/shared/setup-wizard';

// Modules imports
import { AuthModule } from '../components/modules/auth';
import { DashboardModule } from '../components/modules/dashboard';
import { CajaModule } from '../components/modules/caja';
import { BancosModule } from '../components/modules/bancos';
import { ContactosModule } from '../components/modules/contactos';
import { ComprasModule } from '../components/modules/compras';
import { VentasModule } from '../components/modules/ventas';
import { CuentasModule } from '../components/modules/cuentas';
import { InventarioModule } from '../components/modules/inventario';
import { RecursoHumanoModule } from '../components/modules/rrhh';
import { ReportesModule } from '../components/modules/reportes';
import { AnalistaIaModule } from '../components/modules/ia';
import { LandingModule } from '../components/modules/landing';
import { SuperAdminModule } from '../components/modules/superadmin';
import { ConfiguracionModule } from '../components/modules/configuracion';
import { TiendaAppsModule } from '../components/modules/tienda-apps';

import { Calculator } from 'lucide-react';
import { bootstrapSuperAdmin } from '../core/services/firebase';

export default function Home() {
  const { user, loading } = useAuth();
  const { company, loadingCompany } = useCompany();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);

  // Auto-land Super Admin on SaaS Console
  useEffect(() => {
    if (user?.rol === 'Super Administrador') {
      setActiveTab('superadmin');
    } else {
      setActiveTab('dashboard');
    }
  }, [user]);

  // Trigger one-time super admin bootstrapper in Firebase Auth/Firestore
  useEffect(() => {
    bootstrapSuperAdmin();
  }, []);

  // 1. Loading Splash Screen
  if (loading || (user && loadingCompany)) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
        {/* Pulsing Brand Logo Loader */}
        <div className="bg-gradient-to-tr from-primary to-emerald-500 p-4 rounded-2xl animate-pulse shadow-xl shadow-primary/25">
          <Calculator className="w-10 h-10 text-white" />
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="font-extrabold text-sm tracking-widest uppercase">CONTACOULD</span>
          <span className="text-xs text-slate-400">Verificando credenciales del servidor...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Screen (Landing Page by default, then AuthModule)
  if (!user) {
    if (showLogin) {
      return <AuthModule onBackToLanding={() => setShowLogin(false)} />;
    }
    return <LandingModule onEnterERP={() => setShowLogin(true)} />;
  }

  // 2.5 Intercept and show Setup Wizard if company has no Rubro set (except for Master Super Admin)
  if (company && !company.rubro && user.rol !== 'Super Administrador') {
    return <SetupWizardModal onComplete={() => setActiveTab('dashboard')} />;
  }

  // 3. Main ERP Application Shell
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground select-none">
      
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main Content Area */}
      <div 
        className={`flex flex-col flex-1 h-screen overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? 'pl-16' : 'pl-16 md:pl-64'
        }`}
      >
        {/* Top Promotional Banner */}
        <PromoBanner />

        {/* Header Bar */}
        <Navbar />

        {/* Dynamic Scrollable Panel Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/20">
          
          {/* Active Tab Router Switching */}
          {activeTab === 'superadmin' && <SuperAdminModule />}
          {activeTab === 'configuracion' && <ConfiguracionModule />}
          {activeTab === 'dashboard' && <DashboardModule />}
          {activeTab === 'caja' && <CajaModule />}
          {activeTab === 'bancos' && <BancosModule />}
          {activeTab === 'clientes' && <ContactosModule />}
          {activeTab === 'proveedores' && <ContactosModule />}
          {activeTab === 'compras' && <ComprasModule />}
          {activeTab === 'ventas' && <VentasModule />}
          {activeTab === 'por-cobrar' && <CuentasModule />}
          {activeTab === 'por-pagar' && <CuentasModule />}
          {activeTab === 'inventario' && <InventarioModule />}
          {activeTab === 'rrhh' && <RecursoHumanoModule />}
          {activeTab === 'reportes' && <ReportesModule />}
          {activeTab === 'ia' && <AnalistaIaModule />}
          {activeTab === 'tienda-apps' && <TiendaAppsModule />}
          
        </main>
      </div>
    </div>
  );
}
