import React, { useState, useEffect, useMemo } from "react";
import {
    Box, Button, Flex, Icon, IconButton, Table, Tbody, Td, Text, Th, Thead, Tr,
    Badge, useColorModeValue, HStack, Input, InputGroup, InputLeftElement,
    Avatar, Menu, MenuButton, MenuList, MenuItem, VStack, useDisclosure, useToast, Spinner
} from "@chakra-ui/react";
import {
    MdSearch, MdEdit, MdMoreVert, MdPersonAdd, MdCall, MdHistory, MdDelete
} from "react-icons/md";
import api from "../../../api/api";

import Card from "components/card/Card";
import ModalCliente from "./componentes/ModalCliente";
import ModalHistorial from "./componentes/ModalHistorial";

export default function SeccionClientes() {
    const [busqueda, setBusqueda] = useState("");
    const [clientes, setClientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clienteEditando, setClienteEditando] = useState(null);
    const [clienteHistorial, setClienteHistorial] = useState(null);

    const { isOpen: isOpenCliente, onOpen: onOpenCliente, onClose: onCloseCliente } = useDisclosure();
    const { isOpen: isOpenHistorial, onOpen: onOpenHistorial, onClose: onCloseHistorial } = useDisclosure();

    const toast = useToast();
    const textColor = useColorModeValue("secondaryGray.900", "white");
    const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
    const brandColor = useColorModeValue("brand.500", "brand.400");

    // Formateador de moneda
    const formatter = new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN',
    });

    // --- CARGA DE DATOS ---
    const fetchClientes = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("https://backinventario-g921.onrender.com/api/clientes");
            if (res.data.success) {
                setClientes(res.data.data);
            }
        } catch (error) {
            toast({
                title: "Error al cargar clientes",
                description: error.message,
                status: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchClientes(); }, []);

    // --- LÓGICA DE ESTADOS DINÁMICOS ---
    const getInfoEstado = (cliente) => {
        const saldo = Number(cliente.saldo_pendiente) || 0;
        const rentas = Number(cliente.total_rentas) || 0;

        if (saldo > 0) return { label: "Moroso", color: "red" };
        if (rentas > 10) return { label: "VIP", color: "purple" };
        if (rentas > 2) return { label: "Frecuente", color: "blue" };
        return { label: "Nuevo", color: "green" };
    };

    // --- ACCIONES ---
    const guardarCliente = async (datos) => {
        try {
            if (clienteEditando) {
                await api.put(`https://backinventario-g921.onrender.com/api/clientes/${clienteEditando.id}`, datos);
                toast({ title: "Cliente actualizado", status: "success" });
            } else {
                await api.post("https://backinventario-g921.onrender.com/api/clientes", datos);
                toast({ title: "Cliente registrado", status: "success" });
            }
            fetchClientes();
            onCloseCliente();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar", status: "error" });
        }
    };

    const eliminarCliente = async (id) => {
        if (!window.confirm("¿Eliminar este cliente?")) return;
        try {
            await api.delete(`https://backinventario-g921.onrender.com/api/clientes/${id}`);
            setClientes(clientes.filter(c => c.id !== id));
            toast({ title: "Eliminado", status: "info" });
        } catch (error) {
            toast({ title: "Error", status: "error" });
        }
    };

    return (
        <Box pt={{ base: "130px", md: "80px" }}>
            <Card direction="column" w="100%" px="0px">
                <Flex px="25px" justify="space-between" mb="20px" align="center">
                    <Text color={textColor} fontSize="22px" fontWeight="700">Directorio</Text>
                    <HStack>
                        <InputGroup w="250px">
                            <InputLeftElement children={<Icon as={MdSearch} />} />
                            <Input variant="filled" placeholder="Buscar..." onChange={(e) => setBusqueda(e.target.value)} />
                        </InputGroup>
                        <Button leftIcon={<MdPersonAdd />} colorScheme="brand" onClick={() => { setClienteEditando(null); onOpenCliente(); }}>
                            Nuevo
                        </Button>
                    </HStack>
                </Flex>

                <Box overflowX="auto">
                    <Table variant="simple">
                        <Thead bg={useColorModeValue("gray.50", "navy.900")}>
                            <Tr>
                                <Th>Cliente</Th>
                                <Th>Contacto</Th>
                                <Th>Estado</Th>
                                <Th textAlign="center">Rentas</Th>
                                <Th>Saldo</Th>
                                <Th textAlign="center">Acciones</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {isLoading ? (
                                <Tr><Td colSpan={6} textAlign="center" py={10}><Spinner color={brandColor} /></Td></Tr>
                            ) : (
                                clientes
                                    .filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                                    .map((cliente) => {
                                        const estado = getInfoEstado(cliente);
                                        return (
                                            <Tr key={cliente.id}>
                                                <Td>
                                                    <HStack>
                                                        <Avatar name={cliente.nombre} size="sm" />
                                                        <Text color={textColor} fontWeight="700">{cliente.nombre}</Text>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <VStack align="start" spacing={0}>
                                                        <Text fontSize="xs" fontWeight="bold">{cliente.telefono}</Text>
                                                        <Text fontSize="xs">{cliente.email}</Text>
                                                    </VStack>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={estado.color} variant="subtle">{estado.label}</Badge>
                                                </Td>
                                                <Td textAlign="center">{cliente.total_rentas}</Td>
                                                <Td>
                                                    <Text fontWeight="700" color={Number(cliente.saldo_pendiente) > 0 ? "red.400" : "green.400"}>
                                                        {formatter.format(cliente.saldo_pendiente)}
                                                    </Text>
                                                </Td>
                                                <Td textAlign="center">
                                                    <Menu>
                                                        <MenuButton as={IconButton} icon={<MdMoreVert />} variant="ghost" />
                                                        <MenuList>
                                                            <MenuItem icon={<MdHistory />} onClick={() => { setClienteHistorial(cliente); onOpenHistorial(); }}>Historial</MenuItem>
                                                            <MenuItem icon={<MdEdit />} onClick={() => { setClienteEditando(cliente); onOpenCliente(); }}>Editar</MenuItem>
                                                            <MenuItem icon={<MdDelete />} color="red.400" onClick={() => eliminarCliente(cliente.id)}>Eliminar</MenuItem>
                                                        </MenuList>
                                                    </Menu>
                                                </Td>
                                            </Tr>
                                        );
                                    })
                            )}
                        </Tbody>
                    </Table>
                </Box>
            </Card>

            <ModalCliente isOpen={isOpenCliente} onClose={onCloseCliente} alGuardar={guardarCliente} clienteEditando={clienteEditando} />
            <ModalHistorial isOpen={isOpenHistorial} onClose={onCloseHistorial} cliente={clienteHistorial} />
        </Box>
    );
}