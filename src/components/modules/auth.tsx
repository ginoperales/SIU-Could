'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input, Select, Card, Badge, Alert } from '../ui/custom';
import { Calculator, Sparkles, Building2, KeyRound, UserCheck, LogIn } from 'lucide-react';
import { dbService } from '../../core/services/firebase';
import { Promocion } from '../../core/models/types';

interface AuthProps {
  onBackToLanding?: () => void;
}

export function AuthModule({ onBackToLanding }: AuthProps = {}) {
  const { login, loginWithGoogle, register, recoverPassword } = useAuth();
  
  const [view, setView] = useState<'login' | 'register' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [ruc, setRuc] = useState('');
  
  // Subscription and Coupon States
  const [plan, setPlan] = useState('Plan Corporativo');
  const [cuponCode, setCuponCode] = useState('');
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<Promocion | null>(null);

  // Load promotions on mount
  useEffect(() => {
    const loadPromos = async () => {
      try {
        const list = await dbService.getAllPromociones();
        setPromociones(list);
      } catch (err) {
        console.error('Error loading promotions in auth:', err);
      }
    };
    loadPromos();
  }, []);

  // Validate coupon code in real-time
  useEffect(() => {
    if (!cuponCode.trim()) {
      setAppliedDiscount(null);
      return;
    }
    const nowStr = new Date().toISOString().split('T')[0];
    const found = promociones.find(
      p => p.codigo.trim().toUpperCase() === cuponCode.trim().toUpperCase() && 
           p.activo &&
           nowStr >= p.fechaInicio &&
           nowStr <= p.fechaFin
    );
    setAppliedDiscount(found || null);
  }, [cuponCode, promociones]);

  // RUC Auto-Lookup States
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState('');

  // DNI Auto-Lookup States
  const [dni, setDni] = useState('');
  const [loadingDni, setLoadingDni] = useState(false);
  const [dniError, setDniError] = useState('');
  const [dniValid, setDniValid] = useState(false);

  // Auto fetch company details by RUC from SUNAT
  useEffect(() => {
    if (ruc.length === 11 && /^\d+$/.test(ruc)) {
      const fetchRucDetails = async () => {
        setLoadingRuc(true);
        setRucError('');
        try {
          const { consultarRuc } = await import('../../core/utils/sunat');
          const data = await consultarRuc(ruc);
          if (data) {
            setRazonSocial(data.razonSocial);
            setRucError('');
          } else {
            setRucError('RUC no registrado en SUNAT. Ingrésalo manualmente.');
          }
        } catch (err) {
          console.error('Error auto-querying RUC:', err);
          setRucError('Error de consulta SUNAT. Ingrésalo manualmente.');
        } finally {
          setLoadingRuc(false);
        }
      };
      fetchRucDetails();
    } else {
      setRucError('');
    }
  }, [ruc]);

  // Auto-validate DNI via API
  useEffect(() => {
    if (dni.length === 8 && /^\d+$/.test(dni)) {
      const fetchDniDetails = async () => {
        setLoadingDni(true);
        setDniError('');
        setDniValid(false);
        try {
          const { consultarDni } = await import('../../core/utils/sunat');
          const data = await consultarDni(dni);
          if (data) {
            // Auto-fill name if empty
            if (!nombre && data.nombreCompleto) {
              setNombre(data.nombreCompleto);
            }
            setDniValid(true);
            setDniError('');
          } else {
            setDniValid(false);
            setDniError('DNI no encontrado en el padrón electoral. Verifica el número.');
          }
        } catch (err) {
          console.error('Error querying DNI:', err);
          setDniError('Error al validar DNI. Ingrésalo y continúa.');
        } finally {
          setLoadingDni(false);
        }
      };
      fetchDniDetails();
    } else {
      setDniError('');
      setDniValid(false);
    }
  }, [dni]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }
    
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Error de credenciales.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nombre || !razonSocial || !ruc || !dni) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (dni.length !== 8 || !/^\d+$/.test(dni)) {
      setError('El DNI debe tener exactamente 8 dígitos numéricos.');
      return;
    }
    if (ruc.length !== 11 || !/^\d+$/.test(ruc)) {
      setError('El RUC en Perú debe constar de exactamente 11 dígitos numéricos.');
      return;
    }

    const pct = appliedDiscount ? appliedDiscount.porcentajeDescuento : 0;
    const baseCost = plan === 'Plan Corporativo' ? 149 : 0;
    const finalCost = baseCost * (1 - pct / 100);

    setError('');
    setSubmitting(true);
    try {
      await register(
        email, 
        password,
        nombre, 
        razonSocial, 
        ruc, 
        plan, 
        appliedDiscount ? appliedDiscount.codigo : undefined, 
        pct > 0 ? pct : undefined, 
        finalCost
      );
    } catch (err: any) {
      setError(err.message || 'Error al registrar la empresa.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Ingresa tu correo electrónico.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await recoverPassword(email);
      setSuccess('Se ha enviado un enlace de recuperación a tu correo electrónico.');
      setTimeout(() => {
        setView('login');
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al enviar enlace.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError('Error al iniciar sesión con Google.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Dynamic abstract grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
      
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md z-10 animate-slide-up">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 mb-6 text-center">
          <div className="bg-gradient-to-tr from-primary to-emerald-500 p-3.5 rounded-2xl text-white shadow-xl shadow-primary/20">
            <Calculator className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 justify-center">
              ContaCould
              <Badge variant="success" className="scale-90 px-2 py-0.5">SaaS</Badge>
            </h1>
            <p className="text-sm text-slate-400">
              {view === 'login' && 'Gestión Financiera Integral y Facturación Perú'}
              {view === 'register' && 'Crea tu cuenta multiempresa en minutos'}
              {view === 'recover' && 'Recupera tu acceso empresarial'}
            </p>
          </div>
        </div>

        {/* Card Container */}
        <Card className="border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-8 flex flex-col gap-5 rounded-2xl">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Input
                label="CORREO ELECTRÓNICO CORPORATIVO"
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 focus:border-primary text-white"
              />

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-400">CONTRASEÑA</label>
                  <button
                    type="button"
                    onClick={() => setView('recover')}
                    className="text-xs text-primary hover:text-primary-hover font-semibold cursor-pointer outline-none"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 focus:border-primary text-white"
                />
              </div>



              <Button type="submit" disabled={submitting} className="w-full font-semibold">
                {submitting ? 'Verificando...' : 'Iniciar Sesión'}
              </Button>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {/* DNI Validation */}
              <div className="relative flex flex-col gap-1">
                <div className="relative">
                  <Input
                    label="TU DNI (8 DÍGITOS) *"
                    placeholder="Ej. 45892019"
                    value={dni}
                    onChange={e => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    maxLength={8}
                    required
                    className={`bg-slate-950 border-slate-800 focus:border-primary text-white pr-10 ${dniValid ? 'border-emerald-600 focus:border-emerald-500' : ''}`}
                  />
                  {loadingDni && (
                    <span className="text-[10px] text-primary font-bold absolute right-3 top-[38px] animate-pulse">
                      Verificando RENIEC...
                    </span>
                  )}
                  {dniValid && !loadingDni && (
                    <span className="text-[10px] text-emerald-400 font-bold absolute right-3 top-[38px] flex items-center gap-0.5">
                      ✓ DNI Válido
                    </span>
                  )}
                </div>
                {dniError && (
                  <span className="text-[10px] text-rose-500 font-medium pl-1">{dniError}</span>
                )}
              </div>

              <Input
                label="TU NOMBRE COMPLETO"
                placeholder="Ej. Carlos Mendoza"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 focus:border-primary text-white"
              />

              <Input
                label="CORREO CORPORATIVO"
                type="email"
                placeholder="carlos@empresa.pe"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 focus:border-primary text-white"
              />

              <Input
                label="CONTRASEÑA DE ACCESO"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 focus:border-primary text-white"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative flex flex-col">
                  <Input
                    label="RUC DE LA EMPRESA (11 DÍGITOS)"
                    placeholder="20601234567"
                    value={ruc}
                    onChange={e => setRuc(e.target.value)}
                    maxLength={11}
                    required
                    className="bg-slate-950 border-slate-800 focus:border-primary text-white pr-28"
                  />
                  {loadingRuc && (
                    <span className="text-[10px] text-primary font-bold absolute right-3 top-[38px] animate-pulse">
                      Buscando SUNAT...
                    </span>
                  )}
                  {rucError && (
                    <span className="text-[10px] text-rose-500 font-medium mt-1 pl-1">
                      {rucError}
                    </span>
                  )}
                </div>
                <Input
                  label="RAZÓN SOCIAL (SUNAT)"
                  placeholder="Mi Empresa S.A.C."
                  value={razonSocial}
                  onChange={e => setRazonSocial(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 focus:border-primary text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="PLAN DE SUSCRIPCIÓN"
                  options={[
                    { value: 'Plan Corporativo', label: 'Plan Corporativo (S/. 149/mes)' },
                    { value: 'Plan Emprendedor', label: 'Plan Emprendedor (Gratuito)' }
                  ]}
                  value={plan}
                  onChange={e => setPlan(e.target.value)}
                  className="bg-slate-950 border-slate-800 focus:border-primary text-white"
                />
                <Input
                  label="CÓDIGO DE DESCUENTO"
                  placeholder="Ej. BIENVENIDO2026"
                  value={cuponCode}
                  onChange={e => setCuponCode(e.target.value)}
                  className="bg-slate-950 border-slate-800 focus:border-primary text-white font-mono uppercase"
                />
              </div>

              {/* Coupon Feedback */}
              {cuponCode.trim() !== '' && (
                <div className="mt-1">
                  {appliedDiscount ? (
                    <div className="text-xs bg-emerald-950/40 border border-emerald-900/50 p-2.5 rounded-lg text-emerald-400 font-medium flex flex-col gap-0.5 animate-slide-up">
                      <span className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 fill-emerald-500/20 text-emerald-400 animate-pulse" />
                        ¡Cupón "{appliedDiscount.codigo}" aplicado!
                      </span>
                      <span>Descuento de {appliedDiscount.porcentajeDescuento}% válido para {appliedDiscount.tipoPlan || 'planes corporativos'}.</span>
                      <span className="font-bold mt-1 text-[11px] text-white">
                        Costo mensual final: S/. {(plan === 'Plan Corporativo' ? 149 * (1 - appliedDiscount.porcentajeDescuento / 100) : 0).toFixed(2)} / mes
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs bg-red-950/40 border border-red-900/50 p-2 rounded-lg text-red-400 animate-slide-up">
                      El código de descuento no es válido o ya expiró.
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full font-semibold">
                {submitting ? 'Registrando...' : 'Registrar Empresa & Usuario'}
              </Button>
            </form>
          )}

          {view === 'recover' && (
            <form onSubmit={handleRecover} className="flex flex-col gap-4">
              <Input
                label="CORREO ELECTRÓNICO REGISTRADO"
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 focus:border-primary text-white"
              />

              <Button type="submit" disabled={submitting} className="w-full font-semibold">
                {submitting ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
              </Button>

              <button
                type="button"
                onClick={() => setView('login')}
                className="text-xs text-slate-400 hover:text-white font-semibold text-center mt-2 cursor-pointer outline-none"
              >
                Volver al inicio de sesión
              </button>
            </form>
          )}

          {/* Social Sign In (Google) */}
          {view === 'login' && (
            <div className="flex flex-col gap-4">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold uppercase">O entrar con</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 py-2 px-4 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold cursor-pointer outline-none transition-all active:scale-98"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.6-4.53-6.16-4.53z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>
            </div>
          )}

          {/* Toggle Login/Register footer */}
          <div className="border-t border-slate-800 pt-4 text-center">
            {view === 'login' ? (
              <span className="text-xs text-slate-400">
                ¿No tienes cuenta registrada?{' '}
                <button
                  onClick={() => setView('register')}
                  className="text-primary hover:text-primary-hover font-bold cursor-pointer outline-none"
                >
                  Regístrate ahora
                </button>
              </span>
            ) : (
              view === 'register' && (
                <span className="text-xs text-slate-400">
                  ¿Ya tienes una cuenta?{' '}
                  <button
                    onClick={() => setView('login')}
                    className="text-primary hover:text-primary-hover font-bold cursor-pointer outline-none"
                  >
                    Inicia Sesión
                  </button>
                </span>
              )
            )}
          </div>
        </Card>

        {onBackToLanding && (
          <div className="text-center mt-6">
            <button
              onClick={onBackToLanding}
              className="text-xs text-slate-500 hover:text-slate-300 font-semibold cursor-pointer outline-none transition-colors"
            >
              ← Volver a la página de inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
