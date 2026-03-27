import { Component, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';

import { SolTickModel } from '../../models/sol-tick.model';
import { EmpresaModel } from '../../models/empresa.model';

import { TicketService } from '../../services/ticket.service';
import { EmpresaService } from '../../services/empresa.service';
import { WhatsappService } from '../../services/whatsapp.service';

import { ModalExito, FormDataWhatsapp } from '../../modales/modal-exito/modal-exito';
import { ModalErrorEmail } from '../../modales/modal-error-email/modal-error-email';

// Validador que acepta: empresa de BD (objeto), texto libre (string) o número
function empresaValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return { required: true };
  }
  return null;
}

@Component({
  selector: 'app-solicitud-form',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    CommonModule,
    ModalExito,
    ModalErrorEmail
  ],
  templateUrl: './solicitud-form.html',
  styleUrl: './solicitud-form.css',
})
export class SolicitudForm {
  supportForm!: FormGroup;
  submitted = false;
  loading = false;
  error: string = '';

  empresas: EmpresaModel[] = [];
  searchText: string = '';
  showDropdown: boolean = false;
  filteredEmpresas: EmpresaModel[] = [];
  selectedEmpresa: EmpresaModel | null = null;
  searchTextPlatform: string = '';
  showDropdownPlatform: boolean = false;
  filteredPlatforms: string[] = [];
  selectedPlatform: string = '';

  imagen1Base64: string = '';
  imagen2Base64: string = '';
  imagen1Preview: string = '';
  imagen2Preview: string = '';
  imagen1Name: string = '';
  imagen2Name: string = '';
  typeRemote: string[] = ['Ninguna','AnyDesk', 'RustDesk'];
  showModalExito: boolean = false;
  showModalErrorEmail: boolean = false;
  modalExitoMessage: string = '';
  modalExitoData: string = '';
  modalErrorEmailData: string = '';
  modalWhatsappNumber: string = '';
  modalFormData: FormDataWhatsapp | null = null;
  
