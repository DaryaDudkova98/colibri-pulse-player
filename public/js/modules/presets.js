// public/js/modules/presets.js

export function setupPresets() {
    const presetButtons = document.querySelectorAll('.preset-btn');
    if (!presetButtons.length) {
        console.warn('⚠️ Кнопки пресетов не найдены');
        return;
    }
    
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.dataset.query;
            if (query) {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = query;
                    window.handleSearch?.();
                    setTimeout(() => {
                        document.getElementById('resultsContainer')?.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }, 300);
                }
            }
        });
    });
    
    console.log('✅ Пресеты настроены');
}