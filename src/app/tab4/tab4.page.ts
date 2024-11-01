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
import { AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
})
export class Tab4Page implements OnInit {
  user: any = null;
  isTwitterLinked: boolean = false;
  profileImage: string = 'assets/default-avatar.png';

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
    // Usar el observable authState para mantener actualizado el perfil
    this.authService.getAuthState().subscribe(user => {
      this.user = user;
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
      position: 'top'
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
          value: this.user?.displayName || ''
        },
        {
          name: 'birthDate',
          type: 'date',
          placeholder: 'Fecha de nacimiento',
          value: this.user?.birthDate || ''
        },
        {
          name: 'phone',
          type: 'tel',
          placeholder: 'Teléfono',
          value: this.user?.phone || ''
        },
        {
          name: 'location',
          type: 'text',
          placeholder: 'Ubicación',
          value: this.user?.location || ''
        },
        {
          name: 'bio',
          type: 'textarea',
          placeholder: 'Biografía',
          value: this.user?.bio || ''
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            try {
              const profileData = {
                displayName: data.displayName,
                birthDate: data.birthDate,
                phone: data.phone,
                location: data.location,
                bio: data.bio
              };
              
              await this.authService.updateProfile(profileData);
              await this.presentToast('Perfil actualizado correctamente');
            } catch (error) {
              console.error('Error al actualizar perfil:', error);
              await this.presentToast('Error al actualizar el perfil');
            }
          }
        }
      ]
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
          value: ''
        },
        {
          name: 'password',
          type: 'password',
          placeholder: 'Contraseña actual (para confirmar)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            try {
              // Primero reautenticar al usuario
              await this.authService.reauthenticate(data.password);
              await this.authService.updateEmail(data.email);
              await this.presentToast('Email actualizado correctamente. Por favor, verifica tu nuevo email.');
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
          }
        }
      ]
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
          placeholder: 'Contraseña actual'
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Nueva contraseña'
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirmar nueva contraseña'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
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
                await this.presentToast('La contraseña debe tener al menos 6 caracteres');
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
          }
        }
      ]
    });
    await alert.present();
  }

  
  /**
   * Envía un email de verificación al correo del usuario
   */
  async verifyEmail() {
    try {
      await this.authService.sendEmailVerification();
      await this.presentToast('Se ha enviado un email de verificación a tu correo');
    } catch (error) {
      await this.presentToast('Error al enviar el email de verificación');
    }
  }

  /**
   * Muestra un menú de opciones para cambiar la foto de perfil
   */
  async changeProfilePicture() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Cambiar foto de perfil',
      cssClass: 'custom-action-sheet',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            this.takePicture();
          }
        },
        {
          text: 'Seleccionar de galería',
          icon: 'image',
          handler: () => {
            this.uploadPicture();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  /**
   * Toma una foto usando la cámara del dispositivo
   */
  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        this.profileImage = image.dataUrl;
        await this.presentToast('Foto actualizada');
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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const url = URL.createObjectURL(file);
          this.profileImage = url;
          await this.presentToast('Foto actualizada');
        } catch (error) {
          console.error('Error al cargar la imagen:', error);
          await this.presentToast('Error al cargar la imagen');
        }
      }
    };
    
    input.click();
  }

  /**
   * Verifica si el usuario tiene una cuenta de Twitter vinculada
   */
  async checkTwitterStatus() {
    this.isTwitterLinked = this.authService.isTwitterLinked();
  }
  
  /**
   * Maneja la vinculación/desvinculación de la cuenta de Twitter
   * Si está vinculada, muestra confirmación para desvincular
   * Si no está vinculada, inicia el proceso de vinculación
   */
  async handleTwitterConnection() {
    try {
      if (this.isTwitterLinked) {
        // Mostrar confirmación antes de desvincular
        const alert = await this.alertController.create({
          header: 'Confirmar',
          message: '¿Estás seguro que deseas desvincular tu cuenta de Twitter?',
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Desvincular',
              handler: async () => {
                await this.authService.unlinkTwitter();
                await this.presentToast('Cuenta de Twitter desvinculada correctamente');
                this.checkTwitterStatus();
              }
            }
          ]
        });
        await alert.present();
      } else {
        // Conectar cuenta
        await this.authService.linkTwitter();
        await this.presentToast('Cuenta de Twitter conectada correctamente');
        this.checkTwitterStatus();
      }
    } catch (error: any) {
      let errorMessage = 'Error al procesar la conexión con Twitter';
      
      if (error.code === 'auth/provider-already-linked') {
        errorMessage = 'Esta cuenta de Twitter ya está vinculada a otro usuario';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Operación cancelada por el usuario';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.';
      }
      
      const alert = await this.alertController.create({
        header: 'Error',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
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
          role: 'cancel'
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
          }
        }
      ]
    });
    await alert.present();
  }
}
