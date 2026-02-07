export interface PaginationResponse<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
}

export interface ApiErrorResponse {
  message: string;
  status: number;
  instance: string;
  method: string;
  stack?: string;
  internalCode?: string;
  details?: object | null;
}
