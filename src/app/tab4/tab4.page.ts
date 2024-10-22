import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/services/auth.service';
import { UserService } from './user.service';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
})
export class Tab4Page implements OnInit {

  users: Observable<any[]> | undefined;
  
  constructor(private userService: UserService) { 

  }


  ngOnInit() {
    // Al inicializar la página, obtenemos los usuarios desde Firestore
    this.users = this.userService.getUsers();
  }

}
