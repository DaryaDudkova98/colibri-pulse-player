// public/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 Страница входа загружена');
    
    // Проверяем, авторизован ли уже пользователь
    const userData = localStorage.getItem('colibri_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.isLoggedIn) {
                // Если уже авторизован - перенаправляем на главную
                window.location.href = '/';
                return;
            }
        } catch (e) {}
    }
    
    // Переключение табов
    const tabs = document.querySelectorAll('.login-tab');
    const panels = {
        login: document.getElementById('loginPanel'),
        register: document.getElementById('registerPanel')
    };
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Убираем активный класс у всех табов
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Показываем нужную панель
            const target = tab.dataset.tab;
            Object.keys(panels).forEach(key => {
                panels[key].classList.toggle('active', key === target);
                panels[key].style.display = key === target ? 'flex' : 'none';
            });
        });
    });
    
    // Обработка формы входа
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showToast('❌ Пожалуйста, заполните все поля');
            return;
        }
        
        console.log('🔑 Попытка входа:', { email });
        
        // Показываем индикатор загрузки
        const submitBtn = e.target.querySelector('.btn-login');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ Вход...';
        submitBtn.disabled = true;
        
        // Имитация запроса к серверу
        setTimeout(() => {
            // Сохраняем состояние входа
            const userData = {
                email: email,
                name: email.split('@')[0],
                isLoggedIn: true,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('colibri_user', JSON.stringify(userData));
            
            showToast('✅ Добро пожаловать, ' + userData.name + '!');
            
            // Обновляем хедер на главной странице (если страница открыта в том же окне)
            if (window.opener && !window.opener.closed) {
                try {
                    if (typeof window.opener.updateHeader === 'function') {
                        window.opener.updateHeader();
                    }
                } catch (e) {
                    console.log('Не удалось обновить хедер в родительском окне');
                }
            }
            
            // Перенаправляем на главную через секунду
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
            
        }, 1500);
    });
    
    // Обработка формы регистрации
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;
        
        if (!name || !email || !password || !confirm) {
            showToast('❌ Пожалуйста, заполните все поля');
            return;
        }
        
        if (password !== confirm) {
            showToast('❌ Пароли не совпадают!');
            return;
        }
        
        if (password.length < 6) {
            showToast('❌ Пароль должен быть минимум 6 символов!');
            return;
        }
        
        if (!email.includes('@') || !email.includes('.')) {
            showToast('❌ Введите корректный email адрес');
            return;
        }
        
        console.log('📝 Регистрация:', { name, email });
        
        // Показываем индикатор загрузки
        const submitBtn = e.target.querySelector('.btn-register');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ Создание...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            // Сохраняем данные пользователя
            const userData = {
                name: name,
                email: email,
                isLoggedIn: true,
                registeredAt: new Date().toISOString()
            };
            localStorage.setItem('colibri_user', JSON.stringify(userData));
            
            showToast('✅ Аккаунт создан! Добро пожаловать, ' + name + '!');
            
            // Обновляем хедер на главной странице
            if (window.opener && !window.opener.closed) {
                try {
                    if (typeof window.opener.updateHeader === 'function') {
                        window.opener.updateHeader();
                    }
                } catch (e) {
                    console.log('Не удалось обновить хедер в родительском окне');
                }
            }
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
            
        }, 1500);
    });
});

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

// Переключение видимости пароля
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Вход через Google
function googleLogin() {
    console.log('🔑 Вход через Google');
    showToast('⏳ Перенаправление на Google...');
    
    // Блокируем кнопку
    const googleBtn = document.querySelector('.btn-google');
    if (googleBtn) {
        googleBtn.disabled = true;
        googleBtn.style.opacity = '0.5';
        googleBtn.style.cursor = 'not-allowed';
    }
    
    setTimeout(() => {
        // Имитация входа через Google
        const userData = {
            name: 'Google User',
            email: 'user@gmail.com',
            isLoggedIn: true,
            isGoogle: true,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('colibri_user', JSON.stringify(userData));
        
        showToast('✅ Вход через Google выполнен!');
        
        // Обновляем хедер на главной странице
        if (window.opener && !window.opener.closed) {
            try {
                if (typeof window.opener.updateHeader === 'function') {
                    window.opener.updateHeader();
                }
            } catch (e) {
                console.log('Не удалось обновить хедер в родительском окне');
            }
        }
        
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
    }, 1500);
}

// Toast уведомление (для страницы входа)
function showToast(message) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(20px);
        color: white;
        padding: 14px 28px;
        border-radius: 12px;
        font-size: 14px;
        z-index: 9999;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
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
    }, 3000);
}