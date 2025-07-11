// 实验服务，用于管理实验数据和与后端API通信

interface Experiment {
  id: number;
  title: string;
  authors: string;
  description: string;
  category: string;
  tags: string[];
  duration: string;
  difficulty: string;
  citations: number;
  isPopular: boolean;
  version: string;
  releaseDate: string;
  lastUpdated: string;
  type?: string;
  relatedPapers: string[];
  license: string;
  repository: string;
  contactInfo: string;
  experimentPath: string;
}

interface ExperimentFile {
  id: string;
  name: string;
  description: string;
  language: 'python' | 'javascript' | 'typescript';
  type: 'pygame' | 'web' | 'other';
  status: 'active' | 'draft' | 'archived';
  uploadDate: string;
  lastModified: string;
  author: string;
  code: string;
  config: Record<string, any>;
  serverConfig?: {
    port: number;
    requirements: string[];
    entryPoint: string;
    pythonVersion: string;
  };
}

class ExperimentService {
  private static instance: ExperimentService;
  private apiUrl: string = '/api'; // 实际应用中应该使用真实的API URL

  private constructor() {}

  public static getInstance(): ExperimentService {
    if (!ExperimentService.instance) {
      ExperimentService.instance = new ExperimentService();
    }
    return ExperimentService.instance;
  }

  // 获取所有实验
  public async getExperiments(): Promise<Experiment[]> {
    try {
      // 实际应用中应该是一个真实的API调用
      // const response = await fetch(`${this.apiUrl}/experiments`);
      // if (!response.ok) throw new Error('Failed to fetch experiments');
      // return await response.json();
      
      // 模拟API调用
      return new Promise(resolve => {
        setTimeout(() => {
          const experimentsData = require('../data/experiments.json');
          resolve(experimentsData.experiments);
        }, 500);
      });
    } catch (error) {
      console.error('Error fetching experiments:', error);
      throw error;
    }
  }

  // 获取单个实验
  public async getExperiment(id: number): Promise<Experiment | null> {
    try {
      // 实际应用中应该是一个真实的API调用
      // const response = await fetch(`${this.apiUrl}/experiments/${id}`);
      // if (!response.ok) throw new Error(`Failed to fetch experiment ${id}`);
      // return await response.json();
      
      // 模拟API调用
      return new Promise(resolve => {
        setTimeout(() => {
          const experimentsData = require('../data/experiments.json');
          const experiment = experimentsData.experiments.find((e: Experiment) => e.id === id);
          resolve(experiment || null);
        }, 300);
      });
    } catch (error) {
      console.error(`Error fetching experiment ${id}:`, error);
      throw error;
    }
  }

