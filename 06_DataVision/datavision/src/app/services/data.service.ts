import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IndicadorAcademico, IndicadorFiltros, ResumenKpis } from '../models/indicador.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DataService {

  // Dataset inicial precargado (fiel al prototipo y schema.sql) para demo inmediata
  private readonly initialData: IndicadorAcademico[] = [
    { id: 1, fecha: '2026-01-15', grupo: 'Maths', inscritos: 30, presentes: 28, promedio: 88.5, actividadesProgramadas: 30, actividadesEntregadas: 27, origen: 'manual' },
    { id: 2, fecha: '2026-02-14', grupo: 'English', inscritos: 28, presentes: 26, promedio: 84.0, actividadesProgramadas: 28, actividadesEntregadas: 25, origen: 'manual' },
    { id: 3, fecha: '2026-03-20', grupo: 'Physics', inscritos: 26, presentes: 24, promedio: 79.5, actividadesProgramadas: 26, actividadesEntregadas: 22, origen: 'manual' },
    { id: 4, fecha: '2026-04-18', grupo: 'Chemistry', inscritos: 25, presentes: 23, promedio: 82.0, actividadesProgramadas: 25, actividadesEntregadas: 21, origen: 'manual' },
    { id: 5, fecha: '2026-05-22', grupo: 'Biology', inscritos: 32, presentes: 31, promedio: 91.0, actividadesProgramadas: 32, actividadesEntregadas: 30, origen: 'manual' },
    { id: 6, fecha: '2026-06-19', grupo: 'Maths', inscritos: 30, presentes: 27, promedio: 86.0, actividadesProgramadas: 30, actividadesEntregadas: 26, origen: 'manual' },
    { id: 7, fecha: '2026-07-10', grupo: 'English', inscritos: 28, presentes: 25, promedio: 89.0, actividadesProgramadas: 28, actividadesEntregadas: 27, origen: 'manual' },
    { id: 8, fecha: '2026-08-15', grupo: 'Physics', inscritos: 26, presentes: 22, promedio: 81.0, actividadesProgramadas: 26, actividadesEntregadas: 23, origen: 'manual' },
    { id: 9, fecha: '2026-09-01', grupo: '2A', inscritos: 30, presentes: 27, promedio: 86.5, actividadesProgramadas: 30, actividadesEntregadas: 24, origen: 'manual' },
    { id: 10, fecha: '2026-09-02', grupo: '2A', inscritos: 30, presentes: 25, promedio: 84.0, actividadesProgramadas: 30, actividadesEntregadas: 23, origen: 'manual' },
    { id: 11, fecha: '2026-09-03', grupo: '2A', inscritos: 30, presentes: 28, promedio: 89.0, actividadesProgramadas: 30, actividadesEntregadas: 26, origen: 'manual' },
    { id: 12, fecha: '2026-09-04', grupo: '2A', inscritos: 30, presentes: 29, promedio: 90.0, actividadesProgramadas: 30, actividadesEntregadas: 28, origen: 'manual' },
    { id: 13, fecha: '2026-09-01', grupo: '2B', inscritos: 28, presentes: 23, promedio: 78.0, actividadesProgramadas: 28, actividadesEntregadas: 20, origen: 'manual' },
    { id: 14, fecha: '2026-09-02', grupo: '2B', inscritos: 28, presentes: 24, promedio: 79.0, actividadesProgramadas: 28, actividadesEntregadas: 22, origen: 'manual' },
    { id: 15, fecha: '2026-09-03', grupo: '2B', inscritos: 28, presentes: 22, promedio: 76.0, actividadesProgramadas: 28, actividadesEntregadas: 19, origen: 'manual' },
    { id: 16, fecha: '2026-09-04', grupo: '2B', inscritos: 28, presentes: 25, promedio: 81.0, actividadesProgramadas: 28, actividadesEntregadas: 22, origen: 'manual' },
    { id: 17, fecha: '2026-09-01', grupo: '2C', inscritos: 26, presentes: 24, promedio: 92.0, actividadesProgramadas: 26, actividadesEntregadas: 25, origen: 'manual' },
    { id: 18, fecha: '2026-09-02', grupo: '2C', inscritos: 26, presentes: 25, promedio: 93.0, actividadesProgramadas: 26, actividadesEntregadas: 24, origen: 'manual' },
    { id: 19, fecha: '2026-10-05', grupo: 'Maths', inscritos: 30, presentes: 29, promedio: 93.5, actividadesProgramadas: 30, actividadesEntregadas: 29, origen: 'manual' },
    { id: 20, fecha: '2026-11-12', grupo: 'Chemistry', inscritos: 25, presentes: 24, promedio: 87.0, actividadesProgramadas: 25, actividadesEntregadas: 24, origen: 'manual' }
  ];

  private readonly indicadoresSubject = new BehaviorSubject<IndicadorAcademico[]>(this.initialData);
  public readonly indicadores$: Observable<IndicadorAcademico[]> = this.indicadoresSubject.asObservable();

  private readonly filtrosSubject = new BehaviorSubject<IndicadorFiltros>({
    anio: '2026',
    mes: 'todos',
    grupo: 'todos'
  });
  public readonly filtros$: Observable<IndicadorFiltros> = this.filtrosSubject.asObservable();

  private isBackendOnlineSubject = new BehaviorSubject<boolean>(false);
  public readonly isBackendOnline$ = this.isBackendOnlineSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Intentar verificar conectividad al arrancar
    this.verificarSaludBackend();
  }

  async verificarSaludBackend(): Promise<boolean> {
    const res = await this.apiService.checkHealth();
    const online = res.ok === true;
    this.isBackendOnlineSubject.next(online);
    return online;
  }

  getIndicadoresActuales(): IndicadorAcademico[] {
    return this.indicadoresSubject.getValue();
  }

  setFiltros(filtros: Partial<IndicadorFiltros>): void {
    const actual = this.filtrosSubject.getValue();
    this.filtrosSubject.next({ ...actual, ...filtros });
  }

  getFiltrosActuales(): IndicadorFiltros {
    return this.filtrosSubject.getValue();
  }

  /**
   * Obtiene los datos filtrados en memoria según año, mes y grupo/materia
   */
  obtenerDatosFiltrados(): IndicadorAcademico[] {
    const list = this.getIndicadoresActuales();
    const f = this.getFiltrosActuales();

    return list.filter(item => {
      // Filtro Año
      if (f.anio && f.anio !== 'todos') {
        const itemAnio = item.fecha.split('-')[0];
        if (itemAnio !== f.anio) return false;
      }

      // Filtro Mes (01 a 12 o nombre)
      if (f.mes && f.mes !== 'todos') {
        const itemMesNum = item.fecha.split('-')[1];
        if (itemMesNum !== f.mes && parseInt(itemMesNum, 10) !== parseInt(f.mes, 10)) {
          return false;
        }
      }

      // Filtro Grupo / Materia
      if (f.grupo && f.grupo !== 'todos') {
        if (item.grupo.toLowerCase() !== f.grupo.toLowerCase()) {
          return false;
        }
      }

      // Filtro de Búsqueda libre
      if (f.busqueda && f.busqueda.trim() !== '') {
        const q = f.busqueda.toLowerCase().trim();
        const coincide = item.grupo.toLowerCase().includes(q) ||
          item.fecha.includes(q) ||
          (item.origen && item.origen.toLowerCase().includes(q));
        if (!coincide) return false;
      }

      return true;
    });
  }

  /**
   * Calcula los KPIs matemáticos definidos en ENUNCIADO.md
   */
  calcularKpis(datos: IndicadorAcademico[]): ResumenKpis {
    if (!datos || datos.length === 0) {
      return {
        totalRegistros: 0,
        asistenciaPonderada: 0,
        promedioGlobal: 0,
        tasaEntregas: 0,
        totalInscritos: 0,
        totalPresentes: 0,
        totalAusentes: 0
      };
    }

    let sumaInscritos = 0;
    let sumaPresentes = 0;
    let sumaPromedios = 0;
    let sumaActProg = 0;
    let sumaActEnt = 0;

    for (const d of datos) {
      sumaInscritos += Number(d.inscritos) || 0;
      sumaPresentes += Number(d.presentes) || 0;
      sumaPromedios += Number(d.promedio) || 0;
      sumaActProg += Number(d.actividadesProgramadas) || 0;
      sumaActEnt += Number(d.actividadesEntregadas) || 0;
    }

    const asistenciaPonderada = sumaInscritos > 0 
      ? Number(((sumaPresentes / sumaInscritos) * 100).toFixed(1)) 
      : 0;

    const promedioGlobal = datos.length > 0 
      ? Number((sumaPromedios / datos.length).toFixed(1)) 
      : 0;

    const tasaEntregas = sumaActProg > 0 
      ? Number(((sumaActEnt / sumaActProg) * 100).toFixed(1)) 
      : 0;

    return {
      totalRegistros: datos.length,
      asistenciaPonderada,
      promedioGlobal,
      tasaEntregas,
      totalInscritos: sumaInscritos,
      totalPresentes: sumaPresentes,
      totalAusentes: Math.max(0, sumaInscritos - sumaPresentes)
    };
  }

  /**
   * Agrega un indicador nuevo (guarda en local y sincroniza en backend si está activo)
   */
  async agregarIndicador(item: IndicadorAcademico): Promise<{ ok: boolean; id?: number; error?: string }> {
    // Verificar duplicado local (fecha + grupo)
    const actuales = this.getIndicadoresActuales();
    const existe = actuales.some(i => i.fecha === item.fecha && i.grupo.toLowerCase() === item.grupo.toLowerCase());
    if (existe) {
      return { ok: false, error: `Ya existe un registro para la fecha ${item.fecha} y grupo ${item.grupo}.` };
    }

    let apiId: number | undefined;
    // Si hay backend online, enviar a PHP
    if (this.isBackendOnlineSubject.getValue()) {
      try {
        const res = await this.apiService.createIndicador(item);
        if (!res.ok) {
          return { ok: false, error: res.error || 'Error al guardar en MySQL' };
        }
        apiId = res.id;
      } catch (e) {
        console.warn('Fallo al enviar a API PHP, guardando localmente:', e);
      }
    }

    const nuevoItem: IndicadorAcademico = {
      ...item,
      id: apiId || (actuales.length > 0 ? Math.max(...actuales.map(x => x.id || 0)) + 1 : 1)
    };

    this.indicadoresSubject.next([...actuales, nuevoItem]);
    return { ok: true, id: nuevoItem.id };
  }

  /**
   * Importa filas desde CSV y actualiza el estado de la aplicación
   */
  async importarCsvFilas(filas: IndicadorAcademico[]): Promise<{
    insertados: number;
    rechazados: number;
    errores: string[];
  }> {
    const actuales = [...this.getIndicadoresActuales()];
    let insertados = 0;
    let rechazados = 0;
    const errores: string[] = [];

    // Si backend está disponible, intentar POST a /indicadores/import.php
    if (this.isBackendOnlineSubject.getValue()) {
      try {
        const res = await this.apiService.importIndicadores(filas);
        if (res.ok) {
          // Recargar todo desde la BD
          await this.cargarDesdeBackend();
          return {
            insertados: res.insertados,
            rechazados: res.rechazados,
            errores: res.errores || []
          };
        }
      } catch (e) {
        console.warn('API no respondió, procesando en almacenamiento local:', e);
      }
    }

    // Modo local / Fallback
    for (const f of filas) {
      const duplicado = actuales.some(i => i.fecha === f.fecha && i.grupo.toLowerCase() === f.grupo.toLowerCase());
      if (duplicado) {
        rechazados++;
        errores.push(`Duplicado: ${f.fecha} - ${f.grupo}`);
        continue;
      }

      const nuevoId = actuales.length > 0 ? Math.max(...actuales.map(x => x.id || 0)) + 1 : 1;
      actuales.push({ ...f, id: nuevoId });
      insertados++;
    }

    this.indicadoresSubject.next(actuales);
    return { insertados, rechazados, errores };
  }

  /**
   * Carga registros desde la base de datos MySQL vía PHP
   */
  async cargarDesdeBackend(): Promise<boolean> {
    try {
      const res = await this.apiService.getIndicadores();
      if (res.ok && Array.isArray(res.items)) {
        this.indicadoresSubject.next(res.items);
        this.isBackendOnlineSubject.next(true);
        return true;
      }
    } catch (e) {
      console.warn('No se pudo conectar al backend MySQL:', e);
      this.isBackendOnlineSubject.next(false);
    }
    return false;
  }

  eliminarIndicador(id?: number): void {
    if (!id) return;
    const filtrados = this.getIndicadoresActuales().filter(i => i.id !== id);
    this.indicadoresSubject.next(filtrados);
  }
}
