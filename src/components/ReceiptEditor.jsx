import { useState } from 'react';
import { CATEGORIES } from '../../shared/categories.js';
import { formatYen, newId, receiptTotal } from '../utils.js';

// 読み取り結果を確認・修正してから登録する画面
export default function ReceiptEditor({ initial, onSubmit, onCancel }) {
  const [store, setStore] = useState(initial.store);
  const [date, setDate] = useState(initial.date);
  // 編集しやすいように、各商品に一時的なIDを付ける
  const [items, setItems] = useState(() => initial.items.map((item) => ({ ...item, id: newId() })));

  const updateItem = (id, changes) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id: newId(), name: '', price: 0, category: 'その他' }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      store: store.trim(),
      date,
      items: items.map((item) => ({ ...item, name: item.name.trim() || '（名称なし）' })),
    });
  };

  const total = receiptTotal({ items });

  return (
    <form className="editor" onSubmit={handleSubmit}>
      <p className="hint">読み取り結果を確認してください。間違いがあれば修正してから登録できます。</p>

      <div className="editor-meta">
        <label>
          日付
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          店名
          <input type="text" value={store} onChange={(e) => setStore(e.target.value)} />
        </label>
      </div>

      <div className="table-wrap">
        <table className="items-table">
          <thead>
            <tr>
              <th>商品名</th>
              <th className="num">金額（円）</th>
              <th>カテゴリ</th>
              <th aria-label="削除" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    aria-label="商品名"
                  />
                </td>
                <td className="num">
                  <input
                    type="number"
                    step="1"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, { price: Math.round(Number(e.target.value) || 0) })}
                    aria-label="金額"
                  />
                </td>
                <td>
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(item.id, { category: e.target.value })}
                    aria-label="カテゴリ"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button type="button" className="icon-button" onClick={() => removeItem(item.id)} aria-label="この行を削除">
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>合計</th>
              <td className="num strong">{formatYen(total)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="actions">
        <button type="button" onClick={addItem}>
          行を追加
        </button>
        <span className="spacer" />
        <button type="button" onClick={onCancel}>
          取り消す
        </button>
        <button type="submit" className="primary" disabled={items.length === 0}>
          登録する
        </button>
      </div>
    </form>
  );
}
