
import React, { useState } from 'react';
import { FileText, Search, Shield, Filter, Download, Clock, User, Activity } from 'lucide-react';
import { AuditLog } from '../../types';
import { Input } from '../Input';
import { Button } from '../Button';

interface AuditLogsProps {
  logs: AuditLog[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs, total = 0, page = 1, pageSize = 20, onPageChange, onPageSizeChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const actionLabels: Record<string, string> = {
    USER_CREATE: '创建用户',
    USER_REGISTER_SUBMIT: '提交注册',
    USER_UPDATE_STATUS: '修改用户状态',
    USER_UPDATE: '更新用户',
    USER_UPDATE_BY_ADMIN: '管理员更新用户',
    USER_DELETE: '删除用户',
    USER_LOGIN: '用户登录',
    USER_CHANGE_ROLE: '更改角色',
    USER_RESET_PASSWORD: '重置密码',
    USER_CHANGE_PASSWORD: '修改密码',
    DEVICE_VIEW: '查看设备',
    DEVICE_LIST: '设备列表',
    DEVICE_CREATE: '创建设备',
    DEVICE_UPDATE: '更新设备',
    DEVICE_UPDATE_BY_ADMIN: '管理员更新设备',
    DEVICE_DELETE: '删除设备',
    DEVICE_DELETE_BY_ADMIN: '管理员删除设备',
    DEVICE_BIND: '绑定设备',
    DEVICE_UNBIND: '解绑设备',
    DEVICE_KEY_VIEW: '查看设备密钥',
    DEVICE_KEY_VIEW_BY_ADMIN: '管理员查看设备密钥',
    DEVICE_KEY_GENERATE: '生成设备密钥',
    DEVICE_KEY_UPDATE: '更新设备密钥',
    DEVICE_KEY_REVOKE: '吊销设备密钥',
    CONFIG_VIEW: '查看配置',
    CONFIG_UPDATE: '更新配置',
    CONFIG_UPDATE_BY_ADMIN: '管理员更新配置',
    CONFIG_DELETE: '删除配置',
    DEVICE_CALIBRATE: '校准设备',
    DEVICE_CALIBRATE_BY_ADMIN: '管理员校准设备',
    PERMISSION_GRANT: '授予权限',
    PERMISSION_REVOKE: '撤销权限',
    USER_VIEW: '查看用户',
    DEVICE_PERMISSION_GRANT: '授予设备权限',
    DEVICE_PERMISSION_REVOKE: '撤销设备权限',
    DEVICE_PERMISSION_UPDATE: '更新设备权限',
    SE_IP: '设定IP',
    SCAN_DEVICE: '扫描设备',
    HISTORY_VIEW: '查看历史'
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
    } catch (e) {
      return ts;
    }
  };

  const filtered = logs.filter(l => {
    // search term filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!(String(l.username || '').toLowerCase().includes(s) || String(l.target || '').toLowerCase().includes(s) || String(l.details || '').toLowerCase().includes(s))) return false;
    }
    // action filter (match operation_type first, fallback to action)
    if (actionFilter !== 'all') {
      const op = String(l.operation_type || l.action || '').toUpperCase();
      if (op !== actionFilter) return false;
    }
    // date range filter
    if (startDate || endDate) {
      try {
        const t = new Date(l.timestamp).getTime();
        if (startDate) {
          const s = new Date(startDate).setHours(0,0,0,0);
          if (isFinite(s) && t < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate).setHours(23,59,59,999);
          if (isFinite(e) && t > e) return false;
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    return true;
  });

  const maxPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 20)));

  const handleStartDateChange = (v: string) => {
    setStartDate(v);
    if (v && endDate) {
      try {
        if (new Date(v).getTime() > new Date(endDate).getTime()) {
          setEndDate(v);
        }
      } catch (e) {}
    }
    if (onPageChange) onPageChange(1);
  };

  const handleEndDateChange = (v: string) => {
    setEndDate(v);
    if (v && startDate) {
      try {
        if (new Date(v).getTime() < new Date(startDate).getTime()) {
          setStartDate(v);
        }
      } catch (e) {}
    }
    if (onPageChange) onPageChange(1);
  };

  const handlePageInput = (v: number) => {
    const p = Math.max(1, Math.min(maxPages, Math.floor(v || 1)));
    if (onPageChange) onPageChange(p);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">系统操作日志</h2>
          <p className="text-sm text-gray-500">记录所有关键设备与用户操作，用于安全审计</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Input placeholder="搜索用户ID、对象或详情..." icon={Search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); if (onPageChange) onPageChange(1); }} className="px-3 py-2 rounded-lg border bg-white">
              <option value="all">所有类型</option>
              {Object.keys(actionLabels).map(k => (
                <option key={k} value={k}>{actionLabels[k]}</option>
              ))}
            </select>
            <input type="date" value={startDate} onChange={e => handleStartDateChange(e.target.value)} className="px-3 py-2 rounded-lg border bg-white" />
            <input type="date" value={endDate} onChange={e => handleEndDateChange(e.target.value)} className="px-3 py-2 rounded-lg border bg-white" />
            <select value={pageSize} onChange={(e) => { onPageSizeChange && onPageSizeChange(Number(e.target.value)); if (onPageChange) onPageChange(1); }} className="px-3 py-2 rounded-lg border bg-white">
              <option value={20}>20 / 页</option>
              <option value={50}>50 / 页</option>
              <option value={100}>100 / 页</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作人</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">动作类型</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作对象</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">变更详情</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{formatTime(log.timestamp)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{String(log.username)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-sm text-gray-800">
                        { (log.operation_type && actionLabels[log.operation_type]) ? actionLabels[log.operation_type] : (actionLabels[String(log.operation_type)] ?? (actionLabels[log.action as any] ?? '其他操作')) }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.target}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
             <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
               <Shield className="h-8 w-8" />
             </div>
             <h3 className="text-base font-semibold text-gray-900">暂无审计日志</h3>
             <p className="mt-1 text-sm text-gray-500">未找到符合条件的操作记录</p>
          </div>
        )}
        {/* Pagination */}
        <div className="px-6 py-3 border-t border-gray-100 bg-white flex items-center justify-between">
          <div className="text-sm text-gray-500">共 {total} 条</div>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange && onPageChange(Math.max(1, page - 1))} className="px-3 py-1 rounded border">上一页</button>
            <div className="text-sm text-gray-700">第</div>
            <input type="number" value={page} onChange={(e) => handlePageInput(Number(e.target.value))} min={1} max={maxPages} className="w-16 text-center px-2 py-1 border rounded" />
            <div className="text-sm text-gray-700">页 / 共 {maxPages} 页</div>
            <button onClick={() => onPageChange && onPageChange(Math.min(maxPages, page + 1))} className="px-3 py-1 rounded border">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
};
