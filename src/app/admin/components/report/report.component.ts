
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
import { course_Service } from '../../services/course.Service';
import { student_Service } from '../../services/student.Service';

@Component({
    selector: 'app-report',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, 
             MatAutocompleteModule, MatButtonModule, MatIconModule],
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
    readonly Course = viewChild.required<ElementRef<HTMLInputElement>>('Course');
    readonly Student = viewChild.required<ElementRef<HTMLInputElement>>('Student');
    
    // Form Controls
    selectedCourse = new FormControl();
    selectedStudent = new FormControl();

    private course = inject(course_Service);
    private student_Service_ = inject(student_Service);

    // Table Data
    tableData: any[] = [];
    displayedColumns = ['Student_Name', 'Course_Name', 'Exam_Name', 'Score', 'Percentage', 'Result', 'Date'];

    // Pagination
    pageSize = 25;
    currentPage = 1;

    // Filter Options
    courseDatas: any[] = [];
    studentDatas: any[] = [];
    coursefilteredOptions: any[] = [];
    studentfilteredOptions: any[] = [];
    IsLoaded = false;

    constructor() {}

    ngOnInit() {
        this.loadInitialData();
    }

    loadInitialData() {
        forkJoin({
            courseNames: this.course.get_course_names(),
            students: this.student_Service_.Get_All_Students('')
        }).subscribe(({ courseNames, students }) => {
            this.courseDatas = this.coursefilteredOptions = courseNames[0];
            this.studentDatas = this.studentfilteredOptions = students;
            this.fetchReportData();
        });
    }

    fetchReportData() {
        this.IsLoaded = false;
        const studentId = this.selectedStudent.value?.Student_ID || 0;
        const courseId = this.selectedCourse.value?.Course_ID || 0;

        if (!studentId && !courseId) {
             // Optionally handle case where no filter is selected if needed, 
             // but the API seems to require studentId at least in the route params?
             // The route is /Get_Exam_Results/:student_id. 
             // If studentId is 0 (not selected), we might need to handle it.
             // However, let's try to pass 0 if that's how the backend handles "all" or checks.
             // Or maybe we should only call if studentId is present?
             // Let's assume we need a student selected or pass 0.
        }

        this.student_Service_.Get_Exam_Results_By_Student_ID(studentId, courseId).subscribe({
            next: (res: any) => {
                // Handle SP response format [rows, returnStatus]
                console.log('API Response:', res);
                if (Array.isArray(res) && res.length > 0 && Array.isArray(res[0])) {
                    this.tableData = res[0];
                    console.log('Table Data (SP format):', this.tableData);
                } else if (Array.isArray(res)) {
                    // Fallback if it returns just rows
                    this.tableData = res;
                    console.log('Table Data (Direct array):', this.tableData);
                } else {
                    this.tableData = [];
                }
            },
            complete: () => this.IsLoaded = true,
            error: (err) => {
                console.error("Error fetching report data", err);
                this.IsLoaded = true;
            }
        });
    }

    displayFn(item: any): string {
      return item ? item.Course_Name || item.First_Name || '' : '';
    }

    filter(type: 'course' | 'student'): void {
        let filterValue: string;
        let dataSource: any[];
        let filteredArray: any[];
        let propertyName: string;

        switch(type) {
          case 'course':
            filterValue = this.Course().nativeElement.value.toLowerCase();
            dataSource = this.courseDatas;
            propertyName = 'Course_Name';
            break;
          case 'student':
            filterValue = this.Student().nativeElement.value.toLowerCase();
            dataSource = this.studentDatas;
            propertyName = 'First_Name';
            break;
        }

        filteredArray = dataSource.filter(o => 
          o[propertyName].toLowerCase().includes(filterValue)
        );

        switch(type) {
          case 'course':
            this.coursefilteredOptions = filteredArray;
            break;
          case 'student':
            this.studentfilteredOptions = filteredArray;
            break;
        }
    }

    clearFilters() {
        [this.selectedCourse, this.selectedStudent].forEach(control => control.reset());
        this.fetchReportData();
    }
}
