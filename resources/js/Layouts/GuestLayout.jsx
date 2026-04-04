import { usePage } from "@inertiajs/react";
import Header from "@/Components/Guest/Header";
import Footer from "@/Components/Guest/Footer";
import HeroCarousel from "@/Components/HeroCarousel";
import React, { useRef, useState } from 'react';
import SocialIcons from "@/Components/SocialIcons";
import SideMenu from "@/Components/SideMenu";
import { LoadScript } from "@react-google-maps/api";
import { FilterProvider } from "@/Contexts/FilterContext";

// Must be a stable reference outside the component to prevent LoadScript reloads
const GOOGLE_MAPS_LIBRARIES = ["places"];

export default function GuestLayout({ children }) {
    const heroRef = useRef(null);
    const { url } = usePage();

    const [sideMenuOpen, setSideMenuOpen] = useState(false);
    const links = [
        {
            route: "properties", name: "Properties", childrens: [
                { route: "neighborhood", name: "Neighborhood" },
            ]
        },
        { route: "seller", name: "List with me" },
        { route: "about", name: "About" },
        { route: "contact", name: "Contact" },
    ];
    let color = "brightness";
    let buttons = [];
    let banners = ["/img/banner1_desktop.webp", "/img/banner2_desktop.webp"];
    let height = "40vh";
    if (url.startsWith('/')) {
        height = "80vh";
        buttons = ["Palm Beach", "Coconut Creek", "Boca Raton", "Pompano Beach"];
    }

    const statusData = usePage().props.statusData
    const typesData = usePage().props.typesData
    const amenities = usePage().props.amenities
    const transactionTypesData = usePage().props.transactionTypesData
    const general_features = usePage().props.general_features
    const internal_features = usePage().props.internal_features
    const external_features = usePage().props.external_features
    const apiKey = usePage().props.apiKey
    return (
        <FilterProvider>
            <div id="guestLayout" className={`${color == "darkness" ? "darkness" : "brightness"} layout`}>
                <SideMenu links={links} />
                <main className={sideMenuOpen ? 'OpennedSideMenu' : ''}
                    onClick={() => {
                        if (sideMenuOpen) {
                            setSideMenuOpen(false);
                        }
                    }}>
                    <LoadScript googleMapsApiKey={apiKey || ""} libraries={GOOGLE_MAPS_LIBRARIES}>
                        <Header toggleSideMenu={() => setSideMenuOpen(!sideMenuOpen)} heroRef={heroRef} isPropertiesPage={url.includes('properties') && !url.includes('/properties/') ? true : false} statusData={statusData} typesData={typesData} transactionTypesData={transactionTypesData} amenities={amenities} general_features={general_features} internal_features={internal_features} external_features={external_features} />
                        {!url.includes('properties') ? <HeroCarousel
                            height={height}
                            banners={banners}
                            buttons={buttons}
                            ref={heroRef}
                            apiKey={apiKey}
                        /> : <></>}
                        {!url.includes('properties') ? <SocialIcons /> : <></>}
                        {children}
                    </LoadScript>
                    <Footer links={links} />
                </main>
            </div>
        </FilterProvider>
    );
}
