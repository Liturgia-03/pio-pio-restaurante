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
| **Rutas Compiladas** | **25 rutas** (estáticas y dinámicas) con 0 errores en `npm run build` |

### Punto de Entrada y Credenciales de Acceso
- **Ruta Raíz (`/`):** Redirección automática del lado del servidor hacia `/admin/dashboard` (protegida por `middleware.ts`, enviando a `/admin/login` si no hay sesión).
- **URL de Producción (En Vivo):** `https://pio-pio-restaurante.vercel.app` (o `/admin/login`)
- **Usuario Administrador:** `Piopio123`
- **Contraseña de Administrador:** `123456`

### Entornos de Ejecución y Carta Digital Pública
- **Carta Digital de Clientes:** `https://pio-pio-restaurante.vercel.app/menu`
- **Carta Digital con Mesa (Ejemplo Mesa 1):** `https://pio-pio-restaurante.vercel.app/menu?mesa=01`
- **Servidor Local de Desarrollo:** `http://localhost:3000` (Redirige a `/admin/dashboard` y carta en `http://localhost:3000/menu`)

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

### Hito 13: Reestructuración de Rutas - Admin como Punto de Entrada Raíz (`/`) y Carta Pública en `/menu`
- **Carta Digital Pública en `/menu`:**
  - Creado `src/app/menu/page.tsx` conteniendo la experiencia completa de la carta digital de comensales con SSR, precarga Prisma (`initialCategories`, `initialPromo`, `initialSettings`) y `force-dynamic`.
- **Redirección Inmediata en Ruta Raíz (`/`):**
  - `src/app/page.tsx` ahora ejecuta `redirect("/admin/dashboard")` del lado del servidor.
  - El flujo de seguridad orquestado por `src/middleware.ts` intercepta la ruta: si el usuario tiene sesión válida accede directamente a `/admin/dashboard`; si no tiene sesión o es la primera vez, lo redirige fluidamente a `/admin/login`.
- **Actualización de Códigos QR para Mesas (`/admin/qr`):**
  - Generador de códigos QR ajustado para construir la URL oficial `${baseUrl}/menu?mesa=XX`.
  - Tarjeta destacada agregada tanto en `/admin/qr` como en `/admin/dashboard` mostrando el enlace público de la carta con botones de acción directa: **"Copiar Link del Menú"** (al portapapeles con toast Sonner) y **"Abrir Carta Pública"** (`target="_blank"`).
- **Actualización de Enlaces Internos:**
  - Modificados botones de "Ver Carta" / "Ver Menú" en `AdminHeader.tsx`, `AdminNavSidebar.tsx`, `AdminMobileDrawer.tsx` y `AdminDashboardPage.tsx` para navegar a `/menu`.
- **Revalidación de Caché Atómica:**
  - Agregado `revalidatePath("/menu")` en todos los endpoints de mutación administrativa (`/api/admin/dishes`, `toggle-status`, `categories`, `reorder`, `promo-modal`, `settings`) para invalidación en tiempo real.
- **Certificación de Build:**
  - `npx tsc --noEmit`: 0 errores de tipado.
  - `npm run build`: 21 rutas compiladas y optimizadas exitosamente con código de salida `0`.

### Hito 14: Modal de Entrada de 2 Pasos (Bienvenida + Promo) y Editor Administrativo Completo
- **Experiencia de Entrada de 2 Pasos (`PromoModal.tsx`):**
  - **Paso 1 (Presentación y Bienvenida):** Logo oficial animado de Pío Pío con resplandor dorado, distintivo `El Sabor Que Nos Une`, títulos institucionales, descripción apetecible, 3 cápsulas de especialidades y botón principal `Ver Oferta Especial de Hoy →`.
  - **Paso 2 (Plato Promocional):** Foto en alta resolución, badge de oferta, precios (regular tachado vs especial) y botón CTA directo hacia el plato en la carta.
  - **Transiciones y Salidas Suaves:** Cero retraso en el inicio (SSR inmediato), cambio suave entre pasos de 160ms con desvanecimiento, salida fluida de 280ms (`scale-95 opacity-0`) y transiciones de navegación fluidas en la carta (`animate-in fade-in slide-in-from-right-3 duration-300`).
- **Persistencia en Base de Datos Cloud (Neon PostgreSQL):**
  - Se añadieron campos configurables al modelo `PromotionalModal`: `welcomeBadge`, `welcomeTitle`, `welcomeSubtitle`, `welcomeDescription`, `welcomeButtonText`, `welcomeTag1`, `welcomeTag1Sub`, `welcomeTag2`, `welcomeTag2Sub`, `welcomeTag3`, `welcomeTag3Sub`.
  - Sincronización exitosa con Neon mediante `npx prisma db push`.
- **Editor en Panel Administrativo (`/admin/promo-modal`):**
  - Pestañas para editar independientemente: `1. Tarjeta de Bienvenida` y `2. Plato Promocional`.
  - **Simulador Móvil en Vivo Interactivo:** Permite previsualizar en tiempo real el smartphone del comensal alternando entre la vista del Paso 1 y la vista del Paso 2 a medida que se escriben los cambios.

### Hito 15: Animación Cinemática de Entrada para el Modal de Bienvenida
- **Efecto de Entrada Dinámico y Fluido (`animate-modal-card`):**
  - Se eliminó la aparición súbita o en seco del modal.
  - Se implementó una curva de animación física elástica (`cubic-bezier(0.16, 1, 0.3, 1)`) que hace emerger la tarjeta suavemente desde abajo hacia el centro con micro-escala (`scale(0.90)` a `scale(1.015)` y reposo en `scale(1.0)`).
- **Fondo Desenfoque Progresivo (`animate-modal-backdrop`):**
  - El fondo oscuro y el desenfoque (`backdrop-filter: blur(12px)`) transicionan de `opacity: 0` a `opacity: 1` en 450ms.
- **Micro-Animaciones Escalonadas Internas:**
  - **Logo de Pío Pío:** Resplandor de brasa dorado/ámbar pulsante suave (`animate-logo-glow`).
  - **Llama de Fuego:** Oscilación sutil viva (`animate-flame-wiggle`).
  - **Títulos, Contenido y Botón:** Entrada escalonada en cascada (`animate-fade-in-up-1`, `2`, `3`) para una presentación atractiva y elegante de alta gama.
- **Certificación:**
  - Compilación verificada con 0 errores de TypeScript y `npm run build` exitoso.

### Hito 16: Ocultamiento Total del Menú de Fondo Durante los Modales
- **Fondo Sólido y Opaco (`bg-[#0f1115]`):**
  - Se eliminó la semitransparencia del fondo (`bg-black/80`) y la transición desde `opacity: 0`.
  - El fondo nace al 100% de opacidad con el tono oscuro oficial del restaurante y un gradiente radial cálido de brasa en el centro, ocultando por completo las categorías, platos, buscador y cabecera mientras el modal está activo.
- **Bloqueo de Desplazamiento (`overflow: hidden`):**
  - Se bloqueó el scroll del documento mientras el modal esté visible para evitar que el usuario desplace la carta detrás.
- **Desvanecimiento al Entrar:**
  - Al cerrar el modal o pulsar el botón de ver carta, el fondo sólido se desvanece suavemente (`duration-300`) revelando el menú al comensal de manera impecable.

### Hito 17: Fondo Ultra Oscuro (95% Opacidad) y Desenfoque Cinemático Intenso (24px Blur)
- **Eliminación de Fuga de Transparencia:**
  - Se eliminó el gradiente radial anterior que provocaba que el 92% del centro de la pantalla fuera transparente.
- **Oscurecimiento Profundo y Desenfoque Máximo:**
  - Se implementó `backgroundColor: rgba(5, 5, 8, 0.95)` (95% de negro carbón profundo).
  - Se aplicó `backdropFilter: blur(24px)` y `-webkit-backdrop-filter: blur(24px)`, difuminando por completo cualquier texto, tarjeta o botón detrás, haciéndolos totalmente ilegibles e imperceptibles.
- **Enfoque Total en la Tarjeta:**
  - El modal ahora resalta como el elemento protagonista exclusivo sobre un fondo oscuro, sedoso y desenfocado con acabado de alta gama.

