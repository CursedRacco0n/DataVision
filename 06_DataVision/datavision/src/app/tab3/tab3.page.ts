import { Component } from '@angular/core';
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
  IonSelect,
  IonSelectOption,
  IonRange,
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonNote
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
  refreshOutline
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
    IonSelect,
    IonSelectOption,
    IonRange,
    IonButton,
    IonIcon,
    IonSpinner,
    IonToast,
    IonGrid,
    IonRow,
    IonCol,
    IonNote
  ]
})
export class Tab3Page {
  // Modelo del formulario
  fecha: string = new Date().toISOString().split('T')[0];
  grupo: string = '';
  inscritos: number | null = null;
  presentes: number | null = null;
  promedio: number = 0;
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
      refreshOutline
    });
  }

  get porcentajeAsistencia(): number {
    if (!this.inscritos || Number(this.inscritos) <= 0) return 0;
    return Number(((Number(this.presentes) / Number(this.inscritos)) * 100).toFixed(1));
  }

  get porcentajeEntregas(): number {
    if (!this.actividadesProgramadas || this.actividadesProgramadas <= 0) return 0;
    return Number(((Number(this.actividadesEntregadas) / Number(this.actividadesProgramadas)) * 100).toFixed(1));
  }

  get hayErrorValidacion(): boolean {
    return (
      !this.fecha ||
      !this.grupo?.trim() ||
      this.grupo.trim().length > 20 ||
      this.inscritos === null || !Number.isFinite(Number(this.inscritos)) ||
      this.presentes === null || !Number.isFinite(Number(this.presentes)) ||
      this.actividadesProgramadas === null || !Number.isFinite(Number(this.actividadesProgramadas)) ||
      this.actividadesEntregadas === null || !Number.isFinite(Number(this.actividadesEntregadas)) ||
      Number(this.inscritos) <= 0 ||
      Number(this.presentes) < 0 ||
      Number(this.presentes) > Number(this.inscritos) ||
      this.promedio < 0 ||
      this.promedio > 100 ||
      Number(this.actividadesProgramadas) < 0 ||
      Number(this.actividadesEntregadas) < 0 ||
      Number(this.actividadesEntregadas) > Number(this.actividadesProgramadas)
    );
  }

  async guardarRegistro(): Promise<void> {
    if (this.hayErrorValidacion) {
      this.lanzarToast('Por favor verifica los campos. Presentes no puede superar inscritos.', 'danger');
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
        this.lanzarToast('Registro guardado en MySQL correctamente.', 'success');
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
    this.promedio = 0;
    this.actividadesProgramadas = null;
    this.actividadesEntregadas = null;
  }

  private lanzarToast(msg: string, color: 'success' | 'danger' | 'warning'): void {
    this.toastMensaje = msg;
    this.toastColor = color;
    this.mostrarToast = true;
  }
}
