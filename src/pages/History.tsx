import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";
import { clearHistory, loadHistory, type HistoryEntry } from "@/lib/roulette-storage";
import { toast } from "sonner";

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const HistoryPage = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const handleClear = () => {
    if (!confirm("履歴をすべて削除しますか？")) return;
    clearHistory();
    setEntries([]);
    toast.success("履歴を削除しました");
  };

  return (
    <div className="min-h-screen w-full px-4 py-8 md:py-12">
      <header className="mx-auto max-w-4xl flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="outline" size="icon" aria-label="戻る">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gradient-festive">
            📜 抽選履歴
          </h1>
        </div>
        {entries.length > 0 && (
          <Button variant="destructive" onClick={handleClear} className="gap-2">
            <Trash2 className="h-4 w-4" />
            履歴をクリア
          </Button>
        )}
      </header>

      <main className="mx-auto max-w-4xl">
        {entries.length === 0 ? (
          <Card className="p-12 text-center bg-card/80 backdrop-blur shadow-card">
            <p className="text-muted-foreground text-lg">まだ抽選履歴はありません</p>
            <Link to="/" className="inline-block mt-6">
              <Button className="bg-gold text-primary-foreground font-bold">ルーレットへ</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">合計 {entries.length} 件</p>
            {entries.map((entry, i) => (
              <Card
                key={entry.id}
                className="p-4 flex items-center gap-4 bg-card/80 backdrop-blur shadow-card hover:border-primary/50 transition-colors"
              >
                <div className="text-2xl font-black text-muted-foreground w-10 text-center">
                  {entries.length - i}
                </div>
                {entry.image ? (
                  <img src={entry.image} alt={entry.label} className="w-16 h-16 rounded-lg object-cover border-2 border-primary/40" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-festive flex items-center justify-center font-black text-primary-foreground text-xl">
                    {entry.label.slice(0, 3)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-bold truncate">{entry.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(entry.drawnAt)}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
