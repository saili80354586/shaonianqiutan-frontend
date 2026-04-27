# 少年球探 - API 文档

## 基础信息

- **Base URL**: `http://localhost:8080/api`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`

## 认证

### 登录

```http
POST /api/auth/login
```

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "user",
    "role": "user"
  }
}
```

### 注册

```http
POST /api/auth/register
```

**请求体**:
```json
{
  "username": "string",
  "password": "string",
  "phone": "string"
}
```

## 用户

### 获取当前用户信息

```http
GET /api/users/me
Authorization: Bearer {token}
```

**响应**:
```json
{
  "id": 1,
  "username": "user",
  "email": "user@example.com",
  "phone": "13800138000",
  "avatar": "https://...",
  "role": "user",
  "createdAt": "2026-03-30T00:00:00Z"
}
```

### 更新用户信息

```http
PUT /api/users/me
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "email": "new@example.com",
  "avatar": "https://..."
}
```

## 分析师

### 获取分析师列表

```http
GET /api/analysts?page=1&pageSize=20&position=forward
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `pageSize`: 每页数量 (默认: 20)
- `position`: 位置筛选 (可选)

**响应**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "分析师姓名",
      "avatar": "https://...",
      "position": "前锋",
      "rating": 4.8,
      "ordersCount": 156
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

### 获取分析师详情

```http
GET /api/analysts/{id}
```

**响应**:
```json
{
  "id": 1,
  "name": "分析师姓名",
  "avatar": "https://...",
  "position": "前锋",
  "experience": "10年职业球员经历",
  "bio": "个人简介",
  "rating": 4.8,
  "ordersCount": 156,
  "price": 299
}
```

## 订单

### 创建订单

```http
POST /api/orders
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "analystId": 1,
  "packageId": 1,
  "videoUrl": "https://...",
  "playerName": "球员姓名",
  "playerAge": 15,
  "playerPosition": "前锋",
  "notes": "备注"
}
```

### 获取订单列表

```http
GET /api/orders?page=1&status=pending
Authorization: Bearer {token}
```

**查询参数**:
- `page`: 页码
- `status`: 状态筛选 (pending/paid/completed)

### 获取订单详情

```http
GET /api/orders/{id}
Authorization: Bearer {token}
```

## 报告

### 获取报告列表

```http
GET /api/reports?page=1
Authorization: Bearer {token}
```

### 获取报告详情

```http
GET /api/reports/{id}
Authorization: Bearer {token}
```

**响应**:
```json
{
  "id": 1,
  "orderId": 1,
  "playerName": "球员姓名",
  "overallRating": 85,
  "strengths": ["速度快", "射门准"],
  "weaknesses": ["防守意识弱"],
  "recommendations": "建议加强...",
  "detailedScores": {
    "speed": 90,
    "shooting": 85,
    "passing": 80,
    "defense": 70
  },
  "createdAt": "2026-03-30T00:00:00Z"
}
```

## 支付

### 创建支付订单

```http
POST /api/payments
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "orderId": 1,
  "paymentMethod": "wechat" // 或 "alipay"
}
```

**响应**:
```json
{
  "paymentId": "pay_123456",
  "qrCode": "https://...",
  "expiredAt": "2026-03-30T00:15:00Z"
}
```

### 查询支付状态

```http
GET /api/payments/{id}/status
Authorization: Bearer {token}
```

## 错误处理

### 错误响应格式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 常见错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | INVALID_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未授权 |
| 403 | FORBIDDEN | 禁止访问 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## 状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求错误
- `401` - 未认证
- `403` - 无权限
- `404` - 未找到
- `500` - 服务器错误
