import React, { useState, useEffect, useMemo } from "react";
import {
    Box, Button, Flex, Icon, IconButton, SimpleGrid,
    Table, Tbody, Td, Text, Th, Thead, Tr, Badge, useColorModeValue,
    Menu, MenuButton, MenuList, MenuItem, HStack, Input, InputGroup,
    InputLeftElement, useDisclosure, useToast, Image, Spinner, Center
} from "@chakra-ui/react";
import {
    MdAdd, MdSearch, MdEdit, MdDelete, MdMoreVert,
    MdInventory, MdWarning, MdCheckCircle, MdVisibility, MdRemove
} from "react-icons/md";

import Card from "components/card/Card";
import ModalProducto from "./ModalProducto";
import { inventarioService } from "services/inventarioService";

export default function Inventario() {
    // --- ESTADOS ---
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [modoModal, setModoModal] = useState("create");

    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // Colores y Estilos
    const textColor = useColorModeValue("secondaryGray.900", "white");
    const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
    const hoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

    // --- CARGA DE DATOS ---
    const fetchProductos = async () => {
        try {
            setLoading(true);
            const data = await inventarioService.obtenerTodos();
            // Validamos que 'data' sea un array para evitar el error .reduce / .filter
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al obtener productos:", error);
            setItems([]);
            toast({
                title: "Error de conexión",
                description: "No se pudo conectar con el servidor",
                status: "error",
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    // --- CÁLCULOS SEGUROS ---
    const stats = useMemo(() => {
        const safeItems = Array.isArray(items) ? items : [];
        return {
            total: safeItems.reduce((a, b) => a + (Number(b.cantidad_total) || 0), 0),
            disponibles: safeItems.filter(i => (Number(i.cantidad_total) || 0) > 0).length,
            alerta: safeItems.filter(i => (Number(i.cantidad_total) || 0) < 5).length
        };
    }, [items]);

    // --- ACCIONES ---
    const abrirModal = (modo, producto = null) => {
        setModoModal(modo);
        setProductoSeleccionado(producto);
        onOpen();
    };

    const ajustarStockRapido = async (item, cambio) => {
        const nuevoStock = (Number(item.cantidad_total) || 0) + cambio;
        if (nuevoStock < 0) return;

        try {
            // Mandamos solo el campo necesario en formato JSON
            await inventarioService.actualizar(item.id, { cantidad_total: nuevoStock });

            // Actualización optimista en el estado local para mayor velocidad visual
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, cantidad_total: nuevoStock } : i));

            toast({
                title: cambio > 0 ? "Stock aumentado" : "Merma registrada",
                status: cambio > 0 ? "success" : "warning",
                duration: 1000
            });
        } catch (error) {
            toast({ title: "Error al actualizar", status: "error" });
            fetchProductos(); // Revertimos si falla
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este artículo? Esta acción no se puede deshacer.")) return;
        try {
            await inventarioService.eliminar(id);
            toast({ title: "Producto eliminado", status: "info" });
            fetchProductos();
        } catch (error) {
            toast({ title: "Error al eliminar", status: "error" });
        }
    };

    const handleGuardar = async (formData, modo) => {
        try {
            if (modo === "create") {
                await inventarioService.crear(formData);
                toast({ title: "Producto creado con éxito", status: "success" });
            } else {
                await inventarioService.actualizar(productoSeleccionado.id, formData);
                toast({ title: "Producto actualizado", status: "info" });
            }
            fetchProductos();
            onClose();
        } catch (error) {
            toast({
                title: "Error al guardar",
                description: error.response?.data?.message || "Ocurrió un error inesperado",
                status: "error"
            });
        }
    };

    if (loading) {
        return (
            <Center h="100vh">
                <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="brand.500" size="xl" />
            </Center>
        );
    }

    return (
        <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
            {/* Resumen de Tarjetas */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing="20px" mb="20px">
                <StatSummary label="Stock Físico Total" value={stats.total} icon={MdInventory} color="blue.400" />
                <StatSummary label="Items con Existencia" value={stats.disponibles} icon={MdCheckCircle} color="green.400" />
                <StatSummary label="Stock Bajo (<5)" value={stats.alerta} icon={MdWarning} color="orange.400" />
            </SimpleGrid>

            <Card direction="column" w="100%" px="0px" overflowX={{ sm: "scroll", lg: "hidden" }}>
                <Flex px="25px" justify="space-between" mb="20px" align="center">
                    <Box>
                        <Text color={textColor} fontSize="22px" fontWeight="700">Inventario Real</Text>
                        <Text color="secondaryGray.600" fontSize="sm">Gestión de existencias y precios</Text>
                    </Box>
                    <HStack spacing="10px">
                        <InputGroup w={{ base: "150px", md: "250px" }}>
                            <InputLeftElement children={<Icon as={MdSearch} color="gray.400" />} />
                            <Input
                                variant="filled"
                                placeholder="Buscar producto..."
                                borderRadius="10px"
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </InputGroup>
                        <Button
                            leftIcon={<MdAdd />}
                            colorScheme="brand"
                            borderRadius="70px"
                            px="20px"
                            onClick={() => abrirModal("create")}
                        >
                            Nuevo
                        </Button>
                    </HStack>
                </Flex>

                <Table variant="simple" color="gray.500" mb="24px">
                    <Thead>
                        <Tr>
                            <Th borderColor={borderColor}>Producto</Th>
                            <Th borderColor={borderColor}>Categoría</Th>
                            <Th borderColor={borderColor} textAlign="center">Stock Total (-/+)</Th>
                            <Th borderColor={borderColor}>Estado</Th>
                            <Th borderColor={borderColor}>Precio Renta</Th>
                            <Th borderColor={borderColor} textAlign="center">Acciones</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {items
                            .filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                            .map((item) => (
                                <Tr key={item.id} _hover={{ bg: hoverBg }} transition="0.2s">
                                    <Td borderColor={borderColor}>
                                        <HStack spacing={3}>
                                            <Image
                                                src={item.foto_url}
                                                w="48px"
                                                h="48px"
                                                borderRadius="12px"
                                                objectFit="cover"
                                                fallbackSrc="https://via.placeholder.com/48?text=S/I"
                                            />
                                            <Text color={textColor} fontSize="sm" fontWeight="700">
                                                {item.nombre}
                                            </Text>
                                        </HStack>
                                    </Td>
                                    <Td borderColor={borderColor}>
                                        <Badge variant="subtle" colorScheme="purple" borderRadius="10px" px="10px">
                                            {item.categoria_nombre || "Sin categoría"}
                                        </Badge>
                                    </Td>
                                    <Td borderColor={borderColor}>
                                        <HStack justify="center" spacing={3}>
                                            <IconButton
                                                size="xs"
                                                variant="ghost"
                                                colorScheme="red"
                                                icon={<MdRemove />}
                                                onClick={() => ajustarStockRapido(item, -1)}
                                            />
                                            <Text fontWeight="bold" fontSize="md" color={textColor} minW="30px" textAlign="center">
                                                {item.cantidad_total}
                                            </Text>
                                            <IconButton
                                                size="xs"
                                                variant="ghost"
                                                colorScheme="green"
                                                icon={<MdAdd />}
                                                onClick={() => ajustarStockRapido(item, 1)}
                                            />
                                        </HStack>
                                    </Td>
                                    <Td borderColor={borderColor}>
                                        <Badge
                                            colorScheme={item.cantidad_total > 0 ? "green" : "red"}
                                            borderRadius="full"
                                            px="15px"
                                        >
                                            {item.cantidad_total > 0 ? "En bodega" : "Agotado"}
                                        </Badge>
                                    </Td>
                                    <Td borderColor={borderColor}>
                                        <Text color={textColor} fontWeight="700" fontSize="sm">
                                            ${Number(item.precio_renta).toFixed(2)}
                                        </Text>
                                    </Td>
                                    <Td borderColor={borderColor} textAlign="center">
                                        <Menu>
                                            <MenuButton as={IconButton} icon={<MdMoreVert />} variant="ghost" size="sm" />
                                            <MenuList borderRadius="15px" shadow="xl">
                                                <MenuItem icon={<MdVisibility />} onClick={() => abrirModal("view", item)}>
                                                    Ver Detalles
                                                </MenuItem>
                                                <MenuItem icon={<MdEdit />} onClick={() => abrirModal("edit", item)}>
                                                    Editar
                                                </MenuItem>
                                                <MenuItem
                                                    icon={<MdDelete />}
                                                    color="red.400"
                                                    onClick={() => handleEliminar(item.id)}
                                                >
                                                    Eliminar
                                                </MenuItem>
                                            </MenuList>
                                        </Menu>
                                    </Td>
                                </Tr>
                            ))}
                    </Tbody>
                </Table>
            </Card>

            <ModalProducto
                isOpen={isOpen}
                onClose={onClose}
                onGuardar={handleGuardar}
                productoSeleccionado={productoSeleccionado}
                modo={modoModal}
            />
        </Box>
    );
}

function StatSummary({ label, value, icon, color }) {
    const textColor = useColorModeValue("secondaryGray.900", "white");
    return (
        <Card p="20px">
            <Flex align="center">
                <Icon as={icon} w="32px" h="32px" color={color} mr="15px" />
                <Box>
                    <Text color="secondaryGray.600" fontSize="xs" fontWeight="700" textTransform="uppercase">
                        {label}
                    </Text>
                    <Text color={textColor} fontSize="22px" fontWeight="700">
                        {value}
                    </Text>
                </Box>
            </Flex>
        </Card>
    );
}