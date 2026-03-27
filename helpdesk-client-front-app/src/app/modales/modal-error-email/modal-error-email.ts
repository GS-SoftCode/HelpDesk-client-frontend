import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-error-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-error-email.html',
  styleUrl: './modal-error-email.css'
})
export class ModalErrorEmail {
  @Input() visible: boolean = false;
  @Input() data: string = '';
  @Output() onClose = new EventEmitter<void>();

  cerrarModal(): void {
    this.onClose.emit();
  }

  cerrarPorBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cerrarModal();
    }
  }
}
