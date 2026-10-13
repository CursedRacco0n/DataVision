import * as echarts from 'echarts';

export type Registro = {
  fecha: string; grupo: string; inscritos: number; presentes: number;
  promedio: number; actividadesProgramadas: number; actividadesEntregadas: number;
};

/** Ejemplo aislado de gráfica. Deben crear las otras dos y enlazar datos obtenidos por Axios. */
export function pintarPromedios(element: HTMLElement, rows: Registro[]): echarts.ECharts {
  const grouped = new Map<string, {suma: number, n: number}>();
  for (const r of rows) {
    const prev = grouped.get(r.grupo) ?? {suma: 0, n: 0};
    grouped.set(r.grupo, {suma: prev.suma + Number(r.promedio), n: prev.n + 1});
  }
  const labels = [...grouped.keys()].sort();
  const values = labels.map(g => {
    const a = grouped.get(g)!;
    return +(a.suma / a.n).toFixed(2);
  });
  const chart = echarts.init(element); // contenedor con altura definida
  chart.setOption({
    tooltip: {trigger: 'axis'},
    xAxis: {type: 'category', data: labels},
    yAxis: {type: 'value', min: 0, max: 100},
    series: [{type: 'bar', name: 'Promedio', data: values}]
  });
  return chart;
}
// En componente Angular: crear en ngAfterViewInit; onResize -> chart.resize();
// En ngOnDestroy -> chart.dispose() para liberar recursos.
