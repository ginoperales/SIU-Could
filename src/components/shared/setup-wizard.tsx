'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { dbService } from '../../core/services/firebase';
import { Funcionalidad, RubroComercial } from '../../core/models/types';
import { Button, Card, Badge, Alert } from '../ui/custom';
import { 
  ShoppingBag, 
  Briefcase, 
  Factory, 
  HardHat, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Calculator,
  Laptop,
  CheckSquare,
  Square
} from 'lucide-react';

interface SetupWizardModalProps {
  onComplete?: () => void;
}

export function SetupWizardModal({ onComplete }: SetupWizardModalProps) {
  const { company, updateCompanyDetails } = useCompany();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedRubro, setSelectedRubro] = useState<RubroComercial | null>(null);
  const [availableApps, setAvailableApps] = useState<Funcionalidad[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Simulated configuration state messages
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [simulatedMessage, setSimulatedMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    const fetchApps = async () => {
      try {
        const apps = await dbService.getAllFuncionalidades();
        setAvailableApps(apps.filter(app => app.activo));
      } catch (err) {
        console.error('Error fetching functionalities for setup wizard:', err);
      }
    };
    fetchApps();
  }, []);

  // Prevent SSR hydration issues
  if (!mounted || !company || company.rubro) return null;

  const rubros = [
    {
      id: 'Comercio' as RubroComercial,
      title: 'Comercio y Retail',
      desc: 'Venta de mercaderías físicas, control exhaustivo de stock de productos y auditoría Kardex.',
      icon: <ShoppingBag className="w-8 h-8" />,
      colorClass: 'from-emerald-500 to-teal-600 shadow-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:border-emerald-500',
      badge: 'Sugerido para Importadoras, Tiendas, Ferreterías'
    },
    {
      id: 'Servicios' as RubroComercial,
      title: 'Servicios Profesionales',
      desc: 'Facturación de intangibles, honorarios, cuentas por cobrar y consultoría externa.',
      icon: <Briefcase className="w-8 h-8" />,
      colorClass: 'from-blue-500 to-indigo-600 shadow-blue-950/20 text-blue-400 border-blue-900/30 hover:border-blue-500',
      badge: 'Sugerido para Consultoras, Agencias, Profesionales Libres'
    },
    {
      id: 'Manufactura' as RubroComercial,
      title: 'Manufactura y Producción',
      desc: 'Procesamiento de materias primas, costos de producción, planillas de obreros y almacenes.',
      icon: <Factory className="w-8 h-8" />,
      colorClass: 'from-amber-500 to-orange-600 shadow-amber-950/20 text-amber-400 border-amber-900/30 hover:border-amber-500',
      badge: 'Sugerido para Fábricas, Confecciones, Panaderías'
    },
    {
      id: 'Construcción' as RubroComercial,
      title: 'Construcción e Ingeniería',
      desc: 'Gestión de proyectos, control de suministros pesados, planillas mype y subcontratas.',
      icon: <HardHat className="w-8 h-8" />,
      colorClass: 'from-rose-500 to-pink-600 shadow-rose-950/20 text-rose-400 border-rose-900/30 hover:border-rose-500',
      badge: 'Sugerido para Constructoras, Contratistas, Ingenierías'
    }
  ];

  const handleSelectRubro = (rubro: RubroComercial) => {
    setSelectedRubro(rubro);
    
    // Auto-select recommended modules for the chosen Rubro
    const recommendedIds = availableApps
      .filter(app => app.esDefault || app.rubrosRecomendados.includes(rubro))
      .map(app => app.id);
    
    setSelectedApps(recommendedIds);
    setStep(2);
  };

  const handleToggleApp = (appId: string) => {
    setSelectedApps(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId) 
        : [...prev, appId]
    );
  };

  const handleConfirmSetup = async () => {
    if (!selectedRubro) return;
    setStep(3);
    setSaving(true);
    setError('');

    // Simulated progress steps for a highly interactive and visual onboarding experience
    const steps = [
      { p: 15, msg: 'Inicializando base de datos tenant...' },
      { p: 40, msg: 'Enlazando módulos y permisos de rol...' },
      { p: 65, msg: 'Habilitando planillas y cuentas contables para ' + selectedRubro + '...' },
      { p: 85, msg: 'Configurando asistente financiero de IA...' },
      { p: 100, msg: '¡Listo! Espacio de trabajo ContaCloud configurado.' }
    ];

    for (const s of steps) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setSimulatedProgress(s.p);
      setSimulatedMessage(s.msg);
    }

    try {
      // Save rubro and enabled features to the company document
      await updateCompanyDetails({
        rubro: selectedRubro,
        funcionalidadesHabilitadas: selectedApps
      });
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Error in SetupWizardModal:', err);
      setError('Ocurrió un error al guardar la configuración comercial.');
      setStep(2);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 overflow-y-auto">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col my-8">
        
        {/* Top Progress bar */}
        <div className="h-1.5 w-full bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Wizard Content */}
        <div className="p-6 md:p-10 flex-1 flex flex-col gap-6">
          
          {/* Header Banner */}
          <div className="flex flex-col items-center text-center gap-2 max-w-2xl mx-auto">
            <div className="bg-gradient-to-tr from-primary to-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-primary/25 mb-2">
              <Calculator className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Configura tu ContaCould
              <Badge variant="primary" className="scale-90 px-2 py-0.5">Wizard</Badge>
            </h1>
            <p className="text-sm text-slate-400">
              Personalizaremos tu ERP contable según tu rubro comercial para que tengas una experiencia fluida, rápida y libre de campos innecesarios.
            </p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* STEP 1: SELECT RUBRO */}
          {step === 1 && (
            <div className="flex flex-col gap-6 mt-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                Paso 1: Selecciona la industria o rubro de tu empresa
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rubros.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectRubro(item.id)}
                    className="group border rounded-2xl p-6 text-left bg-slate-950/40 transition-all duration-300 hover:bg-slate-950/80 hover:scale-[1.01] cursor-pointer outline-none relative overflow-hidden flex flex-col gap-3"
                  >
                    {/* Hover ambient light */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-slate-800/10 pointer-events-none" />
                    
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-tr ${item.colorClass} text-white group-hover:scale-110 transition-transform`}>
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white group-hover:text-primary transition-colors">{item.title}</span>
                        <Badge variant="secondary" className="text-[9px] scale-90 -ml-2.5 mt-0.5 font-bold py-0">{item.id}</Badge>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>

                    <div className="mt-auto pt-3 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-semibold">{item.badge}</span>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: FINE-TUNE FEATURE SELECTION */}
          {step === 2 && selectedRubro && (
            <div className="flex flex-col gap-6 mt-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-850 pb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Paso 2: Confirma tus módulos y aplicaciones habilitadas
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Hemos marcado los módulos recomendados para el rubro <strong className="text-primary">{selectedRubro}</strong>. Puedes desactivar o añadir módulos.
                  </span>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer outline-none bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shrink-0"
                >
                  ← Cambiar Rubro
                </button>
              </div>

              {/* Grid of Apps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin">
                {availableApps.map(app => {
                  const isChecked = selectedApps.includes(app.id);
                  const isRecommended = app.rubrosRecomendados.includes(selectedRubro);
                  
                  return (
                    <div
                      key={app.id}
                      onClick={() => handleToggleApp(app.id)}
                      className={`border rounded-xl p-4 flex flex-col gap-2.5 transition-all cursor-pointer select-none ${
                        isChecked 
                          ? 'bg-slate-950/60 border-primary shadow-lg shadow-primary/5' 
                          : 'bg-slate-950/20 border-slate-850 hover:border-slate-800 hover:bg-slate-950/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${isChecked ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'}`}>
                            {/* Simple dynamic representation helper for icons */}
                            <Laptop className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-white">{app.nombre}</span>
                        </div>
                        
                        {/* Checkbox state */}
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 leading-normal flex-1">
                        {app.descripcion}
                      </p>

                      <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-slate-850/60 justify-between text-[9px]">
                        <span className="font-semibold text-slate-500 font-mono">
                          {app.precioMensual === 0 ? 'Gratuito (Core)' : `S/. ${app.precioMensual}/mes`}
                        </span>
                        {isRecommended && (
                          <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                            Recomendado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confirm Action */}
              <div className="border-t border-slate-800 pt-4 flex justify-between items-center mt-2">
                <div className="text-xs text-slate-400">
                  <span className="font-bold text-white">{selectedApps.length}</span> módulos seleccionados
                </div>
                <Button
                  onClick={handleConfirmSetup}
                  className="flex items-center gap-1.5 bg-gradient-to-tr from-primary to-emerald-500 font-bold px-6 py-2 shadow-lg shadow-primary/20"
                >
                  Confirmar e Ingresar al ERP
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: LOADING ANIMATION SCREEN */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-6 mt-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Spinning loader outer rim */}
                <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-primary border-r-emerald-500 animate-spin" />
                
                {/* Pulsing core inner */}
                <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center text-white border border-slate-800 shadow-xl shadow-primary/10">
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 max-w-md">
                <span className="text-xs font-bold text-primary tracking-widest uppercase animate-pulse">
                  Configurando Entorno Comercial
                </span>
                <span className="text-sm font-semibold text-white mt-1">
                  {simulatedMessage}
                </span>
              </div>

              {/* Simulated progress slider */}
              <div className="w-full max-w-sm h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300"
                  style={{ width: `${simulatedProgress}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Brand footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 text-center text-[10px] text-slate-500">
          ContaCloud ERP Perú · Configuración de Tenant Autogestionada
        </div>

      </div>
    </div>
  );
}
