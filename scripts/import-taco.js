import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tacoData = JSON.parse(fs.readFileSync(join(__dirname, 'taco-data.json'), 'utf-8'));

const alimentos = tacoData.alimentos || tacoData.foods || tacoData || [];

if (!Array.isArray(alimentos)) {
  console.error('Erro: Não encontrou array de alimentos no JSON');
  process.exit(1);
}

const rows = alimentos
  .filter(f => f.calorias != null || f.calories != null || f.energy_kcal != null)
  .map(f => {
    const toNumber = (val) => {
      if (val === 'Tr' || val === 'NA' || val === '*' || val === null || val === undefined) return 0;
      const num = parseFloat(val);
      return isNaN(num) ? 0 : Math.max(0, num);
    };

    return {
      name:            (f.nome || f.name || f.description || 'Sem nome').replace(/'/g, "''"),
      kcal_per_100:    toNumber(f.calorias || f.calories || f.energy_kcal),
      protein_per_100: toNumber(f.proteinas || f.protein || f.protein_g),
      carbs_per_100:   toNumber(f.carboidratos || f.carbs || f.carbohydrate_g),
      fat_per_100:     toNumber(f.gorduras || f.fat || f.lipid_g),
      category:        f.grupo || f.category ? `'${(f.grupo || f.category).replace(/'/g, "''")}'` : 'NULL',
    };
  });

let sql = '-- Execute no Supabase SQL Editor\n';
sql += `-- Total de itens: ${rows.length}\n\n`;

for (let i = 0; i < rows.length; i += 50) {
  const batch = rows.slice(i, i + 50);
  const values = batch.map(r =>
    `(gen_random_uuid(), '${r.name}', ${r.kcal_per_100}, ${r.protein_per_100}, ${r.carbs_per_100}, ${r.fat_per_100}, ${r.category})`
  ).join(',\n  ');

  sql += `INSERT INTO public.standard_foods (id, name, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100, category) VALUES\n`;
  sql += `  ${values};\n\n`;
}

fs.writeFileSync(join(__dirname, 'taco-import.sql'), sql);
console.log(`✓ Gerado arquivo taco-import.sql com ${rows.length} alimentos`);
console.log('✓ Copie o conteúdo do arquivo e cole no Supabase SQL Editor');
