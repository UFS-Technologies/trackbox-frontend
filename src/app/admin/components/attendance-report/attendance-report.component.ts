
import { Component, inject, OnInit, ViewChild, ElementRef, viewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { course_Service } from '../../services/course.Service';
import { student_Service } from '../../services/student.Service';

@Component({
    selector: 'app-attendance-report',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, 
             MatAutocompleteModule, MatButtonModule, MatIconModule, MatDatepickerModule],
    providers: [provideNativeDateAdapter()],
    templateUrl: './attendance-report.component.html',
    styleUrls: ['./attendance-report.component.scss']
})
export class AttendanceReportComponent implements OnInit {
    readonly Course = viewChild.required<ElementRef<HTMLInputElement>>('Course');
    readonly Student = viewChild.required<ElementRef<HTMLInputElement>>('Student');
    readonly Batch = viewChild.required<ElementRef<HTMLInputElement>>('Batch');
    
    // Form Controls
    selectedCourse = new FormControl();
    selectedStudent = new FormControl();
    selectedBatch = new FormControl();
    selectedDate = new FormControl('');

    private course = inject(course_Service);
    private student_Service_ = inject(student_Service);

    // Table Data
    tableData: any[] = [];
    displayedColumns = ['Student_Name', 'Course_Name', 'Teacher_Name', 'Batch_Name', 'Content_Name', 'Watched_Date', 'Update_Time'];

    // Pagination
    pageSize = 25;
    currentPage = 1;
    Total_Entries = 0;
    Math = Math;

    // Filter Options
    courseDatas: any[] = [];
    studentDatas: any[] = [];
    BatchDatas: any[] = [];
    coursefilteredOptions: any[] = [];
    studentfilteredOptions: any[] = [];
    bacthfilteredOptions: any[] = [];
    tempBatchData: any[] = [];
    IsLoaded = false;

    constructor() {}

    ngOnInit() {
        this.loadInitialData();
    }

    loadInitialData() {
        forkJoin({
            courseNames: this.course.get_course_names(),
            students: this.student_Service_.Get_All_Students(''),
            courseItems: this.course.Get_All_Course_Items()
        }).subscribe(({ courseNames, students, courseItems }) => {
            this.courseDatas = this.coursefilteredOptions = courseNames[0];
            this.studentDatas = this.studentfilteredOptions = students;
            this.BatchDatas = this.bacthfilteredOptions = this.tempBatchData = courseItems[3];
            this.fetchReportData();
        });
    }

    fetchReportData() {
        this.IsLoaded = false;
        const studentId = this.selectedStudent.value?.Student_ID || 0;
        const courseId = this.selectedCourse.value?.Course_ID || 0;
        const batchId = this.selectedBatch.value?.Batch_ID || 0;
        const dateValue: any = this.selectedDate.value;
        const date = dateValue instanceof Date ? dateValue.toLocaleDateString('en-CA') : (dateValue || '');

        this.course.Get_VideoAttendance(studentId, courseId, 0, date, batchId, this.currentPage, this.pageSize).subscribe({
            next: (res: any) => {
                if (res && res.success && Array.isArray(res.rows)) {
                    // SP returns [countResult, dataRows]
                    if (res.rows.length >= 2 && Array.isArray(res.rows[0]) && Array.isArray(res.rows[1])) {
                        this.Total_Entries = res.rows[0][0]?.total_count || 0;
                        this.tableData = res.rows[1];
                    } else {
                        // Fallback for old API
                        this.tableData = res.rows;
                        this.Total_Entries = this.tableData.length;
                    }
                } else {
                    this.tableData = [];
                    this.Total_Entries = 0;
                }
            },
            complete: () => this.IsLoaded = true,
            error: (err) => {
                console.error("Error fetching attendance data", err);
                this.IsLoaded = true;
            }
        });
    }

    onPageChange(event: any) {
        this.currentPage = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.fetchReportData();
    }

    displayFn(item: any): string {
      if (!item) return '';
      if (item.Course_Name) return item.Course_Name;
      if (item.Batch_Name) return item.Batch_Name;
      return `${item.First_Name} ${item.Last_Name || ''}`.trim();
    }

    filter(type: 'course' | 'student' | 'batch'): void {
        let filterValue: string;

        if (type === 'course') {
            filterValue = this.Course().nativeElement.value.toLowerCase();
            this.coursefilteredOptions = this.courseDatas.filter(o => o.Course_Name.toLowerCase().includes(filterValue));
            this.filterBatchData();
        } else if (type === 'student') {
            filterValue = this.Student().nativeElement.value.toLowerCase();
            this.studentfilteredOptions = this.studentDatas.filter(o => {
                const fullName = `${o.First_Name} ${o.Last_Name || ''}`.toLowerCase();
                return fullName.includes(filterValue);
            });
        } else {
            filterValue = this.Batch().nativeElement.value.toLowerCase();
            this.bacthfilteredOptions = this.tempBatchData.filter(o => o.Batch_Name.toLowerCase().includes(filterValue));
        }
    }

    filterBatchData(): void {
        const selectedCourse = this.selectedCourse.value;
        if (selectedCourse && selectedCourse.Course_ID) {
            this.tempBatchData = this.BatchDatas.filter(batch => batch.Course_ID == selectedCourse.Course_ID);
        } else {
            this.tempBatchData = [...this.BatchDatas];
        }
        this.bacthfilteredOptions = [...this.tempBatchData];
        this.selectedBatch.setValue('');
        this.currentPage = 1;
    }

    clearFilters() {
        this.selectedCourse.reset();
        this.selectedStudent.reset();
        this.selectedBatch.reset();
        this.selectedDate.setValue('');
        this.currentPage = 1;
        this.tempBatchData = [...this.BatchDatas];
        this.bacthfilteredOptions = [...this.BatchDatas];
        this.fetchReportData();
    }
}
