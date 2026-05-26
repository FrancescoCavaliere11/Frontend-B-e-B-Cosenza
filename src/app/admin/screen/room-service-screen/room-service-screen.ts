import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UserIcon} from '@hugeicons/core-free-icons';
import {RoomServiceSchema} from '../../../schemas/room-service-schema';
import {RoomServiceService} from '../../../service/room-service-service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {combineLatest, map, startWith, Subject, takeUntil} from 'rxjs';

@Component({
  selector: 'app-room-service-screen',
  standalone: false,
  templateUrl: './room-service-screen.html',
  styleUrls: [
    './room-service-screen.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
    '../../../../../public/css/layout.css'
  ],
})
export class RoomServiceScreen implements OnInit{
  protected readonly UserIcon = UserIcon;

  form: FormGroup
  isLoading = false

  roomServices: RoomServiceSchema[] = []
  searchedRoomServices: RoomServiceSchema[] = []

  editingServiceId: string | null = null

  searchControl: FormControl

  private destroy$ = new Subject<void>();

  constructor(
    private roomServiceService: RoomServiceService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.searchControl = this.formBuilder.control('')
    this.form = this.formBuilder.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    })
  }

  ngOnInit(): void {
    this.loadAllRoomServices()
    this.setupSearchAndDataStream()
  }

  private setupSearchAndDataStream() {
    combineLatest([
      this.roomServiceService.roomsServices$,
      this.searchControl.valueChanges.pipe(startWith(''))
    ]).pipe(
      takeUntil(this.destroy$),
      map(([roomServices, search]) => {
        this.roomServices = roomServices;
        const value = search?.toLowerCase() || '';
        return roomServices.filter(roomService =>
          roomService.name.toLowerCase().includes(value));
      })
    ).subscribe({
      next: filteredRoomServices =>  {
        this.searchedRoomServices = filteredRoomServices;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    })
  }

  loadAllRoomServices() {
    if(this.isLoading) return
    this.isLoading = true

    this.roomServiceService.loadAllRoomServices().subscribe({
      next: () => {
        this.isLoading = false
        this.cdr.detectChanges()
      },
      error: (err) => {
        console.log("error loading room services:", err)
        this.isLoading = false
        this.cdr.detectChanges()
      }
    })
  }

  openEditForm(roomService: RoomServiceSchema) {
    if(this.editingServiceId === roomService.id) return

    this.editingServiceId = roomService.id;

    this.form.patchValue({
      id: roomService.id,
      name: roomService.name
    });

    this.cdr.detectChanges();
  }

  openCreateForm() {
    if(this.editingServiceId !== "NEW"){
      console.log("Opening create form")
      this.editingServiceId = "NEW";
      this.form.reset({
        id: null,
        name: ''
      });
    }
  }

  checkIsInvalidName() {
    return this.form.get('name')?.touched && this.form.get('name')?.invalid
  }

  onCreateRoomService() {
    if(this.isLoading) return

    if(this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.isLoading = true;
    const payload = {
      name: this.form.value.name.trim()
    }

    this.roomServiceService.createRoomService(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.editingServiceId = null;
        this.form.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log("Error creating room service", err)
        this.isLoading = false;
      }
    })
  }

  onUpdateRoomService() {
    if(this.isLoading) return

    if(this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.isLoading = true;
    const payload = {
      id: this.form.value.id,
      name: this.form.value.name.trim()
    }

    this.roomServiceService.updateRoomService(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.editingServiceId = null;
        this.form.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log("Error updating room service", err)
        this.isLoading = false;
      }
    })
  }

  onDeleteRoomService() {
    if(this.isLoading) return

    if(this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    if(confirm("Sei sicuro di voler eliminare questo servizio?")) {
      this.isLoading = true
      const id = this.form.value.id

      this.roomServiceService.deleteRoomService(id).subscribe({
        next: () => {
          this.isLoading = false;
          this.editingServiceId = null;
          this.form.reset();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.log("Error updating room service", err)
          this.isLoading = false;
        }
      })
    }
  }
}
