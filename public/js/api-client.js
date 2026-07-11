// public/js/api-client.js

class ApiClient {
    constructor() {
        this.baseUrl = '/api';
    }

    async request(endpoint, params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;
            
            console.log(`📡 Запрос к: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`📡 Ответ от ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error('API Client Error:', error);
            throw error;
        }
    }

    async search(query, params = {}) {
        const defaultParams = {
            q: query,
            sort_by_date: 0,
            offset: 0,
            limit: 20,
            ...params
        };
        return this.request('/search', defaultParams);
    }

    async searchEpisodes(query, params = {}) {
        const defaultParams = {
            q: query,
            sort_by_date: 0,
            offset: 0,
            limit: 20,
            ...params
        };
        return this.request('/search', { ...defaultParams, type: 'episode' });
    }

    async searchPodcasts(query, params = {}) {
        const defaultParams = {
            q: query,
            sort_by_date: 0,
            offset: 0,
            limit: 20,
            ...params
        };
        return this.request('/search', { ...defaultParams, type: 'podcast' });
    }

    async getPodcast(id) {
        return this.request(`/podcasts/${id}`);
    }

    async getPodcastEpisodes(id, params = {}) {
        const defaultParams = {
            sort: 'recent_first',
            offset: 0,
            limit: 20,
            ...params
        };
        return this.request(`/podcasts/${id}/episodes`, defaultParams);
    }

    async getEpisode(id) {
        return this.request(`/episodes/${id}`);
    }

    async getCurated(params = {}) {
        const defaultParams = {
            offset: 0,
            limit: 20,
            ...params
        };
        return this.request('/curated', defaultParams);
    }
}

const apiClient = new ApiClient();
window.apiClient = apiClient;