import React, { useState, useEffect } from "react";
import {
    Box, SimpleGrid, Icon, Text, Flex, Stat, StatLabel, StatNumber,
    StatHelpText, StatArrow, useColorModeValue, Table, Tbody, Td,
    Th, Thead, Tr, Badge, Progress, HStack, VStack, Button,
    Divider, Spinner, Center, useDisclosure, Select
} from "@chakra-ui/react";
import {
    MdAttachMoney, MdTrendingUp, MdPriorityHigh, MdAccountBalanceWallet,
    MdPayments, MdAccountBalance, MdAddCircleOutline, MdCalendarToday
} from "react-icons/md";
import api from "../../../api/api";

// Componentes del template (Asegúrate de que estas rutas sean correctas en tu proyecto)
import Card from "components/card/Card";
import BarChart from "components/charts/BarChart";

// IMPORTACIÓN DE MODALES
import ModalGasto from "./ModalGatso"; // Verifica si el nombre es ModalGatso o ModalGasto
import ModalPago from "./ModalPago";

export default function SeccionFinanzas() {
    // --- ESTADOS DE FECHA (Control de filtros) ---
    const hoy = new Date();
    const [mesSel, setMesSel] = useState(hoy.getMonth() + 1);
    const [anioSel, setAnioSel] = useState(hoy.getFullYear());

    // --- HOOKS PARA MODALES ---
    const {
        isOpen: isPagoOpen, onOpen: onOpenPago, onClose: onClosePago
    } = useDisclosure();
    const {
        isOpen: isGastoOpen, onOpen: onGastoOpen, onClose: onGastoClose
    } = useDisclosure();

    // --- ESTADOS DE DATOS ---
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        ingresos: 0,
        gastos: 0,
        utilidad: 0,
        labels: [],
        serie: []
    });
    const [transacciones, setTransacciones] = useState([]);

    // --- ESTILOS DE CHAKRA UI ---
    const textColor = useColorModeValue("secondaryGray.900", "white");
    const brandColor = useColorModeValue("brand.500", "brand.400");
    const tableHeaderBg = useColorModeValue("gray.50", "navy.900");
    const tableRowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
    const secondaryText = "secondaryGray.600";
    const bgSelect = useColorModeValue("white", "navy.800");

    // Formateador de moneda
    const f = (val) => new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(val || 0);

    // --- CARGA DE DATOS DESDE EL BACKEND ---
    const fetchFinanzas = async () => {
        setLoading(true);
        try {
            // Se envían mes y año como Query Params para filtrar en la DB
            const resResumen = await api.get(`https://backinventario-g921.onrender.com/api/finanzas/resumen?mes=${mesSel}&anio=${anioSel}`);
            if (resResumen.data.success) {
                setStats(resResumen.data.data);
            }

            const resTrans = await api.get(`https://backinventario-g921.onrender.com/api/finanzas/transacciones?mes=${mesSel}&anio=${anioSel}`);
            if (resTrans.data.success) {
                setTransacciones(resTrans.data.data);
            }
        } catch (error) {
            console.error("Error al cargar finanzas:", error);
        } finally {
            setLoading(false);
        }
    };

    // useEffect dispara la carga cada vez que cambie el mes o el año seleccionado
    useEffect(() => {
        fetchFinanzas();
    }, [mesSel, anioSel]);

    // Pantalla de carga inicial
    if (loading && transacciones.length === 0) {
        return (
            <Center h="100vh">
                <Spinner size="xl" color="brand.500" thickness="4px" />
            </Center>
        );
    }

    return (
        <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
            {/* HEADER CON FILTROS DINÁMICOS */}
            <Flex justify="space-between" align="center" mb="25px" direction={{ base: "column", lg: "row" }} gap={4}>
                <VStack align="start" spacing={0}>
                    <Text color={textColor} fontSize="2xl" fontWeight="800">Panel Financiero Real</Text>
                    <HStack>
                        <Icon as={MdCalendarToday} color={secondaryText} />
                        <Text color={secondaryText} fontSize="sm">Periodo: {mesSel < 10 ? `0${mesSel}` : mesSel}/{anioSel}</Text>
                    </HStack>
                </VStack>

                <HStack spacing={3} wrap="wrap" justify="center">
                    {/* Selector de Mes */}
                    <Select
                        bg={bgSelect}
                        value={mesSel}
                        onChange={(e) => setMesSel(parseInt(e.target.value))}
                        w="150px"
                        borderRadius="12px"
                    >
                        <option value="1">Enero</option>
                        <option value="2">Febrero</option>
                        <option value="3">Marzo</option>
                        <option value="4">Abril</option>
                        <option value="5">Mayo</option>
                        <option value="6">Junio</option>
                        <option value="7">Julio</option>
                        <option value="8">Agosto</option>
                        <option value="9">Septiembre</option>
                        <option value="10">Octubre</option>
                        <option value="11">Noviembre</option>
                        <option value="12">Diciembre</option>
                    </Select>

                    {/* Selector de Año */}
                    <Select
                        bg={bgSelect}
                        value={anioSel}
                        onChange={(e) => setAnioSel(parseInt(e.target.value))}
                        w="110px"
                        borderRadius="12px"
                    >
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                    </Select>

                    <Divider orientation="vertical" h="30px" mx={2} />

                    <Button
                        leftIcon={<MdAddCircleOutline />}
                        colorScheme="red"
                        variant="outline"
                        borderRadius="12px"
                        onClick={onGastoOpen}
                    >
                        Registrar Gasto
                    </Button>
                    <Button
                        leftIcon={<MdAddCircleOutline />}
                        colorScheme="brand"
                        borderRadius="12px"
                        onClick={onOpenPago}
                    >
                        Nuevo Pago
                    </Button>
                </HStack>
            </Flex>

            {/* 1. KPIs (Tarjetas de estado) */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="20px" mb="20px">
                <StatCard icon={MdAttachMoney} label="Ingresos del Periodo" value={f(stats.ingresos)} help="Suma de abonos" type="increase" color={brandColor} />
                <StatCard icon={MdPriorityHigh} label="Saldos por Cobrar" value={f(12800)} help="Rentas pendientes" type="info" color="orange.400" />
                <StatCard icon={MdAccountBalanceWallet} label="Gastos del Periodo" value={f(stats.gastos)} help="Egresos registrados" type="decrease" color="red.400" />
                <StatCard icon={MdTrendingUp} label="Utilidad Neta" value={f(stats.utilidad)} help="Balance real" type="increase" color="green.400" />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, xl: 3 }} spacing="20px" mb="20px">
                {/* 2. GRÁFICO DINÁMICO */}
                <Card gridColumn={{ xl: "span 2" }} p="20px">
                    <Text color={textColor} fontSize="lg" fontWeight="700" mb="30px">Historial de Ingresos</Text>
                    <Box h="300px">
                        <BarChart
                            chartData={[
                                {
                                    name: "Ingresos",
                                    data: stats.serie && stats.serie.length > 0 ? stats.serie : [0]
                                }
                            ]}
                            chartOptions={{
                                chart: { toolbar: { show: false }, fontFamily: "Inter, sans-serif" },
                                xaxis: {
                                    categories: stats.labels && stats.labels.length > 0 ? stats.labels : ["Sin datos"],
                                    labels: { style: { colors: "#A3AED0", fontSize: "12px" } }
                                },
                                yaxis: {
                                    show: true,
                                    labels: {
                                        style: { colors: "#A3AED0", fontSize: "12px" },
                                        formatter: (val) => `$${val.toLocaleString()}`
                                    }
                                },
                                tooltip: {
                                    theme: "dark",
                                    y: { formatter: (val) => f(val) }
                                },
                                fill: {
                                    type: "gradient",
                                    gradient: {
                                        type: "vertical",
                                        shadeIntensity: 1,
                                        opacityFrom: 0.7,
                                        opacityTo: 0.9,
                                        colorStops: [
                                            { offset: 0, color: brandColor, opacity: 1 },
                                            { offset: 100, color: "#707EAE", opacity: 0.2 }
                                        ]
                                    }
                                },
                                plotOptions: {
                                    bar: { borderRadius: 10, columnWidth: "40px", dataLabels: { position: 'top' } }
                                },
                                dataLabels: {
                                    enabled: true,
                                    formatter: (val) => f(val),
                                    offsetY: -25,
                                    style: { fontSize: '10px', colors: ["#A3AED0"] }
                                }
                            }}
                        />
                    </Box>
                </Card>

                {/* 3. MÉTODOS DE PAGO (DISTRIBUCIÓN) */}
                <Card p="20px">
                    <Text color={textColor} fontSize="lg" fontWeight="700" mb="20px">Resumen de Métodos</Text>
                    <VStack spacing={4} align="stretch">
                        <MetodoItem icon={MdAccountBalance} label="Transferencias" monto={stats.ingresos * 0.7} color="blue" perc={70} f={f} />
                        <MetodoItem icon={MdPayments} label="Efectivo" monto={stats.ingresos * 0.3} color="green" perc={30} f={f} />
                        <Divider mt={4} />
                        <Text fontSize="xs" color={secondaryText} textAlign="center">
                            Los porcentajes son estimaciones basadas en el total de ingresos.
                        </Text>
                    </VStack>
                </Card>
            </SimpleGrid>

            {/* 4. TABLA DE TRANSACCIONES DETALLADA */}
            <Card p="0px" pb="20px">
                <Flex px="25px" py="20px" justify="space-between" align="center">
                    <VStack align="start" spacing={0}>
                        <Text color={textColor} fontSize="lg" fontWeight="700">Movimientos del Mes</Text>
                        {loading && <Text fontSize="xs" color="brand.500">Actualizando datos...</Text>}
                    </VStack>
                    <Button variant="ghost" colorScheme="brand" size="sm" onClick={fetchFinanzas}>Refrescar</Button>
                </Flex>
                <Table variant="simple" color="gray.500">
                    <Thead bg={tableHeaderBg}>
                        <Tr>
                            <Th>ID</Th>
                            <Th>Concepto</Th>
                            <Th>Tipo</Th>
                            <Th>Monto</Th>
                            <Th>Fecha</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {transacciones.length > 0 ? transacciones.map((t) => (
                            <Tr key={t.id} _hover={{ bg: tableRowHoverBg }}>
                                <Td fontWeight="700" color={brandColor}>{t.id}</Td>
                                <Td color={textColor} fontWeight="600">{t.concepto}</Td>
                                <Td>
                                    <Badge colorScheme={t.tipo === 'ingreso' ? 'green' : 'red'} variant="subtle">
                                        {t.tipo.toUpperCase()}
                                    </Badge>
                                </Td>
                                <Td fontWeight="800" color={t.tipo === 'ingreso' ? "green.500" : "red.500"}>
                                    {t.tipo === 'ingreso' ? '+' : '-'} {f(t.monto)}
                                </Td>
                                <Td fontSize="xs">{new Date(t.fecha).toLocaleDateString('es-MX')}</Td>
                            </Tr>
                        )) : (
                            <Tr>
                                <Td colSpan={5} textAlign="center" py={10}>No hay transacciones en este periodo.</Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </Card>

            {/* MODALES EXTERNOS */}
            <ModalGasto
                isOpen={isGastoOpen}
                onClose={onGastoClose}
                onSuccess={fetchFinanzas}
            />
            <ModalPago
                isOpen={isPagoOpen}
                onClose={onClosePago}
                onSuccess={fetchFinanzas}
            />
        </Box>
    );
}

