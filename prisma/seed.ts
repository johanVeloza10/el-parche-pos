import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import ExcelJS from 'exceljs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Limpiando base de datos existente...')
  
  // Limpiar en orden inverso de relaciones para evitar errores de llave foránea
  await prisma.auditLog.deleteMany().catch(() => {})
  await prisma.documentoFiscal.deleteMany().catch(() => {})
  await prisma.itemLiquidacion.deleteMany().catch(() => {})
  await prisma.itemVenta.deleteMany().catch(() => {})
  await prisma.liquidacion.deleteMany().catch(() => {})
  await prisma.apartado.deleteMany().catch(() => {})
  await prisma.venta.deleteMany().catch(() => {})
  await prisma.prenda.deleteMany().catch(() => {})
  await prisma.ordenProduccion.deleteMany().catch(() => {})
  await prisma.consumoMateriaPrima.deleteMany().catch(() => {})
  await prisma.compraMateriaPrima.deleteMany().catch(() => {})
  await prisma.materiaPrima.deleteMany().catch(() => {})
  await prisma.proveedor.deleteMany().catch(() => {})
  await prisma.cliente.deleteMany().catch(() => {})
  await prisma.cierreCaja.deleteMany().catch(() => {})
  await prisma.costoNegocio.deleteMany().catch(() => {})
  await prisma.historicoLibro.deleteMany().catch(() => {})

  console.log('🌱 Iniciando seed de la base de datos...')

  // 1. Configuración Global
  await prisma.configuracionNegocio.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      nombreNegocio: 'El Parche Diseño',
      nit: '123456789-0',
      direccion: 'Colombia',
      telefono: '3001234567',
      email: 'contacto@elparche.co',
      prefijoCodigoPrenda: 'PAR',
      colorPrimario: '#C41E3A', // Rojo corazón
    },
  })
  console.log('✅ Configuración global creada')

  // 2. Usuarios
  const adminPassword = await bcrypt.hash('admin123', 10)
  const vendedoraPassword = await bcrypt.hash('venta123', 10)
  const contadorPassword = await bcrypt.hash('conta123', 10)

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@elparche.co' },
    update: {},
    create: {
      nombre: 'Carolina Restrepo', // Admin/Dueña
      email: 'admin@elparche.co',
      passwordHash: adminPassword,
      rol: 'ADMIN',
    },
  })

  const vendedora = await prisma.usuario.upsert({
    where: { email: 'vale@elparche.co' },
    update: {},
    create: {
      nombre: 'Valentina Gómez',
      email: 'vale@elparche.co',
      passwordHash: vendedoraPassword,
      rol: 'VENDEDORA',
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'contador@elparche.co' },
    update: {},
    create: {
      nombre: 'Andrés Mora',
      email: 'contador@elparche.co',
      passwordHash: contadorPassword,
      rol: 'CONTADOR',
    },
  })
  console.log('✅ Usuarios creados (admin, vendedora, contador)')

  // 3. Proveedores
  const proveedoresData = [
    { nombre: 'Eka Accesorios', tipoDocumento: 'NIT', numeroDocumento: '900123456', comision: 30.0 },
    { nombre: 'Macondo Joyas', tipoDocumento: 'CC', numeroDocumento: '1020304050', comision: 25.0 },
    { nombre: 'Bambú Artesanal', tipoDocumento: 'NIT', numeroDocumento: '900987654', comision: 35.0 },
    { nombre: 'Telas y Retazos', tipoDocumento: 'CC', numeroDocumento: '43123456', comision: 30.0 },
    { nombre: 'La Guajira Bags', tipoDocumento: 'CC', numeroDocumento: '1122334455', comision: 40.0 },
  ]

  const proveedores = []
  for (const p of proveedoresData) {
    const prov = await prisma.proveedor.create({
      data: {
        nombre: p.nombre,
        tipoDocumento: p.tipoDocumento,
        numeroDocumento: p.numeroDocumento,
        comisionDefaultPct: p.comision,
      },
    })
    proveedores.push(prov)
  }
  console.log('✅ 5 Proveedores creados')

  // 4. Materia Prima
  const materias = await Promise.all([
    prisma.materiaPrima.create({ data: { nombre: 'Tela Algodón Reciclado', unidad: 'METRO', costoPromedioActual: 15000, existencia: 50 } }),
    prisma.materiaPrima.create({ data: { nombre: 'Hilo Gusanito', unidad: 'CONO', costoPromedioActual: 8000, existencia: 10 } }),
    prisma.materiaPrima.create({ data: { nombre: 'Cremallera Invisible', unidad: 'UNIDAD', costoPromedioActual: 500, existencia: 100 } }),
  ].map(p => p.catch(e => {
       // if we re-run, these might fail without unique, but we didn't add unique to nombre, so they will duplicate. 
       // For a seed script it's okay, we normally wipe DB first.
       return prisma.materiaPrima.findFirst({ where: { nombre: 'Tela Algodón Reciclado'} }) as any
  })))

  // 5. Órdenes de Producción
  const ordenCerrada = await prisma.ordenProduccion.create({
    data: {
      nombreDiseno: 'Chaqueta Retazos Vintage',
      estado: 'CERRADA',
      fechaCierre: new Date(),
      costoTotal: 85000,
      cantidadPrendas: 2,
      costoPorPrenda: 42500,
      precioSugerido: 120000,
    }
  })

  const ordenAbierta = await prisma.ordenProduccion.create({
    data: {
      nombreDiseno: 'Vestido Flores Asimétrico',
      estado: 'ABIERTA',
    }
  })
  console.log('✅ Órdenes de producción creadas')

  // 6. Prendas
  const prendasData = []
  // Prendas de Consignación
  for (let i = 1; i <= 20; i++) {
    const prov = proveedores[i % proveedores.length]
    prendasData.push({
      codigo: `PAR-2026-${String(i).padStart(5, '0')}`,
      codigoBarras: `770123456${String(i).padStart(4, '0')}`,
      origen: 'CONSIGNACION',
      proveedorId: prov.id,
      descripcion: `Prenda única artesanal #${i}`,
      categoria: i % 2 === 0 ? 'Blusa' : 'Pantalón',
      talla: ['S', 'M', 'L', 'UNICA'][i % 4],
      color: ['Rojo', 'Azul', 'Amarillo', 'Mixto'][i % 4],
      precioVenta: 50000 + (i * 5000),
      valorProveedor: null, // se calcula de comisionPct
      comisionPct: prov.comisionDefaultPct,
      estado: i > 15 ? 'VENDIDA' : 'EN_VITRINA',
    })
  }
  
  // Prendas Producción Propia
  for (let i = 21; i <= 30; i++) {
    prendasData.push({
      codigo: `PAR-2026-${String(i).padStart(5, '0')}`,
      codigoBarras: `770123456${String(i).padStart(4, '0')}`,
      origen: 'PRODUCCION_PROPIA',
      ordenProduccionId: ordenCerrada.id,
      descripcion: `Diseño El Parche Original #${i}`,
      categoria: 'Chaqueta',
      talla: 'M',
      color: 'Multicolor',
      precioVenta: 150000,
      costoProduccion: 42500,
      estado: i > 28 ? 'VENDIDA' : 'EN_VITRINA',
    })
  }

  for (const p of prendasData) {
    await prisma.prenda.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    })
  }
  console.log('✅ 30 Prendas creadas (Consignación y Producción Propia)')

  // 7. Clientes
  const clienteFactura = await prisma.cliente.create({
    data: {
      nombre: 'María Camila Restrepo',
      tipoDocumento: 'CC',
      numeroDocumento: '1032456789',
      email: 'mcamila@example.com',
      telefono: '3109876543'
    }
  })

  // 8. Cierre de Caja
  const caja = await prisma.cierreCaja.create({
    data: {
      usuarioId: admin.id,
      estado: 'ABIERTA',
    }
  })

  // 9. Ventas
  const prendasVendidas = await prisma.prenda.findMany({ where: { estado: 'VENDIDA' } })
  if (prendasVendidas.length > 0) {
    // Venta a consumidor final (DEE_POS)
    const p1 = prendasVendidas[0]
    const venta1 = await prisma.venta.create({
      data: {
        usuarioId: vendedora.id,
        medioPago: 'EFECTIVO',
        subtotal: p1.precioVenta,
        total: p1.precioVenta,
        cierreCajaId: caja.id,
        items: {
          create: [{
            prendaId: p1.id,
            precioVenta: p1.precioVenta,
            comisionBoutique: p1.origen === 'CONSIGNACION' ? (p1.precioVenta * (p1.comisionPct || 30) / 100) : p1.precioVenta,
            paraProveedor: p1.origen === 'CONSIGNACION' ? (p1.precioVenta * (100 - (p1.comisionPct || 30)) / 100) : 0,
            esProduccionPropia: p1.origen === 'PRODUCCION_PROPIA',
            costoProduccion: p1.costoProduccion,
          }]
        },
        documentoFiscal: {
          create: {
            tipo: 'DEE_POS',
            numero: 'POS-1',
            estadoTransmision: 'ACEPTADO',
            cufe: 'CUDE-TEST-12345'
          }
        }
      }
    })

    // Venta con Factura Electrónica
    if (prendasVendidas.length > 1) {
      const p2 = prendasVendidas[1]
      const venta2 = await prisma.venta.create({
        data: {
          usuarioId: admin.id,
          clienteId: clienteFactura.id,
          medioPago: 'TARJETA',
          subtotal: p2.precioVenta,
          total: p2.precioVenta,
          cierreCajaId: caja.id,
          items: {
            create: [{
              prendaId: p2.id,
              precioVenta: p2.precioVenta,
              comisionBoutique: p2.origen === 'CONSIGNACION' ? (p2.precioVenta * (p2.comisionPct || 30) / 100) : p2.precioVenta,
              paraProveedor: p2.origen === 'CONSIGNACION' ? (p2.precioVenta * (100 - (p2.comisionPct || 30)) / 100) : 0,
              esProduccionPropia: p2.origen === 'PRODUCCION_PROPIA',
            }]
          },
          documentoFiscal: {
            create: {
              tipo: 'FACTURA_ELECTRONICA',
              numero: 'FE-1',
              estadoTransmision: 'ACEPTADO',
              cufe: 'CUFE-TEST-67890',
              clienteNombre: clienteFactura.nombre,
              clienteDocumento: clienteFactura.numeroDocumento,
            }
          }
        }
      })
    }
    console.log('✅ Ventas y Documentos Fiscales creados')
  }

  // 10. Histórico del libro fiscal (Enero - Mayo) desde Excel
  console.log('🌱 Importando histórico del libro fiscal desde Excel (LIBRO FISCAL 2026 (4).xlsx)...')
  
  try {
    const filePath = path.join(process.cwd(), "LIBRO FISCAL 2026 (4).xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheetsToProcess = [
      { name: "ENERO - EL PARCHE TIENDA", mesNombre: "Enero", mes: "2026-01" },
      { name: "FEBRERO - EL PARCHE TIENDA", mesNombre: "Febrero", mes: "2026-02" },
      { name: "MARZO - EL PARCHE TIENDA", mesNombre: "Marzo", mes: "2026-03" },
      { name: "ABRIL - EL PARCHE TIENDA", mesNombre: "Abril", mes: "2026-04" },
      { name: "MAYO", mesNombre: "Mayo", mes: "2026-05" }
    ];

    const getVal = (cell: any): number => {
      if (cell === null || cell === undefined) return 0;
      if (typeof cell === "number") return cell;
      if (typeof cell === "object" && cell !== null && "result" in cell) {
        return typeof cell.result === "number" ? cell.result : 0;
      }
      const parsed = parseInt(String(cell).replace(/[$,.]/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    let count = 0;
    const allPromises: any[] = [];

    for (const sInfo of sheetsToProcess) {
      const sheet = workbook.getWorksheet(sInfo.name);
      if (!sheet) {
        console.log(`❌ No se encontró pestaña: ${sInfo.name}`);
        continue;
      }

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber < 3) return; // Saltar cabeceras
        
        const dayVal = row.getCell(1).value;
        if (dayVal === null || dayVal === undefined) return;

        const dayNum = typeof dayVal === "number" ? dayVal : parseInt(String(dayVal));
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return; // No es una fila de día

        const ventasBrutas = getVal(row.getCell(2).value);
        const pagosTerceros = getVal(row.getCell(3).value);
        const ingresoReal = getVal(row.getCell(4).value);
        const gastos = getVal(row.getCell(5).value);
        const saldoDia = getVal(row.getCell(6).value);

        const diaStr = dayNum.toString().padStart(2, '0');
        const mesPart = sInfo.mes.split('-')[1];
        const fecha = `2026-${mesPart}-${diaStr}`;

        const p = prisma.historicoLibro.create({
          data: {
            mes: sInfo.mes,
            mesNombre: sInfo.mesNombre,
            dia: dayNum,
            fecha,
            ventasBrutas,
            pagosTerceros,
            ingresoReal,
            gastos,
            saldoDia
          }
        });
        allPromises.push(p);
        count++;
      });
    }

    await Promise.all(allPromises);
    console.log(`✅ ${count} registros históricos cargados exitosamente desde Excel`);
  } catch (error) {
    console.error('❌ Error al cargar el histórico Excel:', error)
  }

  console.log('🎉 Seed finalizado correctamente.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
