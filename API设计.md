[TOC]

### **API 设计概览**

| 模块             | 功能概要                    |
| ---------------- | --------------------------- |
| 用户管理         | 注册/登录/权限管理/密码重置 |
| 设备生命周期管理 | 注册/信息维护/删除          |
| 设备绑定管理     | 用户-设备绑定关系维护       |
| 密钥管理系统     | 密钥全生命周期管理          |
| 设备配置管理     | 参数配置/校准功能           |
| 审计日志         | 操作记录查询/追踪           |

## 用户权限体系

### 角色权限矩阵

| 权限项           | Super Admin | Admin | User |
| ---------------- | ----------- | ----- | ---- |
| 用户信息全量查看 | ✔           | △     | △    |
| 跨用户密码重置   | ✔           | ✔     | ×    |
| 设备密钥生成     | ✔           | △     | ×    |
| 系统日志审计     | ✔           | ×     | ×    |
| 设备配置操作     | ✔           | △     | △    |

*说明：✔ 完全权限 △ 受限权限 × 无权限*

## **接口详情**

------

### **API 设计**

我已经对您提供的 API 文档进行了修改和完善，调整了一些接口的顺序并改进了描述和权限控制逻辑。以下是修改后的文档：

#### **1. 用户管理**

##### 1.1 用户注册申请

- **接口**：`POST /users`
- **描述**：提交用户注册申请，需要管理员审批。
- **请求体**：

```json
{
  "username": "user123",
  "password": "password123",
  "email": "user@example.com",
  "phone": "13800138000"
}
```

- **响应体**：

