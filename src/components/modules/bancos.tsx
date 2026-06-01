'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { dbService } from '../../core/services/firebase';
import { Banco, MovimientoContable } from '../../core/models/types';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, Alert, Tabs } from '../ui/custom';
import { Building, Plus, ArrowLeftRight, CheckCircle2, AlertCircle, RefreshCw, Landmark, HelpCircle } from 'lucide-react';

export function BancosModule() {
  const { company } = useCompany();
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [movements, setMovements] = useState<MovimientoContable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cuentas');

  // Account Modal State
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [nombreBanco, setNombreBanco] = useState('BCP');
  const [tipoCuenta, setTipoCuenta] = useState<'corriente' | 'ahorros'>('corriente');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [moneda, setMoneda] = useState<'PEN' | 'USD'>('PEN');
  const [saldoActual, setSaldoActual] = useState('');
  const [cci, setCci] = useState('');

  // Transfer Modal State
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [cuentaOrigen, setCuentaOrigen] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [montoTransferencia, setMontoTransferencia] = useState('');

  // Reconciliation simulated records state
  // Pre-configured unmatched statements that the user can match against actual DB movements
  const [unreconciledLedger, setUnreconciledLedger] = useState<any[]>([]);
  const [reconciledIds, setReconciledIds] = useState<string[]>([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (company) {
      loadData();
    }
  }, [company]);

  const loadData = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [bncData, movData] = await Promise.all([
        dbService.getDocuments<Banco>('bancos', company.id),
        dbService.getDocuments<MovimientoContable>('movimientos', company.id)
      ]);
      setBancos(bncData);
      setMovements(movData);

      // Setup ledger bank reconciliation list (movements registered with wire/transfer method)
      const ledgerWire = movData.filter(m => m.metodoPago === 'transferencia' || m.metodoPago === 'cheque');
      setUnreconciledLedger(ledgerWire);

      if (bncData.length > 0) {
        setCuentaOrigen(bncData[0].id);
        setCuentaDestino(bncData[1]?.id || bncData[0].id);
      }
    } catch (err) {
      console.error('Error loading banking data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    if (!numeroCuenta || !saldoActual) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setError('');
    try {
      const newAcc: Omit<Banco, 'id'> = {
        empresaId: company.id,
        banco: nombreBanco,
        tipoCuenta,
        numeroCuenta,
        moneda,
        saldoActual: parseFloat(saldoActual),
        cci
      };

      await dbService.addDocument<Banco>('bancos', newAcc);
      setSuccess('Cuenta bancaria agregada exitosamente.');
      setNumeroCuenta('');
      setSaldoActual('');
      setCci('');
      
      await loadData();
      setTimeout(() => {
        setAccountDialogOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError('Error al registrar la cuenta bancaria.');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    if (cuentaOrigen === cuentaDestino) {
      setError('Las cuentas de origen y destino no pueden ser iguales.');
      return;
    }
    const monto = parseFloat(montoTransferencia);
    if (isNaN(monto) || monto <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    // Verify source account balance
    const srcAccount = bancos.find(b => b.id === cuentaOrigen);
    if (!srcAccount || srcAccount.saldoActual < monto) {
      setError('Saldo insuficiente en la cuenta de origen.');
      return;
    }

    setError('');
    try {
      // 1. Update source account (Subtract)
      await dbService.updateDocument<Banco>('bancos', cuentaOrigen, {
        saldoActual: parseFloat((srcAccount.saldoActual - monto).toFixed(2))
      });

      // 2. Update destination account (Add)
      const dstAccount = bancos.find(b => b.id === cuentaDestino)!;
      await dbService.updateDocument<Banco>('bancos', cuentaDestino, {
        saldoActual: parseFloat((dstAccount.saldoActual + monto).toFixed(2))
      });

      // 3. Register inter-account movements
      const uniqueUserId = 'usr_system';
      const descTransfer = `Traspaso interno: ${srcAccount.banco} -> ${dstAccount.banco}`;
      
      await dbService.addDocument<MovimientoContable>('movimientos', {
        empresaId: company.id,
        fecha: new Date().toISOString(),
        tipo: 'egreso',
        categoria: 'Otros Gastos',
        descripcion: descTransfer,
        monto,
        metodoPago: 'transferencia',
        usuarioId: uniqueUserId,
        bancoId: cuentaOrigen
      });

      await dbService.addDocument<MovimientoContable>('movimientos', {
        empresaId: company.id,
        fecha: new Date().toISOString(),
        tipo: 'ingreso',
        categoria: 'Otros Ingresos',
        descripcion: descTransfer,
        monto,
        metodoPago: 'transferencia',
        usuarioId: uniqueUserId,
        bancoId: cuentaDestino
      });

      setSuccess('Transferencia bancaria interna completada con éxito.');
      setMontoTransferencia('');
      await loadData();
      
      setTimeout(() => {
        setTransferDialogOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError('Error al procesar la transferencia bancaria.');
    }
  };

  const handleConciliation = (ledgerId: string) => {
    // Optimistic toggle of conciliation match
    setReconciledIds(prev => {
      if (prev.includes(ledgerId)) {
        return prev.filter(id => id !== ledgerId);
      } else {
        return [...prev, ledgerId];
      }
    });
  };

  if (!company) return null;

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Módulo Bancario y Conciliación
            <Badge variant="info">Tesorería</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Administración de cuentas bancarias corporativas, transferencias y cuadre de extractos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTransferDialogOpen(true)} className="flex items-center gap-1.5 font-semibold bg-card">
            <ArrowLeftRight className="w-4 h-4" /> Transferencia
          </Button>
          <Button onClick={() => setAccountDialogOpen(true)} className="flex items-center gap-1.5 font-semibold">
            <Plus className="w-4 h-4" /> Agregar Cuenta
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'cuentas', label: 'Cuentas Bancarias', icon: <Landmark className="w-4 h-4" /> },
          { id: 'conciliar', label: 'Conciliación Bancaria', icon: <CheckCircle2 className="w-4 h-4" /> }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TABS CONTENT 1: CUENTAS BANCARIAS */}
      {activeTab === 'cuentas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-6 text-center text-muted-foreground">Cargando cuentas de bancos...</div>
          ) : bancos.length === 0 ? (
            <div className="col-span-full p-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
              No tienes ninguna cuenta bancaria registrada para esta empresa.
            </div>
          ) : (
            bancos.map(b => (
              <Card key={b.id} className="relative overflow-hidden group hover:shadow-md transition-all">
                {/* Glowing border top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-primary" />
                
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Building className="w-5 h-5 text-secondary" />
                      {b.banco}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      Cuenta {b.tipoCuenta} en {b.moneda === 'PEN' ? 'Soles' : 'Dólares'}
                    </CardDescription>
                  </div>
                  <Badge variant={b.moneda === 'PEN' ? 'success' : 'info'}>
                    {b.moneda}
                  </Badge>
                </CardHeader>
                
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 bg-muted/60 p-3 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Número de Cuenta</span>
                    <span className="text-sm font-semibold font-mono text-foreground">{b.numeroCuenta}</span>
                    {b.cci && (
                      <>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1.5">CCI</span>
                        <span className="text-xs font-semibold font-mono text-muted-foreground">{b.cci}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-xs text-muted-foreground font-medium">Saldo Disponible</span>
                    <span className="text-2xl font-extrabold text-foreground">
                      {b.moneda === 'PEN' ? 'S/' : '$'} {b.saldoActual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TABS CONTENT 2: CONCILIACIÓN BANCARIA */}
      {activeTab === 'conciliar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Reconciliation Explainer */}
          <Alert variant="info" title="Instrucciones de Conciliación" className="lg:col-span-3">
            La conciliación compara los movimientos de tu **Libro de Caja/Ventas** (izquierda) contra los cargos del **Extracto Bancario Ficticio** (derecha) recibido de la SUNAT/Bancos. Haz click en el círculo de verificación para emparejar y conciliar cada movimiento en la base de datos contable.
          </Alert>

          {/* Left panel: Ledger movements */}
          <Card className="lg:col-span-2 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Movimientos en el Libro Auxiliar</CardTitle>
              <CardDescription>Cobros y pagos registrados pendientes de verificación bancaria.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-6 text-center text-muted-foreground">Cargando libro auxiliar...</div>
              ) : unreconciledLedger.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">No hay transacciones registradas con transferencia bancaria.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unreconciledLedger.map(item => {
                      const isConciliated = reconciledIds.includes(item.id);
                      return (
                        <TableRow key={item.id} className={isConciliated ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''}>
                          <TableCell className="font-mono text-xs">
                            {new Date(item.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate">
                            <span className="font-semibold text-foreground">{item.descripcion}</span>
                            <div className="text-[10px] text-muted-foreground uppercase">{item.categoria}</div>
                          </TableCell>
                          <TableCell className={`text-right font-bold ${item.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {item.tipo === 'ingreso' ? '+' : '-'} S/ {item.monto.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleConciliation(item.id)}
                              className={`p-1.5 rounded-full border cursor-pointer transition-all active:scale-90 ${
                                isConciliated 
                                  ? 'border-emerald-600 bg-emerald-600 text-white' 
                                  : 'border-border bg-card text-muted-foreground hover:border-emerald-500 hover:text-emerald-600'
                              }`}
                              title={isConciliated ? 'Desmarcar' : 'Conciliar'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Right panel: Bank statements */}
          <Card flex-col justify-between>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Extracto Bancario Recibido (Simulación)</CardTitle>
              <CardDescription>Cargos físicos reales reportados por el banco en la web.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* Dummy matches list */}
              {unreconciledLedger.map(item => {
                const isConciliated = reconciledIds.includes(item.id);
                return (
                  <div 
                    key={`statement-${item.id}`}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isConciliated 
                        ? 'border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/15' 
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">{item.descripcion.replace('Cobro de ', 'TRF REC ').replace('Pago de ', 'CARGO TRF ')}</span>
                      <span className="text-[10px] text-muted-foreground">REF: TXN-{item.id.slice(4)} | BANCO BCP</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-bold ${item.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        S/ {item.monto.toFixed(2)}
                      </span>
                      {isConciliated ? (
                        <Badge variant="success" className="scale-85">Conciliado</Badge>
                      ) : (
                        <Badge variant="warning" className="scale-85">Sin cruzar</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 1: CREATE ACCOUNT */}
      <Dialog isOpen={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} title="Agregar Nueva Cuenta Bancaria">
        <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Banco Emisor"
              options={[
                { value: 'BCP', label: 'BCP - Banco de Crédito' },
                { value: 'BBVA', label: 'BBVA Continental' },
                { value: 'Interbank', label: 'Interbank' },
                { value: 'Scotiabank', label: 'Scotiabank del Perú' },
                { value: 'Banco de la Nación', label: 'Banco de la Nación' }
              ]}
              value={nombreBanco}
              onChange={e => setNombreBanco(e.target.value)}
            />
            <Select
              label="Tipo de Cuenta"
              options={[
                { value: 'corriente', label: 'Cuenta Corriente' },
                { value: 'ahorros', label: 'Cuenta de Ahorros' }
              ]}
              value={tipoCuenta}
              onChange={e => setTipoCuenta(e.target.value as any)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Moneda"
              options={[
                { value: 'PEN', label: 'Soles (S/)' },
                { value: 'USD', label: 'Dólares ($)' }
              ]}
              value={moneda}
              onChange={e => setMoneda(e.target.value as any)}
            />
            <Input
              label="Saldo Inicial de la Cuenta"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={saldoActual}
              onChange={e => setSaldoActual(e.target.value)}
              required
            />
          </div>

          <Input
            label="Número de Cuenta Bancaria"
            placeholder="191-XXXXXXXXX-X-XX"
            value={numeroCuenta}
            onChange={e => setNumeroCuenta(e.target.value)}
            required
          />

          <Input
            label="CCI (Código de Cuenta Interbancario - Opcional)"
            placeholder="002-XXXXXXXXXXXXXXXXXX-XX"
            value={cci}
            onChange={e => setCci(e.target.value)}
          />

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Cuenta</Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: BANK TRANSFER */}
      <Dialog isOpen={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} title="Traspaso Interno de Fondos">
        <form onSubmit={handleTransfer} className="flex flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {bancos.length < 2 && (
            <Alert variant="warning">
              Necesitas registrar al menos **dos cuentas bancarias** diferentes para poder realizar traspasos internos.
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Cuenta de Origen (Debitar)"
              options={bancos.map(b => ({ value: b.id, label: `${b.banco} - ${b.numeroCuenta.slice(0,6)}... (${b.moneda})` }))}
              value={cuentaOrigen}
              onChange={e => setCuentaOrigen(e.target.value)}
              disabled={bancos.length < 2}
            />
            <Select
              label="Cuenta de Destino (Abonar)"
              options={bancos.map(b => ({ value: b.id, label: `${b.banco} - ${b.numeroCuenta.slice(0,6)}... (${b.moneda})` }))}
              value={cuentaDestino}
              onChange={e => setCuentaDestino(e.target.value)}
              disabled={bancos.length < 2}
            />
          </div>

          <Input
            label="Monto del Traspaso (S/ o $)"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={montoTransferencia}
            onChange={e => setMontoTransferencia(e.target.value)}
            required
            disabled={bancos.length < 2}
          />

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="secondary" disabled={bancos.length < 2}>
              Efectuar Traspaso
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
