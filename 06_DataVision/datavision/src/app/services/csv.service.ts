import { Injectable } from '@angular/core';
import Papa from 'papaparse';
import { IndicadorAcademico, ValidacionCsvFila } from '../models/indicador.model';

@Injectable({ providedIn: 'root' })
export class CsvService {

  /**
   * Procesa un archivo CSV mediante Papa Parse y valida regla por regla
   */
  procesarArchivoCsv(file: File): Promise<{
    filasValidas: IndicadorAcademico[];
    filasConError: ValidacionCsvFila[];
    todasLasFilas: ValidacionCsvFila[];
  }> {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const procesadas = this.validarFilas(results.data);
          resolve(procesadas);
        },
        error: (error) => {
          reject(new Error(`Error al leer archivo CSV: ${error.message}`));
        }
      });
    });
  }

  /**
   * Procesa una cadena de texto en formato CSV directamente (para datos de muestra)
   */
  procesarTextoCsv(csvText: string): {
    filasValidas: IndicadorAcademico[];
    filasConError: ValidacionCsvFila[];
    todasLasFilas: ValidacionCsvFila[];
  } {
    const results = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    return this.validarFilas(results.data);
  }

  /**
   * Valida fila por fila según los lineamientos del ENUNCIADO y CONTRATO_API
   */
  private validarFilas(rows: Record<string, string>[]): {
    filasValidas: IndicadorAcademico[];
    filasConError: ValidacionCsvFila[];
    todasLasFilas: ValidacionCsvFila[];
  } {
    const filasValidas: IndicadorAcademico[] = [];
    const filasConError: ValidacionCsvFila[] = [];
    const todasLasFilas: ValidacionCsvFila[] = [];

    rows.forEach((r, idx) => {
      const numFila = idx + 2; // Considerando fila 1 como encabezado
      const errores: string[] = [];

      // Normalización de claves (soporta camelCase o snake_case)
      const fecha = (r['fecha'] || '').trim();
      const grupo = (r['grupo'] || r['materia'] || '').trim();
      const inscritos = Number(r['inscritos']);
      const presentes = Number(r['presentes']);
      const promedio = Number(r['promedio']);
      const actProg = Number(r['actividadesProgramadas'] ?? r['actividades_programadas'] ?? 0);
      const actEnt = Number(r['actividadesEntregadas'] ?? r['actividades_entregadas'] ?? 0);

      // 1. Validación de Fecha ISO
      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        errores.push('Fecha inválida. Debe tener formato YYYY-MM-DD');
      }

      // 2. Validación de Grupo / Materia
      if (!grupo || grupo.length > 20) {
        errores.push('Grupo/Materia es obligatorio y no debe superar 20 caracteres');
      }

      // 3. Validación de Inscritos
      if (isNaN(inscritos) || inscritos <= 0) {
        errores.push('Alumnos inscritos debe ser un número entero mayor a 0');
      }

      // 4. Validación de Presentes vs Inscritos
      if (isNaN(presentes) || presentes < 0) {
        errores.push('Presentes debe ser un número mayor o igual a 0');
      } else if (!isNaN(inscritos) && presentes > inscritos) {
        errores.push(`Presentes (${presentes}) no puede superar el total de inscritos (${inscritos})`);
      }

      // 5. Validación de Promedio (0 a 100)
      if (isNaN(promedio) || promedio < 0 || promedio > 100) {
        errores.push(`Promedio (${promedio}) fuera de rango permitido (0 - 100)`);
      }

      // 6. Validación de Actividades Programadas y Entregadas
      if (isNaN(actProg) || actProg < 0) {
        errores.push('Actividades programadas debe ser >= 0');
      }
      if (isNaN(actEnt) || actEnt < 0) {
        errores.push('Actividades entregadas debe ser >= 0');
      } else if (!isNaN(actProg) && actEnt > actProg) {
        errores.push(`Actividades entregadas (${actEnt}) supera las programadas (${actProg})`);
      }

      const itemValido: IndicadorAcademico = {
        fecha,
        grupo,
        inscritos,
        presentes,
        promedio: Number(promedio.toFixed(2)),
        actividadesProgramadas: actProg,
        actividadesEntregadas: actEnt,
        origen: 'csv'
      };

      const resultado: ValidacionCsvFila = {
        fila: numFila,
        data: r,
        esValida: errores.length === 0,
        errores,
        indicador: errores.length === 0 ? itemValido : undefined
      };

      todasLasFilas.push(resultado);

      if (resultado.esValida && resultado.indicador) {
        filasValidas.push(resultado.indicador);
      } else {
        filasConError.push(resultado);
      }
    });

    return { filasValidas, filasConError, todasLasFilas };
  }

  /**
   * Exporta un arreglo de registros a un archivo CSV descargable
   */
  exportarCsv(indicadores: IndicadorAcademico[], nombreArchivo = 'indicadores_academicos.csv'): void {
    const csvContent = Papa.unparse(indicadores.map(i => ({
      fecha: i.fecha,
      grupo: i.grupo,
      inscritos: i.inscritos,
      presentes: i.presentes,
      promedio: i.promedio,
      actividadesProgramadas: i.actividadesProgramadas,
      actividadesEntregadas: i.actividadesEntregadas,
      origen: i.origen || 'manual'
    })));

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