  // 获取管理员实验列表
  public async getAdminExperiments(): Promise<ExperimentFile[]> {
    try {
      // 实际应用中应该是一个真实的API调用
      // const response = await fetch(`${this.apiUrl}/admin/experiments`, {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      //   }
      // });
      // if (!response.ok) throw new Error('Failed to fetch admin experiments');
      // return await response.json();
      
      // 模拟API调用
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([
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
            },
            {
              id: '2',
              name: '多臂老虎机实验',
              description: '研究探索与利用权衡的经典实验',
              language: 'typescript',
              type: 'web',
              status: 'active',
              uploadDate: '2025-06-15',
              lastModified: '2025-06-20',
              author: '张烁',
              code: 'import React from "react";\n\n// 多臂老虎机实验代码...',
              config: {
                displayName: '多臂老虎机任务',
                category: 'behavioral',
                tags: ['探索与利用', '奖励学习', '决策制定'],
                duration: '20-30 分钟',
                difficulty: '中等'
              }
            }
          ]);
        }, 500);
      });
    } catch (error) {
      console.error('Error fetching admin experiments:', error);
      throw error;
    }
  }

  // 上传实验文件
  public async uploadExperiment(file: File, config: any): Promise<ExperimentFile> {
    try {
      // 实际应用中应该是一个真实的API调用
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('config', JSON.stringify(config));
      
      // const response = await fetch(`${this.apiUrl}/admin/experiments/upload`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      //   },
      //   body: formData
      // });
      
      // if (!response.ok) throw new Error('Failed to upload experiment');
      // return await response.json();
      
      // 模拟API调用
      return new Promise(resolve => {
        setTimeout(() => {
          const isPython = file.name.endsWith('.py');
          const newExperiment: ExperimentFile = {
            id: Date.now().toString(),
            name: file.name.replace(/\.[^/.]+$/, ""),
            description: '请添加实验描述',
            language: isPython ? 'python' : 'typescript',
            type: isPython ? 'pygame' : 'web',
            status: 'draft',
            uploadDate: new Date().toISOString().split('T')[0],
            lastModified: new Date().toISOString().split('T')[0],
            author: '当前用户',
            code: '// 实验代码将在这里显示',
            config: {
              ...config,
              displayName: file.name.replace(/\.[^/.]+$/, "")
            }
          };
          
          // 如果是Python文件，添加服务器配置
          if (isPython) {
            newExperiment.serverConfig = {
              port: 8000 + Math.floor(Math.random() * 1000),
              requirements: ['pygame==2.1.2', 'numpy==1.22.3'],
              entryPoint: file.name,
              pythonVersion: '3.9'
            };
          }
          
          resolve(newExperiment);
        }, 2000);
      });
    } catch (error) {
      console.error('Error uploading experiment:', error);
      throw error;
    }
  }

  // 保存实验
  public async saveExperiment(experiment: ExperimentFile): Promise<ExperimentFile> {
    try {
      // 实际应用中应该是一个真实的API调用
      // const response = await fetch(`${this.apiUrl}/admin/experiments/${experiment.id}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      //   },
      //   body: JSON.stringify(experiment)
      // });
      
      // if (!response.ok) throw new Error(`Failed to save experiment ${experiment.id}`);
      // return await response.json();
      
      // 模拟API调用
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ...experiment,
            lastModified: new Date().toISOString().split('T')[0]
          });
        }, 500);
      });
    } catch (error) {
      console.error(`Error saving experiment ${experiment.id}:`, error);
      throw error;
    }
  }

  // 删除实验
  public async deleteExperiment(id: string): Promise<void> {
    try {
      // 实际应用中应该是一个真实的API调用
      // const response = await fetch(`${this.apiUrl}/admin/experiments/${id}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      //   }
      // });
      
      // if (!response.ok) throw new Error(`Failed to delete experiment ${id}`);
      
      // 模拟API调用
      return new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 500);
      });
    } catch (error) {
      console.error(`Error deleting experiment ${id}:`, error);
      throw error;
    }
  }

  // 发布实验
  public async publishExperiment(id: string): Promise<Experiment> {
    try {
      // 实际应用中应该是一个真实的API调用
      // const response = await fetch(`${this.apiUrl}/admin/experiments/${id}/publish`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      //   }
      // });
      
      // if (!response.ok) throw new Error(`Failed to publish experiment ${id}`);
      // return await response.json();
      
      // 模拟API调用
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            id: parseInt(id),
            title: '新发布的实验',
            authors: '当前用户',
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
        }, 1000);
      });
    } catch (error) {
      console.error(`Error publishing experiment ${id}:`, error);
      throw error;
    }
  }

  // 管理员登录
  public async login(username: string, password: string): Promise<string> {
    try {
      // 实际应用中应该是一个真实的API调用
      // const response = await fetch(`${this.apiUrl}/admin/login`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ username, password })
      // });
      
      // if (!response.ok) throw new Error('Invalid credentials');
      // const data = await response.json();
      // return data.token;
      
      // 模拟API调用
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // 修改为允许任何账号和密码都能鉴权成功
          if (username && password) {
            resolve('fake-jwt-token');
          } else {
            reject(new Error('Invalid credentials'));
          }
        }, 500);
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
}

export default ExperimentService;