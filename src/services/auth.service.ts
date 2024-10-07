import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  onSignUp(username: string, email: string, password: string): boolean {
    const user = { username, email, password };
    localStorage.setItem('user', JSON.stringify(user)); // Guarda los datos en LocalStorage
    return true;
  }

  onSignIn(username: string, password: string): boolean {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.username === username && user.password === password) {
        sessionStorage.setItem('isAuthenticated', 'true'); // Guarda el estado en SessionStorage
        return true;
      }
    }
    return false;
  }

  isAuthenticated(): boolean {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  }

  signOut(): void {
    sessionStorage.removeItem('isAuthenticated');
  }
}
