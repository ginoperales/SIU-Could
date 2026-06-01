import { 
  Usuario, 
  Empresa, 
  Cliente, 
  Proveedor, 
  MovimientoContable, 
  Factura, 
  Compra, 
  Banco, 
  Producto, 
  Kardex, 
  Trabajador,
  RolUsuario,
  Promocion,
  Funcionalidad
} from '../models/types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAuw148ajLVFEz_YBAVMHIEi96RSjVrtqU",
  authDomain: "contacoulds.firebaseapp.com",
  projectId: "contacoulds",
  storageBucket: "contacoulds.firebasestorage.app",
  messagingSenderId: "939257401159",
  appId: "1:939257401159:web:c6f148c87c899c816bc662"
};

// Initialize Firebase SDK
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// ==========================================
// PRELOADED MOCK DATA FOR PERUVIAN ERP DEMO
// ==========================================
const DEFAULT_COMPANY_ID = 'empresa_demo_peru';
const DEFAULT_USER_ID = 'usuario_demo_uid';

const INITIAL_FUNCIONALIDADES: Funcionalidad[] = [
  {
    id: 'caja',
    nombre: 'Caja Chica',
    descripcion: 'Registro de ingresos y egresos diarios, balances rápidos y control de efectivo en mano.',
    icono: 'Wallet',
    categoria: 'Core',
    rubrosRecomendados: ['Comercio', 'Servicios', 'Manufactura', 'Construcción'],
    precioMensual: 0,
    activo: true,
    esDefault: true
  },
  {
    id: 'bancos',
    nombre: 'Bancos y Conciliación',
    descripcion: 'Control multimoneda de cuentas bancarias y herramienta interactiva de punteo contable.',
    icono: 'Building',
    categoria: 'Core',
    rubrosRecomendados: ['Comercio', 'Servicios', 'Manufactura', 'Construcción'],
    precioMensual: 0,
    activo: true,
    esDefault: true
  },
  {
    id: 'clientes',
    nombre: 'Gestión de Clientes',
    descripcion: 'Directorios comerciales, validación DNI/RUC y ficha cronológica de cobranzas.',
    icono: 'Users',
    categoria: 'Core',
    rubrosRecomendados: ['Comercio', 'Servicios', 'Manufactura'],
    precioMensual: 0,
    activo: true,
    esDefault: true
  },
  {
    id: 'proveedores',
    nombre: 'Gestión de Proveedores',
    descripcion: 'Fichero de proveedores, consulta SUNAT por RUC e historial de egresos.',
    icono: 'Truck',
    categoria: 'Core',
    rubrosRecomendados: ['Comercio', 'Manufactura', 'Construcción'],
    precioMensual: 0,
    activo: true,
    esDefault: true
  },
  {
    id: 'compras',
    nombre: 'Registro de Compras',
    descripcion: 'Control de egresos, facturas de compras con drag & drop de archivos XML y PDF.',
    icono: 'ShoppingBag',
    categoria: 'Core',
    rubrosRecomendados: ['Comercio', 'Manufactura', 'Construcción'],
    precioMensual: 0,
    activo: true,
    esDefault: true
  },
  {
    id: 'ventas',
    nombre: 'Facturación Electrónica',
    descripcion: 'Emisión de Facturas y Boletas electrónicas peruanas con IGV 18% y formatos oficiales SUNAT.',
    icono: 'FileText',
    categoria: 'Core',
    rubrosRecomendados: ['Comercio', 'Servicios', 'Manufactura'],
    precioMensual: 0,
    activo: true,
    esDefault: true
  },
  {
    id: 'por-cobrar',
    nombre: 'Cuentas por Cobrar',
    descripcion: 'Control de cobros vencidos de clientes, alertas visuales de morosidad contable.',
    icono: 'CalendarCheck',
    categoria: 'Avanzado',
    rubrosRecomendados: ['Comercio', 'Servicios'],
    precioMensual: 19,
    activo: true,
    esDefault: false
  },
  {
    id: 'por-pagar',
    nombre: 'Cuentas por Pagar',
    descripcion: 'Reportes de compromisos financieros pendientes, obligaciones con proveedores.',
    icono: 'CalendarClock',
    categoria: 'Avanzado',
    rubrosRecomendados: ['Construcción', 'Manufactura'],
    precioMensual: 19,
    activo: true,
    esDefault: false
  },
  {
    id: 'inventario',
    nombre: 'Inventarios y Kardex',
    descripcion: 'Control de stock físico de mercaderías, alertas de reposición y libro Kardex de auditoría.',
    icono: 'Package',
    categoria: 'Core',
    rubrosRecomendados: ['Comercio', 'Manufactura', 'Construcción'],
    precioMensual: 0,
    activo: true,
    esDefault: true
  },
  {
    id: 'rrhh',
    nombre: 'Planilla y RRHH',
    descripcion: 'Liquidación de planillas, deducciones peruanas de AFP/ONP 13% y EsSalud 9%.',
    icono: 'Briefcase',
    categoria: 'Avanzado',
    rubrosRecomendados: ['Manufactura', 'Construcción'],
    precioMensual: 29,
    activo: true,
    esDefault: false
  },
  {
    id: 'reportes',
    nombre: 'Estados Financieros',
    descripcion: 'Balance General, Estado de Ganancias & Pérdidas (P&L) descargables en CSV.',
    icono: 'BarChart3',
    categoria: 'Avanzado',
    rubrosRecomendados: ['Comercio', 'Servicios', 'Manufactura', 'Construcción'],
    precioMensual: 29,
    activo: true,
    esDefault: false
  },
  {
    id: 'ia',
    nombre: 'Analista Financiero IA',
    descripcion: 'Chatbot inteligente de contabilidad, ratios financieros vivos y predictor de flujo de caja.',
    icono: 'BrainCircuit',
    categoria: 'IA & Analítica',
    rubrosRecomendados: ['Comercio', 'Servicios', 'Manufactura', 'Construcción'],
    precioMensual: 49,
    activo: true,
    esDefault: false
  }
];

