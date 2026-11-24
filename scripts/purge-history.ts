import { prisma } from "../src/lib/prisma";

async function purgeTransactionalData() {
  console.log("================================================================================");
  console.log("🧹 INICIANDO LIMPIEZA TOTAL DE HISTORIALES, VENTAS Y GASTOS - PÍO PÍO");
  console.log("⚠️ REGLA DE ORO: EL MENÚ DIGITAL, CATEGORÍAS, PLATOS Y MESEROS NO SE TOCAN.");
  console.log("================================================================================\n");

  // 1. Conteo previo de datos maestros (Menú Digital) para certificar que están seguros
  const initialCategories = await prisma.category.count();
  const initialDishes = await prisma.dish.count();
  const initialPortions = await prisma.dishPortion.count();
  const initialTables = await prisma.restaurantTable.count();
  const initialWaiters = await prisma.waiter.count();
  const initialUsers = await prisma.user.count();

  console.log("🛡️ VERIFICACIÓN PREVIA DE DATOS MAESTROS (MENÚ DIGITAL INTACTO):");
  console.log(`   - Categorías en carta: ${initialCategories}`);
  console.log(`   - Platos en menú: ${initialDishes}`);
  console.log(`   - Porciones configuradas: ${initialPortions}`);
  console.log(`   - Mesas del restaurante: ${initialTables}`);
  console.log(`   - Meseros registrados: ${initialWaiters}`);
  console.log(`   - Usuarios del sistema: ${initialUsers}\n`);

  // 2. Conteo previo de datos transaccionales a limpiar
  const orderItemsCount = await prisma.orderItem.count();
  const sessionsCount = await prisma.tableSession.count();
  const expensesCount = await prisma.expense.count();
  const shiftsCount = await prisma.cashShift.count();
  const auditLogsCount = await prisma.auditLog.count();

  console.log("🗑️ REGISTROS TRANSACCIONALES A ELIMINAR (PUESTA A CEROS):");
  console.log(`   - Ítems de comandas/pedidos: ${orderItemsCount}`);
  console.log(`   - Sesiones de mesas y barra rápida: ${sessionsCount}`);
  console.log(`   - Gastos registrados: ${expensesCount}`);
  console.log(`   - Turnos y arqueos de caja: ${shiftsCount}`);
  console.log(`   - Registros de auditoría: ${auditLogsCount}\n`);

  console.log("🔄 Procediendo con la purga en base de datos PostgreSQL...");

  // 3. Eliminación en orden estricto de integridad referencial
  // Paso A: Ítems de comandas
  const deletedItems = await prisma.orderItem.deleteMany({});
  console.log(`   ✅ Eliminados ${deletedItems.count} ítems de comandas.`);

  // Paso B: Sesiones de mesa y barra rápida
  const deletedSessions = await prisma.tableSession.deleteMany({});
  console.log(`   ✅ Eliminadas ${deletedSessions.count} sesiones de mesas y barra.`);

  // Paso C: Gastos de caja
  const deletedExpenses = await prisma.expense.deleteMany({});
  console.log(`   ✅ Eliminados ${deletedExpenses.count} gastos de caja.`);

  // Paso D: Turnos de caja
  const deletedShifts = await prisma.cashShift.deleteMany({});
  console.log(`   ✅ Eliminados ${deletedShifts.count} turnos de caja.`);

  // Paso E: Logs de auditoría
  const deletedAudit = await prisma.auditLog.deleteMany({});
  console.log(`   ✅ Eliminados ${deletedAudit.count} logs de auditoría.`);

  console.log("\n================================================================================");
  console.log("🔍 CERTIFICACIÓN FINAL DE INTEGRIDAD POST-LIMPIEZA");
  console.log("================================================================================");

  // 4. Verificación de que el menú digital sigue 100% intacto
  const finalCategories = await prisma.category.count();
  const finalDishes = await prisma.dish.count();
  const finalPortions = await prisma.dishPortion.count();
  const finalTables = await prisma.restaurantTable.count();
  const finalWaiters = await prisma.waiter.count();
  const finalUsers = await prisma.user.count();

  console.log("🍽️ MENÚ DIGITAL Y CONFIGURACIÓN MAESTRA (100% PRESERVADOS):");
  console.log(`   - Categorías: ${finalCategories} (Esperado: ${initialCategories}) -> ${finalCategories === initialCategories ? "✅ INTACTO" : "❌ DISCREPANCIA"}`);
  console.log(`   - Platos: ${finalDishes} (Esperado: ${initialDishes}) -> ${finalDishes === initialDishes ? "✅ INTACTO" : "❌ DISCREPANCIA"}`);
  console.log(`   - Porciones: ${finalPortions} (Esperado: ${initialPortions}) -> ${finalPortions === initialPortions ? "✅ INTACTO" : "❌ DISCREPANCIA"}`);
  console.log(`   - Mesas: ${finalTables} (Esperado: ${initialTables}) -> ${finalTables === initialTables ? "✅ INTACTO" : "❌ DISCREPANCIA"}`);
  console.log(`   - Meseros: ${finalWaiters} (Esperado: ${initialWaiters}) -> ${finalWaiters === initialWaiters ? "✅ INTACTO" : "❌ DISCREPANCIA"}`);
  console.log(`   - Usuarios: ${finalUsers} (Esperado: ${initialUsers}) -> ${finalUsers === initialUsers ? "✅ INTACTO" : "❌ DISCREPANCIA"}\n`);

  // 5. Verificación de que los datos transaccionales están en 0
  const remainingItems = await prisma.orderItem.count();
  const remainingSessions = await prisma.tableSession.count();
  const remainingExpenses = await prisma.expense.count();
  const remainingShifts = await prisma.cashShift.count();
  const remainingAudit = await prisma.auditLog.count();

  console.log("📊 ESTADO EN CEROS (LISTO PARA ESTRENAR):");
  console.log(`   - Comandas activas o históricas: ${remainingItems} -> ${remainingItems === 0 ? "🟢 EN CEROS" : "⚠️ NO CERO"}`);
  console.log(`   - Cuentas de mesas o barra: ${remainingSessions} -> ${remainingSessions === 0 ? "🟢 EN CEROS" : "⚠️ NO CERO"}`);
  console.log(`   - Gastos registrados: ${remainingExpenses} -> ${remainingExpenses === 0 ? "🟢 EN CEROS" : "⚠️ NO CERO"}`);
  console.log(`   - Turnos de caja: ${remainingShifts} -> ${remainingShifts === 0 ? "🟢 EN CEROS" : "⚠️ NO CERO"}`);
  console.log(`   - Auditoría: ${remainingAudit} -> ${remainingAudit === 0 ? "🟢 EN CEROS" : "⚠️ NO CERO"}`);

  console.log("\n🎉 ¡SISTEMA LIMPIO Y EN CEROS! EL RESTAURANTE ESTÁ LISTO PARA SU ESTRENO OFICIAL.");
  console.log("================================================================================\n");
}

purgeTransactionalData()
  .catch((e) => {
    console.error("Error durante la limpieza transaccional:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
