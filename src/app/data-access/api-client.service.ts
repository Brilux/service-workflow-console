import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PaginationParams, PaginatedResponse, PaginationMeta } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiClientService {
  private readonly http = inject(HttpClient);

  get<T>(url: string, params?: Record<string, string | number | boolean>): Observable<T> {
    const httpParams = this.buildParams(params);
    return this.http.get<T>(`/api${url}`, { params: httpParams });
  }

  getPaginated<T>(
    url: string,
    pagination: PaginationParams,
    filters?: Record<string, string | number | boolean>
  ): Observable<PaginatedResponse<T>> {
    const params: Record<string, string | number | boolean> = {
      _page: pagination.page,
      _limit: pagination.limit,
      ...filters
    };

    if (pagination.sort) {
      params['_sort'] = pagination.sort;
      params['_order'] = pagination.order ?? 'asc';
    }

    if (pagination.search) {
      params['q'] = pagination.search;
    }

    const httpParams = this.buildParams(params);

    return this.http.get<T[]>(`/api${url}`, {
      params: httpParams,
      observe: 'response'
    }).pipe(
      map((response: HttpResponse<T[]>) => this.extractPaginatedResponse<T>(response, pagination))
    );
  }

  post<T>(url: string, body: unknown): Observable<T> {
    return this.http.post<T>(`/api${url}`, body);
  }

  put<T>(url: string, body: unknown): Observable<T> {
    return this.http.put<T>(`/api${url}`, body);
  }

  patch<T>(url: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`/api${url}`, body);
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(`/api${url}`);
  }

  private buildParams(params?: Record<string, string | number | boolean>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return httpParams;
  }

  private extractPaginatedResponse<T>(
    response: HttpResponse<T[]>,
    pagination: PaginationParams
  ): PaginatedResponse<T> {
    const data = response.body ?? [];
    const totalItems = parseInt(response.headers.get('X-Total-Count') ?? '0', 10);
    const totalPages = Math.ceil(totalItems / pagination.limit);

    const meta: PaginationMeta = {
      currentPage: pagination.page,
      totalPages,
      totalItems,
      itemsPerPage: pagination.limit
    };

    return { data, meta };
  }
}
