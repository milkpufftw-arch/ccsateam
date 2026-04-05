/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Users, 
  RefreshCw, 
  Copy, 
  Download, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Papa from 'papaparse';
import { cn } from './lib/utils';
import { Member, Group, AppStatus } from './types';

export default function App() {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [minGroupSize, setMinGroupSize] = useState<number>(8);
  const [maxGroupSize, setMaxGroupSize] = useState<number>(9);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'); // Drumroll/suspense sound
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processRawData(results.data as any[]);
      },
      error: (err) => {
        setError('CSV 解析失敗：' + err.message);
      }
    });
  };

  const handlePasteImport = () => {
    if (!inputText.trim()) return;
    
    // Attempt to parse TSV/CSV from text
    const rows = inputText.trim().split('\n');
    const data = rows.map((row, index) => {
      const cols = row.split(/[\t,]/);
      return {
        區域: cols[0]?.trim(),
        年資: cols[1]?.trim(),
        姓名: cols[2]?.trim()
      };
    });
    
    processRawData(data);
  };

  const processRawData = (data: any[]) => {
    try {
      const parsedMembers: Member[] = data
        .filter(item => item.姓名 && item.區域)
        .map((item, index) => ({
          id: `member-${index}-${Date.now()}`,
          name: item.姓名,
          region: item.區域,
          seniority: parseFloat(item.年資) || 0
        }));

      if (parsedMembers.length === 0) {
        throw new Error('找不到有效的名單資料，請確認欄位包含：區域、年資、姓名');
      }

      setMembers(parsedMembers);
      setError(null);
      setInputText('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startGrouping = () => {
    if (members.length < 2) {
      setError('至少需要 2 人才能進行分組');
      return;
    }

    setStatus('processing');
    setError(null);
    
    // Play sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // Simulate "Slot Machine" effect for 2.5 seconds
    setTimeout(() => {
      performGrouping();
    }, 2500);
  };

  const performGrouping = () => {
    const total = members.length;
    // Calculate group count based on average of min and max
    const avgSize = (minGroupSize + maxGroupSize) / 2;
    const groupCount = Math.max(1, Math.round(total / avgSize));
    const newGroups: Group[] = Array.from({ length: groupCount }, (_, i) => ({
      id: i + 1,
      members: []
    }));

    // Grouping Algorithm:
    // 1. Group by region
    const byRegion: Record<string, Member[]> = {};
    members.forEach(m => {
      if (!byRegion[m.region]) byRegion[m.region] = [];
      byRegion[m.region].push(m);
    });

    // 2. Sort each region by seniority
    Object.keys(byRegion).forEach(region => {
      byRegion[region].sort((a, b) => a.seniority - b.seniority);
    });

    // 3. Flatten into a balanced list (interleaving regions)
    const regions = Object.keys(byRegion).sort((a, b) => byRegion[b].length - byRegion[a].length);
    const balancedList: Member[] = [];
    let hasMore = true;
    let pass = 0;

    while (hasMore) {
      hasMore = false;
      regions.forEach(region => {
        if (byRegion[region][pass]) {
          balancedList.push(byRegion[region][pass]);
          hasMore = true;
        }
      });
      pass++;
    }

    // 4. Round-robin distribution
    balancedList.forEach((member, index) => {
      const groupIdx = index % groupCount;
      newGroups[groupIdx].members.push(member);
    });

    setGroups(newGroups);
    setStatus('result');
    
    // Confetti!
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff007f', '#ccff00', '#00f0ff', '#bc13fe']
    });
  };

  const reset = () => {
    setStatus('idle');
    setGroups([]);
  };

  const clearMembers = () => {
    setMembers([]);
    setGroups([]);
    setStatus('idle');
  };

  const copyResults = () => {
    const text = groups.map(g => {
      const membersStr = g.members.map(m => `${m.name}(${m.region}, ${m.seniority}y)`).join(', ');
      return `第 ${g.id} 組: ${membersStr}`;
    }).join('\n');
    
    navigator.clipboard.writeText(text);
    alert('結果已複製到剪貼簿！');
  };

  return (
    <div className="min-h-screen bg-black overflow-x-hidden font-sans selection:bg-neon-pink selection:text-white">
      {/* Background Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-neon-pink/20 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-neon-blue/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-neon-purple/10 blur-[150px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 rounded-full bg-white/10 border border-white/20 text-neon-pink text-sm font-bold tracking-widest uppercase mb-4"
          >
            CCSA Team Consensus Camp
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6"
          >
            <span className="text-white">隨機</span>
            <span className="text-neon-pink neon-text-glow">分組</span>
            <span className="text-neon-yellow">工具</span>
          </motion.h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            打破隔閡，跨區跨年資，創造最強團隊火花！🔥
          </p>
        </header>

        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.section
              key="import"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-8"
            >
              {/* Data Input Card */}
              <div className="glass p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-neon-pink" />
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Upload className="text-neon-pink" /> 匯入名單
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase mb-2">貼上資料 (區域, 年資, 姓名)</label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="台北	5	王小明&#10;台中	2	李小華..."
                      className="w-full h-48 bg-black/50 border border-white/10 rounded-2xl p-4 focus:border-neon-pink focus:ring-1 focus:ring-neon-pink outline-none transition-all font-mono text-sm"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handlePasteImport}
                      className="flex-1 bg-neon-pink hover:bg-neon-pink/80 text-white font-black py-4 rounded-2xl transition-all active:scale-95 neon-glow flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={20} /> 確認匯入
                    </button>
                    
                    <label className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10">
                      <Download size={20} /> CSV 檔案
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div className="glass p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-neon-blue" />
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Users className="text-neon-blue" /> 目前名單 ({members.length} 人)
                  </h2>
                  {members.length > 0 && (
                    <button 
                      onClick={clearMembers}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                <div className="h-[320px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {members.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 italic">
                      <AlertCircle size={48} className="mb-4 opacity-20" />
                      <p>尚未匯入任何成員</p>
                    </div>
                  ) : (
                    members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                        <span className="font-bold">{m.name}</span>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-neon-blue/20 text-neon-blue border border-neon-blue/30 uppercase">
                            {m.region}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30 uppercase">
                            {m.seniority}Y
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Group Size Settings */}
                <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-3 tracking-widest">分組設定 (每組人數範圍)</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input 
                        type="number" 
                        value={minGroupSize} 
                        onChange={(e) => setMinGroupSize(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-center font-bold focus:border-neon-blue outline-none transition-all"
                        placeholder="最小"
                      />
                      <span className="block text-[10px] text-center mt-1 text-gray-500 font-bold">最小人數</span>
                    </div>
                    <div className="text-gray-600 font-black">TO</div>
                    <div className="flex-1">
                      <input 
                        type="number" 
                        value={maxGroupSize} 
                        onChange={(e) => setMaxGroupSize(Math.max(minGroupSize, parseInt(e.target.value) || minGroupSize))}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-center font-bold focus:border-neon-blue outline-none transition-all"
                        placeholder="最大"
                      />
                      <span className="block text-[10px] text-center mt-1 text-gray-500 font-bold">最大人數</span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={members.length < 2}
                  onClick={startGrouping}
                  className={cn(
                    "w-full mt-6 py-5 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3",
                    members.length >= 2 
                      ? "bg-neon-yellow text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(204,255,0,0.4)]" 
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  )}
                >
                  <Sparkles size={24} /> 開始分組
                </button>
              </div>
            </motion.section>
          )}

          {status === 'processing' && (
            <motion.section
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative w-64 h-64 mb-12">
                {/* Slot Machine Animation Mockup */}
                <div className="absolute inset-0 border-4 border-neon-pink rounded-3xl overflow-hidden glass">
                  <div className="h-full flex flex-col animate-slot">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="h-1/3 flex items-center justify-center text-4xl font-black text-neon-pink opacity-50">
                        GROUPING...
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -inset-4 border border-neon-pink/30 rounded-[40px] animate-pulse" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-widest">
                正在計算最佳組合...
              </h2>
              <p className="text-neon-blue mt-4 font-bold">跨區、跨年資演算法運行中</p>
            </motion.section>
          )}

          {status === 'result' && (
            <motion.section
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <h2 className="text-4xl font-black flex items-center gap-4">
                  <span className="text-neon-pink">分組</span>
                  <span className="text-white">結果</span>
                  <span className="text-sm bg-white/10 px-3 py-1 rounded-full font-bold text-gray-400">
                    共 {groups.length} 組
                  </span>
                </h2>
                <div className="flex gap-4">
                  <button
                    onClick={copyResults}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/10 transition-all active:scale-95"
                  >
                    <Copy size={18} /> 複製名單
                  </button>
                  <button
                    onClick={reset}
                    className="bg-neon-pink hover:bg-neon-pink/80 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 neon-glow"
                  >
                    <RefreshCw size={18} /> 重新分組
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group, idx) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass p-6 rounded-3xl relative group hover:border-neon-blue/50 transition-all"
                  >
                    <div className="absolute -top-3 -right-3 w-12 h-12 bg-neon-blue rounded-2xl flex items-center justify-center font-black text-black text-xl rotate-12 group-hover:rotate-0 transition-transform neon-glow-blue">
                      {group.id}
                    </div>
                    <h3 className="text-xl font-black mb-4 text-neon-blue">第 {group.id} 組</h3>
                    
                    <div className="space-y-3">
                      {group.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between group/item">
                          <span className="font-bold text-lg group-hover/item:text-neon-pink transition-colors">{m.name}</span>
                          <div className="flex gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-white/10 text-gray-300 border border-white/10">
                              {m.region}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-white/10 text-gray-300 border border-white/10">
                              {m.seniority}Y
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {group.members.length} Members
                      </span>
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple border-2 border-black" />
                        ))}
                        {group.members.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-800 border-2 border-black flex items-center justify-center text-[8px] font-bold">
                            +{group.members.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 glass border-red-500/50 p-4 rounded-2xl flex items-center gap-3 text-red-400 font-bold z-50 shadow-2xl"
            >
              <AlertCircle size={20} />
              {error}
              <button onClick={() => setError(null)} className="ml-4 text-gray-500 hover:text-white">
                <ChevronRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 text-center text-gray-600 text-sm font-bold uppercase tracking-widest">
        &copy; 2026 CCSA Team Consensus Camp &bull; Designed for Energy
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-neon-pink);
        }
      `}} />
    </div>
  );
}
