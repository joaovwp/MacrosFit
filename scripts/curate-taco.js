import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista de alimentos comuns para marcar como is_standard
const STANDARD_FOODS_KEYWORDS = [
  'arroz', 'feijão', 'macarrão', 'carne', 'frango', 'peixe', 'ovo',
  'leite', 'queijo', 'iogurte', 'pão', 'batata', 'mandioca', 'milho',
  'banana', 'maçã', 'laranja', 'tomate', 'alface', 'cebola', 'alho',
  'cenoura', 'abóbora', 'brócolis', 'couve', 'espinafre', 'aveia',
  'açúcar', 'óleo', 'manteiga', 'café', 'chocolate', 'whey', 'creatina'
];

// Alimentos essenciais que NÃO existem na TACO
const ESSENTIAL_FOODS = [
  {
    name: 'Tapioca (goma pura)',
    display_name: 'Tapioca (goma)',
    aliases: ['tapioca', 'goma de mandioca', 'goma'],
    kcal_per_100: 240,
    protein_per_100: 0,
    carbs_per_100: 61.5,
    fat_per_100: 0,
    category: 'Cereais e derivados'
  },
  {
    name: 'Farelo de aveia',
    display_name: 'Farelo de aveia',
    aliases: ['farelo de aveia', 'farelo'],
    kcal_per_100: 250,
    protein_per_100: 17,
    carbs_per_100: 66,
    fat_per_100: 7,
    category: 'Cereais e derivados'
  },
  {
    name: 'Leite desnatado líquido',
    display_name: 'Leite desnatado',
    aliases: ['leite desnatado', 'leite zero gordura'],
    kcal_per_100: 36,
    protein_per_100: 3.4,
    carbs_per_100: 5.1,
    fat_per_100: 0.1,
    category: 'Leite e derivados'
  },
  {
    name: 'Leite semidesnatado líquido',
    display_name: 'Leite semidesnatado',
    aliases: ['leite semidesnatado', 'leite light'],
    kcal_per_100: 48,
    protein_per_100: 3.3,
    carbs_per_100: 4.8,
    fat_per_100: 1.7,
    category: 'Leite e derivados'
  },
  {
    name: 'Requeijão tradicional',
    display_name: 'Requeijão',
    aliases: ['requeijao', 'requeijão'],
    kcal_per_100: 280,
    protein_per_100: 8,
    carbs_per_100: 6,
    fat_per_100: 24,
    category: 'Leite e derivados'
  },
  {
    name: 'Requeijão light',
    display_name: 'Requeijão light',
    aliases: ['requeijao light', 'requeijão light'],
    kcal_per_100: 180,
    protein_per_100: 10,
    carbs_per_100: 5,
    fat_per_100: 12,
    category: 'Leite e derivados'
  },
  {
    name: 'Azeite de oliva',
    display_name: 'Azeite de oliva',
    aliases: ['azeite', 'azeite de oliva', 'olive oil'],
    kcal_per_100: 884,
    protein_per_100: 0,
    carbs_per_100: 0,
    fat_per_100: 100,
    category: 'Outros alimentos industrializados'
  }
];

