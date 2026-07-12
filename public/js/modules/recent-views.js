// public/js/modules/recent-views.js

/**
 * Модуль управления недавними просмотрами (историей)
 */

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========

export function getRecentViews() {
    try {
        const data = localStorage.getItem('colibri_recent');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Ошибка чтения недавних просмотров:', e);
        return [];
    }
}

export function saveRecentViews(recent) {
    try {
        localStorage.setItem('colibri_recent', JSON.stringify(recent));
    } catch (e) {
        console.error('Ошибка сохранения недавних просмотров:', e);
    }
}

export function addRecentView(item, { renderRecentViews, showToast, updateFavoriteCount } = {}) {
    if (!item || !item.id) return;
    let recent = getRecentViews();
    recent = recent.filter(r => r.id !== item.id);
    recent.unshift({
        id: item.id,
        title: item.title_original || item.title || 'Без названия',
        image: item.image || item.thumbnail || '',
        publisher: item.publisher || item.podcast_title_original || '',
        audio: item.audio || item.audio_url || '',
        thumbnail: item.thumbnail || item.image || '',
        viewedAt: new Date().toISOString(),
        progress: item.progress || 0,
        duration: item.duration || 0
    });
    if (recent.length > 20) {
        recent = recent.slice(0, 20);
    }
    saveRecentViews(recent);
    if (renderRecentViews) renderRecentViews();
    if (showToast) showToast('🎧 Добавлено в недавние просмотры');
    if (updateFavoriteCount) updateFavoriteCount();
}

export function removeRecentView(id, { renderRecentViews, showToast } = {}) {
    let recent = getRecentViews();
    recent = recent.filter(item => item.id !== id);
    saveRecentViews(recent);
    if (renderRecentViews) renderRecentViews();
    if (showToast) showToast('Удалено из истории');
}

export function clearRecentViews({ renderRecentViews, showToast } = {}) {
    if (confirm('Вы уверены, что хотите очистить историю просмотров?')) {
        saveRecentViews([]);
        if (renderRecentViews) renderRecentViews();
        if (showToast) showToast('История очищена');
    }
}

// ========== ФУНКЦИИ ОТОБРАЖЕНИЯ ==========

export function renderRecentViews({ showEpisodeDetails, formatTime } = {}) {
    const recent = getRecentViews();
    const section = document.getElementById('recentSection');
    const slider = document.getElementById('recentSlider');
    if (!slider) return;
    if (recent.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';
    slider.innerHTML = '';
    recent.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'recent-item';
        const progressBar = item.progress && item.progress > 0 ? `
            <div style="width:100%; height:3px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; margin-top:4px;">
                <div style="width:${Math.min(item.progress / 60 * 100, 100)}%; height:100%; background:linear-gradient(90deg,#667eea,#764ba2); border-radius:2px; transition:width 0.3s;"></div>
            </div>
        ` : '';
        div.innerHTML = `
            ${item.image ? `<img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.style.display='none'" />` :
                `<div style="width:100%;height:100px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:32px;">🎙️</div>`}
            <div class="recent-item-title">${item.title}</div>
            ${item.publisher ? `<div class="recent-item-publisher">${item.publisher}</div>` : ''}
            ${progressBar}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
                <span style="font-size:10px;color:#6a7a8a;">
                    ${item.progress && item.progress > 0 ? `⏱️ ${formatTime ? formatTime(item.progress) : '0:00'}` : '▶️ Не начато'}
                </span>
                <button class="recent-item-remove" data-id="${item.id}" title="Удалить из истории">✕</button>
            </div>
        `;
        div.addEventListener('click', (e) => {
            if (e.target.closest('.recent-item-remove')) return;
            if (item.id && showEpisodeDetails) {
                showEpisodeDetails(item.id);
            }
        });
        const removeBtn = div.querySelector('.recent-item-remove');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeRecentView(item.id, { renderRecentViews: () => renderRecentViews({ showEpisodeDetails, formatTime }), showToast });
        });
        slider.appendChild(div);
    });
    updateScrollButtons();
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

export function formatTime(seconds) {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function updateScrollButtons() {
    const slider = document.getElementById('recentSlider');
    const leftBtn = document.getElementById('recentScrollLeft');
    const rightBtn = document.getElementById('recentScrollRight');
    if (!slider || !leftBtn || !rightBtn) return;
    const update = () => {
        const scrollLeft = slider.scrollLeft;
        const maxScroll = slider.scrollWidth - slider.clientWidth;
        leftBtn.classList.toggle('hidden', scrollLeft <= 5);
        rightBtn.classList.toggle('hidden', scrollLeft >= maxScroll - 5);
    };
    slider.addEventListener('scroll', update);
    setTimeout(update, 100);
    update();
}

export function scrollRecent(direction) {
    const slider = document.getElementById('recentSlider');
    if (!slider) return;
    const scrollAmount = slider.clientWidth * 0.7;
    slider.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

export function setupRecentSlider({ renderRecentViews } = {}) {
    const leftBtn = document.getElementById('recentScrollLeft');
    const rightBtn = document.getElementById('recentScrollRight');
    const clearBtn = document.getElementById('clearRecentBtn');
    if (leftBtn) {
        leftBtn.addEventListener('click', () => scrollRecent(-1));
    }
    if (rightBtn) {
        rightBtn.addEventListener('click', () => scrollRecent(1));
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearRecentViews({ renderRecentViews });
        });
    }
    window.addEventListener('resize', updateScrollButtons);
}