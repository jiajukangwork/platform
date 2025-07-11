# Pygame实验管理系统

这个系统允许将Pygame实验转换为Web应用，并提供管理界面进行配置和部署。

## 系统架构

系统由以下组件组成：

1. **前端应用**：React应用，提供实验列表和管理界面
2. **API服务器**：Node.js服务器，处理实验管理和用户认证
3. **Pygame服务器**：Python服务器，运行Pygame实验并通过WebSocket与前端通信
4. **Nginx**：反向代理服务器，路由请求到不同的服务

## 目录结构

```
/
├── api/                  # API服务器
│   ├── server.js         # 主服务器代码
│   ├── package.json      # 依赖配置
│   └── Dockerfile        # Docker配置
├── experiments/          # 实验代码
│   ├── example_experiment.py
│   └── ...
├── PygameServer.py       # Pygame服务器
├── requirements.txt      # Python依赖
├── Dockerfile            # Pygame服务器Docker配置
├── docker-compose.yml    # Docker Compose配置
├── nginx.conf            # Nginx配置
└── README.md             # 文档
```

## 安装与部署

### 本地开发

1. 安装依赖：

```bash
# API服务器
cd api
npm install

# Pygame服务器
pip install -r requirements.txt
```

2. 启动服务：

```bash
# API服务器
cd api
npm run dev

# Pygame服务器
python PygameServer.py --experiment experiments/example_experiment.py --port 8000
```

### Docker部署

使用Docker Compose一键部署整个系统：

```bash
docker-compose up -d
```

## 使用方法

### 管理员界面

1. 访问 `http://localhost/admin`
2. 使用管理员账号登录（默认：admin/password）
3. 上传、编辑和管理实验

### 实验界面

1. 访问 `http://localhost/experiments`
2. 选择一个实验
3. 按照指示进行操作

## 添加新实验

### 创建Pygame实验

1. 创建一个新的Python文件，实现`ExperimentRunner`类
2. 确保实现所有必要的方法（参见`example_experiment.py`）
3. 上传到管理界面或直接放入`experiments`目录

### 配置实验

在管理界面中配置实验的元数据：

- 名称和描述
- 分类和标签
- 难度和时长
- 服务器配置（端口、依赖等）

### 发布实验

1. 在管理界面中将实验状态设置为"已发布"
2. 实验将出现在公开的实验列表中

## API文档

### 认证

```
POST /api/admin/login
```

请求体：
```json
{
  "username": "admin",
  "password": "password"
}
```

响应：
```json
{
  "token": "jwt-token"
}
```

### 实验管理

```
GET /api/experiments
GET /api/experiments/:id
GET /api/admin/experiments
POST /api/admin/experiments/upload
PUT /api/admin/experiments/:id
DELETE /api/admin/experiments/:id
POST /api/admin/experiments/:id/publish
```

## 注意事项

- 确保实验代码符合`ExperimentRunner`接口规范
- 实验应该能够在无GUI环境下运行
- 服务器需要足够的资源来运行多个Pygame实例
- 实验数据应该安全存储和处理