// public/js/modules/episode-details.js

/**
 * Модуль отображения деталей эпизода
 */

export async function showEpisodeDetails(episodeId, {
    resultsContainer,
    formatTime,
    handleMainPlay,
    handleMainPause,
    handleMainTimeUpdate,
    handleMainLoaded,
    updateProgress,
    updatePlayerInfo,
    syncToFloatingPlayer,
    playInFloatingPlayer,
    loadInitialPodcasts,
    playerVisible,
    playerAudio,
    showToast
} = {}) {
    try {
        console.log('📊 Загрузка деталей эпизода:', episodeId);
        const episode = await window.apiClient.getEpisode(episodeId);
        console.log('📊 Детали эпизода:', episode);

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

        const episodeData = {
            id: episode.id,
            title_original: episode.title_original || episode.title || 'Эпизод',
            image: episode.image || episode.thumbnail || '',
            publisher: episode.publisher || episode.podcast_title_original || '',
            audio: episode.audio || episode.audio_url || '',
            thumbnail: episode.thumbnail || episode.image || ''
        };

        // СОЗДАЕМ ГЛОБАЛЬНЫЙ АУДИО ТОЛЬКО ОДИН РАЗ
        if (!window.mainAudio) {
            window.mainAudio = new Audio();
            window.mainAudio.id = 'episodeAudioPlayer';
            window.mainAudio.addEventListener('play', () => {
                if (window.currentListeningEpisode) {
                    if (handleMainPlay) handleMainPlay(window.currentListeningEpisode.id);
                    const uiAudio = document.getElementById('episodeAudioPlayerUI');
                    if (uiAudio) {
                        uiAudio.currentTime = window.mainAudio.currentTime;
                        uiAudio.play().catch(() => { });
                    }
                    document.getElementById('playerPlayBtn').textContent = '⏸';
                }
            });
            window.mainAudio.addEventListener('pause', () => {
                if (window.currentListeningEpisode) {
                    if (handleMainPause) handleMainPause(window.currentListeningEpisode.id);
                    const uiAudio = document.getElementById('episodeAudioPlayerUI');
                    if (uiAudio) {
                        uiAudio.pause();
                    }
                    document.getElementById('playerPlayBtn').textContent = '▶';
                }
            });
            window.mainAudio.addEventListener('timeupdate', () => {
                if (window.currentListeningEpisode) {
                    if (handleMainTimeUpdate) handleMainTimeUpdate(window.currentListeningEpisode.id);
                    const uiAudio = document.getElementById('episodeAudioPlayerUI');
                    if (uiAudio) {
                        uiAudio.currentTime = window.mainAudio.currentTime;
                    }
                    if (updateProgress) updateProgress();
                }
            });
            window.mainAudio.addEventListener('loadedmetadata', () => {
                if (window.currentListeningEpisode) {
                    if (handleMainLoaded) handleMainLoaded(window.currentListeningEpisode.id);
                    document.getElementById('playerTotalTime').textContent = formatTime ? formatTime(window.mainAudio.duration) : '0:00';
                }
            });
            window.mainAudio.addEventListener('ended', () => {
                document.getElementById('playerPlayBtn').textContent = '▶';
                const uiAudio = document.getElementById('episodeAudioPlayerUI');
                if (uiAudio) {
                    uiAudio.currentTime = 0;
                }
            });
        }

        if (window.mainAudio.src !== episode.audio) {
            const wasPlaying = !window.mainAudio.paused;
            window.mainAudio.src = episode.audio;
            window.mainAudio.load();
            if (wasPlaying) {
                window.mainAudio.play().catch(() => { });
            }
        }

        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border-radius: 16px; padding: 30px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);">
                    <button onclick="window.loadInitialPodcasts()" style="background: none; border: none; color: #667eea; cursor: pointer; font-size: 16px; margin-bottom: 20px; transition: color 0.3s;" onmouseenter="this.style.color='#a0b8ee'" onmouseleave="this.style.color='#667eea'">← Назад</button>
                    ${episode.image ? `<img src="${episode.image}" alt="${episode.title}" style="max-width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 16px rgba(0,0,0,0.2);" />` : ''}
                    <h2 style="color: #f0f2f5; font-size: 24px; margin-bottom: 10px;">${episode.title_original || 'Без названия'}</h2>
                    <p style="color: #b8c5d6; font-size: 14px;"><strong>Подкаст:</strong> ${episode.podcast_title_original || 'Неизвестно'}</p>
                    ${episode.pub_date_ms ? `<p style="color: #8899aa; font-size: 13px;"><strong>Дата:</strong> ${new Date(episode.pub_date_ms).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
                    ${episode.description_original ? `<div style="margin: 20px 0; line-height: 1.8; color: #c8d8e8;">${episode.description_original}</div>` : ''}
                    ${episode.audio ? `
                        <div style="margin-top: 20px; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px;">
                            <p style="color: #8899aa; font-size: 13px; margin-bottom: 10px;">🎧 Прослушать эпизод:</p>
                            <audio controls 
                                   style="width: 100%; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.05);" 
                                   id="episodeAudioPlayerUI">
                                <source src="${episode.audio}" type="audio/mpeg">
                                Ваш браузер не поддерживает аудио
                            </audio>
                            <button onclick="window.playInFloatingPlayer('${episode.id}')" 
                                    style="margin-top: 10px; padding: 8px 20px; background: rgba(102,126,234,0.2); border: 1px solid rgba(102,126,234,0.3); border-radius: 8px; color: #a0b8ee; cursor: pointer; transition: all 0.3s; font-size: 13px;"
                                    onmouseenter="this.style.background='rgba(102,126,234,0.35)'"
                                    onmouseleave="this.style.background='rgba(102,126,234,0.2)'">
                                🎵 Слушать в плавающем плеере
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        const uiAudio = document.getElementById('episodeAudioPlayerUI');
        if (uiAudio) {
            uiAudio.volume = 0;
            uiAudio.currentTime = window.mainAudio.currentTime || 0;

            uiAudio.addEventListener('play', () => {
                if (window.mainAudio && window.mainAudio.src) {
                    window.mainAudio.play().catch(() => { });
                }
            });
            uiAudio.addEventListener('pause', () => {
                if (window.mainAudio) {
                    window.mainAudio.pause();
                }
            });
            uiAudio.addEventListener('seeked', () => {
                if (window.mainAudio) {
                    window.mainAudio.currentTime = uiAudio.currentTime;
                }
            });
            window.mainAudio.addEventListener('timeupdate', () => {
                if (uiAudio && Math.abs(uiAudio.currentTime - window.mainAudio.currentTime) > 0.1) {
                    uiAudio.currentTime = window.mainAudio.currentTime;
                }
            });
        }

        window.currentEpisodeData = episodeData;

        if (playerVisible && updatePlayerInfo) {
            updatePlayerInfo(episodeData);
            document.getElementById('playerPlayBtn').textContent = window.mainAudio?.paused ? '▶' : '⏸';
            if (window.mainAudio && formatTime) {
                document.getElementById('playerCurrentTime').textContent = formatTime(window.mainAudio.currentTime || 0);
                document.getElementById('playerTotalTime').textContent = formatTime(window.mainAudio.duration || 0);
                const progress = window.mainAudio.duration ? (window.mainAudio.currentTime / window.mainAudio.duration) * 100 : 0;
                document.getElementById('playerProgressFill').style.width = progress + '%';
            }
        }

        if (playerVisible && window.mainAudio && syncToFloatingPlayer) {
            syncToFloatingPlayer(window.mainAudio);
        }

    } catch (error) {
        console.error('❌ Ошибка загрузки эпизода:', error);
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: rgba(220,53,69,0.1); border-radius: 12px; border: 1px solid rgba(220,53,69,0.2);">
                    <h3 style="color: #ff6b7a;">❌ Не удалось загрузить детали эпизода</h3>
                    <p style="color: #8899aa;">${error.message || 'Пожалуйста, попробуйте позже'}</p>
                    <button onclick="window.loadInitialPodcasts()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        ← Вернуться к популярным подкастам
                    </button>
                </div>
            `;
        }
        if (showToast) showToast('❌ Не удалось загрузить эпизод');
    }
}