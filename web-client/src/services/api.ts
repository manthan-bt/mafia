const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

export const api = {
    async get(endpoint: string) {
        const token = localStorage.getItem('mafia_token');
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return res.json();
    },

    async post(endpoint: string, data: any) {
        const token = localStorage.getItem('mafia_token');
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return res.json();
    }
};
