/**
 * Tab2Page Component (Cryptos Page)
 * 
 * Este componente maneja la visualización y gestión de monedas y criptomonedas.
 * Funcionalidades principales:
 * - Listado de monedas y criptomonedas
 * - Búsqueda y filtrado
 * - Gestión de favoritos
 * - Navegación a detalles
 */
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

  /**
   * Inicializa el componente cargando datos y suscripciones
   */
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

  /**
   * Obtiene y procesa la lista de monedas desde la API
   */
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

  /**
   * Obtiene y procesa la lista de criptomonedas desde la API
   */
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

  /**
   * Ordena una lista alfabéticamente por el nombre
   * @param {any[]} lista - Lista a ordenar
   * @returns {any[]} Lista ordenada alfabéticamente
   */
  ordenarAlfabeticamente(lista: any[]): any[] {
    return lista.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Filtra la lista de monedas según el término de búsqueda
   * @param {any} filtro - Evento del input de búsqueda
   */
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

  /**
   * Filtra la lista de criptomonedas según el término de búsqueda
   * @param {any} filtro - Evento del input de búsqueda
   */
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

  /**
   * Navega a la página de detalles de una moneda
   * @param {any} item - Moneda seleccionada
   */
  abrirDetalles(item: any) {
    this.router.navigate(['/tabs/detalles', 'moneda', item.id], {
      replaceUrl: true,
    }); // Ruta para detalles de monedas
    localStorage.setItem('tab', JSON.stringify(1));
  }

  /**
   * Navega a la página de detalles de una criptomoneda
   * @param {any} item - Criptomoneda seleccionada
   */
  abrirDetallesCrypto(item: any) {
    this.router.navigate(['/tabs/detalles', 'crypto', item.code], {
      replaceUrl: true,
    }); // Ruta para detalles de criptos
    localStorage.setItem('tab', JSON.stringify(2));
  }

  /**
   * Alterna el estado de favorito de una moneda
   * @param {any} item - Moneda a alternar en favoritos
   */
  SeleccionarFavorito(item: any) {
    this.apiService.alternarFavorito(item, 'moneda');
    // Actualiza el estado de esFavorito para todas las monedas
    this.monedas.forEach((m) => {
      m.esFavorito = this.apiService.esFavorito(m, 'moneda');
    });
  }

  /**
   * Alterna el estado de favorito de una criptomoneda
   * @param {any} item - Criptomoneda a alternar en favoritos
   */
  SeleccionarFavoritosCrypto(item: any) {
    this.apiService.alternarFavorito(item, 'crypto');
    // Actualiza el estado de esFavorito para todas las criptos
    this.cryptos.forEach((c) => {
      c.esFavorito = this.apiService.esFavorito(c, 'crypto');
    });
  }
}
