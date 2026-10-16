
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  firstValueFrom,
  timeout
} from 'rxjs';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonItem,
  IonInput,
  IonGrid,
  IonRow,
  IonCol,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';

import { ApiService } from '../services/api.service';

interface Grupo {
  grupo: string;
  registros: number;
  promedio: number;
  asistenciaPonderada: number | null;
  tasaEntregas: number | null;
}

interface Comparativa {
  ok: boolean;
  error?: string;
  resumen: {
    registros: number;
    promedioGeneral: number | null;
    asistenciaPonderada: number | null;
    tasaEntregas: number | null;
  };
  grupos: Grupo[];
}

@Component({
  selector: 'app-comparativa',
  standalone: true,
  templateUrl: './comparativa.page.html',
  styleUrls: ['./comparativa.page.scss'],
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
    IonCardContent,
    IonButton,
    IonSpinner,
    IonItem,
    IonInput,
    IonGrid,
    IonRow,
    IonCol,
    IonSelect,
    IonSelectOption
  ]
})
export class ComparativaPage implements OnInit {

  // Filtros
  grupo = '';
  desde = '';
  hasta = '';

  // Estados
  cargando = false;
  cargandoGrupos = false;
  error = '';
  errorGrupos = '';

  // Grupos disponibles desde MySQL
  gruposDisponibles: string[] = [];

  // Resultados de la comparativa
  datos: Comparativa | null = null;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    void this.cargarGrupos();
    void this.consultar();
  }

  // Cargar los grupos desde el backend PHP
  async cargarGrupos(): Promise<void> {

    this.cargandoGrupos = true;
    this.errorGrupos = '';
    this.cdr.detectChanges();

    const url = this.api.url(
      'reportes/comparativa.php'
    );

    try {

      console.log(
        '[Comparativa] Cargando grupos:', url
      );

      const respuesta = await firstValueFrom(
        this.http.get<Comparativa>(url).pipe(
          timeout(10000)
        )
      );

      if (!respuesta.ok) {
        throw new Error(
          respuesta.error ||
          'No se pudieron cargar los grupos'
        );
      }

      this.gruposDisponibles = [
        ...new Set(
          respuesta.grupos.map(g => g.grupo)
        )
      ].sort((a, b) =>
        a.localeCompare(b, 'es', {
          numeric: true
        })
      );

      console.log(
        '[Comparativa] Grupos disponibles:',
        this.gruposDisponibles
      );

    } catch (e: unknown) {

      console.error(
        '[Comparativa] Error cargando grupos:',
        e
      );

      // CAMBIO: mostrar el error real
      this.errorGrupos = e instanceof Error
        ? `Error al cargar grupos: ${e.message}`
        : 'No se pudo actualizar la lista de grupos.';

    } finally {

      this.cargandoGrupos = false;
      this.cdr.detectChanges();

    }
  }

  // Consultar las estadísticas
  async consultar(): Promise<void> {

    if (this.cargando) {
      return;
    }

    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    let params = new HttpParams();

    if (this.grupo.trim()) {
      params = params.set(
        'grupo',
        this.grupo.trim()
      );
    }

    if (this.desde) {
      params = params.set(
        'desde',
        this.desde
      );
    }

    if (this.hasta) {
      params = params.set(
        'hasta',
        this.hasta
      );
    }

    const url = this.api.url(
      'reportes/comparativa.php'
    );

    console.log(
      '[Comparativa] Consultando:',
      url
    );

    try {

      const respuesta = await firstValueFrom(
        this.http.get<Comparativa>(
          url,
          { params }
        ).pipe(
          timeout(10000)
        )
      );

      if (!respuesta.ok) {
        throw new Error(
          respuesta.error ||
          'No se pudo consultar el reporte'
        );
      }

      this.datos = respuesta;

      console.log(
        '[Comparativa] Datos recibidos:',
        respuesta
      );

    } catch (e: unknown) {

      console.error(
        '[Comparativa] Error:',
        e
      );

      this.datos = null;

      if (
        e instanceof Error &&
        e.name === 'TimeoutError'
      ) {

        this.error =
          'La API tardó más de 10 segundos en responder.';

      } else {

        this.error = e instanceof Error
          ? e.message
          : 'No se pudo consultar la API.';

      }

    } finally {

      this.cargando = false;
      this.cdr.detectChanges();

      console.log(
        '[Comparativa] Consulta finalizada'
      );

    }
  }

  // Limpiar los filtros
  limpiarFiltros(): void {

    this.grupo = '';
    this.desde = '';
    this.hasta = '';

    void this.consultar();
  }

  // Actualizar grupos y resultados
  async actualizarTodo(): Promise<void> {

    await this.cargarGrupos();
    await this.consultar();

  }

  // Dar formato a los porcentajes
  porcentaje(
    valor: number | null | undefined
  ): string {

    return valor == null
      ? '—'
      : `${valor.toFixed(1)}%`;

  }

  // Calcular el ancho de las barras
  ancho(
    valor: number | null | undefined
  ): number {

    return Math.min(
      100,
      Math.max(0, (valor ?? 0) * 10)
    );

  }
}
