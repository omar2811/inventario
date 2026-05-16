import React, { useState, useEffect } from "react";
import {
    Box, Button, Flex, Table, Thead, Tbody, Tr, Th, Td, Text, Badge,
    useColorModeValue, IconButton, SimpleGrid, Stat, StatLabel, StatNumber,
    HStack, Icon, useDisclosure, useToast, Spinner, Center
} from "@chakra-ui/react";
import { FaEye, FaTimes, FaPlus, FaClock, FaCalendarCheck, FaCheckCircle } from "react-icons/fa";

// Componentes y Servicios
import CrearRentaWizard from "./CrearRentaModal";
import { rentasService } from "../../../services/rentas.service";

export default function RentasList() {
    // --- ESTADOS ---
    const [rentas, setRentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // --- LOGICA MODAL ---
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [modoModal, setModoModal] = useState("create");
    const [rentaSeleccionada, setRentaSeleccionada] = useState(null);

    // --- COLORES (Declarados fuera del JSX para evitar errores de Hooks) ---
    const bg = useColorModeValue("gray.50", "gray.900");
    const cardBg = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "white");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const headerBg = useColorModeValue("gray.50", "gray.700");
    const rowHoverBg = useColorModeValue("gray.50", "gray.700");

    // --- EFECTOS ---
    useEffect(() => {
        cargarRentas();
    }, []);

    const cargarRentas = async () => {
        setLoading(true);
        try {
            console.log("Iniciando carga de rentas...");
            const res = await rentasService.obtenerRentas();

            // CAMBIO AQUÍ: Usamos res.success que es lo que manda tu JSON
            if (res && res.success === true) {
                const dataArray = Array.isArray(res.data) ? res.data : [];
                setRentas(dataArray);
            } else {
                // Si res.success es false o no viene
                throw new Error(res.message || "La operación no fue exitosa");
            }
        } catch (error) {
            console.error("Error detallado:", error);
            toast({
                title: "Error al cargar rentas",
                description: error.message || "No se pudo conectar con el servidor.",
                status: "error",
                duration: 5000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    const manejarAbrirModal = async (modo, renta = null) => {
        if ((modo === "view" || modo === "edit") && renta) {
            setLoading(true); // O un loading local para que el usuario sepa que está cargando
            try {
                // LLAMADA AL SERVICIO PARA OBTENER EL DETALLE COMPLETO
                const res = await rentasService.obtenerRentaPorId(renta.id);

                if (res.status === "success") {
                    setRentaSeleccionada(res.data); // Aquí ya vienen los detalles/productos
                    setModoModal(modo);
                    onOpen();
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: "No se pudieron obtener los detalles de la renta",
                    status: "error"
                });
            } finally {
                setLoading(false);
            }
        } else {
            // Modo creación: limpiar estado
            setRentaSeleccionada(null);
            setModoModal("create");
            onOpen();
        }
    };

    const handleCancelar = async (id) => {
        if (!window.confirm("¿Estás seguro de cancelar esta renta?")) return;
        try {
            await rentasService.actualizarEstado(id, "cancelada");
            toast({ title: "Renta cancelada", status: "info" });
            cargarRentas();
        } catch (error) {
            toast({ title: "Error al cancelar", status: "error" });
        }
    };

    const colorEstado = (estado) => {
        const colors = {
            "apartada": "orange",
            "en curso": "blue",
            "finalizada": "green",
            "cancelada": "red"
        };
        return colors[estado?.toLowerCase()] || "gray";
    };

    return (
        <Box p="20px" pt="100px" bg={bg} minH="100vh">

            {/* --- DASHBOARD STATS --- */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb="30px">
                <StatItem
                    label="Apartadas"
                    value={rentas.filter(r => r.estado === 'apartada').length}
                    icon={FaClock} color="orange.400" bg={cardBg} borderColor={borderColor}
                />
                <StatItem
                    label="confirmada"
                    value={rentas.filter(r => r.estado === 'confirmada').length}
                    icon={FaCalendarCheck} color="blue.400" bg={cardBg} borderColor={borderColor}
                />
                <StatItem
                    label="Finalizadas"
                    value={rentas.filter(r => r.estado === 'finalizada').length}
                    icon={FaCheckCircle} color="green.400" bg={cardBg} borderColor={borderColor}
                />
            </SimpleGrid>

            {/* --- CONTENEDOR DE TABLA --- */}
            <Box bg={cardBg} borderRadius="20px" boxShadow="sm" p="25px" border="1px solid" borderColor={borderColor}>
                <Flex justify="space-between" align="center" mb="25px">
                    <Box>
                        <Text fontSize="xl" fontWeight="bold" color={textColor}>Gestión de Rentas</Text>
                        <Text fontSize="sm" color="gray.500">Event Planner Inventory Control</Text>
                    </Box>
                    <Button
                        leftIcon={<FaPlus />}
                        colorScheme="teal"
                        borderRadius="full"
                        onClick={() => manejarAbrirModal("create")}
                    >
                        Nueva Renta
                    </Button>
                </Flex>

                {loading ? (
                    <Center py={20}><Spinner color="teal.500" size="xl" /></Center>
                ) : (
                    <Box overflowX="auto">
                        <Table variant="simple">
                            <Thead bg={headerBg}>
                                <Tr>
                                    <Th>Folio</Th>
                                    <Th>Cliente</Th>
                                    <Th>Estado</Th>
                                    <Th>Periodo</Th>
                                    <Th isNumeric>Total</Th>
                                    <Th textAlign="center">Acciones</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {rentas.map((renta) => (
                                    <Tr key={renta.id} _hover={{ bg: rowHoverBg }}>
                                        <Td fontWeight="bold">#R-{renta.id}</Td>
                                        <Td>
                                            <Text fontWeight="bold">{renta.cliente?.nombre || "N/A"}</Text>
                                            <Text fontSize="xs" color="gray.500">{renta.cliente?.telefono || 'Sin tel'}</Text>
                                        </Td>
                                        <Td>
                                            <Badge colorScheme={colorEstado(renta.estado)} borderRadius="full" px={3} textTransform="capitalize">
                                                {renta.estado}
                                            </Badge>
                                        </Td>
                                        <Td fontSize="xs">
                                            {new Date(renta.fecha_inicio).toLocaleDateString()} al <br />
                                            {new Date(renta.fecha_fin).toLocaleDateString()}
                                        </Td>
                                        <Td isNumeric fontWeight="black" color="teal.600">
                                            ${parseFloat(renta.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </Td>
                                        <Td>
                                            <HStack justify="center" spacing={2}>
                                                <IconButton
                                                    icon={<FaEye />}
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="blue"
                                                    aria-label="Ver detalle"
                                                    onClick={() => manejarAbrirModal("view", renta)}
                                                />
                                                <IconButton
                                                    icon={<FaTimes />}
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="red"
                                                    aria-label="Cancelar renta"
                                                    onClick={() => handleCancelar(renta.id)}
                                                    isDisabled={renta.estado === "finalizada" || renta.estado === "cancelada"}
                                                />
                                            </HStack>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                        {rentas.length === 0 && (
                            <Center py={10} flexDir="column">
                                <Text color="gray.400">No hay rentas registradas aún.</Text>
                            </Center>
                        )}
                    </Box>
                )}
            </Box>

            {/* --- MODAL WIZARD --- */}
            <CrearRentaWizard
                isOpen={isOpen}
                onClose={onClose}
                rentaSeleccionada={rentaSeleccionada}
                modo={modoModal}
                onCrear={cargarRentas} // Recarga la lista al terminar
            />
        </Box>
    );
}

// Sub-componente para las estadísticas
function StatItem({ label, value, icon, color, bg, borderColor }) {
    return (
        <Stat p="20px" bg={bg} borderRadius="20px" border="1px solid" borderColor={borderColor} shadow="sm">
            <Flex align="center" justify="space-between">
                <Box>
                    <StatLabel color="gray.500" fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider">
                        {label}
                    </StatLabel>
                    <StatNumber fontSize="3xl" color={color} fontWeight="black">
                        {value}
                    </StatNumber>
                </Box>
                <Center bg={useColorModeValue("gray.50", "whiteAlpha.100")} p={3} borderRadius="xl">
                    <Icon as={icon} w={6} h={6} color={color} />
                </Center>
            </Flex>
        </Stat>
    );
}