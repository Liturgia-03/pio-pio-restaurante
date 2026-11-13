# ARQUITECTURA TÉCNICA Y ESPECIFICACIÓN DE IMPLEMENTACIÓN
## Sistema de Menú Digital y Panel Administrativo Mobile-First
### Caso de Negocio: Pío Pío - Asadero y Restaurante

---

## 1. Visión General del Sistema y Objetivos Técnicos

El sistema comprende una solución web completa orientada a la experiencia en dispositivos móviles (**Mobile-First**) dividida en dos módulos funcionales independientes y desacoplados:

1. **Carta Digital de Clientes (PWA / Web Mobile)**: Acceso ultrarrápido y sin autenticación mediante código QR escaneado en mesa. Carga optimizada (< 1.5s en redes móviles 4G), despliegue automático del **Modal Promocional Flotante ("Especial del Día / Plato Estrella")** en el primer render, y una navegación principal basada en **3 Tarjetas Interactivas Superiores**:
   - **Ver Menú Completo**: Despliega las 9 categorías gastronómicas apiladas verticalmente. Al ingresar a cualquiera de ellas, se muestran de manera exclusiva los platos de esa sección con botón directo de retorno a categorías.
   - **Promociones**: Muestra de forma destacada el plato estrella configurado junto con todos los platos en oferta o con descuento del asadero.
   - **Información**: Presentación oficial de Pío Pío, horarios de atención, dirección física, botones de contacto directo (WhatsApp y llamadas) y credenciales de la zona Wi-Fi con botón para copiar la clave al portapapeles.
   - **Modal de Detalle de Plato Centrado**: Ventana modal flotante perfectamente centrada vertical y horizontalmente en móviles (`DishDetailSheet`), con selector de porciones dinámicas.
   - **Carrito y Pedido por WhatsApp**: Selector de porciones y envío del pedido estructurado con número de mesa o dirección de domicilio.
2. **Panel Administrativo (Dashboard Mobile-First & Desktop)**: Plataforma de gestión integral diseñada primordialmente para ser manipulada con una sola mano desde un smartphone (viewport 360px a 430px) por el administrador o cocinero del asadero, manteniendo soporte responsivo adaptable para tablets y pantallas de escritorio. Dispone de navegación lateral (Drawer táctil en móviles / Sidebar colapsable en desktop), control total CRUD de categorías, platos, precios, alternancia instantánea de disponibilidad ("Agotado / Activo"), editor del modal de promociones con simulador en vivo, generador de códigos QR imprimibles por mesa y panel de ajustes de negocio.

### Requisitos No Funcionales Críticos
- **Mobile-First UX**: Tamaño de objetivos táctiles (touch targets) mínimo de 48×48 px. Espaciado ergonómico para pulgar (thumb zone).
- **Rendimiento**: Web Vitals optimizados (LCP < 2.0s, CLS < 0.05, FID/INP < 100ms).
- **Consistencia y Tiempo Real**: La alternancia de un plato agotado en el dashboard se refleja en las cartas digitales abiertas mediante sondeo eficiente o TanStack Query.
- **Autonomía para el Agente de Código**: Estructura modular, tipado estricto (TypeScript end-to-end), validación en tiempo de ejecución (Zod) y contratos de datos deterministas.

---

## 2. Stack Tecnológico Implementado

