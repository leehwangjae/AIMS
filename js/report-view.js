import { readCollection } from './storage.js';

export function renderReportList(targetSelector) {
  const target = document.querySelector(targetSelector);

  if (!target) {
    console.warn('보고서 렌더링 대상 요소를 찾을 수 없음');
    return;
  }

  const reports = readCollection('reports', []);

  if (!reports.length) {
    target.innerHTML = `
      <div class="sc">
        <div class="scb" style="font-size:13px;color:#6b7280;">
          등록된 보고서가 없습니다.
        </div>
      </div>
    `;

    return;
  }

  target.innerHTML = `
    <section class="sc">
      <div class="sch">
        <div class="sct">보고서 현황</div>
      </div>

      <div class="scb">
        <table class="tbl">
          <thead>
            <tr>
              <th>구분</th>
              <th>제목</th>
              <th>상태</th>
              <th>작성자</th>
            </tr>
          </thead>

          <tbody>
            ${reports.map(report => `
              <tr>
                <td>${report.type}</td>
                <td>${report.title}</td>
                <td>${report.status}</td>
                <td>${report.createdBy}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}
