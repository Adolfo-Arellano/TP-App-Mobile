import { Component, OnInit } from '@angular/core';
import axios from 'axios';

@Component({
  selector: 'app-cryptos',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
})
// export class CryptosPage implements OnInit {
export class Tab2Page implements OnInit {
  cryptos: any[] = [];

  constructor() {}

  async ngOnInit() {
    try {
      const response = await axios.get('https://api.coinbase.com/v2/currencies');
      this.cryptos = response.data.data;
    } catch (error) {
      console.error('Error al obtener criptomonedas:', error);
    }
  }
}
