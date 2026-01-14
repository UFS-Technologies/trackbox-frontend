import { Component, inject, OnInit, ViewChild, ElementRef, viewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { user_Service } from '../../services/user.Service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { course_Service } from '../../services/course.Service';
import { student_Service } from '../../services/student.Service';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
    selector: 'app-student-report',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, 
             MatAutocompleteModule, MatDatepickerModule, MatButtonModule, MatIconModule],
    providers: [provideNativeDateAdapter()],
    templateUrl: './student-report.component.html'
})
export class StudentReportComponent implements OnInit {
  readonly Course = viewChild.required<ElementRef<HTMLInputElement>>('Course');
  readonly Student = viewChild.required<ElementRef<HTMLInputElement>>('Student');
  readonly Batch = viewChild.required<ElementRef<HTMLInputElement>>('Batch');
    // Form Controls
    selectedCourse = new FormControl();
    selectedStudent = new FormControl();
    selectedBatch = new FormControl();
    // fromDate = new FormControl(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    fromDate =new FormControl(new Date());
    toDate = new FormControl(new Date());
    private user = inject(user_Service);
    private course = inject(course_Service);
    private student_Service_ = inject(student_Service);

    // Table Data
    tableData: any[] = [];
    displayedColumns = ['Student_Name', 'Batch_Name', 'Course_Name', 'Start_Time', 'End_Time', 'Duration'];
    totalDuration = '';

    // Pagination
    pageSize = 25;
    currentPage = 1;
    totalRecords = 0;
    Math = Math;

    // Filter Options
    courseDatas: any[] = [];
    studentDatas: any[] = [];
    BatchDatas: any[] = [];
    coursefilteredOptions: any[] = [];
    studentfilteredOptions: any[] = [];
    bacthfilteredOptions: any[] = [];
    IsLoaded = false;
  tempBatchData: any[];

    constructor() {}

    ngOnInit() {
        this.loadInitialData();
    }

    loadInitialData() {
        forkJoin({
            courseNames: this.course.get_course_names(),
            courseItems: this.course.Get_All_Course_Items(),
            students: this.student_Service_.Get_All_Students('')
        }).subscribe(({ courseNames, courseItems, students }) => {
            this.courseDatas = this.coursefilteredOptions = courseNames[0];
            this.studentDatas = this.studentfilteredOptions = students;
            this.BatchDatas = this.bacthfilteredOptions = courseItems[3];
            this.fetchReportData();
        });
    }

    fetchReportData() {
        this.IsLoaded = false;
        const params = {
            Student_ID: this.selectedStudent.value?.Student_ID || 0,
            Batch_ID: this.selectedBatch.value?.Batch_ID || 0,
            Course_ID: this.selectedCourse.value?.Course_ID || 0,
            fromDate: this.fromDate.value?.toLocaleDateString('en-CA') || '',
            toDate: this.toDate.value?.toLocaleDateString('en-CA') || ''
        };

        this.user.Get_Report_StudentLiveClasses_By_BatchAndStudent(
            params.Student_ID, 
            params.Batch_ID, 
            params.Course_ID,
            params.fromDate, 
            params.toDate, 
            this.currentPage, 
            this.pageSize
        ).subscribe({
            next: (res: any) => {
                const [ countResult,data] = res;
                this.tableData = data || [];
                this.totalDuration = data?.[0]?.Total_Duration || '';
                this.totalRecords = countResult?.[0]?.total_count || 0;
            },
            complete: () => this.IsLoaded = true
        });
    }
    displayFn(item: any): string {
      return item ? item.Course_Name || item.First_Name || item.Batch_Name || '' : '';
  }
  filter(type: 'course' | 'student' | 'batch'): void {
    let filterValue: string;
    let dataSource: any[];
    let filteredArray: any[];
    let propertyName: string;

    switch(type) {
      case 'course':
        this.bacthfilteredOptions=[]
        this.selectedBatch.setValue('')
        filterValue = this.Course().nativeElement.value.toLowerCase();
        dataSource = this.courseDatas;
        filteredArray = this.coursefilteredOptions;
        console.log(' this.coursefilteredOptions: ',  this.coursefilteredOptions);
        propertyName = 'Course_Name';

        // When course changes, filter the batch data based on selected course ID
        this.filterBatchData();
        break;
      case 'student':
        filterValue = this.Student().nativeElement.value.toLowerCase();
        dataSource = this.studentDatas;
        filteredArray = this.studentfilteredOptions;
        propertyName = 'First_Name';
        break;
      case 'batch':
        filterValue = this.Batch().nativeElement.value.toLowerCase();
        dataSource = this.tempBatchData; // Use temporary array
        filteredArray = this.bacthfilteredOptions;
        propertyName = 'Batch_Name';
        break;
      }
      console.log('filterValue: ', filterValue);

    filteredArray = dataSource.filter(o => 
      o[propertyName].toLowerCase().includes(filterValue)
    );

    // Update the appropriate filtered options array
    switch(type) {
      case 'course':
        this.coursefilteredOptions = filteredArray;
        break;
      case 'student':
        this.studentfilteredOptions = filteredArray;
        break;
      case 'batch':
        this.bacthfilteredOptions = filteredArray;
        break;
    }}
       filterBatchData(): void {
      console.log('his.selectedCourse: ', this.selectedCourse);
       const selectedCourseId = this.selectedCourse.value; // Adjust based on your form control value structure
  
      if (selectedCourseId) {
        this.tempBatchData = this.BatchDatas.filter(batch => batch.Course_ID == selectedCourseId['Course_ID']);
      } else {
        this.tempBatchData = [...this.BatchDatas];
      }
      console.log('Filtered batch data: ', this.tempBatchData);
    }

    clearFilters() {
        [this.selectedCourse, this.selectedStudent, this.selectedBatch].forEach(control => control.reset());
        // this.fromDate.setValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
        this.toDate.setValue(new Date());
        this.fromDate.setValue(new Date());
        this.currentPage = 1;
        this.fetchReportData();
    }

    onPageChange(event: any) {
        this.currentPage = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.fetchReportData();
    }
}
