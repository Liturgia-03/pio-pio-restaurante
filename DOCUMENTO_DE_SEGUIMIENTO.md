# 📋 DOCUMENTO DE SEGUIMIENTO Y BITÁCORA MASTER DEL PROYECTO
## Pío Pío - Asadero y Restaurante | Carta Digital & Panel Administrativo Mobile-First
> **Propósito del Documento:** Registro maestro vivo y cronológico del desarrollo del proyecto. Este archivo debe ser consultado y actualizado en cada nueva sesión para garantizar un contexto completo, exacto y sin pérdida de información de la arquitectura, decisiones de diseño, cambios solicitados y estado del código.

---

## 📌 1. Ficha Técnica General

| Parámetro | Detalle |
| :--- | :--- |
| **Cliente / Negocio** | **Pío Pío - Asadero y Restaurante** |
| **Giro Comercial** | Asadero de pollos (asado a la leña y apanado broaster), asados a la brasa, bandejas típicas colombianas y desayunos. |
| **Framework Full-Stack** | **Next.js 16.4.6** (App Router con motor **Turbopack**) |
| **Librería UI** | **React 19** + **Tailwind CSS** |
| **Lenguaje** | **TypeScript 5.x** (Tipado estricto end-to-end) |
| **Base de Datos** | **PostgreSQL en la Nube (Neon Serverless)** gestionado mediante **Prisma ORM 6.19.3** |
| **Gestión de Estado** | **TanStack Query (React Query v5)** con invalidación reactiva y actualizaciones optimistas |
| **Iconografía** | **Lucide Icons** |
| **Notificaciones** | **Sonner** (Toasts táctiles de alta visibilidad) |
| **PWA & Offline** | Web App Manifest (`/manifest.json`), Service Worker (`/sw.js`) e iconos oficiales |
| **Rutas Compiladas** | **24 rutas** (estáticas y dinámicas) con 0 errores en `npm run build` |

### Credenciales de Acceso Administrativo
- **URL de Producción (En Vivo):** `https://pio-pio-restaurante.vercel.app/admin/login`
- **URL Local:** `http://localhost:3000/admin/login`
- **Correo:** `admin@asaderopiopio.com`
- **Contraseña:** `PioPio2026*`

### Entornos de Ejecución
- **Dominio Público Oficial (Vercel):** `https://pio-pio-restaurante.vercel.app`
- **Carta Digital con Parámetro de Mesa (Ejemplo Mesa 1):** `https://pio-pio-restaurante.vercel.app/?mesa=01`
- **Servidor Local de Desarrollo:** `http://localhost:3000`

---

## 🏛️ 2. Arquitectura de Módulos del Sistema

El sistema está desacoplado en dos grandes frentes de experiencia de usuario:

### 2.1. Carta Digital de Clientes (`/` y subcomponentes en `src/components/public/`)
Diseñada con enfoque **Mobile-First estricto** (targets táctiles ≥ 44×44px, navegación operable con una sola mano):
1. **Modal Promocional Inicial (`PromoModal.tsx`):** Se despliega automáticamente al entrar a la carta (demora configurable, ej. 800ms) para destacar el **Plato Estrella del Día** o descuento vigente, con botón directo para llevar al usuario al plato dentro del menú.
2. **Encabezado con Buscador Inteligente (`PublicHeader.tsx`):** Muestra el logo oficial de Pío Pío con borde dorado, nombre del restaurante y botón de lupa para búsqueda instantánea en tiempo real por nombre de plato o descripción.
3. **Navegación Superior en 3 Tarjetas Interactivas:**
   - **"Ver Menú Completo":** Muestra las 9 categorías apiladas verticalmente una debajo de la otra mediante tarjetas visuales (`CategoryCard.tsx`). Al pulsar sobre una categoría, la vista se filtra exclusivamente para mostrar los platos de esa sección, con barra de navegación por chips (`CategoryChips.tsx`) y botones claros para retornar al listado de categorías (`← Volver a Categorías`).
   - **"Promociones":** Pestaña dedicada que destaca el plato estrella con banner grande, precio regular tachado y precio promocional, además de listar todos los productos con distintivos de oferta (`PROMO`, `POPULAR`, `CHEFS_SPECIAL` o precio con descuento).
   - **"Información":** Ficha institucional completa con presentación oficial de Pío Pío, horarios de atención, dirección física, botones directos de contacto (Pedir por WhatsApp y Llamada telefónica) y credenciales de la zona Wi-Fi para clientes con botón de copiado de clave en un toque.
