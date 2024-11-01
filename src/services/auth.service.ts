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
    this.afAuth.authState.subscribe(user => {
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
    return this.afAuth.authState.pipe(
      map(user => !!user)
    );
  }

  /**
   * Inicia sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<firebase.auth.UserCredential>} Promesa con las credenciales del usuario
   */
  async signIn(email: string, password: string) {
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(email, password);
      if (result.user) {
        await this.router.navigate(['/tabs/tab2'], { replaceUrl: true });
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Registra un nuevo usuario con email y contraseña
   * @param {string} email - Email del nuevo usuario
   * @param {string} password - Contraseña del nuevo usuario
   * @returns {Promise<firebase.auth.UserCredential>} Promesa con las credenciales del usuario
   */
  async signUp(email: string, password: string) {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(email, password);
      if (result.user) {
        await result.user.sendEmailVerification();
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cierra la sesión del usuario actual
   * @returns {Promise<void>} Promesa que se resuelve cuando se cierra la sesión
   */
  async signOut() {
    try {
      await this.afAuth.signOut();
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza el perfil del usuario
   * @param {UserProfile} profileData - Datos del perfil a actualizar
   * @returns {Promise<boolean>} Promesa que indica si la actualización fue exitosa
   */
  async updateProfile(profileData: UserProfile) {
    const user = await this.getCurrentUser();
    if (user) {
      try {
        await user.updateProfile({
          displayName: profileData.displayName,
          photoURL: profileData.photoURL
        });

        await this.firestore.collection('users').doc(user.uid).set({
          birthDate: profileData.birthDate,
          phone: profileData.phone,
          location: profileData.location,
          bio: profileData.bio,
          email: user.email,
          updatedAt: new Date()
        }, { merge: true });

        return true;
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
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
      const docSnapshot = await this.firestore.collection('users').doc(user.uid).get().toPromise();
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
      try {
        await user.updateEmail(newEmail);
        await user.sendEmailVerification();
        return true;
      } catch (error) {
        throw error;
      }
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
      try {
        await user.updatePassword(newPassword);
        return true;
      } catch (error) {
        throw error;
      }
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
      try {
        await user.sendEmailVerification();
        return true;
      } catch (error) {
        throw error;
      }
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
      try {
        return await this.afAuth.signInWithEmailAndPassword(user.email, password);
      } catch (error) {
        throw error;
      }
    }
    return null;
  }

  /**
   * Vincula la cuenta de Twitter al usuario actual
   * @returns {Promise<boolean>} Promesa que indica si la vinculación fue exitosa
   */
  async linkTwitter() {
    try {
      const provider = new firebase.auth.TwitterAuthProvider();
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        await currentUser.linkWithPopup(provider);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error linking Twitter:', error);
      throw error;
    }
  }

  /**
   * Desvincula la cuenta de Twitter del usuario actual
   * @returns {Promise<boolean>} Promesa que indica si la desvinculación fue exitosa
   */
  async unlinkTwitter() {
    try {
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        await currentUser.unlink('twitter.com');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unlinking Twitter:', error);
      throw error;
    }
  }

  /**
   * Verifica si el usuario tiene vinculada una cuenta de Twitter
   * @returns {boolean} True si el usuario tiene vinculada una cuenta de Twitter
   */
  isTwitterLinked(): boolean {
    const currentUser = firebase.auth().currentUser;
    if (currentUser && currentUser.providerData) {
      return currentUser.providerData.some(
        provider => provider?.providerId === 'twitter.com'
      );
    }
    return false;
  }
}
