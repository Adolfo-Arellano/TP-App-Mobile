import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private favoritosSubject = new BehaviorSubject<any[]>([]);
  public favoritos$ = this.favoritosSubject.asObservable();

  constructor(public http: HttpClient) {
    // Inicializa los favoritos al cargar el servicio
    this.actualizarFavoritos();
  }

  obtenerApi() {
    return this.http.get('https://api.coinbase.com/v2/currencies');
  }

  obtenerApiCrypto() {
    return this.http.get('https://api.coinbase.com/v2/currencies/crypto');
  }

  obtenerPrecioCompra(moneda: string) {
    return this.http.get(
      `https://api.coinbase.com/v2/prices/${moneda}-USD/buy`
    );
  }

  obtenerPrecioVenta(moneda: string) {
    return this.http.get(
      `https://api.coinbase.com/v2/prices/${moneda}-USD/sell`
    );
  }

  obtenerPrecioSpot(moneda: string) {
    return this.http.get(
      `https://api.coinbase.com/v2/prices/${moneda}-USD/spot`
    );
  }

  obtenerPreciosConversion(fromId: string, toId: string) {
    return this.http.get(
      `https://api.coinbase.com/v2/prices/${fromId}-${toId}/spot`
    );
  }

  // Método para gestionar favoritos con localStorage
  alternarFavorito(item: any, tipo: string): void {
    const key = tipo === 'moneda' ? 'favoritosMonedas' : 'favoritosCryptos';
    const favoritos = this.obtenerFavoritos(tipo);

    const id = tipo === 'moneda' ? item.id : item.code;
    const index = favoritos.findIndex(
      (fav: any) => (tipo === 'moneda' ? fav.id : fav.code) === id
    );

    if (index > -1) {
      favoritos.splice(index, 1); // Si ya es favorito, eliminarlo
    } else {
      favoritos.push({ ...item }); // Si no es favorito, agregarlo
    }

    localStorage.setItem(key, JSON.stringify(favoritos));
    this.actualizarFavoritos(); // Emitir el cambio
  }

  private actualizarFavoritos() {
    const nuevosFavoritos = this.obtenerFavoritos('moneda').concat(
      this.obtenerFavoritos('crypto')
    );
    this.favoritosSubject.next(nuevosFavoritos); // Emitir nuevos favoritos
  }

  esFavorito(item: any, tipo: string): boolean {
    const key = tipo === 'moneda' ? 'favoritosMonedas' : 'favoritosCryptos';
    const favoritos = this.obtenerFavoritos(tipo);

    // Determinar el identificador correcto según el tipo
    const id = tipo === 'moneda' ? item.id : item.code;

    return favoritos.some(
      (fav: any) => (tipo === 'moneda' ? fav.id : fav.code) === id
    );
  }

  obtenerFavoritos(tipo: string): any[] {
    const key = tipo === 'moneda' ? 'favoritosMonedas' : 'favoritosCryptos';
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
}
