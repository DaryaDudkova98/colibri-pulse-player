// public/js/modules/floating-player.js

/**
 * Модуль плавающего аудиоплеера
 */

// ========== СОСТОЯНИЕ ПЛЕЕРА ==========
let playerAudio = null;
let playerVisible = false;
let isSyncing = false;

// Экспортируем для использования в других модулях
export { playerAudio, playerVisible };

// Для передачи по ссылке в функции drag:
export const dragState = {
    isDragging: { value: false },
    dragOffsetX: { value: 0 },
    dragOffsetY: { value: 0 },
    playerPosition: { value: { x: 0, y: 0 } },
    isMinimized: { value: false },
    currentEpisodeData: { value: null }
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========
export function initFloatingPlayer({
    startDrag,
    onDrag,
    startDragTouch,
    onDragTouch,
    endDrag,
    endDragTouch,
    movePlayer,
    savePlayerPosition,
    savePlayerState,
    getRecentViews,
    addRecentView,
    renderRecentViews,
    showToast,
    updateFavoriteCount,
    showEpisodeDetails,
    formatTime,
    updateProgress,
    updateTotalTime,
    handleProgressClick,
    playPrevious,
    playNext,
    onAudioEnded,
    togglePlay,
    togglePlayerMinimize,
    closePlayer,
    syncToFloatingPlayer,
    updatePlayerInfo,
    showPlayer
} = {}) {
    const player = document.getElementById('floatingPlayer');
    const playBtn = document.getElementById('playerPlayBtn');
    const toggleBtn = document.getElementById('playerToggle');
    const closeBtn = document.getElementById('playerClose');
    const progressBar = document.getElementById('playerProgressBar');
    const prevBtn = document.getElementById('playerPrev');
    const nextBtn = document.getElementById('playerNext');
    const dragHandle = document.getElementById('playerDragHandle');

    if (!window.mainAudio) {
        window.mainAudio = new Audio();
        window.mainAudio.id = 'episodeAudioPlayer';
    }
    playerAudio = window.mainAudio;

    playBtn.addEventListener('click', togglePlay);
    toggleBtn.addEventListener('click', togglePlayerMinimize);
    closeBtn.addEventListener('click', closePlayer);
    progressBar.addEventListener('click', handleProgressClick);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);

    // Используем функции из модуля player-drag
    dragHandle.addEventListener('mousedown', (e) => startDrag(e, {
        dragOffsetX: dragState.dragOffsetX,
        dragOffsetY: dragState.dragOffsetY,
        isDragging: dragState.isDragging,
        movePlayer: (x, y) => movePlayer(x, y, {
            dragOffsetX: dragState.dragOffsetX,
            dragOffsetY: dragState.dragOffsetY,
            playerPosition: dragState.playerPosition
        }),
        savePlayerPosition: () => savePlayerPosition({
            playerPosition: dragState.playerPosition
        })
    }));

    document.addEventListener('mousemove', (e) => onDrag(e, {
        isDragging: dragState.isDragging,
        movePlayer: (x, y) => movePlayer(x, y, {
            dragOffsetX: dragState.dragOffsetX,
            dragOffsetY: dragState.dragOffsetY,
            playerPosition: dragState.playerPosition
        })
    }));

    document.addEventListener('mouseup', () => endDrag({
        isDragging: dragState.isDragging,
        savePlayerPosition: () => savePlayerPosition({
            playerPosition: dragState.playerPosition
        })
    }));

    dragHandle.addEventListener('touchstart', (e) => startDragTouch(e, {
        dragOffsetX: dragState.dragOffsetX,
        dragOffsetY: dragState.dragOffsetY,
        isDragging: dragState.isDragging,
        movePlayer: (x, y) => movePlayer(x, y, {
            dragOffsetX: dragState.dragOffsetX,
            dragOffsetY: dragState.dragOffsetY,
            playerPosition: dragState.playerPosition
        })
    }));

    document.addEventListener('touchmove', (e) => onDragTouch(e, {
        isDragging: dragState.isDragging,
        movePlayer: (x, y) => movePlayer(x, y, {
            dragOffsetX: dragState.dragOffsetX,
            dragOffsetY: dragState.dragOffsetY,
            playerPosition: dragState.playerPosition
        })
    }));

    document.addEventListener('touchend', () => endDragTouch({
        isDragging: dragState.isDragging,
        savePlayerPosition: () => savePlayerPosition({
            playerPosition: dragState.playerPosition
        })
    }));

    playerAudio.addEventListener('timeupdate', updateProgress);
    playerAudio.addEventListener('loadedmetadata', updateTotalTime);
    playerAudio.addEventListener('ended', onAudioEnded);

    playerAudio.addEventListener('play', () => {
        document.getElementById('playerPlayBtn').textContent = '⏸';
        if (window.currentListeningEpisode) {
            const episode = window.currentListeningEpisode;
            const recent = getRecentViews ? getRecentViews() : [];
            const exists = recent.some(item => item.id === episode.id);
            if (!exists) {
                addRecentView({
                    id: episode.id,
                    title_original: episode.title,
                    image: episode.image,
                    publisher: episode.publisher,
                    audio: episode.audio,
                    thumbnail: episode.thumbnail
                }, {
                    renderRecentViews: () => renderRecentViews({ showEpisodeDetails, formatTime }),
                    showToast,
                    updateFavoriteCount
                });
                showToast('🎧 Добавлено в недавние просмотры');
                updateFavoriteCount();
            }
        }
    });
    playerAudio.addEventListener('pause', () => {
        document.getElementById('playerPlayBtn').textContent = '▶';
    });

    // Восстанавливаем позицию из dragState
    const savedPosition = localStorage.getItem('colibri_player_position');
    if (savedPosition) {
        try {
            const pos = JSON.parse(savedPosition);
            player.style.right = 'auto';
            player.style.left = pos.x + 'px';
            player.style.top = pos.y + 'px';
            player.style.bottom = 'auto';
            dragState.playerPosition.value = pos;
        } catch (e) { }
    }
}

