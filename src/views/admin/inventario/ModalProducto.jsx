import React, { useState, useEffect, useRef } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
    ModalCloseButton, Button, IconButton, FormControl, FormLabel, Input,
    Select, NumberInput, NumberInputField, SimpleGrid, VStack, HStack,
    Text, Icon, useToast, Divider, Center, Textarea, Box, Image, useColorModeValue
} from "@chakra-ui/react";
import {
    MdSave, MdInventory, MdAttachMoney, MdCategory, MdPhotoCamera,
    MdDescription, MdLayers, MdDelete
} from "react-icons/md";

export default function ModalProducto({ isOpen, onClose, onGuardar, productoSeleccionado, modo = "create" }) {
    const toast = useToast();
    const fileInputRef = useRef(null);

    // Colores del sistema
    const iconBg = useColorModeValue("brand.500", "brand.400");
    const fieldBg = useColorModeValue("secondaryGray.300", "whiteAlpha.50");
    const imgContainerBg = useColorModeValue("gray.50", "whiteAlpha.100");

    // ESTADO INICIAL CORREGIDO: Usamos categoria_id para que coincida con el Select y el Backend
    const [formData, setFormData] = useState({
        nombre: "",
        categoria_id: "1", // Por defecto: Mobiliario
        cantidad_total: 0,
        precio_renta: 0,
        foto_url: "",
        descripcion: ""
    });

    const [imageFile, setImageFile] = useState(null);
    const isReadOnly = modo === "view";

    // Cargar datos cuando se abre el modal
    useEffect(() => {
        if (productoSeleccionado && (modo === "edit" || modo === "view")) {
            setFormData({
                nombre: productoSeleccionado.nombre || "",
                // Convertimos a String para que el <Select> de Chakra lo reconozca
                categoria_id: String(productoSeleccionado.categoria_id || "1"),
                cantidad_total: productoSeleccionado.cantidad_total || 0,
                precio_renta: productoSeleccionado.precio_renta || 0,
                foto_url: productoSeleccionado.foto_url || "",
                descripcion: productoSeleccionado.descripcion || ""
            });
        } else {
            setFormData({
                nombre: "",
                categoria_id: "1",
                cantidad_total: 0,
                precio_renta: 0,
                foto_url: "",
                descripcion: ""
            });
        }
        setImageFile(null);
    }, [productoSeleccionado, isOpen, modo]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast({ title: "Error", description: "La imagen es muy pesada (máx 2MB)", status: "error" });
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, foto_url: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!formData.nombre.trim()) {
            toast({ title: "Nombre requerido", status: "warning", position: "top" });
            return;
        }

        // Crear FormData para enviar archivos al Backend
        const dataToSend = new FormData();
        dataToSend.append("nombre", formData.nombre);
        dataToSend.append("categoria_id", formData.categoria_id); // Enviamos el ID numérico
        dataToSend.append("cantidad_total", formData.cantidad_total);
        dataToSend.append("precio_renta", formData.precio_renta);
        dataToSend.append("descripcion", formData.descripcion);

        if (imageFile) {
            dataToSend.append("imagen", imageFile);
        }

        onGuardar(dataToSend, modo);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" motionPreset="slideInBottom">
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent borderRadius="30px" p={2}>
                <ModalHeader>
                    <HStack spacing={4}>
                        <Center bg={iconBg} color="white" w="48px" h="48px" borderRadius="16px">
                            <Icon as={MdInventory} w="26px" h="26px" />
                        </Center>
                        <Box>
                            <Text fontSize="xl" fontWeight="700">
                                {modo === "view" ? "Detalles del Producto" : modo === "edit" ? "Editar Producto" : "Nuevo Producto"}
                            </Text>
                            <Text fontSize="sm" color="secondaryGray.600" fontWeight="500">
                                {modo === "view" ? "Información técnica" : "Gestión de activos e imagen"}
                            </Text>
                        </Box>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton borderRadius="full" top="25px" right="25px" />

                <Divider />

                <ModalBody py={6}>
                    <VStack spacing={6}>
                        {/* SECCIÓN DE IMAGEN */}
                        <FormControl isDisabled={isReadOnly}>
                            <FormLabel fontWeight="700" fontSize="sm" mb="10px">Imagen del equipo</FormLabel>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: "none" }}
                                onChange={handleImageChange}
                            />
                            <Center
                                w="100%"
                                h="220px"
                                borderRadius="24px"
                                bg={imgContainerBg}
                                border="2px dashed"
                                borderColor={formData.foto_url ? "brand.500" : "gray.300"}
                                position="relative"
                                overflow="hidden"
                                cursor={!isReadOnly ? "pointer" : "default"}
                                onClick={() => !isReadOnly && fileInputRef.current.click()}
                                transition="all 0.3s"
                                _hover={!isReadOnly && { borderColor: "brand.500", bg: "gray.100" }}
                            >
                                {formData.foto_url ? (
                                    <>
                                        <Image src={formData.foto_url} alt="Preview" h="100%" w="100%" objectFit="contain" p={2} />
                                        {!isReadOnly && (
                                            <IconButton
                                                icon={<MdDelete />}
                                                size="sm"
                                                colorScheme="red"
                                                position="absolute"
                                                top="10px"
                                                right="10px"
                                                borderRadius="full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData({ ...formData, foto_url: "" });
                                                    setImageFile(null);
                                                }}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <VStack spacing={2} color="secondaryGray.500">
                                        <Icon as={MdPhotoCamera} w="40px" h="40px" />
                                        <Text fontWeight="600" fontSize="sm">Haz clic para subir foto</Text>
                                        <Text fontSize="xs">PNG o JPG hasta 2MB</Text>
                                    </VStack>
                                )}
                            </Center>
                        </FormControl>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} w="100%">
                            <FormControl isRequired isDisabled={isReadOnly} colSpan={{ md: 2 }}>
                                <FormLabel fontWeight="700" fontSize="sm">Nombre del Producto</FormLabel>
                                <Input
                                    variant="filled"
                                    bg={fieldBg}
                                    placeholder="Ej. Vaso de Cristal 12oz"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </FormControl>

                            {/* SELECT CORREGIDO: Ahora usa categoria_id */}
                            <FormControl isDisabled={isReadOnly}>
                                <FormLabel fontWeight="700" fontSize="sm"><Icon as={MdCategory} mr={1} /> Categoría</FormLabel>
                                <Select
                                    variant="filled"
                                    bg={fieldBg}
                                    value={formData.categoria_id}
                                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                                >
                                    <option value="1">Mobiliario</option>
                                    <option value="2">Mantelería</option>
                                    <option value="3">Cristalería</option>
                                    <option value="4">Decoración</option>
                                    <option value="5">Audio e Iluminación</option>
                                    <option value="6">Servicios</option>
                                </Select>
                            </FormControl>

                            <FormControl isRequired isDisabled={isReadOnly}>
                                <FormLabel fontWeight="700" fontSize="sm"><Icon as={MdLayers} mr={1} /> Stock Total</FormLabel>
                                <NumberInput
                                    min={0}
                                    value={formData.cantidad_total}
                                    onChange={(v) => setFormData({ ...formData, cantidad_total: parseInt(v) || 0 })}
                                >
                                    <NumberInputField variant="filled" bg={fieldBg} />
                                </NumberInput>
                            </FormControl>

                            <FormControl isRequired isDisabled={isReadOnly}>
                                <FormLabel fontWeight="700" fontSize="sm"><Icon as={MdAttachMoney} mr={1} /> Precio Renta</FormLabel>
                                <NumberInput
                                    min={0}
                                    precision={2}
                                    value={formData.precio_renta}
                                    onChange={(v) => setFormData({ ...formData, precio_renta: parseFloat(v) || 0 })}
                                >
                                    <NumberInputField variant="filled" bg={fieldBg} />
                                </NumberInput>
                            </FormControl>
                        </SimpleGrid>

                        <FormControl isDisabled={isReadOnly}>
                            <FormLabel fontWeight="700" fontSize="sm"><Icon as={MdDescription} mr={1} /> Descripción / Notas</FormLabel>
                            <Textarea
                                variant="filled"
                                bg={fieldBg}
                                placeholder="Notas sobre el estado del equipo..."
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                rows={2}
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>

                <Divider />

                <ModalFooter gap={3}>
                    <Button variant="ghost" onClick={onClose} borderRadius="15px">
                        {isReadOnly ? "Cerrar" : "Cancelar"}
                    </Button>
                    {!isReadOnly && (
                        <Button
                            colorScheme="brand"
                            leftIcon={<MdSave />}
                            borderRadius="15px"
                            px={8}
                            onClick={handleSave}
                        >
                            {modo === "edit" ? "Guardar Cambios" : "Crear Producto"}
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}