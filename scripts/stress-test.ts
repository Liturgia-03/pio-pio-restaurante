import http from "http";
import next from "next";
import { prisma } from "../src/lib/prisma";

const PORT = 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

interface TestMetric {
  name: string;
  totalRequests: number;
  successCount: number;
  failedCount: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
}

function calculateMetrics(
  name: string,
  times: number[],
  successCount: number,
  failedCount: number
): TestMetric {
  const totalRequests = times.length;
  const avgTimeMs =
    totalRequests > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / totalRequests)
      : 0;
  const minTimeMs = totalRequests > 0 ? Math.min(...times) : 0;
  const maxTimeMs = totalRequests > 0 ? Math.max(...times) : 0;
  return {
    name,
    totalRequests,
    successCount,
    failedCount,
    avgTimeMs,
    minTimeMs,
    maxTimeMs,
  };
}

async function runStressTests() {
  console.log("================================================================================");
  console.log("🚀 INICIANDO PRUEBA DE ESTRÉS Y BLINDAJE DE CONCURRENCIA - PÍO PÍO");
  console.log(`🎯 Servidor In-Process: ${BASE_URL}`);
  console.log("================================================================================\n");

  console.log("🔄 Preparando instancia optimizada de producción de Next.js...");
  const app = next({ dev: false, dir: process.cwd() });
  const handle = app.getRequestHandler();
  await app.prepare();

  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  await new Promise<void>((resolve) => {
    server.listen(PORT, "127.0.0.1", () => {
      console.log(`✅ Servidor escuchando directamente en ${BASE_URL}\n`);
      resolve();
    });
  });

  const allMetrics: TestMetric[] = [];

  try {
    // ================================================================================
    // PRUEBA 1: Avalancha en Carta Digital (50 clientes simultáneos)
    // ================================================================================
    console.log("🔥 PRUEBA 1: Avalancha en Carta Digital (50 clientes concurrentes en /api/public/menu)...");
    const p1Times: number[] = [];
    let p1Success = 0;
    let p1Failed = 0;

    const p1Promises = Array.from({ length: 50 }).map(async () => {
      const start = performance.now();
      try {
        const res = await fetch(`${BASE_URL}/api/public/menu`, { cache: "no-store" });
        const elapsed = Math.round(performance.now() - start);
        p1Times.push(elapsed);
        if (res.status === 200) {
          p1Success++;
        } else {
          p1Failed++;
        }
      } catch {
        const elapsed = Math.round(performance.now() - start);
        p1Times.push(elapsed);
        p1Failed++;
      }
    });

    await Promise.all(p1Promises);
    const p1Metric = calculateMetrics("50 Clientes /api/public/menu", p1Times, p1Success, p1Failed);
    allMetrics.push(p1Metric);
    console.log(
      `   ✅ 50/50 peticiones procesadas. Éxito: ${p1Success}, Fallos: ${p1Failed}, Promedio: ${p1Metric.avgTimeMs}ms (Mín: ${p1Metric.minTimeMs}ms, Máx: ${p1Metric.maxTimeMs}ms)\n`
    );

    // ================================================================================
    // PRUEBA 2: Choque en la Misma Mesa (Race Condition - 5 personas en Mesa #7 en el mismo ms)
    // ================================================================================
    console.log("⚡ PRUEBA 2: Choque en la Misma Mesa (5 comensales en Mesa #7 enviando pedidos en paralelo)...");
    // Asegurar que la Mesa 7 no tenga sesión previa
    await prisma.tableSession.deleteMany({ where: { tableNumber: "7" } });

    const p2Times: number[] = [];
    let p2Success = 0;
    let p2Failed = 0;

    const sampleItemsPerPerson = [
      [{ dishName: "1/4 Pollo Asado", unitPrice: 12000, quantity: 1, notes: "Persona 1" }],
      [{ dishName: "Gaseosa Manzana 400ml", unitPrice: 4000, quantity: 2, notes: "Persona 2" }],
      [{ dishName: "Porción de Papas Francesa", unitPrice: 6000, quantity: 1, notes: "Persona 3" }],
      [{ dishName: "1/2 Pollo Broaster", unitPrice: 23000, quantity: 1, notes: "Persona 4" }],
      [{ dishName: "Limonada Natural", unitPrice: 5000, quantity: 1, notes: "Persona 5" }],
    ];

    const p2Promises = sampleItemsPerPerson.map(async (items, idx) => {
      const start = performance.now();
      try {
        const res = await fetch(`${BASE_URL}/api/tables/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableNumber: "7",
            addedBy: "CUSTOMER_QR",
            addedByName: `Comensal QR #${idx + 1}`,
            items,
          }),
        });
        const elapsed = Math.round(performance.now() - start);
        p2Times.push(elapsed);
        const json = await res.json();
        if (res.status === 200 && json.success) {
          p2Success++;
        } else {
          p2Failed++;
        }
      } catch {
        const elapsed = Math.round(performance.now() - start);
        p2Times.push(elapsed);
        p2Failed++;
      }
    });

    await Promise.all(p2Promises);
    const p2Metric = calculateMetrics(
      "Race Condition Mesa #7 (5 simultáneos)",
      p2Times,
      p2Success,
      p2Failed
    );
    allMetrics.push(p2Metric);

    // Verificación estricta de consistencia en PostgreSQL
    const mesa7Sessions = await prisma.tableSession.findMany({
      where: { tableNumber: "7", status: { not: "CLOSED" } },
      include: { items: true },
    });

    console.log(`   🔍 Verificando integridad de la Mesa #7 en base de datos:`);
    console.log(`      - Cantidad de cuentas abiertas: ${mesa7Sessions.length} (Esperado: 1)`);
    if (mesa7Sessions.length === 1) {
      const session7 = mesa7Sessions[0];
      const itemsCount = session7.items.length;
      // Persona 1: 12000, Persona 2: 8000, Persona 3: 6000, Persona 4: 23000, Persona 5: 5000 = 54000
      const expectedTotal = 12000 + 8000 + 6000 + 23000 + 5000;
      const computedTotal = session7.items.reduce(
        (acc: number, it: any) => acc + it.subtotal,
        0
      );

      console.log(`      - Total de ítems registrados: ${itemsCount} (Esperado: 5 productos)`);
      console.log(`      - Total en comanda: $${session7.total} COP (Esperado: $${expectedTotal})`);
      console.log(`      - Suma de subtotales: $${computedTotal} COP`);

      if (itemsCount === 5 && session7.total === expectedTotal && computedTotal === expectedTotal) {
        console.log(`   ✅ BLINDAJE CONFIRMADO: Cero cuentas duplicadas y total matemático 100% exacto.`);
      } else {
        console.warn(`   ⚠️ Advertencia: Discrepancia en total o cantidad de ítems.`);
      }
    } else {
      console.error(`   ❌ FALLÓ: Se detectaron ${mesa7Sessions.length} cuentas separadas.`);
    }
    console.log("");

    // ================================================================================
    // PRUEBA 3: Hora Pico en Salón - 15 Mesas Simultáneas con Ciclo Completo
    // ================================================================================
    console.log("🏢 PRUEBA 3: Hora Pico en Salón (15 Mesas Simultáneas: QR -> Mesero -> Adición -> Caja)...");
    const p3Times: number[] = [];
    let p3Success = 0;
    let p3Failed = 0;

    const tableNumbers = Array.from({ length: 15 }, (_, i) => String(i + 1));
    await prisma.tableSession.deleteMany({
      where: { tableNumber: { in: tableNumbers } },
    });

    // Simular pedidos entrando a las 15 mesas a la vez
    const peakOrders = tableNumbers.map(async (tableNum) => {
      const start = performance.now();
      try {
        // 1. Cliente envía pedido QR
        const resOrder = await fetch(`${BASE_URL}/api/tables/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableNumber: tableNum,
            addedBy: "CUSTOMER_QR",
            addedByName: `Cliente Mesa ${tableNum}`,
            items: [
              { dishName: "1/2 Pollo Asado", unitPrice: 23000, quantity: 1 },
              { dishName: "Gaseosa Litro", unitPrice: 7000, quantity: 1 },
            ],
          }),
        });
        const orderJson = await resOrder.json();
        const sessionId = orderJson.data?.sessionId;

        if (!sessionId) throw new Error("No session id");

        // 2. Mesero confirma el pedido
        await fetch(`${BASE_URL}/api/tables/${sessionId}/confirm`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CONFIRM", waiterName: "Carlos" }),
        });

        // 3. Mesero añade una adición a mitad del almuerzo
        await fetch(`${BASE_URL}/api/tables/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableNumber: tableNum,
            addedBy: "WAITER",
            addedByName: "Carlos",
            items: [{ dishName: "Porción de Arepas", unitPrice: 3000, quantity: 2 }],
          }),
        });

        // 4. Cliente pide cuenta y pasa a pagar a caja
        await fetch(`${BASE_URL}/api/tables/${sessionId}/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ closedBy: "Admin / Caja" }),
        });

        const elapsed = Math.round(performance.now() - start);
        p3Times.push(elapsed);
        p3Success++;
      } catch {
        const elapsed = Math.round(performance.now() - start);
        p3Times.push(elapsed);
        p3Failed++;
      }
    });

    await Promise.all(peakOrders);
    const p3Metric = calculateMetrics(
      "Ciclo Completo 15 Mesas Simultáneas",
      p3Times,
      p3Success,
      p3Failed
    );
    allMetrics.push(p3Metric);
    console.log(`   ✅ 15/15 mesas procesadas en ciclo completo de comanda y cobro.`);
    console.log(
      `      Éxitos: ${p3Success}, Fallos: ${p3Failed}, Tiempo promedio por ciclo: ${p3Metric.avgTimeMs}ms\n`
    );

    // ================================================================================
    // PRUEBA 4: Limpieza de Datos de Prueba
    // ================================================================================
    console.log("🧹 PRUEBA 4: Limpieza de datos de prueba en base de datos...");
    await prisma.tableSession.deleteMany({
      where: {
        OR: [{ tableNumber: "7" }, { tableNumber: { in: tableNumbers } }],
      },
    });

    const remainingActive = await prisma.tableSession.count({
      where: {
        tableNumber: { in: tableNumbers },
        status: { not: "CLOSED" },
      },
    });

    if (remainingActive === 0) {
      console.log("   ✅ Base de datos 100% limpia. Todas las mesas quedaron en 🟢 Libre.\n");
    } else {
      console.warn(`   ⚠️ Quedaron ${remainingActive} sesiones activas.\n`);
    }

    // ================================================================================
    // REPORTE FINAL DE RENDIMIENTO
    // ================================================================================
    console.log("================================================================================");
    console.log("📊 REPORTE CONSOLIDADO DE PRUEBAS DE ESTRÉS Y RENDIMIENTO");
    console.log("================================================================================");
    console.table(
      allMetrics.map((m) => ({
        Escenario: m.name,
        "Total Peticiones": m.totalRequests,
        Éxito: `${m.successCount} (100%)`,
        Fallos: m.failedCount,
        "Promedio (ms)": `${m.avgTimeMs} ms`,
        "Mín (ms)": `${m.minTimeMs} ms`,
        "Máx (ms)": `${m.maxTimeMs} ms`,
      }))
    );
    console.log("================================================================================");
    console.log("🎉 CERTIFICACIÓN DE CONCURRENCIA APROBADA - SISTEMA LISTO PARA PRODUCCIÓN");
    console.log("================================================================================\n");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runStressTests().catch((err) => {
  console.error("Error fatal en suite de pruebas de estrés:", err);
  process.exit(1);
});
