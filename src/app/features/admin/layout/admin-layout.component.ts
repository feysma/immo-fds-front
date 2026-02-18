import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FooterPublicComponent } from '../../../shared/components/footer-public/footer-public.component';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, FooterPublicComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
