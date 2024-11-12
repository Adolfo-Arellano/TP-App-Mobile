/**
 * Tab3Page Component (Conversion Page)
 *
 * Este componente maneja la funcionalidad de conversión entre monedas y criptomonedas.
 * Características principales:
 * - Conversión en tiempo real entre cualquier par de monedas/criptos
 * - Calculadora integrada para facilitar los cálculos
 * - Búsqueda y filtrado de monedas
 * - Generación de comprobantes en PDF
 * - Gestión de favoritos
 */
import { Component, OnInit } from '@angular/core';
import { ApiService, Currency } from 'src/services/api.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { PDFDocument } from 'pdf-lib';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isPlatform } from '@ionic/angular';
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

  /**
   * Constructor del componente
   * @param apiService Servicio para interactuar con la API de criptomonedas
   */
  constructor(public apiService: ApiService) {}

  /**
   * Inicializa el componente cargando los datos necesarios
   * Obtiene las listas de monedas y criptomonedas, y carga los favoritos
   */
  async ngOnInit() {
    await Promise.all([this.consumirApi(), this.consumirApiCrypto()]);
    this.cargarFavoritos();
  }

  /**
   * Carga las monedas y criptomonedas favoritas desde el almacenamiento local
   */
  cargarFavoritos() {
    this.favoritosMonedas = this.apiService.obtenerFavoritos('moneda');
    this.favoritosCryptos = this.apiService.obtenerFavoritos('crypto');
  }

  /**
   * Obtiene la lista de monedas desde la API
   */
  async consumirApi() {
    const response = await this.apiService.obtenerApi().toPromise();
    if (response?.data) {
      this.monedas = this.ordenarAlfabeticamente(response.data);
    }
  }

  /**
   * Obtiene la lista de criptomonedas desde la API
   */
  async consumirApiCrypto() {
    const response = await this.apiService.obtenerApiCrypto().toPromise();
    if (response?.data) {
      this.cryptos = this.ordenarAlfabeticamente(response.data);
    }
  }

  /**
   * Ordena una lista de monedas alfabéticamente por nombre
   * @param {Currency[]} lista Lista de monedas a ordenar
   * @returns {Currency[]} Lista ordenada alfabéticamente
   */
  ordenarAlfabeticamente(lista: Currency[]): Currency[] {
    return [...lista].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Selecciona el tipo de moneda (crypto o tradicional) para el origen o destino
   * @param {string} tipo Tipo de moneda ('monedas', 'cryptos', 'favoritosMonedas', 'favoritosCryptos')
   * @param {'from' | 'to'} origen Indica si es la moneda de origen ('from') o destino ('to')
   */
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

  /**
   * Actualiza la lista filtrada de monedas según el tipo seleccionado y término de búsqueda
   */
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
  }

  /**
   * Maneja el evento de búsqueda y actualiza la lista filtrada
   * @param {any} evento Evento del input de búsqueda
   */
  buscar(evento: any) {
    this.searchTerm = evento.target.value;
    this.actualizarListaFiltrada();
  }

  /**
   * Selecciona una moneda para la conversión
   * @param {Currency} currency Moneda seleccionada
   */
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

  /**
   * Realiza la conversión entre las monedas seleccionadas
   */
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
        return;
      }

      const response = await this.apiService
        .obtenerPreciosConversion(fromId, toId)
        .toPromise();
      if (response?.data?.amount) {
        const conversion = parsedAmount * parseFloat(response.data.amount);
        this.conversionResult = parseFloat(conversion.toFixed(3));
      } else {
        this.conversionResult >= 0.0;
      }
    } catch (error) {
      this.conversionResult = 0;
    }
  }

  /**
   * Maneja la entrada de la calculadora
   * @param {string | number} value Valor del botón presionado
   */
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

  /**
   * Agrega un número al monto actual
   * @param {string} number Número a agregar
   */
  agregarNumero(number: string) {
    if (number === '0' && this.amount === '0') return;

    if (this.amount === '0') {
      this.amount = number;
    } else {
      this.amount += number;
    }

    this.convertir();
  }

  /**
   * Agrega una coma decimal al monto actual
   */
  agregarComa() {
    if (!this.amount) {
      this.amount = '0,';
    } else if (!this.amount.includes(',')) {
      this.amount += ',';
    }
  }

  /**
   * Limpia el monto y el resultado de la conversión
   */
  limpiar() {
    this.amount = '';
    this.conversionResult = 0;
  }

  /**
   * Borra el último carácter del monto
   */
  borrarUltimo() {
    this.amount = this.amount.slice(0, -1);
    if (this.amount) {
      this.convertir();
    } else {
      this.conversionResult = 0;
    }
  }

  /**
   * Limpia la selección de moneda de origen o destino
   * @param {'from' | 'to'} origen Indica si se limpia la selección de origen o destino
   */
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

  /**
   * Genera y descarga un PDF con el comprobante de la conversión
   */
  descargarPdfnew() {
    if (
      !this.fromCurrency ||
      !this.toCurrency ||
      !this.amount ||
      !this.conversionResult
    ) {
      return;
    }

    // Reemplaza la coma por punto y convierte a número para asegurarte de que es compatible
    const parsedAmount = parseFloat(this.amount.replace(',', '.'));

    // Llama a la función de descarga con el valor numérico
    this.descargarPdf(
      {
        name: this.fromCurrency.name,
        code: this.fromCurrency.id ?? this.fromCurrency.code ?? '',
      },
      {
        name: this.toCurrency.name,
        code: this.toCurrency.id ?? this.toCurrency.code ?? '',
      },
      parsedAmount,
      this.conversionResult
    );
  }
  // Método para descargar el PDF con la información de la conversión de divisas y compartirlo en móviles
  async descargarPdf(
    fromCurrency: { name: string; id?: string; code: string },
    toCurrency: { name: string; id?: string; code: string },
    amount: number,
    conversionResult: number
  ) {
    if (!fromCurrency || !toCurrency || !amount || !conversionResult) {
      return;
    }

    // Crear el PDF
    const pdfBase64 = await this.createPdf(
      fromCurrency,
      toCurrency,
      amount,
      conversionResult
    );

    // En dispositivos móviles reales (no navegador)
    if (isPlatform('hybrid')) {
      try {
        const writeResult = await Filesystem.writeFile({
          path: 'comprobanteConversion.pdf',
          data: pdfBase64,
          directory: Directory.Documents,
        });

        await Share.share({
          title: 'Comprobante de conversión',
          text: 'Aquí tienes tu comprobante de conversión.',
          url: writeResult.uri,
          dialogTitle: 'Compartir comprobante',
        });
      } catch (error) {
        console.error('Error al guardar/compartir el PDF:', error);
        alert('Error al generar el PDF. Por favor intente nuevamente.');
      }
    } else {
      // En navegador (desktop o móvil), realizar descarga directa
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = 'comprobanteConversion.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Método para crear el PDF con la información de la conversión de divisas
  // Método para crear el PDF con la información de la conversión de divisas
  async createPdf(
    fromCurrency: { name: string; id?: string; code: string },
    toCurrency: { name: string; id?: string; code: string },
    amount: number,
    conversionResult: number
  ) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);

    const fontSize = 12;
    const yOffset = 50;

    // Convierte los números a cadenas y reemplaza los puntos decimales por comas
    const amountStr = amount.toString().replace('.', ',');
    const conversionResultStr = conversionResult.toFixed(3).replace('.', ',');

    page.drawText('Comprobante de conversión', { x: 50, y: 350, size: 18 });
    page.drawText(
      `De: ${fromCurrency.name} - ${fromCurrency.id ?? fromCurrency.code}`,
      { x: 50, y: 300, size: fontSize }
    );
    page.drawText(
      `A: ${toCurrency.name} - ${toCurrency.id ?? toCurrency.code}`,
      { x: 50, y: 300 - yOffset, size: fontSize }
    );
    page.drawText(
      `Cantidad: $ ${amountStr} ${fromCurrency.name} - ${
        fromCurrency.id ?? fromCurrency.code
      }`,
      { x: 50, y: 300 - yOffset * 2, size: fontSize }
    );
    page.drawText(
      `Resultado: $ ${conversionResultStr} ${toCurrency.name} - ${
        toCurrency.id ?? toCurrency.code
      }`,
      { x: 50, y: 300 - yOffset * 3, size: fontSize }
    );
    page.drawText('¡Gracias por usar CryptoApp!', {
      x: 50,
      y: 300 - yOffset * 5,
      size: 18,
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = this.arrayBufferToBase64(pdfBytes);

    return pdfBase64;
  }

  // Método para convertir un ArrayBuffer a base64
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
    return btoa(binary);
  }

  // Método para verificar si el dispositivo
  isMobile(): boolean {
    return (
      isPlatform('hybrid') ||
      /android|iphone|ipad|ipod/i.test(navigator.userAgent)
    );
  }
}
