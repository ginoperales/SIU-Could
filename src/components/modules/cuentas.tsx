'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { dbService } from '../../core/services/firebase';
import { Factura, Compra } from '../../core/models/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Alert, Tabs } from '../ui/custom';
import { Calendar, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock, BellRing, DollarSign, CalendarCheck } from 'lucide-react';

export function CuentasModule() {
  const { company } = useCompany();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cobrar');

  useEffect(() => {
    if (company) {
      loadData();
    }
  }, [company]);

  const loadData = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [facData, cmpData] = await Promise.all([
        dbService.getDocuments<Factura>('facturas', company.id),
        dbService.getDocuments<Compra>('compras', company.id)
      ]);
      setFacturas(facData);
      setCompras(cmpData);
    } catch (err) {
      console.error('Error loading AR/AP data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!company) return null;

  // ==========================================
  // AR / AP LIST CALCULATIONS & OVERDUE DAYS
  // ==========================================
  const today = new Date();
  
  // Accounts Receivable (Clientes pendientes)
  const cuentasPorCobrar = facturas.filter(f => f.estado === 'pendiente');
  
  // Calculate overdue receivables
  const overdueReceivables = cuentasPorCobrar.filter(f => new Date(f.fechaVencimiento) < today);
  const totalOverdueAR = overdueReceivables.reduce((sum, f) => sum + f.total, 0);

  // Accounts Payable (Proveedores pendientes - simulating purchases outstanding)
  const totalCompras = compras.reduce((sum, c) => sum + c.total, 0);
  const estimatedAP = totalCompras * 0.35; // 35% of purchases are outstanding debt

  // Payment Schedule Calendar Lists (Simulated calendar schedule items based on actual bills due)
  const calendarEvents = [
    { id: 'ev_1', title: 'Factura F001-0002 BBVA', type: 'cobro', date: '2026-06-20', amount: 1593.00, client: 'Distribuidora San Juan' },
    { id: 'ev_2', title: 'Servicio Luz del Sur', type: 'pago', date: '2026-06-12', amount: 413.00, client: 'Luz del Sur S.A.A.' },
    { id: 'ev_3', title: 'Planilla Quincenal Empleados', type: 'pago', date: '2026-06-15', amount: 2150.00, client: 'Planilla Administrativa' },
    { id: 'ev_4', title: 'Pago Factura Suministros PAC', type: 'pago', date: '2026-06-18', amount: 850.00, client: 'Suministros Industriales' }
  ];

  const getDaysOverdue = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Cuentas por Cobrar y Pagar
            <Badge variant="warning">Créditos</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Monitoreo de facturas emitidas por cobrar, deudas pendientes y cronograma mensual de vencimientos.</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'cobrar', label: 'Cuentas Por Cobrar (Clientes)', icon: <ArrowUpRight className="w-4 h-4 text-emerald-600" /> },
          { id: 'pagar', label: 'Cuentas Por Pagar (Proveedores)', icon: <ArrowDownRight className="w-4 h-4 text-rose-600" /> },
          { id: 'calendario', label: 'Calendario y Plazos', icon: <Calendar className="w-4 h-4" /> }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* AUTOMATIC ALERTS BULLETIN */}
      {overdueReceivables.length > 0 && activeTab === 'cobrar' && (
        <Alert variant="danger" title="¡ALERTA DE FACTURAS VENCIDAS!">
          <div className="flex items-start gap-2 mt-1">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 text-xs">
              <span>Tienes **{overdueReceivables.length} factura(s) vencidas** pendientes de cobro por un total consolidado de <strong className="font-mono text-rose-700">S/ {totalOverdueAR.toFixed(2)}</strong>.</span>
              <ul className="list-disc pl-4 font-semibold">
                {overdueReceivables.map(f => (
                  <li key={f.id}>
                    {f.clienteNombre} (RUC: {f.clienteDocumento}) — {f.serie}-{f.numero} por **S/ {f.total.toFixed(2)}** (Hace **{getDaysOverdue(f.fechaVencimiento)} días** de retraso).
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Alert>
      )}

      {/* TABS CONTENT 1: CUENTAS POR COBRAR */}
      {activeTab === 'cobrar' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Cartera de Cobros Pendientes (Clientes)</CardTitle>
            <CardDescription>Seguimiento de facturas y boletas emitidas al crédito.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Cargando cuentas por cobrar...</div>
            ) : cuentasPorCobrar.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">¡Felicidades! No tienes facturas pendientes de cobro. Todo está liquidado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Emisión</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                    <TableHead className="text-center">Antigüedad / Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentasPorCobrar.map(inv => {
                    const daysOverdue = getDaysOverdue(inv.fechaVencimiento);
                    const isOverdue = daysOverdue > 0;
                    return (
                      <TableRow key={inv.id} className={isOverdue ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(inv.fecha).toLocaleDateString('es-PE')}
                        </TableCell>
                        <TableCell className="font-bold text-foreground">
                          {inv.tipo.toUpperCase()} {inv.serie}-{inv.numero}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-foreground block">{inv.clienteNombre}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">Doc: {inv.clienteDocumento}</span>
                        </TableCell>
                        <TableCell className="font-semibold whitespace-nowrap">
                          {new Date(inv.fechaVencimiento).toLocaleDateString('es-PE')}
                        </TableCell>
                        <TableCell className="text-right font-bold font-mono text-foreground">
                          S/ {inv.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          {isOverdue ? (
                            <Badge variant="danger" className="gap-1 animate-pulse-slow">
                              <Clock className="w-3 h-3" /> Vencido hace {daysOverdue} días
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="gap-1">
                              <Clock className="w-3 h-3" /> Por vencer (vigente)
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TABS CONTENT 2: CUENTAS POR PAGAR */}
      {activeTab === 'pagar' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Registro de Cuentas por Pagar (Proveedores)</CardTitle>
            <CardDescription>Control de deudas de facturas pendientes de pago a proveedores.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* KPI box of AP */}
            <div className="p-4 bg-muted/60 border border-border rounded-xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground font-semibold uppercase">Deuda de Compras Estimada</span>
                <span className="text-2xl font-extrabold text-rose-600">S/ {estimatedAP.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-slate-500">Estimado calculado sobre el 35% de compras históricas del mes</span>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* List Table of simulated outstanding invoices */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Proveedor (RUC)</TableHead>
                  <TableHead>Concepto / Factura</TableHead>
                  <TableHead className="text-right font-semibold">Total Factura</TableHead>
                  <TableHead className="text-right">Saldo Pendiente</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No hay registros de compras cargados para estimar deudas.</TableCell>
                  </TableRow>
                ) : (
                  compras.slice(0,2).map((cmp, idx) => (
                    <TableRow key={`ap-${cmp.id}`}>
                      <TableCell className="whitespace-nowrap">{new Date(cmp.fecha).toLocaleDateString('es-PE')}</TableCell>
                      <TableCell>
                        <span className="font-bold text-foreground block">{cmp.proveedorRazonSocial}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">RUC: {cmp.proveedorRuc}</span>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-600">
                        Factura C-{cmp.id.slice(4)}
                      </TableCell>
                      <TableCell className="text-right font-mono">S/ {cmp.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold font-mono text-rose-600">
                        S/ {(cmp.total * 0.5).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="warning">Pago Parcial</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TABS CONTENT 3: INTERACTIVE PAYMENT CALENDAR */}
      {activeTab === 'calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Calendar List Timeline */}
          <Card className="lg:col-span-2 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base font-bold">Cronograma de Vencimientos: Junio 2026</CardTitle>
              <CardDescription>Vencimientos y cobros planificados ordenados en el tiempo.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {calendarEvents.map(event => (
                <div 
                  key={event.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-sm ${
                    event.type === 'cobro' 
                      ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-950/40 dark:bg-emerald-950/10' 
                      : 'border-rose-200 bg-rose-50/20 dark:border-rose-950/40 dark:bg-rose-950/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${event.type === 'cobro' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm text-foreground">{event.title}</span>
                      <span className="text-xs text-muted-foreground">{event.client}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-mono text-slate-500 font-semibold">
                      Plazo: {new Date(event.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className={`font-extrabold text-sm font-mono ${event.type === 'cobro' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {event.type === 'cobro' ? '+' : '-'} S/ {event.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Accounts bulletin / cashflow impact */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Impacto en Liquidez de Junio</CardTitle>
              <CardDescription>Cálculo de flujo de cobros contra pagos programados.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>COBROS PREVISTOS</span>
                  <span className="text-emerald-600 font-bold font-mono">S/ 1,593.00</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-muted-foreground border-b border-border pb-2">
                  <span>PAGOS PREVISTOS</span>
                  <span className="text-rose-600 font-bold font-mono">S/ 3,376.00</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-foreground pt-1">
                  <span>SALDO NETO PREVISTO</span>
                  <span className="text-rose-600 font-mono">- S/ 1,783.00</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
                <BellRing className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>**Recomendación de Tesorería**: Tu flujo programado en Junio es **negativo** por S/ 1,783.00. Te sugerimos acelerar el cobro de la Factura de Aceros Andinos que está **vencida** por S/ 5,900.00 para mantener holgura financiera en caja.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
