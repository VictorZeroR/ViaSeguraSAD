// Pure statistical routines used by the SAD (all client-side).

export const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / (x.length || 1);
export const median = (x: number[]) => {
  const s = [...x].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
export const sd = (x: number[]) => {
  const m = mean(x);
  return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, x.length - 1));
};

export function histogram(x: number[], bins = 10) {
  const min = Math.min(...x);
  const max = Math.max(...x);
  const w = (max - min) / bins || 1;
  const out = Array.from({ length: bins }, (_, i) => ({
    faixa: `${(min + i * w).toFixed(min + w * bins > 1000 ? 0 : 1)}`,
    contagem: 0,
  }));
  for (const v of x) out[Math.min(bins - 1, Math.floor((v - min) / w))].contagem++;
  return out;
}

// ---- Distributions ----
function logGamma(z: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
function betacf(a: number, b: number, x: number) {
  const MAXIT = 200, EPS = 3e-12, FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function ibeta(x: number, a: number, b: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
/** Two-sided p-value for Student t. */
export const tPValue = (t: number, df: number) => ibeta(df / (df + t * t), df / 2, 0.5);

export function pearson(x: number[], y: number[]) {
  const mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  const r = sxy / Math.sqrt(sxx * syy || 1);
  const n = x.length;
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(Math.max(1e-12, 1 - r * r));
  return { r, p: Math.abs(r) >= 0.999999 ? 0 : tPValue(t, n - 2) };
}

// ---- Linear algebra / OLS ----
function invert(m: number[][]): number[][] {
  const n = m.length;
  const a = m.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    [a[c], a[p]] = [a[p], a[c]];
    const pv = a[c][c] || 1e-12;
    for (let j = 0; j < 2 * n; j++) a[c][j] /= pv;
    for (let r = 0; r < n; r++) if (r !== c) {
      const f = a[r][c];
      for (let j = 0; j < 2 * n; j++) a[r][j] -= f * a[c][j];
    }
  }
  return a.map((r) => r.slice(n));
}

export interface OLSResult {
  names: string[];
  coef: number[];
  se: number[];
  t: number[];
  p: number[];
  r2: number;
  r2adj: number;
  n: number;
  predict: (x: number[]) => number;
}

export function ols(X: number[][], y: number[], names: string[]): OLSResult {
  const n = X.length;
  const Xd = X.map((r) => [1, ...r]);
  const k = Xd[0].length;
  const XtX = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => Xd.reduce((s, r) => s + r[i] * r[j], 0)));
  const Xty = Array.from({ length: k }, (_, i) => Xd.reduce((s, r, idx) => s + r[i] * y[idx], 0));
  const inv = invert(XtX);
  const coef = inv.map((row) => row.reduce((s, v, j) => s + v * Xty[j], 0));
  const yhat = Xd.map((r) => r.reduce((s, v, j) => s + v * coef[j], 0));
  const my = mean(y);
  const sse = y.reduce((s, v, i) => s + (v - yhat[i]) ** 2, 0);
  const sst = y.reduce((s, v) => s + (v - my) ** 2, 0);
  const df = n - k;
  const s2 = sse / df;
  const se = inv.map((row, i) => Math.sqrt(Math.max(0, row[i] * s2)));
  const t = coef.map((c, i) => c / (se[i] || 1e-12));
  const r2 = 1 - sse / sst;
  return {
    names: ["Intercepto", ...names],
    coef, se, t,
    p: t.map((v) => tPValue(v, df)),
    r2,
    r2adj: 1 - ((1 - r2) * (n - 1)) / df,
    n,
    predict: (x) => coef[0] + x.reduce((s, v, i) => s + v * coef[i + 1], 0),
  };
}

// ---- K-means ----
export function zscore(cols: number[][]): number[][] {
  // cols: array of columns -> returns rows standardized
  const st = cols.map((c) => ({ m: mean(c), s: sd(c) || 1 }));
  return cols[0].map((_, i) => cols.map((c, j) => (c[i] - st[j].m) / st[j].s));
}

const dist2 = (a: number[], b: number[]) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

export function kmeans(rows: number[][], k: number, seed = 7) {
  let best: { labels: number[]; centroids: number[][]; wss: number } | null = null;
  let rnd = mulberry32(seed);
  for (let run = 0; run < 8; run++) {
    // k-means++ init
    const cents: number[][] = [rows[Math.floor(rnd() * rows.length)]];
    while (cents.length < k) {
      const d = rows.map((r) => Math.min(...cents.map((c) => dist2(r, c))));
      const tot = d.reduce((a, b) => a + b, 0);
      let u = rnd() * tot, idx = 0;
      while (u > d[idx] && idx < d.length - 1) u -= d[idx++];
      cents.push(rows[idx]);
    }
    let labels = new Array(rows.length).fill(0);
    let centroids = cents.map((c) => [...c]);
    for (let it = 0; it < 100; it++) {
      const nl = rows.map((r) => {
        let bi = 0, bd = Infinity;
        centroids.forEach((c, j) => { const dd = dist2(r, c); if (dd < bd) { bd = dd; bi = j; } });
        return bi;
      });
      const changed = nl.some((l, i) => l !== labels[i]);
      labels = nl;
      centroids = centroids.map((c, j) => {
        const m = rows.filter((_, i) => labels[i] === j);
        return m.length ? c.map((_, d) => mean(m.map((r) => r[d]))) : c;
      });
      if (!changed && it > 0) break;
    }
    const wss = rows.reduce((s, r, i) => s + dist2(r, centroids[labels[i]]), 0);
    if (!best || wss < best.wss) best = { labels, centroids, wss };
  }
  rnd = () => 0;
  return best!;
}

export function silhouette(rows: number[][], labels: number[]) {
  const k = Math.max(...labels) + 1;
  const s = rows.map((r, i) => {
    const sums = new Array(k).fill(0), cnt = new Array(k).fill(0);
    rows.forEach((o, j) => { if (i !== j) { sums[labels[j]] += Math.sqrt(dist2(r, o)); cnt[labels[j]]++; } });
    const a = cnt[labels[i]] ? sums[labels[i]] / cnt[labels[i]] : 0;
    let b = Infinity;
    for (let c = 0; c < k; c++) if (c !== labels[i] && cnt[c]) b = Math.min(b, sums[c] / cnt[c]);
    if (!isFinite(b)) return 0;
    return (b - a) / Math.max(a, b);
  });
  return mean(s);
}

export function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
