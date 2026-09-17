export function toggleSwitch(checked, dataAction, dataKey) {
  return `<button type="button" class="toggle" data-action="${dataAction}" data-key="${dataKey || ""}" style="background:${checked ? "var(--calories)" : "var(--surface2)"}">
    <div class="toggle-dot" style="left:${checked ? "18px" : "2px"}"></div>
  </button>`;
}