// ========== СИНХРОНИЗАЦИЯ ==========
export function syncToMainPlayer() {
    if (isSyncing) return;
    isSyncing = true;
    try {
        const mainAudio = document.getElementById('episodeAudioPlayer');
        if (!mainAudio) {
            isSyncing = false;
            return;
        }
        if (mainAudio.src && playerAudio.src && mainAudio.src === playerAudio.src) {
            if (Math.abs(mainAudio.currentTime - playerAudio.currentTime) > 0.5) {
                mainAudio.currentTime = playerAudio.currentTime;
            }
            if (mainAudio.paused !== playerAudio.paused) {
                if (playerAudio.paused) {
                    mainAudio.pause();
                } else {
                    mainAudio.play().catch(() => { });
                }
            }
        }
    } catch (e) {
        console.log('Ошибка синхронизации:', e);
    }
    isSyncing = false;
}

export function syncToFloatingPlayer(mainAudio, {
    updatePlayerInfo,
    savePlayerState
} = {}) {
    if (isSyncing || !playerVisible) return;
    isSyncing = true;
    try {
        if (!mainAudio || !mainAudio.src) {
            isSyncing = false;
            return;
        }

        if (playerAudio.src !== mainAudio.src) {
            playerAudio.src = mainAudio.src;
            playerAudio.load();
        }

        if (window.currentEpisodeData) {
            updatePlayerInfo(window.currentEpisodeData);
        }

        if (window.currentEpisodeData) {
            window.currentListeningEpisode = {
                id: window.currentEpisodeData.id,
                title: window.currentEpisodeData.title_original || 'Эпизод',
                image: window.currentEpisodeData.image || '',
                publisher: window.currentEpisodeData.publisher || '',
                audio: window.currentEpisodeData.audio || '',
                thumbnail: window.currentEpisodeData.thumbnail || '',
                hasStarted: false,
                progress: 0
            };
        }

        if (Math.abs(playerAudio.currentTime - mainAudio.currentTime) > 0.5) {
            playerAudio.currentTime = mainAudio.currentTime;
        }

        if (playerAudio.paused !== mainAudio.paused) {
            if (mainAudio.paused) {
                playerAudio.pause();
            } else {
                playerAudio.play().catch(() => { });
            }
        }

        document.getElementById('playerPlayBtn').textContent = mainAudio.paused ? '▶' : '⏸';

    } catch (e) {
        console.log('Ошибка синхронизации в плавающий плеер:', e);
    }
    isSyncing = false;
}

// ========== УПРАВЛЕНИЕ ПЛЕЕРОМ ==========
export function updatePlayerInfo(episode, {
    savePlayerState
} = {}) {
    const cover = document.getElementById('playerCover');
    const title = document.getElementById('playerTitle');
    const publisher = document.getElementById('playerPublisher');

    if (cover) {
        cover.src = episode.image || episode.thumbnail || '';
        cover.alt = episode.title_original || episode.title || 'Обложка';
    }
    if (title) {
        title.textContent = episode.title_original || episode.title || 'Без названия';
    }
    if (publisher) {
        publisher.textContent = episode.publisher || episode.podcast_title_original || 'Подкаст';
    }

    dragState.currentEpisodeData.value = episode;
    if (savePlayerState) savePlayerState();
}