4. **Ficha de Detalle de Producto Centrada (`DishDetailSheet.tsx`):**
   - Modal flotante **completamente centrado** en la pantalla del móvil (`items-center justify-center` con esquinas redondeadas uniformes `rounded-3xl` y elevación `shadow-2xl`).
   - Selector de tamaños o porciones (ej. Pollo Completo, Medio, Cuarto) con actualización de precio en tiempo real.
   - Botón directo para añadir al carrito con confirmación mediante Toast.
5. **Carrito de Compras y Pedido por WhatsApp (`CartContext.tsx` y `CartSheet.tsx`):**
   - Botón flotante inferior con indicador de cantidad de platos y total acumulado en pesos colombianos (COP).
   - Permite al comensal especificar si está en mesa (solicitando el número de mesa) o si es para domicilio/llevar (solicitando nombre y dirección).
   - Construye automáticamente un mensaje estructurado con emojis y formato profesional listo para enviar al WhatsApp del negocio.

### 2.2. Panel Administrativo Mobile-First (`/admin/*`)
Diseñado para que el administrador, cajero o personal de cocina gestione la carta desde cualquier smartphone:
1. **Dashboard General (`/admin/dashboard`):** Resumen de KPIs (platos activos, platos agotados, categorías, promociones) y lista de disponibilidad rápida con switches iOS para alternar disponibilidad en segundos.
2. **Gestión de Platos (`/admin/dishes`):** Buscador, filtro por categoría y switch instantáneo de disponibilidad con actualización optimista (sin recargar la pantalla).
3. **Creador y Editor de Platos (`/admin/dishes/new` y `/admin/dishes/[id]`):** Formulario intuitivo que incluye carga de imágenes desde el almacenamiento o cámara mediante el endpoint `/api/upload`, selector de insignias y gestor de porciones múltiples.
4. **Gestor de Categorías (`/admin/categories`):** Reordenamiento visual y control de nombres e iconos de cada categoría gastronómica.
5. **Editor del Modal Promocional (`/admin/promo-modal`):** Simulador de teléfono inteligente en vivo (Live Mockup) que muestra en tiempo real cómo se verá la promoción antes de guardarla.
6. **Generador e Imprimible de Códigos QR para Mesas (`/admin/qr`):**
   - Generación dinámica de QR con parámetro `?mesa=XX`.
   - Tarjeta oficial con logo de Pío Pío, insignia de mesa, instrucciones de escaneo y eslogan institucional.
   - Botón para descargar el QR en alta resolución (`QR-Mesa-XX-Pio-Pio.png`).
   - Botón para imprimir (`@media print`) configurado para aislar únicamente la tarjeta en hoja blanca limpia.
7. **Ajustes Generales del Restaurante (`/admin/settings`):**
   - Edición de nombre del establecimiento, número de WhatsApp para pedidos, horarios de atención, dirección y credenciales Wi-Fi (persistencia en `src/data/settings.json`).

---

## 📜 3. Datos Reales de la Carta de Pío Pío (Semilla `prisma/seed.ts`)

Los datos iniciales se extrajeron fielmente de la carta plastificada real del restaurante:

1. **Pollo Completo, Medios y Cuartos:**
   - *Pollo Asado:* Completo ($43.000) | Medio ($25.000) | Cuarto ($14.000)
   - *Pollo Apanado:* Completo ($45.000) | Medio ($25.000) | Cuarto ($15.000)
