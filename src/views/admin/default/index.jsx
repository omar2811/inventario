import React from "react";

// Chakra UI
import {
  Box,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Text,
} from "@chakra-ui/react";

// Icons
import { MdAttachMoney, MdInventory } from "react-icons/md";

// Custom components
import MiniStatistics from "components/card/MiniStatistics";
import IconBox from "components/icons/IconBox";
import TotalSpent from "views/admin/default/components/TotalSpent";
import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";
import NFT from "components/card/NFT";

// Assets (usa los del template o reemplázalos)
import Nft1 from "assets/img/nfts/Nft1.png";
import Nft2 from "assets/img/nfts/Nft2.png";
import Nft3 from "assets/img/nfts/Nft3.png";

export default function UserReports() {
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  // 🔹 Productos en renta (mock data)
  const productosEnRenta = [
    {
      id: 1,
      nombre: "Cámara DSLR",
      total: 10,
      disponibles: 3,
      enRenta: 7,
      proximaDisponible: "2026-01-25",
      imagen: Nft1,
    },
    {
      id: 2,
      nombre: "Micrófono XLR",
      total: 5,
      disponibles: 0,
      enRenta: 5,
      proximaDisponible: "2026-01-22",
      imagen: Nft2,
    },
    {
      id: 3,
      nombre: "Iluminación Godox SL60W",
      total: 5,
      disponibles: 2,
      enRenta: 3,
      proximaDisponible: "2026-01-22",
      imagen: Nft3,
    },
  ]


  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>

      {/* =======================
          MINI STATISTICS (4)
      ======================= */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">

        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdAttachMoney} color={brandColor} />}
            />
          }
          name="Ganancias Totales"
          value="$125,450"
        />

        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdAttachMoney} color={brandColor} />}
            />
          }
          name="Ganancias del Mes"
          value="$8,320"
        />

        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdInventory} color={brandColor} />}
            />
          }
          name="Equipos en Renta"
          value="37"
        />

        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdInventory} color={brandColor} />}
            />
          }
          name="Total de Rentas"
          value="2,935"
        />

      </SimpleGrid>

      {/* =======================
          GRÁFICAS
      ======================= */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px" mb="20px">
        <TotalSpent />
        <WeeklyRevenue />
      </SimpleGrid>

      {/* =======================
          EQUIPOS EN RENTA
      ======================= */}
      <Text fontSize="2xl" fontWeight="700" mb="20px">
        Equipos en Renta Actualmente
      </Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="20px">
        {productosEnRenta.map((producto) => (
          <NFT
            nombre={producto.nombre}
            total={producto.total}               // total de unidades del producto
            disponibles={producto.disponibles}  // stock disponible
            enRenta={producto.enRenta}          // stock en renta
            proximaDisponible={producto.proximaDisponible} // fecha próxima si no hay stock
            image={producto.imagen}
          // onVerDetalle={() => handleVerDetalle(producto.id)} // función opcional para detalles
          />


        ))}
      </SimpleGrid>

    </Box>
  );
}
