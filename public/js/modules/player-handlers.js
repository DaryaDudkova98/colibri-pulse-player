// public/js/modules/player-handlers.js

/**
 * Обработчики событий основного аудиоплеера
 */

export function handleMainPlay(episodeId, {
    getRecentViews,
    addRecentView,
    showToast,
    updateFavoriteCount,
    playerVisible,
    playerAudio,
    syncToFloatingPlayer
} = {}) {
    const mainAudio = document.getElementById('episodeAudioPlayer');
    if (!mainAudio) return;
    console.log('▶️ handleMainPlay вызван для:', episodeId);

    const recent = getRecentViews ? getRecentViews() : [];
    const exists = recent.some(item => item.id === episodeId);
    if (!exists && window.currentListeningEpisode) {
        const episode = window.currentListeningEpisode;
        if (addRecentView) {
            addRecentView({
                id: episode.id,
                title_original: episode.title,
                image: episode.image,
                publisher: episode.publisher,
                audio: episode.audio,
                thumbnail: episode.thumbnail
            });
        }
        if (showToast) showToast('🎧 Добавлено в недавние просмотры');
        if (updateFavoriteCount) updateFavoriteCount();
    }

    if (playerVisible && playerAudio && syncToFloatingPlayer) {
        syncToFloatingPlayer(mainAudio);
    }
}

export function handleMainPause(episodeId, {
    getRecentViews,
    saveRecentViews,
    renderRecentViews,
    playerVisible,
    playerAudio,
    syncToFloatingPlayer
} = {}) {
    const mainAudio = document.getElementById('episodeAudioPlayer');
    if (!mainAudio) return;
    console.log('⏸️ handleMainPause вызван для:', episodeId);

    if (mainAudio.currentTime > 5) {
        const recent = getRecentViews ? getRecentViews() : [];
        const exists = recent.some(item => item.id === episodeId);
        if (exists) {
            let recentList = getRecentViews ? getRecentViews() : [];
            const index = recentList.findIndex(item => item.id === episodeId);
            if (index !== -1) {
                recentList[index].progress = Math.round(mainAudio.currentTime);
                if (saveRecentViews) saveRecentViews(recentList);
                if (renderRecentViews) renderRecentViews();
            }
        }
    }

    if (playerVisible && playerAudio && syncToFloatingPlayer) {
        syncToFloatingPlayer(mainAudio);
    }
}

export function handleMainTimeUpdate(episodeId, {
    getRecentViews,
    addRecentView,
    saveRecentViews,
    renderRecentViews,
    showToast,
    updateFavoriteCount,
    playerVisible,
    playerAudio,
    syncToFloatingPlayer
} = {}) {
    const mainAudio = document.getElementById('episodeAudioPlayer');
    if (!mainAudio) return;

    if (mainAudio.currentTime > 5 && window.currentListeningEpisode) {
        const episode = window.currentListeningEpisode;
        const recent = getRecentViews ? getRecentViews() : [];
        const exists = recent.some(item => item.id === episodeId);

        if (exists) {
            let recentList = getRecentViews ? getRecentViews() : [];
            const index = recentList.findIndex(item => item.id === episodeId);
            if (index !== -1) {
                recentList[index].progress = Math.round(mainAudio.currentTime);
                if (saveRecentViews) saveRecentViews(recentList);
                if (renderRecentViews) renderRecentViews();
            }
        } else {
            if (addRecentView) {
                addRecentView({
                    id: episode.id,
                    title_original: episode.title,
                    image: episode.image,
                    publisher: episode.publisher,
                    audio: episode.audio,
                    thumbnail: episode.thumbnail,
                    progress: Math.round(mainAudio.currentTime)
                });
            }
            if (!episode.hasStarted) {
                episode.hasStarted = true;
                if (showToast) showToast('🎧 Добавлено в недавние просмотры');
                if (updateFavoriteCount) updateFavoriteCount();
            }
        }
    }

    if (playerVisible && playerAudio && syncToFloatingPlayer) {
        syncToFloatingPlayer(mainAudio);
    }
}

export function handleMainLoaded(episodeId, {
    getRecentViews,
    playerVisible,
    playerAudio,
    syncToFloatingPlayer
} = {}) {
    const mainAudio = document.getElementById('episodeAudioPlayer');
    if (!mainAudio) return;
    console.log('📥 handleMainLoaded вызван для:', episodeId);

    const recent = getRecentViews ? getRecentViews() : [];
    const found = recent.find(item => item.id === episodeId);
    if (found && found.progress > 0) {
        mainAudio.currentTime = found.progress;
        console.log(`⏱️ Восстановлен прогресс: ${found.progress} секунд`);
    }

    if (playerVisible && playerAudio && syncToFloatingPlayer) {
        syncToFloatingPlayer(mainAudio);
    }
}