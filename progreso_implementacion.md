# Progreso de Implementación y Contexto: ContaCloud ERP (Perú)

Este archivo sirve como fuente de verdad y memoria de contexto para el desarrollo continuo de **ContaCloud**, un SaaS ERP de contabilidad modular y multiempresa de alta gama adaptado a las regulaciones tributarias del mercado peruano.

---

## 🏛️ 1. Arquitectura del Proyecto

El sistema está estructurado bajo los principios de **Clean Architecture** y **Domain-Driven Design (DDD)** para garantizar desacoplamiento y escalabilidad:

```
src/
├── app/                        # Capa de Presentación y Enrutamiento (Next.js 15)
│   ├── (auth)/                 # Rutas públicas/de sesión (Login, Registro, etc.)
│   ├── (dashboard)/            # Vistas protegidas de la aplicación
│   ├── globals.css             # Estilos globales y variables de color
│   ├── layout.tsx              # Proveedor de contextos (Auth + Company)
│   └── page.tsx                # Enrutador inteligente (Splash -> Landing -> Auth -> ERP)
├── components/                 # Componentes de React
│   ├── ui/                     # Librería UI personalizada de alta gama (custom.tsx)
│   ├── shared/                 # Estructura del shell (Sidebar, Navbar)
│   └── modules/                # 13 Módulos autocontenidos y altamente interactivos
├── core/                       # Núcleo del Dominio y Lógica de Negocio
│   ├── models/                 # Modelos y tipados TypeScript (types.ts)
│   └── services/               # Servicios de Infraestructura (firebase.ts)
└── hooks/                      # Ganchos de React (useAuth, useCompany)
```

---

## 🔒 2. Seguridad y Multi-Tenant (Aislamiento de Datos)

Para garantizar la estricta confidencialidad empresarial exigida en plataformas SaaS, definimos reglas de seguridad a nivel de base de datos y almacenamiento:

### Reglas de Firestore (`firestore.rules`)
*   Filtra consultas validando que el campo `empresaId` de cada documento coincida exactamente con la propiedad `empresaId` del perfil del usuario autenticado (`request.auth.uid`).
*   Evita filtraciones cruzadas de datos entre distintos tenants empresariales.

### Reglas de Storage (`storage.rules`)
*   Restringe el acceso de lectura y escritura de archivos adjuntos (ej. comprobantes de compras) únicamente a usuarios pertenecientes a la empresa propietaria del archivo: `/empresas/{empresaId}/compras/{allPaths=**}`.

---

## 💾 3. Capa de Datos Persistente e Interactiva (`firebase.ts`)

ContaCloud cuenta con un motor de simulación de base de datos en el cliente (`storageEngine` en `firebase.ts`) basado en `window.localStorage` que precarga datos empresariales de alta fidelidad si no se cuenta con conexión en la nube. Esto permite pruebas estáticas inmediatas y fluidas:

*   **Empresas y Usuarios de Demostración**:
    *   *Empresa*: `Inversiones Perú S.A.C.` (RUC: `20601234567`)
    *   *Usuario*: `Carlos Mendoza` (Rol: `Administrador`, correo: `gerente@inverperu.com.pe`, clave: `123456`).
*   **Datos Precargados**: Cuentas bancarias (BCP corriente en Soles y BBVA ahorros en Dólares), movimientos iniciales de caja chica, clientes/proveedores con RUC/DNI peruanos correctos, inventario de productos y transacciones de stock registradas.

---

## 📦 4. Módulos Implementados de ContaCloud

A continuación se detalla el alcance de los 13 módulos funcionales completamente programados y verificados:

### 1. Landing Page (`landing.tsx`)
*   **3D Interactive Particles (Three.js)**: Renderiza en el fondo un lienzo de partículas de colores corporativos interconectados que oscilan en ondas tridimensionales y giran con suavidad, interactuando dinámicamente con la posición del cursor.
*   **Staggered Animations (Anime.js)**: Animaciones de entrada secuencial de alta gama para cabeceras, botones, badges e información de planes.
*   **Widgets de Marketing**: Simulador en vivo de boletas de pago peruanas, barra con estadísticas vitales de la aplicación y tabla comparativa interactiva de planes (facturación mensual/anual).

