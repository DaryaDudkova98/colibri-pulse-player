// public/js/modules/search.js

/**
 * Модуль поиска подкастов и эпизодов
 */

export async function handleSearch({
    searchInput,
    searchBtn,
    currentQuery,
    resultsContainer,
    LIMIT,
    createSkeletonCards,
    createEmptyState,
    createErrorState,
    getFilterParams,
    paginationManager,
    displayPodcastsWithPagination,
    loadInitialPodcasts,
    showToast
} = {}) {
    const query = searchInput?.value?.trim() || '';
    console.log('🔍 Поиск запроса:', query);
    
    if (!query) {
        alert('Пожалуйста, введите поисковый запрос');
        return;
    }

    try {
        if (searchBtn) {
            searchBtn.innerHTML = '⏳';
            searchBtn.disabled = true;
        }
        
        // Обновляем текущий запрос
        currentQuery.value = query;

        if (resultsContainer) {
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

            if (createSkeletonCards) {
                const skeletons = createSkeletonCards(LIMIT);
                resultsContainer.appendChild(skeletons);
            }
        }

        console.log('📡 Отправка запроса к API...');
        const filterParams = getFilterParams ? getFilterParams() : {};
        const searchParams = {
            limit: LIMIT,
            offset: 0,
            sort_by_date: 1,
            ...filterParams
        };

        const results = await window.apiClient.searchEpisodes(query, searchParams);
        console.log('📡 Получен ответ:', results);

        if (results && results.results && results.results.length === 0) {
            if (resultsContainer && createEmptyState && loadInitialPodcasts) {
                const emptyState = createEmptyState(
                    'fa-search',
                    'Ничего не найдено',
                    'Попробуйте изменить поисковый запрос или фильтры. Например: "tech", "javascript", "podcast"',
                    'Вернуться к популярным',
                    loadInitialPodcasts
                );
                resultsContainer.innerHTML = '';
                resultsContainer.appendChild(emptyState);
            }
            return;
        }

        // Используем paginationManager для управления состоянием
        const total = results.total || results.results?.length || 0;
        if (paginationManager) {
            paginationManager.setTotal(total);
            paginationManager.setCurrentPage(1);
        }

        if (displayPodcastsWithPagination) {
            displayPodcastsWithPagination(results, `Результаты поиска: "${query}"`);
        }

    } catch (error) {
        console.error('❌ Ошибка при поиске:', error);
        if (resultsContainer && createErrorState) {
            const errorElement = createErrorState(
                error.message || 'Ошибка при поиске. Пожалуйста, попробуйте позже.',
                () => handleSearch({
                    searchInput,
                    searchBtn,
                    currentQuery,
                    resultsContainer,
                    LIMIT,
                    createSkeletonCards,
                    createEmptyState,
                    createErrorState,
                    getFilterParams,
                    paginationManager,
                    displayPodcastsWithPagination,
                    loadInitialPodcasts,
                    showToast
                })
            );
            resultsContainer.innerHTML = '';
            resultsContainer.appendChild(errorElement);
        }
        if (showToast) showToast('❌ Ошибка при поиске');
    } finally {
        if (searchBtn) {
            searchBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21L16.65 16.65" />
                </svg>
            `;
            searchBtn.disabled = false;
        }
    }
}