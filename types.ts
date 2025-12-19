
export interface TargetExpression {
  id: number;
  text: string;
}

export interface SurveyData {
  category: string;
  value: string | number;
}

export interface Topic {
  id: string;
  title: string;
  scenarioTitle: string;
  scenarioDescription: string;
  targetExpressions: TargetExpression[];
  contextData?: any; 
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'grading' | 'finished';
