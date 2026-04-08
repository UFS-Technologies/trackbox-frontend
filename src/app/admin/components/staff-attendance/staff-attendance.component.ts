import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BaseApi } from '../../../shared/services/_BaseApi.Service';

@Component({
  selector: 'app-staff-attendance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './staff-attendance.component.html',
  styleUrl: './staff-attendance.component.scss'
})
export class StaffAttendanceComponent implements OnInit {
  private http = inject(BaseApi);
  private fb = inject(FormBuilder);
  
  attendanceList: any[] = [];
  filterForm!: FormGroup;
  isLoading: boolean = false;

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
      const response = await this.http.get(`teacher/Get_Staff_Attendance?date=${date || ''}`) as any;
      if (response && response.success) {
         this.attendanceList = response.rows; 
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
    }
  }

  onDateChange() {
    this.fetchAttendance();
  }
}
