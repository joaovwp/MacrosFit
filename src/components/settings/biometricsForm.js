import { icon } from '../../core/icons.js';
import { esc } from '../../core/utils.js';
import { ACTIVITY_LEVELS } from '../../core/constants.js';
import { calculateBMR, calculateTDEE, calculateAge } from '../../core/utils.js';

export function ensureBiometricsForm(state) {
  if (!state.biometricsForm) {
    const b = state.profile.biometrics || { weight: null, height: null, birthDate: null, gender: null, activityLevel: null };
    state.biometricsForm = { 
      weight: b.weight || "", 
      height: b.height || "", 
      birthDate: b.birthDate || "", 
      gender: b.gender || "", 
      activityLevel: b.activityLevel || "" 
    };
  }
}

export function biometricsFormHTML(state) {
  ensureBiometricsForm(state);
  const bio = state.biometricsForm;
  
  const bmr = calculateBMR(bio.weight, bio.height, bio.birthDate, bio.gender);
  const tdee = calculateTDEE(bmr, bio.activityLevel);
  const age = calculateAge(bio.birthDate);

  return `<div class="card" style="padding:16px">
    <div style="font-weight:700;font-size:15px;margin-bottom:4px">Dados biológicos</div>
    <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Usado para calcular TDEE e sugerir metas.</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:10px">
      <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Peso (kg)</div>
        <input class="input" type="number" value="${esc(bio.weight)}" data-action="bio-input" data-field="weight"/></div>
      <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Altura (cm)</div>
        <input class="input" type="number" value="${esc(bio.height)}" data-action="bio-input" data-field="height"/></div>
      <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Data de nascimento</div>
        <input class="input" type="date" value="${esc(bio.birthDate)}" data-action="bio-input" data-field="birthDate"/></div>
      <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Gênero</div>
        <select class="input" data-action="bio-input" data-field="gender">
          <option value="">Selecione</option>
          <option value="male" ${bio.gender === "male" ? "selected" : ""}>Masculino</option>
          <option value="female" ${bio.gender === "female" ? "selected" : ""}>Feminino</option>
        </select></div>
    </div>
    <div style="margin-bottom:10px">
      <div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Nível de atividade</div>
      <select class="input" data-action="bio-input" data-field="activityLevel">
        <option value="">Selecione</option>
        ${ACTIVITY_LEVELS.map(l => `<option value="${l.id}" ${bio.activityLevel === l.id ? "selected" : ""}>${l.label} - ${l.description} (${l.multiplier}x)</option>`).join("")}
      </select>
    </div>
    ${bmr ? `<div style="font-size:12px;color:var(--textMuted);margin-bottom:10px">
      <div>Idade calculada: ${age} anos</div>
      <div>BMR: ${Math.round(bmr)} kcal/dia</div>
      ${tdee ? `<div>TDEE: ${tdee} kcal/dia (manutenção)</div>` : ""}
    </div>` : ""}
    <button class="btn btn-primary" data-action="bio-save">Salvar dados biológicos</button>
  </div>`;
}
