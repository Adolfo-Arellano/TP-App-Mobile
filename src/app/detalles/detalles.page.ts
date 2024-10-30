import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/services/api.service';

@Component({
  selector: 'app-detalles',
  templateUrl: './detalles.page.html',
  styleUrls: ['./detalles.page.scss'],
})
export class DetallesPage implements OnInit {
  itemId: any; // ID o code según el tipo
  itemDetalles: any = {}; // Detalles del elemento
  tipo: string = ''; // 'moneda' o 'crypto'
  precioSpot: any = ''; // Precio spot en USD
  precioCompra: any = ''; // Precio de compra en USD
  precioVenta: any = ''; // Precio de venta en USD

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    // Obtener el parámetro de la URL (tipo puede ser 'moneda' o 'crypto')
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

  obtenerDetallesMoneda() {
    if (this.itemId) {
      this.apiService.obtenerApi().subscribe((response: any) => {
        if (response && response.data && Array.isArray(response.data)) {
          // Busca la moneda por id
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

  obtenerDetallesCrypto() {
    if (this.itemId) {
      this.apiService.obtenerApiCrypto().subscribe((response: any) => {
        if (response && response.data && Array.isArray(response.data)) {
          // Busca la cripto por code
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

  obtenerPrecioSpot(moneda: string) {
    this.apiService.obtenerPrecioSpot(moneda).subscribe(
      (response: any) => {
        if (response && response.data) {
          this.precioSpot = parseFloat(
            parseFloat(response.data.amount).toFixed(3)
          ); // Precio en USD
        } else {
          console.error('Error al obtener el precio spot', response);
        }
      },
      (error) => {
        console.error('Error en la API de precio spot:', error);
      }
    );
  }

  obtenerPrecioCompra(moneda: string) {
    this.apiService.obtenerPrecioCompra(moneda).subscribe(
      (response: any) => {
        if (response && response.data) {
          this.precioCompra = parseFloat(
            parseFloat(response.data.amount).toFixed(3)
          ); // Precio en USD
        } else {
          console.error('Error al obtener el precio de compra', response);
        }
      },
      (error) => {
        console.error('Error en la API de precio de compra:', error);
      }
    );
  }

  obtenerPrecioVenta(moneda: string) {
    this.apiService.obtenerPrecioVenta(moneda).subscribe(
      (response: any) => {
        if (response && response.data) {
          this.precioVenta = parseFloat(
            parseFloat(response.data.amount).toFixed(3)
          ); // Precio en USD
        } else {
          console.error('Error al obtener el precio de venta', response);
        }
      },
      (error) => {
        console.error('Error en la API de precio de venta:', error);
      }
    );
  }

  volver() {
    this.router.navigate(['/tabs/tab2']);
  }

  toggleFavorito() {
    this.apiService.alternarFavorito(this.itemDetalles, this.tipo);

    // Actualizar estado inmediatamente
    this.itemDetalles.esFavorito = this.apiService.esFavorito(
      this.itemDetalles,
      this.tipo
    );

    // Suscribirse a los cambios de favoritos
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
