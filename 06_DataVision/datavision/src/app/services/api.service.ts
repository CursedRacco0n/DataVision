import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = API_BASE_URL;

  // Lista de URLs comunes en los equipos de desarrollo (Apache 8088, Apache estándar 80, php -S 8000)
  private readonly candidateUrls: string[] = [
    API_BASE_URL,
    'http://localhost:8088/backend_starter/api',
    'http://localhost/backend_starter/api',
    'http://127.0.0.1:8088/backend_starter/api',
    'http://127.0.0.1/backend_starter/api',
    'http://localhost:8000'
  ];

  constructor(private http: HttpClient) {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('datavision_api_url') : null;
    this.baseUrl = saved || API_BASE_URL;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(value: string): void {
    const url = value.trim().replace(/\/+$/, '');
    if (!/^https?:\/\/[^\s]+$/i.test(url)) throw new Error('Introduce una URL HTTP(S) válida');
    this.baseUrl = url;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('datavision_api_url', url);
    }
  }

  url(path: string): string {
    const cleanPath = path.replace(/^\/+/, '');
    if (this.baseUrl.endsWith('.php')) {
      return `${this.baseUrl}?action=${cleanPath.replace('.php', '')}`;
    }
    return `${this.baseUrl}/${cleanPath}`;
  }

  async checkHealth(urlToCheck?: string): Promise<{ ok: boolean; service?: string; database?: string; total_registros?: number; api_version?: string; error?: string }> {
    const target = (urlToCheck || this.baseUrl).replace(/\/+$/, '');
    const healthUrl = target.endsWith('.php') ? `${target}?action=health` : `${target}/health.php`;
    return firstValueFrom(
      this.http.get<{ ok: boolean; service?: string; database?: string; total_registros?: number; api_version?: string; error?: string }>(
        `${healthUrl}?_=${Date.now()}`
      ).pipe(timeout(2500))
    );
  }

  async autoDetectBackend(): Promise<string | null> {
    const list = Array.from(new Set([this.baseUrl, ...this.candidateUrls]));
    for (const cand of list) {
      try {
        const res = await this.checkHealth(cand);
        if (res && res.ok) {
          this.setBaseUrl(cand);
          return cand;
        }
      } catch {
        // Intentar siguiente URL candidata
      }
    }
    return null;
  }
}

