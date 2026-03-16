# Plan de Refactor — DeviceGuard Web

## Contexto del Proyecto

DeviceGuard es un sistema de gestión de dispositivos construido con:

- **Framework**: Next.js 16 (App Router)
- **Base de datos**: PostgreSQL + Prisma ORM
- **UI**: shadcn/ui + Tailwind CSS v4
- **Animaciones**: Framer Motion (ya instalado)
- **Notificaciones**: Sonner
- **Auth**: JWT + bcryptjs
- **Push notifications**: Firebase Admin SDK

### Estructura relevante

```
src/
├── app/
│   ├── (home)/          # Dashboard por rol (SuperAdmin / Admin)
│   ├── login/           # Página de login
│   └── api/             # API Routes (controllers)
├── components/
│   ├── common/          # DataTable, GenericModal, PasswordInput
│   ├── dashboard/       # StatCard, AdminDashboard, SuperAdminDashboard, DeviceControlPanel
│   ├── layout/          # Sidebar, DashboardLayout
│   └── sales/           # SaleModal y sus pasos (3 steps)
├── constants/           # Paleta, rutas, mensajes, permisos
├── hooks/               # useAuth, useSaleForm, useActivationPolling, useDebounce
└── services/            # Capa de fetch hacia API Routes
```

### Paleta actual (a reemplazar)

| Token | Hex | Rol |
|---|---|---|
| `onyx` | `#0b090a` | Fondo principal más oscuro |
| `carbon_black` | `#161a1d` | Sidebar, cards, fondos secundarios |
| `mahogany_red` | `#ba181b` | Color primario / acento |
| `dark_garnet` | `#660708` | Variante oscura del primario |
| `strawberry_red` | `#e5383b` | Variante clara del primario |
| `silver` | `#b1a7a6` | Texto secundario / muted |
| `dust_grey` | `#d3d3d3` | Texto terciario |
| `white_smoke` | `#f5f3f4` | Fondos claros |
| `success` | `#10b981` | Estados positivos |
| `warning` | `#f59e0b` | Alertas |

---

## 1. Refactor de Paleta de Colores

### Nueva paleta del cliente

| Color | Hex | Rol semántico |
|---|---|---|
| Deep Teal | `#032831` | Fondo base (reemplaza `onyx` y `carbon_black`) |
| Blue Primary | `#4583FA` | Primario / acento (reemplaza `mahogany_red`, `dark_garnet`, `strawberry_red`) |
| Sky Blue | `#36B2F2` | Secundario / info / hover states |
| White | `#FFFFFF` | Texto principal, fondos claros (reemplaza `white_smoke`) |
| Mint Green | `#3DE3B1` | Success / estados positivos (reemplaza `success`) |

### Estrategia: mantener nombres de tokens existentes

Para minimizar cambios en componentes, se reutilizan los nombres actuales mapeando los nuevos valores. Solo se actualizan `globals.css` y `tailwind.config.js`.

### Mapeo de tokens

| Token actual | Nuevo valor base | Justificación |
|---|---|---|
| `onyx` | `#032831` | Fondo más oscuro → deep teal |
| `carbon_black` | `#032831` con variantes más claras | Fondos secundarios → variantes del teal |
| `mahogany_red` | `#4583FA` | Primario → azul |
| `dark_garnet` | `#1a5fd4` (oscuro de `#4583FA`) | Variante oscura del primario |
| `strawberry_red` | `#7aaafb` (claro de `#4583FA`) | Variante clara del primario |
| `silver` | mantener con leve ajuste frío | Texto muted sobre fondo teal |
| `success` | `#3DE3B1` | Mint green del cliente |
| `success-dark` | `#1fb88a` | Variante oscura del mint |

### Archivos a modificar

1. **`src/app/globals.css`** — Actualizar todas las variables `@theme` y CSS vars de shadcn
2. **`tailwind.config.js`** — Actualizar el objeto `colors` con los nuevos valores y sus escalas

> Los nombres de clases en componentes (`bg-mahogany_red`, `text-silver-400`, `bg-carbon_black`, etc.) **no cambian**, lo que hace el refactor seguro y acotado.

---

## 2. Mejoras de UX con Framer Motion

Framer Motion ya está instalado (`"framer-motion": "^12.34.0"`) y se usa puntualmente en `GenericModal`. El objetivo es extender su uso de forma consistente en toda la app.

### 2.1 Transiciones de página

Envolver el contenido de `DashboardLayout` con un wrapper animado para que cada cambio de ruta tenga una transición suave.

```
src/components/layout/PageTransition.tsx  ← nuevo componente
```

- Animación: `opacity 0→1` + `y 12→0` al montar
- Duración: `0.25s ease-out`

### 2.2 Sidebar

- **Íconos de nav**: micro-animación `scale 0.9→1` al hacer hover
- **Indicador de ruta activa**: usar `layoutId` de Framer para que el highlight se deslice entre ítems al navegar
- **Apertura mobile**: ya tiene transición CSS, migrar a `AnimatePresence` + `motion.aside` para mayor control

### 2.3 StatCards (Dashboard)

- Entrada escalonada (`staggerChildren`) al cargar el dashboard
- Cada card: `opacity 0→1` + `y 20→0` con delay incremental (`0.05s` por card)

### 2.4 DataTable

- Filas de la tabla: entrada escalonada al cargar datos
- Animación: `opacity 0→1` con `staggerChildren 0.03s`
- Evitar re-animar en búsquedas (usar `key` basado en los datos)

### 2.5 Modales (GenericModal)

Ya tiene animación básica. Mejorar:
- Backdrop: `blur 0→4px` además del `opacity`
- Contenido: spring suave en lugar de `duration: 0.2` fijo

```ts
transition={{ type: "spring", stiffness: 300, damping: 30 }}
```

### 2.6 SaleModal — Steps

- Transición entre pasos 1→2→3: slide horizontal (`x: 40→0` al avanzar, `x: -40→0` al retroceder)
- Usar `AnimatePresence mode="wait"` con `key={step}`

### 2.7 Toasts / Feedback

- Los toasts de Sonner ya tienen animación propia, no modificar
- Botones de acción crítica (bloquear/desbloquear en `DeviceControlPanel`): pulso sutil en el ícono de estado

### 2.8 DeviceControlPanel

- Estado BLOQUEADO/ACTIVO: transición de color con `motion.div` y `animate` en lugar de clases condicionales
- Ícono de candado: rotación `0→360deg` al cambiar estado

---

## Orden de ejecución sugerido

```
1. globals.css          → nueva paleta (sin tocar componentes)
2. tailwind.config.js   → nueva paleta
3. PageTransition.tsx   → transiciones de ruta
4. Sidebar.tsx          → layoutId + AnimatePresence mobile
5. StatCard.tsx         → stagger de entrada
6. GenericModal.tsx     → spring + blur backdrop
7. SaleModal steps      → slide horizontal entre pasos
8. DataTable.tsx        → stagger de filas
9. DeviceControlPanel   → animación de estado
```

---

## Notas

- Todos los cambios de paleta son **no breaking** (solo CSS/config)
- Las animaciones deben respetar `prefers-reduced-motion` — usar el hook `useReducedMotion` de Framer Motion donde aplique
- No agregar animaciones en rutas de API ni en lógica de servidor