### Hito 18: Suavidad Cinemática y Transiciones Fluidas en Navegación, Categorías, Platos y Carrito
- **Ficha de Detalle de Plato (`DishDetailSheet.tsx`):**
  - Se eliminó la apertura en seco y el cierre abrupto. Se aplicó animación de entrada elástica iOS (`modalPopIn` en 350ms con curva `cubic-bezier(0.16, 1, 0.3, 1)`).
  - Se implementó salida animada con retardo programado de 260ms (`handleSmoothClose`), donde la tarjeta se reduce suavemente y desciende (`scale-90 translate-y-6 opacity-0`) mientras el fondo se desvanece de forma sedosa.
  - Bloqueo automático de scroll en `document.body` mientras el detalle esté abierto.
- **Tarjetas de Platos (`DishCard.tsx`):**
  - Micro-interacción táctil suave (`active:scale-[0.98] transition-all duration-300 ease-out`) con resplandor sutil al toque/hover.
- **Navegación entre Categorías y Pestañas (`PublicMenuClient.tsx`):**
  - Se erradicó el tirón lateral tosco (`slide-in-from-right-3`). Tanto el cambio de categorías como la apertura de las pestañas ("Ver Menú Completo", "Promociones", "Información") ahora utilizan elevación vertical con desvanecimiento orgánico (`animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]`).
  - Botones de pestañas superiores y botones de retorno ("Volver a Categorías") con transiciones suaves de 300ms y micro-escalado elástico.
- **Barra de Chips de Categorías (`CategoryChips.tsx`):**
  - Transición fluida de 300ms con micro-escala (`scale-[1.02]`) en la categoría activa.
- **Carrito de Compras Móvil (`CartSheet.tsx`):**
  - Apertura y cierre con animación suave: `handleSmoothClose` con 260ms de transición descendente (`translate-y-full opacity-0`) y desvanecimiento progresivo del fondo oscuro con desenfoque (`backdrop-blur-md`).
  - Bloqueo de scroll del fondo mientras el carrito esté visible.
- **Botón Flotante del Carrito (`CartFloatingButton.tsx`):**
  - Entrada fluida con `fadeInUpSoft` y feedback táctil amortiguado (`active:scale-[0.98]`).
- **Certificación Técnica:**
  - Compilación verificada con `npm run build` en Turbopack: 21 rutas compiladas y optimizadas exitosamente con código de salida `0`.

### Hito 19: Suavidad y Fluidez en el Panel Administrativo (Admin Shell, Drawer, Switches y Navegación)
- **Transición Global de Pantallas Admin (`AdminShell.tsx`):**
  - Se asignó clave reactiva `key={pathname}` y animación `animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]` al contenedor principal `<main>`. Cada cambio de sección en el panel administrativo (Dashboard, Platos, Categorías, Promo Modal, QR, Ajustes) se eleva y desvanece con suavidad cinemática sin saltos secos.
- **Menú Móvil Desplegable Admin (`AdminMobileDrawer.tsx`):**
  - Implementación de `isClosing` y `handleSmoothClose` (260ms) con bloqueo de scroll corporal.
  - Entrada y salida fluidas: el panel se desliza suavemente (`-translate-x-full opacity-0`) y el fondo desenfocado se desvanece de manera sedosa.
- **Barra Inferior Móvil (`AdminBottomBar.tsx`):**
  - Micro-escalado y feedback suave en cada pestaña (`active:scale-95 duration-300 ease-out`) y botón central flotante (+) con escala suave `active:scale-90 hover:scale-105`.
- **Sidebar de Escritorio (`AdminNavSidebar.tsx`):**
  - Enlaces con transición lateral suave `hover:translate-x-1 duration-300 ease-out` y respuesta táctil `active:scale-[0.98]`.
- **Switches de Disponibilidad iOS (`dashboard/page.tsx` y `dishes/page.tsx`):**
  - Transición fluida de color y desplazamiento elástico de la perilla (`transition-transform duration-300 ease-out`).
- **Formularios, Categorías y Login (`categories/page.tsx`, `promo-modal/page.tsx`, `login/page.tsx`, `DishForm.tsx`):**
  - Formulario de categorías con elevación suave `fadeInUpSoft`.
  - Pestañas del editor promocional con transiciones de elevación de 320ms.
  - Tarjeta de Login con animación `modalPopIn` y logo pulsante con resplandor dorado.
  - Botones de acción con respuesta elástica `active:scale-[0.98] duration-300 ease-out`.
- **Certificación Técnica:**
  - Compilación verificada con `npm run build` en Turbopack: 21 rutas compiladas con 0 errores (código de salida `0`). Cambios conservados localmente a la espera de la indicación del usuario para el despliegue.

### Hito 20: Nueva Barra de Navegación Inferior Móvil (MENÚ - PROMOS - PEDIDO - INFO) y Optimización de Cabecera
- **Eliminación de las 3 Tarjetas Superiores Masivas (`PublicMenuClient.tsx`):**
  - Se eliminó el bloque superior pegajoso que contenía las tarjetas de "Ver Menú Completo", "Promociones" e "Información", liberando más de 110px de altura vertical en la pantalla del celular para dar máximo protagonismo a la comida y las categorías.
- **Conservación del Buscador Superior en Cabecera (`PublicHeader.tsx`):**
  - El buscador se mantiene exactamente en su ubicación superior original, con su botón de lupa interactivo y campo expandible con autofocus.
  - Se añadió la insignia de mesa (`Mesa #XX`) de manera discreta y elegante junto al nombre del restaurante en la cabecera.
- **Nueva Barra Inferior Móvil (`PublicBottomBar.tsx`):**
  - Barra fija al borde inferior (`bottom-0 z-40`) con acabado *glassmorphism* oscuro (`bg-[#14161a]/95 backdrop-blur-xl border-t border-gray-800/80`) y soporte para `safe-area-inset-bottom`.
  - Distribución ergonómica de 4 pestañas de fácil acceso con el pulgar:
    1. **MENÚ:** Retorna a la carta general de categorías y desplaza suavemente la vista arriba.
    2. **PROMOS:** Abre la pestaña de platos especiales, combos y plato estrella del día.
    3. **PEDIDO:** Conexión directa al carrito con badge numérico en vivo (`totalItems`), monto acumulado en COP y apertura instantánea del pedido para WhatsApp.
    4. **INFO:** Despliega horarios de atención, clave de Wi-Fi y datos de contacto.
- **Erradicación del Botón Flotante Obstructivo:**
  - Al integrar "PEDIDO" directamente en la barra inferior, se eliminó la necesidad del botón flotante anterior (`CartFloatingButton.tsx`) que tapaba platos en la parte baja de la pantalla.
- **Certificación Técnica:**
  - Compilación verificada con `npm run build` en Turbopack: 21 rutas compiladas con código de salida `0`. Cambios retenidos a nivel local.

### Hito 21: Navegación Horizontal Táctil (Swipe Gestures) entre Categorías de Platos
- **Detección Táctil Horizontal de Alta Precisión (`PublicMenuClient.tsx`):**
  - Implementación de `handleTouchStart`, `handleTouchMove` y `handleTouchEnd` con discriminación de ángulo de arrastre (`deltaX` vs `deltaY`). Si el comensal desliza verticalmente, la lista de platos hace scroll arriba/abajo sin fricción; si desliza horizontalmente de derecha a izquierda o viceversa, la lista activa el cambio de categoría.
  - Efecto de rebote elástico en tiempo real (*rubber-band drag offset*) mientras el dedo acompaña el gesto, con retorno elástico suave si el arrastre no supera el umbral de activación (28px).
- **Animaciones Direccionales de Entrada (`slide-in-from-right-8` y `slide-in-from-left-8`):**
  - Al avanzar a la siguiente categoría, los platos entran deslizándose desde la derecha.
  - Al retroceder a la categoría anterior, los platos entran deslizándose desde la izquierda.
- **Sincronización Total con `CategoryChips.tsx`:**
  - Cada vez que se cambia de categoría mediante swipe horizontal, la barra superior de chips activa el auto-centrado automático (`scrollIntoView({ inline: "center", behavior: "smooth" })`), manteniendo el chip activo siempre a la vista del cliente.
- **Controles de Paginación Superior e Inferior:**
  - Barra de navegación rápida superior: Botón `← Categorías`, flechas de categoría anterior/siguiente (`<` y `>`) y contador de posición (ej: `2 / 9`).
  - Tarjetas de navegación al final de la lista: botones grandes `← Anterior: [Nombre]` y `Siguiente: [Nombre] →` para facilitar el paso continuo entre secciones sin tener que volver arriba.
  - Mensaje guía discreto: *"👈 Desliza la pantalla hacia los lados para cambiar de categoría 👉"*.
