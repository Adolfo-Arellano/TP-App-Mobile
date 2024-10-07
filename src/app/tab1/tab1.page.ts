import { Component } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular'; // Importar alertas y toasts
import { Router } from '@angular/router'; // Para redirigir a otras pestañas

@Component({
  selector: 'app-login',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
})
export class LoginPage {
  // Variables para controlar el estado de la página y los inputs del usuario
  isSignIn: boolean = true;  // Controla qué formulario se muestra (true para Sign In, false para Sign Up)
  email: string = '';        // Almacena el email ingresado en el formulario de registro
  password: string = '';     // Almacena la contraseña para el inicio de sesión
  password2: string = '';    // Almacena la contraseña para el registro
  username: string = '';     // Almacena el nombre de usuario para el inicio de sesión
  username2: string = '';    // Almacena el nombre de usuario para el registro
  repeatPassword: string = ''; // Almacena la confirmación de contraseña para el registro

  constructor (
    private alertController: AlertController,  // Para mostrar alertas
    private toastController: ToastController,  // Para mostrar notificaciones breves
    private router: Router  // Para la navegación entre páginas
  ) {}

  // isSignIn: Controla qué formulario se muestra

  // Cambia al formulario de inicio de sesión
  toggleSignIn() {
    this.isSignIn = true;
  }

  // Cambia al formulario de registro
  toggleSignUp() {
    this.isSignIn = false;
  }

  // Método para mostrar alertas
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  // Método para mostrar toasts (notificaciones breves)
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    toast.present();
  }

  // Lógica para el inicio de sesión
  async onSignIn() {
    // Busca el usuario en localStorage o sessionStorage
    const savedUser = JSON.parse(localStorage.getItem(this.username) || sessionStorage.getItem(this.username) || 'null');
    if (savedUser && savedUser.password === this.password) {
      console.log('Login successful');

      // Mostrar toast de éxito
      await this.presentToast(`Bienvenido ${this.username}`);

      // Redirige a la tab de criptomonedas, o la que queramos
      this.router.navigateByUrl('/tabs/tab2');
    } else {
      console.log('Invalid credentials');
      
      // Mostrar alerta de error
      await this.presentAlert('Error', 'Credenciales incorrectas');
    }
    console.log('Sign In', { username: this.username, password: this.password });
  }


  // Lógica para registrar un usuario
  async onSignUp() {
    // Verifica que las contraseñas coincidan
    if (this.password2 !== this.repeatPassword) {
      console.log('Passwords do not match');
      await this.presentAlert('Error', 'Las contraseñas no coinciden');
      return;
    }
    // Crea un objeto con los datos del nuevo usuario
    const newUser = {
      username: this.username2,
      email: this.email,
      password: this.password2
    };

    // Guarda los datos en localStorage o sessionStorage
    const saveInLocalStorage = true;  // Se Puede cambiar el valor a false para usar sessionStorage
    if (saveInLocalStorage) {
      // Guarda el nuevo usuario en localStorage
      localStorage.setItem(this.username2, JSON.stringify(newUser));
    } else {
      sessionStorage.setItem(this.username2, JSON.stringify(newUser));
    }
    console.log('Sign Up successful');

    // Muestra alerta de registro exitoso
    const alert = await this.alertController.create({
      header: 'Registro Exitoso',
      message: 'Se ha registrado correctamente',
      buttons: [
        {
          text: 'Sign In',
          handler: () => {
            this.toggleSignIn(); // Cambia al formulario de inicio de sesión tras el registro exitoso
          }
        }
      ]
    });
    await alert.present();

    console.log('Sign Up', { username: this.username2, email: this.email, password: this.password2 });
  }

  // Método para navegar a la página de recuperación de contraseña
  goToForgotPassword() {
    console.log('Forgot Password');
    this.router.navigateByUrl('/tabs/forgot-password');
  }
}
