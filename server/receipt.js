// Claude API を使ってレシート画像から商品・金額・日付を読み取る処理
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { CATEGORIES } from '../shared/categories.js';

// Claude Haiku の最新版
const MODEL = 'claude-haiku-4-5';

// APIキーは環境変数 ANTHROPIC_API_KEY から自動で読み込まれる
const client = new Anthropic();

// Claude に返してもらう JSON の形（構造化出力で、この形が保証される）
const ReceiptSchema = z.object({
  is_receipt: z.boolean().describe('画像がレシート・領収書であれば true'),
  store: z.string().describe('店名。読み取れなければ空文字'),
  date: z.string().describe('購入日（YYYY-MM-DD 形式）。読み取れなければ空文字'),
  items: z.array(
    z.object({
      name: z.string().describe('商品名'),
      price: z.number().int().describe('その行の金額（円、数量分を含む）。値引きはマイナス'),
      // 選択肢外の値が返ってきても解析エラーにしないよう文字列で受け取り、normalize で補正する
      category: z.string().describe(`商品のカテゴリ（${CATEGORIES.join('、')} のいずれか）`),
    }),
  ),
  total: z.number().int().describe('支払合計金額（円、税込）。読み取れなければ 0'),
});

const PROMPT = `この画像は日本のレシートです。内容を読み取ってください。

- items には購入した商品を1行ずつ入れてください。小計・合計・お預かり・お釣り・ポイントの行は含めないでください。
- 値引き・割引の行は、マイナスの金額で items に含めてください。
- 商品名が省略表記の場合も、読み取れたとおりに記載してください。
- category は次から選んでください: ${CATEGORIES.join('、')}
  - 飲食店（レストラン・カフェ・ファストフード等）のレシートの商品は「外食」にしてください。
  - スーパー等で買った食材・惣菜・お菓子は「食費」、飲み物・お酒・たばこは「飲料・嗜好品」にしてください。
- 和暦（令和など）の日付は西暦に変換してください。
- 画像がレシートでない場合は is_receipt を false にし、items は空にしてください。`;

/**
 * レシート画像を読み取り、画面表示用のデータに整えて返す
 * @param {Buffer} buffer 画像データ
 * @param {string} mediaType 画像の MIME タイプ
 */
export async function readReceipt(buffer, mediaType) {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(ReceiptSchema) },
  });

  if (response.stop_reason === 'refusal') {
    throw withUserMessage('この画像は読み取れませんでした');
  }
  if (response.stop_reason === 'max_tokens') {
    throw withUserMessage('レシートが長すぎて読み取りきれませんでした');
  }
  const result = response.parsed_output;
  if (!result) {
    throw withUserMessage('読み取り結果を解析できませんでした。もう一度お試しください');
  }
  if (!result.is_receipt || result.items.length === 0) {
    throw withUserMessage('レシートとして認識できませんでした。明るい場所で全体が写るように撮影してください');
  }

  return normalize(result);
}

// 読み取り結果を整える（日付の補完、外税・端数の調整行の追加）
function normalize(result) {
  const items = result.items.map((item) => ({
    ...item,
    category: CATEGORIES.includes(item.category) ? item.category : 'その他',
  }));
  const itemsSum = items.reduce((sum, item) => sum + item.price, 0);
  const total = result.total > 0 ? result.total : itemsSum;

  // 外税の消費税や端数などで商品合計と支払合計がずれる場合は、差額を調整行として追加する
  // （カテゴリ別集計の合計が、実際の支払額と一致するようにするため）
  const diff = total - itemsSum;
  if (diff !== 0) {
    items.push({ name: '消費税・調整', price: diff, category: 'その他' });
  }

  return {
    store: result.store,
    date: isValidDate(result.date) ? result.date : '',
    items,
    total,
  };
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

// 利用者向けメッセージ付きのエラーを作る
function withUserMessage(message) {
  const err = new Error(message);
  err.userMessage = message;
  return err;
}
