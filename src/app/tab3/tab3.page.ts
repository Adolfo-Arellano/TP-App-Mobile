import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import axios from 'axios';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
})
export class Tab3Page implements OnInit {
  monedas: any[] = [];
  cryptos: any[] = [];
  filteredCurrencies: any[] = [];
  
  fromType: string = '';
  toType: string = '';
  fromCurrency: any = null;
  toCurrency: any = null;
  amount: string = '';
  conversionResult: number = 0;
  searchTerm: string = '';

  showFromSearch: boolean = false;
  showToSearch: boolean = false;
  isSelectingFrom: boolean = false;
  isSelectingTo: boolean = false;

  calculatorButtons = [
    { value: 7, display: '7' },
    { value: 8, display: '8' },
    { value: 9, display: '9' },
    { value: 4, display: '4' },
    { value: 5, display: '5' },
    { value: 6, display: '6' },
    { value: 1, display: '1' },
    { value: 2, display: '2' },
    { value: 3, display: '3' },
    { value: 'C', display: 'C' },
    { value: 0, display: '0' },
    { value: '⌫', display: '⌫' }
  ];

  constructor(public apiService: ApiService) {}

  ngOnInit() {
    this.consumirApi();
    this.consumirApiCrypto();
  }

  consumirApi() {
    this.apiService.obtenerApi().subscribe({
      next: (moneda: any) => {
        this.monedas = this.ordenarAlfabeticamente(moneda.data);
      },
      error: (error) => console.error('Error al obtener monedas:', error)
    });
  }

  consumirApiCrypto() {
    this.apiService.obtenerApiCrypto().subscribe({
      next: (crypto: any) => {
        this.cryptos = this.ordenarAlfabeticamente(crypto.data);
      },
      error: (error) => console.error('Error al obtener cryptos:', error)
    });
  }

  ordenarAlfabeticamente(lista: any[]): any[] {
    return lista.sort((a, b) => a.name.localeCompare(b.name));
  }

  seleccionarTipo(tipo: string, origen: 'from' | 'to') {
    this.searchTerm = '';
    if (origen === 'from') {
      this.fromType = tipo;
      this.fromCurrency = null;
      this.isSelectingFrom = true;
      this.showFromSearch = true;
      this.isSelectingTo = false;
      this.showToSearch = false;
    } else {
      this.toType = tipo;
      this.toCurrency = null;
      this.isSelectingTo = true;
      this.showToSearch = true;
      this.isSelectingFrom = false;
      this.showFromSearch = false;
    }
    this.actualizarListaFiltrada();
  }

  actualizarListaFiltrada() {
    const tipo = this.isSelectingFrom ? this.fromType : this.toType;
    let lista = tipo === 'monedas' ? this.monedas : this.cryptos;
    
    if (this.searchTerm) {
      lista = lista.filter(item => 
        item.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.filteredCurrencies = lista;
  }

  buscar(evento: any) {
    this.searchTerm = evento.target.value;
    this.actualizarListaFiltrada();
  }

  seleccionarMoneda(currency: any) {
    if (this.isSelectingFrom) {
      this.fromCurrency = currency;
      this.showFromSearch = false;
      this.isSelectingFrom = false;
    } else if (this.isSelectingTo) {
      this.toCurrency = currency;
      this.showToSearch = false;
      this.isSelectingTo = false;
    }
    this.searchTerm = '';
  }

  handleCalculatorInput(value: string | number) {
    if (value === 'C') {
      this.clear();
    } else if (value === '⌫') {
      this.borrarUltimo();
    } else {
      this.appendNumber(value.toString());
    }
  }

  appendNumber(number: string) {
    this.amount += number;
    this.convertir();
  }

  clear() {
    this.amount = '';
    this.conversionResult = 0;
  }

  borrarUltimo() {
    this.amount = this.amount.slice(0, -1);
    if (this.amount) {
      this.convertir();
    } else {
      this.conversionResult = 0;
    }
  }

  async convertir() {
    if (!this.fromCurrency || !this.toCurrency || !this.amount) return;

    try {
      const fromId = this.fromType === 'monedas' ? this.fromCurrency.id : this.fromCurrency.code;
      const toId = this.toType === 'monedas' ? this.toCurrency.id : this.toCurrency.code;
      
      const response = await axios.get(
        `https://api.coinbase.com/v2/prices/${fromId}-${toId}/spot`
      );
      this.conversionResult = parseFloat(this.amount) * response.data.data.amount;
    } catch (error) {
      console.error('Error en la conversión:', error);
    }
  }

  limpiarSeleccion(origen: 'from' | 'to') {
    if (origen === 'from') {
      this.fromType = '';
      this.fromCurrency = null;
      this.showFromSearch = false;
      this.isSelectingFrom = false;
    } else {
      this.toType = '';
      this.toCurrency = null;
      this.showToSearch = false;
      this.isSelectingTo = false;
    }
    this.conversionResult = 0;
    this.amount = '';
  }
}