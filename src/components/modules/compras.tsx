'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { dbService, storageService } from '../../core/services/firebase';
import { Compra, Proveedor, MovimientoContable } from '../../core/models/types';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, Alert } from '../ui/custom';
import { ShoppingBag, Plus, UploadCloud, FileText, Download, Calendar, Tag, Trash2, Scale } from 'lucide-react';

export function ComprasModule() {
  const { company } = useCompany();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [proveedorId, setProveedorId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [subtotal, setSubtotal] = useState('');
  const [igv, setIgv] = useState('');
  const [total, setTotal] = useState('');
  const [categoria, setCategoria] = useState('Mercadería');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [attachedName, setAttachedName] = useState('');
  const [attachedUrl, setAttachedUrl] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (company) {
      loadData();
    }
  }, [company]);

  // Recalculate IGV and Total when Subtotal changes (18% Peruvian IGV)
  useEffect(() => {
    const sub = parseFloat(subtotal);
    if (!isNaN(sub) && sub > 0) {
      const calcIgv = parseFloat((sub * 0.18).toFixed(2));
      const calcTotal = parseFloat((sub + calcIgv).toFixed(2));
      setIgv(calcIgv.toString());
      setTotal(calcTotal.toString());
    } else {
      setIgv('');
      setTotal('');
    }
  }, [subtotal]);

  const loadData = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [cmpData, provData] = await Promise.all([
        dbService.getDocuments<Compra>('compras', company.id),
        dbService.getDocuments<Proveedor>('proveedores', company.id)
      ]);
      setCompras(cmpData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      setProveedores(provData);
      if (provData.length > 0) {
        setProveedorId(provData[0].id);
      }
    } catch (err) {
      console.error('Error loading purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      simulateUpload(file);
    }
  };

  const simulateUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(10);
    
    // Animate progress bar
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 150);

    try {
      const res = await storageService.uploadFile(`compras/${Date.now()}_${file.name}`, file);
      clearInterval(interval);
      setUploadProgress(100);
      setAttachedName(res.name);
      setAttachedUrl(res.url);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Error al subir el archivo comprobante.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    if (!subtotal || !total || !proveedorId) {
      setError('Por favor completa todos los campos del registro.');
      return;
    }

    const activeProv = proveedores.find(p => p.id === proveedorId);
    if (!activeProv) {
      setError('Proveedor seleccionado no es válido.');
      return;
    }

    setError('');
    try {
      const newCompra: Omit<Compra, 'id'> = {
        empresaId: company.id,
        proveedorId,
        proveedorRazonSocial: activeProv.razonSocial,
        proveedorRuc: activeProv.ruc,
        fecha: new Date(fecha).toISOString(),
        subtotal: parseFloat(subtotal),
        igv: parseFloat(igv),
        total: parseFloat(total),
        categoria,
        adjuntoNombre: attachedName || undefined,
        adjuntoUrl: attachedUrl || undefined
      };

      // 1. Add Compra document
      const doc = await dbService.addDocument<Compra>('compras', newCompra);

      // 2. Automatically register the accounting movement (Expense/Egreso) in the Ledger
      await dbService.addDocument<MovimientoContable>('movimientos', {
        empresaId: company.id,
        fecha: new Date(fecha).toISOString(),
        tipo: 'egreso',
        categoria,
        descripcion: `Compra a Proveedor: ${activeProv.razonSocial}`,
        monto: parseFloat(total),
        metodoPago: 'transferencia',
        usuarioId: 'usr_compras'
      });

      setSuccess('Compra y movimiento tributario registrados con éxito.');
      
      // Reset form
      setSubtotal('');
      setIgv('');
      setTotal('');
      setSelectedFile(null);
      setAttachedName('');
      setAttachedUrl('');
      
      await loadData();
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError('Error al registrar la compra.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro de compra? (Nota: Esto no revierte automáticamente el movimiento del Libro de Caja)')) return;
    try {
      await dbService.deleteDocument('compras', id);
      await loadData();
    } catch (err) {
      console.error('Error deleting purchase:', err);
    }
  };

  if (!company) return null;

  // Summarize KPIs
  const totalEgresoCompras = compras.reduce((sum, c) => sum + c.total, 0);
  const igvCreditoFiscal = compras.reduce((sum, c) => sum + c.igv, 0);

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Control de Compras
            <Badge variant="secondary">Registro Tributario</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Registro de compras corporativas, crédito fiscal (IGV 18%) y almacenamiento de facturas.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-1.5 font-semibold">
          <Plus className="w-4 h-4" /> Registrar Compra
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Egresos de Compras */}
        <Card className="border-l-4 border-l-secondary">
          <CardContent className="flex justify-between items-center py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Compras del Mes</span>
              <span className="text-2xl font-extrabold text-foreground">S/ {totalEgresoCompras.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-muted-foreground">Adquisiciones de mercadería y activos</span>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-secondary">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Credito Fiscal */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex justify-between items-center py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Crédito Fiscal (IGV Compra)</span>
              <span className="text-2xl font-extrabold text-primary">S/ {igvCreditoFiscal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <Scale className="w-3.5 h-3.5" /> IGV 18% compensable en SUNAT
              </span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-primary">
              <Scale className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Cantidad Compras */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex justify-between items-center py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Cantidad de Comprobantes</span>
              <span className="text-2xl font-extrabold text-amber-600">{compras.length} Facturas</span>
              <span className="text-[10px] text-muted-foreground">Almacenados en Storage seguro</span>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchases List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Listado de Compras y Gastos</CardTitle>
          <CardDescription>Auditoría tributaria de egresos comerciales cargados.</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Cargando compras...</div>
          ) : compras.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No hay registros de compras cargados.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor (RUC)</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">IGV (18%)</TableHead>
                  <TableHead className="text-right">Total Pagado</TableHead>
                  <TableHead className="text-center">Comprobante</TableHead>
                  <TableHead className="text-center">Operación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.map(cmp => (
                  <TableRow key={cmp.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(cmp.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-foreground block">{cmp.proveedorRazonSocial}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">RUC: {cmp.proveedorRuc}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                        <Tag className="w-3.5 h-3.5" />
                        {cmp.categoria}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      S/ {cmp.subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-600 font-semibold">
                      S/ {cmp.igv.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold font-mono text-foreground whitespace-nowrap">
                      S/ {cmp.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {cmp.adjuntoNombre ? (
                        <a
                          href={cmp.adjuntoUrl}
                          download={cmp.adjuntoNombre}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
                          title="Descargar comprobante"
                          onClick={e => {
                            e.preventDefault();
                            alert(`Descargando comprobante: ${cmp.adjuntoNombre} (Simulación de Firebase Storage)`);
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin adjunto</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleDelete(cmp.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title="Registrar Nueva Compra / Adquisición">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {proveedores.length === 0 ? (
            <Alert variant="warning">
              Primero debes **registrar un Proveedor** en la pestaña correspondiente antes de cargar una compra.
            </Alert>
          ) : (
            <Select
              label="Seleccionar Proveedor"
              options={proveedores.map(p => ({ value: p.id, label: `${p.razonSocial} (RUC: ${p.ruc})` }))}
              value={proveedorId}
              onChange={e => setProveedorId(e.target.value)}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Categoría Contable de Compra"
              options={[
                { value: 'Mercadería', label: 'Mercadería (Venta directa)' },
                { value: 'Servicios Básicos', label: 'Servicios Públicos (Luz/Agua/SaaS)' },
                { value: 'Activos Fijos', label: 'Activos (Laptops, Maquinarias)' },
                { value: 'Útiles de Oficina', label: 'Útiles y papelería menor' },
                { value: 'Otros Gastos', label: 'Otros Egresos Diversos' }
              ]}
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
            />
            <Input
              label="Fecha del Comprobante"
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Subtotal (S/)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={subtotal}
              onChange={e => setSubtotal(e.target.value)}
              required
            />
            <Input
              label="IGV 18% (Compensable)"
              type="number"
              step="0.01"
              value={igv}
              onChange={e => setIgv(e.target.value)}
              readOnly
              className="bg-muted text-muted-foreground cursor-not-allowed font-semibold"
            />
            <Input
              label="Total Factura (S/)"
              type="number"
              step="0.01"
              value={total}
              onChange={e => setTotal(e.target.value)}
              readOnly
              className="bg-muted font-bold text-foreground cursor-not-allowed"
            />
          </div>

          {/* Drag and Drop File Upload simulation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase">Adjuntar Comprobante Digital (PDF o Imagen)</label>
            
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center gap-2">
                <UploadCloud className="w-8 h-8 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {attachedName ? `Archivo cargado: ${attachedName}` : 'Arrastra o selecciona tu Factura PDF/XML'}
                </span>
                <span className="text-[10px] text-muted-foreground">Formatos admitidos: PDF, JPEG, PNG (máx. 10 MB)</span>
              </div>
            </div>

            {uploading && (
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex justify-between text-[10px] font-semibold text-primary">
                  <span>Subiendo comprobante a Firebase Storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {attachedName && !uploading && (
              <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Archivo vinculado con éxito! Listo para guardar.</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={proveedores.length === 0 || uploading}>
              Registrar Compra
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
