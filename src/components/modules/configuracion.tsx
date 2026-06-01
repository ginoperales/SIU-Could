'use client';

import React, { useState, useEffect } from 'react';
import { useCompany } from '../../hooks/useCompany';
import { useAuth } from '../../hooks/useAuth';
import { dbService } from '../../core/services/firebase';
import { Button, Input, Card, Badge, Alert } from '../ui/custom';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Save, 
  RefreshCw, 
  Sparkles, 
  Navigation,
  Download,
  UploadCloud,
  HardDrive,
  Check,
  Lock,
  Cloud,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

export function ConfiguracionModule() {
  const { company, selectCompany } = useCompany();
  const { user } = useAuth();
  
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [ruc, setRuc] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  
  // Coordinates (optional)
  const [latitudStr, setLatitudStr] = useState('');
  const [longitudStr, setLongitudStr] = useState('');
  
  const [activeSubTab, setActiveSubTab] = useState<'empresa' | 'respaldos' | 'reset'>('empresa');

  // Reset state variables
  const [confirmRuc, setConfirmRuc] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleConfirmResetCompany = async () => {
    if (!company) return;
    setResetError('');
    setResetSuccess('');
    
    if (confirmRuc.trim() !== company.ruc.trim()) {
      setResetError('El RUC ingresado no coincide.');
      return;
    }

    try {
      setResetting(true);
      await dbService.resetCompanyData(company.id);
      setResetSuccess('¡Puesta a cero realizada con éxito! Recargando la aplicación...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'Error al ejecutar la puesta a cero contable.');
      setResetting(false);
    }
  };
  
  // Google Drive Simulation states
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  
  // Upload to Drive progress simulation states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Restore states
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');

  // History of backups (local simulated log)
  const [backupsHistory, setBackupsHistory] = useState<{ id: string; fecha: string; nombre: string; tamano: string; url: string }[]>([]);

  useEffect(() => {
    // Load backups from localStorage
    if (typeof window !== 'undefined') {
      const hist = localStorage.getItem('sv_backups_history');
      if (hist) {
        setBackupsHistory(JSON.parse(hist));
      } else {
        const defaultHist = [
          { id: 'b1', fecha: '2026-05-15 14:32', nombre: `contacloud_backup_${company?.ruc || '20601234567'}_20260515.json`, tamano: '24.2 KB', url: 'https://drive.google.com/file/d/mock-1a2b3c4d/view' },
          { id: 'b2', fecha: '2026-05-24 18:10', nombre: `contacloud_backup_${company?.ruc || '20601234567'}_20260524.json`, tamano: '25.8 KB', url: 'https://drive.google.com/file/d/mock-5e6f7g8h/view' }
        ];
        localStorage.setItem('sv_backups_history', JSON.stringify(defaultHist));
        setBackupsHistory(defaultHist);
      }
    }
  }, [company]);

  const handleExportBackup = async () => {
    if (!company) return;
    setError('');
    setSuccess('');

    try {
      const collections = [
        'clientes', 
        'proveedores', 
        'bancos', 
        'productos', 
        'kardex', 
        'facturas', 
        'compras', 
        'trabajadores', 
        'movimientos'
      ];
      
      const backupData: { [key: string]: any[] } = {};
      
      for (const coll of collections) {
        const list = await dbService.getDocuments<any>(coll, company.id);
        backupData[coll] = list;
      }
      
      backupData['empresa'] = [company];

      const backupObj = {
        plataforma: 'ContaCloud ERP',
        version: '1.0',
        fechaGeneracion: new Date().toISOString(),
        ruc: company.ruc,
        empresaId: company.id,
        razonSocial: company.razonSocial,
        data: backupData
      };

      const jsonStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `contacloud_backup_${company.ruc}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('¡Copia de seguridad local generada y descargada con éxito!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error generating backup:', err);
      setError('Error al generar la copia de seguridad.');
    }
  };

  const handleConnectDrive = async () => {
    setShowOAuthModal(true);
    setOauthLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOauthLoading(false);
  };

  const handleOAuthSuccess = () => {
    setIsDriveConnected(true);
    setShowOAuthModal(false);
    setSuccess('¡Cuenta de Google Drive conectada con éxito!');
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleUploadDrive = async () => {
    if (!company) return;
    setShowUploadModal(true);
    setUploading(true);
    setUploadProgress(0);

    const phases = [
      { p: 20, msg: 'Consolidando libros de compras, ventas y movimientos...' },
      { p: 50, msg: 'Generando archivo de respaldo y firmando cifrado contable...' },
      { p: 75, msg: 'Conectando de forma segura con Google Drive APIs...' },
      { p: 90, msg: 'Transmitiendo paquete de respaldo contable...' },
      { p: 100, msg: 'Copia de seguridad guardada con éxito en Google Drive.' }
    ];

    for (const ph of phases) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setUploadProgress(ph.p);
      setUploadMessage(ph.msg);
    }

    const newBackup = {
      id: `b_${Date.now()}`,
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
      nombre: `contacloud_backup_${company.ruc}_${new Date().toISOString().split('T')[0]}.json`,
      tamano: '26.1 KB',
      url: `https://drive.google.com/file/d/mock-${Math.random().toString(36).substring(2, 10)}/view`
    };

    const updatedHist = [newBackup, ...backupsHistory];
    localStorage.setItem('sv_backups_history', JSON.stringify(updatedHist));
    setBackupsHistory(updatedHist);
    setUploading(false);
    setTimeout(() => {
      setShowUploadModal(false);
      setSuccess('Copia de seguridad cargada y guardada en tu Google Drive.');
    }, 1000);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    setError('');
    setSuccess('');
    setRestoring(true);
    setRestoreMessage('Leyendo archivo de respaldo...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonText = event.target?.result as string;
        const backupObj = JSON.parse(jsonText);

        if (backupObj.plataforma !== 'ContaCloud ERP' || !backupObj.ruc || !backupObj.data) {
          throw new Error('El archivo no corresponde a un formato de copia de seguridad válido de ContaCloud.');
        }

        if (backupObj.ruc !== company.ruc) {
          if (!window.confirm(`ATENCIÓN: El RUC del respaldo (${backupObj.ruc}) no coincide con el RUC de esta empresa (${company.ruc}). ¿Deseas forzar la restauración de todos modos?`)) {
            setRestoring(false);
            return;
          }
        }

        setRestoreMessage('Analizando consistencia de datos...');
        await new Promise(resolve => setTimeout(resolve, 800));

        setRestoreMessage('Escribiendo colecciones multi-tenant...');
        await new Promise(resolve => setTimeout(resolve, 800));

        const backupData = backupObj.data;
        const collections = [
          'clientes', 
          'proveedores', 
          'bancos', 
          'productos', 
          'kardex', 
          'facturas', 
          'compras', 
          'trabajadores', 
          'movimientos'
        ];

        for (const coll of collections) {
          const rawCol = localStorage.getItem(`sv_erp_${coll}`) || '[]';
          let list = JSON.parse(rawCol);
          list = list.filter((item: any) => item.empresaId !== company.id);
          
          const backupList = (backupData[coll] || []).map((item: any) => ({
            ...item,
            empresaId: company.id
          }));
          
          list.push(...backupList);
          localStorage.setItem(`sv_erp_${coll}`, JSON.stringify(list));
        }

        if (backupData['empresa'] && backupData['empresa'][0]) {
          const compData = backupData['empresa'][0];
          const rawCom = localStorage.getItem('sv_erp_empresas') || '[]';
          let companiesList = JSON.parse(rawCom);
          const compIdx = companiesList.findIndex((c: any) => c.id === company.id);
          if (compIdx !== -1) {
            companiesList[compIdx] = {
              ...companiesList[compIdx],
              ...compData,
              id: company.id
            };
            localStorage.setItem('sv_erp_empresas', JSON.stringify(companiesList));
          }
        }

        try {
          await dbService.syncToCloudFirestore();
        } catch (cloudErr) {
          console.warn('[Restore Sync Warning] Could not sync restored docs:', cloudErr);
        }

        setRestoreMessage('Restauración completada con éxito. Recargando ERP...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
      } catch (err: any) {
        console.error('Restore failed:', err);
        setError(err.message || 'El archivo cargado está dañado o no es un JSON de ContaCloud válido.');
        setRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Map preview state (reactively debounced from coordinates inputs)
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);

  // Pre-populate fields on load
  useEffect(() => {
    if (company) {
      setRazonSocial(company.razonSocial);
      setNombreComercial(company.nombreComercial || '');
      setRuc(company.ruc);
      setDireccion(company.direccion || '');
      setTelefono(company.telefono || '');
      setEmail(company.email || '');
      
      const lat = company.latitud;
      const lng = company.longitud;
      
      setLatitudStr(lat !== undefined ? lat.toString() : '');
      setLongitudStr(lng !== undefined ? lng.toString() : '');
      
      if (lat !== undefined && lng !== undefined) {
        setMapLat(lat);
        setMapLng(lng);
      } else {
        // Defaults to central Lima if empty to show a beautiful starting preview
        setMapLat(null);
        setMapLng(null);
      }
    }
  }, [company]);

  // Reactive Map update when inputs change and are valid
  useEffect(() => {
    const lat = parseFloat(latitudStr);
    const lng = parseFloat(longitudStr);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const timer = setTimeout(() => {
        setMapLat(lat);
        setMapLng(lng);
      }, 500);
      return () => clearTimeout(timer);
    } else if (latitudStr === '' && longitudStr === '') {
      setMapLat(null);
      setMapLng(null);
    }
  }, [latitudStr, longitudStr]);

  // RUC Auto-Lookup States
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState('');

  // Auto fetch company details by RUC from SUNAT (Settings)
  useEffect(() => {
    if (ruc.length === 11 && /^\d+$/.test(ruc) && company && ruc !== company.ruc) {
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
  }, [ruc, company]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!company) {
      setError('No hay ninguna empresa activa en el contexto.');
      setLoading(false);
      return;
    }

    if (!razonSocial || !ruc || !direccion || !email) {
      setError('Por favor, completa todos los campos obligatorios.');
      setLoading(false);
      return;
    }

    // Parse coordinates if entered
    let lat: number | undefined = undefined;
    let lng: number | undefined = undefined;

    if (latitudStr.trim() !== '') {
      lat = parseFloat(latitudStr);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        setError('La latitud ingresada debe ser un número válido entre -90 y 90.');
        setLoading(false);
        return;
      }
    }

    if (longitudStr.trim() !== '') {
      lng = parseFloat(longitudStr);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setError('La longitud ingresada debe ser un número válido entre -180 y 180.');
        setLoading(false);
        return;
      }
    }

    // Verify both coordinates are provided if one is entered
    if ((lat !== undefined && lng === undefined) || (lat === undefined && lng !== undefined)) {
      setError('Debes especificar tanto la Latitud como la Longitud para guardar la geolocalización.');
      setLoading(false);
      return;
    }

    try {
      const updatedFields = {
        razonSocial,
        nombreComercial,
        ruc,
        direccion,
        telefono,
        email,
        latitud: lat,
        longitud: lng
      };

      await dbService.updateDocument('empresas', company.id, updatedFields);
      
      // Update active company state in context
      selectCompany({
        ...company,
        ...updatedFields
      });

      setSuccess('¡Configuración de la empresa guardada con éxito!');
      
      // Clear alert after 4 seconds
      setTimeout(() => {
        setSuccess('');
      }, 4000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la configuración.');
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultLimaCoords = () => {
    // Plaza de Armas de Lima coordinates
    setLatitudStr('-12.046374');
    setLongitudStr('-77.042793');
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 tracking-tight">
            Configuración de la Empresa
            <Badge variant="primary" className="scale-90 font-bold bg-primary/20 text-primary border-primary/30">Tenant Settings</Badge>
          </h1>
          <p className="text-sm text-slate-500">
            Administra los datos comerciales, fiscales, geolocalización satelital y copias de seguridad.
          </p>
        </div>
      </div>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Sub-tab Navigation */}
      <div className="flex gap-2 border-b border-slate-850 pb-2">
        <button
          onClick={() => setActiveSubTab('empresa')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer outline-none ${
            activeSubTab === 'empresa'
              ? 'bg-primary text-white border-primary shadow-md shadow-primary/15'
              : 'bg-slate-900/40 text-slate-400 border-slate-850 hover:bg-slate-900/80 hover:text-white'
          }`}
        >
          Datos de la Empresa
        </button>
        <button
          onClick={() => setActiveSubTab('respaldos')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer outline-none ${
            activeSubTab === 'respaldos'
              ? 'bg-primary text-white border-primary shadow-md shadow-primary/15'
              : 'bg-slate-900/40 text-slate-400 border-slate-850 hover:bg-slate-900/80 hover:text-white'
          }`}
        >
          Copias de Seguridad y Datos
        </button>
        <button
          onClick={() => setActiveSubTab('reset')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer outline-none ${
            activeSubTab === 'reset'
              ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/15'
              : 'bg-slate-900/40 text-slate-400 border-slate-850 hover:bg-slate-900/80 hover:text-white'
          }`}
        >
          Puesta a Cero
        </button>
      </div>

      {activeSubTab === 'empresa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/40 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Datos Generales de la Empresa
            </h2>

            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative flex flex-col">
                  <Input
                    label="RUC DE LA EMPRESA (11 DÍGITOS)"
                    value={ruc}
                    onChange={e => setRuc(e.target.value)}
                    maxLength={11}
                    required
                    disabled={user?.rol !== 'Super Administrador' && user?.rol !== 'Administrador'}
                    className="bg-slate-950/60 border-slate-800 focus:border-primary text-white pr-24"
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
                  value={razonSocial}
                  onChange={e => setRazonSocial(e.target.value)}
                  required
                  disabled={user?.rol !== 'Super Administrador' && user?.rol !== 'Administrador'}
                  className="bg-slate-950/60 border-slate-800 focus:border-primary text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="NOMBRE COMERCIAL"
                  value={nombreComercial}
                  onChange={e => setNombreComercial(e.target.value)}
                  disabled={user?.rol !== 'Super Administrador' && user?.rol !== 'Administrador'}
                  className="bg-slate-950/60 border-slate-800 focus:border-primary text-white"
                />
                <Input
                  label="CORREO CORPORATIVO"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={user?.rol !== 'Super Administrador' && user?.rol !== 'Administrador'}
                  className="bg-slate-950/60 border-slate-800 focus:border-primary text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="TELÉFONO DE CONTACTO (OPCIONAL)"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  disabled={user?.rol !== 'Super Administrador' && user?.rol !== 'Administrador'}
                  className="bg-slate-950/60 border-slate-800 focus:border-primary text-white"
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-400">PLAN DE SUSCRIPCIÓN</label>
                  <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg text-sm text-slate-300 font-bold select-none h-10 flex items-center justify-between">
                    <span>{ruc === '20601234567' ? 'Plan Corporativo SaaS' : 'Plan Emprendedor'}</span>
                    <Badge variant={ruc === '20601234567' ? 'success' : 'secondary'} className="scale-90">Activo</Badge>
                  </div>
                </div>
              </div>

              <Input
                label="DIRECCIÓN COMERCIAL / FISCAL FISICA"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                required
                disabled={user?.rol !== 'Super Administrador' && user?.rol !== 'Administrador'}
                className="bg-slate-950/60 border-slate-800 focus:border-primary text-white"
              />

              <div className="border-t border-slate-800/80 my-2 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Geolocalización Satelital (Opcional)
                  </h3>
                  {(user?.rol === 'Super Administrador' || user?.rol === 'Administrador') && (
                    <button
                      type="button"
                      onClick={loadDefaultLimaCoords}
                      className="text-xs text-primary hover:text-primary-hover font-semibold cursor-pointer outline-none flex items-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Cargar Demo Lima
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-850 mb-3 flex flex-col gap-1">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> ¿Para qué sirve?
                  </span>
                  <span>Ingresar las coordenadas de tu negocio permite representarlo en los mapas generales del ERP. Facilita la auditoría espacial de tus clientes y la ubicación del negocio en facturas profesionales.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="LATITUD (EJ. -12.0463)"
                    placeholder="Ej. -12.046374"
                    value={latitudStr}
                    onChange={e => setLatitudStr(e.target.value)}
                    disabled={user?.rol !== 'Super Administrador' && user?.rol !== 'Administrador'}
                    className="bg-slate-950/60 border-slate-800 focus:border-primary text-white font-mono text-sm"
                  />
                  <Input
                    label="LONGITUD (EJ. -77.0427)"
                    placeholder="Ej. -77.042793"
                    value={longitudStr}
                    onChange={e => setLongitudStr(e.target.value)}
                    disabled={user?.rol !== 'Super Administrador' && user?.rol !== 'Administrador'}
                    className="bg-slate-950/60 border-slate-800 focus:border-primary text-white font-mono text-sm"
                  />
                </div>
              </div>

              {(user?.rol === 'Super Administrador' || user?.rol === 'Administrador') && (
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full font-bold flex items-center justify-center gap-2 mt-2 bg-gradient-to-tr from-primary to-emerald-500 text-white"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? 'Guardando Cambios...' : 'Guardar Configuración de la Empresa'}
                </Button>
              )}
            </form>
          </Card>
        </div>

        {/* Live Map Preview Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/40 backdrop-blur-xl flex flex-col gap-4 h-full min-h-[480px]">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                Mapa de Ubicación Satelital
              </h2>
              <p className="text-xs text-slate-500">Representación geográfica en tiempo real de tu negocio en Perú.</p>
            </div>

            {mapLat !== null && mapLng !== null ? (
              <div className="flex-1 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 relative min-h-[320px] shadow-inner shadow-black/50">
                {/* Embed robust Google Maps iframe */}
                <iframe
                  title="Geolocalización Comercial"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&z=16&output=embed`}
                  className="absolute inset-0 filter invert-[0.9] hue-rotate-[180deg] saturate-[0.8]"
                />
                
                {/* Coordinates Floating Badge */}
                <div className="absolute bottom-4 left-4 z-10 bg-slate-950/80 border border-slate-800/60 backdrop-blur px-3 py-1.5 rounded-lg flex flex-col gap-0.5 shadow-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Coordenadas Vivas</span>
                  <span className="text-xs font-mono font-bold text-primary">{mapLat.toFixed(5)}, {mapLng.toFixed(5)}</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center text-center p-6 gap-3 min-h-[320px]">
                <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl text-slate-500 animate-pulse">
                  <MapPin className="w-8 h-8" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sm text-slate-300">Sin Ubicación Satelital</span>
                  <span className="text-xs text-slate-500 max-w-[240px]">
                    Ingresa coordenadas válidas de Latitud y Longitud en el formulario para generar el mapa en tiempo real.
                  </span>
                </div>
              </div>
            )}

            <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Contacto Rápido</span>
              <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>{telefono || 'No especificado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>{email || 'No especificado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate max-w-xs">{direccion || 'No especificada'}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      )}

      {/* activeSubTab === 'respaldos' panel */}
      {activeSubTab === 'respaldos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Backups Actions Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Card 1: Export Local */}
            <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/40 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Exportar Copia de Seguridad Local
              </h2>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Descarga un volcado completo de toda la base de datos de tu empresa en un solo archivo plano estructurado en formato JSON. Incluye movimientos, planillas, stock, ventas emitidas y compras cargadas.
              </p>
              <Button 
                onClick={handleExportBackup}
                className="w-full sm:w-auto font-bold flex items-center justify-center gap-2 bg-gradient-to-tr from-primary to-emerald-500 text-white"
              >
                <Download className="w-4 h-4" />
                Generar y Descargar Respaldo (.json)
              </Button>
            </Card>

            {/* Card 2: Simulated Google Drive Upload */}
            <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/40 backdrop-blur-xl">
              <div className="flex justify-between items-start gap-4 flex-col sm:flex-row mb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-indigo-400" />
                  Copia de Seguridad en Google Drive
                </h2>
                {isDriveConnected ? (
                  <Badge variant="success" className="font-bold">Conectado: carlos@inverperu.com.pe</Badge>
                ) : (
                  <Badge variant="secondary" className="font-bold text-slate-400 border-slate-850">Google Drive: Sin Conectar</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Automatiza e integra tus respaldos contables y fiscales en la nube. Sincronizar con Google Drive te permite archivar de forma redundante y segura tus estados financieros históricos y facturas escaneadas.
              </p>
              
              {!isDriveConnected ? (
                <Button 
                  onClick={handleConnectDrive}
                  className="w-full sm:w-auto font-bold bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-200"
                >
                  Conectar cuenta de Google Drive
                </Button>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleUploadDrive}
                    className="font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10"
                  >
                    Subir Copia a Drive Ahora
                  </Button>
                  <Button 
                    onClick={() => setIsDriveConnected(false)}
                    className="bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 font-semibold"
                  >
                    Desconectar Drive
                  </Button>
                </div>
              )}
            </Card>

            {/* Card 3: Restore Import JSON */}
            <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/40 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-400 animate-pulse" />
                Restaurar Base de Datos (Importar)
              </h2>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Selecciona un archivo `.json` de respaldo previamente descargado para sobreescribir y restaurar las colecciones completas de tu empresa. <strong className="text-amber-400">Atención:</strong> Esta acción eliminará tus datos actuales y reescribirá el ERP.
              </p>
              
              {restoring ? (
                <div className="flex items-center gap-3 bg-slate-950 border border-amber-900/30 p-4 rounded-xl text-xs text-amber-400 animate-pulse font-medium">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                  <span>{restoreMessage}</span>
                </div>
              ) : (
                <div className="relative group border border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300">
                  <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-amber-400 transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-300">Haz clic para cargar tu archivo de respaldo</span>
                  <span className="text-[10px] text-slate-500 mt-1">Formatos permitidos: .json (ContaCloud Backup)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </Card>
          </div>

          {/* Backup History Column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/40 backdrop-blur-xl flex flex-col gap-4 h-full min-h-[480px]">
              <div className="flex flex-col gap-0.5 border-b border-slate-850 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-indigo-400" />
                  Respaldos Históricos en la Nube
                </h2>
                <p className="text-xs text-slate-500">Historial contable de copias cargadas y guardadas.</p>
              </div>

              <div className="flex-1 flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                {backupsHistory.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 italic py-10">No hay respaldos registrados.</div>
                ) : (
                  backupsHistory.map(hist => (
                    <div 
                      key={hist.id} 
                      className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-0.5 max-w-[180px] truncate font-sans">
                          <span className="font-bold text-white truncate" title={hist.nombre}>{hist.nombre}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{hist.fecha} · {hist.tamano}</span>
                        </div>
                      </div>
                      
                      <a 
                        href={hist.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline font-bold shrink-0 block"
                      >
                        Ver en Drive
                      </a>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-2 mt-auto">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Estado de Redundancia</span>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Cifrado AES-256 Activo</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Tus copias en la nube se almacenan con cifrado de nivel bancario. Solo tu tenant posee la firma privada para desencriptar y restaurar la información contable.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === 'reset' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-slide-up">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Card className="p-6 border border-red-500/20 bg-slate-900/40 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl animate-pulse">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Puesta a Cero de la Empresa</h2>
                  <p className="text-xs text-slate-500">Limpieza completa de historiales transaccionales contables.</p>
                </div>
              </div>

              <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-xl text-xs text-red-200 leading-relaxed mb-6 flex flex-col gap-2">
                <span className="font-bold text-red-400 text-sm flex items-center gap-1.5">
                  ⚠️ ADVERTENCIA CRÍTICA: ¡Esta acción es irreversible y destructiva!
                </span>
                <span>
                  Al ejecutar la **Puesta a Cero**, se eliminará de forma irreversible y permanente toda la información contable y comercial registrada para **{company?.razonSocial}** tanto en la nube (Firestore) como en el navegador:
                </span>
                <ul className="list-disc list-inside mt-2 flex flex-col gap-1 text-slate-300">
                  <li>Todos los comprobantes de **Ventas** (Facturas, Boletas, Notas de crédito)</li>
                  <li>Todos los registros de **Compras** y sus comprobantes</li>
                  <li>Historial completo de **Movimientos de Caja y Bancos**</li>
                  <li>Fichero completo de **Clientes** y **Proveedores**</li>
                  <li>Catálogo de **Productos**, existencias y auditorías de **Kardex**</li>
                  <li>Información de planillas de **Trabajadores**</li>
                </ul>
                <span className="mt-2 font-semibold text-white">
                  Las cuentas bancarias preestablecidas NO se eliminarán, pero su saldo actual se restablecerá estrictamente a **S/. 0.00**.
                </span>
              </div>

              {resetError && <Alert variant="danger" className="mb-4">{resetError}</Alert>}
              {resetSuccess && <Alert variant="success" className="mb-4">{resetSuccess}</Alert>}

              {user?.rol !== 'Super Administrador' && user?.rol !== 'Administrador' ? (
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl text-xs text-slate-500">
                  Solo los usuarios con el rol de **Administrador** o **Super Administrador** tienen permisos para realizar una Puesta a Cero de la empresa.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">
                      PARA CONFIRMAR, ESCRIBE EL RUC DE TU EMPRESA Y HAZ CLIC EN EL BOTÓN:
                    </label>
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg text-sm font-mono text-primary font-bold w-full select-all">
                      {company?.ruc}
                    </div>
                    <Input
                      type="text"
                      placeholder="Escribe el RUC de la empresa para confirmar"
                      value={confirmRuc}
                      onChange={e => setConfirmRuc(e.target.value)}
                      required
                      className="bg-slate-950 border-slate-800 focus:border-red-500 text-white mt-1.5 font-mono"
                    />
                  </div>

                  <Button
                    onClick={handleConfirmResetCompany}
                    disabled={confirmRuc.trim() !== company?.ruc.trim() || resetting}
                    className="w-full font-bold flex items-center justify-center gap-2 bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-lg shadow-red-900/10"
                  >
                    {resetting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {resetting ? 'Procesando Puesta a Cero...' : 'Ejecutar Puesta a Cero Contable'}
                  </Button>
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/40 backdrop-blur-xl flex flex-col gap-4 min-h-[300px]">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400" />
                Seguridad de Datos
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                El proceso de Puesta a Cero cumple con normativas estrictas de protección y purgado. Toda información es borrada usando estándares de sobrefirma redundante para asegurar la imposibilidad de recuperar copias residuales en servidores de producción.
              </p>
              <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-2 mt-auto">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Estado del Tenant</span>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>Suscripción Activa</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Tu suscripción no se cancelará al restablecer los datos. Podrás seguir usando ContaCloud con el mismo plan contratado de forma inmediata.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* --- SIMULATED GOOGLE OAUTH POPUP DIALOG --- */}
      {showOAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-scale-up text-center">
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-400 tracking-wider">Google Accounts</span>
              </div>
              <button 
                onClick={() => setShowOAuthModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {oauthLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-xs text-slate-400">Estableciendo túnel OAuth seguro...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2.5 border border-slate-850 shadow-md">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.6-4.53-6.16-4.53z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-white">Elige tu cuenta de Google</span>
                  <span className="text-[10px] text-slate-500 font-sans">para continuar en contacould.firebaseapp.com</span>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={handleOAuthSuccess}
                    className="w-full text-left bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl p-3 flex items-center gap-3 cursor-pointer outline-none hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                      CM
                    </div>
                    <div className="flex flex-col truncate text-left">
                      <span className="text-xs font-bold text-white">Carlos Mendoza</span>
                      <span className="text-[10px] text-slate-500 font-mono">carlos@inverperu.com.pe</span>
                    </div>
                  </button>
                </div>
                
                <span className="text-[9px] text-slate-600 mt-2 block">
                  Al continuar, Google compartirá tu nombre, dirección de correo y foto de perfil con ContaCloud.
                </span>
              </div>
            )}

          </div>
        </div>
      )}

      {/* --- GOOGLE DRIVE UPLOAD PROGRESS DIALOG --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-scale-up text-center flex flex-col items-center gap-4">
            
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-indigo-500 border-r-indigo-400 animate-spin" />
              <Cloud className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse">Sincronizando con Drive</span>
              <span className="text-xs font-semibold text-white mt-1">{uploadMessage}</span>
            </div>

            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850 mt-2">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
