import React, { useState, useEffect } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, Button, Text, Table, Tbody,
    Td, Th, Thead, Tr, Badge, VStack, HStack, Icon,
    Spinner, Center, Box, useColorModeValue
} from "@chakra-ui/react";
import { MdEventNote, MdHistory, MdReceipt } from "react-icons/md";
import axios from "axios";

export default function ModalHistorial({ isOpen, onClose, cliente }) {
    const [historial, setHistorial] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Formateador de moneda
    const formatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    });

    // Cargar historial cuando se abre el modal y hay un cliente seleccionado
    useEffect(() => {
        if (isOpen && cliente?.id) {
            fetchHistorial();
        }
    }, [isOpen, cliente]);

    const fetchHistorial = async () => {
        setIsLoading(true);
        try {
            // Ruta conectada a tu nuevo endpoint en el backend
            const response = await axios.get(`https://backinventario-g921.onrender.com/api/clientes/${cliente.id}/historial`);
            if (response.data.success) {
                setHistorial(response.data.data);
            }
        } catch (error) {
            console.error("Error al obtener historial:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para obtener el color del badge según el estado de la renta
    const getStatusColor = (estado) => {
        const colors = {
            'apartada': 'orange',
            'entregada': 'blue',
            'finalizada': 'green',
            'cancelada': 'red',
            'atrasada': 'purple'
        };
        return colors[estado.toLowerCase()] || 'gray';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay backdropFilter="blur(5px)" />
            <ModalContent borderRadius="25px" overflow="hidden">
                <ModalHeader bg={useColorModeValue("white", "navy.800")} borderBottom="1px solid" borderColor="gray.100">
                    <HStack justify="space-between" pr={8}>
                        <HStack spacing={3}>
                            <Box p={2} bg="brand.50" borderRadius="lg">
                                <Icon as={MdHistory} color="brand.500" w={5} h={5} />
                            </Box>
                            <VStack align="start" spacing={0}>
                                <Text fontSize="lg" fontWeight="800">Historial de Rentas</Text>
                                <Text fontSize="xs" color="gray.400">{cliente?.nombre}</Text>
                            </VStack>
                        </HStack>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton top="20px" />

                <ModalBody py={6}>
                    {isLoading ? (
                        <Center py={20} flexDirection="column">
                            <Spinner color="brand.500" size="xl" mb={4} thickness="4px" />
                            <Text color="gray.500" fontWeight="bold">Consultando base de datos...</Text>
                        </Center>
                    ) : historial.length > 0 ? (
                        <Box overflowX="auto">
                            <Table variant="simple" size="sm">
                                <Thead bg="gray.50">
                                    <Tr>
                                        <Th py={4}>Folio</Th>
                                        <Th>Fecha Inicio</Th>
                                        <Th>Artículos</Th>
                                        <Th>Estado</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {historial.map((renta) => (
                                        <Tr key={renta.id} _hover={{ bg: "gray.50" }} transition="0.2s">
                                            <Td fontWeight="bold" color="brand.500">
                                                <HStack>
                                                    <Icon as={MdReceipt} />
                                                    <Text>#{renta.id}</Text>
                                                </HStack>
                                            </Td>
                                            <Td fontSize="xs">
                                                {new Date(renta.fecha_inicio).toLocaleDateString('es-MX')}
                                            </Td>
                                            <Td fontSize="xs" maxW="200px">
                                                <Text isTruncated>
                                                    {renta.detalles?.map(d => d.producto?.nombre).join(", ") || "Sin artículos"}
                                                </Text>
                                            </Td>
                                            <Td>
                                                <Badge
                                                    colorScheme={getStatusColor(renta.estado)}
                                                    variant="solid"
                                                    borderRadius="full"
                                                    px={2}
                                                    fontSize="9px"
                                                >
                                                    {renta.estado.toUpperCase()}
                                                </Badge>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                    ) : (
                        <VStack py={20} spacing={3}>
                            <Icon as={MdEventNote} w={12} h={12} color="gray.200" />
                            <Text color="gray.500" fontWeight="800">Sin rentas registradas</Text>
                            <Text color="gray.400" fontSize="sm">Este cliente aún no ha realizado contrataciones.</Text>
                        </VStack>
                    )}
                </ModalBody>

                <ModalFooter bg="gray.50" py={4}>
                    <Button
                        colorScheme="brand"
                        onClick={onClose}
                        borderRadius="12px"
                        px={8}
                        shadow="0px 4px 12px rgba(0, 0, 0, 0.1)"
                    >
                        Cerrar Historial
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}