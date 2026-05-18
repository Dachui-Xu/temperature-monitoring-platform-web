import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Settings, Trash2, RefreshCw, LayoutGrid, List, MapPin, Clock, 
  Wifi, Radio, ArrowRight, Signal, CheckCircle2, FlaskConical, PenTool,
  Thermometer, Server, Snowflake, Box, Droplet, Wind, Zap, Activity, Archive, Database, 
  Cpu, HardDrive, Home, Building, Building2, Factory, Warehouse, Shield, Lock, 
  AlertTriangle, Sun, Cloud, Moon, Battery, Router, Printer, Webcam, Speaker, Tv, Loader2
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Device } from '../../types';
import { Modal } from '../Modal';
import { deviceService } from '../../services/deviceService';

interface DeviceManagerProps {
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  currentUserRole: string;
  onLog: (action: 'ADD' | 'DELETE' | 'CONFIG', target: string, details: string) => void;
}

// 1. Icon Map Definition
const ICON_MAP: Record<string, React.ElementType> = {
  'thermometer': Thermometer,
  'server': Server,
  'snowflake': Snowflake,
  'flask': FlaskConical,
  'box': Box,
  'droplet': Droplet,
  'wind': Wind,
  'zap': Zap,
  'activity': Activity,
  'wifi': Wifi,
  'archive': Archive,
  'database': Database,
  'cpu': Cpu,
  'hard-drive': HardDrive,
  'router': Router,
  'home': Home,
  'building': Building,
  'building-2': Building2,
  'factory': Factory,
  'warehouse': Warehouse,
  'shield': Shield,
  'lock': Lock,
  'alert': AlertTriangle,
  'sun': Sun,
  'cloud': Cloud,
  'moon': Moon,
  'battery': Battery,
  'printer': Printer,
  'webcam': Webcam,
  'speaker': Speaker,
  'tv': Tv
};

