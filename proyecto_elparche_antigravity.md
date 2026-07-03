# PROYECTO EL PARCHE TIENDA — Plan maestro para Antigravity
> Este documento es la hoja de ruta completa. Pégalo en Antigravity al inicio de cada sesión de trabajo para mantener el contexto. Actualízalo marcando las tareas completadas con ✅.

---

## CONTEXTO DEL NEGOCIO (no omitas leer esto)

**El Parche Tienda** — boutique de moda femenina en Bogotá, abrió local en febrero 2026.  
**Modelo**: prendas únicas (cada pieza es irrepetible, no hay stock de N unidades de una referencia).  
**Ingresos reales enero–mayo 2026**: $33.292.654 COP (comisión promedio 41% sobre ventas brutas de $81.2M).  
**Régimen tributario**: persona natural NO responsable de IVA. Nunca mostrar IVA en ningún documento.  
**Dos tipos de mercancía**:
- CONSIGNACIÓN: 50+ proveedores dejan prendas; boutique cobra comisión al vender.
- PRODUCCIÓN PROPIA: dueña confecciona; hay costeo real de materiales y mano de obra.

**Datos reales disponibles**: `seed_historico_elparche.csv` — 96 filas con ventas diarias enero–mayo 2026 (ventas_brutas, pagos_terceros, ingreso_real, gastos, saldo_dia).

---

## REGLA DE ORO DEL PROYECTO

Antes de escribir cualquier línea de código, muéstrame el plan de esa fase y espera aprobación. Cada fase debe terminar funcionando completamente antes de pasar a la siguiente. Si algo no quedó bien en la fase anterior, lo arreglas antes de avanzar.

---

## STACK (no negociable)

```
Next.js 14+ App Router · TypeScript · PostgreSQL + Prisma ORM · Tailwind CSS
NextAuth con roles · Zod · react-pdf · Vitest
Paleta: vinotinto #7A1F3D · fondo #FDF6F8 · texto #1A1A1A · acento claro #F3E6EB
Fuente display: libre elección elegante · Fuente UI: Inter o Geist
Mobile/tablet first — botones mínimo 48px de alto para uso táctil en mostrador
```

---

## ARQUITECTURA DE CARPETAS (crea esto en Fase 0)

```
el-parche/
├── app/
│   ├── (auth)/login/
│   ├── (admin)/
│   │   ├── dashboard/
│   │   ├── inventario/
│   │   ├── proveedores/
│   │   ├── liquidaciones/
│   │   ├── produccion/
│   │   ├── cuentas/
│   │   ├── indicadores/
│   │   └── configuracion/
│   ├── (vendedora)/
│   │   ├── vender/
│   │   └── caja/
│   └── api/
│       ├── prendas/
│       ├── ventas/
│       ├── proveedores/
│       ├── liquidaciones/
│       ├── produccion/
│       ├── caja/
│       ├── reportes/
│       └── facturacion/
├── lib/
│   ├── facturacion/
│   │   ├── provider.interface.ts    ← interfaz abstracta
│   │   ├── mock.provider.ts         ← implementación de prueba
│   │   └── index.ts
│   ├── services/
│   │   ├── venta.service.ts
│   │   ├── liquidacion.service.ts
│   │   ├── costeo.service.ts
│   │   └── resultados.service.ts
│   └── validators/
├── prisma/
│   ├── schema.prisma
│   └── seed/
│       ├── index.ts
│       ├── seed_historico_elparche.csv   ← DATOS REALES
│       └── proveedores_ejemplo.ts
├── components/
│   ├── pos/
│   ├── inventario/
│   ├── reportes/
│   └── ui/
└── __tests__/
```

---

## FASE 0 — Base del proyecto ⬜
**Tiempo estimado: 3–4 horas de Antigravity**  
**Entregable: proyecto corriendo localmente con `npm run dev`, login funcionando, datos de prueba cargados**

### 0.1 Setup inicial
```bash
npx create-next-app@latest el-parche --typescript --tailwind --app --src-dir
cd el-parche
npm install prisma @prisma/client next-auth zod react-pdf vitest @vitejs/plugin-react
npx prisma init
```

### 0.2 Schema Prisma completo
Crea `/prisma/schema.prisma` con exactamente estos modelos:

**Usuario**
```prisma
model Usuario {
  id           String   @id @default(cuid())
  nombre       String
  email        String   @unique
  passwordHash String
  rol          Rol      @default(VENDEDORA)
  activo       Boolean  @default(true)
  creadoEn     DateTime @default(now())
  ventas       Venta[]
  cierresCaja  CierreCaja[]
  auditLog     AuditLog[]
}
enum Rol { ADMIN VENDEDORA CONTADOR }
```

