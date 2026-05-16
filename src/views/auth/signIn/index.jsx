/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Flex, Heading, Text, Icon, useColorModeValue, useToast,
  Avatar, SimpleGrid, VStack, HStack, Spinner, Center, Container
} from "@chakra-ui/react";
import axios from "axios";
import { MdArrowBack, MdFingerprint, MdOutlinePin } from "react-icons/md";

function SignIn() {
  // --- ESTADOS ---
  const [profiles, setProfiles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingProfiles, setFetchingProfiles] = useState(true);

  const navigate = useNavigate();
  const toast = useToast();

  // --- COLORES Y ESTILOS ---
  const textColor = useColorModeValue("navy.700", "white");
  const brandColor = useColorModeValue("brand.500", "brand.400");
  const bgGradient = useColorModeValue(
    "radial-gradient(circle at top right, #f7fafc 0%, #edf2f7 100%)",
    "radial-gradient(circle at top right, #0b1437 0%, #080b1a 100%)"
  );
  const glassBg = useColorModeValue("rgba(255, 255, 255, 0.7)", "rgba(255, 255, 255, 0.03)");
  const glassBorder = useColorModeValue("1px solid rgba(255, 255, 255, 0.4)", "1px solid rgba(255, 255, 255, 0.1)");

  // 1. CARGA DE PERFILES
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const res = await axios.get("https://backinventario-g921.onrender.com/api/auth/profiles");
        if (res.data.success) setProfiles(res.data.data);
      } catch (e) {
        toast({ title: "Error de servidor", description: "Asegúrate de que el backend esté corriendo", status: "error" });
      } finally {
        setFetchingProfiles(false);
      }
    };
    loadProfiles();
  }, []);

  // 2. LÓGICA DE TECLADO
  const handleNumberClick = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) handleLogin(newPin);
    }
  };

  const handleLogin = async (finalPin) => {
    setLoading(true);
    try {
      const res = await axios.post("https://backinventario-g921.onrender.com/api/auth/login-pin", {
        usuarioId: selectedUser.id,
        pin: finalPin
      });
      if (res.data.success) {
        localStorage.setItem("token", res.data.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.data.user));
        toast({ title: `¡Bienvenido, ${selectedUser.nombre}!`, status: "success", position: "top" });
        navigate("/admin/default");
      }
    } catch (error) {
      toast({ title: "PIN Incorrecto", status: "error", position: "top" });
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfiles) return <Center h="100vh" bg={bgGradient}><Spinner size="xl" color="brand.500" thickness="4px" /></Center>;

  return (
    <Box w="100vw" h="100vh" bg={bgGradient} overflow="hidden">
      <Flex w="100%" h="100%" align="center" justify="center" p="20px">
        <VStack spacing={8} w="100%" maxW="450px" textAlign="center">

          {/* HEADER CABECERA */}
          <VStack spacing={2} mb="10px">
            <Box p="12px" bg={glassBg} borderRadius="20px" border={glassBorder} backdropFilter="blur(10px)" mb="4">
              <Icon as={MdFingerprint} w="35px" h="35px" color={brandColor} />
            </Box>
            <Heading color={textColor} fontSize={{ base: "28px", md: "36px" }} fontWeight="800">
              {selectedUser ? `Hola, ${selectedUser.nombre.split(' ')[0]}` : "Sistema de Finanzas"}
            </Heading>
            <Text color="secondaryGray.600" fontSize="lg" fontWeight="500">
              {selectedUser ? "Introduce tu PIN de seguridad" : "Selecciona una cuenta para continuar"}
            </Text>
          </VStack>

          {!selectedUser ? (
            // --- VISTA: SELECCIÓN DE USUARIO ---
            <SimpleGrid columns={2} spacing={6} w="100%" animation="fadeIn 0.6s ease-in-out">
              {profiles.map((u) => (
                <VStack
                  key={u.id}
                  p="40px 20px"
                  bg={glassBg}
                  backdropFilter="blur(20px)"
                  border={glassBorder}
                  borderRadius="32px"
                  cursor="pointer"
                  transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  boxShadow="0 10px 30px rgba(0,0,0,0.05)"
                  _hover={{ transform: "translateY(-12px)", shadow: "2xl", borderColor: brandColor }}
                  onClick={() => setSelectedUser(u)}
                >
                  <Avatar size="2xl" src={u.avatar} name={u.nombre} border="4px solid" borderColor="transparent" />
                  <Text color={textColor} fontWeight="700" fontSize="xl" mt="4">{u.nombre}</Text>
                </VStack>
              ))}
            </SimpleGrid>
          ) : (
            // --- VISTA: TECLADO NUMÉRICO ---
            <VStack spacing={8} w="100%" animation="fadeIn 0.5s">
              {/* INDICADORES DE PIN */}
              <HStack spacing={5}>
                {[1, 2, 3, 4].map((i) => (
                  <Box
                    key={i}
                    w={pin.length >= i ? "18px" : "14px"}
                    h={pin.length >= i ? "18px" : "14px"}
                    borderRadius="full"
                    bg={pin.length >= i ? brandColor : "secondaryGray.400"}
                    boxShadow={pin.length >= i ? `0px 0px 20px ${brandColor}` : "none"}
                    transition="0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  />
                ))}
              </HStack>

              {/* TECLADO GLASS */}
              <SimpleGrid columns={3} spacing={5}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <PinButton key={n} num={n} onClick={() => handleNumberClick(n)} glassBg={glassBg} glassBorder={glassBorder} />
                ))}
                <Button
                  variant="ghost" borderRadius="full" w="80px" h="80px" fontSize="20px"
                  _hover={{ bg: "whiteAlpha.200", color: "red.400" }}
                  onClick={() => { setSelectedUser(null); setPin(""); }}
                >
                  <Icon as={MdArrowBack} />
                </Button>
                <PinButton num={0} onClick={() => handleNumberClick(0)} glassBg={glassBg} glassBorder={glassBorder} />
                <Button
                  variant="ghost" borderRadius="full" w="80px" h="80px" fontSize="14px" fontWeight="800"
                  _hover={{ bg: "whiteAlpha.200" }}
                  onClick={() => setPin("")}
                >
                  BORRAR
                </Button>
              </SimpleGrid>

              {loading && <Spinner color="brand.500" thickness="3px" />}
            </VStack>
          )}
        </VStack>
      </Flex>
    </Box>
  );
}

// COMPONENTE DE BOTÓN DE PIN REUTILIZABLE
function PinButton({ num, onClick, glassBg, glassBorder }) {
  return (
    <Button
      w="80px"
      h="80px"
      fontSize="3xl"
      fontWeight="700"
      borderRadius="full"
      bg={glassBg}
      border={glassBorder}
      backdropFilter="blur(10px)"
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ bg: "brand.500", color: "white", transform: "scale(1.1)", shadow: "lg" }}
      _active={{ transform: "scale(0.9)" }}
      onClick={onClick}
    >
      {num}
    </Button>
  );
}

export default SignIn;