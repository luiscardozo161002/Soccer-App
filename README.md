# Liga de Fútbol — Plataforma de gestión

Aplicación web para administrar una liga de fútbol amateur: equipos, jugadores, calendario de
partidos, tabla de posiciones por categoría, torneos de Copa (eliminación directa), tarjetas y
sanciones, canchas, temporadas, y un sitio público de solo lectura con la información de la liga.

## Stack

- **Next.js 16** (App Router) — frontend y backend en el mismo proyecto. `proxy.ts` en la raíz
  reemplaza el `middleware.ts` de versiones anteriores (ver nota en [AGENTS.md](AGENTS.md): esta
  versión de Next.js tiene cambios respecto a lo habitual, revisar
  `node_modules/next/dist/docs/` antes de tocar convenciones del framework).
- **React 19** + **TypeScript**
- **PostgreSQL** vía **Prisma 7** (`@prisma/adapter-pg`)
- **TanStack Query** para estado remoto/cache en el cliente
- **React Hook Form + Zod** para formularios y validación (el mismo schema Zod se reutiliza en
  cliente y servidor)
- **JWT** (librería `jose`) en una cookie de sesión httpOnly para autenticación del panel admin
- **Redis** (opcional) para rate limiting distribuido, con fallback a un contador en memoria si no
  hay `REDIS_URL` configurado
- **Resend** para el correo de restablecimiento de contraseña
- **Tailwind CSS v4**, **Framer Motion**, **Lucide Icons**, **Sonner** (toasts)

## Estructura del proyecto

```
app/
  (landing)/            Sitio público (calendario, tabla de posiciones, equipos)
  (platform)/admin/      Panel de administración (requiere sesión)
    page.tsx              Tabla de posiciones
    teams/ players/ matches/ fields/ sanctions/ cup/ history/ settings/
  api/v1/                 Route handlers REST (ver docs/arquitectura.md para el listado completo)
  login/ forgot-password/ reset-password/   Flujo de autenticación
  generated/prisma/       Cliente de Prisma generado (no editar a mano)

components/
  ui/                    Primitivas de UI compartidas (Table, Modal, Field, Pagination, ...)
  forms/                 Modales de edición por recurso (EditTeamModal, EditMatchModal, ...)
  tables/                Tablas con su propia lógica de listado/paginación
  auth/                  Contenedor visual compartido por login/forgot/reset/404 (AuthShell)

hooks/                   Un hook TanStack Query por recurso (useTeams, useMatches, ...)

lib/
  auth/                  Firma/verificación de la sesión JWT
  http/                  Cliente fetch genérico + rutas de la API
  middleware/            withErrorHandling (envelope de error uniforme para las route handlers)
  repositories/          Acceso a datos vía Prisma
  services/               Reglas de negocio (llaman al repository, nunca al revés)
  validation/            Schemas Zod por recurso (también consumidos desde el cliente)
  security/              Rate limiting (Redis + fallback en memoria)
  constants/              Categorías de liga, motivos de tarjeta, etc.

prisma/
  schema.prisma           Modelo de datos
  seeds/                  Seed por recurso + datos de ejemplo en seed-data/
  bootstrap-admin.ts      Crea/asegura un usuario admin sin depender del seed completo

docs/
  arquitectura.md          Arquitectura, contrato de la API y decisiones de diseño
  schema.sql               Volcado del esquema de base de datos
```

Patrón de capas en el backend: `route.ts` valida el DTO con Zod → llama al **service** (reglas de
negocio, lanza `ApiError` con el código/status correctos) → el service llama al **repository**
(la única capa que toca Prisma). El route handler nunca accede a Prisma directamente.

## Empezar en local

1. **Variables de entorno**: copia `.env.example` a `.env` y ajusta lo necesario. Cada variable
   está documentada ahí mismo (conexión a Postgres, `JWT_SECRET`, Redis opcional, límites de rate
   limiting, `RESEND_API_KEY` opcional — sin configurar, el enlace de restablecimiento de
   contraseña se devuelve en la respuesta de la API en vez de enviarse por correo).

2. **Base de datos**: si no tienes Postgres instalado, `prisma dev` levanta uno local sin Docker:

   ```bash
   pnpm exec prisma dev
   ```

   Copia la cadena de conexión que imprime a `DATABASE_URL` en tu `.env`, luego aplica el schema:

   ```bash
   pnpm exec prisma migrate dev
   ```

3. **Datos de ejemplo** (equipos, jugadores, canchas, partidos, temporada activa, un usuario
   admin — ver `prisma/seed-data/`):

   ```bash
   pnpm db:seed
   ```

   Si solo necesitas un usuario admin sin el resto de los datos de ejemplo:

   ```bash
   pnpm db:bootstrap-admin
   ```

4. **Levantar el servidor**:

   ```bash
   pnpm dev
   ```

   Sitio público en [http://localhost:3000](http://localhost:3000), panel admin en
   `http://localhost:3000/admin` (redirige a `/login` si no hay sesión).

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm lint` | ESLint |
| `pnpm db:seed` | Carga los datos de ejemplo (`prisma/seed.ts`) |
| `pnpm db:bootstrap-admin` | Crea/asegura un usuario admin |

## Funcionalidad

- **Panel admin** (sesión requerida): equipos, jugadores y partidos organizados por categoría
  (Primera División / División de Ascenso / Segunda División), tabla de posiciones calculada en
  tiempo real, torneos de Copa con bracket de eliminación directa, tarjetas/sanciones, canchas,
  temporadas, historial, configuración del sitio (nombre, logo, slogan) y gestión de usuarios
  admin.
- **Sitio público**: calendario de próximos partidos, tabla de posiciones completa por categoría y
  equipos participantes — sin necesidad de iniciar sesión.
- **Seguridad**: sesión por cookie JWT httpOnly validada en `proxy.ts` para `/admin/*` y para
  cualquier método distinto de `GET` en `/api/v1/*`; rate limiting por IP en login/forgot/reset
  password; contraseñas con requisitos mínimos (`lib/validation/password.ts`); el parámetro
  `next` del login se valida como ruta interna antes de usarse en la redirección (evita
  open-redirect).

Para el detalle de capas, el contrato de la API (envelope de respuesta, códigos de error) y las
decisiones de diseño, ver [docs/arquitectura.md](docs/arquitectura.md).
