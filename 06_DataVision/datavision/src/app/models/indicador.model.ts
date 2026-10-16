export interface IndicadorAcademico {
  id: number;
  fecha: string;
  grupo: string;
  inscritos: number;
  presentes: number;
  promedio: number;
  actividadesProgramadas: number;
  actividadesEntregadas: number;
  origen: 'manual' | 'csv';
}

export interface ResumenKpis {
  totalRegistros: number;
  asistenciaPonderada: number;
  promedioGlobal: number;
  tasaEntregas: number;
  totalInscritos: number;
  totalPresentes: number;
  totalAusentes: number;
}

export interface IndicadoresResponse {
  ok: boolean;
  total: number;
  items: IndicadorAcademico[];
  error?: string;
}

export interface ValidacionCsvFila { fila: number; errores: string[]; data: Record<string, string>; }