// Suplementos genéricos para adicionar
const SUPPLEMENTS = [
  {
    name: 'Whey Protein Concentrado',
    display_name: 'Whey Protein Concentrado',
    aliases: ['whey', 'whey concentrado', 'proteína whey'],
    kcal_per_100: 380,
    protein_per_100: 78,
    carbs_per_100: 6,
    fat_per_100: 4,
    category: 'Suplementos'
  },
  {
    name: 'Whey Protein Isolado',
    display_name: 'Whey Protein Isolado',
    aliases: ['whey isolado', 'isolate', 'proteína isolada'],
    kcal_per_100: 360,
    protein_per_100: 90,
    carbs_per_100: 1,
    fat_per_100: 1,
    category: 'Suplementos'
  },
  {
    name: 'Creatina Monohidratada',
    display_name: 'Creatina Monohidratada',
    aliases: ['creatina', 'creatinina'],
    kcal_per_100: 0,
    protein_per_100: 0,
    carbs_per_100: 0,
    fat_per_100: 0,
    category: 'Suplementos'
  },
  {
    name: 'Albumina',
    display_name: 'Albumina (Clara de Ovo em Pó)',
    aliases: ['albumina', 'clara de ovo em pó', 'egg white'],
    kcal_per_100: 360,
    protein_per_100: 82,
    carbs_per_100: 2,
    fat_per_100: 1,
    category: 'Suplementos'
  },
  {
    name: 'Caseína',
    display_name: 'Caseína',
    aliases: ['caseina', 'caseina proteína'],
    kcal_per_100: 370,
    protein_per_100: 80,
    carbs_per_100: 4,
    fat_per_100: 2,
    category: 'Suplementos'
  },
  {
    name: 'Hipercalórico',
    display_name: 'Hipercalórico',
    aliases: ['hipercalorico', 'mass gainer', 'gainer'],
    kcal_per_100: 400,
    protein_per_100: 20,
    carbs_per_100: 70,
    fat_per_100: 8,
    category: 'Suplementos'
  },
  {
    name: 'Hiperproteico',
    display_name: 'Hiperproteico',
    aliases: ['hiperproteico', 'protein gainer'],
    kcal_per_100: 380,
    protein_per_100: 50,
    carbs_per_100: 25,
    fat_per_100: 5,
    category: 'Suplementos'
  },
  {
    name: 'Pasta de Amendoim',
    display_name: 'Pasta de Amendoim',
    aliases: ['pasta de amendoim', 'peanut butter', 'amendoim pasta'],
    kcal_per_100: 590,
    protein_per_100: 25,
    carbs_per_100: 20,
    fat_per_100: 48,
    category: 'Suplementos'
  },
  {
    name: 'BCAA',
    display_name: 'BCAA',
    aliases: ['bcaa', 'aminoácidos ramificados'],
    kcal_per_100: 0,
    protein_per_100: 0,
    carbs_per_100: 0,
    fat_per_100: 0,
    category: 'Suplementos'
  },
  {
    name: 'Glutamina',
    display_name: 'Glutamina',
    aliases: ['glutamina', 'l-glutamina'],
    kcal_per_100: 0,
    protein_per_100: 0,
    carbs_per_100: 0,
    fat_per_100: 0,
    category: 'Suplementos'
  },
  {
    name: 'Maltodextrina',
    display_name: 'Maltodextrina',
    aliases: ['maltodextrina', 'carboidrato simples'],
    kcal_per_100: 380,
    protein_per_100: 0,
    carbs_per_100: 95,
    fat_per_100: 0,
    category: 'Suplementos'
  },
  {
    name: 'Dextrose',
    display_name: 'Dextrose',
    aliases: ['dextrose', 'glicose'],
    kcal_per_100: 400,
    protein_per_100: 0,
    carbs_per_100: 100,
    fat_per_100: 0,
    category: 'Suplementos'
  },
  {
    name: 'Barra de Proteína',
    display_name: 'Barra de Proteína',
    aliases: ['barra proteica', 'protein bar'],
    kcal_per_100: 350,
    protein_per_100: 25,
    carbs_per_100: 40,
    fat_per_100: 10,
    category: 'Suplementos'
  },
  {
    name: 'Pré-treino',
    display_name: 'Pré-treino',
    aliases: ['pre treino', 'pre-workout', 'pre workout'],
    kcal_per_100: 50,
    protein_per_100: 0,
    carbs_per_100: 10,
    fat_per_100: 0,
    category: 'Suplementos'
  },
  {
    name: 'Multivitamínico',
    display_name: 'Multivitamínico',
    aliases: ['multivitaminico', 'vitaminas'],
    kcal_per_100: 0,
    protein_per_100: 0,
    carbs_per_100: 0,
    fat_per_100: 0,
    category: 'Suplementos'
  },
  {
    name: 'Ômega 3',
    display_name: 'Ômega 3',
    aliases: ['omega 3', 'fish oil', 'óleo de peixe'],
    kcal_per_100: 900,
    protein_per_100: 0,
    carbs_per_100: 0,
    fat_per_100: 100,
    category: 'Suplementos'
  },
  {
    name: 'ZMA',
    display_name: 'ZMA',
    aliases: ['zma', 'zinco magnesio'],
    kcal_per_100: 0,
    protein_per_100: 0,
    carbs_per_100: 0,
    fat_per_100: 0,
    category: 'Suplementos'
  }
];

