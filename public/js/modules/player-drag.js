// public/js/modules/player-drag.js

/**
 * Модуль управления перетаскиванием и состоянием плеера
 */

// ===== DRAG & DROP =====
export function startDrag(e, {
    dragOffsetX,
    dragOffsetY,
    isDragging,
    movePlayer,
    savePlayerPosition
} = {}) {
    if (e.button !== 0) return;
    const player = document.getElementById('floatingPlayer');
    const rect = player.getBoundingClientRect();
    dragOffsetX.value = e.clientX - rect.left;
    dragOffsetY.value = e.clientY - rect.top;
    isDragging.value = true;
    player.classList.add('dragging');
    e.preventDefault();
}

export function onDrag(e, {
    isDragging,
    movePlayer
} = {}) {
    if (!isDragging.value) return;
    movePlayer(e.clientX, e.clientY);
}

export function startDragTouch(e, {
    dragOffsetX,
    dragOffsetY,
    isDragging,
    movePlayer
} = {}) {
    const touch = e.touches[0];
    const player = document.getElementById('floatingPlayer');
    const rect = player.getBoundingClientRect();
    dragOffsetX.value = touch.clientX - rect.left;
    dragOffsetY.value = touch.clientY - rect.top;
    isDragging.value = true;
    player.classList.add('dragging');
    e.preventDefault();
}

export function onDragTouch(e, {
    isDragging,
    movePlayer
} = {}) {
    if (!isDragging.value) return;
    const touch = e.touches[0];
    movePlayer(touch.clientX, touch.clientY);
}

export function endDrag({
    isDragging,
    savePlayerPosition
} = {}) {
    if (!isDragging.value) return;
    isDragging.value = false;
    document.getElementById('floatingPlayer').classList.remove('dragging');
    savePlayerPosition();
}

export function endDragTouch({
    isDragging,
    savePlayerPosition
} = {}) {
    if (!isDragging.value) return;
    isDragging.value = false;
    document.getElementById('floatingPlayer').classList.remove('dragging');
    savePlayerPosition();
}

export function movePlayer(x, y, {
    dragOffsetX,
    dragOffsetY,
    playerPosition,
    windowWidth,
    windowHeight
} = {}) {
    const player = document.getElementById('floatingPlayer');
    const maxX = windowWidth || window.innerWidth - player.offsetWidth;
    const maxY = windowHeight || window.innerHeight - player.offsetHeight;
    let newX = Math.max(0, Math.min(maxX, x - dragOffsetX.value));
    let newY = Math.max(0, Math.min(maxY, y - dragOffsetY.value));
    player.style.right = 'auto';
    player.style.left = newX + 'px';
    player.style.top = newY + 'px';
    player.style.bottom = 'auto';
    playerPosition.value = { x: newX, y: newY };
}

export function savePlayerPosition({
    playerPosition
} = {}) {
    try {
        localStorage.setItem('colibri_player_position', JSON.stringify(playerPosition.value));
    } catch (e) { }
}

// ===== УПРАВЛЕНИЕ СОСТОЯНИЕМ =====
export function savePlayerState({
    currentEpisodeData,
    playerAudio,
    isMinimized,
    playerPosition
} = {}) {
    if (!currentEpisodeData.value) return;
    try {
        localStorage.setItem('colibri_player_state', JSON.stringify({
            episode: currentEpisodeData.value,
            currentTime: playerAudio.value ? playerAudio.value.currentTime : 0,
            isPlaying: playerAudio.value ? !playerAudio.value.paused : false,
            isMinimized: isMinimized.value,
            position: playerPosition.value
        }));
    } catch (e) { }
}

export function restorePlayerState({
    currentEpisodeData,
    isMinimized,
    playerPosition,
    playerAudio,
    showPlayer,
    formatTime
} = {}) {
    try {
        const saved = localStorage.getItem('colibri_player_state');
        if (!saved) return;
        const state = JSON.parse(saved);
        if (state.episode && state.episode.audio) {
            currentEpisodeData.value = state.episode;
            isMinimized.value = state.isMinimized || false;
            const player = document.getElementById('floatingPlayer');
            if (state.position) {
                player.style.right = 'auto';
                player.style.left = state.position.x + 'px';
                player.style.top = state.position.y + 'px';
                player.style.bottom = 'auto';
                playerPosition.value = state.position;
            }
            if (isMinimized.value) {
                player.classList.add('minimized');
            }
            if (showPlayer) {
                showPlayer(state.episode);
            }
            if (state.currentTime && playerAudio.value) {
                playerAudio.value.currentTime = state.currentTime;
            }
            if (state.isPlaying && playerAudio.value) {
                playerAudio.value.play().catch(err => console.log('Ошибка восстановления воспроизведения:', err));
            }
        }
    } catch (e) {
        console.log('Ошибка восстановления плеера:', e);
    }
}