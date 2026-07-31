import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
    borderBottomStyle: 'dashed' as const,
    marginVertical: 6,
  },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 3,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 8,
    marginBottom: 4,
    textDecoration: 'underline' as const,
  },
  footer: {
    marginTop: 15,
    textAlign: 'center' as const,
    fontSize: 7,
    color: '#444444',
  },
  totalRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 3,
    fontSize: 10,
  },
});

interface Props {
  caja: any;
  config: any;
}

const formatCOP = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;

export default function ArqueoCajaPDF({ caja, config }: Props) {
  const cajaEsperada = caja.fondoInicial + caja.ventasEfectivo + caja.abonosApartados - caja.gastosEfectivo;
  
  const fechaApertura = new Date(caja.fecha).toLocaleString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fechaCierre = caja.updatedAt
    ? new Date(caja.updatedAt).toLocaleString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sin cerrar";

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
        </View>

        <View style={styles.divider} />

        {/* TITULO ARQUEO */}
        <View style={{ alignItems: 'center', marginBottom: 6 }}>
          <Text style={[styles.bold, { fontSize: 10 }]}>ARQUEO DE CAJA DIARIA</Text>
        </View>

        {/* FECHAS */}
        <View style={styles.row}>
          <Text>Apertura:</Text>
          <Text>{fechaApertura}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.bold}>Cierre:</Text>
          <Text style={styles.bold}>{fechaCierre}</Text>
        </View>
        <View style={styles.row}>
          <Text>Cajero:</Text>
          <Text>{caja.usuario?.nombre || "N/A"}</Text>
        </View>

        <View style={styles.divider} />

        {/* RESUMEN DE INGRESOS */}
        <Text style={styles.sectionTitle}>INGRESOS (SISTEMA)</Text>
        <View style={styles.row}>
          <Text>Fondo Inicial:</Text>
          <Text>{formatCOP(caja.fondoInicial)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Ventas Efectivo:</Text>
          <Text>{formatCOP(caja.ventasEfectivo)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Ventas Tarjeta:</Text>
          <Text>{formatCOP(caja.ventasTarjeta)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Transferencia/Nequi:</Text>
          <Text>{formatCOP(caja.ventasTransferencia)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Abonos Apartados:</Text>
          <Text>{formatCOP(caja.abonosApartados)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.bold}>Total Ventas del Día:</Text>
          <Text style={styles.bold}>{formatCOP(caja.totalVentasSistema)}</Text>
        </View>

        <View style={styles.divider} />

        {/* SALIDAS */}
        <Text style={styles.sectionTitle}>SALIDAS DE EFECTIVO</Text>
        <View style={styles.row}>
          <Text>Gastos / Egresos:</Text>
          <Text>{formatCOP(caja.gastosEfectivo)}</Text>
        </View>

        <View style={styles.divider} />

        {/* ARQUEO FISICO */}
        <Text style={styles.sectionTitle}>ARQUEO FÍSICO</Text>
        <View style={styles.row}>
          <Text style={styles.bold}>Efectivo Esperado:</Text>
          <Text style={styles.bold}>{formatCOP(cajaEsperada)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Contado por Cajero:</Text>
          <Text>{formatCOP(caja.efectivoContado || 0)}</Text>
        </View>

        <View style={[styles.row, { marginTop: 6 }]}>
          <Text style={[styles.bold, { fontSize: 10 }]}>DIFERENCIA:</Text>
          <Text style={[styles.bold, { fontSize: 10 }]}>{formatCOP(caja.diferencia || 0)}</Text>
        </View>

        {caja.observacion && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.bold}>Observaciones:</Text>
            <Text>{caja.observacion}</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={{ marginBottom: 4 }}>el parche colombiano hecho con amor</Text>
          <Text>Generado por el sistema de punto de venta.</Text>
        </View>
      </Page>
    </Document>
  );
}
