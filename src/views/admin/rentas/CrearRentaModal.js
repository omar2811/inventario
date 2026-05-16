import React, { useState, useEffect } from "react";
import {
    Box, Button, Flex, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select, NumberInput,
    NumberInputField, Text, VStack, HStack, IconButton, Progress, useToast, Divider,
    Badge, Icon, SimpleGrid, Grid, GridItem, Stat, StatLabel, StatNumber, Spinner,
    Heading, Center, List, ListItem, Tooltip, Avatar, Image, Tabs,
    TabList,
    Tab,
    TabIndicator,
    Table, Thead, Tbody, Tr, Th, Td


} from "@chakra-ui/react";
import {
    FaEye, FaPlus, FaUser, FaCalendarAlt, FaFileContract, FaSearch, FaTrash,
    FaBoxOpen, FaMoneyBillWave, FaShoppingCart, FaCheckCircle, FaMinus,
    FaClock, FaTruck, FaTools, FaFilePdf, FaChevronRight, FaChevronLeft, FaSave,
    FaDownload,
    FaConciergeBell, FaHistory
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // Importa el plugin directamente

import { rentasService } from "../../../services/rentas.service";

export default function CrearRentaWizard({ isOpen, onClose, onCrear, rentaSeleccionada, modo = "create" }) {
    const toast = useToast();
    const [paso, setPaso] = useState(1);
    const [loading, setLoading] = useState(false);

    // --- IDENTIFICADORES DE MODO ---
    const isViewMode = modo === "view";
    const isReadOnly = isViewMode;

    // --- ESTADOS DE DATOS ---
    const [cliente, setCliente] = useState({ id: null, nombre: "", telefono: "", email: "", direccion: "" });
    const [fechas, setFechas] = useState({ inicio: "", fin: "", horaEntrega: "10:00" });
    const [carrito, setCarrito] = useState([]);
    const [pago, setPago] = useState({ metodo: "Efectivo", anticipo: 0 });

    const [productosDB, setProductosDB] = useState([]);
    const [busquedaCliente, setBusquedaCliente] = useState("");
    const [sugerenciasClientes, setSugerenciasClientes] = useState([]);

    const [cargandoAbonos, setCargandoAbonos] = useState(false);

    useEffect(() => {
        const cargarHistorialPagos = async () => {
            const idRenta = rentaSeleccionada?.id;
            if (!idRenta || modo === "create") return;

            setCargandoAbonos(true);
            try {
                const respuesta = await rentasService.obtenerAbonos(idRenta);
                if (respuesta.status === "success") {
                    const abonosDB = respuesta.data.map(abono => ({
                        ...abono,
                        monto: parseFloat(abono.monto),
                        fecha: abono.fecha.split('T')[0],
                        esViejo: true,
                        esNuevo: false
                    }));

                    setPago(prev => ({
                        ...prev,
                        abonos: abonosDB,
                        anticipo: abonosDB.reduce((acc, curr) => acc + curr.monto, 0)
                    }));
                }
            } catch (error) {
                console.error("Error al obtener abonos:", error);
            } finally {
                setCargandoAbonos(false);
            }
        };

        if (isOpen) cargarHistorialPagos();
    }, [isOpen, rentaSeleccionada, modo]);
    // --- CARGA Y SINCRONIZACIÓN ---
    useEffect(() => {
        if (isOpen) {
            cargarProductos();

            if (rentaSeleccionada && (modo === "view" || modo === "edit")) {
                setCliente({
                    id: rentaSeleccionada.cliente_id,
                    nombre: rentaSeleccionada.cliente?.nombre || "",
                    telefono: rentaSeleccionada.cliente?.telefono || "",
                    direccion: rentaSeleccionada.cliente?.direccion || "",
                    email: rentaSeleccionada.cliente?.email || ""
                });

                setFechas({
                    inicio: rentaSeleccionada.fecha_inicio?.split('T')[0] || "",
                    fin: rentaSeleccionada.fecha_fin?.split('T')[0] || "",
                    horaEntrega: rentaSeleccionada.hora_entrega || "10:00"
                });

                if (rentaSeleccionada.detalles) {
                    const productosMapeados = rentaSeleccionada.detalles.map(d => ({
                        id: d.producto_id || `srv-${Math.random()}`,
                        nombre: d.producto?.nombre || d.nombre_servicio,
                        precio: parseFloat(d.precio_unitario),
                        cantidad: d.cantidad,
                        esServicio: d.producto_id === null,
                        img: d.producto?.foto_url || (d.producto_id ? "https://via.placeholder.com/150" : "🛠️")
                    }));
                    setCarrito(productosMapeados);
                }

                setPago({
                    metodo: rentaSeleccionada.metodo_pago || "Efectivo",
                    anticipo: parseFloat(rentaSeleccionada.anticipo || 0)
                });
                setPaso(1);
            } else {
                setCliente({ id: null, nombre: "", telefono: "", email: "", direccion: "" });
                setFechas({ inicio: "", fin: "", horaEntrega: "10:00" });
                setCarrito([]);
                setPago({ metodo: "Efectivo", anticipo: 0 });
                setPaso(1);
            }
        }
    }, [isOpen, rentaSeleccionada, modo]);

    const cargarProductos = async () => {
        try {
            const res = await rentasService.obtenerProductos();
            if (res.status === "success") {
                setProductosDB(res.data.map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    precio: parseFloat(p.precio_renta || 0),
                    stock: p.cantidad_total,
                    img: p.foto_url || "https://via.placeholder.com/150?text=Equipo"
                })));
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (busquedaCliente.length > 2 && !isReadOnly) {
                try {
                    const res = await rentasService.buscarClientes(busquedaCliente);
                    setSugerenciasClientes(res.data || []);
                } catch (err) { console.error(err); }
            } else { setSugerenciasClientes([]); }
        }, 500);
        return () => clearTimeout(timer);
    }, [busquedaCliente, isReadOnly]);

    // --- ACCIONES DEL CARRITO ---
    const agregarAlCarrito = (prod) => {
        const existe = carrito.find(item => item.id === prod.id && !item.esServicio);
        if (existe) {
            actualizarItemCarrito(prod.id, 'cantidad', (parseInt(existe.cantidad) || 0) + 1);
        } else {
            setCarrito([...carrito, { ...prod, cantidad: 1, esServicio: false }]);
        }
        toast({ title: "Agregado", status: "success", duration: 800, position: "top-right" });
    };

    const agregarServicioEspecial = (tipo) => {
        setCarrito([...carrito, {
            id: `srv-${Date.now()}`,
            nombre: tipo === 'envio' ? "Costo de Envío / Flete" : "Servicio de Instalación",
            precio: 0,
            cantidad: 1,
            esServicio: true,
            img: tipo === 'envio' ? "🚚" : "🛠️"
        }]);
    };

    const actualizarItemCarrito = (id, campo, valor) => {
        setCarrito(prev => prev.map(item => item.id === id ? { ...item, [campo]: valor } : item));
    };

    const subtotal = carrito.reduce((acc, p) => acc + ((parseFloat(p.precio) || 0) * (parseInt(p.cantidad) || 0)), 0);
    const saldoPendiente = subtotal - pago.anticipo;

    // --- LÓGICA DE PDF ---
    // --- LÓGICA DE PDF CORREGIDA ---
    // --- LÓGICA DE PDF CORREGIDA ---
    const generarPDF = (idManual = null) => {
        const rentaId = idManual || rentaSeleccionada?.id || "NUEVO";
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // --- ENCABEZADO Y TÍTULO (Mantenemos tu estilo) ---
            doc.setFillColor(45, 55, 72);
            doc.rect(0, 0, 210, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont(undefined, 'bold');
            doc.text("COTIZACIÓN DE EVENTO", 105, 22, { align: "center" });

            // --- INFO CLIENTE Y EVENTO ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text("DATOS DEL CLIENTE Y EVENTO", 14, 45);
            doc.setFont(undefined, 'normal');
            doc.text(`FOLIO: #R-${rentaId}`, 150, 45);
            doc.text(`Cliente: ${cliente.nombre}`, 14, 52);
            doc.text(`Teléfono: ${cliente.telefono}`, 14, 57);
            doc.text(`Dirección/Lugar: ${cliente.direccion || 'No especificado'}`, 14, 62);
            doc.text(`Fecha Evento: ${fechas.inicio} al ${fechas.fin}`, 14, 67);

            // --- LÓGICA DE DIVISIÓN DE PRODUCTOS ---
            // Filtramos por categoria_id (asumiendo que 6 es Servicios)
            const equipos = carrito.filter(item => Number(item.categoria_id) !== 6);
            const servicios = carrito.filter(item => Number(item.categoria_id) === 6);

            let currentY = 75;

            // --- TABLA 1: MOBILIARIO Y EQUIPOS ---
            if (equipos.length > 0) {
                doc.setFont(undefined, 'bold');
                doc.text("DETALLE DE MOBILIARIO Y EQUIPO", 14, currentY);

                autoTable(doc, {
                    startY: currentY + 3,
                    head: [["Descripción del Equipo", "Cant.", "P. Unit", "Subtotal"]],
                    body: equipos.map(item => [
                        item.nombre,
                        item.cantidad,
                        `$${parseFloat(item.precio).toLocaleString()}`,
                        `$${(item.cantidad * item.precio).toLocaleString()}`
                    ]),
                    headStyles: { fillStyle: [49, 151, 149] }, // Teal para equipos
                    theme: 'striped',
                    styles: { fontSize: 9 }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // --- TABLA 2: SERVICIOS PROFESIONALES ---
            if (servicios.length > 0) {
                doc.setFont(undefined, 'bold');
                doc.text("SERVICIOS Y PERSONAL ADICIONAL", 14, currentY);

                autoTable(doc, {
                    startY: currentY + 3,
                    head: [["Descripción del Servicio", "Cant.", "Costo", "Subtotal"]],
                    body: servicios.map(item => [
                        item.nombre,
                        item.cantidad,
                        `$${parseFloat(item.precio).toLocaleString()}`,
                        `$${(item.cantidad * item.precio).toLocaleString()}`
                    ]),
                    headStyles: { fillStyle: [221, 107, 32] }, // Naranja para servicios (Orange 500)
                    theme: 'striped',
                    styles: { fontSize: 9 }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // --- SECCIONES DE TÉRMINOS Y CONDICIONES ---
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text("NOTAS IMPORTANTES:", 14, currentY);
            doc.setFont(undefined, 'normal');
            doc.text(">> El mobiliario se entrega en planta baja, cambios de nivel requieren apoyo adicional.", 14, currentY + 5);

            currentY += 15;

            // --- BLOQUE DE POLÍTICAS ---
            const politicas = [
                { t: "MONTAJE Y RECOLECCIÓN:", d: "Se montará conforme a las facilidades del salón. Recolección al día siguiente o al terminar el evento." },
                { t: "RESPONSABILIDAD:", d: "El cliente cubre costos de reparación por daños o extravío de piezas (vajilla, mantelería, etc)." }
            ];

            politicas.forEach(p => {
                if (currentY > 250) { doc.addPage(); currentY = 20; } // Control de salto de página
                doc.setFont(undefined, 'bold');
                doc.text(p.t, 14, currentY);
                doc.setFont(undefined, 'normal');
                const splitText = doc.splitTextToSize(p.d, 180);
                doc.text(splitText, 14, currentY + 4);
                currentY += (splitText.length * 5) + 2;
            });

            // --- RESUMEN DE PAGOS ---
            currentY += 5;
            if (currentY > 230) { doc.addPage(); currentY = 20; }

            doc.setFillColor(245, 245, 245);
            doc.rect(130, currentY, 65, 35, 'F');
            doc.setFont(undefined, 'bold');
            doc.text("RESUMEN ECONÓMICO", 135, currentY + 7);
            doc.setFont(undefined, 'normal');
            doc.text(`TOTAL: $${subtotal.toLocaleString()}`, 135, currentY + 15);
            doc.text(`Anticipo (30%): $${(subtotal * 0.3).toLocaleString()}`, 135, currentY + 22);
            doc.setTextColor(190, 0, 0);
            doc.text(`Saldo Pendiente: $${saldoPendiente.toLocaleString()}`, 135, currentY + 29);
            doc.setTextColor(0, 0, 0);

            // --- SECCIÓN DE FIRMAS ---
            currentY += 50;
            doc.setLineWidth(0.5);
            doc.line(20, currentY, 80, currentY);
            doc.line(130, currentY, 190, currentY);
            doc.setFont(undefined, 'bold');
            doc.text("JULIO LÓPEZ", 50, currentY + 5, { align: "center" });
            doc.text("FIRMA DEL CLIENTE", 160, currentY + 5, { align: "center" });

            // --- SALIDA ---
            doc.save(`Cotizacion_${cliente.nombre.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "PDF generado", status: "success" });

        } catch (e) {
            console.error("Error PDF:", e);
            toast({ title: "Error", description: e.message, status: "error" });
        }
    };
    // --- NAVEGACIÓN Y GUARDADO ---
    const handleSiguiente = async () => {
        // 1. Validaciones iniciales del Paso 1
        if (paso === 1) {
            if (!cliente.nombre || !cliente.telefono) {
                return toast({
                    title: "Datos incompletos",
                    description: "Nombre y teléfono son obligatorios",
                    status: "error",
                    position: "top"
                });
            }

            // Caso: Cliente nuevo (Sin ID)
            if (!cliente.id && !isReadOnly) {
                setLoading(true);
                try {
                    const res = await rentasService.crearCliente({
                        nombre: cliente.nombre,
                        telefono: cliente.telefono,
                        direccion: cliente.direccion,
                        email: cliente.email
                    });

                    if (res.status === "success") {
                        setCliente({ ...cliente, id: res.data.id });
                        toast({ title: "Cliente registrado", status: "success" });
                        setPaso(2);
                    }
                } catch (err) {
                    toast({ title: "Error", description: "No se pudo registrar al cliente", status: "error" });
                } finally {
                    // ESTA LÍNEA ES VITAL: Pase lo que pase, dejamos de cargar
                    setLoading(false);
                }
                return; // Detenemos aquí porque ya manejamos el avance al paso 2
            }

            // Caso: Cliente ya tiene ID (Seleccionado del dropdown)
            setPaso(2);
            return;
        }

        // --- PASO 2: FECHAS ---
        if (paso === 2) {
            if (!fechas.inicio || !fechas.fin) {
                return toast({ title: "Fechas incompletas", status: "warning" });
            }
            // Validación lógica de fechas
            if (new Date(fechas.fin) < new Date(fechas.inicio)) {
                return toast({
                    title: "Rango inválido",
                    description: "La recolección no puede ser previa a la entrega",
                    status: "error"
                });
            }
        }

        // Para cualquier otro paso (3, 4), avanzar normalmente
        setPaso(paso + 1);
    };

    const handleFinalizar = async () => {
        // 1. Validaciones básicas
        if (carrito.length === 0) return toast({ title: "Carrito vacío", status: "warning" });

        setLoading(true);

        try {
            // Calculamos el total abonado sumando el array de abonos
            const totalAbonado = pago.abonos?.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0) || 0;

            // 2. Estructura de datos para el Backend
            const payload = {
                cliente_id: cliente.id,
                usuario_id: 1,
                fecha_inicio: fechas.inicio,
                fecha_fin: fechas.fin,
                hora_entrega: fechas.horaEntrega,
                anticipo: totalAbonado,       // Enviamos la suma total de abonos
                // estado: estadoRenta,          // Ahora ya está definido
                metodo_pago: pago.abonos[0]?.metodo || "Efectivo",
                total: subtotal,
                abonos: pago.abonos,          // Enviamos el array completo para la tabla renta_abonos
                productos: carrito.map(p => ({
                    producto_id: p.esServicio ? null : p.id,
                    nombre_servicio: p.esServicio ? p.nombre : null,
                    cantidad: parseInt(p.cantidad),
                    precio_unitario: parseFloat(p.precio)
                }))
            };

            // 3. Decidir si es Actualización o Creación Nueva
            if (modo === "edit" || (isViewMode && modo !== "create")) {
                // Usamos el servicio de actualización con transacciones
                await rentasService.actualizarRentaConAbonos(rentaSeleccionada.id, payload);
                toast({ title: "Renta y abonos actualizados", status: "success" });
            } else {
                // Proceso de guardado normal para rentas nuevas
                const res = await rentasService.guardarRenta(payload);
                toast({ title: "Renta guardada con éxito", status: "success" });

                if (res.data?.id) generarPDF(res.data.id);
            }

            // 4. Finalizar
            onCrear();
            onClose();
        } catch (error) {
            console.error("Error al guardar:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Ocurrió un problema al guardar",
                status: "error"
            });
        } finally {
            setLoading(false);
        }
    };
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={{ base: "full", md: "6xl" }}
            motionPreset="slideInBottom"
            scrollBehavior="inside"
        >
            <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.700" />
            <ModalContent
                bg="gray.50"
                borderRadius={{ base: "0", md: "2xl" }}
                h={{ base: "100vh", md: "auto" }}
                maxH="100vh"
                overflow="hidden"
                m={{ base: 0, md: 4 }}
            >

                {/* --- HEADER --- */}
                <ModalHeader bg="white" borderBottom="1px solid" borderColor="gray.200" py={5}>
                    <Flex
                        justify="space-between"
                        align={{ base: "start", lg: "center" }}
                        direction={{ base: "column", lg: "row" }}
                        gap={{ base: 4, lg: 0 }}
                        px={{ base: 3, md: 6 }}
                    >
                        <HStack spacing={4}>
                            <Box bg={isViewMode ? "orange.500" : "teal.500"} p={2} borderRadius="lg" color="white">
                                <Icon as={isViewMode ? FaEye : FaPlus} w={6} h={6} />
                            </Box>
                            <Box>
                                <Text fontSize="xl" fontWeight="black" color="gray.800">
                                    {isViewMode ? `Renta #R-${rentaSeleccionada?.id}` : "Nueva Renta"}
                                </Text>
                                <Badge colorScheme={isViewMode ? "orange" : "teal"}>MODO {modo.toUpperCase()}</Badge>
                            </Box>
                        </HStack>

                        <HStack spacing={8}>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <VStack key={num} spacing={1}>
                                    <CircleStep num={num} activo={paso >= num} actual={paso === num} color={isViewMode ? "orange" : "teal"} />
                                    <Text display={{ base: "none", md: "block" }} fontSize="10px" fontWeight="bold" color={paso >= num ? (isViewMode ? "orange.600" : "teal.600") : "gray.400"}>
                                        {num === 1 ? "CLIENTE" : num === 2 ? "FECHAS" : num === 3 ? "EQUIPO" : num === 4 ? "PAGO" : "FINAL"}
                                    </Text>
                                </VStack>
                            ))}
                        </HStack>
                        <HStack
                            spacing={3}
                            w={{ base: "full", lg: "auto" }}
                            justify={{ base: "space-between", lg: "flex-end" }}
                        >
                            {isViewMode && (
                                <Button leftIcon={<FaFilePdf />} colorScheme="red" variant="solid" onClick={() => generarPDF()}>
                                    DESCARGAR PDF
                                </Button>
                            )}
                            <ModalCloseButton position="static" />
                        </HStack>
                    </Flex>
                </ModalHeader>

                <ModalBody p={0} overflow="hidden">
                    <Grid templateColumns="repeat(12, 1fr)" h="calc(100vh - 180px)">

                        {/* Area Principal */}
                        <GridItem
                            colSpan={{ base: 12, lg: 8 }}
                            p={{ base: 4, md: 8, lg: 12 }}
                            overflowY="auto"
                            maxH={{ base: "auto", lg: "calc(100vh - 180px)" }}
                            bg="gray.50"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div key={paso} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <Box maxW="850px" mx="auto">
                                        {paso === 1 && <PasoCliente cliente={cliente} setCliente={setCliente} busqueda={busquedaCliente} setBusqueda={setBusquedaCliente} sugerencias={sugerenciasClientes} setSugerencias={setSugerenciasClientes} isReadOnly={isReadOnly} />}
                                        {paso === 2 && <PasoFechas fechas={fechas} setFechas={setFechas} isReadOnly={isReadOnly} />}
                                        {paso === 3 && <PasoEquipo productos={productosDB} agregar={agregarAlCarrito} agregarServicio={agregarServicioEspecial} />}
                                        {paso === 4 && <PasoPago subtotal={subtotal} pago={pago} setPago={setPago} saldo={saldoPendiente} isReadOnly={isReadOnly} />}
                                        {paso === 5 && (
                                            <PasoConfirmar
                                                cliente={cliente}
                                                subtotal={subtotal}
                                                pago={pago}        // <--- Falta esta
                                                fechas={fechas}    // <--- Y esta
                                                isViewMode={isViewMode}
                                            />
                                        )}
                                    </Box>
                                </motion.div>
                            </AnimatePresence>
                        </GridItem>

                        {/* Sidebar Carrito */}
                        <GridItem
                            colSpan={{ base: 12, lg: 4 }}
                            order={{ base: 2, lg: 1 }}
                            bg="white"
                            p={{ base: 3, md: 6, lg: 8 }}
                            maxH={{ base: "320px", lg: "none" }}
                            borderLeft="1px solid"
                            borderColor="gray.100"
                            position="relative"
                            overflow="hidden"
                        >
                            <VStack
                                align="stretch"
                                h="full"
                                spacing={{ base: 3, md: 6 }}
                            >

                                {/* --- CABECERA DEL CARRITO --- */}
                                <Flex justify="space-between" align="center">
                                    <HStack spacing={{ base: 2, md: 3 }}>
                                        <Center
                                            bg="teal.50"
                                            p={{ base: 1.5, md: 2 }}
                                            borderRadius="xl"
                                        >
                                            <Icon
                                                as={FaShoppingCart}
                                                color="teal.600"
                                                w={{ base: 4, md: 5 }}
                                                h={{ base: 4, md: 5 }}
                                            />
                                        </Center>

                                        <VStack align="start" spacing={0}>
                                            <Text
                                                fontWeight="900"
                                                fontSize={{ base: "md", md: "lg" }}
                                                letterSpacing="tight"
                                                color="gray.800"
                                            >
                                                RESUMEN
                                            </Text>

                                            <Text
                                                display={{ base: "none", md: "block" }}
                                                fontSize="xs"
                                                color="gray.400"
                                                fontWeight="bold"
                                            >
                                                ORDEN DE SERVICIO
                                            </Text>
                                        </VStack>
                                    </HStack>

                                    <Badge
                                        variant="subtle"
                                        colorScheme="teal"
                                        borderRadius="lg"
                                        px={{ base: 2, md: 3 }}
                                        py={1}
                                        fontSize={{ base: "10px", md: "sm" }}
                                        fontWeight="black"
                                    >
                                        {carrito.length} {carrito.length === 1 ? 'ITEM' : 'ITEMS'}
                                    </Badge>
                                </Flex>

                                {/* --- LISTA DE PRODUCTOS --- */}
                                <VStack
                                    align="stretch"
                                    flex={1}
                                    overflowY="auto"
                                    spacing={{ base: 2, md: 3 }}
                                    pr={1}
                                    sx={{
                                        '&::-webkit-scrollbar': {
                                            width: '4px'
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            background: 'transparent'
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: '#E2E8F0',
                                            borderRadius: '10px'
                                        },
                                        '&:hover::-webkit-scrollbar-thumb': {
                                            background: '#CBD5E0'
                                        }
                                    }}
                                >
                                    {carrito.length > 0 ? (
                                        carrito.map(item => (
                                            <CardItemCarrito
                                                key={item.id}
                                                item={item}
                                                onUpdate={actualizarItemCarrito}
                                                onDelete={(id) =>
                                                    setCarrito(carrito.filter(i => i.id !== id))
                                                }
                                            />
                                        ))
                                    ) : (
                                        <Center
                                            flex={1}
                                            flexDir="column"
                                            opacity={0.3}
                                            py={6}
                                        >
                                            <Icon
                                                as={FaBoxOpen}
                                                w={{ base: 8, md: 12 }}
                                                h={{ base: 8, md: 12 }}
                                                mb={2}
                                            />

                                            <Text
                                                fontWeight="bold"
                                                fontSize={{ base: "sm", md: "md" }}
                                            >
                                                Carrito vacío
                                            </Text>
                                        </Center>
                                    )}
                                </VStack>

                                {/* --- SECCIÓN DE TOTALES --- */}
                                <Box
                                    bg="gray.50"
                                    p={{ base: 3, md: 6 }}
                                    borderRadius={{ base: "2xl", md: "3xl" }}
                                    border="1px solid"
                                    borderColor="gray.100"
                                >
                                    <VStack
                                        spacing={{ base: 2, md: 3 }}
                                        mb={{ base: 4, md: 6 }}
                                    >

                                        <Flex justify="space-between" w="full">
                                            <Text
                                                color="gray.500"
                                                fontSize={{ base: "xs", md: "sm" }}
                                                fontWeight="medium"
                                            >
                                                Subtotal Equipo
                                            </Text>

                                            <Text
                                                fontWeight="bold"
                                                color="gray.700"
                                                fontSize={{ base: "sm", md: "md" }}
                                            >
                                                ${subtotal.toLocaleString()}
                                            </Text>
                                        </Flex>

                                        {pago.anticipo > 0 && (
                                            <Flex justify="space-between" w="full">
                                                <Text
                                                    color="teal.500"
                                                    fontSize={{ base: "xs", md: "sm" }}
                                                    fontWeight="medium"
                                                >
                                                    Anticipo recibido
                                                </Text>

                                                <Text
                                                    fontWeight="bold"
                                                    color="teal.600"
                                                    fontSize={{ base: "sm", md: "md" }}
                                                >
                                                    -${pago.anticipo.toLocaleString()}
                                                </Text>
                                            </Flex>
                                        )}

                                        <Divider
                                            borderColor="gray.200"
                                            borderStyle="dashed"
                                        />

                                        <Flex
                                            justify="space-between"
                                            w="full"
                                            align="center"
                                            pt={2}
                                            gap={2}
                                        >
                                            <VStack align="start" spacing={0}>
                                                <Text
                                                    fontSize="10px"
                                                    fontWeight="black"
                                                    color="gray.400"
                                                    textTransform="uppercase"
                                                >
                                                    Total a Pagar
                                                </Text>

                                                <Text
                                                    fontSize={{ base: "xl", md: "3xl" }}
                                                    fontWeight="900"
                                                    color="gray.800"
                                                    lineHeight="1"
                                                >
                                                    ${(subtotal).toLocaleString()}
                                                </Text>
                                            </VStack>

                                            {saldoPendiente > 0 && paso > 3 && (
                                                <Badge
                                                    colorScheme="red"
                                                    variant="solid"
                                                    borderRadius="md"
                                                    fontSize="10px"
                                                    px={2}
                                                    py={1}
                                                    textAlign="center"
                                                >
                                                    PENDIENTE:
                                                    <br />
                                                    ${saldoPendiente.toLocaleString()}
                                                </Badge>
                                            )}
                                        </Flex>
                                    </VStack>

                                    {/* --- BOTONES --- */}
                                    <HStack spacing={3}>
                                        {paso > 1 && (
                                            <IconButton
                                                icon={<FaChevronLeft />}
                                                onClick={() => setPaso(paso - 1)}
                                                variant="ghost"
                                                size="lg"
                                                h={{ base: "45px", md: "60px" }}
                                                w={{ base: "45px", md: "60px" }}
                                                borderRadius="2xl"
                                                _hover={{ bg: "gray.200" }}
                                            />
                                        )}

                                        <Button
                                            colorScheme={
                                                isViewMode && paso === 5
                                                    ? "orange"
                                                    : "teal"
                                            }
                                            size="lg"
                                            w="full"
                                            h={{ base: "45px", md: "60px" }}
                                            borderRadius="2xl"
                                            shadow={paso === 5 ? "xl" : "md"}
                                            rightIcon={
                                                paso === 5
                                                    ? (
                                                        isViewMode
                                                            ? <FaSave />
                                                            : <FaCheckCircle />
                                                    )
                                                    : <FaChevronRight />
                                            }
                                            onClick={
                                                paso === 5
                                                    ? handleFinalizar
                                                    : handleSiguiente
                                            }
                                            isLoading={loading}
                                            _hover={{
                                                transform: "translateY(-2px)",
                                                shadow: "lg"
                                            }}
                                            transition="all 0.2s"
                                        >
                                            <Text
                                                fontSize={{ base: "xs", md: "md" }}
                                                fontWeight="black"
                                                letterSpacing="wider"
                                            >
                                                {paso === 5
                                                    ? (
                                                        isViewMode
                                                            ? "GUARDAR"
                                                            : "FINALIZAR"
                                                    )
                                                    : "CONTINUAR"}
                                            </Text>
                                        </Button>
                                    </HStack>
                                </Box>
                            </VStack>
                        </GridItem>
                    </Grid>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

// --- SUBCOMPONENTES ---

const PasoCliente = ({ cliente, setCliente, busqueda, setBusqueda, sugerencias, setSugerencias, isReadOnly }) => (
    <VStack align="stretch" spacing={8}>
        <HeadingStep
            icon={FaUser}
            title="Perfil del Cliente"
            subtitle="Identifica al contratante para personalizar el contrato legal."
        />

        {/* Buscador Estilizado */}
        {!isReadOnly && (
            <Box position="relative">
                <HStack
                    bg="white"
                    p={1}
                    borderRadius="2xl"
                    shadow="sm"
                    border="1px solid"
                    borderColor="gray.200"
                    _focusWithin={{ borderColor: "teal.400", shadow: "md" }}
                    transition="all 0.2s"
                >
                    <Center pl={4} color="gray.400">
                        <Icon as={FaSearch} />
                    </Center>
                    <Input
                        placeholder="Buscar cliente por nombre o teléfono..."
                        variant="unstyled"
                        size="lg"
                        h="60px"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </HStack>

                {/* Lista de Sugerencias Mejorada */}
                {/* Lista de Sugerencias (Dropdown) */}
                <AnimatePresence>
                    {sugerencias.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{ position: 'absolute', width: '100%', zIndex: 100 }}
                        >
                            <List
                                bg="white"
                                shadow="2xl"
                                borderRadius="xl"
                                mt={2}
                                border="1px solid"
                                borderColor="gray.100"
                                overflow="hidden"
                                maxH="300px"
                                overflowY="auto"
                            >
                                {sugerencias.map(c => (
                                    <ListItem
                                        key={c.id}
                                        p={4}
                                        _hover={{ bg: "teal.50", color: "teal.700" }}
                                        cursor="pointer"
                                        onClick={() => {
                                            setCliente(c);      // Aquí cargamos ID, nombre, tel, etc.
                                            setSugerencias([]); // Cerramos dropdown
                                            setBusqueda("");    // Limpiamos buscador
                                        }}
                                    >
                                        <HStack spacing={4}>
                                            <Avatar size="sm" name={c.nombre} />
                                            <Box>
                                                <Text fontWeight="bold" fontSize="sm">{c.nombre}</Text>
                                                <Text fontSize="xs" color="gray.500">{c.telefono}</Text>
                                            </Box>

                                            <Badge colorScheme="teal">Seleccionar</Badge>
                                        </HStack>
                                    </ListItem>
                                ))}
                            </List>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>
        )}
        {cliente.id && (
            <HStack bg="teal.50" p={3} borderRadius="xl" mb={4} justify="space-between">
                <HStack>
                    <Icon as={FaCheckCircle} color="teal.500" />
                    <Text fontSize="xs" fontWeight="bold" color="teal.700">
                        CLIENTE SELECCIONADO DE LA BASE DE DATOS
                    </Text>
                </HStack>
                <Button
                    size="xs"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => setCliente({ id: null, nombre: "", telefono: "", direccion: "", email: "" })}
                >
                    Cambiar / Nuevo
                </Button>
            </HStack>
        )}
        {/* Formulario Estilizado en Tarjeta */}
        <Box
            bg="white"
            p={8}
            borderRadius="3xl"
            border="1px solid"
            borderColor="gray.100"
            shadow="sm"
        >
            <SimpleGrid columns={2} spacing={6}>
                <FormControl isReadOnly={isReadOnly} isRequired>
                    <FormLabel fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">
                        Nombre Completo
                    </FormLabel>
                    <Input
                        h="55px"
                        borderRadius="xl"
                        bg="gray.50"
                        border="none"
                        _focus={{ bg: "white", ring: "2px", ringColor: "teal.400" }}
                        value={cliente.nombre}
                        onChange={e => setCliente({ ...cliente, nombre: e.target.value })}
                    />
                </FormControl>

                <FormControl isReadOnly={isReadOnly} isRequired>
                    <FormLabel fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">
                        WhatsApp / Celular
                    </FormLabel>
                    <Input
                        h="55px"
                        borderRadius="xl"
                        bg="gray.50"
                        border="none"
                        _focus={{ bg: "white", ring: "2px", ringColor: "teal.400" }}
                        value={cliente.telefono}
                        onChange={e => setCliente({ ...cliente, telefono: e.target.value })}
                    />
                </FormControl>

                <FormControl isReadOnly={isReadOnly} colSpan={2}>
                    <FormLabel fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">
                        Dirección de Entrega
                    </FormLabel>
                    <Input
                        h="55px"
                        borderRadius="xl"
                        bg="gray.50"
                        border="none"
                        _focus={{ bg: "white", ring: "2px", ringColor: "teal.400" }}
                        value={cliente.direccion}
                        onChange={e => setCliente({ ...cliente, direccion: e.target.value })}
                    />
                </FormControl>
            </SimpleGrid>
        </Box>

        {/* Tip Informativo */}
        {!isReadOnly && (
            <HStack bg="orange.50" p={4} borderRadius="2xl" spacing={4}>
                <Icon as={FaPlus} color="orange.400" />
                <Text fontSize="xs" color="orange.800">
                    Si el cliente no existe, los datos que escribas se guardarán automáticamente al continuar.
                </Text>
            </HStack>
        )}
    </VStack>
);

const PasoFechas = ({ fechas, setFechas, isReadOnly }) => {
    // Obtenemos la fecha de hoy en formato YYYY-MM-DD para el atributo min
    const hoy = new Date().toISOString().split("T")[0];

    // Validación: ¿La fecha de fin es anterior a la de inicio?
    const esFechaInvalida = fechas.fin !== "" && fechas.fin < fechas.inicio;

    const handleInicioChange = (e) => {
        const nuevaFechaInicio = e.target.value;
        // Si al cambiar el inicio, el fin queda antes, reseteamos el fin o lo igualamos
        if (fechas.fin && nuevaFechaInicio > fechas.fin) {
            setFechas({ ...fechas, inicio: nuevaFechaInicio, fin: nuevaFechaInicio });
        } else {
            setFechas({ ...fechas, inicio: nuevaFechaInicio });
        }
    };

    return (
        <VStack align="stretch" spacing={8}>
            <HeadingStep
                icon={FaCalendarAlt}
                title="Fechas"
                subtitle="Define el periodo de renta y vigencia del contrato."
            />

            <SimpleGrid columns={2} spacing={8}>
                {/* FECHA DE ENTREGA */}
                <FormControl isReadOnly={isReadOnly} isRequired>
                    <FormLabel fontWeight="bold">Fecha de Entrega</FormLabel>
                    <Input
                        type="date"
                        h="60px"
                        borderRadius="xl"
                        min={hoy}
                        value={fechas.inicio}
                        onChange={handleInicioChange}
                        css={{ colorScheme: 'light' }} // Mejora visual en algunos navegadores
                    />
                    <Text fontSize="xs" color="gray.500" mt={2}>
                        Día en que el equipo sale de almacén.
                    </Text>
                </FormControl>

                {/* FECHA DE RECOLECCIÓN */}
                <FormControl
                    isReadOnly={isReadOnly}
                    isRequired
                    isInvalid={esFechaInvalida}
                >
                    <FormLabel fontWeight="bold">Fecha de Recolección</FormLabel>
                    <Input
                        type="date"
                        h="60px"
                        borderRadius="xl"
                        min={fechas.inicio || hoy}
                        value={fechas.fin}
                        onChange={e => setFechas({ ...fechas, fin: e.target.value })}
                        css={{ colorScheme: 'light' }}
                    />
                    {esFechaInvalida ? (
                        <Text fontSize="xs" color="red.500" mt={2} fontWeight="bold">
                            La recolección debe ser después de la entrega.
                        </Text>
                    ) : (
                        <Text fontSize="xs" color="gray.500" mt={2}>
                            Día del desmontaje o devolución.
                        </Text>
                    )}
                </FormControl>
            </SimpleGrid>

            {/* Opcional: Mostrar duración de la renta */}
            {!esFechaInvalida && fechas.inicio && fechas.fin && (
                <Box p={4} bg="blue.50" borderRadius="xl" border="1px solid" borderColor="blue.100">
                    <HStack>
                        <Icon as={FaClock} color="blue.500" />
                        <Text fontSize="sm" color="blue.700" fontWeight="medium">
                            Duración estimada: {
                                Math.ceil((new Date(fechas.fin) - new Date(fechas.inicio)) / (1000 * 60 * 60 * 24)) + 1
                            } día(s).
                        </Text>
                    </HStack>
                </Box>
            )}
        </VStack>
    );
};




const PasoEquipo = ({ productos, agregar, agregarServicio }) => {
    const [filtro, setFiltro] = useState("");
    const [tabIndex, setTabIndex] = useState(0);
    const [serviciosExtra, setServiciosExtra] = useState([]);
    const [cargandoServicios, setCargandoServicios] = useState(false);

    // 1. Carga y Normalización de Servicios
    useEffect(() => {
        const cargarData = async () => {
            setCargandoServicios(true);
            try {
                const res = await rentasService.obtenerServicios();

                // Extraemos el array del response
                const rawData = Array.isArray(res) ? res : (res?.data || []);

                // NORMALIZACIÓN: Forzamos que tengan las mismas propiedades que los equipos
                const serviciosFormateados = rawData.map(s => ({
                    id: s.id,
                    nombre: s.nombre,
                    precio: parseFloat(s.precio_renta || 0),
                    stock: s.cantidad_total || 0,
                    img: s.foto_url || "https://via.placeholder.com/150?text=Servicio",
                    estado: s.estado || "Disponible",
                    categoria_id: s.categoria_id
                }));

                setServiciosExtra(serviciosFormateados);
            } catch (error) {
                console.error("Error al obtener servicios:", error);
                setServiciosExtra([]);
            } finally {
                setCargandoServicios(false);
            }
        };
        cargarData();
    }, []);

    // 2. Procesamiento de datos
    const listaProductos = Array.isArray(productos) ? productos : [];

    // Equipos: Ya vienen mapeados desde el componente padre con (id, nombre, precio, stock, img)
    const equiposData = listaProductos.filter((p) => Number(p.categoria_id) !== 6);
    const serviciosData = serviciosExtra;

    const dataAMostrar = tabIndex === 0 ? equiposData : serviciosData;

    // 3. Filtro de búsqueda
    const filtrados = dataAMostrar.filter((item) =>
        item.nombre?.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <VStack align="stretch" spacing={6}>
            {/* Encabezado */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                <Box>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800">Catálogo de Selección</Text>
                    <Text color="gray.500" fontSize="sm">
                        {tabIndex === 0 ? "Selecciona mobiliario" : "Añade servicios adicionales"}
                    </Text>
                </Box>

                <HStack spacing={3}>
                    <Button size="sm" leftIcon={<FaTruck />} colorScheme="blue" variant="subtle" borderRadius="lg" onClick={() => agregarServicio("envio")}>
                        Flete
                    </Button>
                    <Button size="sm" leftIcon={<FaTools />} colorScheme="orange" variant="subtle" borderRadius="lg" onClick={() => agregarServicio("montaje")}>
                        Montaje
                    </Button>
                </HStack>
            </Flex>

            <Tabs variant="unstyled" index={tabIndex} onChange={(index) => { setTabIndex(index); setFiltro(""); }}>
                <Flex direction={{ base: "column", md: "row" }} gap={4} align="center" mb={6}>
                    <TabList bg="gray.100" p={1} borderRadius="2xl">
                        <Tab _selected={{ bg: "white", shadow: "sm", color: "teal.600" }} borderRadius="xl" px={8} fontWeight="bold" fontSize="sm">
                            Equipos ({equiposData.length})
                        </Tab>
                        <Tab _selected={{ bg: "white", shadow: "sm", color: "orange.600" }} borderRadius="xl" px={8} fontWeight="bold" fontSize="sm">
                            Servicios ({serviciosData.length})
                        </Tab>
                    </TabList>

                    <HStack flex={1} bg="white" px={4} borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="sm" w="full" _focusWithin={{ borderColor: tabIndex === 0 ? "teal.400" : "orange.400" }}>
                        <Icon as={FaSearch} color="gray.400" />
                        <Input placeholder="Buscar..." variant="unstyled" h="48px" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
                        {filtro && <IconButton size="xs" icon={<FaTrash />} onClick={() => setFiltro("")} variant="ghost" />}
                    </HStack>
                </Flex>

                <SimpleGrid columns={{ base: 2, md: 3, xl: 4 }} spacing={5}>
                    {cargandoServicios && tabIndex === 1 ? (
                        <GridItem colSpan={4} py={10}><Center><Spinner color="orange.500" size="xl" /></Center></GridItem>
                    ) : filtrados.length > 0 ? (
                        filtrados.map((item) => (
                            <Box key={item.id} bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100" overflow="hidden" cursor="pointer" onClick={() => agregar(item)} _hover={{ shadow: "xl", transform: "translateY(-5px)" }} transition="0.3s" position="relative" role="group">
                                <Box position="absolute" top={0} left={0} w="full" h="full" bg={tabIndex === 0 ? "teal.500" : "orange.500"} opacity={0} _groupHover={{ opacity: 0.05 }} />

                                {/* Aquí usamos las propiedades normalizadas */}
                                <Image src={item.img} h="150px" w="full" objectFit="cover" fallbackSrc="https://via.placeholder.com/150?text=Cargando..." />

                                <Box p={4}>
                                    <Text fontWeight="bold" fontSize="xs" noOfLines={1} mb={1} color="gray.700" textTransform="uppercase">{item.nombre}</Text>
                                    <Flex justify="space-between" align="center">
                                        <Text color={tabIndex === 0 ? "teal.600" : "orange.600"} fontWeight="black" fontSize="lg">${item.precio}</Text>
                                        <Badge colorScheme={item.estado === 'disponible' ? 'green' : 'gray'} borderRadius="full" px={2} fontSize="9px">
                                            {tabIndex === 0 ? `Stock: ${item.stock}` : item.estado}
                                        </Badge>
                                    </Flex>
                                </Box>

                                <Center position="absolute" top={2} right={2} bg="white" w="30px" h="30px" borderRadius="full" shadow="md" opacity={0} _groupHover={{ opacity: 1 }}>
                                    <Icon as={FaPlus} color={tabIndex === 0 ? "teal.500" : "orange.500"} />
                                </Center>
                            </Box>
                        ))
                    ) : (
                        <GridItem colSpan={4} py={20}>
                            <VStack spacing={3} opacity={0.4}>
                                <Icon as={tabIndex === 0 ? FaBoxOpen : FaConciergeBell} w={12} h={12} />
                                <Text fontWeight="medium">No hay resultados</Text>
                            </VStack>
                        </GridItem>
                    )}
                </SimpleGrid>
            </Tabs>
        </VStack>
    );
};


const PasoPago = ({ subtotal, pago, setPago, saldo, isReadOnly }) => {

    // 1. MIGRACIÓN: Si vienes de la DB con un anticipo simple, lo convertimos a la tabla de abonos
    useEffect(() => {
        if (!pago.abonos || pago.abonos.length === 0) {
            if (pago.anticipo > 0) {
                setPago(prev => ({
                    ...prev,
                    abonos: [{
                        monto: parseFloat(pago.anticipo),
                        metodo: pago.metodo || "Efectivo",
                        fecha: new Date().toISOString().split('T')[0],
                        esViejo: true // Marcador interno para identificar pagos ya procesados
                    }]
                }));
            } else {
                setPago(prev => ({ ...prev, abonos: [] }));
            }
        }
    }, []);

    const apartadoSugerido = (subtotal * 0.3).toFixed(2);

    // 2. Agregar nuevo abono (Este SIEMPRE será editable)
    const agregarAbono = () => {
        const nuevosAbonos = [
            ...(pago.abonos || []),
            {
                monto: 0,
                metodo: "Efectivo",
                fecha: new Date().toISOString().split('T')[0],
                esNuevo: true // Marcador para permitir edición
            }
        ];
        setPago({ ...pago, abonos: nuevosAbonos });
    };

    // 3. Actualizar y sincronizar con el total
    const actualizarAbono = (index, campo, valor) => {
        const nuevosAbonos = [...pago.abonos];
        let valorFinal = valor;

        if (campo === "monto") {
            valorFinal = parseFloat(valor) || 0;
        }

        nuevosAbonos[index][campo] = valorFinal;
        const nuevoAnticipoTotal = nuevosAbonos.reduce((acc, curr) => acc + curr.monto, 0);

        setPago({
            ...pago,
            abonos: nuevosAbonos,
            anticipo: nuevoAnticipoTotal
        });
    };

    const eliminarAbono = (index) => {
        const nuevosAbonos = pago.abonos.filter((_, i) => i !== index);
        const nuevoAnticipoTotal = nuevosAbonos.reduce((acc, curr) => acc + curr.monto, 0);
        setPago({ ...pago, abonos: nuevosAbonos, anticipo: nuevoAnticipoTotal });
    };

    const totalAbonado = pago.abonos?.reduce((acc, curr) => acc + curr.monto, 0) || 0;

    return (
        <VStack align="stretch" spacing={8}>
            {/* Dashboard de Totales */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Box bg="white" p={6} borderRadius="3xl" shadow="sm" border="1px solid" borderColor="gray.100">
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">Monto Total</Text>
                    <Text fontSize="3xl" fontWeight="black" color="gray.800">${subtotal.toLocaleString()}</Text>
                </Box>

                <Box bg="blue.50" p={6} borderRadius="3xl" border="1px solid" borderColor="blue.100">
                    <Text fontSize="xs" fontWeight="black" color="blue.600" textTransform="uppercase">Total Abonado</Text>
                    <Text fontSize="3xl" fontWeight="black" color="blue.700">${totalAbonado.toLocaleString()}</Text>
                </Box>

                <Box bg={saldo <= 0 ? "green.50" : "red.50"} p={6} borderRadius="3xl" border="1px solid" borderColor={saldo <= 0 ? "green.100" : "red.100"}>
                    <Text fontSize="xs" fontWeight="black" color={saldo <= 0 ? "green.600" : "red.600"} textTransform="uppercase">Saldo Restante</Text>
                    <Text fontSize="3xl" fontWeight="black" color={saldo <= 0 ? "green.700" : "red.700"}>${saldo.toLocaleString()}</Text>
                </Box>
            </SimpleGrid>

            {/* Sección de Registro */}
            <Box bg="white" p={8} borderRadius="3xl" border="1px solid" borderColor="gray.100" shadow="md">
                <Flex justify="space-between" align="center" mb={6}>
                    <HStack>
                        <Icon as={FaHistory} color="teal.500" />
                        <Text fontWeight="bold" fontSize="lg">Pagos Registrados</Text>
                    </HStack>

                    {/* El botón de agregar siempre está disponible si hay saldo */}
                    <Button
                        leftIcon={<FaPlus />}
                        colorScheme="teal"
                        size="md"
                        borderRadius="xl"
                        onClick={agregarAbono}
                        isDisabled={saldo <= 0}
                    >
                        Nuevo Abono
                    </Button>
                </Flex>

                <Box overflowX="auto">
                    <Table variant="simple">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th>Fecha</Th>
                                <Th>Monto</Th>
                                <Th>Método</Th>
                                <Th width="50px"></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {pago.abonos?.map((abono, index) => {
                                // LÓGICA DE EDICIÓN:
                                // Solo se bloquea si el padre dice ReadOnly Y el abono NO es nuevo.
                                // Si acabas de darle click a "Nuevo Abono", abono.esNuevo será true y podrás editar.
                                const bloquearEdicion = isReadOnly && !abono.esNuevo;

                                return (
                                    <Tr key={index}>
                                        <Td>
                                            <Input
                                                type="date"
                                                value={abono.fecha}
                                                size="sm"
                                                onChange={(e) => actualizarAbono(index, "fecha", e.target.value)}
                                                isReadOnly={bloquearEdicion}
                                            />
                                        </Td>
                                        <Td>
                                            <NumberInput
                                                value={abono.monto}
                                                min={0}
                                                size="sm"
                                                onChange={(v) => actualizarAbono(index, "monto", v)}
                                                isReadOnly={bloquearEdicion}
                                            >
                                                <NumberInputField fontWeight="bold" />
                                            </NumberInput>
                                        </Td>
                                        <Td>
                                            <Select
                                                value={abono.metodo}
                                                size="sm"
                                                onChange={(e) => actualizarAbono(index, "metodo", e.target.value)}
                                                isDisabled={bloquearEdicion}
                                            >
                                                <option value="Efectivo">Efectivo</option>
                                                <option value="Transferencia">Transferencia</option>
                                                <option value="Tarjeta">Tarjeta</option>
                                                <option value="Cheque">Cheque</option>
                                            </Select>
                                        </Td>
                                        <Td>
                                            {/* Solo permitimos borrar si es un abono que estamos creando apenas */}
                                            {!bloquearEdicion && (
                                                <IconButton
                                                    icon={<FaTrash />}
                                                    size="xs"
                                                    colorScheme="red"
                                                    variant="ghost"
                                                    onClick={() => eliminarAbono(index)}
                                                />
                                            )}
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>

                    {(!pago.abonos || pago.abonos.length === 0) && (
                        <Center py={10}>
                            <Button variant="outline" colorScheme="teal" onClick={agregarAbono}>
                                + Registrar primer pago
                            </Button>
                        </Center>
                    )}
                </Box>
            </Box>

            <HStack bg="orange.50" p={4} borderRadius="2xl" border="1px solid" borderColor="orange.100">
                <Icon as={FaClock} color="orange.400" />
                <Text fontSize="xs" color="orange.700">
                    <b>Política:</b> El apartado sugerido es de 30% (${parseFloat(apartadoSugerido).toLocaleString()}).
                </Text>
            </HStack>
        </VStack>
    );
};


const PasoConfirmar = ({ cliente, subtotal, pago, fechas }) => {
    const totalAbonado = pago.abonos?.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0) || 0;
    const saldo = subtotal - totalAbonado;

    return (
        <VStack align="stretch" spacing={6}>
            <HeadingStep icon={FaCheckCircle} title="Revisión Final" subtitle="Verifica los montos antes de guardar." />

            <SimpleGrid columns={2} spacing={6}>
                <Box p={5} bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100">
                    <Text fontWeight="bold" mb={2} color="teal.600">Cliente</Text>
                    <Text fontSize="lg" fontWeight="black">{cliente.nombre}</Text>
                    <Text fontSize="sm" color="gray.500">{cliente.telefono}</Text>
                </Box>

                <Box p={5} bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100">
                    <Text fontWeight="bold" mb={2} color="orange.600">Fechas del Evento</Text>
                    <Text fontSize="sm"><b>Entrega:</b> {fechas.inicio}</Text>
                    <Text fontSize="sm"><b>Recolección:</b> {fechas.fin}</Text>
                </Box>
            </SimpleGrid>

            <Box p={6} bg="gray.800" borderRadius="3xl" color="white">
                <HStack justify="space-between" mb={2}>
                    <Text>Monto Total:</Text>
                    <Text fontWeight="bold">${subtotal.toLocaleString()}</Text>
                </HStack>
                <HStack justify="space-between" mb={2} color="teal.300">
                    <Text>Abonos capturados:</Text>
                    <Text fontWeight="bold">-${totalAbonado.toLocaleString()}</Text>
                </HStack>
                <Divider my={3} opacity={0.2} />
                <HStack justify="space-between">
                    <Text fontSize="xl" fontWeight="bold">Saldo Restante:</Text>
                    <Text fontSize="2xl" fontWeight="900" color={saldo > 0 ? "red.400" : "green.400"}>
                        ${saldo.toLocaleString()}
                    </Text>
                </HStack>
            </Box>
        </VStack>
    );
};
const CircleStep = ({ num, activo, actual, color }) => (
    <Center w="40px" h="40px" borderRadius="full" bg={activo ? `${color}.500` : "gray.100"} color={activo ? "white" : "gray.400"} border={actual ? "2px solid" : "none"} borderColor={`${color}.200`}>
        {num}
    </Center>
);

const CardItemCarrito = ({ item, onUpdate, onDelete }) => (
    <Box p={3} bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
        <Flex align="center" gap={3}>
            <Center w="40px" h="40px" bg="gray.50" borderRadius="lg" fontSize="xl">
                {item.esServicio ? "🛠️" : <Image src={item.img} borderRadius="md" />}
            </Center>
            <VStack align="start" flex={1} spacing={0}>
                <Text fontSize="xs" fontWeight="black" noOfLines={1}>{item.nombre}</Text>
                <Text fontSize="10px" color="gray.400">${parseFloat(item.precio).toLocaleString()} c/u</Text>
            </VStack>
            <HStack spacing={2}>
                <NumberInput
                    size="xs"
                    maxW="50px"
                    value={item.cantidad}
                    min={1}
                    onChange={(v) => onUpdate(item.id, 'cantidad', v)}
                >
                    <NumberInputField borderRadius="md" fontWeight="bold" />
                </NumberInput>
                <IconButton
                    icon={<FaTrash />}
                    size="xs"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => onDelete(item.id)}
                />
            </HStack>
        </Flex>
    </Box>
);


function HeadingStep({ icon, title, subtitle }) {
    return (
        <HStack spacing={4}>
            <Center bg="gray.100" p={4} borderRadius="2xl"><Icon as={icon} w={6} h={6} /></Center>
            <Box><Text fontWeight="black" fontSize="2xl">{title}</Text><Text color="gray.500">{subtitle}</Text></Box>
        </HStack>
    );
}