// public/js/modules/pagination-ui.js

/**
 * Модуль управления пагинацией и отображением результатов
 */

export function setupPagination({
    resultsContainer,
    LIMIT,
    currentQuery,
    paginationManager,
    createPodcastCard,
    goToPage,
    loadPodcasts
} = {}) {
    
    // ========== ФУНКЦИЯ ПЕРЕХОДА НА СТРАНИЦУ ==========
    async function goToPageHandler(page) {
        if (paginationManager.isLoading) return;
        const totalPages = paginationManager.getTotalPages();
        if (page < 1 || page > totalPages || page === paginationManager.currentPage) return;

        try {
            const offset = (page - 1) * LIMIT;
            paginationManager.showLoading();

            if (currentQuery.value === 'popular') {
                // Логика для популярных подкастов
                const start = offset;
                const end = Math.min(offset + LIMIT, window.allPodcasts.length);
                const batch = window.allPodcasts.slice(start, end);

                if (batch.length > 0) {
                    resultsContainer.innerHTML = '';
                    const titleElement = document.createElement('div');
                    titleElement.style.cssText = 'grid-column: 1/-1; margin-bottom: 10px;';
                    const total = paginationManager.total;
                    titleElement.innerHTML = `<h2 style="color: #f0f2f5; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-fire" style="color: #ff6b6b;"></i>
                        Популярные подкасты (${Math.min(offset + LIMIT, total)} из ${total})
                    </h2>`;
                    resultsContainer.appendChild(titleElement);

                    batch.forEach((item) => {
                        const card = createPodcastCard(item);
                        resultsContainer.appendChild(card);
                    });

                    paginationManager.setCurrentPage(page);
                }
            } else {
                // Логика для поиска
                const results = await window.apiClient.searchEpisodes(currentQuery.value, {
                    limit: LIMIT,
                    offset: offset,
                    sort_by_date: 1
                });

                if (results && results.results && results.results.length > 0) {
                    resultsContainer.innerHTML = '';
                    const titleElement = document.createElement('div');
                    titleElement.style.cssText = 'grid-column: 1/-1; margin-bottom: 10px;';
                    const total = results.total || paginationManager.total;
                    titleElement.innerHTML = `<h2 style="color: #f0f2f5; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-search" style="color: #667eea;"></i>
                        Результаты поиска: "${currentQuery.value}" (${Math.min(offset + LIMIT, total)} из ${total})
                    </h2>`;
                    resultsContainer.appendChild(titleElement);

                    results.results.forEach((item) => {
                        const card = createPodcastCard(item);
                        resultsContainer.appendChild(card);
                    });

                    paginationManager.setTotal(total);
                    paginationManager.setCurrentPage(page);
                }
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки страницы:', error);
            paginationManager.showError(error);
        } finally {
            paginationManager.hideLoading();
        }
    }

    // ========== ФУНКЦИИ ОТОБРАЖЕНИЯ ==========
    function displayPodcastsWithPagination(data, title = 'Результаты поиска') {
        resultsContainer.innerHTML = '';
        let podcasts = [];

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

        const total = data.total || podcasts.length;
        const offset = paginationManager.getOffset();

        const titleElement = document.createElement('div');
        titleElement.style.cssText = 'grid-column: 1/-1; margin-bottom: 10px;';
        titleElement.innerHTML = `<h2 style="color: #f0f2f5;">${title} (${Math.min(offset + LIMIT, total)} из ${total})</h2>`;
        resultsContainer.appendChild(titleElement);

        podcasts.forEach((item) => {
            const card = createPodcastCard(item);
            resultsContainer.appendChild(card);
        });

        paginationManager.setTotal(total);
        paginationManager.setCurrentPage(1);
    }

    function displayPodcastsWithPaginationLegacy(data, title = 'Результаты поиска') {
        console.log('🔍 displayPodcastsWithPagination вызвана');
        resultsContainer.innerHTML = '';
        let podcasts = [];

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

        const total = data.total || podcasts.length;
        const currentLimit = 6;

        const titleElement = document.createElement('div');
        titleElement.style.cssText = 'grid-column: 1/-1; margin-bottom: 10px;';
        titleElement.innerHTML = `<h2 style="color: #f0f2f5;">${title} (${Math.min(currentLimit, total)} из ${total})</h2>`;
        resultsContainer.appendChild(titleElement);

        podcasts.forEach((item) => {
            const card = createPodcastCard(item);
            resultsContainer.appendChild(card);
        });

        if (paginationManager) {
            paginationManager.setTotal(total);
            paginationManager.setCurrentPage(1);
        }
    }

    // Возвращаем функции для использования в main.js
    return {
        goToPage: goToPageHandler,
        displayPodcastsWithPagination,
        displayPodcastsWithPaginationLegacy
    };
}