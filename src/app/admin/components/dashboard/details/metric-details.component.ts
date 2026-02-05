import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { user_Service } from '../../../services/user.Service';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-metric-details',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './metric-details.component.html',
  styleUrls: ['./metric-details.component.scss']
})
export class MetricDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(user_Service);

  public type: string = '';
  public title: string = '';
  public data: any[] = [];
  public loading: boolean = true;
  public headers: string[] = [];
  public columns: string[] = [];
  
  // Pagination
  public currentPage: number = 1;
  public pageSize: number = 25;
  public Math = Math;

  get paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.data.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: any): void {
    if (typeof page === 'number') {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.data.length / this.pageSize);
  }

  getMaxDisplayed(): number {
    return Math.min(this.currentPage * this.pageSize, this.data.length);
  }

  getVisiblePages(): (number | string)[] {
    const totalPages = this.getTotalPages();
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (this.currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (this.currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...', totalPages];
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.type = params['type'];
      this.setMetadata();
      this.loadData();
    });
  }

  setMetadata(): void {
    switch (this.type) {
      case 'active_students':
        this.title = 'Active Students (Last 7 Days)';
        this.headers = ['Sl No', 'Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Last Online'];
        this.columns = ['Sl_No', 'Student_ID', 'First_Name', 'Last_Name', 'Email', 'PhoneNumber', 'Last_Online'];
        break;
      case 'new_registrations':
        this.title = 'New Registrations (Last 7 Days)';
        this.headers = ['Sl No', 'Student ID', 'First Name', 'Last Name', 'Course', 'Enrollment Date'];
        this.columns = ['Sl_No', 'Student_ID', 'First_Name', 'Last_Name', 'Course_Name', 'Enrollment_Date'];
        break;
      case 'course_completion':
        this.title = 'Course Completion Rate';
        this.headers = ['Sl No', 'Student ID', 'First Name', 'Last Name', 'Course', 'Completion %'];
        this.columns = ['Sl_No', 'Student_ID', 'First_Name', 'Last_Name', 'Course_Name', 'Completion_Percentage'];
        break;
      case 'batch_attendance':
        this.title = 'Batch Attendance Rate (Today)';
        this.headers = ['Sl No', 'Batch Name', 'Total Students', 'Present Students', 'Attendance Rate %'];
        this.columns = ['Sl_No', 'Batch_Name', 'Total_Students', 'Present_Students', 'Attendance_Rate'];
        break;
    }
  }

  loadData(): void {
    this.loading = true;
    this.userService.Get_Dashboard_Metric_Details(this.type).subscribe(
      (res: any) => {
        this.data = res;
        this.currentPage = 1; // Reset to first page on data load
        this.loading = false;
      },
      (err) => {
        console.error('Error loading metric details:', err);
        this.loading = false;
      }
    );
  }

  goBack(): void {
    this.router.navigate(['/admin/dash']);
  }
}