2. **Combos Asado (con papas y ensalada):**
   - Pechuga y Ala ($22.000) | Muslo y Contramuslo ($21.000) | 1/4 Asado ($12.000)
3. **Combos Apanado (con papas y ensalada):**
   - Pechuga y Ala ($21.000) | Muslo y Contramuslo ($21.000) | Con Pechuga ($18.000) | Con Muslo/Contramuslo ($17.000) | Con Ala ($15.000)
4. **Asados a la Brasa (con papas a la francesa, arepa con queso y ensalada):**
   - Mixto de Carnes ($45.000) | Punta de Anca ($33.000) | Churrasco ($33.000) | Lomo de Cerdo ($33.000) | Filete de Pechuga ($28.000) | Chuzo de Res ($25.000)
5. **Platos Típicos:**
   - Bandeja Paisa ($30.000) | Trucha Frita ($30.000) | Tilapia Frita ($30.000) | Sancocho de Res ($18.000)
   - *Cazuela de Fríjol y Mondongo:* Registrados con `isAvailable: false` (reemplaza las cintas adhesivas con "X" de la carta física).
6. **Bandejas del Día (con sopa, arroz, frijoles, huevo, ensalada y jugo):**
   - Bandeja 1/4 Asado ($25.000) | Bandeja Res ($20.000) | Bandeja Cerdo ($20.000) | Bandeja Chicharrón ($20.000) | Bandeja Apanado ($15.000)
7. **Sopa y Porciones:**
   - Consomé de Menudencias ($10.000) | Consomé de Pescado ($10.000) | Frijoles ($10.000) | Arroz Mixto ($9.000) | Porción Papas Francesa ($6.000) | Porción Ensalada ($8.000) | Porción Arroz ($3.000)
8. **Desayunos:**
   - Calentado con Chorizo ($17.000) | Calentado con Carne ($17.000) | Calentado con Huevos ($14.000) | Huevos con Salchicha ($11.500) | Arepa con Pajarilla ($8.500)
9. **Menú Infantil:**
   - Salchipapas ($12.000) | Nuggets de Pollo (configurado como agotado por cinta en la carta original).
10. **Bebidas y Jugos:**
    - Gaseosa Familiar ($15.000) | Milo ($8.000) | Jugos en Leche ($8.000) | Jugos en Agua ($7.000) | Gaseosa Personal ($4.000) | Jugo del Día ($1.500) | Limonadas (registradas agotadas).

---

## 🛠️ 4. Bitácora Cronológica de Cambios y Soluciones Técnicas

### Hito 1: Setup inicial y migración de base de datos
- **Incidencia:** No había servicio PostgreSQL local ni Docker en el puerto 5432.
- **Solución:** Se configuró SQLite con Prisma (`provider = "sqlite"`, `file:./dev.db`), permitiendo ejecución inmediata sin dependencias externas.

### Hito 2: Creación de la identidad visual Pío Pío
- Se integró el logotipo oficial extraído en [`public/logo-pio-pio.png`](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/public/logo-pio-pio.png).
- Se vincularon metadatos en `layout.tsx`, `manifest.json` y los componentes de navegación.

### Hito 3: Resolución de advertencias de consola e hidratación
- **Incidencia:** Advertencias en consola del navegador con `contentscript.js` (`ObjectMultiplex` / `MaxListenersExceededWarning`) y discrepancias de atributos HTML (`bis_skin_checked="1"`).
- **Causa Raíz:** Extensiones instaladas en el navegador del usuario (MetaMask inyecta flujos de Web3 y Bitwarden inyecta atributos en etiquetas `<div>` antes de la hidratación de React).
- **Solución:** Se implementó `dynamic(() => import(...), { ssr: false })` en [`src/app/page.tsx`](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/page.tsx) con `suppressHydrationWarning`, eliminando por completo cualquier advertencia de hidratación.

