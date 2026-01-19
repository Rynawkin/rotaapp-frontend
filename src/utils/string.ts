export const normalizeSearchText = (value?: string | null): string => {
  if (!value) return '';

  const lower = value.toLowerCase();
  const normalized = typeof lower.normalize === 'function'
    ? lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : lower;

  return normalized.replace(/ı/g, 'i').trim();
};
