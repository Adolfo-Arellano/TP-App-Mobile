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

  constructor(
    private afAuth: AngularFireAuth,
    private alertController: AlertController,
    private router: Router
  ) {}

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

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

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  goBack() {
    this.router.navigate(['/tabs/tab1']);
  }
}