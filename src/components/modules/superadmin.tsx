'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { useAuth } from '../../hooks/useAuth';
import { dbService } from '../../core/services/firebase';
import { Empresa, Usuario, Promocion, Banco, Funcionalidad } from '../../core/models/types';
import { 
  Button, 
  Input, 
  Select, 
  Card, 
  Badge, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell, 
  Dialog, 
  Alert, 
  Tabs 
} from '../ui/custom';
import { 
  Building, 
  Users, 
  TrendingUp, 
  Plus, 
  Search, 
  RefreshCw, 
  Lock, 
  Unlock, 
  ExternalLink, 
  ShieldAlert, 
  Sparkles, 
  ArrowRightLeft,
  Trash2,
  AlertTriangle,
  Edit,
  Percent,
  Calendar
} from 'lucide-react';

export function SuperAdminModule() {
  const { company: activeCompany, selectCompany } = useCompany();
  const { user } = useAuth();
  
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'empresas' | 'usuarios' | 'promociones' | 'tienda-apps-admin'>('empresas');

  // Delete User Dialog
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [deleteUserConfirmInput, setDeleteUserConfirmInput] = useState('');
  const [deleteUserError, setDeleteUserError] = useState('');

  // Promotions State & Fields
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [promoCodigo, setPromoCodigo] = useState('');
  const [promoDescripcion, setPromoDescripcion] = useState('');
  const [promoPorcentaje, setPromoPorcentaje] = useState(20);
  const [promoFechaInicio, setPromoFechaInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [promoFechaFin, setPromoFechaFin] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [promoActivo, setPromoActivo] = useState(true);
  const [promoMostrarLanding, setPromoMostrarLanding] = useState(true);
  const [promoMostrarBannerSuperior, setPromoMostrarBannerSuperior] = useState(true);
  const [promoTipoPlan, setPromoTipoPlan] = useState('Plan Corporativo');

  // CRUD de Funcionalidades (SaaS Módulos)
  const [appsList, setAppsList] = useState<Funcionalidad[]>([]);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [appNombre, setAppNombre] = useState('');
  const [appDescripcion, setAppDescripcion] = useState('');
  const [appIcono, setAppIcono] = useState('Sparkles');
  const [appCategoria, setAppCategoria] = useState<'Core' | 'Avanzado' | 'IA & Analítica' | 'Personalizado'>('Personalizado');
  const [appRubrosSelected, setAppRubrosSelected] = useState<string[]>(['Comercio', 'Servicios']);
  const [appPrecio, setAppPrecio] = useState(19);
  const [appActivo, setAppActivo] = useState(true);
  const [appEsDefault, setAppEsDefault] = useState(false);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!appNombre || !appDescripcion) {
      setError('Por favor, completa todos los campos requeridos para la aplicación.');
      return;
    }

    try {
      const newApp = await dbService.createFuncionalidad({
        nombre: appNombre,
        descripcion: appDescripcion,
        icono: appIcono,
        categoria: appCategoria,
        rubrosRecomendados: appRubrosSelected as any,
        precioMensual: Number(appPrecio),
        activo: appActivo,
        esDefault: appEsDefault
      });

      setSuccess(`Módulo "${newApp.nombre}" creado e integrado en la App Store global con éxito.`);
      setAppDialogOpen(false);

      // Reset
      setAppNombre('');
      setAppDescripcion('');
      setAppPrecio(19);
      setAppActivo(true);
      setAppEsDefault(false);

      await loadSaaSData();
    } catch (err: any) {
      setError(err.message || 'Error al registrar la aplicación.');
    }
  };

  const handleToggleAppActive = async (app: Funcionalidad) => {
    try {
      await dbService.updateFuncionalidad(app.id, { activo: !app.activo });
      setSuccess(`Módulo "${app.nombre}" actualizado a ${!app.activo ? 'ACTIVO' : 'INACTIVO'}.`);
      await loadSaaSData();
    } catch (err) {
      console.error('Error toggling app status:', err);
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!window.confirm('¿Estás totalmente seguro de eliminar este módulo? Se retirará de todas las tiendas de usuarios.')) return;
    try {
      await dbService.deleteFuncionalidad(id);
      setSuccess('Módulo eliminado permanentemente.');
      await loadSaaSData();
    } catch (err) {
      console.error('Error deleting app:', err);
    }
  };

  // Coupon fields in company creation modal
  const [cuponCode, setCuponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Promocion | null>(null);

  // Validate coupon code inside SaaS company registration
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

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [ruc, setRuc] = useState('');
  const [direccion, setDireccion] = useState('');
  const [plan, setPlan] = useState('Plan Corporativo');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminNombre, setAdminNombre] = useState('');

  // RUC Auto-Lookup States
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState('');

  // Auto fetch company details by RUC from SUNAT (SuperAdmin)
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
            setNombreComercial(data.nombreComercial || data.razonSocial.replace(/(SAC|S\.A\.C\.|SA|S\.A\.|EIRL|E\.I\.R\.L\.)/i, '').trim());
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
  }, [ruc]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncingCloud, setSyncingCloud] = useState(false);

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Empresa | null>(null);
  const [confirmEmailInput, setConfirmEmailInput] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Edit Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Empresa | null>(null);
  const [editRazonSocial, setEditRazonSocial] = useState('');
  const [editNombreComercial, setEditNombreComercial] = useState('');
  const [editRuc, setEditRuc] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editPlan, setEditPlan] = useState('Plan Corporativo');
  const [editError, setEditError] = useState('');
  const [editLatitudStr, setEditLatitudStr] = useState('');
  const [editLongitudStr, setEditLongitudStr] = useState('');

  const handleSyncToCloud = async () => {
    setError('');
    setSuccess('');
    setSyncingCloud(true);
    try {
      await dbService.syncToCloudFirestore();
      setSuccess('¡Sincronización completa! Todos los datos locales (empresas, usuarios, cuentas, movimientos e inventarios) han sido respaldados y cargados con éxito en tu base de datos de Cloud Firestore.');
    } catch (err: any) {
      setError(err.message || 'Error al sincronizar con Cloud Firestore.');
    } finally {
      setSyncingCloud(false);
    }
  };

  useEffect(() => {
    loadSaaSData();
  }, []);

  const loadSaaSData = async () => {
    try {
      setLoading(true);
      const listEmpresas = await dbService.getAllCompanies();
      const listUsuarios = await dbService.getAllUsers();
      const listPromociones = await dbService.getAllPromociones();
      const listApps = await dbService.getAllFuncionalidades();
      setEmpresas(listEmpresas);
      setUsuarios(listUsuarios);
      setPromociones(listPromociones);
      setAppsList(listApps);
    } catch (err) {
      console.error('Error loading SaaS master data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!razonSocial || !nombreComercial || !ruc || !direccion || !adminEmail || !adminNombre) {
      setError('Por favor, completa todos los campos requeridos.');
      return;
    }

    if (ruc.length !== 11 || !/^\d+$/.test(ruc)) {
      setError('El RUC en Perú debe constar de exactamente 11 dígitos numéricos.');
      return;
    }

    const pct = appliedDiscount ? appliedDiscount.porcentajeDescuento : 0;
    const baseCost = plan === 'Plan Corporativo' ? 149 : 0;
    const finalCost = baseCost * (1 - pct / 100);

    try {
      const newCompany = await dbService.createCompanyAndAdmin(
        razonSocial,
        nombreComercial,
        ruc,
        direccion,
        plan,
        adminEmail,
        adminNombre,
        appliedDiscount ? appliedDiscount.codigo : undefined,
        pct > 0 ? pct : undefined,
        finalCost
      );

      setSuccess(`Empresa ${razonSocial} registrada con éxito. Se creó el administrador ${adminNombre} y se aplicó plan/cupón.`);
      setCreateDialogOpen(false);
      
      // Reset form
      setRazonSocial('');
      setNombreComercial('');
      setRuc('');
      setDireccion('');
      setAdminEmail('');
      setAdminNombre('');
      setCuponCode('');
      setAppliedDiscount(null);

      // Reload
      await loadSaaSData();
    } catch (err: any) {
      setError(err.message || 'Error al registrar la empresa.');
    }
  };

  // Promotion Management Handlers
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!promoCodigo || !promoDescripcion || !promoFechaInicio || !promoFechaFin) {
      setError('Por favor, completa todos los campos requeridos para la promoción.');
      return;
    }

    try {
      const newPromo = await dbService.createPromocion({
        codigo: promoCodigo.trim().toUpperCase(),
        descripcion: promoDescripcion,
        porcentajeDescuento: Number(promoPorcentaje),
        fechaInicio: promoFechaInicio,
        fechaFin: promoFechaFin,
        activo: promoActivo,
        mostrarLanding: promoMostrarLanding,
        mostrarBannerSuperior: promoMostrarBannerSuperior,
        tipoPlan: promoTipoPlan
      });

      setSuccess(`Promoción "${newPromo.codigo}" creada con éxito.`);
      setPromoDialogOpen(false);

      // Reset
      setPromoCodigo('');
      setPromoDescripcion('');
      setPromoPorcentaje(20);
      setPromoActivo(true);
      setPromoMostrarLanding(true);
      setPromoMostrarBannerSuperior(true);

      await loadSaaSData();
    } catch (err: any) {
      setError(err.message || 'Error al crear la promoción.');
    }
  };

  const handleTogglePromoActive = async (promo: Promocion) => {
    try {
      await dbService.updatePromocion(promo.id, { activo: !promo.activo });
      setSuccess(`Promoción "${promo.codigo}" actualizada a ${!promo.activo ? 'ACTIVO' : 'INACTIVO'}.`);
      await loadSaaSData();
    } catch (err) {
      console.error('Error toggling active:', err);
    }
  };

  const handleTogglePromoLanding = async (promo: Promocion) => {
    try {
      await dbService.updatePromocion(promo.id, { mostrarLanding: !promo.mostrarLanding });
      setSuccess(`Visibilidad en landing para "${promo.codigo}" actualizada.`);
      await loadSaaSData();
    } catch (err) {
      console.error('Error toggling landing:', err);
    }
  };

  const handleTogglePromoBanner = async (promo: Promocion) => {
    try {
      await dbService.updatePromocion(promo.id, { mostrarBannerSuperior: !promo.mostrarBannerSuperior });
      setSuccess(`Visibilidad en banner superior para "${promo.codigo}" actualizada.`);
      await loadSaaSData();
    } catch (err) {
      console.error('Error toggling banner:', err);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm('¿Estás totalmente seguro de eliminar esta promoción? Esto repercutirá de inmediato.')) return;
    try {
      await dbService.deletePromocion(id);
      setSuccess('Promoción eliminada con éxito.');
      await loadSaaSData();
    } catch (err) {
      console.error('Error deleting promotion:', err);
    }
  };

  const toggleCompanyStatus = async (empresaId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'activo' ? 'suspendido' : 'activo';
    try {
      await dbService.updateDocument('empresas', empresaId, { estado: nextStatus });
      setSuccess(`Estado de la empresa actualizado a ${nextStatus.toUpperCase()}.`);
      await loadSaaSData();
      
      // If we are currently viewing the updated company, refresh active context
      if (activeCompany && activeCompany.id === empresaId) {
        const updated = empresas.find(e => e.id === empresaId);
        if (updated) selectCompany({ ...updated, estado: nextStatus as any });
      }
    } catch (err) {
      console.error('Error toggling company status:', err);
    }
  };

  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteUserError('');

    if (!userToDelete) return;

    if (deleteUserConfirmInput.trim().toLowerCase() !== userToDelete.email.trim().toLowerCase()) {
      setDeleteUserError('El correo ingresado no coincide. Inténtalo de nuevo.');
      return;
    }

    try {
      setLoading(true);
      // Delete from Firestore + localStorage via deleteDocument
      await dbService.deleteDocument('usuarios', userToDelete.id);
      setSuccess(`Usuario ${userToDelete.nombre} eliminado permanentemente.`);
      setDeleteUserDialogOpen(false);
      setUserToDelete(null);
      setDeleteUserConfirmInput('');
      await loadSaaSData();
    } catch (err: any) {
      setDeleteUserError(err.message || 'Error al eliminar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    
    if (!companyToDelete) return;
    
    if (confirmEmailInput.trim().toLowerCase() !== companyToDelete.email.trim().toLowerCase()) {
      setDeleteError('El correo ingresado no coincide con el correo registrado de la empresa.');
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Delete from Firestore and local storage using dbService
      await dbService.deleteDocument('empresas', companyToDelete.id);
      
      // 2. Also clean up any users linked to this company to avoid dangling references
      const companyUsers = usuarios.filter(u => u.empresaId === companyToDelete.id);
      for (const u of companyUsers) {
        await dbService.deleteDocument('usuarios', u.id);
      }
      
      setSuccess(`La empresa ${companyToDelete.razonSocial} y sus usuarios han sido eliminados de forma permanente.`);
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      setConfirmEmailInput('');
      
      // If we are currently impersonating this company, stop impersonating
      if (activeCompany && activeCompany.id === companyToDelete.id) {
        handleStopImpersonating();
      }
      
      await loadSaaSData();
    } catch (err: any) {
      setDeleteError(err.message || 'Error al eliminar la empresa.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    
    if (!companyToEdit) return;
    
    if (!editRazonSocial || !editNombreComercial || !editRuc || !editDireccion) {
      setEditError('Por favor, completa todos los campos requeridos.');
      return;
    }
    
    if (editRuc.length !== 11 || !/^\d+$/.test(editRuc)) {
      setEditError('El RUC en Perú debe constar de exactamente 11 dígitos numéricos.');
      return;
    }
    
    let lat: number | undefined = undefined;
    let lng: number | undefined = undefined;

    if (editLatitudStr.trim() !== '') {
      lat = parseFloat(editLatitudStr);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        setEditError('La latitud debe ser un número válido entre -90 y 90.');
        return;
      }
    }

    if (editLongitudStr.trim() !== '') {
      lng = parseFloat(editLongitudStr);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setEditError('La longitud debe ser un número válido entre -180 y 180.');
        return;
      }
    }

    if ((lat !== undefined && lng === undefined) || (lat === undefined && lng !== undefined)) {
      setEditError('Debes especificar tanto la Latitud como la Longitud.');
      return;
    }

    try {
      setLoading(true);
      const updatedFields = {
        razonSocial: editRazonSocial,
        nombreComercial: editNombreComercial,
        ruc: editRuc,
        direccion: editDireccion,
        latitud: lat,
        longitud: lng
      };
      
      await dbService.updateDocument('empresas', companyToEdit.id, updatedFields);
      
      setSuccess(`La empresa ${editRazonSocial} ha sido actualizada con éxito.`);
      setEditDialogOpen(false);
      setCompanyToEdit(null);
      
      // If editing current active company, refresh active context
      if (activeCompany && activeCompany.id === companyToEdit.id) {
        selectCompany({
          ...activeCompany,
          ...updatedFields
        });
      }
      
      await loadSaaSData();
    } catch (err: any) {
      setEditError(err.message || 'Error al actualizar la empresa.');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = (empresa: Empresa) => {
    selectCompany(empresa);
    setSuccess(`[MODO IMPERSONACIÓN ACTIVO] Viendo ahora como: ${empresa.razonSocial}`);
    
    // Automatically smooth scroll or navigate back to dashboard tab
    setTimeout(() => {
      setSuccess('');
    }, 4000);
  };

  const handleStopImpersonating = () => {
    // Revert back to master company (Inversiones Perú)
    const masterCompany = empresas.find(e => e.ruc === '20601234567');
    if (masterCompany) {
      selectCompany(masterCompany);
      setSuccess('Modo impersonación cancelado. Retornado a Consola SaaS.');
    }
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  // Calculations
  const totalEmpresas = empresas.length;
  const totalUsuarios = usuarios.length;
  // Let's assume each company that is corporate pays 149 and emprendedor pays 0
  const activeCorporate = empresas.filter(e => e.estado === 'activo').length; 
  const mrrEstimado = activeCorporate * 149;

  const filteredEmpresas = empresas.filter(emp => 
    emp.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.ruc.includes(searchTerm)
  );

  const getCompanyNameById = (empId: string) => {
    const found = empresas.find(e => e.id === empId);
    return found ? found.razonSocial : 'Desconocido';
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      
      {/* Impersonation Alert Banner */}
      {activeCompany && activeCompany.ruc !== '20601234567' && (
        <Alert variant="warning" className="flex items-center justify-between border-yellow-700/50 bg-yellow-950/40 text-yellow-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span>
              <strong>MODO IMPERSONACIÓN ACTIVO:</strong> Estás visualizando la contabilidad y transacciones de <strong>{activeCompany.razonSocial} (RUC {activeCompany.ruc})</strong>.
            </span>
          </div>
          <Button 
            onClick={handleStopImpersonating} 
            className="bg-yellow-800 text-yellow-100 hover:bg-yellow-700 scale-90 px-3 py-1 font-bold shrink-0"
          >
            Detener Impersonación
          </Button>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 tracking-tight">
            Consola de Administración SaaS (ContaCould)
            <Badge variant="danger" className="animate-pulse">Master Admin</Badge>
          </h1>
          <p className="text-sm text-slate-500">Gestión de tenants, control global de facturación, MRR e impersonación contable.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSyncToCloud}
            disabled={syncingCloud}
            className="flex items-center gap-2 font-bold bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncingCloud ? 'animate-spin' : ''}`} />
            {syncingCloud ? 'Sincronizando Cloud...' : 'Sincronizar a Cloud Firestore'}
          </Button>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2 font-bold shadow-lg shadow-primary/20 bg-gradient-to-tr from-primary to-emerald-500"
          >
            <Plus className="w-4 h-4" />
            Registrar Nueva Empresa
          </Button>
        </div>
      </div>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900/30">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Empresas Registradas</span>
            <span className="text-3xl font-extrabold text-white mt-1">{loading ? '...' : totalEmpresas}</span>
            <span className="text-[10px] text-slate-400 mt-1">SaaS Tenants</span>
          </div>
          <div className="bg-primary/10 p-3.5 rounded-2xl text-primary">
            <Building className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900/30">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Usuarios Totales</span>
            <span className="text-3xl font-extrabold text-white mt-1">{loading ? '...' : totalUsuarios}</span>
            <span className="text-[10px] text-slate-400 mt-1">Colaboradores & Administradores</span>
          </div>
          <div className="bg-secondary/10 p-3.5 rounded-2xl text-secondary">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900/30">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Recurrencia Mensual (MRR)</span>
            <span className="text-3xl font-extrabold text-primary mt-1">S/. {loading ? '...' : mrrEstimado.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 mt-1">Plan Corporativo (S/. 149 / mes)</span>
          </div>
          <div className="bg-emerald-500/10 p-3.5 rounded-2xl text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900/30">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Servidores & API Cloud</span>
            <span className="text-sm font-bold text-white mt-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Operativo (Firebase)
            </span>
            <span className="text-[10px] text-slate-400 mt-1">Uptime 99.99%</span>
          </div>
          <div className="bg-slate-800 p-3.5 rounded-2xl text-slate-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Main Tab Panel */}
      <Tabs 
        tabs={[
          { id: 'empresas', label: 'Directorio de Tenants' },
          { id: 'usuarios', label: 'Usuarios del SaaS' },
          { id: 'promociones', label: 'Promociones & Descuentos' },
          { id: 'tienda-apps-admin', label: 'Tienda de Apps (Admin)' }
        ]}
        activeTab={activeSubTab}
        onChange={(v: any) => setActiveSubTab(v)}
      />

      {/* Tab: Directorio de Empresas */}
      {activeSubTab === 'empresas' && (
        <Card className="p-6 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <Input
                placeholder="Buscar empresa por Razón Social o RUC..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={loadSaaSData} className="flex items-center gap-1 bg-slate-800 text-slate-200 hover:bg-slate-700">
              <RefreshCw className="w-4 h-4" />
              Recargar
            </Button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa / Razón Social</TableHead>
                  <TableHead>RUC (SUNAT)</TableHead>
                  <TableHead>Dirección Registrada</TableHead>
                  <TableHead>Plan Contratado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones de Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">Cargando base de datos maestra...</TableCell>
                  </TableRow>
                ) : filteredEmpresas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">No se encontraron empresas registradas.</TableCell>
                  </TableRow>
                ) : (
                  filteredEmpresas.map(emp => (
                    <TableRow key={emp.id} className={activeCompany?.id === emp.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}>
                      <TableCell className="font-bold text-white flex flex-col">
                        <span>{emp.razonSocial}</span>
                        {emp.nombreComercial && <span className="text-[10px] text-slate-500 font-normal">{emp.nombreComercial}</span>}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{emp.ruc}</TableCell>
                      <TableCell className="text-slate-400 text-xs truncate max-w-xs">{emp.direccion}</TableCell>
                      <TableCell className="flex flex-col gap-1">
                        <Badge variant={emp.plan === 'Plan Corporativo' || emp.ruc === '20601234567' ? 'primary' : 'secondary'}>
                          {emp.plan || (emp.ruc === '20601234567' ? 'Plan Corporativo' : 'Plan Emprendedor')}
                        </Badge>
                        {emp.cuponDescuento && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 animate-pulse">
                            <Sparkles className="w-3 h-3 fill-emerald-500/20" />
                            Cupón: {emp.cuponDescuento} (-{emp.porcentajeDescuento}%)
                          </span>
                        )}
                        {emp.costoMensual !== undefined && emp.costoMensual > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Costo: S/. {emp.costoMensual.toFixed(2)}/mes
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={emp.estado === 'activo' ? 'success' : 'danger'}>
                          {emp.estado === 'activo' ? 'Activo' : 'Suspendido'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        {/* Impersonation Button */}
                        <Button
                          onClick={() => handleImpersonate(emp)}
                          disabled={activeCompany?.id === emp.id}
                          className="flex items-center gap-1.5 scale-90 px-3 py-1 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-200"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                          Impersonar
                        </Button>

                        {/* Edit Button */}
                        <Button
                          onClick={() => {
                            setCompanyToEdit(emp);
                            setEditRazonSocial(emp.razonSocial);
                            setEditNombreComercial(emp.nombreComercial || '');
                            setEditRuc(emp.ruc);
                            setEditDireccion(emp.direccion || '');
                            setEditPlan(emp.ruc === '20601234567' ? 'Plan Corporativo' : 'Plan Emprendedor');
                            setEditLatitudStr(emp.latitud !== undefined ? emp.latitud.toString() : '');
                            setEditLongitudStr(emp.longitud !== undefined ? emp.longitud.toString() : '');
                            setEditError('');
                            setEditDialogOpen(true);
                          }}
                          className="flex items-center gap-1 scale-90 px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-400" />
                          Modificar
                        </Button>
                        
                        {/* Suspend/Activate Button */}
                        <button
                          onClick={() => toggleCompanyStatus(emp.id, emp.estado)}
                          className={`flex items-center gap-1 scale-90 px-2 py-1 rounded-md text-xs font-semibold border cursor-pointer outline-none ${
                            emp.estado === 'activo' 
                              ? 'border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-900/30' 
                              : 'border-emerald-900/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30'
                          }`}
                        >
                          {emp.estado === 'activo' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {emp.estado === 'activo' ? 'Suspender' : 'Activar'}
                        </button>
                        
                        <button
                          onClick={() => {
                            setCompanyToDelete(emp);
                            setConfirmEmailInput('');
                            setDeleteError('');
                            setDeleteDialogOpen(true);
                          }}
                          className="flex items-center gap-1 scale-90 px-2 py-1 rounded-md text-xs font-semibold border border-red-500/30 bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer outline-none transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab: Usuarios SaaS */}
      {activeSubTab === 'usuarios' && (() => {
        const filteredUsuarios = usuarios.filter(u => {
          const term = userSearchTerm.toLowerCase().trim();
          if (!term) return true;
          const companyName = getCompanyNameById(u.empresaId).toLowerCase();
          return (
            u.nombre.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            companyName.includes(term) ||
            u.rol.toLowerCase().includes(term)
          );
        });

        return (
          <Card className="p-6 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-wrap">
              <div>
                <span className="text-sm font-bold text-slate-100">Directorio Global de Usuarios</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {filteredUsuarios.length} de {usuarios.length} usuarios · 1 cuenta · 1 rol por empresa
                </p>
              </div>
              <Button onClick={loadSaaSData} className="flex items-center gap-1 bg-slate-800 text-slate-200 hover:bg-slate-700 scale-90 shrink-0">
                <RefreshCw className="w-3.5 h-3.5" />
                Sincronizar BD
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="user-search-input"
                type="text"
                placeholder="Buscar por nombre, correo, empresa o rol..."
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {userSearchTerm && (
                <button
                  onClick={() => setUserSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer outline-none text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Users List */}
            {loading ? (
              <div className="text-center py-8 text-slate-500">Sincronizando con base de datos...</div>
            ) : filteredUsuarios.length === 0 ? (
              <div className="text-center py-10 text-slate-600 text-sm">
                {userSearchTerm ? `Sin resultados para "${userSearchTerm}".` : 'No hay usuarios registrados en el sistema.'}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredUsuarios.map(u => {
                  const associatedIds = u.empresasAsociadas && u.empresasAsociadas.length > 0
                    ? u.empresasAsociadas
                    : [u.empresaId];
                  const userCompanies = associatedIds
                    .map(id => empresas.find(e => e.id === id))
                    .filter(Boolean) as typeof empresas;

                  return (
                    <div
                      key={u.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:border-slate-700 transition-colors group"
                    >
                      {/* Avatar + Info */}
                      <div className="flex items-start gap-3 sm:w-60 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-base shrink-0">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          <span className="font-bold text-slate-100 text-sm truncate">{u.nombre}</span>
                          <span className="text-[11px] text-slate-500 font-mono truncate">{u.email}</span>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <Badge variant={u.activo ? 'success' : 'danger'} className="scale-90 origin-left">
                              {u.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <span className="text-[10px] text-slate-600">
                              desde {new Date(u.fechaRegistro).toLocaleDateString('es-PE')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="hidden sm:block w-[1px] bg-slate-800 shrink-0" />

                      {/* Companies & Roles */}
                      <div className="flex-1 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Empresas Asignadas ({userCompanies.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {userCompanies.length === 0 ? (
                            <span className="text-xs text-slate-600 italic">Sin empresa asignada</span>
                          ) : (
                            userCompanies.map(emp => (
                              <div
                                key={emp.id}
                                className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs"
                              >
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-200 leading-tight">{emp.razonSocial}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">RUC: {emp.ruc}</span>
                                </div>
                                <div className="border-l border-slate-700 pl-2 ml-1">
                                  <Badge
                                    variant={
                                      u.rol === 'Super Administrador' ? 'danger' :
                                      u.rol === 'Administrador' ? 'primary' :
                                      u.rol === 'Contador' ? 'success' :
                                      u.rol === 'Gerente' ? 'info' : 'secondary'
                                    }
                                    className="whitespace-nowrap"
                                  >
                                    {u.rol}
                                  </Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      {u.rol !== 'Super Administrador' && (
                        <div className="flex items-start justify-end shrink-0">
                          <button
                            onClick={() => {
                              setUserToDelete(u);
                              setDeleteUserConfirmInput('');
                              setDeleteUserError('');
                              setDeleteUserDialogOpen(true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-red-900/40 bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer outline-none transition-all opacity-60 group-hover:opacity-100"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })()}

      {/* --- DIALOG: REGISTRO DE NUEVA EMPRESA --- */}
      <Dialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Registrar Empresa & Crear Administrador Principal"
      >
        <form onSubmit={handleCreateCompany} className="flex flex-col gap-4 mt-2">
          
          <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col gap-1">
            <span className="font-bold text-primary flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" /> Aprovisionamiento SaaS
            </span>
            <span>Este formulario creará automáticamente una nueva empresa (tenant), registrará un usuario administrador asignado a ella y creará una cuenta corriente BCP inicial en Soles con S/. 5,000.00 de fondo de simulación.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative flex flex-col">
              <Input
                label="RUC DE LA EMPRESA (11 DÍGITOS)"
                placeholder="20609876543"
                value={ruc}
                onChange={e => setRuc(e.target.value)}
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
            <Input
              label="RAZÓN SOCIAL (SUNAT)"
              placeholder="Ej. Comercializadora del Norte S.A.C."
              value={razonSocial}
              onChange={e => setRazonSocial(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NOMBRE COMERCIAL"
              placeholder="Ej. Comercial Norte"
              value={nombreComercial}
              onChange={e => setNombreComercial(e.target.value)}
              required
            />
            <Select
              label="PLAN DE SUSCRIPCIÓN"
              options={[
                { value: 'Plan Corporativo', label: 'Plan Corporativo (S/. 149/mes)' },
                { value: 'Plan Emprendedor', label: 'Plan Emprendedor (Gratuito)' }
              ]}
              value={plan}
              onChange={e => setPlan(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CÓDIGO DE DESCUENTO (OPCIONAL)"
              placeholder="Ej. BIENVENIDO2026"
              value={cuponCode}
              onChange={e => setCuponCode(e.target.value)}
              className="font-mono uppercase text-white"
            />
            <div className="flex flex-col justify-end pb-1 text-xs">
              {cuponCode.trim() && (
                appliedDiscount ? (
                  <Badge variant="success" className="py-2.5 px-3 block text-center font-bold">
                    ✓ Cupón: -{appliedDiscount.porcentajeDescuento}% 
                    (Costo final: S/. {(plan === 'Plan Corporativo' ? 149 * (1 - appliedDiscount.porcentajeDescuento / 100) : 0).toFixed(2)}/mes)
                  </Badge>
                ) : (
                  <Badge variant="danger" className="py-2.5 px-3 block text-center font-bold">
                    ✗ Cupón inválido / expirado
                  </Badge>
                )
              )}
              {!cuponCode.trim() && (
                <div className="text-[10px] text-slate-500 italic mt-1.5 pl-1">
                  Ingresa un cupón activo si deseas aplicar descuento.
                </div>
              )}
            </div>
          </div>

          {/* List of active promotions for SaaS Admin's reference */}
          <div className="text-xs text-slate-400 bg-slate-950 border border-slate-800 p-3 rounded-lg flex flex-col gap-1.5">
            <span className="font-semibold text-slate-300">Cupones Activos Disponibles (Haz clic para aplicar):</span>
            {promociones.filter(p => p.activo).length === 0 ? (
              <span className="italic text-slate-500 text-[11px]">No hay promociones activas registradas.</span>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {promociones.filter(p => p.activo).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCuponCode(p.codigo)}
                    className="bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-bold px-2 py-1 rounded text-[10px] hover:bg-slate-800 hover:text-emerald-300 hover:border-emerald-500/30 transition-all cursor-pointer outline-none"
                  >
                    {p.codigo} (-{p.porcentajeDescuento}%)
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input
            label="DIRECCIÓN FISCAL"
            placeholder="Av. Larco 456, Miraflores, Lima"
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
            required
          />

          <div className="border-t border-slate-800 my-1 pt-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">Datos del Administrador Principal</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="NOMBRE COMPLETO"
                placeholder="Ej. Fernando Torres"
                value={adminNombre}
                onChange={e => setAdminNombre(e.target.value)}
                required
              />
              <Input
                label="EMAIL DE ACCESO CORPORATIVO"
                type="email"
                placeholder="fernando@empresa.com"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
            <Button 
              type="button" 
              onClick={() => setCreateDialogOpen(false)}
              className="bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 font-semibold"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-tr from-primary to-emerald-500 font-bold"
            >
              Crear Empresa & Admin
            </Button>
          </div>
        </form>
      </Dialog>

      {/* --- DIALOG: ELIMINACIÓN DE EMPRESA --- */}
      <Dialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Eliminar Empresa Permanentemente"
      >
        <form onSubmit={handleDeleteCompany} className="flex flex-col gap-4 mt-2">
          
          <Alert variant="danger" className="flex flex-col gap-2 border-red-800/50 bg-red-950/40 text-red-200">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              <span>¡ADVERTENCIA DE SEGURIDAD CRÍTICA!</span>
            </div>
            <span className="text-xs">
              Estás a punto de eliminar de forma permanente la empresa <strong>{companyToDelete?.razonSocial}</strong>. Esta acción borrará irrevocablemente todas las facturas, cuentas, compras, bancos, productos y movimientos contables asociados de la nube de Firestore y almacenamiento local. <strong>Esta acción no se puede deshacer.</strong>
            </span>
          </Alert>

          {deleteError && <Alert variant="danger">{deleteError}</Alert>}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">
              PARA CONFIRMAR, ESCRIBE EL CORREO REGISTRADO DE LA EMPRESA:
            </label>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs font-mono text-primary select-all">
              {companyToDelete?.email}
            </div>
            <Input
              type="text"
              placeholder="correo@empresa.com"
              value={confirmEmailInput}
              onChange={e => setConfirmEmailInput(e.target.value)}
              required
              className="bg-slate-950 border-slate-800 focus:border-red-500 text-white mt-1.5"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
            <Button 
              type="button" 
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 font-semibold"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={confirmEmailInput.trim().toLowerCase() !== companyToDelete?.email.trim().toLowerCase()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-30 disabled:hover:bg-red-600"
            >
              Confirmar Eliminación
            </Button>
          </div>
        </form>
      </Dialog>

      {/* --- DIALOG: EDICIÓN DE EMPRESA --- */}
      <Dialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Modificar Datos de Empresa"
      >
        <form onSubmit={handleEditCompany} className="flex flex-col gap-4 mt-2">
          
          {editError && <Alert variant="danger">{editError}</Alert>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="RUC DE LA EMPRESA (11 DÍGITOS)"
              placeholder="20609876543"
              value={editRuc}
              onChange={e => setEditRuc(e.target.value)}
              maxLength={11}
              required
            />
            <Input
              label="RAZÓN SOCIAL (SUNAT)"
              placeholder="Ej. Comercializadora del Norte S.A.C."
              value={editRazonSocial}
              onChange={e => setEditRazonSocial(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NOMBRE COMERCIAL"
              placeholder="Ej. Comercial Norte"
              value={editNombreComercial}
              onChange={e => setEditNombreComercial(e.target.value)}
              required
            />
            <Select
              label="PLAN DE SUSCRIPCIÓN"
              options={[
                { value: 'Plan Corporativo', label: 'Plan Corporativo (S/. 149/mes)' },
                { value: 'Plan Emprendedor', label: 'Plan Emprendedor (Gratuito)' }
              ]}
              value={editPlan}
              onChange={e => setEditPlan(e.target.value)}
            />
          </div>

          <Input
            label="DIRECCIÓN FISCAL"
            placeholder="Av. Larco 456, Miraflores, Lima"
            value={editDireccion}
            onChange={e => setEditDireccion(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="LATITUD (EJ. -12.0463) [OPCIONAL]"
              placeholder="Ej. -12.046374"
              value={editLatitudStr}
              onChange={e => setEditLatitudStr(e.target.value)}
              className="font-mono text-xs text-white"
            />
            <Input
              label="LONGITUD (EJ. -77.0427) [OPCIONAL]"
              placeholder="Ej. -77.042793"
              value={editLongitudStr}
              onChange={e => setEditLongitudStr(e.target.value)}
              className="font-mono text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
            <Button 
              type="button" 
              onClick={() => setEditDialogOpen(false)}
              className="bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 font-semibold"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-tr from-primary to-emerald-500 font-bold"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Dialog>

      {/* --- TAB CONTENT: PROMOCIONES & DESCUENTOS --- */}
      {activeSubTab === 'promociones' && (
        <Card className="p-6 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div className="flex justify-between items-center gap-4">
            <div>
              <span className="text-sm font-bold text-slate-300">Catálogo de Cupones, Promociones y Descuentos del SaaS</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Controla las ofertas que se ven en la Landing Page, banners superiores y facturación.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={loadSaaSData} 
                className="flex items-center gap-1 bg-slate-800 text-slate-200 hover:bg-slate-700 scale-90"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recargar
              </Button>
              <Button 
                onClick={() => setPromoDialogOpen(true)}
                className="flex items-center gap-1 bg-gradient-to-tr from-primary to-emerald-500 text-white font-bold scale-90"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva Promoción
              </Button>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cupón / Código</TableHead>
                  <TableHead>Descripción de la Oferta</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Fechas de Vigencia</TableHead>
                  <TableHead>Afecta a</TableHead>
                  <TableHead className="text-center">En Landing</TableHead>
                  <TableHead className="text-center">En Banner Superior</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">Cargando promociones...</TableCell>
                  </TableRow>
                ) : promociones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">No hay cupones ni promociones registradas.</TableCell>
                  </TableRow>
                ) : (
                  promociones.map(promo => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-mono font-extrabold text-white tracking-wide">
                        {promo.codigo}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs max-w-[200px] truncate" title={promo.descripcion}>
                        {promo.descripcion}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" className="font-bold">
                          -{promo.porcentajeDescuento}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs font-mono">
                        <div className="flex flex-col gap-0.5">
                          <span>Del: {promo.fechaInicio}</span>
                          <span>Al: {promo.fechaFin}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">
                        {promo.tipoPlan || 'Plan Corporativo'}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleTogglePromoLanding(promo)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer outline-none ${
                            promo.mostrarLanding 
                              ? 'bg-emerald-950/20 border-emerald-800 text-emerald-400' 
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          {promo.mostrarLanding ? 'Página Inicio: SÍ' : 'Página Inicio: NO'}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleTogglePromoBanner(promo)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer outline-none ${
                            promo.mostrarBannerSuperior 
                              ? 'bg-emerald-950/20 border-emerald-800 text-emerald-400' 
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          {promo.mostrarBannerSuperior ? 'Banner Superior: SÍ' : 'Banner Superior: NO'}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleTogglePromoActive(promo)}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer outline-none ${
                            promo.activo 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                              : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          {promo.activo ? 'ACTIVO' : 'INACTIVO'}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => handleDeletePromo(promo.id)}
                          className="p-1.5 rounded-md border border-red-500/30 text-red-500 bg-red-950/10 hover:bg-red-600 hover:text-white cursor-pointer outline-none transition-all scale-90"
                          title="Eliminar Promoción"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab: Tienda de Apps (Admin) */}
      {activeSubTab === 'tienda-apps-admin' && (
        <Card className="p-6 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div className="flex justify-between items-center gap-4">
            <div>
              <span className="text-sm font-bold text-slate-100">Catálogo Global de Aplicaciones</span>
              <p className="text-xs text-slate-500 mt-0.5">Define y amplía los módulos modulares disponibles en la plataforma ContaCloud.</p>
            </div>
            <Button 
              onClick={() => setAppDialogOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              <Plus className="w-4 h-4" />
              Crear Nuevo Módulo
            </Button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icono / Aplicación</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Rubros Sugeridos</TableHead>
                  <TableHead>Costo Mensual</TableHead>
                  <TableHead>Por Defecto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">Cargando catálogo...</TableCell>
                  </TableRow>
                ) : appsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">No hay aplicaciones registradas.</TableCell>
                  </TableRow>
                ) : (
                  appsList.map(app => (
                    <TableRow key={app.id}>
                      <TableCell className="font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-indigo-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span>{app.nombre}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-normal">{app.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs truncate max-w-xs" title={app.descripcion}>
                        {app.descripcion}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{app.categoria}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-wrap gap-1">
                          {app.rubrosRecomendados.map(r => (
                            <span key={r} className="bg-slate-900 border border-slate-800 text-slate-300 px-1 py-0.5 rounded text-[9px] font-semibold">{r}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {app.precioMensual === 0 ? (
                          <span className="text-emerald-400 font-bold">Gratis</span>
                        ) : (
                          `S/. ${app.precioMensual.toFixed(2)}/mes`
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {app.esDefault ? 'SÍ' : 'NO'}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleAppActive(app)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer outline-none ${
                            app.activo 
                              ? 'bg-emerald-950/20 border-emerald-800 text-emerald-400' 
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          {app.activo ? 'ACTIVO' : 'INACTIVO'}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => handleDeleteApp(app.id)}
                          className="p-1.5 rounded-md border border-red-500/30 text-red-500 bg-red-950/10 hover:bg-red-600 hover:text-white cursor-pointer outline-none transition-all scale-90"
                          title="Eliminar Aplicación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* --- DIALOG: CREAR PROMOCION --- */}
      <Dialog
        isOpen={promoDialogOpen}
        onClose={() => setPromoDialogOpen(false)}
        title="Crear Nueva Promoción o Cupón de Descuento"
      >
        <form onSubmit={handleCreatePromo} className="flex flex-col gap-4 mt-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CÓDIGO DE CUPÓN (MAYÚSCULAS)"
              placeholder="Ej. DESCUENTO20"
              value={promoCodigo}
              onChange={e => setPromoCodigo(e.target.value)}
              className="font-mono uppercase text-white"
              required
            />
            <Input
              label="PORCENTAJE DE DESCUENTO (1-100%)"
              type="number"
              min={1}
              max={100}
              placeholder="20"
              value={promoPorcentaje}
              onChange={e => setPromoPorcentaje(Number(e.target.value))}
              required
            />
          </div>

          <Input
            label="DESCRIPCIÓN DE LA OFERTA"
            placeholder="Ej. Descuento especial de mitad de año 20% en Plan Corporativo"
            value={promoDescripcion}
            onChange={e => setPromoDescripcion(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="FECHA DE INICIO DE VIGENCIA"
              type="date"
              value={promoFechaInicio}
              onChange={e => setPromoFechaInicio(e.target.value)}
              required
            />
            <Input
              label="FECHA DE EXPIRACIÓN"
              type="date"
              value={promoFechaFin}
              onChange={e => setPromoFechaFin(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="PLAN AFECTADO"
              options={[
                { value: 'Plan Corporativo', label: 'Plan Corporativo' },
                { value: 'Plan Emprendedor', label: 'Plan Emprendedor' }
              ]}
              value={promoTipoPlan}
              onChange={e => setPromoTipoPlan(e.target.value)}
            />
            <div className="flex flex-col justify-end pb-1 text-slate-400 text-xs pl-1">
              Selecciona el plan sobre el cual se aplicará la promoción.
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 my-1 flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Configuración de Visualización</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs font-medium text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={promoActivo}
                  onChange={e => setPromoActivo(e.target.checked)}
                  className="rounded border-slate-800 text-primary focus:ring-primary h-4 w-4 bg-slate-900 cursor-pointer"
                />
                Activo
              </label>

              <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs font-medium text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={promoMostrarLanding}
                  onChange={e => setPromoMostrarLanding(e.target.checked)}
                  className="rounded border-slate-800 text-primary focus:ring-primary h-4 w-4 bg-slate-900 cursor-pointer"
                />
                Mostrar en Landing
              </label>

              <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs font-medium text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={promoMostrarBannerSuperior}
                  onChange={e => setPromoMostrarBannerSuperior(e.target.checked)}
                  className="rounded border-slate-800 text-primary focus:ring-primary h-4 w-4 bg-slate-900 cursor-pointer"
                />
                Mostrar en Banner
              </label>

            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
            <Button 
              type="button" 
              onClick={() => setPromoDialogOpen(false)}
              className="bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 font-semibold"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-tr from-primary to-emerald-500 font-bold"
            >
              Crear Promoción
            </Button>
          </div>
        </form>
      </Dialog>

      {/* --- DIALOG: ELIMINAR USUARIO --- */}
      <Dialog
        isOpen={deleteUserDialogOpen}
        onClose={() => { setDeleteUserDialogOpen(false); setUserToDelete(null); setDeleteUserConfirmInput(''); setDeleteUserError(''); }}
        title="Eliminar Usuario"
      >
        {userToDelete && (
          <form onSubmit={handleDeleteUser} className="flex flex-col gap-4 mt-2">
            <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm font-bold text-red-400">Acción irreversible</span>
              </div>
              <p className="text-xs text-slate-400">
                Estás a punto de eliminar permanentemente al usuario{' '}
                <strong className="text-white">{userToDelete.nombre}</strong> ({userToDelete.email}).
                Esta acción eliminará su cuenta de Firestore y localStorage.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Usuario a eliminar</span>
              <span className="text-sm font-bold text-slate-100">{userToDelete.nombre}</span>
              <span className="text-xs text-slate-500 font-mono">{userToDelete.email}</span>
              <div className="mt-1">
                <Badge variant={userToDelete.rol === 'Administrador' ? 'primary' : 'secondary'}>
                  {userToDelete.rol}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Confirma escribiendo el correo del usuario:
              </label>
              <input
                type="email"
                placeholder={userToDelete.email}
                value={deleteUserConfirmInput}
                onChange={e => setDeleteUserConfirmInput(e.target.value)}
                autoComplete="off"
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-red-900/50 rounded-lg outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-white transition-all"
              />
            </div>

            {deleteUserError && (
              <Alert variant="danger">{deleteUserError}</Alert>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-1">
              <Button
                type="button"
                onClick={() => { setDeleteUserDialogOpen(false); setUserToDelete(null); setDeleteUserConfirmInput(''); setDeleteUserError(''); }}
                className="bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 font-semibold"
              >
                Cancelar
              </Button>
              <button
                type="submit"
                disabled={deleteUserConfirmInput.trim().toLowerCase() !== userToDelete.email.trim().toLowerCase()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all outline-none"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Permanentemente
              </button>
            </div>
          </form>
        )}
      </Dialog>

      {/* --- DIALOG: CREAR FUNCIONALIDAD (SUPERADMIN) --- */}
      <Dialog
        isOpen={appDialogOpen}
        onClose={() => setAppDialogOpen(false)}
        title="Registrar Nueva Aplicación o Módulo ERP"
      >
        <form onSubmit={handleCreateApp} className="flex flex-col gap-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NOMBRE DEL MÓDULO"
              placeholder="Ej. Auditoría Tributaria"
              value={appNombre}
              onChange={e => setAppNombre(e.target.value)}
              required
            />
            <Input
              label="COSTO MENSUAL (S/. POR TENANT)"
              type="number"
              min={0}
              placeholder="19"
              value={appPrecio}
              onChange={e => setAppPrecio(Number(e.target.value))}
              required
            />
          </div>

          <Input
            label="DESCRIPCIÓN COMERCIAL"
            placeholder="Ej. Reportes de contingencias de facturación y detección de inconsistencias SUNAT."
            value={appDescripcion}
            onChange={e => setAppDescripcion(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="CATEGORÍA"
              options={[
                { value: 'Core', label: 'Core (Económico)' },
                { value: 'Avanzado', label: 'Avanzado' },
                { value: 'IA & Analítica', label: 'IA & Analítica' },
                { value: 'Personalizado', label: 'Personalizado (Custom app)' }
              ]}
              value={appCategoria}
              onChange={e => setAppCategoria(e.target.value as any)}
            />
            <Input
              label="ICONO (LUCIDE ICON STRING)"
              placeholder="Ej. Shield, Wallet, Sparkles, Building"
              value={appIcono}
              onChange={e => setAppIcono(e.target.value)}
              required
            />
          </div>

          {/* Rubros checklists */}
          <div className="border-t border-slate-800 pt-3 my-1 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Rubros Sugeridos / Recomendados</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Comercio', 'Servicios', 'Manufactura', 'Construcción'].map(rub => {
                const isSel = appRubrosSelected.includes(rub);
                return (
                  <label key={rub} className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-2 rounded-lg text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => {
                        setAppRubrosSelected(prev => 
                          prev.includes(rub) ? prev.filter(r => r !== rub) : [...prev, rub]
                        );
                      }}
                      className="rounded border-slate-800 text-primary h-4 w-4 bg-slate-900 cursor-pointer"
                    />
                    {rub}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-xs font-medium text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={appActivo}
                onChange={e => setAppActivo(e.target.checked)}
                className="rounded border-slate-800 text-primary h-4 w-4 bg-slate-900 cursor-pointer"
              />
              Habilitado de inmediato en Tienda
            </label>

            <label className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-xs font-medium text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={appEsDefault}
                onChange={e => setAppEsDefault(e.target.checked)}
                className="rounded border-slate-800 text-primary h-4 w-4 bg-slate-900 cursor-pointer"
              />
              Módulo Core por Defecto
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
            <Button 
              type="button" 
              onClick={() => setAppDialogOpen(false)}
              className="bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 font-semibold"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              Crear Módulo
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
}
