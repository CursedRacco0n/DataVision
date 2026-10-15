import { Injectable } from '@angular/core';
import axios, { AxiosInstance } from 'axios';
import { IndicadorAcademico } from '../models/indicador.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http: AxiosInstance = axios.create({
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  private defaultUrl = 'http://localhost/06_DataVision/backend_starter/api';

  constructor() {
    if (!localStorage.getItem('api_base_url')) {
      localStorage.setItem('api_base_url', this.defaultUrl);
    }
  }

  setBaseUrl(url: string): void {
    localStorage.setItem('api_base_url', url.trim().replace(/\/$/, ''));
  }

  getBaseUrl(): string {
    return localStorage.getItem('api_base_url') || this.defaultUrl;
  }

  private endpoint(path: string): string {
    const base = this.getBaseUrl();
    return `${base}/${path.replace(/^\//, '')}`;
  }

  async checkHealth(): Promise<{ ok: boolean; service?: string; database?: string; error?: string }> {
    try {
      const res = await this.http.get(this.endpoint('health.php'));
      return res.data;
    } catch (err) {
      return { ok: false, error: this.errorText(err) };
    }
  }

  async getIndicadores(params?: Record<string, any>): Promise<{ ok: boolean; items: IndicadorAcademico[]; total?: number }> {
    const res = await this.http.get(this.endpoint('indicadores/list.php'), { params });
    return res.data;
  }

  async createIndicador(indicador: IndicadorAcademico): Promise<{ ok: boolean; id?: number; error?: string }> {
    const res = await this.http.post(this.endpoint('indicadores/create.php'), indicador);
    return res.data;
  }

  async importIndicadores(items: IndicadorAcademico[]): Promise<{
    ok: boolean;
    insertados: number;
    rechazados: number;
    errores: string[];
  }> {
    const res = await this.http.post(this.endpoint('indicadores/import.php'), { items });
    return res.data;
  }

  errorText(err: unknown): string {
    if (axios.isAxiosError(err)) {
      if (err.response) {
        const errorMsg = err.response.data?.error || err.response.data?.message || err.message;
        return `Error ${err.response.status}: ${errorMsg}`;
      }
      return `Error de red: ${err.message} (Verifique la URL del backend PHP)`;
    }
    return err instanceof Error ? err.message : String(err);
  }
}
