'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { dbService } from '../../core/services/firebase';
import { Funcionalidad, RubroComercial } from '../../core/models/types';
import { Card, Badge, Button, Alert } from '../ui/custom';
import { 
  Sparkles, 
  CheckCircle2, 
  Download, 
  Trash2, 
  Info,
  Layers,
  Heart,
  PackageCheck,
  Grid,
  Check,
  Plus
} from 'lucide-react';

export function TiendaAppsModule() {
  const { company, updateCompanyDetails } = useCompany();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Funcionalidad[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'todas' | 'recomendadas' | 'instaladas' | 'disponibles'>('todas');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    loadApps();
  }, [company]);

  const loadApps = async () => {
    setLoading(true);
    try {
      const list = await dbService.getAllFuncionalidades();
      setApps(list.filter(a => a.activo));
    } catch (err) {
      console.error('Error fetching functionalities for app store:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prevent SSR hydration errors
  if (!mounted || !company) return null;

  const currentRubro = company.rubro || 'Comercio';
  const enabledApps = company.funcionalidadesHabilitadas || [];

  const handleInstallApp = async (appId: string, appName: string) => {
    setActioningId(appId);
    setSuccessMsg('');
    setErrorMsg('');
    
    // Artificial mini-loader for premium feel
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const updatedEnabled = [...enabledApps];
      if (!updatedEnabled.includes(appId)) {
        updatedEnabled.push(appId);
      }
      
      await updateCompanyDetails({
        funcionalidadesHabilitadas: updatedEnabled
      });

      setSuccessMsg(`¡Módulo "${appName}" activado con éxito! Ya puedes acceder desde la barra de navegación.`);
      
      // Auto fadeout message
      setTimeout(() => {
        setSuccessMsg('');
      }, 5000);
    } catch (err) {
      setErrorMsg('Error al activar el módulo.');
    } finally {
      setActioningId(null);
    }
  };

  const handleUninstallApp = async (appId: string, appName: string) => {
    setActioningId(appId);
    setSuccessMsg('');
    setErrorMsg('');

    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const updatedEnabled = enabledApps.filter(id => id !== appId);
      
      await updateCompanyDetails({
        funcionalidadesHabilitadas: updatedEnabled
      });

      setSuccessMsg(`Módulo "${appName}" desactivado correctamente.`);
      
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch (err) {
      setErrorMsg('Error al desactivar el módulo.');
    } finally {
      setActioningId(null);
    }
  };

  // Filter apps according to active sub-tab
  const filteredApps = apps.filter(app => {
    const isInstalled = enabledApps.includes(app.id);
    const isRecommended = app.rubrosRecomendados.includes(currentRubro);
    
    if (activeSubTab === 'recomendadas') return isRecommended;
    if (activeSubTab === 'instaladas') return isInstalled;
    if (activeSubTab === 'disponibles') return !isInstalled;
    return true; // 'todas'
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Page Header */}
      <div className="flex justify-between items-start flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 tracking-tight">
            Tienda de Aplicaciones (App Store)
            <Badge variant="primary" className="scale-90 font-bold bg-indigo-500/20 text-indigo-400 border-indigo-900/50">Marketplace</Badge>
          </h1>
          <p className="text-sm text-slate-500">
            Personaliza y extiende el ERP modular de <strong>{company.razonSocial}</strong>. Activa o desactiva módulos al instante según tus necesidades contables.
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-xl flex flex-col gap-0.5 shrink-0 text-right">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rubro de la Empresa</span>
          <span className="text-sm font-extrabold text-white flex items-center gap-1.5 justify-end">
            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block animate-pulse" />
            {currentRubro}
          </span>
        </div>
      </div>

      {successMsg && <Alert variant="success">{successMsg}</Alert>}
      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

      {/* Sub-tab Navigation filters */}
      <div className="flex flex-wrap gap-2 border-b border-slate-850 pb-4">
        {[
          { id: 'todas', label: 'Todas las Apps', count: apps.length },
          { id: 'recomendadas', label: `Recomendadas (${currentRubro})`, count: apps.filter(a => a.rubrosRecomendados.includes(currentRubro)).length },
          { id: 'instaladas', label: 'Mis Apps Instaladas', count: enabledApps.length },
          { id: 'disponibles', label: 'Disponibles para Instalar', count: apps.length - enabledApps.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer outline-none ${
              activeSubTab === tab.id
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10'
                : 'bg-slate-900/40 text-slate-400 border-slate-850 hover:bg-slate-900/80 hover:text-white'
            }`}
          >
            {tab.label}
            <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full ${
              activeSubTab === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-850 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid of Apps */}
      {loading ? (
        <div className="text-center py-20 text-slate-500">Cargando tienda de aplicaciones...</div>
      ) : filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-950/20 gap-3">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-850 text-slate-500">
            <Layers className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <span className="font-bold text-slate-300">No se encontraron aplicaciones</span>
            <span className="text-xs text-slate-500">
              No hay módulos que coincidan con la categoría seleccionada en este momento.
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map(app => {
            const isInstalled = enabledApps.includes(app.id);
            const isRecommended = app.rubrosRecomendados.includes(currentRubro);
            const isActioning = actioningId === app.id;
            
            return (
              <Card 
                key={app.id} 
                className={`flex flex-col border transition-all duration-300 relative overflow-hidden bg-slate-900/40 backdrop-blur-xl ${
                  isInstalled 
                    ? 'border-indigo-500/40 shadow-lg shadow-indigo-950/10' 
                    : 'border-slate-850 hover:border-slate-800 hover:scale-[1.01]'
                }`}
              >
                {/* Glow behind installed apps */}
                {isInstalled && (
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                )}

                <Card className="border-0 bg-transparent p-5 flex-1 flex flex-col gap-4">
                  {/* Card Title & Icon */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl shrink-0 transition-transform ${
                        isInstalled 
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' 
                          : 'bg-slate-950/80 text-slate-400 border border-slate-850'
                      }`}>
                        {/* Dynamic representations of lucide icons */}
                        <Grid className="w-5 h-5" />
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-bold text-white leading-snug">{app.nombre}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{app.categoria}</span>
                      </div>
                    </div>

                    {/* Installed Indicator badge */}
                    {isInstalled ? (
                      <Badge variant="success" className="scale-90 font-bold">Instalada</Badge>
                    ) : (
                      <Badge variant="secondary" className="scale-90 font-bold">Disponible</Badge>
                    )}
                  </div>

                  {/* App Description */}
                  <p className="text-xs text-slate-400 leading-relaxed flex-1">
                    {app.descripcion}
                  </p>

                  {/* Recommended list tags */}
                  <div className="flex flex-wrap gap-1 items-center mt-1">
                    <span className="text-[10px] text-slate-500 mr-1">Rubros sugeridos:</span>
                    {app.rubrosRecomendados.map(r => (
                      <span 
                        key={r} 
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${
                          r === currentRubro 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-900/50' 
                            : 'bg-slate-950 text-slate-500 border-slate-850'
                        }`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  {/* Action row */}
                  <div className="border-t border-slate-850/80 pt-4 mt-2 flex justify-between items-center">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Suscripción</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {app.precioMensual === 0 ? (
                          <span className="text-emerald-400 font-semibold">Gratis (Incluida)</span>
                        ) : (
                          `S/. ${app.precioMensual.toFixed(2)}/mes`
                        )}
                      </span>
                    </div>

                    {isInstalled ? (
                      <Button
                        onClick={() => handleUninstallApp(app.id, app.nombre)}
                        disabled={isActioning}
                        className="flex items-center gap-1 bg-red-950/30 border border-red-900/40 text-red-400 hover:bg-red-900 hover:text-white px-3.5 py-1.5 text-xs font-bold scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isActioning ? 'Desinstalando...' : 'Desinstalar'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleInstallApp(app.id, app.nombre)}
                        disabled={isActioning}
                        className="flex items-center gap-1.5 bg-gradient-to-tr from-indigo-600 to-primary font-bold hover:from-indigo-500 hover:to-primary hover:shadow-indigo-500/10 px-4 py-2 text-xs text-white scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isActioning ? 'Instalando...' : 'Habilitar Módulo'}
                      </Button>
                    )}
                  </div>
                </Card>
              </Card>
            );
          })}
        </div>
      )}

      {/* Extended Features Info Banner */}
      <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between mt-4 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-3 rounded-2xl text-indigo-400 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-white text-sm">¿Deseas una funcionalidad personalizada para tu negocio?</span>
            <p className="text-xs text-slate-500 max-w-xl">
              ContaCloud cuenta con un canal de desarrollo de software modular directo. Tu Super-Administrador puede programar aplicaciones y extender el dashboard con módulos a medida.
            </p>
          </div>
        </div>
        <div className="shrink-0 text-xs text-slate-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-850 flex items-center gap-1.5 font-bold">
          <Info className="w-4 h-4 text-indigo-400" />
          Soporte SaaS Disponible
        </div>
      </div>
    </div>
  );
}
