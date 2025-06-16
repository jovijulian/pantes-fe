export interface Root {
    data: Data;
    message: string;
    status: number;
  }
  
  export interface Data {
    token: string;
    user: User;
  }
  
  export interface User {
    id: number;
    email: string;
    username: string;
    roleId: number;
    roleName: string;
    companyId: number;
    divisionId: number;
    divisionName: string;
    isThech: any;
    isReset: number;
    user_id: number;
    createdAt: string;
    createdBy: number;
  }
  