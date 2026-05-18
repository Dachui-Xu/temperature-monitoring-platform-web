import { apiClient } from './apiClient';
import { Device } from '../types';

export const deviceService = {
  /**
   * 获取所有设备列表
   */
  getAllDevices: async (): Promise<Device[]> => {
    try {
      const res = await apiClient.get<any>('/devices');

      // 归一化后端可能的多种返回格式：
      // - 直接返回数组: Device[]
      // - 返回分页对象: { items: Device[], total }
      // - 返回包装 data: { data: Device[] }
      if (Array.isArray(res)) return res as Device[];
      if (res && Array.isArray(res.items)) return res.items as Device[];
      if (res && Array.isArray(res.data)) return res.data as Device[];

      // 如果返回单个对象或其它，尝试转换为单元素数组
      const rawList = Array.isArray(res) ? res : (res && res.items ? res.items : (res && res.data ? res.data : (res ? [res] : [])));
      const mapped: Device[] = (rawList as any[]).map(item => {
        // backend shape uses device_id, device_name, ip_address, firmware_version, last_active, etc.
        // Prefer device_id as the stable identifier when available
        const id = String(item.device_id ?? item.id ?? Math.random().toString(36).substr(2,9));
        const name = item.device_name || item.name || id;
        const status = (item.status && String(item.status)) || 'offline';
        return {
          id,
          name,
          location: item.location || '',
          currentTemp: (item.currentTemp !== undefined) ? Number(item.currentTemp) : 0,
          humidity: (item.humidity !== undefined) ? Number(item.humidity) : 0,
          status: (['normal','warning','critical','offline'].includes(status) ? (status as any) : 'offline'),
          // Prefer backend's `updated_at` as the authoritative "最后更新" 字段
          lastUpdate: item.updated_at || item.last_active || item.lastUpdate || '',
          icon: item.icon || 'thermometer',
          iconType: item.iconType || 'gray',
          maxTemp: item.maxTemp,
          minTemp: item.minTemp,
          // raw backend fields
          device_id: item.device_id || id,
          ip_address: item.ip_address,
          model: item.model,
          firmware_version: item.firmware_version,
          device_name: item.device_name,
          message: item.message,
          created_at: item.created_at,
          updated_at: item.updated_at,
          last_active: item.last_active
        } as Device;
      });

      // If backend returned empty list, return a virtual device for testing
      if (mapped.length === 0) {
        const vid = `V-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
        return [{
          id: vid,
          name: `测试设备-${vid}`,
          location: '测试楼 1F',
          currentTemp: 22.5,
          humidity: 45,
          status: 'normal',
          lastUpdate: '刚刚',
          icon: 'thermometer',
          iconType: 'gray',
          maxTemp: 30,
          minTemp: -10,
          device_id: vid,
          ip_address: '127.0.0.1',
          model: 'virtual',
          firmware_version: '0.0.0',
          device_name: `测试设备-${vid}`,
          message: '虚拟设备'
        } as Device];
      }

      return mapped;
    } catch (error) {
      console.warn('后端获取设备失败，返回模拟数据');
      // 模拟数据 Fallback
      return [
        { id: '1', name: '中心机房 A01', location: '1号楼 3F', currentTemp: 23.5, humidity: 45, status: 'normal', lastUpdate: '刚刚', icon: 'server', iconType: 'blue' },
        { id: '2', name: '冷链仓库 B02', location: '2号楼 B1', currentTemp: -18.2, humidity: 60, status: 'normal', lastUpdate: '2分钟前', icon: 'snowflake', iconType: 'cyan' },
        { id: '3', name: '生化实验室 C03', location: '3号楼 5F', currentTemp: 24.1, humidity: 52, status: 'warning', lastUpdate: '刚刚', icon: 'flask', iconType: 'purple' },
        { id: '4', name: '样本库 D04', location: '4号楼 1F', currentTemp: 4.0, humidity: 35, status: 'normal', lastUpdate: '5分钟前', icon: 'database', iconType: 'green' },
        { id: '5', name: '备用机房 E05', location: '5号楼 2F', currentTemp: 22.0, humidity: 40, status: 'offline', lastUpdate: '1小时前', icon: 'router', iconType: 'gray' },
      ];
    }
  },

  /**
   * 扫描网络中的新设备
   */
  scanDevices: async (): Promise<any[]> => {
    try {
      return await apiClient.post<any[]>('/devices/scan', {});
    } catch (error) {
      console.warn('扫描接口不可用，使用模拟数据');
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([
            { id: `IOT-${Math.floor(Math.random()*10000)}`, type: 'thermometer', name: '智能温度传感器 T1', signal: 95 },
            { id: `IOT-${Math.floor(Math.random()*10000)}`, type: 'snowflake', name: '冷链监控终端 Pro', signal: 70 },
            { id: `IOT-${Math.floor(Math.random()*10000)}`, type: 'droplet', name: '环境湿度计 Mini', signal: 45 },
          ]);
        }, 2000);
      });
    }
  },

  /**
   * 添加设备
   */
  addDevice: async (device: Partial<Device>): Promise<Device> => {
    // return await apiClient.post<Device>('/devices', device);
    
    // 模拟返回
    return new Promise(resolve => {
        setTimeout(() => resolve({
            ...device,
            id: device.id || Math.random().toString(36).substr(2,9),
            lastUpdate: '刚刚'
        } as Device), 500);
    });
  },

  /**
   * 更新设备信息
   */
  updateDevice: async (id: string, data: Partial<Device>): Promise<Device> => {
    try {
      // backend expects PUT /devices/{device_id} and returns the updated fields
      const payload: any = {
        device_name: (data as any).device_name || data.name,
        model: data.model,
        location: data.location,
        firmware_version: data.firmware_version,
        status: data.status,
      };
      const res = await apiClient.put<any>(`/devices/${encodeURIComponent(id)}`, payload);
      // map response back to Device
      const updated: Device = {
        id,
        name: res.device_name || (data as any).device_name || data.name || '',
        location: res.location || data.location || '',
        currentTemp: data.currentTemp ?? 0,
        humidity: data.humidity ?? 0,
        status: (res.status as any) || (data.status as any) || 'normal',
        // Prefer updated_at returned by backend as the authoritative lastUpdate
        lastUpdate: res.updated_at || res.last_active || new Date().toISOString(),
        icon: data.icon || 'thermometer',
        iconType: data.iconType || 'gray',
        maxTemp: data.maxTemp,
        minTemp: data.minTemp,
        device_id: res.device_id || id,
        ip_address: res.ip_address || data.ip_address,
        model: res.model || data.model,
        firmware_version: res.firmware_version || data.firmware_version,
        device_name: res.device_name || (data as any).device_name || data.name,
        message: res.message || data.message,
        created_at: res.created_at || data.created_at,
        updated_at: res.updated_at || data.updated_at,
        last_active: res.last_active || data.last_active
      };
      return updated;
    } catch (error) {
      console.error('更新设备失败', error);
      throw error;
    }
  },

  /**
   * 删除设备
   */
  deleteDevice: async (id: string): Promise<void> => {
    // return await apiClient.delete(`/devices/${id}`);
    return Promise.resolve();
  }
};
