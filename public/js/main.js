// public/js/main.js

console.log('🔥🔥🔥 MAIN.JS НАЧАЛО ВЫПОЛНЕНИЯ 🔥🔥🔥');
import PaginationManager from './modules/pagination.js';
import { setupPresets } from './modules/presets.js';
import { setupFilters, getFilterParams } from './modules/filters.js';
import {
    getFavorites,
    saveFavorites,
    isInFavorites,
    toggleFavorite,
    showFavorites,
    removeFromFavorites,
    clearAllFavorites,
    updateFavoriteCount,
    updateFavoritesBadge
} from './modules/favorites.js';
import { setupFooter } from './modules/footer.js';
import { createSkeletonCards, createEmptyState, createErrorState } from './modules/skeleton.js';
import { loadInitialPodcasts as loadPodcasts } from './modules/load-podcasts.js';
import { createPodcastCard } from './modules/cards.js';
import { showProfileMenu, closeProfileModal, closeProfileModalOnEscape } from './modules/profile.js';
import { updateHeader, logoutUser } from './modules/header.js';
import { showPodcastInfo } from './modules/info-panel.js';
import { setupSidebar } from './modules/sidebar.js';
import {
    getRecentViews,
    saveRecentViews,
    addRecentView,
    renderRecentViews,
    removeRecentView,
    clearRecentViews,
    formatTime,
    updateScrollButtons,
    scrollRecent,
    setupRecentSlider
} from './modules/recent-views.js';
import { showEpisodeDetails } from './modules/episode-details.js';
import { handleSearch } from './modules/search.js';
import { getPodcastEpisodes, displayPodcasts } from './modules/podcast-episodes.js';
import {
    handleMainPlay,
    handleMainPause,
    handleMainTimeUpdate,
    handleMainLoaded
} from './modules/player-handlers.js';
import {
    startDrag,
    onDrag,
    startDragTouch,
    onDragTouch,
    endDrag,
    endDragTouch,
    movePlayer,
    savePlayerPosition
} from './modules/player-drag.js';
import {
    initFloatingPlayer,
    syncToMainPlayer,
    syncToFloatingPlayer,
    updatePlayerInfo,
    showPlayer,
    togglePlay,
    togglePlayerMinimize,
    closePlayer,
    updateProgress,
    updateTotalTime,
    handleProgressClick,
    playPrevious,
    playNext,
    onAudioEnded,
    savePlayerState,
    restorePlayerState,
    dragState,
    playerAudio,
    playerVisible
} from './modules/floating-player.js';
import { setupPagination } from './modules/pagination-ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Приложение запущено');

    // ========== ПОИСК ЭЛЕМЕНТОВ ==========
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const homeBtn = document.querySelector('.home-btn');
    const profileBtn = document.querySelector('.user-profile-btn');

    console.log('✅ Элементы найдены:', { searchInput, searchBtn, homeBtn, profileBtn });

    // ========== СОЗДАНИЕ КОНТЕЙНЕРА ==========
    let resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'resultsContainer';
        resultsContainer.style.cssText = `
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        `;
        document.body.appendChild(resultsContainer);
        console.log('✅ Создан контейнер для результатов');
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ПАГИНАЦИИ ==========
const LIMIT = 6;
let currentQuery = '';

const paginationManager = new PaginationManager({
    container: resultsContainer,
    limit: LIMIT,
    pagesPerGroup: 5,
    onPageChange: (page) => {
        if (!paginationManager.isLoading) {
            // goToPage будет определен позже через setupPagination
        }
    }
});

// Настраиваем пагинацию
const paginationUI = setupPagination({
    resultsContainer,
    LIMIT,
    currentQuery: { value: currentQuery, set: (val) => { currentQuery = val; } },
    paginationManager,
    createPodcastCard,
    goToPage: null // будет переопределено
});

// Обновляем onPageChange с правильной функцией
paginationManager.onPageChange = (page) => {
    if (!paginationManager.isLoading) {
        paginationUI.goToPage(page);
    }
};