// Função para limpar e gerar display_name
function cleanName(name) {
  let cleaned = name;
  const lowerName = name.toLowerCase();

  // Limpeza padrão
  cleaned = cleaned
    .replace(/, cru/gi, ' cru')
    .replace(/, cozido/gi, ' cozido')
    .replace(/, refogado/gi, ' refogado')
    .replace(/, frito/gi, ' frito')
    .replace(/, assado/gi, ' assado')
    .replace(/, grelhado/gi, ' grelhado')
    .replace(/, pré-cozida/gi, ' pré-cozido')
    .replace(/, pré-cozido/gi, ' pré-cozido')
    .replace(/, industrializada/gi, '')
    .replace(/, enlatado/gi, ' enlatado')
    .replace(/, drenado/gi, ' drenado')
    .replace(/, desidratadas/gi, ' desidratado')
    .replace(/, desidratado/gi, ' desidratado')
    .replace(/, polpa/gi, ' polpa')
    .replace(/, congelada/gi, ' congelado')
    .replace(/, congelado/gi, ' congelado');

  // REMOVER "tipo 1/2" sempre - é o que confunde o usuário
  cleaned = cleaned.replace(/, tipo [12]/gi, '');
  cleaned = cleaned.replace(/, tipo [12],/gi, ',');

  // Converter arroz tipo 1/2 para "branco" de forma inteligente
  if (lowerName.includes('arroz') && (lowerName.includes('tipo 1') || lowerName.includes('tipo 2'))) {
    if (!lowerName.includes('integral')) {
      cleaned = cleaned.replace('Arroz', 'Arroz branco');
    }
  }

  // Preservar especificações importantes para farinhas e pastéis
  cleaned = cleaned.replace(/, de (mandioca|milho|trigo|soja|arroz|centeio)/gi, (match, type) => {
    return ` de ${type}`;
  });

  // Para pastéis, preservar "de carne/queijo"
  if (lowerName.includes('pastel')) {
    cleaned = cleaned.replace(/, de (carne|queijo)/gi, (match, type) => {
      return ` de ${type}`;
    });
  }

  // Remover "com X" e "em X" de forma seletiva
  cleaned = cleaned.replace(/, com (leite|ovos|sal|açúcar)/gi, (match, ingredient) => {
    if (ingredient === 'leite' && lowerName.includes('canjica')) {
      return ` com ${ingredient}`;
    }
    return '';
  });

  cleaned = cleaned.replace(/, em (conserva|calda)/gi, '');
  cleaned = cleaned.replace(/, da terra/gi, '');

  // Reordenar: "Arroz, integral, cozido" → "Arroz integral cozido"
  cleaned = cleaned
    .split(', ')
    .filter(part => part.length > 0)
    .join(' ');

  // Capitalizar primeira letra
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  return cleaned;
}

