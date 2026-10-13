import Papa from 'papaparse';

/** Leer CSV local; la validación de dominio pertenece al equipo y debe repetirse en PHP. */
export function importarCSV(file: File): Promise<{rows: Record<string, string>[], errores: string[]}> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true, dynamicTyping: false,
      complete: res => resolve({
        rows: res.data,
        errores: res.errors.map(e => `Línea ${e.row ?? '?'}: ${e.message}`),
      }),
      error: error => reject(error)
    });
  });
}
