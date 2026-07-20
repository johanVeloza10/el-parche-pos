import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

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

interface ApartadoProps {
  apartado: any;
  config: any;
}

export const ApartadoReceipt: React.FC<ApartadoProps> = ({ apartado, config }) => {
  const formatCOP = (num: number) => `$${num.toLocaleString('es-CO')}`;
  const saldo = apartado.totalPrenda - apartado.abono;

  return (
    <Document>
      <Page size={[226, 800]} style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>{config.nombreNegocio || "EL PARCHE DISEÑO"}</Text>
          <Text style={styles.subtitle}>NIT: {config.nit || "Pendiente"}</Text>
          <Text style={styles.subtitle}>{config.direccion || "Colombia"}</Text>
          <Text style={styles.subtitle}>Tel: {config.telefono || "Pendiente"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text style={[styles.bold, { fontSize: 11 }]}>RECIBO DE APARTADO</Text>
          <Text style={{ fontSize: 9, color: '#444' }}>Estado: {apartado.estado}</Text>
        </View>

        <View style={styles.divider} />

        {/* INFO APARTADO */}
        <View style={styles.row}>
          <Text>Apartado No:</Text>
          <Text style={styles.bold}>{apartado.id.substring(0, 8).toUpperCase()}</Text>
        </View>
        <View style={styles.row}>
          <Text>Fecha:</Text>
          <Text>{new Date(apartado.fechaCreacion).toLocaleString('es-CO')}</Text>
        </View>
        <View style={styles.row}>
          <Text>Fecha Límite:</Text>
          <Text style={styles.bold}>{new Date(apartado.fechaLimite).toLocaleDateString('es-CO')}</Text>
        </View>
        <View style={styles.row}>
          <Text>Cliente:</Text>
          <Text>{apartado.cliente?.nombre || 'General'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Doc Cliente:</Text>
          <Text>{apartado.cliente?.numeroDocumento || 'N/A'}</Text>
        </View>

        <View style={styles.divider} />

        {/* CABECERA ITEMS */}
        <View style={[styles.row, styles.bold, { marginBottom: 8 }]}>
          <Text style={styles.itemDesc}>DESCRIPCION</Text>
          <Text style={styles.itemPrice}>VALOR</Text>
        </View>

        {/* ITEMS */}
        <View style={styles.itemRow}>
          <View style={styles.itemDesc}>
            <Text>{apartado.prenda.descripcion}</Text>
            <Text style={{ fontSize: 8, color: '#666' }}>Ref: {apartado.prenda.codigo}</Text>
          </View>
          <Text style={styles.itemPrice}>{formatCOP(apartado.totalPrenda)}</Text>
        </View>

        <View style={styles.divider} />

        {/* TOTALES */}
        <View style={styles.totalSection}>
          <View style={styles.row}>
            <Text>Valor Prenda:</Text>
            <Text>{formatCOP(apartado.totalPrenda)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>Total Abonado:</Text>
            <Text style={styles.bold}>{formatCOP(apartado.abono)}</Text>
          </View>
          <View style={[styles.totalRow, styles.bold, { marginTop: 4 }]}>
            <Text>SALDO PENDIENTE:</Text>
            <Text>{formatCOP(saldo)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={{ marginBottom: 4, fontFamily: 'Helvetica-Bold' }}>TÉRMINOS Y CONDICIONES</Text>
          <Text style={{ marginBottom: 2 }}>* Plazo máximo para retirar: 30 días.</Text>
          <Text style={{ marginBottom: 4 }}>* Después del plazo la prenda vuelve a vitrina y se pierde el abono.</Text>
          <Text style={{ marginTop: 8 }}>¡Gracias por elegir El Parche!</Text>
        </View>
      </Page>
    </Document>
  );
};
