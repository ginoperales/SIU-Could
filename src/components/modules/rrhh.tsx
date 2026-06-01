'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { dbService } from '../../core/services/firebase';
import { Trabajador, MovimientoContable } from '../../core/models/types';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, Alert, Tabs } from '../ui/custom';
import { Users, Plus, FileSpreadsheet, Calendar, UserCheck, HeartHandshake, Award } from 'lucide-react';

export function RecursoHumanoModule() {
  const { company } = useCompany();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trabajadores');

  // Worker Modal state
  const [workerDialogOpen, setWorkerDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [cargo, setCargo] = useState('');
  const [sueldoBasico, setSueldoBasico] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);
  const [regimenLaboral, setRegimenLaboral] = useState<'general' | 'mype' | 'practicante'>('mype');
  const [activo, setActivo] = useState(true);

  // Payroll Calculation sheet state
  const [payrollMonth, setPayrollMonth] = useState('Junio 2026');
  const [payrollIssued, setPayrollIssued] = useState(false);
  const [payrollDetails, setPayrollDetails] = useState<any[]>([]);

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
      const data = await dbService.getDocuments<Trabajador>('trabajadores', company.id);
      setTrabajadores(data);
    } catch (err) {
      console.error('Error loading workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setNombre('');
    setDocumento('');
    setCargo('');
    setSueldoBasico('');
    setFechaIngreso(new Date().toISOString().split('T')[0]);
    setRegimenLaboral('mype');
    setActivo(true);
    setError('');
    setWorkerDialogOpen(true);
  };

  const handleOpenEdit = (t: Trabajador) => {
    setEditingId(t.id);
    setNombre(t.nombre);
    setDocumento(t.documento);
    setCargo(t.cargo);
    setSueldoBasico(t.sueldoBasico.toString());
    setFechaIngreso(t.fechaIngreso);
    setRegimenLaboral(t.regimenLaboral);
    setActivo(t.activo);
    setError('');
    setWorkerDialogOpen(true);
  };

  const handleSubmitWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    if (!nombre || !documento || !cargo || !sueldoBasico) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    if (documento.length !== 8 || !/^\d+$/.test(documento)) {
      setError('El DNI en Perú debe constar de exactamente 8 dígitos.');
      return;
    }

    setError('');
    try {
      const wData: Omit<Trabajador, 'id'> = {
        empresaId: company.id,
        nombre,
        documento,
        cargo,
        sueldoBasico: parseFloat(sueldoBasico),
        fechaIngreso,
        regimenLaboral,
        activo
      };

      if (editingId) {
        await dbService.updateDocument<Trabajador>('trabajadores', editingId, wData);
        setSuccess('Ficha del trabajador actualizada.');
      } else {
        await dbService.addDocument<Trabajador>('trabajadores', wData);
        setSuccess('Trabajador contratado y registrado con éxito.');
      }

      await loadData();
      setTimeout(() => {
        setWorkerDialogOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError('Error al registrar el trabajador.');
    }
  };

  const handleGeneratePayroll = () => {
    if (trabajadores.length === 0) return;
    
    // Process Peruvian payroll formulas for all active workers
    const activeWorkers = trabajadores.filter(t => t.activo);
    const calculated = activeWorkers.map(t => {
      // 1. Asignacion Familiar (S/ 102.50 in Peru for general/mype workers)
      const asignacionFam = t.regimenLaboral !== 'practicante' ? 102.50 : 0;
      
      // 2. Gross Salary
      const sueldoBruto = t.sueldoBasico + asignacionFam;
      
      // 3. Worker Deduction (ONP/AFP estimate: 13%)
      const desctoAfpOnp = parseFloat((sueldoBruto * 0.13).toFixed(2));
      
      // 4. Employer Contribution (EsSalud: 9% for General/Mype)
      const essalud = parseFloat((sueldoBruto * 0.09).toFixed(2));
      
      // 5. Net salary payable to employee
      const sueldoNeto = parseFloat((sueldoBruto - desctoAfpOnp).toFixed(2));

      return {
        id: t.id,
        nombre: t.nombre,
        cargo: t.cargo,
        regimen: t.regimenLaboral,
        basico: t.sueldoBasico,
        asignacion: asignacionFam,
        deducciones: desctoAfpOnp,
        essalud: essalud,
        neto: sueldoNeto
      };
    });

    setPayrollDetails(calculated);
    setPayrollIssued(true);
  };

  const handleSettlePayroll = async () => {
    if (!company || payrollDetails.length === 0) return;
    if (!confirm(`¿Confirmas el pago bancario de la Planilla de ${payrollMonth} por un total neto de S/ ${totalNetoPayable().toFixed(2)}?`)) return;

    try {
      // Register payroll expense in DB
      await dbService.addDocument<MovimientoContable>('movimientos', {
        empresaId: company.id,
        fecha: new Date().toISOString(),
        tipo: 'egreso',
        categoria: 'Planilla',
        descripcion: `Pago Planilla Consolidada - ${payrollMonth}`,
        monto: totalNetoPayable(),
        metodoPago: 'transferencia',
        usuarioId: 'usr_rrhh'
      });

      setSuccess('Planilla pagada e ingresada en el Libro de Caja/Bancos.');
      setPayrollIssued(false);
      setPayrollDetails([]);
      
      setTimeout(() => {
        setSuccess('');
        setActiveTab('trabajadores');
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  if (!company) return null;

  // Payroll consolidations
  const totalNetoPayable = () => payrollDetails.reduce((sum, item) => sum + item.neto, 0);
  const totalEsSalud = () => payrollDetails.reduce((sum, item) => sum + item.essalud, 0);

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Gestión de Recursos Humanos (RRHH)
            <Badge variant="info">Planilla PLAME</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Registro de personal, contratos y generación de planillas mensuales con aportes de ley del Perú.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-1.5 font-semibold">
          <Plus className="w-4 h-4" /> Registrar Personal
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'trabajadores', label: 'Nómina de Trabajadores', icon: <Users className="w-4 h-4" /> },
          { id: 'planilla', label: 'Cálculo de Planilla Mensual', icon: <FileSpreadsheet className="w-4 h-4" /> }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TABS CONTENT 1: TRABAJADORES DIRECTORY */}
      {activeTab === 'trabajadores' && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Cargando nómina...</div>
            ) : trabajadores.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No tienes ningún trabajador registrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Colaborador</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Cargo / Puesto</TableHead>
                    <TableHead>Régimen</TableHead>
                    <TableHead className="text-right">Sueldo Básico</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Operación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trabajadores.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-bold text-foreground">{t.nombre}</TableCell>
                      <TableCell className="font-mono text-xs">{t.documento}</TableCell>
                      <TableCell className="font-semibold text-slate-600 dark:text-slate-300">{t.cargo}</TableCell>
                      <TableCell className="uppercase text-xs whitespace-nowrap">
                        {t.regimenLaboral === 'general' && <Badge variant="success">General 728</Badge>}
                        {t.regimenLaboral === 'mype' && <Badge variant="info">Mype Laboral</Badge>}
                        {t.regimenLaboral === 'practicante' && <Badge variant="neutral">Formativa (Prac)</Badge>}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        S/ {t.sueldoBasico.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {t.activo ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="danger">Cesado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-card text-foreground hover:bg-muted cursor-pointer"
                        >
                          Editar
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TABS CONTENT 2: MONTHLY PAYROLL GENERATOR */}
      {activeTab === 'planilla' && (
        <div className="flex flex-col gap-6 animate-slide-up">
          {success && <Alert variant="success">{success}</Alert>}

          {/* Form to query/trigger generation */}
          <Card>
            <CardContent className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1">
                <Select
                  label="Seleccionar Período Laboral"
                  options={[
                    { value: 'Mayo 2026', label: 'Período: Mayo 2026' },
                    { value: 'Junio 2026', label: 'Período: Junio 2026 (Actual)' },
                    { value: 'Julio 2026', label: 'Período: Julio 2026' }
                  ]}
                  value={payrollMonth}
                  onChange={e => setPayrollMonth(e.target.value)}
                />
              </div>
              <Button onClick={handleGeneratePayroll} className="w-full sm:w-auto font-semibold flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Calcular Planilla Mensual
              </Button>
            </CardContent>
          </Card>

          {/* Payroll calculation sheet table */}
          {payrollIssued && payrollDetails.length > 0 && (
            <Card className="animate-slide-up">
              <CardHeader className="flex flex-row justify-between items-center pb-2 border-b border-border">
                <div>
                  <CardTitle className="text-base font-extrabold text-foreground">Libro de Planillas — {payrollMonth}</CardTitle>
                  <CardDescription>Cálculo analítico del sueldo bruto, AFP/ONP y EsSalud.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="success" onClick={handleSettlePayroll} className="text-xs font-bold py-1.5 px-3">
                    Abonar y Pagar Planilla
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cargo / Régimen</TableHead>
                      <TableHead className="text-right">Básico (S/)</TableHead>
                      <TableHead className="text-right">Asig. Fam.</TableHead>
                      <TableHead className="text-right text-rose-600">Deducción 13%</TableHead>
                      <TableHead className="text-right text-emerald-600">EsSalud 9%</TableHead>
                      <TableHead className="text-right font-bold">SUELDO NETO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollDetails.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-bold text-foreground">{item.nombre}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{item.cargo}</span>
                          <span className="text-[9px] block text-muted-foreground uppercase">{item.regimen}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono">S/ {item.basico.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">S/ {item.asignacion.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-rose-600 font-semibold">
                          - S/ {item.deducciones.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-600 font-semibold">
                          S/ {item.essalud.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-extrabold font-mono text-slate-800 dark:text-slate-100">
                          S/ {item.neto.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>

              {/* Payroll aggregates box */}
              <div className="bg-muted/40 p-4 border-t border-border flex justify-between items-center text-xs">
                <span className="font-bold text-muted-foreground">Consolidado Total de Desembolso:</span>
                <div className="flex gap-4 font-mono font-bold">
                  <span>EsSalud por pagar: <strong className="text-emerald-600">S/ {totalEsSalud().toFixed(2)}</strong></span>
                  <span className="text-sm">TOTAL LIQUIDACIÓN NETO: <strong className="text-primary font-extrabold text-sm">S/ {totalNetoPayable().toFixed(2)}</strong></span>
                </div>
              </div>
            </Card>
          )}

          {payrollIssued && payrollDetails.length === 0 && (
            <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
              No hay trabajadores activos contratados para generar la planilla de este mes.
            </div>
          )}
        </div>
      )}

      {/* CREATE/EDIT WORKER DIALOG */}
      <Dialog
        isOpen={workerDialogOpen}
        onClose={() => setWorkerDialogOpen(false)}
        title={editingId ? 'Editar Ficha de Personal' : 'Contratar Nuevo Colaborador'}
      >
        <form onSubmit={handleSubmitWorker} className="flex flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Input
            label="NOMBRE Y APELLIDOS DEL TRABAJADOR"
            placeholder="Ej. Jorge Luis Saldaña Rivas"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="DNI PERUANO (8 DÍGITOS)"
              placeholder="4XXXXXXX"
              value={documento}
              onChange={e => setDocumento(e.target.value)}
              maxLength={8}
              required
            />
            <Input
              label="CARGO O PUESTO LABORAL"
              placeholder="Ej. Asistente Contable"
              value={cargo}
              onChange={e => setCargo(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="SUELDO BÁSICO (S/)"
              type="number"
              placeholder="1025.00"
              value={sueldoBasico}
              onChange={e => setSueldoBasico(e.target.value)}
              required
            />
            <Select
              label="RÉGIMEN LABORAL"
              options={[
                { value: 'mype', label: 'Remype Micro' },
                { value: 'general', label: 'Régimen General 728' },
                { value: 'practicante', label: 'Prácticas Pre/Profesionales' }
              ]}
              value={regimenLaboral}
              onChange={e => setRegimenLaboral(e.target.value as any)}
            />
            <Input
              label="FECHA DE INGRESO"
              type="date"
              value={fechaIngreso}
              onChange={e => setFechaIngreso(e.target.value)}
              required
            />
          </div>

          {editingId && (
            <div className="flex flex-col gap-1.5 justify-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground select-none">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={e => setActivo(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                ¿Trabajador en Actividad? (Desmarcar para Cesados)
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setWorkerDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingId ? 'Actualizar Ficha' : 'Contratar'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
