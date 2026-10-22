import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const foods = JSON.parse(fs.readFileSync(path.join(__dirname, 'foods.json'), 'utf8'));

// Validação
const errors = [];
const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

foods.forEach((f, index) => {
  // Validar slug
  if (!slugRegex.test(f.slug)) {
    errors.push(`Item ${index}: slug "${f.slug}" inválido (deve seguir regex ${slugRegex})`);
  }
  
  // Validar slug único
  const slugCount = foods.filter(x => x.slug === f.slug).length;
  if (slugCount > 1) {
    errors.push(`Item ${index}: slug "${f.slug}" duplicado (${slugCount} ocorrências)`);
  }
  
  // Validar name não vazio
  if (!f.name || typeof f.name !== 'string' || f.name.trim().length === 0) {
    errors.push(`Item ${index}: name inválido ou vazio`);
  }
  
  // Validar macros numéricos finitos e >= 0
  const macros = ['kcal_per_100', 'protein_per_100', 'carbs_per_100', 'fat_per_100'];
  macros.forEach(macro => {
    const val = f[macro];
    if (typeof val !== 'number' || !isFinite(val) || val < 0) {
      errors.push(`Item ${index}: ${macro} inválido (${val})`);
    }
  });
  
  // Validar priority inteiro
  if (!Number.isInteger(f.priority)) {
    errors.push(`Item ${index}: priority deve ser inteiro (${f.priority})`);
  }
  
  // Validar aliases como lista de strings não vazias
  if (!Array.isArray(f.aliases)) {
    errors.push(`Item ${index}: aliases deve ser um array`);
  } else {
    f.aliases.forEach((alias, aIndex) => {
      if (typeof alias !== 'string' || alias.trim().length === 0) {
        errors.push(`Item ${index}: alias[${aIndex}] inválido ou vazio`);
      }
    });
  }
});

if (errors.length > 0) {
  console.error('Erros de validação:');
  errors.forEach(e => console.error(`  ${e}`));
  process.exit(1);
}

console.log(`Validação OK: ${foods.length} itens`);

// Gerar seed.sql
const lines = [];
lines.push('-- Seed da tabela foods (upsert)');
lines.push('-- Gerado automaticamente por generate-seed.js');
lines.push('-- Data: ' + new Date().toISOString());
lines.push('');
lines.push('-- Usa INSERT ... ON CONFLICT: novos itens sao inseridos, existentes sao atualizados');
lines.push('-- Nao precisa executar todos os inserts de novo a cada mudanca.');

lines.push('insert into public.foods (slug, name, aliases, category, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100, priority, source)');
lines.push('values');

foods.forEach((f, index) => {
  const escapedName = f.name.replace(/'/g, "''");
  const escapedCategory = f.category ? `'${f.category.replace(/'/g, "''")}'` : 'null';
  const escapedSource = f.source.replace(/'/g, "''");
  
  const aliasesArray = f.aliases.map(a => a.replace(/'/g, "''"));
  const aliasesSql = aliasesArray.length > 0 
    ? `array[${aliasesArray.map(a => `'${a}'`).join(', ')}]::text[]`
    : "'{}'::text[]";
  
  const values = `  ('${f.slug}', '${escapedName}', ${aliasesSql}, ${escapedCategory}, ${f.kcal_per_100}, ${f.protein_per_100}, ${f.carbs_per_100}, ${f.fat_per_100}, ${f.priority}, '${escapedSource}')`;
  
  if (index < foods.length - 1) {
    lines.push(values + ',');
  } else {
    lines.push(values);
  }
});

lines.push('');
lines.push('on conflict (slug) do update set');
lines.push('  name = excluded.name,');
lines.push('  aliases = excluded.aliases,');
lines.push('  category = excluded.category,');
lines.push('  kcal_per_100 = excluded.kcal_per_100,');
lines.push('  protein_per_100 = excluded.protein_per_100,');
lines.push('  carbs_per_100 = excluded.carbs_per_100,');
lines.push('  fat_per_100 = excluded.fat_per_100,');
lines.push('  priority = excluded.priority,');
lines.push('  source = excluded.source;');

const outputPath = path.join(__dirname, 'seed.sql');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
console.log(`\nseed.sql gerado em: ${outputPath}`);
console.log(`Linhas: ${lines.length}`);
