import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonBadge,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  schoolOutline,
  peopleOutline,
  ribbonOutline,
  checkmarkCircleOutline,
  refreshOutline,
  pieChartOutline,
  trendingUpOutline,
  barChartOutline,
  filterOutline
} from 'ionicons/icons';
import * as echarts from 'echarts';
import { Subscription } from 'rxjs';
import { DataService } from '../services/data.service';
import { IndicadorAcademico, ResumenKpis } from '../models/indicador.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
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
    IonCardSubtitle,
    IonCardContent,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonBadge,
    IonProgressBar,
    IonGrid,
    IonRow,
    IonCol,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonRefresher,
    IonRefresherContent
  ]
})
export class Tab1Page implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('barChartContainer') barChartElement!: ElementRef<HTMLDivElement>;
  @ViewChild('pieChartContainer') pieChartElement!: ElementRef<HTMLDivElement>;
  @ViewChild('lineChartContainer') lineChartElement!: ElementRef<HTMLDivElement>;
  @ViewChild('miniChartContainer') miniChartElement!: ElementRef<HTMLDivElement>;

  private barChart?: echarts.ECharts;
  private pieChart?: echarts.ECharts;
  private lineChart?: echarts.ECharts;
  private miniChart?: echarts.ECharts;

  private subs = new Subscription();

  // Filtros interactivos
  filtroAnio: string = 'todos';
  filtroMes: string = 'todos';
  filtroGrupo: string = 'todos';

  // Modalidad de la gráfica de pastel (Materias vs Asistencia)
  pieMode: 'materias' | 'asistencia' = 'materias';

  // KPIs
  kpis: ResumenKpis = {
    totalRegistros: 0,
    asistenciaPonderada: 0,
    promedioGlobal: 0,
    tasaEntregas: 0,
    tasaAprobacion: 0,
    totalInscritos: 0,
    totalPresentes: 0,
    totalAusentes: 0
  };

  datosFiltrados: IndicadorAcademico[] = [];
  isOnline = false;
  cargando = false;
  errorCarga = '';
  aniosDisponibles: string[] = [];
  gruposDisponibles: string[] = [];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      calendarOutline,
      schoolOutline,
      peopleOutline,
      ribbonOutline,
      checkmarkCircleOutline,
      refreshOutline,
      pieChartOutline,
      trendingUpOutline,
      barChartOutline,
      filterOutline
    });
  }

  ngOnInit(): void {
    // Suscribirse a cambios en los datos o filtros
    this.subs.add(
      this.dataService.indicadores$.subscribe(() => {
        this.actualizarVista();
      })
    );

    this.subs.add(
      this.dataService.isBackendOnline$.subscribe((online) => {
        this.isOnline = online;
      })
    );
    this.subs.add(this.dataService.error$.subscribe(error => { this.errorCarga = error; }));
    this.subs.add(this.dataService.loading$.subscribe(value => { this.cargando = value; }));
    void this.recargarDatos();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inicializarGraficas();
      this.actualizarVista();
    }, 150);
  }

  ionViewDidEnter(): void {
    this.resizeCharts();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.resizeCharts();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.barChart?.dispose();
    this.pieChart?.dispose();
    this.lineChart?.dispose();
    this.miniChart?.dispose();
  }

  onFiltroChange(): void {
    this.dataService.setFiltros({
      anio: this.filtroAnio,
      mes: this.filtroMes,
      grupo: this.filtroGrupo
    });
    this.actualizarVista();
  }

  cambiarModoPie(modo: 'materias' | 'asistencia'): void {
    this.pieMode = modo;
    this.renderPieChart();
  }

  async recargarDatos(event?: any): Promise<void> {
    try {
      await this.dataService.cargarDesdeBackend();
      this.actualizarVista();
    } finally {
      event?.target?.complete();
    }
  }

  private actualizarVista(): void {
    const todos = this.dataService.todos;
    this.aniosDisponibles = [...new Set(todos.map(d => d.fecha.slice(0, 4)))].sort();
    this.gruposDisponibles = [...new Set(todos.map(d => d.grupo))].sort();
    if (this.filtroAnio !== 'todos' && !this.aniosDisponibles.includes(this.filtroAnio)) this.filtroAnio = 'todos';
    if (this.filtroGrupo !== 'todos' && !this.gruposDisponibles.includes(this.filtroGrupo)) this.filtroGrupo = 'todos';
    this.dataService.setFiltros({ anio: this.filtroAnio, mes: this.filtroMes, grupo: this.filtroGrupo });
    this.datosFiltrados = this.dataService.obtenerDatosFiltrados();
    this.kpis = this.dataService.calcularKpis(this.datosFiltrados);
    this.renderizarTodasLasGraficas();
    this.cdr.detectChanges();
  }

  private inicializarGraficas(): void {
    if (this.barChartElement?.nativeElement && !this.barChart) {
      this.barChart = echarts.init(this.barChartElement.nativeElement);
    }
    if (this.pieChartElement?.nativeElement && !this.pieChart) {
      this.pieChart = echarts.init(this.pieChartElement.nativeElement);
    }
    if (this.lineChartElement?.nativeElement && !this.lineChart) {
      this.lineChart = echarts.init(this.lineChartElement.nativeElement);
    }
    // Vista previa móvil: solo inicializar si es visible (pantallas >= 992px)
    const miniEl = this.miniChartElement?.nativeElement;
    if (miniEl && !this.miniChart && miniEl.offsetWidth) {
      this.miniChart = echarts.init(miniEl);
    }
  }

  private renderizarTodasLasGraficas(): void {
    this.renderBarChart();
    this.renderPieChart();
    this.renderLineChart();
    this.renderMiniChart();
  }

  /** Agregado mensual compartido por la gráfica principal y la vista previa móvil */
  private agregarPorMes(): { labels: string[]; asistencia: number[]; evaluacion: number[] } {
    const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const asistencia: number[] = new Array(12).fill(0);
    const evaluacion: number[] = new Array(12).fill(0);
    const conteo: number[] = new Array(12).fill(0);
    const presentesPorMes: number[] = new Array(12).fill(0);
    const inscritosPorMes: number[] = new Array(12).fill(0);

    for (const d of this.datosFiltrados) {
      const parts = d.fecha.split('-');
      if (parts.length >= 2) {
        const mesIdx = parseInt(parts[1], 10) - 1;
        if (mesIdx >= 0 && mesIdx < 12) {
          presentesPorMes[mesIdx] += d.presentes;
          inscritosPorMes[mesIdx] += d.inscritos;
          evaluacion[mesIdx] += Number(d.promedio);
          conteo[mesIdx]++;
        }
      }
    }

    for (let i = 0; i < 12; i++) {
      if (conteo[i] > 0) {
        asistencia[i] = inscritosPorMes[i]
          ? Number((100 * presentesPorMes[i] / inscritosPorMes[i]).toFixed(1))
          : 0;
        evaluacion[i] = Number((evaluacion[i] / conteo[i]).toFixed(1));
      }
    }

    return { labels, asistencia, evaluacion };
  }

  /**
   * Tarjeta 1: "Progreso Mensual (Asistencia vs Evaluación)"
   * Gráfica de barras agrupadas: "Asistencia" (#38bdf8) y "Evaluación" (#8b5cf6)
   */
  private renderBarChart(): void {
    if (!this.barChart) return;

    const { labels: mesesLabels, asistencia: asistenciaPorMes, evaluacion: evaluacionPorMes } =
      this.agregarPorMes();

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          let tip = `<div style="font-weight:700;margin-bottom:4px;">${params[0].axisValue}</div>`;
          params.forEach((p) => {
            tip += `<div style="display:flex;align-items:center;gap:6px;font-size:12px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};"></span>
              <span>${p.seriesName}: <b>${p.value}%</b></span>
            </div>`;
          });
          return tip;
        }
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 12 },
        icon: 'circle'
      },
      grid: {
        top: 25,
        left: '3%',
        right: '4%',
        bottom: 35,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: mesesLabels,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: '#64748b',
          fontSize: 11
        },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
      },
      series: [
        {
          name: 'Asistencia',
          type: 'bar',
          data: asistenciaPorMes,
          barGap: '20%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#38bdf8' },
              { offset: 1, color: '#0ea5e9' }
            ]),
            borderRadius: [6, 6, 0, 0]
          }
        },
        {
          name: 'Evaluación',
          type: 'bar',
          data: evaluacionPorMes,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#a78bfa' },
              { offset: 1, color: '#8b5cf6' }
            ]),
            borderRadius: [6, 6, 0, 0]
          }
        }
      ]
    };

    this.barChart.setOption(option, true);
  }

  /** Mini gráfica dentro de la vista previa móvil (mismos datos, versión compacta) */
  private renderMiniChart(): void {
    if (!this.miniChart) return;

    const { labels, asistencia, evaluacion } = this.agregarPorMes();

    const option: echarts.EChartsOption = {
      grid: { top: 8, right: 4, bottom: 18, left: 4 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 7, color: '#7a839e' },
        axisTick: { show: false },
        axisLine: { show: false }
      },
      yAxis: { type: 'value', show: false, min: 0, max: 100 },
      series: [
        { type: 'bar', data: asistencia, barGap: '20%', itemStyle: { color: '#38bdf8', borderRadius: 2 } },
        { type: 'bar', data: evaluacion, itemStyle: { color: '#8b5cf6', borderRadius: 2 } }
      ]
    };

    this.miniChart.setOption(option, true);
  }

  /**
   * Tarjeta 2: "Subject Time Per Token" / "Distribución por Materia"
   * Gráfica de pastel (Pie/Donut chart) con paleta estética
   */
  private renderPieChart(): void {
    if (!this.pieChart) return;

    let pieData: { name: string; value: number; itemStyle?: any }[] = [];

    if (this.pieMode === 'materias') {
      // Agrupación por Grupo / Materia
      const groupCounts = new Map<string, number>();
      for (const d of this.datosFiltrados) {
        const g = d.grupo || 'General';
        groupCounts.set(g, (groupCounts.get(g) || 0) + d.actividadesEntregadas);
      }

      const colors = ['#0d9488', '#38bdf8', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];
      let colorIdx = 0;
      groupCounts.forEach((val, key) => {
        pieData.push({
          name: key,
          value: val,
          itemStyle: { color: colors[colorIdx % colors.length] }
        });
        colorIdx++;
      });

      if (pieData.length === 0) {
        pieData = [{ name: 'Sin datos', value: 0 }];
      }
    } else {
      // Modo Asistencia: Presentes vs Ausentes
      pieData = [
        {
          name: 'Presentes',
          value: this.kpis.totalPresentes,
          itemStyle: { color: '#0d9488' }
        },
        {
          name: 'Ausentes',
          value: this.kpis.totalAusentes,
          itemStyle: { color: '#ef4444' }
        }
      ];
    }

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: <b>{c}</b> ({d}%)'
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 11 },
        icon: 'circle'
      },
      series: [
        {
          name: this.pieMode === 'materias' ? 'Distribución' : 'Asistencia',
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#ffffff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              formatter: '{b}\n{d}%'
            }
          },
          labelLine: { show: false },
          data: pieData
        }
      ]
    };

    this.pieChart.setOption(option, true);
  }

  /**
   * Tarjeta 3: "Evolución y Tendencia Académica"
   * Gráfica de líneas suavizadas (`smooth: true`) y degradado de área
   */
  private renderLineChart(): void {
    if (!this.lineChart) return;

    // Ordenar fechas cronológicamente
    const ordenados = [...this.datosFiltrados].sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Agregar registros de varios grupos en la misma fecha (sin puntos duplicados).
    const porFecha = new Map<string, { sumaPromedio: number; registros: number; inscritos: number; presentes: number }>();
    for (const d of ordenados) {
      const a = porFecha.get(d.fecha) || { sumaPromedio: 0, registros: 0, inscritos: 0, presentes: 0 };
      a.sumaPromedio += d.promedio;
      a.registros += 1;
      a.inscritos += d.inscritos;
      a.presentes += d.presentes;
      porFecha.set(d.fecha, a);
    }
    const fechas = [...porFecha.keys()];
    const promedios = [...porFecha.values()].map(v => Number((v.sumaPromedio / v.registros).toFixed(1)));
    const asistencias = [...porFecha.values()].map(v => v.inscritos ? Number((100 * v.presentes / v.inscritos).toFixed(1)) : 0);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          let res = `<div style="font-weight:700;margin-bottom:4px;">${params[0].axisValue}</div>`;
          params.forEach((p) => {
            res += `<div style="font-size:12px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};"></span>
              <span>${p.seriesName}: <b>${p.value}%</b></span>
            </div>`;
          });
          return res;
        }
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 12 },
        icon: 'roundRect'
      },
      grid: {
        top: 25,
        left: '3%',
        right: '4%',
        bottom: 35,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: fechas.length > 0 ? fechas : ['Sin datos'],
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: '#64748b',
          fontSize: 11
        },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
      },
      series: [
        {
          name: 'Calificación',
          type: 'line',
          smooth: true,
          data: promedios,
          itemStyle: { color: '#8b5cf6' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(139, 92, 246, 0.35)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.02)' }
            ])
          }
        },
        {
          name: '% Asistencia',
          type: 'line',
          smooth: true,
          data: asistencias,
          itemStyle: { color: '#0d9488' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(13, 148, 136, 0.35)' },
              { offset: 1, color: 'rgba(13, 148, 136, 0.02)' }
            ])
          }
        }
      ]
    };

    this.lineChart.setOption(option, true);
  }

  public resizeCharts(): void {
    setTimeout(() => {
      // La vista previa móvil está oculta bajo 992px: inicializar al ganar visibilidad
      if (!this.miniChart && this.miniChartElement?.nativeElement?.offsetWidth) {
        this.miniChart = echarts.init(this.miniChartElement.nativeElement);
        this.renderMiniChart();
      }
      this.barChart?.resize();
      this.pieChart?.resize();
      this.lineChart?.resize();
      this.miniChart?.resize();
    }, 100);
  }
}