| Capa | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Framework Full-Stack** | **Next.js 16 (App Router + Turbopack)** | Renderizado híbrido rápido, rutas de API integradas y tiempos de carga instantáneos en móviles. |
| **Lenguaje** | **TypeScript 5.x** | Tipado estricto entre frontend, esquemas de validación y base de datos. |
| **Estilos & UI** | **Tailwind CSS + Lucide Icons + Sonner** | Clases utilitarias ultra-optimizadas para mobile, feedback visual inmediato mediante Toasts. |
| **Base de Datos** | **SQLite local (`prisma/dev.db`)** | Cero dependencias externas o daemons requeridos para ejecución local y desarrollo inmediato. |
| **ORM / Query Builder** | **Prisma ORM 6.x** | Migraciones seguras, autocompletado de tipos TypeScript y esquema declarativo. |
| **Gestión de Estado & Cache** | **TanStack Query (React Query v5)** | Cacheo inteligente en cliente, invalidación reactiva de queries y actualizaciones optimistas (Optimistic UI) para switches rápidos de platos. |
| **Almacenamiento de Multimedia** | **Local en `/public/uploads` con API REST** | Subida directa de fotos desde la cámara del smartphone o galería del personal de cocina. |
| **Autenticación** | **JWT en HttpOnly Cookies + Middleware** | Sesiones seguras para el administrador con protección de rutas `/admin/*`. |

---

## 3. Arquitectura del Sistema y Árbol de Directorios

Se establece una arquitectura modular en monorepo o single-repo estructurado:

```text
menu-asadero-app/
├── prisma/
│   ├── schema.prisma             # Definición del modelo de datos y migraciones
│   └── seed.ts                   # Datos iniciales para el asadero y carnes
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (public)/             # Rutas públicas (Carta Digital)
│   │   │   ├── layout.tsx        # Layout móvil público con viewport meta
│   │   │   └── page.tsx          # Menú principal + Modal promocional
│   │   ├── (admin)/              # Rutas privadas (Panel Administrativo)
│   │   │   ├── layout.tsx        # Shell con Drawer/Sidebar responsive
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # Login administrativo
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Métricas rápidas y accesos directos
│   │   │   ├── categories/
│   │   │   │   └── page.tsx      # CRUD de Categorías con ordenamiento drag/drop
│   │   │   ├── dishes/
│   │   │   │   ├── page.tsx      # Listado de platos, buscador, filtros, toggles
│   │   │   │   └── [id]/page.tsx # Editor/Creador de plato
│   │   │   └── promo-modal/
│   │   │       └── page.tsx      # Editor del Modal Promocional activo
│   │   └── api/                  # Endpoints RESTful
│   │       ├── auth/
│   │       ├── categories/
│   │       ├── dishes/
│   │       │   └── [id]/toggle-status/
│   │       ├── promo-modal/
│   │       └── upload/
│   ├── components/
│   │   ├── common/               # Componentes atómicos (Botones, Inputs, Badges)
│   │   ├── public/               # Componentes de la Carta Digital
│   │   │   ├── HeaderBanner.tsx
│   │   │   ├── CategoryChips.tsx
│   │   │   ├── DishCard.tsx
│   │   │   ├── DishDetailSheet.tsx
│   │   │   └── PromoModal.tsx    # Modal emergente de promoción inicial
│   │   └── admin/                # Componentes del Dashboard
│   │       ├── AdminNavSidebar.tsx
│   │       ├── AdminMobileDrawer.tsx
│   │       ├── AdminBottomBar.tsx
│   │       ├── DishForm.tsx
│   │       ├── QuickToggleCard.tsx
│   │       └── CategoryManager.tsx
│   ├── hooks/                    # Custom React hooks (useMenu, useTouchGestures)
│   ├── lib/
│   │   ├── prisma.ts             # Cliente Prisma singleton
│   │   ├── auth.ts               # Utilidades de tokens JWT / hashing
│   │   ├── storage.ts            # Adaptador Cloudinary / S3
│   │   └── validations.ts        # Esquemas Zod compartidos
│   └── types/                    # Definiciones TypeScript de entidades
├── public/                       # Assets estáticos, manifiesto PWA e iconos
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Diseño del Modelo de Datos (PostgreSQL & Prisma)

A continuación se detalla el esquema declarativo en Prisma (`prisma/schema.prisma`), cubriendo el negocio de asadero y cortes de carne con precisión:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  STAFF
}

enum ItemBadge {
  NONE
  POPULAR       // "El Más Vendido"
  CHEFS_SPECIAL // "Recomendación del Parrillero"
  NEW           // "Nuevo"
  PROMO         // "En Descuento"
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          Role     @default(ADMIN)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("users")
}

model Category {
  id          String   @id @default(uuid())
  name        String   // Ej: "Pollos Asados y Broaster", "Cortes a la Parrilla", "Acompañamientos", "Bebidas"
  slug        String   @unique
  description String?
  iconName    String?  // Nombre de icono Lucide (ej: "Flame", "UtensilsCrossed", "Beer")
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  dishes      Dish[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([sortOrder])
  @@index([isActive])
  @@map("categories")
}

model Dish {
  id            String     @id @default(uuid())
  categoryId    String
  category      Category   @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name          String     // Ej: "Medio Pollo Asado con Arepa y Papa", "Punta de Anca 350g"
  slug          String     @unique
  description   String     // Ingredientes, técnica de cocción a la leña, términos
  basePrice     Decimal    @db.Decimal(10, 2)
  discountPrice Decimal?   @db.Decimal(10, 2)
  imageUrl      String
  imagePublicId String?    // Para borrado o reemplazo en Cloudinary
  isAvailable   Boolean    @default(true) // Switch para marcar agotado en tiempo real
  isFeatured    Boolean    @default(false)
  badge         ItemBadge  @default(NONE)
  preparationTime Int?     // Estimado en minutos (ej: 25)
  servings      String?    // Ej: "Para 1 persona", "Para 2 a 3 personas"
  sortOrder     Int        @default(0)
  portions      DishPortion[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([categoryId])
  @@index([isAvailable])
  @@index([sortOrder])
  @@map("dishes")
}

model DishPortion {
  id         String   @id @default(uuid())
  dishId     String
  dish       Dish     @relation(fields: [dishId], references: [id], onDelete: Cascade)
  label      String   // Ej: "1/4 de Pollo", "1/2 Pollo", "Pollo Entero" ó "300g", "500g"
  price      Decimal  @db.Decimal(10, 2)
  isDefault  Boolean  @default(false)

  @@map("dish_portions")
}

model PromotionalModal {
  id              String   @id @default(uuid())
  title           String   // Ej: "¡Especial del Día en Brasa y Carbón!"
  subtitle        String?  // Ej: "Costillas BBQ Campesinas + Cerveza Artesanal"
  description     String   // Descripción seductora para incentivar el consumo
  imageUrl        String
  imagePublicId   String?
  badgeText       String?  // Ej: "20% OFF HOY"
  regularPrice    Decimal? @db.Decimal(10, 2)
  promoPrice      Decimal? @db.Decimal(10, 2)
  ctaText         String   @default("Ver en el Menú")
  targetDishId    String?  // ID del plato para navegar al hacer clic
  isActive        Boolean  @default(true) // Control global para mostrar/ocultar el modal
  autoShowDelayMs Int      @default(800)  // Milisegundos de espera antes de desplegar
  showOncePerSession Boolean @default(true) // Evita molestar si el cliente navega internamente
  updatedAt       DateTime @updatedAt

  @@map("promotional_modals")
}
```

