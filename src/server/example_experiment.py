"""
示例Pygame实验：速度博弈

这个实验模拟在交通情境下的人机对抗博弈，参与者控制红色小车与电脑控制的蓝色小车进行速度策略博弈。
"""

import pygame
import sys
import random
import time
import json
import math
from typing import Dict, List, Tuple, Any, Optional

class Car:
    """小车类"""
    def __init__(self, x: float, y: float, color: Tuple[int, int, int], lane: str):
        self.x = x
        self.y = y
        self.width = 30
        self.height = 50
        self.color = color
        self.speed = 0
        self.target_speed = 0
        self.lane = lane  # 'left' 或 'right' 或 'center'
        self.progress = 0  # 0-100
        
    def update(self, dt: float):
        """更新小车状态
        
        Args:
            dt: 时间增量（秒）
        """
        # 加速/减速到目标速度
        speed_diff = self.target_speed - self.speed
        acceleration = math.copysign(min(abs(speed_diff), 20) * dt, speed_diff)
        self.speed += acceleration
        
        # 移动小车
        distance = self.speed * dt
        self.y -= distance
        
        # 计算进度
        total_distance = 500  # 从起点到终点的总距离
        self.progress = min(100, max(0, (500 - self.y) / total_distance * 100))
        
        # 处理车道合并
        if self.y <= 300 and self.lane != 'center':
            merge_x = 400  # 中心位置
            distance_to_merge = abs(self.x - merge_x)
            merge_speed = distance_to_merge * (self.y / 300) * dt
            
            if self.lane == 'left':
                self.x = min(merge_x, self.x + merge_speed)
                if self.x >= merge_x:
                    self.lane = 'center'
            else:  # right
                self.x = max(merge_x, self.x - merge_speed)
                if self.x <= merge_x:
                    self.lane = 'center'
    
    def draw(self, screen: pygame.Surface):
        """绘制小车
        
        Args:
            screen: Pygame屏幕
        """
        pygame.draw.rect(
            screen, 
            self.color, 
            (self.x - self.width/2, self.y - self.height/2, self.width, self.height)
        )
        
        # 绘制车窗
        pygame.draw.rect(
            screen,
            (200, 200, 200),
            (self.x - self.width/2 + 5, self.y - self.height/2 + 5, self.width - 10, 15)
        )

