/* ============================================================
   試作：動きの追加（motion.js）
   1. トップのスライドショー  2. 数字のカウントアップ
   3. 写真の拡大表示          4. 上へ戻るボタン
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 1. スライドショー ---------- */
    const slider = document.querySelector('.hero-slider');
    let sliderPause = () => {};
    if (slider) {
        const slides = [...slider.querySelectorAll('.slide')];
        const INTERVAL = 7000; // 7秒ごとに切り替え
        let current = 0, timer = null, userPaused = reduceMotion;

        const bar = document.createElement('div');
        bar.className = 'slider-bar';
        const dots = slides.map((s, i) => {
            const d = document.createElement('button');
            d.type = 'button';
            d.className = 'slider-dot';
            d.setAttribute('aria-label', `${i + 1}枚目の写真を表示`);
            d.addEventListener('click', () => { show(i); restart(); });
            bar.appendChild(d);
            return d;
        });
        const pauseBtn = document.createElement('button');
        pauseBtn.type = 'button';
        pauseBtn.className = 'slider-pause';
        pauseBtn.addEventListener('click', () => { userPaused = !userPaused; restart(); });
        bar.appendChild(pauseBtn);
        slider.appendChild(bar);

        const show = (i) => {
            current = (i + slides.length) % slides.length;
            slides.forEach((s, k) => s.classList.toggle('is-active', k === current));
            dots.forEach((d, k) => d.setAttribute('aria-current', k === current ? 'true' : 'false'));
        };
        const stop = () => { clearInterval(timer); timer = null; };
        const start = () => { stop(); if (!userPaused) timer = setInterval(() => show(current + 1), INTERVAL); };
        const restart = () => { pauseBtn.textContent = userPaused ? '▶ 再生' : '❚❚ 停止'; start(); };

        slider.querySelector('.slider-btn.prev').addEventListener('click', () => { show(current - 1); restart(); });
        slider.querySelector('.slider-btn.next').addEventListener('click', () => { show(current + 1); restart(); });
        // マウスを乗せている間・操作中は止める
        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', start);
        slider.addEventListener('focusin', stop);
        slider.addEventListener('focusout', start);
        // スワイプ操作
        let sx = null;
        slider.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
        slider.addEventListener('touchend', e => {
            if (sx === null) return;
            const dx = e.changedTouches[0].clientX - sx;
            if (Math.abs(dx) > 40) { show(current + (dx < 0 ? 1 : -1)); restart(); }
            sx = null;
        });
        sliderPause = stop;
        show(0);
        restart();
    }

    /* ---------- 2. 数字のカウントアップ ---------- */
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
        const run = (el) => {
            const target = Number(el.dataset.count);
            const dur = 1400, t0 = performance.now();
            const step = (t) => {
                const p = Math.min(1, (t - t0) / dur);
                el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };
        const io = new IntersectionObserver((entries) => {
            entries.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
        }, { threshold: 0.6 });
        counters.forEach(el => { el.textContent = '0'; io.observe(el); });
    }

    /* ---------- 3. 写真の拡大表示 ---------- */
    const images = [...document.querySelectorAll('body img')]
        .filter(img => !img.closest('a, header, footer, .hero-slider, .lightbox') && img.getBoundingClientRect().width >= 150);
    if (images.length) {
        const lb = document.createElement('div');
        lb.className = 'lightbox';
        lb.setAttribute('role', 'dialog');
        lb.setAttribute('aria-modal', 'true');
        lb.setAttribute('aria-label', '写真の拡大表示');
        lb.innerHTML = `
            <button type="button" class="lightbox-close">✕ 閉じる</button>
            <img alt="">
            <p class="lightbox-caption"></p>
            <div class="lightbox-nav">
                <button type="button" class="lightbox-prev">‹ 前へ</button>
                <button type="button" class="lightbox-next">次へ ›</button>
            </div>`;
        document.body.appendChild(lb);
        const lbImg = lb.querySelector('img');
        const lbCap = lb.querySelector('.lightbox-caption');
        const nav = lb.querySelector('.lightbox-nav');
        let idx = 0, lastFocus = null;

        const open = (i) => {
            idx = (i + images.length) % images.length;
            const src = images[idx];
            lbImg.src = src.currentSrc || src.src;
            lbImg.alt = src.alt;
            lbCap.textContent = src.alt || '';
            nav.style.display = images.length > 1 ? 'flex' : 'none';
            if (!lb.classList.contains('is-open')) {
                lastFocus = document.activeElement;
                lb.classList.add('is-open');
                document.body.style.overflow = 'hidden';
                sliderPause();
                lb.querySelector('.lightbox-close').focus();
            }
        };
        const close = () => {
            lb.classList.remove('is-open');
            document.body.style.overflow = '';
            if (lastFocus) lastFocus.focus();
        };
        images.forEach((img, i) => {
            // 「拡大」マークを付けるため、写真を枠で包む
            const wrap = document.createElement('span');
            wrap.className = 'zoom-wrap';
            const cs = getComputedStyle(img);
            wrap.style.marginBottom = cs.marginBottom;
            wrap.style.borderRadius = cs.borderRadius;
            img.style.marginBottom = '0';
            img.parentNode.insertBefore(wrap, img);
            wrap.appendChild(img);
            const badge = document.createElement('span');
            badge.className = 'zoom-badge';
            badge.setAttribute('aria-hidden', 'true');
            badge.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/></svg>拡大';
            badge.addEventListener('click', () => open(i));
            wrap.appendChild(badge);
            img.classList.add('zoomable');
            img.setAttribute('tabindex', '0');
            img.setAttribute('role', 'button');
            img.setAttribute('aria-label', `${img.alt || '写真'}（拡大して表示）`);
            img.addEventListener('click', () => open(i));
            img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
        });
        lb.querySelector('.lightbox-close').addEventListener('click', close);
        lb.querySelector('.lightbox-prev').addEventListener('click', () => open(idx - 1));
        lb.querySelector('.lightbox-next').addEventListener('click', () => open(idx + 1));
        lb.addEventListener('click', e => { if (e.target === lb) close(); });
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('is-open')) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') open(idx - 1);
            if (e.key === 'ArrowRight') open(idx + 1);
        });
    }

    /* ---------- 4. 上へ戻るボタン ---------- */
    const toTop = document.createElement('button');
    toTop.type = 'button';
    toTop.className = 'to-top';
    toTop.setAttribute('aria-label', 'ページの上へ戻る');
    toTop.innerHTML = '<span class="arrow" aria-hidden="true">▲</span><span>上へ</span>';
    document.body.appendChild(toTop);
    const onScroll = () => toTop.classList.toggle('is-visible', window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    /* ---------- 5. 文字の大きさ切り替え ---------- */
    const SIZES = [
        { key: 'm', label: '標準', cls: '' },
        { key: 'l', label: '大', cls: 'fs-l' },
        { key: 'xl', label: '特大', cls: 'fs-xl' },
    ];
    const root = document.documentElement;
    const applySize = (key) => {
        SIZES.forEach(sz => sz.cls && root.classList.remove(sz.cls));
        const sz = SIZES.find(x => x.key === key) || SIZES[0];
        if (sz.cls) root.classList.add(sz.cls);
        fsButtons.forEach(b => b.setAttribute('aria-pressed', b.dataset.size === sz.key ? 'true' : 'false'));
        try { localStorage.setItem('ailand-font-size', sz.key); } catch (e) {}
        window.dispatchEvent(new Event('resize'));
    };
    const fs = document.createElement('div');
    fs.className = 'font-switch';
    fs.setAttribute('role', 'group');
    fs.setAttribute('aria-label', '文字の大きさ');
    fs.innerHTML = '<span class="font-switch-label">文字</span>';
    const fsButtons = SIZES.map(sz => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.size = sz.key;
        b.className = 'fs-btn fs-btn-' + sz.key;
        b.textContent = sz.label;
        b.addEventListener('click', () => applySize(sz.key));
        fs.appendChild(b);
        return b;
    });
    document.body.appendChild(fs);

    // スマホ・タブレット用：ヘッダーの「文字」ボタン → 3択のパネルを開く
    const headerBox = document.querySelector('.header-container');
    const menuToggle = document.querySelector('.menu-toggle');
    const fsToggle = document.createElement('button');
    fsToggle.type = 'button';
    fsToggle.className = 'fs-toggle';
    fsToggle.setAttribute('aria-expanded', 'false');
    fsToggle.innerHTML = '<span class="fs-toggle-aa" aria-hidden="true">Aa</span><span class="fs-toggle-text">文字</span>';
    fsToggle.setAttribute('aria-label', '文字の大きさを変える');
    const fsPanel = document.createElement('div');
    fsPanel.className = 'fs-panel';
    fsPanel.setAttribute('role', 'group');
    fsPanel.setAttribute('aria-label', '文字の大きさ');
    fsPanel.innerHTML = '<p class="fs-panel-title">文字の大きさ</p>';
    SIZES.forEach(sz => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.size = sz.key;
        b.className = 'fs-btn fs-btn-' + sz.key;
        b.textContent = sz.label;
        b.addEventListener('click', () => { applySize(sz.key); closePanel(); });
        fsPanel.appendChild(b);
        fsButtons.push(b);
    });
    const closePanel = () => { fsPanel.classList.remove('is-open'); fsToggle.setAttribute('aria-expanded', 'false'); };
    fsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = fsPanel.classList.toggle('is-open');
        fsToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => { if (!fsPanel.contains(e.target)) closePanel(); });
    if (headerBox) {
        headerBox.insertBefore(fsToggle, menuToggle || null);
        document.querySelector('header').appendChild(fsPanel);
    }
    let saved = 'm';
    try { saved = localStorage.getItem('ailand-font-size') || 'm'; } catch (e) {}
    applySize(saved);

    /* ---------- 6. ご利用までの流れ：順番に表示＋線でつなぐ ---------- */
    const circles = [...document.querySelectorAll('div[style*="width: 60px"][style*="border-radius: 50%"]')];
    const flows = new Map();
    circles.forEach(c => {
        const row = c.parentElement, list = row && row.parentElement;
        if (!list) return;
        if (!flows.has(list)) flows.set(list, []);
        flows.get(list).push({ row, circle: c });
    });
    flows.forEach((items, list) => {
        if (items.length < 2) return;
        list.classList.add('step-flow');
        const line = document.createElement('div');
        line.className = 'step-line';
        line.setAttribute('aria-hidden', 'true');
        list.prepend(line);
        items.forEach((it, i) => {
            it.row.classList.add('step-row');
            it.row.style.setProperty('--step-delay', `${i * 450}ms`);
            it.circle.classList.add('step-circle');
        });
        const place = () => {
            const lr = list.getBoundingClientRect();
            const first = items[0].circle.getBoundingClientRect();
            const last = items[items.length - 1].circle.getBoundingClientRect();
            line.style.left = `${first.left - lr.left + first.width / 2 - 3}px`;
            line.style.top = `${first.top - lr.top + first.height / 2}px`;
            line.style.height = `${last.top - first.top}px`;
        };
        place();
        window.addEventListener('resize', place);
        const reveal = () => list.classList.add('is-shown');
        if (reduceMotion || !('IntersectionObserver' in window)) { reveal(); return; }
        list.classList.add('step-animate');
        const io = new IntersectionObserver((en) => {
            if (en.some(e => e.isIntersecting)) { place(); reveal(); io.disconnect(); }
        }, { threshold: 0.3 });
        io.observe(list);
    });
});
