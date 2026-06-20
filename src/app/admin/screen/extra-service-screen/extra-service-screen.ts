import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { combineLatest, map, startWith, Subject, takeUntil } from 'rxjs';
import { ExtraServiceService } from '../../../service/extra-service-service';
import { ExtraServiceSchema } from '../../../schemas/extra-service-schema';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-extra-service-screen',
  standalone: false,
  templateUrl: './extra-service-screen.html',
  styleUrls: [
    './extra-service-screen.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
    '../../../../../public/css/layout.css'
  ],
})
export class ExtraServiceScreen implements OnInit, OnDestroy {
  protected readonly Cancel01Icon = Cancel01Icon;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  form: FormGroup
  isLoading = false

  searchControl: FormControl

  selectedImageFile: File | undefined = undefined;
  editingServiceId: string | null = null

  extraServices: ExtraServiceSchema[] = []
  searchedExtraServices: ExtraServiceSchema[] = []

  private destroy$ = new Subject<void>();

  constructor(
    private extraServiceService: ExtraServiceService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.searchControl = this.formBuilder.control('')
    this.form = this.formBuilder.group({
      id: [null],
      description: ['', [Validators.minLength(2), Validators.maxLength(200)]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.loadAllExtraServices()
    this.setupSearchAndDataStream()
  }

  private setupSearchAndDataStream() {
    combineLatest([
      this.extraServiceService.extraServices$,
      this.searchControl.valueChanges.pipe(startWith(''))
    ]).pipe(
      takeUntil(this.destroy$),
      map(([extraServices, search]) => {
        this.extraServices = extraServices;
        const value = search?.toLowerCase() || '';
        return extraServices.filter(extraService =>
          extraService.name.toLowerCase().includes(value));
      })
    ).subscribe({
      next: filteredExtraServices => {
        this.searchedExtraServices = filteredExtraServices;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    })
  }

  loadAllExtraServices() {
    if (this.isLoading) return
    this.isLoading = true

    this.extraServiceService.loadAllExtraServices().subscribe({
      next: () => {
        this.isLoading = false
        this.cdr.detectChanges()
      },
      error: (err) => {
        console.log("error loading extra services:", err)
        this.isLoading = false
        this.cdr.detectChanges()
      }
    })
  }

  openCreateForm() {
    if (this.editingServiceId === "NEW") return

    this.editingServiceId = "NEW";
    this.form.reset({
      id: null,
      name: '',
      description: ''
    });
  }

  openEditForm(extraService: ExtraServiceSchema) {
    if (this.editingServiceId === extraService.id) return

    this.editingServiceId = extraService.id;

    this.form.patchValue({
      id: extraService.id,
      name: extraService.name,
      description: extraService.description ?? ''
    });

    this.cdr.detectChanges();
  }

  checkIsInvalidName() {
    return this.form.get('name')?.touched && this.form.get('name')?.invalid
  }

  checkIsInvalidDescription() {
    return this.form.get('description')?.touched && this.form.get('description')?.invalid
  }

  private resetFilePicker() {
    this.selectedImageFile = undefined;

    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onCloseForm() {
    this.editingServiceId = null
    this.resetFilePicker()
    this.form.reset()
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;
    }
  }

  onCreateExtraService() {
    if (this.isLoading) return

    if (this.form.invalid && !this.selectedImageFile) {
      this.form.markAllAsTouched()
      return
    }

    this.isLoading = true;

    const name = this.form.value.name.trim()
    const description = this.form.value.description?.trim() || undefined

    this.extraServiceService.createExtraService(name, description, this.selectedImageFile!).subscribe({
      next: () => {
        this.isLoading = false;
        this.onCloseForm()
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log("Error creating extra service", err)
        this.isLoading = false;
      }
    })
  }

  onUpdateExtraService(service: ExtraServiceSchema) {
    if (this.isLoading) return

    if (this.form.invalid && !this.selectedImageFile) {
      this.form.markAllAsTouched()
      return
    }

    const formValue = this.form.value

    const id = formValue.id
    const name = formValue.name.trim()
    const description = formValue.description?.trim() || undefined

    const serviceDescription = service.description ? service.description : ''
    if (name === service.name
      && description === serviceDescription
      && !this.selectedImageFile) {
      alert("Nessuna modifica rilevata")
      return
    }

    this.isLoading = true;

    this.extraServiceService.updateExtraService(id, name, description, this.selectedImageFile).subscribe({
      next: () => {
        this.isLoading = false;
        this.onCloseForm()
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log("Error updating extra service", err)
        this.isLoading = false;
      }
    })
  }

  onDeleteExtraService() {
    if (this.isLoading) return

    if (confirm("Sei sicuro di voler eliminare questo servizio?")) {
      this.isLoading = true
      const id = this.form.value.id

      this.extraServiceService.deleteExtraService(id).subscribe({
        next: () => {
          this.isLoading = false;
          this.editingServiceId = null;
          this.resetFilePicker()
          this.form.reset();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.log("Error updating extra service", err)
          this.isLoading = false;
        }
      })
    }
  }
}