### Hito 4: Reestructuración de la Navegación (3 Tarjetas Superiores)
- **Solicitud del usuario:** Quitar el banner informativo previo y reemplazarlo por 3 tarjetas:
  1. *Ver Menú Completo*
  2. *Promociones*
  3. *Información*
- **Implementación:** Desarrollada en [`src/components/public/PublicMenuClient.tsx`](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/components/public/PublicMenuClient.tsx):
  - Categorías apiladas verticalmente con fotos atractivas y contador de platos.
  - Al abrir una categoría, vista aislada de sus platos con botones para volver a las categorías.
  - Pestaña de Promociones con plato del día y listado de descuentos.
  - Pestaña de Información con reseña, horarios, mapa/dirección, botones de contacto y credenciales Wi-Fi con botón para copiar contraseña.

### Hito 5: Actualización del Generador de Códigos QR (`/admin/qr`)
- **Solicitud del usuario:** Cambiar la tarjeta imprimible del QR que aún tenía "La Brasa" y el icono genérico de llama por los datos y logo actuales de Pío Pío.
- **Implementación:**
  - Actualizado en [`src/app/admin/qr/page.tsx`](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/admin/qr/page.tsx).
  - Incluye logo oficial de Pío Pío, subtítulo "Asadero y Restaurante", insignia de mesa con degradado y eslogan institucional.
  - Descarga nombrada como `QR-Mesa-[XX]-Pio-Pio.png`.
  - Estilos de impresión `@media print` para aislar exclusivamente la tarjeta física al enviar a imprimir.

### Hito 6: Eliminación del bloque Wi-Fi en la Tarjeta QR
- **Solicitud del usuario:** Eliminar la sección donde aparecía la información de Wi-Fi en la tarjeta del QR.
- **Implementación:** Se removió la píldora de Wi-Fi de [`src/app/admin/qr/page.tsx`](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/admin/qr/page.tsx), dejando la tarjeta limpia y enfocada en el código de mesa, la instrucción de escaneo y la despedida.

### Hito 7: Centrado del Modal de Detalle de Platos (`DishDetailSheet.tsx`)
- **Solicitud del usuario:** En el menú digital, al abrir la tarjeta de un producto, la tarjeta quedaba pegada abajo como un drawer inferior dejando un espacio oscuro arriba. Se solicitó que quede perfectamente centrada en la pantalla del móvil.
- **Implementación:**
  - En [`src/components/public/DishDetailSheet.tsx`](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/components/public/DishDetailSheet.tsx), se cambió la alineación de `items-end sm:items-center` a `items-center justify-center p-3 sm:p-4`.
  - Se definieron bordes redondeados completos (`rounded-3xl`), sombra `shadow-2xl` y animación centrada `animate-in zoom-in-95`.
  - Se removió la barra gris superior de arrastre de drawer, convirtiéndola en una tarjeta modal moderna, limpia y ergonómica.

