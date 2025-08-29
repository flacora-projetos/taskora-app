// utils.js — utilidades simples usadas no app
export function selectAll(q, ctx = document) {
  return Array.from(ctx.querySelectorAll(q));
}
export function $(q, ctx = document) {
  return ctx.querySelector(q);
}
export function fmtDateISO(d) {
  if (!d) return "";
  const f = new Date(d);
  if (Number.isNaN(f.getTime())) return "";
  return f.toISOString().slice(0, 10);
}