```json
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "phone": "13800138000",
  "role": "user",
  "status": "pending",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

##### 1.2 管理员修改用户状态

- **接口**：`PATCH /users/{user_id}/status`
- **描述**：可用于管理员审批用户注册申请。
- **请求体**：

```json
{
  "admin_password": "admin_password",
   "user_status": 'active'
}
```

- **响应体**：

```json
{
  	"message": "Status approved successfully",
	"user_id": {user_id},
    "user_status": 'active'
}
```

- **权限**：需要 admin 或 super 权限

##### 1.3 用户登录

- **接口**：`POST /users/login`
- **描述**：用户登录，仅状态为 active 的用户可以登录。
- **请求体**：

```json
{
  "username": "user123",
  "password": "password123"
}
```

- **响应体**：

```json
{
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

##### 1.4 获取当前用户信息

- **接口**：`GET /users/self`
- **描述**：获取当前登录用户的详细信息。
- **响应体**：

```json
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "phone": "13800138000",
  "role": "user",
  "status": "active",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

- **权限控制**：当前用户可以查看自己的信息

##### 1.5 获取用户列表

- **接口**：`GET /users`
- **描述**：获取用户列表，根据用户角色返回不同级别的信息。
- 查询参数：
  - page: 页码（默认 1）
  - size: 每页数量（默认 20）
- 响应体：
  - 对于 super 用户：

```json
[
  {
    "id": 1,
    "username": "admin1",
    "password": "original_password",  // 明文密码，仅super可见
    "email": "admin@example.com",
    "phone": "13800138001",
    "role": "admin",
    "status": "active",
    "created_at": "2024-01-20T10:00:00Z",
    "last_login": "2024-01-20T15:00:00Z"
  }
]
```

- 对于 admin 用户：

```json
[
  {
    "id": 1,
    "username": "user1",
    "email": "user@example.com",
    "phone": "13800138000",
    "role": "user",
    "status": "active",
    "created_at": "2024-01-20T10:00:00Z",
    "last_login": "2024-01-20T15:00:00Z"
  }
]
```

- 对于普通用户：

```json
[
  {
    "id": 1,
    "username": "user1",
    "role": "user"
  }
]
```

- 权限控制：
  - super：可以查看所有用户的所有信息（包括密码）
  - admin：只能查看普通用户的信息（不含密码）
  - user：只能查看状态为 active 的用户的基本信息

##### 1.6 获取用户详情

- **接口**：`GET /users/{user_id}`
- **描述**：获取指定用户的详细信息。
- **响应体**：同获取用户列表的响应格式
- 权限控制：
  - super：可以查看任何用户的所有信息
  - admin：只能查看普通用户的信息
  - user：只能查看自己的信息

##### 1.7 用户修改密码

- **接口**：`POST /users/self/password`
- **描述**：用户修改自己的密码，验证旧密码后修改为新密码。
- **请求体**：

```json
{
  "old_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

- **响应体**：

```json
{
  "message": "Password updated successfully"
}
```

- **权限控制**：只有当前登录的用户可以修改自己的密码

##### 1.8 重置用户密码

- **接口**：`POST /users/{user_id}/password`
- **描述**：管理员重置指定用户的密码，重置为123456。
- **请求体**：

```json
{
  "admin_password": "admin_password"
}
```

- **响应体**：

```json
{
  "message": "Password has been reset to 123456"
}
```

- **权限控制**：只有 admin 或 super 权限的用户可以重置其他用户的密码。

##### 1.9 用户删除

- **接口**：`DELETE /users/{user_id}`
- **描述**：管理员删除其他用户的功能，只有管理员权限的用户能够执行此操作。
- **请求头**：

```http
Authorization: Bearer {admin_access_token}
```

- **请求体**：无
- **响应体**：

```json
{
  "message": "User deleted successfully"
}
```

- **权限控制**：只有管理员角色（`role = 'admin'`）的用户可以调用该接口，普通用户无法删除其他用户。

##### 1.10 修改用户角色

- **接口**：`PATCH /users/{user_id}/role`
- **描述**：修改指定用户的角色，需要 admin 或 super 权限。
- **请求体**：

```json
{
  "role": "admin"  // 可选值: "admin" 或 "user"
}
```

- **响应体**：

```json
{
  "message": "User role updated successfully",
  "user_id": 123,
  "new_role": "admin"
}
```

- 权限控制：
  - admin 用户只能将普通用户（user）提升为 admin，不能修改其他 admin 或 super 的角色。
  - super 用户可以将普通用户（user）提升为 admin，或将 admin 降级为 user，但不能修改其他 super 用户的角色。
  - 普通用户无法修改任何用户的角色。

##### 1.11 获取所有用户详情

- **接口**：`GET /users`
- **描述**：获取用户列表，根据权限返回不同级别的信息。
- **请求参数**：

```http
GET /users?page=1&size=20
```

- 响应体：
  - 对于 super 用户：

```json
{
  "total": 100,
  "items": [
    {
      "id": 1,
      "username": "admin1",
      "password": "original_password_123",  // 明文密码，仅super可见
      "email": "admin1@example.com",
      "phone": "13800138001",
      "role": "admin",
      "created_at": "2024-01-20T10:00:00Z",
      "last_login": "2024-01-20T15:00:00Z"
    }
  ]
}
```

- 对于 admin 用户：

```json
{
  "total": 100,
  "items": [
    {
      "id": 1,
      "username": "user1",
      "email": "user1@example.com",
      "phone": "13800138001",
      "role": "user",
      "created_at": "2024-01-20T10:00:00Z",
      "last_login": "2024-01-20T15:00:00Z"
    }
  ]
}
```

- 权限控制：
  - super 用户：可以查看所有用户的所有信息，包括明文密码
  - admin 用户：只能查看普通用户的信息（不含密码）
  - 普通用户：无权访问此接口

##### 1.12 更新用户信息

- **接口**：`PUT /users/{user_id}`
- **描述**：更新指定用户的信息，包括用户名、邮箱、手机号和状态。需要管理员（admin 或 super）权限，或者用户自己更新自己的信息。
- **请求体**：

```json
{
  "username": "newusername",  // 新的用户名，可选
  "email": "newemail@example.com",  // 新的邮箱地址，可选
  "phone": "13800138001",  // 新的手机号，可选
  "status": "active",  // 新的用户状态，可选
  "verify_password": "currentpassword"  // 当前密码，用于验证是否可以修改信息
}
```

- **响应体**：

```json
{
  "message": "User information updated successfully"
}
```

- **权限控制**：
  - 普通用户只能更新自己的信息（通过 `user_id` 验证当前用户）。
  - 管理员和超级管理员可以更新任何用户的信息。
  - 如果用户尝试修改其他用户的敏感信息（如 `status`），必须具有 `admin` 或 `super` 权限。
- **错误响应**：
  - **403 Forbidden**: 当前用户没有权限更新其他用户的信息。
  - **401 Unauthorized**: 当前密码错误，无法更新信息。
  - **404 Not Found**: 用户不存在。

##### 1.13 创建超级管理员账户（不可在前端页面调用）

- **接口**：`POST /users/register/super`
- **描述**：备用接口，无需任何人审批
- **请求体**：

```json
{
  "username": "user123",
  "password": "password123",
  "email": "user@example.com",
  "phone": "13800138000"
}
```

- **响应体**：

```json
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "phone": "13800138000",
  "role": "super",
  "status": "pending",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

------

#### **2. 设备管理**

##### 2.1 设备注册

- **接口**：`POST /devices`
- **描述**：设备注册接口，提供设备信息进行注册。
- **请求体**：

```json
{
  "device_id": "device123",
  "device_name": "Temperature Sensor",
  "model": "PT1000",
  "firmware_version": "1.0.0",
  "location": "Room 101"
}
```

- **响应体**：

```json
{
  "message": "Device registered successfully"
}
```

- **处理逻辑**：将设备信息插入 `devices` 表中。

##### 2.2 获取设备信息

- **接口**：`GET /devices/{device_id}`
- **描述**：根据设备 ID 获取设备信息。
- **请求参数**：

```http
GET /devices/device123
```

- **响应体**：

```json
{
  "device_id": "device123",
  "device_name": "Temperature Sensor",
  "model": "T1000",
  "firmware_version": "1.0.0",
  "status": "online",
  "created_at": "2023-01-01T00:00:00",
  "last_active": "2023-01-01T10:00:00"
}
```

- **处理逻辑**：根据设备 ID 查询 `devices` 表，返回设备的详细信息。

##### 2.3 更新设备信息

- **接口**：`PUT /devices/{device_id}`
- **描述**：更新设备信息。
- **请求参数**：

```http
PUT /devices/device123
```

- **请求体**：

```json
{
  "device_name": "New Temperature Sensor",
  "model": "T2000",
  "firmware_version": "2.0.0"
}
```

- **响应体**：

```json
{
  "message": "Device information updated successfully"
}
```

- **处理逻辑**：根据设备 ID 更新 `devices` 表中的相关信息。

##### 2.4 删除设备

- **接口**：`DELETE /devices/{device_id}`
- **描述**：删除设备。
- **请求参数**：

```http
DELETE /devices/device123
```

- **响应体**：

```json
{
  "message": "Device deleted successfully"
}
```

- **处理逻辑**：根据设备 ID 从 `devices` 表中删除设备记录。

------

#### **3. 设备与用户绑定管理**

##### 3.1 绑定设备

- **接口**：`POST /user_devices/`
- **描述**：将设备绑定到用户。
- **请求体**：

```json
{
  "user_id": 1,
  "device_id": "device123",
  "permissions": "read"
}
```

- **响应体**：

```json
{
  "message": "Device bound to user successfully"
}
```

- **处理逻辑**：在 `user_devices` 表中插入一条记录，表示设备与用户的绑定关系。

##### 3.2 解绑设备

- **接口**：`DELETE /user_devices/`
- **描述**：解绑用户与设备的关系。
- **请求体**：

```json
{
  "user_id": 1,
  "device_id": "device123"
}
```

- **响应体**：

```json
{
  "message": "Device unbound from user successfully"
}
```

- **处理逻辑**：从 `user_devices` 表中删除绑定记录。

------

#### **4. 设备密钥管理**

所有接口均需在请求头中携带认证 Token：
 `Authorization: Bearer <your_access_token>`

------

##### 4.1 生成设备密钥

- **接口**：`POST /device_keys/{device_id}`

- **描述**：为设备生成随机密钥（32 位 HEX 字符串）

- 请求参数：

  ```http
  POST /device_keys/generate/device123?expires_days=30
  ```

- **请求体**：无

- Query 参数：

  | 参数名       | 类型 | 必填 | 说明               |
  | ------------ | ---- | ---- | ------------------ |
  | expires_days | int  | 否   | 密钥有效期（天数） |

- 响应体：

  ```json
  {
    "device_id": "device123",
    "device_key": "a1b2c3...（64字符）",
    "created_at": "2024-03-20T15:30:00+08:00",
    "expires_at": "2024-04-19T15:30:00+08:00"
  }
  ```

- 权限要求：

  - 超级管理员 或 该设备的设备管理员

- 错误码：

  - 404：设备不存在
  - 403：无操作权限

- 处理逻辑：

  1. 验证设备存在性
  2. 生成 32 字节随机 HEX 字符串
  3. 创建/更新密钥记录（重复生成覆盖旧密钥）
  4. 记录操作日志

------

##### 4.2 获取设备密钥

- **接口**：`GET /device_keys/{device_id}`

- **描述**：获取设备当前有效密钥

- 请求示例：

  ```http
  GET /device_keys/device123
  ```

- 响应体：

  ```json
  {
    "device_id": "device123",
    "device_key": "a1b2c3...",
    "created_at": "2024-03-20T15:30:00+08:00",
    "expires_at": "2024-04-19T15:30:00+08:00"
  }
  ```

- 权限要求：

  - 超级管理员 或 该设备的设备管理员

- 错误码：

  - 404：设备/密钥不存在
  - 403：无查看权限

- 特别说明：

  - 返回密钥始终为最新生成的版本
  - 过期密钥仍可查询但无法用于通信

------

##### 4.3 更新设备密钥

- **接口**：`PUT /device_keys/{device_id}`

- **描述**：手动设置设备密钥（慎用）

- 请求示例：

  ```http
  PUT /device_keys/device123
  ```

- 请求体：

  ```json
  {
    "device_key": "user_defined_key_123"
  }
  ```

- 响应体：

  ```json
  {
    "message": "Device key updated successfully",
    "device_id": "device123",
    "updated_at": "2024-03-20T16:00:00+08:00"
  }
  ```

- 权限要求：

  - 超级管理员 或 该设备的设备管理员

- 注意事项：

  - 建议优先使用自动生成接口
  - 手动密钥需符合长度要求（64 字符 HEX）

------

##### 4.4 撤销设备密钥

- **接口**：`DELETE /device_keys/{device_id}

- **描述**：立即吊销设备密钥

- 请求示例：

  ```http
  DELETE /device_keys/device123
  ```

- 响应体：

  ```json
  {
    "message": "Device key revoked successfully",
    "device_id": "device123",
    "revoked_at": "2024-03-20T16:30:00+08:00"
  }
  ```

- 权限要求：

  - 超级管理员 或 该设备的设备管理员

------

#### **5. 设备配置管理**

##### 5.1 获取设备配置

- **接口**：`GET /device_configurations/{device_id}`
- **描述**：获取设备的配置。
- **请求参数**：

```http
GET /device_configurations/device123
```

- **响应体**：

```json
{
  "device_id": "device123",
  "configurations": [
    {
      "config_key": "sampling_interval",
      "config_value": 10.0,
    },
    {
      "config_key": "temperature_threshold",
      "config_value": 30.5,
    }
  ],
  "calibration_value": 1.234,
  "updated_at": "2024-01-20T10:00:00Z"
}
```

- **处理逻辑**：
  1. 根据设备 ID 查询 `device_configurations` 表
  2. 返回设备的所有配置信息和校准值（如果存在）
  3. 包含每个配置项的最后更新时间

##### 5.2 更新设备配置

- **接口**：`PUT /device_configurations/{device_id}`
- **描述**：更新设备的配置。
- **请求参数**：

```http
PUT /device_configurations/device123
```

- **请求体**：

```json
{
  "configurations": [
    {
      "config_key": "sampling_interval",
      "config_value": 5.0,
      "updated_at": "2024-01-20T10:00:00Z"
    },
    {
      "config_key": "temperature_threshold",
      "config_value": 28.5,
      "updated_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

- **响应体**：

```json
{
  "message": "Device configurations updated successfully"
}
```

- **处理逻辑**：
  1. 根据设备 ID 更新 `device_configurations` 表中的配置项
  2. 所有配置值都使用浮点数类型存储
  3. 自动更新配置项的更新时间

##### 5.3 设备校准

- **接口**：`POST /device_configurations/{device_id}/calibrate`
- **描述**：用于设备的校准功能，将从 ESP32 获得的校准值保存到设备配置表中。
- **请求参数**：

```http
POST /device_configurations/device123/calibrate
```

- **请求体**：

```json
{
  "calibration_value": 1.234
}
```

- **响应体**：

```json
{
  "message": "Device calibrated successfully",
  "device_id": "device123",
  "calibration_value": 1.234,
  "updated_at": "2024-01-20T10:00:00Z"
}
```

- **处理逻辑**：
  1. 接收 `device_id` 和 `calibration_value`（浮点数类型）
  2. 在 `device_configurations` 表中更新设备的校准值
  3. 记录更新时间
  4. 返回成功消息，包含设备 ID、更新后的校准值和更新时间

- **权限控制**：
  - super 可以校准所有设备
  - admin 只能校准普通用户的设备
  - 普通用户需要写入权限才能校准设备

#### 6. 操作日志管理

##### 6.1 获取操作日志列表

* **接口**：`GET /logs`

* **描述**：获取系统操作日志，支持分页和过滤。

* **请求参数**：

```http
GET /operation_logs?page=1&size=20&user_id=123&operation_type=USER_CREATE&start_time=2024-01-20T00:00:00Z&end_time=2024-01-21T00:00:00Z
```

```http
page: 页码（可选，默认1）
size: 每页数量（可选，默认20）
user_id: 按用户ID过滤（可选）
operation_type: 按操作类型过滤（可选），可选值包括：
    # 用户操作
    USER_CREATE = "USER_CREATE"                     # 创建用户
    USER_REGISTER_SUBMIT = "USER_REGISTER_SUBMIT"   # 用户提交注册申请
    USER_UPDATE_STATUS = "USER_UPDATE_STATUS"      # 管理员修改用户状态
    USER_UPDATE = "USER_UPDATE"                     # 更新用户信息
    USER_UPDATE_BY_ADMIN = "USER_UPDATE_BY_ADMIN"   # 管理员更新用户信息
    USER_DELETE = "USER_DELETE"                     # 删除用户
    USER_LOGIN = "USER_LOGIN"                       # 用户登录
    USER_CHANGE_ROLE = "USER_CHANGE_ROLE"          # 修改用户角色
    USER_RESET_PASSWORD = "USER_RESET_PASSWORD"     # 管理员重置密码
    USER_CHANGE_PASSWORD = "USER_CHANGE_PASSWORD"   # 用户修改密码
    
    # 设备操作
    DEVICE_CREATE = "DEVICE_CREATE"     # 创建设备
    DEVICE_UPDATE = "DEVICE_UPDATE"     # 更新设备信息
    DEVICE_UPDATE_BY_ADMIN = "DEVICE_UPDATE_BY_ADMIN"  # 管理员更新设备
    DEVICE_DELETE = "DEVICE_DELETE"     # 删除设备
    DEVICE_DELETE_BY_ADMIN = "DEVICE_DELETE_BY_ADMIN"  # 管理员删除设备
    DEVICE_BIND = "DEVICE_BIND"         # 绑定设备
    DEVICE_UNBIND = "DEVICE_UNBIND"     # 解绑设备
    
    # 设备密钥操作
    DEVICE_KEY_VIEW = "DEVICE_KEY_VIEW"  # 查看设备密钥
    DEVICE_KEY_VIEW_BY_ADMIN = "DEVICE_KEY_VIEW_BY_ADMIN"  # 管理员查看设备密钥
    DEVICE_KEY_GENERATE = "DEVICE_KEY_GENERATE"  # 生成设备密钥
    DEVICE_KEY_UPDATE = "DEVICE_KEY_UPDATE"      # 更新设备密钥
    DEVICE_KEY_REVOKE = "DEVICE_KEY_REVOKE"      # 撤销设备密钥
    
    # 设备配置操作
    CONFIG_VIEW = "CONFIG_VIEW"           # 查看配置
    CONFIG_CREATE = "CONFIG_CREATE"       # 创建配置
    CONFIG_UPDATE = "CONFIG_UPDATE"       # 更新配置
    CONFIG_UPDATE_BY_ADMIN = "CONFIG_UPDATE_BY_ADMIN"  # 管理员更新配置
    CONFIG_DELETE = "CONFIG_DELETE"       # 删除配置
    DEVICE_CALIBRATE = "DEVICE_CALIBRATE" # 设备校准
    DEVICE_CALIBRATE_BY_ADMIN = "DEVICE_CALIBRATE_BY_ADMIN"  # 管理员校准设备
    
    # 权限操作
    PERMISSION_GRANT = "PERMISSION_GRANT"  # 授予权限
    PERMISSION_REVOKE = "PERMISSION_REVOKE"  # 撤销权限
    USER_VIEW = "USER_VIEW"  # 查看用户信息
    
    # 设备权限操作
    DEVICE_PERMISSION_GRANT = "DEVICE_PERMISSION_GRANT"    # 授予设备权限
    DEVICE_PERMISSION_REVOKE = "DEVICE_PERMISSION_REVOKE"  # 撤销设备权限
    DEVICE_PERMISSION_UPDATE = "DEVICE_PERMISSION_UPDATE"  # 更新设备权限
start_time: 开始时间（可选，ISO格式）
end_time: 结束时间（可选，ISO格式）
```

* **响应体：**

```json
{

 "total": 100,

 "items": [

  {

   "log_id": 1,

   "user_id": 123,

   "username": "admin",

   "operation_type": "USER_CREATE",

   "operation_detail": "Created new user: user123",

   "target_id": "user123",

   "created_at": "2024-01-20T10:00:00Z",

   "ip_address": "192.168.1.100"

  }

 ]

}
```

##### 6.2 获取单个日志详情

* 接口：`GET /logs/{log_id}`

* 描述：获取单个操作日志的详细信息。

* 响应体：

```json
{

 "log_id": 1,

 "user_id": 123,

 "username": "admin",

 "operation_type": "USER_CREATE",

 "operation_detail": "Created new user: user123",

 "target_id": "user123",

 "created_at": "2024-01-20T10:00:00Z",

 "ip_address": "192.168.1.100"

}
```

##### 6.3 创建操作日志（测试使用）

* **接口**：`POST /logs`

* **描述**：创建新的操作日志记录。

* **请求体**：

```json
{

 "user_id": 123,

 "username": "admin",

 "operation_type": "USER_CREATE",

 "operation_detail": "Created new user: user123",

 "target_id": "user123"

}
```

* **响应体**：

```json
{

 "log_id": 1,

 "user_id": 123,

 "username": "admin",

 "operation_type": "USER_CREATE",

 "operation_detail": "Created new user: user123",

 "target_id": "user123",

 "ip_address": "192.168.1.100",

 "created_at": "2024-01-20T10:00:00Z"

}
```

* **权限要求**：需要超级管理员权限，IP 地址自动从请求中获取，创建时间自动生成

------

### **API 路由和权限控制**

- 所有 API 接口都需要通过 JWT 进行身份验证。
- 设备密钥接口和设备配置信息接口仅对 admin，super 或设备拥有者开放。
- 设备绑定和解绑接口需要根据用户权限进行控制。
- 每个操作都会记录到操作日志里

------

### 用户权限

以下是对 `super`、`admin` 和 `user` 三种角色的权限总结：

#### 1. Super 用户权限
- **查看用户信息**：可以查看所有用户的所有信息，包括明文密码。
- **管理用户**：
  - 可以创建、更新、删除任何用户。
  - 可以修改用户角色（包括将其他管理员降级为普通用户）。
- **查看设备信息**：可以查看所有设备的所有信息。
- **管理设备**：
  - 可以创建、更新、删除任何设备。
  - 可以绑定和解绑设备到任何用户。
  - 可以设置设备的权限。
- **管理设备密钥**：可以查看、生成、更新和撤销设备密钥。
- **管理设备配置**：可以查看、更新和删除设备配置。
- **操作日志**：可以查看所有操作日志。

#### 2. Admin 用户权限

- **查看用户信息**：可以查看普通用户的信息（不包括明文密码）。
- **管理用户**：
  - 可以创建、更新、删除普通用户。
  - 不能修改其他管理员的角色。
- **查看设备信息**：可以查看所有设备的基本信息。
- **管理设备**：
  - 可以绑定和解绑设备到普通用户。
  - 可以设置普通用户的设备权限（read/write）。
  - 不能绑定设备到其他管理员。
- **管理设备密钥**：可以管理普通用户的设备密钥（但不能查看密钥）。
- **管理设备配置**：可以查看和更新普通用户的设备配置。
- **操作日志**：可以查看与自己相关的操作日志。

#### 3. User 用户权限
- **查看用户信息**：只能查看自己的信息。
- **查看设备信息**：只能查看自己绑定的设备的基本信息。
- **管理设备**：
  - 只能绑定自己的设备，且默认权限为 admin。
  - 可以设置设备的可见性（read/write）和解绑设备。
- **操作日志**：只能查看与自己相关的操作日志。

#### 总结
- **Super 用户** 拥有最高权限，可以管理所有用户和设备。
- **Admin 用户** 可以管理普通用户和设备，但不能管理其他管理员。
- **User 用户** 只能管理自己的信息和设备，权限最小。

这种权限设计确保了系统的安全性和灵活性，允许不同角色的用户根据其职责进行相应的操作。需要我继续完善其他部分吗？
