'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { useAuth } from '../../hooks/useAuth';
import { dbService } from '../../core/services/firebase';
import { 
  Factura, 
  Compra, 
  MovimientoContable, 
  Banco, 
  Cliente, 
  Proveedor,
  Empresa,
  Usuario
} from '../../core/models/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input, Select, Alert } from '../ui/custom';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Scale, 
  AlertCircle,
  FileSpreadsheet,
  Wallet,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export function DashboardModule() {
  const { company, selectCompany } = useCompany();
  const { user, reloadUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Multi-Company and Modal States
  const [userCompanies, setUserCompanies] = useState<Empresa[]>([]);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  
  const [newRuc, setNewRuc] = useState('');
  const [newRazonSocial, setNewRazonSocial] = useState('');
  const [newNombreComercial, setNewNombreComercial] = useState('');
  const [newDireccion, setNewDireccion] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newPlan, setNewPlan] = useState('Plan Corporativo');
  
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [modalError, setModalError] = useState('');

  // States for DB data
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoContable[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);

  // Load user companies when user changes
  useEffect(() => {
    const loadUserCompanies = async () => {
      if (!user) return;
      try {
        const allComps = await dbService.getAllCompanies();
        const associatedIds = user.empresasAsociadas || [user.empresaId];
        const filtered = allComps.filter(c => associatedIds.includes(c.id));
        setUserCompanies(filtered);
      } catch (err) {
        console.error('Error loading user companies:', err);
      }
    };
    loadUserCompanies();
  }, [user, company]);

  // RUC Auto-Lookup in dashboard
  useEffect(() => {
    if (newRuc.length === 11 && /^\d+$/.test(newRuc)) {
      const fetchRucDetails = async () => {
        setLoadingRuc(true);
        setRucError('');
        try {
          const { consultarRuc } = await import('../../core/utils/sunat');
          const data = await consultarRuc(newRuc);
          if (data) {
            setNewRazonSocial(data.razonSocial);
            setNewNombreComercial(data.nombreComercial || data.razonSocial.replace(/(SAC|S\.A\.C\.|SA|S\.A\.|EIRL|E\.I\.R\.L\.)/i, '').trim());
            setNewDireccion(data.direccion || 'Dirección Comercial Registrada, Lima, Perú');
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
  }, [newRuc]);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuc || !newRazonSocial || !newDireccion) {
      setModalError('Por favor completa todos los campos obligatorios.');
      return;
    }
    if (newRuc.length !== 11 || !/^\d+$/.test(newRuc)) {
      setModalError('El RUC debe tener exactamente 11 dígitos.');
      return;
    }
    if (!user) return;

    setCreatingCompany(true);
    setModalError('');
    try {
      // 1. Add company using dbService
      const companyResult = await dbService.addDocument<any>('empresas', {
        razonSocial: newRazonSocial,
        nombreComercial: newNombreComercial || newRazonSocial.replace(/(SAC|S\.A\.C\.|SA|S\.A\.|EIRL|E\.I\.R\.L\.)/i, '').trim(),
        ruc: newRuc,
        direccion: newDireccion,
        telefono: newTelefono || undefined,
        email: newEmail || user.email,
        fechaCreacion: new Date().toISOString(),
        estado: 'activo',
        plan: newPlan,
        empresaId: ''
      } as any);
      const companyId = companyResult.id;

      // 2. Preload BCP Bank Account for the new company
      await dbService.addDocument<Banco>('bancos', {
        empresaId: companyId,
        banco: 'BCP',
        tipoCuenta: 'corriente',
        numeroCuenta: `191-${Math.floor(10000000 + Math.random() * 90000000)}-0-01`,
        moneda: 'PEN',
        saldoActual: 0.00,
        cci: `002-191-00${Math.floor(100000000000 + Math.random() * 900000000000)}-01`
      });

      // 3. Update User's empresasAsociadas list
      const associatedIds = [...(user.empresasAsociadas || [user.empresaId])];
      if (!associatedIds.includes(companyId)) {
        associatedIds.push(companyId);
      }
      await dbService.updateDocument<Usuario>('usuarios', user.id, {
        empresasAsociadas: associatedIds
      });

      // 4. Reload user and switch active company
      await reloadUser();
      selectCompany({
        id: companyId,
        razonSocial: newRazonSocial,
        nombreComercial: newNombreComercial || newRazonSocial.replace(/(SAC|S\.A\.C\.|SA|S\.A\.|EIRL|E\.I\.R\.L\.)/i, '').trim(),
        ruc: newRuc,
        direccion: newDireccion,
        email: newEmail || user.email,
        fechaCreacion: new Date().toISOString(),
        estado: 'activo',
        plan: newPlan
      });

      // Reset fields
      setNewRuc('');
      setNewRazonSocial('');
      setNewNombreComercial('');
      setNewDireccion('');
      setNewEmail('');
      setNewTelefono('');
      setShowAddCompanyModal(false);
    } catch (err) {
      console.error('Error creating company:', err);
      setModalError('Ocurrió un error al crear la empresa.');
    } finally {
      setCreatingCompany(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (company) {
      loadData();
    }
  }, [company]);

  const loadData = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [facs, cmps, movs, bncs] = await Promise.all([
        dbService.getDocuments<Factura>('facturas', company.id),
        dbService.getDocuments<Compra>('compras', company.id),
        dbService.getDocuments<MovimientoContable>('movimientos', company.id),
        dbService.getDocuments<Banco>('bancos', company.id)
      ]);
      setFacturas(facs);
      setCompras(cmps);
      setMovimientos(movs);
      setBancos(bncs);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!company) return <div className="p-6 text-center text-muted-foreground">Cargando datos de la empresa...</div>;
  if (loading) return <div className="p-6 text-center text-muted-foreground">Cargando métricas financieras...</div>;

  // ==========================================
  // CALCULATING METRIC VALUES
  // ==========================================
  
  // 1. Ventas del mes (May 2026 for simulation)
  const totalVentas = facturas
    .filter(f => f.estado !== 'anulado')
    .reduce((sum, f) => sum + f.total, 0);

  // 2. Compras del mes
  const totalCompras = compras.reduce((sum, c) => sum + c.total, 0);

  // 3. Gastos del mes (Total egresos from Ledger)
  const totalGastos = movimientos
    .filter(m => m.tipo === 'egreso')
    .reduce((sum, m) => sum + m.monto, 0);

  // 4. Utilidad Neta (Total ingresos - Total egresos)
  const totalIngresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + m.monto, 0);
  const utilidadNeta = totalIngresos - totalGastos;

  // 5. Flujo de Caja (Cash in bank + cash chica simulation)
  const saldoBancos = bancos.reduce((sum, b) => sum + b.saldoActual, 0);
  // Caja chica balance (Ingresos in cash - egresos in cash)
  const cashIngresos = movimientos.filter(m => m.cajaChica && m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
  const cashEgresos = movimientos.filter(m => m.cajaChica && m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
  const saldoCajaChica = 2500 + cashIngresos - cashEgresos; // Initial 2500 baseline
  const flujoCajaTotal = saldoBancos + saldoCajaChica;

  // 6. Cuentas por Cobrar (Pendiente facturas)
  const cuentasPorCobrar = facturas
    .filter(f => f.estado === 'pendiente')
    .reduce((sum, f) => sum + f.total, 0);

  // 7. Cuentas por Pagar (Simulating 30% of purchases as outstanding accounts payable)
  const cuentasPorPagar = compras
    .reduce((sum, c) => sum + c.total, 0) * 0.35; // Mock AP calculation

  // ==========================================
  // CHART PREPARATION DATA
  // ==========================================
  
  // Chart 1: Ingresos vs Egresos (Monthly comparison)
  const monthlyData = [
    { name: 'Feb', Ingresos: 6800, Egresos: 3200 },
    { name: 'Mar', Ingresos: 12500, Egresos: 7400 },
    { name: 'Abr', Ingresos: 18900, Egresos: 11200 },
    { name: 'May', Ingresos: parseFloat(totalIngresos.toFixed(2)), Egresos: parseFloat(totalGastos.toFixed(2)) }
  ];

  // Chart 2: Cumulative Cash Flow Trend
  const flowTrendData = [
    { name: 'Feb 1', Saldo: 15000 },
    { name: 'Feb 15', Saldo: 18200 },
    { name: 'Mar 1', Saldo: 22000 },
    { name: 'Mar 15', Saldo: 28500 },
    { name: 'Abr 1', Saldo: 34000 },
    { name: 'Abr 15', Saldo: 41000 },
    { name: 'May 1', Saldo: 49000 },
    { name: 'May 30', Saldo: parseFloat(flujoCajaTotal.toFixed(2)) }
  ];

  // Chart 3: Expenses by Category Distribution
  // Extract categories dynamically
  const expenseCategories: { [cat: string]: number } = {};
  movimientos
    .filter(m => m.tipo === 'egreso')
    .forEach(m => {
      expenseCategories[m.categoria] = (expenseCategories[m.categoria] || 0) + m.monto;
    });

  const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'];
  const pieData = Object.keys(expenseCategories).map(cat => ({
    name: cat,
    value: parseFloat(expenseCategories[cat].toFixed(2))
  }));

  if (pieData.length === 0) {
    pieData.push({ name: 'Sin Gastos', value: 1 });
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Welcome header with active RUC */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Dashboard Ejecutivo
            <Badge variant="success">En línea</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen contable y balances financieros de <strong>{company.razonSocial}</strong> en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-foreground hover:bg-muted cursor-pointer transition-all active:scale-98"
          >
            Actualizar Datos
          </button>
        </div>
      </div>

      {/* Multi-Company Selector & Manager (For Admins) */}
      {(user?.rol === 'Administrador' || user?.rol === 'Super Administrador') && (
        <Card className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-2 rounded-xl">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Consola Multiempresa de Administrador
            </span>
            <span className="text-[11px] text-slate-400">
              Estás gestionando {userCompanies.length} {userCompanies.length === 1 ? 'empresa activa' : 'empresas asociadas'} en ContaCould.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase pl-0.5">Cambiar de Empresa</label>
              <select
                value={company.id}
                onChange={(e) => {
                  const selected = userCompanies.find(c => c.id === e.target.value);
                  if (selected) selectCompany(selected);
                }}
                className="bg-slate-950 border border-slate-800 hover:border-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none transition-colors cursor-pointer min-w-[200px]"
              >
                {userCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razonSocial} (RUC: {c.ruc})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddCompanyModal(true)}
              className="flex items-center gap-1.5 mt-4 sm:mt-0 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 transition-all cursor-pointer select-none active:scale-98"
            >
              + Añadir Empresa
            </button>
          </div>
        </Card>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ventas */}
        <Card className="hover:scale-101 border-l-4 border-l-primary transition-all">
          <CardContent className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ventas Emitidas</span>
              <span className="text-xl font-extrabold text-foreground">S/ {totalVentas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +15.4% vs mes anterior
              </span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-primary">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Compras */}
        <Card className="hover:scale-101 border-l-4 border-l-secondary transition-all">
          <CardContent className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Compras Registradas</span>
              <span className="text-xl font-extrabold text-foreground">S/ {totalCompras.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                <Percent className="w-3 h-3" /> 18% IGV Tributario incluído
              </span>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-secondary">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Gastos */}
        <Card className="hover:scale-101 border-l-4 border-l-amber-500 transition-all">
          <CardContent className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gastos Totales (Egresos)</span>
              <span className="text-xl font-extrabold text-foreground">S/ {totalGastos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> +4.2% egresos menores
              </span>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Utilidad Neta */}
        <Card className="hover:scale-101 border-l-4 border-l-violet-500 transition-all">
          <CardContent className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Utilidad Neta</span>
              <span className={`text-xl font-extrabold ${utilidadNeta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                S/ {utilidadNeta.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5">
                <Scale className="w-3 h-3 text-violet-500" /> Rendimiento de Caja
              </span>
            </div>
            <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-violet-500">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second KPI Cards Grid (Flujo de Caja, Cobrar, Pagar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 5: Flujo de Caja */}
        <Card className="bg-slate-900 text-slate-100 border border-slate-800 shadow-md">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Flujo de Caja Disponible</span>
              <span className="text-2xl font-extrabold text-primary">S/ {flujoCajaTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-slate-400">Total en Bancos + Caja Chica</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800 text-primary">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 6: Cuentas por Cobrar */}
        <Card className="hover:scale-101 transition-all">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Cuentas por Cobrar</span>
              <span className="text-2xl font-extrabold text-amber-600">S/ {cuentasPorCobrar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" /> Facturas vencidas pendientes
              </span>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 7: Cuentas por Pagar */}
        <Card className="hover:scale-101 transition-all">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Cuentas por Pagar</span>
              <span className="text-2xl font-extrabold text-rose-600">S/ {cuentasPorPagar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-muted-foreground">Facturas de proveedores estimadas</span>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Graphical Panels */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Comparativo Ingresos vs Egresos */}
          <Card className="lg:col-span-2 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Flujo Mensual: Ingresos vs Egresos</CardTitle>
              <CardDescription>Comparativo acumulado de los últimos 4 meses.</CardDescription>
            </CardHeader>
            <CardContent className="h-80 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                  <Legend verticalAlign="top" height={36} iconSize={12} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Ingresos" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 3: Gasto por categoría */}
          <Card className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Distribución de Egresos</CardTitle>
              <CardDescription>Gastos clasificados por categorías contables del mes.</CardDescription>
            </CardHeader>
            <CardContent className="h-64 w-full relative flex items-center justify-center">
              <div className="w-full h-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => `S/ ${val}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            {/* Pie Legend list */}
            <div className="px-6 pb-4 flex flex-wrap gap-2 text-xs">
              {pieData.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-muted-foreground font-medium truncate max-w-[100px]">{entry.name}: S/ {entry.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Chart 2: Tendencia de Flujo de Caja */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Proyección e Historial del Flujo de Caja Disponible</CardTitle>
              <CardDescription>Seguimiento de la liquidez total consolidada en bancos e inventario líquido.</CardDescription>
            </CardHeader>
            <CardContent className="h-72 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                  <Area type="monotone" dataKey="Saldo" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSaldo)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Modal Añadir Empresa */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-scale-up">
            {/* Ambient Background Glowing Blob */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                Registrar Nueva Empresa
              </h2>
              <button 
                onClick={() => setShowAddCompanyModal(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800/80 p-1.5 rounded-lg transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && <Alert variant="danger" className="mb-4">{modalError}</Alert>}

            <form onSubmit={handleAddCompany} className="flex flex-col gap-4">
              <div className="relative flex flex-col">
                <Input
                  label="RUC DE LA EMPRESA (11 DÍGITOS) *"
                  placeholder="Ej. 20601234567"
                  value={newRuc}
                  onChange={e => setNewRuc(e.target.value)}
                  maxLength={11}
                  required
                  className="bg-slate-950 border-slate-800 focus:border-indigo-500 text-white pr-28"
                />
                {loadingRuc && (
                  <span className="text-[10px] text-indigo-400 font-bold absolute right-3 top-[38px] animate-pulse">
                    Buscando SUNAT...
                  </span>
                )}
                {rucError && (
                  <span className="text-[10px] text-rose-500 font-medium mt-1 pl-1">
                    {rucError}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="RAZÓN SOCIAL (AUTO-SUNAT) *"
                  placeholder="Ej. Mi Empresa S.A.C."
                  value={newRazonSocial}
                  onChange={e => setNewRazonSocial(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 focus:border-indigo-500 text-white"
                />

                <Input
                  label="NOMBRE COMERCIAL"
                  placeholder="Ej. Mi Marca"
                  value={newNombreComercial}
                  onChange={e => setNewNombreComercial(e.target.value)}
                  className="bg-slate-950 border-slate-800 focus:border-indigo-500 text-white"
                />
              </div>

              <Input
                label="DIRECCIÓN COMERCIAL REGISTRADA *"
                placeholder="Ej. Av. Javier Prado 123, San Isidro, Lima"
                value={newDireccion}
                onChange={e => setNewDireccion(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 focus:border-indigo-500 text-white"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="CORREO DE LA EMPRESA"
                  type="email"
                  placeholder="contacto@miempresa.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 focus:border-indigo-500 text-white"
                />

                <Input
                  label="TELÉFONO"
                  placeholder="Ej. 01 421-9876 o 999888777"
                  value={newTelefono}
                  onChange={e => setNewTelefono(e.target.value)}
                  className="bg-slate-950 border-slate-800 focus:border-indigo-500 text-white"
                />
              </div>

              <Select
                label="PLAN DE SUSCRIPCIÓN"
                options={[
                  { value: 'Plan Corporativo', label: 'Plan Corporativo (S/. 149/mes)' },
                  { value: 'Plan Emprendedor', label: 'Plan Emprendedor (Gratuito)' }
                ]}
                value={newPlan}
                onChange={e => setNewPlan(e.target.value)}
                className="bg-slate-950 border-slate-800 focus:border-indigo-500 text-white"
              />

              <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-800 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddCompanyModal(false)}
                  disabled={creatingCompany}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={creatingCompany || loadingRuc}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  {creatingCompany ? 'Registrando...' : 'Registrar Empresa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
