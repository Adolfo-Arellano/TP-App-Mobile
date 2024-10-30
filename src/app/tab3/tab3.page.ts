import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
})
export class Tab3Page implements OnInit {
  monedas: any[] = [];
  cryptos: any[] = [];
  filteredCurrencies: any[] = [];
  favoritosMonedas: any[] = [];
  favoritosCryptos: any[] = [];
  archivoPdf: any;

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
    { value: '⌫', display: '⌫' },
    { value: ',', display: ',' },
  ];

  constructor(public apiService: ApiService) {}

  ngOnInit() {
    this.consumirApi();
    this.consumirApiCrypto();
    this.consumirFavoritosMonedas();
    this.consumirFavoritosCryptos();
  }

  consumirApi() {
    this.apiService.obtenerApi().subscribe((moneda: any) => {
      this.monedas = this.ordenarAlfabeticamente(moneda.data);
    });
  }

  consumirApiCrypto() {
    this.apiService.obtenerApiCrypto().subscribe((crypto: any) => {
      this.cryptos = this.ordenarAlfabeticamente(crypto.data);
    });
  }

  consumirFavoritosMonedas() {
    this.favoritosMonedas = this.apiService.obtenerFavoritos('moneda');
    this.favoritosMonedas = this.ordenarAlfabeticamente(this.favoritosMonedas);
  }

  consumirFavoritosCryptos() {
    this.favoritosCryptos = this.apiService.obtenerFavoritos('crypto');
    this.favoritosCryptos = this.ordenarAlfabeticamente(this.favoritosCryptos);
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
    let lista: any = [];
    if (
      this.fromType == 'favoritosMonedas' ||
      this.fromType == 'favoritosCryptos'
    ) {
      lista =
        tipo === 'favoritosMonedas'
          ? this.favoritosMonedas
          : this.favoritosCryptos;
    } else {
      lista = tipo === 'monedas' ? this.monedas : this.cryptos;
    }
    if (this.searchTerm) {
      lista = lista.filter((item: any) => {
        let results = [];

        if (tipo == 'monedas' || tipo == 'favoritosMonedas') {
          results =
            item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(this.searchTerm.toLowerCase());
        } else {
          results =
            item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(this.searchTerm.toLowerCase());
        }

        return results;
      });
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
      this.limpiar();
    } else if (value === '⌫') {
      this.borrarUltimo();
    } else if (value === ',') {
      this.agregarComa();
    } else {
      this.agregarNumero(value.toString());
    }
  }

  agregarNumero(number: string) {
    // Evitar que haya ceros iniciales seguidos de otros números (a menos que haya una coma después)
    if (number === '0' && this.amount === '0') return;

    // Concatenar el número
    this.amount += number;
    this.convertir();
  }

  agregarComa() {
    // Evitar múltiples comas en el mismo número
    if (!this.amount.includes(',')) {
      this.amount += ',';
    }
  }

  limpiar() {
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
      // Reemplazar la coma por un punto antes de convertir
      const parsedAmount = parseFloat(this.amount.replace(',', '.'));
      if (isNaN(parsedAmount)) {
        this.conversionResult = 0;
        return;
      }

      const fromId =
        this.fromType === 'monedas'
          ? this.fromCurrency.id
          : this.fromCurrency.code;
      const toId =
        this.toType === 'monedas' ? this.toCurrency.id : this.toCurrency.code;

      this.apiService
        .obtenerPreciosConversion(fromId, toId)
        .subscribe((response: any) => {
          const conversion = parsedAmount * parseFloat(response.data.amount);
          // Limitar a 3 decimales con toFixed y convertir a número
          this.conversionResult = parseFloat(conversion.toFixed(3));
        });
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

  descargarPdf() {
    var pdf = {
      content: [
        { text: 'Comprobante de conversión', style: 'header' },
        {
          text: `De: ${this.fromCurrency.name} (${
            this.fromCurrency.id ?? this.fromCurrency.code
          })`,
        },
        {
          text: `A: ${this.toCurrency.name} (${
            this.toCurrency.id ?? this.toCurrency.code
          })`,
        },
        {
          text: `Cantidad: ${this.amount} (${
            this.fromCurrency.id ?? this.toCurrency.code
          })`,
        },
        {
          text: `Resultado: ${this.conversionResult} ${
            this.toCurrency.id ?? this.toCurrency.code
          }`,
        },
      ],
    };
    this.archivoPdf = pdfMake.createPdf(pdf);
    console.log('Archivo PDF creado');
    this.archivoPdf.download('comprobanteConversion.pdf');
    console.log('Archivo PDF descargado');
  }
}
