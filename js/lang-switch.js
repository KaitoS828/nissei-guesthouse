/**
 * 同一ページの他言語版へ遷移（JP: ルート / EN: /en/ / ZH: /zh/）
 */
(function () {
    const LOCALES = ['jp', 'en', 'zh'];

    function parsePath() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        let locale = 'jp';
        if (parts[0] === 'en' || parts[0] === 'zh') {
            locale = parts.shift();
        }
        let page = parts[parts.length - 1] || '';
        if (!page || !page.endsWith('.html')) {
            page = 'index.html';
        }
        return { locale, page };
    }

    function hrefFor(targetLocale) {
        const { locale, page } = parsePath();
        const file = page === 'index.html' ? 'index.html' : page;

        if (targetLocale === locale) {
            if (file === 'index.html') {
                return locale === 'jp' ? './' : './';
            }
            return './' + file;
        }

        if (targetLocale === 'jp') {
            if (locale === 'jp') {
                return file === 'index.html' ? '/' : '/' + file;
            }
            return file === 'index.html' ? '../' : '../' + file;
        }

        const sub = targetLocale;
        if (locale === 'jp') {
            return file === 'index.html' ? sub + '/' : sub + '/' + file;
        }
        if (locale === targetLocale) {
            return file === 'index.html' ? './' : './' + file;
        }
        return file === 'index.html' ? '../' + sub + '/' : '../' + sub + '/' + file;
    }

    function wireLangControls() {
        const { locale } = parsePath();

        document.querySelectorAll('.header__lang-btn, .mobile-nav__lang-btn').forEach((btn) => {
            const target = btn.dataset.lang;
            if (!LOCALES.includes(target)) return;

            const link = document.createElement('a');
            link.href = hrefFor(target);
            link.className = btn.className;
            link.textContent = btn.textContent;
            if (target === locale) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
            link.setAttribute('hreflang', target === 'zh' ? 'zh-CN' : target);
            btn.replaceWith(link);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wireLangControls);
    } else {
        wireLangControls();
    }
})();
