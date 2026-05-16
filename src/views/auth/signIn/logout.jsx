import React, { useEffect } from 'react';
import { Flex, Spinner, Text, useColorModeValue } from '@chakra-ui/react';

const Logout = () => {
    const textColor = useColorModeValue("secondaryGray.900", "white");

    useEffect(() => {
        // 1. Limpiamos TODO el rastro de la sesión
        localStorage.clear();

        // 2. Redirigimos después de un breve delay para que la UI no se rompa
        const timer = setTimeout(() => {
            window.location.href = '/auth/sign-in';
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Flex h="100vh" w="100%" align="center" justify="center" direction="column">
            <Spinner
                size="xl"
                color="brand.500"
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
            />
            <Text mt={4} fontWeight="800" color={textColor} fontSize="lg">
                Cerrando sesión de forma segura...
            </Text>
        </Flex>
    );
};

export default Logout;