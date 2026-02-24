import { ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewEncapsulation, inject, viewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { student_Service } from '../../services/student.Service';
import { DialogBox_Component } from '../../../shared/components/DialogBox/DialogBox.component';
import {MatDialog} from '@angular/material/dialog';
import { student } from '../../../core/models/student';
import { student_course } from '../../../core/models/student_course';
import { CommonModule, DatePipe } from '@angular/common';
import { course_Service } from '../../services/course.Service';
import { environment } from '../../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, debounceTime, EMPTY, filter, finalize, forkJoin, from, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import { SharedModule } from '../../../shared/shared.module';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { IConfig, ICountry } from 'ngx-countries-dropdown';
import { Debounce } from '../../../shared/services/debounce.decorator';

 @Component({
    selector: 'app-student',
    imports: [ReactiveFormsModule, CommonModule, FormsModule, SharedModule],
    templateUrl: './student.component.html',
    styleUrl: './student.component.scss',
    encapsulation: ViewEncapsulation.None, 
})
export class StudentComponent implements OnInit {
  preferredCountryCodes: string[] = [ 'in','ae'];

  student_Service_ = inject(student_Service);
  private fb = inject(FormBuilder);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  dialogBox = inject(MatDialog);
  private course_Service_ = inject(course_Service);
  router = inject(Router);
  url = inject(ActivatedRoute);
  private currentSubscription?: Subscription;
  private courseSubscription?: Subscription;
  selectedCountryConfig: IConfig = {
    hideCode: true,
    hideName: true
  };
  countryListConfig: IConfig = {
    hideCode: true,
    
  };
  readonly certificateContainer = viewChild.required<ElementRef>('certificateContainer');
  enrollmentStatus: string = 'all';
  Student_Exam_Name: string = '';
  currentStudent: any = null;
   isInitializing = false;
   resetTimeout: any = null;
   isGenerating: boolean = false;

  Total_Entries: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  view = 'list';
  showPassword = false;
  searchTerm: string = '';
  searchTimeout: any;
  student_Form: FormGroup;
  student_Course: FormGroup;
  student_Name_Search: string;
  isLoading: boolean;
  student_Data:student[]
  EditIndex: number;courseList;
  selectedCourseId: number | null = null;
  selectedBatchId: number | null = null;
  fileToRemoveAws: any=[];
  previewUrl:any=null
  allCourse: any=[];
    examResults:any = [];
examsList:any=[]
  filepath=environment['FilePath']
  newExamResult = {
    StudentExam_ID: 0,
    Exam_ID: null,
    Content_Name: null,
    Batch_Id: null, 
    Batch_Name: null,
    Course_Id: null,
    Student_ID: null,
    Result_Date: null,
    Listening: '',
    Reading: '',
    Writing: '',
    Speaking: '',
    Overall_Score: '',
    CEFR_level: '',
    Exam_Name: '',
  };
  available_Time_Slots: any=[];
  Batch_List:any=[]
  studentName: string='';
   batch_Data: any;
   selectedTime: any;
   selectedSlot: any;
   optedCourseId: any;
   slotDetails: any;
   batchDetails: any;
   selectedCountry: ICountry;
  constructor() {
    this.student_Form = this.fb.group({
     
      Student_ID: [0],
      First_Name: ["", Validators.required],
      Last_Name: ["", Validators.required],
      Email: [""],
      Country_Code: [""], // New field for country code
      Country_Code_Name: [""], // New field for country code
      Profile_Photo_Path: [""],
      Profile_Photo_Name: ["",],
      Phone_Number: [""],
      Delete_Status: [0],
      Social_Provider: [""],
      Social_ID: [""],
      Avatar: [""],
      Password: [""],
    });
    this.student_Course = this.fb.group({
      Student_ID: [0 ,[]],
      Course_ID: [0,[Validators.required, Validators.min(1)]],
      Enrollment_Date: [new Date().toISOString().substring(0, 10)], // today's date
      Expiry_Date: [''],
      Price: [''],
      Payment_Date: [new Date().toISOString().substring(0, 16)], // today's datetime
      Payment_Status: ['Paid'],
      LastAccessed_Content_ID: [0],
      Transaction_Id: [''],
      Delete_Status: [0], // default to 0
      StudentCourse_ID: [0], // default to 0
      Payment_Method: ['admin'],
      Slot_Id:  [0],
      Batch_ID:  [0,[Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.pageLoad();
  }

  pageLoad() {
    this.Clr_student();
    this.Clr_student_Course()
    this.Search_student();
    this.course_Service_.Search_course('').subscribe(res=>{
      console.log('res: ', res);
      this.allCourse =res
    })
    this.courseSubscription?.unsubscribe();

    this.courseSubscription =  this.student_Course.get('Course_ID')?.valueChanges.subscribe(courseId => {
      if(this.view == 'courses' || this.view == 'edit')
        console.log('courseId: ', courseId);
      this.updateCourseDetails(courseId);
    });
    this.url.queryParams.pipe(
      filter(params => params['student_id'])
    ).subscribe(params => {
      const student_id = params['student_id'];
      console.log('student_id: ', student_id);
      this.View_courses(student_id);
      this.router.navigate([], {
        relativeTo: this.url,
        queryParams: { student_id: null },
        queryParamsHandling: 'merge'
      });


     
});
    this.view = 'list';
  }
  isValidEmail(email: string): boolean {
    return Validators.email(new FormControl(email)) === null;
  }

  isValidPhone(phone: string): boolean {
    return /^\d{10}$/.test(phone);
  }

  updateCourseDetails(courseId: number) {
  
    this.isLoading = true;
    const selectedCourse = this.allCourse.find(course => course.Course_ID == courseId);
    console.log('selectedCourse: ', selectedCourse);
    console.log('student_Course: ', this.student_Course);
  
    if(this.optedCourseId != courseId) {
      this.student_Course.get('Slot_Id')?.setValue(0);
      this.student_Course.get('Batch_ID')?.setValue(0);
    }
    this.student_Course.get('Price')?.setValue(selectedCourse?.Price);
  
    if (selectedCourse) {
      const currentDate = new Date().toISOString().substring(0, 10);
      this.student_Course.patchValue({
        Enrollment_Date: currentDate,
        Payment_Date: currentDate,
        Delete_Status: 0,
        Payment_Status: 'Paid',
        Payment_Method: 'admin'
      });
  
      // Store subscription to unsubscribe from previous call
      if (this.currentSubscription) {
        this.currentSubscription.unsubscribe();
      }
  
      this.currentSubscription = forkJoin({
        timeSlots: this.course_Service_.Get_All_Time_Slot(courseId),
        batches: this.course_Service_.get_course_Batches(courseId)
      }).pipe(
        map(({ timeSlots, batches }) => ({
          timeSlots: timeSlots[0],
          batches: batches
        })),
        tap(({ timeSlots, batches }) => {
          this.available_Time_Slots = timeSlots;
          
          console.log('this.available_Time_Slots: ', this.available_Time_Slots);
  
          this.batch_Data = batches;
          const selectedBatchInfo = this.batch_Data.find(
            batch => batch.Batch_ID.toString() == this.student_Course.get('Batch_ID')?.value
          );
  
          if (selectedBatchInfo) {
            this.batchDetails = selectedBatchInfo;
          } else {
            this.batchDetails = '';
          }
          console.log('this.batch_Data: ', this.batch_Data);

          const selectedSlotId = this.student_Course.get('Slot_Id')?.value;
          if (selectedSlotId) {
            const selectedSlotInfo = this.available_Time_Slots.find(
              slot => slot.Slot_Id.toString() == selectedSlotId.toString()
            );
            if (selectedSlotInfo) {
              this.slotDetails = selectedSlotInfo;
            }
          }
  
          if (this.available_Time_Slots.length == 0 && 
              this.view == 'courses' && 
              this.courseList.length == 0) {
            this.showNoTimeSlotsDialog();
          }
        }),
        catchError(error => {
          console.error('Error fetching course details:', error);
          this.isLoading = false;
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe();
    } else {
      this.isLoading = false;
    }
  }
  // Separate method for dialog to improve readability
  private showNoTimeSlotsDialog(): void {
    this.dialogBox.open(DialogBox_Component, {
      panelClass: 'Dialogbox-Class',
      data: {
        Message: 'No available time slots. All existing time slots have been assigned. Please create or edit time slots under Course -> Edit.',
        Type: '3'
      }
    });
  }
  onSearchChange() {
    // Clear the previous timeout if it exists
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Set a new timeout
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1; // Reset to first page when searching
      this.Search_student();
    }, 300); // Wait for 300ms after the user stops typing
  }
  @Debounce(300)
  Save_student() {
    console.log(this.student_Course);
    console.log(this.student_Course.valid);
    console.log('this.student_Form: ', this.student_Form);
    console.log('this.student_Form.valid: ', this.student_Form.valid);
    if (!this.student_Form.valid || !this.student_Course.valid) {
      this.student_Form.markAllAsTouched();
      this.student_Course.markAllAsTouched();
      return;
    }
  
 
  
    // Validate email and phone
    const email = this.student_Form.get('Email')?.value;
    const phone = this.student_Form.get('Phone_Number')?.value;
  
    if (!email && !phone) {
      this.dialogBox.open(DialogBox_Component, { 
        panelClass: 'Dialogbox-Class', 
        data: { Message: 'Please provide either an Email or a Phone Number', Type: '3' } 
      });
      return;
    }
  
    if (email && !this.isValidEmail(email)) {
      this.dialogBox.open(DialogBox_Component, { 
        panelClass: 'Dialogbox-Class', 
        data: { Message: 'Please provide a valid Email address', Type: '3' } 
      });
      return;
    }
  
    // if (phone && !this.isValidPhone(phone)) {
    //   this.dialogBox.open(DialogBox_Component, { 
    //     panelClass: 'Dialogbox-Class', 
    //     data: { Message: 'Please provide a valid 10-digit Phone Number', Type: '3' } 
    //   });
    //   return;
    // }
  
    this.isLoading = true;
  
    // Handle case with profile photo
    console.log('   this.fileToRemoveAws: ',    this.fileToRemoveAws);
    if (this.student_Form?.value.Profile_Photo_Path instanceof File) {
      (this.fileToRemoveAws.length ? 
        forkJoin(this.fileToRemoveAws.map(key => from(this.course_Service_.fileToRemoveAws(key)))) : 
        of(null)
      ).pipe(
        switchMap(() => from(this.student_Service_.uploadFile(
          this.student_Form?.value.Profile_Photo_Path,
          this.student_Form?.value.First_Name
        ))),
        tap(res => {
          this.student_Form.get('Profile_Photo_Path')?.patchValue(res.key);
        }),
        switchMap(() => this.student_Service_.Save_student(this.student_Form?.value)),
        switchMap(Save_status => this.processStudentSave(Save_status)),
        catchError(error => {
          this.isLoading = false;
          this.dialogBox.open(DialogBox_Component, {
            panelClass: 'Dialogbox-Class',
            data: { Message: 'Error occurred', Type: '2' }
          });
          return EMPTY;
        }),
        finalize(() => this.isLoading = false)
      ).subscribe();
    }
    // Handle case without profile photo
    else {
      this.student_Service_.Save_student(this.student_Form?.value).pipe(
        switchMap(Save_status => this.processStudentSave(Save_status)),
        catchError(error => {
          this.isLoading = false;
          this.dialogBox.open(DialogBox_Component, { 
            panelClass: 'Dialogbox-Class', 
            data: { Message: error.error, Type: '2' } 
          });
          return EMPTY;
        }),
        finalize(() => this.isLoading = false)
      ).subscribe();
    }
  }
  
  private processStudentSave(Save_status: any): Observable<any> {
    this.student_Course.get('Student_ID')?.setValue(Save_status[0].Student_ID)
    return this.student_Service_.enroleCourse(this.student_Course?.value).pipe(
      tap(() => {
        if (Save_status[0].existingUser === 1) {
          this.dialogBox.open(DialogBox_Component, { 
            panelClass: 'Dialogbox-Class', 
            data: { Message: 'Student Already Exists', Type: '3' } 
          });
        }
        else if (Number(Save_status[0].Student_ID) > 0) {
          this.dialogBox.open(DialogBox_Component, { 
            panelClass: 'Dialogbox-Class', 
            data: { Message: 'Saved', Type: 'false' } 
          });
          this.pageLoad();
        }
        else {
          this.dialogBox.open(DialogBox_Component, { 
            panelClass: 'Dialogbox-Class', 
            data: { Message: 'Error Occurred', Type: '2' } 
          });
        }
      })
    );
  }
  getImage(imagepath){
    return   environment['FilePath']+imagepath
}
shouldShowExistingImage(): boolean {
  const profilePhotoPath = this.student_Form.value.Profile_Photo_Path;
  return profilePhotoPath && !(profilePhotoPath instanceof File);
}
  onFileSelected(event){
    const fileSizeLimit = 1 * 1024 * 1024; // 1MB in bytes

    const file = (event.target as HTMLInputElement).files;
    if (file && file[0] &&  file[0].size > fileSizeLimit) {
      alert('File size exceeds the 1MB limit. Please select a smaller file.');
      return; // Exit if the file is too large
    }
    
    if (!(  this.student_Form.get('Profile_Photo_Path')?.value instanceof File) && this.student_Form.get('Profile_Photo_Path')?.value!=null && this.student_Form.get('Profile_Photo_Path')?.value!='' ) {
      this.fileToRemoveAws.push(this.student_Form.get('Profile_Photo_Path')?.value)
      
    }
        if (file && file[0]) {
          this.student_Form.get('Profile_Photo_Path')?.setValue(file[0]);
          this.student_Form.get('Profile_Photo_Name')?.setValue( file[0].name);
        
            const reader = new FileReader();
            reader.onload = (e: any) => {
              this.previewUrl = e.target.result;
            };
            reader.readAsDataURL(file[0]);
          } else {
            this.previewUrl = null; 
          }

 

    
    
    


  }




  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  closeClick() {
    this.view = 'list';
    this.Clr_student_Course()
    this. resetForm()

  }

  Create_New() {
    this.view = 'edit';
    this.Clr_student();
    this.Clr_student_Course();
  }

  Clr_student() {
    this.student_Form.reset({
      Student_ID: 0,
      First_Name: "",
      Last_Name: "",
      Email: "",
      Phone_Number: "",
      Delete_Status: 0,
      Social_Provider: "",
      Social_ID: "",
      Avatar: "",
      Password: ""
    })
    this.previewUrl = null
  } 
  Clr_student_Course() {
    this.previewUrl = null; 
    this.student_Course.reset({
      Student_ID: 0,
      StudentCourse_ID: 0,
      Course_ID: 0,
      Enrollment_Date: new Date().toISOString().substring(0, 10), // today's date
      Expiry_Date: '',
      Price: '',
      Payment_Date: new Date().toISOString().substring(0, 16), // today's datetime
      Payment_Status: 'Paid',
      LastAccessed_Content_ID: 0,
      Transaction_Id: '',
      Delete_Status: 0, // default to 0
      Payment_Method: 'admin',
      Slot_Id: 0,
      Batch_ID: 0,
    });
    this.slotDetails = null;
    this.batchDetails = null;
    this.selectedTime = '';
    this.selectedSlot = 0;
    this.optedCourseId = 0;
    this.available_Time_Slots = [];
  } 

  Search_student() {
    this.isLoading = true;
    this.student_Data = []
    this.student_Service_.Search_student(this.searchTerm, this.currentPage, this.pageSize,  this.selectedCourseId, this.selectedBatchId,this.enrollmentStatus).subscribe(
      (response: any) => {
        console.log('response: ', response);
        this.student_Data =  response[1];
        this.Total_Entries = response[0][0].total_count;
        // if (this.student_Data.length == 0) {
        //   this.isLoading = false;
        //   const dialogRef = this.dialogBox.open(DialogBox_Component, {
        //     panelClass: 'Dialogbox-Class',
        //     data: { Message: 'No Details Found', Type: "3" }
        //   });
        // }
        this.isLoading = false; 
      },
      error => {
        this.isLoading = false;
        const dialogRef = this.dialogBox.open(DialogBox_Component, {
          panelClass: 'Dialogbox-Class',
          data: { Message: 'Error Occurred', Type: "2" }
        });
      }
    );
  }

  onPageChange(page: any) {
    this.currentPage = page;
    this.Search_student();
  }
  getTotalPages(): number {
    return Math.ceil(this.Total_Entries / this.pageSize);
  }
  getMaxDisplayed(): number {
    return Math.min(this.currentPage * this.pageSize, this.Total_Entries);
  }
  getPages(): number[] {
    const totalPages = this.getTotalPages();
    console.log('Array.from({length: totalPages}, (_, i) => i + 1);: ', Array.from({length: totalPages}, (_, i) => i + 1));
    return Array.from({length: totalPages}, (_, i) => i + 1);
  }
  getVisiblePages(): (number | string)[] {
    const totalPages = this.getTotalPages();
    if (totalPages <= 7) {
      return Array.from({length: totalPages}, (_, i) => i + 1);
    }
    if (this.currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (this.currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...', totalPages];
  }
  Edit_student(student_e: student) {
    console.log('student_e: ', student_e);
    this.view = 'edit';
    this.Clr_student_Course() 
    this.isLoading=true
    this.student_Form.patchValue(student_e);
    this.student_Form.get('Password')?.setValue('');
    
   
    this.View_courses(student_e.Student_ID,false)
    console.log(' this.student_Form: ',  this.student_Form);
  }

  Delete_student(student_Id, index) {
    const dialogRef = this.dialogBox.open
      (DialogBox_Component, {
        panelClass: 'Dialogbox-Class'
        , data: { Message: 'Do you want to delete ?', Type: true, Heading: 'Confirm' }
      });
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'Yes') {
        this.isLoading = true;
        this.student_Service_.Delete_student(student_Id).subscribe(Delete_status => {
          if (Delete_status[0].Student_ID > 0) {
            this.pageLoad();
            const dialogRef = this.dialogBox.open
              (DialogBox_Component, {
                panelClass: 'Dialogbox-Class'
                , data: { Message: 'Deleted', Type: "false" }
              });
          }
          else {
            this.isLoading = false;
            const dialogRef = this.dialogBox.open
              (DialogBox_Component, {
                panelClass: 'Dialogbox-Class'
                , data: { Message: 'Error Occured', Type: "2" }
              });
          }
          this.isLoading = false;
        },
          Rows => {
            this.isLoading = false;
            const dialogRef = this.dialogBox.open
              (DialogBox_Component, {
                panelClass: 'Dialogbox-Class'
                , data: { Message: 'Error Occured', Type: "2" }
              });
          });
      }
    });
  }
setStudentDetails(student){
  const student_Id= student.Student_ID
  if( student.First_Name&&student.Last_Name ){

    this.studentName= student.First_Name +' '+student.Last_Name 
     this.View_courses(student_Id)

  }else{
    this.studentName=''
    const dialogRef = this.dialogBox.open(DialogBox_Component, { panelClass: 'Dialogbox-Class', data: { Message: 'Please Fill All The Student details Before Enrole', Type: '3' } });
 
  }

}
  View_courses(Student_ID,viewChange=true){
    this.selectedTime='';
    this.selectedSlot=0;
    this.optedCourseId=0;
    console.log('viewChange: ', viewChange);
    this.isLoading=true
    this.student_Service_.getCoursesByStudentId(Student_ID).subscribe(result=>{
      this.courseList = result;
      if(viewChange){
        console.log('viewChange: ', viewChange);

        this.view = 'courses';
      }
      if(result.length ){
        if(result[0]['start_time']&&result[0]['end_time']){

          this.selectedTime=result[0]['start_time']+ ' - ' +result[0]['end_time'] + (result[0]['Teacher_Name_One_On_One'] ? ' (' + result[0]['Teacher_Name_One_On_One'] + ')' : '')
        }
        this.selectedSlot= result[0].Slot_Id
          this.slotDetails={
            Teacher_Name:result[0]['Teacher_Name_One_On_One'],
            start_time:result[0]['start_time'],
            end_time:result[0]['end_time'],
          }
        this.optedCourseId= result[0].Course_ID
      }
    if(this.view != 'courses' && result.length )
    {

      this.student_Course.patchValue({
        Student_ID: Student_ID,
        Course_ID: result[0] ?result[0].Course_ID: 0,
        Batch_ID: result[0]? result[0].Batch_ID :0,
        Slot_Id: result[0]?result[0].Slot_Id : 0,
        StudentCourse_ID:result[0]? result[0].StudentCourse_ID : 0,
        Price: result[0]?result[0].Price: 0,
        Payment_Method: 'admin'
        });
      }else{
        this.student_Course.patchValue({
          Student_ID: Student_ID,
        })
        this.isLoading=false
      }
   
      console.log(' this.student_Course: ',  this.student_Course);
    })
  }
  onSlotChange(event: any) {
    const selectedSlotId = event.target.value;
    const selectedSlotInfo = this.available_Time_Slots.find(
      slot => slot.Slot_Id.toString() == selectedSlotId
    );
    
    if (selectedSlotInfo) {
     this.slotDetails=selectedSlotInfo
    }else{
      this.slotDetails=''
      
    }
    console.log('   this.slotDetails: ',    this.slotDetails);
  }
  onBatchChange(event: any) {
    const selectedBatchId = event.target.value;
    const selectedBatchInfo = this.batch_Data.find(
      batch => batch.Batch_ID.toString() == selectedBatchId
    );
    
    if (selectedBatchInfo) {
      this.batchDetails = selectedBatchInfo;
    } else {
      this.batchDetails = '';
    }
    console.log('this.batchDetails: ', this.batchDetails);
  }
  Enrole_Course(): void {
    console.log(' this.student_Course: ',  this.student_Course);
    const formValue = this.student_Course.value;
    const courseId = Number(formValue.Course_ID);
    const Price = (formValue.Price);
    const slotId = Number(formValue.Slot_Id);
    const StudentCourse_ID = Number(formValue.StudentCourse_ID);
    const Batch_ID = Number(formValue.Batch_ID);
    this.student_Course.patchValue({
      Course_ID: courseId,
      StudentCourse_ID: StudentCourse_ID,
      Slot_Id: slotId,
      Batch_ID: Batch_ID,
    });
    this.student_Course.get('Price')?.setValue(Price)
    console.log(this.student_Course);
  
    if (this.student_Course.valid) {
     this.student_Service_.enroleCourse(this.student_Course.value).subscribe(res=>{
      console.log('res: ', res);
      if(res[0].Course_ID_){

        const dialogRef = this.dialogBox.open(DialogBox_Component, { panelClass: 'Dialogbox-Class', data: { Message: 'Saved', Type: 'false' } });
        this.pageLoad();
      }


         })
    }
  }
  
  onCourseChange() {
    this.currentPage = 1;
    this.selectedBatchId=null
    this.Search_student();
    console.log('this.selectedCourseId: ', this.selectedCourseId);
    if(this.selectedCourseId){

      this.course_Service_.get_course_Batches(this.selectedCourseId).subscribe(res=>{
        this.Batch_List=res
      })
    }else{
      this.Batch_List=[];

    }
  }


  openAddResultModal(item: any) {
    this.newExamResult.Course_Id=item.Course_ID
    this.newExamResult.Batch_Id=item.Batch_ID?item.Batch_ID:0
    this.newExamResult.Batch_Name=item.Batch_Name?item.Batch_Name:0
    this.newExamResult.Student_ID=item.Student_ID?item.Student_ID:0
    console.log('this.newExamResult: ', this.newExamResult);
this.search_results()
  } 
  search_results(){
    this.course_Service_.get_Examof_Course( this.newExamResult.Course_Id).subscribe(res=>{
      this.student_Service_.Get_Student_Exam_Results( this.newExamResult.Student_ID,  this.newExamResult.Course_Id).subscribe(res=>{
        console.log('res: ', res);
       this.examResults=res
      })
      this.examsList=res
  this.view='Add_Result'
    })
  }
  addExamResult() {
    console.log('this.newExamResult: ', this.newExamResult);
    this.newExamResult.Exam_Name=this.Student_Exam_Name
    if (this.newExamResult.Batch_Id ) {
    // if (this.newExamResult.Exam_ID && this.newExamResult.Batch_Id ) {
  
      this.student_Service_.Insert_Student_Exam_Result(this.newExamResult).subscribe(Res=>{
        console.log('Res: ', Res);
        this.search_results()

         this.resetForm();
      })
    }
  }
  Generate_certificate(student_data,value){
    this.currentStudent = student_data;
    this.student_Service_.Generate_certificate( student_data.StudentCourse_ID,value).subscribe(Res=>{
      console.log('Res: ', Res);
      this.View_courses(student_data.Student_ID)

    })
}
//   Generate_certificate(student_data){
//     this.currentStudent = student_data;
//     this.cdr.detectChanges();
//     console.log('student_data: ', student_data);
//     const element = document.getElementById('certificateContainer');

//     if (element) {
//         // Temporarily make the element visible
//         element.style.display = 'block'; 

//         // Wait for the element to be displayed and rendered
//         setTimeout(() => {
//           html2pdf()
//           .from(element)
//           .set({
//             margin: 0,
//             filename: `certificate_${student_data.Student_ID}.pdf`,
//             image: { type: 'jpeg', quality: 1.0 },
//             html2canvas: { 
//               scale: 4, 
//               logging: true, 
//               dpi: 300, 
//               letterRendering: true,
//               useCORS: true
//             },
//             jsPDF: { 
//               unit: 'in', 
//               format: 'letter', 
//               orientation: 'landscape' 
//             }
//           })
//           .outputPdf('blob')
//           .then((pdf: any) => {
//                     console.log('pdf: ', pdf);

//                     this.student_Service_.uploadFile(pdf,'',`Briffni/Cerificate/${student_data.Student_ID}-${student_data.StudentCourse_ID}`,).then(res => {
//                         const input = {
//                             certificate: res['key'],
//                             Trainee_Details_Id: 25
//                         };
                        
//                           this.student_Service_.Generate_certificate( student_data.StudentCourse_ID).subscribe(Res=>{
//                         console.log('Res: ', Res);
//                         this.View_courses(student_data.Student_ID)

//                       })
//                     });
//                 })
//                 .finally(() => {
//                     // Hide the element again after PDF generation
//                     element.style.display = 'none';
//                 });
//         }, 0);
 

//   }
// }
  resetForm() {
    this.newExamResult = {
      StudentExam_ID:   0,
      Exam_ID:   null,
      Batch_Id:this.newExamResult.Batch_Id,
      Content_Name:this.newExamResult.Content_Name,
      Batch_Name:this.newExamResult.Batch_Name,
      Student_ID:this.newExamResult.Student_ID,
      Course_Id:this.newExamResult.Course_Id,
      Listening: '',
      Result_Date: null,
      Reading: '',
      Writing: '',
      Speaking: '',
      Overall_Score: '',
      CEFR_level: '',
      Exam_Name: '',    
    };
    this.Student_Exam_Name=''
  }
  onExamChange(event: Event) {
    const selectedExamId = (event.target as HTMLSelectElement).value;
    const selectedExam = this.examsList.find(exam => exam.Exam_ID === +selectedExamId);
    console.log('selectedExam: ', selectedExam);
    if (selectedExam) {
        this.newExamResult.Content_Name = selectedExam.Content_Name;
    } else {
        this.newExamResult.Content_Name = null; // or any default value
    }
}
assignBatch(studentData){
  console.log('studentData: ', studentData);
this.router.navigate(
  ['admin/course'],
  { queryParams: { Course_Id:studentData?.Course_ID,student_id:studentData?.Student_ID} }
);

}
updateCertificateStatus(item: any, isChecked: boolean) {
  if (item) {
    item.Certificate_Issued = isChecked;
    this.Generate_certificate(item, isChecked ? 1 : 0);
  }
}
editResult(result){
  this.newExamResult=result
  this.Student_Exam_Name=result.Exam_Name
  console.log(' this.newExamResult: ',  this.newExamResult);

}
deleteResult(StudentExam_ID){
  const dialogRef = this.dialogBox.open
  (DialogBox_Component, {
    panelClass: 'Dialogbox-Class'
    , data: { Message: 'Do you want to delete ?', Type: true, Heading: 'Confirm' }
  });
dialogRef.afterClosed().subscribe(result => {
  if (result == 'Yes') {
  this.student_Service_.delete_Student_Exam_result(StudentExam_ID).subscribe(Res=>{
    console.log('Res: ', Res);
    this.search_results()

  })
}
})
}

async viewCertificate(data: any) {
  if (this.resetTimeout) {
    clearTimeout(this.resetTimeout);
    this.resetTimeout = null;
  }

  if (this.isInitializing) {
    this.resetTimeout = setTimeout(() => {
      this.isInitializing = false;
      this.viewCertificate(data);
    }, 500);
    return;
  }

  this.isInitializing = true;
  let printWindow: Window | null = null;
  let cleanupComplete = false;

  try {
    this.currentStudent = data;
    await this.forceViewRefresh();

    printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    // Define inline styles as constants
    const certificateStyles = `
      .certificateContainer {
        width: 100%;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: white;
      }
      .certificate-template {
        width: 100%;
        height: 100%;
        position: relative;
      }
      .certificate-template img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .certificate-content {
        position: absolute;
        top: 58%;
        left: 68%;
        transform: translate(-50%, -50%);
        text-align: center;
        width: 60%;
      }
      .certificate-name {
        font-size: 38px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #000;
      }
      .certificate-text {
        font-size: 18px;
        color: #000;
        line-height: 1.5;
      }
    `;

    const printStyles = `
      @page {
        size: landscape;
        margin: 0mm;
      }
      html, body {
        width: 100%;
        height: 100vh;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      #certificateContainer {
        page-break-inside: avoid;
      }
      .print-container {
        width: 100%;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
      }
      img {
        max-width: 100%;
        height: auto;
      }
    `;

    // Write content to print window with inline styles
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Certificate</title>
          <style>
            ${printStyles}
            ${certificateStyles}
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="certificateContainer certificate-template">
              <img src="assets/images/certificate.jpg" alt="Certificate background" />
              <div class="certificate-content">
                <div class="certificate-name">
                  ${this.currentStudent.name}
                </div>
                <div class="certificate-text">
                  Has successfully completed the <b>${this.currentStudent.Course_Name}</b> at Breffni Academy, demonstrating proficiency and commitment to advancing their language and career skills.
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    const cleanup = () => {
      if (cleanupComplete) return;
      cleanupComplete = true;
      
      if (printWindow) {
        printWindow.close();
      }
      
      if (this.resetTimeout) {
        clearTimeout(this.resetTimeout);
        this.resetTimeout = null;
      }
      
      this.ngZone.run(() => {
        this.isInitializing = false;
        this.cdr.detectChanges();
      });
    };

    // Handle print completion
    if (printWindow.matchMedia) {
      const mediaQueryList = printWindow.matchMedia('print');
      mediaQueryList.addEventListener('change', (mql) => {
        if (!mql.matches) {
          cleanup();
        }
      });
    }

    printWindow.addEventListener('beforeunload', cleanup);

    // Wait for images and trigger print
    await this.waitForImages(printWindow);
    
    printWindow.print();

    // Fallback cleanup
    this.resetTimeout = setTimeout(cleanup, 2000);

  } catch (error) {
    console.error('Error printing certificate:', error);
    if (printWindow) {
      printWindow.close();
    }
    this.handleError();
  }
}

private async waitForImages(printWindow: Window): Promise<void> {
  return new Promise((resolve) => {
    const images = Array.from(printWindow.document.getElementsByTagName('img'));
    if (images.length === 0) {
      setTimeout(resolve, 500);
      return;
    }

    let loadedImages = 0;
    const totalImages = images.length;

    const imageLoaded = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        setTimeout(resolve, 200);
      }
    };

    images.forEach(img => {
      if (img.complete) {
        imageLoaded();
      } else {
        img.onload = imageLoaded;
        img.onerror = imageLoaded;
      }
    });

    // Fallback timeout
    setTimeout(resolve, 3000);
  });
}

private handleError(): void {
  this.isInitializing = false;
  if (this.resetTimeout) {
    clearTimeout(this.resetTimeout);
    this.resetTimeout = null;
  }
}

private async forceViewRefresh(): Promise<void> {
  return new Promise<void>(resolve => {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
      setTimeout(resolve, 100);
    });
  });
}
async downloadCertificate(data) {
  this.currentStudent = data;
  await this.forceViewRefresh();
  if (this.isGenerating) return;
  
  const element = document.getElementById('certificateContainer');
  if (!element) return;

  this.isGenerating = true;
  
  try {
    // Convert the HTML element to canvas with higher resolution
    const canvas = await html2canvas(element, {
      scale: 4,
      useCORS: true,
      logging: false,
      backgroundColor: null,
      windowWidth: 2480,
      windowHeight: 1754,
      onclone: (document) => {
        const style = document.createElement('style');
        style.innerHTML = `
          @font-face {
            font-family: 'Arial';
            font-weight: normal;
            font-style: normal;
          }
        `;
        document.head.appendChild(style);
      }
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
      hotfixes: ['px_scaling']
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

    const fileName = `${this.currentStudent.name}_${this.currentStudent.Course_Name}_Certificate.pdf`
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\.]/g, '');
    
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    this.isGenerating = false;
  }
  
} 
onCountryChange(country: ICountry) {
  // Update the form with the selected country code
  this.student_Form.patchValue({
    
    Country_Code: country.dialling_code,
    Country_Code_Name: country.code
  });

  console.log('Selected Country:', country);
  console.log('Country Code:', country.dialling_code);
}

// Optional: Method to get the selected country code
getSelectedCountryCode(): string {
  return this.student_Form.get('Country_Code')?.value;
}
ngOnDestroy() {
  if (this.resetTimeout) {
    clearTimeout(this.resetTimeout);
    this.resetTimeout = null;
  }
  if (this.currentSubscription) {
    this.currentSubscription.unsubscribe();
  }
}


}
 