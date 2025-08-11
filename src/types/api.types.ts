export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenModel {
  bearerToken: string;
  refreshToken: string;
  expiresIn: string;
  me: UserResponse;
}

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isDriver: boolean;
  isDispatcher: boolean;
  isAdmin: boolean;
  workspaceId: number;
  depotId?: number;
}

export interface WorkspaceResponse {
  id: number;
  name: string;
  phoneNumber?: string;
  email?: string;
}