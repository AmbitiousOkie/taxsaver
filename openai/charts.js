/* Offline area-proportional treemap layout. Each rectangle retains its source index. */
(function (root) {
  'use strict';
  function treemap(values, width = 100, height = 65) {
    const items = values.map((value, index) => ({ value, index }))
      .filter(item => Number.isFinite(item.value) && item.value > 0)
      .sort((a, b) => b.value - a.value || a.index - b.index);
    if (!items.length || !(width > 0 && height > 0)) return [];
    const output = [];
    function partition(group, x, y, w, h, depth = 0) {
      if (group.length === 1) {
        output.push({ ...group[0], x, y, width: w, height: h });
        return;
      }
      const total = group.reduce((sum, item) => sum + item.value, 0);
      let subtotal = 0, bestDifference = Infinity, cut = 1, firstTotal = 0;
      for (let i = 1; i < group.length; i++) {
        subtotal += group[i - 1].value;
        const difference = Math.abs(total / 2 - subtotal);
        if (difference < bestDifference) {
          bestDifference = difference;
          cut = i;
          firstTotal = subtotal;
        }
      }
      const share = firstTotal / total;
      // Keep lower-level groups stacked so small categories retain label width.
      if (depth === 0 && w >= h) {
        partition(group.slice(0, cut), x, y, w * share, h, depth + 1);
        partition(group.slice(cut), x + w * share, y, w * (1 - share), h, depth + 1);
      } else {
        partition(group.slice(0, cut), x, y, w, h * share, depth + 1);
        partition(group.slice(cut), x, y + h * share, w, h * (1 - share), depth + 1);
      }
    }
    partition(items, 0, 0, width, height);
    return output;
  }
  root.TaxCharts = { treemap };
  if (typeof module !== 'undefined') module.exports = { treemap };
})(typeof globalThis !== 'undefined' ? globalThis : this);
