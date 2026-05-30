// ========================================
// ページ読み込み時の処理
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('日靜 - ページが読み込まれました');

    // ローディング画面を非表示
    hideLoadingScreen();

    // スムーズスクロールの設定
    setupSmoothScroll();

    // ヘッダーのスクロール時の処理
    setupHeaderScroll();

    // フェードインアニメーションの設定
    setupFadeInObserver();

    // モバイルメニューの設定
    setupMobileMenu();

    // お問い合わせフォームの設定
    setupContactForm();

    // ヒーロースライドショーの設定
    setupHeroSlideshow();

    // 周辺環境ギャラリースライダーの設定
    setupSurroundingsSlider();
});

// ========================================
// ローディング画面の非表示
// ========================================
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        // 少し遅延させてから非表示にする（最低表示時間を確保）
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            // アニメーション完了後に要素を削除
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }, 800);
    }
}

// ========================================
// お問い合わせフォームの処理
// ========================================
function setupContactForm() {
    const form = document.getElementById('contact-form');
    const successMessage = document.getElementById('form-success');

    if (form) {
        form.addEventListener('submit', function (e) {
            // Formspreeに送信されるので、デフォルトの動作は維持
            // 送信後にメッセージを表示するため、少し遅延させる
            setTimeout(() => {
                if (successMessage) {
                    successMessage.style.display = 'block';
                    form.style.display = 'none';
                    // ページトップにスクロール
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 1000);
        });
    }
}

// ========================================
// スムーズスクロール
// ========================================
function setupSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // ヘッダーの高さを取得 (固定ヘッダー分ずらす)
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // モバイルナビが開いていたら閉じる
                const mobileNav = document.getElementById('mobile-nav');
                if (mobileNav && mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    document.querySelector('.header__menu-btn').classList.remove('active');
                }
            }
        });
    });
}

// ========================================
// ヘッダーのスクロール時の処理
// ========================================
function setupHeaderScroll() {
    const header = document.querySelector('.header');

    window.addEventListener('scroll', function () {
        // 50px以上スクロールしたら影を追加
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = 'none';
        }
    });
}

// ========================================
// モバイルメニュー
// ========================================
function setupMobileMenu() {
    const menuBtn = document.querySelector('.header__menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const closeBtn = document.querySelector('.mobile-nav__close');

    // メニュー開閉の共通処理
    function toggleMenu(isOpen) {
        if (isOpen) {
            mobileNav.classList.add('active');
            menuBtn.classList.add('active');
            // スクロールを無効化
            document.body.style.overflow = 'hidden';
        } else {
            mobileNav.classList.remove('active');
            menuBtn.classList.remove('active');
            // スクロールを有効化
            document.body.style.overflow = '';
        }
    }

    // ハンバーガーボタンクリック
    if (menuBtn && mobileNav) {
        menuBtn.addEventListener('click', function () {
            const isOpen = !mobileNav.classList.contains('active');
            toggleMenu(isOpen);
        });
    }

    // 閉じるボタンクリック
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            toggleMenu(false);
        });
    }

    // メニュー内リンククリックでメニューを閉じる
    const menuLinks = mobileNav.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function () {
            toggleMenu(false);
        });
    });
}

// ========================================
// フェードインアニメーション (Intersection Observer)
// ========================================
function setupFadeInObserver() {
    const fadeElements = document.querySelectorAll(
        '.section-title, ' +
        '.about__content, ' +
        '.rooms__gallery img, ' +
        '.surroundings__content, ' +
        '.activities-preview__item, ' +
        '.rooms__gallery, ' +
        '.floor-info__inner, ' +
        '.amenities__inner, ' +
        '.fireplace__image, ' +
        '.experience-card, ' +
        '.rates__content, ' +
        '.access__info, ' +
        '.faq__list, ' +
        '.contact__inner, ' +
        '.news__list, ' +
        '.sauna-gallery__grid'
    );

    // 初期状態でfade-inクラスを付与
    fadeElements.forEach(el => {
        el.classList.add('fade-in');
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // 一度表示されたら監視をやめる（スクロール戻しても消えないように）
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // 10%見えたら発火
    });

    fadeElements.forEach(el => {
        observer.observe(el);
    });
}

// ========================================
// 周辺環境ギャラリースライダー
// ========================================
function setupSurroundingsSlider() {
    const track = document.querySelector('.surroundings__track');
    if (!track) return;
    const slides = track.querySelectorAll('.surroundings__slide');
    const prevBtn = document.querySelector('.surroundings__arrow--prev');
    const nextBtn = document.querySelector('.surroundings__arrow--next');
    if (slides.length < 2) return;

    let current = 0;
    const gap = 12;

    function maxCurrent() {
        const slideWidth = slides[0].offsetWidth + gap;
        const totalWidth = slides.length * slides[0].offsetWidth + (slides.length - 1) * gap;
        const viewportWidth = track.parentElement.clientWidth;
        return Math.max(0, Math.ceil((totalWidth - viewportWidth) / slideWidth));
    }

    function update() {
        const slideWidth = slides[0].offsetWidth + gap;
        const max = maxCurrent();
        if (current > max) current = max;
        track.style.transform = `translateX(-${current * slideWidth}px)`;
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current >= max;
    }

    prevBtn.addEventListener('click', () => { current--; update(); });
    nextBtn.addEventListener('click', () => { current++; update(); });
    window.addEventListener('resize', () => { update(); });
    update();
}

// ========================================
// ヒーロースライドショー
// ========================================
function setupHeroSlideshow() {
    const slides = document.querySelectorAll('.hero__slide');
    if (slides.length < 2) return;

    let current = 0;

    setInterval(() => {
        slides[current].classList.remove('hero__slide--active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('hero__slide--active');
    }, 5000);
}