// public/js/modules/pagination.js

/**
 * Модуль пагинации для управления постраничной навигацией
 */

class PaginationManager {
    constructor(options = {}) {
        this.container = options.container || null;
        this.limit = options.limit || 6;
        this.total = options.total || 0;
        this.currentPage = options.currentPage || 1;
        this.pagesPerGroup = options.pagesPerGroup || 5;
        this.onPageChange = options.onPageChange || null;
        this.isLoading = false;
    }

    /**
     * Установить контейнер для пагинации
     */
    setContainer(container) {
        this.container = container;
    }

    /**
     * Обновить общее количество элементов
     */
    setTotal(total) {
        this.total = total;
        this.render();
    }

    /**
     * Обновить текущую страницу
     */
    setCurrentPage(page) {
        this.currentPage = page;
        this.render();
    }

    /**
     * Получить общее количество страниц
     */
    getTotalPages() {
        return Math.ceil(this.total / this.limit) || 1;
    }

    /**
     * Отрисовать пагинацию
     */
    render() {
        // Удаляем старую пагинацию
        const oldPagination = document.getElementById('paginationContainer');
        if (oldPagination) oldPagination.remove();

        const totalPages = this.getTotalPages();
        
        // Если всего одна страница или нет элементов - не показываем пагинацию
        if (this.total === 0 || totalPages <= 1) return;

        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationContainer';

        // Кнопка "В начало"
        const firstBtn = this._createPageButton('⏮', 1, this.currentPage === 1);
        paginationContainer.appendChild(firstBtn);

        // Кнопка "Назад"
        const prevBtn = this._createPageButton('◀', this.currentPage - 1, this.currentPage === 1);
        paginationContainer.appendChild(prevBtn);

        // Вычисляем диапазон отображаемых страниц
        let startPage, endPage;
        if (totalPages <= this.pagesPerGroup) {
            startPage = 1;
            endPage = totalPages;
        } else {
            startPage = Math.max(1, this.currentPage - 2);
            endPage = Math.min(totalPages, startPage + 4);
            if (startPage === 1) {
                endPage = Math.min(totalPages, this.pagesPerGroup);
            }
            if (endPage === totalPages) {
                startPage = Math.max(1, totalPages - 4);
            }
        }

        // Многоточие перед страницами
        if (startPage > 1) {
            const dots = document.createElement('span');
            dots.textContent = '…';
            dots.className = 'pagination-dots';
            paginationContainer.appendChild(dots);
        }

        // Кнопки страниц
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = this._createPageButton(i, i, i === this.currentPage, true);
            paginationContainer.appendChild(pageBtn);
        }

        // Многоточие после страниц
        if (endPage < totalPages) {
            const dots = document.createElement('span');
            dots.textContent = '…';
            dots.className = 'pagination-dots';
            paginationContainer.appendChild(dots);
        }

        // Кнопка "Вперед"
        const nextBtn = this._createPageButton('▶', this.currentPage + 1, this.currentPage === totalPages);
        paginationContainer.appendChild(nextBtn);

        // Кнопка "В конец"
        const lastBtn = this._createPageButton('⏭', totalPages, this.currentPage === totalPages);
        paginationContainer.appendChild(lastBtn);

        // Информация о текущей странице
        const info = document.createElement('span');
        info.className = 'pagination-info';
        info.textContent = `${this.currentPage} / ${totalPages}`;
        paginationContainer.appendChild(info);

        // Добавляем пагинацию в контейнер
        if (this.container) {
            this.container.appendChild(paginationContainer);
        }

        return paginationContainer;
    }

    /**
     * Создать кнопку пагинации
     */
    _createPageButton(label, page, disabled, isNumber = false) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.dataset.page = page;
        btn.disabled = disabled;

        // Добавляем классы
        btn.className = 'pagination-btn';
        if (isNumber && page === this.currentPage) {
            btn.classList.add('active');
        }
        if (isNumber) {
            btn.classList.add('page-number');
        }
        if (!isNumber) {
            btn.classList.add('nav-btn');
        }

        // Обработчик клика
        if (!disabled && this.onPageChange) {
            btn.addEventListener('click', () => {
                const targetPage = parseInt(page);
                if (targetPage !== this.currentPage && !this.isLoading) {
                    this.onPageChange(targetPage);
                }
            });
        }

        return btn;
    }

    /**
     * Перейти на указанную страницу
     */
    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page < 1 || page > totalPages || page === this.currentPage) return;
        
        if (this.onPageChange) {
            this.onPageChange(page);
        }
    }

    /**
     * Показать состояние загрузки
     */
    showLoading() {
        this.isLoading = true;
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingMore';
        loadingDiv.className = 'pagination-loading';
        loadingDiv.innerHTML = `
            <div class="spinner"></div>
            <p style="margin-top: 10px; color: #666;">Загрузка...</p>
        `;
        if (this.container) {
            this.container.appendChild(loadingDiv);
        }
        return loadingDiv;
    }

    /**
     * Скрыть состояние загрузки
     */
    hideLoading() {
        this.isLoading = false;
        const loadingDiv = document.getElementById('loadingMore');
        if (loadingDiv) loadingDiv.remove();
    }

    /**
     * Показать ошибку загрузки
     */
    showError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'loadMoreBtn';
        errorDiv.className = 'pagination-error';
        errorDiv.innerHTML = `
            <p style="color: #dc3545;">❌ Ошибка загрузки: ${error.message || 'Попробуйте позже'}</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Обновить
            </button>
        `;
        if (this.container) {
            this.container.appendChild(errorDiv);
        }
        return errorDiv;
    }

    /**
     * Сбросить состояние пагинации
     */
    reset() {
        this.currentPage = 1;
        this.total = 0;
        this.isLoading = false;
        const oldPagination = document.getElementById('paginationContainer');
        if (oldPagination) oldPagination.remove();
        const loading = document.getElementById('loadingMore');
        if (loading) loading.remove();
        const error = document.getElementById('loadMoreBtn');
        if (error) error.remove();
    }

    /**
     * Обновить настройки пагинации
     */
    updateSettings(options = {}) {
        if (options.limit !== undefined) this.limit = options.limit;
        if (options.pagesPerGroup !== undefined) this.pagesPerGroup = options.pagesPerGroup;
        if (options.onPageChange !== undefined) this.onPageChange = options.onPageChange;
    }
}

// Экспортируем модуль
export default PaginationManager;

// Для использования в глобальной области
if (typeof window !== 'undefined') {
    window.PaginationManager = PaginationManager;
}