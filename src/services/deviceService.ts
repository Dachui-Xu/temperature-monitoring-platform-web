import { apiClient } from './apiClient';
import type { Device, DeviceConfiguration } from '../types';

const normalizeStatus = (status: unknown): Device['status'] => {
  const value = String(status || '').toLowerCase();
  if (value === 'online') return 'normal';
  if (value === 'normal' || value === 'warning' || value === 'critical' || value === 'offline') return value;
  return 'offline';
};

const normalizeDevice = (item: any): Device => {
  const id = String(item?.device_id ?? item?.id ?? '');
  const name = item?.device_name || item?.name || id;
  return {
    id,
    name,
    location: item?.location || '',
    currentTemp: item?.currentTemp !== undefined ? Number(item.currentTemp) : Number(item?.current_temperature ?? item?.temperature ?? 0),
    humidity: item?.humidity !== undefined ? Number(item.humidity) : 0,
    status: normalizeStatus(item?.status),
    lastUpdate: item?.updated_at || item?.last_active || item?.lastUpdate || '',
    icon: item?.icon || 'thermometer',
    iconType: item?.iconType || 'gray',
    maxTemp: item?.maxTemp,
    minTemp: item?.minTemp,
    device_id: item?.device_id || id,
    ip_address: item?.ip_address,
    model: item?.model,
    firmware_version: item?.firmware_version,
    device_name: item?.device_name || name,
    message: item?.message,
    created_at: item?.created_at,
    updated_at: item?.updated_at,
    last_active: item?.last_active,
  };
};

const toDeviceList = (res: any): Device[] => {
  const rawList = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
  return Array.isArray(rawList) ? rawList.map(normalizeDevice) : [];
};

const toDevicePayload = (device: Partial<Device>) => {
  const payload: any = {
    device_id: device.device_id || device.id,
    device_name: device.device_name || device.name,
    model: device.model,
    firmware_version: device.firmware_version,
    location: device.location,
    status: device.status === 'normal' ? 'online' : device.status,
  };
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
  return payload;
};

export const deviceService = {
  /**
   * 获取所有设备列表
   */
  getAllDevices: async (): Promise<Device[]> => {
    try {
      // API 文档详细列出了 /devices/{device_id}；列表页需要后端提供常见的 GET /devices 分页/数组响应。
      const res = await apiClient.get<any>('/devices');
      return toDeviceList(res);
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
   * 根据设备 ID 获取设备详情
   */
  getDevice: async (id: string): Promise<Device> => {
    const res = await apiClient.get<any>(`/devices/${encodeURIComponent(id)}`);
    return normalizeDevice(res);
  },

  /**
   * 扫描网络中的新设备（API 文档未定义，失败时使用前端模拟发现结果）
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
   * 添加设备：POST /devices
   */
  addDevice: async (device: Partial<Device>): Promise<Device> => {
    const payload = toDevicePayload(device);
    await apiClient.post('/devices', payload);
    return normalizeDevice({
      ...device,
      ...payload,
      id: payload.device_id || device.id,
      lastUpdate: new Date().toISOString(),
    });
  },

  /**
   * 更新设备信息：PUT /devices/{device_id}
   */
  updateDevice: async (id: string, data: Partial<Device>): Promise<Device> => {
    const payload = toDevicePayload({ ...data, id });
    delete payload.device_id;
    const res = await apiClient.put<any>(`/devices/${encodeURIComponent(id)}`, payload);
    return normalizeDevice({
      ...data,
      ...payload,
      ...res,
      id,
      device_id: res?.device_id || id,
      lastUpdate: res?.updated_at || res?.last_active || new Date().toISOString(),
    });
  },

  /**
   * 删除设备：DELETE /devices/{device_id}
   */
  deleteDevice: async (id: string): Promise<void> => {
    await apiClient.delete(`/devices/${encodeURIComponent(id)}`);
  },

  /**
   * 获取设备配置：GET /device_configurations/{device_id}
   */
  getDeviceConfiguration: async (id: string): Promise<DeviceConfiguration> => {
    const res = await apiClient.get<any>(`/device_configurations/${encodeURIComponent(id)}`);
    return {
      device_id: res?.device_id || id,
      configurations: Array.isArray(res?.configurations) ? res.configurations : [],
      calibration_value: res?.calibration_value,
      updated_at: res?.updated_at,
    };
  },

  /**
   * 更新设备配置：PUT /device_configurations/{device_id}
   */
  updateDeviceConfiguration: async (id: string, configuration: DeviceConfiguration): Promise<void> => {
    await apiClient.put(`/device_configurations/${encodeURIComponent(id)}`, {
      configurations: configuration.configurations,
    });
  },

  /**
   * 设备校准：POST /device_configurations/{device_id}/calibrate
   */
  calibrateDevice: async (id: string, calibrationValue: number): Promise<DeviceConfiguration> => {
    const res = await apiClient.post<any>(`/device_configurations/${encodeURIComponent(id)}/calibrate`, {
      calibration_value: calibrationValue,
    });
    return {
      device_id: res?.device_id || id,
      configurations: [],
      calibration_value: res?.calibration_value ?? calibrationValue,
      updated_at: res?.updated_at,
    };
  },

  /**
   * 设备绑定：POST /user_devices/
   */
  bindDeviceToUser: async (userId: number, deviceId: string, permissions = 'read'): Promise<void> => {
    await apiClient.post('/user_devices/', {
      user_id: userId,
      device_id: deviceId,
      permissions,
    });
  },

  /**
   * 设备解绑：DELETE /user_devices/
   */
  unbindDeviceFromUser: async (userId: number, deviceId: string): Promise<void> => {
    await apiClient.delete('/user_devices/', {
      user_id: userId,
      device_id: deviceId,
    });
  },

  /**
   * 生成设备密钥：POST /device_keys/{device_id}?expires_days=...
   */
  generateDeviceKey: async (deviceId: string, expiresDays?: number): Promise<any> => {
    const qs = expiresDays ? `?expires_days=${encodeURIComponent(String(expiresDays))}` : '';
    return apiClient.post(`/device_keys/${encodeURIComponent(deviceId)}${qs}`);
  },

  getDeviceKey: async (deviceId: string): Promise<any> => {
    return apiClient.get(`/device_keys/${encodeURIComponent(deviceId)}`);
  },

  updateDeviceKey: async (deviceId: string, deviceKey: string): Promise<any> => {
    return apiClient.put(`/device_keys/${encodeURIComponent(deviceId)}`, { device_key: deviceKey });
  },

  revokeDeviceKey: async (deviceId: string): Promise<any> => {
    return apiClient.delete(`/device_keys/${encodeURIComponent(deviceId)}`);
  },
};
