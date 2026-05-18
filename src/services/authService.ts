import { apiClient } from './apiClient';
import type { AuditLog, User } from '../types';
import { AVATAR_PRESETS } from '../assets/localImages';

interface LoginParams {
  username: string;
  password?: string;
}

interface RegisterParams {
  username: string;
  email?: string;
  phone?: string;
  password: string;
}

interface UserListResponse {
  total?: number;
  items?: User[];
}

const normalizeUser = (user: any): User => ({
  ...user,
  id: user?.id ?? user?.user_id,
  username: user?.username ?? '',
  role: user?.role ?? 'user',
  status: user?.status ?? 'active',
});

const toUserArray = (res: User[] | UserListResponse | any): User[] => {
  if (Array.isArray(res)) return res.map(normalizeUser);
  if (Array.isArray(res?.items)) return res.items.map(normalizeUser);
  if (Array.isArray(res?.data)) return res.data.map(normalizeUser);
  return [];
};

export const authService = {
  /**
   * 用户登录
   */
  login: async (params: LoginParams): Promise<User> => {
    try {
      // API设计.md 1.3：POST /users/login，JSON 请求体 { username, password }
      const loginRes = await apiClient.post<any>('/users/login', {
        username: params.username,
        password: params.password || '',
      });

      const token = loginRes?.access_token || loginRes?.token || loginRes?.data?.access_token || loginRes?.data?.token;
      if (!token) {
        throw new Error('登录失败：未收到访问令牌');
      }

      // 存储 token，后续请求会自动从 localStorage 取
      try {
        localStorage.setItem('auth_token', token);
      } catch (e) {
        console.warn('无法写入 localStorage auth_token', e);
      }

      // API设计.md 1.4：GET /users/self 获取当前用户信息
      const user = await apiClient.get<User>('/users/self');
      if (!user) throw new Error('登录失败：获取用户信息失败');
      return { ...normalizeUser(user), token };
    } catch (error) {
      console.warn('后端连接失败，使用模拟登录逻辑 (仅供开发测试)');
      
      // --- 模拟逻辑 Fallback ---
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const { username, password } = params;
          if (username === 'super' && (password === '123456' || password === 'super')) {
            resolve({ 
              username: 'super', 
              role: 'super', 
              token: 'mock-token-super', 
              // 使用本地 assets 文件夹中的头像 4 (管理员风格)
              avatar: AVATAR_PRESETS[3].src, 
              email: 'super@admin.com' 
            });
          } else if ((username === 'admin' || username === 'lalala') && (password === 'admin' || password === 'lalala')) {
            resolve({ 
              username: 'admin', 
              role: 'admin', 
              token: 'mock-token-admin', 
              // 使用本地 assets 文件夹中的头像 5 (研究员风格)
              avatar: AVATAR_PRESETS[4].src, 
              email: 'admin@system.com' 
            });
          } else if (username === 'user110' && password === '110') {
             resolve({ 
               username: 'user110', 
               role: 'user', 
               token: 'mock-token-user', 
               avatar: AVATAR_PRESETS[0].src,
               email: 'user110@example.com' 
             });
          } else if (username && password && password.length >= 3) {
             const role = username.includes('admin') ? 'admin' : 'user';
             resolve({ 
               username, 
               role, 
               token: `mock-token-${username}`, 
               avatar: AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)].src,
               email: `${username}@test.com` 
             });
          } else {
             reject(new Error('用户名或密码错误'));
          }
        }, 500);
      });
    }
  },

  /**
   * 用户注册
   */
  register: async (params: RegisterParams): Promise<any> => {
    try {
      // API设计.md 1.1：POST /users 提交注册申请
      return await apiClient.post('/users', params);
    } catch (error) {
      console.error('注册失败', error);
      const err: any = error;
      const msg = err?.message || '';
      if (msg.includes('409')) {
        throw new Error('该用户名已注册');
      }
      throw error;
    }
  },

  /**
   * 访客登录（API 文档未定义该接口，后端不可用时保留前端只读大屏回退）
   */
  guestLogin: async (): Promise<User> => {
    try {
      return normalizeUser(await apiClient.post<User>('/users/guest-login', {}));
    } catch (error) {
      return {
        username: '访客用户',
        role: 'guest',
        status: 'active',
        token: 'guest-token',
        avatar: AVATAR_PRESETS[5].src // 访客头像
      };
    }
  },
  
  /**
   * 获取当前用户信息
   */
  getCurrentUser: async (): Promise<User> => {
    return normalizeUser(await apiClient.get<User>('/users/self'));
  },
  /**
   * 更新当前用户基础信息（例如 email / phone / avatar）
   */
  updateCurrentUser: async (data: Partial<User>, verifyPassword?: string): Promise<User> => {
    try {
      const current = await authService.getCurrentUser();
      if (!current.id) throw new Error('无法更新用户信息：当前用户缺少 ID');
      const payload: any = {
        username: data.username,
        email: data.email,
        phone: data.phone,
        status: data.status,
        verify_password: verifyPassword,
      };
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
      await apiClient.put(`/users/${current.id}`, payload);
      return normalizeUser({ ...current, ...payload });
    } catch (error) {
      console.warn('更新当前用户信息失败', error);
      throw error;
    }
  },
  /** 管理员：获取用户列表（分页支持） */
  getUsers: async (page = 1, size = 100): Promise<User[]> => {
    try {
      // API设计.md 1.5/1.11：GET /users?page=&size=
      const res: any = await apiClient.get(`/users?page=${page}&size=${size}`);
      return toUserArray(res);
    } catch (error) {
      console.warn('获取用户列表失败，使用空列表回退', error);
      return [];
    }
  },

  /** 管理员：重置指定用户密码（接口：POST /users/{user_id}/password） */
  resetUserPassword: async (userId: number, adminPassword?: string): Promise<void> => {
    try {
      const payload = adminPassword ? { admin_password: adminPassword } : {};
      await apiClient.post(`/users/${userId}/password`, payload);
    } catch (error) {
      console.error('重置用户密码失败', error);
      throw error;
    }
  },

  /** 管理员：修改指定用户角色（接口：PATCH /users/{user_id}/role） */
  changeUserRole: async (userId: number, role: string, adminPassword?: string): Promise<void> => {
    try {
      const payload: any = { role };
      if (adminPassword) payload.admin_password = adminPassword;
      await apiClient.patch(`/users/${userId}/role`, payload);
    } catch (error) {
      console.error('修改用户角色失败', error);
      throw error;
    }
  },

  /** 管理员：修改指定用户状态（接口：PATCH /users/{user_id}/status） */
  changeUserStatus: async (userId: number, status: string, adminPassword?: string): Promise<void> => {
    try {
      const payload: any = { user_status: status };
      if (adminPassword) payload.admin_password = adminPassword;
      await apiClient.patch(`/users/${userId}/status`, payload);
    } catch (error) {
      console.error('修改用户状态失败', error);
      throw error;
    }
  },

  /** 管理员：删除指定用户（接口：DELETE /users/{user_id}） */
  deleteUser: async (userId: number): Promise<void> => {
    try {
      await apiClient.delete(`/users/${userId}`);
    } catch (error) {
      console.error('删除用户失败', error);
      throw error;
    }
  },
  /** 获取操作日志（兼容后端 /logs 接口） */
  getOperationLogs: async (opts?: { operation_type?: string; target_id?: string; user_id?: string | number; start_time?: string; end_time?: string; page?: number; page_size?: number; size?: number }): Promise<{ total: number; items: AuditLog[] }> => {
    try {
      const qs = new URLSearchParams();
      if (opts?.operation_type) qs.append('operation_type', opts.operation_type);
      if (opts?.target_id) qs.append('target_id', String(opts.target_id));
      if (opts?.user_id) qs.append('user_id', String(opts.user_id));
      if (opts?.start_time) qs.append('start_time', opts.start_time);
      if (opts?.end_time) qs.append('end_time', opts.end_time);
      if (opts?.page) qs.append('page', String(opts.page));
      qs.append('size', String(opts?.size ?? opts?.page_size ?? 20));
      const endpoint = `/logs${qs.toString() ? ('?' + qs.toString()) : ''}`;
      const res: any = await apiClient.get(endpoint);
      // 后端返回形如 { total: N, items: [ { log_id, user_id, username, operation_type, operation_detail, target_id, ip_address, created_at } ] }
      const total = res?.total ?? 0;
      const itemsRaw = Array.isArray(res) ? res : (res?.items ?? []);
      const items: AuditLog[] = (itemsRaw as any[]).map(r => ({
        id: String(r.log_id ?? r.id ?? ''),
        timestamp: r.created_at || r.timestamp || '',
        username: String(r.username ?? r.user_id ?? ''),
        user_id: r.user_id ?? undefined,
        userRole: (r.user_role as any) ?? 'user',
        action: ((): any => {
          const t = String(r.operation_type || '').toUpperCase();
          if (t.includes('CREATE') || t.includes('REGISTER')) return 'ADD';
          if (t.includes('DELETE') || t.includes('REVOKE')) return 'DELETE';
          if (t.includes('LOGIN')) return 'LOGIN';
          if (t.includes('UPDATE') || t.includes('MODIFY') || t.includes('CONFIG') || t.includes('CALIBRATE')) return 'CONFIG';
          return 'OTHER';
        })(),
        operation_type: r.operation_type || r.action || undefined,
        target: r.target_id || r.target || '',
        details: r.operation_detail || r.details || '',
        ip: r.ip_address || r.ip || undefined,
      }));
      return { total, items };
    } catch (error) {
      console.warn('获取操作日志失败，返回空结果', error);
      return { total: 0, items: [] };
    }
  },
  /**
   * 修改当前用户密码
   * 后端接口：POST /users/self/password，请求体 { old_password, new_password }
   */
  changeCurrentUserPassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      await apiClient.post<void>('/users/self/password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
    } catch (error) {
      console.error('修改密码失败', error);
      throw error;
    }
  }
};
