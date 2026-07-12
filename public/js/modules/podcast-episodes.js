// public/js/modules/podcast-episodes.js

/**
 * Модуль получения и отображения эпизодов подкаста
 */

export async function getPodcastEpisodes(podcastId, {
    resultsContainer,
    showPodcastInfo,
    playInFloatingPlayer,
    displayPodcasts,
    loadInitialPodcasts,
    searchInput,
    searchBtn,
    handleSearch
} = {}) {
    try {
        console.log('📊 Загрузка эпизодов подкаста:', podcastId);
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <div class="spinner"></div>
                    <p style="margin-top: 20px; color: #666;">Загрузка эпизодов...</p>
                </div>
            `;
        }

        let podcastTitle = 'Подкаст';
        let podcastPublisher = '';
        let episodes = [];
        let podcastData = null;

        try {
            podcastData = await window.apiClient.getPodcast(podcastId);
            podcastTitle = podcastData.title || podcastData.title_original || 'Подкаст';
            podcastPublisher = podcastData.publisher || '';
            console.log('📊 Информация о подкасте получена:', podcastTitle);
            if (showPodcastInfo) {
                showPodcastInfo(podcastData, { playInFloatingPlayer });
            }
        } catch (podcastError) {
            console.warn('⚠️ Не удалось получить информацию о подкасте:', podcastError);
            if (showPodcastInfo) {
                showPodcastInfo(null, { playInFloatingPlayer });
            }
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

        if (episodes.length > 0 && displayPodcasts) {
            const episodesWithInfo = episodes.map(ep => ({
                ...ep,
                podcast_title_original: podcastTitle,
                publisher: podcastPublisher
            }));
            displayPodcasts({ results: episodesWithInfo }, `🎙️ Эпизоды: ${podcastTitle}`, {
                resultsContainer,
                createPodcastCard,
                loadInitialPodcasts: loadInitialPodcastsWrapper
            });
        } else if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff3cd; border-radius: 12px; border: 1px solid #ffc107;">
                    <h3 style="color: #856404;">📭 У подкаста "${podcastTitle}" нет доступных эпизодов</h3>
                    <p style="color: #856404; margin-top: 10px;">Некоторые подкасты недоступны для прямого просмотра эпизодов</p>
                    <p style="color: #856404; font-size: 14px;">Попробуйте найти эпизоды через поиск</p>
                    <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="document.getElementById('searchInput').value = '${podcastTitle}'; window.handleSearch();"  
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

        if (resultsContainer) {
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
}

export function displayPodcasts(data, title = 'Результаты поиска', {
    resultsContainer,
    createPodcastCard,
    loadInitialPodcasts
} = {}) {
    console.log('📊 displayPodcasts вызван с данными:', data);
    console.log('📊 Заголовок:', title);

    if (!resultsContainer) return;

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

    if (createPodcastCard) {
        podcasts.forEach((item) => {
            const card = createPodcastCard(item);
            resultsContainer.appendChild(card);
        });
    }
    console.log('✅ Отображено карточек:', podcasts.length);
}