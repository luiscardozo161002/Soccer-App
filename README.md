# Liga de Fútbol — Plataforma de gestión

Aplicación web para administrar una liga de fútbol amateur: equipos, jugadores, calendario de
partidos, tabla de posiciones por categoría, tarjetas y sanciones, canchas, temporadas, y un sitio
público de solo lectura con la información de la liga.

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
    teams/ players/ matches/ fields/ sanctions/ history/ settings/
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

   Copia la cadena de conexión que imprime a `DATABASE_URL` en tu `.env`. No hace falta aplicar el
   schema a mano — `pnpm dev` lo hace por ti (ver el script `predev` más abajo).

3. **Datos iniciales**: no hay semillas genéricas de ejemplo. Este proyecto trae un seed real con
   los datos del torneo actual, más un script aparte para el usuario admin:

   ```bash
   pnpm db:seed-clausura-caliope
   pnpm db:bootstrap-admin
   ```

   El primero carga la temporada activa, los 48 equipos, las 20 canchas y los ajustes de tabla de
   posiciones del Torneo de Clausura "Caliope" 2026 (`prisma/seeds/seed-clausura-caliope.ts`) — es
   idempotente, se puede volver a correr sin duplicar nada, y sirve como referencia si necesitas
   migrar datos reales de otra fuente. **No cubre jugadores, partidos, tarjetas ni sanciones** — esos
   se cargan a mano desde el panel una vez que hay equipos, y no se recuperan solos si se borra la
   base de datos.

   El segundo (`prisma/bootstrap-admin.ts`) crea el usuario admin con contraseña fija en el propio
   archivo. A diferencia del seed anterior, **no es idempotente**: no verifica si el usuario ya
   existe, así que solo debe correrse una vez por base de datos — volver a correrlo lanza un error
   de restricción única (`P2002`).

4. **Levantar el servidor**:

   ```bash
   pnpm dev
   ```

   Sitio público en [http://localhost:3000](http://localhost:3000), panel admin en
   `http://localhost:3000/admin` (redirige a `/login` si no hay sesión).

**Nota sobre migraciones**: `pnpm dev` corre `prisma migrate deploy` automáticamente antes de
arrancar (script `predev` en `package.json`) — aplica cualquier migración pendiente contra
`DATABASE_URL`, pero **nunca crea una migración nueva** (eso solo pasa con
`pnpm exec prisma migrate dev`, al cambiar `schema.prisma`). Si en algún momento tu base local
queda sin tablas (por ejemplo, si reseteas el contenedor de Postgres), basta con volver a correr
`pnpm dev` — no hace falta ningún paso manual extra. Eso sí, `predev` solo recrea las **tablas**,
no los datos: para recuperar el torneo/equipos/canchas y el usuario admin hay que volver a correr
los dos comandos del paso 3, y cualquier jugador, partido, tarjeta/sanción o personalización del
sitio (nombre, logo, colores) que se haya cargado desde el panel **no está en ningún seed** y se
pierde para siempre con la base de datos — conviene respaldarla (`pg_dump`) antes de borrarla si ya
hay datos reales de ese tipo.

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Aplica migraciones pendientes (`predev`) y levanta el servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm lint` | ESLint |
| `pnpm db:bootstrap-admin` | Crea el usuario admin con contraseña fija — no idempotente, solo correr una vez por base |
| `pnpm db:seed-clausura-caliope` | Ejemplo de seed idempotente real (equipos/canchas/temporada de un torneo específico) |

## Funcionalidad

- **Panel admin** (sesión requerida): equipos, jugadores y partidos organizados por categoría
  (Primera División / División de Ascenso / Segunda División), tabla de posiciones calculada en
  tiempo real, tarjetas/sanciones, canchas, temporadas, historial, configuración del sitio (nombre,
  logo, slogan) y gestión de usuarios admin.
- **Sitio público**: calendario de próximos partidos, tabla de posiciones completa por categoría y
  equipos participantes — sin necesidad de iniciar sesión.
- **Seguridad**: sesión por cookie JWT httpOnly validada en `proxy.ts` para `/admin/*` y para
  cualquier método distinto de `GET` en `/api/v1/*`; rate limiting por IP en login/forgot/reset
  password; contraseñas con requisitos mínimos (`lib/validation/password.ts`); el parámetro
  `next` del login se valida como ruta interna antes de usarse en la redirección (evita
  open-redirect).

Para el detalle de capas, el contrato de la API (envelope de respuesta, códigos de error) y las
decisiones de diseño, ver [docs/arquitectura.md](docs/arquitectura.md).