### 2. Autenticación (`auth.tsx`)
*   Pantallas optimizadas de Iniciar Sesión (con credenciales demo o Google), Registro (validando RUC de 11 dígitos) y Recuperación de Contraseña.
*   Enlace de navegación bidireccional suave para retornar a la página de marketing.

### 3. Dashboard Ejecutivo (`dashboard.tsx`)
*   Tarjetas de KPIs dinámicos: Ventas del mes, gastos, utilidades netas, saldos de efectivo y cuentas pendientes.
*   Gráficos estadísticos interactivos con **Recharts**: Barras mensuales (Ingresos vs Egresos), Rosquilla (Egresos por Categorías) y Área suavizada (Tendencia de Caja).

### 4. Caja Chica (`caja.tsx`)
*   Registro de ingresos y egresos diarios, categorizados y asociados a métodos de pago, con actualización reactiva del saldo disponible en caja.

### 5. Cuentas Bancarias y Conciliación (`bancos.tsx`)
*   Soporte multimoneda (Soles/Dólares) en cuentas de bancos.
*   **Herramienta de Conciliación**: Interfaz interactiva de punteo para conciliar transacciones contables con extractos del banco cargados al vuelo.

### 6. Clientes y Proveedores (`contactos.tsx`)
*   CRUD completo con validaciones de tipo de documento (DNI 8 dígitos / RUC 11 dígitos).
*   **Ficha Histórica**: Despliega un panel lateral (Drawer) que lista cronológicamente todos los comprobantes emitidos para el cliente o compras asociadas al proveedor seleccionado.

### 7. Compras y Comprobantes (`compras.tsx`)
*   Registro de facturas de compras (Mercadería, Servicios, Activos).
*   Módulo de carga simulada de archivos PDF y XML con área de arrastrar y soltar (*Drag and Drop*).

### 8. Ventas y Facturación Electrónica (`ventas.tsx`)
*   Generador interactivo de Facturas y Boletas agregando productos del inventario y recalculando en tiempo real el **IGV (18%)** y totales.
*   **Plantilla SUNAT de Impresión**: Vista optimizada para imprimir o descargar el comprobante en formato SUNAT oficial (incluye representación de código de barras y códigos QR).

### 9. Cuentas por Cobrar y Cuentas por Pagar (`cuentas.tsx`)
*   Reportes de saldos pendientes de cobro y obligaciones financieras con proveedores.
*   Alertas automáticas en color rojo que detallan los días de mora de las facturas vencidas.

### 10. Control de Inventario y Kardex (`inventario.tsx`)
*   Alertas de stock mínimo y reposición urgente.
*   **Historial Kardex**: Reporte de auditoría detallado por producto bajo el formato estándar de Kardex contable.

### 11. Planilla y Recursos Humanos (`rrhh.tsx`)
*   Cálculo de planillas aplicando las deducciones peruanas de pensión obligatoria (AFP/ONP 13% estimado) y la aportación patronal de salud (EsSalud 9%).

### 12. Estados Financieros (`reportes.tsx`)
*   Genera e imprime el **Balance General** y el **Estado de Ganancias y Pérdidas (Estado de Resultados)**.
*   Permite la descarga directa de la data estructurada en formato CSV.

### 13. Analista Financiero IA (`ia.tsx`)
*   **Ratios Contables en Vivo**: Deduce automáticamente indicadores clave de liquidez, prueba ácida y margen neto de la empresa.
*   **Predictor de Flujo**: Proyección a 3 meses del comportamiento de ingresos y egresos.
*   **Chatbot Contable**: Agente inteligente interactivo que responde preguntas financieras analizando los saldos reales de la empresa.

---

## 🔍 5. Estado de Compilación y Verificación

*   **TypeScript Estricto**: Todo el código cuenta con un tipado estricto sin dependencias rotas, logrando compilar con éxito rotundo (`npx tsc --noEmit` finaliza con código 0 y sin advertencias).
*   **Prevención de Hydration Mismatches**: Todos los cálculos del cliente basados en `window` y `localStorage` se encuentran protegidos por ciclos de montaje de React (`mounted` state) para garantizar compatibilidad total con la generación del lado del servidor (SSR) de Next.js.
