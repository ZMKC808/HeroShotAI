
export enum AspectRatio {
  PORTRAIT = '3:4',
  SQUARE = '1:1',
}

export interface StyleOption {
  id: string;
  label: string;
  prompt: string;
  isDefault?: boolean;
}

export type ViewMode = 'EDITOR' | 'RESULT';
export type ThemeMode = 'LIGHT' | 'DARK';

export interface CoverState {
  viewMode: ViewMode;
  
  // Content
  title: string;
  subtitle: string;
  footer: string;
  
  // Visuals
  aspectRatio: AspectRatio;
  themeMode: ThemeMode; // Controls background color (Black/White)
  styles: StyleOption[];
  selectedStyleId: string;
  activePrompt: string; // The specific prompt used for generation
  
  // Images
  subjectImage: string | null;
  referenceImage: string | null;
  generatedImage: string | null;
  isGenerating: boolean;

  // Typography Styling (Independent)
  textScale: number;
  titleColor: string;
  subtitleColor: string;
  footerColor: string;
}

export type CoverAction =
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_SUBTITLE'; payload: string }
  | { type: 'SET_FOOTER'; payload: string }
  | { type: 'SET_ASPECT_RATIO'; payload: AspectRatio }
  | { type: 'SET_THEME_MODE'; payload: ThemeMode }
  | { type: 'SELECT_STYLE'; payload: string }
  | { type: 'ADD_STYLE'; payload: { label: string; prompt: string } }
  | { type: 'DELETE_STYLE'; payload: string }
  | { type: 'SET_ACTIVE_PROMPT'; payload: string }
  | { type: 'SET_IS_GENERATING'; payload: boolean }
  | { type: 'SET_GENERATED_IMAGE'; payload: string }
  | { type: 'SET_SUBJECT_IMAGE'; payload: string }
  | { type: 'SET_REFERENCE_IMAGE'; payload: string }
  | { type: 'SET_TEXT_SCALE'; payload: number }
  | { type: 'SET_TITLE_COLOR'; payload: string }
  | { type: 'SET_SUBTITLE_COLOR'; payload: string }
  | { type: 'SET_FOOTER_COLOR'; payload: string };
