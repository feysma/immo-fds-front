import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminUserService, UserCreateRequest, UserUpdateRequest } from '../../../core/services/admin-user.service';
import { UserResponse } from '../../../core/models/auth.model';
import { PageResponse } from '../../../core/models/property.model';

const ROLE_LABELS: Record<string, string> = {
  ADMIN:       'Administrateur',
  SUPER_ADMIN: 'Super administrateur',
};

const ROLE_CLASSES: Record<string, string> = {
  ADMIN:       'bg-primary-50 text-primary-700',
  SUPER_ADMIN: 'bg-amber-50 text-amber-700',
};

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly router      = inject(Router);
  private readonly userService = inject(AdminUserService);

  // ── Liste ─────────────────────────────────────────────────────────────────

  readonly isLoading   = signal(false);
  readonly page        = signal<PageResponse<UserResponse> | null>(null);
  readonly currentPage = signal(0);

  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages    = computed(() => this.page()?.totalPages ?? 0);
  readonly users         = computed(() => this.page()?.content ?? []);

  // ── Modale création/édition ────────────────────────────────────────────────

  readonly modalMode    = signal<ModalMode>('create');
  readonly isModalOpen  = signal(false);
  readonly isSaving     = signal(false);
  readonly saveError    = signal<string | null>(null);
  readonly editingUser  = signal<UserResponse | null>(null);

  readonly userForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    role:      ['ADMIN' as 'ADMIN' | 'SUPER_ADMIN', Validators.required],
    password:  [''],   // requis uniquement à la création
    active:    [true],
  });

  // ── Confirmation de suppression ────────────────────────────────────────────

  readonly deletingUser   = signal<UserResponse | null>(null);
  readonly isDeleting     = signal(false);
  readonly deleteError    = signal<string | null>(null);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.load();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  roleLabel(role: string): string { return ROLE_LABELS[role] ?? role; }
  roleClass(role: string): string { return ROLE_CLASSES[role] ?? 'bg-gray-100 text-gray-500'; }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  // ── Chargement ────────────────────────────────────────────────────────────

  load(page = this.currentPage()): void {
    this.isLoading.set(true);
    this.currentPage.set(page);
    this.userService.searchUsers({ page, size: 20, sortBy: 'createdAt', sortDir: 'desc' }).subscribe({
      next: (res) => { this.page.set(res); this.isLoading.set(false); },
      error: ()    =>   this.isLoading.set(false),
    });
  }

  goToPage(p: number): void {
    if (p >= 0 && p < this.totalPages()) this.load(p);
  }

  get pageNumbers(): number[] {
    const total   = this.totalPages();
    const current = this.currentPage();
    const range: number[] = [];
    for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) {
      range.push(i);
    }
    return range;
  }

  // ── Modale création ────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode.set('create');
    this.editingUser.set(null);
    this.saveError.set(null);
    this.userForm.reset({ firstName: '', lastName: '', email: '', role: 'ADMIN', password: '', active: true });
    this.userForm.get('password')!.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('password')!.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  // ── Modale édition ─────────────────────────────────────────────────────────

  openEditModal(user: UserResponse): void {
    this.modalMode.set('edit');
    this.editingUser.set(user);
    this.saveError.set(null);
    this.userForm.reset({
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      role:      user.role,
      password:  '',
      active:    user.active,
    });
    this.userForm.get('password')!.clearValidators();
    this.userForm.get('password')!.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  submitModal(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.saveError.set(null);
    this.isSaving.set(true);

    const v = this.userForm.value;

    if (this.modalMode() === 'create') {
      const body: UserCreateRequest = {
        firstName: v.firstName!,
        lastName:  v.lastName!,
        email:     v.email!,
        role:      v.role as 'ADMIN' | 'SUPER_ADMIN',
        password:  v.password!,
      };
      this.userService.createUser(body).subscribe({
        next: () => { this.isSaving.set(false); this.closeModal(); this.load(0); },
        error: () => { this.isSaving.set(false); this.saveError.set('Erreur lors de la création.'); },
      });
    } else {
      const id = this.editingUser()!.id;
      const body: UserUpdateRequest = {
        firstName: v.firstName!,
        lastName:  v.lastName!,
        email:     v.email!,
        role:      v.role as 'ADMIN' | 'SUPER_ADMIN',
        active:    v.active ?? true,
      };
      this.userService.updateUser(id, body).subscribe({
        next: () => { this.isSaving.set(false); this.closeModal(); this.load(this.currentPage()); },
        error: () => { this.isSaving.set(false); this.saveError.set('Erreur lors de la modification.'); },
      });
    }
  }

  // ── Suppression ────────────────────────────────────────────────────────────

  requestDelete(user: UserResponse): void {
    this.deletingUser.set(user);
    this.deleteError.set(null);
  }

  cancelDelete(): void {
    this.deletingUser.set(null);
  }

  confirmDelete(): void {
    const user = this.deletingUser();
    if (!user) return;
    this.isDeleting.set(true);
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.deletingUser.set(null);
        // Revenir à la page précédente si elle devient vide
        const newTotal = this.totalElements() - 1;
        const maxPage  = Math.max(0, Math.ceil(newTotal / 20) - 1);
        this.load(Math.min(this.currentPage(), maxPage));
      },
      error: () => {
        this.isDeleting.set(false);
        this.deleteError.set('Erreur lors de la suppression.');
      },
    });
  }

  // ── Helpers formulaire ─────────────────────────────────────────────────────

  hasError(field: string): boolean {
    const ctrl = this.userForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
