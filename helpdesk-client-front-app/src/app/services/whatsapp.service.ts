import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {

  constructor() { }

  // Construye el enlace de WhatsApp con número y mensaje
  buildWhatsappLink(phone: string, message: string): string {
    const encodedMessage = encodeURIComponent(message);
    // Asegúrate de que el número esté en formato internacional, sin espacios ni signos +
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  }

  // Abre WhatsApp Web en una nueva pestaña con el mensaje y número dados
  openWhatsapp(phone: string, message: string): void {
    const url = this.buildWhatsappLink(phone, message);
    window.open(url, '_blank');
  }
}