### Hito 8: Resolución de Bloqueantes Críticos de Producción y Preparación para la Nube (Vercel / Serverless)
- **Diagnóstico:** El proyecto dependía del sistema de archivos local (`/public/uploads` para fotos, `src/data/settings.json` para ajustes, y SSR desactivado con `ssr: false`), lo cual provocaría errores `EROFS (Read-only file system)` y pérdida de datos en entornos Serverless/Cloud.
- **Soluciones Implementadas:**
  1. **Migración de Ajustes a Base de Datos:**
     - Se creó el modelo `RestaurantSettings` en `prisma/schema.prisma` y se ejecutó la migración.
     - Se eliminó definitivamente el archivo `src/data/settings.json`.
     - Los endpoints `/api/admin/settings` y `/api/public/settings` ahora leen y escriben de forma transaccional en la base de datos.
     - Se añadió soporte para que el dueño del restaurante pueda **cambiar su contraseña de administrador** directamente desde `/admin/settings`.
  2. **Almacenamiento Cloudinary para Fotos de Platos:**
     - Se implementó `src/lib/storage.ts` con el SDK oficial de Cloudinary (`npm install cloudinary`).
     - Al subir fotos desde el celular en `/api/upload`, se procesan automáticamente en formato WebP con un ancho máximo de 800px (evitando saturar el servidor con fotos pesadas de 8MB tomadas con la cámara).
     - Si no se configuran credenciales en desarrollo local, cuenta con un fallback transparente al disco local.
  3. **Restauración del Server-Side Rendering (SSR) Ultrarrápido:**
     - Se eliminó `dynamic(..., { ssr: false })` de [`src/app/page.tsx`](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/page.tsx) convirtiéndolo en un **Server Component**.
     - Ahora la página precarga las categorías, platos, promoción y ajustes directamente en el servidor y los pasa como `initialData` a TanStack Query en `PublicMenuClient.tsx`.
     - Resultado: Carga instantánea de HTML en conexiones 3G/4G móviles sin pantallas en blanco ni spinners de espera iniciales.
     - Se agregaron llamadas a `revalidatePath('/')` en todos los endpoints de administración (`dishes`, `toggle-status`, `categories`, `promo-modal`, `settings`) para invalidar la caché de Next.js al instante cuando se actualiza un plato.
  4. **Persistencia y Auto-detección de Mesa desde el QR:**
     - Si el cliente abre la carta mediante un QR con `/?mesa=05`, `PublicMenuClient` y `CartSheet` guardan el número en `sessionStorage` y pre-llenan automáticamente el campo de mesa en el carrito de WhatsApp.
  5. **Estrategia Segura de Service Worker (`public/sw.js`):**
     - Se excluyeron totalmente todas las rutas `/api/*` del caché (Network-Only) para evitar que comensales vean platos disponibles cuando ya fueron marcados como agotados por el cocinero.
     - Se estableció estrategia Network-First para el documento HTML y Cache-First únicamente para assets estáticos inmutables (logo, fuentes, manifest).
  6. **Variables de Entorno y Plantilla `.env.example`:**
     - Se creó `.env.example` documentando las cadenas de conexión para Neon/Supabase, claves de Cloudinary y variables de inicialización segura `ADMIN_INITIAL_EMAIL` y `ADMIN_INITIAL_PASSWORD`.

### Hito 9: Auditoría Forense y Certificación Cloud-Ready
- **Validación Automática:**
  - `npx prisma validate`: Esquema Prisma 100% válido.
  - `npx tsc --noEmit`: 0 errores de tipado en TypeScript.
  - `npm run build`: Código de salida `0`, 20 rutas optimizadas y compiladas exitosamente.
- **Blindaje Serverless:**
  - `src/lib/storage.ts`: Blindado con Cloudinary y fallback Base64 en producción para erradicar totalmente el riesgo de `EROFS`.
  - `/api/public/*`: Provistos con `export const dynamic = "force-dynamic"`.
  - `src/middleware.ts`: Certificado para Edge Runtime mediante `jose` (`jwtVerify`).
  - Detección de mesa en `sessionStorage` vinculada a `CartSheet.tsx`.
- **Automatización CI/CD:**
  - `package.json`: Se añadió `"postinstall": "prisma generate"` para garantizar que Vercel genere el cliente automáticamente en cada build.
  - `.gitignore`: Ajustado para rastrear `.env.example` y blindar `dev.db` y `public/uploads/*`.
- **Veredicto:** `[🟢 APTO PARA PRODUCCIÓN EN LA NUBE]`.

### Hito 10: Despliegue de Base de Datos en Neon PostgreSQL y Sincronización Cloud
- **Aprovisionamiento Cloud en Neon:**
  - Proyecto `Pio_Pio` configurado en la región AWS Este (us-east-1).
  - Cadena de conexión `DATABASE_URL` vinculada con pooling seguro en `.env`.
