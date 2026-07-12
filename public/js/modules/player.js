// public/js/modules/player.js
export function showEpisodeDetails(id) {
    console.log('showEpisodeDetails:', id);
    if (window.showEpisodeDetails) window.showEpisodeDetails(id);
}
export default { showEpisodeDetails };