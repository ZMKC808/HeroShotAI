
export enum AspectRatio {
  PORTRAIT = '3:4',
  SQUARE = '1:1',
  WIDE_2_35 = '2.35:1',
  STORY_9_16 = '9:16',
  VIDEO_4_3 = '4:3',
}

export enum ToolMode {
  PRODUCT_GEN = 'PRODUCT_GEN',
  VIRAL_COVER = 'VIRAL_COVER',
}

export enum ViralLayout {
  CLASSIC = 'CLASSIC',
  SPLIT = 'SPLIT',
  DIAGONAL = 'DIAGONAL',
  BIG_TYPE = 'BIG_TYPE',
}

export interface StyleOption {
  id: string;
  label: string;
  prompt: string;
  isDefault?: boolean;
}

export type ViewMode = 'EDITOR' | 'RESULT';

export interface CoverState {
  apiKey: string;
  viewMode: ViewMode;
  toolMode: ToolMode;
  
  // Content
  title: string;
  subtitle: string;
  footer: string;
  
  // Visuals
  aspectRatio: AspectRatio;
  styles: StyleOption[];
  selectedStyleId: string;
  viralLayout: ViralLayout; // Renamed from viralStyle to avoid confusion with visual styles
  activePrompt: string; 
  
  // Images
  subjectImage: string | null;
  referenceImage: string | null;
  generatedImage: string | null;
  isGenerating: boolean;
  isPolishing: boolean;

  // Typography Styling
  textScale: number;
}

export type CoverAction =
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_TOOL_MODE'; payload: ToolMode }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_SUBTITLE'; payload: string }
  | { type: 'SET_FOOTER'; payload: string }
  | { type: 'SET_ASPECT_RATIO'; payload: AspectRatio }
  | { type: 'SELECT_STYLE'; payload: string }
  | { type: 'SET_VIRAL_LAYOUT'; payload: ViralLayout }
  | { type: 'ADD_STYLE'; payload: { label: string; prompt: string } }
  | { type: 'DELETE_STYLE'; payload: string }
  | { type: 'SET_ACTIVE_PROMPT'; payload: string }
  | { type: 'SET_IS_GENERATING'; payload: boolean }
  | { type: 'SET_IS_POLISHING'; payload: boolean }
  | { type: 'SET_GENERATED_IMAGE'; payload: string }
  | { type: 'SET_SUBJECT_IMAGE'; payload: string }
  | { type: 'SET_REFERENCE_IMAGE'; payload: string }
  | { type: 'SET_TEXT_SCALE'; payload: number };
