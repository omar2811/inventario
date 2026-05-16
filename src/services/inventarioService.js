import api from "../api/api";

const API_URL = 'https://backinventario-g921.onrender.com/api/inventario';

export const inventarioService = {
    obtenerTodos: async () => {
        const res = await api.get(API_URL);
        // Forzamos que retorne el array que está dentro de res.data.data
        return res.data.data || [];
    },
    obtenerServicios: async () => {
        const res = await api.get(API_URL + '/servicios');
        // Forzamos que retorne el array que está dentro de res.data.data
        return res.data.data || [];
    },
    crear: async (formData) => {
        const res = await api.post(API_URL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },
    actualizar: async (id, data) => {
        const res = await api.put(`${API_URL}/${id}`, data);
        return res.data;
    },
    eliminar: async (id) => {
        const res = await api.delete(`${API_URL}/${id}`);
        return res.data;
    }
};