// Сохраняем ссылку на функции для использования в других местах
const { displayPodcastsWithPagination, displayPodcastsWithPaginationLegacy } = paginationUI;

    // ========== ПЛАВАЮЩИЙ ПЛЕЕР ==========
    function playInFloatingPlayer(episodeId) {
        if (window.currentEpisodeData && window.currentEpisodeData.id === episodeId) {
            const episode = window.currentEpisodeData;
            const recent = getRecentViews();
            const exists = recent.some(item => item.id === episodeId);
            if (!exists) {
                addRecentView({
                    id: episode.id,
                    title_original: episode.title_original || 'Эпизод',
                    image: episode.image || '',
                    publisher: episode.publisher || '',
                    audio: episode.audio || '',
                    thumbnail: episode.thumbnail || ''
                });
                showToast('🎧 Добавлено в недавние просмотры');
                updateFavoriteCount();
            }
            showPlayer(episode);
            const mainAudio = document.getElementById('episodeAudioPlayer');
            if (mainAudio && mainAudio.src === episode.audio) {
                if (!mainAudio.paused) {
                    playerAudio.play().catch(() => { });
                }
                syncToFloatingPlayer(mainAudio);
            }
        } else {
            window.apiClient.getEpisode(episodeId).then(episode => {
                const data = {
                    id: episode.id,
                    title_original: episode.title_original || episode.title || 'Эпизод',
                    image: episode.image || episode.thumbnail || '',
                    publisher: episode.publisher || episode.podcast_title_original || '',
                    audio: episode.audio || episode.audio_url || '',
                    thumbnail: episode.thumbnail || episode.image || ''
                };
                window.currentEpisodeData = data;
                const recent = getRecentViews();
                const exists = recent.some(item => item.id === episodeId);
                if (!exists) {
                    addRecentView({
                        id: data.id,
                        title_original: data.title_original,
                        image: data.image,
                        publisher: data.publisher,
                        audio: data.audio,
                        thumbnail: data.thumbnail
                    });
                    showToast('🎧 Добавлено в недавние просмотры');
                    updateFavoriteCount();
                }
                showPlayer(data);
            }).catch(err => {
                console.error('Ошибка загрузки эпизода для плеера:', err);
                showToast('❌ Не удалось загрузить эпизод');
            });
        }
    }

    // ========== ОТСЛЕЖИВАНИЕ ПРОСЛУШИВАНИЯ ==========
    function handlePlayStart(episodeId) {
        console.log('▶️ Начато воспроизведение эпизода:', episodeId);
        const audio = document.getElementById('episodeAudioPlayer');
        if (!audio) return;
        if (window.currentListeningEpisode && window.currentListeningEpisode.id === episodeId) {
            const episode = window.currentListeningEpisode;
            const recent = getRecentViews();
            const exists = recent.some(item => item.id === episodeId);
            if (!exists) {
                addRecentView({
                    id: episode.id,
                    title_original: episode.title,
                    image: episode.image,
                    publisher: episode.publisher,
                    audio: episode.audio,
                    thumbnail: episode.thumbnail
                });
                showToast('🎧 Добавлено в недавние просмотры');
                updateFavoriteCount();
            }
            episode.hasStarted = true;
        }
    }

    function handleTimeUpdate(episodeId) {
        const audio = document.getElementById('episodeAudioPlayer');
        if (!audio) return;
        if (audio.currentTime > 5 && window.currentListeningEpisode) {
            const episode = window.currentListeningEpisode;
            const recent = getRecentViews();
            const exists = recent.some(item => item.id === episodeId);
            if (!exists && episode.id === episodeId) {
                addRecentView({
                    id: episode.id,
                    title_original: episode.title,
                    image: episode.image,
                    publisher: episode.publisher,
                    audio: episode.audio,
                    thumbnail: episode.thumbnail,
                    progress: Math.round(audio.currentTime)
                });
                episode.progress = Math.round(audio.currentTime);
                if (!episode.hasStarted) {
                    episode.hasStarted = true;
                    showToast('🎧 Добавлено в недавние просмотры');
                    updateFavoriteCount();
                }
            }
        }
    }

    // ========== ОБЕРТКА ДЛЯ loadInitialPodcasts ==========
    function loadInitialPodcastsWrapper() {
    loadPodcasts({
        resultsContainer,
        paginationManager,
        limit: LIMIT,
        displayPodcastsWithPagination: paginationUI.displayPodcastsWithPagination,
        showToast,
        onLoadComplete: (state) => {
            currentQuery = state.currentQuery || '';
            window.allPodcasts = state.allPodcasts || [];
            paginationManager.updateState({
                total: state.currentTotal || 0,
                page: state.currentPage || 1
            });
        }
    });
}

    // ========== TOAST ==========
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

    //=================Обработчики собьытий=====================
    // Создаем объект для передачи зависимостей
    const searchDependencies = {
    searchInput,
    searchBtn,
    currentQuery: { value: currentQuery, set: (val) => { currentQuery = val; } },
    resultsContainer,
    LIMIT,
    createSkeletonCards,
    createEmptyState,
    createErrorState,
    getFilterParams,
    paginationManager,
    displayPodcastsWithPagination: paginationUI.displayPodcastsWithPagination,
    loadInitialPodcasts: loadInitialPodcastsWrapper,
    showToast
};

    const playerHandlersDependencies = {
        getRecentViews,
        addRecentView,
        saveRecentViews,
        renderRecentViews: () => renderRecentViews({ showEpisodeDetails, formatTime }),
        showToast,
        updateFavoriteCount,
        syncToFloatingPlayer
    };

    if (searchBtn) {
        searchBtn.addEventListener('click', () => handleSearch(searchDependencies));
        console.log('✅ Обработчик клика добавлен на searchBtn');
    } else {
        console.error('❌ searchBtn не найден!');
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch(searchDependencies);
            }
        });
        console.log('✅ Обработчик keypress добавлен на searchInput');
    } else {
        console.error('❌ searchInput не найден!');
    }

    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            console.log('🏠 Возврат на главную');
            if (searchInput) searchInput.value = '';
            loadInitialPodcastsWrapper();
        });
    }

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            console.log('👤 Клик по профилю');

            const userData = localStorage.getItem('colibri_user');

            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    if (user.isLoggedIn) {
                        const favorites = getFavorites();
                        if (favorites.length === 0) {
                            showToast('💔 У вас пока нет избранных эпизодов');
                        }
                        showFavorites(resultsContainer);
                        setTimeout(() => {
                            if (resultsContainer) {
                                resultsContainer.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start'
                                });
                            }
                        }, 300);
                        return;
                    }
                } catch (e) { }
            }

            window.location.href = '/login.html';
        });
    }

    //=======================Экспорт==========================
    window.loadInitialPodcasts = loadInitialPodcastsWrapper;
    window.getPodcastEpisodes = (podcastId) => getPodcastEpisodes(podcastId, {
        resultsContainer,
        showPodcastInfo,
        playInFloatingPlayer,
        displayPodcasts: (data, title) => displayPodcasts(data, title, {
            resultsContainer,
            createPodcastCard,
            loadInitialPodcasts: loadInitialPodcastsWrapper
        }),
        loadInitialPodcasts: loadInitialPodcastsWrapper,
        searchInput,
        searchBtn,
        handleSearch: window.handleSearch
    });

    window.displayPodcasts = (data, title) => displayPodcasts(data, title, {
        resultsContainer,
        createPodcastCard,
        loadInitialPodcasts: loadInitialPodcastsWrapper
    });
    window.showEpisodeDetails = (episodeId) => showEpisodeDetails(episodeId, {
        resultsContainer,
        formatTime,
        handleMainPlay: (id) => handleMainPlay(id, playerHandlersDependencies),
        handleMainPause: (id) => handleMainPause(id, playerHandlersDependencies),
        handleMainTimeUpdate: (id) => handleMainTimeUpdate(id, playerHandlersDependencies),
        handleMainLoaded: (id) => handleMainLoaded(id, playerHandlersDependencies),
        updateProgress,
        updatePlayerInfo,
        syncToFloatingPlayer,
        playInFloatingPlayer,
        loadInitialPodcasts: loadInitialPodcastsWrapper,
        showToast
    });
    window.getFavorites = getFavorites;
    window.showFavorites = showFavorites;
    window.toggleFavorite = toggleFavorite;
    window.removeFromFavorites = removeFromFavorites;
    window.clearAllFavorites = clearAllFavorites;
    window.updateFavoriteCount = updateFavoriteCount;
    window.updateFavoritesBadge = updateFavoritesBadge;
    window.showToast = showToast;
    window.addRecentView = addRecentView;
    window.renderRecentViews = renderRecentViews;
    window.clearRecentViews = clearRecentViews;
    window.formatTime = formatTime;
    window.playInFloatingPlayer = playInFloatingPlayer;
    window.showPlayer = showPlayer;
    window.togglePlay = togglePlay;
    window.closePlayer = closePlayer;
    window.togglePlayerMinimize = togglePlayerMinimize;
    window.handleMainPlay = (id) => handleMainPlay(id, playerHandlersDependencies);
    window.handleMainPause = (id) => handleMainPause(id, playerHandlersDependencies);
    window.handleMainTimeUpdate = (id) => handleMainTimeUpdate(id, playerHandlersDependencies);
    window.handleMainLoaded = (id) => handleMainLoaded(id, playerHandlersDependencies);
    window.syncToMainPlayer = syncToMainPlayer;
    window.syncToFloatingPlayer = syncToFloatingPlayer;
    window.handleSearch = () => handleSearch({
        searchInput,
        searchBtn,
        currentQuery: { value: currentQuery, set: (val) => { currentQuery = val; } },
        resultsContainer,
        LIMIT,
        createSkeletonCards,
        createEmptyState,
        createErrorState,
        getFilterParams,
        paginationManager,
        displayPodcastsWithPagination,
        loadInitialPodcasts: loadInitialPodcastsWrapper,
        showToast
    });
    window.updateHeader = updateHeader;
    window.logoutUser = () => logoutUser({
        showToast,
        loadInitialPodcasts: loadInitialPodcastsWrapper
    });
    window.showProfileMenu = showProfileMenu;
    window.closeProfileModal = closeProfileModal;
    window.createSkeletonCards = createSkeletonCards;
    window.createEmptyState = createEmptyState;
    window.createErrorState = createErrorState;
    window.createPodcastCard = createPodcastCard;

    /// ========== ИНИЦИАЛИЗАЦИЯ ==========
    console.log('🚀 Инициализация приложения...');

    loadInitialPodcastsWrapper();
    updateFavoriteCount();
    updateFavoritesBadge();
    updateHeader({
        getFavorites,
        showFavorites,
        showToast,
        updateFavoritesBadge,
        resultsContainer
    });

    setupPresets();
    setupFilters();
    setupFooter();
    setupRecentSlider({
        renderRecentViews: () => renderRecentViews({ showEpisodeDetails, formatTime })
    });
    renderRecentViews({
        showEpisodeDetails,
        formatTime
    });
    initFloatingPlayer({
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
    updateProgress: () => updateProgress({ formatTime }),
    updateTotalTime: () => updateTotalTime({ formatTime }),
    handleProgressClick,
    playPrevious: () => playPrevious({ showToast }),
    playNext: () => playNext({ showToast }),
    onAudioEnded,
    togglePlay,
    togglePlayerMinimize: () => togglePlayerMinimize({ savePlayerState }),
    closePlayer,
    syncToFloatingPlayer: (audio) => syncToFloatingPlayer(audio, { updatePlayerInfo, savePlayerState }),
    updatePlayerInfo: (episode) => updatePlayerInfo(episode, { savePlayerState }),
    showPlayer: (episode) => showPlayer(episode, { formatTime, updatePlayerInfo, savePlayerState })
});
    setupSidebar({
        loadInitialPodcasts: loadInitialPodcastsWrapper,
        showFavorites,
        showToast,
        renderRecentViews,
        showProfileMenu,
        resultsContainer
    });
    setTimeout(() => restorePlayerState({ showPlayer, formatTime }), 500);

    console.log('✅ Инициализация завершена');
});