// public/js/modules/footer.js

export function setupFooter() {
    const footerLinks = document.querySelectorAll('.footer-column ul li a');
    
    if (footerLinks.length === 0) {
        console.warn('⚠️ Ссылки футера не найдены');
        return;
    }
    
    footerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Если у ссылки есть onclick, пропускаем (обработка уже настроена)
            if (link.getAttribute('onclick')) return;
            
            e.preventDefault();
            
            // Используем глобальную функцию showToast
            if (window.showToast) {
                window.showToast('🔗 Функция в разработке');
            } else {
                console.log('🔗 Функция в разработке');
            }
        });
    });
    
    console.log('✅ Обработчики футера добавлены:', footerLinks.length);
}