export function showToast(message = '처리되었습니다.') {
  const toast = document.createElement('div');

  toast.textContent = message;
  toast.className = 'toast';

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1a1d2e',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: '10px',
    zIndex: '9999',
    fontSize: '13px'
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2200);
}

export function toggleElement(selector, visible = true) {
  const target = document.querySelector(selector);

  if (!target) return;

  target.classList.toggle('hidden', !visible);
}

export function setActiveTab(buttons, activeIndex = 0) {
  buttons.forEach((button, index) => {
    button.classList.toggle('on', index === activeIndex);
  });
}
