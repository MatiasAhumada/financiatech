# DeviceGuard

Sistema de gestión de dispositivos desarrollado con Next.js, Prisma y arquitectura monolítica.

## Arquitectura del Proyecto

Este proyecto sigue una arquitectura monolítica con separación clara de responsabilidades:

### Estructura de Carpetas

```
src/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes (Controllers)
│   │   └── devices/       # Rutas de dispositivos
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── components/            # Componentes React
│   └── ui/               # Componentes de shadcn/ui
├── constants/            # Constantes del proyecto
│   ├── routes.ts         # Rutas del frontend y API
│   ├── error-messages.constant.ts
│   └── config.constant.ts
├── lib/                  # Utilidades y configuraciones
│   ├── prisma.ts         # Cliente de Prisma
│   └── utils.ts          # Utilidades de shadcn
├── server/               # Lógica del backend
│   ├── repository/       # Capa de acceso a datos
│   └── services/         # Lógica de negocio del backend
├── services/             # Servicios del frontend
├── types/                # Tipos de TypeScript
├── utils/                # Utilidades generales
│   └── handlers/         # Manejadores de errores
└── ...
```

### Flujo de Datos

1. **Frontend** → `src/services/` → API Routes (`src/app/api/`)
2. **API Routes** → `src/server/services/` → `src/server/repository/`
3. **Repository** → Prisma → Base de datos

## Tecnologías

- **Framework**: Next.js 16 con App Router
- **Base de datos**: PostgreSQL con Prisma ORM
- **UI**: shadcn/ui + Tailwind CSS
- **Validación**: Zod
- **HTTP Client**: Axios
- **Notificaciones**: Sonner
- **Logging**: Winston

## Configuración

1. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con tus configuraciones.

3. **Configurar base de datos**:
   ```bash
   pnpm migrate
   ```

4. **Ejecutar en desarrollo**:
   ```bash
   pnpm dev
   ```

## Scripts Disponibles

- `pnpm dev` - Servidor de desarrollo
- `pnpm build` - Build de producción
- `pnpm start` - Servidor de producción
- `pnpm lint` - Linter
- `pnpm migrate` - Ejecutar migraciones
- `pnpm studio` - Prisma Studio

## Reglas de Desarrollo

- **No usar `any` ni `typeof`** (excepto en zod.preprocess)
- **No comparaciones explícitas** (`=== null`, `=== undefined`, etc.)
- **No valores hardcodeados** - usar constantes
- **Funciones pequeñas** con una sola responsabilidad
- **Nombres descriptivos** y semánticos
- **Manejo de errores** con `apiError.handler` y `clientError.handler`
- **REST compliant** - verbos HTTP correctos

## Estructura de Constantes

- `/constants/*.constant.ts` → Reglas de negocio
- `/config/*.ts` → Configuración
- Usar enums de Prisma cuando aplique

## Manejo de Errores

- **Backend**: `apiError.handler`
- **Frontend**: `clientError.handler`
- Códigos HTTP correctos
- No exponer errores crudos

Este proyecto está configurado para ser un sistema de gestión interno ágil, funcional y bien estructurado.
