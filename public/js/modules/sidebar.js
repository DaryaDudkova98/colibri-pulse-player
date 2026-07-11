// public/js/modules/sidebar.js
import { loadInitialPodcasts } from './search.js';
import { showFavorites } from './favorites.js';
import { renderRecentViews } from './recent.js';
import { showToast } from './utils.js';
import { showProfileMenu, isLoggedIn } from './auth.js';
import { getUser } from './auth.js';

export function setupSidebar() {
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
            
            switch(page) {
                case 'home':
                    loadInitialPodcasts(document.getElementById('resultsContainer'));
                    break;
                case 'favorites':
                    const container = document.getElementById('resultsContainer');
                    if (container) showFavorites(container);
                    break;
                case 'history':
                    const recentSection = document.getElementById('recentSection');
                    if (recentSection) {
                        recentSection.style.display = 'block';
                        renderRecentViews();
                    }
                    setTimeout(() => {
                        recentSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 300);
                    break;
                case 'lists':
                    showToast('📋 Списки в разработке');
                    break;
                case 'profile':
                    if (isLoggedIn()) {
                        const user = getUser();
                        if (user) showProfileMenu(user);
                    } else {
                        window.location.href = '/login.html';
                    }
                    break;
            }
        });
    });
    
    console.log('✅ Боковое меню настроено');
}