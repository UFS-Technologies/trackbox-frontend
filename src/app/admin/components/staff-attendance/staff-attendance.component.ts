import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BaseApi } from '../../../shared/services/_BaseApi.Service';

@Component({
  selector: 'app-staff-attendance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './staff-attendance.component.html',
  styleUrl: './staff-attendance.component.scss'
})
export class StaffAttendanceComponent implements OnInit {
  private http = inject(BaseApi);
  private fb = inject(FormBuilder);
  
  attendanceList: any[] = [];
  filterForm!: FormGroup;
  isLoading: boolean = false;

  // Pagination
  pageSize = 25;
  currentPage = 1;
  Total_Entries = 0;
  Math = Math;

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      date: [new Date().toISOString().substring(0, 10)]
    });
    this.fetchAttendance();
  }

  async fetchAttendance() {
    this.isLoading = true;
    try {
      const date = this.filterForm.get('date')?.value;
      const response = await this.http.get(`teacher/Get_Staff_Attendance?date=${date || ''}&page=${this.currentPage}&pageSize=${this.pageSize}`) as any;
      if (response && response.success) {
         if (Array.isArray(response.rows) && response.rows.length >= 2 && Array.isArray(response.rows[0]) && Array.isArray(response.rows[1])) {
            this.Total_Entries = response.rows[0][0]?.total_count || 0;
            this.attendanceList = response.rows[1];
         } else {
            this.attendanceList = response.rows; 
            this.Total_Entries = this.attendanceList.length;
         }
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
    }
  }

  onPageChange(event: any) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.fetchAttendance();
  }

  onDateChange() {
    this.currentPage = 1;
    this.fetchAttendance();
  }
}
