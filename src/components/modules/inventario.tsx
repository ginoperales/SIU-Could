'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { dbService } from '../../core/services/firebase';
import { Producto, Kardex } from '../../core/models/types';
import { Button, Input, Select, Card, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, Alert, Tabs } from '../ui/custom';
import { Package, Plus, Search, Tag, Eye, AlertTriangle, ArrowUpRight, ArrowDownRight, ClipboardList } from 'lucide-react';

export function InventarioModule() {
  const { company } = useCompany();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [kardex, setKardex] = useState<Kardex[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Product Dialog State
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [stockActual, setStockActual] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('unidades');

  // Stock Adjust Dialog State
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Producto | null>(null);
  const [adjustTipo, setAdjustTipo] = useState<'entrada' | 'salida'>('entrada');
  const [adjustCantidad, setAdjustCantidad] = useState('');
  const [adjustConcepto, setAdjustConcepto] = useState('Ajuste de inventario manual');

  // Kardex Detail Drawer State
  const [kardexDrawerOpen, setKardexDrawerOpen] = useState(false);
  const [activeKardexProd, setActiveKardexProd] = useState<Producto | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
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
      const [prodData, kdxData] = await Promise.all([
        dbService.getDocuments<Producto>('productos', company.id),
        dbService.getDocuments<Kardex>('kardex', company.id)
      ]);
      setProductos(prodData);
      setKardex(kdxData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setCodigo(`P00${productos.length + 1}`);
    setNombre('');
    setDescripcion('');
    setPrecioVenta('');
    setPrecioCompra('');
    setStockActual('0');
    setStockMinimo('10');
    setUnidadMedida('unidades');
    setError('');
    setProductDialogOpen(true);
  };

  const handleOpenEdit = (p: Producto) => {
    setEditingId(p.id);
    setCodigo(p.codigo);
    setNombre(p.nombre);
    setDescripcion(p.descripcion || '');
    setPrecioVenta(p.precioVenta.toString());
    setPrecioCompra(p.precioCompra.toString());
    setStockActual(p.stockActual.toString());
    setStockMinimo(p.stockMinimo.toString());
    setUnidadMedida(p.unidadMedida);
    setError('');
    setProductDialogOpen(true);
  };

  const handleOpenAdjust = (p: Producto) => {
    setSelectedProd(p);
    setAdjustCantidad('');
    setAdjustConcepto('Ajuste de inventario manual');
    setError('');
    setAdjustDialogOpen(true);
  };

  const handleOpenKardex = (p: Producto) => {
    setActiveKardexProd(p);
    setKardexDrawerOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    if (!codigo || !nombre || !precioVenta || !precioCompra) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setError('');
    try {
      const prodData: Omit<Producto, 'id'> = {
        empresaId: company.id,
        codigo,
        nombre,
        descripcion,
        precioVenta: parseFloat(precioVenta),
        precioCompra: parseFloat(precioCompra),
        stockActual: parseInt(stockActual) || 0,
        stockMinimo: parseInt(stockMinimo) || 10,
        unidadMedida
      };

      if (editingId) {
        await dbService.updateDocument<Producto>('productos', editingId, prodData);
        setSuccess('Producto actualizado correctamente.');
      } else {
        const doc = await dbService.addDocument<Producto>('productos', prodData);
        
        // Log initial float in Kardex if stockActual > 0
        const stockNum = parseInt(stockActual) || 0;
        if (stockNum > 0) {
          await dbService.addDocument<Kardex>('kardex', {
            empresaId: company.id,
            productoId: doc.id,
            fecha: new Date().toISOString(),
            tipo: 'entrada',
            concepto: 'Inventario Inicial',
            cantidad: stockNum,
            precioUnitario: parseFloat(precioCompra),
            stockResultante: stockNum
          });
        }

        setSuccess('Producto registrado con éxito.');
      }

      await loadData();
      setTimeout(() => {
        setProductDialogOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError('Error al registrar el producto.');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !selectedProd) return;

    const cant = parseInt(adjustCantidad);
    if (isNaN(cant) || cant <= 0) {
      setError('Por favor ingresa una cantidad válida mayor a 0.');
      return;
    }

    if (adjustTipo === 'salida' && selectedProd.stockActual < cant) {
      setError('No puedes retirar más del stock disponible.');
      return;
    }

    setError('');
    try {
      const factor = adjustTipo === 'entrada' ? 1 : -1;
      const newStock = selectedProd.stockActual + cant * factor;

      // 1. Update stock in Product document
      await dbService.updateDocument<Producto>('productos', selectedProd.id, {
        stockActual: newStock
      });

      // 2. Append Kardex entry
      await dbService.addDocument<Kardex>('kardex', {
        empresaId: company.id,
        productoId: selectedProd.id,
        fecha: new Date().toISOString(),
        tipo: adjustTipo,
        concepto: adjustConcepto,
        cantidad: cant,
        precioUnitario: selectedProd.precioCompra,
        stockResultante: newStock
      });

      setSuccess('Ajuste de inventario completado.');
      await loadData();

      setTimeout(() => {
        setAdjustDialogOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError('Error al ajustar el inventario.');
    }
  };

  if (!company) return null;

  // Filter products
  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Inventario y Control de Stock
            <Badge variant="info">Kardex Ponderado</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Catálogo de mercadería, alertas de reposición y auditoría de Kardex en almacén.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-1.5 font-semibold">
          <Plus className="w-4 h-4" /> Agregar Producto
        </Button>
      </div>

      {/* Low stock alerts panel */}
      {productos.some(p => p.unidadMedida !== 'servicios' && p.stockActual <= p.stockMinimo) && (
        <Alert variant="warning" title="¡ALERTA: STOCK CRÍTICO!">
          Tienes productos del almacén con stock **por debajo del mínimo de seguridad**. Te sugerimos emitir órdenes de compra prontamente.
        </Alert>
      )}

      {/* Search Filter */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por código o nombre de producto..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Catalog Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Cargando catálogo...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No hay productos registrados en el inventario.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Producto / Descripción</TableHead>
                  <TableHead>U. Medida</TableHead>
                  <TableHead className="text-right">P. Venta</TableHead>
                  <TableHead className="text-right">P. Compra</TableHead>
                  <TableHead className="text-center">Stock Actual</TableHead>
                  <TableHead className="text-center">Operaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(p => {
                  const isLowStock = p.unidadMedida !== 'servicios' && p.stockActual <= p.stockMinimo;
                  return (
                    <TableRow key={p.id} className={isLowStock ? 'bg-amber-50/10' : ''}>
                      <TableCell className="font-mono font-bold text-xs">{p.codigo}</TableCell>
                      <TableCell>
                        <span className="font-bold text-foreground block">{p.nombre}</span>
                        {p.descripcion && <span className="text-[11px] text-muted-foreground block">{p.descripcion}</span>}
                      </TableCell>
                      <TableCell className="capitalize text-xs font-semibold text-slate-500">
                        {p.unidadMedida}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">S/ {p.precioVenta.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">S/ {p.precioCompra.toFixed(2)}</TableCell>
                      <TableCell className="text-center font-bold">
                        {p.unidadMedida === 'servicios' ? (
                          <Badge variant="neutral">Inmaterial</Badge>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={isLowStock ? 'text-rose-600 font-extrabold' : 'text-slate-800 dark:text-slate-200'}>
                              {p.stockActual}
                            </span>
                            {isLowStock && (
                              <Badge variant="danger" className="scale-80 gap-0.5 px-1">
                                <AlertTriangle className="w-3 h-3" /> Reponer (Mín: {p.stockMinimo})
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenKardex(p)}
                            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                            title="Auditar Kardex"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>
                          {p.unidadMedida !== 'servicios' && (
                            <button
                              onClick={() => handleOpenAdjust(p)}
                              className="px-2 py-1 text-xs font-semibold rounded-lg border border-border bg-card text-foreground hover:bg-muted cursor-pointer"
                            >
                              Ajustar Stock
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          >
                            Editar
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CREATE/EDIT PRODUCT DIALOG */}
      <Dialog
        isOpen={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        title={editingId ? 'Editar Ítem del Catálogo' : 'Agregar Nuevo Producto / Servicio'}
      >
        <form onSubmit={handleSubmitProduct} className="flex flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="CÓDIGO INTERNO"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              required
            />
            <div className="col-span-2">
              <Input
                label="NOMBRE DEL PRODUCTO / SERVICIO"
                placeholder="Ej. Kit Cables Cobre Eléctrico"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />
            </div>
          </div>

          <Input
            label="DESCRIPCIÓN COMERCIAL"
            placeholder="Especificaciones o detalles adicionales"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="PRECIO COMPRA (S/)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={precioCompra}
              onChange={e => setPrecioCompra(e.target.value)}
              required
            />
            <Input
              label="PRECIO VENTA (S/)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={precioVenta}
              onChange={e => setPrecioVenta(e.target.value)}
              required
            />
            <Select
              label="UNIDAD MEDIDA"
              options={[
                { value: 'unidades', label: 'Unidades (Und)' },
                { value: 'millares', label: 'Millares (Mill)' },
                { value: 'servicios', label: 'Servicios (Serv)' },
                { value: 'cajas', label: 'Cajas (Caj)' }
              ]}
              value={unidadMedida}
              onChange={e => setUnidadMedida(e.target.value)}
            />
          </div>

          {unidadMedida !== 'servicios' && !editingId && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="STOCK INICIAL DE INGRESO"
                type="number"
                placeholder="0"
                value={stockActual}
                onChange={e => setStockActual(e.target.value)}
              />
              <Input
                label="STOCK MÍNIMO DE SEGURIDAD"
                type="number"
                placeholder="10"
                value={stockMinimo}
                onChange={e => setStockMinimo(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Ítem
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ADJUST STOCK DIALOG */}
      <Dialog
        isOpen={adjustDialogOpen}
        onClose={() => setAdjustDialogOpen(false)}
        title={selectedProd ? `Ajustar Almacén: ${selectedProd.nombre}` : 'Ajustar Inventario'}
      >
        <form onSubmit={handleAdjustStock} className="flex flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Tipo de Ajuste</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustTipo('entrada')}
                  className={`py-2 px-3 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                    adjustTipo === 'entrada' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300' 
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Entrada (Ingreso)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustTipo('salida')}
                  className={`py-2 px-3 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                    adjustTipo === 'salida' 
                      ? 'border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300' 
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Salida (Retiro)
                </button>
              </div>
            </div>

            <Input
              label="Cantidad a Ajustar"
              type="number"
              min="1"
              placeholder="0"
              value={adjustCantidad}
              onChange={e => setAdjustCantidad(e.target.value)}
              required
            />
          </div>

          <Input
            label="Concepto de Operación"
            placeholder="Ej. Ajuste de stock por merma física / ingreso de remanentes"
            value={adjustConcepto}
            onChange={e => setAdjustConcepto(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant={adjustTipo === 'entrada' ? 'success' : 'danger'}>
              Confirmar Ajuste
            </Button>
          </div>
        </form>
      </Dialog>

      {/* KARDEX DRAWER OVERLAY */}
      <Dialog
        isOpen={kardexDrawerOpen}
        onClose={() => setKardexDrawerOpen(false)}
        title={activeKardexProd ? `Libro de Kardex Histórico — ${activeKardexProd.nombre}` : 'Auditoría Kardex'}
      >
        {activeKardexProd && (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-muted border border-border rounded-xl flex justify-between text-xs">
              <span>Código: <strong>{activeKardexProd.codigo}</strong></span>
              <span>U. Medida: <strong>{activeKardexProd.unidadMedida}</strong></span>
              <span>Stock Actual Almacén: <strong className="text-primary">{activeKardexProd.stockActual}</strong></span>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Operación / Concepto</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Stock Result.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kardex.filter(k => k.productoId === activeKardexProd.id).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No hay movimientos de almacén en Kardex registrados para este ítem.
                      </TableCell>
                    </TableRow>
                  ) : (
                    kardex
                      .filter(k => k.productoId === activeKardexProd.id)
                      .map(k => (
                        <TableRow key={k.id}>
                          <TableCell className="font-mono">
                            {new Date(k.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">{k.concepto}</TableCell>
                          <TableCell className="text-center">
                            {k.tipo === 'entrada' ? (
                              <Badge variant="success" className="scale-85">Entrada</Badge>
                            ) : (
                              <Badge variant="danger" className="scale-85">Salida</Badge>
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${k.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {k.tipo === 'entrada' ? '+' : '-'} {k.cantidad}
                          </TableCell>
                          <TableCell className="text-right font-extrabold font-mono text-foreground">
                            {k.stockResultante}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-2 border-t border-border mt-2">
              <Button variant="outline" onClick={() => setKardexDrawerOpen(false)}>
                Cerrar Kardex
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
