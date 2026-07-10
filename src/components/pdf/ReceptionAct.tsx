import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#7A1F3D', // Vinotinto institucional de El Parche
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 4,
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    alignItems: 'center',
  },
  colCode: { flex: 1.2 },
  colDesc: { flex: 3 },
  colTalla: { flex: 0.8, textAlign: 'center' },
  colVal: { flex: 1.2, textAlign: 'right' },
  colNet: { flex: 1.2, textAlign: 'right' },
  totals: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
  },
  signatureSection: {
    marginTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureLine: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 5,
    textAlign: 'center',
    fontSize: 8,
  }
});

interface ReceptionActProps {
  proveedor: any;
  prendas: any[];
  config: any;
}

export const ReceptionAct: React.FC<ReceptionActProps> = ({ proveedor, prendas, config }) => {
  const formatCOP = (num: number) => `$${Math.round(num).toLocaleString('es-CO')}`;
  const fHoy = new Date().toLocaleDateString('es-CO');

  const calcularValorProveedor = (prenda: any) => {
    if (prenda.valorProveedor) return prenda.valorProveedor;
    if (prenda.comisionPct) {
      const comisionVal = prenda.precioVenta * (prenda.comisionPct / 100);
      return prenda.precioVenta - comisionVal;
    }
    // Si no tiene comision definida, asumimos la comisión default del proveedor
    const comisionPctDefault = proveedor.comisionDefaultPct || 30;
    const comisionVal = prenda.precioVenta * (comisionPctDefault / 100);
    return prenda.precioVenta - comisionVal;
  };

  const totalVentaSugerido = prendas.reduce((sum, p) => sum + p.precioVenta, 0);
  const totalEstimadoProveedor = prendas.reduce((sum, p) => sum + calcularValorProveedor(p), 0);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        
        {/* CABECERA */}
        <View style={styles.header}>
          <Text style={styles.title}>{config.nombreNegocio || "EL PARCHE DISEÑO"}</Text>
          <Text style={styles.subtitle}>NIT: {config.nit || "123456789-0"}</Text>
          <Text style={styles.subtitle}>{config.direccion || "Bogotá, Colombia"}</Text>
          <Text style={styles.subtitle}>Teléfono: {config.telefono || "3001234567"}</Text>
        </View>

        <View style={styles.divider} />

        {/* DETALLES DEL ACTA */}
        <View style={styles.row}>
          <Text style={styles.bold}>DOCUMENTO:</Text>
          <Text style={[styles.bold, { color: '#7A1F3D' }]}>ACTA DE RECEPCIÓN DE MERCANCÍA (CONSIGNACIÓN)</Text>
        </View>
        <View style={styles.row}>
          <Text>Fecha de Recepción:</Text>
          <Text style={styles.bold}>{fHoy}</Text>
        </View>
        <View style={styles.row}>
          <Text>Proveedor / Diseñadora:</Text>
          <Text style={styles.bold}>{proveedor.nombre}</Text>
        </View>
        <View style={styles.row}>
          <Text>Identificación:</Text>
          <Text>{proveedor.tipoDocumento} {proveedor.numeroDocumento}</Text>
        </View>
        <View style={styles.row}>
          <Text>Responsable de IVA (DIAN):</Text>
          <Text>{proveedor.responsableIva ? "Sí declara IVA" : "No responsable de IVA"}</Text>
        </View>
        <View style={styles.row}>
          <Text>Plazo Máximo en Vitrina:</Text>
          <Text>{proveedor.plazoMaxVitrinaDias || 90} días</Text>
        </View>

        <View style={styles.divider} />

        {/* TABLA DE PRENDAS */}
        <Text style={styles.sectionTitle}>Relación de Prendas Recibidas</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colCode}>Código</Text>
            <Text style={styles.colDesc}>Descripción / Color</Text>
            <Text style={styles.colTalla}>Talla</Text>
            <Text style={styles.colVal}>P. Venta Público</Text>
            <Text style={styles.colNet}>Acuerdo Neto Prov.</Text>
          </View>
          {prendas.map((prenda: any, idx: number) => {
            const netoProv = calcularValorProveedor(prenda);
            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colCode}>{prenda.codigo}</Text>
                <Text style={styles.colDesc}>{prenda.descripcion} {prenda.color ? `(${prenda.color})` : ''}</Text>
                <Text style={styles.colTalla}>{prenda.talla}</Text>
                <Text style={styles.colVal}>{formatCOP(prenda.precioVenta)}</Text>
                <Text style={styles.colNet}>{formatCOP(netoProv)}</Text>
              </View>
            );
          })}
        </View>

        {/* SECCION TOTALES */}
        <View style={styles.totals}>
          <View style={styles.row}>
            <Text>Cantidad Total de Prendas:</Text>
            <Text style={styles.bold}>{prendas.length} un.</Text>
          </View>
          <View style={styles.row}>
            <Text>Total Valor de Venta al Público:</Text>
            <Text>{formatCOP(totalVentaSugerido)}</Text>
          </View>
          <View style={[styles.row, { marginTop: 5, paddingTop: 5, borderTopWidth: 0.5, borderTopColor: '#cccccc' }]}>
            <Text style={[styles.bold, { fontSize: 11 }]}>TOTAL ESTIMADO A PAGAR (AL VENDERSE):</Text>
            <Text style={[styles.bold, { fontSize: 11, color: '#7A1F3D' }]}>{formatCOP(totalEstimadoProveedor)}</Text>
          </View>
        </View>

        {/* NOTAS */}
        <View style={{ marginTop: 25, fontSize: 8, color: '#666666' }}>
          <Text style={styles.bold}>Condiciones de Consignación:</Text>
          <Text>1. La mercancía se recibe en calidad de consignación por el plazo establecido en vitrina.</Text>
          <Text>2. Los pagos de las prendas vendidas se realizarán según los cortes pactados (generalmente quincenales/mensuales).</Text>
          <Text>3. El proveedor garantiza la originalidad y calidad de las piezas entregadas.</Text>
        </View>

        {/* FIRMAS */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine}>
            <Text>Entregué Conforme (Diseñadora/Proveedor)</Text>
            <Text style={{ marginTop: 20, color: '#999999' }}>C.C. / NIT: ____________________</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text>Recibí Conforme (El Parche)</Text>
            <Text style={{ marginTop: 20, color: '#999999' }}>Firma Autorizada</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
