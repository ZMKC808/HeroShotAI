
import React, { useRef, useState } from 'react';
import { AspectRatio, CoverState, ToolMode, ViralLayout } from '../types';
import { motion } from 'framer-motion';
import { Download, Sparkles, SendHorizontal, ArrowLeft } from 'lucide-react';
import { interpretEditCommand, generateCoverImage } from '../services/geminiService';
import html2canvas from 'html2canvas';

interface CanvasPreviewProps {
  state: CoverState;
  dispatch: React.Dispatch<any>;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({ state, dispatch }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [magicInput, setMagicInput] = useState("");
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  
  const handleDownload = async () => {
    if (canvasRef.current) {
        try {
            const canvas = await html2canvas(canvasRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: null,
                logging: false,
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.download = `HeroShot-${Date.now()}.png`;
            link.href = image;
            link.click();
        } catch (error) {
            console.error("Download failed:", error);
            alert("下载失败，请重试");
        }
    }
  };

  const handleMagicEdit = async () => {
      if (!magicInput.trim() || !state.apiKey) return;
      setIsMagicLoading(true);
      try {
          const result = await interpretEditCommand(state.apiKey, magicInput, state.activePrompt, state.textScale);
          if (result.action === 'UPDATE_STYLE' && result.updates) {
              if (result.updates.textScale) dispatch({ type: 'SET_TEXT_SCALE', payload: result.updates.textScale });
          } else if (result.action === 'REGENERATE' && result.updates?.newPrompt) {
              dispatch({ type: 'SET_IS_GENERATING', payload: true });
              dispatch({ type: 'SET_ACTIVE_PROMPT', payload: result.updates.newPrompt });
              const url = await generateCoverImage(state.apiKey, {
                  activePrompt: result.updates.newPrompt,
                  aspectRatio: state.aspectRatio,
                  subjectImage: state.subjectImage,
                  referenceImage: state.referenceImage,
                  toolMode: state.toolMode,
                  viralLayout: state.viralLayout
              });
              dispatch({ type: 'SET_GENERATED_IMAGE', payload: url });
              dispatch({ type: 'SET_IS_GENERATING', payload: false });
          }
          setMagicInput("");
      } catch (e) {
          console.error("Magic edit failed", e);
          dispatch({ type: 'SET_IS_GENERATING', payload: false });
      } finally {
          setIsMagicLoading(false);
      }
  };
  
  // Default Text Colors (Since user removed pickers, we use high contrast defaults)
  // We can assume black or white based on a "default" for now, or just black.
  // The user said "prompt will have it", but that refers to image. 
  // For overlay text, we default to standard black/dark grey, but maybe allow magic edit to change?
  // For now, let's stick to a clean Dark Grey for main, lighter for sub.
  const titleColor = '#000000';
  const subtitleColor = '#444444';
  const footerColor = '#FFFFFF';
  const footerBgColor = '#000000';

  // Aspect Ratio to float mapping for inline styles to ensure immediate update
  const getAspectRatioStyle = () => {
    switch(state.aspectRatio) {
      case AspectRatio.PORTRAIT: return { aspectRatio: '3/4' };
      case AspectRatio.SQUARE: return { aspectRatio: '1/1' };
      case AspectRatio.WIDE_2_35: return { aspectRatio: '2.35/1' };
      case AspectRatio.STORY_9_16: return { aspectRatio: '9/16' };
      case AspectRatio.VIDEO_4_3: return { aspectRatio: '4/3' };
      default: return { aspectRatio: '3/4' };
    }
  };

  // Render Layouts based on Viral Layout Strategy
  const renderTextLayer = () => {
    // Default / Product Gen / Classic Mode
    if (state.toolMode === ToolMode.PRODUCT_GEN || state.viralLayout === ViralLayout.CLASSIC) {
      return (
        <div className="absolute inset-0 z-10 p-[8%] flex flex-col justify-between items-center text-center pointer-events-none">
            <div className="flex flex-col gap-[1.5em] mt-4 w-full">
                <h1 
                    className="font-bold leading-[1.1] whitespace-pre-wrap break-words"
                    style={{ fontSize: `${2 * state.textScale}rem`, color: titleColor, textShadow: '0 2px 20px rgba(255,255,255,0.5)' }}
                >{state.title}</h1>
                <h2 
                    className="font-medium tracking-wide opacity-90 whitespace-pre-wrap break-words"
                    style={{ fontSize: `${0.9 * state.textScale}rem`, color: subtitleColor }}
                >{state.subtitle}</h2>
            </div>
            <div className="mb-2">
                <span 
                    className="font-bold tracking-[0.2em] uppercase px-[1em] py-[0.5em] rounded-md shadow-sm inline-block"
                    style={{ fontSize: `${0.7 * state.textScale}rem`, backgroundColor: footerBgColor, color: footerColor }}
                >{state.footer}</span>
            </div>
        </div>
      );
    }

    // Split Layout (Text on Right)
    if (state.viralLayout === ViralLayout.SPLIT) {
       return (
         <div className="absolute inset-0 z-10 flex pointer-events-none">
            <div className="w-[60%] h-full" /> {/* Spacer for image */}
            <div className="w-[40%] h-full flex flex-col justify-center items-start pl-2 pr-6">
                 <h1 className="font-bold leading-tight mb-4 text-left"
                    style={{ fontSize: `${1.8 * state.textScale}rem`, color: titleColor }}
                 >{state.title}</h1>
                 <h2 className="font-medium opacity-80 text-left mb-8"
                    style={{ fontSize: `${0.8 * state.textScale}rem`, color: subtitleColor }}
                 >{state.subtitle}</h2>
                  <span className="font-bold text-[10px] uppercase border-b-2 border-current pb-1"
                    style={{ color: '#000' }}
                 >{state.footer}</span>
            </div>
         </div>
       );
    }

    // Diagonal Layout
    if (state.viralLayout === ViralLayout.DIAGONAL) {
        return (
            <div className="absolute inset-0 z-10 flex flex-col justify-center items-center pointer-events-none overflow-hidden">
                <div className="transform -rotate-6 bg-white/90 backdrop-blur-sm p-8 w-[120%] flex flex-col items-center justify-center shadow-2xl">
                    <h1 className="font-black italic tracking-tighter leading-none"
                        style={{ fontSize: `${2.5 * state.textScale}rem`, color: titleColor }}
                    >{state.title}</h1>
                     <h2 className="font-bold uppercase tracking-[0.3em] mt-2"
                        style={{ fontSize: `${0.8 * state.textScale}rem`, color: subtitleColor }}
                    >{state.subtitle}</h2>
                </div>
                 {state.footer && (
                    <div className="absolute bottom-6 right-6 transform -rotate-6 bg-black text-white px-4 py-2 font-bold text-xs">
                        {state.footer}
                    </div>
                 )}
            </div>
        );
    }

    // Big Type Layout
    if (state.viralLayout === ViralLayout.BIG_TYPE) {
        return (
             <div className="absolute inset-0 z-10 flex flex-col justify-center items-center p-4 pointer-events-none">
                 <h1 className="font-black text-center leading-[0.9] tracking-tighter w-full"
                    style={{ 
                        fontSize: `${3.5 * state.textScale}rem`, 
                        color: titleColor,
                        textShadow: '2px 2px 0px rgba(255,255,255,0.4)' 
                    }}
                 >{state.title}</h1>
                  <span className="mt-6 bg-black text-white px-6 py-2 rounded-full font-bold text-sm tracking-widest">
                      {state.footer || state.subtitle}
                  </span>
             </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-['PingFang_SC']">
        
        {/* Navbar - Only visible on Mobile */}
        <div className="flex-none h-14 px-4 flex md:hidden items-center justify-between bg-white border-b border-neutral-100 shadow-sm z-20">
            <button 
                onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'EDITOR' })}
                className="p-2 -ml-2 rounded-full hover:bg-neutral-100 active:scale-95 transition-transform"
            >
                <ArrowLeft className="w-5 h-5 text-black" />
            </button>
            <span className="font-bold text-sm">生成结果</span>
            <div className="w-9" />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-[#e5e5e5] md:bg-neutral-100 flex flex-col items-center justify-center p-4 md:p-10 relative overflow-hidden">
             
             {/* The Canvas */}
             <motion.div 
                ref={canvasRef}
                layout
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                className="relative bg-white shadow-xl shadow-black/5 overflow-hidden flex-none w-full max-w-[85vw] md:max-w-none md:h-[75vh]"
                style={{ 
                    backgroundColor: '#fff',
                    ...getAspectRatioStyle()
                }}
            >
                {/* Background Image */}
                {state.generatedImage ? (
                    <img src={state.generatedImage} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 opacity-40">
                         {state.isGenerating ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                                <span className="text-sm font-bold text-neutral-800">正在绘制极致底图...</span>
                            </div>
                        ) : (
                           <div className="flex flex-col items-center gap-2">
                                <Sparkles className="w-8 h-8 text-neutral-400" />
                                <span className="text-sm font-medium text-neutral-500">点击左侧 "立即生成" <br/>预览效果</span>
                           </div>
                        )}
                    </div>
                )}

                {/* Dynamic Text Layers */}
                {renderTextLayer()}

            </motion.div>
        </div>

        {/* Bottom Actions */}
        <div className="bg-white p-4 md:px-8 md:py-6 border-t border-neutral-200">
             <div className="max-w-3xl mx-auto flex flex-col gap-4">
                 {/* Magic Edit Input */}
                <div className="flex items-center gap-3 bg-neutral-50 p-2 rounded-2xl border border-neutral-200 shadow-sm focus-within:ring-2 focus-within:ring-black/5 transition-all">
                     <div className="w-8 h-8 flex-none rounded-xl bg-white flex items-center justify-center border border-neutral-200 shadow-sm">
                         {isMagicLoading ? <div className="w-4 h-4 border-2 border-neutral-200 border-t-purple-500 rounded-full animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-600 fill-purple-100" />}
                     </div>
                     <input 
                        value={magicInput}
                        onChange={(e) => setMagicInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleMagicEdit()}
                        placeholder="AI 指令修改 (例如: 把字变大，背景换成雪山...)"
                        className="flex-1 bg-transparent text-sm border-none focus:ring-0 p-0 placeholder:text-neutral-400"
                     />
                     <button onClick={handleMagicEdit} className="p-2 bg-black hover:bg-neutral-800 text-white rounded-xl transition-colors"><SendHorizontal className="w-4 h-4" /></button>
                 </div>

                 <button 
                    onClick={() => handleDownload()}
                    disabled={!state.generatedImage}
                    className="w-full h-12 bg-neutral-900 text-white disabled:bg-neutral-200 disabled:text-neutral-400 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-black shadow-lg shadow-black/5"
                >
                     <Download className="w-4 h-4" /> 保存高清原图
                 </button>
             </div>
        </div>
    </div>
  );
};
