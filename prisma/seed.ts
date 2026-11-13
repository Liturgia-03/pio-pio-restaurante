import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando datos y reestructurando para Asadero & Restaurante Pío Pío...");
  await prisma.dishPortion.deleteMany();
  await prisma.promotionalModal.deleteMany();
  await prisma.restaurantSettings.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 1. Usuario Administrador de Pío Pío (con soporte para variables de entorno)
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || "admin@asaderopiopio.com";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "PioPio2026*";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Administrador Pío Pío",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`Usuario creado: ${admin.email}`);

  // 2. Categorías oficiales de Pío Pío
  const catPolloCompleto = await prisma.category.create({
    data: {
      name: "Pollo Completo, Medios y Cuartos",
      slug: "pollo-completo",
      description: "Pollo asado a la brasa y apanado crujiente en diferentes porciones",
      iconName: "Flame",
      sortOrder: 1,
      isActive: true,
    },
  });

  const catCombosPollo = await prisma.category.create({
    data: {
      name: "Combos de Pollo",
      slug: "combos-pollo",
      description: "Acompañados con papas a la francesa y ensalada fresca",
      iconName: "Flame",
      sortOrder: 2,
      isActive: true,
    },
  });

  const catAsados = await prisma.category.create({
    data: {
      name: "Asados a la Brasa",
      slug: "asados-brasa",
      description: "Con papas a la francesa, arepa con queso y ensalada de la casa",
      iconName: "UtensilsCrossed",
      sortOrder: 3,
      isActive: true,
    },
  });

  const catPlatosTipicos = await prisma.category.create({
    data: {
      name: "Platos Típicos",
      slug: "platos-tipicos",
      description: "Lo más autóctono y delicioso de nuestra gastronomía colombiana",
      iconName: "UtensilsCrossed",
      sortOrder: 4,
      isActive: true,
    },
  });

  const catBandejas = await prisma.category.create({
    data: {
      name: "Bandejas del Día",
      slug: "bandejas",
      description: "Incluye sopa, arroz, frijoles, huevo, ensalada y jugo o limonada",
      iconName: "Salad",
      sortOrder: 5,
      isActive: true,
    },
  });

  const catSopasPorciones = await prisma.category.create({
    data: {
      name: "Sopa y Porciones",
      slug: "sopa-y-porciones",
      description: "Consomés calientes, arroces, papas y acompañamientos",
      iconName: "Salad",
      sortOrder: 6,
      isActive: true,
    },
  });

  const catDesayunos = await prisma.category.create({
    data: {
      name: "Desayunos Pío Pío",
      slug: "desayunos",
      description: "Calentados campesinos, huevos al gusto y arepas tradicionales",
      iconName: "Coffee",
      sortOrder: 7,
      isActive: true,
    },
  });

  const catMenuInfantil = await prisma.category.create({
    data: {
      name: "Menú Infantil",
      slug: "menu-infantil",
      description: "Especiales favoritos para los más pequeños",
      iconName: "Sparkles",
      sortOrder: 8,
      isActive: true,
    },
  });

  const catBebidas = await prisma.category.create({
    data: {
      name: "Bebidas y Jugos",
      slug: "bebidas",
      description: "Jugos naturales en agua o leche, gaseosas y refrescos fríos",
      iconName: "Beer",
      sortOrder: 9,
      isActive: true,
    },
  });

  // 3. Platos de Pío Pío

  // CATEGORÍA 1: Pollo Completo
  const platoPolloAsado = await prisma.dish.create({
    data: {
      categoryId: catPolloCompleto.id,
      name: "Pollo Asado Pío Pío",
      slug: "pollo-asado-pio-pio",
      description: "Pollo dorado a fuego lento con el adobo secreto de la casa. Servido con papas y arepa.",
      basePrice: 43000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      isFeatured: true,
      badge: "POPULAR",
      servings: "1 a 4 personas según porción",
      sortOrder: 1,
      portions: {
        create: [
          { label: "1/4 Asado", price: 14000, isDefault: false },
          { label: "Medio Pollo Asado", price: 25000, isDefault: false },
          { label: "Pollo Completo Asado", price: 43000, isDefault: true },
        ],
      },
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catPolloCompleto.id,
      name: "Pollo Apanado Broaster Pío Pío",
      slug: "pollo-apanado-pio-pio",
      description: "Pollo apanado crocante y jugoso con la receta especial Pío Pío. Servido con papas a la francesa.",
      basePrice: 45000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      isFeatured: true,
      badge: "CHEFS_SPECIAL",
      servings: "1 a 4 personas según porción",
      sortOrder: 2,
      portions: {
        create: [
          { label: "1/4 Apanado", price: 15000, isDefault: false },
          { label: "Medio Pollo Apanado", price: 25000, isDefault: false },
          { label: "Pollo Completo Apanado", price: 45000, isDefault: true },
        ],
      },
    },
  });

  // CATEGORÍA 2: Combos Pollo
  await prisma.dish.create({
    data: {
      categoryId: catCombosPollo.id,
      name: "Combo Asado Pechuga y Ala",
      slug: "combo-asado-pechuga-ala",
      description: "Pechuga y ala asadas a la brasa con papas a la francesa y ensalada.",
      basePrice: 22000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "1 persona",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosPollo.id,
      name: "Combo Asado Muslo y Contramuslo",
      slug: "combo-asado-muslo-contramuslo",
      description: "Pierna y pernil asados con papas a la francesa y ensalada fresca.",
      basePrice: 21000,
      imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosPollo.id,
      name: "Combo 1/4 Asado Económico",
      slug: "combo-cuarto-asado",
      description: "Cuarto de pollo asado con papas a la francesa y ensalada.",
      basePrice: 12000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "PROMO",
      servings: "1 persona",
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosPollo.id,
      name: "Combo Apanado Pechuga y Ala",
      slug: "combo-apanado-pechuga-ala",
      description: "Presas apanadas crocantes con papas a la francesa y ensalada.",
      basePrice: 21000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosPollo.id,
      name: "Combo Apanado Muslo y Contramuslo",
      slug: "combo-apanado-muslo-contramuslo",
      description: "Muslo y contramuslo crocantes con papas a la francesa y ensalada.",
      basePrice: 21000,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosPollo.id,
      name: "Combo Apanado con Pechuga",
      slug: "combo-apanado-pechuga",
      description: "Pechuga apanada grande con papas y ensalada.",
      basePrice: 18000,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 6,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catCombosPollo.id,
      name: "Combo Apanado Muslo o Contramuslo",
      slug: "combo-apanado-muslo",
      description: "Presa apanada con papas a la francesa y ensalada.",
      basePrice: 17000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 7,
    },
  });

  // CATEGORÍA 3: Asados a la Brasa
  const platoMixto = await prisma.dish.create({
    data: {
      categoryId: catAsados.id,
      name: "Mixto de Carnes Pío Pío",
      slug: "mixto-de-carnes",
      description: "Parrillada mixta con res, cerdo, pechuga y chorizo. Servido con papas a la francesa, arepa con queso y ensalada.",
      basePrice: 45000,
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      isFeatured: true,
      badge: "CHEFS_SPECIAL",
      servings: "Para compartir (2 personas)",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catAsados.id,
      name: "Punta de Anca a la Brasa",
      slug: "punta-de-anca",
      description: "Corte jugoso asado a la parrilla con papas a la francesa, arepa con queso y ensalada fresca.",
      basePrice: 33000,
      imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "1 persona",
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catAsados.id,
      name: "Churrasco Tradicional",
      slug: "churrasco",
      description: "Corte de res a la parrilla al carbón con papas a la francesa, arepa con queso y ensalada.",
      basePrice: 33000,
      imageUrl: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catAsados.id,
      name: "Lomo de Cerdo a la Plancha",
      slug: "lomo-de-cerdo",
      description: "Lomo de cerdo asado a la brasa con papas a la francesa, arepa con queso y ensalada.",
      basePrice: 33000,
      imageUrl: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catAsados.id,
      name: "Filete de Pechuga de Pollo",
      slug: "filete-de-pollo",
      description: "Filete de pechuga marinada a la brasa con papas a la francesa, arepa con queso y ensalada.",
      basePrice: 28000,
      imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catAsados.id,
      name: "Chuzo de Carne Parrillero",
      slug: "chuzo-de-carne",
      description: "Brocheta parrillera de trozos de carne con papas a la francesa, arepa con queso y ensalada.",
      basePrice: 25000,
      imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 6,
    },
  });

  // CATEGORÍA 4: Platos Típicos
  await prisma.dish.create({
    data: {
      categoryId: catPlatosTipicos.id,
      name: "Bandeja Paisa Completa",
      slug: "bandeja-paisa",
      description: "Frijoles, arroz, carne molida, chicharrón crocante, huevo frito, tajada de plátano maduro, chorizo y arepa.",
      basePrice: 30000,
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "Muy abundante (1 a 2 personas)",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catPlatosTipicos.id,
      name: "Trucha Frita Dorada",
      slug: "trucha-frita",
      description: "Trucha fresca frita con arroz blanco, patacón o papas a la francesa y ensalada.",
      basePrice: 30000,
      imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catPlatosTipicos.id,
      name: "Tilapia Frita de la Casa",
      slug: "tilapia-frita",
      description: "Pescado tilapia entero dorado con arroz blanco, patacón y ensalada fresca.",
      basePrice: 30000,
      imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catPlatosTipicos.id,
      name: "Sancocho de Res Campesino",
      slug: "sancocho-de-res",
      description: "Sopa criolla tradicional con carne de res, plátano, yuca, papa y mazorca. Incluye arroz y ensalada.",
      basePrice: 18000,
      imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 4,
    },
  });

  // Platos que estaban marcados con X en la carta física (se crean como isAvailable: false)
  await prisma.dish.create({
    data: {
      categoryId: catPlatosTipicos.id,
      name: "Cazuela de Fríjol",
      slug: "cazuela-de-frijol",
      description: "Frijoles cargados con chicharrón, plátano maduro en cubos, maíz tierno y aguacate.",
      basePrice: 25000,
      imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=800&auto=format&fit=crop",
      isAvailable: false, // Marcado con X en el menú físico
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catPlatosTipicos.id,
      name: "Mondongo Tradicional",
      slug: "mondongo",
      description: "Sopa típica de callo de res cocinado lentamente con verduras y especias criollas.",
      basePrice: 20000,
      imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
      isAvailable: false, // Marcado con X en el menú físico
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 6,
    },
  });

  // CATEGORÍA 5: Bandejas del Día
  await prisma.dish.create({
    data: {
      categoryId: catBandejas.id,
      name: "Bandeja 1/4 Pollo Asado",
      slug: "bandeja-cuarto-asado",
      description: "1/4 de pollo asado con sopa del día, arroz, frijoles, huevo, ensalada y jugo o limonada.",
      basePrice: 25000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "1 persona",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBandejas.id,
      name: "Bandeja con Carne de Res",
      slug: "bandeja-res",
      description: "Carne de res asada con sopa, arroz, frijoles, huevo, ensalada y jugo.",
      basePrice: 20000,
      imageUrl: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBandejas.id,
      name: "Bandeja con Carne de Cerdo",
      slug: "bandeja-cerdo",
      description: "Filete de cerdo con sopa, arroz, frijoles, huevo, ensalada y jugo.",
      basePrice: 20000,
      imageUrl: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBandejas.id,
      name: "Bandeja con Chicharrón Crocante",
      slug: "bandeja-chicharron",
      description: "Chicharrón de cerdo carnudo y tostado con sopa, arroz, frijoles, huevo y ensalada.",
      basePrice: 20000,
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "1 persona",
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBandejas.id,
      name: "Bandeja Económica 1/4 Apanado",
      slug: "bandeja-cuarto-apanado",
      description: "1/4 de pollo apanado con sopa, arroz, frijoles, huevo, ensalada y jugo.",
      basePrice: 15000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "PROMO",
      servings: "1 persona",
      sortOrder: 5,
    },
  });

  // CATEGORÍA 6: Sopa y Porciones
  await prisma.dish.create({
    data: {
      categoryId: catSopasPorciones.id,
      name: "Consomé de Menudencias con Arepa",
      slug: "consome-de-menudencias",
      description: "Caldo criollo caliente con menudencias de pollo, cilantro y limón.",
      basePrice: 10000,
      imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 plato hondo",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasPorciones.id,
      name: "Consomé de Pescado",
      slug: "consome-de-pescado",
      description: "Caldo de pescado fresco reconfortante sazonado con hierbas naturales.",
      basePrice: 10000,
      imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 plato",
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasPorciones.id,
      name: "Porción de Fríjoles de la Casa",
      slug: "porcion-frijoles",
      description: "Fríjoles tradicionales cocinados en cazuela con toque campesino.",
      basePrice: 10000,
      imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "Porción",
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasPorciones.id,
      name: "Porción de Arroz Mixto",
      slug: "arroz-mixto",
      description: "Arroz salteado con carnes y verduras al estilo Pío Pío.",
      basePrice: 9000,
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "Porción",
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasPorciones.id,
      name: "Porción de Papas a la Francesa",
      slug: "porcion-papas-francesa",
      description: "Papas doradas y crujientes con sal parrillera.",
      basePrice: 6000,
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "Porción",
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasPorciones.id,
      name: "Porción de Ensalada",
      slug: "porcion-ensalada",
      description: "Ensalada fresca de repollo, zanahoria y aderezo agridulce.",
      basePrice: 8000,
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "Porción",
      sortOrder: 6,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catSopasPorciones.id,
      name: "Porción de Arroz Blanco",
      slug: "porcion-arroz",
      description: "Arroz blanco suelto y recién preparado.",
      basePrice: 3000,
      imageUrl: "https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "Porción",
      sortOrder: 7,
    },
  });

  // CATEGORÍA 7: Desayunos
  await prisma.dish.create({
    data: {
      categoryId: catDesayunos.id,
      name: "Calentado Campesino con Chorizo",
      slug: "calentado-chorizo",
      description: "Arroz y frijoles calentados con chorizo frito, arepa y huevo.",
      basePrice: 17000,
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "1 desayuno completo",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catDesayunos.id,
      name: "Calentado con Carne Asada",
      slug: "calentado-carne",
      description: "Arroz y frijoles mezclados con carne de res a la plancha, arepa con mantequilla y huevo.",
      basePrice: 17000,
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catDesayunos.id,
      name: "Calentado con Huevos Fritos",
      slug: "calentado-huevos",
      description: "Calentado de frijol y arroz acompañado de dos huevos fritos y arepa.",
      basePrice: 14000,
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catDesayunos.id,
      name: "Huevos al Gusto con Salchicha",
      slug: "huevos-con-salchicha",
      description: "Huevos revueltos o pericos con salchicha y arepa.",
      basePrice: 11500,
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catDesayunos.id,
      name: "Arepa con Pajarilla Tradicional",
      slug: "arepa-pajarilla",
      description: "Arepa campesina asada acompañada de pajarilla en salsa criolla.",
      basePrice: 8500,
      imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "1 persona",
      sortOrder: 5,
    },
  });

  // CATEGORÍA 8: Menú Infantil
  await prisma.dish.create({
    data: {
      categoryId: catMenuInfantil.id,
      name: "Salchipapas Pío Pío Especial",
      slug: "salchipapas-pio-pio",
      description: "Papas a la francesa crocantes con salchicha en rodajas, queso y salsas de la casa.",
      basePrice: 12000,
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "Para niños",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catMenuInfantil.id,
      name: "Nuggets de Pollo con Papas",
      slug: "nuggets-de-pollo",
      description: "Nuggets de pechuga de pollo crocantes con papas a la francesa.",
      basePrice: 12000,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop",
      isAvailable: false, // Marcado con X en el menú físico
      badge: "NONE",
      servings: "Para niños",
      sortOrder: 2,
    },
  });

  // CATEGORÍA 9: Bebidas
  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Gaseosa Familiar 1.5L / 3L",
      slug: "gaseosa-familiar",
      description: "Gaseosa familiar helada para compartir en mesa.",
      basePrice: 15000,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "Familiar",
      sortOrder: 1,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Vaso de Milo Frío Batido",
      slug: "milo-frio",
      description: "Bebida achocolatada Milo batida con leche bien helada.",
      basePrice: 8000,
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "Vaso",
      sortOrder: 2,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Jugo Natural en Leche",
      slug: "jugo-en-leche",
      description: "Frutas de temporada (Mora, Mango, Lulo, Maracuyá) licuadas en leche.",
      basePrice: 8000,
      imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "POPULAR",
      servings: "Vaso 400ml",
      sortOrder: 3,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Jugo Natural en Agua",
      slug: "jugo-en-agua",
      description: "Frutas naturales licuadas en agua con hielo frappé.",
      basePrice: 7000,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "Vaso 400ml",
      sortOrder: 4,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Gaseosa Personal",
      slug: "gaseosa-personal",
      description: "Coca-Cola, Postobón, Colombiana, Manzana bien heladas.",
      basePrice: 4000,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "NONE",
      servings: "Botella personal",
      sortOrder: 5,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Vaso de Jugo del Día",
      slug: "jugo-del-dia",
      description: "Jugo casero refrescante preparado fresco todos los días.",
      basePrice: 1500,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
      badge: "PROMO",
      servings: "Vaso",
      sortOrder: 6,
    },
  });

  // Bebidas con X en el menú físico
  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Limonada Natural Fría",
      slug: "limonada-natural",
      description: "Limonada con limones frescos y hielo.",
      basePrice: 6000,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop",
      isAvailable: false, // Marcado con X en el menú
      badge: "NONE",
      servings: "Vaso",
      sortOrder: 7,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Limonada de Coco Especial",
      slug: "limonada-de-coco",
      description: "Cremosa limonada con leche de coco y hielo granizado.",
      basePrice: 9000,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop",
      isAvailable: false, // Marcado con X en el menú
      badge: "NONE",
      servings: "Vaso",
      sortOrder: 8,
    },
  });

  await prisma.dish.create({
    data: {
      categoryId: catBebidas.id,
      name: "Cerveza Michelada Parrillera",
      slug: "michelada",
      description: "Cerveza helada con sal marina y zumo de limón recién exprimido.",
      basePrice: 8000,
      imageUrl: "https://images.unsplash.com/photo-1608270199187-57ee36502392?q=80&w=800&auto=format&fit=crop",
      isAvailable: false, // Marcado con X en el menú
      badge: "NONE",
      servings: "Vaso escarchado",
      sortOrder: 9,
    },
  });

  // 4. Modal Promocional Flotante de Pío Pío
  await prisma.promotionalModal.create({
    data: {
      title: "🍗 ¡ESPECIAL PÍO PÍO DE HOY!",
      subtitle: "Pollo Asado Completo + Papas + Ensalada",
      description: "¡Sabor tradicional que reúne a la familia! Disfruta nuestro pollo asado a la brasa con el adobo casero Pío Pío.",
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
      badgeText: "PLATO ESTRELLA",
      regularPrice: 48000,
      promoPrice: 43000,
      ctaText: "Ver en la Carta",
      targetDishId: platoPolloAsado.id,
      isActive: true,
      autoShowDelayMs: 800,
      showOncePerSession: true,
    },
  });

  // 5. Ajustes Institucionales de Pío Pío (Persistidos en Base de Datos)
  await prisma.restaurantSettings.create({
    data: {
      id: "default",
      name: "Pío Pío - Asadero y Restaurante",
      whatsapp: "573001234567",
      phone: "573001234567",
      address: "Carrera Principal con Calle 10, Centro",
      schedule: "Lunes a Domingo: 10:00 AM a 9:00 PM",
      wifiSsid: "PioPio-Clientes",
      wifiPassword: "Parrilla2026*",
    },
  });

  console.log("¡Reestructuración completada exitosamente con el menú real de Asadero y Restaurante Pío Pío!");
}

main()
  .catch((e) => {
    console.error("Error en el seed de Pío Pío:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
