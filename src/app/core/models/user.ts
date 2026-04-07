export class user
{
User_ID:number;
First_Name:string;
Last_Name:string;
Email:string;
PhoneNumber:string;
Delete_Status:number;
User_Type_Id:number;
User_Role_Id:number;
User_Status:number;
Country_Code:string;
Country_Code_Name:string;
Course_Name:any
Registered_Date:any
constructor(values: Object = {})  
{
Object.assign(this, values) 
}
}