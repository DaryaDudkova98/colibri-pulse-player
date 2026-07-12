// public/js/modules/favorites.js

import { showToast } from './utils.js';
import { showEpisodeDetails } from './player.js';

// Получить избранное
export function getFavorites() {
    try {
        const data = localStorage.getItem('colibri_favorites');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Ошибка чтения избранного:', e);
        return [];
    }
}

// Сохранить избранное
export function saveFavorites(favorites) {
    try {
        localStorage.setItem('colibri_favorites', JSON.stringify(favorites));
    } catch (e) {
        console.error('Ошибка сохранения избранного:', e);
    }
}

// Проверить, есть ли в избранном
export function isInFavorites(episodeId) {
    if (!episodeId) return false;
    const favorites = getFavorites();
    return favorites.some(item => item.id === episodeId);
}

// Переключить избранное
export function toggleFavorite(episodeId, button, event) {
    if (event) event.stopPropagation();
    if (!episodeId) return;
    
    let favorites = getFavorites();
    const index = favorites.findIndex(item => item.id === episodeId);
    const card = button?.closest('.podcast-card');
    let episodeData = null;
    
    if (card) {
        const title = card.querySelector('h3')?.textContent || 'Без названия';
        const image = card.querySelector('img')?.src || '';
        const publisher = card.querySelector('.publisher')?.textContent?.trim() || '';
        const audio = card.querySelector('audio source')?.src || '';
        episodeData = {
            id: episodeId,
            title: title,
            image: image,
            publisher: publisher,
            audio: audio,
            addedAt: new Date().toISOString()
        };
    }
    
    if (index !== -1) {
        favorites.splice(index, 1);
        button.textContent = '🤍';
        button.style.color = '#ffffff';
        showToast('🗑️ Удалено из избранного');
    } else {
        if (episodeData) {
            favorites.push(episodeData);
            button.textContent = '❤️';
            button.style.color = '#ff6b6b';
            showToast('❤️ Добавлено в избранное');
        } else {
            favorites.push({
                id: episodeId,
                title: 'Эпизод',
                addedAt: new Date().toISOString()
            });
            button.textContent = '❤️';
            button.style.color = '#ff6b6b';
            showToast('❤️ Добавлено в избранное');
        }
    }
    
    saveFavorites(favorites);
    updateFavoriteCount();
    updateFavoritesBadge();
}

