import api from "../api/api";

const API_URL = "https://backinventario-g921.onrender.com/api";

export const rentasService = {
    // Buscar clientes existentes
    buscarClientes: async (query) => {
        const { data } = await api.get(`${API_URL}/clientes?search=${query}`);
        return data;
    },

    // Crear cliente nuevo
    crearCliente: async (clienteData) => {
        const { data } = await api.post(`${API_URL}/clientes`, clienteData);
        return data;
    },

    // Obtener productos (Inventario)
    obtenerProductos: async () => {
        const { data } = await api.get(`${API_URL}/inventario`);
        return data;
    },
    obtenerServicios: async () => {
        const { data } = await api.get(`${API_URL}/inventario/servicios`);
        return data;
    },

    // Guardar renta completa
    guardarRenta: async (payload) => {
        const { data } = await api.post(`${API_URL}/rentas`, payload);
        return data;
    },

    // --- NUEVAS FUNCIONES PARA LA LISTA ---
    obtenerRentaPorId: async (id) => {
        try {
            const { data } = await api.get(`${API_URL}/rentas/${id}`);
            return data;
        } catch (error) {
            console.error("Error al obtener detalle de renta:", error);
            throw error;
        }
    },
    // Obtener todas las rentas (para el Dashboard)
    // Obtener todas las rentas (para el Dashboard)
    obtenerRentas: async () => {
        try {
            const response = await api.get(`${API_URL}/rentas`);
            // Si el backend sigue la estructura que mostraste: { success: true, data: [...] }
            return response.data;
        } catch (error) {
            console.error("Error al obtener rentas:", error.response?.data || error.message);

            // Retornamos una estructura coherente para que el frontend no rompa al hacer .map()
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || "Error al conectar con el servidor"
            };
        }
    },
    // Cambiar estado (ej: de 'apartada' a 'finalizada')
    actualizarEstado: async (id, nuevoEstado) => {
        const { data } = await api.put(`${API_URL}/rentas/${id}/estado`, {
            estado: nuevoEstado
        });
        return data;
    },

    // Eliminar o cancelar renta
    eliminarRenta: async (id) => {
        const { data } = await api.delete(`${API_URL}/rentas/${id}`);
        return data;
    },
    actualizarRentaConAbonos: async (id, payload) => {
        try {
            // Esta ruta coincide con el router.put('/:id', ...) que creamos
            const { data } = await api.put(`${API_URL}/inventario/abonos/${id}`, payload);
            return data;
        } catch (error) {
            console.error("Error al actualizar renta con abonos:", error);
            throw error;
        }
    },
    // En rentasService.js
    obtenerAbonos: async (id) => {
        const { data } = await api.get(`${API_URL}/inventario/${id}/abonos`);
        return data; // Esto devuelve { status: "success", data: [...] }
    },
};