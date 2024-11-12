/**
 * Auth Service
 *
 * Este servicio maneja toda la lógica de autenticación y gestión de usuarios.
 * Funcionalidades principales:
 * - Autenticación de usuarios (registro, login, logout)
 * - Gestión de perfil de usuario
 * - Verificación de email
 * - Cambio de contraseña
 * - Integración con redes sociales (Twitter)
 * - Manejo de sesiones
 * - Navegación basada en estado de autenticación
 *
 * Utiliza Firebase Authentication para la gestión de usuarios y Firestore
 * para almacenar datos adicionales del perfil. Implementa un sistema
 * de navegación automática basado en el estado de autenticación.
 *
 * La interfaz UserProfile define la estructura de datos para la información
 * adicional del usuario que se almacena en Firestore.
 */
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

interface UserProfile {
  displayName?: string;
  birthDate?: string;
  phone?: string;
  location?: string;
  bio?: string;
  photoURL?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        if (this.router.url === '/login') {
          this.router.navigate(['/tabs/tab2'], { replaceUrl: true });
        }
      } else {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });
  }

  /**
   * Obtiene el usuario actualmente autenticado
   * @returns {Promise<firebase.User | null>} Promesa con el usuario actual
   */
  getCurrentUser() {
    return this.afAuth.currentUser;
  }

  /**
   * Obtiene el observable del estado de autenticación
   * @returns {Observable<firebase.User | null>} Observable del estado de autenticación
   */
  getAuthState() {
    return this.afAuth.authState;
  }

  /**
   * Verifica si hay un usuario autenticado
   * @returns {Observable<boolean>} Observable que emite true si hay un usuario autenticado
   */
  isAuthenticated(): Observable<boolean> {
    return this.afAuth.authState.pipe(map((user) => !!user));
  }

  /**
   * Inicia sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<firebase.auth.UserCredential>} Promesa con las credenciales del usuario
   */
  async signIn(email: string, password: string) {
    const result = await this.afAuth.signInWithEmailAndPassword(
      email,
      password
    );
    if (result.user) {
      await this.router.navigate(['/tabs/tab2'], { replaceUrl: true });
    }
    return result;
  }

  /**
   * Registra un nuevo usuario con email y contraseña
   * @param {string} email - Email del nuevo usuario
   * @param {string} password - Contraseña del nuevo usuario
   * @returns {Promise<firebase.auth.UserCredential>} Promesa con las credenciales del usuario
   */
  async signUp(email: string, password: string) {
    const result = await this.afAuth.createUserWithEmailAndPassword(
      email,
      password
    );
    if (result.user) {
      await result.user.sendEmailVerification();
    }
    return result;
  }

  /**
   * Cierra la sesión del usuario actual
   * @returns {Promise<void>} Promesa que se resuelve cuando se cierra la sesión
   */
  async signOut() {
    await this.afAuth.signOut();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }

  /**
   * Actualiza el perfil del usuario
   * @param {UserProfile} profileData - Datos del perfil a actualizar
   * @returns {Promise<boolean>} Promesa que indica si la actualización fue exitosa
   */
  async updateProfile(profileData: UserProfile) {
    const user = await this.getCurrentUser();
    if (user) {
      await user.updateProfile({
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
      });

      await this.firestore.collection('users').doc(user.uid).set(
        {
          birthDate: profileData.birthDate,
          phone: profileData.phone,
          location: profileData.location,
          bio: profileData.bio,
          email: user.email,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      return true;
    }
    return false;
  }

  /**
   * Obtiene el perfil del usuario desde Firestore
   * @returns {Promise<any | null>} Promesa con los datos del perfil del usuario
   */
  async getUserProfile() {
    const user = await this.getCurrentUser();
    if (user) {
      const docSnapshot = await this.firestore
        .collection('users')
        .doc(user.uid)
        .get()
        .toPromise();
      return docSnapshot?.data() || null;
    }
    return null;
  }

  /**
   * Actualiza el email del usuario
   * @param {string} newEmail - Nuevo email del usuario
   * @returns {Promise<boolean>} Promesa que indica si la actualización fue exitosa
   */
  async updateEmail(newEmail: string) {
    const user = await this.getCurrentUser();
    if (user) {
      await user.updateEmail(newEmail);
      await user.sendEmailVerification();
      return true;
    }
    return false;
  }

  /**
   * Actualiza la contraseña del usuario
   * @param {string} newPassword - Nueva contraseña del usuario
   * @returns {Promise<boolean>} Promesa que indica si la actualización fue exitosa
   */
  async updatePassword(newPassword: string) {
    const user = await this.getCurrentUser();
    if (user) {
      await user.updatePassword(newPassword);
      return true;
    }
    return false;
  }

  /**
   * Envía un email de verificación al usuario actual
   * @returns {Promise<boolean>} Promesa que indica si el envío fue exitoso
   */
  async sendEmailVerification() {
    const user = await this.getCurrentUser();
    if (user) {
      await user.sendEmailVerification();
      return true;
    }
    return false;
  }

  /**
   * Reautentica al usuario actual con su contraseña
   * @param {string} password - Contraseña actual del usuario
   * @returns {Promise<firebase.auth.UserCredential | null>} Promesa con las credenciales del usuario
   */
  async reauthenticate(password: string) {
    const user = await this.getCurrentUser();
    if (user && user.email) {
      return await this.afAuth.signInWithEmailAndPassword(user.email, password);
    }
    return null;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const methods = await this.afAuth.fetchSignInMethodsForEmail(email);
    return methods && methods.length > 0;
  }

  /**
   * Vincula la cuenta de Twitter al usuario actual
   * @returns {Promise<boolean>} Promesa que indica si la vinculación fue exitosa
   */
  async linkTwitterAccount(): Promise<any> {
    try {
      const provider = new firebase.auth.TwitterAuthProvider();
      const user = await this.afAuth.currentUser;

      if (!user) {
        throw new Error('No user logged in');
      }

      const result = await user.linkWithPopup(provider);

      if (result.user) {
        await this.firestore
          .collection('users')
          .doc(user.uid)
          .update({
            twitterLinked: true,
            twitterUsername: result.user.displayName || null,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
          });
      }

      return result;
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        throw new Error(
          'Esta cuenta de Twitter ya está vinculada a otro usuario'
        );
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error(
          'El popup fue bloqueado. Por favor, permite ventanas emergentes'
        );
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error(
          'Por favor, inicia sesión en Twitter cuando se abra la ventana'
        );
      }
      throw error;
    }
  }

  /**
   * Desvincula la cuenta de Twitter del usuario actual
   * @returns {Promise<boolean>} Promesa que indica si la desvinculación fue exitosa
   */
  async unlinkTwitterAccount() {
    const user = await this.afAuth.currentUser;
    if (user) {
      await user.unlink('twitter.com');
      // Actualizar el estado en Firestore
      await this.firestore.collection('users').doc(user.uid).update({
        twitterLinked: false,
      });
      return true;
    }
    return false;
  }

  /**
   * Verifica si el usuario tiene vinculada una cuenta de Twitter
   * @returns {boolean} True si el usuario tiene vinculada una cuenta de Twitter
   */
  async isTwitterLinked(): Promise<boolean> {
    const user = await this.afAuth.currentUser;
    if (user) {
      const providers = user.providerData;
      return providers.some(
        (provider) => provider?.providerId === 'twitter.com'
      );
    }
    return false;
  }
}
