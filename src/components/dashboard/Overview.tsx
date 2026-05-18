import React, { useState } from 'react';
import { Thermometer, AlertTriangle, Activity, CheckCircle2, ChevronRight, X, BarChart3 } from 'lucide-react';
import { Device, Alert } from '../../types';
import { Modal } from '../Modal';
import { Button } from '../Button';

interface OverviewProps {
  devices: Device[];
  alerts: Alert[];
}

export const Overview: React.FC<OverviewProps> = ({ devices, alerts }) => {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  // 兼容 devices 为 undefined/非数组的情况；当无设备时显示一个虚拟测试设备，保证界面不空白
  const virtualDevice: Device = {
    id: 'virtual-1',
    name: '虚拟测试设备',
    location: '本地模拟',
    currentTemp: 21.5,
    humidity: 50,
    status: 'normal',
    lastUpdate: '模拟',
    iconType: 'blue',
  };

  const deviceList: Device[] = Array.isArray(devices) && devices.length > 0 ? devices : [virtualDevice];

  const totalDevices = deviceList.length;
  const onlineDevices = deviceList.filter(d => d.status !== 'offline').length;
  const alertCount = deviceList.filter(d => d.status === 'warning' || d.status === 'critical').length;
  const avgTemp = totalDevices > 0
    ? (deviceList.reduce((acc, curr) => acc + (curr.currentTemp ?? 0), 0) / totalDevices).toFixed(1)
    : '0.0';

  const handleViewAlert = (id: string) => {
    setIsAlertModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500 opacity-20 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">系统运行概况</h2>
            <p className="text-blue-200 max-w-xl">
              实时监控节点数据已同步。AI 异常检测模块正在后台运行，保障实验环境安全。
            </p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                <span className="text-sm font-medium">服务正常</span>
             </div>
             <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-blue-300" />
                <span className="text-sm font-medium">数据流稳定</span>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">在线设备</p>
              <h3 className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{onlineDevices}<span className="text-gray-400 text-lg font-medium ml-1">/{totalDevices}</span></h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors shadow-sm">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="relative mt-4 flex items-center text-sm text-green-600 font-medium bg-green-50 w-fit px-2 py-1 rounded-md">
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            系统运行平稳
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => setIsAlertModalOpen(true)}
          className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-red-100 transition-all duration-300 overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-red-50 to-orange-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">当前告警</p>
              <h3 className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{alertCount}</h3>
            </div>
            <div className={`p-3 rounded-xl transition-colors shadow-sm ${alertCount > 0 ? 'bg-red-50 group-hover:bg-red-100' : 'bg-green-50 group-hover:bg-green-100'}`}>
              <AlertTriangle className={`h-6 w-6 ${alertCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
          <div className="relative mt-4 flex items-center text-sm text-gray-500">
             {alertCount > 0 ? <span className="text-red-600 font-medium flex items-center"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>需立即处理</span> : '暂无异常情况'}
          </div>
        </div>

        {/* Card 3 */}
        <div className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">平均温度</p>
              <h3 className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{avgTemp}°C</h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors shadow-sm">
              <Thermometer className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="relative mt-4 flex items-center text-sm text-gray-500">
            全区实时平均值
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Alerts List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">实时告警监控</h3>
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
            <button className="text-xs font-medium text-gray-500 hover:text-brand-600 transition-colors">
              查看历史记录
            </button>
          </div>
          <div className="divide-y divide-gray-50 flex-1">
            {alerts.length === 0 ? (
               <div className="p-12 text-center flex flex-col items-center justify-center h-full text-gray-400">
                 <CheckCircle2 className="h-12 w-12 mb-3 text-gray-300" />
                 <p>目前系统无任何告警</p>
               </div>
            ) : (
              alerts.map((alert, idx) => (
                <div key={alert.id ?? `alert-${idx}`} className="group px-6 py-4 hover:bg-gray-50/80 transition-colors cursor-pointer" onClick={() => handleViewAlert(alert.id)}>
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full flex-shrink-0 ring-4 ring-opacity-20 transition-all
                      ${alert.level === 'critical' ? 'bg-red-100 text-red-600 ring-red-500' : 
                        alert.level === 'warning' ? 'bg-orange-100 text-orange-600 ring-orange-500' : 'bg-blue-100 text-blue-600 ring-blue-500'}`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                          {alert.deviceName}
                        </p>
                        <span className="text-xs text-gray-400 font-mono">{alert.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {alert.message}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mini Device List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
          <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30">
            <h3 className="font-semibold text-gray-900">重点关注设备</h3>
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
            {devices.slice(0, 5).map((d, idx) => (
              <div key={d.id ?? `device-${idx}`} className="group flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${d.status === 'normal' ? 'bg-green-500' : d.status === 'warning' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-brand-700 transition-colors">{d.name}</div>
                    <div className="text-xs text-gray-500">{d.location}</div>
                  </div>
                </div>
                
                {/* Visual Sparkline */}
                <div className="hidden sm:block flex-1 mx-4 h-6 opacity-50">
                  <svg width="100%" height="100%" viewBox="0 0 100 24" preserveAspectRatio="none">
                    <path 
                      d={`M0,12 Q10,${12 + (Math.random()*10-5)} 20,${12 + (Math.random()*10-5)} T40,${12 + (Math.random()*10-5)} T60,${12 + (Math.random()*10-5)} T80,${12 + (Math.random()*10-5)} T100,12`}
                      fill="none" 
                      stroke={d.status === 'warning' ? '#ef4444' : '#22c55e'} 
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                <div className={`text-right ${d.status === 'warning' ? 'text-red-600' : 'text-gray-900'}`}>
                  <div className="font-bold font-mono">{(d.currentTemp ?? 0).toFixed(1)}°C</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-50 bg-gray-50/30">
            <button className="w-full py-2 text-sm text-brand-600 font-medium hover:bg-brand-50 rounded-lg transition-colors">
              查看所有设备
            </button>
          </div>
        </div>
      </div>

      {/* Alert Details Modal */}
      <Modal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title="当前告警详情"
        footer={<Button onClick={() => setIsAlertModalOpen(false)}>关闭</Button>}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {alerts.length > 0 ? (
            alerts.map((alert, idx) => (
              <div 
                key={alert.id ?? `alert-modal-${idx}`} 
                className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                  alert.level === 'critical' ? 'bg-red-50 border-red-100' : 
                  alert.level === 'warning' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                }`}
              >
                <div className={`p-2 rounded-full flex-shrink-0 ${
                   alert.level === 'critical' ? 'bg-red-100 text-red-600' : 
                   alert.level === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start">
                     <h4 className="font-bold text-gray-900">{alert.deviceName}</h4>
                     <span className="text-xs font-mono text-gray-500 bg-white/50 px-2 py-0.5 rounded">{alert.timestamp}</span>
                   </div>
                   <p className={`text-sm font-medium mt-1 ${
                      alert.level === 'critical' ? 'text-red-700' : 
                      alert.level === 'warning' ? 'text-orange-700' : 'text-blue-700'
                   }`}>
                     {alert.message}
                   </p>
                   <div className="mt-2 text-xs text-gray-500 flex gap-2">
                     <span>ID: {alert.deviceId}</span>
                     <span>•</span>
                     <span>等级: {alert.level === 'critical' ? '严重' : alert.level === 'warning' ? '警告' : '提示'}</span>
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
               <CheckCircle2 className="h-10 w-10 mx-auto text-green-400 mb-2" />
               <p>当前系统无任何活动告警</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
