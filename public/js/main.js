// public/js/main.js
import PaginationManager from './modules/pagination.js';
import { setupPresets } from './modules/presets.js';
import { setupFilters, getFilterParams } from './modules/filters.js';
import {
    getFavorites,
    saveFavorites,
    isInFavorites,
    toggleFavorite,
    showFavorites,
    removeFromFavorites,
    clearAllFavorites,
    updateFavoriteCount,
    updateFavoritesBadge
} from './modules/favorites.js';
import { setupFooter } from './modules/footer.js';
import { createSkeletonCards, createEmptyState, createErrorState } from './modules/skeleton.js';
import { loadInitialPodcasts as loadPodcasts } from './modules/load-podcasts.js';
import { createPodcastCard } from './modules/cards.js';
import { showProfileMenu, closeProfileModal, closeProfileModalOnEscape } from './modules/profile.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Приложение запущено');

    // Состояние пагинации
    let currentOffset = 0;
    let currentQuery = '';
    let currentTotal = 0;
    const LIMIT = 6;
    let isLoading = false;
    let currentPage = 1;

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const homeBtn = document.querySelector('.home-btn');
    const profileBtn = document.querySelector('.user-profile-btn');

    console.log('✅ Элементы найдены:', { searchInput, searchBtn, homeBtn, profileBtn });

    // Создаем контейнер для результатов
    let resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'resultsContainer';
        resultsContainer.style.cssText = `
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        `;
        document.body.appendChild(resultsContainer);
        console.log('✅ Создан контейнер для результатов');
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ПАГИНАЦИИ ==========
    const paginationManager = new PaginationManager({
        container: resultsContainer,
        limit: LIMIT,
        pagesPerGroup: 5,
        onPageChange: (page) => {
            if (!isLoading) {
                goToPage(page);
            }
        }
    });

    // ========== ФУНКЦИЯ СОЗДАНИЯ КАРТОЧКИ ==========
    // ФУНКЦИЯ createPodcastCard УДАЛЕНА - используется импортированная из modules/cards.js

    // ========== ФУНКЦИИ ПАГИНАЦИИ ==========
    async function goToPage(page) {
        if (isLoading) return;
        const totalPages = paginationManager.getTotalPages();
        if (page < 1 || page > totalPages || page === currentPage) return;

        try {
            isLoading = true;
            currentPage = page;
            const offset = (page - 1) * LIMIT;

            paginationManager.showLoading();

            if (currentQuery === 'popular') {
                const start = offset;
                const end = Math.min(offset + LIMIT, window.allPodcasts.length);
                const batch = window.allPodcasts.slice(start, end);

                if (batch.length > 0) {
                    resultsContainer.innerHTML = '';
                    const titleElement = document.createElement('div');
                    titleElement.style.cssText = 'grid-column: 1/-1; margin-bottom: 10px;';
                    titleElement.innerHTML = `<h2 style="color: #f0f2f5; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-fire" style="color: #ff6b6b;"></i>
                        Популярные подкасты (${Math.min(offset + LIMIT, currentTotal)} из ${currentTotal})
                    </h2>`;
                    resultsContainer.appendChild(titleElement);

                    batch.forEach((item) => {
                        const card = createPodcastCard(item);
                        resultsContainer.appendChild(card);
                    });

                    currentOffset = end;
                    paginationManager.setCurrentPage(page);
                }
            } else {
                const results = await window.apiClient.searchEpisodes(currentQuery, {
                    limit: LIMIT,
                    offset: offset,
                    sort_by_date: 1
                });

                if (results && results.results && results.results.length > 0) {
                    resultsContainer.innerHTML = '';
                    const titleElement = document.createElement('div');
                    titleElement.style.cssText = 'grid-column: 1/-1; margin-bottom: 10px;';
                    const total = results.total || currentTotal;
                    titleElement.innerHTML = `<h2 style="color: #f0f2f5; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-search" style="color: #667eea;"></i>
                        Результаты поиска: "${currentQuery}" (${Math.min(offset + LIMIT, total)} из ${total})
                    </h2>`;
                    resultsContainer.appendChild(titleElement);

                    results.results.forEach((item) => {
                        const card = createPodcastCard(item);
                        resultsContainer.appendChild(card);
                    });

                    currentOffset = offset + results.results.length;
                    currentTotal = total;
                    paginationManager.setCurrentPage(page);
                }
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки страницы:', error);
            paginationManager.showError(error);
        } finally {
            isLoading = false;
            paginationManager.hideLoading();
        }
    }

    // ========== ФУНКЦИИ ОТОБРАЖЕНИЯ ==========
    function displayPodcastsWithPagination(data, title = 'Результаты поиска') {
        resultsContainer.innerHTML = '';
        let podcasts = [];
        let currentTitle = title;

        if (data && data.results && Array.isArray(data.results)) {
            podcasts = data.results;
        } else if (Array.isArray(data)) {
            podcasts = data;
        } else {
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #f9f9f9; border-radius: 12px;">
                    <h3 style="color: #666;">😕 Ничего не найдено</h3>
                </div>
            `;
            return;
        }

        if (!podcasts || podcasts.length === 0) {
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 40px; background: #f9f9f9; border-radius: 12px;">
                    <h3 style="color: #666; font-size: 24px;">😕 Ничего не найдено</h3>
                    <p style="color: #999; margin-top: 10px;">Попробуйте изменить поисковый запрос</p>
                </div>
            `;
            return;
        }

        const titleElement = document.createElement('div');
        titleElement.style.cssText = 'grid-column: 1/-1; margin-bottom: 10px;';
        titleElement.innerHTML = `<h2 style="color: #f0f2f5;">${currentTitle} (${currentOffset} из ${currentTotal})</h2>`;
        resultsContainer.appendChild(titleElement);

        podcasts.forEach((item) => {
            const card = createPodcastCard(item);
            resultsContainer.appendChild(card);
        });

        currentPage = 1;
        paginationManager.setTotal(currentTotal);
        paginationManager.setCurrentPage(1);
    }

    function displayPodcastsWithPaginationForCurated(podcasts, title) {
        resultsContainer.innerHTML = '';

        if (!podcasts || podcasts.length === 0) {
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 40px; background: #f9f9f9; border-radius: 12px;">
                    <h3 style="color: #666; font-size: 24px;">😕 Ничего не найдено</h3>
                </div>
            `;
            return;
        }

        const titleElement = document.createElement('div');
        titleElement.style.cssText = 'grid-column: 1/-1; margin-bottom: 10px;';
        titleElement.innerHTML = `<h2 style="color: #f0f2f5;">${title} (${currentOffset} из ${currentTotal})</h2>`;
        resultsContainer.appendChild(titleElement);

        podcasts.forEach((item) => {
            const card = createPodcastCard(item);
            resultsContainer.appendChild(card);
        });

        currentPage = 1;
        paginationManager.setTotal(currentTotal);
        paginationManager.setCurrentPage(1);
    }
    // ========== ФУНКЦИИ ДЛЯ ЭПИЗОДОВ ==========
    async function showEpisodeDetails(episodeId) {
        try {
            console.log('📊 Загрузка деталей эпизода:', episodeId);
            const episode = await window.apiClient.getEpisode(episodeId);
            console.log('📊 Детали эпизода:', episode);

            window.currentListeningEpisode = {
                id: episode.id,
                title: episode.title_original || episode.title || 'Эпизод',
                image: episode.image || episode.thumbnail || '',
                publisher: episode.publisher || episode.podcast_title_original || '',
                audio: episode.audio || episode.audio_url || '',
                thumbnail: episode.thumbnail || episode.image || '',
                hasStarted: false,
                progress: 0
            };

            const episodeData = {
                id: episode.id,
                title_original: episode.title_original || episode.title || 'Эпизод',
                image: episode.image || episode.thumbnail || '',
                publisher: episode.publisher || episode.podcast_title_original || '',
                audio: episode.audio || episode.audio_url || '',
                thumbnail: episode.thumbnail || episode.image || ''
            };

            // СОЗДАЕМ ГЛОБАЛЬНЫЙ АУДИО ТОЛЬКО ОДИН РАЗ
            if (!window.mainAudio) {
                window.mainAudio = new Audio();
                window.mainAudio.id = 'episodeAudioPlayer';
                window.mainAudio.addEventListener('play', () => {
                    if (window.currentListeningEpisode) {
                        handleMainPlay(window.currentListeningEpisode.id);
                        const uiAudio = document.getElementById('episodeAudioPlayerUI');
                        if (uiAudio) {
                            uiAudio.currentTime = window.mainAudio.currentTime;
                            uiAudio.play().catch(() => { });
                        }
                        document.getElementById('playerPlayBtn').textContent = '⏸';
                    }
                });
                window.mainAudio.addEventListener('pause', () => {
                    if (window.currentListeningEpisode) {
                        handleMainPause(window.currentListeningEpisode.id);
                        const uiAudio = document.getElementById('episodeAudioPlayerUI');
                        if (uiAudio) {
                            uiAudio.pause();
                        }
                        document.getElementById('playerPlayBtn').textContent = '▶';
                    }
                });
                window.mainAudio.addEventListener('timeupdate', () => {
                    if (window.currentListeningEpisode) {
                        handleMainTimeUpdate(window.currentListeningEpisode.id);
                        const uiAudio = document.getElementById('episodeAudioPlayerUI');
                        if (uiAudio) {
                            uiAudio.currentTime = window.mainAudio.currentTime;
                        }
                        updateProgress();
                    }
                });
                window.mainAudio.addEventListener('loadedmetadata', () => {
                    if (window.currentListeningEpisode) {
                        handleMainLoaded(window.currentListeningEpisode.id);
                        document.getElementById('playerTotalTime').textContent = formatTime(window.mainAudio.duration);
                    }
                });
                window.mainAudio.addEventListener('ended', () => {
                    document.getElementById('playerPlayBtn').textContent = '▶';
                    const uiAudio = document.getElementById('episodeAudioPlayerUI');
                    if (uiAudio) {
                        uiAudio.currentTime = 0;
                    }
                });
            }

            if (window.mainAudio.src !== episode.audio) {
                const wasPlaying = !window.mainAudio.paused;
                window.mainAudio.src = episode.audio;
                window.mainAudio.load();
                if (wasPlaying) {
                    window.mainAudio.play().catch(() => { });
                }
            }

            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border-radius: 16px; padding: 30px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);">
                    <button onclick="window.loadInitialPodcasts()" style="background: none; border: none; color: #667eea; cursor: pointer; font-size: 16px; margin-bottom: 20px; transition: color 0.3s;" onmouseenter="this.style.color='#a0b8ee'" onmouseleave="this.style.color='#667eea'">← Назад</button>
                    ${episode.image ? `<img src="${episode.image}" alt="${episode.title}" style="max-width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 16px rgba(0,0,0,0.2);" />` : ''}
                    <h2 style="color: #f0f2f5; font-size: 24px; margin-bottom: 10px;">${episode.title_original || 'Без названия'}</h2>
                    <p style="color: #b8c5d6; font-size: 14px;"><strong>Подкаст:</strong> ${episode.podcast_title_original || 'Неизвестно'}</p>
                    ${episode.pub_date_ms ? `<p style="color: #8899aa; font-size: 13px;"><strong>Дата:</strong> ${new Date(episode.pub_date_ms).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
                    ${episode.description_original ? `<div style="margin: 20px 0; line-height: 1.8; color: #c8d8e8;">${episode.description_original}</div>` : ''}
                    ${episode.audio ? `
                        <div style="margin-top: 20px; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px;">
                            <p style="color: #8899aa; font-size: 13px; margin-bottom: 10px;">🎧 Прослушать эпизод:</p>
                            <audio controls 
                                   style="width: 100%; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.05);" 
                                   id="episodeAudioPlayerUI">
                                <source src="${episode.audio}" type="audio/mpeg">
                                Ваш браузер не поддерживает аудио
                            </audio>
                            <button onclick="playInFloatingPlayer('${episode.id}')" 
                                    style="margin-top: 10px; padding: 8px 20px; background: rgba(102,126,234,0.2); border: 1px solid rgba(102,126,234,0.3); border-radius: 8px; color: #a0b8ee; cursor: pointer; transition: all 0.3s; font-size: 13px;"
                                    onmouseenter="this.style.background='rgba(102,126,234,0.35)'"
                                    onmouseleave="this.style.background='rgba(102,126,234,0.2)'">
                                🎵 Слушать в плавающем плеере
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;

            const uiAudio = document.getElementById('episodeAudioPlayerUI');
            if (uiAudio) {
                uiAudio.volume = 0;
                uiAudio.currentTime = window.mainAudio.currentTime || 0;

                uiAudio.addEventListener('play', () => {
                    if (window.mainAudio && window.mainAudio.src) {
                        window.mainAudio.play().catch(() => { });
                    }
                });
                uiAudio.addEventListener('pause', () => {
                    if (window.mainAudio) {
                        window.mainAudio.pause();
                    }
                });
                uiAudio.addEventListener('seeked', () => {
                    if (window.mainAudio) {
                        window.mainAudio.currentTime = uiAudio.currentTime;
                    }
                });
                window.mainAudio.addEventListener('timeupdate', () => {
                    if (uiAudio && Math.abs(uiAudio.currentTime - window.mainAudio.currentTime) > 0.1) {
                        uiAudio.currentTime = window.mainAudio.currentTime;
                    }
                });
            }

            window.currentEpisodeData = episodeData;

            if (playerVisible) {
                updatePlayerInfo(episodeData);
                document.getElementById('playerPlayBtn').textContent = window.mainAudio?.paused ? '▶' : '⏸';
                if (window.mainAudio) {
                    document.getElementById('playerCurrentTime').textContent = formatTime(window.mainAudio.currentTime || 0);
                    document.getElementById('playerTotalTime').textContent = formatTime(window.mainAudio.duration || 0);
                    const progress = window.mainAudio.duration ? (window.mainAudio.currentTime / window.mainAudio.duration) * 100 : 0;
                    document.getElementById('playerProgressFill').style.width = progress + '%';
                }
            }

            if (playerVisible && window.mainAudio) {
                syncToFloatingPlayer(window.mainAudio);
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки эпизода:', error);
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: rgba(220,53,69,0.1); border-radius: 12px; border: 1px solid rgba(220,53,69,0.2);">
                    <h3 style="color: #ff6b7a;">❌ Не удалось загрузить детали эпизода</h3>
                    <p style="color: #8899aa;">${error.message || 'Пожалуйста, попробуйте позже'}</p>
                    <button onclick="window.loadInitialPodcasts()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        ← Вернуться к популярным подкастам
                    </button>
                </div>
            `;
        }
    }

    // ========== ОБРАБОТЧИКИ ОСНОВНОГО ПЛЕЕРА ==========
    function handleMainPlay(episodeId) {
        const mainAudio = document.getElementById('episodeAudioPlayer');
        if (!mainAudio) return;
        console.log('▶️ handleMainPlay вызван для:', episodeId);

        const recent = getRecentViews();
        const exists = recent.some(item => item.id === episodeId);
        if (!exists && window.currentListeningEpisode) {
            const episode = window.currentListeningEpisode;
            addRecentView({
                id: episode.id,
                title_original: episode.title,
                image: episode.image,
                publisher: episode.publisher,
                audio: episode.audio,
                thumbnail: episode.thumbnail
            });
            showToast('🎧 Добавлено в недавние просмотры');
            updateFavoriteCount();
        }

        if (playerVisible && playerAudio) {
            syncToFloatingPlayer(mainAudio);
        }
    }

    function handleMainPause(episodeId) {
        const mainAudio = document.getElementById('episodeAudioPlayer');
        if (!mainAudio) return;
        console.log('⏸️ handleMainPause вызван для:', episodeId);

        if (mainAudio.currentTime > 5) {
            const recent = getRecentViews();
            const exists = recent.some(item => item.id === episodeId);
            if (exists) {
                let recentList = getRecentViews();
                const index = recentList.findIndex(item => item.id === episodeId);
                if (index !== -1) {
                    recentList[index].progress = Math.round(mainAudio.currentTime);
                    saveRecentViews(recentList);
                    renderRecentViews();
                }
            }
        }

        if (playerVisible && playerAudio) {
            syncToFloatingPlayer(mainAudio);
        }
    }

    function handleMainTimeUpdate(episodeId) {
        const mainAudio = document.getElementById('episodeAudioPlayer');
        if (!mainAudio) return;

        if (mainAudio.currentTime > 5 && window.currentListeningEpisode) {
            const episode = window.currentListeningEpisode;
            const recent = getRecentViews();
            const exists = recent.some(item => item.id === episodeId);

            if (exists) {
                let recentList = getRecentViews();
                const index = recentList.findIndex(item => item.id === episodeId);
                if (index !== -1) {
                    recentList[index].progress = Math.round(mainAudio.currentTime);
                    saveRecentViews(recentList);
                    renderRecentViews();
                }
            } else {
                addRecentView({
                    id: episode.id,
                    title_original: episode.title,
                    image: episode.image,
                    publisher: episode.publisher,
                    audio: episode.audio,
                    thumbnail: episode.thumbnail,
                    progress: Math.round(mainAudio.currentTime)
                });
                if (!episode.hasStarted) {
                    episode.hasStarted = true;
                    showToast('🎧 Добавлено в недавние просмотры');
                    updateFavoriteCount();
                }
            }
        }

        if (playerVisible && playerAudio) {
            syncToFloatingPlayer(mainAudio);
        }
    }

    function handleMainLoaded(episodeId) {
        const mainAudio = document.getElementById('episodeAudioPlayer');
        if (!mainAudio) return;
        console.log('📥 handleMainLoaded вызван для:', episodeId);

        const recent = getRecentViews();
        const found = recent.find(item => item.id === episodeId);
        if (found && found.progress > 0) {
            mainAudio.currentTime = found.progress;
            console.log(`⏱️ Восстановлен прогресс: ${found.progress} секунд`);
        }

        if (playerVisible && playerAudio) {
            syncToFloatingPlayer(mainAudio);
        }
    }

    // ========== ПЛАВАЮЩИЙ ПЛЕЕР ==========
    function playInFloatingPlayer(episodeId) {
        if (window.currentEpisodeData && window.currentEpisodeData.id === episodeId) {
            const episode = window.currentEpisodeData;
            const recent = getRecentViews();
            const exists = recent.some(item => item.id === episodeId);
            if (!exists) {
                addRecentView({
                    id: episode.id,
                    title_original: episode.title_original || 'Эпизод',
                    image: episode.image || '',
                    publisher: episode.publisher || '',
                    audio: episode.audio || '',
                    thumbnail: episode.thumbnail || ''
                });
                showToast('🎧 Добавлено в недавние просмотры');
                updateFavoriteCount();
            }
            showPlayer(episode);
            const mainAudio = document.getElementById('episodeAudioPlayer');
            if (mainAudio && mainAudio.src === episode.audio) {
                if (!mainAudio.paused) {
                    playerAudio.play().catch(() => { });
                }
                syncToFloatingPlayer(mainAudio);
            }
        } else {
            window.apiClient.getEpisode(episodeId).then(episode => {
                const data = {
                    id: episode.id,
                    title_original: episode.title_original || episode.title || 'Эпизод',
                    image: episode.image || episode.thumbnail || '',
                    publisher: episode.publisher || episode.podcast_title_original || '',
                    audio: episode.audio || episode.audio_url || '',
                    thumbnail: episode.thumbnail || episode.image || ''
                };
                window.currentEpisodeData = data;
                const recent = getRecentViews();
                const exists = recent.some(item => item.id === episodeId);
                if (!exists) {
                    addRecentView({
                        id: data.id,
                        title_original: data.title_original,
                        image: data.image,
                        publisher: data.publisher,
                        audio: data.audio,
                        thumbnail: data.thumbnail
                    });
                    showToast('🎧 Добавлено в недавние просмотры');
                    updateFavoriteCount();
                }
                showPlayer(data);
            }).catch(err => {
                console.error('Ошибка загрузки эпизода для плеера:', err);
                showToast('❌ Не удалось загрузить эпизод');
            });
        }
    }

    // ========== ОТСЛЕЖИВАНИЕ ПРОСЛУШИВАНИЯ ==========
    function handlePlayStart(episodeId) {
        console.log('▶️ Начато воспроизведение эпизода:', episodeId);
        const audio = document.getElementById('episodeAudioPlayer');
        if (!audio) return;
        if (window.currentListeningEpisode && window.currentListeningEpisode.id === episodeId) {
            const episode = window.currentListeningEpisode;
            const recent = getRecentViews();
            const exists = recent.some(item => item.id === episodeId);
            if (!exists) {
                addRecentView({
                    id: episode.id,
                    title_original: episode.title,
                    image: episode.image,
                    publisher: episode.publisher,
                    audio: episode.audio,
                    thumbnail: episode.thumbnail
                });
                showToast('🎧 Добавлено в недавние просмотры');
                updateFavoriteCount();
            }
            episode.hasStarted = true;
        }
    }

    function handleTimeUpdate(episodeId) {
        const audio = document.getElementById('episodeAudioPlayer');
        if (!audio) return;
        if (audio.currentTime > 5 && window.currentListeningEpisode) {
            const episode = window.currentListeningEpisode;
            const recent = getRecentViews();
            const exists = recent.some(item => item.id === episodeId);
            if (!exists && episode.id === episodeId) {
                addRecentView({
                    id: episode.id,
                    title_original: episode.title,
                    image: episode.image,
                    publisher: episode.publisher,
                    audio: episode.audio,
                    thumbnail: episode.thumbnail,
                    progress: Math.round(audio.currentTime)
                });
                episode.progress = Math.round(audio.currentTime);
                if (!episode.hasStarted) {
                    episode.hasStarted = true;
                    showToast('🎧 Добавлено в недавние просмотры');
                    updateFavoriteCount();
                }
            }
        }
    }

    // ========== ПОЛУЧЕНИЕ ЭПИЗОДОВ ПОДКАСТА ==========
    async function getPodcastEpisodes(podcastId) {
        try {
            console.log('📊 Загрузка эпизодов подкаста:', podcastId);
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <div class="spinner"></div>
                    <p style="margin-top: 20px; color: #666;">Загрузка эпизодов...</p>
                </div>
            `;

            let podcastTitle = 'Подкаст';
            let podcastPublisher = '';
            let episodes = [];
            let podcastData = null;

            try {
                podcastData = await window.apiClient.getPodcast(podcastId);
                podcastTitle = podcastData.title || podcastData.title_original || 'Подкаст';
                podcastPublisher = podcastData.publisher || '';
                console.log('📊 Информация о подкасте получена:', podcastTitle);
                showPodcastInfo(podcastData);
            } catch (podcastError) {
                console.warn('⚠️ Не удалось получить информацию о подкасте:', podcastError);
                showPodcastInfo(null);
            }

            try {
                const data = await window.apiClient.getPodcastEpisodes(podcastId, {
                    limit: 10,
                    sort: 'recent_first'
                });
                if (data && data.episodes && Array.isArray(data.episodes) && data.episodes.length > 0) {
                    episodes = data.episodes;
                    console.log('✅ Эпизоды получены напрямую:', episodes.length);
                }
            } catch (episodeError) {
                console.warn('⚠️ Не удалось получить эпизоды напрямую:', episodeError.message);

                if (episodeError.message.includes('404') && podcastTitle !== 'Подкаст') {
                    console.log('🔍 Автоматический поиск эпизодов по названию:', podcastTitle);
                    try {
                        const searchResults = await window.apiClient.searchEpisodes(podcastTitle, {
                            limit: 15,
                            sort_by_date: 1
                        });
                        if (searchResults && searchResults.results && Array.isArray(searchResults.results)) {
                            const filteredEpisodes = searchResults.results.filter(ep =>
                                ep.podcast_id === podcastId ||
                                ep.podcast_title_original?.toLowerCase().includes(podcastTitle.toLowerCase()) ||
                                ep.podcast_title?.toLowerCase().includes(podcastTitle.toLowerCase())
                            );
                            if (filteredEpisodes.length > 0) {
                                episodes = filteredEpisodes;
                                console.log('✅ Найдено эпизодов через поиск:', episodes.length);
                            } else {
                                console.log('🔍 Точных совпадений нет, показываем все результаты поиска');
                                episodes = searchResults.results.slice(0, 10);
                            }
                        }
                    } catch (searchError) {
                        console.warn('⚠️ Поиск не дал результатов:', searchError.message);
                    }
                }
            }

            if (episodes.length > 0) {
                const episodesWithInfo = episodes.map(ep => ({
                    ...ep,
                    podcast_title_original: podcastTitle,
                    publisher: podcastPublisher
                }));
                displayPodcasts({ results: episodesWithInfo }, `🎙️ Эпизоды: ${podcastTitle}`);
            } else {
                resultsContainer.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff3cd; border-radius: 12px; border: 1px solid #ffc107;">
                        <h3 style="color: #856404;">📭 У подкаста "${podcastTitle}" нет доступных эпизодов</h3>
                        <p style="color: #856404; margin-top: 10px;">Некоторые подкасты недоступны для прямого просмотра эпизодов</p>
                        <p style="color: #856404; font-size: 14px;">Попробуйте найти эпизоды через поиск</p>
                        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="document.getElementById('searchInput').value = '${podcastTitle}'; document.getElementById('searchBtn').click();" 
                                    style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                                🔍 Поискать "${podcastTitle}"
                            </button>
                            <button onclick="window.loadInitialPodcasts()" 
                                    style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                                ← Вернуться к популярным
                            </button>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки эпизодов:', error);

            let errorMessage = 'Не удалось загрузить эпизоды';
            let errorDetails = '';
            let podcastName = '';

            try {
                const podcast = await window.apiClient.getPodcast(podcastId);
                podcastName = podcast.title || podcast.title_original || '';
            } catch (e) { }

            if (error.message.includes('404')) {
                errorMessage = 'Подкаст не найден или не имеет эпизодов';
                errorDetails = podcastName ? `Попробуйте найти "${podcastName}" через поиск` : 'Попробуйте найти этот подкаст через поиск';
            } else if (error.message.includes('403')) {
                errorMessage = 'Доступ запрещен';
                errorDetails = 'Проверьте API ключ или тарифный план';
            } else if (error.message.includes('429')) {
                errorMessage = 'Слишком много запросов';
                errorDetails = 'Подождите немного и попробуйте снова';
            } else {
                errorDetails = error.message || 'Пожалуйста, попробуйте позже';
            }

            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #f8d7da; border-radius: 12px; border: 1px solid #f5c6cb;">
                    <h3 style="color: #721c24;">❌ ${errorMessage}</h3>
                    <p style="color: #721c24; margin: 10px 0;">${errorDetails}</p>
                    <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        ${podcastName ? `
                            <button onclick="document.getElementById('searchInput').value = '${podcastName}'; document.getElementById('searchBtn').click();" 
                                    style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                                🔍 Поискать "${podcastName}"
                            </button>
                        ` : ''}
                        <button onclick="window.loadInitialPodcasts()" 
                                style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                            ← Вернуться к популярным
                        </button>
                    </div>
                </div>
            `;
        }
    }

    function displayPodcasts(data, title = 'Результаты поиска') {
        console.log('📊 displayPodcasts вызван с данными:', data);
        console.log('📊 Заголовок:', title);
        resultsContainer.innerHTML = '';
        let podcasts = [];
        let currentTitle = title;

        if (data && data.curated_lists && Array.isArray(data.curated_lists)) {
            console.log('📊 Найдены curated_lists');
            data.curated_lists.forEach(list => {
                if (list.podcasts && Array.isArray(list.podcasts)) {
                    podcasts = podcasts.concat(list.podcasts);
                }
            });
            if (data.curated_lists.length > 0 && data.curated_lists[0].title) {
                currentTitle = data.curated_lists[0].title;
            }
        } else if (data && data.results && Array.isArray(data.results)) {
            console.log('📊 Найдены data.results');
            podcasts = data.results;
        } else if (data && data.episodes && Array.isArray(data.episodes)) {
            console.log('📊 Найдены data.episodes');
            podcasts = data.episodes;
        } else if (data && data.podcasts && Array.isArray(data.podcasts)) {
            console.log('📊 Найдены data.podcasts');
            podcasts = data.podcasts;
        } else if (Array.isArray(data)) {
            console.log('📊 Данные - массив');
            podcasts = data;
        }

        console.log('📊 Итоговый массив подкастов:', podcasts);
        console.log('📊 Длина массива:', podcasts.length);

        if (!podcasts || podcasts.length === 0) {
            console.warn('⚠️ Нет данных для отображения');
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 40px; background: #f9f9f9; border-radius: 12px;">
                    <h3 style="color: #666; font-size: 24px;">😕 Ничего не найдено</h3>
                    <p style="color: #999; margin-top: 10px;">Попробуйте изменить поисковый запрос</p>
                    <button onclick="window.loadInitialPodcasts()" 
                            style="margin-top: 20px; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                        ← Вернуться к популярным
                    </button>
                </div>
            `;
            return;
        }

        const titleElement = document.createElement('div');
        titleElement.style.cssText = 'grid-column: 1/-1; margin-bottom: 10px;';
        titleElement.innerHTML = `<h2 style="color: #333;">${currentTitle} (${podcasts.length})</h2>`;
        resultsContainer.appendChild(titleElement);

        podcasts.forEach((item) => {
            const card = createPodcastCard(item);
            resultsContainer.appendChild(card);
        });
        console.log('✅ Отображено карточек:', podcasts.length);
    }

    // ========== ПОИСК И ЗАГРУЗКА ==========
    async function handleSearch() {
        const query = searchInput.value.trim();
        console.log('🔍 Поиск запроса:', query);
        if (!query) {
            alert('Пожалуйста, введите поисковый запрос');
            return;
        }

        try {
            searchBtn.innerHTML = '⏳';
            searchBtn.disabled = true;
            isLoading = false;
            currentOffset = 0;
            currentQuery = query;
            currentPage = 1;

            resultsContainer.innerHTML = '';
            const titleElement = document.createElement('div');
            titleElement.style.cssText = 'grid-column: 1/-1; margin-bottom: 10px;';
            titleElement.innerHTML = `
                <h2 style="color: #f0f2f5; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-search" style="color: #667eea;"></i>
                    Поиск: "${query}"
                </h2>
            `;
            resultsContainer.appendChild(titleElement);

            const skeletons = createSkeletonCards(LIMIT);
            resultsContainer.appendChild(skeletons);

            console.log('📡 Отправка запроса к API...');
            const filterParams = getFilterParams();
            const searchParams = {
                limit: LIMIT,
                offset: 0,
                sort_by_date: 1,
                ...filterParams
            };

            const results = await window.apiClient.searchEpisodes(query, searchParams);
            console.log('📡 Получен ответ:', results);

            if (results && results.results && results.results.length === 0) {
                const emptyState = createEmptyState(
                    'fa-search',
                    'Ничего не найдено',
                    'Попробуйте изменить поисковый запрос или фильтры. Например: "tech", "javascript", "podcast"',
                    'Вернуться к популярным',
                    loadInitialPodcastsWrapper
                );
                resultsContainer.innerHTML = '';
                resultsContainer.appendChild(emptyState);
                return;
            }

            currentOffset = results.results.length;
            currentTotal = results.total || results.results.length;
            displayPodcastsWithPagination(results, `Результаты поиска: "${query}"`);
        } catch (error) {
            console.error('❌ Ошибка при поиске:', error);
            const errorElement = createErrorState(
                error.message || 'Ошибка при поиске. Пожалуйста, попробуйте позже.',
                handleSearch
            );
            resultsContainer.innerHTML = '';
            resultsContainer.appendChild(errorElement);
        } finally {
            searchBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21L16.65 16.65" />
                </svg>
            `;
            searchBtn.disabled = false;
        }
    }

    // ========== ОБЕРТКА ДЛЯ loadInitialPodcasts ==========
    function loadInitialPodcastsWrapper() {
        loadPodcasts({
            resultsContainer,
            paginationManager,
            limit: LIMIT,
            displayPodcastsWithPaginationForCurated,
            showToast,
            onLoadComplete: (state) => {
                currentOffset = state.currentOffset;
                currentQuery = state.currentQuery;
                currentTotal = state.currentTotal;
                currentPage = state.currentPage;
                isLoading = state.isLoading;
                window.allPodcasts = state.allPodcasts;
            }
        });
    }

    // ========== TOAST ==========
    function showToast(message) {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            z-index: 9999;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-width: 90%;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }

    // ========== НЕДАВНИЕ ПРОСМОТРЫ ==========
    function getRecentViews() {
        try {
            const data = localStorage.getItem('colibri_recent');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Ошибка чтения недавних просмотров:', e);
            return [];
        }
    }

    function saveRecentViews(recent) {
        try {
            localStorage.setItem('colibri_recent', JSON.stringify(recent));
        } catch (e) {
            console.error('Ошибка сохранения недавних просмотров:', e);
        }
    }

    function addRecentView(item) {
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
        renderRecentViews();
    }

    function renderRecentViews() {
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
                        ${item.progress && item.progress > 0 ? `⏱️ ${formatTime(item.progress)}` : '▶️ Не начато'}
                    </span>
                    <button class="recent-item-remove" data-id="${item.id}" title="Удалить из истории">✕</button>
                </div>
            `;
            div.addEventListener('click', (e) => {
                if (e.target.closest('.recent-item-remove')) return;
                if (item.id) {
                    showEpisodeDetails(item.id);
                }
            });
            const removeBtn = div.querySelector('.recent-item-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeRecentView(item.id);
            });
            slider.appendChild(div);
        });
        updateScrollButtons();
    }

    function formatTime(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function removeRecentView(id) {
        let recent = getRecentViews();
        recent = recent.filter(item => item.id !== id);
        saveRecentViews(recent);
        renderRecentViews();
        showToast('Удалено из истории');
    }

    function clearRecentViews() {
        if (confirm('Вы уверены, что хотите очистить историю просмотров?')) {
            saveRecentViews([]);
            renderRecentViews();
            showToast('История очищена');
        }
    }

    function updateScrollButtons() {
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

    function scrollRecent(direction) {
        const slider = document.getElementById('recentSlider');
        if (!slider) return;
        const scrollAmount = slider.clientWidth * 0.7;
        slider.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    }

    function setupRecentSlider() {
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
            clearBtn.addEventListener('click', clearRecentViews);
        }
        window.addEventListener('resize', updateScrollButtons);
    }

    // ========== ПЛАВАЮЩИЙ АУДИОПЛЕЕР ==========
    let playerAudio = null;
    let playerVisible = false;
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let playerPosition = { x: 0, y: 0 };
    let isMinimized = false;
    let currentEpisodeData = null;
    let isSyncing = false;

    function initFloatingPlayer() {
        const player = document.getElementById('floatingPlayer');
        const playBtn = document.getElementById('playerPlayBtn');
        const toggleBtn = document.getElementById('playerToggle');
        const closeBtn = document.getElementById('playerClose');
        const progressBar = document.getElementById('playerProgressBar');
        const prevBtn = document.getElementById('playerPrev');
        const nextBtn = document.getElementById('playerNext');
        const dragHandle = document.getElementById('playerDragHandle');

        if (!window.mainAudio) {
            window.mainAudio = new Audio();
            window.mainAudio.id = 'episodeAudioPlayer';
        }
        playerAudio = window.mainAudio;

        playBtn.addEventListener('click', togglePlay);
        toggleBtn.addEventListener('click', togglePlayerMinimize);
        closeBtn.addEventListener('click', closePlayer);
        progressBar.addEventListener('click', handleProgressClick);
        prevBtn.addEventListener('click', playPrevious);
        nextBtn.addEventListener('click', playNext);

        dragHandle.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', endDrag);
        dragHandle.addEventListener('touchstart', startDragTouch);
        document.addEventListener('touchmove', onDragTouch);
        document.addEventListener('touchend', endDragTouch);

        playerAudio.addEventListener('timeupdate', updateProgress);
        playerAudio.addEventListener('loadedmetadata', updateTotalTime);
        playerAudio.addEventListener('ended', onAudioEnded);

        playerAudio.addEventListener('play', () => {
            document.getElementById('playerPlayBtn').textContent = '⏸';
            if (window.currentListeningEpisode) {
                const episode = window.currentListeningEpisode;
                const recent = getRecentViews();
                const exists = recent.some(item => item.id === episode.id);
                if (!exists) {
                    addRecentView({
                        id: episode.id,
                        title_original: episode.title,
                        image: episode.image,
                        publisher: episode.publisher,
                        audio: episode.audio,
                        thumbnail: episode.thumbnail
                    });
                    showToast('🎧 Добавлено в недавние просмотры');
                    updateFavoriteCount();
                }
            }
        });
        playerAudio.addEventListener('pause', () => {
            document.getElementById('playerPlayBtn').textContent = '▶';
        });

        const savedPosition = localStorage.getItem('colibri_player_position');
        if (savedPosition) {
            try {
                const pos = JSON.parse(savedPosition);
                player.style.right = 'auto';
                player.style.left = pos.x + 'px';
                player.style.top = pos.y + 'px';
                player.style.bottom = 'auto';
                playerPosition = pos;
            } catch (e) { }
        }
    }

    function syncToMainPlayer() {
        if (isSyncing) return;
        isSyncing = true;
        try {
            const mainAudio = document.getElementById('episodeAudioPlayer');
            if (!mainAudio) {
                isSyncing = false;
                return;
            }
            if (mainAudio.src && playerAudio.src && mainAudio.src === playerAudio.src) {
                if (Math.abs(mainAudio.currentTime - playerAudio.currentTime) > 0.5) {
                    mainAudio.currentTime = playerAudio.currentTime;
                }
                if (mainAudio.paused !== playerAudio.paused) {
                    if (playerAudio.paused) {
                        mainAudio.pause();
                    } else {
                        mainAudio.play().catch(() => { });
                    }
                }
            }
        } catch (e) {
            console.log('Ошибка синхронизации:', e);
        }
        isSyncing = false;
    }

    function syncToFloatingPlayer(mainAudio) {
        if (isSyncing || !playerVisible) return;
        isSyncing = true;
        try {
            if (!mainAudio || !mainAudio.src) {
                isSyncing = false;
                return;
            }

            if (playerAudio.src !== mainAudio.src) {
                playerAudio.src = mainAudio.src;
                playerAudio.load();
            }

            if (window.currentEpisodeData) {
                updatePlayerInfo(window.currentEpisodeData);
            }

            if (window.currentEpisodeData) {
                window.currentListeningEpisode = {
                    id: window.currentEpisodeData.id,
                    title: window.currentEpisodeData.title_original || 'Эпизод',
                    image: window.currentEpisodeData.image || '',
                    publisher: window.currentEpisodeData.publisher || '',
                    audio: window.currentEpisodeData.audio || '',
                    thumbnail: window.currentEpisodeData.thumbnail || '',
                    hasStarted: false,
                    progress: 0
                };
            }

            if (Math.abs(playerAudio.currentTime - mainAudio.currentTime) > 0.5) {
                playerAudio.currentTime = mainAudio.currentTime;
            }

            if (playerAudio.paused !== mainAudio.paused) {
                if (mainAudio.paused) {
                    playerAudio.pause();
                } else {
                    playerAudio.play().catch(() => { });
                }
            }

            document.getElementById('playerPlayBtn').textContent = mainAudio.paused ? '▶' : '⏸';

        } catch (e) {
            console.log('Ошибка синхронизации в плавающий плеер:', e);
        }
        isSyncing = false;
    }

    function updatePlayerInfo(episode) {
        const cover = document.getElementById('playerCover');
        const title = document.getElementById('playerTitle');
        const publisher = document.getElementById('playerPublisher');

        if (cover) {
            cover.src = episode.image || episode.thumbnail || '';
            cover.alt = episode.title_original || episode.title || 'Обложка';
        }
        if (title) {
            title.textContent = episode.title_original || episode.title || 'Без названия';
        }
        if (publisher) {
            publisher.textContent = episode.publisher || episode.podcast_title_original || 'Подкаст';
        }

        currentEpisodeData = episode;
        savePlayerState();
    }

    function showPlayer(episode) {
        if (!episode || !episode.audio) return;

        console.log('🎵 showPlayer вызван для:', episode.title_original);

        window.currentEpisodeData = episode;
        window.currentListeningEpisode = {
            id: episode.id,
            title: episode.title_original || episode.title || 'Эпизод',
            image: episode.image || episode.thumbnail || '',
            publisher: episode.publisher || episode.podcast_title_original || '',
            audio: episode.audio || episode.audio_url || '',
            thumbnail: episode.thumbnail || episode.image || '',
            hasStarted: false,
            progress: 0
        };

        currentEpisodeData = episode;
        const player = document.getElementById('floatingPlayer');

        updatePlayerInfo(episode);

        if (!window.mainAudio) {
            window.mainAudio = new Audio();
            window.mainAudio.id = 'episodeAudioPlayer';
        }
        playerAudio = window.mainAudio;

        if (playerAudio.src !== episode.audio) {
            playerAudio.src = episode.audio;
            playerAudio.load();
            playerAudio.addEventListener('loadedmetadata', function onLoaded() {
                document.getElementById('playerTotalTime').textContent = formatTime(playerAudio.duration);
                playerAudio.removeEventListener('loadedmetadata', onLoaded);
            });
        }

        player.style.display = 'block';
        playerVisible = true;
        savePlayerState();
    }

    function togglePlay() {
        if (!playerAudio || !playerAudio.src) return;
        if (playerAudio.paused) {
            playerAudio.play().catch(err => console.log('Ошибка воспроизведения:', err));
        } else {
            playerAudio.pause();
        }
    }

    function togglePlayerMinimize() {
        const player = document.getElementById('floatingPlayer');
        isMinimized = !isMinimized;
        player.classList.toggle('minimized', isMinimized);
        const icon = document.querySelector('.toggle-icon');
        if (icon) {
            icon.classList.toggle('minimized', isMinimized);
        }
        savePlayerState();
    }

    function closePlayer() {
        if (playerAudio) {
            playerAudio.pause();
            playerAudio.currentTime = 0;
        }
        document.getElementById('floatingPlayer').style.display = 'none';
        playerVisible = false;
        localStorage.removeItem('colibri_player_state');
    }

    function updateProgress() {
        if (!playerAudio.duration) return;
        const progress = (playerAudio.currentTime / playerAudio.duration) * 100;
        document.getElementById('playerProgressFill').style.width = progress + '%';
        document.getElementById('playerCurrentTime').textContent = formatTime(playerAudio.currentTime);
    }

    function updateTotalTime() {
        document.getElementById('playerTotalTime').textContent = formatTime(playerAudio.duration);
    }

    function handleProgressClick(e) {
        if (!playerAudio || !playerAudio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * playerAudio.duration;
        playerAudio.currentTime = newTime;
    }

    function playPrevious() {
        showToast('⏮️ Функция в разработке');
    }

    function playNext() {
        showToast('⏭️ Функция в разработке');
    }

    function onAudioEnded() {
        document.getElementById('playerPlayBtn').textContent = '▶';
    }

    // ===== DRAG & DROP =====
    function startDrag(e) {
        if (e.button !== 0) return;
        const player = document.getElementById('floatingPlayer');
        const rect = player.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        isDragging = true;
        player.classList.add('dragging');
        e.preventDefault();
    }

    function onDrag(e) {
        if (!isDragging) return;
        movePlayer(e.clientX, e.clientY);
    }

    function startDragTouch(e) {
        const touch = e.touches[0];
        const player = document.getElementById('floatingPlayer');
        const rect = player.getBoundingClientRect();
        dragOffsetX = touch.clientX - rect.left;
        dragOffsetY = touch.clientY - rect.top;
        isDragging = true;
        player.classList.add('dragging');
        e.preventDefault();
    }

    function onDragTouch(e) {
        if (!isDragging) return;
        const touch = e.touches[0];
        movePlayer(touch.clientX, touch.clientY);
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        document.getElementById('floatingPlayer').classList.remove('dragging');
        savePlayerPosition();
    }

    function endDragTouch() {
        if (!isDragging) return;
        isDragging = false;
        document.getElementById('floatingPlayer').classList.remove('dragging');
        savePlayerPosition();
    }

    function movePlayer(x, y) {
        const player = document.getElementById('floatingPlayer');
        const maxX = window.innerWidth - player.offsetWidth;
        const maxY = window.innerHeight - player.offsetHeight;
        let newX = Math.max(0, Math.min(maxX, x - dragOffsetX));
        let newY = Math.max(0, Math.min(maxY, y - dragOffsetY));
        player.style.right = 'auto';
        player.style.left = newX + 'px';
        player.style.top = newY + 'px';
        player.style.bottom = 'auto';
        playerPosition = { x: newX, y: newY };
    }

    function savePlayerPosition() {
        try {
            localStorage.setItem('colibri_player_position', JSON.stringify(playerPosition));
        } catch (e) { }
    }

    function savePlayerState() {
        if (!currentEpisodeData) return;
        try {
            localStorage.setItem('colibri_player_state', JSON.stringify({
                episode: currentEpisodeData,
                currentTime: playerAudio ? playerAudio.currentTime : 0,
                isPlaying: playerAudio ? !playerAudio.paused : false,
                isMinimized: isMinimized,
                position: playerPosition
            }));
        } catch (e) { }
    }

    function restorePlayerState() {
        try {
            const saved = localStorage.getItem('colibri_player_state');
            if (!saved) return;
            const state = JSON.parse(saved);
            if (state.episode && state.episode.audio) {
                currentEpisodeData = state.episode;
                isMinimized = state.isMinimized || false;
                const player = document.getElementById('floatingPlayer');
                if (state.position) {
                    player.style.right = 'auto';
                    player.style.left = state.position.x + 'px';
                    player.style.top = state.position.y + 'px';
                    player.style.bottom = 'auto';
                    playerPosition = state.position;
                }
                if (isMinimized) {
                    player.classList.add('minimized');
                }
                showPlayer(state.episode);
                if (state.currentTime && playerAudio) {
                    playerAudio.currentTime = state.currentTime;
                }
                if (state.isPlaying && playerAudio) {
                    playerAudio.play().catch(err => console.log('Ошибка восстановления воспроизведения:', err));
                }
            }
        } catch (e) {
            console.log('Ошибка восстановления плеера:', e);
        }
    }

    // ========== БОКОВОЕ МЕНЮ ==========
    function setupSidebar() {
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
                        loadInitialPodcastsWrapper();
                        break;
                    case 'favorites':
                        showFavorites(resultsContainer);
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
                        const userData = localStorage.getItem('colibri_user');
                        if (userData) {
                            try {
                                const user = JSON.parse(userData);
                                if (user.isLoggedIn) {
                                    showProfileMenu(user);
                                    return;
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

    // ========== ИНФОРМАЦИЯ О ПОДКАСТЕ В ПРАВОЙ ПАНЕЛИ ==========
    function showPodcastInfo(podcast) {
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
                    <button onclick="playInFloatingPlayer('${podcast.id}')" 
                            style="margin-top: 10px; padding: 10px 20px; background: rgba(102,126,234,0.2); border: 1px solid rgba(102,126,234,0.3); border-radius: 8px; color: #a0b8ee; cursor: pointer; transition: all 0.3s; font-size: 13px; width: 100%;"
                            onmouseenter="this.style.background='rgba(102,126,234,0.35)'"
                            onmouseleave="this.style.background='rgba(102,126,234,0.2)'">
                        🎵 Слушать в плавающем плеере
                    </button>
                ` : ''}
            </div>
        `;
    }

    // ========== УПРАВЛЕНИЕ ХЕДЕРОМ ==========
    function updateHeader() {
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

    // ========== ВЫХОД ИЗ АККАУНТА ==========
    function logoutUser() {
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
            loadInitialPodcastsWrapper();

            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            document.querySelector('.sidebar-link[data-page="home"]')?.classList.add('active');
        }
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
        console.log('✅ Обработчик клика добавлен на searchBtn');
    } else {
        console.error('❌ searchBtn не найден!');
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
        console.log('✅ Обработчик keypress добавлен на searchInput');
    } else {
        console.error('❌ searchInput не найден!');
    }

    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            console.log('🏠 Возврат на главную');
            if (searchInput) searchInput.value = '';
            loadInitialPodcastsWrapper();
        });
    }

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            console.log('👤 Клик по профилю');

            const userData = localStorage.getItem('colibri_user');

            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    if (user.isLoggedIn) {
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
                        return;
                    }
                } catch (e) { }
            }

            window.location.href = '/login.html';
        });
    }

    // Экспортируем все функции в window
window.loadInitialPodcasts = loadInitialPodcastsWrapper;
window.getPodcastEpisodes = getPodcastEpisodes;
window.showEpisodeDetails = showEpisodeDetails;
window.displayPodcasts = displayPodcasts;
window.getFavorites = getFavorites;
window.showFavorites = showFavorites;
window.toggleFavorite = toggleFavorite;
window.removeFromFavorites = removeFromFavorites;
window.clearAllFavorites = clearAllFavorites;
window.updateFavoriteCount = updateFavoriteCount;
window.updateFavoritesBadge = updateFavoritesBadge;
window.showToast = showToast;
window.addRecentView = addRecentView;
window.renderRecentViews = renderRecentViews;
window.clearRecentViews = clearRecentViews;
window.formatTime = formatTime;
window.playInFloatingPlayer = playInFloatingPlayer;
window.showPlayer = showPlayer;
window.togglePlay = togglePlay;
window.closePlayer = closePlayer;
window.togglePlayerMinimize = togglePlayerMinimize;
window.handleMainPlay = handleMainPlay;
window.handleMainPause = handleMainPause;
window.handleMainTimeUpdate = handleMainTimeUpdate;
window.handleMainLoaded = handleMainLoaded;
window.syncToMainPlayer = syncToMainPlayer;
window.syncToFloatingPlayer = syncToFloatingPlayer;
window.handleSearch = handleSearch;
window.showPodcastInfo = showPodcastInfo;
window.updateHeader = updateHeader;
window.logoutUser = logoutUser;
window.showProfileMenu = showProfileMenu;
window.closeProfileModal = closeProfileModal;
window.createSkeletonCards = createSkeletonCards;
window.createEmptyState = createEmptyState;
window.createErrorState = createErrorState;
window.createPodcastCard = createPodcastCard;

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    console.log('🚀 Инициализация приложения...');

    console.log('🔍 Проверка функций:');
    console.log('  loadInitialPodcasts:', typeof loadInitialPodcastsWrapper);
    console.log('  updateFavoriteCount:', typeof updateFavoriteCount);
    console.log('  updateFavoritesBadge:', typeof updateFavoritesBadge);
    console.log('  setupPresets (импортирован):', typeof setupPresets);
    console.log('  setupFilters (импортирован):', typeof setupFilters);
    console.log('  setupFooter (импортирован):', typeof setupFooter);
    console.log('  setupRecentSlider:', typeof setupRecentSlider);
    console.log('  renderRecentViews:', typeof renderRecentViews);
    console.log('  initFloatingPlayer:', typeof initFloatingPlayer);
    console.log('  setupSidebar:', typeof setupSidebar);
    console.log('  restorePlayerState:', typeof restorePlayerState);

    console.log('Запуск инициализации...');

    loadInitialPodcastsWrapper();
    updateFavoriteCount();
    updateFavoritesBadge();
    updateHeader();

    // Используем импортированные модули
    setupPresets();
    setupFilters();
    setupFooter();

    setupRecentSlider();
    renderRecentViews();
    initFloatingPlayer();
    setupSidebar();
    setTimeout(restorePlayerState, 500);

    console.log('✅ Инициализация завершена');
});