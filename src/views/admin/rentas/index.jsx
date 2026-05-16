import React, { useState } from "react";
import RentasList from "./RentasList";
import CrearRentaModal from "./CrearRentaModal";
import { useDisclosure } from "@chakra-ui/react";

export default function RentasPage() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [rentas, setRentas] = useState([]);

    const handleCrearRenta = (nuevaRenta) => {
        setRentas((prev) => [...prev, nuevaRenta]);
    };

    return (
        <>
            <RentasList onCrearRenta={onOpen} />
            <CrearRentaModal
                isOpen={isOpen}
                onClose={onClose}
                onCrear={handleCrearRenta}
            />
        </>
    );
}
