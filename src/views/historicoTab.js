import { trendChartHTML } from '../components/history/trendChart.js';
import { macroDistributionHTML } from '../components/history/macroDistribution.js';
import { weightTrendHTML } from '../components/history/weightTrend.js';
import { insightsGridHTML } from '../components/history/insights.js';
import { calendarMonthHTML } from '../components/history/calendar.js';
import { dayDetailHTML } from '../components/history/dayDetail.js';

export function historicoTabHTML(state) {
  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:12px">Análise de período</div>
      ${trendChartHTML(state)}
    </div>
    ${macroDistributionHTML(state)}
    ${weightTrendHTML(state)}
    ${insightsGridHTML(state)}
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:12px">Calendário</div>
      ${calendarMonthHTML(state)}
    </div>
    ${dayDetailHTML(state)}
  </div>`;
}
