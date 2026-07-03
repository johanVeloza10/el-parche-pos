export interface VentaDTO {
  id: string;
  total: number;
  descuento: number;
  medioPago: string;
  items: Array<{
    prendaId: string;
    precioVenta: number;
    descripcion?: string;
  }>;
}

export interface ClienteDTO {
  nombre: string;
  tipoDocumento?: string;
  numeroDocumento: string;
  email?: string | null;
}

export interface DocumentoFiscalDTO {
  id: string;
  numero: string;
  cufe?: string | null;
}

export interface ResultadoEmision {
  numero: string;
  cufe: string;
  qrData: string;
  estadoTransmision: "ACEPTADO" | "RECHAZADO" | "PENDIENTE";
  respuestaProveedor?: any;
}

export interface FacturacionProvider {
  emitirDeePos(venta: VentaDTO): Promise<ResultadoEmision>;
  emitirFacturaElectronica(venta: VentaDTO, cliente: ClienteDTO): Promise<ResultadoEmision>;
  emitirNotaAjuste(docOriginal: DocumentoFiscalDTO, motivo: string): Promise<ResultadoEmision>;
  consultarEstado(documentoId: string): Promise<"PENDIENTE" | "ACEPTADO" | "RECHAZADO">;
}
