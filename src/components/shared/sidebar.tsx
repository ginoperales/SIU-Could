'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Building, 
  Users, 
  Truck, 
  ShoppingBag, 
  FileText, 
  CalendarCheck, 
  CalendarClock, 
  Package, 
  Briefcase, 
  BarChart3, 
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Shield,
  Settings,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

export function Sidebar({ collapsed, setCollapsed, activeTab, setActiveTab }: SidebarProps) {
  const { user } = useAuth();
  const { company } = useCompany();
  
  // Base dashboard menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> }
  ];

  // List of optional modular applications
  const modularItems = [
    { id: 'caja', label: 'Caja Chica', icon: <Wallet className="w-5 h-5" /> },
    { id: 'bancos', label: 'Bancos', icon: <Building className="w-5 h-5" /> },
    { id: 'clientes', label: 'Clientes', icon: <Users className="w-5 h-5" /> },
    { id: 'proveedores', label: 'Proveedores', icon: <Truck className="w-5 h-5" /> },
    { id: 'compras', label: 'Compras', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'ventas', label: 'Ventas', icon: <FileText className="w-5 h-5" /> },
    { id: 'por-cobrar', label: 'Cuentas x Cobrar', icon: <CalendarCheck className="w-5 h-5" /> },
    { id: 'por-pagar', label: 'Cuentas x Pagar', icon: <CalendarClock className="w-5 h-5" /> },
    { id: 'inventario', label: 'Inventario', icon: <Package className="w-5 h-5" /> },
    { id: 'rrhh', label: 'Recursos Humanos', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'reportes', label: 'Reportes', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'ia', label: 'Analista IA', icon: <BrainCircuit className="w-5 h-5" /> }
  ];

  // Dynamically push enabled apps
  if (company && company.funcionalidadesHabilitadas) {
    const enabled = company.funcionalidadesHabilitadas;
    const filteredModules = modularItems.filter(item => enabled.includes(item.id));
    menuItems.push(...filteredModules);
  } else {
    // Fallback if not configured: show everything
    menuItems.push(...modularItems);
  }

  // App store link is always available to extend functionality
  menuItems.push({ 
    id: 'tienda-apps', 
    label: 'Tienda de Apps', 
    icon: <Sparkles className="w-5 h-5 text-indigo-400" /> 
  });

  if (user?.rol === 'Super Administrador') {
    menuItems.unshift({ 
      id: 'superadmin', 
      label: 'Consola SaaS', 
      icon: <Shield className="w-5 h-5 text-red-500" /> 
    });
  }

  if (user?.rol === 'Super Administrador' || user?.rol === 'Administrador') {
    menuItems.push({
      id: 'configuracion',
      label: 'Configuración',
      icon: <Settings className="w-5 h-5 text-emerald-500" />
    });
  }

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex-shrink-0 bg-primary hover:bg-primary-hover p-2 rounded-lg text-white">
            <Calculator className="w-5 h-5" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm tracking-wider uppercase text-white whitespace-nowrap animate-slide-up">
              CONTACOULD
            </span>
          )}
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer outline-none"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto scrollbar-none">
        {menuItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer outline-none ${
                isActive 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              {!collapsed && (
                <span className="truncate whitespace-nowrap animate-slide-up">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 overflow-hidden flex items-center justify-center">
        {!collapsed ? (
          <span className="whitespace-nowrap truncate animate-slide-up">ContaCould v1.0</span>
        ) : (
          <span>v1</span>
        )}
      </div>
    </aside>
  );
}
