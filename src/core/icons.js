export function icon(name, size, color, extra) {
  size = size || 15; color = color || "currentColor"; extra = extra || "";
  const a = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="${extra};flex-shrink:0;display:block"`;
  switch (name) {
    case "plus": return `<svg ${a}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    case "trash": return `<svg ${a}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
    case "pencil": return `<svg ${a}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
    case "x": return `<svg ${a}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    case "chevron-left": return `<svg ${a}><polyline points="15 18 9 12 15 6"/></svg>`;
    case "chevron-right": return `<svg ${a}><polyline points="9 18 15 12 9 6"/></svg>`;
    case "chevron-down": return `<svg ${a}><polyline points="6 9 12 15 18 9"/></svg>`;
    case "search": return `<svg ${a}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    case "flame": return `<svg ${a}><path d="M8.5 14.5c0 1.5 1.2 2.5 2.5 2.5s2.5-1 2.5-2.5c0-1.2-.5-2-1-3-1-1.9-.2-3.6 2-5.5.4 2.2 1.8 4.4 3.5 5.8 1.6 1.4 2.5 3 2.5 4.7a7.5 7.5 0 1 1-15 0c0-1 .4-2 1-2.7 1.3 1.3.5 3.5 2 4.7Z"/></svg>`;
    case "droplet": return `<svg ${a}><path d="M12 2s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/></svg>`;
    case "dumbbell": return `<svg ${a}><line x1="4" y1="12" x2="20" y2="12"/><circle cx="4" cy="12" r="2.3"/><circle cx="20" cy="12" r="2.3"/><line x1="9" y1="8" x2="9" y2="16"/><line x1="15" y1="8" x2="15" y2="16"/></svg>`;
    case "protein": return `<svg ${a}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
    case "carbs": return `<svg ${a}><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2a10 10 0 0 0-10 10"/></svg>`;
    case "fat": return `<svg ${a}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>`;
    case "trending-up": return `<svg ${a}><polyline points="3 17 9 11 13 15 21 6"/><polyline points="14 6 21 6 21 13"/></svg>`;
    case "check": return `<svg ${a}><polyline points="20 6 9 17 4 12"/></svg>`;
    case "alert-triangle": return `<svg ${a}><path d="M12 2 1 21h22L12 2Z"/><line x1="12" y1="9" x2="12" y2="14"/><line x1="12" y1="17.3" x2="12" y2="17.4"/></svg>`;
    case "sparkles": return `<svg ${a}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l1.8 1.8M15.7 15.7l1.8 1.8M6.5 17.5l1.8-1.8M15.7 8.3l1.8-1.8"/></svg>`;
    case "list-plus": return `<svg ${a}><line x1="3" y1="6" x2="13" y2="6"/><line x1="3" y1="12" x2="13" y2="12"/><line x1="3" y1="18" x2="10" y2="18"/><line x1="18" y1="9" x2="18" y2="17"/><line x1="14" y1="13" x2="22" y2="13"/></svg>`;
    case "sun": return `<svg ${a}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    case "moon": return `<svg ${a}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    case "star": return `<svg ${a}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    case "download": return `<svg ${a}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    case "upload": return `<svg ${a}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
    case "copy": return `<svg ${a}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    default: return "";
  }
}
