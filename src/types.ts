
export type AuthView = 'login' | 'register' | 'forgot-password';

export type UserRole = 'super' | 'super_admin' | 'admin' | 'user' | 'guest';

export type UserStatus = 'active' | 'pending' | 'banned';

export interface User {
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  id?: number;
  role: UserRole;
  status?: UserStatus;
  avatar?: string;
  token?: string; // Added token for auth response
  created_at?: string;
  last_login?: string;
}

// Generic API Response wrapper
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export type DeviceStatus = 'normal' | 'warning' | 'critical' | 'offline';

export type IconType = 'blue' | 'cyan' | 'purple' | 'gray' | 'orange' | 'green';

export interface Device {
  id: string;
  name: string;
  location: string;
  currentTemp: number;
  humidity: number;
  status: DeviceStatus;
  lastUpdate: string;
  iconType?: IconType;
  icon?: string;
  maxTemp?: number;
  minTemp?: number;
  // backend fields
  device_id?: string;
  ip_address?: string;
  model?: string;
  firmware_version?: string;
  device_name?: string;
  message?: string;
  created_at?: string;
  updated_at?: string;
  last_active?: string;
}


export interface DeviceConfigurationItem {
  config_key: string;
  config_value: number;
  updated_at?: string;
}

export interface DeviceConfiguration {
  device_id: string;
  configurations: DeviceConfigurationItem[];
  calibration_value?: number;
  updated_at?: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  message: string;
  level: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export interface HistoryData {
  time: string;
  temp: number;
  humidity: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  userRole: UserRole;
  action: 'ADD' | 'DELETE' | 'CONFIG' | 'LOGIN' | 'OTHER';
  target: string;
  details: string;
  ip?: string;
  // raw backend fields
  operation_type?: string;
  user_id?: string | number;
}