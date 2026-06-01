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