**Proveedor**
```prisma
model Proveedor {
  id               String   @id @default(cuid())
  nombre           String
  tipoDocumento    String   @default("CC")
  numeroDocumento  String
  telefono         String?
  email            String?
  datosBancarios   String?
  comisionDefaultPct Float  @default(40)
  modoComision     ModoComision @default(PORCENTAJE)
  plazoMaxVitrinaDias Int   @default(60)
  responsableIva   Boolean  @default(false)
  emiteFactura     Boolean  @default(false)
  notas            String?
  activo           Boolean  @default(true)
  creadoEn         DateTime @default(now())
  prendas          Prenda[]
  liquidaciones    Liquidacion[]
}
enum ModoComision { PORCENTAJE VALOR_FIJO }
```

**Prenda (pieza única)**
```prisma
model Prenda {
  id                String    @id @default(cuid())
  codigo            String    @unique  // BTQ-2026-NNNNN
  origen            OrigenPrenda
  estado            EstadoPrenda @default(EN_VITRINA)
  descripcion       String
  categoria         String
  talla             String?
  color             String?
  fotos             String[]  // URLs
  precioVenta       Int       // COP entero
  iva               Int       @default(0)  // siempre 0, reservado
  valorProveedor    Int?      // si es CONSIGNACION
  comisionPct       Float?    // hereda del proveedor, editable
  costoProduccion   Int?      // si es PRODUCCION_PROPIA
  fechaIngreso      DateTime  @default(now())
  fechaVenta        DateTime?
  proveedorId       String?
  proveedor         Proveedor? @relation(fields: [proveedorId], references: [id])
  ordenProduccionId String?
  ordenProduccion   OrdenProduccion? @relation(fields: [ordenProduccionId], references: [id])
  ventaItem         VentaItem?
  apartado          Apartado?
  eliminado         Boolean   @default(false)
  creadoEn          DateTime  @default(now())
  auditLog          AuditLog[]
}
enum OrigenPrenda { CONSIGNACION PRODUCCION_PROPIA }
enum EstadoPrenda { EN_VITRINA APARTADA VENDIDA DEVUELTA_PROVEEDOR EN_GARANTIA }
```

**Venta + DocumentoFiscal**
```prisma
model Venta {
  id              String   @id @default(cuid())
  fechaHora       DateTime @default(now())
  usuarioId       String
  usuario         Usuario  @relation(fields: [usuarioId], references: [id])
  clienteId       String?
  cliente         Cliente? @relation(fields: [clienteId], references: [id])
  items           VentaItem[]
  total           Int
  descuento       Int      @default(0)
  motivoDescuento String?
  medioPago       MedioPago
  desglosePago    Json?    // para pago mixto
  documentoFiscal DocumentoFiscal?
  cierreCajaId    String?
  cierreCaja      CierreCaja? @relation(fields: [cierreCajaId], references: [id])
  creadoEn        DateTime @default(now())
}
model VentaItem {
  id               String  @id @default(cuid())
  ventaId          String
  venta            Venta   @relation(fields: [ventaId], references: [id])
  prendaId         String  @unique  // una prenda solo puede estar en una venta
  prenda           Prenda  @relation(fields: [prendaId], references: [id])
  precioVenta      Int
  paraProveedor    Int     @default(0)
  comisionBoutique Int     @default(0)
  margenPropio     Int     @default(0)
  liquidacionId    String?
  liquidacion      Liquidacion? @relation(fields: [liquidacionId], references: [id])
}
model DocumentoFiscal {
  id                String           @id @default(cuid())
  ventaId           String           @unique
  venta             Venta            @relation(fields: [ventaId], references: [id])
  tipo              TipoDocumento
  numero            String
  cufe              String?
  qrData            String?
  estadoTransmision EstadoTransmision @default(PENDIENTE)
  clienteNombre     String?
  clienteDocumento  String?
  clienteEmail      String?
  payloadEnviado    Json?
  respuestaProveedor Json?
  intentos          Int              @default(0)
  creadoEn          DateTime         @default(now())
  actualizadoEn     DateTime         @updatedAt
}
enum TipoDocumento    { DEE_POS FACTURA_ELECTRONICA NOTA_AJUSTE }
enum EstadoTransmision { PENDIENTE ACEPTADO RECHAZADO }
enum MedioPago        { EFECTIVO TARJETA TRANSFERENCIA MIXTO }
```

