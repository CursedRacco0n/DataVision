import { Injectable } from '@angular/core';
import { IndicadorAcademico, ValidacionCsvFila } from '../models/indicador.model';

@Injectable({providedIn: 'root'})
export class CsvService {
  async procesarArchivoCsv(file: File) {
    return this.procesarTextoCsv(await file.text());
  }

  // Parser CSV con soporte de comillas escapadas, comas y saltos de línea entrecomillados.
  private parse(text: string): string[][] {
    const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
    text = text.replace(/^\uFEFF/, '');
    for (let i=0;i<text.length;i++) {
      const c=text[i];
      if (c==='"') {
        if (quoted && text[i+1]==='"') {cell+='"';i++;} else quoted=!quoted;
      } else if (c===',' && !quoted) {row.push(cell);cell='';}
      else if ((c==='\n' || c==='\r') && !quoted) {
        if (c==='\r' && text[i+1]==='\n') i++;
        row.push(cell); if (row.some(x=>x.trim())) rows.push(row);
        row=[];cell='';
      } else cell+=c;
    }
    if (quoted) throw new Error('CSV con comillas sin cerrar');
    row.push(cell); if (row.some(x=>x.trim())) rows.push(row);
    return rows;
  }

  procesarTextoCsv(text: string): {filasValidas: IndicadorAcademico[]; filasConError: ValidacionCsvFila[]} {
    const rows=this.parse(text);
    if (!rows.length) throw new Error('CSV vacío');
    const headers=rows.shift()!.map(v=>v.trim().toLowerCase());
    const required=['fecha','grupo','inscritos','presentes','promedio','actividadesprogramadas','actividadesentregadas'];
    const missing=required.filter(h=>!headers.includes(h));
    if (missing.length) throw new Error('Faltan columnas: '+missing.join(', '));
    const valid: IndicadorAcademico[]=[]; const invalid: ValidacionCsvFila[]=[];
    rows.forEach((cells,index)=>{
      const get=(key:string)=> (cells[headers.indexOf(key)] || '').trim();
      const number=(key:string)=>get(key)===''?NaN:Number(get(key));
      const fecha=get('fecha'), grupo=get('grupo');
      const inscritos=number('inscritos'), presentes=number('presentes'), promedio=number('promedio');
      const actividadesProgramadas=number('actividadesprogramadas'), actividadesEntregadas=number('actividadesentregadas');
      const errors:string[]=[];
      const date=new Date(fecha+'T12:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==fecha) errors.push('Fecha inválida');
      if (!grupo || grupo.length>20) errors.push('Grupo inválido (1 a 20 caracteres)');
      if (!Number.isInteger(inscritos) || inscritos<=0 || inscritos>65535) errors.push('Inscritos inválidos');
      if (!Number.isInteger(presentes) || presentes<0 || presentes>inscritos) errors.push('Presentes inválidos');
      if (!Number.isFinite(promedio) || promedio<0 || promedio>100) errors.push('Promedio fuera de rango');
      if (!Number.isInteger(actividadesProgramadas) || actividadesProgramadas<0 || actividadesProgramadas>65535) errors.push('Actividades programadas inválidas');
      if (!Number.isInteger(actividadesEntregadas) || actividadesEntregadas<0 || actividadesEntregadas>actividadesProgramadas) errors.push('Actividades entregadas inválidas');
      if (errors.length) invalid.push({fila:index+2, errores:errors});
      else valid.push({id:0,fecha,grupo,inscritos,presentes,promedio,actividadesProgramadas,actividadesEntregadas,origen:'csv'});
    });
    return {filasValidas:valid, filasConError:invalid};
  }

  exportarCsv(items: IndicadorAcademico[], filename: string): void {
    const headers=['fecha','grupo','inscritos','presentes','promedio','actividadesProgramadas','actividadesEntregadas','origen'];
    const quote=(value: unknown): string => '"'+String(value ?? '').replace(/"/g,'""')+'"';
    const content=[headers.join(','),...items.map(item=>headers.map(k=>quote((item as any)[k])).join(','))].join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
  }
}
