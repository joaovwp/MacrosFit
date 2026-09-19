import { icon } from '../../core/icons.js';
import { esc } from '../../core/utils.js';

export function authViewHTML(state) {
  const isLogin = state.auth.mode === 'login';
  const loading = state.auth.loading;
  const error = state.auth.error;

  return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;background:var(--bg)">
    <div class="card" style="width:100%;max-width:360px;padding:24px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:24px;font-weight:700;color:var(--text)">MacrosFit</div>
        <div style="font-size:13px;color:var(--textMuted);margin-top:4px">${isLogin ? 'Entre na sua conta' : 'Crie sua conta'}</div>
      </div>

      ${error ? `<div style="padding:12px;background:var(--errorBg);color:var(--error);border-radius:8px;font-size:13px;margin-bottom:16px">${esc(error)}</div>` : ''}

      <div style="display:flex;flex-direction:column;gap:12px">
        ${!isLogin ? `<div>
          <label style="font-size:12px;color:var(--textMuted);margin-bottom:4px;display:block">Nome</label>
          <input class="input" type="text" placeholder="Seu nome" value="${esc(state.auth.displayName)}" data-action="auth-display-name-input" ${loading ? 'disabled' : ''}/>
        </div>` : ''}

        <div>
          <label style="font-size:12px;color:var(--textMuted);margin-bottom:4px;display:block">E-mail</label>
          <input class="input" type="email" placeholder="seu@email.com" value="${esc(state.auth.email)}" data-action="auth-email-input" ${loading ? 'disabled' : ''}/>
        </div>

        <div>
          <label style="font-size:12px;color:var(--textMuted);margin-bottom:4px;display:block">Senha</label>
          <input class="input" type="password" placeholder="••••••••" value="${esc(state.auth.password)}" data-action="auth-password-input" ${loading ? 'disabled' : ''}/>
        </div>

        <button class="btn btn-primary" data-action="auth-submit" ${loading ? 'disabled' : ''} style="width:100%">
          ${loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar conta')}
        </button>
      </div>

      <div style="margin-top:20px;text-align:center;font-size:13px">
        <span style="color:var(--textMuted)">${isLogin ? 'Não tem conta?' : 'Já tem conta?'}</span>
        <button class="btn-link" data-action="auth-toggle-mode" style="margin-left:4px;color:var(--primary);background:none;border:none;padding:0;font-size:13px;cursor:pointer">
          ${isLogin ? 'Criar conta' : 'Entrar'}
        </button>
      </div>

      ${isLogin ? `<div style="margin-top:16px;text-align:center">
        <button class="btn-link" data-action="auth-reset-password" style="color:var(--textMuted);background:none;border:none;padding:0;font-size:12px;cursor:pointer">
          Esqueci minha senha
        </button>
      </div>` : ''}
    </div>
  </div>`;
}
