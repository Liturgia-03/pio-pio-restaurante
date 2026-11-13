# 🍗 Pío Pío - Asadero y Restaurante
## Sistema de Menú Digital y Panel Administrativo Mobile-First

Aplicación web integral desarrollada a la medida para **Pío Pío Asadero y Restaurante**, basada en la carta física y el logo oficial del negocio. Combina una **Carta Digital Mobile-First** ultrarrápida para los comensales mediante código QR en mesa, y un **Panel Administrativo Ergonómico** para que el staff y la cocina gestionen disponibilidad, precios y promociones en tiempo real con una sola mano.

---

## 🚀 Inicio Rápido

### 1. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
- **Local:** [http://localhost:3000](http://localhost:3000)
- **Móvil en red Wi-Fi:** `http://<tu-ip-local>:3000`

### 2. Acceso al Panel Administrativo
- **URL:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Correo:** `admin@asaderopiopio.com`
- **Contraseña:** `PioPio2026*`

---

## 📋 Carta y Estructura Basada en las Fotos de Pío Pío

El menú digital ha sido configurado con las **9 categorías oficiales**, platos reales y precios exactos tomados de la carta física:

1. **Pollo Completo, Medios y Cuartos:**
   - *Pollo Asado:* Completo ($43.000) \| Medio ($25.000) \| Cuarto ($14.000)
   - *Pollo Apanado:* Completo ($45.000) \| Medio ($25.000) \| Cuarto ($15.000)
2. **Combos de Pollo** (con papas y ensalada):
   - Combo Asado Pechuga y Ala ($22.000)
   - Combo Asado Muslo y Contramuslo ($21.000)
   - Combo 1/4 Asado ($12.000)
   - Combo Apanado Pechuga y Ala ($21.000)
   - Combo Apanado Muslo y Contramuslo ($21.000)
   - Combo Apanado Pechuga ($18.000)
   - Combo Apanado Muslo / Contramuslo ($17.000)
3. **Asados a la Brasa** (con papas a la francesa, arepa con queso y ensalada):
   - Mixto de Carnes ($45.000)
   - Punta de Anca ($33.000)
   - Churrasco ($33.000)
   - Lomo de Cerdo ($33.000)
   - Filete de Pechuga ($28.000)
   - Chuzo de Carne ($25.000)
4. **Platos Típicos:**
   - Bandeja Paisa Completa ($30.000)
   - Trucha Frita ($30.000)
   - Tilapia Frita ($30.000)
   - Sancocho de Res ($18.000)
   - *Cazuela de Fríjol y Mondongo:* Marcados con switch de "Agotado por hoy".
5. **Bandejas del Día** (con sopa, arroz, frijoles, huevo, ensalada y jugo):
   - Bandeja 1/4 Pollo Asado ($25.000)
   - Bandeja Res ($20.000) \| Cerdo ($20.000) \| Chicharrón ($20.000)
   - Bandeja Económica 1/4 Apanado ($15.000)
6. **Sopa y Porciones:**
   - Consomé de Menudencias ($10.000) \| Consomé de Pescado ($10.000)
   - Frijoles ($10.000) \| Arroz Mixto ($9.000) \| Papas Francesa ($6.000) \| Ensalada ($8.000) \| Arroz ($3.000)
7. **Desayunos:**
   - Calentados con Chorizo ($17.000), Carne ($17.000) y Huevos ($14.000)
   - Huevos con Salchicha ($11.500) \| Arepa con Pajarilla ($8.500)
8. **Menú Infantil:**
   - Salchipapas Pío Pío ($12.000) \| Nuggets de Pollo
9. **Bebidas y Jugos:**
   - Gaseosa Familiar ($15.000) \| Milo Frío ($8.000) \| Jugos en Leche ($8.000) y Agua ($7.000) \| Gaseosa Personal ($4.000) \| Jugo del Día ($1.500)

---

## 💡 Ventajas Clave sobre la Carta Física de Papel

| Problema en la Carta Física | Solución en la Carta Digital Pío Pío |
| :--- | :--- |
| **Platos agotados con cinta adhesiva y tachones con "X"** (ej. Mondongo, Cazuela, Nuggets, Limonadas) | El cocinero o administrador toca el interruptor en `/admin/dishes` y el plato se desatura discretamente con aviso *"Agotado por hoy"*, sin dañar la imagen del restaurante. |
| **Cambios de precios con stickers pegados encima** | Se modifican al instante en segundos desde el celular del administrador. |
| **Promociones o plato del día invisibles** | **Modal Promocional Flotante** automático al abrir el menú en mesa ("Especial Pío Pío de Hoy"). |
| **Mesas sin carta o cartas desgastadas** | **Generador de QR para Mesas (`/admin/qr`)** que permite imprimir elegantes tarjetas acrílicas para cada mesa (`Mesa #01`, `Mesa #02`, etc.). |
| **Fotos genéricas o sin fotos** | Soporte para subir fotos reales tomadas directamente desde la cámara del celular del staff a través de `/api/upload`. |

---

## 🛠️ Comandos de Mantenimiento

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo en Turbopack |
| `npm run build` | Compila y optimiza la aplicación para producción |
| `npm run db:seed` | Restaura el menú completo oficial de Pío Pío con precios actualizados |
| `npm run db:studio` | Abre el gestor visual de la base de datos |

---

## 📚 Documentación y Bitácora del Proyecto

1. **[DOCUMENTO_DE_SEGUIMIENTO.md](./DOCUMENTO_DE_SEGUIMIENTO.md)**: Bitácora viva y registro maestro de seguimiento continuo del proyecto con el historial de requerimientos, soluciones implementadas, inventario de componentes y protocolo de continuidad para sesiones futuras.
2. **[documentacion_tecnica_menu_y_dashboard.md](./documentacion_tecnica_menu_y_dashboard.md)**: Arquitectura técnica detallada, esquemas de base de datos y contratos de endpoints REST.