- **Certificación Técnica:**
  - Verificado con `npm run build` en Turbopack: 21 rutas compiladas con código de salida `0` y 0 advertencias de tipo. Cambios mantenidos a nivel local.

### Hito 22: Integración Nativa del Botón "Atrás" del Celular (Android / iOS / Navegador) en Menú y Admin
- **Problema Solucionado:** Al navegar por la app móvil, pulsar el botón físico o gesto de "Atrás" del teléfono provocaba que el navegador retrocediera la página web por completo y se saliera de la aplicación, en vez de retroceder un paso dentro de las capas activas (categoría -> menú, modal de plato -> categoría, carrito -> menú, drawer -> panel, formulario de categoría -> listado).
- **Sincronización Bidireccional en el Menú Digital (`PublicMenuClient.tsx`, `CartSheet.tsx`, `DishDetailSheet.tsx`, `PromoModal.tsx`):**
  - **Apertura de Categoría:** Al seleccionar una categoría se registra estado en el historial (`pushState`). Al deslizar entre categorías por swipe o chips se usa `replaceState`. Al pulsar el botón "Atrás" del celular (o el botón en pantalla "← Categorías"), el historial retrocede y vuelve a la vista de todas las categorías sin salirse de la web.
  - **Detalle de Plato (`DishDetailSheet.tsx`):** Al tocar un plato se registra entrada en el historial. Al presionar "Atrás" del celular o la "X", se activa el listener de `popstate` ejecutando la animación cinemática suave de cierre antes de desmontarse.
  - **Carrito del Pedido (`CartSheet.tsx`):** Al abrir el carrito se inserta entrada en el historial. Al pulsar "Atrás" en el celular o la "X" en pantalla, el cajón se desliza hacia abajo con transición fluida de salida.
  - **Modal Promocional & Bienvenida (`PromoModal.tsx`):** Al presionar "Atrás" en el teléfono, el modal de presentación o promoción del día se cierra suavemente permitiendo acceder de inmediato a la carta digital.
  - **Pestañas Secundarias (Promos & Info) y Buscador:** Si el usuario está en "Promos", "Info" o con la barra de búsqueda abierta y pulsa atrás en su móvil, el sistema regresa a la carta principal "Menú" y limpia la búsqueda.
- **Sincronización en el Panel Administrativo (`AdminShell.tsx`, `AdminMobileDrawer.tsx`, `AdminCategoriesPage`):**
  - **Drawer de Menú Móvil:** Al abrir el menú lateral en el celular se inserta estado de historial. Si el administrador pulsa el botón "Atrás" de su teléfono o toca el fondo oscuro, el drawer se repliega suavemente hacia la izquierda sin salirse del panel.
  - **Formulario de Categorías (`/admin/categories`):** Al pulsar "Nueva Categoría" o "Editar Categoría", presionar "Atrás" en el celular cierra el formulario y restablece la lista de categorías intacta.
- **Certificación Técnica:**
  - Compilación exitosa con Turbopack (`npm run build`): 21 rutas verificadas con código de salida `0`. Cambios retenidos a nivel local según instrucción del usuario sin realizar despliegue todavía.

### Hito 23: Renovación de Autenticación, Credenciales y Gestión de Acceso
- **Campos Limpios en Login (`/admin/login`):** Eliminación de valores hardcodeados por defecto; los campos de usuario y contraseña cargan ahora completamente vacíos (`""`).
- **Cambio de "Correo" por "Usuario":** Reemplazo de etiqueta, placeholder e icono (`Mail` -> `User`), permitiendo autenticación por nombre de usuario (`Piopio123`).
- **Visibilidad Dinámica de Contraseñas:** Integración de botón táctil de mostrar/ocultar con iconos `Eye` y `EyeOff` en la pantalla de login y en el formulario de ajustes.
- **Nuevas Credenciales Establecidas y Sincronizadas:**
  - **Usuario:** `Piopio123`
  - **Contraseña:** `123456`
  - Base de datos Neon PostgreSQL actualizada con el nuevo hash bcrypt.
- **Gestión Editable de Credenciales en el Panel (`/admin/settings`):**
  - El administrador puede actualizar su nombre de usuario y su contraseña desde el módulo de ajustes en cualquier momento.
- **Certificación Técnica:**
  - Verificado con `npm run build` en Turbopack: 21 rutas compiladas con código de salida `0`.

### Hito 24: Corrección de Violación de Reglas de Hooks (Minified React Error #300 en PromoModal)
- **Causa Raíz:** En `PromoModal.tsx`, la cláusula de salida anticipada `if (!isOpen || !promo || !promo.isActive) return null;` se encontraba posicionada antes del hook `useEffect` correspondiente a la sincronización del historial `popstate`. Al hacer clic en "Ver toda la carta" o "Ir directo a la carta", `isOpen` pasaba a `false`, provocando que el hook de `useEffect` no se ejecutara en ese ciclo de render, lo cual violaba las reglas fundamentales de Hooks en React 19 y disparaba el error fatal `#300` (*Rendered fewer hooks than expected*).
- **Solución Implementada:** Se reubicaron todos los hooks (`useState`, `useEffect`) para ejecutarse de manera incondicional en el nivel superior del componente antes de cualquier bifurcación de retorno.
- **Certificación Técnica:**
  - Verificado con `npm run build` en Turbopack: 21 rutas compiladas con código de salida `0`.

### Hito 25: Nuevo Encabezado Gourmet con Carrusel de Fotos Horizontales y Administración desde el Panel
- **Diseño "Opción 3: Perfil Gourmet" en la Carta Digital (`/menu`):**
  - **Carrusel Panorámico:** Portada horizontal rectangular (`h-48 sm:h-56`) con carrusel de múltiples fotos en rotación automática cada 4.5 segundos, soporte táctil (swipe gesture), puntos indicadores (dots) interactivos y flechas de navegación discretas.
  - **Logo de Pío Pío Destacado:** Logotipo oficial ampliado a 80×80px (sm: 96×96px) con esquinas redondeadas tipo app gourmet (`rounded-2xl sm:rounded-3xl`), doble borde dorado con resplandor suave y sombra profunda sobre el carrusel.
  - **Identidad de Marca:** Tipografía de alto impacto ("Pío Pío"), eslogan/subtítulo personalizable, descripción y badge de estado *"🟢 Abierto hoy"*.
  - **Buscador Integrado Amplio:** Campo de búsqueda completo y visible de inmediato con icono de lupa, placeholder intuitivo y botón "X" para limpiar, eliminando la necesidad de interactuar con un botón de lupa pequeño.
  - **Chips Adheribles (`CategoryChips.tsx`):** Ajustados a `sticky top-0 z-30` para que se anclen perfectamente al borde superior de la pantalla al hacer scroll sobre los platos de una categoría.
- **Gestión desde el Panel Administrativo (`/admin/settings`):**
  - Sección *"Fotos de Portada del Encabezado (Carrusel)"*: visualización de miniaturas de fotos actuales, botón para eliminar foto individual, subida de nuevas imágenes locales (vía `/api/upload`) y opción para agregar por URL directa.
  - Campos de texto para personalizar el subtítulo (`headerTagline`) y la descripción del asadero (`headerDescription`).
- **Base de Datos y APIs:**
  - Modelo `RestaurantSettings` extendido con `headerImages`, `headerTagline` y `headerDescription` (sincronizado a Neon PostgreSQL).
  - Endpoints `/api/public/settings` y `/api/admin/settings` actualizados con soporte de lectura, guardado e imágenes por defecto de alta calidad.
- **Certificación Técnica:**
  - Verificado con `npm run build` en Turbopack: 21 rutas compiladas con código de salida `0`.

### Hito 26: Renombramiento a "Ajustes Menú", Edición de Portada en 3 Pasos y Horario Sincronizado
- **Renombramiento en Navegación Administrativa:**
  - En la barra lateral (`AdminNavSidebar.tsx`), cajón móvil deslizable (`AdminMobileDrawer.tsx`), barra inferior (`AdminBottomBar.tsx`) y shell (`AdminShell.tsx`), la sección *"Modal Promocional"* se renombró a **"Ajustes Menú"**.
