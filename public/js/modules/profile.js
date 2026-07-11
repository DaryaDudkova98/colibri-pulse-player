// public/js/modules/profile.js

import { getFavorites } from './favorites.js';

export function showProfileMenu(user) {
    const userName = user.name || user.email || 'Пользователь';
    const userEmail = user.email || '';

    const overlay = document.createElement('div');
    overlay.className = 'profile-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(10px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;

    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    modal.style.cssText = `
        background: rgba(20, 20, 40, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 40px;
        max-width: 400px;
        width: 90%;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease;
    `;

    const avatarLetter = (user.name || user.email || 'U').charAt(0).toUpperCase();

    modal.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #ff206e, #764ba2); 
                        display: flex; align-items: center; justify-content: center; font-size: 32px; color: white; 
                        margin: 0 auto 16px; font-weight: 700;">
                ${avatarLetter}
            </div>
            <h3 style="color: #f0f2f5; font-size: 20px; margin-bottom: 4px;">${userName}</h3>
            <p style="color: #8899aa; font-size: 14px;">${userEmail}</p>
            <p style="color: #6a7a8a; font-size: 12px; margin-top: 4px;">
                ${user.isGoogle ? '🔗 Вход через Google' : '📧 Вход по email'}
            </p>
        </div>
        
        <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; display: flex; flex-direction: column; gap: 8px;">
            <button onclick="window.showFavorites(); closeProfileModal();" 
                    style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: none; border-radius: 10px; 
                           background: rgba(255,255,255,0.04); color: #c8d0e0; cursor: pointer; transition: all 0.3s; width: 100%; font-size: 14px;"
                    onmouseenter="this.style.background='rgba(255,255,255,0.08)'" 
                    onmouseleave="this.style.background='rgba(255,255,255,0.04)'">
                <span style="font-size: 20px;">❤️</span>
                <span>Избранное (${getFavorites().length})</span>
            </button>
            <button onclick="window.logoutUser(); closeProfileModal();" 
                    style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid rgba(220, 53, 69, 0.2); 
                           border-radius: 10px; background: rgba(220, 53, 69, 0.05); color: #ff6b7a; cursor: pointer; 
                           transition: all 0.3s; width: 100%; font-size: 14px;"
                    onmouseenter="this.style.background='rgba(220, 53, 69, 0.12)'" 
                    onmouseleave="this.style.background='rgba(220, 53, 69, 0.05)'">
                <span style="font-size: 20px;">🚪</span>
                <span>Выйти из аккаунта</span>
            </button>
        </div>
        
        <button onclick="closeProfileModal()" 
                style="margin-top: 16px; width: 100%; padding: 10px; border: none; border-radius: 10px; 
                       background: rgba(255,255,255,0.04); color: #6a7a8a; cursor: pointer; transition: all 0.3s; font-size: 13px;"
                onmouseenter="this.style.background='rgba(255,255,255,0.08)'" 
                onmouseleave="this.style.background='rgba(255,255,255,0.04)'">
            ✕ Закрыть
        </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeProfileModal();
        }
    });

    document.addEventListener('keydown', closeProfileModalOnEscape);
}

export function closeProfileModal() {
    const overlay = document.querySelector('.profile-modal-overlay');
    if (overlay) {
        overlay.remove();
    }
    document.removeEventListener('keydown', closeProfileModalOnEscape);
}

export function closeProfileModalOnEscape(e) {
    if (e.key === 'Escape') {
        closeProfileModal();
    }
}

// Экспортируем в глобальную область для использования в HTML
if (typeof window !== 'undefined') {
    window.showProfileMenu = showProfileMenu;
    window.closeProfileModal = closeProfileModal;
    window.closeProfileModalOnEscape = closeProfileModalOnEscape;
}