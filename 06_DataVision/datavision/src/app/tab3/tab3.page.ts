import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonRange,
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonNote,
  IonChip
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  saveOutline,
  calendarOutline,
  schoolOutline,
  peopleOutline,
  ribbonOutline,
  checkboxOutline,
  refreshOutline,
  sparklesOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { DataService } from '../services/data.service';
import { IndicadorAcademico } from '../models/indicador.model';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonRange,
    IonButton,
    IonIcon,
    IonSpinner,
    IonToast,
    IonGrid,
    IonRow,
    IonCol,
    IonNote,
    IonChip
  ]
})
export class Tab3Page implements OnInit {
  // Modelo del formulario
  fecha: string = new Date().toISOString().split('T')[0];
  grupo: string = '';
  inscritos: number | null = null;
  presentes: number | null = null;
  promedio: number = 85;
  actividadesProgramadas: number | null = null;
  actividadesEntregadas: number | null = null;

  guardando: boolean = false;
  toastMensaje: string = '';
  mostrarToast: boolean = false;
  toastColor: 'success' | 'danger' | 'warning' = 'success';

  constructor(
    private dataService: DataService
  ) {
    addIcons({
      addCircleOutline,
      saveOutline,
      calendarOutline,
      schoolOutline,
      peopleOutline,
      ribbonOutline,
      checkboxOutline,
      refreshOutline,
      sparklesOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit(): void {
    // Si aún no se han cargado datos, consultar backend en segundo plano
    if (!this.dataService.todos.length) {
      void this.dataService.cargarDesdeBackend();
    }
  }

  get gruposDisponibles(): string[] {
    const list = [...new Set(this.dataService.todos.map((d) => d.grupo))].filter(Boolean);
    return list.length ? list : ['2A', '2B', '2C', 'Maths', 'English', 'Physics'];
  }

  seleccionarGrupo(g: string): void {
    this.grupo = g;
  }

  cargarEjemplo(): void {
    const grupos = this.gruposDisponibles;
    this.grupo = grupos[Math.floor(Math.random() * grupos.length)] || '2A';
    this.fecha = new Date().toISOString().split('T')[0];
    this.inscritos = 30;
    this.presentes = 27;
    this.promedio = 88.5;
    this.actividadesProgramadas = 30;
    this.actividadesEntregadas = 25;
    this.lanzarToast('Datos de ejemplo cargados en el formulario.', 'success');
  }

  get porcentajeAsistencia(): number {
    if (!this.inscritos || Number(this.inscritos) <= 0) return 0;
    return Number(((Number(this.presentes || 0) / Number(this.inscritos)) * 100).toFixed(1));
  }

  get porcentajeEntregas(): number {
    if (!this.actividadesProgramadas || Number(this.actividadesProgramadas) <= 0) return 0;
    return Number(((Number(this.actividadesEntregadas || 0) / Number(this.actividadesProgramadas)) * 100).toFixed(1));
  }

  validarFormulario(): string | null {
    if (!this.fecha) {
      return 'Por favor selecciona la fecha de medición.';
    }
    if (!this.grupo?.trim()) {
      return 'Por favor ingresa o selecciona la materia o grupo.';
    }
    if (this.grupo.trim().length > 20) {
      return 'El nombre del grupo o materia no puede exceder 20 caracteres.';
    }

    if (this.inscritos === null || this.inscritos === undefined || isNaN(Number(this.inscritos)) || Number(this.inscritos) <= 0) {
      return 'Ingresa los alumnos inscritos (número entero mayor a 0).';
    }

    if (this.presentes === null || this.presentes === undefined || isNaN(Number(this.presentes)) || Number(this.presentes) < 0) {
      return 'Ingresa los alumnos presentes (0 o mayor).';
    }

    if (Number(this.presentes) > Number(this.inscritos)) {
      return `Los alumnos presentes (${this.presentes}) no pueden superar a los inscritos (${this.inscritos}).`;
    }

    const prom = Number(this.promedio);
    if (isNaN(prom) || prom < 0 || prom > 100) {
      return 'El promedio debe estar en el rango de 0 a 100.';
    }

    if (this.actividadesProgramadas === null || this.actividadesProgramadas === undefined || isNaN(Number(this.actividadesProgramadas)) || Number(this.actividadesProgramadas) < 0) {
      return 'Ingresa las actividades programadas (0 o mayor).';
    }

    if (this.actividadesEntregadas === null || this.actividadesEntregadas === undefined || isNaN(Number(this.actividadesEntregadas)) || Number(this.actividadesEntregadas) < 0) {
      return 'Ingresa las actividades entregadas (0 o mayor).';
    }

    if (Number(this.actividadesEntregadas) > Number(this.actividadesProgramadas)) {
      return `Las actividades entregadas (${this.actividadesEntregadas}) no pueden superar a las programadas (${this.actividadesProgramadas}).`;
    }

    return null; // Válido
  }

  async guardarRegistro(): Promise<void> {
    const errorMsg = this.validarFormulario();
    if (errorMsg) {
      this.lanzarToast(errorMsg, 'warning');
      return;
    }

    this.guardando = true;

    const nuevo: Omit<IndicadorAcademico, 'id'> = {
      fecha: this.fecha,
      grupo: this.grupo.trim(),
      inscritos: Number(this.inscritos),
      presentes: Number(this.presentes),
      promedio: Number(this.promedio),
      actividadesProgramadas: Number(this.actividadesProgramadas),
      actividadesEntregadas: Number(this.actividadesEntregadas),
      origen: 'manual'
    };

    try {
      const res = await this.dataService.agregarIndicador(nuevo);
      if (res.ok) {
        this.lanzarToast('¡Registro guardado en MySQL y gráficas actualizadas!', 'success');
        this.restablecerFormulario();
      } else {
        this.lanzarToast(`No se pudo registrar: ${res.error}`, 'danger');
      }
    } catch (e: any) {
      this.lanzarToast(`Error inesperado: ${e.message}`, 'danger');
    } finally {
      this.guardando = false;
    }
  }

  restablecerFormulario(): void {
    this.fecha = new Date().toISOString().split('T')[0];
    this.grupo = '';
    this.inscritos = null;
    this.presentes = null;
    this.promedio = 85;
    this.actividadesProgramadas = null;
    this.actividadesEntregadas = null;
  }

  private lanzarToast(msg: string, color: 'success' | 'danger' | 'warning'): void {
    this.toastMensaje = msg;
    this.toastColor = color;
    this.mostrarToast = true;
  }
}

