document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) document.body.classList.add('motion-ready');

  const header = document.querySelector('.site-header');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.global-nav');
  const closeMenu = () => {
    if (!menuButton || !nav) return;
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.querySelector('.menu-label')?.replaceChildren(document.createTextNode('メニューを開く'));
    const icon = menuButton.querySelector('i');
    icon?.classList.remove('fa-xmark');
    icon?.classList.add('fa-bars');
  };

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.querySelector('.menu-label')?.replaceChildren(document.createTextNode(open ? 'メニューを閉じる' : 'メニューを開く'));
      const icon = menuButton.querySelector('i');
      icon?.classList.toggle('fa-bars', !open);
      icon?.classList.toggle('fa-xmark', open);
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        menuButton.focus();
      }
    });
  }

  const fileName = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.global-nav a').forEach((link) => {
    const href = link.getAttribute('href')?.split('#')[0];
    if (href === fileName) link.setAttribute('aria-current', 'page');
  });

  const revealElements = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px' });
    revealElements.forEach((element) => observer.observe(element));
  }

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const category = new URLSearchParams(location.search).get('category');
  if (category) {
    const target = document.querySelector(`input[name="category"][value="${CSS.escape(category)}"]`);
    if (target) target.checked = true;
  }

  const form = document.querySelector('#contactForm');
  if (form) {
    const status = document.querySelector('#formStatus');
    const message = document.querySelector('#messageInput');
    const count = document.querySelector('#messageCount');
    const submitButton = document.querySelector('#submitButton');
    const email = document.querySelector('#emailInput');
    const tel = document.querySelector('#telInput');

    const updateCount = () => { if (message && count) count.textContent = String(message.value.length); };
    message?.addEventListener('input', updateCount);
    updateCount();

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (status) status.className = 'form-status';
      if (document.querySelector('#websiteInput')?.value) return;

      if (!email?.value.trim() && !tel?.value.trim()) {
        if (status) {
          status.textContent = 'メールアドレスか電話番号のどちらか一方を入力してください。';
          status.classList.add('error');
          status.focus();
        }
        email?.focus();
        return;
      }
      if (!form.checkValidity()) {
        if (status) {
          status.textContent = '未入力または形式が正しくない項目があります。内容をご確認ください。';
          status.classList.add('error');
          status.focus();
        }
        form.reportValidity();
        return;
      }
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '送信中…';
      }
      form.submit();
    });
  }
});
