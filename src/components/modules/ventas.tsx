'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { dbService } from '../../core/services/firebase';
import { Factura, Cliente, Producto, TipoComprobante, FacturaDetalle, EstadoComprobante, MovimientoContable, Kardex } from '../../core/models/types';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, Alert } from '../ui/custom';
import { FileText, Plus, FileSpreadsheet, Download, Printer, Search, Trash2, ShoppingCart, User } from 'lucide-react';

export function VentasModule() {
  const { company } = useCompany();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoComprobante>('factura');
  const [clienteId, setClienteId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days default
  );

  // Multi-item Billing Cart
  const [cartItems, setCartItems] = useState<{ productoId: string; cantidad: number }[]>([]);
  
  // Printable Invoice Overlay State
  const [selectedInvoice, setSelectedInvoice] = useState<Factura | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

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
      const [facData, cliData, prodData] = await Promise.all([
        dbService.getDocuments<Factura>('facturas', company.id),
        dbService.getDocuments<Cliente>('clientes', company.id),
        dbService.getDocuments<Producto>('productos', company.id)
      ]);
      setFacturas(facData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      setClientes(cliData);
      setProductos(prodData);

      if (cliData.length > 0) setClienteId(cliData[0].id);
    } catch (err) {
      console.error('Error loading billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (productos.length === 0) return;
    setCartItems(prev => [...prev, { productoId: productos[0].id, cantidad: 1 }]);
  };

  const handleUpdateCart = (index: number, field: 'productoId' | 'cantidad', value: any) => {
    setCartItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Compute live subtotal, igv, total
  const computeLiveTotals = () => {
    let sub = 0;
    cartItems.forEach(item => {
      const prod = productos.find(p => p.id === item.productoId);
      if (prod) {
        sub += prod.precioVenta * item.cantidad;
      }
    });

    let igvVal = 0;
    let totalVal = 0;

    if (tipo === 'factura') {
      // In Peru, Facturas separate Subtotal and IGV 18%
      igvVal = parseFloat((sub * 0.18).toFixed(2));
      totalVal = parseFloat((sub + igvVal).toFixed(2));
    } else {
      // Boletas often show the full tax-included total, but internally separate it
      // Let's keep it uniform for calculations
      igvVal = parseFloat((sub * 0.18).toFixed(2));
      totalVal = parseFloat((sub + igvVal).toFixed(2));
    }

    return { subtotal: parseFloat(sub.toFixed(2)), igv: igvVal, total: totalVal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    if (!clienteId || cartItems.length === 0) {
      setError('Por favor, selecciona un cliente y añade al menos un producto.');
      return;
    }

    // Verify stock
    let stockValid = true;
    let stockErrorItem = '';
    cartItems.forEach(item => {
      const prod = productos.find(p => p.id === item.productoId);
      if (prod && prod.unidadMedida !== 'servicios' && prod.stockActual < item.cantidad) {
        stockValid = false;
        stockErrorItem = prod.nombre;
      }
    });

    if (!stockValid) {
      setError(`Stock insuficiente para el producto: ${stockErrorItem}.`);
      return;
    }

    const activeClient = clientes.find(c => c.id === clienteId);
    if (!activeClient) {
      setError('Cliente no válido.');
      return;
    }

    const totals = computeLiveTotals();

    setError('');
    try {
      // Generate series and invoice numbers
      const typedInvoices = facturas.filter(f => f.tipo === tipo);
      const nextNum = String(typedInvoices.length + 1).padStart(4, '0');
      const serie = tipo === 'factura' ? 'F001' : 'B001';

      // Build items array
      const detalles: FacturaDetalle[] = cartItems.map(item => {
        const prod = productos.find(p => p.id === item.productoId)!;
        return {
          productoId: item.productoId,
          descripcion: prod.nombre,
          cantidad: item.cantidad,
          precioUnitario: prod.precioVenta,
          total: parseFloat((prod.precioVenta * item.cantidad).toFixed(2))
        };
      });

      const newInvoice: Omit<Factura, 'id'> = {
        empresaId: company.id,
        clienteId,
        clienteNombre: activeClient.nombres,
        clienteDocumento: activeClient.documento,
        tipo,
        serie,
        numero: nextNum,
        fecha: new Date(fecha).toISOString(),
        fechaVencimiento: new Date(fechaVencimiento).toISOString(),
        subtotal: totals.subtotal,
        igv: totals.igv,
        total: totals.total,
        estado: 'pendiente', // Starts unpaid
        detalles
      };

      // 1. Add invoice
      const invoiceDoc = await dbService.addDocument<Factura>('facturas', newInvoice);

      // 2. Adjust products inventory stock & write Kardex
      for (const item of cartItems) {
        const prod = productos.find(p => p.id === item.productoId)!;
        if (prod.unidadMedida !== 'servicios') {
          const newStock = prod.stockActual - item.cantidad;
          await dbService.updateDocument<Producto>('productos', item.productoId, {
            stockActual: newStock
          });

          await dbService.addDocument<Kardex>('kardex', {
            empresaId: company.id,
            productoId: item.productoId,
            fecha: new Date(fecha).toISOString(),
            tipo: 'salida',
            concepto: `Venta Comprobante ${serie}-${nextNum}`,
            cantidad: item.cantidad,
            precioUnitario: prod.precioCompra,
            stockResultante: newStock
          });
        }
      }

      setSuccess('Comprobante electrónico emitido con éxito.');
      setCartItems([]);
      await loadData();

      setTimeout(() => {
        setDialogOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError('Error al emitir el comprobante.');
    }
  };

  const handleConfirmPayment = async (invId: string) => {
    if (!company) return;
    if (!confirm('¿Deseas marcar este comprobante como PAGADO y registrar el ingreso en Caja?')) return;
    try {
      const inv = facturas.find(f => f.id === invId)!;
      
      // Update invoice status
      await dbService.updateDocument<Factura>('facturas', invId, {
        estado: 'pagado',
        metodoPago: 'efectivo'
      });

      // Add movement in caja
      await dbService.addDocument<MovimientoContable>('movimientos', {
        empresaId: company.id,
        fecha: new Date().toISOString(),
        tipo: 'ingreso',
        categoria: 'Venta',
        descripcion: `Cobro de ${inv.tipo.toUpperCase()} ${inv.serie}-${inv.numero}`,
        monto: inv.total,
        metodoPago: 'efectivo',
        usuarioId: 'usr_ventas',
        cajaChica: true
      });

      await loadData();
    } catch (err) {
      console.error('Error settling invoice:', err);
    }
  };

  const handleOpenPrint = (invoice: Factura) => {
    setSelectedInvoice(invoice);
    setPrintOpen(true);
  };

  if (!company) return null;

  const totals = computeLiveTotals();

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Ventas y Facturación
            <Badge variant="success">F001/B001 SUNAT</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Emisión de facturas y boletas comerciales, cálculo del IGV (18%) y descargas imprimibles.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-1.5 font-semibold">
          <Plus className="w-4 h-4" /> Emitir Comprobante
        </Button>
      </div>

      {/* Grid listing invoices */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Historial de Comprobantes Emitidos</CardTitle>
          <CardDescription>Registro del libro de ventas mensuales e ingresos impositivos.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Cargando facturas...</div>
          ) : facturas.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No hay comprobantes de venta emitidos.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo / Número</TableHead>
                  <TableHead>Cliente (Razón Social)</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">IGV (18%)</TableHead>
                  <TableHead className="text-right">Importe Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Operaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(inv.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-bold text-foreground uppercase">{inv.tipo}</span>
                      <span className="text-xs font-mono font-bold text-slate-500 block">{inv.serie}-{inv.numero}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-foreground block">{inv.clienteNombre}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{inv.clienteDocumento}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      S/ {inv.subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-primary">
                      S/ {inv.igv.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-extrabold font-mono text-foreground whitespace-nowrap">
                      S/ {inv.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {inv.estado === 'pagado' ? (
                        <Badge variant="success">Pagado</Badge>
                      ) : (
                        <Badge variant="warning">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenPrint(inv)}
                          className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                          title="Imprimir / Ver Comprobante"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {inv.estado === 'pendiente' && (
                          <button
                            onClick={() => handleConfirmPayment(inv.id)}
                            className="px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            Cobrar
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title="Emitir Nuevo Comprobante de Venta Electrónico">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Tipo de Comprobante</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('factura')}
                  className={`py-2 px-3 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                    tipo === 'factura' 
                      ? 'border-primary bg-primary/10 text-primary font-bold' 
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Factura (RUC)
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('boleta')}
                  className={`py-2 px-3 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                    tipo === 'boleta' 
                      ? 'border-primary bg-primary/10 text-primary font-bold' 
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Boleta (DNI)
                </button>
              </div>
            </div>

            {clientes.length === 0 ? (
              <Alert variant="warning">
                Primero registra un **Cliente** en el directorio antes de facturar.
              </Alert>
            ) : (
              <Select
                label="Seleccionar Cliente"
                options={clientes.map(c => ({ value: c.id, label: `${c.nombres} (${c.documento})` }))}
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de Emisión"
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
            />
            <Input
              label="Fecha de Vencimiento (Plazo Pago)"
              type="date"
              value={fechaVencimiento}
              onChange={e => setFechaVencimiento(e.target.value)}
              required
            />
          </div>

          {/* Cart Section */}
          <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-primary" /> Detalle de Ítems a Facturar
              </span>
              <button
                type="button"
                onClick={handleAddToCart}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer outline-none"
              >
                + Agregar Ítem
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground italic">
                Ningún ítem cargado. Haz click en "+ Agregar Ítem" para facturar.
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Select
                        label={idx === 0 ? "Producto / Servicio" : undefined}
                        options={productos.map(p => ({ value: p.id, label: `${p.nombre} (Stock: ${p.stockActual}) - S/ ${p.precioVenta}` }))}
                        value={item.productoId}
                        onChange={e => handleUpdateCart(idx, 'productoId', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        label={idx === 0 ? "Cant." : undefined}
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={e => handleUpdateCart(idx, 'cantidad', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(idx)}
                      className="p-2 mb-0.5 rounded-lg border border-border bg-card hover:bg-rose-50 text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tax Summary Display */}
          <div className="bg-muted/40 p-4 rounded-xl border border-border flex justify-between items-center">
            <span className="text-xs text-muted-foreground font-semibold uppercase">Resumen Tributario:</span>
            <div className="flex gap-4 text-xs font-mono">
              <span>Subtotal: <strong>S/ {totals.subtotal.toFixed(2)}</strong></span>
              <span>IGV (18%): <strong>S/ {totals.igv.toFixed(2)}</strong></span>
              <span className="text-sm text-foreground">TOTAL EMITIDO: <strong className="text-primary font-extrabold">S/ {totals.total.toFixed(2)}</strong></span>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={clientes.length === 0 || cartItems.length === 0}>
              Emitir Comprobante
            </Button>
          </div>
        </form>
      </Dialog>

      {/* PRINTABLE SUNAT ELECTRONIC RECEIPT DRAWER OVERLAY */}
      <Dialog
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Impresión de Comprobante de Pago Electrónico"
      >
        {selectedInvoice && (
          <div className="flex flex-col gap-6">
            {/* Action buttons */}
            <div className="flex justify-end gap-2 border-b border-border pb-3 no-print">
              <Button 
                variant="outline"
                className="flex items-center gap-1 bg-card text-xs font-semibold"
                onClick={() => alert('Simulando exportación a PDF de SUNAT...')}
              >
                <Download className="w-4 h-4" /> Guardar PDF
              </Button>
              <Button
                className="flex items-center gap-1 text-xs font-semibold"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" /> Imprimir Comprobante
              </Button>
            </div>

            {/* Printable Area - Emulating exact SUNAT invoice sheets */}
            <div className="p-6 bg-white text-slate-900 border border-slate-300 rounded-lg flex flex-col gap-6 font-sans text-xs">
              
              {/* Receipt Header Grid */}
              <div className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-4">
                <div className="col-span-2 flex flex-col gap-1">
                  <span className="font-extrabold text-base uppercase text-primary tracking-wide">
                    {company.razonSocial}
                  </span>
                  <span className="text-slate-500 font-semibold">{company.nombreComercial}</span>
                  <span className="text-[10px] text-slate-500 max-w-[250px] leading-tight">
                    {company.direccion}
                  </span>
                  <span className="text-[10px] text-slate-500">Email: {company.email} | Tel: {company.telefono || '01 400-0000'}</span>
                </div>

                {/* SUNAT Box (RUC - TIPO - CORRELATIVO) */}
                <div className="border-2 border-slate-800 rounded p-3 flex flex-col items-center justify-center text-center gap-1.5">
                  <span className="font-bold text-sm tracking-wider">RUC: {company.ruc}</span>
                  <span className="font-extrabold text-[11px] uppercase bg-slate-950 text-white px-2 py-0.5 rounded-sm">
                    {selectedInvoice.tipo === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
                  </span>
                  <span className="font-bold text-sm tracking-wider font-mono text-slate-700">
                    {selectedInvoice.serie} - {selectedInvoice.numero}
                  </span>
                </div>
              </div>

              {/* Client Info Grid */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4 text-slate-800">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">SEÑOR(ES):</span>
                  <span className="font-bold text-slate-900 text-xs">{selectedInvoice.clienteNombre}</span>
                  <span className="text-[10px]">Documento: <strong className="font-mono">{selectedInvoice.clienteDocumento}</strong></span>
                </div>
                <div className="flex flex-col gap-1 items-end text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">EMISIÓN / PLAZO:</span>
                  <span>Fecha Emisión: <strong>{new Date(selectedInvoice.fecha).toLocaleDateString('es-PE')}</strong></span>
                  <span>Fecha Vcto: <strong>{new Date(selectedInvoice.fechaVencimiento).toLocaleDateString('es-PE')}</strong></span>
                  <span>Moneda: <strong>Soles (PEN)</strong></span>
                </div>
              </div>

              {/* Items Line Table */}
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-slate-600 font-bold">
                    <th className="py-2 w-12 text-center">CANT.</th>
                    <th className="py-2">DESCRIPCIÓN DEL ARTÍCULO</th>
                    <th className="py-2 w-24 text-right">P. UNIT. (S/)</th>
                    <th className="py-2 w-28 text-right">IMPORTE TOTAL (S/)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedInvoice.detalles.map((det, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 text-center font-bold">{det.cantidad}</td>
                      <td className="py-2.5 font-medium">{det.descripcion}</td>
                      <td className="py-2.5 text-right font-mono">{(det.precioUnitario).toFixed(2)}</td>
                      <td className="py-2.5 text-right font-bold font-mono">{det.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Tax totals footer box */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t-2 border-slate-800">
                
                {/* Mock QR and signature */}
                <div className="col-span-2 flex gap-4 items-center">
                  {/* Fictional barcode/QR */}
                  <div className="w-16 h-16 bg-slate-100 border border-slate-300 flex items-center justify-center p-1 text-[8px] text-center font-mono opacity-80 flex-shrink-0 select-none">
                    [QR CODE SUNAT]
                  </div>
                  <div className="flex flex-col gap-0.5 text-[9px] text-slate-500 leading-tight">
                    <span>Representación impresa de la Factura Electrónica.</span>
                    <span>Consulte su validez en: <strong className="text-slate-700">www.sunat.gob.pe</strong></span>
                    <span>Autorizado mediante resolución SUNAT nro 023-2026.</span>
                  </div>
                </div>

                {/* Financial Summary values */}
                <div className="flex flex-col gap-1.5 text-right font-mono">
                  <div className="flex justify-between items-baseline text-[10px]">
                    <span className="text-slate-400 font-semibold uppercase">OP. GRAVADA:</span>
                    <span className="font-bold">S/ {selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[10px] text-primary">
                    <span className="text-primary font-semibold uppercase">I.G.V. 18%:</span>
                    <span className="font-bold">S/ {selectedInvoice.igv.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs border-t border-slate-400 pt-1 text-slate-900 font-extrabold">
                    <span className="font-bold uppercase text-[11px]">IMPORTE TOTAL:</span>
                    <span className="text-sm">S/ {selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setPrintOpen(false)}>
                Volver al listado
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