- **Módulo Integral de 3 Pasos en `/admin/promo-modal`:**
  - `1. Tarjeta Bienvenida`: Editor del mensaje de bienvenida inicial, especialidades (pilares) y botón.
  - `2. Plato Promocional`: Editor de la oferta del día con imagen, badge, precios y enlace a plato.
  - `3. Portada Menú` (**Nuevo**): Editor de imágenes del carrusel de portada (subida, galería con borrado, URLs), edición y subida de logotipo oficial, personalización del nombre ("Pío Pío"), subtítulo/eslogan, descripción y **horario de atención sincronizado**.
- **Sincronización Total del Horario de Atención:**
  - El horario configurado en el asadero se muestra dinámicamente en `PublicHeader.tsx` (`openingHours || "10:00 AM - 9:00 PM"`), coincidiendo exactamente con la sección informativa de la carta digital y los ajustes generales.
- **Simulador Móvil en Vivo (Live Smartphone Mockup):**
  - Integra alternador de 3 pasos: permite previsualizar en tiempo real el paso 1 (Bienvenida), paso 2 (Promo) y el paso 3 (**Portada en vivo con carrusel, logo, horario y buscador**).
- **Certificación Técnica:**
  - Verificado con `npm run build` en Turbopack: 21 rutas compiladas con código de salida `0`.

### Hito 27: Corrección de Navegación en el Cajón Móvil Desplegable del Panel Administrativo
- **Causa Raíz del Bloqueo de Navegación:**
  En `AdminMobileDrawer.tsx`, al hacer clic en cualquier opción del menú desplegable, el enlace ejecutaba `handleSmoothClose()`, el cual invocaba de forma indiscriminada `window.history.back()`. Esto provocaba una colisión de historial: mientras Next.js intentaba transicionar hacia la nueva ruta (`/admin/dishes`, `/admin/categories`, etc.), el navegador retrocedía a la ruta actual (`/admin/dashboard`), abortando la navegación y dejando al usuario atrapado en la pantalla seleccionada en la barra inferior.
- **Solución Implementada:**
  - Se desacopló el cierre por descarte (`handleDismiss`: 'X' o toque en el fondo oscuro) de la navegación intencional (`handleNavigate`).
  - Al presionar una opción, `handleNavigate` limpia el estado huérfano con `window.history.replaceState(null, "")` sin emitir `popstate`, cierra el cajón inmediatamente y ejecuta `router.push(href)`. Si el usuario ya está en esa pantalla, simplemente cierra el drawer.
  - En `AdminShell.tsx`, se añadió un efecto reactivo que garantiza que el drawer siempre permanezca cerrado al cambiar de ruta (`[pathname]`).
- **Certificación Técnica:**
  - Verificado con `npm run build` en Turbopack: 21 rutas compiladas con código de salida `0`.

### Hito 28: Limpieza de Ajustes Asadero (Eliminación de Portada Duplicada)
- **Ajustes Asadero (`/admin/settings`):**
  - Se eliminó completamente la tarjeta duplicada de *"Fotos de Portada del Encabezado (Carrusel)"*, subtítulo y eslogan en [src/app/admin/settings/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/admin/settings/page.tsx).
  - La administración de la portada y su carrusel queda centralizada de forma exclusiva y limpia en la sección **Ajustes Menú** (`/admin/promo-modal`).
  - La sección de Ajustes Asadero ahora se enfoca únicamente en: WhatsApp para pedidos, Horario de Atención, Dirección física, Red Wi-Fi para clientes y Credenciales de acceso de Administrador.
- **Certificación Técnica:**
  - Verificado con `npm run build` en Turbopack: 21 rutas compiladas con código de salida `0`.

### Hito 29: Redes Sociales en Pestaña Info y Estado de Apertura Dinámico en Tiempo Real
- **Redes Sociales & Sitio Web Oficial:**
  - Se eliminó la tarjeta fija de presentación en la pestaña *Info* de la carta digital y se reemplazó por la tarjeta interactiva **"Nuestras Redes Sociales & Web"** ([PublicMenuClient.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/components/public/PublicMenuClient.tsx)), mostrando botones de acceso directo a:
    - **Facebook** (icono oficial `#1877F2`).
    - **Instagram** (icono con degradado característico).
    - **Sitio Web** (icono dorado de globo terráqueo).
  - En **Ajustes Asadero** (`/admin/settings`), se agregaron los campos editables para configurar las URLs de Facebook, Instagram y Página Web oficial.
  - Modelo `RestaurantSettings` extendido con `facebookUrl`, `instagramUrl` y `websiteUrl` (sincronizado a Neon PostgreSQL).
- **Cálculo Dinámico de Estado: "🟢 Abierto ahora" vs "🔴 Cerrado ahora":**
  - Implementación del módulo de cálculo horario [src/lib/openingHours.ts](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/lib/openingHours.ts) con soporte para la zona horaria de Colombia (`America/Bogota`).
  - Evalúa la hora actual contra el horario configurado en el admin (ej: `08:00 AM a 10:00 PM`). Si un usuario ingresa fuera de ese rango (ej: a la 1:00 AM), el badge cambia automáticamente a **"🔴 Cerrado ahora"** / **"🔴 Cerrado"**. Si está dentro del rango, muestra **"🟢 Abierto ahora"** / **"🟢 Abierto"**.
  - Sincronizado en:
    - Encabezado de la carta digital ([PublicHeader.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/components/public/PublicHeader.tsx)).
    - Pestaña informativa de la carta digital ([PublicMenuClient.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/components/public/PublicMenuClient.tsx)).
    - Simulador móvil en vivo de ajustes del menú ([admin/promo-modal/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/admin/promo-modal/page.tsx)).
- **Certificación Técnica:**
  - Verificado con `npm run build` en Turbopack: 21 rutas compiladas con código de salida `0`.

### Hito 30: Transición Natural Entre Categorías Sin Recorridos Verticales Ni Saltos a la Cima
- **Causa Raíz del Desplazamiento Brusco:**
  En `PublicMenuClient.tsx`, tanto `handleNextCategory`, `handlePrevCategory` como `handleSelectCategory` ejecutaban `window.scrollTo({ top: 0, behavior: "smooth" })`. Esto provocaba que, cada vez que el usuario deslizaba con el dedo (swipe) de izquierda a derecha o seleccionaba otra categoría, la página realizara un recorrido visual forzado subiendo cientos de píxeles hasta el encabezado/carrusel. Adicionalmente, en `CategoryChips.tsx`, el uso de `scrollIntoView` forzaba saltos verticales indeseados en navegadores móviles.
- **Solución Implementada:**
  - Se eliminaron las llamadas a `window.scrollTo({ top: 0, behavior: "smooth" })` al transicionar entre categorías ([PublicMenuClient.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/components/public/PublicMenuClient.tsx)).
  - En `CategoryChips.tsx`, se reemplazó `activeBtn.scrollIntoView` por un desplazamiento horizontal aislado sobre el contenedor `container.scrollTo({ left: targetScrollLeft, behavior: "smooth" })`, garantizando que el scroll vertical de la ventana permanezca 100% inalterado.
  - La transición entre platos y categorías ahora ocurre de forma completamente natural en el mismo punto de lectura.
- **Certificación Técnica:**
  - Verificado con `npm run build` en Turbopack: 21 rutas compiladas con código de salida `0`.

### Hito 31: Disposición Horizontal de Redes Sociales y Página Web con Enlaces Dinámicos
- **Requerimiento:**
  Ubicar los iconos/logos de Facebook, Instagram y Página Web en la sección de información de la carta digital de forma 100% horizontal uno al lado del otro (en móviles y escritorio), enlazados a las URLs configuradas en el admin, abriendo las páginas correspondientes al ser tocados.
- **Solución Implementada:**
  - En `PublicMenuClient.tsx`, se reestructuró la sección de Redes Sociales sustituyendo el grid apilado de una sola columna móvil (`grid-cols-1 sm:grid-cols-3`) por una cuadrícula horizontal de tres columnas fijas (`grid grid-cols-3 gap-2 sm:gap-3.5`).
  - Se implementó la función auxiliar `ensureExternalUrl` para garantizar que cualquier URL introducida en el admin (incluso sin prefijo `https://`) sea tratada como enlace externo absoluto hacia una nueva pestaña (`target="_blank" rel="noopener noreferrer"`).
  - Cada icono cuenta con su contenedor táctil de alta visibilidad:
    - **Facebook:** Logotipo oficial vectorizado con fondo brand blue `#1877F2`.
    - **Instagram:** Glifo oficial vectorizado con gradiente auténtico de la marca (`#f09433`, `#dc2743`, `#bc1888`).
    - **Página Web:** Icono `Globe` estilizado en tonos dorados/ámbar de Pío Pío.
  - En `src/app/menu/page.tsx`, se incluyeron `facebookUrl`, `instagramUrl` y `websiteUrl` en la precarga SSR de `settings` para disponibilidad inmediata en la renderización inicial.
