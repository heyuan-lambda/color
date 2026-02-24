/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, RefreshCcw, Eye, Info, ChevronRight, Play, Languages } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---
interface ColorHSL {
  h: number;
  s: number;
  l: number;
}

type Language = 'en' | 'zh';

const translations = {
  en: {
    title: "CHROMA VISION",
    subtitle: "Art Student Challenge",
    score: "Score",
    time: "Time",
    startTitle: "Test Your Eyes.",
    startDesc: "Find the block with the slightly different shade. As you progress, the difference becomes nearly invisible.",
    startBtn: "START CHALLENGE",
    difficultyTitle: "Difficulty",
    difficultyDesc: "Dynamic scaling based on your precision.",
    rankingTitle: "Ranking",
    rankingDesc: "Score 30+ to reach 'Master' level.",
    gameOverTitle: "SESSION OVER",
    gameOverSubtitle: "Final Performance Report",
    blocksFound: "Blocks Found",
    visionGrade: "Vision Grade",
    tryAgain: "TRY AGAIN",
    currentDelta: "Current Delta",
    lightnessDiff: "Lightness Diff",
    proTipTitle: "Pro Tip",
    proTipDesc: "Art students often find that unfocusing their eyes slightly helps detect subtle value shifts.",
    version: "Precision Tool v1.0",
    calibrated: "Calibrated for sRGB",
    docs: "Documentation",
    method: "Methodology"
  },
  zh: {
    title: "色彩敏感度挑战",
    subtitle: "艺术生专项训练",
    score: "得分",
    time: "用时",
    startTitle: "视觉敏锐度测试",
    startDesc: "在色块矩阵中找出那个颜色略有不同的方块。随着关卡推进，色差将变得极难察觉。",
    startBtn: "开始挑战",
    difficultyTitle: "难度系数",
    difficultyDesc: "根据您的点击精度动态调整色差。",
    rankingTitle: "等级评定",
    rankingDesc: "得分超过 30 分即可达到“大师”级别。",
    gameOverTitle: "挑战结束",
    gameOverSubtitle: "最终视觉表现报告",
    blocksFound: "找到的方块",
    visionGrade: "视觉等级",
    tryAgain: "再次尝试",
    currentDelta: "当前色差",
    lightnessDiff: "亮度差异",
    proTipTitle: "专家建议",
    proTipDesc: "艺术生通常发现，稍微放松眼部焦距有助于察觉细微的明度变化。",
    version: "精准工具 v1.0",
    calibrated: "sRGB 色域校准",
    docs: "开发文档",
    method: "算法说明"
  }
};

// --- Constants ---
const GRID_SIZE = 5;
const INITIAL_TIME = 60;
const INITIAL_DIFF = 20; // Initial HSL lightness difference
const MIN_DIFF = 1.5;    // Minimum HSL lightness difference