- **Migración de Esquema a PostgreSQL:**
  - `prisma/schema.prisma` actualizado a `provider = "postgresql"`.
  - Creación de todas las tablas en la nube (`users`, `categories`, `dishes`, `dish_portions`, `promotional_modals`, `restaurant_settings`) mediante `npx prisma db push`.
- **Siembra de Datos Oficiales de Pío Pío (`seed.ts`):**
  - Creación del usuario administrador (`admin@asaderopiopio.com`).
  - Carga masiva de categorías oficiales (Pollo Completo, Combos, Asados a la Brasa, Platos Típicos, Bandejas del Día, Sopas y Porciones, Desayunos).
  - Creación de porciones dinámicas y plato estrella promocional.
  - Configuración inicial de restaurante (WhatsApp, horarios, dirección).
- **Prueba de Compilación con Base de Datos en la Nube:**
  - `npm run build` ejecutado exitosamente: 20 páginas estáticas y 6 rutas dinámicas SSR/API generadas con 0 errores.
- **Control de Versiones:**
  - Commit formal realizado en la rama `master` con 69 archivos preparados para GitHub.

### Hito 11: Publicación en Repositorio Remoto GitHub
- **Repositorio Oficial:** `https://github.com/Liturgia-03/pio-pio-restaurante.git`
- **Rama Principal:** `main` sincronizada y configurada con upstream (`origin/main`).
- **Seguridad Garantizada:** `.env` y bases de datos locales `dev.db` excluidas del repositorio público mediante `.gitignore`.
- **Estado Actual:** Listo para importación y despliegue continuo (CI/CD) en Vercel.

### Hito 12: Despliegue en Producción Exitoso en Vercel (Cloud-Ready 100%)
- **Plataforma:** Vercel Serverless Platform.
- **Dominio Público:** `https://pio-pio-restaurante.vercel.app`.
- **Métricas de Build:**
  - Tiempo de compilación: **46 segundos**.
  - Estado: **Listo / Producción (Latest) 🟢**.
  - Servido a través de la red global Edge CDN con certificado SSL / HTTPS automático.
- **Infraestructura Conectada:**
  - Base de Datos: Neon PostgreSQL Serverless (AWS us-east-1).
  - Autenticación: JWT en Edge Runtime con `jose`.
  - SSR Híbrido: Server Components precargados con hidratación instantánea en TanStack Query.
  - Caché: `force-dynamic` en endpoints de datos públicos y `revalidatePath` en mutaciones.
- **Veredicto Final:** Sistema 100% operativo en vivo en la web. Listo para imprimir códigos QR y operar en el restaurante.

---

## 📁 5. Estructura de Archivos Clave del Proyecto

