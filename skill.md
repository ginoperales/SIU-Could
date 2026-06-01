# Skill: Validación de Tenants por Super Administrador y Modo Lectura

Este archivo registra el avance técnico, el diseño de arquitectura y el comportamiento del sistema de validación de cuentas de empresas (tenants) e interceptación de escritura en base de datos.

---

## 🛠️ Especificaciones de Arquitectura

### 1. Estado y Registro de Tenants
- **Auto-registro Público (`authService.register`)**: Todo nuevo tenant que se registre de manera independiente a través del formulario público inicia en `estado: 'pendiente_validacion'`. Esto restringe temporalmente su acceso a operaciones de escritura.
- **Registro Directo por Super Administrador (`dbService.createCompanyAndAdmin`)**: Si la cuenta es aprovisionada por el Super Administrador en su panel de control, inicia de inmediato como `estado: 'activo'` (completamente habilitada y funcional).

### 2. Bloqueo Transaccional a Nivel de Base de Datos (`firebase.ts`)
- Se implementó la función central `dbService.checkCompanyValidation(empresaId)` la cual:
  - Comprueba si el usuario autenticado posee el rol `'Super Administrador'`. En caso afirmativo, **omite el bloqueo** para permitir modificaciones administrativas o impersonación.
  - Comprueba si la empresa tiene el estado `'pendiente_validacion'`. De ser así, arroja una excepción explícita de seguridad bloqueando inmediatamente cualquier operación.
- Esta comprobación se inyectó en los métodos transaccionales del motor de base de datos:
  - `dbService.addDocument`
  - `dbService.updateDocument`
  - `dbService.deleteDocument`
- Esto garantiza que **ningún módulo o formulario** (Caja, Facturas, Compras, Inventario, Planillas, etc.) pueda alterar la base de datos local ni la nube de Firestore sin la autorización del Super Administrador, manteniendo la integridad del ERP.

### 3. Experiencia de Usuario y Modo Lectura (`page.tsx`)
- Se diseñó un banner premium de advertencia glassmorphic que se renderiza dinámicamente en el layout principal si `company.estado === 'pendiente_validacion'`.
- Informa detalladamente al usuario que sus funciones están en **Modo Lectura** y le proporciona un botón directo de contacto con el soporte administrativo.

### 4. Centro de Solicitudes y Notificaciones del Super Admin (`superadmin.tsx`)
- Se agregó la subpestaña **"Solicitudes y Notificaciones"** en la consola del Super Administrador.
- Permite listar de forma interactiva en tiempo real todas las empresas que están en espera de validación, mostrando sus datos y los de su administrador.
- Ofrece controles directos para **"Validar y Activar ERP"** (desbloqueo inmediato) o **"Rechazar"** (suspensión de la solicitud), actualizando los datos en tiempo real tanto localmente como en Cloud Firestore.

---

## 📈 Registro de Avance e Implementación

| Fecha / Hora | Componente | Acción Realizada | Estado |
| :--- | :--- | :--- | :--- |
| 2026-06-01 | `types.ts` | Extensión del tipo de estado para incluir `'pendiente_validacion'`. | ¡Completado! |
| 2026-06-01 | `firebase.ts` | Integración de `checkCompanyValidation` en capa transaccional de escritura (`addDocument`, `updateDocument`, `deleteDocument`). | ¡Completado! |
| 2026-06-01 | `firebase.ts` | Configuración de estado por defecto `'pendiente_validacion'` para auto-registro público. | ¡Completado! |
| 2026-06-01 | `firebase.ts` | Configuración de estado activo y funcionalidades por defecto al registrar por consola de Super Admin. | ¡Completado! |
| 2026-06-01 | `page.tsx` | Diseño e integración del banner premium de aviso de Modo Lectura e interacción con soporte. | ¡Completado! |
| 2026-06-01 | `superadmin.tsx` | Creación de la bandeja interactiva de solicitudes y notificaciones para validación y activación ágil de tenants. | ¡Completado! |

---

# Skill: Puesta a Cero Contable y Saldos Iniciales en Cero