const INITIAL_EMPRESAS: Empresa[] = [
  {
    id: DEFAULT_COMPANY_ID,
    razonSocial: 'Inversiones Perú S.A.C.',
    nombreComercial: 'InverPeru Corp',
    ruc: '20601234567',
    direccion: 'Av. Javier Prado Este 1024, San Isidro, Lima',
    telefono: '01 421-9876',
    email: 'contacto@inverperu.com.pe',
    fechaCreacion: '2026-01-15T08:00:00Z',
    estado: 'activo',
    rubro: 'Comercio',
    funcionalidadesHabilitadas: ['caja', 'bancos', 'clientes', 'proveedores', 'compras', 'ventas', 'por-cobrar', 'por-pagar', 'inventario', 'rrhh', 'reportes', 'ia']
  }
];

const INITIAL_USUARIOS: Usuario[] = [
  {
    id: DEFAULT_USER_ID,
    empresaId: DEFAULT_COMPANY_ID,
    nombre: 'Guillermo Mendoza',
    email: 'gerente@inverperu.com.pe',
    rol: 'Super Administrador',
    activo: true,
    fechaRegistro: '2026-01-15T08:30:00Z'
  },
  {
    id: 'user_contador_1',
    empresaId: DEFAULT_COMPANY_ID,
    nombre: 'Ana María Rossi',
    email: 'contabilidad@inverperu.com.pe',
    rol: 'Contador',
    activo: true,
    fechaRegistro: '2026-01-16T09:00:00Z'
  }
];

const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'cli_1',
    empresaId: DEFAULT_COMPANY_ID,
    nombres: 'Corporación Aceros Andinos S.A.',
    documento: '20104829103',
    direccion: 'Av. Industrial 450, Ate, Lima',
    telefono: '998765432',
    correo: 'compras@acerosandinos.pe',
    fechaCreacion: '2026-02-10T10:00:00Z'
  },
  {
    id: 'cli_2',
    empresaId: DEFAULT_COMPANY_ID,
    nombres: 'Distribuidora San Juan E.I.R.L.',
    documento: '20492810394',
    direccion: 'Jr. Libertad 789, San Miguel, Lima',
    telefono: '987654321',
    correo: 'contacto@sanjuan.com',
    fechaCreacion: '2026-02-15T11:30:00Z'
  },
  {
    id: 'cli_3',
    empresaId: DEFAULT_COMPANY_ID,
    nombres: 'Juan Carlos Pérez Huamán',
    documento: '45892019',
    direccion: 'Av. Larco 456, Miraflores, Lima',
    telefono: '955123456',
    correo: 'jcperez@gmail.com',
    fechaCreacion: '2026-03-01T15:20:00Z'
  }
];

const INITIAL_PROVEEDORES: Proveedor[] = [
  {
    id: 'prov_1',
    empresaId: DEFAULT_COMPANY_ID,
    razonSocial: 'Suministros Industriales del Pacífico SAC',
    ruc: '20554433221',
    direccion: 'Av. Argentina 2030, Callao',
    telefono: '01 561-1234',
    correo: 'ventas@suminpacific.com.pe',
    fechaCreacion: '2026-01-20T09:00:00Z'
  },
  {
    id: 'prov_2',
    empresaId: DEFAULT_COMPANY_ID,
    razonSocial: 'Luz del Sur S.A.A.',
    ruc: '20337890456',
    direccion: 'Av. Intihuatana 290, Surquillo, Lima',
    telefono: '01 617-5000',
    correo: 'facturacion@luzdelsur.com.pe',
    fechaCreacion: '2026-01-18T10:00:00Z'
  },
  {
    id: 'prov_3',
    empresaId: DEFAULT_COMPANY_ID,
    razonSocial: 'Telefónica del Perú S.A.A.',
    ruc: '20100017491',
    direccion: 'Av. Arequipa 1155, Lima',
    telefono: '01 790-0123',
    correo: 'corporativo@movistar.com.pe',
    fechaCreacion: '2026-01-19T11:00:00Z'
  }
];

const INITIAL_BANCOS: Banco[] = [
  {
    id: 'bnc_1',
    empresaId: DEFAULT_COMPANY_ID,
    banco: 'BCP',
    tipoCuenta: 'corriente',
    numeroCuenta: '191-2384729-0-45',
    moneda: 'PEN',
    saldoActual: 45200.50,
    cci: '002-191-002384729045-52'
  },
  {
    id: 'bnc_2',
    empresaId: DEFAULT_COMPANY_ID,
    banco: 'BBVA',
    tipoCuenta: 'ahorros',
    numeroCuenta: '0011-0182-0200843928',
    moneda: 'PEN',
    saldoActual: 15400.00,
    cci: '018-011-00018202008439-84'
  }
];

const INITIAL_PRODUCTOS: Producto[] = [
  {
    id: 'prod_1',
    empresaId: DEFAULT_COMPANY_ID,
    codigo: 'P001',
    nombre: 'Kit Cables Cobre Eléctrico 2.5mm',
    descripcion: 'Rollo de 100m, ideal para instalaciones domésticas',
    precioVenta: 180.00,
    precioCompra: 110.00,
    stockActual: 85,
    stockMinimo: 15,
    unidadMedida: 'unidades'
  },
  {
    id: 'prod_2',
    empresaId: DEFAULT_COMPANY_ID,
    codigo: 'P002',
    nombre: 'Interruptor Termomagnético 2x20A Bticino',
    descripcion: 'Llave térmica de alta seguridad',
    precioVenta: 45.00,
    precioCompra: 28.00,
    stockActual: 120,
    stockMinimo: 20,
    unidadMedida: 'unidades'
  },
  {
    id: 'prod_3',
    empresaId: DEFAULT_COMPANY_ID,
    codigo: 'P003',
    nombre: 'Servicio de Consultoría Eléctrica Industrial',
    descripcion: 'Diseño de planos y dimensionamiento de cargas (tarifa por hora)',
    precioVenta: 250.00,
    precioCompra: 0.00,
    stockActual: 9999, // Inmaterial
    stockMinimo: 0,
    unidadMedida: 'servicios'
  }
];

