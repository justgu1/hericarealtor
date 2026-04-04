import FullLogo from "../Icons/FullLogo";
import { useFilters } from "@/Contexts/FilterContext";
import MenuIcon from "../Icons/MenuIcon";
import styles from "/resources/css/Header.module.css";
import { useState, useEffect } from 'react';
import AdvancedFilter from "@/Components/Guest/AdvancedFilter";

export default function Header({ heroRef, toggleSideMenu, isPropertiesPage, statusData, typesData, transactionTypesData, amenities, general_features, internal_features, external_features }) {
    const { updateFilters } = useFilters();

    const [isStickyVisible, setIsStickyVisible] = useState(isPropertiesPage ? true : false);

    const handleScroll = () => {
        const heroHeight = heroRef.current ? heroRef.current.offsetHeight : 0;
        const scrollPosition = window.scrollY;
        if (scrollPosition > heroHeight / 4) {
            setIsStickyVisible(true);
        } else {
            setIsStickyVisible(isPropertiesPage ? true : false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isPropertiesPage]);

    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleFilterSubmit = async (newFilters) => {
        try {
            await updateFilters({ ...newFilters, page: 1 }); // Resetar para página 1 ao aplicar filtros
        } catch (error) {
            console.error("Erro ao aplicar filtros:", error);
        }
    };

    return (
        <div>
            <header className={`${styles.HeroHeader}`}>
                {isDesktop ? (
                    <nav className="">{Nav()}</nav>
                ) : (
                    <div></div>
                )}
                <div className={styles.sideMenuContainer}>
                    <a className="OpenSideMenu" href="#SideMenu" onClick={(e) => { e.preventDefault(); toggleSideMenu(); }}>
                        <MenuIcon />
                    </a>
                </div>
            </header>
            <header className={`${styles.StickyHeader} ${isStickyVisible ? styles.visible : ''}`}>
                <div><a href="/"><FullLogo /></a></div>
                {isDesktop ? (
                    <nav className="">{Nav()}</nav>
                ) : ''}
                <div className={styles.sideMenuContainer}>
                    <a className="OpenSideMenu" href="#SideMenu" onClick={(e) => { e.preventDefault(); toggleSideMenu(); }}>
                        <MenuIcon />
                    </a>
                </div>
            </header>
            {isPropertiesPage ? (
                <AdvancedFilter
                    statusData={statusData}
                    typesData={typesData}
                    transactionTypesData={transactionTypesData}
                    onFilterSubmit={handleFilterSubmit}
                    amenities={amenities}
                    general_features={general_features}
                    internal_features={internal_features}
                    external_features={external_features}
                />
            ) : (
                <></>
            )}
        </div>
    );
}

function Nav() {
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

    return (
        <ul className="HorizontalList">
            {links.map((link) => (
                <li key={link.route} className="NavItemContainer">
                    <div className="NavItem">
                        <a className="TextGradient" href={`/${link.route}`} data-content={link.name}>
                            {link.name}
                        </a>
                    </div>
                    {link.childrens && link.childrens.length > 0 && (
                        <ul className="SubItems">
                            {link.childrens.map((child) => (
                                <li key={child.route} className="NavSubItem">
                                    <a className="TextGradient" href={`/${child.route}`} data-content={child.name}>
                                        {child.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            ))}
        </ul>
    );
}