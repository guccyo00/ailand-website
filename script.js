document.addEventListener('DOMContentLoaded', () => {
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
    const fadeElements = document.querySelectorAll('.service-card, .pricing table, .staff-card, .access-content');
    fadeElements.forEach(el => {
        el.classList.add('fade-in-element');
        observer.observe(el);
    });
});
