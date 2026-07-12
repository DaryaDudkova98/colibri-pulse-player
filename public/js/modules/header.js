// public/js/modules/header.js

/**
 * Управление хедером и отображением профиля пользователя
 */

export function updateHeader({ getFavorites, showFavorites, showToast, updateFavoritesBadge, resultsContainer } = {}) {
    const headerActions = document.getElementById('headerActions');
    if (!headerActions) return;

    const userData = localStorage.getItem('colibri_user');
    let user = null;

    if (userData) {
        try {
            user = JSON.parse(userData);
        } catch (e) { }
    }

    if (user && user.isLoggedIn) {
        const firstName = user.name || user.email?.split('@')[0] || 'User';
        const avatarLetter = firstName.charAt(0).toUpperCase();

        headerActions.innerHTML = `
            <button class="user-profile-btn" id="profileBtn">
                <span class="user-avatar">${avatarLetter}</span>
                <span class="user-name">${firstName}</span>
                <span class="favorite-badge" id="favoritesBadge">0</span>
            </button>
        `;

        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                console.log('👤 Клик по профилю');
                const favorites = getFavorites();
                if (favorites.length === 0) {
                    showToast('💔 У вас пока нет избранных эпизодов');
                }
                showFavorites(resultsContainer);
                setTimeout(() => {
                    if (resultsContainer) {
                        resultsContainer.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }, 300);
            });
        }

        updateFavoritesBadge();

    } else {
        headerActions.innerHTML = `
            <a href="/login.html" class="login-btn">
                <span class="action-label">Войти</span>
                <span style="font-size: 16px;">→</span>
            </a>
        `;
    }
}

/**
 * Выход из аккаунта
 */
export function logoutUser({ showToast, loadInitialPodcasts } = {}) {
    const userData = localStorage.getItem('colibri_user');
    if (!userData) {
        showToast('⚠️ Вы не авторизованы');
        return;
    }

    let userName = 'Пользователь';
    try {
        const user = JSON.parse(userData);
        userName = user.name || user.email || 'Пользователь';
    } catch (e) { }

    if (confirm(`👋 Вы уверены, что хотите выйти из аккаунта "${userName}"?`)) {
        localStorage.removeItem('colibri_user');
        updateHeader();
        showToast('👋 Вы успешно вышли из аккаунта');
        loadInitialPodcasts();

        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        document.querySelector('.sidebar-link[data-page="home"]')?.classList.add('active');
    }
}