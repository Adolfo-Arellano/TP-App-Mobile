import { Component, OnInit } from '@angular/core';
import { ApiService, Currency } from 'src/services/api.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

interface ConversionResponse {
  data: {
    amount: string;
  };
}

interface PdfStyles {
  [key: string]: {
    fontSize?: number;
    bold?: boolean;
    margin?: [number, number, number, number];
    textAlign?: string;
  };
}

interface pdfComprobante {
  content: Array<{
    text: string;
    style?: string;
    image?: string;
  }>;
  styles: PdfStyles;
}

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
})
export class Tab3Page implements OnInit {
  monedas: Currency[] = [];
  cryptos: Currency[] = [];
  filteredCurrencies: Currency[] = [];
  favoritosMonedas: Currency[] = [];
  favoritosCryptos: Currency[] = [];
  archivoPdf: any;

  fromType: string = '';
  toType: string = '';
  fromCurrency: Currency | null = null;
  toCurrency: Currency | null = null;
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

  async ngOnInit() {
    try {
      await Promise.all([this.consumirApi(), this.consumirApiCrypto()]);
      this.cargarFavoritos();
    } catch (error) {
      console.error('Error al inicializar:', error);
    }
  }

  cargarFavoritos() {
    this.favoritosMonedas = this.apiService.obtenerFavoritos('moneda');
    this.favoritosCryptos = this.apiService.obtenerFavoritos('crypto');
    console.log('Favoritos cargados:', {
      monedas: this.favoritosMonedas,
      cryptos: this.favoritosCryptos,
    });
  }

  async consumirApi() {
    try {
      const response = await this.apiService.obtenerApi().toPromise();
      if (response?.data) {
        this.monedas = this.ordenarAlfabeticamente(response.data);
      }
    } catch (error) {
      console.error('Error al obtener monedas:', error);
    }
  }

  async consumirApiCrypto() {
    try {
      const response = await this.apiService.obtenerApiCrypto().toPromise();
      if (response?.data) {
        this.cryptos = this.ordenarAlfabeticamente(response.data);
      }
    } catch (error) {
      console.error('Error al obtener cryptos:', error);
    }
  }

  ordenarAlfabeticamente(lista: Currency[]): Currency[] {
    return [...lista].sort((a, b) => a.name.localeCompare(b.name));
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

    this.cargarFavoritos();
    this.actualizarListaFiltrada();
  }

  actualizarListaFiltrada() {
    const tipo = this.isSelectingFrom ? this.fromType : this.toType;
    let lista: Currency[] = [];

    switch (tipo) {
      case 'favoritosMonedas':
        lista = [...this.favoritosMonedas];
        break;
      case 'favoritosCryptos':
        lista = [...this.favoritosCryptos];
        break;
      case 'monedas':
        lista = [...this.monedas];
        break;
      case 'cryptos':
        lista = [...this.cryptos];
        break;
    }

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      lista = lista.filter((item: Currency) => {
        if (!item) return false;
        const nameMatch = item.name.toLowerCase().includes(searchLower);
        const idMatch = (item.id || item.code || '')
          .toLowerCase()
          .includes(searchLower);
        return nameMatch || idMatch;
      });
    }

    this.filteredCurrencies = lista;
    console.log('Lista filtrada:', this.filteredCurrencies);
  }

  buscar(evento: any) {
    this.searchTerm = evento.target.value;
    this.actualizarListaFiltrada();
  }

  seleccionarMoneda(currency: Currency) {
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
    if (this.fromCurrency && this.toCurrency && this.amount) {
      this.convertir();
    }
  }

  async convertir() {
    if (!this.fromCurrency || !this.toCurrency || !this.amount) {
      this.conversionResult = 0;
      return;
    }

    try {
      const parsedAmount = parseFloat(this.amount.replace(',', '.'));
      if (isNaN(parsedAmount)) {
        this.conversionResult = 0;
        return;
      }

      const fromId = this.fromCurrency.id || this.fromCurrency.code;
      const toId = this.toCurrency.id || this.toCurrency.code;

      if (!fromId || !toId) {
        console.error('IDs de moneda no válidos');
        return;
      }

      const response = await this.apiService
        .obtenerPreciosConversion(fromId, toId)
        .toPromise();
      if (response?.data?.amount) {
        const conversion = parsedAmount * parseFloat(response.data.amount);
        this.conversionResult = parseFloat(conversion.toFixed(3));
      } else {
        console.error('Respuesta de conversión inválida:', response);
        this.conversionResult >= 0.0;
      }
    } catch (error) {
      console.error('Error en la conversión:', error);
      this.conversionResult = 0;
    }
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
    if (number === '0' && this.amount === '0') return;

    if (this.amount === '0') {
      this.amount = number;
    } else {
      this.amount += number;
    }

    this.convertir();
  }

  agregarComa() {
    if (!this.amount) {
      this.amount = '0,';
    } else if (!this.amount.includes(',')) {
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
  }

  descargarPdf() {
    if (
      !this.fromCurrency ||
      !this.toCurrency ||
      !this.amount ||
      !this.conversionResult
    ) {
      console.error('Faltan datos para generar el PDF');
      return;
    }

    const pdfComprobante: TDocumentDefinitions = {
      content: [
        { text: 'Comprobante de conversión', style: 'header' },
        {
          text: `De: ${this.fromCurrency.name} - ${
            this.fromCurrency.id ?? this.fromCurrency.code
          }`,
        },
        {
          text: `A: ${this.toCurrency.name} - ${
            this.toCurrency.id ?? this.toCurrency.code
          }`,
        },
        {
          text: `Cantidad: $ ${this.amount} ${this.fromCurrency.name} - ${
            this.fromCurrency.id ?? this.fromCurrency.code
          }`,
        },
        {
          text: `Resultado: $ ${this.conversionResult} ${
            this.toCurrency.name
          } - ${this.toCurrency.id ?? this.toCurrency.code}`,
        },
        {
          text: '¡Gracias por usar CryptoApp!',
          style: 'header',
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
      },
    };
    {
      this.archivoPdf = pdfMake.createPdf(pdfComprobante);
      this.archivoPdf.download('comprobanteConversion.pdf');
    }
  }
}
