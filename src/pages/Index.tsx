import { useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { History, Sparkles, ListPlus } from "lucide-react";
import { addHistory, clearHistory, loadHistory, loadItems, type RouletteItem } from "@/lib/roulette-storage";
import { toast } from "sonner";

const Index = () => {
  const [items, setItems] = useState<RouletteItem[]>(() => loadItems());
  const [drawnIds, setDrawnIds] = useState<Set<string>>(() => new Set(loadHistory().map((h) => h.itemId)));
  const [running, setRunning] = useState(false);
  const [flashItem, setFlashItem] = useState<RouletteItem | null>(null);
  const [result, setResult] = useState<RouletteItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickIntervalRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);

  // 他ページで項目が更新された場合に同期
  useEffect(() => {
    const sync = () => setItems(loadItems());
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
      if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  };

  // わくわくする「ティック音」
  const playTick = (freq: number) => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  // 当選ファンファーレ
  const playFanfare = () => {
    const ctx = getAudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  };

  const resetDrawn = () => {
    clearHistory();
    setDrawnIds(new Set());
    toast.success("抽選履歴をリセットしました");
  };

  const start = () => {
    if (running || items.length === 0) return;

    // 未当選プールを抽出
    const available = items.filter((i) => !drawnIds.has(i.id));
    if (available.length === 0) {
      toast.error("全ての項目が当選済みです。リセットしてください", {
        action: { label: "リセット", onClick: resetDrawn },
      });
      return;
    }

    setRunning(true);
    setResult(null);
    setShowResult(false);

    // resume audio (user gesture)
    void getAudioCtx().resume();

    const winner = available[Math.floor(Math.random() * available.length)];
    const totalDuration = 4000; // ms
    const startInterval = 60; // 速い
    const endInterval = 320; // ゆっくり
    const startTime = performance.now();

    let currentIndex = Math.floor(Math.random() * items.length);
    setFlashItem(items[currentIndex]);

    const tickFreqs = [880, 988, 1175, 1319]; // ワクワク音階
    let tickCount = 0;

    const scheduleNext = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      // ease-out: だんだん遅く
      const eased = 1 - Math.pow(1 - progress, 2);
      const interval = startInterval + (endInterval - startInterval) * eased;

      tickIntervalRef.current = window.setTimeout(() => {
        currentIndex = (currentIndex + 1) % items.length;
        setFlashItem(items[currentIndex]);
        playTick(tickFreqs[tickCount % tickFreqs.length] + Math.floor(eased * 200));
        tickCount++;

        if (elapsed < totalDuration) {
          scheduleNext();
        } else {
          // 最終的に当選項目にスナップ
          setFlashItem(winner);
          setResult(winner);
          setRunning(false);
          playFanfare();
          setDrawnIds((prev) => new Set(prev).add(winner.id));
          window.setTimeout(() => setShowResult(true), 250);
          addHistory({
            id: crypto.randomUUID(),
            itemId: winner.id,
            label: winner.label,
            image: winner.image,
            drawnAt: Date.now(),
          });
        }
      }, interval) as unknown as number;
    };

    scheduleNext();
  };

  return (
    <div className="min-h-screen w-full px-4 py-8 md:py-12">
      {/* Header */}
      <header className="mx-auto max-w-3xl flex items-center justify-between mb-8 gap-2 flex-wrap">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gradient-festive">
          ✨ ACT抽選会
        </h1>
        <div className="flex items-center gap-2">
          <Link to="/items">
            <Button variant="outline" size="lg" className="gap-2">
              <ListPlus className="h-4 w-4" />
              項目管理
            </Button>
          </Link>
          <Link to="/history">
            <Button variant="outline" size="lg" className="gap-2">
              <History className="h-4 w-4" />
              履歴
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl">
        <section className="flex flex-col items-center justify-start gap-8">
          <div className="relative w-full max-w-[560px] aspect-square rounded-[2.5rem] border-8 border-primary/80 shadow-glow bg-card/60 backdrop-blur overflow-hidden flex items-center justify-center">
            {running && (
              <div className="absolute inset-0 bg-festive opacity-20 animate-pulse-glow pointer-events-none" />
            )}

            {flashItem ? (
              <div key={flashItem.id + (running ? Math.random() : "final")} className="animate-pop-in flex flex-col items-center justify-center gap-4 px-6 w-full">
                {flashItem.image ? (
                  <img
                    src={flashItem.image}
                    alt={flashItem.label}
                    className="max-w-[80%] max-h-[60%] object-contain rounded-2xl"
                  />
                ) : (
                  <div className="text-[28vw] md:text-[18vw] leading-none font-black text-gradient-festive drop-shadow-[0_0_30px_hsl(45_95%_58%/0.6)]">
                    {flashItem.label}
                  </div>
                )}
                {flashItem.image && flashItem.label && (
                  <div className="text-2xl md:text-4xl font-black text-gradient-festive">{flashItem.label}</div>
                )}
              </div>
            ) : (
              <div className="text-center px-8">
                <Sparkles className="h-16 w-16 mx-auto text-primary mb-4 animate-pulse-glow" />
                <p className="text-xl md:text-2xl font-bold text-muted-foreground">
                  {items.length === 0 ? "項目管理から項目を追加してください" : "STARTを押して抽選"}
                </p>
                {items.length === 0 && (
                  <Link to="/items">
                    <Button variant="outline" size="lg" className="mt-4 gap-2">
                      <ListPlus className="h-4 w-4" />
                      項目管理へ
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          <button
            onClick={start}
            disabled={running || items.length === 0}
            className="px-12 py-5 rounded-full bg-gold text-primary-foreground font-black text-2xl shadow-glow border-4 border-background transition-bounce hover:scale-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed animate-pulse-glow"
          >
            {running ? "抽選中..." : "START"}
          </button>

          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground text-sm">
              残り {items.filter((i) => !drawnIds.has(i.id)).length} / {items.length} 件
            </p>
            {drawnIds.size > 0 && (
              <Button variant="ghost" size="sm" onClick={resetDrawn} className="text-xs">
                抽選状態をリセット
              </Button>
            )}
          </div>
        </section>
      </main>

      {/* Fullscreen result overlay */}
      {showResult && result && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md cursor-pointer"
          onClick={() => setShowResult(false)}
        >
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-2xl md:text-3xl font-bold text-gradient-festive animate-pop-in">
            🎉 当選 🎉
          </div>

          <div className="animate-pop-in flex flex-col items-center gap-6 px-4">
            {result.image ? (
              <img
                src={result.image}
                alt={result.label}
                className="max-w-[85vw] max-h-[65vh] object-contain rounded-3xl shadow-glow border-4 border-primary"
              />
            ) : (
              <div className="text-[28vw] md:text-[22vw] leading-none font-black text-gradient-festive drop-shadow-[0_0_40px_hsl(45_95%_58%/0.7)]">
                {result.label}
              </div>
            )}
            {result.image && result.label && (
              <div className="text-4xl md:text-6xl font-black text-gradient-festive">{result.label}</div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowResult(false);
            }}
            className="absolute bottom-10 px-8 py-3 rounded-full bg-gold text-primary-foreground font-bold text-lg shadow-glow hover:scale-105 transition-bounce"
          >
            閉じる
          </button>

          {/* Confetti */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-sm animate-confetti-fall pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                backgroundColor: ["hsl(45 95% 58%)", "hsl(330 85% 60%)", "hsl(280 60% 60%)", "hsl(190 90% 55%)"][i % 4],
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
