// public/js/modules/cards.js
import { isInFavorites, toggleFavorite } from './favorites.js';

export function createPodcastCard(item) {
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

    const glassShine = document.createElement('div');
    glassShine.style.cssText = `
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05) 0%, transparent 60%);
        pointer-events: none;
        z-index: 0;
    `;
    card.appendChild(glassShine);

    const topBar = document.createElement('div');
    topBar.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
        opacity: 0.6;
        border-radius: 20px 20px 0 0;
    `;
    card.appendChild(topBar);

    const glow = document.createElement('div');
    glow.style.cssText = `
        position: absolute;
        bottom: -60px;
        right: -60px;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle, rgba(102, 126, 234, 0.12) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 0;
    `;
    card.appendChild(glow);

    const image = item.image || item.thumbnail || item.logo_url || item.cover || item.artwork || '';
    const title = item.title_original || item.title || item.name || 'Без названия';
    const description = item.description_original || item.description || item.summary || '';
    const publisher = item.publisher || item.podcast_title_original || item.author || item.author_name || '';
    const audio = item.audio || item.audio_url || item.enclosure_url || '';
    const id = item.id || item.podcast_id || '';
    const podcastTitle = item.podcast_title_original || item.podcast_title || '';
    const pubDate = item.pub_date_ms || item.pub_date || '';

    const shortDescription = description.replace(/<[^>]*>/g, '').substring(0, 120);
    const isFavorite = isInFavorites(id);

    card.innerHTML = `
        <div style="position: relative; overflow: hidden; border-radius: 14px; margin-bottom: 14px; z-index: 1;">
            ${image ? `
                <img src="${image}" alt="${title}" 
                     style="width: 100%; height: 210px; object-fit: cover; border-radius: 14px; 
                            transition: transform 0.5s ease;"
                     onerror="this.style.display='none'" />
                <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 70px; 
                            background: linear-gradient(transparent, rgba(0,0,0,0.5)); 
                            border-radius: 0 0 14px 14px; pointer-events: none;"></div>
            ` : `
                <div style="width: 100%; height: 210px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%, #f093fb 100%); 
                            border-radius: 14px; display: flex; align-items: center; justify-content: center; 
                            color: white; font-size: 60px; opacity: 0.7;">
                    <i class="fas fa-microphone" style="font-size: 36px;"></i>
                </div>
            `}
            <button class="favorite-btn" data-episode-id="${id}" 
                    style="position: absolute; top: 12px; right: 12px; z-index: 10;
                           width: 40px; height: 40px; border: none; border-radius: 50%;
                           background: rgba(0, 0, 0, 0.5);
                           backdrop-filter: blur(10px);
                           -webkit-backdrop-filter: blur(10px);
                           color: ${isFavorite ? '#ff6b6b' : '#ffffff'};
                           font-size: 20px;
                           cursor: pointer;
                           transition: all 0.3s ease;
                           display: flex;
                           align-items: center;
                           justify-content: center;
                           box-shadow: 0 2px 12px rgba(0,0,0,0.3);"
                    onclick="event.stopPropagation(); window.toggleFavorite?.('${id}', this, event);">
                <i class="${isFavorite ? 'fas fa-heart' : 'far fa-heart'}"></i>
            </button>
        </div>
        <div style="padding: 0 4px; position: relative; z-index: 1;">
            <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 600; color: #f0f2f5; 
                       display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; 
                       line-height: 1.4; letter-spacing: -0.2px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                ${title}
            </h3>
            ${publisher ? `
                <p style="margin: 0 0 8px 0; color: #b8c5d6; font-size: 13px; font-weight: 400; 
                          display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 5px; height: 5px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%;"></span>
                    ${publisher}
                </p>
            ` : ''}
            ${podcastTitle ? `
                <p style="margin: 0 0 6px 0; color: #8899aa; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                    <i class="fas fa-tag" style="font-size: 12px; color: #667eea;"></i>
                    ${podcastTitle}
                </p>
            ` : ''}
            ${pubDate ? `
                <p style="margin: 0 0 8px 0; color: #6a7a8a; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                    <i class="fas fa-calendar-alt" style="font-size: 12px;"></i>
                    ${new Date(pubDate).toLocaleDateString('ru-RU', { 
                        day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                </p>
            ` : ''}
            ${description ? `
                <p style="margin: 0 0 12px 0; color: #a0b0c0; font-size: 13px; line-height: 1.6;
                          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
                          opacity: 0.85;">
                    ${shortDescription}${shortDescription.length >= 120 ? '...' : ''}
                </p>
            ` : ''}
            ${audio ? `
                <div style="margin-top: 8px;" onclick="event.stopPropagation();">
                    <audio controls style="width: 100%; height: 36px; border-radius: 10px; 
                                          background: rgba(255,255,255,0.05);">
                        <source src="${audio}" type="audio/mpeg">
                        Ваш браузер не поддерживает аудио
                    </audio>
                </div>
            ` : ''}
            <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: center;
                        border-top: 1px solid rgba(255,255,255,0.06); padding-top: 14px;">
                <span style="font-size: 12px; color: #6a7a8a; display: flex; align-items: center; gap: 4px;">
                    <i class="fas fa-hashtag" style="font-size: 11px;"></i>
                    ${id ? id.substring(0, 8) + '...' : ''}
                </span>
                <span style="font-size: 13px; color: #8899bb; font-weight: 400; 
                           display: flex; align-items: center; gap: 6px;
                           transition: color 0.3s;">
                    Подробнее 
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                         style="transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </span>
            </div>
        </div>
    `;

    const arrow = card.querySelector('svg');
    const span = card.querySelector('div:last-child span:last-child');
    if (arrow && span) {
        card.addEventListener('mouseenter', () => {
            arrow.style.transform = 'translateX(6px)';
            span.style.color = '#a0b8ee';
        });
        card.addEventListener('mouseleave', () => {
            arrow.style.transform = 'translateX(0)';
            span.style.color = '#8899bb';
        });
    }

    // Обработчик клика - используем глобальные функции из window
    card.addEventListener('click', (e) => {
        if (e.target.closest('.favorite-btn')) return;
        if (id) {
            const isEpisode = item.podcast_id || item.podcast_title_original || item.podcast_title;
            
            if (isEpisode) {
                // Используем функцию из window (установлена в main.js)
                if (typeof window.showEpisodeDetails === 'function') {
                    window.showEpisodeDetails(id);
                } else {
                    console.warn('showEpisodeDetails не найдена в window');
                }
                
                // Показываем информацию о подкасте
                if (item.podcast_id && typeof window.showPodcastInfo === 'function') {
                    window.showPodcastInfo({
                        id: item.podcast_id,
                        title: item.podcast_title_original || item.podcast_title || 'Подкаст',
                        image: item.image || item.thumbnail || '',
                        publisher: item.publisher || ''
                    });
                }
            } else {
                // Это подкаст - загружаем его эпизоды
                if (typeof window.getPodcastEpisodes === 'function') {
                    window.getPodcastEpisodes(id);
                } else {
                    console.warn('getPodcastEpisodes не найдена в window');
                }
            }
        }
    });

    return card;
}