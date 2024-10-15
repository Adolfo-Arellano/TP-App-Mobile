import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(public http: HttpClient) {}

  obtenerApi() {
    return this.http.get('https://api.coinbase.com/v2/currencies');
  }

  obtenerApiCrypto() {
    return this.http.get('https://api.coinbase.com/v2/currencies/crypto');
  }

  // Método para gestionar favoritos con localStorage
  alternarFavorito(item: any, tipo: string): void {
    const key = tipo === 'moneda' ? 'favoritosMonedas' : 'favoritosCryptos';
    let favoritos = JSON.parse(localStorage.getItem(key) || '[]');

    // Determinar el identificador correcto según el tipo
    const id = tipo === 'moneda' ? item.id : item.code;

    // Verificar si el ítem ya es favorito
    const index = favoritos.findIndex(
      (fav: any) => (tipo === 'moneda' ? fav.id : fav.code) === id
    );

    if (index > -1) {
      // Si ya es favorito, eliminarlo
      favoritos.splice(index, 1);
    } else {
      // Si no es favorito, agregarlo
      favoritos.push({ ...item });
    }

    // Guardar la lista actualizada de favoritos
    localStorage.setItem(key, JSON.stringify(favoritos));
  }

  esFavorito(item: any, tipo: string): boolean {
    const key = tipo === 'moneda' ? 'favoritosMonedas' : 'favoritosCryptos';
    const favoritos = JSON.parse(localStorage.getItem(key) || '[]');

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
