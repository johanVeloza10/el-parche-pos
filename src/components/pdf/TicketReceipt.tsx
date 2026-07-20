import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register standard fonts or use defaults. For 80mm printers, Helvetica is usually fine.
const styles = StyleSheet.create({
  page: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 18,
    paddingRight: 18,
    fontFamily: 'Helvetica',
    fontSize: 8,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 7,
    color: '#444444',
    textAlign: 'center',
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'dashed',
    marginVertical: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  itemDesc: {
    flex: 1,
    paddingRight: 8,
  },
  itemPrice: {
    width: 50,
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    fontSize: 10,
  },
  footer: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 7,
    color: '#444444',
  }
});

interface TicketProps {
  venta: any;
  config: any;
}

export const TicketReceipt: React.FC<TicketProps> = ({ venta, config }) => {
  const formatCOP = (num: number) => `$${num.toLocaleString('es-CO')}`;

  return (
    <Document>
      <Page size={[226, 800]} style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>{config.nombreNegocio || "EL PARCHE DISEÑO"}</Text>
          <Text style={styles.subtitle}>Ropa y accesorios</Text>
          <Text style={styles.subtitle}>NIT: {config.nit || "52157597-9"}</Text>
          <Text style={styles.subtitle}>{config.direccion || "Calle 43 # 19-26"}</Text>
          <Text style={styles.subtitle}>Tel: {config.telefono || "3204014010"}</Text>
          <Text style={styles.subtitle}>Régimen Simplificado</Text>
          <Text style={styles.subtitle}>No somos responsables de IVA</Text>
        </View>

        <View style={styles.divider} />

        {/* INFO VENTA */}
        <View style={styles.row}>
          <Text>Recibo No:</Text>
          <Text style={styles.bold}>{venta.documentoFiscal?.numero || venta.id.substring(0, 8).toUpperCase()}</Text>
        </View>
        <View style={styles.row}>
          <Text>Fecha:</Text>
          <Text>{new Date(venta.fechaHora).toLocaleString('es-CO')}</Text>
        </View>
        <View style={styles.row}>
          <Text>Cajero:</Text>
          <Text>{venta.usuario?.nombre || 'Admin'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Medio Pago:</Text>
          <Text>{venta.medioPago}</Text>
        </View>

        <View style={styles.divider} />

        {/* CABECERA ITEMS */}
        <View style={[styles.row, styles.bold, { marginBottom: 8 }]}>
          <Text style={styles.itemDesc}>CANT / DESCRIPCION</Text>
          <Text style={styles.itemPrice}>VALOR</Text>
        </View>

        {/* ITEMS */}
        {venta.items.map((item: any, idx: number) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.itemDesc}>
              <Text>1x {item.prenda.descripcion}</Text>
              <Text style={{ fontSize: 8, color: '#666' }}>Ref: {item.prenda.codigo}</Text>
              {item.descuentoItem > 0 && (
                <Text style={{ fontSize: 8, color: '#666' }}>- Desc: {formatCOP(item.descuentoItem)}</Text>
              )}
            </View>
            <Text style={styles.itemPrice}>{formatCOP(item.precioVenta - item.descuentoItem)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {/* TOTALES */}
        <View style={styles.totalSection}>
          <View style={styles.row}>
            <Text>Subtotal:</Text>
            <Text>{formatCOP(venta.subtotal)}</Text>
          </View>
          {venta.descuento > 0 && (
            <View style={styles.row}>
              <Text>Descuentos:</Text>
              <Text>-{formatCOP(venta.descuento)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.bold, { marginTop: 4 }]}>
            <Text>TOTAL A PAGAR:</Text>
            <Text>{formatCOP(venta.total)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={{ marginBottom: 4 }}>¡GRACIAS POR TU COMPRA!</Text>
          <Text style={styles.bold}>el parche colombiano hecho con amor</Text>
          <Text style={{ marginTop: 8 }}>Recibo generado por el sistema.</Text>
        </View>
      </Page>
    </Document>
  );
};
