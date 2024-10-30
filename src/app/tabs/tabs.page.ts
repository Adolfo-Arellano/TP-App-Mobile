import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  isLoginPage: boolean = false;

  constructor(private router: Router) {
    // Detectar la URL para cambiar el estado de `isLoginPage`
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLoginPage = event.url.includes('/tab1');
      });
  }

  navigateToTab1() {
    this.router.navigate(['/tabs/tab1'], { replaceUrl: true });
  }

  navigateToTab2() {
    this.router.navigate(['/tabs/tab2'], { replaceUrl: true });
  }

  navigateToTab3() {
    this.router.navigate(['/tabs/tab3'], { replaceUrl: true });
  }
}
