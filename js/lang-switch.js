/**
 * 同一ページの他言語版へ遷移（JP: ルート / EN: /en/ / ZH: /zh/）
 */
(function () {
    const LOCALES = ['jp', 'en', 'zh'];

    function parsePath() {
        const path = window.location.pathname;
        let locale = 'jp';
        let relPath = path;

        if (path.includes('/en/')) {
            locale = 'en';
            relPath = path.substring(path.indexOf('/en/') + 4);
        } else if (path.includes('/zh/')) {
            locale = 'zh';
            relPath = path.substring(path.indexOf('/zh/') + 4);
        } else if (path.endsWith('/en') || path.endsWith('/en/index.html')) {
            locale = 'en';
            relPath = 'index.html';
        } else if (path.endsWith('/zh') || path.endsWith('/zh/index.html')) {
            locale = 'zh';
            relPath = 'index.html';
        } else {
            // 日本語版 (file:// プロトコルやローカルサーバーを考慮)
            const projectRoot = 'nissei';
            const rootIdx = path.indexOf('/' + projectRoot + '/');
            if (rootIdx !== -1) {
                relPath = path.substring(rootIdx + projectRoot.length + 2);
            } else {
                relPath = path.replace(/^\//, '');
            }
        }

        const parts = relPath.split('/').filter(Boolean);
        let page = parts[parts.length - 1] || '';
        if (!page || !page.endsWith('.html')) {
            page = 'index.html';
        }
        
        const dirs = parts.slice(0, -1);
        return { locale, page, dirs };
    }

    function hrefFor(targetLocale) {
        const { locale, page, dirs } = parsePath();
        
        // ルートディレクトリまでの相対パスプレフィックスを生成
        let toRoot = dirs.map(() => '../').join('');
        // en/ や zh/ サブディレクトリにいる場合はそのフォルダ分も遡る
        if (locale !== 'jp') toRoot = '../' + toRoot;
        if (!toRoot) toRoot = './';

        // ニュースの個別記事ページなどは他言語版がないため、トップページに遷移させる
        const isNews = dirs.includes('news') || page.startsWith('00');
        const file = isNews ? 'index.html' : page;

        if (targetLocale === locale) {
            return toRoot + (locale === 'jp' ? '' : locale + '/') + file;
        }

        if (targetLocale === 'jp') {
            return toRoot + file;
        }

        return toRoot + targetLocale + '/' + file;
    }

    function wireLangControls() {
        const { locale } = parsePath();

        document.querySelectorAll('.header__lang-btn, .mobile-nav__lang-btn, .floating-lang__btn').forEach((btn) => {
            const target = btn.dataset.lang;
            if (!LOCALES.includes(target)) return;

            const link = document.createElement('a');
            link.href = hrefFor(target);
            link.className = btn.className.replace(/\bactive\b/g, '').trim();
            link.textContent = btn.textContent;
            link.setAttribute('data-lang', target);
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
