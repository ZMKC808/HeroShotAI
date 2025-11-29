
import React, { useReducer } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { CanvasPreview } from './components/CanvasPreview';
import { CoverState, CoverAction, AspectRatio, StyleOption } from './types';
import { AnimatePresence, motion } from 'framer-motion';

// Initial Styles
const INITIAL_STYLES: StyleOption[] = [
  {
    id: 'minimal_tech',
    label: '极简科技 (Minimal)',
    prompt: 'clean, futuristic, matte textures, soft studio lighting, apple aesthetic, minimalist composition, ample negative space',
    isDefault: true
  },
  {
    id: 'warm_japanese',
    label: '日系温馨 (Warm)',
    prompt: 'warm tones, natural wood and beige textures, soft sunlight, cozy, kinfolk style, film grain, organic shadows',
    isDefault: true
  },
  {
    id: 'high_fashion',
    label: '高冷艺术 (Fashion)',
    prompt: 'high contrast, bold shadows, editorial photography, vogue style, avant-garde, abstract geometry',
    isDefault: true
  },
  {
    id: 'nature_organic',
    label: '自然有机 (Nature)',
    prompt: 'earthy tones, green leaves, natural light, botanical, soft focus background, fresh atmosphere, flat lay style',
    isDefault: true
  },
  {
    id: 'neon_cyber',
    label: '赛博朋克 (Cyber)',
    prompt: 'dark background, neon accents, glass reflections, cyberpunk city vibes, blue and purple gradients, high tech',
    isDefault: true
  },
];

// Initial State
const initialState: CoverState = {
  viewMode: 'EDITOR',
  title: "无线降噪\nPro Max",
  subtitle: "沉浸式音频体验",
  footer: "新品上市 • 限时直降",
  aspectRatio: AspectRatio.PORTRAIT,
  themeMode: 'LIGHT',
  styles: INITIAL_STYLES,
  selectedStyleId: 'minimal_tech',
  activePrompt: INITIAL_STYLES[0].prompt,
  isGenerating: false,
  generatedImage: null,
  subjectImage: null,
  referenceImage: null,
  textScale: 1,
  titleColor: '#000000',
  subtitleColor: '#666666',
  footerColor: '#ffffff', // Default white text (will get black box)
};

function reducer(state: CoverState, action: CoverAction): CoverState {
  switch (action.type) {
    case 'SET_VIEW_MODE': return { ...state, viewMode: action.payload };
    case 'SET_TITLE': return { ...state, title: action.payload };
    case 'SET_SUBTITLE': return { ...state, subtitle: action.payload };
    case 'SET_FOOTER': return { ...state, footer: action.payload };
    case 'SET_ASPECT_RATIO': return { ...state, aspectRatio: action.payload };
    case 'SET_THEME_MODE': return { ...state, themeMode: action.payload };
    
    case 'SELECT_STYLE': {
      const style = state.styles.find(s => s.id === action.payload);
      return { 
        ...state, 
        selectedStyleId: action.payload,
        activePrompt: style ? style.prompt : state.activePrompt 
      };
    }
    
    case 'ADD_STYLE': {
      const newStyle: StyleOption = {
        id: Date.now().toString(),
        label: action.payload.label,
        prompt: action.payload.prompt,
        isDefault: false
      };
      return { 
        ...state, 
        styles: [...state.styles, newStyle],
        selectedStyleId: newStyle.id,
        activePrompt: newStyle.prompt // Switch to new style prompt immediately
      };
    }
    
    case 'DELETE_STYLE': {
      const newStyles = state.styles.filter(s => s.id !== action.payload);
      if (newStyles.length === 0) {
        newStyles.push({
            id: 'default_fallback',
            label: '默认风格',
            prompt: 'minimalist, clean background, high quality',
            isDefault: true
        });
      }
      let newSelectedId = state.selectedStyleId;
      let newPrompt = state.activePrompt;
      if (state.selectedStyleId === action.payload || !newStyles.find(s => s.id === state.selectedStyleId)) {
         const nextStyle = newStyles[0];
         newSelectedId = nextStyle.id;
         newPrompt = nextStyle.prompt;
      }
      return { 
        ...state, 
        styles: newStyles,
        selectedStyleId: newSelectedId,
        activePrompt: newPrompt
      };
    }

    case 'SET_ACTIVE_PROMPT': return { ...state, activePrompt: action.payload };
    case 'SET_IS_GENERATING': return { ...state, isGenerating: action.payload };
    case 'SET_GENERATED_IMAGE': return { ...state, generatedImage: action.payload };
    case 'SET_SUBJECT_IMAGE': return { ...state, subjectImage: action.payload };
    case 'SET_REFERENCE_IMAGE': return { ...state, referenceImage: action.payload };
    case 'SET_TEXT_SCALE': return { ...state, textScale: action.payload };
    case 'SET_TITLE_COLOR': return { ...state, titleColor: action.payload };
    case 'SET_SUBTITLE_COLOR': return { ...state, subtitleColor: action.payload };
    case 'SET_FOOTER_COLOR': return { ...state, footerColor: action.payload };
    default: return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div className="flex h-screen w-full bg-[#f5f5f7] font-sans text-[#1d1d1f] overflow-hidden">
      
      {/* 
        Responsive Layout Strategy:
        - Mobile: Toggle between ControlPanel and CanvasPreview using 'state.viewMode'.
        - Desktop: Display ControlPanel (Left) and CanvasPreview (Right) side-by-side using flexbox and 'md:block'.
      */}

      {/* LEFT PANEL: Controls */}
      <div className={`
        flex-none w-full md:w-[450px] bg-white border-r border-neutral-200 z-10
        ${state.viewMode === 'EDITOR' ? 'block' : 'hidden'} md:block
        overflow-y-auto h-full scrollbar-hide
      `}>
         <ControlPanel state={state} dispatch={dispatch} />
      </div>

      {/* RIGHT PANEL: Preview */}
      <div className={`
        flex-1 bg-[#f0f0f2] relative
        ${state.viewMode === 'RESULT' ? 'block' : 'hidden'} md:block
        h-full overflow-hidden
      `}>
         <CanvasPreview state={state} dispatch={dispatch} />
      </div>

    </div>
  );
}
