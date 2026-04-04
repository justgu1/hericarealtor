import MinLogo from "./Icons/MinLogo";
import styles from "/resources/css/Hero.module.css";
import React, { useState, useEffect, useRef } from "react";
import { IoSearchSharp } from "react-icons/io5";
import { Autocomplete } from "@react-google-maps/api";
const HeroCarousel = React.forwardRef(({ height, banners, buttons, apiKey }, ref) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCity, setSelectedCity] = useState("boca_raton");

    const cities = [
        { label: "Boca Raton", value: "boca_raton" },
        { label: "Palm Beach", value: "palm_beach" },
        { label: "Delray Beach", value: "delray_beach" },
        { label: "Fort Lauderdale", value: "fort_lauderdale" },
        { label: "Miami", value: "miami" },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prevIndex) => (prevIndex + 1) % banners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [banners.length]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const queryParams = new URLSearchParams({
            city: selectedCity,
            address: searchQuery,
        }).toString();

        window.location.href=route('properties', queryParams);
    };

    const handleCityChange = (e) => {
        setSelectedCity(e.target.value);
    };

    const autocompleteRef = useRef(null);
    const handlePlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place && place.geometry) {
                const address = place.formatted_address;
                const value = address;

                setData('address', value)
            }
        }
    };

    return (
        <section className={`Hero`} style={{ height }} ref={ref}>
            <article className={styles.Article}>
                <figure className={styles.carousel}>
                    {banners.map((banner, index) => (
                        <img
                            className={`${styles.banner} ${index === activeIndex ? styles.active : ''}`}
                            key={index}
                            src={banner}
                            alt={`Banner ${index}`}
                        />
                    ))}
                </figure>
                <a href={`${route('Home')}`} className="minLogo">
                    <MinLogo />
                </a>
            </article>

            <form onSubmit={handleSearchSubmit} className={`${styles.heroForm}`}>
                <div className={styles.cityRadioGroup}>
                    {cities.map((city) => (
                        <label key={city.value} className={styles.cityRadioLabel}>
                            <input
                                type="radio"
                                name="city"
                                value={city.value}
                                checked={selectedCity === city.value}
                                onChange={handleCityChange}
                                className={styles.cityRadioInput}
                            />
                            <span className={styles.cityLabelText}>{city.label}</span>
                        </label>
                    ))}
                </div>

                <div className={styles.searchContainer}>
                    {apiKey ? (
                        <Autocomplete
                            onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                            onPlaceChanged={handlePlaceChanged}
                        >
                            <input
                                type="text"
                                placeholder="Enter city, zip code, MLS #, or address"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.value)}
                                className={styles.heroSearchInput}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                            />
                        </Autocomplete>
                    ) : (
                        <input
                            type="text"
                            placeholder="Enter city, zip code, MLS #, or address"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.heroSearchInput}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                        />
                    )}
                    <button type="submit" className={styles.heroSearchButton}>
                        <IoSearchSharp />
                    </button>
                </div>
            </form>
        </section>
    );
});

export default HeroCarousel;