**Cliente**
```prisma
model Cliente {
  id              String   @id @default(cuid())
  nombre          String
  tipoDocumento   String   @default("CC")
  numeroDocumento String
  email           String?
  telefono        String?
  ventas          Venta[]
  apartados       Apartado[]
  creadoEn        DateTime @default(now())
}
```

**Liquidación**
```prisma
model Liquidacion {
  id           String          @id @default(cuid())
  proveedorId  String
  proveedor    Proveedor       @relation(fields: [proveedorId], references: [id])
  periodoInicio DateTime
  periodoFin   DateTime
  items        VentaItem[]
  totalVentas  Int
  totalComision Int
  netoAPagar   Int
  estado       EstadoLiquidacion @default(BORRADOR)
  fechaPago    DateTime?
  soportePago  String?
  pdfUrl       String?
  creadoEn     DateTime        @default(now())
}
enum EstadoLiquidacion { BORRADOR APROBADA PAGADA }
```

**Producción y costos**
```prisma
model MateriaPrima {
  id                 String     @id @default(cuid())
  nombre             String
  unidad             String     // METRO, UNIDAD, CONO, ROLLO
  costoPromedioActual Float     @default(0)
  existencia         Float      @default(0)
  compras            CompraInsumo[]
  consumos           ConsumoInsumo[]
}
model CompraInsumo {
  id             String       @id @default(cuid())
  materiaPrimaId String
  materiaPrima   MateriaPrima @relation(fields: [materiaPrimaId], references: [id])
  fecha          DateTime
  proveedor      String?
  cantidad       Float
  costoTotal     Int
  soporte        String?
  creadoEn       DateTime     @default(now())
}
model OrdenProduccion {
  id             String      @id @default(cuid())
  nombreDiseno   String
  descripcion    String?
  fechaInicio    DateTime    @default(now())
  fechaCierre    DateTime?
  estado         EstadoOrden @default(ABIERTA)
  costoTotal     Int         @default(0)
  costoPorPrenda Int         @default(0)
  margenObjetivo Float       @default(2.5)
  precioSugerido Int         @default(0)
  consumos       ConsumoInsumo[]
  manoDeObra     ManoDeObra[]
  costosIndirectos Int       @default(0)
  prendas        Prenda[]
}
model ConsumoInsumo {
  id                String          @id @default(cuid())
  ordenProduccionId String
  ordenProduccion   OrdenProduccion @relation(fields: [ordenProduccionId], references: [id])
  materiaPrimaId    String
  materiaPrima      MateriaPrima    @relation(fields: [materiaPrimaId], references: [id])
  cantidad          Float
  costoUnitario     Float
  costoTotal        Int
}
model ManoDeObra {
  id                String          @id @default(cuid())
  ordenProduccionId String
  ordenProduccion   OrdenProduccion @relation(fields: [ordenProduccionId], references: [id])
  concepto          String
  valor             Int
}
enum EstadoOrden { ABIERTA CERRADA }
model CostoNegocio {
  id       String       @id @default(cuid())
  tipo     TipoCosto
  concepto String
  valor    Int
  mes      String       // "2026-06"
  soporte  String?
  creadoEn DateTime     @default(now())
}
enum TipoCosto { FIJO VARIABLE }
```

**Caja, apartado, auditoría**
```prisma
model CierreCaja {
  id                  String   @id @default(cuid())
  fecha               DateTime
  usuarioId           String
  usuario             Usuario  @relation(fields: [usuarioId], references: [id])
  ventas              Venta[]
  totalEfectivo       Int      @default(0)
  totalTarjeta        Int      @default(0)
  totalTransferencia  Int      @default(0)
  totalCalculado      Int      @default(0)
  efectivoContado     Int      @default(0)
  diferencia          Int      @default(0)
  observacion         String?
  estado              EstadoCaja @default(ABIERTA)
  creadoEn            DateTime @default(now())
}
enum EstadoCaja { ABIERTA CERRADA }
model Apartado {
  id          String          @id @default(cuid())
  prendaId    String          @unique
  prenda      Prenda          @relation(fields: [prendaId], references: [id])
  clienteId   String
  cliente     Cliente         @relation(fields: [clienteId], references: [id])
  abono       Int
  valorTotal  Int
  fechaLimite DateTime
  estado      EstadoApartado  @default(VIGENTE)
  notas       String?
  creadoEn    DateTime        @default(now())
}
enum EstadoApartado { VIGENTE COMPLETADO VENCIDO }
model AuditLog {
  id         String   @id @default(cuid())
  tabla      String
  registroId String
  accion     String   // EDICION | ANULACION | DESCUENTO | CAMBIO_PRECIO
  valorAntes Json?
  valorDespues Json?
  usuarioId  String
  usuario    Usuario  @relation(fields: [usuarioId], references: [id])
  prendaId   String?
  prenda     Prenda?  @relation(fields: [prendaId], references: [id])
  creadoEn   DateTime @default(now())
}
```

