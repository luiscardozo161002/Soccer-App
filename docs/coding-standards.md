# Estandares de codigo

Este proyecto se organiza como un monolito modular por dominio.

## Estilo de programacion

- TypeScript estricto.
- React funcional y declarativo.
- Funciones puras para transformaciones y reglas que no requieren I/O.
- Services funcionales para casos de uso; no se usan clases como contenedores de funciones.
- Zod es la fuente de verdad para DTOs y validacion de entrada.

## Direccion de dependencias

```text
UI -> hooks/client -> route -> service -> repository -> Prisma
```

Una capa no puede saltarse la siguiente ni importar hacia arriba. Prisma solo puede importarse
desde repositories y desde la infraestructura de base de datos.

## Convenciones de nombres

- Componentes React: `PascalCase.tsx`.
- Hooks: `useResource.ts`.
- Modulos de servidor: `resource.service.ts` y `resource.repository.ts`.
- Esquemas: `resource.schema.ts`.
- Directorios: minusculas y nombres de dominio en plural.
- Exports nombrados. Los exports por defecto se reservan para archivos requeridos por Next.js.

## Organizacion por dominio

Cada feature nueva debe vivir en `modules/<dominio>` y puede contener:

```text
modules/<dominio>/
  client/       # cliente HTTP y query keys
  components/   # UI propia del dominio
  hooks/        # TanStack Query y estado de UI del dominio
  server/       # services y repositories
  *.schema.ts   # contratos Zod compartidos
  *.types.ts    # tipos que no se derivan de Zod o Prisma
```

`app/` se limita a composicion, layouts, paginas y adaptadores HTTP. `components/ui/` contiene
primitivas reutilizables sin reglas de negocio. Todo dominio de negocio vive en `modules/`; `lib/`
se reserva para infraestructura transversal que no pertenece a un dominio.

## Reglas practicas

- No usar `any`, `@ts-ignore` ni desactivar reglas de hooks para resolver diseno de estado.
- No sincronizar estado derivable dentro de efectos. Para fuentes externas se usa
  `useSyncExternalStore`; para formularios editables, valores iniciales o componentes con `key`.
- No duplicar tipos que puedan inferirse con `z.infer` o tipos de Prisma.
- No construir URLs de API fuera de su cliente de dominio.
- Las query keys se crean mediante factories, nunca con arrays escritos en cada mutation.
- Los errores de negocio usan `ApiError` y codigos estables.
- Las variables de entorno se documentan en `.env.example` y nunca se exponen al cliente salvo
  que tengan el prefijo `NEXT_PUBLIC_`.
- Una transaccion se inicia mediante infraestructura de base de datos; el service no construye
  queries Prisma directamente.
- Los componentes se separan cuando combinan varias responsabilidades, no por un limite
  arbitrario de lineas.

## Definicion de terminado

Antes de integrar una feature deben pasar:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

La feature debe incluir validacion de entrada, control de acceso, estados de carga/error/vacio y
pruebas de las reglas de negocio que incorpora. Toda query nueva debe revisar si necesita un
indice y toda ruta debe conservar `x-request-id` y logging estructurado mediante el middleware.
