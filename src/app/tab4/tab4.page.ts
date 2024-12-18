/**
 * Tab4Page Component (Profile Page)
 *
 * Este componente maneja la gestión del perfil de usuario, incluyendo:
 * - Edición de información personal
 * - Gestión de credenciales (email y contraseña)
 * - Gestión de foto de perfil
 * - Vinculación con redes sociales (Twitter)
 * - Verificación de email
 * - Cierre de sesión
 */
import { Component, OnInit } from '@angular/core';
import {
  AlertController,
  ToastController,
  ActionSheetController,
  LoadingController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
  birthDate?: string;
  phone?: string;
  location?: string;
  bio?: string;
  memberSince?: string;
  emailVerified?: boolean;
}

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
})
export class Tab4Page implements OnInit {
  user: UserProfile | null = null;
  isTwitterLinked: boolean = false;
  profileImage: string = 'assets/default-avatar.png';
  memberSince: string = '';

  /**
   * Constructor del componente Profile
   * @param authService Servicio para manejo de autenticación
   * @param alertController Controlador para mostrar alertas
   * @param toastController Controlador para mostrar mensajes toast
   * @param actionSheetController Controlador para mostrar hojas de acción
   * @param router Servicio de navegación
   */
  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private loadingController: LoadingController,
    private router: Router
  ) {}

  /**
   * Inicializa el componente cargando el perfil del usuario y el estado de Twitter
   */
  ngOnInit() {
    this.loadUserProfile();
    this.checkTwitterStatus();
  }

  /**
   * Carga el perfil del usuario y se suscribe a cambios en el estado de autenticación
   */
  loadUserProfile() {
    this.authService.getAuthState().subscribe(async (user) => {
      if (user) {
        const profileData = await this.authService.getUserProfile();

        // Formatear la fecha de creación
        if (user.metadata?.creationTime) {
          this.memberSince = new Date(
            user.metadata?.creationTime || Date.now()
          ).toLocaleDateString('es-ES', {
            month: 'long',
            year: 'numeric',
          });
        }

        this.user = {
          displayName: profileData?.displayName || 'Usuario',
          email: user.email || '',
          memberSince: this.memberSince,
          emailVerified: user.emailVerified,
          photoURL: profileData?.photoURL,
        };

        this.profileImage = this.user.photoURL || 'assets/default-avatar.png';
      }
    });
  }

  /**
   * Muestra un mensaje toast temporal
   * @param {string} message Mensaje a mostrar
   */
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
    });
    await toast.present();
  }

  /**
   * Muestra un formulario de edición del perfil y procesa los cambios
   */
  async editProfile() {
    const alert = await this.alertController.create({
      header: 'Editar Perfil',
      cssClass: 'profile-edit-alert',
      inputs: [
        {
          name: 'displayName',
          type: 'text',
          placeholder: 'Nombre completo',
          value: this.user?.displayName || '',
        },
        {
          name: 'birthDate',
          type: 'date',
          placeholder: 'Fecha de nacimiento',
          value: this.user?.birthDate || '',
        },
        {
          name: 'phone',
          type: 'tel',
          placeholder: 'Teléfono',
          value: this.user?.phone || '',
        },
        {
          name: 'location',
          type: 'text',
          placeholder: 'Ubicación',
          value: this.user?.location || '',
        },
        {
          name: 'bio',
          type: 'textarea',
          placeholder: 'Biografía',
          value: this.user?.bio || '',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            try {
              if (!this.user) {
                throw new Error('No hay usuario');
              }

              // Mantener el email y memberSince al actualizar
              const updatedData = {
                ...data,
                email: this.user.email || '',
                memberSince: this.user.memberSince || '',
              };

              // Actualizar en Firestore en lugar de SessionStorage
              await this.authService.updateProfile(updatedData);

              // Actualizar estado local
              this.user = updatedData;

              await this.presentToast('Perfil actualizado correctamente');
            } catch (error) {
              console.error('Error al actualizar perfil:', error);
              await this.presentToast('Error al actualizar el perfil');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  /**
   * Muestra un formulario para cambiar el email y procesa el cambio
   * Requiere reautenticación del usuario
   */
  async editEmail() {
    const alert = await this.alertController.create({
      header: 'Cambiar Email',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Nuevo email',
          value: '',
        },
        {
          name: 'password',
          type: 'password',
          placeholder: 'Contraseña actual (para confirmar)',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            try {
              // Primero reautenticar al usuario
              await this.authService.reauthenticate(data.password);
              await this.authService.updateEmail(data.email);
              await this.presentToast(
                'Email actualizado correctamente. Por favor, verifica tu nuevo email.'
              );
            } catch (error: any) {
              console.error('Error al actualizar email:', error);
              let errorMessage = 'Error al actualizar el email';
              if (error.code === 'auth/wrong-password') {
                errorMessage = 'Contraseña incorrecta';
              } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido';
              }
              await this.presentToast(errorMessage);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  /**
   * Muestra un formulario para cambiar la contraseña y procesa el cambio
   * Requiere reautenticación del usuario
   */
  async changePassword() {
    const alert = await this.alertController.create({
      header: 'Cambiar Contraseña',
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Contraseña actual',
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Nueva contraseña',
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirmar nueva contraseña',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cambiar',
          handler: async (data) => {
            try {
              if (data.newPassword !== data.confirmPassword) {
                await this.presentToast('Las contraseñas no coinciden');
                return;
              }

              if (data.newPassword.length < 6) {
                await this.presentToast(
                  'La contraseña debe tener al menos 6 caracteres'
                );
                return;
              }

              await this.authService.reauthenticate(data.currentPassword);
              await this.authService.updatePassword(data.newPassword);
              await this.presentToast('Contraseña actualizada correctamente');
            } catch (error: any) {
              let errorMessage = 'Error al actualizar la contraseña';
              if (error.code === 'auth/wrong-password') {
                errorMessage = 'Contraseña actual incorrecta';
              }
              await this.presentToast(errorMessage);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  /**
   * Envía un email de verificación al correo del usuario
   */
  async verifyEmail() {
    try {
      await this.authService.sendEmailVerification();
      await this.presentToast(
        'Se ha enviado un email de verificación a tu correo'
      );
    } catch (error) {
      await this.presentToast('Error al enviar el email de verificación');
    }
  }

  /**
   * Muestra un menú de opciones para cambiar la foto de perfil
   */
  async changeProfilePicture() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccionar fuente de imagen',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            this.takePicture();
          },
        },
        {
          text: 'Seleccionar de galería',
          icon: 'image',
          handler: () => {
            this.uploadPicture();
          },
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  /**
   * Toma una foto usando la cámara del dispositivo
   */
  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 50, // Calidad reducida para menor tamaño
        allowEditing: true,
        resultType: CameraResultType.Base64, // Cambiamos a Base64
        source: CameraSource.Camera,
        width: 300, // Reducimos el tamaño
        height: 300,
      });

      if (image.base64String) {
        // Creamos la URL de datos con el base64
        const imageUrl = `data:image/jpeg;base64,${image.base64String}`;

        try {
          // Actualizamos el perfil con la nueva imagen
          await this.authService.updateProfile({
            ...this.user,
            photoURL: imageUrl,
          });

          // Actualizamos la vista
          this.profileImage = imageUrl;
          await this.presentToast('Foto actualizada correctamente');
        } catch (error) {
          console.error('Error guardando la foto:', error);
          await this.presentToast('Error al guardar la foto');
        }
      }
    } catch (error) {
      console.error('Error al tomar la foto:', error);
      await this.presentToast('Error al tomar la foto');
    }
  }

  /**
   * Sube una foto desde la galería del dispositivo
   */
  async uploadPicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        width: 300,
        height: 300,
      });

      if (image.base64String) {
        const imageUrl = `data:image/jpeg;base64,${image.base64String}`;

        try {
          await this.authService.updateProfile({
            ...this.user,
            photoURL: imageUrl,
          });

          this.profileImage = imageUrl;
          await this.presentToast('Foto actualizada correctamente');
        } catch (error) {
          console.error('Error guardando la foto:', error);
          await this.presentToast('Error al guardar la foto');
        }
      }
    } catch (error) {
      console.error('Error al seleccionar la foto:', error);
      await this.presentToast('Error al seleccionar la foto');
    }
  }

  /**
   * Convierte un archivo a Base64
   */
  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 400; // Tamaño máximo
          let width = img.width;
          let height = img.height;

          // Redimensionar manteniendo la proporción
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convertir a base64 con calidad reducida
          const base64 = canvas.toDataURL('image/jpeg', 0.6);
          resolve(base64);
        };
        img.src = reader.result as string;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Verifica si el usuario tiene una cuenta de Twitter vinculada
   */
  async checkTwitterStatus() {
    this.isTwitterLinked = await this.authService.isTwitterLinked();
  }

  /**
   * Maneja la vinculación/desvinculación de la cuenta de Twitter
   * Si está vinculada, muestra confirmación para desvincular
   * Si no está vinculada, inicia el proceso de vinculación
   */
  async handleTwitterConnection() {
    const loading = await this.loadingController.create({
      message: 'Procesando...',
      spinner: 'circular',
    });

    try {
      await loading.present();

      if (this.isTwitterLinked) {
        const alert = await this.alertController.create({
          header: 'Desvincular Twitter',
          message: '¿Estás seguro que deseas desvincular tu cuenta de Twitter?',
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
            },
            {
              text: 'Desvincular',
              handler: async () => {
                try {
                  await this.authService.unlinkTwitterAccount();
                  this.isTwitterLinked = false;
                  await this.presentToast(
                    'Cuenta de Twitter desvinculada correctamente'
                  );
                  await this.checkTwitterStatus(); // Actualizar estado
                } catch (error) {
                  await this.handleTwitterError(error);
                }
              },
            },
          ],
        });
        await alert.present();
      } else {
        await this.authService.linkTwitterAccount();
        await this.checkTwitterStatus(); // Actualizar estado después de vincular
        await this.presentToast('Cuenta de Twitter vinculada exitosamente');
      }
    } catch (error) {
      await this.handleTwitterError(error);
    } finally {
      await loading.dismiss();
    }
  }

  private async handleTwitterError(error: any) {
    console.error('Error con Twitter:', error);
    let message = 'Error al procesar la conexión con Twitter';

    if (error.code === 'auth/requires-recent-login') {
      message = 'Por favor, vuelve a iniciar sesión para realizar esta acción';
      await this.router.navigate(['/login']);
    } else if (error.code === 'auth/invalid-credential') {
      message =
        'La autenticación con Twitter ha fallado. Por favor, intenta nuevamente';
    } else if (error.message) {
      message = error.message;
    }

    await this.presentToast(message);
  }

  /**
   * Muestra una confirmación y procesa el cierre de sesión
   */
  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Sí, cerrar sesión',
          handler: async () => {
            try {
              await this.authService.signOut();
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              await this.presentToast('Error al cerrar sesión');
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
