export interface IndicadorAcademico {
  id?: number;
  fecha: string; // Formato ISO YYYY-MM-DD
  grupo: string; // Grupo o Materia: '2A', '2B', '2C', 'Maths', 'English', etc.
  inscritos: number;
  presentes: number;
  promedio: number; // 0 - 100
  actividadesProgramadas: number;
  actividadesEntregadas: number;
  origen?: 'manual' | 'csv';
  creadoEn?: string;
}

export interface IndicadorFiltros {
  anio?: string;
  mes?: string;
  grupo?: string;
  busqueda?: string;
}

export interface ValidacionCsvFila {
  fila: number;
  data: Record<string, any>;
  esValida: boolean;
  errores: string[];
  indicador?: IndicadorAcademico;
}

export interface ResumenKpis {
  totalRegistros: number;
  asistenciaPonderada: number; // % Asistencia = 100 * SUM(presentes) / SUM(inscritos)
  promedioGlobal: number; // AVG(promedio)
  tasaEntregas: number; // % Entregas = 100 * SUM(entregadas) / SUM(programadas)
  totalInscritos: number;
  totalPresentes: number;
  totalAusentes: number;
}
