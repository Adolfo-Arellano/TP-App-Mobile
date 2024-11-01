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

  /**
   * Obtiene la lista de todas las monedas disponibles desde la API de Coinbase
   * @returns {Observable<ApiResponse<Currency[]>>} Observable con la lista de monedas
   */
  obtenerApi(): Observable<ApiResponse<Currency[]>> {
    return this.http.get<ApiResponse<Currency[]>>('https://api.coinbase.com/v2/currencies');
  }

  /**
   * Obtiene la lista de todas las criptomonedas disponibles desde la API de Coinbase
   * @returns {Observable<ApiResponse<Currency[]>>} Observable con la lista de criptomonedas
   */
  obtenerApiCrypto(): Observable<ApiResponse<Currency[]>> {
    return this.http.get<ApiResponse<Currency[]>>('https://api.coinbase.com/v2/currencies/crypto');
  }

  /**
   * Obtiene el precio de compra de una moneda específica en USD
   * @param {string} moneda - Código de la moneda a consultar
   * @returns {Observable<ApiResponse<{ amount: string }>>} Observable con el precio de compra
   */
  obtenerPrecioCompra(moneda: string): Observable<ApiResponse<{ amount: string }>> {
    return this.http.get<ApiResponse<{ amount: string }>>(
      `https://api.coinbase.com/v2/prices/${moneda}-USD/buy`
    );
  }

  /**
   * Obtiene el precio de venta de una moneda específica en USD
   * @param {string} moneda - Código de la moneda a consultar
   * @returns {Observable<ApiResponse<{ amount: string }>>} Observable con el precio de venta
   */
  obtenerPrecioVenta(moneda: string): Observable<ApiResponse<{ amount: string }>> {
    return this.http.get<ApiResponse<{ amount: string }>>(
      `https://api.coinbase.com/v2/prices/${moneda}-USD/sell`
    );
  }

  /**
   * Obtiene el precio spot (actual) de una moneda específica en USD
   * @param {string} moneda - Código de la moneda a consultar
   * @returns {Observable<ApiResponse<{ amount: string }>>} Observable con el precio spot
   */
  obtenerPrecioSpot(moneda: string): Observable<ApiResponse<{ amount: string }>> {
    return this.http.get<ApiResponse<{ amount: string }>>(
      `https://api.coinbase.com/v2/prices/${moneda}-USD/spot`
    );
  }

  /**
   * Obtiene el precio de conversión entre dos monedas
   * @param {string} fromId - Código de la moneda origen
   * @param {string} toId - Código de la moneda destino
   * @returns {Observable<ApiResponse<{ amount: string }>>} Observable con el precio de conversión
   */
  obtenerPreciosConversion(fromId: string, toId: string): Observable<ApiResponse<{ amount: string }>> {
    return this.http.get<ApiResponse<{ amount: string }>>(
      `https://api.coinbase.com/v2/prices/${fromId}-${toId}/spot`
    );
  }

  /**
   * Alterna el estado de favorito de una moneda o criptomoneda
   * @param {Currency} item - Moneda a alternar en favoritos
   * @param {string} tipo - Tipo de moneda ('moneda' o 'crypto')
   */
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

  /**
   * Actualiza la lista de favoritos en el BehaviorSubject
   * @private
   */
  private actualizarFavoritos(): void {
    const monedasFavoritas = this.obtenerFavoritos('moneda');
    const cryptosFavoritas = this.obtenerFavoritos('crypto');
    this.favoritosSubject.next([...monedasFavoritas, ...cryptosFavoritas]);
  }

  /**
   * Verifica si una moneda está en la lista de favoritos
   * @param {Currency} item - Moneda a verificar
   * @param {string} tipo - Tipo de moneda ('moneda' o 'crypto')
   * @returns {boolean} True si la moneda está en favoritos
   */
  esFavorito(item: Currency, tipo: string): boolean {
    const favoritos = this.obtenerFavoritos(tipo);
    const id = tipo === 'moneda' ? item.id : item.code;
    return favoritos.some(
      (fav: Currency) => (tipo === 'moneda' ? fav.id : fav.code) === id
    );
  }

  /**
   * Obtiene la lista de favoritos almacenada en localStorage
   * @param {string} tipo - Tipo de moneda ('moneda' o 'crypto')
   * @returns {Currency[]} Array de monedas favoritas
   */
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
