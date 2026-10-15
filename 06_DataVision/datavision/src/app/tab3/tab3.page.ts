import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  grupo: string = 'Maths';
  inscritos: number = 30;
  presentes: number = 28;
  promedio: number = 85;
  actividadesProgramadas: number = 30;
  actividadesEntregadas: number = 27;

  guardando: boolean = false;
  toastMensaje: string = '';
  mostrarToast: boolean = false;
  toastColor: 'success' | 'danger' | 'warning' = 'success';

  constructor(
    private dataService: DataService,
    private router: Router
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
    if (!this.inscritos || this.inscritos <= 0) return 0;
    return Number(((this.presentes / this.inscritos) * 100).toFixed(1));
  }

  get porcentajeEntregas(): number {
    if (!this.actividadesProgramadas || this.actividadesProgramadas <= 0) return 0;
    return Number(((this.actividadesEntregadas / this.actividadesProgramadas) * 100).toFixed(1));
  }

  get hayErrorValidacion(): boolean {
    return (
      !this.fecha ||
      !this.grupo ||
      this.inscritos <= 0 ||
      this.presentes < 0 ||
      this.presentes > this.inscritos ||
      this.promedio < 0 ||
      this.promedio > 100 ||
      this.actividadesProgramadas < 0 ||
      this.actividadesEntregadas < 0 ||
      this.actividadesEntregadas > this.actividadesProgramadas
    );
  }

  async guardarRegistro(): Promise<void> {
    if (this.hayErrorValidacion) {
      this.lanzarToast('Por favor verifica los campos. Presentes no puede superar inscritos.', 'danger');
      return;
    }

    this.guardando = true;

    const nuevo: IndicadorAcademico = {
      fecha: this.fecha,
      grupo: this.grupo,
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
        this.lanzarToast('¡Indicador registrado y sincronizado exitosamente!', 'success');
        // Resetear fecha a mañana o mantener
        setTimeout(() => {
          this.router.navigate(['/tabs/analytics']);
        }, 1200);
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
    this.grupo = 'Maths';
    this.inscritos = 30;
    this.presentes = 28;
    this.promedio = 85;
    this.actividadesProgramadas = 30;
    this.actividadesEntregadas = 27;
  }

  private lanzarToast(msg: string, color: 'success' | 'danger' | 'warning'): void {
    this.toastMensaje = msg;
    this.toastColor = color;
    this.mostrarToast = true;
  }
}
