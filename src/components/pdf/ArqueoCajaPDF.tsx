import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'dashed',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    textDecoration: 'underline',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
    fontSize: 9,
    fontStyle: 'italic',
  }
});

interface Props {
  caja: any;
  config: any;
}

const formatCOP = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;

export default function ArqueoCajaPDF({ caja, config }: Props) {
  const cajaEsperada = caja.fondoInicial + caja.ventasEfectivo + caja.abonosApartados - caja.gastosEfectivo;
  const fechaStr = new Date(caja.fecha).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>{config.nombreNegocio || "EL PARCHE DISEÑO"}</Text>
          <Text style={styles.subtitle}>NIT: {config.nit || "52157597-9"}</Text>
          <Text style={styles.subtitle}>ARQUEO DE CAJA DIARIA</Text>
          <Text style={styles.subtitle}>Fecha: {fechaStr}</Text>
          <Text style={styles.subtitle}>Cajero: {caja.usuario?.nombre || "N/A"}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>RESUMEN DE INGRESOS (SISTEMA)</Text>
        <View style={styles.row}>
          <Text>Fondo Inicial:</Text>
          <Text>{formatCOP(caja.fondoInicial)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Ventas en Efectivo:</Text>
          <Text>{formatCOP(caja.ventasEfectivo)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Ventas en Tarjeta:</Text>
          <Text>{formatCOP(caja.ventasTarjeta)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Ventas Transferencia/Nequi:</Text>
          <Text>{formatCOP(caja.ventasTransferencia)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Abonos (Apartados):</Text>
          <Text>{formatCOP(caja.abonosApartados)}</Text>
        </View>
        
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.bold}>Total Ventas del Día:</Text>
          <Text style={styles.bold}>{formatCOP(caja.totalVentasSistema)}</Text>
        </View>

        <Text style={styles.sectionTitle}>SALIDAS DE EFECTIVO</Text>
        <View style={styles.row}>
          <Text>Gastos Diarios / Egresos:</Text>
          <Text>{formatCOP(caja.gastosEfectivo)}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>ARQUEO FÍSICO</Text>
        <View style={styles.row}>
          <Text style={styles.bold}>Efectivo Esperado (Sistema):</Text>
          <Text style={styles.bold}>{formatCOP(cajaEsperada)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Efectivo Contado por Cajero:</Text>
          <Text>{formatCOP(caja.efectivoContado || 0)}</Text>
        </View>
        
        <View style={[styles.row, { marginTop: 10 }]}>
          <Text style={styles.bold}>DIFERENCIA (Faltante/Sobrante):</Text>
          <Text style={styles.bold}>{formatCOP(caja.diferencia || 0)}</Text>
        </View>

        {caja.observacion && (
          <View style={{ marginTop: 15 }}>
            <Text style={styles.bold}>Observaciones:</Text>
            <Text>{caja.observacion}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>el parche colombiano hecho con amor</Text>
          <Text>Generado por el sistema de punto de venta.</Text>
        </View>
      </Page>
    </Document>
  );
}
