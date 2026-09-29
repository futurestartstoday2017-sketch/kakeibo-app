// 金額・日付まわりの共通処理

const yenFormatter = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' });

// 金額（円・整数）を「￥1,234」の形式にする
export function formatYen(value) {
  return yenFormatter.format(value);
}

// 今日の日付を YYYY-MM-DD で返す（端末のローカル時刻＝日本時間を想定）
export function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// YYYY-MM-DD から YYYY-MM を取り出す
export function toMonth(date) {
  return date.slice(0, 7);
}

// YYYY-MM を「2026年9月」の形式にする
export function formatMonth(month) {
  const [y, m] = month.split('-');
  return `${y}年${Number(m)}月`;
}

// レシートの合計金額（商品の金額を合計する）
export function receiptTotal(receipt) {
  return receipt.items.reduce((sum, item) => sum + item.price, 0);
}

// 一意なIDを作る
export function newId() {
  return crypto.randomUUID();
}
