
import React, { useRef, useState } from 'react';
import { Upload, Type, Layout, Palette, Trash2, Plus, Zap, Save, Image as ImageIcon, Minus, ChevronDown, Check } from 'lucide-react';
import { AspectRatio, CoverState, CoverAction, ThemeMode } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { generateCoverImage } from '../services/geminiService';

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
      // Logic:
      // Mobile: Switch to Result View
      // Desktop: Stay on Editor, but show loading state in Preview (handled by isGenerating state)
      
      dispatch({ type: 'SET_IS_GENERATING', payload: true });
      // Only switch view on mobile if needed, but for simplicity we can set it. 
      // The parent component handles visibility. On desktop viewMode is ignored for layout but updated in state.
      if (window.innerWidth < 768) {
        dispatch({ type: 'SET_VIEW_MODE', payload: 'RESULT' });
      }
      
      try {
        const imageUrl = await generateCoverImage({
            activePrompt: state.activePrompt,
            aspectRatio: state.aspectRatio,
            subjectImage: state.subjectImage,
            referenceImage: state.referenceImage,
            themeMode: state.themeMode
        });
        dispatch({ type: 'SET_GENERATED_IMAGE', payload: imageUrl });
      } catch (e) {
          alert("生成失败，请重试");
      } finally {
        dispatch({ type: 'SET_IS_GENERATING', payload: false });
      }
  };

  const COLORS = ['#000000', '#333333', '#ffffff', '#ef4444', '#2563eb', '#f59e0b'];

  const ColorPicker = ({ label, value, onChange }: { label: string, value: string, onChange: (c: string) => void }) => (
      <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-neutral-500 font-medium">{label}</span>
          <div className="flex gap-2 items-center">
              {COLORS.slice(0, 3).map(c => (
                  <button 
                    key={c}
                    onClick={() => onChange(c)}
                    className={`w-5 h-5 rounded-full border border-neutral-200 transition-transform hover:scale-110 ${value === c ? 'ring-2 ring-black ring-offset-2' : ''}`}
                    style={{ backgroundColor: c }}
                  />
              ))}
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-neutral-200 shadow-sm">
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0" />
              </div>
          </div>
      </div>
  );

  return (
    <div className="font-['PingFang_SC'] pb-24 md:pb-10">
      
      {/* Sidebar Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-neutral-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
                <h1 className="font-bold text-lg leading-none tracking-tight">小红书主图生成器</h1>
            </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-10">
        
        {/* 1. Style Section */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Palette className="w-3.5 h-3.5 text-neutral-600" />
                 </div>
                 <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">1. 风格调性</h3>
            </div>

            {/* Style Selector */}
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

            {/* Actions */}
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

            {/* Add Style Form */}
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

            {/* Prompt Editor */}
            <div>
                 <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1.5 block">当前提示词 (Prompt)</label>
                 <textarea 
                    value={state.activePrompt}
                    onChange={(e) => dispatch({ type: 'SET_ACTIVE_PROMPT', payload: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-600 focus:ring-1 focus:ring-black focus:border-black outline-none resize-none h-20 leading-relaxed shadow-sm transition-all"
                />
            </div>
        </section>

        <hr className="border-neutral-100" />

        {/* 2. Content Section */}
        <section className="space-y-5">
             <div className="flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Type className="w-3.5 h-3.5 text-neutral-600" />
                 </div>
                 <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">2. 内容与排版</h3>
            </div>

             {/* Theme Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-100/50 p-1 rounded-lg border border-neutral-200">
                <button 
                    onClick={() => dispatch({ type: 'SET_THEME_MODE', payload: 'LIGHT' })}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${state.themeMode === 'LIGHT' ? 'bg-white shadow-sm text-black ring-1 ring-black/5' : 'text-neutral-500 hover:bg-white/50'}`}
                >
                    <div className="w-3 h-3 rounded-full border border-neutral-300 bg-white"></div> 白底模式
                </button>
                <button 
                    onClick={() => dispatch({ type: 'SET_THEME_MODE', payload: 'DARK' })}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${state.themeMode === 'DARK' ? 'bg-black shadow-sm text-white' : 'text-neutral-500 hover:bg-neutral-200/50'}`}
                >
                    <div className="w-3 h-3 rounded-full border border-neutral-500 bg-black"></div> 黑底模式
                </button>
            </div>
            
            <div className="space-y-5">
                {/* Title */}
                <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block">主标题</label>
                    <input 
                        value={state.title}
                        onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
                        placeholder="输入大标题"
                        className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2.5 text-sm font-bold placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black outline-none shadow-sm transition-all"
                    />
                    <ColorPicker 
                        label="颜色" 
                        value={state.titleColor} 
                        onChange={(c) => dispatch({ type: 'SET_TITLE_COLOR', payload: c })} 
                    />
                </div>

                {/* Subtitle */}
                <div>
                     <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block">副标题</label>
                    <input 
                        value={state.subtitle}
                        onChange={(e) => dispatch({ type: 'SET_SUBTITLE', payload: e.target.value })}
                        placeholder="输入副标题"
                        className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2.5 text-sm font-medium placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black outline-none shadow-sm transition-all"
                    />
                     <ColorPicker 
                        label="颜色" 
                        value={state.subtitleColor} 
                        onChange={(c) => dispatch({ type: 'SET_SUBTITLE_COLOR', payload: c })} 
                    />
                </div>

                {/* Footer */}
                <div>
                     <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block">底部标签</label>
                    <input 
                        value={state.footer}
                        onChange={(e) => dispatch({ type: 'SET_FOOTER', payload: e.target.value })}
                        placeholder="底部文字"
                        className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2.5 text-xs font-medium placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black outline-none shadow-sm transition-all"
                    />
                     <ColorPicker 
                        label="文字颜色 (背景自动反色)" 
                        value={state.footerColor} 
                        onChange={(c) => dispatch({ type: 'SET_FOOTER_COLOR', payload: c })} 
                    />
                </div>
            </div>
        </section>

        <hr className="border-neutral-100" />

        {/* 3. Layout Section */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Layout className="w-3.5 h-3.5 text-neutral-600" />
                 </div>
                 <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">3. 构图与素材</h3>
            </div>
            
            {/* Aspect Ratio */}
            <div className="grid grid-cols-2 gap-3">
                {[AspectRatio.PORTRAIT, AspectRatio.SQUARE].map(ratio => (
                    <button
                        key={ratio}
                        onClick={() => dispatch({ type: 'SET_ASPECT_RATIO', payload: ratio })}
                        className={`py-2.5 rounded-lg border text-xs font-bold transition-all ${state.aspectRatio === ratio ? 'border-black bg-black text-white shadow-md' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'}`}
                    >
                        {ratio === AspectRatio.PORTRAIT ? '3:4 竖版' : '1:1 方形'}
                    </button>
                ))}
            </div>

            {/* Uploads */}
            <div className="grid grid-cols-2 gap-3">
                 <div onClick={() => subjectInputRef.current?.click()} className="aspect-square rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-neutral-50 hover:border-neutral-400 transition-all relative overflow-hidden group">
                    <input type="file" ref={subjectInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'SUBJECT')} />
                    {state.subjectImage ? (
                        <div className="relative w-full h-full p-2">
                            <img src={state.subjectImage} className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">更换</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Plus className="w-4 h-4 text-neutral-500" />
                            </div>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase">上传主体</span>
                        </>
                    )}
                 </div>
                 <div onClick={() => referenceInputRef.current?.click()} className="aspect-square rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-neutral-50 hover:border-neutral-400 transition-all relative overflow-hidden group">
                    <input type="file" ref={referenceInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'REFERENCE')} />
                    {state.referenceImage ? (
                        <div className="relative w-full h-full">
                            <img src={state.referenceImage} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">更换</span>
                            </div>
                        </div>
                    ) : (
                        <>
                           <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-4 h-4 text-neutral-500" />
                            </div>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase">参考风格</span>
                        </>
                    )}
                 </div>
            </div>
        </section>

      </div>

      {/* Generate Button - Sticky Bottom */}
      <div className="sticky bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-neutral-200">
          <button 
            onClick={handleGenerateClick}
            disabled={state.isGenerating}
            className="w-full h-12 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-xl font-bold text-base shadow-lg shadow-black/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
              {state.isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    生成中...
                  </>
              ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" /> 立即生成
                  </>
              )}
          </button>
      </div>
    </div>
  );
};
