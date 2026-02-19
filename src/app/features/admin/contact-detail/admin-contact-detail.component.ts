import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminContactService } from '../../../core/services/admin-contact.service';
import { ContactRequestResponse } from '../../../core/models/property.model';

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

// Transitions de statut valides
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW:         ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['CLOSED'],
  CLOSED:      ['NEW'],
};

@Component({
  selector: 'app-admin-contact-detail',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './admin-contact-detail.component.html',
  styleUrl: './admin-contact-detail.component.scss',
})
export class AdminContactDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly adminContactService = inject(AdminContactService);

  readonly isLoading = signal(true);
  readonly contact = signal<ContactRequestResponse | null>(null);
  readonly notFound = signal(false);

  // Notes
  readonly isEditingNotes = signal(false);
  readonly isSavingNotes = signal(false);
  readonly notesForm = this.fb.group({ adminNotes: [''] });

  // Statut
  readonly pendingStatus = signal<string | null>(null);
  readonly isUpdatingStatus = signal(false);
  readonly statusError = signal<string | null>(null);

  // Computed
  readonly availableTransitions = computed(() => {
    const c = this.contact();
    return c ? (VALID_STATUS_TRANSITIONS[c.status] ?? []) : [];
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/admin/contacts']); return; }

    this.adminContactService.getContact(id).subscribe({
      next: (c) => {
        this.contact.set(c);
        this.notesForm.patchValue({ adminNotes: c.adminNotes ?? '' });
        this.isLoading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.isLoading.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  typeLabel(type: string): string  { return CONTACT_TYPE_LABELS[type] ?? type; }
  typeClass(type: string): string  { return CONTACT_TYPE_CLASSES[type] ?? 'bg-gray-100 text-gray-500'; }
  statusLabel(s: string): string   { return STATUS_LABELS[s] ?? s; }
  statusClass(s: string): string   { return STATUS_CLASSES[s] ?? 'bg-gray-100 text-gray-500'; }

  // ── Navigation ────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/admin/contacts']);
  }

  // ── Changement de statut ──────────────────────────────────────────────────

  requestStatusChange(newStatus: string): void {
    this.pendingStatus.set(newStatus);
    this.statusError.set(null);
  }

  cancelStatusChange(): void {
    this.pendingStatus.set(null);
  }

  confirmStatusChange(): void {
    const newStatus = this.pendingStatus();
    const id = this.contact()?.id;
    if (!newStatus || !id) return;

    this.isUpdatingStatus.set(true);
    this.adminContactService.updateStatus(id, newStatus).subscribe({
      next: (updated) => {
        this.contact.set(updated);
        this.pendingStatus.set(null);
        this.isUpdatingStatus.set(false);
      },
      error: () => {
        this.statusError.set('Erreur lors de la mise à jour du statut.');
        this.isUpdatingStatus.set(false);
      },
    });
  }

  // ── Notes admin ───────────────────────────────────────────────────────────

  startEditNotes(): void {
    this.notesForm.patchValue({ adminNotes: this.contact()?.adminNotes ?? '' });
    this.isEditingNotes.set(true);
  }

  cancelEditNotes(): void {
    this.isEditingNotes.set(false);
  }

  saveNotes(): void {
    const id = this.contact()?.id;
    if (!id) return;

    this.isSavingNotes.set(true);
    const notes = this.notesForm.value.adminNotes ?? '';

    this.adminContactService.updateNotes(id, notes).subscribe({
      next: (updated) => {
        this.contact.set(updated);
        this.isEditingNotes.set(false);
        this.isSavingNotes.set(false);
      },
      error: () => this.isSavingNotes.set(false),
    });
  }
}
