import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({providedIn: 'root'})
export class ApiService {
  private baseUrl = API_BASE_URL;
  constructor(private http: HttpClient) {
    try { this.baseUrl = localStorage.getItem('datavision_api_url') || API_BASE_URL; } catch {}
  }
  getBaseUrl(): string { return this.baseUrl; }
  setBaseUrl(value: string): void {
    const url = value.trim().replace(/\/+$/, '');
    if (!/^https?:\/\/[^\s]+$/i.test(url)) throw new Error('Introduce una URL HTTP(S) válida');
    this.baseUrl = url;
    try { localStorage.setItem('datavision_api_url', url); } catch {}
  }
  url(path: string): string { return `${this.baseUrl}/${path.replace(/^\/+/, '')}`; }
  checkHealth(): Promise<{ok: boolean; service?: string; database?: string; error?: string}> {
    return firstValueFrom(this.http.get<{ok: boolean; service?: string; database?: string; error?: string}>(this.url('health.php')));
  }
}
