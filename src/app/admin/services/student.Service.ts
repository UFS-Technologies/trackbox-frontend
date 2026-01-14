import { Component, OnInit, Input, Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AnimationKeyframesSequenceMetadata } from '@angular/animations';
import { v4 as uuidv4 } from 'uuid';
import { S3 } from 'aws-sdk';

@Injectable({
    providedIn: 'root'
})
export class student_Service {
    private http = inject(HttpClient);

    constructor() {
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        };
    } AnimationKeyframesSequenceMetadata
    Save_student(student_) {
        return this.http.post(environment.BasePath + 'student/Save_student/', student_);
    }
    enroleCourse(course) {
        return this.http.post(environment.BasePath + 'student/enroleCourseFromAdmin/', course);
    }
    Insert_Student_Exam_Result(course) {
        return this.http.post(environment.BasePath + 'student/Insert_Student_Exam_Result/', course);
    }
    private extractData(res: Response) {
        let body = res;
        return body || {};
    }
    Search_student(
      student_Name: string,
      page: number,
      pageSize: number,
      courseId: number | null,
      batchId: number | null,
      enrollmentStatus: string | 'all',
    ): Observable<any> {
      let params = new HttpParams()
        .set('student_Name', student_Name)
        .set('page', page.toString())
        .set('pageSize', pageSize.toString())
        .set('enrollment_status', enrollmentStatus.toString());
      if (courseId != null) {
        params = params.set('courseId', courseId.toString());
      }
      if (batchId != null) {
        params = params.set('batchId', batchId.toString());
      }
  
      return this.http.get(environment.BasePath + 'student/Search_student/', { params });
    }
    Get_All_Students(student_Name): Observable<any> {
        var Search_Data = { 'student_Name': student_Name}
        return this.http.get(environment.BasePath + 'student/Get_All_Students/', { params: Search_Data });
    }
    Get_Student_Exam_Results(studentId,courseId): Observable<any> {
        var Search_Data = { 'studentId': studentId,'courseId':courseId}
        return this.http.get(environment.BasePath + 'student/Get_Student_Exam_Results/', { params: Search_Data });
    }
 
    Delete_student(student_Id) {
        return this.http.post(environment.BasePath + 'student/Delete_Student_Account/' + student_Id,{});
    }
    delete_Student_Exam_result(student_Id) {
        return this.http.get(environment.BasePath + 'student/delete_Student_Exam_result/' + student_Id);
    }
    Generate_certificate(StudentCourse_ID,value) {
        return this.http.get(environment.BasePath + 'student/Generate_certificate/' + StudentCourse_ID+'/'+value);
    }
    Get_student(student_Id) {
        return this.http.get(environment.BasePath + 'student/Get_student/' + student_Id);
    }
    getCoursesByStudentId(studentId):Observable<any>{
        return this.http.get(environment.BasePath + 'student/Get_Courses_By_StudentId/' + studentId);
    }
    uploadFile(file: File, studentName: string, key?: string): Promise<{ key: any, fileName: string }> {
      return new Promise(async (resolve, reject) => {
        try {
          console.log('key: ', key);
          const contentType = file.type;
          const randomString = uuidv4();
          if (!key) {
            key = `Briffni/Students/${studentName}${randomString}`;
          }
    
          // Get signed URL from backend
          const response: any = await this.http.get(`${environment.BasePath}s3/upload-url`, {
            params: { key, contentType }
          }).toPromise();
          
          if (!response.success) throw new Error(response.message);
          
          // Upload to S3 using the signed URL
          const uploadHeaders = new HttpHeaders({ 'Content-Type': contentType });
          this.http.put(response.url, file, {
            headers: uploadHeaders
          }).subscribe(() => {
            console.log("Successfully uploaded file via backend signed URL.");
            resolve({ key: key, fileName: file.name });
          }, err => {
            console.error("There was an error uploading your file: ", err);
            reject(err);
          });
        } catch (err) {
          console.error("Error starting upload:", err);
          reject(err);
        }
      });
    }
}

