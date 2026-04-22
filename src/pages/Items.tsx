import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Sparkles, X } from "lucide-react";
import { loadItems, saveItems, type RouletteItem } from "@/lib/roulette-storage";
import { toast } from "sonner";

const Items = () => {
  const [items, setItems] = useState<RouletteItem[]>(() => loadItems());
  const [hydrated, setHydrated] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newImage, setNewImage] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveItems(items);
  }, [items, hydrated]);

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
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (files.length === 1) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("画像は2MB以下にしてください");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setNewImage(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }

    const oversized = files.filter((f) => f.size > 2 * 1024 * 1024);
    const valid = files.filter((f) => f.size <= 2 * 1024 * 1024);
    if (oversized.length) {
      toast.error(`${oversized.length}件は2MB超のためスキップしました`);
    }

    Promise.all(
      valid.map(
        (file) =>
          new Promise<RouletteItem>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const name = file.name.replace(/\.[^.]+$/, "");
              resolve({
                id: crypto.randomUUID(),
                label: name || "?",
                image: reader.result as string,
              });
            };
            reader.readAsDataURL(file);
          }),
      ),
    ).then((newItems) => {
      setItems((prev) => [...prev, ...newItems]);
      toast.success(`${newItems.length}件のイラストを追加しました`);
    });

    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    if (!confirm("全ての項目を削除しますか？")) return;
    setItems([]);
    toast.success("全ての項目を削除しました");
  };

  return (
    <div className="min-h-screen w-full px-4 py-8 md:py-12">
      <header className="mx-auto max-w-3xl flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gradient-festive">
          📋 項目管理
        </h1>
        <Link to="/">
          <Button variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            抽選へ戻る
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl space-y-6">
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
                  multiple
                  className="hidden"
                  onChange={handleImage}
                />
                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-border bg-muted/30 hover:bg-muted/60 cursor-pointer text-sm transition-colors">
                  <ImageIcon className="h-4 w-4" />
                  {newImage ? "画像選択済み" : "イラストを選ぶ（複数可）"}
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">項目一覧 ({items.length})</h2>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-destructive">
                全削除
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
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
      </main>
    </div>
  );
};

export default Items;
