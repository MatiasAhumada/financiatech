# Sistema de Autenticación y Permisos

## Rutas RESTful

### Sesión (Autenticación)
- `POST /api/session` - Crear sesión (login)
- `GET /api/session` - Obtener sesión actual (me)
- `DELETE /api/session` - Eliminar sesión (logout)

### Usuarios
- `POST /api/users` - Crear usuario (register)
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Dispositivos
- `GET /api/devices` - Listar dispositivos
- `POST /api/devices` - Crear dispositivo
- `GET /api/devices/:id` - Obtener dispositivo
- `PUT /api/devices/:id` - Actualizar dispositivo
- `DELETE /api/devices/:id` - Eliminar dispositivo

## Roles y Permisos

### SUPER_ADMIN
- Crear y eliminar admins
- Ver todos los admins
- Gestión completa del sistema

### ADMIN
- Crear, actualizar y eliminar clientes
- Crear, actualizar y eliminar dispositivos
- Ver solo sus propios datos

## Uso

### Proteger Rutas API

```typescript
import { verifyAuth, requireRole } from "@/utils/auth.middleware";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  verifyAuth(request);
}

export async function POST(request: NextRequest) {
  requireRole(request, [UserRole.SUPER_ADMIN]);
}
```

### Usar en Componentes

```typescript
"use client";
import { useAuth } from "@/hooks/useAuth";

export default function Component() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) return <div>No autenticado</div>;
  
  return <div>Hola {user?.name}</div>;
}
```

## Configuración

1. Agregar `JWT_SECRET` en `.env`
2. Ejecutar `pnpm migrate`
3. Credenciales: `superadmin@deviceguard.com` / `admin123`

## Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- JWT con expiración de 7 días
- Tokens en cookies httpOnly
- Rutas RESTful siguiendo estándares