  constructor(
    private fb: FormBuilder,
    private _ticketService: TicketService,
    private _empresaService: EmpresaService,
    private whatsappService: WhatsappService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.supportForm = this.fb.group({
      ruc: [null, empresaValidator],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      whatsapp: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.minLength(20)]],
      typeRemote: ['Ninguna'],
      codRemote: [''],
      passRemote: [''],
      terms: [false, Validators.requiredTrue],
    });

    this.supportForm.get('codRemote')?.disable();
    this.supportForm.get('passRemote')?.disable();

    // Habilitar/deshabilitar campos según plataforma de acceso remoto
    this.supportForm.get('typeRemote')?.valueChanges.subscribe((value) => {
      if (value === 'Ninguna') {
        this.supportForm.get('codRemote')?.disable();
        this.supportForm.get('passRemote')?.disable();
      } else {
        this.supportForm.get('codRemote')?.enable();
        this.supportForm.get('passRemote')?.enable();
      }
    });
    
    this.loadEmpresas();
    this.filteredEmpresas = [];
    this.filteredPlatforms = [...this.typeRemote];
    this.searchTextPlatform = 'Ninguna';
    this.selectedPlatform = 'Ninguna';
  }

  get f() {
    return this.supportForm.controls;
  }

  shouldShowCodRemoteError(): boolean {
    const typeRemoteValue = this.supportForm.get('typeRemote')?.value;
    const codRemoteValue = this.supportForm.get('codRemote')?.value;
    return this.submitted && typeRemoteValue !== 'Ninguna' && (!codRemoteValue || codRemoteValue.trim() === '');
  }

  shouldShowPassRemoteError(): boolean {
    const typeRemoteValue = this.supportForm.get('typeRemote')?.value;
    const passRemoteValue = this.supportForm.get('passRemote')?.value;
    return this.submitted && typeRemoteValue !== 'Ninguna' && (!passRemoteValue || passRemoteValue.trim() === '');
  }

  loadEmpresas(): void {
    this._empresaService.getAll().subscribe({
      next: (resp) => {
        setTimeout(() => {
          this.empresas = resp ?? [];
          this.filteredEmpresas = [...this.empresas];
        }, 0);
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
        this.error = 'No se pudieron cargar las empresas.';
      },
    });
  }

  onSearchChange(): void {
    const term = this.searchText.toLowerCase().trim();
    this.selectedEmpresa = null;
    
    if (term === '') {
      this.filteredEmpresas = [...this.empresas];
      this.showDropdown = true;
    } else {
      this.filteredEmpresas = this.empresas.filter(empresa =>
        empresa.nomEmpresa?.toLowerCase().includes(term) ||
        empresa.nomRuc?.toLowerCase().includes(term)
      );
      this.showDropdown = true;
    }
  }

  toggleDropdown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown && this.searchText === '') {
      this.filteredEmpresas = [...this.empresas];
    }
  }

  selectEmpresa(empresa: EmpresaModel): void {
    this.selectedEmpresa = empresa;
    this.searchText = empresa.nomEmpresa;
    this.supportForm.patchValue({ ruc: empresa });
    this.showDropdown = false;
  }

  onInputBlur(): void {
    if (this.searchText && !this.selectedEmpresa) {
      this.supportForm.patchValue({ ruc: this.searchText });
    }
  }

  onSearchChangePlatform(): void {
    const term = this.searchTextPlatform.toLowerCase().trim();
    
    if (term === '') {
      this.filteredPlatforms = [...this.typeRemote];
      this.showDropdownPlatform = true;
    } else {
      this.filteredPlatforms = this.typeRemote.filter(platform =>
        platform.toLowerCase().includes(term)
      );
      this.showDropdownPlatform = true;
    }
  }

  toggleDropdownPlatform(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.showDropdownPlatform = !this.showDropdownPlatform;
    if (this.showDropdownPlatform && this.searchTextPlatform === '') {
      this.filteredPlatforms = [...this.typeRemote];
    }
  }

  selectPlatform(platform: string): void {
    this.selectedPlatform = platform;
    this.searchTextPlatform = platform;
    this.supportForm.patchValue({ typeRemote: platform });
    this.showDropdownPlatform = false;
  }

  onInputBlurPlatform(): void {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInsideEmpresa = target.closest('.custom-dropdown');
    if (!clickedInsideEmpresa) {
      this.showDropdown = false;
      this.showDropdownPlatform = false;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const files = Array.from(input.files);
    const imagenesActuales = (this.imagen1Base64 ? 1 : 0) + (this.imagen2Base64 ? 1 : 0);
    if (imagenesActuales + files.length > 2) {
      alert('⚠️ Solo puede tener máximo 2 imágenes. Elimine alguna para subir más.');
      input.value = '';
      return;
    }
    let processed = 0;
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`⚠️ El archivo "${file.name}" no es una imagen válida`);
        return;
      }
      const maxSizeInBytes = 2 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        alert(`⚠️ La imagen "${file.name}" supera el tamaño máximo de 2MB`);
        return;
      }
      let targetSlot: number;
      if (!this.imagen1Base64) {
        targetSlot = 0;
      } else if (!this.imagen2Base64) {
        targetSlot = 1;
      } else {
        alert('⚠️ Ya tienes 2 imágenes cargadas. Elimina una para agregar otra.');
        return;
      }
      this.convertToBase64(file, targetSlot, true);
      processed++;
    });
    if (processed > 0) {
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
    input.value = '';
  }

  convertToBase64(file: File, index: number, forceDetect: boolean = false): void {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      if (index === 0) {
        this.imagen1Base64 = base64String;
        this.imagen1Preview = base64String;
        this.imagen1Name = file.name;
      } else if (index === 1) {
        this.imagen2Base64 = base64String;
        this.imagen2Preview = base64String;
        this.imagen2Name = file.name;
      }
      if (forceDetect) {
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
      console.log(`✅ Imagen ${index + 1} convertida a Base64:`, file.name);
    };
    reader.onerror = () => {
      console.error('❌ Error al leer el archivo:', file.name);
      alert(`❌ Error al procesar la imagen "${file.name}"`);
    };
    reader.readAsDataURL(file);
  }

  removeImage(imageNumber: number): void {
    if (imageNumber === 1) {
      this.imagen1Base64 = '';
      this.imagen1Preview = '';
      this.imagen1Name = '';
    } else if (imageNumber === 2) {
      this.imagen2Base64 = '';
      this.imagen2Preview = '';
      this.imagen2Name = '';
    }
    const fileInput = document.getElementById('evidencias') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.loading = true;

    if (this.supportForm.invalid) {
      this.loading = false;
      return;
    }

    const typeRemoteValue = this.supportForm.get('typeRemote')?.value;
    if (typeRemoteValue !== 'Ninguna') {
      const codRemoteValue = this.supportForm.get('codRemote')?.value;
      const passRemoteValue = this.supportForm.get('passRemote')?.value;
      
      if (!codRemoteValue || codRemoteValue.trim() === '' || !passRemoteValue || passRemoteValue.trim() === '') {
        this.loading = false;
        return;
      }
    }

    const valorSeleccionado = this.supportForm.get('ruc')?.value;
    let codEmpresa: number;
    let empresaNombre: string;

    // Distinguir si es empresa de BD (objeto) o texto libre (string)
    if (typeof valorSeleccionado === 'object' && valorSeleccionado) {
      codEmpresa = valorSeleccionado.codEmpresa;
      empresaNombre = valorSeleccionado.nomEmpresa;
    } else {
      codEmpresa = 0;
      empresaNombre = valorSeleccionado || 'Sin empresa';
    }

    const typeRemote = typeRemoteValue === 'Ninguna' ? null : typeRemoteValue;

    const soltick: SolTickModel = {
      solicitante: {
        codEmpresa: codEmpresa,
        codCliente: 1,
        nomSolicitante: this.supportForm.get('nombres')?.value,
        apeSolicitante: this.supportForm.get('apellidos')?.value,
        emailSolicitante: this.supportForm.get('email')?.value,
        telSolicitante: this.supportForm.get('whatsapp')?.value,
      },
      ticket: {
        codTicket: 0,
        codEmpresa: codEmpresa,
        txtTitulo: empresaNombre,
        txtDesc: this.supportForm.get('motivo')?.value,
        fecCreacion: new Date().toISOString(),
        codCliente: '0',
        codTecnico: '0',
        codEstado: 0,
        tfnoCliente: this.supportForm.get('whatsapp')?.value || null,
        typeRemote: typeRemote,
        codRemote: this.supportForm.get('codRemote')?.value || null,
        passRemote: this.supportForm.get('passRemote')?.value || null
      },
      img1: this.imagen1Base64 || undefined,
      img2: this.imagen2Base64 || undefined
    };

    this._ticketService.createEnviarEmail(soltick).subscribe({
      next: (respEmail) => {
        const code = respEmail.status;
        const message = respEmail.message;
        const data = respEmail.data;

        switch (code) {
          case 0: // Éxito completo
            this.modalExitoMessage = message;
            this.modalExitoData = data;
            this.modalWhatsappNumber = '593983235824';
            this.modalFormData = {
              empresa: empresaNombre,
              nombres: this.supportForm.get('nombres')?.value,
              apellidos: this.supportForm.get('apellidos')?.value,
              email: this.supportForm.get('email')?.value,
              whatsapp: this.supportForm.get('whatsapp')?.value,
              motivo: this.supportForm.get('motivo')?.value,
              typeRemote: this.supportForm.get('typeRemote')?.value,
              codRemote: this.supportForm.get('codRemote')?.value,
              passRemote: this.supportForm.get('passRemote')?.value
            };
            
            this.showModalExito = true;
            this.resetForm();
            break;

          case 1: // Error al crear ticket
            alert('⚠️ ' + message + '\n' + data);
            break;

          case 2: // Ticket creado, error al enviar email
            this.modalErrorEmailData = data;
            this.showModalErrorEmail = true;
            this.resetForm();
            break;

          default:
            alert('❓ Respuesta desconocida del servidor');
            console.warn('Respuesta inesperada:', respEmail);
            break;
        }
        this.supportForm.reset();
        this.supportForm.patchValue({ terms: false });
        this.submitted = false;
      },
      error: (errorEmail) => {
        console.error('Error en la conexión o en el servidor:', errorEmail);
        alert('❌ Error de conexión con el servidor. Intente más tarde.');
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  resetForm(): void {
    this.supportForm.reset();
    this.supportForm.patchValue({ terms: false });
    this.submitted = false;
    this.imagen1Base64 = '';
    this.imagen2Base64 = '';
    this.imagen1Preview = '';
    this.imagen2Preview = '';
    this.imagen1Name = '';
    this.imagen2Name = '';
    const fileInput = document.getElementById('evidencias') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  cerrarModalExito(): void {
    this.showModalExito = false;
    this.modalExitoMessage = '';
    this.modalExitoData = '';
    this.modalWhatsappNumber = '';
    this.modalFormData = null;
  }

  cerrarModalErrorEmail(): void {
    this.showModalErrorEmail = false;
    this.modalErrorEmailData = '';
  }
}