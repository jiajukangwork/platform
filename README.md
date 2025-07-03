# CogniAND - 智能决策与多模态交互研究平台

CogniAND 是一个创新型研究平台，致力于推进人类决策建模、多智能体模拟和脑机接口多模态融合研究。该平台提供了一系列经典和现代的心理学实验，用于研究人类决策过程和认知机制。

## 项目动机

在人工智能快速发展的今天，深入理解人类决策过程、优化人机协作模式变得越来越重要。本平台旨在：

- 提供标准化的实验范式，确保研究结果的可靠性和可重复性
- 探索人类与AI系统的协作决策机制
- 研究群体决策行为和社会互动模式
- 推进多模态人机交互技术的发展

## 技术栈

### 前端技术
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion (动画效果)
- Recharts (数据可视化)
- Lucide React (图标库)

### 项目特点
- 响应式设计，支持多设备访问
- 流畅的页面过渡动画
- 实时数据可视化
- 实验数据导出功能
- 模块化的代码结构

## 主要功能

### 1. 实验模块
- 爱荷华赌博任务 (Iowa Gambling Task)
  - 经典决策研究范式
  - 实时反馈机制
  - 详细的结果分析
  - 数据导出功能

### 2. 研究团队展示
- 团队成员介绍
- 研究方向说明
- 联系方式

### 3. 数据分析
- 实验结果可视化
- 多维度数据分析
- 实验数据导出

## 项目结构

```
src/
├── components/        # 可复用组件
├── pages/            # 页面组件
├── experiments/      # 实验模块
├── data/            # 静态数据
└── assets/          # 静态资源

主要组件：
- AboutSection: 平台介绍
- TeamSection: 团队展示
- ExperimentsPage: 实验列表
- IowaGamblingTask: 爱荷华赌博任务实验
```

## 开发指南

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装依赖
```bash
npm install
```

### 开发服务器
```bash
npm run dev
```

### 构建项目
```bash
npm run build
```

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交改动
4. 发起 Pull Request

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 联系方式

- 研究咨询: research@CogniAND.research
- 技术支持: support@cognixai.research
- 媒体咨询: media@cognixai.research

## 致谢

感谢所有为本项目做出贡献的研究人员和开发者。