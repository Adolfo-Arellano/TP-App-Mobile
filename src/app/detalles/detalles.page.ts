import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/services/api.service';

@Component({
  selector: 'app-detalles',
  templateUrl: './detalles.page.html',
  styleUrls: ['./detalles.page.scss'],
})
export class DetallesPage implements OnInit {
  itemId: any;
  itemDetalles: any = {};

  constructor(private route: ActivatedRoute, private apiService: ApiService) {}

  ngOnInit() {
    this.itemId = this.route.snapshot.paramMap.get('id');

    if (this.itemId) {
      this.apiService.obtenerApi().subscribe((itemDetalle) => {
        // Si la respuesta es un arreglo directamente
        if (Array.isArray(itemDetalle)) {
          this.itemDetalles = itemDetalle.find(
            (item) => item.id === parseInt(this.itemId)
          );
        } else {
          console.error('La respuesta de la API no es un arreglo');
        }
      });
    }
  }
}
