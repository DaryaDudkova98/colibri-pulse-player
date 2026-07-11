// public/js/modules/utils.js

// Форматирование времени
export function formatTime(seconds) {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Toast уведомления
export function showToast(message) {
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

// Показать/скрыть загрузку
export function showLoadingMore(container) {
    const existing = document.getElementById('loadingMore');
    if (existing) existing.remove();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingMore';
    loadingDiv.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 20px;';
    loadingDiv.innerHTML = `
        <div class="spinner"></div>
        <p style="margin-top: 10px; color: #666;">Загрузка...</p>
    `;
    container.appendChild(loadingDiv);
}

export function showLoadMoreError(error) {
    const existing = document.getElementById('loadMoreBtn');
    if (existing) existing.remove();
    const errorDiv = document.createElement('div');
    errorDiv.id = 'loadMoreBtn';
    errorDiv.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 20px;';
    errorDiv.innerHTML = `
        <p style="color: #dc3545;">❌ Ошибка загрузки: ${error.message || 'Попробуйте позже'}</p>
        <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            🔄 Обновить
        </button>
    `;
    document.getElementById('resultsContainer')?.appendChild(errorDiv);
}