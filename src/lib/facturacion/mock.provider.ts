import { ClienteDTO, DocumentoFiscalDTO, FacturacionProvider, ResultadoEmision, VentaDTO } from "./provider.interface";

// Generador de UUID sencillo
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export class MockFacturacionProvider implements FacturacionProvider {
  private async simularLatencia(): Promise<void> {
    const ms = Math.floor(Math.random() * (1200 - 800 + 1) + 800);
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private evaluarProbabilidadExito(): boolean {
    // 95% de éxito, 5% de fallo
    return Math.random() < 0.95;
  }

  async emitirDeePos(venta: VentaDTO): Promise<ResultadoEmision> {
    await this.simularLatencia();
    
    if (!this.evaluarProbabilidadExito()) {
      return {
        numero: `POS-MOCK-${venta.id.substring(0, 5)}`,
        cufe: "",
        qrData: "",
        estadoTransmision: "RECHAZADO",
        respuestaProveedor: { error: "Error de conexión con la DIAN - Tiempo de espera agotado (simulado)" }
      };
    }

    const cufe = `CUDE-MOCK-${generateUUID()}`;
    return {
      numero: `POS-MOCK-${venta.id.substring(0, 5)}`,
      cufe,
      qrData: `https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=${cufe}`,
      estadoTransmision: "ACEPTADO",
      respuestaProveedor: { mensaje: "Tiquete electrónico emitido exitosamente" }
    };
  }

  async emitirFacturaElectronica(venta: VentaDTO, cliente: ClienteDTO): Promise<ResultadoEmision> {
    await this.simularLatencia();

    if (!this.evaluarProbabilidadExito()) {
      return {
        numero: `FE-MOCK-${venta.id.substring(0, 5)}`,
        cufe: "",
        qrData: "",
        estadoTransmision: "RECHAZADO",
        respuestaProveedor: { error: "Fallo en validación de NIT del cliente ante DIAN (simulado)" }
      };
    }

    const cufe = `CUFE-MOCK-${generateUUID()}`;
    return {
      numero: `FE-MOCK-${venta.id.substring(0, 5)}`,
      cufe,
      qrData: `https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=${cufe}`,
      estadoTransmision: "ACEPTADO",
      respuestaProveedor: { 
        mensaje: "Factura electrónica aceptada por la DIAN",
        cliente: cliente.nombre,
        nit: cliente.numeroDocumento
      }
    };
  }

  async emitirNotaAjuste(docOriginal: DocumentoFiscalDTO, motivo: string): Promise<ResultadoEmision> {
    await this.simularLatencia();

    if (!this.evaluarProbabilidadExito()) {
      return {
        numero: `NC-MOCK-${docOriginal.id.substring(0, 5)}`,
        cufe: "",
        qrData: "",
        estadoTransmision: "RECHAZADO",
        respuestaProveedor: { error: "Error de firma digital en nota crédito (simulado)" }
      };
    }

    const cufe = `NC-MOCK-CUFE-${generateUUID()}`;
    return {
      numero: `NC-MOCK-${docOriginal.id.substring(0, 5)}`,
      cufe,
      qrData: `https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=${cufe}`,
      estadoTransmision: "ACEPTADO",
      respuestaProveedor: { 
        mensaje: "Nota de ajuste procesada con éxito",
        motivo,
        documentoOriginal: docOriginal.numero
      }
    };
  }

  async consultarEstado(documentoId: string): Promise<"PENDIENTE" | "ACEPTADO" | "RECHAZADO"> {
    await this.simularLatencia();
    // Simula consulta de estado: la mayoría de veces se resuelve a ACEPTADO
    return "ACEPTADO";
  }
}