Este archivo registra el avance técnico, diseño de arquitectura y especificaciones del sistema de puesta a cero contable (base de datos limpia) e inicialización estricta de saldos en cero.

---

## 🛠️ Especificaciones de Arquitectura

### 1. Inicialización de Saldos en Cero
- **Seeding de Cuenta BCP**: Anteriormente, las empresas creadas iniciaban sin banco o con un saldo de simulación de S/. 5,000.00. Ahora se configuró de forma estricta el saldo inicial de la cuenta corriente BCP predeterminada a exactamente **`S/. 0.00`** en los tres flujos de creación del sistema:
  1. Auto-registro público (`authService.register`).
  2. Registro directo por Super Administrador (`dbService.createCompanyAndAdmin`).
  3. Creación interna de empresa en el dashboard principal (`handleAddCompany`).
- **Inclusión de CCI**: Adicionalmente, se incluyó el código de cuenta interbancario (CCI) peruano estructurado automáticamente para todas las cuentas iniciales.

### 2. Purga y Reseteo Contable en Base de Datos (`resetCompanyData`)
- Se implementó la utilidad transaccional `dbService.resetCompanyData(empresaId)` para:
  - **Filtro de Seguridad**: Bloquear de forma irreversible cualquier intento de reinicio sobre la empresa demo principal RUC `20601234567` (Inversiones Perú S.A.C.) para conservar intactos los datos de demostración del sistema.
  - **Purgado de Datos**: Eliminar permanentemente todos los documentos de las colecciones transaccionales: `clientes`, `proveedores`, `movimientos`, `facturas`, `compras`, `productos`, `kardex` y `trabajadores` en LocalStorage y Cloud Firestore.
  - **Reseteo Bancario**: Conservar las cuentas corrientes configuradas del tenant, pero restableciendo su `saldoActual` a exactamente **`0.00`** PEN tanto de forma local como en Firestore.

### 3. Panel de Control de Puesta a Cero en Configuración (`configuracion.tsx`)
- Se diseñó e integró la subpestaña **"Puesta a Cero"** en el panel de Configuración de la Empresa.
- Renderiza un panel premium de peligro destacado rojo explicativo con un listado detallado de todas las colecciones contables que serán eliminadas.
- Solicita al usuario autenticado (con privilegios de Administrador o Super Administrador) escribir de forma explícita el RUC de su propia empresa para autorizar y desbloquear el botón de restablecimiento.
- Tras la confirmación, purga la base de datos local y en la nube, y fuerza una recarga total limpia del ERP.

### 4. Control Directo de Puesta a Cero para el Super Admin (`superadmin.tsx`)
- Se integró un control directo e interactivo de **"Puesta a Cero"** dentro del Directorio de Tenants en la consola de control del Super Administrador.
- Deshabilita el botón de manera nativa si el tenant corresponde a la empresa demo para evitar accidentes.
- Abre un modal premium de confirmación de alto riesgo que requiere ingresar manualmente el RUC del tenant objetivo para confirmar la purga remota de sus libros contables.

---

## 📈 Registro de Avance e Implementación

| Fecha / Hora | Componente | Acción Realizada | Estado |
| :--- | :--- | :--- | :--- |
| 2026-06-01 | `firebase.ts` | Configuración de saldos a S/. 0.00 con CCI estructurado en `register` y `createCompanyAndAdmin`. | ¡Completado! |
| 2026-06-01 | `dashboard.tsx` | Ajuste de saldo inicial de cuenta corriente BCP a S/. 0.00 con CCI dinámico en `handleAddCompany`. | ¡Completado! |
| 2026-06-01 | `firebase.ts` | Implementación del método centralizado `dbService.resetCompanyData` con bypass de validación y purga local/cloud. | ¡Completado! |
| 2026-06-01 | `configuracion.tsx` | Diseño e integración del panel de Puesta a Cero y modal de confirmación por RUC. | ¡Completado! |
| 2026-06-01 | `superadmin.tsx` | Integración de botón en directorio y modal premium de reinicio con validación de RUC de la empresa objetivo. | ¡Completado! |
| 2026-06-01 | `skill.md` | Registro y consolidación histórica de la arquitectura de reinicio y saldos en cero. | ¡Completado! |

