import { icon } from '../../core/icons.js';
import { esc } from '../../core/utils.js';

export function profileViewHTML(state) {
  const user = state.auth.user;
  const profile = state.profile;
  const editing = state.profileTab.editing;
  const form = state.profileTab.form;
  const showDeleteConfirm = state.profileTab.showDeleteConfirm;

  if (!user) {
    return `<div style="padding:20px;text-align:center;color:var(--textMuted)">Carregando perfil...</div>`;
  }

  if (!profile) {
    return `<div style="padding:20px;text-align:center;color:var(--textMuted)">Carregando perfil...</div>`;
  }

  return `<div style="display:flex;flex-direction:column;gap:16px;padding:20px">
    <div class="card" style="padding:20px">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
        <div style="width:64px;height:64px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:white">
          ${esc(profile.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U')}
        </div>
        <div>
          <div style="font-size:18px;font-weight:700;color:var(--text)">${esc(profile.displayName || 'Sem nome')}</div>
          <div style="font-size:13px;color:var(--textMuted)">${esc(user.email || '')}</div>
          <div style="font-size:12px;color:var(--textFaint);margin-top:4px">Conta criada em ${new Date(user.created_at).toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

      ${editing ? `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div>
            <label style="font-size:12px;color:var(--textMuted);margin-bottom:4px;display:block">Nome</label>
            <input class="input" type="text" value="${esc(form.displayName)}" data-action="profile-display-name-input"/>
          </div>
          <div>
            <label style="font-size:12px;color:var(--textMuted);margin-bottom:4px;display:block">E-mail</label>
            <input class="input" type="email" value="${esc(form.email)}" data-action="profile-email-input"/>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" data-action="profile-save">Salvar</button>
            <button class="btn" data-action="profile-cancel-edit">Cancelar</button>
          </div>
        </div>
      ` : `
        <button class="btn" data-action="profile-edit">Editar perfil</button>
      `}
    </div>

    <div class="card" style="padding:20px">
      <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px">Segurança</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <button class="btn" data-action="profile-show-change-password">Alterar senha</button>
        <button class="btn btn-danger" data-action="profile-show-delete">Desativar conta</button>
      </div>
    </div>

    ${state.profileTab.showChangePassword ? `
      <div class="card" style="padding:20px;background:var(--surface2)">
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px">Alterar senha</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div>
            <label style="font-size:12px;color:var(--textMuted);margin-bottom:4px;display:block">Senha atual</label>
            <input class="input" type="password" value="${esc(form.currentPassword)}" data-action="profile-current-password-input"/>
          </div>
          <div>
            <label style="font-size:12px;color:var(--textMuted);margin-bottom:4px;display:block">Nova senha</label>
            <input class="input" type="password" value="${esc(form.newPassword)}" data-action="profile-new-password-input"/>
          </div>
          <div>
            <label style="font-size:12px;color:var(--textMuted);margin-bottom:4px;display:block">Confirmar nova senha</label>
            <input class="input" type="password" value="${esc(form.confirmPassword)}" data-action="profile-confirm-password-input"/>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" data-action="profile-change-password">Alterar senha</button>
            <button class="btn" data-action="profile-cancel-change-password">Cancelar</button>
          </div>
        </div>
      </div>
    ` : ''}

    ${showDeleteConfirm ? `
      <div class="card" style="padding:20px;border:1px solid var(--error)">
        <div style="font-size:15px;font-weight:700;color:var(--error);margin-bottom:8px">Desativar conta</div>
        <div style="font-size:13px;color:var(--text);margin-bottom:16px">Esta ação desativará sua conta. Você não poderá mais fazer login.</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-danger-solid" data-action="profile-confirm-deactivate">Desativar</button>
          <button class="btn" data-action="profile-cancel-delete">Cancelar</button>
        </div>
      </div>
    ` : ''}

    <button class="btn" data-action="profile-logout" style="margin-top:8px">Sair da conta</button>
  </div>`;
}
