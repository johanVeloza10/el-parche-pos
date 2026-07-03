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
  },
  colDesc: { flex: 2 },
  colCode: { flex: 1 },
  colVal: { flex: 1, textAlign: 'right' },
  colNet: { flex: 1, textAlign: 'right' },
  totals: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
  },
  signatureSection: {
    marginTop: 50,
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

interface LiquidationProps {
  liq: any;
  config: any;
}

export const LiquidationReceipt: React.FC<LiquidationProps> = ({ liq, config }) => {
  const formatCOP = (num: number) => `$${Math.round(num).toLocaleString('es-CO')}`;
  const fInicio = new Date(liq.periodoInicio).toLocaleDateString('es-CO');
  const fFin = new Date(liq.periodoFin).toLocaleDateString('es-CO');

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

        {/* DETALLES DE LIQUIDACION */}
        <View style={styles.row}>
          <Text style={styles.bold}>LIQUIDACIÓN DE PROVEEDOR:</Text>
          <Text style={[styles.bold, { color: '#7A1F3D' }]}>#{liq.id.substring(0, 8).toUpperCase()}</Text>
        </View>
        <View style={styles.row}>
          <Text>Proveedor / Diseñadora:</Text>
          <Text style={styles.bold}>{liq.proveedor.nombre}</Text>
        </View>
        <View style={styles.row}>
          <Text>Documento:</Text>
          <Text>{liq.proveedor.tipoDocumento} {liq.proveedor.numeroDocumento}</Text>
        </View>
        <View style={styles.row}>
          <Text>Periodo Liquidado:</Text>
          <Text>{fInicio} al {fFin}</Text>
        </View>
        <View style={styles.row}>
          <Text>Estado:</Text>
          <Text style={styles.bold}>{liq.estado}</Text>
        </View>

        <View style={styles.divider} />

        {/* TABLA DE DETALLE */}
        <Text style={styles.sectionTitle}>Prendas Vendidas</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Descripción</Text>
            <Text style={styles.colCode}>Código</Text>
            <Text style={styles.colVal}>PVP Cobrado</Text>
            <Text style={styles.colNet}>Neto Prov.</Text>
          </View>
          {liq.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.prendaDescripcion}</Text>
              <Text style={styles.colCode}>{item.prendaCodigo}</Text>
              <Text style={styles.colVal}>{formatCOP(item.precioVenta)}</Text>
              <Text style={styles.colNet}>{formatCOP(item.valorProveedor)}</Text>
            </View>
          ))}
        </View>

        {/* SECCION TOTALES */}
        <View style={styles.totals}>
          <View style={styles.row}>
            <Text>Ventas Brutas Totales:</Text>
            <Text>{formatCOP(liq.totalVentas)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Retención Comisión Boutique:</Text>
            <Text>-{formatCOP(liq.totalComision)}</Text>
          </View>
          <View style={[styles.row, { marginTop: 5, paddingTop: 5, borderTopWidth: 0.5, borderTopColor: '#cccccc' }]}>
            <Text style={[styles.bold, { fontSize: 12 }]}>NETO A PAGAR:</Text>
            <Text style={[styles.bold, { fontSize: 12, color: '#7A1F3D' }]}>{formatCOP(liq.netoAPagar)}</Text>
          </View>
        </View>

        {/* FIRMAS */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine}>
            <Text>Firma de Recibido Diseñadora</Text>
            <Text style={{ marginTop: 20, color: '#999999' }}>Fecha: ____/____/________</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text>Firma Autorizada El Parche</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
