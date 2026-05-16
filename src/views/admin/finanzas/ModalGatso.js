import React, { useState } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
    Input, Select, NumberInput, NumberInputField, useToast,
    VStack, Textarea
} from "@chakra-ui/react";
import axios from "axios";

export default function ModalGasto({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        concepto: "",
        monto: "",
        categoria: "General",
        notas: ""
    });
    const toast = useToast();

    const handleSubmit = async () => {
        if (!form.concepto || !form.monto) {
            toast({
                title: "Campos incompletos",
                description: "Concepto y Monto son obligatorios",
                status: "warning"
            });
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post("https://backinventario-g921.onrender.com/api/finanzas/gastos", form);
            if (res.data.success) {
                toast({ title: "Gasto guardado", status: "success" });
                onSuccess(); // Refresca los datos en SeccionFinanzas
                onClose();   // Cierra el modal
                setForm({ concepto: "", monto: "", categoria: "General", notas: "" }); // Limpia
            }
        } catch (error) {
            toast({
                title: "Error al guardar",
                description: error.response?.data?.message || error.message,
                status: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay backdropFilter="blur(4px)" />
            <ModalContent borderRadius="20px">
                <ModalHeader>Registrar Nuevo Gasto</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Concepto</FormLabel>
                            <Input
                                placeholder="Ej. Renta de local, Luz, Sueldos"
                                value={form.concepto}
                                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                            />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Monto</FormLabel>
                            <NumberInput min={0} value={form.monto}>
                                <NumberInputField
                                    placeholder="0.00"
                                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                                />
                            </NumberInput>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Categoría</FormLabel>
                            <Select
                                value={form.categoria}
                                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                            >
                                <option value="General">General</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Sueldos">Sueldos</option>
                                <option value="Servicios">Servicios</option>
                            </Select>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Notas</FormLabel>
                            <Textarea
                                placeholder="Detalles adicionales..."
                                value={form.notas}
                                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
                    <Button
                        colorScheme="red"
                        borderRadius="12px"
                        isLoading={loading}
                        onClick={handleSubmit}
                    >
                        Guardar Gasto
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}