import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Currency {
  name: string;
  id?: string;
  code?: string;
}

export interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private favoritosSubject = new BehaviorSubject<Currency[]>([]);
  public favoritos$ = this.favoritosSubject.asObservable();

  constructor(public http: HttpClient) {
    this.actualizarFavoritos();
  }

  obtenerApi(): Observable<ApiResponse<Currency[]>> {
    return this.http.get<ApiResponse<Currency[]>>('https://api.coinbase.com/v2/currencies');
  }

  obtenerApiCrypto(): Observable<ApiResponse<Currency[]>> {
    return this.http.get<ApiResponse<Currency[]>>('https://api.coinbase.com/v2/currencies/crypto');
  }

  obtenerPrecioCompra(moneda: string): Observable<ApiResponse<{ amount: string }>> {
    return this.http.get<ApiResponse<{ amount: string }>>(
      `https://api.coinbase.com/v2/prices/${moneda}-USD/buy`
    );
  }

  obtenerPrecioVenta(moneda: string): Observable<ApiResponse<{ amount: string }>> {
    return this.http.get<ApiResponse<{ amount: string }>>(
      `https://api.coinbase.com/v2/prices/${moneda}-USD/sell`
    );
  }

  obtenerPrecioSpot(moneda: string): Observable<ApiResponse<{ amount: string }>> {
    return this.http.get<ApiResponse<{ amount: string }>>(
      `https://api.coinbase.com/v2/prices/${moneda}-USD/spot`
    );
  }

  obtenerPreciosConversion(fromId: string, toId: string): Observable<ApiResponse<{ amount: string }>> {
    return this.http.get<ApiResponse<{ amount: string }>>(
      `https://api.coinbase.com/v2/prices/${fromId}-${toId}/spot`
    );
  }

  alternarFavorito(item: Currency, tipo: string): void {
    const key = tipo === 'moneda' ? 'favoritosMonedas' : 'favoritosCryptos';
    const favoritos = this.obtenerFavoritos(tipo);
    const id = tipo === 'moneda' ? item.id : item.code;

    const index = favoritos.findIndex(
      (fav: Currency) => (tipo === 'moneda' ? fav.id : fav.code) === id
    );

    if (index > -1) {
      favoritos.splice(index, 1);
    } else {
      favoritos.push({ ...item });
    }

    localStorage.setItem(key, JSON.stringify(favoritos));
    this.actualizarFavoritos();
  }

  private actualizarFavoritos(): void {
    const monedasFavoritas = this.obtenerFavoritos('moneda');
    const cryptosFavoritas = this.obtenerFavoritos('crypto');
    this.favoritosSubject.next([...monedasFavoritas, ...cryptosFavoritas]);
  }

  esFavorito(item: Currency, tipo: string): boolean {
    const favoritos = this.obtenerFavoritos(tipo);
    const id = tipo === 'moneda' ? item.id : item.code;
    return favoritos.some(
      (fav: Currency) => (tipo === 'moneda' ? fav.id : fav.code) === id
    );
  }

  obtenerFavoritos(tipo: string): Currency[] {
    const key = tipo === 'moneda' ? 'favoritosMonedas' : 'favoritosCryptos';
    const favoritosStr = localStorage.getItem(key);
    try {
      return favoritosStr ? JSON.parse(favoritosStr) : [];
    } catch (error) {
      console.error('Error al parsear favoritos:', error);
      return [];
    }
  }
}
