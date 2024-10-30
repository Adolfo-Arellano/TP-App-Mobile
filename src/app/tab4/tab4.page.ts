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

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    // Usar el observable authState para mantener actualizado el perfil
    this.authService.getAuthState().subscribe(user => {
      this.user = user;
    });
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }

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

  async editEmail() {
    const alert = await this.alertController.create({
      header: 'Cambiar Email',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Nuevo email',
          value: this.user?.email || ''
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

  async verifyEmail() {
    try {
      await this.authService.sendEmailVerification();
      await this.presentToast('Se ha enviado un email de verificación a tu correo');
    } catch (error) {
      await this.presentToast('Error al enviar el email de verificación');
    }
  }

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
