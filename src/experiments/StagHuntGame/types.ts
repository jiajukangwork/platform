export interface Entity {
  id: string;
  type: 'player' | 'ai' | 'stag' | 'hare';
  position: { x: number; y: number };
  target?: { x: number; y: number };
  strategy?: 'stag' | 'hare' | 'unknown';
}

export interface GameState {
  entities: Entity[];
  score: number;
  aiScore: number;
  round: number;
  timeLeft: number;
  gameLog: GameLogEntry[];
  aiThoughts: AiThought[];
}

export interface GameLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface AiThought {
  id: string;
  timestamp: number;
  content: string;
  confidence: number;
}

export interface CaptureResult {
  type: 'stag' | 'hare';
  position: { x: number; y: number };
  capturedBy?: 'player' | 'ai';
}