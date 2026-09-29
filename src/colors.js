// グラフの配色
// 色覚多様性に配慮して検証済みの8色を、カテゴリの並び順どおり固定で割り当てる
// （9番目の「その他」は目立たないグレーにする）
import { useEffect, useState } from 'react';
import { CATEGORIES } from '../shared/categories.js';

const PALETTE = {
  light: {
    series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
    other: '#8a8983',
    surface: '#fcfcfb',
    text: '#0b0b0b',
    textMuted: '#52514e',
    grid: '#e4e3df',
  },
  dark: {
    series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
    other: '#75746e',
    surface: '#1a1a19',
    text: '#ffffff',
    textMuted: '#c3c2b7',
    grid: '#383835',
  },
};

// カテゴリ名 → 色。カテゴリの並び順で固定なので、絞り込みで色が変わることはない
export function categoryColor(category, mode) {
  const palette = PALETTE[mode];
  const index = CATEGORIES.indexOf(category);
  if (category === 'その他' || index < 0 || index >= palette.series.length) {
    return palette.other;
  }
  return palette.series[index];
}

export function themeColors(mode) {
  return PALETTE[mode];
}

// OS のライト／ダーク設定を監視する（Chart.js は CSS 変数を読めないため JS 側で切り替える）
export function useColorMode() {
  const query = '(prefers-color-scheme: dark)';
  const [mode, setMode] = useState(() => (window.matchMedia(query).matches ? 'dark' : 'light'));

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMode(e.matches ? 'dark' : 'light');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return mode;
}
