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
        const popular = await window.apiClient.getCurated({ limit: 12 });
        console.log('📡 Получен ответ:', popular);

        if (popular?.curated_lists?.length > 0) {
            let allPodcasts = [];
            popular.curated_lists.forEach(list => {
                if (list.podcasts?.length > 0) {
                    allPodcasts = allPodcasts.concat(list.podcasts);
                }
            });
            
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
                    displayPodcastsWithPaginationForCurated(limitedPodcasts, 'Популярные подкасты');
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
        resultsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #f8d7da; border-radius: 12px; border: 1px solid #f5c6cb;">
                <h3 style="color: #721c24;">❌ Не удалось загрузить подкасты</h3>
                <p style="color: #721c24;">${error.message || 'Пожалуйста, проверьте подключение к интернету'}</p>
                <button onclick="window.loadInitialPodcasts?.()" style="margin-top: 15px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🔄 Попробовать снова
                </button>
            </div>
        `;
    }
}

// Экспортируем в глобальную область
if (typeof window !== 'undefined') {
    window.loadInitialPodcasts = loadInitialPodcasts;
}