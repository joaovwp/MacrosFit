// Tipos de erro padronizados
export const ErrorTypes = {
  CONNECTION: 'CONNECTION',
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  CRITICAL: 'CRITICAL',
  NOT_FOUND: 'NOT_FOUND'
};

// Mapeamento de códigos de erro Supabase para tipos
const supabaseErrorMap = {
  '23505': ErrorTypes.VALIDATION, // duplicate key
  '23503': ErrorTypes.VALIDATION, // foreign key violation
  '23502': ErrorTypes.VALIDATION, // not null violation
  '22P02': ErrorTypes.VALIDATION, // invalid text representation
  'PGRST116': ErrorTypes.NOT_FOUND, // row not found
  '42P01': ErrorTypes.CRITICAL, // undefined table
  '42P04': ErrorTypes.CRITICAL, // duplicate database
};

// Classificar erro baseado no objeto de erro
function classifyError(error) {
  if (!error) return ErrorTypes.CRITICAL;

  // Erros do Supabase
  if (error.code) {
    return supabaseErrorMap[error.code] || ErrorTypes.CONNECTION;
  }

  // Erros de autenticação por status HTTP
  if (error.status === 400 || error.status === 401 || error.status === 403) {
    return ErrorTypes.AUTH;
  }

  // Erros de autenticação por mensagem
  if (error.message?.toLowerCase().includes('invalid login credentials') ||
      error.message?.toLowerCase().includes('email not confirmed') ||
      error.message?.toLowerCase().includes('auth') || 
      error.message?.toLowerCase().includes('auth')) {
    return ErrorTypes.AUTH;
  }

  // Erros de validação customizados
  if (error.message?.includes('obrigatório') || 
      error.message?.includes('inválido') ||
      error.message?.includes('deve ser')) {
    return ErrorTypes.VALIDATION;
  }

  // Erros de conexão
  if (error.message?.toLowerCase().includes('network') || 
      error.message?.toLowerCase().includes('fetch') ||
      error.message?.toLowerCase().includes('timeout')) {
    return ErrorTypes.CONNECTION;
  }

  return ErrorTypes.CRITICAL;
}

// Gerar mensagem amigável baseada no tipo e erro original
function getErrorMessage(error, type) {
  if (!error) return 'Erro desconhecido';

  // Se já for uma mensagem amigável, retorna ela
  if (error.message && !error.code && !error.message.includes('Error:')) {
    return error.message;
  }

  switch (type) {
    case ErrorTypes.CONNECTION:
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    case ErrorTypes.VALIDATION:
      if (error.code === '23505') {
        return 'Já existe um registro com esses dados.';
      }
      return error.message || 'Dados inválidos. Verifique e tente novamente.';
    case ErrorTypes.AUTH:
      // Mensagens específicas para erros de autenticação
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        return 'E-mail ou senha incorretos.';
      }
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        return 'E-mail não confirmado. Verifique sua caixa de entrada.';
      }
      if (error.status === 401) {
        return 'Não autorizado. Verifique suas credenciais.';
      }
      return 'Erro de autenticação. Faça login novamente.';
    case ErrorTypes.NOT_FOUND:
      return 'Registro não encontrado.';
    case ErrorTypes.CRITICAL:
      return 'Erro interno. Tente novamente mais tarde.';
    default:
      return error.message || 'Erro desconhecido.';
  }
}

// Handler centralizado de erros
export function handleError(error, context = '') {
  const type = classifyError(error);
  const message = getErrorMessage(error, type);

  // Log no console para debug
  console.error(`[${context}] ${type}:`, error);

  return {
    type,
    message,
    original: error
  };
}

// Wrapper para async functions com error handling
export function withErrorHandling(fn, context = '') {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleError(error, context);
    }
  };
}
