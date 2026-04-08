import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AppManagementService } from '../../services/app-management.service';
import { course_Service } from '../../services/course.Service';
import { environment } from '../../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { DialogBox_Component } from '../../../shared/components/DialogBox/DialogBox.component';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-app-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatSlideToggleModule, MatIconModule],
  templateUrl: './app-management.component.html',
  styleUrls: ['./app-management.component.scss']
})
export class AppManagementComponent implements OnInit {

  posterForm: FormGroup;
  posters: any[] = [];
  Entry_View = false;
  isLoading = false;
  filePath = environment.FilePath;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private appService: AppManagementService,
    private courseService: course_Service,
    private dialog: MatDialog
  ) {
    this.posterForm = this.fb.group({
      id: [0],
      title: ['', Validators.required],
      image_path: ['', Validators.required],
      link_url: [''],
      is_active: [1]
    });
  }

  ngOnInit(): void {
    this.loadPosters();
  }

  loadPosters() {
    this.isLoading = true;
    this.appService.getAppPosters().subscribe({
      next: (data: any) => {
        this.posters = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading posters', err);
        this.isLoading = false;
      }
    });
  }

  Create_New() {
    this.Entry_View = true;
    this.posterForm.reset({ id: 0, title: '', image_path: '', link_url: '', is_active: 1 });
    this.selectedFile = null;
    this.imagePreview = null;
  }

  closeClick() {
    this.Entry_View = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async savePoster() {
    if (this.posterForm.invalid && !this.selectedFile && !this.posterForm.get('image_path')?.value) {
      this.dialog.open(DialogBox_Component, { 
        panelClass: 'Dialogbox-Class', 
        data: { Message: 'Please fill all required fields and select an image.', Type: "false" } 
      });
      return;
    }

    this.isLoading = true;

    try {
      if (this.selectedFile) {
        // Upload to R2 first
        // Arguments: file, totalFilesCount, courseName
        const uploadRes = await this.courseService.upload(this.selectedFile, 1, 'Posters');
        if (uploadRes && uploadRes.key) {
          this.posterForm.patchValue({ image_path: uploadRes.key });
        }
      }

      this.appService.saveAppPoster(this.posterForm.value).subscribe({
        next: () => {
          this.dialog.open(DialogBox_Component, { 
            panelClass: 'Dialogbox-Class', 
            data: { Message: 'Poster saved successfully.', Type: "false" } 
          });
          this.Entry_View = false;
          this.loadPosters();
        },
        error: (err) => {
          console.error('Error saving poster', err);
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Upload failed', error);
      this.isLoading = false;
    }
  }

  editPoster(poster: any) {
    this.Entry_View = true;
    this.posterForm.patchValue({
      id: poster.id,
      title: poster.title,
      image_path: poster.image_path,
      link_url: poster.link_url,
      is_active: poster.is_active
    });
    this.imagePreview = this.filePath + poster.image_path;
    this.selectedFile = null;
  }

  deletePoster(id: number) {
    const dialogRef = this.dialog.open(DialogBox_Component, {
      panelClass: 'Dialogbox-Class',
      data: { Message: 'Are you sure you want to delete this poster?', Type: true, Heading: 'Confirm Delete' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.isLoading = true;
        this.appService.deleteAppPoster(id).subscribe({
          next: () => {
            this.loadPosters();
            this.dialog.open(DialogBox_Component, { 
              panelClass: 'Dialogbox-Class', 
              data: { Message: 'Poster deleted.', Type: "false" } 
            });
          },
          error: (err) => {
            console.error('Error deleting poster', err);
            this.isLoading = false;
          }
        });
      }
    });
  }

  handleImageError(event: any) {
    (event.target as HTMLImageElement).src = 'assets/images/no-image.png';
  }
}
