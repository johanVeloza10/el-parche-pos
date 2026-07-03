import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Thermal label dimensions: e.g. 50mm x 25mm (141.7 x 70.8 points)
const styles = StyleSheet.create({
  page: {
    padding: 4,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#000000',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 2,
    maxWidth: '100%',
  },
  subtitle: {
    fontSize: 6,
    textAlign: 'center',
    marginBottom: 4,
  },
  barcodeContainer: {
    height: 30,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 3,
  }
});

interface LabelProps {
  prenda: any;
}

export const LabelBarcode: React.FC<LabelProps> = ({ prenda }) => {
  const formatCOP = (num: number) => `$${num.toLocaleString('es-CO')}`;
  
  // Usamos una API gratuita y muy confiable para generar la imagen del código de barras al vuelo
  // bcid=ean13 asegura que sea formato de escáner láser de supermercado/tienda
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=ean13&text=${prenda.codigoBarras}&scale=2&includetext=true`;

  return (
    <Document>
      <Page size={[141.7, 70.8]} style={styles.page}>
        <Text style={styles.title} numberOfLines={1}>
          {prenda.descripcion.substring(0, 20)}
        </Text>
        <Text style={styles.subtitle}>
          EL PARCHE DISEÑO - {prenda.codigo}
        </Text>
        
        <View style={styles.barcodeContainer}>
          <Image src={barcodeUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </View>

        <Text style={styles.price}>
          {formatCOP(prenda.precioVenta)}
        </Text>
      </Page>
    </Document>
  );
};
