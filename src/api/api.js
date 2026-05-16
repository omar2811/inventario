import axios from 'axios';

const api = axios.create({
    baseURL: 'https://backinventario-g921.onrender.com/api' // Asegúrate de que esta sea tu URL
});

// ESTE ES EL PASO CLAVE:
api.interceptors.request.use(
    (config) => {
        // 1. Buscamos el token en el localStorage
        const token = localStorage.getItem('token');

        // 2. Si existe, lo agregamos al header 'x-token'
        if (token) {
            config.headers['x-token'] = token;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;