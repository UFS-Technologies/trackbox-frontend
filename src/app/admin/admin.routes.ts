// admin/routes.ts
import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CategoryComponent } from './components/category/category.component';
import { CourseComponent } from './components/course/course.component';
import { TeacherComponent } from './components/teacher/teacher.component';
import { StudentComponent } from './components/student/student.component';
import { BatchComponent } from './components/course/batch/batch.component';
import { TeacherReportComponent } from './components/teacher-report/teacher-report.component';
import { StudentReportComponent } from './components/student-report/student-report.component';
import { ModuleComponent } from './components/module/module.component';
import { ReviewsComponent } from './components/reviews/reviews.component';
import { StudentAppinfoComponent } from './components/student-appinfo/student-appinfo.component';
export const ADMIN_ROUTES: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "dash",
  },
  {
    path: 'dash',
    component:DashboardComponent, 
    data: { breadcrumb: 'Dashboard' } 

  },
  {
    path: 'category',
    component:CategoryComponent, 
    data: { breadcrumb: 'Course Categories' } 

  },
  {
    path: 'course',
    component:CourseComponent, 
    data: { breadcrumb: 'Course' } 
  },

  {

    path: 'Faculty',
    component: TeacherComponent,
    data: { breadcrumb: 'Faculty'}
  },
  {
    path: 'student',
    component: StudentComponent,
    data: { breadcrumb: 'Student'}
  },

  {
    path: 'teacher_Report',
    component: TeacherReportComponent,
    data: { breadcrumb: 'Teacher Report'}
  },
  {
    path: 'student_Report',
    component: StudentReportComponent,
    data: { breadcrumb: 'Student Report'}
  },
  {
    path: 'course_module',
    component: ModuleComponent,
    data: { breadcrumb: 'Levels'}
  },
//   {
//     path: 'reviews',
//     component: ReviewsComponent,
//     data: { breadcrumb: 'FeedBack'}
//   },
  {
    path: 'student_appInfo',
    component: StudentAppinfoComponent,
    data: { breadcrumb: 'Student AppInfo'}
  },
  {
    path: 'Teacher_attendance',
    component: TeacherReportComponent,
    data: { breadcrumb: 'Teacher Attendance'}
  },
];
