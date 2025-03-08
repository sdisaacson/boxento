import { WidgetProps } from '@/types';

/**
 * Question difficulty levels
 */
export enum QuizDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

/**
 * Geography question types
 */
export enum QuestionType {
  CAPITALS = 'capitals',
  FLAGS = 'flags',
  BORDERS = 'borders',
  LANDMARKS = 'landmarks',
  MIXED = 'mixed'
}

/**
 * Single quiz question
 */
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  image?: string;
  type: QuestionType;
}

/**
 * Configuration options for the Geography Quiz widget
 * 
 * @interface GeographyQuizWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {string} [title] - Title to display in the widget header
 * @property {QuizDifficulty} [difficulty] - Quiz difficulty level
 * @property {QuestionType} [questionType] - Type of geography questions to show
 * @property {number} [questionsPerRound] - Number of questions per quiz round
 */
export interface GeographyQuizWidgetConfig {
  id?: string;
  title?: string;
  difficulty?: QuizDifficulty;
  questionType?: QuestionType;
  questionsPerRound?: number;
  onUpdate?: (config: GeographyQuizWidgetConfig) => void;
  onDelete?: () => void;
}

/**
 * Props for the Geography Quiz widget component
 * 
 * @type GeographyQuizWidgetProps
 */
export type GeographyQuizWidgetProps = WidgetProps<GeographyQuizWidgetConfig>; 