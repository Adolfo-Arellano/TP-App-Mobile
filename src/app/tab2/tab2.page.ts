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
  sliderTipo: string = 'monedas'; // Valor por defecto para mostrar 'monedas'

  constructor(public apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.consumirApi();
    this.consumirApiCrypto();
    this.apiService.favoritos$.subscribe((favoritos) => {
      this.favoritos = favoritos; // Actualiza los favoritos cuando cambian
    });
  }

  consumirApi() {
    this.apiService.obtenerApi().subscribe(
      (moneda: any) => {
        this.monedas = moneda.data;
        // Añadir la propiedad esFavorito a cada moneda
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
        // Añadir la propiedad esFavorito a cada criptomoneda
        this.cryptos.forEach((c) => {
          c.esFavorito = this.apiService.esFavorito(c, 'crypto');
        });
      },
      (error) => {
        console.log('Error al obtener criptos', error);
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
    this.router.navigate(['/tabs/detalles', 'moneda', item.id]); // Ruta para detalles de monedas
  }

  abrirDetallesCrypto(item: any) {
    this.router.navigate(['/tabs/detalles', 'crypto', item.code]); // Ruta para detalles de criptos
  }

  SeleccionarFavorito(item: any) {
    this.apiService.alternarFavorito(item, 'moneda');
    // Actualiza el estado de esFavorito para todas las monedas
    this.monedas.forEach((m) => {
      m.esFavorito = this.apiService.esFavorito(m, 'moneda');
    });
  }

  SeleccionarFavoritosCrypto(item: any) {
    this.apiService.alternarFavorito(item, 'crypto');
    // Actualiza el estado de esFavorito para todas las criptos
    this.cryptos.forEach((c) => {
      c.esFavorito = this.apiService.esFavorito(c, 'crypto');
    });
  }
}