---

## 5. Especificación de la API RESTful

Todos los endpoints que consumen o envían JSON respetan la estructura uniforme:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operación realizada con éxito",
  "error": null
}
```

### 5.1. Endpoints Públicos (Carta Digital)

#### `GET /api/public/menu`
- **Descripción**: Obtiene la carta completa activa estructurada por categorías y ordenada para la visualización del comensal.
- **Cache**: `stale-while-revalidate=60, s-maxage=300`.
- **Respuesta 200 OK**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat-uuid-1",
        "name": "Especialidades al Carbón",
        "iconName": "Flame",
        "dishes": [
          {
            "id": "dish-uuid-101",
            "name": "Punta de Anca Tierna (350g)",
            "description": "Corte madurado asado a la brasa con sal marina, acompañado de papa criolla y ensalada de la casa.",
            "basePrice": 38000.00,
            "discountPrice": null,
            "imageUrl": "https://res.cloudinary.com/.../punta-de-anca.webp",
            "isAvailable": true,
            "badge": "CHEFS_SPECIAL",
            "servings": "Para 1 persona",
            "portions": [
              { "id": "p-1", "label": "350 gramos", "price": 38000.00, "isDefault": true },
              { "id": "p-2", "label": "500 gramos", "price": 49000.00, "isDefault": false }
            ]
          }
        ]
      }
    ]
  }
}
```

