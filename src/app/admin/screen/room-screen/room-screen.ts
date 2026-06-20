import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { combineLatest, map, startWith, Subject, takeUntil } from 'rxjs';
import { RoomService } from '../../../service/room-service';
import { RoomServiceSchema } from '../../../schemas/room-service-schema';
import { RoomSchema } from '../../../schemas/room-schema';
import { RoomServiceService } from '../../../service/room-service-service';

@Component({
  selector: 'app-room-screen',
  standalone: false,
  templateUrl: './room-screen.html',
  styleUrls: [
    './room-screen.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
    '../../../../../public/css/layout.css'
  ]
})
export class RoomScreen implements OnDestroy, OnInit {
  protected readonly Cancel01Icon = Cancel01Icon;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  form: FormGroup

  isLoading = false
  isLoadingServices = false

  searchControl: FormControl

  selectedImageFile: File | undefined = undefined;
  editingRoomId: string | null = null

  rooms: RoomSchema[] = []
  searchedRooms: RoomSchema[] = []

  roomServices: RoomServiceSchema[] = []

  private destroy$ = new Subject<void>();

  constructor(
    private roomService: RoomService,
    private roomServiceService: RoomServiceService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.searchControl = this.formBuilder.control('')
    this.form = this.formBuilder.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      capacity: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      number: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
      price: [0.01, [Validators.required, Validators.min(0.01)]],
      room_services_ids: [[], [Validators.maxLength(50)]],
      enabled: [true]
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.loadAllRooms();
    this.loadAvailableServices();
    this.setupSearchAndDataStream();
  }


  private setupSearchAndDataStream() {
    combineLatest([
      this.roomService.rooms$,
      this.searchControl.valueChanges.pipe(startWith(''))
    ]).pipe(
      takeUntil(this.destroy$),
      map(([rooms, search]) => {
        this.rooms = rooms;
        const value = search?.toLowerCase() || '';
        return rooms.filter(room =>
          room.name.toLowerCase().includes(value) || room.number.toString().includes(value)
        );
      })
    ).subscribe({
      next: filteredRooms => {
        this.searchedRooms = filteredRooms;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAllRooms() {
    if (this.isLoading) return;
    this.isLoading = true;

    this.roomService.loadAllRooms().subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Errore nel caricamento delle camere:", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadAvailableServices(): void {
    if (this.isLoadingServices) return

    this.isLoadingServices = true;

    this.roomServiceService.loadAllRoomServices().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.roomServiceService.roomsServices$.pipe(
          takeUntil(this.destroy$)
        ).subscribe(services => {
          this.roomServices = services;
          this.cdr.detectChanges();
        });
        this.isLoadingServices = false;
      },
      error: (err) => {
        this.isLoadingServices = false
        console.error('Errore caricamento servizi opzionali:', err)
      }
    });
  }


  openCreateForm() {
    if (this.editingRoomId === "NEW") return;

    this.editingRoomId = "NEW";
    this.form.reset({
      id: null,
      name: '',
      capacity: 1,
      number: 1,
      price: 0.01,
      room_services_ids: [],
      enabled: true
    });
  }

  openEditForm(room: RoomSchema) {
    console.log("Aprendo form di modifica per la stanza:", room);
    if (this.editingRoomId === room.id) return;

    this.editingRoomId = room.id;

    const currentServiceIds = room.services?.map(s => s.id) || [];
    console.log("Servizi attuali della stanza:", currentServiceIds);

    this.form.patchValue({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      number: room.number,
      price: room.price,
      room_services_ids: currentServiceIds,
      enabled: room.enabled
    });

    this.cdr.detectChanges();
  }

  onCloseForm() {
    this.editingRoomId = null;
    this.resetFilePicker();
    this.form.reset();
  }

  private resetFilePicker() {
    this.selectedImageFile = undefined;
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onCreateRoom() {
    if (this.isLoading) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const payload = {
      name: this.form.value.name.trim(),
      capacity: this.form.value.capacity,
      number: this.form.value.number,
      price: this.form.value.price,
      room_services_ids: this.form.value.room_services_ids,
      enabled: this.form.value.enabled
    };

    this.roomService.createRoom(payload, this.selectedImageFile!).subscribe({
      next: () => {
        this.isLoading = false;
        this.onCloseForm();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Errore durante la creazione della stanza:", err);
        this.isLoading = false;
      }
    });
  }

  onUpdateRoom(room: RoomSchema) {
    if (this.isLoading) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    const currentServices = room.services || [];
    const currentServiceIds = currentServices.map(s => s.id) || [];
    const newServiceIds = formValue.room_services_ids || [];

    const isServicesEqual = currentServiceIds.length === newServiceIds.length &&
      currentServiceIds.every(id => newServiceIds.includes(id));

    if (
      formValue.name.trim() === room.name &&
      formValue.capacity === room.capacity &&
      formValue.number === room.number &&
      Number(formValue.price) === Number(room.price) &&
      formValue.enabled === room.enabled &&
      isServicesEqual &&
      !this.selectedImageFile
    ) {
      alert("Non sono state apportate modifiche alla stanza.");
      return;
    }

    this.isLoading = true;

    const payload = {
      id: room.id,
      name: formValue.name.trim(),
      capacity: formValue.capacity,
      number: formValue.number,
      price: formValue.price,
      room_services_ids: newServiceIds,
      enabled: formValue.enabled
    };

    this.roomService.updateRoom(payload, this.selectedImageFile).subscribe({
      next: () => {
        this.isLoading = false;
        this.onCloseForm();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Errore durante la modifica della stanza:", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDeleteRoom() {
    if (this.isLoading) return;

    if (confirm("Sei sicuro di voler eliminare questa stanza?")) {
      this.isLoading = true;
      const id = this.form.value.id;

      this.roomService.deleteRoom(id).subscribe({
        next: () => {
          this.isLoading = false;
          this.editingRoomId = null;
          this.resetFilePicker();
          this.form.reset();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Errore durante l'eliminazione della stanza:", err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }


  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;
    }
  }


  checkIsInvalidName() {
    return this.form.get('name')?.touched && this.form.get('name')?.invalid
  }

  checkIsInvalidCapacity() {
    return this.form.get('capacity')?.touched && this.form.get('capacity')?.invalid
  }

  checkIsInvalidNumber() {
    return this.form.get('number')?.touched && this.form.get('number')?.invalid
  }

  checkIsInvalidPrice() {
    return this.form.get('price')?.touched && this.form.get('price')?.invalid
  }

  isServiceSelected(serviceId: string): boolean {
    const selected: any[] = this.form.value.room_services_ids || [];
    return selected.some(s => s === serviceId);
  }

  onServiceToggle(serviceId: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentServices: any[] = this.form.value.room_services_ids || [];

    let newServices;
    if (isChecked) {
      newServices = [...currentServices, serviceId];
    } else {
      newServices = currentServices.filter(s => s !== serviceId);
    }

    this.form.patchValue({ room_services_ids: newServices });
  }
}
