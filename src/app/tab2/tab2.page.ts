import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cryptos',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
})
export class Tab2Page implements OnInit {
  monedas: any[] = [];
  cryptos: any[] = [];
  buscar: string = '';
  favoritos: any[] = [];

  constructor(public apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.consumirApi();
    this.consumirApiCrypto();
    this.favoritos = [
      ...this.apiService.obtenerFavoritos('moneda'),
      ...this.apiService.obtenerFavoritos('crypto'),
    ]; // Obtener favoritos almacenados
  }

  consumirApi() {
    this.apiService.obtenerApi().subscribe(
      (moneda: any) => {
        this.monedas = moneda.data;
        // Añadir la propiedad esFavorito para cada moneda
        this.monedas.forEach((m) => {
          m.esFavorito = this.apiService.esFavorito(m, 'moneda');
        });
      },
      (error) => {
        console.log('Error al obtener monedas', error);
      }
    );
  }

  consumirApiCrypto() {
    this.apiService.obtenerApiCrypto().subscribe(
      (crypto: any) => {
        this.cryptos = crypto.data;
        // Añadir la propiedad esFavorito para cada criptomoneda
        this.cryptos.forEach((c) => {
          c.esFavorito = this.apiService.esFavorito(c, 'crypto');
        });
      },
      (error) => {
        console.log('Error al obtener Cryptos', error);
      }
    );
  }

  buscador(filtro: any) {
    const buscar = filtro.target.value.toLowerCase();
    if (buscar !== '') {
      this.monedas = this.monedas.filter(
        (moneda) =>
          moneda.id.toLowerCase().includes(buscar) ||
          moneda.name.toLowerCase().includes(buscar)
      );
    } else {
      this.consumirApi();
    }
  }

  buscadorCrypto(filtro: any) {
    const buscar = filtro.target.value.toLowerCase();
    if (buscar !== '') {
      this.cryptos = this.cryptos.filter(
        (crypto) =>
          crypto.code.toLowerCase().includes(buscar) ||
          crypto.name.toLowerCase().includes(buscar)
      );
    } else {
      this.consumirApiCrypto();
    }
  }

  abrirDetalles(item: any) {
    this.router.navigate(['/detalles', item.id]);
  }

  abrirDetallesCrypto(item: any) {
    this.router.navigate(['/detalles', item.code]);
  }

  SeleccionarFavorito(item: any) {
    this.apiService.alternarFavorito(item, 'moneda');
    item.esFavorito = this.apiService.esFavorito(item, 'moneda');
  }

  SeleccionarFavoritosCrypto(item: any) {
    this.apiService.alternarFavorito(item, 'crypto');
    item.esFavorito = this.apiService.esFavorito(item, 'crypto');
  }
}