#### `GET /api/public/promo-modal`
- **Descripción**: Retorna la configuración y contenido del modal promocional activo.
- **Respuesta 200 OK**:
```json
{
  "success": true,
  "data": {
    "isActive": true,
    "title": "Combo Parrillero Familiar",
    "subtitle": "1 Pollo Asado + 400g Costillas + Arepas y Papa Salada",
    "description": "Disfruta el sabor único de nuestra parrilla a leña para compartir con toda la mesa.",
    "imageUrl": "https://res.cloudinary.com/.../combo-familiar.webp",
    "badgeText": "OFERTA DEL DÍA",
    "regularPrice": 75000.00,
    "promoPrice": 62000.00,
    "ctaText": "Ver Detalle",
    "targetDishId": "dish-uuid-202",
    "autoShowDelayMs": 800,
    "showOncePerSession": true
  }
}
```

---

### 5.2. Endpoints Administrativos (Requieren Cabecera `Authorization: Bearer <JWT>`)

#### `POST /api/admin/auth/login`
- **Body**: `{ "email": "admin@asadero.com", "password": "securePassword123" }`
- **Respuesta 200 OK**: Genera cookie HttpOnly y entrega datos del usuario.

#### `PATCH /api/admin/dishes/:id/toggle-status`
- **Propósito**: Endpoint crítico para el administrador desde su smartphone. Cambia al instante la disponibilidad de un plato cuando se agota en cocina.
- **Body**: `{ "isAvailable": false }`
- **Respuesta 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "dish-uuid-101",
    "name": "Punta de Anca Tierna (350g)",
    "isAvailable": false,
    "updatedAt": "2026-11-09T19:08:00Z"
  },
  "message": "Disponibilidad actualizada exitosamente"
}
```

#### `POST /api/admin/dishes` & `PUT /api/admin/dishes/:id`
- **Body** (Validado con Zod):
```json
{
  "categoryId": "cat-uuid-1",
  "name": "Pollo Broaster Crujiente Especial",
  "description": "8 presas marinadas en hierbas tradicionales y fritas a presión.",
  "basePrice": 36000.00,
  "discountPrice": 32000.00,
  "imageUrl": "https://res.cloudinary.com/.../broaster.webp",
  "badge": "POPULAR",
  "isAvailable": true,
  "servings": "4 personas",
  "portions": [
    { "label": "Medio Pollo (4 presas)", "price": 19000.00, "isDefault": false },
    { "label": "Pollo Entero (8 presas)", "price": 32000.00, "isDefault": true }
  ]
}
```

#### `DELETE /api/admin/dishes/:id`
- **Respuesta 200 OK**: Elimina o archiva el plato.

#### `GET /api/admin/categories` & `POST /api/admin/categories` & `PUT /api/admin/categories/reorder`
- **Propósito de reorder**: Permitir mover categorías arriba/abajo con botones táctiles o drag & drop en el smartphone.
- **Body de reorder**: `{ "orderedIds": ["cat-uuid-2", "cat-uuid-1", "cat-uuid-3"] }`

#### `GET /api/admin/promo-modal` & `PUT /api/admin/promo-modal`
- **Propósito**: Modificar el texto, precios, imagen y activar/desactivar el modal promocional con un solo interruptor táctil.

---

## 6. Arquitectura UX/UI y Diseño Mobile-First

### 6.1. Carta Digital (Vista del Comensal)

```text
+------------------------------------------+
|  [Logo Asadero & Parrilla]    [🔍 Buscar]|  <- Sticky Header Compacto
|------------------------------------------|
|  [🔥 Brasas] [🍗 Pollos] [🥩 Carnes] [🍺]  |  <- Carrusel Chips Horizontales (Sticky)
|------------------------------------------|
|                                          |
|  +------------------------------------+  |
|  |  +------------------------------+  |  |
|  |  |    MODAL PROMO FLOTANTE      |  |  |  <- Se eleva con Backdrop difuminado
|  |  |    "¡Plato del Día!"         |  |  |     Delay: 800ms
|  |  |    [Foto Asado en Brasa]     |  |  |     Cierre fácil táctil [X] o tap fuera
|  |  |    Costillas BBQ 2x1         |  |  |
|  |  |    $45.000 (Antes $60.000)   |  |  |
|  |  |    [  VER EN LA CARTA  ]     |  |  |
|  |  +------------------------------+  |  |
|  +------------------------------------+  |
|                                          |
|  CATEGORÍA: CORTES A LA PARRILLA         |
|  +------------------------------------+  |
|  | [Imagen]  Punta de Anca (350g)     |  |  <- Ficha de plato táctil
|  |           Madurada a la leña       |  |     Badge "Recomendado"
|  |           $38.000                  |  |     Estado: Disponible
|  +------------------------------------+  |
|  +------------------------------------+  |
|  | [Imagen]  Churrasco Tradicional    |  |
|  |           $35.000  [AGOTADO]       |  |  <- Opacidad reducida si no disponible
|  +------------------------------------+  |
+------------------------------------------+
```

#### Comportamiento del Modal Promocional Flotante
1. **Lógica de Aparición**:
   - Se monta en el cliente al cargar la página.
   - Tras `autoShowDelayMs` (por defecto 800ms para permitir que el cliente aprecie que está en el menú del restaurante), se despliega con animación suave `fade-in` + `scale-up`.
   - Se guarda una bandera en `sessionStorage` (`hasSeenPromoModal = 'true'`) para que, si el usuario navega entre categorías o refresca durante la misma visita, no vuelva a interrumpir agresivamente.
2. **Interacciones**:
   - Botón de cierre `[X]` en la esquina superior derecha con área táctil ampliada (mínimo 44×44px).
   - Botón CTA principal que hace scroll suave automático directamente a la sección/tarjeta del plato promocionado y lo resalta brevemente con un pulso de luz.

---

### 6.2. Panel Administrativo (Mobile-First Dashboard)

El diseño del panel administrativo se concibe con una estructura adaptable dual:

#### En Pantallas Móviles (< 768px - Smartphones):
- **Barra Superior Fija**:
  - Botón de Menú Hamburguesa (lado izquierdo) que despliega un **Touch Drawer lateral deslizable** desde la izquierda.
  - Título de la vista actual (ej: "Gestión de Platos").
  - Interruptor de Emergencia o Estado del Restaurante (ej: "Menú Online").
- **Drawer Lateral Deslizable (Off-canvas)**:
  - Header con foto/nombre del administrador y rol.
  - Enlaces de navegación con iconos grandes:
    - 📊 Resumen / Dashboard
    - 🍗 Platos & Precios
    - 📂 Categorías
    - ⭐ Modal Promocional
    - ⚙️ Ajustes / Cerrar Sesión
  - Deslizamiento con gesto táctil (`swipe to close`) mediante `framer-motion` o `@radix-ui/react-dialog`.
- **Barra de Acciones Rápidas Inferior (Sticky Bottom Navigation)**:
  - 4 accesos directos principales al alcance del pulgar: `[Home]` | `[Platos]` | `[Categorías]` | `[Promo]`.
  - Botón flotante FAB `(+)` para "Agregar Plato Rápido".

#### En Pantallas de Escritorio / Tablets (≥ 768px):
- **Sidebar Permanente**: Barra lateral fija a la izquierda de 260px con modo colapsable a 80px (icon-only).
- **Área de Contenido Principal**: Grilla de datos con tablas densas, previsualización de imágenes y formularios en dos columnas.

#### Componente Táctil: "Quick Toggle" para Disponibilidad
Para el administrador que camina por el restaurante revisando la cocina:
- Cada tarjeta de plato en la vista de administración móvil presenta un interruptor estilo iOS Switch grande (50px de ancho).
- Un toque cambia de verde ("Disponible") a rojo/gris ("Agotado").
- Emite una petición `PATCH` inmediata con actualización optimista: la interfaz cambia de inmediato sin esperar la confirmación de red, revirtiendo únicamente si ocurre un error con una notificación Toast amigable.

---

## 7. Esquemas de Validación con Zod (`src/lib/validations.ts`)

```typescript
import { z } from "zod";

