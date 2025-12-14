
import React, { useRef, useState } from 'react';
import { Type, Palette, Trash2, Plus, Zap, ChevronDown, ImageIcon, Wand2, Smartphone, MonitorPlay, Instagram, Layout } from 'lucide-react';
import { AspectRatio, CoverState, CoverAction, ToolMode, ViralLayout } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { generateCoverImage, polishTitle } from '../services/geminiService';

interface ControlPanelProps {
  state: CoverState;
  dispatch: React.Dispatch<CoverAction>;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ state, dispatch }) => {
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  
  // Style Adding State
  const [showAddStyle, setShowAddStyle] = useState(false);
  const [newStyleName, setNewStyleName] = useState("");
  const [newStylePrompt, setNewStylePrompt] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'SUBJECT' | 'REFERENCE') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'SUBJECT') {
          dispatch({ type: 'SET_SUBJECT_IMAGE', payload: reader.result as string });
        } else {
          dispatch({ type: 'SET_REFERENCE_IMAGE', payload: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNewStyle = () => {
    if (!newStyleName.trim() || !newStylePrompt.trim()) return;
    dispatch({
      type: 'ADD_STYLE',
      payload: { label: newStyleName, prompt: newStylePrompt }
    });
    setNewStyleName("");
    setNewStylePrompt("");
    setShowAddStyle(false);
  };

  const handleDeleteStyle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (state.styles.length <= 1) return;
    dispatch({ type: 'DELETE_STYLE', payload: id });
  };

  const handleGenerateClick = async () => {
      if (!state.apiKey) {
          alert("请先配置 API Key");
          return;
      }
      dispatch({ type: 'SET_IS_GENERATING', payload: true });
      if (window.innerWidth < 768) {
        dispatch({ type: 'SET_VIEW_MODE', payload: 'RESULT' });
      }
      
      try {
        const imageUrl = await generateCoverImage(state.apiKey, {
            activePrompt: state.activePrompt,
            aspectRatio: state.aspectRatio,
            subjectImage: state.subjectImage,
            referenceImage: state.referenceImage,
            toolMode: state.toolMode,
            viralLayout: state.viralLayout
        });
        dispatch({ type: 'SET_GENERATED_IMAGE', payload: imageUrl });
      } catch (e) {
          console.error(e);
          alert("生成失败，请检查 API Key 或网络");
      } finally {
        dispatch({ type: 'SET_IS_GENERATING', payload: false });
      }
  };

  const handlePolishTitle = async () => {
    if (!state.title || !state.apiKey) return;
    dispatch({ type: 'SET_IS_POLISHING', payload: true });
    try {
      const newTitle = await polishTitle(state.apiKey, state.title);
      dispatch({ type: 'SET_TITLE', payload: newTitle });
    } catch (e) {
      console.error(e);
    } finally {
      dispatch({ type: 'SET_IS_POLISHING', payload: false });
    }
  };

  // Shared Style Selector Component
  const StyleSelector = () => (
    <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center">
                <Palette className="w-3.5 h-3.5 text-neutral-600" />
                </div>
                <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">风格调性 (Style)</h3>
        </div>

        <div className="relative group">
            <select 
                value={state.selectedStyleId}
                onChange={(e) => dispatch({ type: 'SELECT_STYLE', payload: e.target.value })}
                className="w-full appearance-none bg-white border border-neutral-300 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all cursor-pointer hover:border-neutral-400 shadow-sm"
            >
                {state.styles.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        <div className="flex justify-between items-center px-1">
            <button 
                onClick={() => setShowAddStyle(!showAddStyle)}
                className="text-xs font-semibold text-blue-600 flex items-center gap-1.5 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
            >
                <Plus className="w-3.5 h-3.5" /> 新建风格
            </button>
            {state.styles.length > 1 && (
                <button 
                    onClick={(e) => handleDeleteStyle(e, state.selectedStyleId)}
                    className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" /> 删除
                </button>
            )}
        </div>

        <AnimatePresence>
            {showAddStyle && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm space-y-3 mt-2 ring-1 ring-blue-50">
                        <input 
                            type="text" 
                            placeholder="风格名称 (例如: 极简科技)" 
                            value={newStyleName}
                            onChange={(e) => setNewStyleName(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <textarea 
                            placeholder="输入该风格的绘画提示词 (Prompt)..." 
                            value={newStylePrompt}
                            onChange={(e) => setNewStylePrompt(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <div className="flex gap-2">
                            <button onClick={handleSaveNewStyle} className="flex-1 bg-black text-white rounded-lg py-2 text-xs font-bold hover:bg-neutral-800 transition-colors">确认添加</button>
                            <button onClick={() => setShowAddStyle(false)} className="flex-1 bg-white border border-neutral-200 text-neutral-600 rounded-lg py-2 text-xs hover:bg-neutral-50 transition-colors">取消</button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

            <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1.5 block">当前提示词 (Prompt)</label>
                <textarea 
                value={state.activePrompt}
                onChange={(e) => dispatch({ type: 'SET_ACTIVE_PROMPT', payload: e.target.value })}
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-600 focus:ring-1 focus:ring-black focus:border-black outline-none resize-none h-20 leading-relaxed shadow-sm transition-all"
            />
        </div>
    </section>
  );

  // Shared Asset Uploader
  const AssetUploader = () => (
    <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center">
            <ImageIcon className="w-3.5 h-3.5 text-neutral-600" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">参考素材 (Assets)</h3>
    </div>

    <div className="grid grid-cols-2 gap-3">
            <div onClick={() => subjectInputRef.current?.click()} className="h-32 rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center bg-neutral-50 cursor-pointer hover:bg-white hover:border-neutral-400 transition-all group overflow-hidden relative">
                <input type="file" ref={subjectInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'SUBJECT')} />
                {state.subjectImage ? (
                    <img src={state.subjectImage} className="w-full h-full object-contain p-2" />
                ) : (
                    <>
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Plus className="w-4 h-4 text-neutral-500" />
                        </div>
                        <span className="text-xs text-neutral-500 font-medium">主体参考图</span>
                    </>
                )}
            </div>

            <div onClick={() => referenceInputRef.current?.click()} className="h-32 rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center bg-neutral-50 cursor-pointer hover:bg-white hover:border-neutral-400 transition-all group overflow-hidden relative">
                <input type="file" ref={referenceInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'REFERENCE')} />
                {state.referenceImage ? (
                    <img src={state.referenceImage} className="w-full h-full object-cover" />
                ) : (
                    <>
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Plus className="w-4 h-4 text-neutral-500" />
                        </div>
                        <span className="text-xs text-neutral-500 font-medium">风格参考图</span>
                    </>
                )}
            </div>
    </div>
    </section>
  );

  return (
    <div className="font-['PingFang_SC'] pb-24 md:pb-10 min-h-full bg-white">
      
      {/* Header & Switcher */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-neutral-100 px-6 py-4 space-y-4">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
                <h1 className="font-bold text-lg leading-none tracking-tight">AI 设计助手</h1>
            </div>
        </div>
        
        {/* Mode Switcher */}
        <div className="flex bg-neutral-100 p-1 rounded-xl">
           <button 
             onClick={() => dispatch({ type: 'SET_TOOL_MODE', payload: ToolMode.PRODUCT_GEN })}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${state.toolMode === ToolMode.PRODUCT_GEN ? 'bg-white shadow-sm text-black' : 'text-neutral-500 hover:text-neutral-700'}`}
           >
             主图生成器
           </button>
           <button 
             onClick={() => dispatch({ type: 'SET_TOOL_MODE', payload: ToolMode.VIRAL_COVER })}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${state.toolMode === ToolMode.VIRAL_COVER ? 'bg-white shadow-sm text-black' : 'text-neutral-500 hover:text-neutral-700'}`}
           >
             爆款封面生成
           </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        
        {/* === VIRAL COVER MODE UI === */}
        {state.toolMode === ToolMode.VIRAL_COVER ? (
           <>
              {/* Step 1: Platform/Ratio */}
              <section className="space-y-3">
                 <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px]">1</span>
                    平台选择 (Platform)
                 </h3>
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: AspectRatio.PORTRAIT, label: '小红书', ratio: '3:4', icon: <Instagram className="w-4 h-4"/> },
                      { id: AspectRatio.WIDE_2_35, label: '公众号', ratio: '2.35:1', icon: <Smartphone className="w-4 h-4"/> },
                      { id: AspectRatio.STORY_9_16, label: '抖音', ratio: '9:16', icon: <Smartphone className="w-4 h-4"/> },
                      { id: AspectRatio.VIDEO_4_3, label: 'Bilibili', ratio: '4:3', icon: <MonitorPlay className="w-4 h-4"/> },
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => dispatch({ type: 'SET_ASPECT_RATIO', payload: item.id })}
                        className={`p-3 rounded-xl border text-left transition-all group ${state.aspectRatio === item.id ? 'border-black bg-neutral-50 ring-1 ring-black/5' : 'border-neutral-200 hover:border-neutral-300'}`}
                      >
                         <div className="flex justify-between items-start mb-2">
                           <span className={`font-bold text-sm ${state.aspectRatio === item.id ? 'text-black' : 'text-neutral-600'}`}>{item.label}</span>
                           <span className="text-[10px] text-neutral-400 font-mono bg-neutral-100 px-1.5 py-0.5 rounded">{item.ratio}</span>
                         </div>
                      </button>
                    ))}
                 </div>
              </section>

              {/* Step 2: Visual Style (Unified) */}
              <StyleSelector />

              {/* Step 3: Layout Strategy */}
              <section className="space-y-3">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px]">3</span>
                        排版布局 (Layout)
                    </h3>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: ViralLayout.CLASSIC, label: '经典层级', en: 'Classic' },
                      { id: ViralLayout.SPLIT, label: '左右分栏', en: 'Split' },
                      { id: ViralLayout.DIAGONAL, label: '动感对角', en: 'Diagonal' },
                      { id: ViralLayout.BIG_TYPE, label: '大字报', en: 'Big Type' },
                    ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => dispatch({ type: 'SET_VIRAL_LAYOUT', payload: style.id })}
                          className={`p-3 rounded-xl border transition-all h-16 flex flex-col justify-center ${state.viralLayout === style.id ? 'border-black bg-black text-white shadow-lg' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'}`}
                        >
                            <span className="text-sm font-bold">{style.label}</span>
                            <span className={`text-[10px] ${state.viralLayout === style.id ? 'text-neutral-400' : 'text-neutral-400'}`}>{style.en}</span>
                        </button>
                    ))}
                 </div>
              </section>

              {/* Step 4: Content */}
              <section className="space-y-3">
                 <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px]">4</span>
                    内容与标题 (Content)
                 </h3>
                 <div className="space-y-3">
                    <div className="relative">
                        <input 
                            value={state.title}
                            onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
                            placeholder="输入主标题 (例如: 沉浸式降噪)"
                            className="w-full bg-white border border-neutral-300 rounded-lg pl-4 pr-24 py-3 text-sm font-bold focus:border-black focus:ring-1 focus:ring-black outline-none shadow-sm"
                        />
                        <button 
                            onClick={handlePolishTitle}
                            disabled={state.isPolishing || !state.title}
                            className="absolute right-1.5 top-1.5 bottom-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            {state.isPolishing ? <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin"/> : <Wand2 className="w-3 h-3" />}
                            AI 润色
                        </button>
                    </div>
                    <input 
                        value={state.subtitle}
                        onChange={(e) => dispatch({ type: 'SET_SUBTITLE', payload: e.target.value })}
                        placeholder="输入副标题 (可选)"
                        className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-black focus:ring-1 focus:ring-black outline-none shadow-sm"
                    />
                 </div>
              </section>

              {/* Step 5: Assets */}
              <AssetUploader />
           </>
        ) : (
          /* === PRODUCT GEN MODE === */
          <>
            {/* Style Selector (Unified) */}
            <StyleSelector />

            <hr className="border-neutral-100" />

            {/* Content Section */}
            <section className="space-y-5">
                 <div className="flex items-center gap-2 mb-2">
                     <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Type className="w-3.5 h-3.5 text-neutral-600" />
                     </div>
                     <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">2. 内容与排版</h3>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block">主标题</label>
                        <input 
                            value={state.title}
                            onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
                            placeholder="输入大标题"
                            className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2.5 text-sm font-bold placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black outline-none shadow-sm transition-all"
                        />
                    </div>

                    <div>
                         <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block">副标题</label>
                        <input 
                            value={state.subtitle}
                            onChange={(e) => dispatch({ type: 'SET_SUBTITLE', payload: e.target.value })}
                            placeholder="输入副标题"
                            className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2.5 text-sm font-medium placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black outline-none shadow-sm transition-all"
                        />
                    </div>

                    <div>
                         <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block">底部标签</label>
                        <input 
                            value={state.footer}
                            onChange={(e) => dispatch({ type: 'SET_FOOTER', payload: e.target.value })}
                            placeholder="底部文字"
                            className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2.5 text-sm font-medium placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black outline-none shadow-sm transition-all"
                        />
                    </div>
                </div>
            </section>

            <hr className="border-neutral-100" />

            {/* Asset Section */}
            <AssetUploader />
          </>
        )}

        <div className="pt-4 pb-8">
            <button 
                onClick={handleGenerateClick}
                disabled={state.isGenerating}
                className="w-full bg-black text-white rounded-xl py-4 font-bold text-base shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
                {state.isGenerating ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        AI 绘制中...
                    </>
                ) : (
                    <>
                        <Zap className="w-5 h-5 fill-white" />
                        立即生成
                    </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
};
