'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { useAuth } from '../../hooks/useAuth';
import { dbService } from '../../core/services/firebase';
import { MovimientoContable, TipoMovimiento, MetodoPago } from '../../core/models/types';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, Alert } from '../ui/custom';
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, Search, Calendar, Tag, CreditCard } from 'lucide-react';

export function CajaModule() {
  const { company } = useCompany();
  const { user } = useAuth();
  
  const [movements, setMovements] = useState<MovimientoContable[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoMovimiento>('ingreso');
  const [categoria, setCategoria] = useState('Venta');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cajaChica, setCajaChica] = useState(true);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categoriasIngreso = ['Venta', 'Aporte Capital', 'Reembolso', 'Otros Ingresos'];
  const categoriasEgreso = ['Mercadería', 'Planilla', 'Servicios Básicos', 'Impuestos', 'Alquiler', 'Útiles de Oficina', 'Transporte', 'Otros Gastos'];

  useEffect(() => {
    if (company) {
      loadMovements();
    }
  }, [company]);

  // Adjust categories automatically when changing type
  useEffect(() => {
    if (tipo === 'ingreso') {
      setCategoria(categoriasIngreso[0]);
    } else {
      setCategoria(categoriasEgreso[0]);
    }
  }, [tipo]);

  const loadMovements = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const data = await dbService.getDocuments<MovimientoContable>('movimientos', company.id);
      // Sort by date descending
      setMovements(data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    } catch (err) {
      console.error('Error loading movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;
    
    if (!monto || parseFloat(monto) <= 0) {
      setError('Por favor, ingresa un monto válido mayor a cero.');
      return;
    }

    setError('');
    try {
      const newMov: Omit<MovimientoContable, 'id'> = {
        empresaId: company.id,
        fecha: new Date(fecha).toISOString(),
        tipo,
        categoria,
        descripcion,
        monto: parseFloat(monto),
        metodoPago,
        usuarioId: user.id,
        cajaChica
      };

      await dbService.addDocument<MovimientoContable>('movimientos', newMov);
      setSuccess('Movimiento contable registrado correctamente.');
      
      // Reset form
      setDescripcion('');
      setMonto('');
      setFecha(new Date().toISOString().split('T')[0]);
      
      // Reload lists
      await loadMovements();
      
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError('Error al guardar el movimiento.');
      console.error(err);
    }
  };

  if (!company) return null;

  // ==========================================
  // METRIC CALCULATIONS
  // ==========================================
  const totalIngresos = movements
    .filter(m => m.tipo === 'ingreso' && m.cajaChica)
    .reduce((sum, m) => sum + m.monto, 0);

  const totalEgresos = movements
    .filter(m => m.tipo === 'egreso' && m.cajaChica)
    .reduce((sum, m) => sum + m.monto, 0);

  // Baseline 2500 for initial float + incomes - expenses
  const saldoActual = 2500 + totalIngresos - totalEgresos;

  // Filter movements
  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === 'todos' || m.tipo === filterTipo;
    
    return matchesSearch && matchesTipo;
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Caja y Caja Chica
            <Badge variant="success">Fondo Fijo</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Registros diarios de caja, cobros menores, gastos y reembolsos rápidos.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-1.5 font-semibold">
          <Plus className="w-4 h-4" /> Registrar Movimiento
        </Button>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Saldo Caja Chica */}
        <Card className="border-l-4 border-l-primary bg-slate-900 text-slate-100">
          <CardContent className="flex justify-between items-center py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Saldo de Caja Chica</span>
              <span className="text-2xl font-extrabold text-primary">S/ {saldoActual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-slate-400">Fondo Inicial Asignado: S/ 2,500.00</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800 text-primary">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Total Ingresos */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="flex justify-between items-center py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Ingresos en Caja Chica</span>
              <span className="text-2xl font-extrabold text-emerald-600">S/ {totalIngresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-muted-foreground">Cobros menores liquidados</span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Total Egresos */}
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="flex justify-between items-center py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Gastos en Caja Chica</span>
              <span className="text-2xl font-extrabold text-rose-600">S/ {totalEgresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-muted-foreground">Salidas por recibos de caja</span>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History table and filters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Historial de Caja y Movimientos Contables</CardTitle>
          <CardDescription>Lista completa de transacciones del libro de caja.</CardDescription>
        </CardHeader>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 px-6 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por descripción o categoría..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'todos', label: 'Todos los tipos' },
                { value: 'ingreso', label: 'Ingresos' },
                { value: 'egreso', label: 'Egresos' }
              ]}
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
            />
          </div>
        </div>

        {/* Ledger Table */}
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Cargando transacciones contables...</div>
          ) : filteredMovements.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
              No se encontraron movimientos que coincidan con los filtros.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map(mov => (
                  <TableRow key={mov.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(mov.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={mov.descripcion}>
                      {mov.descripcion}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Tag className="w-3.5 h-3.5" />
                        {mov.categoria}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-xs text-foreground">
                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                        {mov.metodoPago}
                      </span>
                    </TableCell>
                    <TableCell>
                      {mov.tipo === 'ingreso' ? (
                        <Badge variant="success" className="gap-1"><ArrowUpRight className="w-3 h-3" /> Ingreso</Badge>
                      ) : (
                        <Badge variant="danger" className="gap-1"><ArrowDownRight className="w-3 h-3" /> Egreso</Badge>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-bold whitespace-nowrap ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {mov.tipo === 'ingreso' ? '+' : '-'} S/ {mov.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Register dialog */}
      <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title="Registrar Nuevo Movimiento Contable">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tipo de Movimiento</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('ingreso')}
                  className={`py-2 px-3 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                    tipo === 'ingreso' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300' 
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Ingreso (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('egreso')}
                  className={`py-2 px-3 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                    tipo === 'egreso' 
                      ? 'border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300' 
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Egreso (-)
                </button>
              </div>
            </div>

            <Select
              label="Categoría Contable"
              options={
                tipo === 'ingreso'
                  ? categoriasIngreso.map(c => ({ value: c, label: c }))
                  : categoriasEgreso.map(c => ({ value: c, label: c }))
              }
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Monto de la Operación (S/)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              required
            />
            <Input
              label="Fecha del Movimiento"
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Método de Pago"
              options={[
                { value: 'efectivo', label: 'Efectivo en mano' },
                { value: 'transferencia', label: 'Transferencia Bancaria' },
                { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito' },
                { value: 'cheque', label: 'Cheque Diferido' }
              ]}
              value={metodoPago}
              onChange={e => setMetodoPago(e.target.value as MetodoPago)}
            />

            <div className="flex flex-col gap-1.5 justify-center pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground select-none">
                <input
                  type="checkbox"
                  checked={cajaChica}
                  onChange={e => setCajaChica(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                ¿Afecta a Caja Chica?
              </label>
              <span className="text-[10px] text-muted-foreground">Si no se marca, se asume movimiento directo en cuentas principales bancarias.</span>
            </div>
          </div>

          <Input
            label="Descripción detallada"
            placeholder="Ej. Cobro por venta menor de ferretería"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant={tipo === 'ingreso' ? 'success' : 'danger'}>
              Registrar Transacción
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
