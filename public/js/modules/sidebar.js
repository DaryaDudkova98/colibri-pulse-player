// public/js/modules/sidebar.js

/**
 * Управление боковым меню
 */

export function setupSidebar({
    loadInitialPodcasts,
    showFavorites,
    showToast,
    renderRecentViews,
    showProfileMenu,
    resultsContainer
} = {}) {
    const links = document.querySelectorAll('.sidebar-link');
    if (links.length === 0) {
        console.warn('⚠️ Ссылки бокового меню не найдены');
        return;
    }

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;

            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            switch (page) {
                case 'home':
                    if (loadInitialPodcasts) loadInitialPodcasts();
                    break;
                case 'favorites':
                    if (showFavorites && resultsContainer) {
                        showFavorites(resultsContainer);
                    }
                    break;
                case 'history':
                    const recentSection = document.getElementById('recentSection');
                    if (recentSection) {
                        recentSection.style.display = 'block';
                        if (renderRecentViews) renderRecentViews();
                    }
                    setTimeout(() => {
                        recentSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 300);
                    break;
                case 'lists':
                    if (showToast) showToast('📋 Списки в разработке');
                    break;
                case 'profile':
                    const userData = localStorage.getItem('colibri_user');
                    if (userData) {
                        try {
                            const user = JSON.parse(userData);
                            if (user.isLoggedIn) {
                                if (showProfileMenu) {
                                    showProfileMenu(user);
                                    return;
                                }
                            }
                        } catch (e) { }
                    }
                    window.location.href = '/login.html';
                    break;
            }
        });
    });
    console.log('✅ Боковое меню настроено');
}