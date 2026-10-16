import { Component, OnInit, OnDestroy } from '@angular/core';
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
  IonSearchbar,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonInput,
  IonSpinner,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonLabel
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  serverOutline,
  pulseOutline,
  downloadOutline,
  refreshOutline,
  trashOutline,
  searchOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  linkOutline,
  schoolOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { DataService } from '../services/data.service';
import { ApiService } from '../services/api.service';
import { CsvService } from '../services/csv.service';
import { IndicadorAcademico } from '../models/indicador.model';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
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
    IonSearchbar,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonInput,
    IonSpinner,
    IonToast,
    IonRefresher,
    IonRefresherContent,
    IonChip,
    IonLabel
  ]
})
export class Tab4Page implements OnInit, OnDestroy {
  apiUrl: string = '';
  probandoConexion: boolean = false;
  estadoConexion: 'desconocido' | 'conectado' | 'desconectado' = 'desconocido';
  mensajeEstado: string = 'Sin probar';

  terminoBusqueda: string = '';
  filtroOrigen: 'todos' | 'manual' | 'csv' = 'todos';

  indicadores: IndicadorAcademico[] = [];
  cargando: boolean = false;

  toastMensaje: string = '';
  mostrarToast: boolean = false;
  toastColor: 'success' | 'danger' | 'warning' = 'success';

  private sub = new Subscription();

  constructor(
    private dataService: DataService,
    private apiService: ApiService,
    private csvService: CsvService
  ) {
    addIcons({
      serverOutline,
      pulseOutline,
      downloadOutline,
      refreshOutline,
      trashOutline,
      searchOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      linkOutline,
      schoolOutline
    });
  }

  ngOnInit(): void {
    this.apiUrl = this.apiService.getBaseUrl();

    this.sub.add(
      this.dataService.indicadores$.subscribe((items) => {
        this.indicadores = items;
      })
    );

    this.sub.add(
      this.dataService.isBackendOnline$.subscribe((online) => {
        if (online) {
          this.estadoConexion = 'conectado';
          this.mensajeEstado = 'Servidor y MySQL activos';
        }
      })
    );

    // Test inicial de conexión
    this.probarConexion();
    this.recargarDesdeMySQL();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  guardarUrlApi(): void {
    try {
      this.apiService.setBaseUrl(this.apiUrl);
      this.lanzarToast('URL de servidor guardada', 'success');
      this.probarConexion();
      this.recargarDesdeMySQL();
    } catch (e: any) { this.lanzarToast(e.message, 'danger'); }
  }

  async probarConexion(): Promise<void> {
    this.probandoConexion = true;
    try {
      const res = await this.apiService.checkHealth();
      if (res.ok) {
        this.estadoConexion = 'conectado';
        this.mensajeEstado = `Servicio: ${res.service || 'api'} · BD: ${res.database || 'conectada'}`;
        this.lanzarToast('Conexión exitosa con API PHP y base de datos MySQL', 'success');
      } else {
        this.estadoConexion = 'desconectado';
        this.mensajeEstado = res.error || 'No se pudo conectar a la base de datos';
        this.lanzarToast('No se pudo establecer conexión con el backend PHP', 'warning');
      }
    } catch (e: any) {
      this.estadoConexion = 'desconectado';
      this.mensajeEstado = e.message;
      this.lanzarToast(`Fallo de red: ${e.message}`, 'danger');
    } finally {
      this.probandoConexion = false;
    }
  }

  async recargarDesdeMySQL(event?: any): Promise<void> {
    this.cargando = true;
    const ok = await this.dataService.cargarDesdeBackend();
    if (ok) {
      this.lanzarToast('Datos actualizados desde MySQL', 'success');
    } else {
      this.lanzarToast('No se pudo sincronizar con MySQL. Verifica la conexión.', 'warning');
    }
    this.cargando = false;
    if (event) {
      event.target.complete();
    }
  }

  exportarCsv(): void {
    const filtrados = this.registrosFiltrados;
    if (filtrados.length === 0) {
      this.lanzarToast('No hay registros para exportar', 'warning');
      return;
    }
    this.csvService.exportarCsv(filtrados, `datavision_indicadores_${new Date().toISOString().slice(0, 10)}.csv`);
    this.lanzarToast(`Exportados ${filtrados.length} registros a CSV con Papa Parse`, 'success');
  }

  async eliminar(id?: number): Promise<void> {
    if (!id || !confirm('¿Eliminar definitivamente este registro de MySQL?')) return;
    try {
      await this.dataService.eliminarIndicador(id);
      this.lanzarToast('Registro eliminado de MySQL', 'success');
    } catch (e: any) { this.lanzarToast(e.message, 'danger'); }
  }

  get registrosFiltrados(): IndicadorAcademico[] {
    let list = this.indicadores;

    // Filtro por origen
    if (this.filtroOrigen !== 'todos') {
      list = list.filter((i) => (i.origen || 'manual') === this.filtroOrigen);
    }

    // Filtro por búsqueda
    if (this.terminoBusqueda && this.terminoBusqueda.trim() !== '') {
      const q = this.terminoBusqueda.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.grupo.toLowerCase().includes(q) ||
          i.fecha.includes(q) ||
          (i.origen && i.origen.toLowerCase().includes(q))
      );
    }

    return list;
  }

  private lanzarToast(msg: string, color: 'success' | 'danger' | 'warning'): void {
    this.toastMensaje = msg;
    this.toastColor = color;
    this.mostrarToast = true;
  }
}