class ExperimentRunner:
    """实验运行器类"""
    def __init__(self):
        """初始化实验"""
        pygame.init()
        self.screen = pygame.Surface((800, 600))
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont(None, 24)
        
        # 游戏状态
        self.running = False
        self.complete = False
        self.round = 1
        self.total_rounds = 10
        self.player_score = 0
        self.opponent_score = 0
        self.countdown = 3
        self.countdown_timer = 0
        self.round_ended = False
        self.round_winner = None
        self.round_end_timer = 0
        
        # 创建小车
        self.player_car = Car(200, 500, (255, 0, 0), 'left')  # 红色小车（玩家）
        self.opponent_car = Car(600, 500, (0, 0, 255), 'right')  # 蓝色小车（对手）
        
        # 对手策略
        self.opponent_strategies = ['aggressive', 'cautious', 'adaptive', 'random']
        self.current_strategy = random.choice(self.opponent_strategies)
        
        # 速度级别
        self.speed_levels = {
            '2': 20,  # 慢
            '3': 30,  # 中
            '4': 40,  # 快
            '5': 50   # 极快
        }
        
        # 记录数据
        self.start_time = None
        self.reaction_times = []
        self.speed_choices = []
        self.rounds_data = []
        
        # 初始化结果
        self.results = {
            'score': 0,
            'opponentScore': 0,
            'totalRounds': self.total_rounds,
            'winRate': 0,
            'averageSpeed': 0,
            'highSpeedRate': 0,
            'lowSpeedRate': 0,
            'reactionTimes': [],
            'speedChoices': [],
            'rounds': []
        }
    
    def start(self):
        """启动实验"""
        self.running = True
        if not self.start_time:
            self.start_time = time.time()
    
    def pause(self):
        """暂停实验"""
        self.running = False
    
    def reset(self):
        """重置实验"""
        self.__init__()
        self.start()
    
    def handle_key_event(self, key: str, pressed: bool):
        """处理键盘事件
        
        Args:
            key: 按键
            pressed: 是否按下
        """
        if not pressed or not self.running:
            return
            
        # 只处理数字键2-5
        if key in ['2', '3', '4', '5']:
            speed = self.speed_levels[key]
            self.player_car.target_speed = speed
            self.speed_choices.append(speed)
            
            # 记录反应时间
            if self.countdown == 0 and not self.round_ended:
                reaction_time = (time.time() - self.start_time) * 1000  # 毫秒
                self.reaction_times.append(reaction_time)
    
    def update_opponent(self, dt: float):
        """更新对手行为
        
        Args:
            dt: 时间增量（秒）
        """
        if self.round_ended:
            return
            
        # 根据策略选择速度
        if self.current_strategy == 'aggressive':
            # 偏好高速
            target_speed = random.choice([self.speed_levels['4'], self.speed_levels['5']])
        elif self.current_strategy == 'cautious':
            # 偏好低速
            target_speed = random.choice([self.speed_levels['2'], self.speed_levels['3']])
        elif self.current_strategy == 'adaptive':
            # 根据玩家速度调整
            if self.player_car.speed > 35:
                # 玩家速度快，稍微更快一些
                target_speed = self.player_car.speed + random.uniform(-5, 10)
            else:
                # 玩家速度慢，稍微更慢一些
                target_speed = self.player_car.speed + random.uniform(-10, 5)
        else:  # random
            # 随机选择
            speeds = list(self.speed_levels.values())
            target_speed = random.choice(speeds)
        
        self.opponent_car.target_speed = target_speed
    
    def update(self):
        """更新游戏状态"""
        if not self.running:
            return
            
        dt = 1/30  # 假设30FPS
        
        # 处理倒计时
        if self.countdown > 0:
            self.countdown_timer += dt
            if self.countdown_timer >= 1:
                self.countdown -= 1
                self.countdown_timer = 0
        else:
            # 更新小车
            self.player_car.update(dt)
            self.opponent_car.update(dt)
            
            # 更新对手
            self.update_opponent(dt)
            
            # 检查回合结束
            if self.player_car.progress >= 100 or self.opponent_car.progress >= 100:
                self.end_round()
    
    def end_round(self):
        """结束当前回合"""
        if self.round_ended:
            return
            
        self.round_ended = True
        
        # 确定胜者
        if self.player_car.progress > self.opponent_car.progress:
            self.round_winner = 'player'
            self.player_score += 10
        elif self.opponent_car.progress > self.player_car.progress:
            self.round_winner = 'opponent'
            self.opponent_score += 10
        else:
            self.round_winner = 'tie'
            self.player_score += 5
            self.opponent_score += 5
        
        # 记录回合数据
        round_data = {
            'round': self.round,
            'playerSpeed': self.player_car.speed,
            'opponentSpeed': self.opponent_car.speed,
            'playerScore': 10 if self.round_winner == 'player' else (5 if self.round_winner == 'tie' else 0),
            'opponentScore': 10 if self.round_winner == 'opponent' else (5 if self.round_winner == 'tie' else 0),
            'winner': self.round_winner,
            'reactionTime': self.reaction_times[-1] if self.reaction_times else 0,
            'timestamp': int(time.time() * 1000)
        }
        self.rounds_data.append(round_data)
        
        # 设置回合结束计时器
        self.round_end_timer = 3  # 3秒后进入下一回合
    
    def update_round_end_timer(self, dt: float):
        """更新回合结束计时器
        
        Args:
            dt: 时间增量（秒）
        """
        if not self.round_ended:
            return
            
        self.round_end_timer -= dt
        if self.round_end_timer <= 0:
            self.start_next_round()
    
    def start_next_round(self):
        """开始下一回合"""
        self.round += 1
        
        if self.round > self.total_rounds:
            self.complete_experiment()
            return
        
        # 重置小车
        self.player_car = Car(200, 500, (255, 0, 0), 'left')
        self.opponent_car = Car(600, 500, (0, 0, 255), 'right')
        
        # 随机选择新策略
        self.current_strategy = random.choice(self.opponent_strategies)
        
        # 重置回合状态
        self.round_ended = False
        self.round_winner = None
        self.countdown = 3
        self.countdown_timer = 0
    
    def complete_experiment(self):
        """完成实验"""
        self.complete = True
        self.running = False
        
        # 计算结果
        total_speed = sum(self.speed_choices)
        high_speeds = [s for s in self.speed_choices if s >= 40]
        low_speeds = [s for s in self.speed_choices if s < 40]
        
        self.results = {
            'score': self.player_score,
            'opponentScore': self.opponent_score,
            'totalRounds': self.total_rounds,
            'winRate': len([r for r in self.rounds_data if r['winner'] == 'player']) / self.total_rounds,
            'averageSpeed': total_speed / len(self.speed_choices) if self.speed_choices else 0,
            'highSpeedRate': len(high_speeds) / len(self.speed_choices) if self.speed_choices else 0,
            'lowSpeedRate': len(low_speeds) / len(self.speed_choices) if self.speed_choices else 0,
            'reactionTimes': self.reaction_times,
            'speedChoices': self.speed_choices,
            'rounds': self.rounds_data
        }
    
    def draw(self):
        """绘制游戏画面"""
        # 清屏
        self.screen.fill((240, 240, 240))
        
        # 绘制道路
        self.draw_road()
        
        # 绘制小车
        self.player_car.draw(self.screen)
        self.opponent_car.draw(self.screen)
        
        # 绘制UI
        self.draw_ui()
        
        # 绘制倒计时
        if self.countdown > 0:
            self.draw_countdown()
        
        # 绘制回合结束信息
        if self.round_ended:
            self.draw_round_end()
    
    def draw_road(self):
        """绘制道路"""
        # 左侧道路
        pygame.draw.rect(self.screen, (100, 100, 100), (175, 300, 50, 300))
        
        # 右侧道路
        pygame.draw.rect(self.screen, (100, 100, 100), (575, 300, 50, 300))
        
        # 中央道路
        pygame.draw.rect(self.screen, (100, 100, 100), (375, 0, 50, 300))
        
        # 道路标记
        for i in range(6):
            y = 350 + i * 50
            pygame.draw.rect(self.screen, (255, 255, 255), (197, y, 6, 20))
            pygame.draw.rect(self.screen, (255, 255, 255), (597, y, 6, 20))
        
        for i in range(6):
            y = 50 + i * 50
            pygame.draw.rect(self.screen, (255, 255, 255), (397, y, 6, 20))
        
        # 终点线
        pygame.draw.rect(self.screen, (0, 0, 0), (350, 50, 100, 5))
    
    def draw_ui(self):
        """绘制用户界面"""
        # 分数
        score_text = f"得分: {self.player_score} - {self.opponent_score}"
        score_surface = self.font.render(score_text, True, (0, 0, 0))
        self.screen.blit(score_surface, (20, 20))
        
        # 回合
        round_text = f"回合: {self.round}/{self.total_rounds}"
        round_surface = self.font.render(round_text, True, (0, 0, 0))
        self.screen.blit(round_surface, (20, 50))
        
        # 速度
        player_speed_text = f"玩家速度: {int(self.player_car.speed)} km/h"
        player_speed_surface = self.font.render(player_speed_text, True, (200, 0, 0))
        self.screen.blit(player_speed_surface, (20, 80))
        
        opponent_speed_text = f"对手速度: {int(self.opponent_car.speed)} km/h"
        opponent_speed_surface = self.font.render(opponent_speed_text, True, (0, 0, 200))
        self.screen.blit(opponent_speed_surface, (20, 110))
        
        # 进度条
        self.draw_progress_bar(20, 150, self.player_car.progress, (255, 0, 0))
        self.draw_progress_bar(20, 180, self.opponent_car.progress, (0, 0, 255))
        
        # 控制说明
        controls_text = "按 2/3/4/5 键控制速度"
        controls_surface = self.font.render(controls_text, True, (0, 0, 0))
        self.screen.blit(controls_surface, (20, 550))
    
    def draw_progress_bar(self, x: int, y: int, progress: float, color: Tuple[int, int, int]):
        """绘制进度条
        
        Args:
            x: X坐标
            y: Y坐标
            progress: 进度（0-100）
            color: 颜色
        """
        width = 200
        height = 20
        
        # 背景
        pygame.draw.rect(self.screen, (200, 200, 200), (x, y, width, height))
        
        # 进度
        progress_width = int(width * progress / 100)
        pygame.draw.rect(self.screen, color, (x, y, progress_width, height))
        
        # 边框
        pygame.draw.rect(self.screen, (0, 0, 0), (x, y, width, height), 1)
        
        # 文本
        text = f"{int(progress)}%"
        text_surface = self.font.render(text, True, (0, 0, 0))
        text_rect = text_surface.get_rect(center=(x + width/2, y + height/2))
        self.screen.blit(text_surface, text_rect)
    
    def draw_countdown(self):
        """绘制倒计时"""
        text = str(self.countdown)
        font = pygame.font.SysFont(None, 72)
        text_surface = font.render(text, True, (0, 0, 0))
        text_rect = text_surface.get_rect(center=(400, 300))
        
        # 背景
        pygame.draw.circle(self.screen, (255, 255, 255), text_rect.center, 40)
        pygame.draw.circle(self.screen, (0, 0, 0), text_rect.center, 40, 2)
        
        self.screen.blit(text_surface, text_rect)
    
    def draw_round_end(self):
        """绘制回合结束信息"""
        # 背景
        pygame.draw.rect(self.screen, (255, 255, 255, 200), (200, 250, 400, 150))
        pygame.draw.rect(self.screen, (0, 0, 0), (200, 250, 400, 150), 2)
        
        # 标题
        if self.round_winner == 'player':
            title = "你赢了！"
            title_color = (0, 128, 0)
        elif self.round_winner == 'opponent':
            title = "对手赢了！"
            title_color = (128, 0, 0)
        else:
            title = "平局！"
            title_color = (0, 0, 128)
        
        font = pygame.font.SysFont(None, 48)
        title_surface = font.render(title, True, title_color)
        title_rect = title_surface.get_rect(center=(400, 280))
        self.screen.blit(title_surface, title_rect)
        
        # 速度信息
        player_text = f"你的速度: {int(self.player_car.speed)} km/h"
        opponent_text = f"对手速度: {int(self.opponent_car.speed)} km/h"
        
        font = pygame.font.SysFont(None, 24)
        player_surface = font.render(player_text, True, (0, 0, 0))
        opponent_surface = font.render(opponent_text, True, (0, 0, 0))
        
        self.screen.blit(player_surface, (250, 320))
        self.screen.blit(opponent_surface, (250, 350))
        
        # 下一回合提示
        if self.round < self.total_rounds:
            next_text = f"下一回合将在 {int(self.round_end_timer)} 秒后开始..."
        else:
            next_text = "实验即将结束..."
        
        next_surface = font.render(next_text, True, (0, 0, 0))
        next_rect = next_surface.get_rect(center=(400, 380))
        self.screen.blit(next_surface, next_rect)
    
    def get_frame(self):
        """获取当前帧"""
        if self.running:
            self.update()
            if self.round_ended:
                self.update_round_end_timer(1/30)  # 假设30FPS
        
        self.draw()
        return pygame.surfarray.array3d(self.screen)
    
    def is_complete(self):
        """检查实验是否完成"""
        return self.complete
    
    def get_results(self):
        """获取实验结果"""
        return self.results

# 如果直接运行此脚本，启动一个本地Pygame窗口进行测试
if __name__ == "__main__":
    experiment = ExperimentRunner()
    experiment.start()
    
    screen = pygame.display.set_mode((800, 600))
    pygame.display.set_caption("速度博弈实验")
    
    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                experiment.handle_key_event(event.unicode, True)
        
        experiment.update()
        experiment.draw()
        
        # 将实验画面复制到显示窗口
        screen.blit(experiment.screen, (0, 0))
        pygame.display.flip()
        
        if experiment.is_complete():
            print("实验完成！")
            print("结果:", experiment.get_results())
            pygame.time.wait(3000)
            running = False
    
    pygame.quit()
    sys.exit()