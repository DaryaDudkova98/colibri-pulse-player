// public/js/modules/filters.js
let filters = {
    language: '',
    type: '',
    sort: 'relevance'
};

export function setupFilters() {
    const languageSelect = document.getElementById('filterLanguage');
    const typeSelect = document.getElementById('filterType');
    const sortSelect = document.getElementById('filterSort');
    const resetBtn = document.getElementById('resetFiltersBtn');
    
    if (!languageSelect || !typeSelect || !sortSelect || !resetBtn) {
        console.warn('Элементы фильтров не найдены');
        return;
    }
    
    languageSelect.addEventListener('change', () => {
        filters.language = languageSelect.value;
        updateActiveFilters();
        if (document.getElementById('searchInput')?.value.trim()) {
            window.handleSearch?.();
        }
    });
    
    typeSelect.addEventListener('change', () => {
        filters.type = typeSelect.value;
        updateActiveFilters();
        if (document.getElementById('searchInput')?.value.trim()) {
            window.handleSearch?.();
        }
    });
    
    sortSelect.addEventListener('change', () => {
        filters.sort = sortSelect.value;
        updateActiveFilters();
        if (document.getElementById('searchInput')?.value.trim()) {
            window.handleSearch?.();
        }
    });
    
    resetBtn.addEventListener('click', () => {
        languageSelect.value = '';
        typeSelect.value = '';
        sortSelect.value = 'relevance';
        filters = { language: '', type: '', sort: 'relevance' };
        updateActiveFilters();
        if (document.getElementById('searchInput')?.value.trim()) {
            window.handleSearch?.();
        }
    });
    
    console.log('✅ Фильтры настроены');
}

export function updateActiveFilters() {
    const container = document.getElementById('activeFilters');
    if (!container) return;
    
    container.innerHTML = '';
    
    const filterLabels = {
        language: { label: 'Язык', value: filters.language },
        type: { label: 'Тип', value: filters.type },
        sort: { label: 'Сортировка', value: filters.sort }
    };
    
    const filterDisplay = {
        language: {
            'en': '🇬🇧 Английский',
            'ru': '🇷🇺 Русский',
            'es': '🇪🇸 Испанский',
            'fr': '🇫🇷 Французский',
            'de': '🇩🇪 Немецкий',
            'it': '🇮🇹 Итальянский',
            'pt': '🇵🇹 Португальский',
            'ja': '🇯🇵 Японский',
            'zh': '🇨🇳 Китайский',
            'ar': '🇸🇦 Арабский'
        },
        type: {
            'episode': 'Эпизоды',
            'podcast': 'Подкасты'
        },
        sort: {
            'relevance': 'По релевантности',
            'date': 'По дате (новые)',
            'date_old': 'По дате (старые)',
            'popularity': 'По популярности'
        }
    };
    
    Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value) {
            const displayValue = filterDisplay[key]?.[value] || value;
            const tag = document.createElement('span');
            tag.className = 'filter-tag';
            tag.innerHTML = `
                <span class="tag-label">${filterLabels[key].label}: ${displayValue}</span>
                <button class="tag-remove" data-filter="${key}" title="Убрать фильтр">×</button>
            `;
            const removeBtn = tag.querySelector('.tag-remove');
            removeBtn.addEventListener('click', () => {
                const selectMap = {
                    language: 'filterLanguage',
                    type: 'filterType',
                    sort: 'filterSort'
                };
                const select = document.getElementById(selectMap[key]);
                if (select) {
                    select.value = '';
                    filters[key] = '';
                    updateActiveFilters();
                    if (document.getElementById('searchInput')?.value.trim()) {
                        window.handleSearch?.();
                    }
                }
            });
            container.appendChild(tag);
        }
    });
}

export function getFilterParams() {
    const params = {};
    if (filters.sort === 'date') {
        params.sort_by_date = 1;
    } else if (filters.sort === 'date_old') {
        params.sort_by_date = 0;
    } else if (filters.sort === 'popularity') {
        params.sort_by_popularity = 1;
    }
    if (filters.type) {
        params.type = filters.type;
    }
    if (filters.language) {
        params.language = filters.language;
    }
    return params;
}