import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { translations } from './translations-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PAGES = [
    'index.html',
    'kobusauna.html',
    'contact.html',
    'privacy.html',
    'accommodation-terms.html',
    'cancel-policy.html',
    'houserule.html',
    '404.html',
];

const SITE = 'https://www.gh-nissei.jp';

function publicPath(filename) {
    return filename === 'index.html' ? '/' : `/${filename.replace(/\.html$/, '')}`;
}

function publicUrl(lang, filename) {
    if (lang === 'jp') return `${SITE}${publicPath(filename)}`;
    return filename === 'index.html'
        ? `${SITE}/${lang}/`
        : `${SITE}/${lang}${publicPath(filename)}`;
}

function applyI18n(html, lang) {
    const t = translations[lang];
    if (!t) throw new Error(`Unknown lang: ${lang}`);

    for (const [key, value] of Object.entries(t)) {
        const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        html = html.replace(
            new RegExp(`(<([a-z][a-z0-9]*)[^>]*data-i18n-html="${k}"[^>]*>)[\\s\\S]*?<\\/\\2>`, 'gi'),
            `$1${value}</$2>`
        );

        html = html.replace(
            new RegExp(`(<label[^>]*data-i18n-label="${k}"[^>]*>)[\\s\\S]*?(<\\/label>)`, 'gi'),
            (_, open, close) => {
                const req = open.includes('contact.') ? `<span>${t.required || '必須'}</span>` : '';
                return `${open}${value}${req}${close}`;
            }
        );

        html = html.replace(
            new RegExp(`(data-i18n-ph="${k}"[^>]*placeholder=")[^"]*"`, 'g'),
            `$1${escapeAttr(value)}"`
        );

        html = html.replace(
            new RegExp(`(<([a-z][a-z0-9]*)[^>]*data-i18n="${k}"[^>]*>)([^<]*)<\\/\\2>`, 'gi'),
            `$1${value}</$2>`
        );
        html = html.replace(
            new RegExp(`(<([a-z][a-z0-9]*)[^>]*data-i18n="${k}"[^>]*>)[\\s\\S]*?<\\/\\2>`, 'gi'),
            `$1${value}</$2>`
        );

        html = html.replace(
            new RegExp(`(<[^>]*data-i18n-alt="${k}"[^>]*)alt="[^"]*"`, 'g'),
            `$1alt="${escapeAttr(value)}"`
        );
        html = html.replace(
            new RegExp(`alt="[^"]*"([^>]*data-i18n-alt="${k}"[^>]*)`, 'g'),
            `alt="${escapeAttr(value)}"$1`
        );
    }

    return html;
}

function escapeAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function fixAssetPaths(html) {
    return html
        .replace(/href="\.\/css\//g, 'href="../css/')
        .replace(/href="\.\/img\//g, 'href="../img/')
        .replace(/src="\.\/img\//g, 'src="../img/')
        .replace(/src="\.\/js\//g, 'src="../js/')
        .replace(/src="\.\/main\.js/g, 'src="../main.js')
        .replace(/content="https:\/\/www\.gh-nissei\.jp\/img\//g, 'content="https://www.gh-nissei.jp/img/');
}

function fixScripts(html) {
    html = html.replace(/<script[^>]*src="[^"]*i18n\.js[^"]*"[^>]*>\s*<\/script>\s*/gi, '');
    if (!html.includes('lang-switch.js')) {
        html = html.replace(
            /(<script[^>]*src=")(\.\.\/)?main\.js[^"]*("[^>]*defer[^>]*><\/script>)/i,
            '<script src="../js/lang-switch.js" defer></script>\n    $1../main.js$3'
        );
    }
    return html;
}

function fixHtmlLang(html, lang) {
    const attr = lang === 'zh' ? 'zh-CN' : lang;
    return html.replace(/<html\s+lang="[^"]*"/, `<html lang="${attr}"`);
}

function fixCanonical(html, lang, filename) {
    let out = html.replace(
        /<link\s+rel="canonical"\s+href="[^"]*"/,
        `<link rel="canonical" href="${publicUrl(lang, filename)}"`
    );
    out = out.replace(/<meta\s+property="og:url"\s+content="[^"]*"/g, (m) => {
        return `<meta property="og:url" content="${publicUrl(lang, filename)}"`;
    });
    const locale = lang === 'jp' ? 'ja_JP' : lang === 'en' ? 'en_US' : 'zh_CN';
    out = out.replace(/<meta\s+property="og:locale"\s+content="[^"]*"/, `<meta property="og:locale" content="${locale}"`);
    return out;
}

function fixHouserule(html, lang) {
    if (lang === 'jp') return html;
    return html
        .replace(/<p class="rule-item__txt-ja">[\s\S]*?<\/p>\s*/g, '')
        .replace(/<p class="rule-item__txt-en">[\s\S]*?<\/p>\s*/g, '');
}

function stripJpOnly(html, lang) {
    if (lang === 'jp') return html;
    // data-jp-only 属性がある要素を丸ごと削除（タグはdiv/section/aside/p/ul/li/nav/footerなど）
    return html.replace(
        /<([a-z]+)([^>]*\sdata-jp-only(?:="[^"]*")?[^>]*)>[\s\S]*?<\/\1>\s*/gi,
        ''
    );
}

function fixLangActive(html, lang) {
    ['header__lang-btn', 'mobile-nav__lang-btn'].forEach((cls) => {
        html = html.replace(new RegExp(`class="${cls} active"`, 'g'), `class="${cls}"`);
        html = html.replace(
            new RegExp(`(class="${cls}")([^>]*data-lang="${lang}")`),
            `class="${cls} active"$2`
        );
    });
    return html;
}

function buildLocale(lang) {
    const dir = path.join(ROOT, lang);
    fs.mkdirSync(dir, { recursive: true });
    const t = translations[lang];

    for (const file of PAGES) {
        let html = fs.readFileSync(path.join(ROOT, file), 'utf8');
        html = stripJpOnly(html, lang);
        html = applyI18n(html, lang);
        html = fixHouserule(html, lang);
        html = fixAssetPaths(html);
        html = fixScripts(html);
        html = fixHtmlLang(html, lang);
        html = fixCanonical(html, lang, file);
        html = fixLangActive(html, lang);

        if (t[`meta.${file.replace('.html', '').replace('404', '404')}`]) {
            /* title/description handled via data-i18n on pages */
        }

        const metaKey = {
            'index.html': 'meta.index',
            'contact.html': 'meta.contact',
            'privacy.html': 'meta.privacy',
            'houserule.html': 'meta.houserule',
            'kobusauna.html': 'meta.kobusauna',
            '404.html': 'meta.404',
        }[file];

        if (metaKey && t[`${metaKey}.title`]) {
            html = html.replace(/<title>[^<]*<\/title>/, `<title>${t[`${metaKey}.title`]}</title>`);
            html = html.replace(
                /<meta\s+name="description"\s+content="[^"]*"/,
                `<meta name="description" content="${escapeAttr(t[`${metaKey}.desc`])}"`
            );
            html = html.replace(
                /<meta\s+property="og:title"\s+content="[^"]*"/,
                `<meta property="og:title" content="${escapeAttr(t[`${metaKey}.title`])}"`
            );
            html = html.replace(
                /<meta\s+property="og:description"\s+content="[^"]*"/,
                `<meta property="og:description" content="${escapeAttr(t[`${metaKey}.desc`])}"`
            );
        }

        fs.writeFileSync(path.join(dir, file), html, 'utf8');
        console.log(`  ${lang}/${file}`);
    }
}

console.log('Building locale pages...');
buildLocale('en');
buildLocale('zh');
console.log('Done.');
