import { Component, OnInit, Input, Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AnimationKeyframesSequenceMetadata } from '@angular/animations';
import { environment } from '../../../environments/environment';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';


// AWS direct config removed


@Injectable({
    providedIn: 'root' 
})
export class course_Service {
  private http = inject(HttpClient);

  private socket;
  uploadStatus: string;
  uploadProgress: number;
  totalFiles: number = 0;
  filesUploaded: number = 0;
  private uploadProgressSource = new BehaviorSubject<{ progress: number; status: string; totalFiles: number; filesUploaded: number }>({ progress: 0, status: 'Idle', totalFiles: 0, filesUploaded: 0 });
  public uploadProgress$ = this.uploadProgressSource.asObservable();
resetUploadProgress() {
  this.uploadProgressSource.next({
    progress: 0,
    status: 'Idle',
    totalFiles: 0,
    filesUploaded: 0
  });
}
public sendMessage(message: string) { 
  console.log('message: ', message);
  this.socket.emit('chat message', message);
}

public getMessages(): Observable<string> {
  return new Observable((observer) => {
    this.socket.on('chat message', (data: string) => {
      observer.next(data);
    });

    return () => {
      this.socket.disconnect();
    };
  });
}
Save_course(course_: any)
{ 

return this.http.post(environment.BasePath +'course/Save_course/',course_);
}
save_course_content(course_: any)
{ 

return this.http.post(environment.BasePath +'course/save_course_content/',course_);
}
Update_Time_Slot(course_: any)
{ 

return this.http.post(environment.BasePath +'course/Update_Time_Slot/',course_);
}
Student_Batch_Change(StudentList: any)
{ 

return this.http.post(environment.BasePath +'course/Student_Batch_Change/',StudentList);
}
ValidateTimeSlots(StudentList: any)
{ 

return this.http.post(environment.BasePath +'course/ValidateTimeSlots/',StudentList);
}
get_course_names( )
{ 
return this.http.get(environment.BasePath +'course/get_course_names/',);
}

Search_course(course: any)
{
  console.log('course: ', course);


var Search_Data={'course_Name':course}
 return this.http.get(environment.BasePath +'course/Search_course/',{params:Search_Data});

} 
Get_All_Course_Items(): Observable<any> {
    
  return this.http.get(environment.BasePath + 'course/Get_All_Course_Items/',);
}
Get_all_Batch(): Observable<any> {
    
  return this.http.get(environment.BasePath + 'course/Get_all_Batch/',);
}
Search_Section()
{

 return this.http.get(environment.BasePath +'course/Search_Section/',);

} 
Delete_course(course_Id)
{
 return this.http.get(environment.BasePath +'course/Delete_course/'+course_Id);}
Get_course(course_Id)
{
 return this.http.get(environment.BasePath +'course/Get_course/'+course_Id);
}
Get_Student_List_By_Batch(Batch_Id)
{
 return this.http.get(environment.BasePath +'course/Get_Student_List_By_Batch/'+Batch_Id);
}
Get_course_content(course_Id,Content_ID)
{
 return this.http.get(environment.BasePath +'course/Get_course_content/'+course_Id+'/'+Content_ID);
}
Delete_Course_Content(Content_ID)
{
 return this.http.post(environment.BasePath +'course/Delete_Course_Content/'+Content_ID,{});
}
Get_Available_Time_Slot(course_Id)
{
 return this.http.get(environment.BasePath +'course/Get_Available_Time_Slot/'+course_Id);
}
Get_ExamDetails_By_StudentId(exam_Id,student_Id)
{
 
  var Search_Data
   Search_Data = !student_Id ? { exam_Id } : { exam_Id, student_Id };


 return this.http.get(environment.BasePath +'student/Get_ExamDetails_By_StudentId/' ,{ params: Search_Data });
}
get_course_students(course_Id){
  return this.http.get(environment.BasePath +'course/Get_Course_Students/'+course_Id);

}
Get_Free_Time_Slot(course_Id){
  return this.http.get(environment.BasePath +'course/Get_Free_Time_Slot/'+course_Id);

}
Get_Course_Reviews(){
  return this.http.get(environment.BasePath +`course/Get_Course_Reviews/`);

}


get_course_Batches(course_Id){
  return this.http.get(environment.BasePath +'course/get_course_Batches/'+course_Id);

}
get_Examof_Course(course_Id){
  return this.http.get(environment.BasePath +'course/get_Examof_Course/'+course_Id);

}
  async fileToRemoveAws(key: string): Promise<void> {
    console.log('key: ', key);
    try {
      await this.http.post(`${environment.BasePath}s3/delete`, { key }).toPromise();
      console.log(`Object with key ${key} deleted successfully via backend.`);
    } catch (error) {
      console.error(`Error deleting object with key ${key} via backend:`, error);
      throw error;
    }
  }
  upload(file: File, totalFilesCount: number, courseName: string, fileName?: string): Promise<{ key: string, fileName: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        this.totalFiles = totalFilesCount;
        const randomString = uuidv4();
        const [name, extension] = file.name.split(/\.(?=[^\.]+$)/);
        fileName = `${randomString}.${extension}`;
        
        const contentType = file.type;
        const key = `Briffni/${courseName}/${fileName}`;
        
        this.uploadProgressSource.next({ progress: 0, status: 'Getting upload URL...', totalFiles: this.totalFiles, filesUploaded: this.filesUploaded });
        
        // Get signed URL from backend
        const response: any = await this.http.get(`${environment.BasePath}s3/upload-url`, {
          params: { key, contentType }
        }).toPromise();
        
        if (!response.success) throw new Error(response.message);
        
        this.uploadProgressSource.next({ progress: 10, status: 'Uploading...', totalFiles: this.totalFiles, filesUploaded: this.filesUploaded });
        
        // Upload to S3 using the signed URL
        const uploadHeaders = new HttpHeaders({ 'Content-Type': contentType });
        this.http.put(response.url, file, {
          headers: uploadHeaders,
          reportProgress: true,
          observe: 'events'
        }).subscribe((event: any) => {
          if (event.type === 1) { // HttpEventType.UploadProgress
            const progress = Math.round((event.loaded / event.total) * 100);
            this.uploadProgressSource.next({ progress, status: 'Uploading...', totalFiles: this.totalFiles, filesUploaded: this.filesUploaded });
          } else if (event.type === 4) { // HttpEventType.Response
            console.log('success');
            this.filesUploaded++;
            this.uploadProgressSource.next({ progress: 100, status: 'Upload successful', totalFiles: this.totalFiles, filesUploaded: this.filesUploaded });
            resolve({ key: key, fileName: file.name });
          }
        }, err => {
          console.error('Upload failed:', err);
          this.uploadProgressSource.next({ progress: 0, status: 'Upload failed', totalFiles: this.totalFiles, filesUploaded: this.filesUploaded });
          reject(err);
        });

      } catch (err) {
        console.error('Error starting upload:', err);
        reject(err);
      }
    });
  }
Get_course_content_By_Day(
  Course_Id: number, 
  isLibrary: any, 
  Module_ID?: number, 
  Section_ID?: number, 
  Day_Id?: number,
  Is_Exam_Test?: number
) {
  let params: any = { Course_Id, isLibrary,Module_ID,Section_ID ,Day_Id,Is_Exam_Test};
  params.is_Student = false;


  return this.http.get(`${environment.BasePath}course/Get_course_content_By_Day`, { params });
}


}

