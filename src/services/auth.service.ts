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
  // Observa cambios en el estado de autenticación
  this.afAuth.authState.subscribe(user => {
    if (user) {
      // Si el usuario está autenticado y está en la página de login, redirigir a tabs
      if (this.router.url === '/login') {
        this.router.navigate(['/tabs/tab2'], { replaceUrl: true });
      }
    } else {
      // Si no está autenticado, redirigir a login
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  });
}

  getCurrentUser() {
    return this.afAuth.currentUser;
  }

  getAuthState() {
    return this.afAuth.authState;
  }

  isAuthenticated(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      map(user => !!user)
    );
  }

  async signIn(email: string, password: string) {
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(email, password);
      if (result.user) {
        // Redirigir después de login exitoso
        await this.router.navigate(['/tabs/tab2'], { replaceUrl: true });
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

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

  async signOut() {
    try {
      await this.afAuth.signOut();
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(profileData: UserProfile) {
    const user = await this.getCurrentUser();
    if (user) {
      try {
        // Actualizamos datos básicos de Auth
        await user.updateProfile({
          displayName: profileData.displayName,
          photoURL: profileData.photoURL
        });

        // Guardamos datos adicionales en Firestore
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

  async getUserProfile() {
    const user = await this.getCurrentUser();
    if (user) {
      const docSnapshot = await this.firestore.collection('users').doc(user.uid).get().toPromise();
      return docSnapshot?.data() || null;  // Usamos el operador de encadenamiento opcional
    }
    return null;
  }

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
