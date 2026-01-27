
import { Component, Input, OnInit, inject, signal, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { course_Service } from '../../../services/course.Service';
import { SharedModule } from '../../../../shared/shared.module';
import { DialogBox_Component } from '../../../../shared/components/DialogBox/DialogBox.component';


import * as XLSX from 'xlsx';

@Component({
  selector: 'app-admin-exam',
  standalone: true,
  imports: [SharedModule, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-exam.component.html',
  styleUrl: './admin-exam.component.scss'
})
export class AdminExamComponent implements OnInit {
  private fb = inject(FormBuilder);
  private course_Service_ = inject(course_Service);
  private dialogBox = inject(MatDialog);

  @Input() Course_ID: number = 0;
  @Input() Course_Name: string = '';
  @Input() days: any[] = [];
  readonly closeClicked = output<void>();

  view: 'exam_list' | 'exam_data' | 'course_exam_form' | 'questions' | 'available_questions' = 'exam_list';
  isLoading = false;

  examDataList: any[] = [];
  courseExams: any[] = [];
  questions: any[] = [];
  coursesList: any[] = []; // List of all courses for dropdown

  examDataForm: FormGroup;
  courseExamForm: FormGroup;
  questionForm: FormGroup;

  selectedCourseExam: any = null;
  selectedExamData: any = null;
  
  // Excel Upload State
  excelData: any[] = [];
  targetCourseId: number | null = null;
  targetExamId: number | null = null;
  selectedFileName: string = '';

  constructor() {
    this.examDataForm = this.fb.group({
      exam_data_id: [0],
      exam_name: ['', Validators.required]
    });

    this.courseExamForm = this.fb.group({
      course_exam_id: [0],
      exam_data_id: [0], 
      Course_ID: [0],
      duration: [0, [Validators.required, Validators.min(1)]],
      questions: [0, [Validators.required, Validators.min(1)]],
      passcount: [0, [Validators.required, Validators.min(1)]],
      Day: [1, [Validators.required, Validators.min(0)]]
    });

    this.questionForm = this.fb.group({
      question_id: [0],
      exam_data_id: [0],
      course_exam_id: [0],
      question_name: ['', Validators.required],
      option1: ['', Validators.required],
      option2: ['', Validators.required],
      option3: ['', Validators.required],
      option4: ['', Validators.required],
      correct_answer: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading = true;
    this.loadExamData();
    this.loadCourseExams();
    this.loadAllCourses();
  }
  
  loadAllCourses() {
      this.course_Service_.get_course_names().subscribe((res: any) => {
          console.log('get_course_names API response:', res);
          // Handle nested array response
          if (Array.isArray(res) && res.length > 0 && Array.isArray(res[0])) {
              this.coursesList = res[0];
          } else if (Array.isArray(res)) {
              this.coursesList = res;
          } else {
              this.coursesList = [];
          }
          console.log('Courses loaded:', this.coursesList);
      });
  }

  loadExamData() {
    // We use SELECT action on Manage_ExamData
    this.course_Service_.Manage_ExamData({ action: 'SELECT' }).subscribe((res: any) => {
        // Log the response to debug
        console.log('Manage_ExamData SELECT response:', res);
        
        if (Array.isArray(res) && Array.isArray(res[0])) {
             this.examDataList = res[0];
        } else {
             this.examDataList = res;
        }
        
      this.isLoading = false;
    });
  }

  loadCourseExams() {
    if (!this.Course_ID) return;
    this.course_Service_.Student_GetExams(this.Course_ID).subscribe((res: any) => {
      console.log('Student_GetExams API response:', res);
      // Handle nested array response
      if (Array.isArray(res) && res.length > 0 && Array.isArray(res[0])) {
          this.courseExams = res[0];
      } else if (Array.isArray(res)) {
          this.courseExams = res;
      } else {
          this.courseExams = [];
      }
      console.log('Course Exams loaded:', this.courseExams);
    });
  }

  setView(newView: any) {
    this.view = newView;
  }

  // Exam Data CRUD
  onAddExamData() {
    this.examDataForm.reset({ exam_data_id: 0, exam_name: '' });
    this.setView('exam_data');
  }

  onEditExamData(data: any) {
    this.examDataForm.patchValue(data);
    this.setView('exam_data');
  }

  saveExamData() {
    if (this.examDataForm.invalid) return;
    this.isLoading = true;
    const action = this.examDataForm.value.exam_data_id ? 'UPDATE' : 'INSERT';
    this.course_Service_.Manage_ExamData({ ...this.examDataForm.value, action }).subscribe({
      next: () => {
        this.dialogBox.open(DialogBox_Component, { data: { Message: 'Saved Successfully', Type: 'false' } });
        this.loadExamData();
        this.setView('exam_list');
      },
      error: () => this.isLoading = false
    });
  }

  deleteExamData(id: number) {
    const dialogRef = this.dialogBox.open(DialogBox_Component, { data: { Message: 'Delete this exam type?', Type: true } });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.course_Service_.Manage_ExamData({ action: 'DELETE', exam_data_id: id }).subscribe(() => {
          this.loadExamData();
        });
      }
    });
  }

  // Course Exam CRUD
  onAddCourseExam() {
    this.courseExamForm.reset({
      course_exam_id: 0,
      exam_data_id: 0,
      Course_ID: this.Course_ID,
      duration: 60,
      questions: 10,
      passcount: 5,
      Day: 1
    });
    this.setView('course_exam_form');
  }

  onEditCourseExam(exam: any) {
    this.courseExamForm.patchValue(exam);
    this.setView('course_exam_form');
  }

  saveCourseExam() {
    if (this.courseExamForm.invalid) return;
    this.isLoading = true;
    const action = this.courseExamForm.value.course_exam_id ? 'UPDATE' : 'INSERT';
    this.course_Service_.Manage_CourseExam({ ...this.courseExamForm.value, action, Course_ID: this.Course_ID }).subscribe({
      next: () => {
        this.dialogBox.open(DialogBox_Component, { data: { Message: 'Linked Successfully', Type: 'false' } });
        this.loadCourseExams();
        this.setView('exam_list');
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  deleteCourseExam(id: number) {
    const dialogRef = this.dialogBox.open(DialogBox_Component, { data: { Message: 'Remove this exam from course?', Type: true } });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.course_Service_.Manage_CourseExam({ action: 'DELETE', course_exam_id: id }).subscribe(() => {
          this.loadCourseExams();
        });
      }
    });
  }

  // Questions CRUD - MODIFIED TO BE EXCEL UPLOAD
  manageQuestions(courseExam: any) {
    this.selectedCourseExam = courseExam;
    this.targetExamId = courseExam.course_exam_id;
    this.targetCourseId = this.Course_ID; // Default to current course
    
    // Ensure courseExams is loaded for current course
    if (!this.courseExams || this.courseExams.length === 0) {
      this.loadCourseExams();
    }
    
    console.log('Navigate to Questions view:', {
      targetCourseId: this.targetCourseId,
      targetExamId: this.targetExamId,
      coursesList: this.coursesList,
      coursesListLength: this.coursesList?.length,
      courseExams: this.courseExams,
      courseExamsLength: this.courseExams?.length
    });
    
    this.setView('questions');
  }

  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) {
      alert('Please select only one file');
      return;
    }
    
    const file = target.files[0];
    this.selectedFileName = file.name;
    console.log('File selected:', this.selectedFileName);
    
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      this.excelData = XLSX.utils.sheet_to_json(ws);
      
      // Validation: Check headers
      if (this.excelData.length > 0) {
          const firstRow = this.excelData[0];
          const requiredKeys = ['question_name', 'option1', 'option2', 'option3', 'option4', 'correct_answer'];
          const fileKeys = Object.keys(firstRow);
          const missing = requiredKeys.filter(k => !fileKeys.includes(k));
          
          if (missing.length > 0) {
              alert(`Invalid Excel Format. Missing columns: ${missing.join(', ')}`);
              this.excelData = []; // Clear invalid data
              this.selectedFileName = '';
              // clear file input value if possible, or just ignore
              if (evt.target) evt.target.value = '';
          }
      }
      
      console.log('Parsed Excel Data:', this.excelData);
    };
    reader.readAsBinaryString(target.files[0]);
  }

  uploadQuestions() {
      if (!this.targetCourseId || !this.targetExamId || this.excelData.length === 0) {
          alert('Please select Course, Exam and Upload a File first (ensure file has data).');
          return;
      }
      
      this.isLoading = true;
      
      // Resolve IDs
      const selectedExam = this.courseExams.find(e => e.course_exam_id === this.targetExamId);
      const examDataId = selectedExam ? selectedExam.exam_data_id : this.selectedCourseExam?.exam_data_id;

      const payload = {
          exam_data_id: examDataId,
          course_exam_id: this.targetExamId,
          data: this.excelData
      };
      
      console.log('Uploading payload:', payload);

      this.course_Service_.Upload_Questions_Excel(payload).subscribe({
          next: (res: any) => {
              this.dialogBox.open(DialogBox_Component, { data: { Message: 'Questions Uploaded Successfully', Type: 'false' } });
              this.isLoading = false;
              this.setView('exam_list');
              this.excelData = []; // Clear data
          },
          error: (err) => {
              console.error(err);
              this.dialogBox.open(DialogBox_Component, { data: { Message: 'Upload Failed', Type: 'true' } });
              this.isLoading = false;
          }
      })
  }

  // Existing methods kept for safety but unused in new UI
  loadQuestions(courseExamId: number) {
    this.isLoading = true;
    this.course_Service_.Student_GetQuestions(courseExamId).subscribe((res: any) => {
      // Log for debugging
      console.log('Student_GetQuestions response:', res);
      
      this.questions = [];
      if (res) {
        if (Array.isArray(res) && Array.isArray(res[0])) {
          this.questions = res[0];
        } else if (Array.isArray(res)) {
          this.questions = res;
        }
      }
      this.isLoading = false;
    });
  }

  showAvailableQuestions(courseExam: any) {
    this.selectedCourseExam = courseExam;
    this.loadQuestions(courseExam.course_exam_id);
    this.setView('available_questions');
  }

  onAddQuestion() {
    // Unused
  }

  saveQuestion() {
    // Unused
  }

  editQuestion(q: any) {
   // Unused
  }

  deleteQuestion(id: number) {
    const dialogRef = this.dialogBox.open(DialogBox_Component, { data: { Message: 'Delete this question?', Type: true } });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.isLoading = true;
        this.course_Service_.Manage_Questions({ action: 'DELETE', question_id: id }).subscribe({
          next: () => {
            this.loadQuestions(this.selectedCourseExam.course_exam_id);
            this.dialogBox.open(DialogBox_Component, { data: { Message: 'Deleted Successfully', Type: 'false' } });
          },
          error: () => this.isLoading = false
        });
      }
    });
  }

  getExamName(examDataId: number) {
    const data = this.examDataList.find(d => d.exam_data_id === examDataId);
    return data ? data.exam_name : 'Unknown Exam';
  }

  onCourseChange() {
      console.log('Course changed to:', this.targetCourseId);
      // When course changes, reload exams for that course
      if (this.targetCourseId) {
           this.course_Service_.Student_GetExams(this.targetCourseId).subscribe((res: any) => {
                console.log('Exams for course', this.targetCourseId, ':', res);
                // Handle nested array response
                if (Array.isArray(res) && res.length > 0 && Array.isArray(res[0])) {
                    this.courseExams = res[0];
                } else if (Array.isArray(res)) {
                    this.courseExams = res;
                } else {
                    this.courseExams = [];
                }
                // Reset exam selection if not in list
                if (!this.courseExams.find(e => e.course_exam_id === this.targetExamId)) {
                    this.targetExamId = null;
                }
                console.log('Updated courseExams:', this.courseExams);
            });
      }
  }

  onClose() {
    this.closeClicked.emit();
  }
}
