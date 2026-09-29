import { categoryColor, useColorMode } from '../colors.js';
import { sumByCategory } from '../summary.js';
import { formatYen } from '../utils.js';

// カテゴリ別の集計表（グラフの内容を数値でも確認できるようにする）
export default function CategorySummary({ receipts }) {
  const mode = useColorMode();
  const rows = sumByCategory(receipts);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  if (rows.length === 0) {
    return <p className="empty">集計するデータがありません。</p>;
  }

  return (
    <div className="table-wrap">
      <table className="summary-table">
        <thead>
          <tr>
            <th>カテゴリ</th>
            <th className="num">金額</th>
            <th className="num">割合</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category}>
              <td>
                <span
                  className="swatch"
                  style={{ background: categoryColor(row.category, mode) }}
                  aria-hidden="true"
                />
                {row.category}
              </td>
              <td className="num">{formatYen(row.amount)}</td>
              <td className="num muted">{total > 0 ? `${((row.amount / total) * 100).toFixed(1)}%` : '-'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>合計</th>
            <td className="num strong">{formatYen(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