const INITIAL_KARDEX: Kardex[] = [
  {
    id: 'kdx_1',
    empresaId: DEFAULT_COMPANY_ID,
    productoId: 'prod_1',
    fecha: '2026-04-01T09:00:00Z',
    tipo: 'entrada',
    concepto: 'Inventario Inicial',
    cantidad: 100,
    precioUnitario: 110.00,
    stockResultante: 100
  },
  {
    id: 'kdx_2',
    empresaId: DEFAULT_COMPANY_ID,
    productoId: 'prod_1',
    fecha: '2026-04-10T14:30:00Z',
    tipo: 'salida',
    concepto: 'Venta Factura F001-0001',
    cantidad: 15,
    precioUnitario: 110.00,
    stockResultante: 85
  },
  {
    id: 'kdx_3',
    empresaId: DEFAULT_COMPANY_ID,
    productoId: 'prod_2',
    fecha: '2026-04-01T09:00:00Z',
    tipo: 'entrada',
    concepto: 'Inventario Inicial',
    cantidad: 120,
    precioUnitario: 28.00,
    stockResultante: 120
  }
];

const INITIAL_FACTURAS: Factura[] = [
  {
    id: 'fac_1',
    empresaId: DEFAULT_COMPANY_ID,
    clienteId: 'cli_1',
    clienteNombre: 'Corporación Aceros Andinos S.A.',
    clienteDocumento: '20104829103',
    tipo: 'factura',
    serie: 'F001',
    numero: '0001',
    fecha: '2026-05-10T10:00:00Z',
    fechaVencimiento: '2026-06-10T10:00:00Z',
    subtotal: 2700.00,
    igv: 486.00, // 18% of 2700
    total: 3186.00,
    estado: 'pagado',
    metodoPago: 'transferencia',
    detalles: [
      { productoId: 'prod_1', descripcion: 'Kit Cables Cobre Eléctrico 2.5mm', cantidad: 15, precioUnitario: 180.00, total: 2700.00 }
    ]
  },
  {
    id: 'fac_2',
    empresaId: DEFAULT_COMPANY_ID,
    clienteId: 'cli_2',
    clienteNombre: 'Distribuidora San Juan E.I.R.L.',
    clienteDocumento: '20492810394',
    tipo: 'factura',
    serie: 'F001',
    numero: '0002',
    fecha: '2026-05-20T14:00:00Z',
    fechaVencimiento: '2026-06-20T14:00:00Z',
    subtotal: 1350.00,
    igv: 243.00,
    total: 1593.00,
    estado: 'pendiente',
    detalles: [
      { productoId: 'prod_2', descripcion: 'Interruptor Termomagnético 2x20A Bticino', cantidad: 30, precioUnitario: 45.00, total: 1350.00 }
    ]
  },
  {
    id: 'fac_3',
    empresaId: DEFAULT_COMPANY_ID,
    clienteId: 'cli_3',
    clienteNombre: 'Juan Carlos Pérez Huamán',
    clienteDocumento: '45892019',
    tipo: 'boleta',
    serie: 'B001',
    numero: '0001',
    fecha: '2026-05-24T16:30:00Z',
    fechaVencimiento: '2026-05-24T16:30:00Z',
    subtotal: 450.00,
    igv: 81.00,
    total: 531.00,
    estado: 'pagado',
    metodoPago: 'efectivo',
    detalles: [
      { productoId: 'prod_2', descripcion: 'Interruptor Termomagnético 2x20A Bticino', cantidad: 10, precioUnitario: 45.00, total: 450.00 }
    ]
  },
  {
    id: 'fac_4',
    empresaId: DEFAULT_COMPANY_ID,
    clienteId: 'cli_1',
    clienteNombre: 'Corporación Aceros Andinos S.A.',
    clienteDocumento: '20104829103',
    tipo: 'factura',
    serie: 'F001',
    numero: '0003',
    fecha: '2026-04-15T09:00:00Z',
    fechaVencimiento: '2026-05-15T09:00:00Z', // Overdue!
    subtotal: 5000.00,
    igv: 900.00,
    total: 5900.00,
    estado: 'pendiente',
    detalles: [
      { productoId: 'prod_3', descripcion: 'Servicio de Consultoría Eléctrica Industrial', cantidad: 20, precioUnitario: 250.00, total: 5000.00 }
    ]
  }
];

const INITIAL_COMPRAS: Compra[] = [
  {
    id: 'cmp_1',
    empresaId: DEFAULT_COMPANY_ID,
    proveedorId: 'prov_1',
    proveedorRazonSocial: 'Suministros Industriales del Pacífico SAC',
    proveedorRuc: '20554433221',
    fecha: '2026-05-05T11:00:00Z',
    subtotal: 1500.00,
    igv: 270.00,
    total: 1770.00,
    categoria: 'Mercadería',
    adjuntoNombre: 'factura_compra_1120.pdf'
  },
  {
    id: 'cmp_2',
    empresaId: DEFAULT_COMPANY_ID,
    proveedorId: 'prov_2',
    proveedorRazonSocial: 'Luz del Sur S.A.A.',
    proveedorRuc: '20337890456',
    fecha: '2026-05-12T10:00:00Z',
    subtotal: 350.00,
    igv: 63.00,
    total: 413.00,
    categoria: 'Servicios Básicos',
    adjuntoNombre: 'recibo_luz_mayo.pdf'
  },
  {
    id: 'cmp_3',
    empresaId: DEFAULT_COMPANY_ID,
    proveedorId: 'prov_3',
    proveedorRazonSocial: 'Telefónica del Perú S.A.A.',
    proveedorRuc: '20100017491',
    fecha: '2026-05-14T09:30:00Z',
    subtotal: 250.00,
    igv: 45.00,
    total: 295.00,
    categoria: 'Servicios Básicos',
    adjuntoNombre: 'recibo_telefono.pdf'
  }
];

