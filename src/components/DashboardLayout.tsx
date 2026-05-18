import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Server, History, Users, LogOut, Bell, Menu, Thermometer, Search, FileText, Settings, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { User, Device, Alert, AuditLog } from '../types';
import { authService } from '../services/authService';
import { Overview } from './dashboard/Overview';
import { DeviceManager } from './dashboard/DeviceManager';
import { HistoryAnalysis } from './dashboard/HistoryAnalysis';
import { UserManagement } from './dashboard/UserManagement';
import { AuditLogs } from './dashboard/AuditLogs';
import { UserProfile } from './dashboard/UserProfile';
import { Button } from './Button';
import { Modal } from './Modal';
import { deviceService } from '../services/deviceService';

interface DashboardLayoutProps {
  user: User;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, onLogout }) => {
  const [currentTab, setCurrentTab] = useState<'overview' | 'devices' | 'history' | 'users' | 'logs' | 'profile'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  
  // Data States
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', deviceId: '3', deviceName: '生化实验室 C03', message: '温度超过设定阈值 (24.0°C)', level: 'warning', timestamp: '10:23 AM' },
    { id: '2', deviceId: '5', deviceName: '备用机房 E05', message: '设备失去连接', level: 'critical', timestamp: '09:15 AM' },
  ]);

  const [logs, setLogs] = useState<AuditLog[]>([
    { 
      id: 'log-1', timestamp: new Date(Date.now() - 3600000).toLocaleString(), 
      username: 'lalala', userRole: 'admin', 
      action: 'CONFIG', target: '冷链仓库 B02', details: '调整报警阈值下限至 -20°C' 
    },
    { 
      id: 'log-2', timestamp: new Date(Date.now() - 7200000).toLocaleString(), 
      username: 'super', userRole: 'super_admin', 
      action: 'ADD', target: '备用机房 E05', details: '新设备注册，分配 ID: 5' 
    }
  ]);
  const [logsTotal, setLogsTotal] = useState<number>(0);
  const [logsPage, setLogsPage] = useState<number>(1);
  const [logsPageSize, setLogsPageSize] = useState<number>(20);

  // Local copy of user: refreshable when entering profile to ensure latest data
  const [localUser, setLocalUser] = useState<User>(user);

  // keep localUser in sync when parent prop changes
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  // Init Data Fetching
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await deviceService.getAllDevices();
        setDevices(data);
      } catch (e) {
        console.error("Failed to load devices", e);
      }
    };
    fetchDevices();
  }, []);

  // When switching to profile tab, refresh current user from backend to keep UI consistent
  useEffect(() => {
    let mounted = true;
    if (currentTab === 'profile') {
      (async () => {
        try {
          const me = await authService.getCurrentUser();
          if (!mounted) return;
          setLocalUser(me);
        } catch (e) {
          console.warn('无法刷新当前用户信息', e);
        }
      })();
    }
    return () => { mounted = false; };
  }, [currentTab]);

  // Fetch operation logs when entering logs tab or when pagination changes
  useEffect(() => {
    let mounted = true;
    if (currentTab === 'logs') {
      (async () => {
        try {
          const res = await authService.getOperationLogs({ page: logsPage, page_size: logsPageSize });
          if (!mounted) return;
          if (res) {
            setLogs(res.items);
            setLogsTotal(res.total ?? 0);
          }
        } catch (e) {
          console.warn('加载操作日志失败，使用本地示例', e);
        }
      })();
    }
    return () => { mounted = false; };
  }, [currentTab, logsPage, logsPageSize]);

  // Simulate Real-time Updates (Polling)
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prev => prev.map(d => {
        if (d.status === 'offline') return d;
        const change = (Math.random() - 0.5) * 0.2;
        const base = (d.currentTemp ?? 0) + change;
        return {
          ...d,
          currentTemp: Number(base.toFixed(1))
        };
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddLog = (action: 'ADD' | 'DELETE' | 'CONFIG', target: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      username: localUser.username,
      userRole: localUser.role,
      action: action,
      target: target,
      details: details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const navItems = [
    { id: 'overview', label: '系统概览', icon: LayoutDashboard },
    { id: 'devices', label: '设备管理', icon: Server },
    { id: 'history', label: '历史分析', icon: History },
  ];

  // accept both 'super' and 'super_admin' as super-admin indicator
  if (localUser.role === 'admin' || localUser.role === 'super' || localUser.role === 'super_admin') {
    navItems.push({ id: 'users', label: '用户管理', icon: Users });
    navItems.push({ id: 'logs', label: '操作日志', icon: FileText });
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]
        md:translate-x-0 md:relative
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="h-20 flex items-center px-8 border-b border-slate-100">
             <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 mr-3">
                <Thermometer className="h-5 w-5 text-white" />
             </div>
             <span className="font-bold text-slate-800 text-lg tracking-tight">温度监控平台</span>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id as any);
                  setIsSidebarOpen(false);
                }}
                className={`group w-full flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  currentTab === item.id
                    ? 'bg-brand-50/80 text-brand-600 shadow-sm ring-1 ring-brand-200/50'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`mr-3.5 h-5 w-5 transition-colors ${currentTab === item.id ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {item.label}
                {currentTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <div 
              className={`flex items-center mb-5 px-1 p-2 -mx-2 rounded-lg cursor-pointer transition-colors group
                ${currentTab === 'profile' ? 'bg-white shadow-sm ring-1 ring-brand-100' : 'hover:bg-white/60'}
              `}
              onClick={() => {
                setCurrentTab('profile');
                setIsSidebarOpen(false);
              }}
              title="点击进入个人中心"
            >
              <div className="h-10 w-10 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center text-brand-700 font-bold mr-3 text-sm group-hover:scale-105 transition-transform">
                {localUser.avatar ? (
                  <img src={localUser.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  localUser.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <p className={`text-sm font-bold truncate transition-colors ${currentTab === 'profile' ? 'text-brand-700' : 'text-slate-800 group-hover:text-brand-600'}`}>
                  {localUser.username}
                </p>
                <div className="flex items-center justify-between">
                   <p className="text-xs text-slate-500 truncate font-medium mt-0.5">
                    {(localUser.role === 'super' || localUser.role === 'super_admin') ? '超级管理员' : localUser.role === 'admin' ? '管理员' : '普通用户'}
                   </p>
                   <Settings className={`h-3 w-3 text-slate-400 transition-opacity ${currentTab === 'profile' ? 'opacity-100 text-brand-500' : 'opacity-0 group-hover:opacity-100'}`} />
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={onLogout} 
              className="justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors border-slate-200 bg-white shadow-sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 transition-all">
          <div className="flex items-center">
            <button
              className="md:hidden p-2 mr-4 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {currentTab === 'profile' ? '个人中心' : navItems.find(i => i.id === currentTab)?.label}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center px-3 py-2 bg-slate-100 rounded-lg border border-transparent focus-within:bg-white focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 transition-all w-64">
               <Search className="h-4 w-4 text-slate-400 mr-2" />
               <input 
                 type="text" 
                 placeholder="全局搜索..." 
                 className="bg-transparent border-none focus:ring-0 text-sm text-slate-800 w-full placeholder-slate-400"
               />
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
            <button 
              className="relative p-2.5 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
              onClick={() => setIsAlertModalOpen(true)}
              title="查看告警"
            >
              <Bell className="h-5 w-5" />
              {alerts.length > 0 && (
                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-10">
            {currentTab === 'overview' && <Overview devices={devices} alerts={alerts} />}
            {currentTab === 'devices' && (
              <DeviceManager 
                devices={devices} 
                setDevices={setDevices} 
                currentUserRole={user.role} 
                onLog={handleAddLog}
              />
            )}
            {currentTab === 'history' && <HistoryAnalysis />}
            {currentTab === 'users' && (
              <UserManagement currentUser={user} />
            )}
            {currentTab === 'logs' && (
              <AuditLogs logs={logs} total={logsTotal} page={logsPage} pageSize={logsPageSize} onPageChange={(p) => setLogsPage(p)} onPageSizeChange={(s) => { setLogsPageSize(s); setLogsPage(1); }} />
            )}
             {currentTab === 'profile' && (
              <UserProfile user={user} />
            )}
          </div>
        </main>
      </div>

      {/* Global Alert Modal */}
      <Modal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title="系统告警中心"
        footer={<Button onClick={() => setIsAlertModalOpen(false)}>关闭</Button>}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div 
                key={alert.id} 
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
