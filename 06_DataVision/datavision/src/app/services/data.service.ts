import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, timeout } from 'rxjs';
import { IndicadorAcademico, IndicadoresResponse, ResumenKpis } from '../models/indicador.model';
import { ApiService } from './api.service';

export interface FiltrosIndicadores { anio: string; mes: string; grupo: string; }

const STORAGE_KEY_INDICADORES = 'datavision_indicadores_cache';
const STORAGE_KEY_TIMESTAMP = 'datavision_cache_timestamp';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly indicadoresSubject = new BehaviorSubject<IndicadorAcademico[]>([]);
  readonly indicadores$ = this.indicadoresSubject.asObservable();
  private readonly onlineSubject = new BehaviorSubject<boolean>(false);
  readonly isBackendOnline$ = this.onlineSubject.asObservable();
  private readonly usingCacheSubject = new BehaviorSubject<boolean>(false);
  readonly isUsingCache$ = this.usingCacheSubject.asObservable();
  private readonly lastSyncDateSubject = new BehaviorSubject<string>('');
  readonly lastSyncDate$ = this.lastSyncDateSubject.asObservable();
  private readonly errorSubject = new BehaviorSubject<string>('');
  readonly error$ = this.errorSubject.asObservable();
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();
  private filtros: FiltrosIndicadores = { anio: 'todos', mes: 'todos', grupo: 'todos' };

  constructor(private http: HttpClient, private api: ApiService) {
    this.recuperarCacheInicial();
  }

  get todos(): IndicadorAcademico[] { return this.indicadoresSubject.value; }
  setFiltros(filtros: FiltrosIndicadores): void { this.filtros = { ...filtros }; }

  /**
   * Carga los datos almacenados en localStorage para que la app nunca arranque en blanco
   */
  private recuperarCacheInicial(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_INDICADORES);
      const time = localStorage.getItem(STORAGE_KEY_TIMESTAMP) || '';
      if (raw) {
        const items = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) {
          this.indicadoresSubject.next(items);
          this.usingCacheSubject.next(true);
          this.lastSyncDateSubject.next(time);
        }
      }
    } catch (e) {
      console.warn('Error leyendo caché inicial:', e);
    }
  }

  /**
   * Guarda los datos en localStorage cada vez que se sincronizan con la BD
   */
  private guardarEnCache(items: IndicadorAcademico[]): void {
    if (typeof localStorage === 'undefined' || !items) return;
    try {
      const nowStr = new Date().toLocaleString();
      localStorage.setItem(STORAGE_KEY_INDICADORES, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEY_TIMESTAMP, nowStr);
      this.lastSyncDateSubject.next(nowStr);
      this.usingCacheSubject.next(false);
    } catch (e) {
      console.warn('Error guardando en caché:', e);
    }
  }

  limpiarCache(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_INDICADORES);
    localStorage.removeItem(STORAGE_KEY_TIMESTAMP);
    this.lastSyncDateSubject.next('');
    if (!this.onlineSubject.value) {
      this.indicadoresSubject.next([]);
      this.usingCacheSubject.next(false);
    }
  }

  async cargarDesdeBackend(): Promise<boolean> {
    this.loadingSubject.next(true);
    this.errorSubject.next('');
    try {
      let response: IndicadoresResponse;
      try {
        response = await firstValueFrom(
          this.http.get<IndicadoresResponse>(this.api.url('indicadores/list.php') + '?_=' + Date.now()).pipe(timeout(3500))
        );
      } catch (firstErr) {
        // Si falló (ej. móvil en red local con IP diferente), intentar autodetectar la URL del servidor
        const detected = await this.api.autoDetectBackend();
        if (detected) {
          response = await firstValueFrom(
            this.http.get<IndicadoresResponse>(this.api.url('indicadores/list.php') + '?_=' + Date.now()).pipe(timeout(3500))
          );
        } else {
          throw firstErr;
        }
      }

      if (!response?.ok || !Array.isArray(response.items)) {
        throw new Error(response?.error || 'Respuesta inválida del servidor');
      }
      const items = response.items.map((d) => ({
        id: Number(d.id), fecha: String(d.fecha), grupo: String(d.grupo),
        inscritos: Number(d.inscritos), presentes: Number(d.presentes),
        promedio: Number(d.promedio),
        actividadesProgramadas: Number(d.actividadesProgramadas),
        actividadesEntregadas: Number(d.actividadesEntregadas), origen: d.origen
      }));

      // Sincronización exitosa con MySQL
      this.indicadoresSubject.next(items);
      this.onlineSubject.next(true);
      this.usingCacheSubject.next(false);
      this.guardarEnCache(items);
      return true;
    } catch (error: unknown) {
      // Base de datos no disponible o dispositivo fuera de la red local Wi-Fi
      this.onlineSubject.next(false);

      // PERSISTENCIA: Si hay datos previos o en caché, conservarlos
      const hayDatos = this.indicadoresSubject.value.length > 0;
      if (hayDatos) {
        this.usingCacheSubject.next(true);
        const lastSync = this.lastSyncDateSubject.value ? ` (última sincro: ${this.lastSyncDateSubject.value})` : '';
        this.errorSubject.next(`Sin conexión con la BD en la red local. Mostrando datos guardados en caché${lastSync}.`);
      } else {
        // Intentar recuperar del storage
        this.recuperarCacheInicial();
        if (this.indicadoresSubject.value.length > 0) {
          this.usingCacheSubject.next(true);
          this.errorSubject.next('Sin conexión con la BD. Mostrando datos guardados en caché.');
        } else {
          this.indicadoresSubject.next([]);
          this.usingCacheSubject.next(false);
          const message = error instanceof Error ? error.message : 'No se pudo consultar el backend';
          this.errorSubject.next(`Sin conexión con la BD: ${message}. Conéctate a la misma red Wi-Fi.`);
        }
      }
      return false;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private errorMensaje(e: any): string {
    if (e?.status === 0) return 'No se pudo contactar al servidor. Revisa Apache, URL y CORS.';
    return e?.error?.error || e?.message || 'Error de comunicación con el servidor';
  }

  async agregarIndicador(item: Omit<IndicadorAcademico, 'id'>): Promise<{ok: boolean; error?: string}> {
    try {
      let res: {ok: boolean; id?: number; error?: string};
      try {
        res = await firstValueFrom(this.http.post<{ok: boolean; id?: number; error?: string}>(
          this.api.url('indicadores/create.php'), item));
      } catch (firstErr) {
        const detected = await this.api.autoDetectBackend();
        if (detected) {
          res = await firstValueFrom(this.http.post<{ok: boolean; id?: number; error?: string}>(
            this.api.url('indicadores/create.php'), item));
        } else {
          throw firstErr;
        }
      }

      if (!res?.ok || !Number.isInteger(Number(res.id)) || Number(res.id) <= 0) {
        return {ok: false, error: res?.error || 'La API no confirmó el ID del registro.'};
      }

      // Recargar la lista global para refrescar inmediatamente todas las gráficas y KPIs
      await this.cargarDesdeBackend();
      return {ok: true};
    } catch (e: any) {
      return {ok: false, error: this.errorMensaje(e)};
    }
  }

  async importarCsvFilas(items: IndicadorAcademico[]): Promise<{insertados: number; rechazados: number; errores: string[]}> {
    try {
      const res = await firstValueFrom(this.http.post<{ok: boolean; insertados: number; rechazados: number; errores: string[]; error?: string}>(this.api.url('indicadores/import.php'), {items}));
      if (!res.ok) throw new Error(res.error || 'Importación fallida');
      await this.cargarDesdeBackend();
      return res;
    } catch (e: any) {
      throw new Error(this.errorMensaje(e));
    }
  }

  async eliminarIndicador(id: number): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.delete<{ok: boolean; error?: string}>(this.api.url(`indicadores/delete.php?id=${encodeURIComponent(id)}`)));
      if (!res.ok) throw new Error(res.error || 'No se eliminó el registro');
      await this.cargarDesdeBackend();
    } catch (e: any) {
      throw new Error(this.errorMensaje(e));
    }
  }

  obtenerDatosFiltrados(): IndicadorAcademico[] {
    const { anio, mes, grupo } = this.filtros;
    return this.todos.filter((d) =>
      (anio === 'todos' || d.fecha.slice(0, 4) === anio) &&
      (mes === 'todos' || d.fecha.slice(5, 7) === mes) &&
      (grupo === 'todos' || d.grupo === grupo)
    );
  }

  calcularKpis(datos: IndicadorAcademico[]): ResumenKpis {
    const sum = (get: (d: IndicadorAcademico) => number) => datos.reduce((n, d) => n + get(d), 0);
    const inscritos = sum(d => d.inscritos);
    const presentes = sum(d => d.presentes);
    const actividades = sum(d => d.actividadesProgramadas);
    const entregas = sum(d => d.actividadesEntregadas);
    const round = (n: number) => Math.round(n * 10) / 10;
    const tasaAprobacion = datos.length
      ? round(100 * datos.filter(d => d.promedio >= 70).length / datos.length)
      : 0;
    return {
      totalRegistros: datos.length,
      asistenciaPonderada: inscritos ? round(100 * presentes / inscritos) : 0,
      promedioGlobal: datos.length ? round(sum(d => d.promedio) / datos.length) : 0,
      tasaEntregas: actividades ? round(100 * entregas / actividades) : 0,
      tasaAprobacion,
      totalInscritos: inscritos,
      totalPresentes: presentes,
      totalAusentes: inscritos - presentes
    };
  }
}
