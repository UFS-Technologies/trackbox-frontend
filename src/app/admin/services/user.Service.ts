import { Component, OnInit, Input, Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AnimationKeyframesSequenceMetadata } from '@angular/animations';
import { environment } from '../../../environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { S3 } from 'aws-sdk';

@Injectable({
    providedIn: 'root'
})
export class user_Service {
    private http = inject(HttpClient);

    Save_user(user) {
        return this.http.post(environment.BasePath + 'user/Save_user/', user);
    }
  
    deactivate_Account(details) {
        return this.http.post(environment.BasePath + 'deactivate_Account/', details);
    }
    uploadFile(file: File, userName: string): Promise<{ key: string, fileName: string }> {
        return new Promise(async (resolve, reject) => {
          try {
            const contentType = file.type;
            const randomString = uuidv4();
            const key = `Briffni/User/${userName}${randomString}`;
      
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
    private extractData(res: Response) {
        let body = res;
        return body || {};
    }
    Search_user(params): Observable<any> {
        return this.http.get(environment.BasePath + 'user/Search_user/', { params: params });
    }
    Delete_user(user_Id) {
        return this.http.get(environment.BasePath + 'user/Delete_user/' + user_Id);
    }
    Get_user(user_Id) {
        return this.http.get(environment.BasePath + 'user/Get_user/' + user_Id);
    }
    Search_User_Invoice(user_Id) {
        return this.http.get(environment.BasePath + 'user/Search_User_Invoice/' + user_Id);
    }
    Get_Report_LiveClasses_By_BatchAndTeacher(Teacher_ID,Batch_ID,Course_ID,Start_Date,End_Date) {
        var Search_Data = {  Teacher_ID,Batch_ID,Course_ID,Start_Date,End_Date }

        return this.http.get(environment.BasePath + 'user/Get_Report_LiveClasses_By_BatchAndTeacher/',{ params: Search_Data } );
    }
    Get_Report_StudentLiveClasses_By_BatchAndStudent(
        Student_ID: number,
        Batch_ID: number,
        Course_ID: number,
        fromDate: string,
        toDate: string,
        pageNumber: number,
        pageSize: number
    ) {
        return this.http.get(environment.BasePath + 'user/Get_Report_StudentLiveClasses_By_BatchAndStudent/', {
            params: {
                Student_ID: Student_ID.toString(),
                Batch_ID: Batch_ID.toString(),
                Course_ID: Course_ID.toString(),
                Start_Date: fromDate || '',
                End_Date: toDate || '',
                PageNumber: pageNumber.toString(),
                PageSize: pageSize.toString()
            }
        });
    }
    Get_Teacher_courses(userId):Observable<any>{
        return this.http.get(environment.BasePath + 'teacher/Get_Teacher_courses/' + userId);
    }
    Delete_Invoice(Invoice_Id):Observable<any>{
        return this.http.get(environment.BasePath + 'user/Delete_Invoice/' + Invoice_Id);
    }
    Get_Teacher_courses_With_Batch(userId):Observable<any>{
        return this.http.get(environment.BasePath + 'teacher/Get_Teacher_courses_With_Batch/' + userId);
    }
    Get_Hod_Course(userId):Observable<any>{
        return this.http.get(environment.BasePath + 'user/Get_Hod_Course?userId=' + userId);
    }
    Get_Teacher_Students(userId: number, courseId: number = 0): Observable<any> {
        return this.http.get(environment.BasePath + `teacher/Get_Teacher_Students/${userId}/${courseId}`);
    }
    Get_Teacher_Timing(userId):Observable<any>{
        return this.http.get(environment.BasePath + 'teacher/Get_Teacher_Timing/' + userId);
    }
    Get_Dashboard(){
        return this.http.get(environment.BasePath + 'user/Get_Dashboard/' );

    }
    Save_User_Invoice(invoice) {
        return this.http.post(environment.BasePath + 'user/Save_User_Invoice/', invoice);
    }
    Get_AppInfo_List(filters: any) {
        let params = new HttpParams()
            .set('isStudent', filters.isStudent.toString())
            .set('appVersion', filters.appVersion || '')
            .set('fromDate', filters.fromDate || '')
            .set('toDate', filters.toDate || '')
            .set('nameSearch', filters.nameSearch || '')
            .set('isBatteryOptimized', filters.isBatteryOptimized !== null ? filters.isBatteryOptimized.toString() : '')
            .set('page', filters.page.toString())
            .set('pageSize', filters.pageSize.toString());

        return this.http.get(environment.BasePath + 'student/Get_AppInfo_List/', { params });
    }
    
    Get_Report_TeacherLiveClasses_By_BatchAndTeacher(
    Teacher_ID: number,
    Batch_ID: number,
    Course_ID: number,
    fromDate: string,
    toDate: string,
    page: number,
    pageSize: number
    ) {
    return this.http.get(
        `${environment.BasePath}user/Get_Report_TeacherLiveClasses_By_BatchAndTeacher/`, 
        {
            params: {
                Teacher_ID: Teacher_ID.toString(),
                Batch_ID: Batch_ID.toString(),
                Course_ID: Course_ID.toString(),
                fromDate,
                toDate,
                page: page,
                pageSize: pageSize
            }
        }
    );
    }

    
}

