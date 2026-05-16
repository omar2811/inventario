// Chakra imports
import {
  Box,
  Button,
  Flex,
  Icon,
  Image,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
// Custom components
import Card from "components/card/Card.js";
import React from "react";
import { MdInventory, MdEventAvailable } from "react-icons/md";

export default function NFT(props) {
  const {
    image,
    nombre,
    total,
    disponibles,
    enRenta,
    proximaDisponible,
    onVerDetalle,
  } = props;

  const textColor = useColorModeValue("navy.700", "white");
  const grayText = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const sinStock = disponibles === 0;

  // Si no hay stock, todo el contenido se verá gris
  const cardOpacity = sinStock ? 0.5 : 1;

  return (
    <Card p="20px" opacity={cardOpacity} display="flex" flexDirection="column" h="100%">

      {/* Imagen del producto */}
      <Box mb="15px" position="relative">
        <Image
          src={image}
          w="100%"
          h="180px"
          objectFit="cover"
          borderRadius="16px"
        />
      </Box>

      {/* Contenido principal */}
      <Flex direction="column" flex="1" mb="10px">
        {/* Nombre del producto */}
        <Text fontSize="lg" fontWeight="700" color={textColor} mb="6px">
          {nombre}
        </Text>

        {/* Información de stock */}
        <Flex direction="column" gap="6px" fontSize="sm" color={grayText}>
          <Flex justify="space-between">
            <Text>Total</Text>
            <Text fontWeight="600">{total}</Text>
          </Flex>

          <Flex justify="space-between">
            <Text>Disponibles</Text>
            <Text fontWeight="600">{disponibles}</Text>
          </Flex>

          <Flex justify="space-between">
            <Text>En renta</Text>
            <Text fontWeight="600">{enRenta}</Text>
          </Flex>
        </Flex>

        {/* Próxima disponibilidad si no hay stock */}
        {sinStock && proximaDisponible && (
          <Flex
            mt="10px"
            align="center"
            gap="6px"
            fontSize="sm"
            color="orange.500"
          >
            <Icon as={MdEventAvailable} />
            <Text>
              Disponible el <strong>{proximaDisponible}</strong>
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Botón siempre al final */}
      <Button
        mt="auto"
        w="100%"
        leftIcon={<Icon as={MdInventory} />}
        colorScheme={sinStock ? "gray" : "brand"}
        isDisabled={sinStock}
        onClick={onVerDetalle}
      >
        {sinStock ? "No disponible" : "Ver artículo"}
      </Button>
    </Card>
  );
}
