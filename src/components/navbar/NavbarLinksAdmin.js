/* eslint-disable */
import {
  Avatar,
  Button,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
  useColorMode,
  useToast
} from '@chakra-ui/react';
import { SearchBar } from 'components/navbar/searchBar/SearchBar';
import { SidebarResponsive } from 'components/sidebar/Sidebar';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdNotificationsNone } from 'react-icons/md';
import { IoMdMoon, IoMdSunny } from 'react-icons/io';
import routes from 'routes';

export default function HeaderLinks(props) {
  const { secondary } = props;
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const toast = useToast();

  // ESTADO PARA DATOS DEL USUARIO
  const [userData, setUserData] = useState({
    name: "Invitado",
    email: "usuario@comcorr.com"
  });

  useEffect(() => {
    // Intentar obtener datos reales (si los guardaste en el login)
    // Si solo guardaste "user_authenticated", podemos poner datos por defecto del admin
    const isAuthenticated = localStorage.getItem("user_authenticated");
    if (isAuthenticated === "true") {
      setUserData({
        name: "Administrador Comcorr",
        email: "admin@comcorr.com"
      });
    }
  }, []);

  // FUNCION DE CERRAR SESIÓN
  const handleLogout = () => {
    // 1. Borrar los datos reales que usamos para la seguridad
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Opcional: Si quieres limpiar absolutamente todo (preferencias, etc.)
    // localStorage.clear(); 

    // 2. Notificar al usuario
    toast({
      title: "Sesión cerrada",
      description: "Vuelve pronto al sistema de finanzas.",
      status: "info",
      duration: 3000,
      isClosable: true,
      position: "top"
    });

    // 3. Redirigir a la pantalla de perfiles (Login)
    navigate("/auth/sign-in");
  };

  // Chakra Color Mode
  const navbarIcon = useColorModeValue('gray.400', 'white');
  let menuBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('#E6ECFA', 'rgba(135, 140, 189, 0.3)');
  const shadow = useColorModeValue(
    '14px 17px 40px 4px rgba(112, 144, 176, 0.18)',
    '14px 17px 40px 4px rgba(112, 144, 176, 0.06)',
  );

  return (
    <Flex
      w={{ sm: '100%', md: 'auto' }}
      alignItems="center"
      flexDirection="row"
      bg={menuBg}
      p="10px"
      borderRadius="30px"
      boxShadow={shadow}
    >
      <SearchBar mb="unset" me="10px" borderRadius="30px" />

      <SidebarResponsive routes={routes} />

      {/* NOTIFICACIONES */}
      <Menu>
        <MenuButton p="0px">
          <Icon mt="6px" as={MdNotificationsNone} color={navbarIcon} w="18px" h="18px" me="10px" />
        </MenuButton>
        <MenuList boxShadow={shadow} p="20px" borderRadius="20px" bg={menuBg} border="none" mt="22px">
          <Text fontSize="md" fontWeight="600" color={textColor}>Notificaciones</Text>
          <Text fontSize="sm" mt="10px">No hay mensajes nuevos</Text>
        </MenuList>
      </Menu>

      {/* BOTÓN MODO OSCURO */}
      <Button
        variant="no-hover"
        bg="transparent"
        p="0px"
        h="18px"
        w="max-content"
        onClick={toggleColorMode}
      >
        <Icon
          me="10px"
          h="18px"
          w="18px"
          color={navbarIcon}
          as={colorMode === 'light' ? IoMdMoon : IoMdSunny}
        />
      </Button>

      {/* MENU DE USUARIO (DINÁMICO) */}
      <Menu>
        <MenuButton p="0px">
          <Avatar
            _hover={{ cursor: 'pointer' }}
            color="white"
            name={userData.name} // NOMBRE DINÁMICO
            bg="#02308e"
            size="sm"
            w="40px"
            h="40px"
          />
        </MenuButton>
        <MenuList boxShadow={shadow} p="0px" mt="10px" borderRadius="20px" bg={menuBg} border="none">
          <Flex w="100%" mb="0px" flexDirection="column">
            <Text
              ps="20px"
              pt="16px"
              w="100%"
              fontSize="sm"
              fontWeight="700"
              color={textColor}
            >
              👋&nbsp; Hola, {userData.name.split(' ')[0]}
            </Text>
            <Text
              ps="20px"
              pb="10px"
              fontSize="xs"
              color="gray.400"
              borderBottom="1px solid"
              borderColor={borderColor}
            >
              {userData.email}
            </Text>
          </Flex>
          <Flex flexDirection="column" p="10px">
            <MenuItem
              _hover={{ bg: 'none' }}
              _focus={{ bg: 'none' }}
              borderRadius="8px"
              px="14px"
              onClick={() => navigate('/admin/profile')}
            >
              <Text fontSize="sm">Configuración de Perfil</Text>
            </MenuItem>

            <MenuItem
              _hover={{ bg: 'gray.100' }}
              _focus={{ bg: 'none' }}
              color="red.400"
              borderRadius="8px"
              px="14px"
              onClick={handleLogout} // FUNCION LOGOUT
            >
              <Text fontSize="sm" fontWeight="bold">Cerrar Sesión</Text>
            </MenuItem>
          </Flex>
        </MenuList>
      </Menu>
    </Flex>
  );
}

HeaderLinks.propTypes = {
  variant: PropTypes.string,
  fixed: PropTypes.bool,
  secondary: PropTypes.bool,
  onOpen: PropTypes.func,
};