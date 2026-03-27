import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhatsappService } from '../../services/whatsapp.service';

export interface FormDataWhatsapp {
  empresa: string;
  nombres: string;
  apellidos: string;
  email: string;
  whatsapp: string;
  motivo: string;
  typeRemote?: string | null;
  codRemote?: string | null;
  passRemote?: string | null;
}

@Component({
  selector: 'app-modal-exito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-exito.html',
  styleUrl: './modal-exito.css'
})
export class ModalExito {
  @Input() visible: boolean = false;
  @Input() message: string = '';
  @Input() data: string = '';
  @Input() whatsappNumber: string = '';
  @Input() formData: FormDataWhatsapp | null = null;
  @Output() onClose = new EventEmitter<void>();

  constructor(private whatsappService: WhatsappService) {}

  cerrarModal(): void {
    if (this.whatsappNumber && this.formData) {
      const mensaje = this.construirMensaje();
      this.whatsappService.openWhatsapp(this.whatsappNumber, mensaje);
    }
    this.onClose.emit();
  }

  construirMensaje(): string {
    if (!this.formData) return '';

    let mensaje = ' *NUEVA SOLICITUD DE SOPORTE TÉCNICO*\n\n';
    mensaje += ` *Cliente:* ${this.formData.nombres} ${this.formData.apellidos}\n`;
    mensaje += ` *Empresa:* ${this.formData.empresa}\n`;
    mensaje += ` *Email:* ${this.formData.email}\n`;
    mensaje += ` *WhatsApp:* ${this.formData.whatsapp}\n\n`;
    mensaje += ` *Motivo:*\n${this.formData.motivo}\n`;
    
    if (this.formData.typeRemote && this.formData.typeRemote !== 'Ninguna') {
      mensaje += `\n *Acceso Remoto:*\n`;
      mensaje += `- Plataforma: ${this.formData.typeRemote}\n`;
      mensaje += `- Código: ${this.formData.codRemote || 'N/A'}\n`;
      mensaje += `- Contraseña: ${this.formData.passRemote || 'N/A'}\n`;
    }

    return mensaje;
  }

  cerrarPorBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cerrarModal();
    }
  }
}
