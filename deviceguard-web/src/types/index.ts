export interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeviceDto {
  name: string;
  type: string;
  status?: string;
}

export interface UpdateDeviceDto {
  name?: string;
  type?: string;
  status?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}