- **Certificación Técnica:**
  - Compilación exitosa en Turbopack (`npm run build`), 21/21 rutas verificadas sin errores.

### Hito 32: Ocultamiento Exclusivo de la Portada en la Sección de Promociones
- **Requerimiento:**
  En la sección de promociones del menú (`activeTab === "promos"`), quitar/ocultar la portada (carrusel de fotos, logotipo grande, eslogan y buscador) de forma exclusiva para esa sección, de modo que la pantalla inicie directamente con el título institucional *"🔥 Promociones & Especiales Pío Pío"* y las tarjetas de promoción y ofertas del día, tal como se especificó en la imagen de referencia.
- **Solución Implementada:**
  - En `PublicMenuClient.tsx`, se condicionó la renderización de `PublicHeader` con `{activeTab !== "promos" && <PublicHeader ... />}`, preservando la portada intacta en las pestañas de **Menú** e **Info**.
  - Se ajustó el espaciado superior del contenedor principal `main` para que al estar en la pestaña de promociones aplique `pt-5 sm:pt-6`, garantizando una presentación visual limpia y perfectamente separada del borde superior del móvil.
  - Se añadió en `handleTabChange` el desplazamiento instantáneo a la cima (`window.scrollTo({ top: 0, behavior: "instant" })`) al entrar a la sección de promociones.
- **Certificación Técnica:**
  - Compilación exitosa en Turbopack (`npm run build`), 21/21 rutas verificadas sin errores.

### Hito 33: Navegación de Categorías con Swipe Táctil, Filtros de Estado y Distintivos en Gestión de Platos
- **Requerimiento:**
  En el panel administrativo (`/admin/dishes`):
  1. Agregar el mismo efecto de desplazamiento/scroll y swipe táctil de derecha a izquierda implementado en el menú público para navegar entre categorías.
  2. Mostrar visiblemente la etiqueta de distintivo (*badge*: Más Vendido, Recomendado, Nuevo, Oferta Especial) en cada plato si la tiene asignada.
  3. Implementar filtros de estado: *Todos*, *Disponibles*, *Agotados* y *Promos* (en el filtro de promos deben aparecer los platos con descuento activo y los que tienen distintivo asignado).
- **Solución Implementada:**
  - En `src/app/admin/dishes/page.tsx`:
    - **Filtros de Estado Rápido:** Se añadió una barra superior con las opciones *Todos*, *Disponibles* (`isAvailable: true`), *Agotados* (`isAvailable: false`) y *Promos & Distintivos* (`(discountPrice > 0) || (badge && badge !== 'NONE')`), con contadores dinámicos para cada grupo.
    - **Visualización de Distintivos:** En la ficha de cada plato se incluyeron badges oficiales con iconos y estilos acordes: `🔥 Más Vendido`, `⭐ Recomendado`, `✨ Nuevo`, `🏷️ Oferta Especial` y `🏷️ En Descuento` con precio tachado.
    - **Efecto de Desplazamiento y Swipe Horizontal:**
      - Se implementó el soporte táctil con `onTouchStart`, `onTouchMove` y `onTouchEnd` con seguimiento elástico (`dragOffset`) y animaciones de entrada (`slide-in-from-right-8` y `slide-in-from-left-8`).
      - Se integró el carrusel horizontal de chips con centrado automático suave (`container.scrollTo({ left, behavior: 'smooth' })`).
      - Se incorporó la barra de navegación con botones *Anterior* y *Siguiente* para alternar entre categorías con un toque.
- **Certificación Técnica:**
  - Compilación exitosa en Turbopack (`npm run build`), 21/21 rutas verificadas sin errores.

### Hito 34: Plataforma Móvil para Meseros, Control de Mesas Centralizado y Caja de 1 Clic
- **Objetivo Cumplido:**
  Implementación completa del nuevo rol y flujo operativo de Salón y Caja para Pío Pío: sin pantallas en cocina (los meseros cantan los pedidos directo a los fogones), unificación de pedidos en una sola cuenta activa por mesa con rondas, y cobro centralizado exclusivo en Caja con liberación inmediata de 1 solo clic para garantizar cero errores y cero pérdidas.
- **Base de Datos y Modelado en Neon PostgreSQL (`prisma/schema.prisma`):**
  - Modelo `Waiter`: `id`, `name`, `pin` (4 dígitos), `isActive`, `createdAt`.
  - Modelo `TableSession`: `id`, `tableNumber`, `status` (`OPEN`, `PENDING_CONFIRMATION`, `BILL_REQUESTED`, `CLOSED`), `waiterId`, `total` (Float), `closedAt`, `closedBy`, con índices optimizados en `status`, `[tableNumber, status]` y `closedAt`.
  - Modelo `OrderItem`: `id`, `tableSessionId`, `dishId`, `dishName` (congelado), `portionLabel`, `unitPrice` (congelado), `quantity`, `subtotal`, `notes`, `addedBy` (`CUSTOMER_QR`, `WAITER`, `ADMIN_CASHIER`), `addedByName`, `round` (contador de rondas), `status` (`PENDING_CONFIRMATION`, `CONFIRMED`, `CANCELLED`), `cancelledReason`, `createdAt`.
  - Modelo `RestaurantSettings`: extendido con `totalTables Int @default(15)` para dibujo dinámico de cuadrícula de mesas.
  - Sincronización completa con Neon PostgreSQL mediante `npx prisma db push` y clientes Prisma regenerados.
- **Arquitectura de APIs RESTful:**
  - `GET /api/tables`: Devuelve cuadrícula de mesas 1..totalTables, sesiones activas, minutos de apertura, contadores rápidos en semáforo e historial de transacciones cerradas hoy.
  - `POST /api/tables/order`: Normaliza el número de mesa (`String(parseInt)`), verifica sesión abierta (si ya existe comanda, añade a ella incrementando el contador de ronda `round = maxRound + 1`), calcula subtotales y actualiza el total acumulado. Si viene de `CUSTOMER_QR` entra en `PENDING_CONFIRMATION`.
  - `PATCH /api/tables/[sessionId]/confirm`: Confirma o rechaza pedidos enviados por clientes vía QR.
  - `PATCH /api/tables/items/[itemId]/cancel`: Anulación de ítem con motivo auditado obligatorio (`cancelledReason`), recálculo automático del total de la comanda (exclusivo de Admin/Caja).
  - `PATCH /api/tables/[sessionId]/transfer`: Traslado de comanda activa a otra mesa física libre.
  - `POST /api/tables/[sessionId]/checkout`: Liquidación de 1 solo clic: pasa el estado a `CLOSED`, registra `closedAt` y `closedBy`, y libera la mesa inmediatamente a `🟢 Libre`.
  - `POST /api/tables/[sessionId]/bill-request`: Notifica a la caja marcando la mesa en `BILL_REQUESTED` (🟣 Morado).
  - `GET / POST /api/admin/waiters` y `PATCH / DELETE /api/admin/waiters/[id]`: Administración completa de meseros.
  - `POST /api/waiter/auth`: Validación rápida de PIN de 4 dígitos para inicio de turno del mesero.
- **Plataforma Móvil para Meseros ([src/app/waiter/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/waiter/page.tsx)):**
  - Acceso rápido por PIN táctil en pantalla (sin contraseñas largas).
  - Cuadrícula de mesas tipo semáforo con actualización automática cada 5 segundos:
    - 🟢 Libre: opción rápida para abrir mesa y tomar pedido.
    - 🟡 Por Confirmar: alerta visual pulsante de pedido QR recibido por el cliente; permite verificar y confirmar o rechazar.
    - 🔵 Ocupada / Consumiendo: desglose de comanda por rondas con hora y autor, total en pesos COP.
    - 🟣 Pidieron Cuenta: aviso de comensal pasando a caja.
  - Panel de Adición de Platos: buscador instantáneo, selector de porciones y chips de notas rápidas (`"Sin ensalada"`, `"Bien dorado"`, `"Para llevar"`, `"Papas doradas"`).
  - Botón "Cambiar de Mesa" y botón "Cliente va a pagar a caja".
  - **Candados de Seguridad:** Sin botones para anular ítems confirmados ni para cobrar/liberar la mesa.