const INITIAL_TRABAJADORES: Trabajador[] = [
  {
    id: 'trab_1',
    empresaId: DEFAULT_COMPANY_ID,
    nombre: 'Jorge Luis Saldaña Rivas',
    documento: '40283948',
    cargo: 'Asistente Eléctrico',
    sueldoBasico: 1800.00,
    fechaIngreso: '2026-02-01',
    regimenLaboral: 'mype',
    activo: true
  },
  {
    id: 'trab_2',
    empresaId: DEFAULT_COMPANY_ID,
    nombre: 'Clara Isabel Benites Vega',
    documento: '46820193',
    cargo: 'Administradora de Oficina',
    sueldoBasico: 2500.00,
    fechaIngreso: '2026-01-20',
    regimenLaboral: 'general',
    activo: true
  }
];

const INITIAL_MOVIMIENTOS: MovimientoContable[] = [
  {
    id: 'mov_1',
    empresaId: DEFAULT_COMPANY_ID,
    fecha: '2026-05-10T10:15:00Z',
    tipo: 'ingreso',
    categoria: 'Venta',
    descripcion: 'Cobro de Factura F001-0001',
    monto: 3186.00,
    metodoPago: 'transferencia',
    usuarioId: DEFAULT_USER_ID,
    bancoId: 'bnc_1'
  },
  {
    id: 'mov_2',
    empresaId: DEFAULT_COMPANY_ID,
    fecha: '2026-05-05T12:00:00Z',
    tipo: 'egreso',
    categoria: 'Mercadería',
    descripcion: 'Pago de Compra a Suministros Industriales',
    monto: 1770.00,
    metodoPago: 'transferencia',
    usuarioId: DEFAULT_USER_ID,
    bancoId: 'bnc_1'
  },
  {
    id: 'mov_3',
    empresaId: DEFAULT_COMPANY_ID,
    fecha: '2026-05-12T11:00:00Z',
    tipo: 'egreso',
    categoria: 'Servicios Básicos',
    descripcion: 'Pago Luz del Sur S.A.A.',
    monto: 413.00,
    metodoPago: 'transferencia',
    usuarioId: DEFAULT_USER_ID,
    bancoId: 'bnc_1'
  },
  {
    id: 'mov_4',
    empresaId: DEFAULT_COMPANY_ID,
    fecha: '2026-05-24T16:35:00Z',
    tipo: 'ingreso',
    categoria: 'Venta',
    descripcion: 'Cobro de Boleta B001-0001 en Efectivo',
    monto: 531.00,
    metodoPago: 'efectivo',
    usuarioId: DEFAULT_USER_ID,
    cajaChica: true
  },
  {
    id: 'mov_5',
    empresaId: DEFAULT_COMPANY_ID,
    fecha: '2026-05-15T15:00:00Z',
    tipo: 'egreso',
    categoria: 'Servicios Básicos',
    descripcion: 'Pago de Útiles de Oficina Menores',
    monto: 85.00,
    metodoPago: 'efectivo',
    usuarioId: DEFAULT_USER_ID,
    cajaChica: true
  },
  {
    id: 'mov_6',
    empresaId: DEFAULT_COMPANY_ID,
    fecha: '2026-05-28T17:00:00Z',
    tipo: 'egreso',
    categoria: 'Planilla',
    descripcion: 'Pago de Planilla de Jorge Saldaña',
    monto: 1800.00,
    metodoPago: 'transferencia',
    usuarioId: DEFAULT_USER_ID,
    bancoId: 'bnc_2'
  }
];

const INITIAL_PROMOCIONES: Promocion[] = [
  {
    id: 'promo_1',
    codigo: 'BIENVENIDO2026',
    descripcion: '¡20% de descuento en tu Plan Corporativo por lanzamiento!',
    porcentajeDescuento: 20,
    fechaInicio: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0], // Started 30 days ago
    fechaFin: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0], // Expires in 180 days
    activo: true,
    mostrarLanding: true,
    mostrarBannerSuperior: true,
    tipoPlan: 'Plan Corporativo'
  },
  {
    id: 'promo_2',
    codigo: 'CONTAFAST',
    descripcion: 'Descuento especial del 15% para nuevos emprendedores peruanos.',
    porcentajeDescuento: 15,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
    activo: true,
    mostrarLanding: true,
    mostrarBannerSuperior: false,
    tipoPlan: 'Plan Emprendedor'
  }
];


// ==========================================
// BROWSER-PERSISTENT LOCALSTORAGE DATABASE
// ==========================================
class BrowserStorageEngine {
  private isBrowser = typeof window !== 'undefined';

  constructor() {
    if (this.isBrowser) {
      this.initDB();
    }
  }

  private initDB() {
    this.ensureCollection('empresas', INITIAL_EMPRESAS);
    this.ensureCollection('usuarios', INITIAL_USUARIOS);
    this.ensureCollection('clientes', INITIAL_CLIENTES);
    this.ensureCollection('proveedores', INITIAL_PROVEEDORES);
    this.ensureCollection('bancos', INITIAL_BANCOS);
    this.ensureCollection('productos', INITIAL_PRODUCTOS);
    this.ensureCollection('kardex', INITIAL_KARDEX);
    this.ensureCollection('facturas', INITIAL_FACTURAS);
    this.ensureCollection('compras', INITIAL_COMPRAS);
    this.ensureCollection('trabajadores', INITIAL_TRABAJADORES);
    this.ensureCollection('movimientos', INITIAL_MOVIMIENTOS);
    this.ensureCollection('promociones', INITIAL_PROMOCIONES);
    this.ensureCollection('funcionalidades', INITIAL_FUNCIONALIDADES);
    
    // Auth Session (clean start - no automatic demo login)
  }

  private ensureCollection(key: string, initialData: any[]) {
    const fullKey = `sv_erp_${key}`;
    if (!localStorage.getItem(fullKey)) {
      localStorage.setItem(fullKey, JSON.stringify(initialData));
    }
  }

  getCollection<T>(key: string): T[] {
    if (!this.isBrowser) return [];
    const data = localStorage.getItem(`sv_erp_${key}`);
    return data ? JSON.parse(data) : [];
  }

  saveCollection<T>(key: string, data: T[]): void {
    if (!this.isBrowser) return;
    localStorage.setItem(`sv_erp_${key}`, JSON.stringify(data));
  }
}

