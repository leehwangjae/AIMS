export function renderTopbar(targetSelector) {
  const target = document.querySelector(targetSelector);

  if (!target) return;

  target.innerHTML = `
    <header class="topbar">
      <div class="tb-brand">
        <div class="tb-logo">A</div>
        <div>
          <div class="tb-name">AIMS</div>
          <div class="tb-sub">AI Integrated Management System</div>
        </div>
      </div>

      <div class="tb-right" id="userStatusContainer"></div>
    </header>
  `;
}

export function renderPageLayout(targetSelector) {
  const target = document.querySelector(targetSelector);

  if (!target) return;

  target.innerHTML = `
    <div class="layout-grid">
      <aside class="sidebar sc">
        <div class="sch">
          <div class="sct">메뉴</div>
        </div>

        <div class="scb">
          <div id="menuContainer"></div>
        </div>
      </aside>

      <section class="content-area">
        <div id="dashboardSummary"></div>
        <div id="reportContainer"></div>
      </section>
    </div>
  `;
}
