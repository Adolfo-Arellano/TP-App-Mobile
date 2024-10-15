import { Component } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
})
export class LoginPage {
  isSignIn: boolean = true;
  email: string = '';
  password: string = '';
  password2: string = '';
  username: string = '';
  username2: string = '';
  repeatPassword: string = '';

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router,
    private afAuth: AngularFireAuth
  ) {}

  toggleSignIn() {
    this.isSignIn = true;
  }

  toggleSignUp() {
    this.isSignIn = false;
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    toast.present();
  }

  async onSignIn() {
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      console.log('Login successful');
      if (result.user) {
        await this.presentToast(`Bienvenido ${result.user.email}`);
      } else {
        await this.presentToast('Bienvenido');
      }
      this.router.navigateByUrl('/tabs/tab2');
    } catch (error: any) {
      console.error('Login error', error);
      let errorMessage = 'Ocurrió un error durante el inicio de sesión';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este correo electrónico';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El correo electrónico no es válido';
          break;
      }
      await this.presentAlert('Error', errorMessage);
    }
  }

  async onSignUp() {
    if (this.password2.length < 6) {
      await this.presentAlert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
  
    if (this.password2 !== this.repeatPassword) {
      await this.presentAlert('Error', 'Las contraseñas no coinciden');
      return;
    }
  
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password2);
      console.log('Sign Up successful');
      await this.presentAlert('Registro Exitoso', 'Se ha registrado correctamente');
      this.toggleSignIn();
    } catch (error: any) {
      console.error('Sign Up error', error);
      let errorMessage = 'No se pudo completar el registro';
      
      switch(error.code) {
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Este correo electrónico ya está en uso';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El correo electrónico no es válido';
          break;
      }
      await this.presentAlert('Error', errorMessage);
    }
  }

  goToForgotPassword() {
    if (!this.email) {
      this.presentAlert('Error', 'Por favor, ingrese su correo electrónico');
      return;
    }
    this.afAuth.sendPasswordResetEmail(this.email)
    .then(() => {
      this.presentAlert('Éxito', 'Se ha enviado un correo para restablecer su contraseña');
    })
    .catch((error) => {
      this.presentAlert('Error', 'No se pudo enviar el correo de restablecimiento');
    });
  }
}