### 0.3 Seed de datos (usa datos REALES del negocio)
El seed debe cargar:

**3 usuarios de prueba:**
- admin@elparche.co / admin123 → rol ADMIN (simula a la dueña)
- vendedora@elparche.co / vend123 → rol VENDEDORA
- contador@elparche.co / cont123 → rol CONTADOR

**5 proveedores de ejemplo:**
- Diseños Valentina · CC 52.123.456 · comisión 40%
- Creaciones Luna · CC 43.987.654 · comisión 35%
- Taller Moda Urbana · NIT 900.123.456-1 · comisión 45%
- Bordados del Sur · CC 28.456.789 · comisión 38%
- Arte en Tela · CC 61.234.567 · comisión 42%

**20 prendas en vitrina:** 15 en consignación (3 por proveedor), 5 de producción propia.

**Histórico de ventas enero–mayo 2026:** Leer el archivo `prisma/seed/seed_historico_elparche.csv` (96 registros) y cargarlos como registros diarios en una tabla `HistoricoLibro` para que el dashboard de cuentas muestre el historial real desde el primer día.

**Costos fijos de prueba (mayo 2026):**
- Arriendo: $1.300.000
- Servicios públicos: $80.000/día (aprox.)
- Total gastos mayo reales: $4.015.630

### 0.4 Interfaz de facturación (implementar completa)

```typescript
// lib/facturacion/provider.interface.ts
export interface FacturacionProvider {
  emitirDeePos(venta: VentaDTO): Promise<ResultadoEmision>;
  emitirFacturaElectronica(venta: VentaDTO, cliente: ClienteDTO): Promise<ResultadoEmision>;
  emitirNotaAjuste(docOriginal: DocumentoFiscalDTO, motivo: string): Promise<ResultadoEmision>;
  consultarEstado(documentoId: string): Promise<EstadoTransmision>;
}

// lib/facturacion/mock.provider.ts
// - Latencia simulada: 800-1200ms
// - 95% devuelve ACEPTADO con CUFE ficticio "CUFE-MOCK-{uuid}"
// - 5% devuelve RECHAZADO con motivo "Error simulado para pruebas"
// - QR ficticio: "https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey={cufe}"
// - Cola de reintentos: documentos PENDIENTES o RECHAZADOS reintentan cada 5 min (máx 3 intentos)
```