// Показать избранное
export function showFavorites(resultsContainer) {
    const favorites = getFavorites();
    
    if (favorites.length === 0) {
        resultsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 40px; background: rgba(255,255,255,0.05); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="font-size: 64px; margin-bottom: 20px;">💔</div>
                <h3 style="color: #f0f2f5; font-size: 24px; margin-bottom: 10px;">Нет избранных эпизодов</h3>
                <p style="color: #8899aa; font-size: 16px;">Найдите интересные подкасты и добавьте их в избранное ❤️</p>
                <button onclick="window.loadInitialPodcasts?.()" 
                        style="margin-top: 20px; padding: 12px 30px; background: #667eea; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px;">
                    🔍 Найти подкасты
                </button>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = '';
    const titleElement = document.createElement('div');
    titleElement.style.cssText = 'grid-column: 1/-1; margin-bottom: 10px;';
    titleElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <h2 style="color: #f0f2f5;">❤️ Избранное (${favorites.length})</h2>
            <button onclick="window.clearAllFavorites?.()" 
                    style="padding: 8px 16px; background: rgba(220, 53, 69, 0.15); color: #ff6b7a; border: 1px solid rgba(220, 53, 69, 0.2); border-radius: 8px; cursor: pointer; font-size: 13px; transition: all 0.3s;"
                    onmouseenter="this.style.background='rgba(220, 53, 69, 0.25)'"
                    onmouseleave="this.style.background='rgba(220, 53, 69, 0.15)'">
                🗑️ Очистить всё
            </button>
        </div>
    `;
    resultsContainer.appendChild(titleElement);
    
    const sortedFavorites = [...favorites].reverse();
    sortedFavorites.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'podcast-card';
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            cursor: pointer;
            border: 1px solid rgba(255, 255, 255, 0.12);
            position: relative;
            overflow: hidden;
        `;
        
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: absolute;
            top: -50px;
            right: -50px;
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, rgba(255, 107, 107, 0.15) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 0;
        `;
        card.appendChild(glow);
        
        card.innerHTML = `
            <div style="position: relative; z-index: 1; width: 100%;">
                <div style="display: flex; gap: 16px; align-items: flex-start;">
                    ${item.image ? `
                        <img src="${item.image}" alt="${item.title}" 
                             style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px; flex-shrink: 0;">
                    ` : `
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea, #764ba2); 
                                    border-radius: 12px; display: flex; align-items: center; justify-content: center; 
                                    font-size: 32px; flex-shrink: 0;">
                            🎙️
                        </div>
                    `}
                    <div style="flex: 1; min-width: 0;">
                        <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #f0f2f5; 
                                   display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${item.title || 'Без названия'}
                        </h4>
                        ${item.publisher ? `<p style="margin: 0 0 4px 0; color: #b8c5d6; font-size: 13px;">${item.publisher}</p>` : ''}
                        <p style="margin: 0; color: #6a7a8a; font-size: 11px;">
                            Добавлено: ${new Date(item.addedAt).toLocaleDateString('ru-RU')}
                        </p>
                        <!-- ✅ НОВАЯ КНОПКА "СЛУШАТЬ" -->
                        <button onclick="event.stopPropagation(); window.playInFloatingPlayer('${item.id}')" 
                                style="margin-top: 8px; padding: 6px 16px; background: rgba(102,126,234,0.2); 
                                       border: 1px solid rgba(102,126,234,0.3); border-radius: 6px; 
                                       color: #a0b8ee; cursor: pointer; font-size: 12px; transition: all 0.3s;"
                                onmouseenter="this.style.background='rgba(102,126,234,0.35)'"
                                onmouseleave="this.style.background='rgba(102,126,234,0.2)'">
                            🎵 Слушать
                        </button>
                    </div>
                    <button onclick="event.stopPropagation(); window.removeFromFavorites?.('${item.id}')" 
                            style="background: rgba(220, 53, 69, 0.15); border: none; border-radius: 50%; 
                                   width: 36px; height: 36px; color: #ff6b7a; font-size: 18px; 
                                   cursor: pointer; transition: all 0.3s; flex-shrink: 0;"
                            onmouseenter="this.style.background='rgba(220, 53, 69, 0.3)'"
                            onmouseleave="this.style.background='rgba(220, 53, 69, 0.15)'">
                        ❌
                    </button>
                </div>
                <!-- Убираем аудиоплеер, оставляем только кнопку "Слушать" -->
            </div>
        `;
        
        card.addEventListener('click', () => {
            if (item.id) showEpisodeDetails(item.id);
        });
        resultsContainer.appendChild(card);
    });
}

export function removeFromFavorites(episodeId) {
    let favorites = getFavorites();
    favorites = favorites.filter(item => item.id !== episodeId);
    saveFavorites(favorites);
    updateFavoriteCount();
    updateFavoritesBadge();
    showToast('🗑️ Удалено из избранного');
}

export function clearAllFavorites() {
    if (confirm('Вы уверены, что хотите удалить все эпизоды из избранного?')) {
        saveFavorites([]);
        updateFavoriteCount();
        updateFavoritesBadge();
        showToast('🗑️ Все избранное очищено');
    }
}

export function updateFavoriteCount() {
    const favorites = getFavorites();
    const profileBtn = document.querySelector('.user-profile-btn');
    if (profileBtn) {
        const count = favorites.length;
        const existingBadge = profileBtn.querySelector('.favorite-badge');
        if (existingBadge) existingBadge.remove();
        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'favorite-badge';
            badge.style.cssText = `
                position: absolute;
                top: -6px;
                right: -6px;
                background: #ff6b6b;
                color: white;
                font-size: 10px;
                font-weight: bold;
                min-width: 18px;
                height: 18px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 4px;
                box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
            `;
            badge.textContent = count > 99 ? '99+' : count;
            profileBtn.style.position = 'relative';
            profileBtn.appendChild(badge);
        }
    }
}

export function updateFavoritesBadge() {
    const favorites = getFavorites();
    const count = favorites.length;
    
    const badge = document.getElementById('favoritesBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
    
    const sidebarBadge = document.querySelector('.sidebar-badge');
    if (sidebarBadge) {
        sidebarBadge.textContent = count;
        sidebarBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}