```text
APP_WEB_ASADERO_RESTAURANTE/
├── prisma/
│   ├── dev.db                        # Base de datos SQLite local
│   ├── schema.prisma                 # Modelos de datos (User, Category, Dish, Portion, PromotionalModal)
│   └── seed.ts                       # Script de siembra con el menú real de Pío Pío
├── public/
│   ├── logo-pio-pio.png              # Logotipo oficial del asadero
│   ├── manifest.json                 # Manifiesto PWA para instalación en móviles
│   ├── sw.js                         # Service Worker para funcionamiento offline
│   └── uploads/                      # Directorio de fotos subidas desde el panel
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Layout raíz (Fuentes, Sonner, Metadatos PWA)
│   │   ├── page.tsx                  # Entrada a la Carta Digital (Carga dinámica con ssr: false)
│   │   ├── globals.css               # Estilos globales y reglas de Tailwind
│   │   ├── admin/                    # Módulo Privado del Panel Administrativo
│   │   │   ├── layout.tsx            # Shell administrativo con Sidebar y Drawer móvil
│   │   │   ├── login/page.tsx        # Login con credenciales de Pío Pío
│   │   │   ├── dashboard/page.tsx    # Métricas y switches rápidos de disponibilidad
│   │   │   ├── dishes/page.tsx       # Listado de platos, buscador y filtros
│   │   │   ├── dishes/new/page.tsx   # Creador de plato con subida de imagen
│   │   │   ├── dishes/[id]/page.tsx  # Editor de plato existente
│   │   │   ├── categories/page.tsx   # CRUD y reordenamiento de categorías
│   │   │   ├── promo-modal/page.tsx  # Editor de promoción con Live Smartphone Mockup
│   │   │   ├── qr/page.tsx           # Generador e imprimible de tarjetas QR por mesa
│   │   │   └── settings/page.tsx     # Ajustes generales (WhatsApp, Wi-Fi, horarios)
│   │   └── api/                      # Endpoints RESTful
│   │       ├── admin/
│   │       │   ├── auth/             # Login, logout y sesión
│   │       │   ├── categories/       # CRUD de categorías
│   │       │   ├── dishes/           # CRUD de platos y toggle-status
│   │       │   ├── promo-modal/      # Configuración de modal promocional
│   │       │   └── settings/         # Guardado de ajustes del negocio
│   │       ├── public/
│   │       │   ├── menu/             # Menú público con categorías y platos
│   │       │   ├── promo-modal/      # Promoción activa para clientes
│   │       │   └── settings/         # Datos públicos de contacto y Wi-Fi
│   │       └── upload/               # Subida de imágenes a /public/uploads
│   ├── components/
│   │   ├── admin/                    # Componentes del dashboard
│   │   └── public/                   # Componentes de la carta digital
│   │       ├── PublicHeader.tsx      # Cabecera con logo y buscador
│   │       ├── PublicMenuClient.tsx  # Orquestador con las 3 tarjetas de navegación
│   │       ├── CategoryCard.tsx      # Tarjeta vertical de categoría apilada
│   │       ├── CategoryChips.tsx     # Barra de filtros rápidos por chips
│   │       ├── DishCard.tsx          # Ficha individual de plato en el menú
│   │       ├── DishDetailSheet.tsx   # Modal de detalle centrado en pantalla
│   │       ├── PromoModal.tsx        # Modal emergente de promoción inicial
│   │       ├── CartFloatingButton.tsx# Botón flotante del carrito
│   │       └── CartSheet.tsx         # Cajón del carrito y envío a WhatsApp
│   ├── context/
│   │   └── CartContext.tsx           # Estado global del carrito de compras
│   ├── lib/
│   │   ├── auth.ts                   # Hashing de passwords y JWT en cookies
│   │   ├── formatters.ts             # Formateo de precios en COP ($ 43.000)
│   │   ├── prisma.ts                 # Cliente Prisma singleton
│   │   ├── storage.ts                # Adaptador de subida a Cloudinary con compresión WebP
│   │   └── validations.ts            # Esquemas de validación Zod
│   ├── middleware.ts                 # Protección de rutas /admin/* vía cookie de autenticación
│   └── types/                        # Tipado estricto de entidades
├── .env.example                      # Plantilla de variables de entorno para producción
├── DOCUMENTO_DE_SEGUIMIENTO.md       # ESTE DOCUMENTO (Bitácora de contexto continuo)
├── documentacion_tecnica_menu_y_dashboard.md # Especificación técnica de arquitectura
└── README.md                         # Guía rápida para usuarios y desarrolladores
```

---

## 🔄 6. Protocolo de Actualización para Futuras Sesiones

Cada vez que se añada una funcionalidad, se ajuste un diseño o se resuelva un error, **el agente debe actualizar este archivo** siguiendo esta estructura:
1. Añadir el nuevo hito en la sección **4. Bitácora Cronológica de Cambios**.
2. Actualizar las tablas o rutas modificadas en las secciones **1**, **2** o **5**.
3. Confirmar que `npm run build` o las pruebas sigan pasando limpiamente.

