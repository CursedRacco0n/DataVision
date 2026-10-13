import { Injectable } from '@angular/core';
import axios, { AxiosInstance } from 'axios';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http: AxiosInstance = axios.create({ timeout: 12000 });

  // Debe apuntar al IP de la computadora XAMPP visible desde Android.
  setBaseUrl(url: string): void {
    localStorage.setItem('api_base_url', url.trim().replace(/\/$/, ''));
  }
  getBaseUrl(): string { return localStorage.getItem('api_base_url') || ''; }
  private endpoint(path: string): string {
    const base = this.getBaseUrl();
    if (!base) throw new Error('Primero configura la URL base de la API.');
    return `${base}/${path.replace(/^\//, '')}`;
  }
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const res = await this.http.get<T>(this.endpoint(path), { params });
    return res.data;
  }
  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.http.post<T>(this.endpoint(path), body);
    return res.data;
  }
  async upload<T>(path: string, body: FormData): Promise<T> {
    // No declarar Content-Type manualmente: el navegador agrega boundary.
    const res = await this.http.post<T>(this.endpoint(path), body);
    return res.data;
  }
  errorText(err: unknown): string {
    if (axios.isAxiosError(err)) {
      return `HTTP ${err.response?.status ?? 'sin respuesta'} | ${err.config?.url ?? 'sin URL'} | ${JSON.stringify(err.response?.data ?? err.message)}`;
    }
    return err instanceof Error ? err.message : String(err);
  }
}
