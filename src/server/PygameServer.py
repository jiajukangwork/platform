"""
Pygame实验服务器

这个脚本用于将Pygame实验转换为Web应用，通过WebSocket与前端通信。
"""

import asyncio
import json
import logging
import os
import sys
import threading
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Any

import websockets
from aiohttp import web
import pygame

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 全局变量
clients = {}  # 存储WebSocket连接
experiment_instances = {}  # 存储实验实例
experiment_results = {}  # 存储实验结果

class PygameExperimentServer:
    """Pygame实验服务器类"""
    
    def __init__(self, experiment_path: str, port: int = 8000):
        """初始化服务器
        
        Args:
            experiment_path: Pygame实验代码的路径
            port: 服务器端口
        """
        self.experiment_path = experiment_path
        self.port = port
        self.app = web.Application()
        self.setup_routes()
        self.experiment_module = None
        self.running = False
        self.experiment_thread = None
        
    def setup_routes(self):
        """设置HTTP路由"""
        self.app.router.add_get('/', self.handle_index)
        self.app.router.add_get('/ws', self.handle_websocket)
        self.app.router.add_static('/static', Path(__file__).parent / 'static')
        
    async def handle_index(self, request):
        """处理首页请求"""
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Pygame实验</title>
            <style>
                body, html {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                #game-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                canvas {
                    border: 1px solid #000;
                    max-width: 100%;
                    max-height: 100%;
                }
                #loading {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                }
                #error {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.8);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    color: red;
                }
            </style>
        </head>
        <body>
            <div id="game-container">
                <canvas id="game-canvas"></canvas>
            </div>
            <div id="loading">
                <h2>正在加载实验...</h2>
                <p>请稍候</p>
            </div>
            <div id="error">
                <h2>加载失败</h2>
                <p id="error-message"></p>
                <button id="retry-button">重试</button>
            </div>
            
            <script>
                // WebSocket连接
                let socket;
                let isConnected = false;
                
                function connectWebSocket() {
                    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                    socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
                    
                    socket.onopen = function() {
                        console.log('WebSocket连接已建立');
                        isConnected = true;
                        document.getElementById('loading').style.display = 'none';
                        
                        // 通知父窗口连接状态
                        window.parent.postMessage({
                            type: 'CONNECTION_STATUS',
                            data: { status: 'connected' }
                        }, '*');
                    };
                    
                    socket.onmessage = function(event) {
                        const data = JSON.parse(event.data);
                        handleMessage(data);
                    };
                    
                    socket.onclose = function() {
                        console.log('WebSocket连接已关闭');
                        isConnected = false;
                        
                        // 通知父窗口连接状态
                        window.parent.postMessage({
                            type: 'CONNECTION_STATUS',
                            data: { status: 'disconnected' }
                        }, '*');
                        
                        // 显示错误信息
                        document.getElementById('error').style.display = 'flex';
                        document.getElementById('error-message').textContent = '与服务器的连接已断开';
                    };
                    
                    socket.onerror = function(error) {
                        console.error('WebSocket错误:', error);
                        
                        // 通知父窗口连接状态
                        window.parent.postMessage({
                            type: 'CONNECTION_STATUS',
                            data: { status: 'disconnected' }
                        }, '*');
                        
                        // 显示错误信息
                        document.getElementById('error').style.display = 'flex';
                        document.getElementById('error-message').textContent = '连接服务器时发生错误';
                    };
                }
                
                // 处理来自服务器的消息
                function handleMessage(data) {
                    switch (data.type) {
                        case 'FRAME':
                            // 更新画布
                            updateCanvas(data.frame);
                            break;
                        case 'EXPERIMENT_COMPLETE':
                            // 实验完成
                            window.parent.postMessage({
                                type: 'EXPERIMENT_COMPLETE',
                                data: data.results
                            }, '*');
                            break;
                        case 'ERROR':
                            // 显示错误
                            document.getElementById('error').style.display = 'flex';
                            document.getElementById('error-message').textContent = data.message;
                            
                            // 通知父窗口
                            window.parent.postMessage({
                                type: 'EXPERIMENT_ERROR',
                                data: { message: data.message }
                            }, '*');
                            break;
                    }
                }
                
                // 更新画布
                function updateCanvas(frameData) {
                    const canvas = document.getElementById('game-canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 设置画布大小
                    if (canvas.width !== frameData.width || canvas.height !== frameData.height) {
                        canvas.width = frameData.width;
                        canvas.height = frameData.height;
                    }
                    
                    // 绘制图像
                    const img = new Image();
                    img.onload = function() {
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = 'data:image/png;base64,' + frameData.data;
                }
                
                // 监听来自父窗口的消息
                window.addEventListener('message', function(event) {
                    if (!isConnected) return;
                    
                    const { type } = event.data;
                    
                    switch (type) {
                        case 'START_EXPERIMENT':
                            socket.send(JSON.stringify({ type: 'START' }));
                            break;
                        case 'PAUSE_EXPERIMENT':
                            socket.send(JSON.stringify({ type: 'PAUSE' }));
                            break;
                        case 'RESET_EXPERIMENT':
                            socket.send(JSON.stringify({ type: 'RESET' }));
                            break;
                        case 'KEY_EVENT':
                            socket.send(JSON.stringify({ 
                                type: 'KEY_EVENT',
                                key: event.data.key,
                                pressed: event.data.pressed
                            }));
                            break;
                    }
                });
                
                // 监听键盘事件并转发到Pygame
                window.addEventListener('keydown', function(event) {
                    if (!isConnected) return;
                    
                    socket.send(JSON.stringify({
                        type: 'KEY_EVENT',
                        key: event.key,
                        pressed: true
                    }));
                });
                
                window.addEventListener('keyup', function(event) {
                    if (!isConnected) return;
                    
                    socket.send(JSON.stringify({
                        type: 'KEY_EVENT',
                        key: event.key,
                        pressed: false
                    }));
                });
                
                // 重试按钮
                document.getElementById('retry-button').addEventListener('click', function() {
                    document.getElementById('error').style.display = 'none';
                    document.getElementById('loading').style.display = 'flex';
                    connectWebSocket();
                });
                
                // 初始化连接
                connectWebSocket();
            </script>
        </body>
        </html>
        """
        return web.Response(text=html, content_type='text/html')
    
    async def handle_websocket(self, request):
        """处理WebSocket连接"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        
        client_id = str(uuid.uuid4())
        clients[client_id] = ws
        
        logger.info(f"新客户端连接: {client_id}")
        
        try:
            # 创建实验实例
            await self.create_experiment_instance(client_id)
            
            async for msg in ws:
                if msg.type == web.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    await self.handle_client_message(client_id, data)
                elif msg.type == web.WSMsgType.ERROR:
                    logger.error(f"WebSocket连接错误: {ws.exception()}")
        finally:
            # 清理
            if client_id in clients:
                del clients[client_id]
            if client_id in experiment_instances:
                del experiment_instances[client_id]
            logger.info(f"客户端断开连接: {client_id}")
        
        return ws
    
    async def create_experiment_instance(self, client_id: str):
        """创建实验实例"""
        try:
            # 在实际应用中，这里应该动态导入实验模块
            # 为了演示，我们创建一个模拟的实验实例
            experiment_instances[client_id] = {
                'running': False,
                'start_time': None,
                'frame_count': 0
            }
            logger.info(f"为客户端 {client_id} 创建实验实例")
        except Exception as e:
            logger.error(f"创建实验实例失败: {e}")
            if client_id in clients:
                await clients[client_id].send_json({
                    'type': 'ERROR',
                    'message': f"创建实验实例失败: {str(e)}"
                })
    
    async def handle_client_message(self, client_id: str, data: Dict[str, Any]):
        """处理来自客户端的消息"""
        message_type = data.get('type')
        
        if message_type == 'START':
            await self.start_experiment(client_id)
        elif message_type == 'PAUSE':
            await self.pause_experiment(client_id)
        elif message_type == 'RESET':
            await self.reset_experiment(client_id)
        elif message_type == 'KEY_EVENT':
            await self.handle_key_event(client_id, data)
    
    async def start_experiment(self, client_id: str):
        """启动实验"""
        if client_id not in experiment_instances:
            return
        
        experiment = experiment_instances[client_id]
        experiment['running'] = True
        experiment['start_time'] = time.time()
        
        # 在实际应用中，这里应该启动Pygame实验
        # 为了演示，我们启动一个模拟的帧生成任务
        asyncio.create_task(self.generate_frames(client_id))
        
        logger.info(f"客户端 {client_id} 的实验已启动")
    
    async def pause_experiment(self, client_id: str):
        """暂停实验"""
        if client_id not in experiment_instances:
            return
        
        experiment_instances[client_id]['running'] = False
        logger.info(f"客户端 {client_id} 的实验已暂停")
    
    async def reset_experiment(self, client_id: str):
        """重置实验"""
        if client_id not in experiment_instances:
            return
        
        experiment = experiment_instances[client_id]
        experiment['running'] = True
        experiment['start_time'] = time.time()
        experiment['frame_count'] = 0
        
        logger.info(f"客户端 {client_id} 的实验已重置")
    
    async def handle_key_event(self, client_id: str, data: Dict[str, Any]):
        """处理键盘事件"""
        if client_id not in experiment_instances:
            return
        
        # 在实际应用中，这里应该将键盘事件传递给Pygame实验
        key = data.get('key')
        pressed = data.get('pressed', False)
        
        logger.info(f"客户端 {client_id} 的键盘事件: {key} {'按下' if pressed else '释放'}")
    
    async def generate_frames(self, client_id: str):
        """生成并发送帧数据（模拟）"""
        if client_id not in experiment_instances or client_id not in clients:
            return
        
        experiment = experiment_instances[client_id]
        ws = clients[client_id]
        
        # 模拟帧生成
        try:
            while experiment['running']:
                # 生成一个简单的帧
                frame_data = self.generate_dummy_frame(experiment['frame_count'])
                experiment['frame_count'] += 1
                
                # 发送帧数据
                await ws.send_json({
                    'type': 'FRAME',
                    'frame': frame_data
                })
                
                # 模拟实验完成
                if experiment['frame_count'] >= 300:  # 假设300帧后实验结束
                    results = {
                        'score': 85,
                        'time': time.time() - experiment['start_time'],
                        'decisions': [
                            {'time': 1.2, 'choice': 'A', 'outcome': 'success'},
                            {'time': 3.5, 'choice': 'B', 'outcome': 'failure'},
                            {'time': 7.8, 'choice': 'A', 'outcome': 'success'}
                        ]
                    }
                    
                    experiment_results[client_id] = results
                    await ws.send_json({
                        'type': 'EXPERIMENT_COMPLETE',
                        'results': results
                    })
                    
                    experiment['running'] = False
                    logger.info(f"客户端 {client_id} 的实验已完成")
                    break
                
                # 控制帧率
                await asyncio.sleep(1/30)  # 约30 FPS
        except Exception as e:
            logger.error(f"生成帧时出错: {e}")
            if client_id in clients:
                await clients[client_id].send_json({
                    'type': 'ERROR',
                    'message': f"实验运行错误: {str(e)}"
                })
    
    def generate_dummy_frame(self, frame_count: int) -> Dict[str, Any]:
        """生成一个模拟的帧（简单的彩色矩形）"""
        width, height = 800, 600
        
        # 在实际应用中，这里应该从Pygame获取真实的帧数据
        # 为了演示，我们创建一个简单的彩色矩形
        import io
        import base64
        from PIL import Image, ImageDraw
        
        image = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(image)
        
        # 绘制一些矩形
        colors = ['red', 'green', 'blue', 'yellow', 'purple']
        for i in range(5):
            x = (frame_count + i * 50) % width
            y = 100 + i * 80
            draw.rectangle([x, y, x + 60, y + 40], fill=colors[i])
        
        # 添加文本
        draw.text((20, 20), f"Frame: {frame_count}", fill='black')
        
        # 转换为base64
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return {
            'width': width,
            'height': height,
            'data': img_str
        }
    
    def run(self):
        """运行服务器"""
        self.running = True
        web.run_app(self.app, port=self.port)

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Pygame实验服务器')
    parser.add_argument('--experiment', type=str, required=True, help='实验代码路径')
    parser.add_argument('--port', type=int, default=8000, help='服务器端口')
    
    args = parser.parse_args()
    
    server = PygameExperimentServer(args.experiment, args.port)
    server.run()

if __name__ == '__main__':
    main()