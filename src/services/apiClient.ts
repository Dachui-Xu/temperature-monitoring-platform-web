import type { ApiResponse } from '../types.js';

// 配置后端基础地址
// 如果您的后端所有接口都有 /api 前缀，请保留 /api
export const BASE_URL = 'http://127.0.0.1:1688';

// 定义通用的请求选项
interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * 封装的基础 Fetch 请求函数
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...customConfig } = options;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (storedToken || token) {
    Object.assign(defaultHeaders, {
      Authorization: `Bearer ${token || storedToken}`,
    });
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const responseText = await response.text();
    let json: any;
    try {
      json = responseText ? JSON.parse(responseText) : undefined;
    } catch (parseError) {
      if (response.ok) {
        throw parseError;
      }
      json = undefined;
    }

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        throw new Error('登录已过期，请重新登录');
      }
      throw new Error(json?.message || json?.detail || `请求失败: ${response.status}`);
    }

    // 204/205 或空响应体的成功请求没有 JSON 内容，直接返回 undefined。
    if (json === undefined) {
      return undefined as T;
    }

    // 如果后端使用包装格式 { code, message, data, success }
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      const resJson = json as ApiResponse<T>;
      if (resJson.success === false) {
        throw new Error(resJson.message || '操作失败');
      }
      return resJson.data;
    }

    // 非包装格式（例如 /users/login 返回 { access_token, token_type }），直接返回原始 JSON
    return json as T;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, data?: any, options?: RequestOptions) => {
    const body = data === undefined ? undefined : (typeof data === 'string' || data instanceof String) ? String(data) : JSON.stringify(data);
    return request<T>(url, { ...options, method: 'POST', body });
  },
  patch: <T>(url: string, data: any, options?: RequestOptions) => {
    const body = (typeof data === 'string' || data instanceof String) ? String(data) : JSON.stringify(data);
    return request<T>(url, { ...options, method: 'PATCH', body });
  },
  put: <T>(url: string, data: any, options?: RequestOptions) => {
    const body = (typeof data === 'string' || data instanceof String) ? String(data) : JSON.stringify(data);
    return request<T>(url, { ...options, method: 'PUT', body });
  },

  delete: <T>(url: string, data?: any, options?: RequestOptions) => {
    const body = data === undefined ? undefined : JSON.stringify(data);
    return request<T>(url, { ...options, method: 'DELETE', body });
  },
};
