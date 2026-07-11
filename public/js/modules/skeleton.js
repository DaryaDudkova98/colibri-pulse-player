// public/js/modules/skeleton.js

/**
 * Создает карточки-заглушки (skeleton) для отображения во время загрузки
 * @param {number} count - Количество карточек-заглушек
 * @returns {DocumentFragment} - Фрагмент с карточками-заглушками
 */
export function createSkeletonCards(count = 6) {
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'podcast-card skeleton';
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.06);
            position: relative;
            overflow: hidden;
            min-height: 380px;
            animation: pulse 1.5s ease-in-out infinite;
        `;
        
        card.innerHTML = `
            <div style="position: relative; overflow: hidden; border-radius: 14px; margin-bottom: 14px; background: rgba(255,255,255,0.05); height: 210px;">
                <div style="position: absolute; inset: 0; background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;"></div>
            </div>
            <div style="padding: 0 4px;">
                <div class="skeleton-text skeleton-title" style="background: rgba(255,255,255,0.05); height: 20px; border-radius: 4px; margin-bottom: 8px; width: 80%;"></div>
                <div class="skeleton-text skeleton-publisher" style="background: rgba(255,255,255,0.04); height: 14px; border-radius: 4px; margin-bottom: 6px; width: 60%;"></div>
                <div class="skeleton-text skeleton-description" style="background: rgba(255,255,255,0.04); height: 14px; border-radius: 4px; margin-bottom: 12px; width: 70%;"></div>
                <div class="skeleton-text" style="background: rgba(255,255,255,0.04); height: 12px; border-radius: 4px; width: 40%;"></div>
            </div>
        `;
        
        fragment.appendChild(card);
    }
    
    return fragment;
}

/**
 * Создает заглушку для пустого состояния (например, нет результатов)
 * @param {string} icon - Класс иконки Font Awesome (например, 'fa-search')
 * @param {string} title - Заголовок
 * @param {string} description - Описание
 * @param {string} buttonText - Текст кнопки
 * @param {Function} buttonAction - Функция при клике
 * @returns {HTMLElement} - Элемент с заглушкой
 */
export function createEmptyState(icon = 'fa-inbox', title = 'Ничего не найдено', description = 'Попробуйте изменить параметры поиска', buttonText = 'На главную', buttonAction = null) {
    const container = document.createElement('div');
    container.style.cssText = `
        grid-column: 1/-1;
        text-align: center;
        padding: 60px 40px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.06);
    `;
    
    container.innerHTML = `
        <div style="font-size: 56px; margin-bottom: 20px; color: #667eea;">
            <i class="${icon}"></i>
        </div>
        <h3 style="color: #f0f2f5; font-size: 24px; margin-bottom: 10px;">${title}</h3>
        <p style="color: #8899aa; font-size: 16px; margin-bottom: 24px;">${description}</p>
        ${buttonText ? `
            <button onclick="${buttonAction ? 'window.' + buttonAction.name + '()' : 'window.loadInitialPodcasts()'}" 
                    style="padding: 12px 30px; background: #667eea; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px; transition: all 0.3s;"
                    onmouseenter="this.style.background='#7b93f0'"
                    onmouseleave="this.style.background='#667eea'">
                <i class="fas fa-arrow-left" style="margin-right: 8px;"></i>
                ${buttonText}
            </button>
        ` : ''}
    `;
    
    return container;
}

/**
 * Создает заглушку для ошибки загрузки
 * @param {string} errorMessage - Сообщение об ошибке
 * @param {Function} retryAction - Функция для повторной попытки
 * @returns {HTMLElement} - Элемент с ошибкой
 */
export function createErrorState(errorMessage = 'Не удалось загрузить данные', retryAction = null) {
    const container = document.createElement('div');
    container.style.cssText = `
        grid-column: 1/-1;
        text-align: center;
        padding: 40px;
        background: rgba(220, 53, 69, 0.08);
        border-radius: 12px;
        border: 1px solid rgba(220, 53, 69, 0.15);
    `;
    
    container.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px; color: #ff6b7a;">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 style="color: #ff6b7a; font-size: 20px; margin-bottom: 10px;">Ошибка загрузки</h3>
        <p style="color: #8899aa; margin-bottom: 20px;">${errorMessage}</p>
        <button onclick="${retryAction ? 'window.' + retryAction.name + '()' : 'location.reload()'}" 
                style="padding: 10px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.3s;"
                onmouseenter="this.style.background='#7b93f0'"
                onmouseleave="this.style.background='#667eea'">
            <i class="fas fa-sync-alt" style="margin-right: 8px;"></i>
            Попробовать снова
        </button>
    `;
    
    return container;
}

// Экспортируем в глобальную область для использования в HTML
if (typeof window !== 'undefined') {
    window.createSkeletonCards = createSkeletonCards;
    window.createEmptyState = createEmptyState;
    window.createErrorState = createErrorState;
}