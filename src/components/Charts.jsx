import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { categoryColor, themeColors, useColorMode } from '../colors.js';
import { sumByCategory, sumByMonth } from '../summary.js';
import { formatMonth, formatYen } from '../utils.js';

// Chart.js で使う部品を登録する
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const FONT_FAMILY = "system-ui, -apple-system, 'Hiragino Sans', 'Yu Gothic UI', sans-serif";

// カテゴリ別の円グラフ（選択中の期間）と、月別の棒グラフ（全期間）を表示する
export default function Charts({ receipts, visibleReceipts }) {
  const mode = useColorMode();
  const theme = themeColors(mode);

  // 円グラフはマイナス（値引き超過など）のカテゴリを表示できないため除外する
  const categoryRows = sumByCategory(visibleReceipts).filter((row) => row.amount > 0);
  const monthRows = sumByMonth(receipts);

  if (receipts.length === 0) {
    return <p className="empty">レシートを登録するとグラフが表示されます。</p>;
  }

  const tooltip = {
    backgroundColor: theme.surface,
    titleColor: theme.text,
    bodyColor: theme.text,
    borderColor: theme.grid,
    borderWidth: 1,
    padding: 10,
    titleFont: { family: FONT_FAMILY },
    bodyFont: { family: FONT_FAMILY },
  };

  const categoryTotal = categoryRows.reduce((sum, row) => sum + row.amount, 0);

  const pieData = {
    labels: categoryRows.map((row) => row.category),
    datasets: [
      {
        data: categoryRows.map((row) => row.amount),
        backgroundColor: categoryRows.map((row) => categoryColor(row.category, mode)),
        // 扇形どうしの間に背景色の細い隙間を入れて見分けやすくする
        borderColor: theme.surface,
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: theme.text, font: { family: FONT_FAMILY }, boxWidth: 12, boxHeight: 12 },
      },
      tooltip: {
        ...tooltip,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.label}：${formatYen(ctx.parsed)}（${((ctx.parsed / categoryTotal) * 100).toFixed(1)}%）`,
        },
      },
    },
  };

  const barData = {
    labels: monthRows.map((row) => formatMonth(row.month)),
    datasets: [
      {
        label: '支出合計',
        data: monthRows.map((row) => row.amount),
        backgroundColor: theme.series[0],
        borderRadius: { topLeft: 4, topRight: 4 },
        borderSkipped: 'bottom',
        maxBarThickness: 40,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      // 系列が1つなので凡例は出さない（見出しで内容が分かる）
      legend: { display: false },
      tooltip: {
        ...tooltip,
        callbacks: { label: (ctx) => ` ${formatYen(ctx.parsed.y)}` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: theme.textMuted, font: { family: FONT_FAMILY } },
        border: { color: theme.grid },
      },
      y: {
        beginAtZero: true,
        grid: { color: theme.grid },
        border: { display: false },
        ticks: {
          color: theme.textMuted,
          font: { family: FONT_FAMILY },
          callback: (value) => formatYen(value),
        },
      },
    },
  };

  return (
    <div className="charts">
      <figure className="chart">
        <figcaption>カテゴリ別の支出</figcaption>
        {categoryRows.length > 0 ? (
          <div className="chart-canvas">
            <Pie data={pieData} options={pieOptions} aria-label="カテゴリ別の支出の円グラフ" role="img" />
          </div>
        ) : (
          <p className="empty">この期間のデータがありません。</p>
        )}
      </figure>
      <figure className="chart">
        <figcaption>月別の支出（全期間）</figcaption>
        <div className="chart-canvas">
          <Bar data={barData} options={barOptions} aria-label="月別の支出の棒グラフ" role="img" />
        </div>
      </figure>
    </div>
  );
}
