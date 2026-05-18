// 这里模拟一个本地图片库文件夹
// 使用 SVG Data URI 格式，这样不需要外部图片文件也能显示图像，且完全离线可用

// 1. 预设头像库 (SVG 矢量图)
export const AVATAR_PRESETS = [
  {
    id: 'avatar-1',
    name: '商务男',
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="%23bfdbfe"/><path d="M50 35a20 20 0 1 0 0 40 20 20 0 0 0 0-40z" fill="%232563eb"/><path d="M20 90c0-15 15-25 30-25s30 10 30 25" stroke="%231e40af" stroke-width="5" fill="none"/></svg>`
  },
  {
    id: 'avatar-2',
    name: '商务女',
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="%23fbcfe8"/><circle cx="50" cy="45" r="18" fill="%23db2777"/><path d="M25 95c0-20 15-30 25-30s25 10 25 30" fill="%23be185d"/></svg>`
  },
  {
    id: 'avatar-3',
    name: '极客',
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%231f2937"/><rect x="30" y="35" width="15" height="15" fill="%2310b981"/><rect x="55" y="35" width="15" height="15" fill="%2310b981"/><rect x="35" y="70" width="30" height="5" fill="%2310b981"/></svg>`
  },
  {
    id: 'avatar-4',
    name: '管理员',
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="%23e5e7eb"/><path d="M50 25l15 25h-30z" fill="%23f59e0b"/><rect x="35" y="50" width="30" height="25" rx="5" fill="%234b5563"/></svg>`
  },
  {
    id: 'avatar-5',
    name: '研究员',
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="%23cffafe"/><circle cx="50" cy="45" r="20" fill="%2306b6d4"/><path d="M20 90q30-20 60 0" stroke="%230891b2" stroke-width="8" fill="none"/></svg>`
  },
  {
    id: 'avatar-6',
    name: '访客',
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="%23f3f4f6"/><path d="M35 40h30v10h-30z" fill="%239ca3af"/><path d="M35 60h30v10h-30z" fill="%239ca3af"/></svg>`
  },
];

// 2. 预设背景装饰 (Tailwind CSS 类名组合)
export const BACKGROUND_PRESETS = [
  { id: 'bg-1', name: '科技蓝', class: 'from-blue-500 via-brand-500 to-cyan-500' },
  { id: 'bg-2', name: '活力紫', class: 'from-purple-500 via-pink-500 to-rose-500' },
  { id: 'bg-3', name: '森林绿', class: 'from-emerald-500 via-green-500 to-teal-500' },
  { id: 'bg-4', name: '暗夜黑', class: 'from-gray-700 via-gray-800 to-gray-900' },
];

export const getDefaultAvatar = () => AVATAR_PRESETS[0].src;
