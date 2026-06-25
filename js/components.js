export function createCard({ title = '', content = '', footer = '' }) {
  return `
    <section class="sc">
      ${title ? `
        <div class="sch">
          <div class="sct">${title}</div>
        </div>
      ` : ''}

      <div class="scb">
        ${content}
      </div>

      ${footer ? `
        <div class="scf">
          ${footer}
        </div>
      ` : ''}
    </section>
  `;
}

export function createEmptyState({
  title = '데이터 없음',
  description = '등록된 데이터가 없습니다.'
}) {
  return `
    <div class="empty-state">
      <div class="empty-icon">📄</div>
      <div class="empty-title">${title}</div>
      <div class="empty-description">${description}</div>
    </div>
  `;
}

export function createTable({ columns = [], rows = [] }) {
  return `
    <table class="tbl">
      <thead>
        <tr>
          ${columns.map(column => `<th${column.align ? ` style="text-align:${column.align};"` : ''}>${column.label}</th>`).join('')}
        </tr>
      </thead>

      <tbody>
        ${rows.map(row => `
          <tr>
            ${columns.map(column => `<td${column.align ? ` style="text-align:${column.align};"` : ''}>${row[column.key] ?? '-'}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

export function createKpiCard({ label = '', value = '-', unit = '' }) {
  return `
    <div class="kpi">
      <div class="kl">${label}</div>
      <div class="kv">${value}${unit}</div>
    </div>
  `;
}