// --- COMPONENTES AUXILIARES (StatCard y MetodoItem) ---
function StatCard({ icon, label, value, help, type, color }) {
    return (
        <Card p="15px">
            <Flex align="center">
                <Box bg="secondaryGray.300" p="10px" borderRadius="15px" mr="15px">
                    <Icon as={icon} color={color} w="24px" h="24px" />
                </Box>
                <Stat>
                    <StatLabel color="secondaryGray.600" fontSize="xs" fontWeight="700">{label}</StatLabel>
                    <StatNumber fontSize="20px" fontWeight="800">{value}</StatNumber>
                    <StatHelpText mb="0px">
                        {type !== "info" && <StatArrow type={type === "increase" ? "increase" : "decrease"} />}
                        {help}
                    </StatHelpText>
                </Stat>
            </Flex>
        </Card>
    );
}

function MetodoItem({ icon, label, monto, color, perc, f }) {
    return (
        <Box>
            <Flex justify="space-between" align="center" mb="1">
                <HStack>
                    <Icon as={icon} color={`${color}.500`} />
                    <Text fontSize="sm" fontWeight="600">{label}</Text>
                </HStack>
                <Text fontSize="sm" fontWeight="700">{f(monto)}</Text>
            </Flex>
            <Progress value={perc} colorScheme={color} size="xs" borderRadius="10px" />
        </Box>
    );
}