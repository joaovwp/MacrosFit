const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function searchFoods(foods, query) {
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  console.log('[search] query:', JSON.stringify(query), 'tokens:', tokens, 'total foods:', foods.length);

  if (!tokens.length) {
    const results = foods
      .map(f => ({ f, score: f.priority }))
      .sort((a, b) => b.score - a.score || a.f.name.localeCompare(b.f.name))
      .map(r => r.f);
    console.log('[search] empty query - returning all foods:', results.length);
    return results;
  }

  const results = foods
    .map(f => {
      const aliases = Array.isArray(f.aliases) ? f.aliases : [];
      const words = norm([f.name, ...aliases].join(' ')).split(/[\s,]+/);
      if (!tokens.every(t => words.some(w => w.startsWith(t)))) return null;
      const bonus = norm(f.name).startsWith(tokens[0]) ? 10 : 0;
      const exactMatch = tokens.every((t, i) => {
        const remainingWords = norm(f.name).split(/\s+/);
        return remainingWords[i] && remainingWords[i].startsWith(t);
      }) ? 20 : 0;
      return { f, score: exactMatch + bonus + f.priority };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.f.name.localeCompare(b.f.name))
    .map(r => r.f);

  console.log('[search] matched results:', results.length);
  console.log('[search] all results:', results.map(f => f.name));

  return results;
}
