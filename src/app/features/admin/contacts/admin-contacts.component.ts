import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AdminContactService, AdminContactSearchParams } from '../../../core/services/admin-contact.service';
import { ContactRequestResponse, PageResponse } from '../../../core/models/property.model';

const CONTACT_TYPE_LABELS: Record<string, string> = {
  VISIT_REQUEST:   'Demande de visite',
  GENERAL_CONTACT: 'Contact général',
  SELL_YOUR_HOME:  'Vendre mon bien',
};

const CONTACT_TYPE_CLASSES: Record<string, string> = {
  VISIT_REQUEST:   'bg-primary-50 text-primary-700',
  GENERAL_CONTACT: 'bg-gray-100 text-gray-600',
  SELL_YOUR_HOME:  'bg-amber-50 text-amber-700',
};

const STATUS_LABELS: Record<string, string> = {
  NEW:         'Nouveau',
  IN_PROGRESS: 'En cours',
  CLOSED:      'Clôturé',
};

const STATUS_CLASSES: Record<string, string> = {
  NEW:         'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  CLOSED:      'bg-gray-100 text-gray-500',
};

@Component({
  selector: 'app-admin-contacts',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './admin-contacts.component.html',
  styleUrl: './admin-contacts.component.scss',
})
export class AdminContactsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly adminContactService = inject(AdminContactService);

  readonly isLoading = signal(false);
  readonly page = signal<PageResponse<ContactRequestResponse> | null>(null);
  readonly currentPage = signal(0);

  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages    = computed(() => this.page()?.totalPages ?? 0);
  readonly contacts      = computed(() => this.page()?.content ?? []);

  readonly filters = this.fb.group({
    status:  [''],
    type:    [''],
    sortBy:  ['createdAt'],
    sortDir: ['desc'],
  });

  // Signal réactif sur sortBy pour adapter les labels de l'ordre en temps réel
  private readonly sortByValue = toSignal(
    this.filters.get('sortBy')!.valueChanges,
    { initialValue: 'createdAt' }
  );

  readonly sortDirOptions = computed(() => {
    if (this.sortByValue() === 'createdAt') {
      return [
        { value: 'desc', label: 'Plus récent d\'abord' },
        { value: 'asc',  label: 'Plus ancien d\'abord' },
      ];
    }
    return [
      { value: 'asc',  label: 'Croissant (A → Z)' },
      { value: 'desc', label: 'Décroissant (Z → A)' },
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  // ── Helpers d'affichage ───────────────────────────────────────────────────

  typeLabel(type: string): string {
    return CONTACT_TYPE_LABELS[type] ?? type;
  }

  typeClass(type: string): string {
    return CONTACT_TYPE_CLASSES[type] ?? 'bg-gray-100 text-gray-500';
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  statusClass(status: string): string {
    return STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-500';
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  openContact(id: number): void {
    this.router.navigate(['/admin/contacts', id]);
  }

  // ── Chargement ────────────────────────────────────────────────────────────

  load(page = this.currentPage()): void {
    this.isLoading.set(true);
    this.currentPage.set(page);

    const f = this.filters.value;
    const params: AdminContactSearchParams = {
      page,
      size: 20,
      sortBy:  f.sortBy  ?? 'createdAt',
      sortDir: (f.sortDir as 'asc' | 'desc') ?? 'desc',
    };
    if (f.status) params.status = f.status;
    if (f.type)   params.type   = f.type;

    this.adminContactService.searchContacts(params).subscribe({
      next: (res) => {
        this.page.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSubmit(): void {
    this.load(0);
  }

  resetFilters(): void {
    this.filters.reset({ status: '', type: '', sortBy: 'createdAt', sortDir: 'desc' });
    this.load(0);
  }

  goToPage(p: number): void {
    if (p >= 0 && p < this.totalPages()) this.load(p);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const range: number[] = [];
    for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) {
      range.push(i);
    }
    return range;
  }
}
