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
  monedasOriginal: any[] = []; // Copia original de las monedas
  cryptos: any[] = [];
  cryptosOriginal: any[] = []; // Copia original de las criptos
  buscar: string = '';
  favoritos: any[] = [];
  sliderTipo: string = 'monedas'; // Valor por defecto para mostrar 'monedas'

  constructor(
    public apiService: ApiService,
    private router: Router) {}

  ngOnInit() {
    this.consumirApi();
    this.consumirApiCrypto();
    this.apiService.favoritos$.subscribe((favoritos) => {
      this.favoritos = favoritos; // Actualiza los favoritos cuando cambian
    });
    localStorage.getItem('tab') === '2'
      ? (this.sliderTipo = 'cryptos')
      : (this.sliderTipo = 'monedas');
  }

  consumirApi() {
    this.apiService.obtenerApi().subscribe(
      (moneda: any) => {
        this.monedas = this.ordenarAlfabeticamente(moneda.data);
        this.monedasOriginal = [...this.monedas]; // Almacena la copia original
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
        this.cryptos = this.ordenarAlfabeticamente(crypto.data);
        this.cryptosOriginal = [...this.cryptos]; // Almacena la copia original
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

  ordenarAlfabeticamente(lista: any[]): any[] {
    return lista.sort((a, b) => a.name.localeCompare(b.name));
  }

  buscador(filtro: any) {
    const buscar = filtro.target.value.toLowerCase();
    if (buscar === '') {
      this.monedas = [...this.monedasOriginal]; // Restaura la lista original
    } else {
      this.monedas = this.monedasOriginal.filter(
        (moneda) =>
          moneda.id.toLowerCase().includes(buscar) ||
          moneda.name.toLowerCase().includes(buscar)
      );
    }
  }

  buscadorCrypto(filtro: any) {
    const buscar = filtro.target.value.toLowerCase();
    if (buscar === '') {
      this.cryptos = [...this.cryptosOriginal]; // Restaura la lista original
    } else {
      this.cryptos = this.cryptosOriginal.filter(
        (crypto) =>
          crypto.code.toLowerCase().includes(buscar) ||
          crypto.name.toLowerCase().includes(buscar)
      );
    }
  }

  abrirDetalles(item: any) {
    this.router.navigate(['/tabs/detalles', 'moneda', item.id], {
      replaceUrl: true,
    }); // Ruta para detalles de monedas
    localStorage.setItem('tab', JSON.stringify(1));
  }

  abrirDetallesCrypto(item: any) {
    this.router.navigate(['/tabs/detalles', 'crypto', item.code], {
      replaceUrl: true,
    }); // Ruta para detalles de criptos
    localStorage.setItem('tab', JSON.stringify(2));
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
