// public/js/modules/load-podcasts.js

/**
 * Загружает популярные подкасты через API
 */
export async function loadInitialPodcasts(options = {}) {
    const {
        resultsContainer,
        paginationManager,
        limit = 6,
        displayPodcastsWithPaginationForCurated,
        showToast,
        onLoadComplete
    } = options;

    if (!resultsContainer) {
        console.error('❌ resultsContainer не передан в loadInitialPodcasts');
        return;
    }

    console.log('📡 Загрузка популярных подкастов...');

    // Мок-данные для тестирования
    const mockPodcasts = [
        {
            id: 'mock-1',
            title_original: 'JavaScript Weekly',
            publisher: 'Tech Podcasts',
            image: 'https://via.placeholder.com/300x300/667eea/ffffff?text=JS',
            description_original: 'Еженедельный обзор новостей JavaScript'
        },
        {
            id: 'mock-2',
            title_original: 'Python Talk',
            publisher: 'Dev Podcasts',
            image: 'https://via.placeholder.com/300x300/764ba2/ffffff?text=Python',
            description_original: 'Все о Python и веб-разработке'
        },
        {
            id: 'mock-3',
            title_original: 'Web Design Pro',
            publisher: 'Design Podcasts',
            image: 'https://via.placeholder.com/300x300/ff6b6b/ffffff?text=Design',
            description_original: 'Современный веб-дизайн и UI/UX'
        },
        {
            id: 'mock-4',
            title_original: 'Data Science Daily',
            publisher: 'Data Podcasts',
            image: 'https://via.placeholder.com/300x300/4ecdc4/ffffff?text=Data',
            description_original: 'Новости машинного обучения и AI'
        },
        {
            id: 'mock-5',
            title_original: 'DevOps Unleashed',
            publisher: 'Cloud Podcasts',
            image: 'https://via.placeholder.com/300x300/45b7d1/ffffff?text=DevOps',
            description_original: 'CI/CD, Kubernetes и облачные технологии'
        },
        {
            id: 'mock-6',
            title_original: 'Mobile Dev Show',
            publisher: 'App Podcasts',
            image: 'https://via.placeholder.com/300x300/f39c12/ffffff?text=Mobile',
            description_original: 'Разработка под iOS и Android'
        }
    ];

    try {
        // Показываем скелетоны
        resultsContainer.innerHTML = '';
        const skeletons = document.createElement('div');
        skeletons.style.cssText = 'grid-column: 1/-1; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;';

        for (let i = 0; i < limit; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'podcast-card skeleton';
            skeleton.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border-radius: 20px;
                padding: 20px;
                min-height: 380px;
                animation: pulse 1.5s ease-in-out infinite;
            `;
            skeleton.innerHTML = `
                <div style="background: rgba(255,255,255,0.05); height: 210px; border-radius: 14px; margin-bottom: 14px;"></div>
                <div style="background: rgba(255,255,255,0.05); height: 20px; border-radius: 4px; margin-bottom: 8px; width: 80%;"></div>
                <div style="background: rgba(255,255,255,0.04); height: 14px; border-radius: 4px; margin-bottom: 6px; width: 60%;"></div>
                <div style="background: rgba(255,255,255,0.04); height: 14px; border-radius: 4px; margin-bottom: 12px; width: 70%;"></div>
            `;
            skeletons.appendChild(skeleton);
        }
        resultsContainer.appendChild(skeletons);

        // Загружаем данные
        console.log('📡 Отправка запроса к /api/curated...');
        
        let popular;
        let useMockData = false;
        
        try {
            popular = await window.apiClient.getCurated({ limit: 12 });
            console.log('📡 Получен ответ:', popular);
        } catch (apiError) {
            console.warn('⚠️ Ошибка API, используем мок-данные:', apiError.message);
            useMockData = true;
            popular = { curated_lists: [{ podcasts: mockPodcasts }] };
        }

        if ((popular?.curated_lists?.length > 0) || useMockData) {
            let allPodcasts = [];
            
            if (useMockData) {
                allPodcasts = mockPodcasts;
            } else {
                popular.curated_lists.forEach(list => {
                    if (list.podcasts?.length > 0) {
                        allPodcasts = allPodcasts.concat(list.podcasts);
                    }
                });
            }

            if (allPodcasts.length > 0) {
                const limitedPodcasts = allPodcasts.slice(0, limit);
                window.allPodcasts = allPodcasts;

                const state = {
                    currentOffset: limit,
                    currentQuery: 'popular',
                    currentTotal: allPodcasts.length,
                    currentPage: 1,
                    isLoading: false,
                    allPodcasts: allPodcasts
                };

                if (displayPodcastsWithPaginationForCurated) {
                    displayPodcastsWithPaginationForCurated(limitedPodcasts, useMockData ? '📱 Тестовые подкасты (мок-данные)' : 'Популярные подкасты');
                }

                if (paginationManager) {
                    paginationManager.setTotal(allPodcasts.length);
                    paginationManager.setCurrentPage(1);
                }

                if (showToast) {
                    showToast(useMockData ? '🔧 Используются тестовые данные (лимит API)' : '✅ Загружены популярные подкасты');
                }

                if (onLoadComplete) {
                    onLoadComplete(state);
                }
            } else {
                resultsContainer.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff3cd; border-radius: 12px; border: 1px solid #ffc107;">
                        <h3 style="color: #856404;">📭 Нет популярных подкастов</h3>
                        <p style="color: #856404;">Попробуйте выполнить поиск</p>
                    </div>
                `;
            }
        } else {
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #f8d7da; border-radius: 12px; border: 1px solid #f5c6cb;">
                    <h3 style="color: #721c24;">❌ Не удалось загрузить подкасты</h3>
                    <p style="color: #721c24;">Неожиданный ответ от API</p>
                    <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🔄 Попробовать снова
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки популярных подкастов:', error);
        
        // Если ошибка - показываем мок-данные
        console.warn('⚠️ Используем мок-данные из-за ошибки');
        const limitedPodcasts = mockPodcasts.slice(0, limit);
        window.allPodcasts = mockPodcasts;

        if (displayPodcastsWithPaginationForCurated) {
            displayPodcastsWithPaginationForCurated(limitedPodcasts, '📱 Тестовые подкасты (ошибка API)');
        }

        if (paginationManager) {
            paginationManager.setTotal(mockPodcasts.length);
            paginationManager.setCurrentPage(1);
        }

        if (showToast) {
            showToast('🔧 Используются тестовые данные (ошибка API)');
        }

        if (onLoadComplete) {
            onLoadComplete({
                currentOffset: limit,
                currentQuery: 'popular',
                currentTotal: mockPodcasts.length,
                currentPage: 1,
                isLoading: false,
                allPodcasts: mockPodcasts
            });
        }
    }
}

// Экспортируем в глобальную область
if (typeof window !== 'undefined') {
    window.loadInitialPodcasts = loadInitialPodcasts;
}