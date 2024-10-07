import { Component } from '@angular/core';
import axios from 'axios';

@Component({
  selector: 'app-converter',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
})
// export class ConverterPage {
export class Tab3Page {
  amount: number = 1;
  fromCurrency: string = 'BTC';
  toCurrency: string = 'USD';
  conversionResult: number = 0;

  async convertCurrency() {
    try {
      const response = await axios.get(`https://api.coinbase.com/v2/prices/${this.fromCurrency}-${this.toCurrency}/spot`);
      this.conversionResult = this.amount * response.data.data.amount;
    } catch (error) {
      console.error('Error al convertir criptomonedas:', error);
    }
  }
}
