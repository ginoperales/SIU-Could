'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { dbService } from '../../core/services/firebase';
import { Cliente, Proveedor, Factura, Compra } from '../../core/models/types';
import { Button, Input, Card, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, Alert, Tabs } from '../ui/custom';
import { Users, Truck, Plus, Search, Mail, Phone, MapPin, Eye, FileText, Calendar } from 'lucide-react';

export function ContactosModule() {
  const { company } = useCompany();
  const [activeTab, setActiveTab] = useState('clientes');
  const [loading, setLoading] = useState(true);

  // States
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);

  // Dialog State
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');

  // History Drawer State (Ficha Financiera)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // RUC Auto-Lookup States
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState('');

  // Auto fetch details by RUC from SUNAT (Contactos)
  useEffect(() => {
    if (documento.length === 11 && /^\d+$/.test(documento)) {
      const fetchRucDetails = async () => {
        setLoadingRuc(true);
        setRucError('');
        try {
          const { consultarRuc } = await import('../../core/utils/sunat');
          const data = await consultarRuc(documento);
          if (data) {
            setNombre(data.razonSocial);
            setDireccion(data.direccion || 'Lima, Perú');
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
  }, [documento]);

  useEffect(() => {
    if (company) {
      loadData();
    }
  }, [company]);

  const loadData = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [cliData, provData, facData, cmpData] = await Promise.all([
        dbService.getDocuments<Cliente>('clientes', company.id),
        dbService.getDocuments<Proveedor>('proveedores', company.id),
        dbService.getDocuments<Factura>('facturas', company.id),
        dbService.getDocuments<Compra>('compras', company.id)
      ]);
      setClientes(cliData);
      setProveedores(provData);
      setFacturas(facData);
      setCompras(cmpData);
    } catch (err) {
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setNombre('');
    setDocumento('');
    setDireccion('');
    setTelefono('');
    setCorreo('');
    setError('');
    setContactDialogOpen(true);
  };

  const handleOpenEdit = (contact: any) => {
    setEditingId(contact.id);
    setNombre(activeTab === 'clientes' ? contact.nombres : contact.razonSocial);
    setDocumento(activeTab === 'clientes' ? contact.documento : contact.ruc);
    setDireccion(contact.direccion || '');
    setTelefono(contact.telefono || '');
    setCorreo(contact.correo || '');
    setError('');
    setContactDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    if (!nombre || !documento) {
      setError('Nombre/Razón Social y DNI/RUC son obligatorios.');
      return;
    }
    
    // Peruvian doc length validation (DNI = 8, RUC = 11)
    if (documento.length !== 8 && documento.length !== 11) {
      setError('El DNI debe tener 8 dígitos y el RUC debe tener 11 dígitos.');
      return;
    }

    setError('');
    try {
      if (activeTab === 'clientes') {
        const cliData: Omit<Cliente, 'id'> = {
          empresaId: company.id,
          nombres: nombre,
          documento,
          direccion,
          telefono,
          correo,
          fechaCreacion: new Date().toISOString()
        };

        if (editingId) {
          await dbService.updateDocument<Cliente>('clientes', editingId, cliData);
          setSuccess('Cliente actualizado correctamente.');
        } else {
          await dbService.addDocument<Cliente>('clientes', cliData);
          setSuccess('Cliente registrado correctamente.');
        }
      } else {
        const provData: Omit<Proveedor, 'id'> = {
          empresaId: company.id,
          razonSocial: nombre,
          ruc: documento,
          direccion,
          telefono,
          correo,
          fechaCreacion: new Date().toISOString()
        };

        if (editingId) {
          await dbService.updateDocument<Proveedor>('proveedores', editingId, provData);
          setSuccess('Proveedor actualizado correctamente.');
        } else {
          await dbService.addDocument<Proveedor>('proveedores', provData);
          setSuccess('Proveedor registrado correctamente.');
        }
      }

      await loadData();
      setTimeout(() => {
        setContactDialogOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError('Ocurrió un error al procesar el contacto.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este contacto?')) return;
    try {
      await dbService.deleteDocument(activeTab === 'clientes' ? 'clientes' : 'proveedores', id);
      await loadData();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleOpenFicha = (contact: any) => {
    setSelectedContact(contact);
    setDrawerOpen(true);
  };

  if (!company) return null;

  // Filter contacts
  const filteredClientes = clientes.filter(c => 
    c.nombres.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.documento.includes(searchTerm)
  );

  const filteredProveedores = proveedores.filter(p => 
    p.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.ruc.includes(searchTerm)
  );

  // Ficha specific calculations
  const selectedContactHistory = () => {
    if (!selectedContact) return [];
    if (activeTab === 'clientes') {
      return facturas.filter(f => f.clienteId === selectedContact.id);
    } else {
      return compras.filter(c => c.proveedorId === selectedContact.id);
    }
  };

  const totalFinanciero = () => {
    const history = selectedContactHistory();
    return history.reduce((sum, item) => sum + item.total, 0);
  };

  const totalPendiente = () => {
    if (activeTab !== 'clientes') return 0;
    const history = selectedContactHistory() as Factura[];
    return history.filter(f => f.estado === 'pendiente').reduce((sum, f) => sum + f.total, 0);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Directorio de Contactos
            <Badge variant="neutral">Padre de Datos</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Administración centralizada de tus clientes y proveedores comerciales.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-1.5 font-semibold">
          <Plus className="w-4 h-4" /> Registrar {activeTab === 'clientes' ? 'Cliente' : 'Proveedor'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'clientes', label: 'Clientes del ERP', icon: <Users className="w-4 h-4" /> },
          { id: 'proveedores', label: 'Proveedores Homologados', icon: <Truck className="w-4 h-4" /> }
        ]}
        activeTab={activeTab}
        onChange={id => {
          setActiveTab(id);
          setSearchTerm('');
        }}
      />

      {/* Filters */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Buscar ${activeTab === 'clientes' ? 'clientes por nombre o RUC/DNI...' : 'proveedores por Razón Social o RUC...'}`}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Card listing */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Cargando directorio...</div>
          ) : (activeTab === 'clientes' ? filteredClientes : filteredProveedores).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No se encontraron contactos registrados en este módulo.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre / Razón Social</TableHead>
                  <TableHead>{activeTab === 'clientes' ? 'DNI / RUC' : 'RUC Proveedor'}</TableHead>
                  <TableHead>Datos de Contacto</TableHead>
                  <TableHead>Dirección Comercial</TableHead>
                  <TableHead className="text-center">Operaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activeTab === 'clientes' ? filteredClientes : filteredProveedores).map((contact: any) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-bold text-foreground">
                      {activeTab === 'clientes' ? contact.nombres : contact.razonSocial}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {activeTab === 'clientes' ? contact.documento : contact.ruc}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {contact.correo && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {contact.correo}</span>}
                        {contact.telefono && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {contact.telefono}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs max-w-xs truncate">
                      {contact.direccion ? (
                        <span className="flex items-center gap-1 text-slate-500"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {contact.direccion}</span>
                      ) : (
                        <span className="text-slate-400 italic">No especificada</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenFicha(contact)}
                          className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                          title="Ver Ficha Financiera"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(contact)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-card text-foreground hover:bg-muted cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CREATE/EDIT MODAL */}
      <Dialog 
        isOpen={contactDialogOpen} 
        onClose={() => setContactDialogOpen(false)} 
        title={editingId ? `Editar ${activeTab === 'clientes' ? 'Cliente' : 'Proveedor'}` : `Registrar ${activeTab === 'clientes' ? 'Cliente' : 'Proveedor'}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Input
            label={activeTab === 'clientes' ? 'NOMBRES O RAZÓN SOCIAL DEL CLIENTE' : 'RAZÓN SOCIAL (SUNAT)'}
            placeholder="Ej. Consorcio Constructor del Sur"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />

          <div className="relative flex flex-col">
            <Input
              label={activeTab === 'clientes' ? 'DOCUMENTO DNI (8 DÍG.) O RUC (11 DÍG.)' : 'REGISTRO ÚNICO DE CONTRIBUYENTE (RUC)'}
              placeholder={activeTab === 'clientes' ? 'DNI/RUC' : '20XXXXXXXXX'}
              value={documento}
              onChange={e => setDocumento(e.target.value)}
              maxLength={11}
              required
              className="pr-24"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CORREO ELECTRÓNICO"
              type="email"
              placeholder="ejemplo@correo.com"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
            />
            <Input
              label="TELÉFONO DE CONTACTO"
              placeholder="9XXXXXXXX o 01XXXXXX"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
            />
          </div>

          <Input
            label="DIRECCIÓN COMERCIAL FISCAL"
            placeholder="Av. Principal Nro 123, Urb. Industrial, Callao"
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
          />

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingId ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* FICHA FINANCIERA DRAWER DIALOG */}
      <Dialog
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`Ficha Financiera Histórica - ${activeTab === 'clientes' ? 'Cliente' : 'Proveedor'}`}
      >
        {selectedContact && (
          <div className="flex flex-col gap-5">
            {/* Header Contact Details Card */}
            <div className="p-4 bg-muted/60 border border-border rounded-xl flex flex-col gap-2">
              <h3 className="font-extrabold text-foreground text-base">
                {activeTab === 'clientes' ? selectedContact.nombres : selectedContact.razonSocial}
              </h3>
              <div className="grid grid-cols-2 gap-y-1.5 text-xs text-muted-foreground">
                <span>RUC/Doc:</span>
                <span className="font-mono font-bold text-foreground">{activeTab === 'clientes' ? selectedContact.documento : selectedContact.ruc}</span>
                <span>Correo:</span>
                <span className="truncate text-foreground">{selectedContact.correo || 'No registrado'}</span>
                <span>Teléfono:</span>
                <span className="text-foreground">{selectedContact.telefono || 'No registrado'}</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-primary/70">Monto Histórico Total</span>
                <span className="text-xl font-extrabold">S/ {totalFinanciero().toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>

              {activeTab === 'clientes' ? (
                <div className="p-3 bg-amber-100 border border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300 rounded-xl flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold opacity-80">Saldo Pendiente Cobro</span>
                  <span className="text-xl font-extrabold">S/ {totalPendiente().toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
              ) : (
                <div className="p-3 bg-muted border border-border text-foreground rounded-xl flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Compras</span>
                  <span className="text-xl font-extrabold">{selectedContactHistory().length} transacciones</span>
                </div>
              )}
            </div>

            {/* History Table */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wide flex items-center gap-1">
                <FileText className="w-4 h-4 text-primary" /> Historial de Comprobantes emitidos/recibidos
              </h4>
              
              {selectedContactHistory().length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                  No hay comprobantes contables registrados para este contacto.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto rounded-lg border border-border">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Nro Doc</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        {activeTab === 'clientes' && <TableHead className="text-center">Estado</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedContactHistory().map((doc: any) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-mono">
                            {new Date(doc.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}
                          </TableCell>
                          <TableCell className="font-bold text-foreground">
                            {activeTab === 'clientes' ? `${doc.serie}-${doc.numero}` : `FAC-CMP-${doc.id.slice(4)}`}
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            S/ {doc.total.toFixed(2)}
                          </TableCell>
                          {activeTab === 'clientes' && (
                            <TableCell className="text-center">
                              {doc.estado === 'pagado' ? (
                                <Badge variant="success" className="scale-80">Pagado</Badge>
                              ) : (
                                <Badge variant="warning" className="scale-80">Pendiente</Badge>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                Cerrar Ficha
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