export const dishSchema = z.object({
  categoryId: z.string().uuid("Categoría inválida"),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  description: z.string().min(5, "La descripción es requerida").max(500),
  basePrice: z.coerce.number().positive("El precio base debe ser mayor a 0"),
  discountPrice: z.coerce.number().positive().nullable().optional(),
  imageUrl: z.string().url("Debe ser una URL de imagen válida"),
  imagePublicId: z.string().optional(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  badge: z.enum(["NONE", "POPULAR", "CHEFS_SPECIAL", "NEW", "PROMO"]).default("NONE"),
  servings: z.string().max(50).optional().nullable(),
  portions: z.array(z.object({
    label: z.string().min(1, "Etiqueta requerida (ej: 1/2 Pollo)"),
    price: z.coerce.number().positive("Precio debe ser positivo"),
    isDefault: z.boolean().default(false)
  })).optional().default([])
});

export const categorySchema = z.object({
  name: z.string().min(2, "Nombre requerido").max(60),
  description: z.string().max(200).optional().nullable(),
  iconName: z.string().default("Utensils"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true)
});

export const promoModalSchema = z.object({
  title: z.string().min(3, "Título requerido").max(80),
  subtitle: z.string().max(120).optional().nullable(),
  description: z.string().min(5, "Descripción requerida").max(300),
  imageUrl: z.string().url("URL de imagen válida"),
  badgeText: z.string().max(30).optional().nullable(),
  regularPrice: z.coerce.number().positive().optional().nullable(),
  promoPrice: z.coerce.number().positive().optional().nullable(),
  ctaText: z.string().default("Ver en el Menú"),
  targetDishId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
  autoShowDelayMs: z.coerce.number().int().min(0).max(5000).default(800),
  showOncePerSession: z.boolean().default(true)
});
```

---

## 8. Datos Iniciales de Prueba (`prisma/seed.ts`)

Datos diseñados con la identidad gastronómica de un asadero y restaurante de carnes típico:

```typescript
import { PrismaClient, ItemBadge } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "users", "categories", "dishes", "dish_portions", "promotional_modals" CASCADE;`);

  // 1. Usuario Administrador Inicial
  const passwordHash = await bcrypt.hash("Parrilla2026*", 10);
  await prisma.user.create({
    data: {
      email: "admin@asaderolabrasa.com",
      name: "Administrador Parrilla",
      passwordHash,
      role: "ADMIN"
    }
  });

  // 2. Categorías
  const catPollos = await prisma.category.create({
    data: {
      name: "Pollos Asados y Broaster",
      slug: "pollos-asados-y-broaster",
      description: "Asados a la leña lentamente o apanados crujientes con receta secreta",
      iconName: "Flame",
      sortOrder: 1,
      isActive: true
    }
  });

  const catCarnes = await prisma.category.create({
    data: {
      name: "Cortes a la Brasa y Parrilla",
      slug: "cortes-brasa-parrilla",
      description: "Cortes premium madurados, preparados al carbón al término de su elección",
      iconName: "UtensilsCrossed",
      sortOrder: 2,
      isActive: true
    }
  });

  const catAcompanamientos = await prisma.category.create({
    data: {
      name: "Acompañamientos Tradicionales",
      slug: "acompanamientos",
      description: "Para complementar el sabor de nuestras carnes",
      iconName: "Salad",
      sortOrder: 3,
      isActive: true
    }
  });

  const catBebidas = await prisma.category.create({
    data: {
      name: "Bebidas y Cervezas",
      slug: "bebidas",
      description: "Refrescos fríos, limonadas naturales y cervezas bien heladas",
      iconName: "Beer",
      sortOrder: 4,
      isActive: true
    }
  });

  // 3. Platos
  const platoPolloAsado = await prisma.dish.create({
    data: {
      categoryId: catPollos.id,
      name: "Pollo Asado Tradicional a la Leña",
      slug: "pollo-asado-tradicional",
      description: "Pollo entero marinado con adobo criollo y asado en vara a fuego de leña. Acompañado de papas saladas, arepas de choclo y ají casero.",
      basePrice: 38000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=600&auto=format&fit=crop",
      isAvailable: true,
      badge: ItemBadge.POPULAR,
      servings: "4 personas",
      portions: {
        create: [
          { label: "1/4 Pollo", price: 12000, isDefault: false },
          { label: "1/2 Pollo", price: 21000, isDefault: false },
          { label: "Pollo Completo", price: 38000, isDefault: true }
        ]
      }
    }
  });

  await prisma.dish.create({
    data: {
      categoryId: catCarnes.id,
      name: "Punta de Anca de Res (400g)",
      slug: "punta-de-anca-400g",
      description: "Corte jugoso con capa de grasa crujiente a la parrilla de carbón, chimichurri artesanal, yuca al vapor y ensalada fresca.",
      basePrice: 44000,
      imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=600&auto=format&fit=crop",
      isAvailable: true,
      badge: ItemBadge.CHEFS_SPECIAL,
      servings: "1 persona"
    }
  });

  await prisma.dish.create({
    data: {
      categoryId: catCarnes.id,
      name: "Costillas de Cerdo Ahumadas en BBQ",
      slug: "costillas-bbq-ahumadas",
      description: "Costillar tierno glaseado en salsa BBQ de panela y naranja, ahumado por 4 horas. Con papas a la francesa.",
      basePrice: 42000,
      discountPrice: 37000,
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop",
      isAvailable: true,
      badge: ItemBadge.PROMO,
      servings: "1 a 2 personas"
    }
  });

  // 4. Modal Promocional
  await prisma.promotionalModal.create({
    data: {
      title: "🔥 ¡ESPECIAL PARRILLERO DE HOY!",
      subtitle: "Costillas BBQ Ahumadas + Bebida",
      description: "Aprovecha hoy nuestras costillas tiernas ahumadas a la leña con descuento especial de la casa.",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop",
      badgeText: "AHORRA $5.000",
      regularPrice: 42000,
      promoPrice: 37000,
      ctaText: "Pedir al Mesero",
      targetDishId: platoPolloAsado.id,
      isActive: true,
      autoShowDelayMs: 800,
      showOncePerSession: true
    }
  });

  console.log("Seed completado exitosamente para el asadero.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

---

## 9. Guía de Ejecución Paso a Paso para el Agente de Código

Cuando transfieras este proyecto a tu agente de código (Cursor, Claude Code, Windsurf o similar), infórmale que ejecute la construcción en los siguientes sprints controlados:

### Sprint 1: Inicialización del Proyecto y Entorno
1. Inicializar Next.js 14+ con TypeScript, Tailwind CSS y ESLint:
   ```bash
   npx create-next-app@latest menu-asadero-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```
2. Instalar dependencias de UI y base de datos:
   ```bash
   npm install @prisma/client prisma @tanstack/react-query lucide-react clsx tailwind-merge zod bcrypt jsonwebtoken cookies-next sonner
   npm install -D @types/bcrypt @types/jsonwebtoken
   ```
3. Configurar variables de entorno en `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/asadero_db?schema=public"
   JWT_SECRET="super-secret-key-change-in-production"
   CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```
4. Crear `prisma/schema.prisma` con el esquema provisto en la Sección 4 y ejecutar:
   ```bash
   npx prisma db push
   npx ts-node prisma/seed.ts
   ```

### Sprint 2: Core del Backend y API RESTful
1. Implementar la conexión de base de datos singleton en `src/lib/prisma.ts`.
2. Crear los esquemas de validación en `src/lib/validations.ts`.
3. Desarrollar la autenticación de administrador basada en cookies HttpOnly y middleware de rutas protegidas para `/admin/*`.
4. Desarrollar los Route Handlers para:
   - `src/app/api/public/menu/route.ts` (Lectura de categorías y platos activos).
   - `src/app/api/public/promo-modal/route.ts` (Lectura del modal activo).
   - `src/app/api/admin/dishes/[id]/toggle-status/route.ts` (Cambio instantáneo de disponibilidad).
   - `src/app/api/admin/dishes/route.ts` y subrutas (CRUD de platos).
   - `src/app/api/admin/promo-modal/route.ts` (Lectura y edición de la promo flotante).

### Sprint 3: Carta Digital Pública (Comensal) Mobile-First
1. **Configuración de Viewport**: Garantizar `viewport-fit=cover` en `src/app/(public)/layout.tsx` para eliminar bordes blancos en iPhone (Safe Area Notch) y Android.
2. **Componente `PromoModal.tsx`**:
   - Lectura de `sessionStorage`.
   - Timer con `setTimeout` de 800ms para despliegue automático.
   - Animación fluida con Backdrop blur (`backdrop-blur-sm bg-black/60`).
3. **Barra de Navegación por Chips**:
   - Chips deslizables con scroll horizontal táctil y `scroll-snap`.
   - `IntersectionObserver` para iluminar el chip de la categoría que el usuario tiene actualmente en pantalla.
4. **Tarjetas de Platos**:
   - Tarjetas compactas con imagen optimizada a la izquierda o derecha en móvil.
   - Indicador visual claro cuando el plato está marcado como `Agotado` (desaturación de imagen y badge "Agotado por hoy").
   - Detalle extendido mediante Bottom Sheet táctil al presionar sobre la tarjeta.

### Sprint 4: Panel Administrativo Mobile-First (Dashboard)
1. **Layout Adaptable**:
   - Implementar `AdminMobileDrawer.tsx` activado por botón hamburguesa con área de toque generosa.
   - Implementar `AdminBottomBar.tsx` fija al inferior de la pantalla para navegación con el pulgar.
   - Implementar `AdminNavSidebar.tsx` visible a partir del breakpoint `md:` (tablets y PCs).
2. **Módulo de Gestión Rápida de Platos**:
   - Listado en tarjetas móviles con búsqueda por texto instantánea.
   - Filtro rápido por categoría.
   - Switch directo de "Disponible / Agotado" con TanStack Query y actualización optimista.
3. **Módulo de Edición del Modal Promocional**:
   - Vista móvil con previsualización en vivo (Live Mockup de celular) de cómo se verá el modal para los clientes al guardar cambios.
   - Switch global para activar o desactivar la promoción del día sin borrar su contenido.

---

## 10. Consideraciones de Seguridad, Despliegue y Escalabilidad

1. **Seguridad en Endpoints Administrativos**:
   - Validación rigurosa de tokens JWT en el middleware de Next.js.
   - Sanitización de strings en entradas de texto para prevenir XSS.
   - Rate limiting en la ruta de login (`5 intentos por minuto por IP`) usando memoria o Redis.
2. **Optimización de Carga QR**:
   - Dado que los clientes acceden escaneando un código QR impreso en mesas con señal de datos móviles variable:
     - Las imágenes deben servirse a través de CDN en formato WebP con un ancho máximo de 600px y compresión visual al 80%.
     - La respuesta de `/api/public/menu` debe pesar menos de 25KB comprimida en gzip/brotli.
3. **Estrategia PWA (Progressive Web App)**:
   - Añadir `manifest.json` y service worker básico para cachear los assets estáticos del menú (fuentes, logos, estilos). Si la señal del cliente oscila en el restaurante, la carta continuará funcionando sin errores.
