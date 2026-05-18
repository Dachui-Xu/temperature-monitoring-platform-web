import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Shield, Save, CheckCircle2, Palette, Image as ImageIcon } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { User as UserType } from '../../types';
import { authService } from '../../services/authService';
import { Modal } from '../Modal';
import { AVATAR_PRESETS, BACKGROUND_PRESETS } from '../../assets/localImages';

interface UserProfileProps {
  user: UserType;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // currentUser will be refreshed from backend when entering profile
  const [currentUser, setCurrentUser] = useState<UserType>(user);
  
  // UI State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatar, setAvatar] = useState(user.avatar || AVATAR_PRESETS[0].src);
  const [bgTheme, setBgTheme] = useState(BACKGROUND_PRESETS[0]);
  
  // Generate a stable fallback UID when backend id is not available
  const [fixedUid] = useState(() => Math.floor(10000 + Math.random() * 90000));

  const [formData, setFormData] = useState({
    email: user.email || '',
    phone: user.phone || '',
  });

  // verify password required by backend when updating profile
  const [verifyPassword, setVerifyPassword] = useState('');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Fetch latest user info when component mounts
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await authService.getCurrentUser();
        if (!mounted) return;
        setCurrentUser(me);
        setFormData({ email: me.email || '', phone: me.phone || '' });
      } catch (e) {
        // keep existing user prop as fallback
        console.warn('无法获取当前用户信息', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: Partial<UserType> = {
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        avatar,
      };

      // 1️⃣ 只负责“保存”，不信任返回值
      await authService.updateCurrentUser(payload, verifyPassword);

      // 2️⃣ 保存成功后，强制重新获取当前用户（唯一可信数据源）
      const freshUser = await authService.getCurrentUser();

      // 3️⃣ 同步更新 UI 使用的所有 state
      setCurrentUser(freshUser);
      setFormData({
        email: freshUser.email || '',
        phone: freshUser.phone || '',
      });

      // 4️⃣ 成功提示
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // 5️⃣ 清空验证密码
      setVerifyPassword('');
    } catch (err) {
      console.error('保存个人信息失败', err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleAvatarSelect = (src: string) => {
    setAvatar(src);
    setIsAvatarModalOpen(false);
  };

  // 在渲染时使用 displayUser 保证不会因为临时 undefined 覆盖导致 UI 为空
  const displayUser = currentUser || user;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
       {/* Success Toast */}
       {showToast && (
        <div className="absolute top-0 right-0 z-20 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center animate-in slide-in-from-top-2 fade-in">
          <CheckCircle2 className="h-4 w-4 text-green-400 mr-2" />
          个人信息更新成功
        </div>
      )}
  
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">个人中心</h2>
          <p className="text-sm text-gray-500">管理您的个人资料及账号安全设置</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center relative overflow-hidden group/card">
             {/* Background Decoration - Dynamic based on selection */}
             <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-r ${bgTheme.class} opacity-20 transition-all duration-500`}></div>
             
            <div className="relative group mt-4">
              <div 
                className="h-32 w-32 rounded-full bg-white flex items-center justify-center mb-4 border-4 border-white shadow-xl overflow-hidden relative z-10 cursor-pointer hover:ring-4 hover:ring-brand-100 transition-all"
                onClick={() => setIsAvatarModalOpen(true)}
              >
                 <img src={avatar} alt="avatar" className="w-full h-full object-cover"/>
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">更换头像</span>
                 </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mt-2">{displayUser.username}</h3>
            <div className="mt-2 px-3 py-1 bg-brand-50 text-brand-700 text-xs font-medium rounded-full border border-brand-100">
              {(displayUser.role === 'super' || displayUser.role === 'super_admin') ? '超级管理员' : displayUser.role === 'admin' ? '管理员' : '普通用户'}
            </div>
            
            <div className="mt-8 w-full border-t border-gray-50 pt-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">用户 ID</span>
                <span className="font-mono text-gray-900">{displayUser.id ? `UID-${displayUser.id}` : `UID-${fixedUid}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">注册时间</span>
                <span className="text-gray-900">{displayUser.created_at ? new Date(displayUser.created_at).toLocaleDateString() : '-'}</span>
              </div>
               <div className="flex justify-between text-sm">
                <span className="text-gray-500">上次登录</span>
                <span className="text-gray-900">{displayUser.last_login ? new Date(displayUser.last_login).toLocaleString() : '—'}</span>
              </div>
            </div>
          </div>
          
          {/* Theme Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
             <h3 className="font-semibold text-gray-900 flex items-center mb-4 text-sm">
                <Palette className="h-4 w-4 mr-2 text-gray-500" />
                名片背景主题
              </h3>
             <div className="flex gap-3 justify-center">
                {BACKGROUND_PRESETS.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setBgTheme(theme)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.class} shadow-sm transition-transform hover:scale-110 ${bgTheme.id === theme.id ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : ''}`}
                    title={theme.name}
                  />
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-brand-500" />
                基本信息
              </h3>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="电子邮箱" 
                  icon={Mail} 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
                 <Input 
                  label="联系电话" 
                  icon={Phone} 
                  value={formData.phone}
                   onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 gap-5">
                <Input
                  label="验证密码"
                  placeholder="请输入当前密码以确认修改"
                  type="password"
                  icon={Lock}
                  value={verifyPassword}
                  onChange={e => setVerifyPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  保存基本信息
                </Button>
              </div>
            </form>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
             <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                安全设置
              </h3>
            </div>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">修改登录密码</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                   <div className="md:col-span-4">
                     <Input 
                      placeholder="当前密码" 
                      type="password"
                      icon={Lock}
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                    />
                   </div>
                   <div className="md:col-span-4">
                     <Input 
                      placeholder="新密码" 
                      type="password"
                       icon={Lock}
                       value={newPassword}
                       onChange={e => setNewPassword(e.target.value)}
                    />
                   </div>
                   <div className="md:col-span-4">
                     <Input 
                      placeholder="确认新密码" 
                      type="password"
                       icon={Lock}
                       value={confirmPassword}
                       onChange={e => setConfirmPassword(e.target.value)}
                    />
                   </div>
                   {pwdError && <div className="md:col-span-12 text-sm text-red-500">{pwdError}</div>}
                   <div className="md:col-span-12">
                      <Button variant="outline" fullWidth onClick={async () => {
                        setPwdError('');
                        if (!oldPassword || !newPassword) {
                          setPwdError('请输入当前密码和新密码');
                          return;
                        }
                        if (newPassword.length < 3) {
                          setPwdError('新密码长度至少为3位');
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          setPwdError('两次输入的新密码不一致');
                          return;
                        }
                        setIsLoading(true);
                        try {
                          await authService.changeCurrentUserPassword(oldPassword, newPassword);
                          setShowToast(true);
                          setOldPassword(''); setNewPassword(''); setConfirmPassword('');
                          setTimeout(() => setShowToast(false), 3000);
                        } catch (e: any) {
                          setPwdError(e?.message || '修改密码失败');
                        } finally {
                          setIsLoading(false);
                        }
                      }}>确认修改</Button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Selection Modal */}
      <Modal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        title="选择系统头像"
        footer={<Button variant="ghost" onClick={() => setIsAvatarModalOpen(false)}>取消</Button>}
      >
        <div className="grid grid-cols-3 gap-4 py-4">
          {AVATAR_PRESETS.map((preset) => (
             <button
               key={preset.id}
               onClick={() => handleAvatarSelect(preset.src)}
               className={`group flex flex-col items-center p-3 rounded-xl border transition-all ${
                 avatar === preset.src 
                   ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' 
                   : 'border-gray-200 hover:border-brand-200 hover:bg-gray-50'
               }`}
             >
               <div className="w-16 h-16 rounded-full overflow-hidden shadow-sm mb-2 group-hover:scale-105 transition-transform">
                 <img src={preset.src} alt={preset.name} className="w-full h-full object-cover" />
               </div>
               <span className="text-xs font-medium text-gray-600 group-hover:text-brand-600">{preset.name}</span>
             </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}