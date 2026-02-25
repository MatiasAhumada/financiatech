# BACKLOG — DeviceGuard

Issues y mejoras pendientes detectadas durante el desarrollo y QA.
Cada ítem tiene su contexto técnico y criterios de aceptación claros.

---

## ✅ BUG RESUELTO — Issue #1: Dispositivo desaparece de la vista tras sincronizarse

**Módulo:** `deviceguard-web` — Página de Dispositivos  
**Severidad:** Alta — afecta visibilidad del inventario post-venta

**Descripción:**  
Cuando un dispositivo pasa al estado `SOLD_SYNCED` (se vincula con la app), desaparece
de la tabla de dispositivos en el panel web. El comportamiento correcto es que siga
apareciendo con un badge/estado que indique "Sincronizado".

**Causa probable:**  
La query de la página de dispositivos filtra por ciertos estados y excluye `SOLD_SYNCED`,
o el componente de la tabla no renderiza ese estado.

**Archivos a revisar:**
- `src/app/(home)/devices/page.tsx` — query de dispositivos al backend
- `src/server/repository/devices.repository.ts` — filtros aplicados en Prisma
- `src/app/(home)/devices/` — columna de estado en la tabla

**Criterios de aceptación:**
- [ ] El dispositivo `SOLD_SYNCED` aparece en la tabla de dispositivos
- [ ] Su estado se muestra como un badge "Sincronizado" (color verde o carmesí)
- [ ] No desaparece al recargar la página

---

## ✅ BUG RESUELTO — Issue #2: Error 500 genérico al crear dispositivo con datos duplicados

**Módulo:** `deviceguard-web` — API de dispositivos  
**Severidad:** Alta — experiencia de usuario y debugging comprometidos

**Descripción:**  
Al intentar crear un dispositivo con el mismo modelo y número de serie que uno existente,
el backend retorna un `500 Internal Server Error` genérico en lugar de un error descriptivo.
El `ApiError` ya existe en el proyecto para manejar esto correctamente.

**Causa probable:**  
El `catch` del service/repository no captura la excepción de unicidad de Prisma
(`PrismaClientKnownRequestError` con código `P2002`) y la deja subir sin convertirla
en un `ApiError` con status `409 Conflict`.

**Archivos a modificar:**
- `src/server/services/device.service.ts` — capturar `P2002` y lanzar `ApiError 409`
- `src/server/repository/devices.repository.ts` — validación previa opcional
- `src/app/api/devices/route.ts` — verificar que `apiErrorHandler` lo recibe bien

**Criterios de aceptación:**
- [ ] `POST /api/devices` con serial duplicado retorna `409 Conflict`
- [ ] El body del error incluye `{ message: "Ya existe un dispositivo con ese número de serie" }`
- [ ] El frontend muestra ese mensaje al usuario (toast o inline)
- [ ] No aparece ningún `500` en los logs del servidor por este caso

---

## 🟡 MEJORA — Issue #3: Tabla de ventas no se auto-actualiza tras crear una venta

**Módulo:** `deviceguard-web` — Página de Ventas  
**Severidad:** Media — UX degradada, requiere recarga manual

**Descripción:**  
Al registrar una nueva venta desde el `SaleModal`, la tabla de ventas no refleja el nuevo
registro hasta que el usuario recarga la página manualmente.

**Solución propuesta: migrar a `useQuery` (TanStack Query)**  
Usar `@tanstack/react-query` para las queries de tablas, lo que permite:
- Invalidación automática del cache tras mutaciones (`onSuccess` → `queryClient.invalidateQueries`)
- Refetch en foco de ventana
- Estados de loading/error declarativos
- Consistencia futura para todas las tablas del panel

**Archivos a crear/modificar:**
- `src/providers/QueryProvider.tsx` — wrappear `<QueryClientProvider>` en el layout
- `src/app/(home)/layout.tsx` — incluir el provider
- `src/hooks/useSales.ts` — hook con `useQuery` para la lista de ventas
- `src/hooks/useSaleForm.ts` — `useMutation` + `invalidateQueries` al crear/editar/eliminar
- Replicar el patrón para `useDevices`, `useClients` en fases siguientes

**Criterios de aceptación:**
- [ ] Al crear/editar/eliminar una venta, la tabla se actualiza sin recargar la página
- [ ] Se muestra estado de loading mientras carga la lista
- [ ] La solución es reutilizable para dispositivos y clientes

---

## 🟡 MEJORA — Issue #4: Columna IMEI en tabla de dispositivos con toggle de visibilidad

**Módulo:** `deviceguard-web` — Página de Dispositivos  
**Severidad:** Media — funcionalidad nueva, mejora de privacidad

**Descripción:**  
En la tabla de dispositivos, agregar una columna **IMEI** que:
- Muestra un ícono de ojo cerrado (`👁‍🗨`) cuando el dispositivo está sincronizado
- Al hacer click, revela el IMEI del equipo
- Si el dispositivo no está sincronizado, muestra `—`
- El IMEI debe obtenerse del registro `DeviceSync` asociado al dispositivo

**Datos:**  
El IMEI está en `DeviceSync.imei`, relacionado por `DeviceSync.deviceId`.

**Archivos a modificar:**
- `src/server/repository/devices.repository.ts` — incluir `deviceSync` en el `include` de la query
- `src/types/index.ts` — extender `IDevice` con `deviceSync?: PrismaDeviceSync | null`
- `src/app/(home)/devices/page.tsx` — agregar columna IMEI a la tabla
- `src/components/devices/ImeiCell.tsx` — nuevo componente con toggle show/hide

**Componente `ImeiCell`:**
```tsx
// Muestra ojo cerrado → click → revela IMEI por 5s → vuelve a ocultar
function ImeiCell({ imei }: { imei: string | null }) {
  const [visible, setVisible] = useState(false);
  if (!imei) return <span>—</span>;
  return (
    <button onClick={() => setVisible(v => !v)}>
      {visible ? imei : '••••••••••••••'}
      <EyeIcon />
    </button>
  );
}
```

**Criterios de aceptación:**
- [ ] La columna IMEI aparece en la tabla de dispositivos
- [ ] Para dispositivos no sincronizados muestra `—`
- [ ] Al hacer click en el ícono, se muestra el IMEI en texto plano
- [ ] Al hacer click de nuevo (o tras 5s), vuelve a ocultar el IMEI
- [ ] El ícono cambia entre ojo abierto y ojo cerrado según el estado

---

## 📊 Estado del backlog

| # | Tipo | Módulo | Severidad | Estado |
|---|---|---|---|---|
| 1 | 🔴 Bug | Devices repository — filtro de estado | Alta | ✅ Resuelto |
| 2 | 🔴 Bug | Device service — P2002 → ApiError 409 | Alta | ✅ Resuelto |
| 3 | 🟡 Mejora | Sales table — useQuery | Media | ⏳ Pendiente |
| 4 | 🟡 Mejora | Devices table — IMEI column | Media | ⏳ Pendiente |
