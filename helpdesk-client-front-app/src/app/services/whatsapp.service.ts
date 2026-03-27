import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {

  constructor() { }

  buildWhatsappLink(phone: string, message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  }

  openWhatsapp(phone: string, message: string): void {
    const url = this.buildWhatsappLink(phone, message);
    window.open(url, '_blank');
  }
}