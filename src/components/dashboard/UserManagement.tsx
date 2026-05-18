import React, { useState, useEffect } from 'react';
import { Check, X, Shield, User as UserIcon, MoreHorizontal, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { UserRole, UserStatus, User } from '../../types';
import { authService } from '../../services/authService';

interface UserManagementProps {
  currentUser: User;
}

// Mock pending users for demo
const INITIAL_PENDING_USERS = [
  { id: 101, username: 'new_researcher', email: 'researcher@lab.com', role: 'user', status: 'pending', date: '2024-05-20' },
  { id: 102, username: 'intern_dave', email: 'dave@intern.com', role: 'user', status: 'pending', date: '2024-05-21' },
];

// Mock active users
const INITIAL_ACTIVE_USERS = [
  { id: 1, username: 'super', email: 'super@admin.com', role: 'super_admin', status: 'active', date: '2024-01-01' },
  { id: 2, username: 'lalala', email: 'lalala@admin.com', role: 'admin', status: 'active', date: '2024-02-15' },
  { id: 3, username: 'user110', email: 'user110@example.com', role: 'user', status: 'active', date: '2024-03-10' },
];

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'banned'>('pending');
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [bannedUsers, setBannedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const users = await authService.getUsers();
        if (!mounted) return;
        // classify by status
        const pend: User[] = [];
        const act: User[] = [];
        const ban: User[] = [];
        users.forEach(u => {
          if (u.status === 'pending') pend.push(u);
          else if (u.status === 'banned') ban.push(u);
          else act.push(u);
        });
        // fallback to mock if nothing returned
        if (users.length === 0) {
          setPendingUsers(INITIAL_PENDING_USERS as any);
          setActiveUsers(INITIAL_ACTIVE_USERS as any);
          setBannedUsers([]);
        } else {
          setPendingUsers(pend);
          setActiveUsers(act);
          setBannedUsers(ban);
        }
      } catch (e) {
        console.warn('加载用户列表失败，使用本地示例', e);
        setPendingUsers(INITIAL_PENDING_USERS as any);
        setActiveUsers(INITIAL_ACTIVE_USERS as any);
        setBannedUsers([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // inline edit state for role/status
  const [editingRoleFor, setEditingRoleFor] = useState<number | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState<string>('');
  const [editingStatusFor, setEditingStatusFor] = useState<number | null>(null);
  const [editingStatusValue, setEditingStatusValue] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'contact' | 'timestamps' | null>(null);
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [adminPasswordModalOpen, setAdminPasswordModalOpen] = useState(false);
  const [adminPasswordForUser, setAdminPasswordForUser] = useState<{ userId: number | null; action?: 'status' | 'role'; status?: string | null; role?: string | null; onSuccess?: (() => void) } | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  const handleApprove = async (id: number) => {
    const u = pendingUsers.find(p => p.id === id);
    if (!u) return;
    if (!canModifyStatus(u)) { alert('无权修改该用户的状态（不能修改超级管理员或自己的状态）'); return; }
    if (!confirm('确认通过该用户申请并激活？')) return;
    // open admin password modal
    setAdminPasswordForUser({ userId: id, status: 'active', onSuccess: async () => {
      setPendingUsers(prev => prev.filter(x => x.id !== id));
      setActiveUsers(prev => [...prev, { ...u, status: 'active' } as any]);
    } });
    setAdminPasswordInput('');
    setAdminPasswordModalOpen(true);
  };

  const handleReject = async (id: number) => {
    const u = pendingUsers.find(p => p.id === id);
    if (!u) return;
    if (!canModifyStatus(u)) { alert('无权修改该用户的状态（不能修改超级管理员或自己的状态）'); return; }
    if (!confirm('确定要拒绝该用户的注册申请吗?')) return;
    setAdminPasswordForUser({ userId: id, status: 'banned', onSuccess: async () => {
      setPendingUsers(prev => prev.filter(x => x.id !== id));
      setBannedUsers(prev => [...prev, { ...u, status: 'banned' } as any]);
    } });
    setAdminPasswordInput('');
    setAdminPasswordModalOpen(true);
  };

  const getRoleBadge = (role: string) => {
    if (role === 'super' || role === 'super_admin') return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">超级管理员</span>;
    if (role === 'admin') return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">管理员</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">普通用户</span>;
  };

  // Permission checks
  const canResetPassword = currentUser.role === 'super' || currentUser.role === 'super_admin' || currentUser.role === 'admin';
  const isSuperView = currentUser.role === 'super' || currentUser.role === 'super_admin';
  const canModifyStatus = (targetUser: User) => {
    const isAdmin = currentUser.role === 'super' || currentUser.role === 'super_admin' || currentUser.role === 'admin';
    if (!isAdmin) return false;
    if (!targetUser) return false;
    if (targetUser.role === 'super' || targetUser.role === 'super_admin') return false;
    if (targetUser.id && currentUser.id && targetUser.id === currentUser.id) return false;
    return true;
  };

  const handleAdminPasswordConfirm = async () => {
    if (!adminPasswordForUser || !adminPasswordForUser.userId) return;
    try {
      if (adminPasswordForUser.action === 'role') {
        await authService.changeUserRole(adminPasswordForUser.userId, adminPasswordForUser.role as string, adminPasswordInput);
      } else {
        // default to status action
        await authService.changeUserStatus(adminPasswordForUser.userId, adminPasswordForUser.status as string, adminPasswordInput);
      }
      if (adminPasswordForUser.onSuccess) await adminPasswordForUser.onSuccess();
      setAdminPasswordModalOpen(false);
      setAdminPasswordForUser(null);
      setAdminPasswordInput('');
    } catch (e) {
      alert('操作失败，请检查管理员密码');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">用户权限管理</h2>
          <p className="text-sm text-gray-500">管理系统用户、审核注册申请及配置权限</p>
        </div>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
           <button
             onClick={() => setActiveTab('pending')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
               activeTab === 'pending' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             待审核 ({pendingUsers.length})
           </button>
           <button
             onClick={() => setActiveTab('active')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
               activeTab === 'active' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             已激活 ({activeUsers.length})
           </button>
           <button
             onClick={() => setActiveTab('banned')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
               activeTab === 'banned' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             已注销 ({bannedUsers.length})
           </button>
        </div>
      </div>

      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {pendingUsers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请用户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请角色</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleApprove(user.id)}
                          className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100" title="通过">
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleReject(user.id)}
                          className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="拒绝">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
             <div className="p-12 text-center text-gray-500">
               <Shield className="h-12 w-12 mx-auto text-gray-300 mb-3" />
               <p>暂无待审核的注册申请</p>
             </div>
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                  {isSuperView && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">密码</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><Calendar className="inline-block mr-1" /> 时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">管理操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activeUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold mr-3">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-xs text-gray-500">
                          <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700" onClick={() => { setModalUser(user); setModalType('contact'); setModalOpen(true); }} title="查看联系方式">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {user.phone && <Phone className="h-4 w-4 text-gray-400 ml-2" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  {isSuperView && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{(user as any).password || '—'}</td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <button className="text-gray-500 hover:text-gray-700 flex items-center gap-2" onClick={() => { setModalUser(user); setModalType('timestamps'); setModalOpen(true); }} title="查看时间信息">
                      <Calendar className="inline-block h-4 w-4" />
                      <span className="text-xs text-gray-600">{(user as any).last_login ? new Date((user as any).last_login).toLocaleDateString() : (user.created_at ? new Date(user.created_at).toLocaleDateString() : '-')}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3 text-gray-400">
                      
                      {canResetPassword && (user.role !== 'super' && user.role !== 'super_admin' && user.id !== currentUser.id) && (
                         <button className="text-brand-600 hover:text-brand-900 text-xs" onClick={async () => {
                           if (!confirm(`确认为用户 ${user.username} 重置密码？`)) return;
                           try {
                             await authService.resetUserPassword(user.id as number);
                             alert('密码已重置（请通知用户查看邮件或使用默认密码登录）');
                           } catch (e) {
                             alert('重置密码失败');
                           }
                         }}>重置密码</button>
                      )}
                      {/* inline role editor */}
                      { (currentUser.role === 'super' || currentUser.role === 'super_admin') && (
                        editingRoleFor === user.id ? (
                          <span className="flex items-center gap-2">
                            <select value={editingRoleValue} onChange={(e) => setEditingRoleValue(e.target.value)} className="px-2 py-1 rounded border">
                              <option value="super">超级管理员</option>
                              <option value="admin">管理员</option>
                              <option value="user">普通用户</option>
                            </select>
                            <button className="text-sm text-green-600" onClick={async () => {
                              try {
                                await authService.changeUserRole(user.id as number, editingRoleValue);
                                setActiveUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: editingRoleValue } as any : u));
                                setEditingRoleFor(null);
                              } catch (e) { alert('修改角色失败'); }
                            }}>保存</button>
                            <button className="text-sm text-gray-500" onClick={() => setEditingRoleFor(null)}>取消</button>
                          </span>
                        ) : (
                          <button className="text-sm text-gray-600 hover:text-gray-800" onClick={() => { setEditingRoleFor(user.id as number); setEditingRoleValue(user.role as string); }}>修改角色</button>
                        )
                      )}
                      {/* inline status editor */}
                      {canModifyStatus(user) && (
                        editingStatusFor === user.id ? (
                          <span className="flex items-center gap-2">
                            <select value={editingStatusValue} onChange={(e) => setEditingStatusValue(e.target.value)} className="px-2 py-1 rounded border">
                              <option value="active">激活</option>
                              <option value="pending">待审核</option>
                              <option value="banned">已注销</option>
                            </select>
                            <button className="text-sm text-green-600" onClick={async () => {
                              if (!canModifyStatus(user)) { alert('无权修改该用户的状态（不能修改超级管理员或自己的状态）'); return; }
                              // open admin password modal before applying
                              setAdminPasswordForUser({ userId: user.id as number, status: editingStatusValue, onSuccess: async () => {
                                setActiveUsers(prev => prev.filter(u => u.id !== user.id));
                                if (editingStatusValue === 'banned') setBannedUsers(prev => [...prev, { ...user, status: editingStatusValue } as any]);
                                if (editingStatusValue === 'pending') setPendingUsers(prev => [...prev, { ...user, status: editingStatusValue } as any]);
                                if (editingStatusValue === 'active') setActiveUsers(prev => [...prev, { ...user, status: editingStatusValue } as any]);
                                setEditingStatusFor(null);
                              } });
                              setAdminPasswordInput('');
                              setAdminPasswordModalOpen(true);
                            }}>保存</button>
                            <button className="text-sm text-gray-500" onClick={() => setEditingStatusFor(null)}>取消</button>
                          </span>
                        ) : (
                          <button className="text-sm text-gray-600 hover:text-gray-800" onClick={() => { setEditingStatusFor(user.id as number); setEditingStatusValue(user.status as string); }}>修改状态</button>
                        )
                      )}
                      <button className="hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'banned' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {bannedUsers.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注销时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bannedUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-xs text-gray-500">{user.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(user as any).updated_at ? new Date((user as any).updated_at).toLocaleString() : (user.created_at ? new Date(user.created_at).toLocaleString() : '-')}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">已注销用户</td>
                      <td className="px-6 py-4 text-right">
                        {(currentUser.role === 'super' || currentUser.role === 'super_admin') && (
                          <button className="text-sm text-green-600" onClick={() => {
                            if (!confirm(`确认将用户 ${user.username} 恢复为普通用户？`)) return;
                            setAdminPasswordForUser({ userId: user.id as number, status: 'active', onSuccess: async () => {
                              try {
                                await authService.changeUserRole(user.id as number, 'user');
                              } catch (e) {
                                console.warn('恢复后修改角色失败', e);
                              }
                              setBannedUsers(prev => prev.filter(u => u.id !== user.id));
                              setActiveUsers(prev => [...prev, { ...user, status: 'active', role: 'user' } as any]);
                            } });
                            setAdminPasswordInput('');
                            setAdminPasswordModalOpen(true);
                          }}>恢复为普通用户</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Shield className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>当前无已注销用户</p>
              </div>
            )}
          </div>
        </div>
      )}
      {modalOpen && modalUser && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalType === 'contact' ? '联系方式' : '时间信息'}
          footer={<Button onClick={() => setModalOpen(false)}>关闭</Button>}
        >
          {modalType === 'contact' ? (
            <div className="space-y-3 text-sm text-gray-700">
              <div><strong>邮箱：</strong> {modalUser.email || '—'}</div>
              <div><strong>手机号：</strong> {(modalUser as any).phone || '—'}</div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-gray-700">
              <div><strong>创建时间：</strong> {modalUser.created_at ? new Date(modalUser.created_at).toLocaleString() : '-'}</div>
              <div><strong>最近更新：</strong> {(modalUser as any).updated_at ? new Date((modalUser as any).updated_at).toLocaleString() : '-'}</div>
              <div><strong>最近登录：</strong> {(modalUser as any).last_login ? new Date((modalUser as any).last_login).toLocaleString() : '-'}</div>
            </div>
          )}
        </Modal>
      )}
      {adminPasswordModalOpen && adminPasswordForUser && (
        <Modal
          isOpen={adminPasswordModalOpen}
          onClose={() => { setAdminPasswordModalOpen(false); setAdminPasswordForUser(null); setAdminPasswordInput(''); }}
          title="输入管理员密码以确认"
          footer={<>
            <Button onClick={handleAdminPasswordConfirm}>确认</Button>
            <Button onClick={() => { setAdminPasswordModalOpen(false); setAdminPasswordForUser(null); setAdminPasswordInput(''); }} >取消</Button>
          </>}
        >
          <div className="space-y-3">
            <div className="text-sm text-gray-700">请输入管理员密码以继续对用户执行此操作（用户ID：{adminPasswordForUser.userId}）</div>
            <input type="password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
        </Modal>
      )}
    </div>
  );
};