export function showPlayer(episode, {
    formatTime,
    updatePlayerInfo,
    savePlayerState
} = {}) {
    if (!episode || !episode.audio) return;

    console.log('🎵 showPlayer вызван для:', episode.title_original);

    window.currentEpisodeData = episode;
    window.currentListeningEpisode = {
        id: episode.id,
        title: episode.title_original || episode.title || 'Эпизод',
        image: episode.image || episode.thumbnail || '',
        publisher: episode.publisher || episode.podcast_title_original || '',
        audio: episode.audio || episode.audio_url || '',
        thumbnail: episode.thumbnail || episode.image || '',
        hasStarted: false,
        progress: 0
    };

    dragState.currentEpisodeData.value = episode;
    const player = document.getElementById('floatingPlayer');

    updatePlayerInfo(episode);

    if (!window.mainAudio) {
        window.mainAudio = new Audio();
        window.mainAudio.id = 'episodeAudioPlayer';
    }
    playerAudio = window.mainAudio;

    if (playerAudio.src !== episode.audio) {
        playerAudio.src = episode.audio;
        playerAudio.load();
        playerAudio.addEventListener('loadedmetadata', function onLoaded() {
            document.getElementById('playerTotalTime').textContent = formatTime(playerAudio.duration);
            playerAudio.removeEventListener('loadedmetadata', onLoaded);
        });
    }

    player.style.display = 'block';
    playerVisible = true;
    if (savePlayerState) savePlayerState();
}

export function togglePlay() {
    if (!playerAudio || !playerAudio.src) return;
    if (playerAudio.paused) {
        playerAudio.play().catch(err => console.log('Ошибка воспроизведения:', err));
    } else {
        playerAudio.pause();
    }
}

export function togglePlayerMinimize({ savePlayerState } = {}) {
    const player = document.getElementById('floatingPlayer');
    dragState.isMinimized.value = !dragState.isMinimized.value;
    player.classList.toggle('minimized', dragState.isMinimized.value);
    const icon = document.querySelector('.toggle-icon');
    if (icon) {
        icon.classList.toggle('minimized', dragState.isMinimized.value);
    }
    if (savePlayerState) savePlayerState();
}

export function closePlayer() {
    if (playerAudio) {
        playerAudio.pause();
        playerAudio.currentTime = 0;
    }
    document.getElementById('floatingPlayer').style.display = 'none';
    playerVisible = false;
    localStorage.removeItem('colibri_player_state');
}

// ========== ПРОГРЕСС И ВРЕМЯ ==========
export function updateProgress({ formatTime } = {}) {
    if (!playerAudio.duration) return;
    const progress = (playerAudio.currentTime / playerAudio.duration) * 100;
    document.getElementById('playerProgressFill').style.width = progress + '%';
    document.getElementById('playerCurrentTime').textContent = formatTime(playerAudio.currentTime);
}

export function updateTotalTime({ formatTime } = {}) {
    document.getElementById('playerTotalTime').textContent = formatTime(playerAudio.duration);
}

export function handleProgressClick(e) {
    if (!playerAudio || !playerAudio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * playerAudio.duration;
    playerAudio.currentTime = newTime;
}

// ========== КНОПКИ НАВИГАЦИИ ==========
export function playPrevious({ showToast } = {}) {
    if (showToast) showToast('⏮️ Функция в разработке');
}

export function playNext({ showToast } = {}) {
    if (showToast) showToast('⏭️ Функция в разработке');
}

export function onAudioEnded() {
    document.getElementById('playerPlayBtn').textContent = '▶';
}

// ========== СОХРАНЕНИЕ СОСТОЯНИЯ ==========
export function savePlayerState() {
    if (!dragState.currentEpisodeData.value) return;
    try {
        localStorage.setItem('colibri_player_state', JSON.stringify({
            episode: dragState.currentEpisodeData.value,
            currentTime: playerAudio ? playerAudio.currentTime : 0,
            isPlaying: playerAudio ? !playerAudio.paused : false,
            isMinimized: dragState.isMinimized.value,
            position: dragState.playerPosition.value
        }));
    } catch (e) { }
}

export function restorePlayerState({ showPlayer, formatTime } = {}) {
    try {
        const saved = localStorage.getItem('colibri_player_state');
        if (!saved) return;
        const state = JSON.parse(saved);
        if (state.episode && state.episode.audio) {
            dragState.currentEpisodeData.value = state.episode;
            dragState.isMinimized.value = state.isMinimized || false;
            const player = document.getElementById('floatingPlayer');
            if (state.position) {
                player.style.right = 'auto';
                player.style.left = state.position.x + 'px';
                player.style.top = state.position.y + 'px';
                player.style.bottom = 'auto';
                dragState.playerPosition.value = state.position;
            }
            if (dragState.isMinimized.value) {
                player.classList.add('minimized');
            }
            showPlayer(state.episode, { formatTime });
            if (state.currentTime && playerAudio) {
                playerAudio.currentTime = state.currentTime;
            }
            if (state.isPlaying && playerAudio) {
                playerAudio.play().catch(err => console.log('Ошибка восстановления воспроизведения:', err));
            }
        }
    } catch (e) {
        console.log('Ошибка восстановления плеера:', e);
    }
}