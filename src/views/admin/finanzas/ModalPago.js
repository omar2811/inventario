import React, { useState } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
    Input, Select, NumberInput, NumberInputField, useToast,
    VStack, Badge, Text, Box, HStack, Divider, Icon, SimpleGrid
} from "@chakra-ui/react";
import { MdPerson, MdReceipt, MdAttachMoney } from "react-icons/md";
import axios from "axios";

export default function ModalPago({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [buscando, setBuscando] = useState(false);
    const [rentaEncontrada, setRentaEncontrada] = useState(null);
    const [form, setForm] = useState({
        renta_id: "",
        monto: "",
        metodo: "Efectivo",
        banco: "Caja Chica"
    });
    const toast = useToast();

    const buscarRenta = async (id) => {
        if (!id) return;
        setBuscando(true);
        setRentaEncontrada(null); // Limpiar búsqueda anterior

        try {
            const res = await axios.get(`https://backinventario-g921.onrender.com/api/rentas/${id}`);

            // CORRECCIÓN: Tu JSON usa "status" en lugar de "success"
            if (res.data.status === "success" && res.data.data) {
                setRentaEncontrada(res.data.data);
                setForm(prev => ({ ...prev, renta_id: id }));
                toast({ title: "Renta localizada", status: "success", duration: 1500 });
            } else {
                toast({ title: "No se encontró la renta", status: "warning" });
            }
        } catch (error) {
            toast({ title: "Error en la búsqueda", description: "Verifica el folio", status: "error" });
        } finally {
            setBuscando(false);
        }
    };

    // ... (resto del código anterior igual)

    const handleSubmit = async () => {
        // Validamos que haya monto y sea mayor a 0
        if (!form.monto || parseFloat(form.monto) <= 0) {
            toast({ title: "Monto inválido", status: "warning", isClosable: true });
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post("https://backinventario-g921.onrender.com/api/rentas/abono", form);

            // CORRECCIÓN: Tu JSON del POST devuelve { "success": true ... }
            if (res.data.success === true) {
                toast({
                    title: "Abono registrado",
                    description: res.data.message,
                    status: "success",
                    duration: 3000,
                    isClosable: true
                });

                // 1. Notificar al Dashboard para que recargue sus números
                if (onSuccess) onSuccess();

                // 2. Cerrar el modal y limpiar el formulario
                cerrarYLimpiar();
            } else {
                toast({
                    title: "Error",
                    description: res.data.message || "No se pudo registrar",
                    status: "error"
                });
            }
        } catch (error) {
            toast({
                title: "Error de conexión",
                description: error.response?.data?.message || error.message,
                status: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    // ... (resto del código igual)
    const cerrarYLimpiar = () => {
        setRentaEncontrada(null);
        setForm({ renta_id: "", monto: "", metodo: "Efectivo", banco: "Caja Chica" });
        onClose();
    };

    // Cálculo dinámico basado en tu JSON
    const calcularSaldo = () => {
        if (!rentaEncontrada) return 0;
        const total = parseFloat(rentaEncontrada.total) || 0;
        const anticipo = parseFloat(rentaEncontrada.anticipo) || 0;
        return total - anticipo;
    };

    return (
        <Modal isOpen={isOpen} onClose={cerrarYLimpiar} isCentered size="md">
            <ModalOverlay backdropFilter="blur(6px)" />
            <ModalContent borderRadius="25px">
                <ModalHeader>Registrar Nuevo Pago</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={5}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="bold">Folio de Renta</FormLabel>
                            <HStack>
                                <Input
                                    placeholder="Ej. 23"
                                    type="number"
                                    value={form.renta_id}
                                    onChange={(e) => setForm({ ...form, renta_id: e.target.value })}
                                />
                                <Button
                                    leftIcon={<MdReceipt />}
                                    isLoading={buscando}
                                    onClick={() => buscarRenta(form.renta_id)}
                                    colorScheme="brand"
                                >
                                    Buscar
                                </Button>
                            </HStack>
                        </FormControl>

                        {rentaEncontrada && (
                            <Box p={4} bg="gray.50" borderRadius="20px" w="100%" border="1px solid" borderColor="brand.100">
                                <VStack align="start" spacing={3}>
                                    <HStack>
                                        <Icon as={MdPerson} color="brand.500" />
                                        <Text fontWeight="800">{rentaEncontrada.cliente?.nombre}</Text>
                                    </HStack>
                                    <Divider />
                                    <SimpleGrid columns={2} w="100%" spacing={4}>
                                        <Box>
                                            <Text fontSize="xs" color="gray.500">Total de Renta</Text>
                                            <Text fontWeight="700" fontSize="lg">${rentaEncontrada.total}</Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="xs" color="gray.500">Saldo Pendiente</Text>
                                            <Badge colorScheme="red" p={1} borderRadius="5px">
                                                ${calcularSaldo().toFixed(2)}
                                            </Badge>
                                        </Box>
                                    </SimpleGrid>

                                    <Box w="100%" pt={2}>
                                        <Text fontSize="xs" color="gray.500" mb={1}>Artículos en esta renta:</Text>
                                        {rentaEncontrada.detalles?.map(d => (
                                            <Text key={d.id} fontSize="xs" noOfLines={1}>
                                                • {d.cantidad}x {d.producto?.nombre}
                                            </Text>
                                        ))}
                                    </Box>
                                </VStack>
                            </Box>
                        )}

                        {rentaEncontrada && (
                            <VStack w="100%" spacing={4} animation="fadeIn 0.5s">
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">Monto del Abono</FormLabel>
                                    <NumberInput min={1} w="100%" precision={2}>
                                        <NumberInputField
                                            placeholder="0.00"
                                            onChange={(e) => setForm({ ...form, monto: e.target.value })}
                                        />
                                    </NumberInput>
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">Método de Pago</FormLabel>
                                    <Select onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Transferencia">Transferencia</option>
                                        <option value="Tarjeta">Tarjeta</option>
                                    </Select>
                                </FormControl>
                            </VStack>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={cerrarYLimpiar}>Cancelar</Button>
                    <Button
                        colorScheme="brand"
                        borderRadius="15px"
                        isLoading={loading}
                        onClick={handleSubmit}
                        isDisabled={!rentaEncontrada}
                        leftIcon={<MdAttachMoney />}
                    >
                        Confirmar Pago
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}