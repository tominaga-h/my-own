/**
 * Fisher-Yates シャッフル。純粋関数で、入力配列を破壊しない。
 *
 * @param input シャッフル対象の配列（変更されない）
 * @param random 0 以上 1 未満の乱数を返す関数。省略時は `Math.random`。
 *               テスト時に固定値を注入することで決定論的に検証できる。
 * @returns 新しくコピーした配列を並べ替えた結果
 */
export function shuffle<T>(
  input: readonly T[],
  random: () => number = Math.random,
): T[] {
  const result = input.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
