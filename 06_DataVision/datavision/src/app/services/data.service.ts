import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { IndicadorAcademico, IndicadoresResponse, ResumenKpis } from '../models/indicador.model';
import { ApiService } from './api.service';

export interface FiltrosIndicadores { anio: string; mes: string; grupo: string; }

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly indicadoresSubject = new BehaviorSubject<IndicadorAcademico[]>([]);
  readonly indicadores$ = this.indicadoresSubject.asObservable();
  private readonly onlineSubject = new BehaviorSubject<boolean>(false);
  readonly isBackendOnline$ = this.onlineSubject.asObservable();
  private readonly errorSubject = new BehaviorSubject<string>('');
  readonly error$ = this.errorSubject.asObservable();
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();
  private filtros: FiltrosIndicadores = { anio: 'todos', mes: 'todos', grupo: 'todos' };

  constructor(private http: HttpClient, private api: ApiService) {}

  get todos(): IndicadorAcademico[] { return this.indicadoresSubject.value; }
  setFiltros(filtros: FiltrosIndicadores): void { this.filtros = { ...filtros }; }

  async cargarDesdeBackend(): Promise<boolean> {
    this.loadingSubject.next(true);
    this.errorSubject.next('');
    try {
      // Traer el conjunto completo para que los filtros y sus opciones siempre reflejen la BD.
      const response = await firstValueFrom(this.http.get<IndicadoresResponse>(this.api.url('indicadores/list.php')));
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
      this.indicadoresSubject.next(items);
      this.onlineSubject.next(true);
      return true;
    } catch (error: unknown) {
      this.indicadoresSubject.next([]); // No mostrar datos anteriores como si fueran actuales.
      this.onlineSubject.next(false);
      const message = error instanceof Error ? error.message : 'No se pudo consultar el backend';
      this.errorSubject.next(`No se pudieron cargar los datos: ${message}. Revisa Apache, MySQL y la URL de la API.`);
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
      const res = await firstValueFrom(this.http.post<{ok: boolean; error?: string}>(this.api.url('indicadores/create.php'), item));
      if (res.ok) {
        const actualizado = await this.cargarDesdeBackend();
        if (!actualizado) return {ok: false, error: 'MySQL guardó el registro pero no se pudo actualizar la lista: ' + this.errorSubject.value};
      }
      return res;
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
    return {
      totalRegistros: datos.length,
      asistenciaPonderada: inscritos ? round(100 * presentes / inscritos) : 0,
      promedioGlobal: datos.length ? round(sum(d => d.promedio) / datos.length) : 0,
      tasaEntregas: actividades ? round(100 * entregas / actividades) : 0,
      totalInscritos: inscritos,
      totalPresentes: presentes,
      totalAusentes: inscritos - presentes
    };
  }
}
