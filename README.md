# 温度监控平台 Web

基于 React、TypeScript 和 Vite 的温度监控前端，用于查看设备状态、温度告警、历史曲线、审计日志与用户管理信息。

## 功能概览

- 用户登录、注册申请、访客大屏与权限化后台入口。
- 设备列表、网格视图、虚拟设备添加、设备配置与删除操作。
- 运行概况、当前告警、历史温湿度分析与审计日志查询。
- 管理员用户审核、角色调整、状态调整和密码重置入口。

## 本地开发

```bash
npm install
npm run dev
```

默认后端地址在 `src/services/apiClient.ts` 的 `BASE_URL` 中配置。

## 构建与测试

```bash
npm run build
npm test
```

`npm test` 会编译并执行轻量级 Node 测试，覆盖 API 客户端响应解析、空响应处理以及表单登录请求头保留逻辑。