- **Módulo de Control de Mesas y Caja Central ([src/app/admin/tables/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/admin/tables/page.tsx)):**
  - **Pestaña 1 (Mesas Activas y Caja):** Métricas en vivo (total acumulado por cobrar en mesas, mesas libres, alertas QR), vista detallada de comanda con trazabilidad de rondas, adición de productos de último minuto directamente en caja, anulación auditada de ítems con motivo, y botón principal **"✅ Cobrar y Liberar Mesa"** de 1 clic sin formularios innecesarios.
  - **Pestaña 2 (Historial de Transacciones):** Cuentas cobradas en el día con total recaudado en caja, hora de cobro, mesa, responsable y desglose de platos.
  - **Pestaña 3 (Gestión de Meseros):** Creación y administración de meseros con su respectivo PIN de 4 dígitos.
- **Navegación del Admin Integrada:**
  - Enlace directo a *"Mesas & Caja"* (`/admin/tables`) añadido en `AdminNavSidebar.tsx`, `AdminMobileDrawer.tsx` y en la barra inferior táctil `AdminBottomBar.tsx`.
- **Integración con Carta Digital ([src/components/public/CartSheet.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/components/public/CartSheet.tsx)):**
  - Al seleccionar "En Mesa", el carrito muestra el botón de envío directo a la mesa `🍽️ Enviar Pedido a Mesa #X`.
  - Muestra tarjeta de estado de la mesa (pedido enviado a cocina) y botón para solicitar la cuenta a caja `🙋 Solicitar Cuenta a Caja`.
- **Configuración Dinámica de Mesas ([src/app/admin/settings/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/admin/settings/page.tsx)):**
  - Campo editable para definir el número total de mesas del restaurante (`totalTables`).
- **Certificación Técnica:**
  - Verificado con `npm run build` en Turbopack: 23 rutas compiladas con código de salida `0`.
  - Flujo integral verificado con script de prueba de base de datos de extremo a extremo.

### Hito 35: Blindaje de Concurrencia, Single-Flight Cache y Certificación de Pruebas de Estrés
- **Diagnóstico y Prevención de Riesgos de Alta Concurrencia:**
  - **Saturación del Pool de Conexiones en Neon PostgreSQL:** Ante avalanchas de clientes simultáneos abriendo `/menu` o `/api/public/menu`, múltiples peticiones en paralelo superaban el límite de 21 conexiones concurrentes arrojando error `P2024`.
  - **Condición de Carrera en la Misma Mesa (Race Condition):** Si 5 personas en la misma mesa envían pedidos en el mismo milisegundo por QR, las transacciones paralelas en aislamiento por defecto no veían la comanda creada por las demás, provocando duplicación de cuentas.
  - **Doble Toque Involuntario:** Riesgo de disparar dos pedidos por impaciencia en conexiones móviles lentas.
- **Soluciones de Ingeniería Implementadas:**
  1. **Single-Flight Cache en `/api/public/menu` ([src/app/api/public/menu/route.ts](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/api/public/menu/route.ts)):**
     - Memoria caché en RAM con deduplicación de promesas en vuelo (`inflightPromise`). Ante 50 clientes en el mismo milisegundo, solo se emite **1 única consulta a Neon**; las 49 restantes se resuelven de inmediato compartiendo la misma promesa en memoria sin saturar conexiones.
  2. **Bloqueo Atómico a Nivel de PostgreSQL (`pg_advisory_xact_lock`) en `POST /api/tables/order` ([src/app/api/tables/order/route.ts](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/api/tables/order/route.ts)):**
     - Se serializan las transacciones por recurso específico (`pio_table_{tableNumber}`) de forma atómica en el motor PostgreSQL. Si 5 personas piden para la Mesa 7 al mismo tiempo, la primera crea la cuenta (`round = 1`) y las siguientes 4 agregan ordenadamente sus ítems incrementando rondas (`round = 2, 3...`) y recalculando el total sin crear cuentas separadas.
     - Timeout ampliado a 30s con reintento automático y auto-unificación de contingencia en `GET /api/tables`.
  3. **Protección Anti-Doble Toque:** Cláusula inmediata `if (isSubmittingTableOrder) return;` en [CartSheet.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/components/public/CartSheet.tsx) y estados `isActionLoading` en las vistas.
  4. **Optimización SSR en `/menu` ([src/app/menu/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/menu/page.tsx)):**
     - Consultas a `category`, `promotionalModal` y `restaurantSettings` ejecutadas en un solo `Promise.all` paralelo.