// Função para gerar aliases
function generateAliases(name, displayName) {
  const aliases = [];
  const lowerName = name.toLowerCase();
  const lowerDisplay = displayName.toLowerCase();

  // Extrair primeira palavra (base)
  const firstWord = lowerDisplay.split(' ')[0];
  if (firstWord && firstWord.length > 2) {
    aliases.push(firstWord);
  }

  // Extrair segunda palavra se for relevante
  const words = lowerDisplay.split(' ');
  if (words.length > 1) {
    aliases.push(`${words[0]} ${words[1]}`);
  }

  // Adicionar variações comuns - mais conservador
  if (lowerName.includes('arroz') && !lowerName.includes('creme') && !lowerName.includes('farinha')) {
    aliases.push('arroz');
    if (lowerDisplay.includes('branco') || lowerName.includes('tipo 1') || lowerName.includes('tipo 2')) {
      aliases.push('arroz branco');
    }
  }
  if (lowerName.includes('feijão')) {
    aliases.push('feijao', 'feijão');
  }
  if (lowerName.includes('frango')) {
    aliases.push('frango');
    if (lowerName.includes('peito')) {
      aliases.push('peito de frango', 'filé de frango');
    }
    if (lowerName.includes('filé')) {
      aliases.push('filé de frango');
    }
    if (lowerName.includes('coxa') && !lowerName.includes('pele')) {
      aliases.push('coxa de frango');
    }
  }
  if (lowerName.includes('carne')) {
    aliases.push('carne');
    if (lowerName.includes('bovina') || lowerName.includes('bovino')) {
      aliases.push('carne bovina', 'carne vermelha');
    }
    if (lowerName.includes('patinho') || lowerName.includes('acém') || lowerName.includes('alcatra')) {
      aliases.push('carne moída');
    }
  }
  if (lowerName.includes('porco') || lowerName.includes('suína') || lowerName.includes('suino')) {
    aliases.push('carne de porco');
  }

  // Peixes
  if (lowerName.includes('salmão') || lowerName.includes('salmao')) {
    aliases.push('salmão', 'salmao', 'peixe');
  }
  if (lowerName.includes('tilápia') || lowerName.includes('tilapia')) {
    aliases.push('tilápia', 'tilapia', 'peixe');
  }
  if (lowerName.includes('atum')) {
    aliases.push('atum', 'peixe');
  }
  if (lowerName.includes('sardinha')) {
    aliases.push('sardinha', 'peixe');
  }
  if (lowerName.includes('bacalhau')) {
    aliases.push('bacalhau', 'peixe');
  }

  // Leguminosas
  if (lowerName.includes('lentilha')) {
    aliases.push('lentilha', 'feijão');
  }
  if (lowerName.includes('grão de bico') || lowerName.includes('grao de bico')) {
    aliases.push('grão de bico', 'grao de bico', 'feijão');
  }

  // Verduras
  if (lowerName.includes('batata')) {
    aliases.push('batata');
  }
  if (lowerName.includes('mandioca') || lowerName.includes('aipim')) {
    aliases.push('mandioca', 'aipim');
  }

  // Frutas
  if (lowerName.includes('tangerina') || lowerName.includes('mexerica')) {
    aliases.push('tangerina', 'mexerica', 'laranja');
  }
  if (lowerName.includes('abacaxi')) {
    aliases.push('abacaxi', 'fruta');
  }
  if (lowerName.includes('abacate')) {
    aliases.push('abacate', 'fruta');
  }

  // Leite e derivados
  if (lowerName.includes('queijo')) {
    aliases.push('queijo');
  }
  if (lowerName.includes('iogurte')) {
    aliases.push('iogurte', 'leite');
  }

  // Nozes e sementes
  if (lowerName.includes('castanha')) {
    aliases.push('castanha', 'oleaginosa');
  }
  if (lowerName.includes('amendoim')) {
    aliases.push('amendoim', 'oleaginosa');
  }
  if (lowerName.includes('chia') || lowerName.includes('linhaça')) {
    aliases.push('semente', 'oleaginosa');
  }
  if (lowerName.includes('leite') && !lowerName.includes('canjica') && !lowerName.includes('curau')) {
    aliases.push('leite');
  }
  if (lowerName.includes('pão')) {
    aliases.push('pao', 'pão');
  }
  if (lowerName.includes('macarrão') || lowerName.includes('macarrao')) {
    aliases.push('macarrao', 'macarrão');
  }

  // Remover duplicatas e aliases muito curtos
  return [...new Set(aliases)].filter(a => a.length > 2);
}

