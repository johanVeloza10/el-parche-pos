const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando carga de datos históricos...");
  
  const csvPath = path.join(__dirname, '..', 'seed_historico_elparche.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Leídos ${records.length} registros del CSV. Cargando a la base de datos...`);

  // Borrar datos anteriores por si acaso
  await prisma.historicoLibro.deleteMany({});
  
  let loaded = 0;
  for (const record of records) {
    await prisma.historicoLibro.create({
      data: {
        mes: record.mes,
        mesNombre: record.mes_nombre,
        dia: parseInt(record.dia),
        fecha: record.fecha,
        ventasBrutas: parseInt(record.ventas_brutas),
        pagosTerceros: parseInt(record.pagos_terceros),
        ingresoReal: parseInt(record.ingreso_real),
        gastos: parseInt(record.gastos),
        saldoDia: parseInt(record.saldo_dia),
      }
    });
    loaded++;
  }
  
  console.log(`¡Carga exitosa! Se cargaron ${loaded} registros históricos en el módulo de Cuentas Claras.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