- **Suite de Pruebas de Estrés Automatizada ([scripts/stress-test.ts](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/scripts/stress-test.ts)):**
  - Comando disponible en `package.json`: `npm run test:stress`.
  - Servidor in-process de producción con 4 pruebas de fuego:
    - **Prueba 1 (50 clientes concurrentes en la carta):** 50/50 peticiones exitosas (100% éxito, 0 fallos).
    - **Prueba 2 (5 comensales en Mesa #7 enviando pedidos al mismo milisegundo):** 1 sola `TableSession` creada (0 duplicadas), 5 ítems registrados, total comanda $54.000 COP idéntico a la suma matemática de subtotales (100% éxito, 0 fallos).
    - **Prueba 3 (Hora pico en salón - 15 mesas simultáneas con ciclo completo comanda y cobro):** 15/15 mesas procesadas (100% éxito, 0 fallos).
    - **Prueba 4 (Auto-limpieza de base de datos):** 100% de mesas restauradas a 🟢 Libre.
- **Certificación Técnica:**
  - `npx tsc --noEmit` completó con **0 errores** de TypeScript (panel de Problemas en 0).
  - `npm run build` en Turbopack completado con código `0` en 23 rutas.

### Hito 36: Auditoría Quirúrgica Integral, Corrección de Autenticación de Meseros y Blindaje de Acciones de Mesa
- **Auditoría de Código y Flujos Operativos:**
  - Se realizó una revisión exhaustiva de todos los módulos del aplicativo: frontend de clientes (`/` y `/menu`), plataforma táctil de meseros (`/waiter`), panel de administración y caja central (`/admin/tables`, `/admin/dashboard`, `/admin/dishes`, `/admin/categories`, `/admin/promo-modal`, `/admin/qr`, `/admin/settings`), y los 14 endpoints de API.
- **Hallazgos Críticos Identificados y Resueltos:**
  1. **Autenticación Directa por PIN Táctil en `/api/waiter/auth` ([src/app/api/waiter/auth/route.ts](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/api/waiter/auth/route.ts)):**
     - *Problema detectado:* La interfaz `/waiter` utiliza un teclado numérico táctil POS de 4 dígitos donde el mesero solo digita su PIN. Sin embargo, el endpoint exigía obligatoriamente `{ waiterId, pin }`, provocando que el ingreso por teclado numérico fallara con error 400 ("Debes seleccionar tu nombre e ingresar tu PIN").
     - *Solución:* Se actualizó el endpoint para soportar búsqueda directa por PIN activo (`prisma.waiter.findFirst({ where: { pin, isActive: true } })`) cuando no se proporciona `waiterId`, manteniendo compatibilidad con autenticaciones donde se envíe ambos parámetros.
  2. **Normalización de Acción en `/api/tables/[sessionId]/confirm` ([src/app/api/tables/[sessionId]/confirm/route.ts](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/api/tables/[sessionId]/confirm/route.ts)):**
     - *Problema detectado:* Los componentes de mesero y caja enviaban la acción en mayúsculas (`action: "CONFIRM"`), mientras que el endpoint comparaba de forma estricta contra minúsculas (`action === "confirm"`), lo que provocaba que la confirmación cayera en la rama de rechazo/cancelación.
     - *Solución:* Se implementó normalización insensible a mayúsculas/minúsculas (`String(body.action || "confirm").trim().toLowerCase() === "confirm"`), blindando la confirmación de pedidos de salón.
  3. **Normalización y Sanitización de Números de Mesa en Carrito ([src/components/public/CartSheet.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/components/public/CartSheet.tsx)):**
     - Se aseguró la sanitización de cadenas de mesa procedentes de URL (`?mesa=05` o `"Mesa 5"`) convirtiéndolas limpiamente a entero base 10 (`"5"`), evitando discrepancias de llaves primarias en la base de datos.
  4. **Panel de Control con KPIs en Vivo ([src/app/admin/dashboard/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/admin/dashboard/page.tsx)):**
     - Integración de acceso rápido a *Mesas & Caja*, tarjeta KPI interactiva con el número de mesas activas en tiempo real, y alerta pulsante automática si existen pedidos QR a la espera de confirmación en salón.
- **Certificación Técnica Final:**
  - `npx tsc --noEmit`: **0 errores** (panel de Problemas en 0).
  - `npm run build`: **23/23 rutas** compiladas exitosamente con Turbopack sin fallos.
  - `npm run test:stress`: Suite de 4 pruebas de estrés superada al 100% (50/50 clientes en catálogo, 0 cuentas duplicadas en concurrencia en la misma mesa, 15/15 mesas completadas y base de datos limpia).

### Hito 37: Rediseño Gourmet de la Plataforma de Meseros y Catálogo Táctil con Imágenes y Navegación Dinámica
- **Identidad Visual Oficial en la Plataforma del Mesero ([src/app/waiter/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/waiter/page.tsx)):**
  - **Pantalla de PIN Táctil:** Logotipo oficial de Pío Pío ampliado con resplandor dorado, tipografía gourmet ("Pío Pío Asadero & Restaurante"), badge institucional "Comandero Salón", círculos de PIN con brillo ámbar y teclado numérico ergonómico tipo POS.
  - **Barra Superior de Salón:** Logotipo oficial, nombre del mesero en turno con icono de verificación verde, indicador de hora de sincronización y botones de refresco y salida estilizados.
  - **Semáforo y Cuadrícula de Mesas:** Tarjetas de mesa táctiles de 145px con estados cromáticos definidos (verde libre, amarillo pulsante por confirmar, azul ocupada con total y minutos, púrpura pidiendo cuenta).
- **Catálogo Gourmet Resumido de Platos para Toma de Pedidos:**
  - **Imágenes Gastronómicas Reales:** Cada producto se muestra con su foto gastronómica de alta definición (`dish.imageUrl`), esquinas redondeadas y contador de unidades añadidas superpuesto (`x1`, `x2`, `x3`).
  - **Badges y Etiquetas Oficiales:** Distintivos `🔥 Más Vendido`, `⭐ Recomendado`, `✨ Nuevo` y etiquetas de categoría.
  - **Carrusel Horizontal de Categorías:** Barra de chips con auto-scroll centrado suave idéntica a `CategoryChips.tsx`, icono temático (`IconRenderer`), contador de platos disponibles y estado activo con degradado naranja-ámbar.
  - **Buscador Instantáneo:** Lupa integrada, placeholder descriptivo y botón de limpieza inmediata `X`.
  - **Selectores de Porción de 1 Toque:** Chips interactivos para platos con porciones (1/4, 1/2, Entero) con precio visible en COP y adición directa con feedback táctil.
- **Barra Flotante y Cajón de Comanda en Preparación (Staging Drawer):**
  - Barra flotante adherida en la parte inferior con contador de ítems y total en pesos COP.
  - Vista desplegable para ajustar cantidades (`+` / `-`), eliminar ítems y agregar **chips de notas de cocina rápidas** con 1 toque (`"Sin ensalada"`, `"Bien dorado"`, `"Papas doradas"`, `"Para llevar"`, `"Sin sal"`, `"Salsa aparte"`, `"Gaseosa fría"`, `"Sopa caliente"`).
  - Botón principal de alto contraste: **`🔥 Marchar a Cocina • $ Total COP`**.
- **Coherencia en Caja Central ([src/app/admin/tables/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/admin/tables/page.tsx)):**
  - Modal de adición de productos desde caja actualizado con imágenes gastronómicas en miniatura y badges.
- **Certificación Técnica:**
  - `npx tsc --noEmit` completado con **0 errores**.
  - Cambios confirmados a nivel local.

### Hito 38: Carrito con Quitado Rápido, Confirmación Definitiva y Barra Inferior de Navegación en Salón
- **Gestión Completa del Carrito de Pedido para Meseros ([src/app/waiter/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/waiter/page.tsx)):**
  - **Quitar Platos del Pedido antes de Confirmar:**
    - Botón de basurero `Trash2` explícito por cada producto en el carrito desplegable para remover platos de un toque.
    - Controles interactivos `+` y `-` tanto en el carrito desplegable como directamente en la tarjeta del catálogo (`[-] cant [+]`) para sumar o restar porciones al instante sin rodeos.
    - Opción de *"Vaciar todo"* para reiniciar la comanda en preparación si el cliente cambia de parecer.
  - **Botón Explícito "Confirmar Pedido":**
    - Se integró el botón principal de gran tamaño y degradado verde: **`✅ Confirmar Pedido • $ Total COP`**.
  - **Bloqueo Definitivo tras la Confirmación:**
    - Una vez que el mesero presiona *"Confirmar Pedido"*, la comanda se marcha a cocina y se fija en la cuenta de la mesa.
    - En el detalle de la mesa ocupada, los productos confirmados se muestran bloqueados con el icono de candado `🔒 Fijada en Caja` e indicador `✓ En marcha`.
    - Se elimina cualquier opción de quitar o borrar productos confirmados para el rol de mesero (garantía de cero fugas; cualquier anulación debe realizarse en Caja por el Administrador con motivo registrado).
- **Barra de Navegación Inferior Móvil (Bottom Navigation Bar):**
  - Barra fija en la parte inferior de la pantalla con efecto *glassmorphism* y 5 secciones ergonómicas:
    1. **Salón (`LayoutGrid`):** Cuadrícula completa de mesas 1..totalTables con su semáforo en vivo.
    2. **Por Confirmar (`AlertCircle`):** Filtro directo de mesas con pedidos QR enviados por clientes (con badge numérico parpadeante si hay alertas).
    3. **Ocupadas (`Utensils`):** Filtro de mesas activas consumiendo en salón.
    4. **Carta (`BookOpen`):** Vista de consulta rápida del catálogo, fotos, precios y porciones para resolver dudas de clientes al instante.
    5. **Mi Turno (`UserCheck`):** Resumen del turno del mesero, mesas asignadas y botón para cerrar turno.
- **Certificación Técnica:**
  - `npx tsc --noEmit`: 0 errores.
  - Servidor de desarrollo respondiendo en HTTP 200 OK.

### Hito 39: Tarjetas de Mesas Rectangulares Compactas y Barra de Navegación Inferior Permanente
- **Diseño de Tarjetas de Mesas Rectangulares y Apaisadas ([src/app/waiter/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/waiter/page.tsx)):**
  - **Reducción de Altura y Proporción 2:1:** Se redujo la altura de `min-h-[145px]` a `min-h-[82px] sm:min-h-[88px]`, eliminando el aspecto cuadrado y otorgándoles un formato rectangular apaisado mucho más compacto y ergonómico.
  - **Estructura Interna Horizontal:**
    - Fila superior: Número de mesa en negrita (`MESA #05`), tiempo transcurrido en minutos (`12m`) y punto semafórico pulsante de estado.
    - Fila inferior con división sutil: estado (`🟢 Libre`, `🟡 Pedido QR`, total en pesos COP `$ 48.000` con contador de productos, o `🟣 Por Pagar`).
    - En pantallas móviles entran más del doble de mesas a la vista sin requerir desplazamientos largos.
- **Barra de Navegación Inferior Siempre Visible en Todas las Vistas:**
  - La barra de navegación inferior se elevó a capa prioritaria `z-50` fija permanente (`fixed bottom-0 inset-x-0 h-16`).
  - Todas las vistas modales (Catálogo de toma de pedidos `showAddDishModal`, Detalle de Mesa `selectedTable`, y Cambio de Mesa `showTransferModal`) respetan la cota inferior mediante `bottom-16 z-40`, permitiendo que la barra inferior nunca quede cubierta ni bloqueada.
  - La barra flotante del carrito de pedidos se ancló a `bottom-16 z-45` posicionándose armónicamente justo encima de la barra de navegación.
  - El mesero puede pulsar cualquier pestaña de la barra inferior en cualquier momento para alternar vistas al instante sin quedarse atrapado.
- **Certificación Técnica:**
  - `npx tsc --noEmit`: 0 errores de TypeScript.
  - Verificado con `Invoke-WebRequest` en HTTP 200 OK.
  - Cambios confirmados a nivel local en Git.

### Hito 40: Ajuste de Densidad Cromática Translúcida y Opaca en Tarjetas de Mesas y Filtros Rápidos
- **Calibración de Colores Semafóricos Translúcidos y Opacos ([src/app/waiter/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/waiter/page.tsx) y [src/app/admin/tables/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/admin/tables/page.tsx)):**
  - **Atenuación de Saturación:** A solicitud del usuario para evitar contrastes estridentes o que cansen la vista, se sustituyeron los gradientes de alta saturación por tonalidades oscuras ahumadas con tinte translúcido del 25%-35% y bordes luminosos sutiles:
    - 🟢 **Mesa Libre:** Fondo esmeralda oscuro translúcido (`bg-emerald-950/25 border-emerald-500/30 hover:bg-emerald-950/35 hover:border-emerald-500/60`), punto indicador verde brillante y texto `🟢 Libre` + `Abrir →`.
    - 🟡 **Pedido QR por Confirmar:** Fondo ámbar ahumado translúcido (`bg-amber-950/40 border-2 border-amber-500/80`), animación de pulso suave (`animate-pulse shadow-amber-500/10`) y llamada `🟡 Pedido QR` + `Confirmar →`.
    - 🔵 **Mesa Ocupada:** Fondo azul marino oscuro translúcido (`bg-blue-950/30 border-blue-500/40 hover:bg-blue-950/40 hover:border-blue-500/70`), tiempo transcurrido en gris suave (`Clock 14m`), total comanda en dorado ámbar (`text-amber-400 font-black`) y contador de productos.
    - 🟣 **Pidiendo Cuenta / Por Pagar:** Fondo púrpura ahumado translúcido (`bg-purple-950/35 border-2 border-purple-500/70`), animación de pulso y total acumulado.
  - **Mesa Seleccionada en Caja Central:** Resaltada con anillo dorado ámbar sutil (`ring-2 ring-amber-400 border-amber-400 shadow-lg scale-[1.02]`).
- **Tarjetas Rectangulares Apaisadas Compactas en Ambos Paneles:**
  - Formato rectangular 2:1 (`min-h-[82px] sm:min-h-[88px] p-3 rounded-2xl`), visualizando hasta 20 mesas simultáneamente en pantalla sin scroll excesivo.
- **Métricas Interactivas y Filtro Rápido por Chips en Caja Central:**
  - Las 4 tarjetas de métricas superiores (`Total por Cobrar`, `Pidiendo Cuenta`, `Pedidos QR`, `Mesas Libres`) permiten alternar el filtro con 1 toque.
  - Barra horizontal de chips de filtrado: `Todas (X)`, `🟢 Libres (X)`, `🟡 QR x Confirmar (X)`, `🔵 Ocupadas (X)` y `🟣 Pidiendo Cuenta (X)`.
- **Garantía de Menú Inferior Fijo y Scroll Seguro:**
  - Barra de navegación inferior móvil (`z-50 h-16`) siempre visible e interactiva. Contenedor principal con `pb-24` para desplazamiento fluido sin solapamientos.
- **Certificación Técnica:**
  - `npx tsc --noEmit`: **0 errores** de TypeScript.
  - Servidor local respondiendo en HTTP 200 en `/waiter` y `/admin/tables`.

### Hito 41: Botón de Pedido en la Barra Inferior del Mesero y Pantalla Completa de Comanda
- **Integración de Botón "Pedido" en Barra Inferior Móvil ([src/app/waiter/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/waiter/page.tsx)):**
  - Se añadió la pestaña **Pedido** (`ShoppingBag`) a la barra de navegación permanente `Bottom Navigation Bar`.
  - **Comportamiento idéntico al carrito del menú:** A medida que el mesero va sumando platos en cualquier sección, el botón refleja en tiempo real un badge flotante dinámico parpadeante en degradado dorado/naranja (`bg-gradient-to-r from-amber-500 to-orange-500`) con el total de platos acumulados (`stagedCount`).
  - **Botón Flotante Resumen en Catálogo:** Durante la toma de pedidos (`showAddDishModal`), se desplegó un botón flotante resumen tipo píldora (`[X] Ver Pedido Completo • $ Total COP`) idéntico a `CartFloatingButton` para un acceso táctil inmediato con el pulgar.
- **Vista de Pantalla Completa de Todo el Pedido (`activeBottomNav === "order"`):**
  - **Cabecera Institucional:** Nombre de la comanda con mesa asignada (`Mesa #X`), badge de total de platos, nombre del mesero y botón directo para seguir agregando platos.
  - **Lista Amplia de Productos:**
    - Miniatura fotográfica gastronómica real de cada plato.
    - Nombre del plato y porción seleccionada (`1/4`, `1/2`, `Entero`).
    - Controles táctiles de cantidad `[-] cant [+]`.
    - Botón de basurero `Trash2` para quitar platos de forma instantánea.
    - Chips de notas rápidas de cocina (`Sin ensalada`, `Bien dorado`, `Para llevar`, etc.) concatenables con 1 toque.
    - Campo de texto libre para notas especiales de cocina.
  - **Resumen Financiero y Confirmación Definitiva:**
    - Subtotal, desglose de ítems y Total a Confirmar en pesos COP.
    - Botón principal de alto impacto: **`✅ Confirmar Pedido • $ Total COP`**, que envía la comanda a cocina y la fija en la cuenta de la mesa.
  - **Estado Vacío Amigable:** Si el mesero ingresa a la pestaña Pedido sin platos en borrador, se presenta un estado visual elegante que lo invita a seleccionar una mesa en el salón.
- **Certificación Técnica:**
  - `npx tsc --noEmit`: **0 errores** de TypeScript.
  - Servidor local respondiendo en HTTP 200 OK en `/waiter`.

### Hito 42: Navegación Focalizada por Mesas en Admin y Operaciones Dentro de Cada Mesa
- **Eliminación de Datos de Cobro en Fondo de Página ([src/app/admin/tables/page.tsx](file:///c:/Users/liber/OneDrive/Desktop/APP_WEB_ASADERO_RESTAURANTE/src/app/admin/tables/page.tsx)):**
  - Se eliminó el bloque de detalle de cobro que aparecía desarticulado debajo de las tarjetas de mesas en la página principal, dejando la vista del salón limpia, espaciosa y sin scroll forzado.
  - Las tarjetas de mesa en la cuadrícula ahora muestran solo la información esencial de reconocimiento (`Mesa #X`, pulso semafórico de estado y llamada de entrada: `🟢 Libre • Abrir →`, `🟡 QR x Confirmar • Revisar →`, `🔵 Ocupada • Entrar →`, `🟣 Pidió Cuenta • Cobrar →`).
- **Entrada Focalizada a Cada Mesa (Modal Superpuesto Centrado `z-50`):**
  - Al hacer clic o tap sobre cualquier mesa, el administrador entra inmediatamente a ella en un modal enfocado idéntico al de la plataforma del mesero.
  - **Operaciones completas dentro de la mesa:**
    - **Si la mesa está Libre:** Opción de abrir la mesa y cargar comanda directa desde caja (`+ Abrir Mesa y Tomar Comanda`).
    - **Si tiene Pedido QR por confirmar:** Botones directos `Confirmar y Marchar a Cocina` o `Rechazar`.
    - **Si tiene comanda activa (Ocupada o Pidiendo Cuenta):**
      - Desglose exhaustivo de productos ordenados por rondas de servicio con fotos, porciones, notas y origen (`Mesero`, `QR`, `Caja`).
      - Botón de anulación de plato con motivo obligatorio de auditoría (`Trash2`).
      - Botón **`+ Agregar Productos`** (catálogo con fotos reales para sumar platos desde caja).
      - Botón **`🔄 Cambiar de Mesa`** (modal con selector de mesas libres para trasladar cuentas en 1 toque).
      - Resumen financiero de la cuenta.
      - **Selector de método de pago del cliente:** `💵 Efectivo`, `📱 Nequi / Bancolombia`, `💳 Tarjeta / Datáfono`.
      - Botón principal de cobro: **`✅ Cobrar $XX.XXX y Liberar Mesa #X`**, que finaliza la cuenta, libera la mesa al salón y registra la transacción en el historial del día.
- **Certificación Técnica:**
  - `npx tsc --noEmit`: **0 errores** de TypeScript.
  - Rutas `/admin/tables` y `/waiter` operando con HTTP 200 OK.

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

