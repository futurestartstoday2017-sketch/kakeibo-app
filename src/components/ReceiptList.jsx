import { useState } from 'react';
import { CATEGORIES } from '../../shared/categories.js';
import { formatYen, receiptTotal } from '../utils.js';

// 登録済みレシートの一覧（日付の新しい順）。商品ごとのカテゴリ変更・削除ができる
export default function ReceiptList({ receipts, onUpdate, onDelete }) {
  const [openId, setOpenId] = useState(null);

  if (receipts.length === 0) {
    return <p className="empty">まだレシートが登録されていません。</p>;
  }

  const sorted = [...receipts].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
  );

  const changeCategory = (receipt, itemId, category) => {
    onUpdate({
      ...receipt,
      items: receipt.items.map((item) => (item.id === itemId ? { ...item, category } : item)),
    });
  };

  const removeItem = (receipt, itemId) => {
    const items = receipt.items.filter((item) => item.id !== itemId);
    // 商品が1つもなくなったらレシートごと削除する
    if (items.length === 0) onDelete(receipt.id);
    else onUpdate({ ...receipt, items });
  };

  const handleDelete = (receipt) => {
    if (window.confirm(`${receipt.date} ${receipt.store || ''} のレシートを削除しますか？`)) {
      onDelete(receipt.id);
    }
  };

  return (
    <ul className="receipt-list">
      {sorted.map((receipt) => {
        const isOpen = openId === receipt.id;
        return (
          <li key={receipt.id} className="receipt">
            <button
              type="button"
              className="receipt-summary"
              onClick={() => setOpenId(isOpen ? null : receipt.id)}
              aria-expanded={isOpen}
            >
              <span className="receipt-date">{receipt.date}</span>
              <span className="receipt-store">{receipt.store || '（店名なし）'}</span>
              <span className="receipt-count">{receipt.items.length}点</span>
              <span className="receipt-total">{formatYen(receiptTotal(receipt))}</span>
              <span className="chevron" aria-hidden="true">
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {isOpen && (
              <div className="receipt-detail">
                <div className="table-wrap">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>商品名</th>
                        <th className="num">金額</th>
                        <th>カテゴリ</th>
                        <th aria-label="削除" />
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td className="num">{formatYen(item.price)}</td>
                          <td>
                            <select
                              value={item.category}
                              onChange={(e) => changeCategory(receipt, item.id, e.target.value)}
                              aria-label={`${item.name} のカテゴリ`}
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => removeItem(receipt, item.id)}
                              aria-label={`${item.name} を削除`}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="actions">
                  <span className="spacer" />
                  <button type="button" className="danger" onClick={() => handleDelete(receipt)}>
                    このレシートを削除
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