const storageEngine = new BrowserStorageEngine();

// ==========================================
// CLEAN INTERFACES FOR AUTH, DB & STORAGE
// ==========================================

export const authService = {
  getCurrentSession: () => {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem('sv_auth_session');
    return session ? JSON.parse(session) : null;
  },

  getCurrentUser: async (): Promise<Usuario | null> => {
    const session = authService.getCurrentSession();
    if (!session) return null;
    
    // Try to get from Cloud Firestore first if online, to ensure we stay updated
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', session.uid));
      if (userDoc.exists()) {
        const u = userDoc.data() as Usuario;
        if (!u.empresasAsociadas || u.empresasAsociadas.length === 0) {
          u.empresasAsociadas = [u.empresaId];
        }
        return u;
      }
    } catch (err) {
      console.warn('Could not fetch user from Cloud Firestore, using LocalStorage:', err);
    }
    
    const users = storageEngine.getCollection<Usuario>('usuarios');
    const u = users.find(u => u.id === session.uid) || null;
    if (u && (!u.empresasAsociadas || u.empresasAsociadas.length === 0)) {
      u.empresasAsociadas = [u.empresaId];
    }
    return u;
  },

  getCurrentCompany: async (): Promise<Empresa | null> => {
    const session = authService.getCurrentSession();
    if (!session) return null;
    const companies = storageEngine.getCollection<Empresa>('empresas');
    return companies.find(c => c.id === session.empresaId) || null;
  },

  login: async (email: string, password_dummy: string): Promise<Usuario> => {
    try {
      // Standard Firebase Auth sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password_dummy);
      const uid = userCredential.user.uid;
      
      // Fetch user document from Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as Usuario;
        localStorage.setItem('sv_auth_session', JSON.stringify({
          uid: userData.id,
          empresaId: userData.empresaId
        }));
        return userData;
      } else {
        // The user successfully logged in, but there is no Firestore document.
        // This happens if the user was manually created in the Firebase console!
        console.log(`[Auth] User document for UID ${uid} not found in Firestore. Auto-provisioning...`);
        const users = storageEngine.getCollection<Usuario>('usuarios');
        let localUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        const masterCompanyId = 'empresa_demo_peru';
        if (!localUser) {
          // If not in local storage either, create a fresh user object
          localUser = {
            id: uid,
            empresaId: masterCompanyId,
            nombre: email.split('@')[0],
            email: email,
            rol: email.toLowerCase() === 'gin.zu.ken@gmail.com' ? 'Super Administrador' : 'Administrador',
            activo: true,
            fechaRegistro: new Date().toISOString()
          };
        }
        
        // Update the ID to the real Firebase Auth uid
        const provisionedUser: Usuario = {
          ...localUser,
          id: uid
        };
        
        // Make sure default company exists in Firestore to avoid multi-tenant rule issues
        const companies = storageEngine.getCollection<Empresa>('empresas');
        const company = companies.find(c => c.id === provisionedUser.empresaId) || {
          id: masterCompanyId,
          razonSocial: 'Inversiones Perú S.A.C.',
          nombreComercial: 'InverPeru Corp',
          ruc: '20601234567',
          direccion: 'Av. Javier Prado Este 1024, San Isidro, Lima',
          email: 'contacto@inverperu.com.pe',
          fechaCreacion: new Date().toISOString(),
          estado: 'activo'
        };
        
        // Save to Firestore
        try {
          await setDoc(doc(db, 'empresas', provisionedUser.empresaId), company);
          await setDoc(doc(db, 'usuarios', uid), provisionedUser);
          console.log(`[Auth] Auto-provisioned Firestore document for ${email} with UID ${uid}`);
        } catch (fsErr) {
          console.warn('[Auth Sync Error] Could not write provisioned docs to cloud:', fsErr);
        }
        
        // Sync to LocalStorage
        const updatedUsers = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
        updatedUsers.push(provisionedUser);
        storageEngine.saveCollection('usuarios', updatedUsers);
        
        localStorage.setItem('sv_auth_session', JSON.stringify({
          uid: provisionedUser.id,
          empresaId: provisionedUser.empresaId
        }));
        
        return provisionedUser;
      }
    } catch (err) {
      console.warn('Real Firebase Auth login failed, checking LocalStorage fallback:', err);
    }
    
    // Fallback to LocalStorage simulation
    const users = storageEngine.getCollection<Usuario>('usuarios');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('Usuario no registrado en ContaCould.');
    }
    
    localStorage.setItem('sv_auth_session', JSON.stringify({
      uid: user.id,
      empresaId: user.empresaId
    }));
    
    return user;
  },

  loginWithGoogle: async (): Promise<Usuario> => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const uid = userCredential.user.uid;
      const email = userCredential.user.email;
      
      // Fetch user document from Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as Usuario;
        localStorage.setItem('sv_auth_session', JSON.stringify({
          uid: userData.id,
          empresaId: userData.empresaId
        }));
        return userData;
      } else if (email) {
        // Provision user if they logged in with Google but have no Firestore doc
        console.log(`[Auth] Google user ${email} (UID ${uid}) not found in Firestore. Auto-provisioning...`);
        const users = storageEngine.getCollection<Usuario>('usuarios');
        let localUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        const masterCompanyId = 'empresa_demo_peru';
        if (!localUser) {
          // If no local user exists, register them
          localUser = {
            id: uid,
            empresaId: masterCompanyId,
            nombre: userCredential.user.displayName || 'Usuario Google',
            email: email,
            rol: email.toLowerCase() === 'gin.zu.ken@gmail.com' ? 'Super Administrador' : 'Administrador',
            activo: true,
            fechaRegistro: new Date().toISOString()
          };
        }
        
        const provisionedUser: Usuario = {
          ...localUser,
          id: uid
        };
        
        // Ensure default company exists
        const companies = storageEngine.getCollection<Empresa>('empresas');
        const company = companies.find(c => c.id === provisionedUser.empresaId) || {
          id: masterCompanyId,
          razonSocial: 'Inversiones Perú S.A.C.',
          nombreComercial: 'InverPeru Corp',
          ruc: '20601234567',
          direccion: 'Av. Javier Prado Este 1024, San Isidro, Lima',
          email: 'contacto@inverperu.com.pe',
          fechaCreacion: new Date().toISOString(),
          estado: 'activo'
        };
        
        try {
          await setDoc(doc(db, 'empresas', provisionedUser.empresaId), company);
          await setDoc(doc(db, 'usuarios', uid), provisionedUser);
        } catch (fsErr) {
          console.warn('[Auth Sync Error] Could not write provisioned docs to cloud:', fsErr);
        }
        
        const updatedUsers = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
        updatedUsers.push(provisionedUser);
        storageEngine.saveCollection('usuarios', updatedUsers);
        
        localStorage.setItem('sv_auth_session', JSON.stringify({
          uid: provisionedUser.id,
          empresaId: provisionedUser.empresaId
        }));
        
        return provisionedUser;
      }
    } catch (err) {
      console.warn('Real Google login failed, checking LocalStorage fallback:', err);
    }

    const users = storageEngine.getCollection<Usuario>('usuarios');
    const user = users[0];
    localStorage.setItem('sv_auth_session', JSON.stringify({
      uid: user.id,
      empresaId: user.empresaId
    }));
    return user;
  },

  register: async (
    email: string, 
    contrasenia: string,
    nombre: string, 
    razonSocial: string, 
    ruc: string, 
    rol: RolUsuario = 'Administrador',
    plan?: string,
    cuponDescuento?: string,
    porcentajeDescuento?: number,
    costoMensual?: number
  ): Promise<{ usuario: Usuario; empresa: Empresa }> => {
    let uid = `usr_${Date.now()}`;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, contrasenia || '123456');
      uid = userCredential.user.uid;
    } catch (err) {
      console.warn('Real Firebase Auth registration failed or already exists, proceeding locally:', err);
    }

    const companies = storageEngine.getCollection<Empresa>('empresas');
    const users = storageEngine.getCollection<Usuario>('usuarios');

    // Create new company
    const newCompanyId = `emp_${Date.now()}`;
    const newCompany: Empresa = {
      id: newCompanyId,
      razonSocial,
      nombreComercial: razonSocial.replace(/(SAC|S\.A\.C\.|SA|S\.A\.|EIRL|E\.I\.R\.L\.)/i, '').trim(),
      ruc,
      direccion: 'Dirección Comercial Registrada, Lima, Perú',
      email,
      fechaCreacion: new Date().toISOString(),
      estado: 'activo',
      plan,
      cuponDescuento,
      porcentajeDescuento,
      costoMensual
    };
    companies.push(newCompany);
    storageEngine.saveCollection('empresas', companies);

    // Create new user linked to this company
    const newUser: Usuario = {
      id: uid,
      empresaId: newCompanyId,
      nombre,
      email,
      rol,
      activo: true,
      fechaRegistro: new Date().toISOString(),
      empresasAsociadas: [newCompanyId]
    };
    users.push(newUser);
    storageEngine.saveCollection('usuarios', users);

    // Synchronize to Firestore
    try {
      await setDoc(doc(db, 'empresas', newCompanyId), newCompany);
      await setDoc(doc(db, 'usuarios', uid), newUser);
    } catch (err) {
      console.warn('[Firestore Sync Warning] register failed to sync cloud:', err);
    }

    localStorage.setItem('sv_auth_session', JSON.stringify({
      uid,
      empresaId: newCompanyId
    }));

    return { usuario: newUser, empresa: newCompany };
  },

  logout: async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('sv_auth_session');
  },

  recoverPassword: async (email: string): Promise<void> => {
    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`Enlace de recuperación enviado a: ${email}`);
  }
};

