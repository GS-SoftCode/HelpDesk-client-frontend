import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgSelectComponent, NgOptionTemplateDirective } from '@ng-select/ng-select';

import { SolTickModel } from '../../models/sol-tick.model';
import { EmpresaModel } from '../../models/empresa.model';

import { TicketService } from '../../services/ticket.service';
import { NgClass } from '@angular/common';
import { EmpresaService } from '../../services/empresa.service';

// Validador personalizado para empresa
function empresaValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  
  // Aceptar: números (ID de BD), strings (texto libre), u objetos (empresa BD)
  if (value === null || value === undefined || value === '') {
    return { required: true };
  }
  
  return null;
}

@Component({
  selector: 'app-solicitud-form',
  imports: [
    ReactiveFormsModule,
    NgClass,
    CommonModule,
    NgSelectComponent,
    NgOptionTemplateDirective
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

  imagen1Base64: string = '';
  imagen2Base64: string = '';
  imagen1Preview: string = '';
  imagen2Preview: string = '';
  imagen1Name: string = '';
  imagen2Name: string = '';

  // Opciones para el dropdown de plataforma de acceso remoto
  typeRemote: string[] = ['Ninguna', 'AnyDesk', 'RustDesk'];
  
  constructor(
    private fb: FormBuilder,
    private _ticketService: TicketService,
    private _empresaService: EmpresaService,
    private cdr: ChangeDetectorRef
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
    
    this.loadEmpresas();
  }

  get f() {
    return this.supportForm.controls;
  }

  loadEmpresas(): void {
    this._empresaService.getAll().subscribe({
      next: (resp) => {
        setTimeout(() => {
          this.empresas = resp ?? [];
        }, 0);
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
        this.error = 'No se pudieron cargar las empresas.';
      },
    });
  }

  searchEmpresa = (term: string, item: EmpresaModel): boolean => {
    const t = term.toLowerCase().trim();
    return (
      item.nomEmpresa?.toLowerCase().includes(t) ||
      item.nomRuc?.toLowerCase().includes(t)
    );
  };

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);
    
    // Validar que no sean más de 2 imágenes
    const imagenesActuales = (this.imagen1Base64 ? 1 : 0) + (this.imagen2Base64 ? 1 : 0);
    if (imagenesActuales + files.length > 2) {
      alert('⚠️ Solo puede tener máximo 2 imágenes. Elimine alguna para subir más.');
      input.value = '';
      return;
    }

    // Procesar cada archivo
    files.forEach((file) => {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert(`⚠️ El archivo "${file.name}" no es una imagen válida`);
        return;
      }

      // Validar tamaño (máximo 2MB por imagen)
      const maxSizeInBytes = 2 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        alert(`⚠️ La imagen "${file.name}" supera el tamaño máximo de 2MB`);
        return;
      }

      // Determinar dónde colocar la imagen
      let targetSlot: number;
      
      if (!this.imagen1Base64) {
        targetSlot = 0;
      } else if (!this.imagen2Base64) {
        targetSlot = 1;
      } else {
        alert('⚠️ Ya tienes 2 imágenes cargadas. Elimina una para agregar otra.');
        return;
      }
      
      // Convertir a Base64
      this.convertToBase64(file, targetSlot);
    });

    // Limpiar el input
    input.value = '';
  }

  // ✅ NUEVO MÉTODO: Convertir archivo a Base64
  convertToBase64(file: File, index: number): void {
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
      
      this.cdr.detectChanges();
      console.log(`✅ Imagen ${index + 1} convertida a Base64:`, file.name);
    };

    reader.onerror = () => {
      console.error('❌ Error al leer el archivo:', file.name);
      alert(`❌ Error al procesar la imagen "${file.name}"`);
    };

    reader.readAsDataURL(file);
  }

  // ✅ NUEVO MÉTODO: Eliminar imagen
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
    
    // Limpiar el input file
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

    const valorSeleccionado = this.supportForm.get('ruc')?.value;
    
    // ✅ NUEVA LÓGICA: Detectar si es objeto (empresa BD) o string (texto libre)
    let codEmpresa: number;
    let empresaNombre: string;

    if (typeof valorSeleccionado === 'object' && valorSeleccionado) {
      // Es una empresa de la BD (objeto)
      codEmpresa = valorSeleccionado.codEmpresa;
      empresaNombre = valorSeleccionado.nomEmpresa;
    } else {
      // Es texto libre (string), usuario escribió sin seleccionar
      codEmpresa = 0;
      empresaNombre = valorSeleccionado || 'Sin empresa';
    }

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
        fecCreacion: new Date().toISOString(), // Fecha y hora del cliente
        codCliente: '0',
        codTecnico: '0',
        codEstado: 0,
        tfnoCliente: this.supportForm.get('whatsapp')?.value||'',
        typeRemote: this.supportForm.get('typeRemote')?.value||'',
        codRemote: this.supportForm.get('codRemote')?.value||'',
        passRemote: this.supportForm.get('passRemote')?.value||''
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
          case 0:
            // ✅ Éxito
            alert('📨 ' + message + '\n' + data);
            this.resetForm();
            break;

          case 1:
            // ❌ Error al crear ticket o solicitante
            alert('⚠️ ' + message + '\n' + data);
            break;

          case 2:
            // ❌ Error al enviar el correo
            alert('❌ Ticket creado. Email inexistente, no se pudo enviar el email\n' + data);
            break;

          default:
            // ❓ Código inesperado
            alert('❓ Respuesta desconocida del servidor');
            console.warn('Respuesta inesperada:', respEmail);
            break;
        }
        // Limpia el formulario
        this.supportForm.reset();
        // Control "terms" vuelve a `false`
        this.supportForm.patchValue({ terms: false });
        // Reinicia el flag de validación
        this.submitted = false;
      },
      error: (errorEmail) => {
        // ❌ Error de red, caída del backend, CORS, etc.
        console.error('❌ Error en la conexión o en el servidor:', errorEmail);
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
    
    // Limpiar imágenes
    this.imagen1Base64 = '';
    this.imagen2Base64 = '';
    this.imagen1Preview = '';
    this.imagen2Preview = '';
    this.imagen1Name = '';
    this.imagen2Name = '';
    
    // Limpiar input file
    const fileInput = document.getElementById('evidencias') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}