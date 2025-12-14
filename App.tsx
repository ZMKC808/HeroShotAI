
import React, { useReducer, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { CanvasPreview } from './components/CanvasPreview';
import { CoverState, CoverAction, AspectRatio, StyleOption, ToolMode, ViralLayout } from './types';
import { KeyRound } from 'lucide-react';

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
  apiKey: '',
  viewMode: 'EDITOR',
  toolMode: ToolMode.PRODUCT_GEN, // Default to product gen
  
  title: "无线降噪\nPro Max",
  subtitle: "沉浸式音频体验",
  footer: "新品上市 • 限时直降",
  
  aspectRatio: AspectRatio.PORTRAIT,
  styles: INITIAL_STYLES,
  selectedStyleId: 'minimal_tech',
  activePrompt: INITIAL_STYLES[0].prompt,
  viralLayout: ViralLayout.CLASSIC, // Default viral style
  
  isGenerating: false,
  isPolishing: false,
  generatedImage: null,
  subjectImage: null,
  referenceImage: null,
  
  textScale: 1,
};

function reducer(state: CoverState, action: CoverAction): CoverState {
  switch (action.type) {
    case 'SET_API_KEY': return { ...state, apiKey: action.payload };
    case 'SET_VIEW_MODE': return { ...state, viewMode: action.payload };
    case 'SET_TOOL_MODE': return { ...state, toolMode: action.payload };
    case 'SET_TITLE': return { ...state, title: action.payload };
    case 'SET_SUBTITLE': return { ...state, subtitle: action.payload };
    case 'SET_FOOTER': return { ...state, footer: action.payload };
    case 'SET_ASPECT_RATIO': return { ...state, aspectRatio: action.payload };
    case 'SET_VIRAL_LAYOUT': return { ...state, viralLayout: action.payload };
    
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
        activePrompt: newStyle.prompt 
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
    case 'SET_IS_POLISHING': return { ...state, isPolishing: action.payload };
    case 'SET_GENERATED_IMAGE': return { ...state, generatedImage: action.payload };
    case 'SET_SUBJECT_IMAGE': return { ...state, subjectImage: action.payload };
    case 'SET_REFERENCE_IMAGE': return { ...state, referenceImage: action.payload };
    case 'SET_TEXT_SCALE': return { ...state, textScale: action.payload };
    default: return state;
  }
}

const ApiKeyModal = ({ onStart }: { onStart: (key: string) => void }) => {
    const [key, setKey] = useState("");
    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                    <KeyRound className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900">配置 API Key</h2>
                    <p className="mt-2 text-sm text-neutral-500">请输入您的 Google Gemini API Key 以开始使用。<br/>您的 Key 仅存储在本地浏览器内存中。</p>
                </div>
                <div className="mt-8 space-y-4">
                    <input 
                        type="password" 
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-center font-mono"
                    />
                    <button 
                        onClick={() => key.trim() && onStart(key)}
                        disabled={!key.trim()}
                        className="w-full bg-black text-white rounded-xl py-3 font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        开始使用
                    </button>
                    <p className="text-xs text-neutral-400">
                        没有 Key? <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline hover:text-black">去 Google AI Studio 获取</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  if (!state.apiKey) {
      return <ApiKeyModal onStart={(key) => dispatch({ type: 'SET_API_KEY', payload: key })} />;
  }

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