export const dbService = {
  getDocuments: async <T>(collection: string, empresaId: string): Promise<T[]> => {
    const list = storageEngine.getCollection<any>(collection);
    // Mandatory filter: only return documents for the specified company
    return list.filter(item => item.empresaId === empresaId) as T[];
  },

  getDocumentById: async <T>(collection: string, id: string): Promise<T | null> => {
    const list = storageEngine.getCollection<any>(collection);
    return (list.find(item => item.id === id) as T) || null;
  },

  addDocument: async <T extends { id: string; empresaId: string }>(
    collectionName: string, 
    data: Omit<T, 'id'>
  ): Promise<T> => {
    const list = storageEngine.getCollection<any>(collectionName);
    const newDocId = `${collectionName.slice(0, 3)}_${Date.now()}`;
    const newDoc = {
      ...data,
      id: newDocId
    } as unknown as T;
    
    list.push(newDoc);
    storageEngine.saveCollection(collectionName, list);
    
    // Cloud Firestore Sync (silently falls back if offline)
    try {
      const docRef = doc(db, collectionName, newDocId);
      await setDoc(docRef, newDoc);
    } catch (err) {
      console.warn(`[Firestore Sync Warning] addDoc failed for ${collectionName}:`, err);
    }

    if (collectionName === 'movimientos') {
      await dbService.syncBancoFromMovimiento(newDoc as unknown as MovimientoContable);
    }
    
    return newDoc;
  },

  updateDocument: async <T>(
    collectionName: string, 
    id: string, 
    data: Partial<T>
  ): Promise<void> => {
    const list = storageEngine.getCollection<any>(collectionName);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      storageEngine.saveCollection(collectionName, list);
      
      // Cloud Firestore Sync
      try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, data as any);
      } catch (err) {
        console.warn(`[Firestore Sync Warning] updateDoc failed for ${collectionName}:`, err);
      }
    }
  },

  deleteDocument: async (collectionName: string, id: string): Promise<void> => {
    const list = storageEngine.getCollection<any>(collectionName);
    const filtered = list.filter(item => item.id !== id);
    storageEngine.saveCollection(collectionName, filtered);
    
    // Cloud Firestore Sync
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn(`[Firestore Sync Warning] deleteDoc failed for ${collectionName}:`, err);
    }
  },

  getAllCompanies: async (): Promise<Empresa[]> => {
    return storageEngine.getCollection<Empresa>('empresas');
  },

  getAllUsers: async (): Promise<Usuario[]> => {
    return storageEngine.getCollection<Usuario>('usuarios');
  },

  getAllPromociones: async (): Promise<Promocion[]> => {
    return storageEngine.getCollection<Promocion>('promociones');
  },

  createPromocion: async (data: Omit<Promocion, 'id'>): Promise<Promocion> => {
    const list = storageEngine.getCollection<Promocion>('promociones');
    const newDocId = `prm_${Date.now()}`;
    const newDoc = {
      ...data,
      id: newDocId
    };
    
    list.push(newDoc);
    storageEngine.saveCollection('promociones', list);
    
    // Cloud Firestore Sync
    try {
      const docRef = doc(db, 'promociones', newDocId);
      await setDoc(docRef, newDoc);
    } catch (err) {
      console.warn('[Firestore Sync Warning] createPromocion failed to sync:', err);
    }
    
    return newDoc;
  },

  updatePromocion: async (id: string, data: Partial<Promocion>): Promise<void> => {
    const list = storageEngine.getCollection<Promocion>('promociones');
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      storageEngine.saveCollection('promociones', list);
      
      // Cloud Firestore Sync
      try {
        const docRef = doc(db, 'promociones', id);
        await updateDoc(docRef, data as any);
      } catch (err) {
        console.warn('[Firestore Sync Warning] updatePromocion failed to sync:', err);
      }
    }
  },

  deletePromocion: async (id: string): Promise<void> => {
    const list = storageEngine.getCollection<Promocion>('promociones');
    const filtered = list.filter(item => item.id !== id);
    storageEngine.saveCollection('promociones', filtered);
    
    // Cloud Firestore Sync
    try {
      const docRef = doc(db, 'promociones', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Firestore Sync Warning] deletePromocion failed to sync:', err);
    }
  },

  createCompanyAndAdmin: async (
    razonSocial: string,
    nombreComercial: string,
    ruc: string,
    direccion: string,
    plan: string,
    adminEmail: string,
    adminNombre: string,
    cuponDescuento?: string,
    porcentajeDescuento?: number,
    costoMensual?: number
  ): Promise<Empresa> => {
    const companies = storageEngine.getCollection<Empresa>('empresas');
    const newCompanyId = `emp_${Date.now()}`;
    const newCompany: Empresa = {
      id: newCompanyId,
      razonSocial,
      nombreComercial,
      ruc,
      direccion,
      email: adminEmail,
      fechaCreacion: new Date().toISOString(),
      estado: 'activo',
      plan,
      cuponDescuento,
      porcentajeDescuento,
      costoMensual
    };
    
    companies.push(newCompany);
    storageEngine.saveCollection('empresas', companies);
    
    // Create Default Admin User
    const users = storageEngine.getCollection<Usuario>('usuarios');
    const newUserId = `usr_${Date.now()}`;
    const newAdminUser: Usuario = {
      id: newUserId,
      empresaId: newCompanyId,
      nombre: adminNombre,
      email: adminEmail,
      rol: 'Administrador',
      activo: true,
      fechaRegistro: new Date().toISOString()
    };
    users.push(newAdminUser);
    storageEngine.saveCollection('usuarios', users);
    
    // Preload Bank Account for the new company
    const bankId = `bnk_${Date.now()}`;
    const banks = storageEngine.getCollection<Banco>('bancos');
    const newBank: Banco = {
      id: bankId,
      empresaId: newCompanyId,
      banco: 'BCP',
      tipoCuenta: 'corriente',
      numeroCuenta: `191-${Math.floor(10000000 + Math.random() * 90000000)}-0-01`,
      moneda: 'PEN',
      saldoActual: 5000.00
    };
    banks.push(newBank);
    storageEngine.saveCollection('bancos', banks);

    // Sync generated docs to Cloud Firestore
    try {
      await setDoc(doc(db, 'empresas', newCompanyId), newCompany);
      await setDoc(doc(db, 'usuarios', newUserId), newAdminUser);
      await setDoc(doc(db, 'bancos', bankId), newBank);
    } catch (err) {
      console.warn('[Firestore Sync Warning] createCompanyAndAdmin failed to sync cloud:', err);
    }

    return newCompany;
  },

  syncToCloudFirestore: async (): Promise<void> => {
    const collections = ['empresas', 'usuarios', 'clientes', 'proveedores', 'movimientos', 'facturas', 'compras', 'bancos', 'productos', 'kardex', 'trabajadores', 'promociones', 'funcionalidades'];
    for (const coll of collections) {
      const data = storageEngine.getCollection<any>(coll);
      for (const docData of data) {
        try {
          const docRef = doc(db, coll, docData.id);
          await setDoc(docRef, docData);
        } catch (err) {
          console.error(`Error syncing doc ${docData.id} to firestore:`, err);
        }
      }
    }
  },

  getAllFuncionalidades: async (): Promise<Funcionalidad[]> => {
    return storageEngine.getCollection<Funcionalidad>('funcionalidades');
  },

  createFuncionalidad: async (data: Omit<Funcionalidad, 'id'>): Promise<Funcionalidad> => {
    const list = storageEngine.getCollection<Funcionalidad>('funcionalidades');
    const newDocId = `fnc_${Date.now()}`;
    const newDoc = {
      ...data,
      id: newDocId
    };
    
    list.push(newDoc);
    storageEngine.saveCollection('funcionalidades', list);
    
    // Cloud Firestore Sync
    try {
      const docRef = doc(db, 'funcionalidades', newDocId);
      await setDoc(docRef, newDoc);
    } catch (err) {
      console.warn('[Firestore Sync Warning] createFuncionalidad failed to sync:', err);
    }
    
    return newDoc;
  },

  updateFuncionalidad: async (id: string, data: Partial<Funcionalidad>): Promise<void> => {
    const list = storageEngine.getCollection<Funcionalidad>('funcionalidades');
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      storageEngine.saveCollection('funcionalidades', list);
      
      // Cloud Firestore Sync
      try {
        const docRef = doc(db, 'funcionalidades', id);
        await updateDoc(docRef, data as any);
      } catch (err) {
        console.warn('[Firestore Sync Warning] updateFuncionalidad failed:', err);
      }
    }
  },

  deleteFuncionalidad: async (id: string): Promise<void> => {
    const list = storageEngine.getCollection<Funcionalidad>('funcionalidades');
    const filtered = list.filter(item => item.id !== id);
    storageEngine.saveCollection('funcionalidades', filtered);
    
    // Cloud Firestore Sync
    try {
      const docRef = doc(db, 'funcionalidades', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Firestore Sync Warning] deleteFuncionalidad failed:', err);
    }
  },

  // Helper trigger to adjust bank balances dynamically
  syncBancoFromMovimiento: async (mov: MovimientoContable): Promise<void> => {
    if (mov.bancoId) {
      const bancos = storageEngine.getCollection<Banco>('bancos');
      const idx = bancos.findIndex(b => b.id === mov.bancoId);
      if (idx !== -1) {
        const factor = mov.tipo === 'ingreso' ? 1 : -1;
        bancos[idx].saldoActual = parseFloat((bancos[idx].saldoActual + mov.monto * factor).toFixed(2));
        storageEngine.saveCollection('bancos', bancos);
      }
    }
  }
};

