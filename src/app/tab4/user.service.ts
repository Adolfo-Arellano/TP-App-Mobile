import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
  })
  export class UserService {
  
    constructor(private firestore: AngularFirestore) {}
  
    // Obtener todos los usuarios de la colección 'users'
    getUsers(): Observable<any[]> {
      return this.firestore.collection('users').valueChanges(); // Obtenemos los datos en tiempo real
    }
  
    // Obtener un solo usuario por su UID
    getUser(uid: string): Observable<any> {
      return this.firestore.collection('users').doc(uid).valueChanges();
    }
  }
  