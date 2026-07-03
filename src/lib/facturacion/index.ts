import { MockFacturacionProvider } from "./mock.provider";
import { FacturacionProvider } from "./provider.interface";

// Singleton para toda la aplicación
let billingProvider: FacturacionProvider;

if (process.env.NODE_ENV === "production") {
  // En producción podríamos inicializar un proveedor real más adelante
  billingProvider = new MockFacturacionProvider();
} else {
  // En desarrollo/test usamos el mock
  if (!globalThis.billingProviderGlobal) {
    globalThis.billingProviderGlobal = new MockFacturacionProvider();
  }
  billingProvider = globalThis.billingProviderGlobal;
}

export { billingProvider };
export * from "./provider.interface";
export * from "./mock.provider";

// Declaración global para evitar múltiples instancias en Hot Reloading de Next.js
declare global {
  var billingProviderGlobal: FacturacionProvider | undefined;
}