### 0.5 Auth con NextAuth
- 3 roles con acceso diferenciado a rutas
- Middleware que bloquea VENDEDORA de cualquier ruta /admin/*
- CONTADOR solo puede acceder a /admin/cuentas e /admin/indicadores (solo lectura)
- La session incluye el rol para usarlo en las APIs

### 0.6 Tests de Fase 0 (Vitest)
```
✓ desglosarVentaConsignacion: precio 100.000, valorProveedor 60.000 → comisión 40.000
✓ desglosarVentaConsignacionPorcentaje: precio 100.000, comisionPct 40 → comisión 40.000
✓ calcularCostoPromedioPonderado: (100 existente a $5.000) + (50 nuevos a $7.000) → $5.666
✓ mockProvider.emitirDeePos: devuelve objeto con cufe, qrData, estado ACEPTADO o RECHAZADO
✓ auth: ruta /admin/proveedores bloqueada para rol VENDEDORA
```

---

## FASE 1 — Inventario y recepción ⬜
**Tiempo estimado: 4–5 horas**  
**Entregable: puedes registrar prendas, ver el inventario y generar etiquetas QR**

### 1.1 Pantalla de inventario (/admin/inventario)
- **Galería en grid** con foto, código, categoría, precio, proveedor, días en vitrina
- **Semáforo de antigüedad**: verde <30 días · amarillo 30-60 · rojo >60 (alertas de devolución)
- **Filtros**: estado, categoría, proveedor, origen, rango de precio, antigüedad
- **Buscador**: por código, descripción, color, talla
- **Acciones por prenda**: ver detalle, editar precio, cambiar estado, imprimir etiqueta
- Estado vacío: "Aún no hay prendas en vitrina. ¿Quieres recibir mercancía de un proveedor?"

### 1.2 Wizard de recepción en consignación (/admin/inventario/recibir)
Paso 1 — Elegir proveedor (buscador + botón crear proveedor nuevo inline)  
Paso 2 — Agregar prendas: foto (cámara o archivo), descripción, categoría, talla, color, precio de venta, valor proveedor (o calcular automático con comisión default). Botón "+ Agregar otra prenda".  
Paso 3 — Resumen: lista de prendas, total de consignación, comisión total de la boutique si vende todo.  
Paso 4 — Generar acta PDF y confirmar. El acta incluye: fecha, datos del proveedor, lista numerada de prendas con código+precio+valor proveedor, firma _______ (espacio en blanco).  
Al confirmar: prendas quedan EN_VITRINA y los códigos BTQ-AAAA-NNNNN se autogeneran.

### 1.3 Generación de etiquetas QR
- Por prenda individual: botón "Imprimir etiqueta"
- Por lote: seleccionar varias prendas → "Imprimir etiquetas seleccionadas"
- Formato etiqueta 40×25mm: código QR grande · código BTQ debajo · precio en bold · nombre tienda pequeño
- Vista de impresión HTML optimizada para impresora de etiquetas

### 1.4 Importador CSV (/admin/configuracion/importar)
- **Importar proveedores**: columnas nombre, tipoDocumento, numeroDocumento, telefono, email, comisionDefaultPct
- **Importar inventario inicial**: columnas codigo_externo, descripcion, categoria, talla, color, precioVenta, valorProveedor, nombreProveedor, fechaIngreso
- **Vista previa** antes de confirmar: tabla con las filas a importar, errores marcados en rojo
- Al importar inventario: si el proveedor no existe se crea automáticamente

### 1.5 Tests de Fase 1
```
✓ generarCodigo: formato BTQ-2026-00001, incrementa correctamente
✓ recepcionConsignacion: crea N prendas en EN_VITRINA con proveedorId correcto
✓ importarCSVProveedores: 5 filas válidas → 5 proveedores creados, 1 fila con error → skip con log
✓ semaforo: prenda con 25 días → verde, 45 días → amarillo, 70 días → rojo
```

---

## FASE 2 — POS + Facturación DIAN ⬜
**Tiempo estimado: 5–6 horas**  
**Entregable: puedes hacer una venta completa, el tiquete sale con QR ficticio, la caja registra**

### 2.1 Pantalla POS (/vendedora/vender)
Esta es la pantalla más importante del proyecto. Debe ser fluida, grande y sin fricciones.

**Layout tablet (10 pulgadas):**
- Izquierda 60%: buscador/escáner + carrito
- Derecha 40%: resumen de venta + botones de acción

**Flujo de venta:**
1. Campo de búsqueda grande (escanear código de barras o escribir código/descripción)
2. La prenda aparece con foto, descripción, precio. Botón "Agregar" grande.
3. El carrito muestra las prendas seleccionadas con precio y botón de quitar.
4. Total en grande abajo.
5. Toggle grande "¿El cliente pide factura?" → si sí, aparecen 3 campos: nombre, cédula/NIT, correo.
6. Selector de medio de pago: botones grandes EFECTIVO / TARJETA / TRANSFERENCIA / MIXTO
   - Si MIXTO: campos para ingresar cuánto en cada medio
7. Botón "Confirmar venta" (desactivado hasta que haya al menos 1 prenda y medio de pago)
8. Modal de confirmación: resumen + "Procesando..." mientras el mock emite el documento
9. Vista de tiquete imprimible con QR

**Validaciones:**
- No puede vender una prenda que no esté EN_VITRINA o APARTADA
- Si está APARTADA, mostrar alerta "Esta prenda está apartada para [cliente]. ¿Continuar de todas formas?" (requiere ADMIN)

### 2.2 Tiquete imprimible (80mm)
```
================================
     EL PARCHE TIENDA
     Bogotá, Colombia
================================
Fecha: DD/MM/AAAA HH:MM
Doc:   DEE-POS-0001 (o FE-0001)
--------------------------------
Blusa floral roja - BTQ-2026-0021
                         $95.000
Pantalón palazzo negro - BTQ-0089
                        $150.000
--------------------------------
TOTAL                    $245.000
Medio de pago: Efectivo
--------------------------------
[QR CODE 2x2cm]
Consumidor Final
Este documento es válido ante DIAN
================================
No somos responsables de IVA
================================
```

### 2.3 Lógica de venta (transacción atómica)
```
BEGIN TRANSACTION
1. Verificar estado de cada prenda → EN_VITRINA o APARTADA
2. Crear registro Venta
3. Por cada prenda:
   a. Crear VentaItem con desglose económico
   b. Actualizar prenda: estado = VENDIDA, fechaVenta = now()
   c. Si CONSIGNACION: acumular saldo del proveedor
4. Llamar a MockProvider (fuera de la transacción si falla, la venta queda con doc PENDIENTE)
5. Crear DocumentoFiscal con resultado
6. Asociar venta al cierre de caja abierto del día
COMMIT
```

### 2.4 Caja diaria (/vendedora/caja)
- **Apertura de caja**: botón al inicio del día, registra hora de apertura
- **Ventas del día en vivo**: lista actualizada de ventas con medio de pago
- **Totales en tiempo real**: tarjeta con EFECTIVO / TARJETA / TRANSFERENCIA / MIXTO
- **Arqueo**: campo "Efectivo contado en caja" → sistema calcula diferencia
- **Cierre**: resumen del día, diferencia, observación, confirmación → estado CERRADA
- Alerta si hay documentos fiscales PENDIENTES o RECHAZADOS sin resolver

### 2.5 Monitor de transmisión DIAN (/admin/dashboard)
- Contador "X documentos sin transmitir" en la barra superior (visible solo para ADMIN)
- Al hacer clic: lista de documentos PENDIENTES/RECHAZADOS con botón "Reintentar"
- Cola de reintentos automáticos cada 5 minutos

### 2.6 Tests de Fase 2
```
✓ ventaAtómica: si mockProvider falla, la prenda queda VENDIDA pero doc queda PENDIENTE
✓ ventaDuplicada: intentar vender prenda ya VENDIDA → error 409
✓ desgloseConsignacion: venta $95.000, valorProveedor $57.000 → comision $38.000
✓ desglosePropio: venta $150.000, costo $55.000 → margen $95.000
✓ docSinIVA: documento generado nunca tiene campo iva > 0
✓ rolVendedora: POST /api/ventas OK, GET /api/proveedores → 403
```

---

## FASE 3 — Liquidaciones a proveedores ✅
**Tiempo estimado: 3 horas**  
**Entregable: puedes generar, aprobar, registrar pago y descargar PDF de liquidación de cualquier proveedor**

### 3.1 Pantalla de proveedores (/admin/proveedores) ✅
- Lista de proveedores con: nombre, prendas en vitrina, prendas vendidas sin liquidar, saldo por pagar
- **Semáforo de saldo**: verde $0 · amarillo $50.000-$200.000 · rojo >$200.000
- Ficha de proveedor: datos, historial de prendas, historial de liquidaciones y pagos
- Botón "Generar liquidación" (disponible cuando hay ventas sin liquidar)

### 3.2 Flujo de liquidación ✅
1. Admin selecciona proveedor y periodo (o "todas las pendientes")
2. Sistema muestra: prendas vendidas en el periodo, precio de venta, comisión retenida, neto a pagar por prenda
3. Totales: ventas totales, comisión total boutique, **neto a pagar al proveedor**
4. Botón "Aprobar liquidación" → estado APROBADA, genera PDF
5. PDF descargable: encabezado boutique · datos proveedor · tabla de prendas · totales · espacio firma
6. Botón "Registrar pago": fecha, medio (transferencia/efectivo), soporte adjunto → estado PAGADA, saldo proveedor = 0

### 3.3 PDF de liquidación (react-pdf) ✅
```
EL PARCHE TIENDA · NIT/CC xxxxxxx
Liquidación a proveedor: [Nombre]
Periodo: [inicio] al [fin]
Fecha de generación: [fecha]
─────────────────────────────────────
Prenda                  Venta   Neto proveedor
Blusa floral BTQ-0021  $95.000     $57.000
Pantalón palazzo 0089 $150.000     $90.000
─────────────────────────────────────
TOTAL VENTAS           $245.000
Comisión boutique       $98.000  (40%)
NETO A PAGAR          $147.000
─────────────────────────────────────
Firma proveedor: ___________________
Recibido: _______________  Fecha: __
```

### 3.4 Tests de Fase 3
```
✓ liquidacionCalculo: 3 prendas vendidas → totalVentas correcto, netoAPagar correcto
✓ liquidacionEstado: BORRADOR → APROBADA → PAGADA (no puede retroceder)
✓ saldoProveedorPostPago: después de registrar pago, saldo proveedor = 0
✓ prendaNoReliquidada: una vez en liquidación APROBADA, la VentaItem no puede ir a otra liquidación
```

---

## FASE 4 — Producción propia y costeo ✅
**Tiempo estimado: 4 horas**  
**Entregable: puedes crear una orden, consumir materiales, cerrarla y ver el costo real por prenda con precio sugerido**

### 4.1 Materia prima (/admin/produccion/materiales) ✅
- Catálogo de insumos: nombre, unidad, existencia, costo promedio actual
- **Registrar compra**: seleccionar insumo, cantidad, costo total, proveedor del insumo, soporte → actualiza existencia y recalcula costo promedio ponderado
- Alerta: insumos con existencia < 10% del consumo promedio mensual

### 4.2 Órdenes de producción (/admin/produccion/ordenes) ✅
**Wizard de creación:**  
Paso 1: Nombre del diseño, descripción, número de prendas a producir  
Paso 2: Consumo de materiales → seleccionar insumo, cantidad; sistema muestra costo calculado  
Paso 3: Mano de obra → concepto (confección / bordado / acabados), valor  
Paso 4: Resumen de costo total y costo por prenda antes de confirmar  

**Al cerrar la orden:**
- Calcular `costoTotal = Σ(materiales) + Σ(manoDeObra) + costosIndirectosAsignados`
- `costoPorPrenda = costoTotal / numeroPrendas`
- `precioSugerido = costoPorPrenda * margenObjetivo` (default: 2.5x)
- Crear las N prendas con origen PRODUCCION_PROPIA y costoProduccion grabado
- Descargar materia prima del inventario (consumos)

### 4.3 Costos del negocio (/admin/produccion/costos) ✅
- Registro mensual de costos: FIJO (arriendo, servicios, nómina) o VARIABLE (empaques, comisiones banco, publicidad)
- Vista de costos del mes actual con total fijo y total variable
- Los costos fijos del mes se pueden distribuir entre órdenes de producción activas del mes (criterio: por prenda producida)
- Cargar datos reales: importar desde los gastos del libro fiscal (el campo GASTOS del CSV ya tiene estos datos)

### 4.4 Tests de Fase 4
```
✓ costoPromedioTresCompras: tres compras distintas → promedio ponderado correcto
✓ cerrarOrden: consumos + mano de obra → costoTotal y costoPorPrenda correctos
✓ precioSugerido: costo $48.000 * margen 2.5 = $120.000
✓ descargarInventario: al cerrar orden, existencias de materia prima se reducen
✓ prendaProduccionNoTieneProveedor: origen PRODUCCION_PROPIA → proveedorId null
```

---

## FASE 5 — Cuentas claras e indicadores ⬜
**Tiempo estimado: 4 horas**  
**Entregable: el dashboard de la dueña muestra la ganancia real del mes, navegable y exportable**

### 5.1 Cuentas claras (/admin/cuentas)
La pantalla más importante para la dueña. Lenguaje completamente simple.

**Vista principal — mes a mes:**
```
╔══════════════════════════════════════════════╗
║  MAYO 2026                        [← Mes ant]
╠══════════════════════════════════════════════╣
║  Ventas totales del mes          $24.794.100 → [ver detalle]
║  (–) Lo que le pertenece a los  
║      proveedores                -$14.644.742 → [ver por proveedor]
╠══════════════════════════════════════════════╣
║  LO QUE ENTRÓ A LA TIENDA       $10.149.358
║  (–) Costo de prendas propias
║      que se vendieron              -$0        → [no hubo este mes]
╠══════════════════════════════════════════════╣
║  GANANCIA ANTES DE GASTOS       $10.149.358
║  (–) Gastos del mes              -$4.015.630 → [ver detalle]
╠══════════════════════════════════════════════╣
║  ✅ GANANCIA REAL DEL MES        $6.133.728
╚══════════════════════════════════════════════╝
```
Al tocar cualquier cifra → abre panel lateral con el desglose día a día o ítem por ítem.

**Historial mensual (carga datos del CSV real):**
| Mes | Ventas | Ingreso real | Gastos | Ganancia |
|-----|--------|--------------|--------|----------|
| Enero 2026 | $3.199.274 | $1.323.833 | $777.200 | $546.633 |
| Febrero 2026 | $16.787.137 | $6.861.073 | $3.088.500 | $3.772.573 |
| Marzo 2026 | $23.506.292 | $9.542.084 | $5.073.200 | $4.468.884 |
| Abril 2026 | $12.945.520 | $5.416.306 | $3.692.723 | $1.723.583 |
| Mayo 2026 | $24.794.100 | $10.149.358 | $4.015.630 | $6.133.728 |
| **TOTAL** | **$81.232.323** | **$33.292.654** | **$16.647.253** | **$16.645.401** |

### 5.2 Indicadores (/admin/indicadores)
- **Rotación promedio**: días promedio en vitrina antes de venderse, por categoría
- **Ranking de proveedores**: quién vende más, quién deja más comisión, quién tiene más devoluciones
- **Prendas envejecidas**: lista con >60 días en vitrina, proveedor y contacto para devolver
- **Punto de equilibrio**: "Necesitas vender $X este mes para cubrir tus gastos fijos"
- **Comisión promedio real**: % real del negocio (históricamente: 41%)

### 5.3 Exporte para contador
- Botón "Exportar resumen del mes" → Excel con: ventas por día, desglose por proveedor, costos, saldo mensual
- Botón "Exportar liquidaciones pagadas del mes" → Excel con pagos a proveedores del periodo
- Formato compatible con lo que ella ya lleva en su libro

### 5.4 Tests de Fase 5
```
✓ estadoResultadosMayo: ventas $24.794.100 - pagos $14.644.742 = ingreso $10.149.358
✓ estadoResultadosMayo: ingreso $10.149.358 - gastos $4.015.630 = ganancia $6.133.728
✓ puntoEquilibrio: gastosFijos / (1 - porcentajeParaProveedores) = ventasNecesarias
✓ exporteExcel: archivo generado tiene columnas fecha, ventas, pagos, ingreso, gastos, saldo
```

---

## CHECKLIST FINAL ANTES DE ENTREGA ⬜

- [ ] Flujo completo: recibir prenda → vender → liquidar proveedor (sin tocar la DB a mano)
- [ ] Flujo producción: crear orden → consumir materiales → cerrar → ver costo por prenda
- [ ] Venta con factura: documento FACTURA_ELECTRONICA con 3 datos del cliente
- [ ] Venta sin factura: documento DEE_POS a consumidor final
- [ ] Ningún documento tiene IVA > 0
- [ ] Rol VENDEDORA: no ve comisiones, no ve costos, API devuelve 403 en rutas admin
- [ ] Rol CONTADOR: solo lectura en /cuentas e /indicadores
- [ ] Dashboard de cuentas cuadra con los datos reales del CSV (test automatizado lo verifica)
- [ ] Tiquete de 80mm se ve correctamente en vista de impresión
- [ ] Etiqueta QR generada tiene el código correcto y escanea bien
- [ ] Alerta de documentos sin transmitir visible en el dashboard
- [ ] Todo el texto de la UI está en español colombiano, sin tecnicismos
- [ ] Usable en tablet de 10 pulgadas (botones ≥48px, sin scroll horizontal)

---

## DATOS REALES PARA CARGAR EN EL SEED

Archivo: `prisma/seed/seed_historico_elparche.csv`  
Columnas: mes, mes_nombre, dia, fecha, ventas_brutas, pagos_terceros, ingreso_real, gastos, saldo_dia  
Filas: 96 registros (enero 15 a mayo 31, 2026)  
Fuente: libro fiscal real de El Parche Tienda exportado de Numbers.

**Resumen que el estado de resultados debe mostrar exactamente:**
- Enero: Ventas $3.199.274 · Pagos proveedores $1.875.441 · Ingreso $1.323.833 · Gastos $777.200 · Ganancia $546.633
- Febrero: Ventas $16.787.137 · Pagos $9.926.064 · Ingreso $6.861.073 · Gastos $3.088.500 · Ganancia $3.772.573
- Marzo: Ventas $23.506.292 · Pagos $13.964.208 · Ingreso $9.542.084 · Gastos $5.073.200 · Ganancia $4.468.884
- Abril: Ventas $12.945.520 · Pagos $7.529.214 · Ingreso $5.416.306 · Gastos $3.692.723 · Ganancia $1.723.583
- Mayo: Ventas $24.794.100 · Pagos $14.644.742 · Ingreso $10.149.358 · Gastos $4.015.630 · Ganancia $6.133.728

---

## NOTA FINAL PARA ANTIGRAVITY

Cuando termines una fase, muéstrame:
1. Lista de archivos creados o modificados
2. Cómo correr la fase (`npm run dev` + pasos para probar el flujo)
3. Resultado de los tests (`npm run test`)
4. Una sola pregunta si tienes duda antes de la siguiente fase

No avances a la siguiente fase sin que yo te confirme que la anterior está aprobada.