export const DeviceManager: React.FC<DeviceManagerProps> = ({ devices, setDevices, currentUserRole, onLog }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Scanner State
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [foundDevices, setFoundDevices] = useState<any[]>([]);

  // Edit/Config Form State
  const [editForm, setEditForm] = useState<{
    // frontend-friendly fields
    id: string;
    name: string;
    location: string;
    icon: string; // Icon Key
    iconType: 'blue' | 'cyan' | 'purple' | 'gray' | 'orange' | 'green';
    maxTemp: string;
    minTemp: string;
    pushEnabled: boolean;
    // backend fields
    device_id?: string;
    ip_address?: string;
    model?: string;
    firmware_version?: string;
    message?: string;
    created_at?: string;
    updated_at?: string;
    last_active?: string;
  }>({
    name: '',
    location: '',
    id: '',
    icon: 'thermometer',
    iconType: 'blue',
    maxTemp: '30',
    minTemp: '-10',
    pushEnabled: true
  });

  const filteredDevices = devices.filter(d => {
    const name = (d.name || '').toString();
    const location = (d.location || '').toString();
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' ? true : d.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除设备 "${name}" 吗? 此操作不可恢复。`)) {
      try {
        await deviceService.deleteDevice(id);
        setDevices(devices.filter(d => d.id !== id));
        onLog('DELETE', name, `设备 ID: ${id} 被移除`);
      } catch (err) {
        alert('删除失败，请检查后端连接');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await deviceService.getAllDevices();
      setDevices(data);
    } catch(e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const startScan = async () => {
    setScanStatus('scanning');
    setFoundDevices([]);
    try {
      const results = await deviceService.scanDevices();
      setFoundDevices(results);
      setScanStatus('results');
    } catch (e) {
      setScanStatus('results'); // Even if fail, show empty or whatever mock returned
    }
  };

  useEffect(() => {
    if (isAddModalOpen) {
      startScan();
    } else {
      setScanStatus('idle');
    }
  }, [isAddModalOpen]);

  const handleConnectFoundDevice = async (foundDev: any) => {
    const newDevicePayload: Partial<Device> = {
      id: foundDev.id,
      name: foundDev.name,
      location: '未分配位置',
      currentTemp: 24.5,
      humidity: 50,
      status: 'normal',
      icon: foundDev.type,
      iconType: 'blue',
      maxTemp: 30,
      minTemp: -10
    };

    try {
      const addedDevice = await deviceService.addDevice(newDevicePayload);
      setDevices(prev => [...prev, addedDevice]);
      onLog('ADD', addedDevice.name, `通过自动扫描添加设备 ${addedDevice.id}`);
      setIsAddModalOpen(false);
    } catch (e) {
      alert('添加设备失败');
    }
  };

  const handleAddVirtualDevice = async () => {
    const id = Math.random().toString(36).substr(2, 6).toUpperCase();
    const floors = ['1号楼', '2号楼', '3号楼', '冷链区', '实验室'];
    const floor = floors[Math.floor(Math.random() * floors.length)];
    const room = Math.floor(Math.random() * 500) + 100;
    
    const newVirtualDevice: Partial<Device> = {
      id: `V-${id}`,
      name: `测试设备-${id}`,
      location: `${floor} ${room}室`,
      currentTemp: Number((Math.random() * 40 - 10).toFixed(1)),
      humidity: Math.floor(Math.random() * 60) + 20,
      status: Math.random() > 0.8 ? 'warning' : 'normal',
      icon: 'wifi',
      iconType: 'gray',
      maxTemp: 30,
      minTemp: -10
    };
    
    try {
      const added = await deviceService.addDevice(newVirtualDevice);
      setDevices(prev => [added, ...prev]);
      onLog('ADD', added.name, `添加虚拟测试设备, ID: ${added.id}`);
    } catch(e) {
      console.error("Failed to add virtual device");
    }
  };

  const resetAddModal = () => {
    setIsAddModalOpen(false);
  };

  const openConfig = (device: Device) => {
    // use a shallow copy so editing selectedDevice doesn't mutate the source in devices array
    setSelectedDevice({ ...device });
    setEditForm({
      id: device.id || '',
      name: device.name || (device.device_name || ''),
      location: device.location || '',
      icon: device.icon || 'thermometer',
      iconType: device.iconType || 'blue',
      maxTemp: device.maxTemp?.toString() || '30',
      minTemp: device.minTemp?.toString() || '-10',
      pushEnabled: true,
      device_id: device.device_id || device.id || '',
      ip_address: device.ip_address || '',
      model: device.model || '',
      firmware_version: device.firmware_version || '',
      message: device.message || '',
      created_at: device.created_at || '',
      updated_at: device.updated_at || '',
      last_active: device.last_active || ''
    });
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async () => {
    if (selectedDevice) {
      const payload: Partial<any> = {
        device_name: editForm.name,
        model: editForm.model,
        location: editForm.location,
        firmware_version: editForm.firmware_version,
        status: selectedDevice.status
      };
      try {
        const targetId = (selectedDevice as any).device_id || (selectedDevice as any).id || editForm.device_id || editForm.id;
          const result = await deviceService.updateDevice(String(targetId), payload as any);

          // update the correct device by matching device_id (preferred) or id
          const updatedDevices = devices.map(d => {
            const key = (d as any).device_id || d.id;
            if (String(key) === String(targetId)) {
              return { ...d, ...result };
            }
            return d;
          });
          setDevices(updatedDevices);
        onLog('CONFIG', editForm.name, `更新配置: ID=${selectedDevice.id}`);
        setIsConfigModalOpen(false);
      } catch (e) {
        alert('更新失败');
      }
    }
  };

  const getIconStyles = (type: string | undefined, name?: string) => {
    const nm = name || '';
    const colorType = type || (nm.includes('冷链') ? 'cyan' : nm.includes('生化') ? 'purple' : 'blue');
    switch (colorType) {
      case 'cyan': return 'bg-cyan-50 text-cyan-600';
      case 'purple': return 'bg-purple-50 text-purple-600';
      case 'orange': return 'bg-orange-50 text-orange-600';
      case 'green': return 'bg-green-50 text-green-600';
      case 'gray': return 'bg-gray-100 text-gray-600';
      default: return 'bg-blue-50 text-blue-600';
    }
  };

  const renderDeviceIcon = (iconKey: string | undefined, className = "h-5 w-5") => {
    const IconComp = ICON_MAP[iconKey || 'thermometer'] || Thermometer;
    return <IconComp className={className} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Input 
              placeholder="搜索设备名称或位置..." 
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-gray-200 focus:border-brand-500 focus:ring-brand-500"
            />
          </div>
          <div className="relative w-32 sm:w-40">
            <select 
              className="h-full w-full rounded-lg border border-gray-200 bg-gray-50 py-0 pl-3 pr-8 text-sm font-medium text-gray-700 focus:border-brand-500 focus:ring-brand-500 hover:bg-gray-100 transition-colors cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">所有状态</option>
              <option value="normal">运行中</option>
              <option value="warning">温度异常</option>
              <option value="offline">离线</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 items-center">
           <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}><LayoutGrid className="h-4 w-4" /></button>
          </div>
          <Button variant="outline" className="hidden md:flex" onClick={handleRefresh} disabled={isRefreshing}><RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />刷新</Button>
          <>
            <Button variant="outline" onClick={handleAddVirtualDevice} className="hidden sm:flex hover:bg-purple-50 hover:text-purple-600"><FlaskConical className="h-4 w-4 mr-2" />测试</Button>
            {(currentUserRole === 'admin' || currentUserRole === 'super_admin') && (
              <Button onClick={() => setIsAddModalOpen(true)} className="shadow-md"><Plus className="h-4 w-4 mr-2" />添加设备</Button>
            )}
          </>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">设备ID</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">设备信息</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">实时读数</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">状态</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">最后更新</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">操作</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredDevices.map((device, idx) => (
                  <tr key={device.device_id || device.id || `dev-${idx}`} className="hover:bg-gray-50/80 transition-colors cursor-default">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{device.device_id || device.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm ${getIconStyles(device.iconType, device.name)}`}>
                          {renderDeviceIcon(device.icon, "h-5 w-5")}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{device.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center"><MapPin className="h-3 w-3 mr-1" />{device.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-baseline">
                        {device.status === 'offline' ? (
                          <span className="text-lg font-bold text-gray-500">--</span>
                        ) : (
                          <>
                            <span className={`text-lg font-bold ${device.status === 'warning' ? 'text-red-600' : 'text-gray-900'}`}>{(device.currentTemp ?? 0).toFixed(1)}</span>
                            <span className="text-xs text-gray-500 ml-1 font-medium">°C</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${device.status === 'normal' ? 'bg-green-50 text-green-700 border-green-100' : device.status === 'warning' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {device.status === 'normal' ? '运行中' : device.status === 'warning' ? '温度异常' : '离线'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{device.lastUpdate ? ((): any => { try { return new Date(device.lastUpdate).toLocaleString(); } catch { return device.lastUpdate; } })() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openConfig(device)} className="text-gray-400 hover:text-brand-600 p-2 rounded-lg hover:bg-gray-100"><Settings className="h-4 w-4" /></button>
                        {(currentUserRole === 'admin' || currentUserRole === 'super_admin') && (
                          <button onClick={(e) => handleDelete(device.id, device.name, e)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.map((device, idx) => (
            <div key={device.device_id || device.id || `dev-grid-${idx}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-brand-200 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${getIconStyles(device.iconType, device.name)}`}>
                   {renderDeviceIcon(device.icon, "h-6 w-6")}
                </div>
                <div className="flex space-x-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-md border ${device.status === 'normal' ? 'bg-green-50 text-green-700 border-green-100' : device.status === 'warning' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {device.status === 'normal' ? '正常' : device.status === 'warning' ? '异常' : '离线'}
                  </span>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{device.name}</h3>
              <div className="flex items-center text-xs text-gray-500 mt-1 mb-5"><MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" /> {device.location}</div>
              <div className="flex items-baseline mb-5">
                <span className={`text-4xl font-bold tracking-tight ${device.status === 'warning' ? 'text-red-600' : 'text-gray-900'}`}>{(device.currentTemp ?? 0).toFixed(1)}</span>
                <span className="text-sm text-gray-500 ml-1 font-medium">°C</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-500">
                <span className="flex items-center font-mono"><Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" /> {device.lastUpdate}</span>
                <div className="flex space-x-1">
                  <button onClick={() => openConfig(device)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-brand-600"><Settings className="h-4 w-4" /></button>
                  {(currentUserRole === 'admin' || currentUserRole === 'super_admin') && (
                    <button onClick={(e) => handleDelete(device.id, device.name, e)} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scanning Modal - Replaces Manual Add */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={resetAddModal}
        title="设备自动发现"
        footer={<Button variant="ghost" onClick={resetAddModal}>关闭</Button>}
      >
        <div className="flex flex-col items-center justify-center py-6 min-h-[300px]">
           {scanStatus === 'scanning' && (
             <div className="flex flex-col items-center animate-in fade-in duration-500">
               <div className="relative mb-8">
                 <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center animate-pulse">
                   <Wifi className="h-10 w-10 text-brand-600" />
                 </div>
                 <div className="absolute inset-0 border-4 border-brand-200 rounded-full animate-ping opacity-75"></div>
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">正在扫描局域网设备...</h3>
               <p className="text-sm text-gray-500">请确保传感器设备已开启并处于配对模式</p>
             </div>
           )}

           {scanStatus === 'results' && (
             <div className="w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
               <div className="flex items-center justify-between mb-4 px-1">
                 <h4 className="font-semibold text-gray-900">发现 {foundDevices.length} 个新设备</h4>
                 <button onClick={startScan} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center">
                   <RefreshCw className="h-3 w-3 mr-1" /> 重新扫描
                 </button>
               </div>
               
               <div className="space-y-3">
                 {foundDevices.map((dev, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-brand-200 hover:bg-white hover:shadow-sm transition-all">
                     <div className="flex items-center space-x-3">
                       <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 text-gray-600">
                         {renderDeviceIcon(dev.type)}
                       </div>
                       <div>
                         <div className="font-medium text-gray-900">{dev.name}</div>
                         <div className="flex items-center text-xs text-gray-500 mt-0.5">
                           <span className="font-mono mr-2">ID: {dev.id}</span>
                           <span className="flex items-center text-green-600"><Signal className="h-3 w-3 mr-1" />{dev.signal}%</span>
                         </div>
                       </div>
                     </div>
                     <Button size="sm" onClick={() => handleConnectFoundDevice(dev)}>
                       连接设备
                     </Button>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      </Modal>

      {/* Device Config Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="设备详情与配置"
        footer={
           <div className="flex w-full justify-between items-center">
             {(currentUserRole === 'admin' || currentUserRole === 'super_admin') && (
                <button onClick={(e) => { if (selectedDevice) handleDelete(selectedDevice.id, selectedDevice.name, e as any); setIsConfigModalOpen(false); }} className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center"><Trash2 className="h-4 w-4 mr-2" />删除设备</button>
             )}
             <Button variant="primary" onClick={handleSaveConfig}>保存配置变更</Button>
           </div>
        }
      >
        {selectedDevice && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center shadow-sm border border-gray-100 ${
                  editForm.iconType === 'blue' ? 'bg-blue-50 text-blue-600' :
                  editForm.iconType === 'cyan' ? 'bg-cyan-50 text-cyan-600' :
                  editForm.iconType === 'purple' ? 'bg-purple-50 text-purple-600' :
                  editForm.iconType === 'orange' ? 'bg-orange-50 text-orange-600' :
                  editForm.iconType === 'green' ? 'bg-green-50 text-green-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {renderDeviceIcon(editForm.icon, "h-6 w-6")}
                </div>
                <div>
                   <h4 className="font-bold text-gray-900">{editForm.name}</h4>
                   <p className="text-sm text-gray-500">ID: {editForm.id}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="设备名称" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                <Input label="设备 ID" value={editForm.device_id || editForm.id} readOnly />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="IP 地址" value={editForm.ip_address || ''} readOnly />
                <Input label="固件版本" value={editForm.firmware_version || ''} readOnly />
              </div>
              <Input label="位置信息" value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} />
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input label="型号" value={editForm.model || ''} onChange={(e) => setEditForm({...editForm, model: e.target.value})} />
                <div>
                  <label className="block text-sm font-medium text-gray-700">状态</label>
                  <select value={(selectedDevice && selectedDevice.status) || 'normal'} onChange={(e) => setSelectedDevice(prev => prev ? ({ ...prev, status: e.target.value as any }) : prev)} className="w-full rounded-lg border border-gray-300 p-2 mt-1">
                    <option value="normal">运行中</option>
                    <option value="warning">温度异常</option>
                    <option value="offline">离线</option>
                  </select>
                </div>
              </div>
              
              {/* ICON SELECTOR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择图标</label>
                <div className="grid grid-cols-6 gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50/50 max-h-40 overflow-y-auto">
                  {Object.keys(ICON_MAP).map((iconKey) => {
                     const IconComp = ICON_MAP[iconKey];
                     return (
                       <button
                         key={iconKey}
                         type="button"
                         onClick={() => setEditForm({...editForm, icon: iconKey})}
                         className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                           editForm.icon === iconKey 
                             ? 'bg-white shadow-sm ring-2 ring-brand-500 text-brand-600' 
                             : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                         }`}
                         title={iconKey}
                       >
                         <IconComp className="h-5 w-5" />
                       </button>
                     )
                  })}
                </div>
              </div>

              {/* COLOR SELECTOR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">图标主题色</label>
                <div className="flex gap-2">
                  {[
                    { id: 'blue', class: 'bg-blue-500' },
                    { id: 'cyan', class: 'bg-cyan-500' },
                    { id: 'purple', class: 'bg-purple-500' },
                    { id: 'orange', class: 'bg-orange-500' },
                    { id: 'green', class: 'bg-green-500' },
                    { id: 'gray', class: 'bg-gray-500' },
                  ].map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setEditForm({...editForm, iconType: color.id as any})}
                      className={`h-8 w-8 rounded-full ${color.class} transition-transform ${editForm.iconType === color.id ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'hover:scale-105 opacity-80'}`}
                      type="button"
                    />
                  ))}
                </div>
              </div>

              {/* THRESHOLDS */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">报警阈值上限 (°C)</label>
                  <input type="number" className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-brand-500 focus:ring-brand-500" value={editForm.maxTemp} onChange={(e) => setEditForm({...editForm, maxTemp: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">报警阈值下限 (°C)</label>
                  <input type="number" className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-brand-500 focus:ring-brand-500" value={editForm.minTemp} onChange={(e) => setEditForm({...editForm, minTemp: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Empty State */}
      {filteredDevices.length === 0 && (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-200 border-dashed">
          <div className="mx-auto h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4"><Search className="h-6 w-6" /></div>
          <h3 className="text-base font-semibold text-gray-900">未找到符合条件的设备</h3>
          <p className="mt-1 text-sm text-gray-500">请尝试调整搜索关键词或清除筛选条件</p>
          <Button variant="outline" className="mt-4" onClick={() => {setSearchTerm(''); setFilter('all');}}>清除筛选</Button>
        </div>
      )}
    </div>
  );
};
