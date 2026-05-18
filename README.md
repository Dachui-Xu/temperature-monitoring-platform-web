# 温度监控平台 Web

基于 React、TypeScript 和 Vite 的温度监控前端，用于查看设备状态、温度告警、历史曲线、审计日志与用户管理信息。

## 功能概览

- 用户登录、注册申请、访客大屏与权限化后台入口。
- 设备列表、网格视图、设备注册、设备信息维护、设备配置、校准与删除操作。
- 运行概况、当前告警、历史温湿度分析与审计日志查询。
- 管理员用户审核、角色调整、状态调整和密码重置入口。

## API 对接范围

前端接口适配以 `API设计.md` 为准，当前已对接：

- 用户管理：`POST /users`、`POST /users/login`、`GET /users/self`、`GET /users`、`PUT /users/{user_id}`、`POST /users/self/password`、`POST /users/{user_id}/password`、`PATCH /users/{user_id}/role`、`PATCH /users/{user_id}/status`、`DELETE /users/{user_id}`。
- 设备管理：`GET /devices`、`GET /devices/{device_id}`、`POST /devices`、`PUT /devices/{device_id}`、`DELETE /devices/{device_id}`。
- 设备配置：`GET /device_configurations/{device_id}`、`PUT /device_configurations/{device_id}`、`POST /device_configurations/{device_id}/calibrate`。
- 设备绑定与密钥：`POST /user_devices/`、`DELETE /user_devices/`、`POST /device_keys/{device_id}`、`GET /device_keys/{device_id}`、`PUT /device_keys/{device_id}`、`DELETE /device_keys/{device_id}`。
- 操作日志：`GET /logs`。

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

`npm test` 会编译并执行轻量级 Node 测试，覆盖 API 客户端响应解析、空响应处理以及请求头保留逻辑。
