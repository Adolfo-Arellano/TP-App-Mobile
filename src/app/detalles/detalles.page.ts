/**
 * DetallesPage Component
 * 
 * Este componente maneja la visualización detallada de monedas y criptomonedas.
 * Funcionalidades principales:
 * - Muestra información detallada de una moneda o criptomoneda específica
 * - Obtiene y muestra precios actualizados (spot, compra, venta)
 * - Permite gestionar el estado de favorito del item
 * - Maneja la navegación entre vistas
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/services/api.service';

@Component({
  selector: 'app-detalles',
  templateUrl: './detalles.page.html',
  styleUrls: ['./detalles.page.scss'],
})
export class DetallesPage implements OnInit {
  itemId: any;
  itemDetalles: any = {};
  tipo: string = '';
  precioSpot: any = '';
  precioCompra: any = '';
  precioVenta: any = '';

  /**
   * Constructor del componente DetallesPage
   * @param route Servicio para acceder a los parámetros de la ruta
   * @param apiService Servicio para realizar llamadas a la API
   * @param router Servicio de navegación
   */
  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router
  ) {}

  /**
   * Inicializa el componente obteniendo los parámetros de la ruta
   * y cargando los detalles correspondientes según el tipo (moneda o crypto)
   */
  ngOnInit() {
    this.itemId = this.route.snapshot.paramMap.get('id');
    this.tipo = this.route.snapshot.paramMap.get('tipo') || '';

    if (this.tipo === 'moneda') {
      this.obtenerDetallesMoneda();
    } else if (this.tipo === 'crypto') {
      this.obtenerDetallesCrypto();
    } else {
      console.error('Tipo no válido');
    }
  }

  /**
   * Obtiene los detalles de una moneda específica desde la API
   * Incluye información básica y precios actualizados
   */
  obtenerDetallesMoneda() {
    if (this.itemId) {
      this.apiService.obtenerApi().subscribe((response: any) => {
        if (response && response.data && Array.isArray(response.data)) {
          this.itemDetalles = response.data.find(
            (item: any) => item.id === this.itemId
          );
          if (this.itemDetalles) {
            this.obtenerPrecioSpot(this.itemId);
            this.obtenerPrecioCompra(this.itemId);
            this.obtenerPrecioVenta(this.itemId);
            this.itemDetalles.esFavorito = this.apiService.esFavorito(
              this.itemDetalles,
              'moneda'
            );
          }
        } else {
          console.error('Estructura de respuesta inesperada:', response);
        }
      });
    }
  }

  /**
   * Obtiene los detalles de una criptomoneda específica desde la API
   * Incluye información básica y precios actualizados
   */
  obtenerDetallesCrypto() {
    if (this.itemId) {
      this.apiService.obtenerApiCrypto().subscribe((response: any) => {
        if (response && response.data && Array.isArray(response.data)) {
          this.itemDetalles = response.data.find(
            (item: any) => item.code === this.itemId
          );
          if (this.itemDetalles) {
            this.obtenerPrecioSpot(this.itemId);
            this.obtenerPrecioCompra(this.itemId);
            this.obtenerPrecioVenta(this.itemId);
            this.itemDetalles.esFavorito = this.apiService.esFavorito(
              this.itemDetalles,
              'crypto'
            );
          }
        } else {
          console.error('Estructura de respuesta inesperada:', response);
        }
      });
    }
  }

  /**
   * Obtiene el precio spot (actual) de una moneda o criptomoneda
   * @param {string} moneda Identificador de la moneda o criptomoneda
   */
  obtenerPrecioSpot(moneda: string) {
    this.apiService.obtenerPrecioSpot(moneda).subscribe(
      (response: any) => {
        if (response && response.data) {
          this.precioSpot = parseFloat(
            parseFloat(response.data.amount).toFixed(3)
          );
        } else {
          console.error('Error al obtener el precio spot', response);
        }
      },
      (error) => {
        console.error('Error en la API de precio spot:', error);
      }
    );
  }

  /**
   * Obtiene el precio de compra de una moneda o criptomoneda
   * @param {string} moneda Identificador de la moneda o criptomoneda
   */
  obtenerPrecioCompra(moneda: string) {
    this.apiService.obtenerPrecioCompra(moneda).subscribe(
      (response: any) => {
        if (response && response.data) {
          this.precioCompra = parseFloat(
            parseFloat(response.data.amount).toFixed(3)
          );
        } else {
        }
      },
      (error) => {
      }
    );
  }

  /**
   * Obtiene el precio de venta de una moneda o criptomoneda
   * @param {string} moneda Identificador de la moneda o criptomoneda
   */
  obtenerPrecioVenta(moneda: string) {
    this.apiService.obtenerPrecioVenta(moneda).subscribe(
      (response: any) => {
        if (response && response.data) {
          this.precioVenta = parseFloat(
            parseFloat(response.data.amount).toFixed(3)
          ); // Precio en USD
        } else {
        }
      },
      (error) => {
      }
    );
  }

  /**
   * Navega de vuelta a la página principal de monedas/criptos
   */
  volver() {
    this.router.navigate(['/tabs/tab2']);
  }

  /**
   * Alterna el estado de favorito de la moneda o criptomoneda actual
   * Actualiza la interfaz y el estado en el servicio
   */
  toggleFavorito() {
    this.apiService.alternarFavorito(this.itemDetalles, this.tipo);

    this.itemDetalles.esFavorito = this.apiService.esFavorito(
      this.itemDetalles,
      this.tipo
    );

    this.apiService.favoritos$.subscribe((favoritos) => {
      this.itemDetalles.esFavorito = favoritos.some(
        (fav) =>
          (this.tipo === 'moneda' ? fav.id : fav.code) ===
          (this.tipo === 'moneda'
            ? this.itemDetalles.id
            : this.itemDetalles.code)
      );
    });
  }
}
