import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, History, Image as ImageIcon, Sparkles, X } from "lucide-react";
import { addHistory, loadItems, saveItems, type RouletteItem } from "@/lib/roulette-storage";
import { toast } from "sonner";

const Index = () => {
  const [items, setItems] = useState<RouletteItem[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newImage, setNewImage] = useState<string | undefined>();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<RouletteItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(loadItems());
  }, []);

  useEffect(() => {
    if (items.length) saveItems(items);
  }, [items]);

  const sliceColors = useMemo(
    () => ["hsl(45 95% 58%)", "hsl(330 85% 60%)", "hsl(280 60% 60%)", "hsl(190 90% 55%)", "hsl(15 90% 60%)", "hsl(140 70% 50%)"],
    []
  );

  const handleAdd = () => {
    if (!newLabel.trim() && !newImage) {
      toast.error("数字またはイラストを入力してください");
      return;
    }
    setItems((prev) => [...prev, { id: crypto.randomUUID(), label: newLabel.trim() || "?", image: newImage }]);
    setNewLabel("");
    setNewImage(undefined);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("画像は2MB以下にしてください");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setNewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const spin = () => {
    if (spinning || items.length === 0) return;
    setSpinning(true);
    setResult(null);
    setShowResult(false);

    const winnerIndex = Math.floor(Math.random() * items.length);
    const sliceAngle = 360 / items.length;
    // pointer at top (0deg). winning slice center should land at top.
    const targetAngle = 360 - (winnerIndex * sliceAngle + sliceAngle / 2);
    const spins = 6; // full rotations
    const finalRotation = rotationRef.current + spins * 360 + (targetAngle - (rotationRef.current % 360));
    rotationRef.current = finalRotation;

    if (wheelRef.current) {
      wheelRef.current.style.transition = "transform 4.5s cubic-bezier(0.17, 0.67, 0.21, 1)";
      wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
    }

    setTimeout(() => {
      const winner = items[winnerIndex];
      setResult(winner);
      setShowResult(true);
      setSpinning(false);
      addHistory({
        id: crypto.randomUUID(),
        itemId: winner.id,
        label: winner.label,
        image: winner.image,
        drawnAt: Date.now(),
      });
    }, 4600);
  };

  const sliceAngle = items.length > 0 ? 360 / items.length : 0;

  return (
    <div className="min-h-screen w-full px-4 py-8 md:py-12">
      {/* Header */}
      <header className="mx-auto max-w-6xl flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gradient-festive">
          ✨ 抽選ルーレット
        </h1>
        <Link to="/history">
          <Button variant="outline" size="lg" className="gap-2">
            <History className="h-4 w-4" />
            履歴
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Roulette */}
        <section className="flex flex-col items-center justify-start gap-8">
          <div className="relative w-full max-w-[520px] aspect-square">
            {/* Pointer */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-20">
              <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-t-[32px] border-l-transparent border-r-transparent border-t-primary drop-shadow-[0_4px_8px_hsl(45_95%_58%/0.6)]" />
            </div>

            {/* Wheel */}
            <div
              ref={wheelRef}
              className="absolute inset-0 rounded-full overflow-hidden shadow-glow border-8 border-primary/80"
              style={{ transform: `rotate(${rotationRef.current}deg)` }}
            >
              <svg viewBox="-100 -100 200 200" className="w-full h-full block">
                {items.map((item, i) => {
                  const start = i * sliceAngle - 90;
                  const end = start + sliceAngle;
                  const sr = (start * Math.PI) / 180;
                  const er = (end * Math.PI) / 180;
                  const x1 = 100 * Math.cos(sr);
                  const y1 = 100 * Math.sin(sr);
                  const x2 = 100 * Math.cos(er);
                  const y2 = 100 * Math.sin(er);
                  const large = sliceAngle > 180 ? 1 : 0;
                  const path = `M0,0 L${x1},${y1} A100,100 0 ${large} 1 ${x2},${y2} Z`;
                  const mid = (start + end) / 2;
                  const mr = (mid * Math.PI) / 180;
                  const tx = 62 * Math.cos(mr);
                  const ty = 62 * Math.sin(mr);
                  return (
                    <g key={item.id}>
                      <path d={path} fill={sliceColors[i % sliceColors.length]} stroke="hsl(240 30% 8%)" strokeWidth="0.6" />
                      <g transform={`translate(${tx} ${ty}) rotate(${mid + 90})`}>
                        {item.image ? (
                          <image
                            href={item.image}
                            x="-14"
                            y="-14"
                            width="28"
                            height="28"
                            preserveAspectRatio="xMidYMid slice"
                            clipPath="circle(14)"
                          />
                        ) : (
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={items.length > 16 ? 8 : items.length > 10 ? 11 : 14}
                            fontWeight="900"
                            fill="hsl(240 30% 8%)"
                          >
                            {item.label.slice(0, 6)}
                          </text>
                        )}
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Center button */}
            <button
              onClick={spin}
              disabled={spinning || items.length === 0}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-24 h-24 md:w-28 md:h-28 rounded-full bg-gold text-primary-foreground font-black text-lg shadow-glow border-4 border-background transition-bounce hover:scale-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed animate-pulse-glow"
            >
              {spinning ? "..." : "START"}
            </button>
          </div>

          <p className="text-muted-foreground text-sm">
            {items.length}件の中から抽選 · 中央のボタンを押してスタート
          </p>
        </section>

        {/* Sidebar: items */}
        <aside className="space-y-4">
          <Card className="p-5 bg-card/80 backdrop-blur border-border shadow-card">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              項目を追加
            </h2>
            <div className="space-y-3">
              <Input
                placeholder="数字またはラベル (例: 1)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <div className="flex items-center gap-2">
                <label className="flex-1">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImage}
                  />
                  <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-border bg-muted/30 hover:bg-muted/60 cursor-pointer text-sm transition-colors">
                    <ImageIcon className="h-4 w-4" />
                    {newImage ? "画像選択済み" : "イラストを選ぶ"}
                  </div>
                </label>
                {newImage && (
                  <button
                    onClick={() => {
                      setNewImage(undefined);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="p-2 rounded-md bg-muted hover:bg-destructive/20 transition-colors"
                    aria-label="画像削除"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {newImage && (
                <img src={newImage} alt="プレビュー" className="w-16 h-16 rounded-md object-cover border border-border" />
              )}
              <Button onClick={handleAdd} className="w-full bg-gold text-primary-foreground hover:opacity-90 font-bold">
                <Plus className="h-4 w-4 mr-1" /> 追加
              </Button>
            </div>
          </Card>

          <Card className="p-5 bg-card/80 backdrop-blur border-border shadow-card">
            <h2 className="font-bold text-lg mb-3">項目一覧 ({items.length})</h2>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-10 h-10 rounded-md object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-festive flex items-center justify-center font-black text-primary-foreground text-sm">
                      {item.label.slice(0, 3)}
                    </div>
                  )}
                  <span className="flex-1 truncate text-sm font-semibold">{item.label}</span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">項目を追加してください</p>
              )}
            </div>
          </Card>
        </aside>
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
