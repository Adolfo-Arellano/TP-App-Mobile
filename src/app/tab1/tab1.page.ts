/**
 * LoginPage Component
 * 
 * Este componente maneja la autenticación de usuarios en la aplicación.
 * Proporciona funcionalidad para:
 * - Inicio de sesión de usuarios existentes
 * - Registro de nuevos usuarios
 * - Validación de formularios
 * - Gestión de errores de autenticación
 * - Recordar email del usuario
 */

import { Component } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from 'src/services/auth.service';

// Definir tipo para los códigos de error
type FirebaseAuthError = 
  | 'auth/invalid-credential'
  | 'auth/wrong-password'
  | 'auth/user-not-found'
  | 'auth/invalid-email'
  | 'auth/too-many-requests'
  | 'auth/user-disabled'
  | 'auth/operation-not-allowed'
  | 'auth/network-request-failed'
  | 'auth/email-already-in-use'
  | 'auth/weak-password'
  | string;

@Component({
  selector: 'app-login',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
})
export class LoginPage {
    /**
   * Constructor del componente LoginPage
   * @param alertController - Servicio para mostrar alertas
   * @param toastController - Servicio para mostrar mensajes toast
   * @param router - Servicio de navegación
   * @param authService - Servicio de autenticación
   */
  isSignIn: boolean = true;
  email: string = '';
  email2: string = '';
  password: string = '';
  password2: string = '';
  username: string = '';
  username2: string = '';
  repeatPassword: string = '';
  rememberEmail: boolean = false;

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router,
    private authService: AuthService,
  ) {
    // Verificar si hay un email guardado al iniciar
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberEmail = true;
    }
  }

  /**
   * Cambia la vista al formulario de inicio de sesión y limpia los campos
   */
  toggleSignIn() {
    this.isSignIn = true;
    this.clearFields();
  }

  /**
   * Cambia la vista al formulario de registro y limpia los campos
   */
  toggleSignUp() {
    this.isSignIn = false;
    this.clearFields();
  }

  /**
   * Limpia los campos del formulario manteniendo el email si está activada la opción de recordar
   * @private
   */
  private clearFields() {
    if (!this.rememberEmail) {
      this.email = '';
    }
    this.password = '';
    this.password2 = '';
    this.repeatPassword = '';
  }

  /**
   * Muestra una alerta con un mensaje personalizado
   * @param {string} header - Título de la alerta
   * @param {string} message - Mensaje a mostrar
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
   * Muestra un mensaje toast temporal
   * @param {string} message - Mensaje a mostrar
   */
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    toast.present();
  }

  /**
   * Valida el formato de un email usando una expresión regular
   * @param {string} email - Email a validar
   * @returns {boolean} - True si el email es válido
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Obtiene el mensaje de error correspondiente para errores de inicio de sesión
   * @param {FirebaseAuthError} errorCode - Código de error de Firebase
   * @returns {string} - Mensaje de error traducido
   * @private
   */
  private getLoginErrorMessage(errorCode: FirebaseAuthError): string {
    const errorMessages: Record<string, string> = {
      'auth/invalid-credential': 'Credenciales incorrectas',
      'auth/wrong-password': 'Credenciales incorrectas',
      'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
      'auth/invalid-email': 'El correo electrónico no es válido',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor, intente más tarde',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/operation-not-allowed': 'El inicio de sesión está temporalmente deshabilitado',
      'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a internet'
    };
    return errorMessages[errorCode] || 'Error al iniciar sesión. Por favor, verifica tus credenciales';
  }

  /**
   * Obtiene el mensaje de error correspondiente para errores de registro
   * @param {FirebaseAuthError} errorCode - Código de error de Firebase
   * @returns {string} - Mensaje de error traducido
   * @private
   */
  private getSignUpErrorMessage(errorCode: FirebaseAuthError): string {
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'Este correo electrónico ya está registrado',
      'auth/invalid-email': 'El formato del correo electrónico no es válido',
      'auth/operation-not-allowed': 'El registro está temporalmente deshabilitado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a internet',
      'auth/invalid-credential': 'Las credenciales proporcionadas no son válidas',
      'auth/too-many-requests': 'Demasiados intentos. Por favor, intente más tarde'
    };
    return errorMessages[errorCode] || 'Error en el registro. Por favor, intente nuevamente';
  }

  /**
   * Maneja el proceso de inicio de sesión
   * Valida los campos y gestiona errores
   */
  async onSignIn() {
    // Validar el email (primera prioridad)
    if (!this.email || this.email.trim() === '') {
      await this.presentAlert('Error', 'Por favor, ingrese su correo electrónico');
      return;
    }

    // Validar formato del email
    if (!this.validateEmail(this.email)) {
      await this.presentAlert('Error', 'Por favor, ingrese un correo electrónico válido');
      return;
    }

    // Validar la contraseña
    if (!this.password || this.password.trim() === '') {
      await this.presentAlert('Error', 'Por favor, ingrese su contraseña');
      return;
    }
    try {
      const result = await this.authService.signIn(this.email, this.password);

      // Manejar el recordar email
      if (this.rememberEmail) {
        localStorage.setItem('rememberedEmail', this.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      if (result.user) {
        await this.presentToast(`Bienvenido ${result.user.email}`);
      }
    } catch (error: any) {
      const errorMessage = this.getLoginErrorMessage(error.code);
      await this.presentAlert('Error de autenticación', errorMessage);
    }
  }

  /**
   * Maneja el proceso de registro de nuevos usuarios
   * Valida los campos y gestiona errores
   */
  async onSignUp() {
    // Validar el email (primera prioridad)
    if (!this.email2 || this.email2.trim() === '') {
      await this.presentAlert('Error', 'Por favor, ingrese su correo electrónico');
      return;
    }

    // Validar formato del email
    if (!this.validateEmail(this.email2)) {
      await this.presentAlert('Error', 'Por favor, ingrese un correo electrónico válido');
      return;
    }

    // Validar que se ingresó la contraseña
    if (!this.password2 || this.password2.trim() === '') {
      await this.presentAlert('Error', 'Por favor, ingrese una contraseña');
      return;
    }

    // Validar longitud de la contraseña
    if (this.password2.length < 6) {
      await this.presentAlert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar que se ingresó la confirmación de contraseña
    if (!this.repeatPassword || this.repeatPassword.trim() === '') {
      await this.presentAlert('Error', 'Por favor, confirme su contraseña');
      return;
    }

    // Validar que las contraseñas coincidan
    if (this.password2 !== this.repeatPassword) {
      await this.presentAlert('Error', 'Las contraseñas no coinciden');
      return;
    }
    try {
      const emailExists = await this.authService.checkEmailExists(this.email2);
      if (emailExists) {
        await this.presentAlert('Error', 'Este correo electrónico ya está registrado');
        return;
      }

      const result = await this.authService.signUp(this.email2, this.password2);
      await this.presentAlert('Registro Exitoso', 'Se ha registrado correctamente');
      this.clearFields();
      this.toggleSignIn();
    } catch (error: any) {
      const errorMessage = this.getSignUpErrorMessage(error.code);
      await this.presentAlert('Error en el registro', errorMessage);
    }
  }

  /**
   * Navega a la página de recuperación de contraseña
   */
  async goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
