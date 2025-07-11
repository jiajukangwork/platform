# Pygame实验服务器

这个服务器允许将Pygame实验转换为Web应用，通过WebSocket与前端通信。

## 功能

- 将Pygame实验转换为Web应用
- 通过WebSocket实时传输帧数据
- 支持键盘输入转发
- 收集实验数据并返回结果

## 安装

1. 确保已安装Python 3.7+
2. 安装依赖：

```bash
pip install -r requirements.txt
```

## 使用方法

### 启动服务器

```bash
python PygameServer.py --experiment /path/to/experiment.py --port 8000
```

参数说明：
- `--experiment`: Pygame实验代码的路径
- `--port`: 服务器端口号（默认8000）

### 实验代码要求

为了使Pygame实验能够与服务器正常工作，实验代码需要遵循以下规范：

1. 实验必须定义一个`ExperimentRunner`类，包含以下方法：
   - `__init__(self)`: 初始化实验
   - `start(self)`: 启动实验
   - `pause(self)`: 暂停实验
   - `reset(self)`: 重置实验
   - `handle_key_event(self, key, pressed)`: 处理键盘事件
   - `get_frame(self)`: 获取当前帧
   - `is_complete(self)`: 检查实验是否完成
   - `get_results(self)`: 获取实验结果

2. 示例代码结构：

```python
import pygame
import sys

class ExperimentRunner:
    def __init__(self):
        pygame.init()
        self.screen = pygame.Surface((800, 600))
        self.clock = pygame.time.Clock()
        self.running = False
        self.complete = False
        self.results = {}
        
    def start(self):
        self.running = True
        
    def pause(self):
        self.running = False
        
    def reset(self):
        self.__init__()
        self.start()
        
    def handle_key_event(self, key, pressed):
        # 处理键盘事件
        pass
        
    def update(self):
        # 更新游戏状态
        if self.running:
            # 游戏逻辑
            pass
            
    def draw(self):
        # 绘制游戏画面
        self.screen.fill((255, 255, 255))
        # 绘制其他元素
        
    def get_frame(self):
        self.update()
        self.draw()
        return pygame.surfarray.array3d(self.screen)
        
    def is_complete(self):
        return self.complete
        
    def get_results(self):
        return self.results
```

## 与前端集成

前端可以通过WebSocket与服务器通信，发送以下消息：

- `{ "type": "START" }`: 启动实验
- `{ "type": "PAUSE" }`: 暂停实验
- `{ "type": "RESET" }`: 重置实验
- `{ "type": "KEY_EVENT", "key": "ArrowUp", "pressed": true }`: 发送键盘事件

服务器会发送以下消息：

- `{ "type": "FRAME", "frame": { "width": 800, "height": 600, "data": "base64..." } }`: 帧数据
- `{ "type": "EXPERIMENT_COMPLETE", "results": { ... } }`: 实验完成
- `{ "type": "ERROR", "message": "错误信息" }`: 错误信息

## 注意事项

- 服务器需要能够访问Pygame实验代码
- 确保实验代码符合上述规范
- 实验应该能够在无GUI环境下运行（使用Pygame的Surface而不是直接显示）