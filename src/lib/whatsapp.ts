/**
 * Servicio de notificaciones por WhatsApp usando CallMeBot API (o similar).
 * La API Key debe obtenerse enviando un mensaje por WhatsApp a CallMeBot.
 * Instrucciones: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 */

export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    const apikey = process.env.WHATSAPP_API_KEY;
    const formattedPhone = phone.startsWith("+") ? phone : `+57${phone}`; // Asume Colombia por defecto

    if (!apikey) {
      console.log(`[WHATSAPP MOCK a dueña] Destino: ${formattedPhone}\nMensaje:\n${message}\n----------------------`);
      return { success: true, mock: true };
    }

    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(message)}&apikey=${apikey}`;
    
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Error enviando WhatsApp (Status: ${res.status})`);
      return { success: false, error: "Error HTTP " + res.status };
    }

    return { success: true };
  } catch (error) {
    console.error("Error en sendWhatsAppMessage:", error);
    return { success: false, error };
  }
}
