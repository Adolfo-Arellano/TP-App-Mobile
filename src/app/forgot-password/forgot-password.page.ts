/**
 * ForgotPasswordPage Component
 * 
 * Este componente maneja la funcionalidad de recuperación de contraseña.
 * Características principales:
 * - Validación de formato de email
 * - Envío de correo de restablecimiento de contraseña
 * - Manejo de errores de autenticación
 * - Navegación entre vistas
 */
import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage {
  email: string = '';

  /**
   * Constructor del componente ForgotPasswordPage
   * @param afAuth Servicio de autenticación de Firebase
   * @param alertController Controlador para mostrar alertas
   * @param router Servicio de navegación
   */
  constructor(
    private afAuth: AngularFireAuth,
    private alertController: AlertController,
    private router: Router
  ) {}

    /**
   * Valida el formato de un email utilizando una expresión regular
   * @param {string} email - Email a validar
   * @returns {boolean} - True si el email tiene un formato válido
   * @private
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  
  /**
   * Envía el correo de restablecimiento de contraseña
   * Incluye validaciones de:
   * - Campo email no vacío
   * - Formato de email válido
   * Maneja errores específicos de Firebase Auth
   */
  async sendResetEmail() {
    if (!this.email || this.email.trim() === '') {
      await this.presentAlert('Error', 'Por favor, ingrese su correo electrónico');
      return;
    }

    if (!this.validateEmail(this.email)) {
      await this.presentAlert('Error', 'Por favor, ingrese un correo electrónico válido');
      return;
    }

    try {
      await this.afAuth.sendPasswordResetEmail(this.email);
      await this.presentAlert('Éxito', 'Se ha enviado un correo para restablecer su contraseña');
      this.router.navigate(['/tabs/tab1']);
    } catch (error: any) {
      let errorMessage = 'No se pudo enviar el correo de restablecimiento';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      }
      
      await this.presentAlert('Error', errorMessage);
    }
  }

  /**
   * Muestra una alerta con un mensaje personalizado
   * @param {string} header - Título de la alerta
   * @param {string} message - Mensaje a mostrar en la alerta
   */
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Navega de vuelta a la página de inicio de sesión
   */
  goBack() {
    this.router.navigate(['/tabs/tab1']);
  }
}