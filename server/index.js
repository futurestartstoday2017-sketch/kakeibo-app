// バックエンド（Express）：レシート画像を受け取り、Claude API で内容を読み取って返す
// APIキーはサーバー側の .env でのみ扱い、ブラウザには渡さない
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import { readReceipt } from './receipt.js';

const PORT = Number(process.env.PORT) || 3001;

// Claude API が受け付ける画像形式と、1枚あたりの上限サイズ（5MB）
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const app = express();

// 画像はディスクに保存せず、メモリ上で受け取る
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new UploadError('JPEG・PNG・WebP・GIF 形式の画像を選択してください（HEIC は非対応です）'));
    }
  },
});

class UploadError extends Error {}

// レシート読み取り API
app.post('/api/receipts/scan', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '画像ファイルが送信されていません' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'サーバーに APIキーが設定されていません（.env を確認してください）' });
  }
  try {
    const receipt = await readReceipt(req.file.buffer, req.file.mimetype);
    res.json(receipt);
  } catch (err) {
    handleError(err, res);
  }
});

// 本番用：ビルド済みのフロントエンドを配信する
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
app.use(express.static(distDir));

// multer のエラー（サイズ超過・形式不正）もここで処理する
app.use((err, req, res, next) => {
  handleError(err, res);
});

// エラーの種類ごとに、利用者に分かりやすいメッセージを返す
function handleError(err, res) {
  if (err instanceof UploadError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: '画像サイズは 5MB 以下にしてください' });
  }
  if (err instanceof Anthropic.AuthenticationError) {
    console.error('Claude API の認証に失敗しました。.env の ANTHROPIC_API_KEY を確認してください');
    return res.status(500).json({ error: 'サーバーの設定に問題があります（APIキー）' });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return res.status(429).json({ error: '混み合っています。少し時間をおいて再度お試しください' });
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return res.status(502).json({ error: 'Claude API に接続できませんでした' });
  }
  if (err instanceof Anthropic.APIError) {
    console.error('Claude API エラー:', err.status, err.message);
    return res.status(502).json({ error: 'レシートの読み取り中にエラーが発生しました' });
  }
  if (err.userMessage) {
    // readReceipt が投げる「読み取れなかった」系のエラー
    return res.status(422).json({ error: err.userMessage });
  }
  console.error(err);
  res.status(500).json({ error: '予期しないエラーが発生しました' });
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('警告: ANTHROPIC_API_KEY が設定されていません。.env.example を参考に .env を作成してください');
}

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
