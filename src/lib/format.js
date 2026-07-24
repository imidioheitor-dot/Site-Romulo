export const brl = v => {
  const n = Number(v);
  return (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const dataBR = iso => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
