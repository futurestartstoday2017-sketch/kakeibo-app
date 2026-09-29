import { useEffect, useMemo, useState } from 'react';
import ReceiptUpload from './components/ReceiptUpload.jsx';
import ReceiptEditor from './components/ReceiptEditor.jsx';
import ReceiptList from './components/ReceiptList.jsx';
import CategorySummary from './components/CategorySummary.jsx';
import Charts from './components/Charts.jsx';
import { loadReceipts, saveReceipts } from './storage.js';
import { formatMonth, newId, toMonth } from './utils.js';

export default function App() {
  // 登録済みのレシート一覧（初回はローカルストレージから読み込む）
  const [receipts, setReceipts] = useState(loadReceipts);
  // 読み取り直後の、登録前の確認用データ
  const [draft, setDraft] = useState(null);
  // 表示する月（'all' はすべての期間）
  const [month, setMonth] = useState('all');
  const [saveError, setSaveError] = useState(false);

  // レシート一覧が変わるたびにローカルストレージへ保存する
  useEffect(() => {
    setSaveError(!saveReceipts(receipts));
  }, [receipts]);

  // データがある月の一覧（新しい順）
  const months = useMemo(
    () => [...new Set(receipts.map((r) => toMonth(r.date)))].sort().reverse(),
    [receipts],
  );

  // 選択中の月のレシートだけに絞り込む
  const visibleReceipts = useMemo(
    () => (month === 'all' ? receipts : receipts.filter((r) => toMonth(r.date) === month)),
    [receipts, month],
  );

  // 確認画面で「登録」したときの処理
  const handleRegister = (receipt) => {
    setReceipts((prev) => [...prev, { ...receipt, id: newId(), createdAt: Date.now() }]);
    setDraft(null);
    setMonth(toMonth(receipt.date));
  };

  const handleUpdate = (updated) => {
    setReceipts((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleDelete = (id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  // 選択中の月のデータがなくなったら「すべて」に戻す
  useEffect(() => {
    if (month !== 'all' && !months.includes(month)) setMonth('all');
  }, [month, months]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>レシート家計簿</h1>
        <p className="subtitle">レシートを撮影してアップロードすると、自動で読み取って記録します</p>
      </header>

      {saveError && (
        <p className="alert" role="alert">
          ブラウザにデータを保存できませんでした。プライベートモードや容量をご確認ください。
        </p>
      )}

      <section className="card">
        <h2>レシートを読み取る</h2>
        {draft ? (
          <ReceiptEditor
            initial={draft}
            onSubmit={handleRegister}
            onCancel={() => setDraft(null)}
          />
        ) : (
          <ReceiptUpload onScanned={setDraft} />
        )}
      </section>

      <div className="filter-row">
        <label>
          表示する期間：
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">すべて</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid">
        <section className="card">
          <h2>カテゴリ別の集計</h2>
          <CategorySummary receipts={visibleReceipts} />
        </section>
        <section className="card">
          <h2>グラフ</h2>
          <Charts receipts={receipts} visibleReceipts={visibleReceipts} />
        </section>
      </div>

      <section className="card">
        <h2>レシート一覧</h2>
        <ReceiptList receipts={visibleReceipts} onUpdate={handleUpdate} onDelete={handleDelete} />
      </section>
    </div>
  );
}
