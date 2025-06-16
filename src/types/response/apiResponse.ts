export interface PaginationMeta {
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Link[];
    next_page_url: any;
    path: string;
    per_page: number;
    prev_page_url: any;
    to: number;
    total: number;
  }
  
  export interface PaginatedData<T> extends PaginationMeta {
    data: T[];
  }
  
  export interface Link {
    url?: string;
    label: string;
    active: boolean;
  }
  
  export interface ApiResponse<T> {
    status: boolean;
    code: number;
    data: PaginatedData<T>;
    message: string;
  }
  
  export interface ResponseCreate {
    status: boolean;
    code: number;
    message: string;
  }
  