/**
 * Pygame实验管理API服务器
 * 
 * 这个服务器提供REST API，用于管理Pygame实验
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 文件上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../experiments'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 身份验证中间件
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

// 登录
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // 简单的身份验证逻辑，实际应用中应使用更安全的方式
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: '用户名或密码错误' });
  }
});

// 获取所有实验
app.get('/api/experiments', (req, res) => {
  // 从数据库或文件系统获取实验列表
  // 这里使用模拟数据
  const experiments = [
    {
      id: 1,
      title: '速度博弈：动态决策与策略适应实验',
      authors: 'CogniAND研究团队',
      description: '本实验模拟在交通情境下的人机对抗博弈，参与者在一个人字形道路地图上控制红色小车（左侧）与由电脑控制的蓝色小车（右侧）进行速度策略博弈。',
      category: 'cognitive',
      tags: ['博弈论', '动态决策', '速度控制'],
      duration: '15-25 分钟',
      difficulty: '中等',
      citations: 0,
      isPopular: true,
      version: '1.0',
      releaseDate: '2025-07-10',
      lastUpdated: '2025-07-10',
      type: 'pygame',
      relatedPapers: [
        'Modeling Dynamic Interactions in Competitive Driving Scenarios',
        'Decision-Making in Time-Constrained Control Tasks'
      ],
      license: 'CC BY-NC-SA 4.0',
      repository: 'https://github.com/CogniAND/speed-game',
      contactInfo: 'contact@CogniAND.research',
      experimentPath: '/experiments/speed-game'
    }
  ];
  
  res.json(experiments);
});

// 获取单个实验
app.get('/api/experiments/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  // 从数据库或文件系统获取实验
  // 这里使用模拟数据
  const experiment = {
    id: 1,
    title: '速度博弈：动态决策与策略适应实验',
    authors: 'CogniAND研究团队',
    description: '本实验模拟在交通情境下的人机对抗博弈，参与者在一个人字形道路地图上控制红色小车（左侧）与由电脑控制的蓝色小车（右侧）进行速度策略博弈。',
    category: 'cognitive',
    tags: ['博弈论', '动态决策', '速度控制'],
    duration: '15-25 分钟',
    difficulty: '中等',
    citations: 0,
    isPopular: true,
    version: '1.0',
    releaseDate: '2025-07-10',
    lastUpdated: '2025-07-10',
    type: 'pygame',
    relatedPapers: [
      'Modeling Dynamic Interactions in Competitive Driving Scenarios',
      'Decision-Making in Time-Constrained Control Tasks'
    ],
    license: 'CC BY-NC-SA 4.0',
    repository: 'https://github.com/CogniAND/speed-game',
    contactInfo: 'contact@CogniAND.research',
    experimentPath: '/experiments/speed-game'
  };
  
  if (id === 1) {
    res.json(experiment);
  } else {
    res.status(404).json({ error: '实验未找到' });
  }
});

// 获取管理员实验列表
app.get('/api/admin/experiments', authenticate, (req, res) => {
  // 从数据库或文件系统获取实验列表
  // 这里使用模拟数据
  const experiments = [
    {
      id: '1',
      name: '速度博弈实验',
      description: '模拟在交通情境下的人机对抗博弈，研究动态决策与策略适应',
      language: 'python',
      type: 'pygame',
      status: 'active',
      uploadDate: '2025-07-10',
      lastModified: '2025-07-10',
      author: 'CogniAND研究团队',
      code: 'import pygame\n\n# 速度博弈实验代码...',
      config: {
        displayName: '速度博弈：动态决策与策略适应实验',
        category: 'cognitive',
        tags: ['博弈论', '动态决策', '速度控制'],
        duration: '15-25 分钟',
        difficulty: '中等'
      },
      serverConfig: {
        port: 8000,
        requirements: ['pygame==2.1.2', 'numpy==1.22.3'],
        entryPoint: 'main.py',
        pythonVersion: '3.9'
      }
    }
  ];
  
  res.json(experiments);
});

// 上传实验文件
app.post('/api/admin/experiments/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未提供文件' });
  }
  
  const config = req.body.config ? JSON.parse(req.body.config) : {};
  const isPython = req.file.originalname.endsWith('.py');
  
  // 创建实验记录
  const experiment = {
    id: Date.now().toString(),
    name: req.file.originalname.replace(/\.[^/.]+$/, ""),
    description: config.description || '请添加实验描述',
    language: isPython ? 'python' : 'typescript',
    type: isPython ? 'pygame' : 'web',
    status: 'draft',
    uploadDate: new Date().toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    author: req.user.username,
    code: fs.readFileSync(req.file.path, 'utf8'),
    config: {
      displayName: config.displayName || req.file.originalname.replace(/\.[^/.]+$/, ""),
      category: config.category || 'cognitive',
      tags: config.tags || [],
      duration: config.duration || '15-20 分钟',
      difficulty: config.difficulty || '中等'
    }
  };
  
  // 如果是Python文件，添加服务器配置
  if (isPython) {
    experiment.serverConfig = {
      port: 8000 + Math.floor(Math.random() * 1000),
      requirements: ['pygame==2.1.2', 'numpy==1.22.3'],
      entryPoint: req.file.originalname,
      pythonVersion: '3.9'
    };
  }
  
  // 在实际应用中，应该将实验保存到数据库
  
  res.json(experiment);
});

// 保存实验
app.put('/api/admin/experiments/:id', authenticate, (req, res) => {
  const id = req.params.id;
  const experiment = req.body;
  
  // 在实际应用中，应该更新数据库中的实验
  
  // 如果是Python实验，保存代码到文件
  if (experiment.type === 'pygame') {
    const filePath = path.join(__dirname, '../experiments', experiment.serverConfig.entryPoint);
    fs.writeFileSync(filePath, experiment.code);
  }
  
  res.json({
    ...experiment,
    lastModified: new Date().toISOString().split('T')[0]
  });
});

// 删除实验
app.delete('/api/admin/experiments/:id', authenticate, (req, res) => {
  const id = req.params.id;
  
  // 在实际应用中，应该从数据库中删除实验
  
  res.json({ success: true });
});

// 发布实验
app.post('/api/admin/experiments/:id/publish', authenticate, (req, res) => {
  const id = req.params.id;
  
  // 在实际应用中，应该更新数据库中的实验状态
  
  res.json({
    id: parseInt(id),
    title: '新发布的实验',
    authors: req.user.username,
    description: '这是一个新发布的实验',
    category: 'cognitive',
    tags: ['标签1', '标签2'],
    duration: '15-20 分钟',
    difficulty: '中等',
    citations: 0,
    isPopular: false,
    version: '1.0',
    releaseDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString().split('T')[0],
    type: 'pygame',
    relatedPapers: [],
    license: 'MIT',
    repository: 'https://github.com/example/repo',
    contactInfo: 'contact@example.com',
    experimentPath: `/experiments/${id}`
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`API服务器运行在端口 ${port}`);
});