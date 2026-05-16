import React, { useState, useMemo, useEffect } from "react";
import {
    Box, Card, Flex, Text, Icon, useColorModeValue,
    HStack, Badge, VStack, SimpleGrid, Button,
    IconButton, Input, InputGroup, InputLeftElement,
    Image, Spinner, useToast,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
    Table, Th, Td, Tr, Thead, Tbody, Divider, Avatar, Tooltip
} from "@chakra-ui/react";
import {
    MdAccessTime, MdChevronLeft, MdChevronRight, MdSearch,
    MdCalendarToday, MdInventory2, MdPerson, MdReceipt, MdLocationOn, MdCalendarMonth
} from "react-icons/md";
import api from "../../../api/api"

export default function CalendarioRentas() {
    // --- ESTADOS Y MODAL ---
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [fechaReferencia, setFechaReferencia] = useState(new Date());
    const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().toISOString().split('T')[0]);
    const [rentaDetalle, setRentaDetalle] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [disponibilidadDia, setDisponibilidadDia] = useState([]);
    const [eventosDelDia, setEventosDelDia] = useState([]);
    const [eventosMes, setEventosMes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const toast = useToast();
    const mesActual = fechaReferencia.getMonth();
    const anioActual = fechaReferencia.getFullYear();

    // --- HOOKS DE COLOR (TOP-LEVEL) ---
    const textColor = useColorModeValue("secondaryGray.900", "white");
    const textColorSecondary = "secondaryGray.600";
    const cardBg = useColorModeValue("white", "navy.800");
    const borderCol = useColorModeValue("gray.100", "whiteAlpha.200");
    const brandColor = useColorModeValue("brand.500", "brand.400");
    const hoverBg = useColorModeValue("gray.50", "whiteAlpha.100");
    const cellSelectedBg = useColorModeValue("brand.50", "whiteAlpha.200");
    const itemBoxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.50");
    const taskBoxBg = useColorModeValue("gray.50", "navy.700");
    const emptyDayBg = useColorModeValue("secondaryGray.100", "navy.900");
    const progressTrackColor = useColorModeValue("gray.100", "whiteAlpha.100");
    const tableHeaderBg = useColorModeValue("gray.50", "navy.900");

    // --- LÓGICA DE COLORES CONSISTENTES ---
    const getRentaColor = (id) => {
        const palette = ["#4299E1", "#48BB78", "#F6E05E", "#ED64A6", "#9F7AEA", "#ED8936", "#667EEA", "#38B2AC"];
        return palette[id % palette.length];
    };

    // --- EFECTOS ---
    useEffect(() => { fetchData(diaSeleccionado); }, [diaSeleccionado]);
    useEffect(() => { fetchOcupacionMes(); }, [mesActual, anioActual]);

    const fetchData = async (fecha) => {
        setIsLoading(true);
        try {
            const response = await api.get(`https://backinventario-g921.onrender.com/api/rentas/disponibilidad?fecha=${fecha}`);
            if (response.data.success) {
                setDisponibilidadDia(response.data.disponibilidad);
                setEventosDelDia(response.data.eventos);
            }
        } catch (error) { console.error(error); }
        finally { setIsLoading(false); }
    };

    const fetchOcupacionMes = async () => {
        try {
            const response = await api.get(`https://backinventario-g921.onrender.com/api/rentas/ocupacion-mensual?anio=${anioActual}&mes=${mesActual}`);
            if (response.data.success) setEventosMes(response.data.ocupacion);
        } catch (error) { console.error("Error mes:", error); }
    };

    const abrirDetalle = (renta) => {
        setRentaDetalle(renta);
        onOpen();
    };

    // --- LÓGICA CALENDARIO ---
    const diasDelCalendario = useMemo(() => {
        const dias = [];
        const primerDiaMes = new Date(anioActual, mesActual, 1).getDay();
        const ultimoDiaMes = new Date(anioActual, mesActual + 1, 0).getDate();
        for (let i = 0; i < primerDiaMes; i++) dias.push({ vacio: true });
        for (let d = 1; d <= ultimoDiaMes; d++) {
            const f = new Date(anioActual, mesActual, d, 12, 0, 0);
            dias.push({ numero: d, fechaISO: f.toISOString().split('T')[0] });
        }
        return dias;
    }, [mesActual, anioActual]);

    const getRentasDelDia = (fechaISO) => eventosMes.filter(r => fechaISO >= r.fecha_inicio && fechaISO <= r.fecha_fin);
    const mesesLabels = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const formatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    });
    // --- CÁLCULOS DE TOTALES (CON PROTECCIÓN) ---
    const { totalRenta, totalAbonado, saldoPendiente } = useMemo(() => {
        // Si no hay ninguna renta seleccionada, devolvemos ceros
        if (!rentaDetalle) {
            return { totalRenta: 0, totalAbonado: 0, saldoPendiente: 0 };
        }

        const total = rentaDetalle.detalles?.reduce((acc, item) =>
            acc + Number(item.subtotal || 0), 0) || 0;

        const abonado = rentaDetalle.abonos?.reduce((acc, abono) =>
            acc + Number(abono.monto || 0), 0) || 0;

        return {
            totalRenta: total,
            totalAbonado: abonado,
            saldoPendiente: total - abonado
        };
    }, [rentaDetalle]); // Solo se vuelve a calcular cuando cambia rentaDetalle

    return (
        <Box
            pt={{ base: "110px", md: "80px" }}
            px={{ base: "10px", md: "20px" }}
            minH="100vh"
            overflowX="hidden"
            bg={useColorModeValue("gray.50", "navy.900")}
        >
            {/* SECCIÓN INVENTARIO PRO */}
            <Card p="24px" mb="25px" bg={cardBg} border="none" boxShadow="0px 18px 40px rgba(112, 144, 176, 0.12)">
                <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" mb="20px">
                    <HStack spacing={4}>
                        <Box p="10px" bg={brandColor} borderRadius="12px">
                            <Icon as={MdInventory2} w="20px" h="20px" color="white" />
                        </Box>
                        <VStack align="start" spacing={1}>
                            <HStack spacing={3}>
                                <Text color={textColor} fontSize="xl" fontWeight="800">
                                    Estado de Inventario
                                </Text>
                                {/* Badge que muestra el día seleccionado con estilo High-End */}
                                <Badge
                                    variant="subtle"
                                    colorScheme="brand"
                                    borderRadius="full"
                                    px={3}
                                    py={1}
                                    fontSize="xs"
                                    textTransform="none"
                                >
                                    <HStack spacing={1}>
                                        <Icon as={MdCalendarToday} />
                                        <Text>
                                            {diaSeleccionado
                                                ? new Date(diaSeleccionado + "T00:00:00").toLocaleDateString('es-MX', {
                                                    day: 'numeric',
                                                    month: 'long'
                                                })
                                                : "Selecciona un día"}
                                        </Text>
                                    </HStack>
                                </Badge>
                            </HStack>
                            <Text color={textColorSecondary} fontSize="sm">
                                Artículos disponibles para el {diaSeleccionado
                                    ? `día ${diaSeleccionado.split('-')[2]}`
                                    : "día seleccionado"}
                            </Text>
                        </VStack>
                    </HStack>

                    <InputGroup w={{ base: "100%", md: "350px" }} mt={{ base: "15px", md: "0" }}>
                        <InputLeftElement children={<MdSearch color="gray.400" />} />
                        <Input
                            variant="filled"
                            placeholder="Buscar artículo por nombre..."
                            borderRadius="15px"
                            _focus={{ borderColor: brandColor }}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </InputGroup>
                </Flex>
                <HStack
                    spacing={{ base: "12px", md: "20px" }}
                    overflowX="auto"
                    pb="10px"
                    css={{
                        "&::-webkit-scrollbar": {
                            height: "6px",
                        },
                        "&::-webkit-scrollbar-thumb": {
                            background: "#A0AEC0",
                            borderRadius: "24px",
                        },
                    }}
                >
                    {disponibilidadDia.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(item => (
                        <Box
                            key={item.id}
                            minW={{ base: "170px", md: "220px" }}
                            maxW={{ base: "170px", md: "220px" }}
                            p={{ base: "12px", md: "15px" }}
                            bg={itemBoxBg}
                            borderRadius="20px"
                            border="1px solid"
                            borderColor={borderCol}
                            transition="0.2s"
                            flexShrink={0}
                            _hover={{
                                transform: "translateY(-4px)",
                            }}
                        >
                            <HStack mb={3}>
                                <Image
                                    src={item.foto || 'https://via.placeholder.com/100'}
                                    boxSize="50px"
                                    borderRadius="12px"
                                    fallback={<Box boxSize="50px" bg="gray.200" borderRadius="12px" />}
                                    objectFit="cover"
                                />
                                <VStack align="start" spacing={0} maxW="120px">
                                    <Text fontSize="sm" fontWeight="800" noOfLines={1} color={textColor}>{item.nombre}</Text>
                                    <Text fontSize="xs" color={textColorSecondary}>Total: {item.stock_total || item.total}</Text>
                                </VStack>
                            </HStack>
                            <Flex justify="space-between" align="center">
                                <Text fontSize="24px" fontWeight="900" color={textColor}>{item.cantidad_disponible || item.disponible}</Text>
                                <Badge variant="subtle" colorScheme={(item.cantidad_disponible || item.disponible) > 10 ? "green" : "orange"} borderRadius="8px" px={2}>
                                    {(item.cantidad_disponible || item.disponible) > 0 ? "Disponible" : "Agotado"}
                                </Badge>
                            </Flex>
                            <ProgressDia valor={((item.cantidad_disponible || item.disponible) / (item.stock_total || item.total)) * 100} trackColor={progressTrackColor} />
                        </Box>
                    ))}
                </HStack>
            </Card>
            <SimpleGrid
                columns={{ base: 1, xl: 4 }}
                spacing={{ base: "15px", md: "25px" }}
            >
                {/* CALENDARIO PREMIUM */}
                <Card gridColumn={{ xl: "span 3" }} p="0" overflow="hidden" bg={cardBg} border="none" boxShadow="0px 18px 40px rgba(112, 144, 176, 0.12)">
                    <Flex
                        p={{ base: "15px", md: "25px" }}
                        justify="space-between"
                        align={{ base: "start", md: "center" }}
                        direction={{ base: "column", md: "row" }}
                        gap={4} borderBottom="1px solid" borderColor={borderCol}>
                        <HStack spacing={4}>
                            <Icon as={MdCalendarMonth} w="24px" h="24px" color={brandColor} />
                            <Text fontSize="22px" fontWeight="800" color={textColor}>{mesesLabels[mesActual]} {anioActual}</Text>
                        </HStack>
                        <HStack bg={useColorModeValue("gray.100", "navy.900")} p="5px" borderRadius="15px">
                            <IconButton variant="ghost" icon={<MdChevronLeft />} onClick={() => setFechaReferencia(new Date(anioActual, mesActual - 1, 1))} />
                            <Button variant="ghost" fontWeight="800" fontSize="sm" onClick={() => { setFechaReferencia(new Date()); setDiaSeleccionado(new Date().toISOString().split('T')[0]); }}>HOY</Button>
                            <IconButton variant="ghost" icon={<MdChevronRight />} onClick={() => setFechaReferencia(new Date(anioActual, mesActual + 1, 1))} />
                        </HStack>
                    </Flex>
                    <Box overflowX="auto">
                        <Box minW={{ base: "900px", md: "100%" }}>
                            <SimpleGrid columns={7}>
                                {["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map(d => (
                                    <Text key={d} textAlign="center" py="15px" fontWeight="800" fontSize="xs" color="secondaryGray.500" textTransform="uppercase" letterSpacing="1px">{d.substring(0, 3)}</Text>
                                ))}
                                {diasDelCalendario.map((dia, idx) => {
                                    if (dia.vacio) return <Box key={`v-${idx}`} h={{ base: "90px", md: "130px" }} bg={emptyDayBg} opacity="0.4" borderRight="1px solid" borderBottom="1px solid" borderColor={borderCol} />;
                                    const esSeleccionado = dia.fechaISO === diaSeleccionado;
                                    const rentas = getRentasDelDia(dia.fechaISO);
                                    return (
                                        <Box
                                            key={dia.fechaISO}
                                            h="130px"
                                            borderRight="1px solid"
                                            borderBottom="1px solid"
                                            borderColor={borderCol}
                                            cursor="pointer"
                                            onClick={() => setDiaSeleccionado(dia.fechaISO)}
                                            position="relative"
                                            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                                            // --- ESTILOS DE RESALTADO PREMIUM ---
                                            bg={esSeleccionado ? cellSelectedBg : "transparent"}
                                            boxShadow={esSeleccionado ? `inset 0 0 0 2px ${brandColor}, 0px 10px 20px rgba(0,0,0,0.05)` : "none"}
                                            zIndex={esSeleccionado ? "1" : "0"}
                                            _hover={{ bg: esSeleccionado ? cellSelectedBg : hoverBg, transform: "scale(1.01)" }}
                                        >
                                            <Flex justify="space-between" m="10px" align="center">
                                                <Text
                                                    fontWeight={esSeleccionado ? "900" : "800"}
                                                    fontSize={{
                                                        base: esSeleccionado ? "sm" : "xs",
                                                        md: esSeleccionado ? "md" : "sm"
                                                    }}
                                                    color={esSeleccionado ? brandColor : textColor}
                                                    transition="all 0.2s"
                                                >
                                                    {dia.numero}
                                                </Text>
                                                {esSeleccionado && (
                                                    <Box boxSize="6px" bg={brandColor} borderRadius="full" shadow={`0 0 8px ${brandColor}`} />
                                                )}
                                                {!esSeleccionado && rentas.length > 0 && (
                                                    <Badge variant="subtle" colorScheme="brand" borderRadius="full" fontSize="10px" px={1.5}>
                                                        {rentas.length}
                                                    </Badge>
                                                )}
                                            </Flex>
                                            <VStack spacing="3px" px="4px" align="stretch">
                                                {rentas.slice(0, 3).map(r => {
                                                    const esInicio = dia.fechaISO === r.fecha_inicio;
                                                    const esFin = dia.fechaISO === r.fecha_fin;
                                                    return (
                                                        <Tooltip key={r.id} label={`${r.cliente?.nombre} - #${r.id}`} fontSize="xs">
                                                            <Box
                                                                h="20px" w="100%" bg={getRentaColor(r.id)}
                                                                borderRadius={esInicio ? "6px 0 0 6px" : esFin ? "0 6px 6px 0" : "0"}
                                                                onClick={(e) => { e.stopPropagation(); abrirDetalle(r); }}
                                                                boxShadow="sm" _hover={{ filter: "brightness(1.1)" }}
                                                            >
                                                                {(esInicio || dia.numero === 1 || idx % 7 === 0) && (
                                                                    <Text fontSize="10px" px="6px" color="white" fontWeight="800" lineHeight="20px" isTruncated>
                                                                        {r.cliente?.nombre}
                                                                    </Text>
                                                                )}
                                                            </Box>
                                                        </Tooltip>
                                                    );
                                                })}
                                                {rentas.length > 3 && <Text fontSize="10px" textAlign="center" color={textColorSecondary} fontWeight="bold">+{rentas.length - 3} más</Text>}
                                            </VStack>
                                        </Box>
                                    );
                                })}
                            </SimpleGrid>
                        </Box>
                    </Box>
                </Card>

                {/* AGENDA LATERAL PREMIUM */}
                <Card
                    p={{ base: "15px", md: "25px" }}
                    borderRadius={{ base: "20px", md: "24px" }}
                    bg={cardBg} border="none" boxShadow="0px 18px 40px rgba(112, 144, 176, 0.12)">
                    <Text fontWeight="800" fontSize="lg" mb="20px" color={textColor}>Agenda del Día</Text>
                    <VStack align="stretch" spacing={4}>
                        {eventosDelDia.map(e => (
                            <Box
                                key={e.id} p="15px" borderRadius="20px" bg={taskBoxBg}
                                borderLeft="6px solid" borderColor={getRentaColor(e.id)}
                                onClick={() => abrirDetalle(e)} cursor="pointer"
                                transition="all 0.3s" _hover={{ shadow: "lg", transform: "scale(1.02)" }}
                            >
                                <Flex align="center" justify="space-between" mb={2}>
                                    <Badge colorScheme={e.estado === 'apartada' ? "orange" : "green"} borderRadius="6px" px={2}>{e.estado.toUpperCase()}</Badge>
                                    <Text fontSize="10px" fontWeight="bold" color="gray.400">ID: #{e.id}</Text>
                                </Flex>
                                <HStack mb={2}>
                                    <Avatar size="xs" name={e.cliente?.nombre} bg={getRentaColor(e.id)} />
                                    <Text fontWeight="800" fontSize="sm" isTruncated>{e.cliente?.nombre || 'Sin cliente'}</Text>
                                </HStack>
                                <HStack color={textColorSecondary}>
                                    <Icon as={MdAccessTime} w="12px" h="12px" />
                                    <Text fontSize="10px" fontWeight="bold">Hasta: {new Date(e.fecha_fin + "T12:00:00").toLocaleDateString()}</Text>
                                </HStack>
                            </Box>
                        ))}
                        {eventosDelDia.length === 0 && (
                            <Flex direction="column" align="center" justify="center" py="50px" opacity="0.3">
                                <Icon as={MdCalendarToday} w="40px" h="40px" mb={3} />
                                <Text fontWeight="800" fontSize="xs">No hay eventos para hoy</Text>
                            </Flex>
                        )}
                    </VStack>
                </Card>
            </SimpleGrid>

            {/* MODAL DETALLE PREMIUM (ESTILO RECIBO) */}
            <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "lg" }}
                scrollBehavior="inside" isCentered>
                <ModalOverlay backdropFilter="blur(10px) saturate(180%)" />
                <ModalContent borderRadius="30px" bg={cardBg} overflow="hidden" boxShadow="0px 25px 50px rgba(0,0,0,0.2)">
                    {/* Línea decorativa superior dinámica */}
                    <Box h="10px" bg={brandColor} />

                    <ModalHeader pt={8}>
                        <Flex justify="space-between" align="center">
                            <VStack align="start" spacing={0}>
                                <Text fontSize="2xl" fontWeight="900">Resumen de Renta</Text>
                                <Text fontSize="sm" color="gray.400">Orden de Servicio #{rentaDetalle?.id}</Text>
                            </VStack>
                            <Icon as={MdReceipt} w="40px" h="40px" color={brandColor} opacity="0.5" />
                        </Flex>
                    </ModalHeader>

                    <ModalCloseButton top="25px" />

                    <ModalBody pb={8}>
                        {rentaDetalle ? (
                            <VStack align="stretch" spacing={6}>
                                {/* Panel de Información General */}
                                <SimpleGrid columns={2} spacing={6} p="20px" bg={itemBoxBg} borderRadius="20px">
                                    <VStack align="start" spacing={1}>
                                        <Text fontSize="xs" fontWeight="bold" color="gray.400">CLIENTE</Text>
                                        <HStack>
                                            <Icon as={MdPerson} color={brandColor} />
                                            <Text fontWeight="800">{rentaDetalle.cliente?.nombre || 'Sin nombre'}</Text>
                                        </HStack>
                                    </VStack>
                                    <VStack align="start" spacing={1}>
                                        <Text fontSize="xs" fontWeight="bold" color="gray.400">ESTADO</Text>
                                        <Badge
                                            colorScheme={rentaDetalle.estado === 'cancelada' ? 'red' : 'blue'}
                                            variant="solid"
                                            borderRadius="full"
                                            px={3}
                                            textTransform="uppercase"
                                        >
                                            {rentaDetalle.estado}
                                        </Badge>
                                    </VStack>
                                    <VStack align="start" spacing={1}>
                                        <Text fontSize="xs" fontWeight="bold" color="gray.400">ENTREGA</Text>
                                        <HStack>
                                            <Icon as={MdCalendarToday} size="12px" color="gray.400" />
                                            <Text fontWeight="700" fontSize="sm">{rentaDetalle.fecha_inicio}</Text>
                                        </HStack>
                                    </VStack>
                                    <VStack align="start" spacing={1}>
                                        <Text fontSize="xs" fontWeight="bold" color="gray.400">DEVOLUCIÓN</Text>
                                        <HStack>
                                            <Icon as={MdCalendarToday} size="12px" color="gray.400" />
                                            <Text fontWeight="700" fontSize="sm">{rentaDetalle.fecha_fin}</Text>
                                        </HStack>
                                    </VStack>
                                </SimpleGrid>

                                {/* Tabla de Artículos */}
                                <Box>
                                    <Text fontWeight="800" fontSize="md" mb={3} ml={1}>Artículos en Renta</Text>
                                    <Box borderRadius="15px" border="1px solid" borderColor={tableHeaderBg} overflow="hidden">
                                        <Table size={{ base: "xs", md: "sm" }} variant="simple">
                                            <Thead bg={tableHeaderBg}>
                                                <Tr>
                                                    <Th py={3} color="gray.500">Producto</Th>
                                                    <Th isNumeric color="gray.500">Cant.</Th>
                                                    <Th isNumeric color="gray.500">Subtotal</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {rentaDetalle.detalles?.map((d, i) => (
                                                    <Tr key={i} _hover={{ bg: hoverBg }} transition="0.2s">
                                                        <Td py={3}>
                                                            <HStack spacing={3}>
                                                                <Image
                                                                    src={d.producto?.foto_url || 'https://via.placeholder.com/100'}
                                                                    boxSize="40px"
                                                                    borderRadius="8px"
                                                                    objectFit="cover"
                                                                    fallback={<Box boxSize="40px" bg="gray.100" borderRadius="8px" />}
                                                                />
                                                                <VStack align="start" spacing={0}>
                                                                    <Text fontWeight="700" color={textColor} fontSize="sm" noOfLines={1}>
                                                                        {d.producto?.nombre}
                                                                    </Text>
                                                                    <Text fontSize="10px" color="gray.400">
                                                                        Unit: {formatter.format(d.precio_unitario)}
                                                                    </Text>
                                                                </VStack>
                                                            </HStack>
                                                        </Td>
                                                        <Td isNumeric fontWeight="800">
                                                            <Text fontSize="sm">x{d.cantidad}</Text>
                                                        </Td>
                                                        <Td isNumeric fontWeight="900" color={brandColor}>
                                                            {formatter.format(d.subtotal)}
                                                        </Td>
                                                    </Tr>
                                                ))}

                                                {(!rentaDetalle.detalles || rentaDetalle.detalles.length === 0) && (
                                                    <Tr>
                                                        <Td colSpan={3} textAlign="center" py={10}>
                                                            <Spinner size="xs" mr={2} />
                                                            <Text as="span" color="gray.400" fontSize="xs">Cargando detalles...</Text>
                                                        </Td>
                                                    </Tr>
                                                )}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                </Box>

                                {/* Resumen Financiero */}
                                <VStack align="stretch" spacing={2} px={2}>
                                    <Flex justify="space-between" align="center">
                                        <Text color="gray.400" fontSize="sm" fontWeight="bold">TOTAL DE LA RENTA</Text>
                                        <Text fontSize="xl" fontWeight="900" color={textColor}>
                                            {formatter.format(totalRenta)}
                                        </Text>
                                    </Flex>

                                    <Flex justify="space-between" align="center">
                                        <Text color="green.500" fontSize="xs" fontWeight="bold">TOTAL ABONADO</Text>
                                        <Text fontSize="sm" fontWeight="800" color="green.500">
                                            - {formatter.format(totalAbonado)}
                                        </Text>
                                    </Flex>

                                    <Divider />

                                    <Flex justify="space-between" align="center" pt={1}>
                                        <Text color={brandColor} fontSize="md" fontWeight="900">SALDO PENDIENTE</Text>
                                        <Badge
                                            colorScheme={saldoPendiente <= 0 ? "green" : "orange"}
                                            fontSize="md"
                                            px={3}
                                            borderRadius="lg"
                                        >
                                            {formatter.format(saldoPendiente)}
                                        </Badge>
                                    </Flex>
                                </VStack>

                                <Button
                                    colorScheme="brand"
                                    size="lg"
                                    h="60px"
                                    borderRadius="20px"
                                    leftIcon={<MdReceipt />}
                                    shadow="0px 10px 20px rgba(0,0,0,0.1)"
                                    onClick={() => toast({ title: "Generando Ticket", description: "El PDF se descargará en breve.", status: "info" })}
                                >
                                    Imprimir Comprobante
                                </Button>
                            </VStack>
                        ) : (
                            <Flex justify="center" align="center" py={20}>
                                <Spinner color={brandColor} />
                            </Flex>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}

function ProgressDia({ valor, trackColor }) {
    return (
        <Box w="100%" h="6px" bg={trackColor} borderRadius="full" mt={3} overflow="hidden">
            <Box
                w={`${Math.min(valor, 100)}%`} h="100%"
                bg={valor < 20 ? "red.400" : "brand.500"}
                borderRadius="full" transition="0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
            />
        </Box>
    );
}