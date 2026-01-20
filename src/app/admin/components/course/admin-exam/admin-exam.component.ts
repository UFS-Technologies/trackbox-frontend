
import { Component, Input, OnInit, inject, signal, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { course_Service } from '../../../services/course.Service';
import { SharedModule } from '../../../../shared/shared.module';
import { DialogBox_Component } from '../../../../shared/components/DialogBox/DialogBox.component';

@Component({
  selector: 'app-admin-exam',
  standalone: true,
  imports: [SharedModule, CommonModule, ReactiveFormsModule],
  templateUrl: './admin-exam.component.html',
  styleUrl: './admin-exam.component.scss'
})
export class AdminExamComponent implements OnInit {
  private fb = inject(FormBuilder);
  private course_Service_ = inject(course_Service);
  private dialogBox = inject(MatDialog);

  @Input() Course_ID: number = 0;
  readonly closeClicked = output<void>();

  view: 'exam_list' | 'exam_data' | 'course_exam_form' | 'questions' = 'exam_list';
  isLoading = false;

  examDataList: any[] = [];
  courseExams: any[] = [];
  questions: any[] = [];

  examDataForm: FormGroup;
  courseExamForm: FormGroup;
  questionForm: FormGroup;

  selectedCourseExam: any = null;
  selectedExamData: any = null;

  constructor() {
    this.examDataForm = this.fb.group({
      exam_data_id: [0],
      exam_name: ['', Validators.required]
    });

    this.courseExamForm = this.fb.group({
      course_exam_id: [0],
      exam_data_id: [0, Validators.required],
      Course_ID: [0],
      duration: [0, [Validators.required, Validators.min(1)]],
      questions: [0, [Validators.required, Validators.min(1)]],
      passcount: [0, [Validators.required, Validators.min(1)]]
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
  }

  loadExamData() {
    // We use SELECT action on Manage_ExamData
    this.course_Service_.Manage_ExamData({ action: 'SELECT' }).subscribe((res: any) => {
      this.examDataList = res[0];
      this.isLoading = false;
    });
  }

  loadCourseExams() {
    if (!this.Course_ID) return;
    this.course_Service_.Student_GetExams(this.Course_ID).subscribe((res: any) => {
      this.courseExams = res;
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
      passcount: 5
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

  // Questions CRUD
  manageQuestions(courseExam: any) {
    this.selectedCourseExam = courseExam;
    this.loadQuestions(courseExam.course_exam_id);
    this.setView('questions');
  }

  loadQuestions(courseExamId: number) {
    this.isLoading = true;
    this.course_Service_.Student_GetQuestions(courseExamId).subscribe((res: any) => {
      this.questions = res;
      this.isLoading = false;
    });
  }

  onAddQuestion() {
    this.questionForm.reset({
      question_id: 0,
      exam_data_id: this.selectedCourseExam.exam_data_id,
      course_exam_id: this.selectedCourseExam.course_exam_id,
      question_name: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct_answer: ''
    });
    // We stay in the same view but show/hide the form or use a dialog
    // For now, let's just toggle a boolean or use a simpler approach
  }

  saveQuestion() {
    if (this.questionForm.invalid) return;
    this.isLoading = true;
    const action = this.questionForm.value.question_id ? 'UPDATE' : 'INSERT';
    const payload = { 
      ...this.questionForm.value, 
      action,
      exam_data_id: this.selectedCourseExam.exam_data_id,
      course_exam_id: this.selectedCourseExam.course_exam_id
    };
    this.course_Service_.Manage_Questions(payload).subscribe({
      next: () => {
        this.dialogBox.open(DialogBox_Component, { data: { Message: 'Question Saved', Type: 'false' } });
        this.loadQuestions(this.selectedCourseExam.course_exam_id);
        this.questionForm.reset();
      },
      error: () => this.isLoading = false
    });
  }

  editQuestion(q: any) {
    this.questionForm.patchValue(q);
  }

  deleteQuestion(id: number) {
    const dialogRef = this.dialogBox.open(DialogBox_Component, { data: { Message: 'Delete this question?', Type: true } });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.course_Service_.Manage_Questions({ action: 'DELETE', question_id: id }).subscribe(() => {
          this.loadQuestions(this.selectedCourseExam.course_exam_id);
        });
      }
    });
  }

  getExamName(examDataId: number) {
    const data = this.examDataList.find(d => d.exam_data_id === examDataId);
    return data ? data.exam_name : 'Unknown Exam';
  }

  onClose() {
    this.closeClicked.emit();
  }
}
