import React, { useState, useEffect } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
    Input, SimpleGrid, VStack, Textarea
} from "@chakra-ui/react";

export default function ModalCliente({ isOpen, onClose, alGuardar, clienteEditando }) {
    // Ajustamos los nombres de los campos para que coincidan con el Modelo de Sequelize
    const [formData, setFormData] = useState({
        nombre: "",
        telefono: "",
        email: "",
        notas: ""
    });

    useEffect(() => {
        if (clienteEditando) {
            // Mapeamos los datos que vienen del servidor al estado del formulario
            setFormData({
                nombre: clienteEditando.nombre || "",
                telefono: clienteEditando.telefono || "",
                email: clienteEditando.email || "",
                notas: clienteEditando.notas || ""
            });
        } else {
            setFormData({ nombre: "", telefono: "", email: "", notas: "" });
        }
    }, [clienteEditando, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const onEnviar = () => {
        // Validación básica
        if (!formData.nombre.trim()) return;

        // Enviamos los datos al componente padre (SeccionClientes)
        alGuardar(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
            <ModalOverlay backdropFilter="blur(4px)" />
            <ModalContent borderRadius="20px">
                <ModalHeader fontWeight="800">
                    {clienteEditando ? "Editar Perfil de Cliente" : "Registrar Nuevo Cliente"}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="700">Nombre Completo</FormLabel>
                            <Input
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Ej. Juan Pérez"
                                borderRadius="12px"
                            />
                        </FormControl>

                        <SimpleGrid columns={2} spacing={4} w="100%">
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="700">Teléfono</FormLabel>
                                <Input
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    placeholder="9931234567"
                                    borderRadius="12px"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="700">Email</FormLabel>
                                <Input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="correo@ejemplo.com"
                                    borderRadius="12px"
                                />
                            </FormControl>
                        </SimpleGrid>

                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="700">Notas u Observaciones</FormLabel>
                            <Textarea
                                name="notas"
                                value={formData.notas}
                                onChange={handleChange}
                                placeholder="Dirección, referencias o detalles importantes..."
                                borderRadius="12px"
                                rows={3}
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>

                <ModalFooter pb={6}>
                    <Button variant="ghost" mr={3} onClick={onClose} borderRadius="12px">
                        Cancelar
                    </Button>
                    <Button
                        colorScheme="brand"
                        borderRadius="12px"
                        onClick={onEnviar}
                        px={8}
                    >
                        {clienteEditando ? "Guardar Cambios" : "Registrar Cliente"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}