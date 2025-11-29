
import React, { useRef, useState } from 'react';
import { AspectRatio, CoverState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Sparkles, SendHorizontal, ArrowLeft, Share2 } from 'lucide-react';
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
      if (!magicInput.trim()) return;
      setIsMagicLoading(true);
      try {
          const result = await interpretEditCommand(magicInput, state.activePrompt, state.textScale);
          if (result.action === 'UPDATE_STYLE' && result.updates) {
              if (result.updates.textScale) dispatch({ type: 'SET_TEXT_SCALE', payload: result.updates.textScale });
              // Simple heuristic to apply color to title if specific color mentioned, can be expanded
              if (result.updates.textColor) dispatch({ type: 'SET_TITLE_COLOR', payload: result.updates.textColor }); 
          } else if (result.action === 'REGENERATE' && result.updates?.newPrompt) {
              dispatch({ type: 'SET_IS_GENERATING', payload: true });
              dispatch({ type: 'SET_ACTIVE_PROMPT', payload: result.updates.newPrompt });
              const url = await generateCoverImage({
                  activePrompt: result.updates.newPrompt,
                  aspectRatio: state.aspectRatio,
                  subjectImage: state.subjectImage,
                  referenceImage: state.referenceImage,
                  themeMode: state.themeMode
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

  const isLightColor = (hex: string) => {
      const c = hex.substring(1);      
      const rgb = parseInt(c, 16);   
      const r = (rgb >> 16) & 0xff;  
      const g = (rgb >>  8) & 0xff;  
      const b = (rgb >>  0) & 0xff;  
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; 
      return luma > 128;
  };
  
  const footerBgColor = isLightColor(state.footerColor) ? 'black' : 'white';
  const footerTextColor = state.footerColor;

  return (
    <div className="w-full h-full flex flex-col font-['PingFang_SC']">
        
        {/* Navbar - Only visible on Mobile or when acting as a modal */}
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
                className={`relative bg-white shadow-xl shadow-black/5 rounded-[20px] overflow-hidden flex-none
                   ${state.aspectRatio === AspectRatio.PORTRAIT ? 'aspect-[3/4] h-[65vh] md:h-[75vh]' : 'aspect-square w-full max-w-[85vw] md:max-w-[65vh]'}
                `}
                style={{ backgroundColor: state.themeMode === 'DARK' ? '#000' : '#fff' }}
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

                {/* Text Layers */}
                <div className="absolute inset-0 z-10 p-[8%] flex flex-col justify-between items-center text-center pointer-events-none">
                    {/* Header Group */}
                    <div className="flex flex-col gap-[1.5em] mt-4 w-full">
                        <h1 
                            className="font-bold leading-[1.1] whitespace-pre-wrap break-words"
                            style={{ 
                                fontSize: `${2 * state.textScale}rem`,
                                color: state.titleColor,
                                textShadow: '0 2px 20px rgba(0,0,0,0.05)' 
                            }}
                        >
                            {state.title}
                        </h1>
                        <h2 
                            className="font-medium tracking-wide opacity-90 whitespace-pre-wrap break-words"
                            style={{ 
                                fontSize: `${0.9 * state.textScale}rem`,
                                color: state.subtitleColor 
                            }}
                        >
                            {state.subtitle}
                        </h2>
                    </div>

                    {/* Footer Box */}
                    <div className="mb-2">
                        <span 
                            className="font-bold tracking-[0.2em] uppercase px-[1em] py-[0.5em] rounded-md shadow-sm inline-block"
                            style={{ 
                                fontSize: `${0.7 * state.textScale}rem`,
                                backgroundColor: footerBgColor,
                                color: footerTextColor
                            }}
                        >
                            {state.footer}
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* Bottom Actions - Fixed on Desktop Bottom */}
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
