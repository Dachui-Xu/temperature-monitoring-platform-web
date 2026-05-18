import React, { useState, useEffect } from 'react';
import { Thermometer, Clock, ShieldAlert, LogOut, MapPin } from 'lucide-react';
import { Button } from '../Button';
import { Device, DeviceStatus } from '../../types';

interface GuestBigScreenProps {
  onLogout: () => void;
}

export const GuestBigScreen: React.FC<GuestBigScreenProps> = ({ onLogout }) => {
  const [time, setTime] = useState(new Date());
  
  // Initialize with 24 mock devices for a dense display
  const [devices, setDevices] = useState<Device[]>(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const types = ['机房', '冷链', '实验室', '样本库'];
      const type = types[i % types.length];
      const floor = Math.floor(i / 6) + 1;
      // Determine temp based on type
      let baseTemp = 22;
      if (type === '冷链') baseTemp = -18;
      if (type === '样本库') baseTemp = 4;
      
      const currentTemp = Number((baseTemp + (Math.random() - 0.5) * 5).toFixed(1));
      
      return {
        id: `dev-${i}`,
        name: `${type} ${String.fromCharCode(65 + (i % 4))}-${String(i + 1).padStart(2, '0')}`,
        location: `${floor}号楼 ${101 + (i % 6)}室`,
        currentTemp: currentTemp,
        humidity: 40 + Math.floor(Math.random() * 20),
        status: Math.random() > 0.95 ? 'warning' : 'normal' as DeviceStatus,
        lastUpdate: '刚刚'
      };
    });
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate random temp fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prev => prev.map(d => {
        const fluctuation = (Math.random() - 0.5) * 0.3;
        return {
          ...d,
          currentTemp: Number((d.currentTemp + fluctuation).toFixed(1)),
          // Low probability to toggle status for visual effect
          status: Math.random() > 0.98 ? 'warning' : (Math.random() > 0.9 ? 'normal' : d.status)
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col overflow-hidden relative">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Header */}
      <header className="flex justify-between items-center mb-4 z-10 border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/50">
            <Thermometer className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              温度监控大屏
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xl font-mono font-bold">{time.toLocaleTimeString()}</div>
            <div className="text-gray-500 text-xs">{time.toLocaleDateString()}</div>
          </div>
          <div className="h-8 w-px bg-gray-700"></div>
          <Button variant="ghost" onClick={onLogout} size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
            <LogOut className="mr-2 h-4 w-4" />
            退出
          </Button>
        </div>
      </header>

      {/* Main Content Grid - Denser layout */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 z-10 content-start overflow-y-auto">
        {devices.map((device) => (
          <div key={device.id} 
               className={`
                 relative overflow-hidden rounded-xl border p-3 transition-all duration-500 hover:scale-[1.02]
                 ${device.status === 'warning' 
                   ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.15)]' 
                   : 'bg-gray-800/40 border-gray-700/50 shadow-md hover:border-blue-500/30'}
               `}>
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0 pr-2">
                <h3 className="text-sm font-medium text-gray-200 truncate" title={device.name}>{device.name}</h3>
                <p className="text-xs text-gray-500 flex items-center mt-0.5 truncate">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  {device.location}
                </p>
              </div>
              <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0
                ${device.status === 'normal' ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-red-900/30 text-red-400 border border-red-900/50 animate-pulse'}`}>
                {device.status === 'normal' ? '正常' : '告警'}
              </div>
            </div>

            <div className="flex items-baseline mt-1 mb-2">
              <span className={`text-3xl font-bold tracking-tighter 
                ${device.status === 'warning' ? 'text-red-400' : 'text-white'}`}>
                {(device.currentTemp ?? 0).toFixed(1)}
              </span>
              <span className="text-sm text-gray-500 ml-1">°C</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
               <div className="flex items-center text-gray-500 text-[10px]">
                  <Clock className="h-3 w-3 mr-1" /> 更新: {device.lastUpdate}
               </div>
            </div>

            {device.status === 'warning' && (
              <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse"></div>
            )}
          </div>
        ))}
      </div>
      
      {/* Footer ticker or status */}
      <div className="mt-3 pt-2 border-t border-gray-800 text-center text-gray-600 text-xs flex justify-center items-center gap-6">
        <span className="flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span> 系统运行正常</span>
        <span className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span> 数据实时同步中</span>
        <span className="flex items-center"><span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></span> 访客模式 (只读)</span>
      </div>
    </div>
  );
};
