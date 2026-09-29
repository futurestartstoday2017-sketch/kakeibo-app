import { useEffect, useState } from 'react';
import { today } from '../utils.js';

const MAX_SIZE = 5 * 1024 * 1024;

// レシート画像を選んでバックエンドに送り、読み取り結果を受け取る
export default function ReceiptUpload({ onScanned }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // プレビュー用URLは、画像が変わったら破棄してメモリを解放する
  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setError('');
    if (!selected) return;
    if (selected.size > MAX_SIZE) {
      setError('画像サイズは 5MB 以下にしてください');
      return;
    }
    setFile(selected);
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/receipts/scan', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || '読み取りに失敗しました');
      }
      // 日付が読み取れなかった場合は今日の日付を入れておく（確認画面で修正できる）
      onScanned({ ...data, date: data.date || today() });
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'サーバーに接続できませんでした' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload">
      <label className="file-picker">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={loading}
        />
        <span>{file ? '別の画像を選ぶ' : 'レシート画像を選ぶ'}</span>
      </label>

      {file && previewUrl && (
        <div className="preview">
          <img src={previewUrl} alt="選択したレシート画像" />
        </div>
      )}

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="primary" onClick={handleScan} disabled={!file || loading}>
        {loading ? '読み取り中…' : '読み取る'}
      </button>
    </div>
  );
}