// ==========================================
// ONE-TIME AUTOMATIC SUPERADMIN BOOTSTRAPPER
// ==========================================
export const bootstrapSuperAdmin = async () => {
  if (typeof window === 'undefined') return;
  
  const alreadyBootstrapped = localStorage.getItem('contacould_bootstrapped_admin_v3');
  const users = storageEngine.getCollection<Usuario>('usuarios');
  const hasGin = users.some(u => u.email.toLowerCase() === 'gin.zu.ken@gmail.com');
  
  if (alreadyBootstrapped && hasGin) return;
  
  try {
    // Clear demo session on first load to force real logins
    const currentSession = authService.getCurrentSession();
    if (currentSession && (currentSession.uid === 'usuario_demo_uid' || currentSession.uid === 'usuario_demo')) {
      localStorage.removeItem('sv_auth_session');
    }

    const masterCompanyId = 'empresa_demo_peru';
    const masterCompany: Empresa = {
      id: masterCompanyId,
      razonSocial: 'Inversiones Perú S.A.C.',
      nombreComercial: 'InverPeru Corp',
      ruc: '20601234567',
      direccion: 'Av. Javier Prado Este 1024, San Isidro, Lima',
      email: 'contacto@inverperu.com.pe',
      fechaCreacion: new Date().toISOString(),
      estado: 'activo'
    };
    
    // 1. Bootstrap Gin Super Admin
    const emailGin = 'gin.zu.ken@gmail.com';
    const passGin = 'gin_perales26';
    let uidGin = 'usr_superadmin';
    
    console.log('[Bootstrap] Registering Gin in Firebase Auth...');
    try {
      const creds = await createUserWithEmailAndPassword(auth, emailGin, passGin);
      uidGin = creds.user.uid;
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        try {
          const creds = await signInWithEmailAndPassword(auth, emailGin, passGin);
          uidGin = creds.user.uid;
        } catch (loginErr) {
          console.warn('[Bootstrap] Gin Auth check error:', loginErr);
        }
      }
    }
    
    const superAdminUser: Usuario = {
      id: uidGin,
      empresaId: masterCompanyId,
      nombre: 'Super Administrador',
      email: emailGin,
      rol: 'Super Administrador',
      activo: true,
      fechaRegistro: new Date().toISOString()
    };
    
    // 2. Bootstrap Harold Admin
    const emailHarold = 'harold.20guerra17@gmail.com';
    const passHarold = 'harold2026';
    let uidHarold = 'usr_harold_admin';
    
    console.log('[Bootstrap] Registering Harold in Firebase Auth...');
    try {
      const creds = await createUserWithEmailAndPassword(auth, emailHarold, passHarold);
      uidHarold = creds.user.uid;
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        try {
          const creds = await signInWithEmailAndPassword(auth, emailHarold, passHarold);
          uidHarold = creds.user.uid;
        } catch (loginErr) {
          console.warn('[Bootstrap] Harold Auth check error:', loginErr);
        }
      }
    }
    
    const haroldUser: Usuario = {
      id: uidHarold,
      empresaId: masterCompanyId,
      nombre: 'Harold Guerra',
      email: emailHarold,
      rol: 'Administrador',
      activo: true,
      fechaRegistro: new Date().toISOString()
    };
    
    // 3. Save to Local Storage FIRST to ensure immediate offline compatibility
    if (!users.some(u => u.email.toLowerCase() === emailGin.toLowerCase())) {
      users.push(superAdminUser);
    }
    if (!users.some(u => u.email.toLowerCase() === emailHarold.toLowerCase())) {
      users.push(haroldUser);
    }
    storageEngine.saveCollection('usuarios', users);
    
    // 4. Silent sync to Cloud Firestore (prevents crashes from regional or rule restrictions)
    try {
      await setDoc(doc(db, 'empresas', masterCompanyId), masterCompany);
      await setDoc(doc(db, 'usuarios', uidGin), superAdminUser);
      await setDoc(doc(db, 'usuarios', uidHarold), haroldUser);
      console.log('[Bootstrap] Successfully synced super admins to cloud.');
    } catch (fsErr) {
      console.warn('[Bootstrap Cloud Sync Warning] Could not write bootstrap users to cloud:', fsErr);
    }
    
    localStorage.setItem('contacould_bootstrapped_admin_v3', 'true');
    console.log('[Bootstrap] Admin users registered successfully in Local Storage!');
  } catch (err) {
    console.warn('[Bootstrap Warning] Could not register admins automatically:', err);
  }
};

export const storageService = {
  uploadFile: async (path: string, file: File): Promise<{ url: string; name: string }> => {
    // Simulated upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Return a dummy secure URL and filename
    return {
      url: `/mock-attachments/${file.name}`,
      name: file.name
    };
  }
};
