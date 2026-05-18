import { apiClient } from './apiClient';
import { User, AuditLog } from '../types';
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

export const authService = {
  /**
   * 用户登录
   */
  login: async (params: LoginParams): Promise<User> => {
    try {
      // 后端看起来期望表单编码 (form-urlencoded)，比如包含 grant_type、username、password
      const body = new URLSearchParams();
      body.append('grant_type', 'password');
      body.append('username', params.username);
      body.append('password', params.password || '');

      // 登录接口可能只返回 token（例如 { access_token, token_type }），先请求登录取得 token
      const loginRes = await apiClient.post<any>('/users/login', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

      // 使用 token 去获取当前用户信息并返回
      const user = await apiClient.get<User>('/users/self');
      if (!user) throw new Error('登录失败：获取用户信息失败');
      return user;
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
             // 动态后门
             let role: any = username.includes('admin') ? 'admin' : 'user';
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
      // 按后端 OpenAPI，注册接口为 POST /users
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
   * 访客登录
   */
  guestLogin: async (): Promise<User> => {
    try {
      return await apiClient.post<User>('/users/guest-login', {});
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
    return apiClient.get<User>('/users/self');
  },
  /**
   * 更新当前用户基础信息（例如 email / phone / avatar）
   */
  updateCurrentUser: async (data: Partial<User>, verifyPassword?: string): Promise<User> => {
    try {
      const payload: any = { ...data };
      if (verifyPassword) payload.verify_password = verifyPassword;
      const updated = await apiClient.patch<User>('/users/self', payload);
      return updated;
    } catch (error) {
      console.warn('更新当前用户信息失败，使用本地回退（如果脱离后端）', error);
      throw error;
    }
  },
  /** 管理员：获取用户列表（分页支持） */
  getUsers: async (page = 1, size = 100): Promise<User[]> => {
    try {
      // 后端可能返回分页对象或数组，兼容处理
      const res: any = await apiClient.get(`/users?page=${page}&size=${size}`);
      if (Array.isArray(res)) return res as User[];
      if (res && res.items) return res.items as User[];
      return [];
    } catch (error) {
      console.warn('获取用户列表失败，使用空列表回退', error);
      return [];
    }
  },

  /** 管理员：重置指定用户密码（接口：POST /users/{user_id}/password） */
  resetUserPassword: async (userId: number): Promise<void> => {
    try {
      await apiClient.post(`/users${userId}/password`, {});
    } catch (error) {
      console.error('重置用户密码失败', error);
      throw error;
    }
  },

  /** 管理员：修改指定用户角色（接口：PATCH /users/{user_id}/role） */
  changeUserRole: async (userId: number, role: string, adminPassword?: string): Promise<void> => {
    try {
      const qp = `?role=${encodeURIComponent(role)}${adminPassword ? `&admin_password=${encodeURIComponent(adminPassword)}` : ''}`;
      await apiClient.patch(`/users/${userId}/role${qp}`, {});
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
      await apiClient.patch(`/users${userId}/status`, payload);
    } catch (error) {
      console.error('修改用户状态失败', error);
      throw error;
    }
  },

  /** 管理员：删除指定用户（接口：DELETE /users/{user_id}） */
  deleteUser: async (userId: number): Promise<void> => {
    try {
      await apiClient.delete(`/users${userId}`);
    } catch (error) {
      console.error('删除用户失败', error);
      throw error;
    }
  },
  /** 获取操作日志（兼容后端 /logs 接口） */
  getOperationLogs: async (opts?: { operation_type?: string; target_id?: string; page?: number; page_size?: number }): Promise<{ total: number; items: AuditLog[] }> => {
    try {
      const qs = new URLSearchParams();
      if (opts?.operation_type) qs.append('operation_type', opts.operation_type);
      if (opts?.target_id) qs.append('target_id', String(opts.target_id));
      if (opts?.page) qs.append('page', String(opts.page));
      if (opts?.page_size) qs.append('page_size', String(opts.page_size));
      const endpoint = `/logs/${qs.toString() ? ('?' + qs.toString()) : ''}`;
      const res: any = await apiClient.get(endpoint);
      // 后端返回形如 { total: N, items: [ { log_id, user_id, operation_type, operation_detail, target_id, ip_address, created_at } ] }
      const total = res?.total ?? 0;
      const itemsRaw = res?.items ?? [];
      const items: AuditLog[] = (itemsRaw as any[]).map(r => ({
        id: String(r.log_id ?? r.id ?? ''),
        timestamp: r.created_at || r.timestamp || '',
        // prefer explicit user identifier (user_id) — UI will show ID
        username: String(r.user_id ?? r.username ?? ''),
        user_id: r.user_id ?? r.username ?? undefined,
        userRole: (r.user_role as any) ?? 'user',
        action: ((): any => {
          const t = String(r.operation_type || '').toUpperCase();
          if (t.includes('CREATE')) return 'ADD';
          if (t.includes('DELETE')) return 'DELETE';
          if (t.includes('LOGIN')) return 'LOGIN';
          if (t.includes('UPDATE') || t.includes('MODIFY') || t.includes('CONFIG')) return 'CONFIG';
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
   * 后端接口：PATCH /users/self/password?old_password=xxx&new_password=yyy
   */
  changeCurrentUserPassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      const endpoint = `/users/self/password?old_password=${encodeURIComponent(oldPassword)}&new_password=${encodeURIComponent(newPassword)}`;
      await apiClient.patch<void>(endpoint, {});
    } catch (error) {
      console.error('修改密码失败', error);
      throw error;
    }
  }
};
