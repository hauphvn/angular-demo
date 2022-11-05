import { Injectable } from '@angular/core';
import { filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RouterService {
  private history = [];
  private isBackFromDashboard = false;

  constructor(private router: Router) {
    this.loadRouting();
  }

  loadRouting(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(({ urlAfterRedirects }: NavigationEnd) => {
        this.history = [...this.history, urlAfterRedirects];
      });
  }

  getPreviousUrl(): string {
    return this.history[this.history.length - 2] || '';
  }

  setIsBackFromDashboard(value: boolean) {
    this.isBackFromDashboard = value;
  }

  getIsBackFromDashboard() {
    return this.isBackFromDashboard;
  }
}
