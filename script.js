document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('motion-ready');

    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);

    const updateProgress = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
        progress.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
        document.body.classList.toggle('has-scrolled', window.scrollY > 24);
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    const menuToggle = document.querySelector('.menu-toggle');
    const globalNav = document.querySelector('#global-nav');

    if (menuToggle && globalNav) {
        menuToggle.addEventListener('click', () => {
            const isOpen = globalNav.classList.toggle('is-open');
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            const label = menuToggle.querySelector('.sr-only');
            if (label) label.textContent = isOpen ? 'メニューを閉じる' : 'メニューを開く';
        });

        globalNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                globalNav.classList.remove('is-open');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Elements to animate
    const fadeElements = document.querySelectorAll(
        '.guide-card, .blob-card, .news-card, .home-news-item, .partner-panel, .phone-consultation, .status-row, .faq-section details, .contact-guidance, .contact-form-card, .access-map'
    );
    fadeElements.forEach((el, index) => {
        el.classList.add('fade-in-element');
        el.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 90}ms`);
        observer.observe(el);
    });
});
