export interface Empresa {
  id: string;
  razonSocial: string;
  nombreComercial: string;
  ruc: string; // 11 digits, validated in Peru
  direccion: string;
  telefono?: string;
  email: string;
  logo?: string;
  fechaCreacion: string;
  estado: 'activo' | 'suspendido' | 'inactivo' | 'pendiente_validacion';
  latitud?: number;
  longitud?: number;
  plan?: string;
  cuponDescuento?: string;
  porcentajeDescuento?: number;
  costoMensual?: number;
  rubro?: 'Comercio' | 'Servicios' | 'Manufactura' | 'Construcción';
  funcionalidadesHabilitadas?: string[];
}

export type RolUsuario = 'Super Administrador' | 'Administrador' | 'Contador' | 'Gerente' | 'Operador';

export interface Usuario {
  id: string;
  empresaId: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  fechaRegistro: string;
  empresasAsociadas?: string[];
}

export interface Cliente {
  id: string;
  empresaId: string;
  nombres: string; // Or Razon Social
  documento: string; // DNI (8 digits) or RUC (11 digits)
  direccion?: string;
  telefono?: string;
  correo?: string;
  fechaCreacion: string;
}

export interface Proveedor {
  id: string;
  empresaId: string;
  razonSocial: string;
  ruc: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  fechaCreacion: string;
}

export type TipoMovimiento = 'ingreso' | 'egreso';
export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';

export interface MovimientoContable {
  id: string;
  empresaId: string;
  fecha: string;
  tipo: TipoMovimiento;
  categoria: string; // e.g. "Venta", "Planilla", "Servicios", "Impuestos", "Alquiler"
  descripcion: string;
  monto: number;
  metodoPago: MetodoPago;
  usuarioId: string;
  bancoId?: string; // Links to Banco
  cajaChica?: boolean;
}

export type TipoComprobante = 'factura' | 'boleta';
export type EstadoComprobante = 'pendiente' | 'pagado' | 'anulado';

export interface Factura {
  id: string;
  empresaId: string;
  clienteId: string;
  clienteNombre: string;
  clienteDocumento: string;
  tipo: TipoComprobante;
  serie: string; // F001 or B001
  numero: string; // Correlative number
  fecha: string;
  fechaVencimiento: string;
  subtotal: number;
  igv: number; // 18% in Peru
  total: number;
  estado: EstadoComprobante;
  metodoPago?: MetodoPago;
  detalles: FacturaDetalle[];
}

export interface FacturaDetalle {
  productoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface Compra {
  id: string;
  empresaId: string;
  proveedorId: string;
  proveedorRazonSocial: string;
  proveedorRuc: string;
  fecha: string;
  subtotal: number;
  igv: number;
  total: number;
  adjuntoUrl?: string; // URL of PDF or image in Storage
  adjuntoNombre?: string;
  categoria: string; // Mercaderia, Servicios, Activos, etc.
}

export interface Banco {
  id: string;
  empresaId: string;
  banco: string; // e.g. "BCP", "BBVA", "Interbank", "Scotiabank"
  tipoCuenta: 'corriente' | 'ahorros';
  numeroCuenta: string;
  moneda: 'PEN' | 'USD';
  saldoActual: number;
  cci?: string;
}

export interface Producto {
  id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precioVenta: number;
  precioCompra: number;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
}

export interface Kardex {
  id: string;
  empresaId: string;
  productoId: string;
  fecha: string;
  tipo: 'entrada' | 'salida';
  concepto: string; // e.g. "Inventario Inicial", "Venta F001-0024"
  cantidad: number;
  precioUnitario: number;
  stockResultante: number;
}

export interface Trabajador {
  id: string;
  empresaId: string;
  nombre: string;
  documento: string; // DNI
  cargo: string;
  sueldoBasico: number;
  fechaIngreso: string;
  regimenLaboral: 'general' | 'mype' | 'practicante';
  activo: boolean;
}

export interface Promocion {
  id: string;
  codigo: string;
  descripcion: string;
  porcentajeDescuento: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  mostrarLanding: boolean;
  mostrarBannerSuperior: boolean;
  tipoPlan?: string;
}

export type RubroComercial = 'Comercio' | 'Servicios' | 'Manufactura' | 'Construcción';

export interface Funcionalidad {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string; // Identifier of Lucide (e.g. "ShoppingBag", "Wallet")
  categoria: 'Core' | 'Avanzado' | 'IA & Analítica' | 'Personalizado';
  rubrosRecomendados: RubroComercial[];
  precioMensual: number;
  activo: boolean;
  esDefault?: boolean;
}