export default function App() {
  const [lang, setLang] = useState<Language>('zh');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [grid, setGrid] = useState<ColorHSL[]>([]);
  const [targetIndex, setTargetIndex] = useState(-1);
  const [difficulty, setDifficulty] = useState(INITIAL_DIFF);
  const [lastDiff, setLastDiff] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const t = translations[lang];

  // --- Helpers ---
  const generateColor = (): ColorHSL => ({
    h: Math.floor(Math.random() * 360),
    s: 40 + Math.floor(Math.random() * 40), // 40-80% saturation
    l: 30 + Math.floor(Math.random() * 40), // 30-70% lightness
  });

  const getTargetColor = (base: ColorHSL, diff: number): ColorHSL => {
    const direction = Math.random() > 0.5 ? 1 : -1;
    return {
      ...base,
      l: Math.max(0, Math.min(100, base.l + (diff * direction))),
    };
  };

  const generateLevel = useCallback((currentScore: number) => {
    const baseColor = generateColor();
    const newDiff = Math.max(MIN_DIFF, INITIAL_DIFF - Math.log2(currentScore + 1) * 3.5);
    setDifficulty(newDiff);
    setLastDiff(newDiff);

    const newGrid = Array(GRID_SIZE * GRID_SIZE).fill(null).map(() => ({ ...baseColor }));
    const targetIdx = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
    newGrid[targetIdx] = getTargetColor(baseColor, newDiff);

    setGrid(newGrid);
    setTargetIndex(targetIdx);
  }, []);

  // --- Game Actions ---
  const startGame = () => {
    setScore(0);
    setTimeLeft(INITIAL_TIME);
    setIsActive(true);
    setIsGameOver(false);
    generateLevel(0);
  };

  const handleBlockClick = (index: number) => {
    if (!isActive || isGameOver) return;

    if (index === targetIndex) {
      const newScore = score + 1;
      setScore(newScore);
      generateLevel(newScore);
      
      if (newScore % 10 === 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
      }
    } else {
      setTimeLeft(prev => Math.max(0, prev - 3));
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  // --- Effects ---
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            setIsGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const hslToCss = (color: ColorHSL) => `hsl(${color.h}, ${color.s}%, ${color.l}%)`;

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 py-8 flex justify-between items-center border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
            <Eye size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
            <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-8">
          <button 
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/5 hover:bg-black/5 transition-colors text-[10px] font-bold uppercase tracking-wider"
          >
            <Languages size={14} />
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold mb-1">{t.score}</p>
            <p className="text-2xl font-mono font-medium leading-none">{score}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold mb-1">{t.time}</p>
            <p className={`text-2xl font-mono font-medium leading-none ${timeLeft < 10 ? 'text-red-500' : ''}`}>
              {timeLeft}s
            </p>
          </div>
        </div>
      </header>

      {/* Mobile Stats Bar */}
      <div className="sm:hidden flex justify-around py-4 bg-white border-b border-black/5">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold mb-1">{t.score}</p>
          <p className="text-xl font-mono font-medium leading-none">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold mb-1">{t.time}</p>
          <p className={`text-xl font-mono font-medium leading-none ${timeLeft < 10 ? 'text-red-500' : ''}`}>
            {timeLeft}s
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!isActive && !isGameOver ? (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center max-w-md"
            >
              <div className="mb-8 p-8 bg-white border border-black/5 rounded-3xl shadow-sm">
                <h2 className="text-3xl font-bold mb-4">{t.startTitle}</h2>
                <p className="text-black/60 mb-8 leading-relaxed">
                  {t.startDesc}
                </p>
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/90 transition-colors group"
                >
                  <Play size={18} fill="currentColor" />
                  {t.startBtn}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-left">
                  <Info size={16} className="text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">{t.difficultyTitle}</p>
                  <p className="text-xs text-emerald-800/70">{t.difficultyDesc}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-left">
                  <Trophy size={16} className="text-blue-600 mb-2" />
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">{t.rankingTitle}</p>
                  <p className="text-xs text-blue-800/70">{t.rankingDesc}</p>
                </div>
              </div>
            </motion.div>
          ) : isGameOver ? (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center w-full max-w-md"
            >
              <div className="p-10 bg-white border border-black/5 rounded-[40px] shadow-xl mb-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy size={40} />
                </div>
                <h2 className="text-4xl font-black mb-2">{t.gameOverTitle}</h2>
                <p className="text-black/40 uppercase tracking-[0.2em] text-xs font-bold mb-8">{t.gameOverSubtitle}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-black/5 p-6 rounded-3xl">
                    <p className="text-3xl font-mono font-bold">{score}</p>
                    <p className="text-[10px] font-bold text-black/40 uppercase">{t.blocksFound}</p>
                  </div>
                  <div className="bg-black/5 p-6 rounded-3xl">
                    <p className="text-3xl font-mono font-bold">
                      {score > 40 ? 'S' : score > 30 ? 'A' : score > 20 ? 'B' : 'C'}
                    </p>
                    <p className="text-[10px] font-bold text-black/40 uppercase">{t.visionGrade}</p>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/90 transition-colors"
                >
                  <RefreshCcw size={18} />
                  {t.tryAgain}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col items-center"
            >
              {/* Game Grid */}
              <div 
                className="grid gap-2 md:gap-3 p-3 bg-white border border-black/5 rounded-3xl shadow-sm mb-12"
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  width: 'min(90vw, 500px)',
                  aspectRatio: '1/1'
                }}
              >
                {grid.map((color, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBlockClick(idx)}
                    className="w-full h-full rounded-lg md:rounded-xl transition-shadow hover:shadow-inner cursor-pointer"
                    style={{ backgroundColor: hslToCss(color) }}
                  />
                ))}
              </div>

              {/* Visualization / Info */}
              <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white border border-black/5 rounded-3xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">{t.currentDelta}</h3>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-mono font-medium">{lastDiff.toFixed(1)}%</span>
                    <span className="text-[10px] text-black/40 mb-1 font-bold uppercase">{t.lightnessDiff}</span>
                  </div>
                  <div className="mt-4 h-1 w-full bg-black/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-black"
                      animate={{ width: `${(lastDiff / INITIAL_DIFF) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-6 bg-white border border-black/5 rounded-3xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">{t.proTipTitle}</h3>
                  </div>
                  <p className="text-xs text-black/60 leading-relaxed italic">
                    "{t.proTipDesc}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-black/5 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/30">
              {t.version}
            </div>
            <div className="w-1 h-1 rounded-full bg-black/10" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/30">
              {t.calibrated}
            </div>
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors">{t.docs}</a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors">{t.method}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