// Função para verificar se é alimento padrão
function isStandardFood(name) {
  const lowerName = name.toLowerCase();

  // Verifica se contém keyword base
  const hasKeyword = STANDARD_FOODS_KEYWORDS.some(keyword => lowerName.includes(keyword));
  if (!hasKeyword) return false;

  // Excluir variações muito específicas que NÃO devem ser padrão
  const exclusions = [
    'rosca', 'lactea', 'puba', 'mesocarpo', 'babaçu',
    'massa crua', 'massa frita', // Pastel massa não é pastel pronto
    'em conserva', 'em calda', 'drenado',
    'desidratado', 'polpa congelada',
    'mistura para', 'pré-cozido'
  ];

  if (exclusions.some(ex => lowerName.includes(ex))) {
    return false;
  }

  // Para frango: regra específica vem antes (tem prioridade)
  if (lowerName.includes('frango')) {
    const standardParts = ['peito', 'filé', 'coxa sem pele', 'sobrecoxa sem pele'];
    if (standardParts.some(part => lowerName.includes(part))) {
      return true;
    }
    // Variações técnicas não são padrão
    return false;
  }

  // Para arroz: apenas branco e integral são padrão
  if (lowerName.includes('arroz')) {
    // Arroz branco (tipo 1 ou 2) e integral são padrão
    if (lowerName.includes('integral') || lowerName.includes('tipo 1') || lowerName.includes('tipo 2')) {
      return true;
    }
    // Outros tipos de arroz não são padrão
    return false;
  }

  // Para farinhas: apenas as mais comuns são padrão
  if (lowerName.includes('farinha')) {
    const commonFlours = ['trigo', 'mandioca', 'milho', 'arroz'];
    if (commonFlours.some(f => lowerName.includes(f))) {
      return true;
    }
    return false;
  }

  // Para pastéis: apenas com recheio são padrão
  if (lowerName.includes('pastel')) {
    if (lowerName.includes('massa')) {
      return false; // Apenas massa não é pastel
    }
    if (lowerName.includes('carne') || lowerName.includes('queijo')) {
      return true;
    }
    return false;
  }

  // Para pães: apenas os mais comuns são padrão
  if (lowerName.includes('pão')) {
    const commonBreads = ['francês', 'trigo', 'integral', 'queijo'];
    if (commonBreads.some(b => lowerName.includes(b))) {
      return true;
    }
    return false;
  }

  // Para feijão: apenas carioca, preto e similares são padrão
  if (lowerName.includes('feijão')) {
    if (lowerName.includes('broto')) {
      return false;
    }
    return true;
  }

  // Para bananas: apenas as mais comuns são padrão
  if (lowerName.includes('banana')) {
    const commonBananas = ['nanica', 'prata', 'maçã', 'terra'];
    if (commonBananas.some(b => lowerName.includes(b))) {
      return true;
    }
    return false;
  }

  // Para laranjas: apenas as mais comuns são padrão
  if (lowerName.includes('laranja')) {
    const commonOranges = ['pêra', 'baía', 'lima'];
    if (commonOranges.some(o => lowerName.includes(o))) {
      return true;
    }
    return false;
  }

  // Para carne bovina: apenas cortes comuns são padrão
  if (lowerName.includes('carne') && (lowerName.includes('bovina') || lowerName.includes('bovino'))) {
    const standardCuts = ['acém', 'patinho', 'alcatra', 'filé mignon', 'picanha', 'contra-filé', 'lagarto', 'coxão mole', 'coxão duro'];
    if (standardCuts.some(cut => lowerName.includes(cut))) {
      return true;
    }
    // Miúdos e variações técnicas não são padrão
    const exclusions = ['fígado', 'bucho', 'língua', 'músculo', 'flanco', 'maminha', 'miolo'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    return false;
  }

  // Para porco: apenas cortes comuns são padrão
  if (lowerName.includes('porco') || lowerName.includes('suína') || lowerName.includes('suino')) {
    const standardCuts = ['lombo', 'bisteca', 'pernil', 'costela'];
    if (standardCuts.some(cut => lowerName.includes(cut))) {
      return true;
    }
    return false;
  }

  // Para peixes: apenas peixes comuns são padrão
  if (lowerName.includes('peixe') || lowerName.includes('pescado') ||
      lowerName.includes('salmão') || lowerName.includes('tilápia') ||
      lowerName.includes('atum') || lowerName.includes('sardinha') ||
      lowerName.includes('bacalhau') || lowerName.includes('corvina')) {
    const standardFish = ['salmão', 'tilápia', 'atum', 'sardinha', 'bacalhau', 'corvina', 'cação', 'pescada'];
    if (standardFish.some(fish => lowerName.includes(fish))) {
      // Excluir variações muito específicas
      const exclusions = ['em conserva', 'salgado', 'congelado', 'com farinha'];
      if (exclusions.some(ex => lowerName.includes(ex))) {
        return false;
      }
      return true;
    }
    return false;
  }

  // Para leguminosas: apenas as mais comuns são padrão
  if (lowerName.includes('feijão') || lowerName.includes('lentilha') ||
      lowerName.includes('grão de bico') || lowerName.includes('soja')) {
    const exclusions = ['broto', 'farinha', 'em conserva'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    return true;
  }

  // Para verduras/hortaliças: apenas as mais comuns são padrão
  if (lowerName.includes('tomate') || lowerName.includes('alface') ||
      lowerName.includes('cebola') || lowerName.includes('cenoura') ||
      lowerName.includes('brócolis') || lowerName.includes('couve') ||
      lowerName.includes('espinafre') || lowerName.includes('abóbora') ||
      lowerName.includes('abobrinha') || lowerName.includes('chuchu') ||
      lowerName.includes('pepino') || lowerName.includes('repolho') ||
      lowerName.includes('batata') || lowerName.includes('mandioca')) {
    const exclusions = ['em conserva', 'em calda', 'drenado', 'desidratado', 'pré-cozido'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    return true;
  }

  // Para frutas: apenas as mais comuns são padrão
  if (lowerName.includes('banana') || lowerName.includes('maçã') ||
      lowerName.includes('laranja') || lowerName.includes('tangerina') ||
      lowerName.includes('mexerica') || lowerName.includes('mamão') ||
      lowerName.includes('manga') || lowerName.includes('melancia') ||
      lowerName.includes('melão') || lowerName.includes('morango') ||
      lowerName.includes('pêra') || lowerName.includes('abacaxi') ||
      lowerName.includes('uva') || lowerName.includes('abacate')) {
    const exclusions = ['em calda', 'em conserva', 'drenado', 'doce em', 'polpa congelada'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    return true;
  }

  // Para leite e derivados: apenas os mais comuns são padrão
  if (lowerName.includes('leite') || lowerName.includes('queijo') ||
      lowerName.includes('iogurte') || lowerName.includes('requeijão')) {
    const exclusions = ['em pó', 'condensado', 'em conserva'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    // Para queijos: apenas os mais comuns
    if (lowerName.includes('queijo')) {
      const commonCheeses = ['mussarela', 'minas', 'prato', 'parmesão', 'provolone', 'ricota'];
      if (commonCheeses.some(cheese => lowerName.includes(cheese))) {
        return true;
      }
      return false;
    }
    return true;
  }

  // Para ovos: todas as formas comuns são padrão
  if (lowerName.includes('ovo')) {
    const exclusions = ['em pó', 'desidratado'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    return true;
  }

  // Para nozes e sementes: todas são padrão
  if (lowerName.includes('castanha') || lowerName.includes('amendoim') ||
      lowerName.includes('noz') || lowerName.includes('amêndoa') ||
      lowerName.includes('chia') || lowerName.includes('linhaça') ||
      lowerName.includes('gergelim') || lowerName.includes('pistache')) {
    return true;
  }

  // Para gorduras e óleos: apenas os mais comuns são padrão
  if (lowerName.includes('óleo') || lowerName.includes('azeite') ||
      lowerName.includes('manteiga') || lowerName.includes('margarina')) {
    const exclusions = ['hidrogenado', 'interesterificado'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    return true;
  }
  if (lowerName.includes('peixe') || lowerName.includes('pescado') ||
      lowerName.includes('salmão') || lowerName.includes('tilápia') ||
      lowerName.includes('atum') || lowerName.includes('sardinha') ||
      lowerName.includes('bacalhau') || lowerName.includes('corvina')) {
    const standardFish = ['salmão', 'tilápia', 'atum', 'sardinha', 'bacalhau', 'corvina', 'cação', 'pescada'];
    if (standardFish.some(fish => lowerName.includes(fish))) {
      // Excluir variações muito específicas
      const exclusions = ['em conserva', 'salgado', 'congelado', 'com farinha'];
      if (exclusions.some(ex => lowerName.includes(ex))) {
        return false;
      }
      return true;
    }
    return false;
  }

  // Para leguminosas: apenas as mais comuns são padrão
  if (lowerName.includes('feijão') || lowerName.includes('lentilha') ||
      lowerName.includes('grão de bico') || lowerName.includes('soja')) {
    const exclusions = ['broto', 'farinha', 'em conserva'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    return true;
  }

  // Para verduras/hortaliças: apenas as mais comuns são padrão
  if (lowerName.includes('tomate') || lowerName.includes('alface') ||
      lowerName.includes('cebola') || lowerName.includes('cenoura') ||
      lowerName.includes('brócolis') || lowerName.includes('couve') ||
      lowerName.includes('espinafre') || lowerName.includes('abóbora') ||
      lowerName.includes('abobrinha') || lowerName.includes('chuchu') ||
      lowerName.includes('pepino') || lowerName.includes('repolho') ||
      lowerName.includes('batata') || lowerName.includes('mandioca')) {
    const exclusions = ['em conserva', 'em calda', 'drenado', 'desidratado', 'pré-cozido'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    return true;
  }

  // Para frutas: apenas as mais comuns são padrão
  if (lowerName.includes('banana') || lowerName.includes('maçã') ||
      lowerName.includes('laranja') || lowerName.includes('tangerina') ||
      lowerName.includes('mexerica') || lowerName.includes('mamão') ||
      lowerName.includes('manga') || lowerName.includes('melancia') ||
      lowerName.includes('melão') || lowerName.includes('morango') ||
      lowerName.includes('pêra') || lowerName.includes('abacaxi') ||
      lowerName.includes('uva') || lowerName.includes('abacate')) {
    const exclusions = ['em calda', 'em conserva', 'drenado', 'doce em', 'polpa congelada'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    return true;
  }

  // Para leite e derivados: apenas os mais comuns são padrão
  if (lowerName.includes('leite') || lowerName.includes('queijo') ||
      lowerName.includes('iogurte') || lowerName.includes('requeijão')) {
    const exclusions = ['em pó', 'condensado', 'em conserva'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    // Para queijos: apenas os mais comuns
    if (lowerName.includes('queijo')) {
      const commonCheeses = ['mussarela', 'minas', 'prato', 'parmesão', 'provolone', 'ricota'];
      if (commonCheeses.some(cheese => lowerName.includes(cheese))) {
        return true;
      }
      return false;
    }
    return true;
  }

  // Para ovos: todas as formas comuns são padrão
  if (lowerName.includes('ovo')) {
    const exclusions = ['em pó', 'desidratado'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    return true;
  }

  // Para nozes e sementes: todas são padrão
  if (lowerName.includes('castanha') || lowerName.includes('amendoim') ||
      lowerName.includes('noz') || lowerName.includes('amêndoa') ||
      lowerName.includes('chia') || lowerName.includes('linhaça') ||
      lowerName.includes('gergelim') || lowerName.includes('pistache')) {
    return true;
  }

  // Para gorduras e óleos: apenas os mais comuns são padrão
  if (lowerName.includes('óleo') || lowerName.includes('azeite') ||
      lowerName.includes('manteiga') || lowerName.includes('margarina')) {
    const exclusions = ['hidrogenado', 'interesterificado'];
    if (exclusions.some(ex => lowerName.includes(ex))) {
      return false;
    }
    return true;
  }

  // Padrão para outros: se tem keyword e não está na exclusão, é padrão
  return true;
}

// Ler CSV
const csvPath = path.join(__dirname, '..', '.dev', 'scripts', 'Supabase Snippet Untitled query.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Parse CSV (handle quoted fields with newlines)
const headers = lines[0].split(',');
const foods = [];
let currentLine = '';
let inQuotes = false;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  currentLine += line;

  // Count quotes to determine if we're inside a quoted field
  const quoteCount = (line.match(/"/g) || []).length;
  inQuotes = quoteCount % 2 !== 0;

  if (!inQuotes) {
    // Parse the complete line
    const values = currentLine.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
    if (values && values.length >= 7) {
      const food = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        value = value.replace(/^"|"$/g, '').trim();
        food[header.trim()] = value;
      });

      if (food.id && food.name) {
        foods.push(food);
      }
    }
    currentLine = '';
  } else {
    currentLine += ' '; // Preserve space for next line
  }
}

console.log(`Processando ${foods.length} alimentos...`);

// Processar alimentos e detectar duplicatas
const processedFoods = foods.map(food => {
  const displayName = cleanName(food.name);
  const aliases = generateAliases(food.name, displayName);
  const standard = isStandardFood(food.name);

  return {
    ...food,
    displayName,
    aliases,
    standard,
    originalName: food.name
  };
});

// Detectar duplicatas de display_name e resolver conflitos
const displayNames = {};
processedFoods.forEach(food => {
  if (!displayNames[food.displayName]) {
    displayNames[food.displayName] = [];
  }
  displayNames[food.displayName].push(food);
});

// Resolver duplicatas
Object.keys(displayNames).forEach(dName => {
  const duplicates = displayNames[dName];
  if (duplicates.length > 1) {
    console.log(`Duplicata encontrada: ${dName} (${duplicates.length} itens)`);

    // Regras de prioridade
    duplicates.sort((a, b) => {
      // Tipo 1 tem prioridade sobre tipo 2
      const aTipo1 = a.originalName.toLowerCase().includes('tipo 1');
      const bTipo1 = b.originalName.toLowerCase().includes('tipo 1');
      const aTipo2 = a.originalName.toLowerCase().includes('tipo 2');
      const bTipo2 = b.originalName.toLowerCase().includes('tipo 2');

      if (aTipo1 && bTipo2) return -1;
      if (bTipo1 && aTipo2) return 1;

      // Se nenhum tem tipo, manter o primeiro
      return 0;
    });

    // Marcar apenas o primeiro como padrão
    duplicates.forEach((food, index) => {
      if (index === 0) {
        food.standard = true;
        console.log(`  -> Mantendo como padrão: ${food.id} (${food.originalName})`);
      } else {
        food.standard = false;
        console.log(`  -> Marcando como não padrão: ${food.id} (${food.originalName})`);
      }
    });
  }
});

// Gerar SQL
let sql = '-- SQL gerado automaticamente por curate-taco.js\n';
sql += '-- Revise manualmente antes de aplicar no Supabase\n\n';

// UPDATE para alimentos existentes
processedFoods.forEach(food => {
  const aliasesArray = food.aliases.length > 0
    ? `ARRAY[${food.aliases.map(a => `'${a}'`).join(', ')}]`
    : 'ARRAY[]::text[]';

  sql += `UPDATE standard_foods\n`;
  sql += `SET display_name = '${food.displayName.replace(/'/g, "''")}',\n`;
  sql += `    aliases = ${aliasesArray},\n`;
  sql += `    is_standard = ${food.standard},\n`;
  sql += `    source = 'taco'\n`;
  sql += `WHERE id = '${food.id}';\n\n`;
});

// Função para gerar ID determinístico (mesmo nome = mesmo ID)
function deterministicId(name) {
  return crypto.createHash('md5').update(name).digest('hex').substring(0, 32);
}

// INSERT/UPDATE para alimentos essenciais (idempotente)
ESSENTIAL_FOODS.forEach(food => {
  const id = deterministicId(`custom-${food.name}`);
  const aliasesArray = food.aliases.length > 0
    ? `ARRAY[${food.aliases.map(a => `'${a}'`).join(', ')}]`
    : 'ARRAY[]::text[]';

  sql += `INSERT INTO standard_foods (id, name, display_name, aliases, is_standard, source, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100, category, created_at)\n`;
  sql += `VALUES ('${id}', '${food.name}', '${food.display_name}', ${aliasesArray}, true, 'custom', ${food.kcal_per_100}, ${food.protein_per_100}, ${food.carbs_per_100}, ${food.fat_per_100}, '${food.category}', NOW())\n`;
  sql += `ON CONFLICT (id) DO UPDATE SET\n`;
  sql += `  display_name = EXCLUDED.display_name,\n`;
  sql += `  aliases = EXCLUDED.aliases,\n`;
  sql += `  is_standard = EXCLUDED.is_standard,\n`;
  sql += `  source = EXCLUDED.source,\n`;
  sql += `  kcal_per_100 = EXCLUDED.kcal_per_100,\n`;
  sql += `  protein_per_100 = EXCLUDED.protein_per_100,\n`;
  sql += `  carbs_per_100 = EXCLUDED.carbs_per_100,\n`;
  sql += `  fat_per_100 = EXCLUDED.fat_per_100,\n`;
  sql += `  category = EXCLUDED.category;\n\n`;
});

// INSERT/UPDATE para suplementos (idempotente)
SUPPLEMENTS.forEach(supplement => {
  const id = deterministicId(`supplement-${supplement.name}`);
  const aliasesArray = supplement.aliases.length > 0
    ? `ARRAY[${supplement.aliases.map(a => `'${a}'`).join(', ')}]`
    : 'ARRAY[]::text[]';

  sql += `INSERT INTO standard_foods (id, name, display_name, aliases, is_standard, source, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100, category, created_at)\n`;
  sql += `VALUES ('${id}', '${supplement.name}', '${supplement.display_name}', ${aliasesArray}, true, 'supplement', ${supplement.kcal_per_100}, ${supplement.protein_per_100}, ${supplement.carbs_per_100}, ${supplement.fat_per_100}, '${supplement.category}', NOW())\n`;
  sql += `ON CONFLICT (id) DO UPDATE SET\n`;
  sql += `  display_name = EXCLUDED.display_name,\n`;
  sql += `  aliases = EXCLUDED.aliases,\n`;
  sql += `  is_standard = EXCLUDED.is_standard,\n`;
  sql += `  source = EXCLUDED.source,\n`;
  sql += `  kcal_per_100 = EXCLUDED.kcal_per_100,\n`;
  sql += `  protein_per_100 = EXCLUDED.protein_per_100,\n`;
  sql += `  carbs_per_100 = EXCLUDED.carbs_per_100,\n`;
  sql += `  fat_per_100 = EXCLUDED.fat_per_100,\n`;
  sql += `  category = EXCLUDED.category;\n\n`;
});

// Salvar SQL
const outputPath = path.join(__dirname, 'standard_foods_curated.sql');
fs.writeFileSync(outputPath, sql);

console.log(`SQL gerado: ${outputPath}`);
console.log(`Total de UPDATEs: ${processedFoods.length}`);
console.log(`Total de INSERTs (alimentos essenciais): ${ESSENTIAL_FOODS.length}`);
console.log(`Total de INSERTs (suplementos): ${SUPPLEMENTS.length}`);
console.log(`\nREVISE O ARQUIVO ANTES DE APLICAR NO SUPABASE!`);
