import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateMenu() {
  console.log("--- ACTUALIZANDO MENÚ REAL DE PÍO PÍO ---");

  // 1. Limpiar porciones, platos y categorías antiguas
  console.log("Limpiando categorías, platos y porciones anteriores...");
  await prisma.dishPortion.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.category.deleteMany();

  // 2. CREACIÓN DE LAS 10 CATEGORÍAS REALES
  console.log("Creando 10 categorías oficiales...");

  const catEspecialidadesPollo = await prisma.category.create({
    data: {
      name: "Especialidades de Pollo",
      slug: "especialidades-de-pollo",
      description: "Pollo asado dorado al punto y apanado extra crujiente por presas y enteros",
      iconName: "Flame",
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      sortOrder: 1,
      isActive: true,
    },
  });

  const catCombosCrocantes = await prisma.category.create({
    data: {
      name: "Combos Crocantes (Pollo Apanado)",
      slug: "combos-crocantes",
      description: "Piezas apanadas extra crujientes acompañadas de papas a la francesa y ensalada fresca",
      iconName: "Flame",
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      sortOrder: 2,
      isActive: true,
    },
  });

  const catCombosAsados = await prisma.category.create({
    data: {
      name: "Combos Asados de la Casa",
      slug: "combos-asados",
      description: "Presas asadas tradicionales de la casa con papas a la francesa y ensalada fresca",
      iconName: "Flame",
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      sortOrder: 3,
      isActive: true,
    },
  });

  const catSopasArroces = await prisma.category.create({
    data: {
      name: "Sopas, Arroces y Acompañamientos",
      slug: "sopas-arroces-y-acompanamientos",
      description: "Consomés calientes de menudencias y pescado, arroces especiales y porciones caseras",
      iconName: "Soup",
      imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
      sortOrder: 4,
      isActive: true,
    },
  });

  const catDesayunos = await prisma.category.create({
    data: {
      name: "Desayunos Tradicionales",
      slug: "desayunos-tradicionales",
      description: "Calentados campesinos, huevos al gusto y arepas tradicionales de la mañana",
      iconName: "Coffee",
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
      sortOrder: 5,
      isActive: true,
    },
  });

  const catCortesPlancha = await prisma.category.create({
    data: {
      name: "Cortes y Asados a la Plancha",
      slug: "cortes-y-asados-a-la-plancha",
      description: "Punta de anca, churrasco, lomo de cerdo y parrilladas con arepa con queso gratinado",
      iconName: "UtensilsCrossed",
      imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=800&auto=format&fit=crop",
      sortOrder: 6,
      isActive: true,
    },
  });

  const catSaboresTierra = await prisma.category.create({
    data: {
      name: "Sabores de Nuestra Tierra (Platos Típicos)",
      slug: "sabores-de-nuestra-tierra",
      description: "Bandeja paisa tradicional, trucha dorada, tilapia frita y especialidades autóctonas",
      iconName: "UtensilsCrossed",
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop",
      sortOrder: 7,
      isActive: true,
    },
  });

  const catBandejasCompletas = await prisma.category.create({
    data: {
      name: "Bandejas Completas",
      slug: "bandejas-completas",
      description: "Servidas con arroz blanco, frijol, tajada de maduro, ensalada, limonada y consomé",
      iconName: "Salad",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop",
      sortOrder: 8,
      isActive: true,
    },
  });

  const catMenuInfantil = await prisma.category.create({
    data: {
      name: "Menú Infantil",
      slug: "menu-infantil",
      description: "Especiales favoritos y crocantes pensados para los más pequeños",
      iconName: "Sparkles",
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=800&auto=format&fit=crop",
      sortOrder: 9,
      isActive: true,
    },
  });

  const catBebidas = await prisma.category.create({
    data: {
      name: "Bebidas Refrescantes",
      slug: "bebidas-refrescantes",
      description: "Jugos naturales en leche y agua, limonadas, gaseosas familiares y personales",
      iconName: "Beer",
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop",
      sortOrder: 10,
      isActive: true,
    },
  });

  // 3. CREACIÓN DE PLATOS
  console.log("Insertando platos por categoría...");

  // CATEGORÍA 1: Especialidades de Pollo
  const pPolloAsadoEntero = await prisma.dish.create({
    data: {
      categoryId: catEspecialidadesPollo.id,
      name: "Pollo Asado Entero",
      slug: "pollo-asado-entero",
      description: "Jugoso pollo dorado al punto con el sazón clásico de la casa, acompañado de suaves papas al vapor, arepa frita y tajadas de maduro frito.",
      basePrice: 45000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "Para 3 a 4 personas",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catEspecialidadesPollo.id,
      name: "Medio Pollo Asado",
      slug: "medio-pollo-asado",
      description: "Medio pollo asado con el sabor tradicional de la casa, servido con papas al vapor, arepa frita y maduro frito.",
      basePrice: 25000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Para 2 personas",
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catEspecialidadesPollo.id,
      name: "Cuarto de Pollo Asado",
      slug: "cuarto-de-pollo-asado",
      description: "Un cuarto de nuestro pollo asado tradicional, acompañado de papa al vapor y arepa frita.",
      basePrice: 14000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catEspecialidadesPollo.id,
      name: "Pollo Apanado Entero",
      slug: "pollo-apanado-entero",
      description: "Pollo entero en piezas con un apanado dorado y extra crocante por fuera, servido con papas al vapor, arepa frita y maduro frito.",
      basePrice: 46000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "Para 3 a 4 personas",
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catEspecialidadesPollo.id,
      name: "Medio Pollo Apanado",
      slug: "medio-pollo-apanado",
      description: "Medio pollo apanado crujiente por fuera y jugoso por dentro, acompañado de papas al vapor, arepa frita y maduro frito.",
      basePrice: 25000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Para 2 personas",
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catEspecialidadesPollo.id,
      name: "Cuarto de Pollo Apanado",
      slug: "cuarto-de-pollo-apanado",
      description: "Un cuarto de pollo apanado crocante al estilo de la casa, servido con papa al vapor y arepa frita.",
      basePrice: 15000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 6,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catEspecialidadesPollo.id,
      name: "Pechuga Apanada Individual",
      slug: "pechuga-apanada-individual",
      description: "Porción individual de pechuga apanada doradita y crujiente, acompañada de papa al vapor y arepa frita.",
      basePrice: 8000,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 7,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catEspecialidadesPollo.id,
      name: "Contramuslo Apanado Individual",
      slug: "contramuslo-apanado-individual",
      description: "Pieza individual de contramuslo apanado jugoso y crocante, servida con papa al vapor y arepa frita.",
      basePrice: 7000,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 8,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catEspecialidadesPollo.id,
      name: "Muslo Apanado Individual",
      slug: "muslo-apanado-individual",
      description: "Pieza individual de muslo apanado al punto perfecto, acompañado de papa al vapor y arepa frita.",
      basePrice: 6500,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 9,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catEspecialidadesPollo.id,
      name: "Ala Apanada Individual",
      slug: "ala-apanada-individual",
      description: "Pieza individual de ala apanada extra crocante, servida con papa al vapor y arepa frita.",
      basePrice: 5500,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 10,
    },
  });

  // CATEGORÍA 2: Combos Crocantes (Pollo Apanado)
  await prisma.dish.create({
    data: {
      categoryId: catCombosCrocantes.id,
      name: "Combo Crujiente de Muslo",
      slug: "combo-crujiente-de-muslo",
      description: "Muslo de pollo apanado extra crocante, acompañado de papas a la francesa y ensalada fresca.",
      basePrice: 17000,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosCrocantes.id,
      name: "Combo Crujiente de Contramuslo",
      slug: "combo-crujiente-de-contramuslo",
      description: "Jugoso contramuslo apanado y dorado, servido con papas a la francesa y ensalada fresca.",
      basePrice: 17000,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosCrocantes.id,
      name: "Combo Crujiente de Ala",
      slug: "combo-crujiente-de-ala",
      description: "Ala de pollo apanada y crujiente, acompañada de papas a la francesa y ensalada fresca.",
      basePrice: 15000,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosCrocantes.id,
      name: "Combo Suprema de Pechuga Apanada",
      slug: "combo-suprema-de-pechuga-apanada",
      description: "Generosa porción de pechuga apanada doradita, acompañada de papas a la francesa y ensalada fresca.",
      basePrice: 18000,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosCrocantes.id,
      name: "Combo Doble Presa (Muslo y Contramuslo)",
      slug: "combo-doble-presa-muslo-y-contramuslo",
      description: "Combinación de muslo y contramuslo apanados, servidos con papas a la francesa y ensalada fresca.",
      basePrice: 22000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "CHEFS_SPECIAL",
      servings: "Individual",
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosCrocantes.id,
      name: "Combo Especial Crujiente (Pechuga y Ala)",
      slug: "combo-especial-crujiente-pechuga-y-ala",
      description: "Porción de pechuga y ala apanadas al punto perfecto, acompañadas de papas a la francesa y ensalada fresca.",
      basePrice: 22000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "Individual",
      sortOrder: 6,
    },
  });

  // CATEGORÍA 3: Combos Asados de la Casa
  await prisma.dish.create({
    data: {
      categoryId: catCombosAsados.id,
      name: "Combo Asado Tradicional (Muslo y Contramuslo)",
      slug: "combo-asado-tradicional-muslo-y-contramuslo",
      description: "Presas de muslo y contramuslo asados con el toque de la casa, acompañados de papas a la francesa y ensalada fresca.",
      basePrice: 22000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosAsados.id,
      name: "Combo Asado Especial (Pechuga y Ala)",
      slug: "combo-asado-especial-pechuga-y-ala",
      description: "Combinación de pechuga y ala asadas y jugosas, servidas con papas a la francesa y ensalada fresca.",
      basePrice: 22000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "Individual",
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosAsados.id,
      name: "Combo Cuarto de Pollo Asado",
      slug: "combo-cuarto-de-pollo-asado",
      description: "Un cuarto de pollo asado tradicional, acompañado de papas a la francesa y ensalada fresca.",
      basePrice: 22000,
      imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      servings: "Individual",
      sortOrder: 3,
    },
  });

  // CATEGORÍA 4: Sopas, Arroces y Acompañamientos
  const dConsomeMenudencias = await prisma.dish.create({
    data: {
      categoryId: catSopasArroces.id,
      name: "Consomé Campesino de Menudencias",
      slug: "consome-campesino-de-menudencias",
      description: "Caldo sustancioso preparado con menudencias de pollo y hierbas frescas, acompañado de arepa y limón.",
      basePrice: 10000,
      imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 1,
    },
  });
  await prisma.dishPortion.createMany({
    data: [
      { dishId: dConsomeMenudencias.id, label: "Pequeño", price: 10000, isDefault: true },
      { dishId: dConsomeMenudencias.id, label: "Grande", price: 12000, isDefault: false },
    ],
  });

  const dConsomePescado = await prisma.dish.create({
    data: {
      categoryId: catSopasArroces.id,
      name: "Consomé de Pescado Fresco",
      slug: "consome-de-pescado-fresco",
      description: "Caldo reconfortante de pescado con el sazón casero tradicional, servido con arepa y limón.",
      basePrice: 10000,
      imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 2,
    },
  });
  await prisma.dishPortion.createMany({
    data: [
      { dishId: dConsomePescado.id, label: "Pequeño", price: 10000, isDefault: true },
      { dishId: dConsomePescado.id, label: "Grande", price: 12000, isDefault: false },
    ],
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasArroces.id,
      name: "Arroz Mixto Especial",
      slug: "arroz-mixto-especial",
      description: "Generosa combinación de arroz salteado con variedad de carnes seleccionadas y vegetales.",
      basePrice: 9000,
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasArroces.id,
      name: "Arroz con Pollo de la Casa",
      slug: "arroz-con-pollo-de-la-casa",
      description: "Arroz sazonado y salteado con abundante pollo desmechado y vegetales tiernos.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasArroces.id,
      name: "Cazuelita de Frijoles Tradicionales",
      slug: "cazuelita-de-frijoles-tradicionales",
      description: "Porción de frijoles caseros cocinados a fuego lento al estilo antioqueño.",
      basePrice: 10000,
      imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasArroces.id,
      name: "Porción de Papas a la Francesa Crujientes",
      slug: "porcion-de-papas-a-la-francesa-crujientes",
      description: "Porción de papas doradas y crocantes.",
      basePrice: 6000,
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 6,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasArroces.id,
      name: "Ensalada Fresca de la Casa",
      slug: "ensalada-fresca-de-la-casa",
      description: "Mezcla cremosa y fresca ideal para acompañar cualquier plato.",
      basePrice: 6000,
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 7,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasArroces.id,
      name: "Porción de Arroz Blanco",
      slug: "porcion-de-arroz-blanco",
      description: "Arroz blanco suelto y recién preparado.",
      basePrice: 3000,
      imageUrl: "https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 8,
    },
  });

  // CATEGORÍA 5: Desayunos Tradicionales
  await prisma.dish.create({
    data: {
      categoryId: catDesayunos.id,
      name: "Calentado Criollo con Chorizo",
      slug: "calentado-criollo-con-chorizo",
      description: "Mezcla tradicional de arroz y frijoles salteados, acompañado de chorizo dorado al punto y arepa.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catDesayunos.id,
      name: "Calentado Especial con Carne Asada",
      slug: "calentado-especial-con-carne-asada",
      description: "Clásico calentado de la casa servido con una jugosa porción de carne a la plancha y arepa.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catDesayunos.id,
      name: "Calentado Clásico con Huevos Fritos",
      slug: "calentado-clasico-con-huevos-fritos",
      description: "Tradicional calentado paisa coronado con dos huevos fritos al gusto y acompañado de arepa.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catDesayunos.id,
      name: "Huevos Revueltos con Salchicha",
      slug: "huevos-revueltos-con-salchicha",
      description: "Suaves huevos revueltos preparados con trozos de salchicha dorada, acompañados de arepa.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catDesayunos.id,
      name: "Arepa Asada con Pajarilla",
      slug: "arepa-asada-con-pajarilla",
      description: "Arepa tradicional dorada, servida con una porción de pajarilla sazonada y salteada al estilo criollo.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 5,
    },
  });

  // CATEGORÍA 6: Cortes y Asados a la Plancha
  await prisma.dish.create({
    data: {
      categoryId: catCortesPlancha.id,
      name: "Punta de Anca a la Plancha",
      slug: "punta-de-anca-a-la-plancha",
      description: "Corte tierno y jugoso sellado a la plancha, acompañado de papas a la francesa, ensalada fresca y arepa con queso gratinado.",
      basePrice: 33000,
      imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "CHEFS_SPECIAL",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCortesPlancha.id,
      name: "Lomo de Cerdo Jugoso",
      slug: "lomo-de-cerdo-jugoso",
      description: "Filete de lomo de cerdo dorado a la plancha, servido con papas a la francesa, ensalada fresca y arepa con queso gratinado.",
      basePrice: 33000,
      imageUrl: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCortesPlancha.id,
      name: "Churrasco Clásico",
      slug: "churrasco-clasico",
      description: "Corte seleccionado de res preparado a la plancha al término deseado, acompañado de papas a la francesa, ensalada fresca y arepa con queso gratinado.",
      basePrice: 33000,
      imageUrl: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCortesPlancha.id,
      name: "Filete de Pechuga a la Plancha",
      slug: "filete-de-pechuga-a-la-plancha",
      description: "Pechuga de pollo fileteada y asada a la plancha, acompañada de papas a la francesa, ensalada fresca y arepa con queso gratinado.",
      basePrice: 28000,
      imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCortesPlancha.id,
      name: "Parrillada Mixta de Carnes",
      slug: "parrillada-mixta-de-carnes",
      description: "Abundante selección de carnes preparadas a la plancha, servida con papas a la francesa, ensalada fresca y arepa con queso gratinado.",
      basePrice: 45000,
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCortesPlancha.id,
      name: "Chuzo Especial de Pollo a la Plancha",
      slug: "chuzo-especial-de-pollo-a-la-plancha",
      description: "Brocheta de pechuga de pollo sazonada y dorada a la plancha, acompañada de papas a la francesa, ensalada fresca y arepa con queso gratinado.",
      basePrice: 25000,
      imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 6,
    },
  });

  // CATEGORÍA 7: Sabores de Nuestra Tierra (Platos Típicos)
  await prisma.dish.create({
    data: {
      categoryId: catSaboresTierra.id,
      name: "Bandeja Paisa Tradicional",
      slug: "bandeja-paisa-tradicional",
      description: "El plato insignia de nuestra tierra con frijoles, arroz blanco, carne molida, chicharrón crocante, huevo frito, tajada de maduro, arepa y aguacate.",
      basePrice: 30000,
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "CHEFS_SPECIAL",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSaboresTierra.id,
      name: "Trucha Dorada a la Plancha",
      slug: "trucha-dorada-a-la-plancha",
      description: "Filete entero de trucha dorada a la plancha, acompañado de papas a la francesa, ensalada fresca, arepa con queso gratinado y buen limón.",
      basePrice: 33000,
      imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSaboresTierra.id,
      name: "Tilapia Frita Crocante",
      slug: "tilapia-frita-crocante",
      description: "Tilapia entera frita hasta quedar dorada y crujiente, servida con papas a la francesa, ensalada fresca, arepa con queso gratinado y buen limón.",
      basePrice: 33000,
      imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSaboresTierra.id,
      name: "Cazuela Montañera de Frijoles",
      slug: "cazuela-montanera-de-frijoles",
      description: "Frijoles tradicionales servidos con trozos de chicharrón crocante, maduritos, maicitos, aguacate y acompañados de arroz blanco y arepa.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSaboresTierra.id,
      name: "Sancocho Casero de Res",
      slug: "sancocho-casero-de-res",
      description: "Sopa tradicional con costilla y carne de res, papa, yuca, plátano y mazorca, acompañada de arroz blanco, aguacate y arepa.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSaboresTierra.id,
      name: "Sopa Tradicional de Mondongo",
      slug: "sopa-tradicional-de-mondongo",
      description: "Sustanciosa sopa de mondongo preparada al estilo de la casa, servida con arroz blanco, aguacate y arepa.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 6,
    },
  });

  // CATEGORÍA 8: Bandejas Completas
  await prisma.dish.create({
    data: {
      categoryId: catBandejasCompletas.id,
      name: "Bandeja Cuarto de Pollo Apanado",
      slug: "bandeja-cuarto-de-pollo-apanado",
      description: "Cuarto de pollo apanado crocante acompañado de arroz blanco, frijol, tajada de maduro, ensalada, limonada y consomé del día.",
      basePrice: 25000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBandejasCompletas.id,
      name: "Bandeja Cuarto de Pollo Asado",
      slug: "bandeja-cuarto-de-pollo-asado",
      description: "Cuarto de pollo asado tradicional servido con arroz blanco, frijol, tajada de maduro, ensalada, limonada y consomé del día.",
      basePrice: 25000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBandejasCompletas.id,
      name: "Bandeja con Lomo de Cerdo",
      slug: "bandeja-con-lomo-de-cerdo",
      description: "Porción de lomo de cerdo a la plancha servida con arroz blanco, frijol, tajada de maduro, ensalada, limonada y consomé del día.",
      basePrice: 20000,
      imageUrl: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBandejasCompletas.id,
      name: "Bandeja con Carne de Res",
      slug: "bandeja-con-carne-de-res",
      description: "Porción de carne de res a la plancha acompañada de arroz blanco, frijol, tajada de maduro, ensalada, limonada y consomé del día.",
      basePrice: 20000,
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBandejasCompletas.id,
      name: "Bandeja con Chicharrón Crocante",
      slug: "bandeja-con-chicharron-crocante",
      description: "Chicharrón carnudo y crocante servido con arroz blanco, frijol, tajada de maduro, ensalada, limonada y consomé del día.",
      basePrice: 20000,
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBandejasCompletas.id,
      name: "Bandeja Especial de Presa Apanada",
      slug: "bandeja-especial-de-presa-apanada",
      description: "Presa de pollo apanado acompañada de arroz blanco, frijol, tajada de maduro, ensalada, limonada y consomé del día.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 6,
    },
  });

  // CATEGORÍA 9: Menú Infantil
  await prisma.dish.create({
    data: {
      categoryId: catMenuInfantil.id,
      name: "Salchipapas Clásicas",
      slug: "salchipapas-clasicas",
      description: "Combinación de papas a la francesa crujientes con trozos de salchicha dorada y salsas al gusto.",
      basePrice: 15000,
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catMenuInfantil.id,
      name: "Nuggets de Pollo Crujientes",
      slug: "nuggets-de-pollo-crujientes",
      description: "Tiernos bocados de pechuga de pollo apanados, acompañados de papas a la francesa.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 2,
    },
  });

  // CATEGORÍA 10: Bebidas Refrescantes
  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Jugos Naturales en Leche",
      slug: "jugos-naturales-en-leche",
      description: "Cremosos batidos de fruta natural preparados en leche.",
      basePrice: 8000,
      imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Jugos Naturales en Agua",
      slug: "jugos-naturales-en-agua",
      description: "Selección de frutas frescas preparadas al instante en agua.",
      basePrice: 7000,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Jugo Natural del Día",
      slug: "jugo-natural-del-dia",
      description: "Bebida refrescante preparada con la fruta seleccionada de la jornada.",
      basePrice: 1500,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Milo",
      slug: "milo",
      description: "Bebida achocolatada fría o caliente, energizante y cremosa.",
      basePrice: 8000,
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Gaseosa Mega Familiar",
      slug: "gaseosa-mega-familiar",
      description: "Bebida gaseosa en presentación extra grande para compartir.",
      basePrice: 15000,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Gaseosa 1.5 Litros",
      slug: "gaseosa-1-5-litros",
      description: "Bebida gaseosa en botella familiar de 1.5 litros.",
      basePrice: 8000,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 6,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Gaseosa Personal",
      slug: "gaseosa-personal",
      description: "Bebida gaseosa en presentación individual.",
      basePrice: 4000,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      sortOrder: 7,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Limonada Natural Refrescante",
      slug: "limonada-natural-refrescante",
      description: "Jugo de limón recién exprimido con el punto exacto de dulzor.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 8,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Limonada Cremosa de Coco",
      slug: "limonada-cremosa-de-coco",
      description: "Combinación refrescante de limón natural y leche de coco.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 9,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Cerveza Michelada",
      slug: "cerveza-michelada",
      description: "Cerveza bien fría servida en vaso escarchado con sal y abundante jugo de limón.",
      basePrice: 0,
      imageUrl: "https://images.unsplash.com/photo-1608270199187-57ee36502392?q=80&w=800&auto=format&fit=crop",
      isAvailable: false,
      sortOrder: 10,
    },
  });

  // 4. Actualizar Modal Promocional apuntando a Pollo Asado Entero
  console.log("Actualizando modal promocional...");
  const existingPromo = await prisma.promotionalModal.findFirst();
  if (existingPromo) {
    await prisma.promotionalModal.update({
      where: { id: existingPromo.id },
      data: {
        title: "🍗 ¡ESPECIAL PÍO PÍO DE HOY!",
        subtitle: "Pollo Asado Completo + Papas + Ensalada",
        description: "¡Sabor tradicional que reúne a la familia! Disfruta nuestro pollo asado a la brasa con el adobo casero Pío Pío.",
        imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
        badgeText: "PLATO ESTRELLA",
        regularPrice: 48000,
        promoPrice: 45000,
        targetDishId: pPolloAsadoEntero.id,
        isActive: true,
      },
    });
  } else {
    await prisma.promotionalModal.create({
      data: {
        title: "🍗 ¡ESPECIAL PÍO PÍO DE HOY!",
        subtitle: "Pollo Asado Completo + Papas + Ensalada",
        description: "¡Sabor tradicional que reúne a la familia! Disfruta nuestro pollo asado a la brasa con el adobo casero Pío Pío.",
        imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
        badgeText: "PLATO ESTRELLA",
        regularPrice: 48000,
        promoPrice: 45000,
        ctaText: "Ver en la Carta",
        targetDishId: pPolloAsadoEntero.id,
        isActive: true,
        autoShowDelayMs: 800,
        showOncePerSession: true,
      },
    });
  }

  const totalCategories = await prisma.category.count();
  const totalDishes = await prisma.dish.count();
  const totalPortions = await prisma.dishPortion.count();

  console.log(`\n✅ MENÚ ACTUALIZADO CON ÉXITO:`);
  console.log(`   - Categorías creadas: ${totalCategories}`);
  console.log(`   - Platos registrados: ${totalDishes}`);
  console.log(`   - Porciones registradas: ${totalPortions}`);
}

updateMenu()
  .catch((e) => {
    console.error("Error al actualizar menú:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
