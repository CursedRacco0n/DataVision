import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonSpinner,
  IonToast,
  IonAlert,
  IonNote
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  syncOutline,
  fileTrayFullOutline,
  flaskOutline
} from 'ionicons/icons';
import { CsvService } from '../services/csv.service';
import { DataService } from '../services/data.service';
import { IndicadorAcademico, ValidacionCsvFila } from '../models/indicador.model';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonSpinner,
    IonToast,
    IonAlert,
    IonNote
  ]
})
export class Tab2Page {
  archivoSeleccionado: File | null = null;
  nombreArchivo: string = '';
  estaProcesando: boolean = false;
  sincronizando: boolean = false;

  filasValidas: IndicadorAcademico[] = [];
  filasConError: ValidacionCsvFila[] = [];
  vistaSegmento: 'validas' | 'errores' = 'validas';

  // Feedback Toast & Alert
  toastMensaje: string = '';
  mostrarToast: boolean = false;
  toastColor: 'success' | 'danger' | 'warning' = 'success';

  mostrarAlerta: boolean = false;
  alertaTitulo: string = '';
  alertaMensaje: string = '';

  constructor(
    private csvService: CsvService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      cloudUploadOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      syncOutline,
      fileTrayFullOutline,
      flaskOutline
    });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    await this.procesarArchivo(file);
    input.value = ''; // Resetear input
  }

  async procesarArchivo(file: File): Promise<void> {
    this.estaProcesando = true;
    this.nombreArchivo = file.name;

    try {
      const res = await this.csvService.procesarArchivoCsv(file);
      this.filasValidas = res.filasValidas;
      this.filasConError = res.filasConError;
      this.vistaSegmento = this.filasValidas.length > 0 ? 'validas' : 'errores';
      this.lanzarToast(
        `CSV procesado: ${this.filasValidas.length} filas válidas, ${this.filasConError.length} con error`,
        this.filasConError.length === 0 ? 'success' : 'warning'
      );
    } catch (err: any) {
      this.lanzarToast(err.message || 'Error al procesar el archivo CSV', 'danger');
    } finally {
      this.estaProcesando = false;
      this.cdr.detectChanges();
    }
  }


  /**
   * Sincroniza las filas válidas en MySQL / Memoria reactiva y actualiza ECharts
   */
  async sincronizarConMySQL(): Promise<void> {
    if (this.filasValidas.length === 0) {
      this.lanzarToast('No hay filas válidas para sincronizar', 'warning');
      return;
    }

    this.sincronizando = true;
    try {
      const res = await this.dataService.importarCsvFilas(this.filasValidas);
      this.alertaTitulo = 'Sincronización Completada';
      this.alertaMensaje = `Registros insertados: ${res.insertados}\nRechazados: ${res.rechazados}\n\nEl dashboard recupera los datos desde MySQL.`;
      this.mostrarAlerta = true;

      // Limpiar cola de válidas importadas
      if (res.rechazados === 0) this.filasValidas = [];
    } catch (err: any) {
      this.lanzarToast(`Error al sincronizar: ${err.message}`, 'danger');
    } finally {
      this.sincronizando = false;
      this.cdr.detectChanges();
    }
  }

  private lanzarToast(mensaje: string, color: 'success' | 'danger' | 'warning'): void {
    this.toastMensaje = mensaje;
    this.toastColor = color;
    this.mostrarToast = true;
  }
}
