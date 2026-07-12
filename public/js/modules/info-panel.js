// public/js/modules/info-panel.js

/**
 * Управление информационной панелью подкаста
 */

export function showPodcastInfo(podcast, { playInFloatingPlayer } = {}) {
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;

    const content = infoPanel.querySelector('.info-panel-content');
    if (!content) return;

    if (!podcast || !podcast.id) {
        content.innerHTML = `
            <div class="info-placeholder">
                <div class="info-icon">🎙️</div>
                <h3>Выберите подкаст</h3>
                <p>Нажмите на карточку подкаста, чтобы увидеть детальную информацию</p>
            </div>
        `;
        return;
    }

    const pubDate = podcast.pub_date_ms ? new Date(podcast.pub_date_ms).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric'
    }) : 'Неизвестно';

    const description = podcast.description_original || podcast.description || '';
    const shortDesc = description.length > 300 ? description.substring(0, 300) + '...' : description;

    content.innerHTML = `
        <div class="podcast-info">
            <img class="info-cover" src="${podcast.image || podcast.thumbnail || ''}" alt="${podcast.title_original || podcast.title || 'Обложка'}" 
                 onerror="this.style.display='none'" />
            <h3 class="info-title">${podcast.title_original || podcast.title || 'Без названия'}</h3>
            <p class="info-publisher">${podcast.publisher || podcast.podcast_title_original || 'Автор не указан'}</p>
            <div class="info-description">${shortDesc || 'Описание отсутствует'}</div>
            <div class="info-meta">
                <span class="info-meta-item">📅 ${pubDate}</span>
                ${podcast.total_episodes ? `<span class="info-meta-item">📊 ${podcast.total_episodes} эпизодов</span>` : ''}
                ${podcast.listen_score ? `<span class="info-meta-item">⭐ ${podcast.listen_score}</span>` : ''}
            </div>
            ${podcast.audio ? `
                <button onclick="window.playInFloatingPlayer('${podcast.id}')" 
                        style="margin-top: 10px; padding: 10px 20px; background: rgba(102,126,234,0.2); border: 1px solid rgba(102,126,234,0.3); border-radius: 8px; color: #a0b8ee; cursor: pointer; transition: all 0.3s; font-size: 13px; width: 100%;"
                        onmouseenter="this.style.background='rgba(102,126,234,0.35)'"
                        onmouseleave="this.style.background='rgba(102,126,234,0.2)'">
                    🎵 Слушать в плавающем плеере
                </button>
            ` : ''}
        </div>
    `;
}