// レシートデータをブラウザのローカルストレージに保存・読み込みする
const STORAGE_KEY = 'kakeibo.receipts.v1';

export function loadReceipts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    // 保存データが壊れている・ストレージが使えない場合は空から始める
    return [];
  }
}

export function saveReceipts(receipts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    return true;
  } catch {
    // 容量オーバーやプライベートモードなどで保存できない場合
    return false;
  }
}
