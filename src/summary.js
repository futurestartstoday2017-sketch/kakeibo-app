// 集計処理
import { CATEGORIES } from '../shared/categories.js';
import { receiptTotal, toMonth } from './utils.js';

// カテゴリ別の合計金額（カテゴリの並び順どおり、金額が0のカテゴリは除く）
export function sumByCategory(receipts) {
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const receipt of receipts) {
    for (const item of receipt.items) {
      const category = item.category in totals ? item.category : 'その他';
      totals[category] += item.price;
    }
  }
  return CATEGORIES.map((category) => ({ category, amount: totals[category] })).filter(
    (row) => row.amount !== 0,
  );
}

// 月別の合計金額（古い月から順に）
export function sumByMonth(receipts) {
  const totals = new Map();
  for (const receipt of receipts) {
    const month = toMonth(receipt.date);
    totals.set(month, (totals.get(month) ?? 0) + receiptTotal(receipt));
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));
}
