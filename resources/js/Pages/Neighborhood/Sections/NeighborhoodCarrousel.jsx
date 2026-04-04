import React, { useState } from 'react';
import styles from '/resources/css/Neighborhood.module.css';
const NeighborhoodCarrousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    const cities = [
        { label: "Boca Raton", city: "boca_raton", map_image: "img/boca_raton_map.png", image: "img/bocaraton.jpg", description: "Boca Raton is known for its beautiful beaches, upscale shopping, and luxury real estate. It's a popular destination for retirees and families alike." },
        { label: "Palm Beach", city: "palm_beach", map_image: "img/palm_beach_map.png", image: "img/westpalm.jpg", description: "Palm Beach offers pristine beaches, cultural events, and is home to some of the most exclusive properties in Florida." },
        { label: "Delray Beach", city: "delray_beach", map_image: "img/delray_beach_map.png", image: "img/delraybeach.jpg", description: "Delray Beach is famous for its lively downtown, beautiful Atlantic coastline, and great nightlife." },
        { label: "Fort Lauderdale", city: "fort_lauderdale", map_image: "img/fort_lauderdale_map.png", image: "img/fortlauderdale.jpg", description: "Fort Lauderdale is known for its boating canals, stunning beaches, and vibrant arts scene." },
        { label: "Miami", city: "miami", map_image: "img/miami_map.png", image: "img/miami.jpg", description: "Miami is a bustling city with a rich cultural heritage, iconic beaches, and a dynamic nightlife." },
    ];

    const handlePrevCity = () => {
        setActiveIndex((prevIndex) => (prevIndex - 1 + cities.length) % cities.length);
    };

    const handleNextCity = () => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % cities.length);
    };

    const handleCitySelect = (index) => {
        setActiveIndex(index);
    };

    return (
        <section className={styles.NeighborhoodCarrousel}>
            <div className={styles.carousel}>
                <button onClick={handlePrevCity} className={styles.navButton}><svg className="embla__button__svg" viewBox="0 0 532 532">
                    <path
                        fill="currentColor"
                        d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z"
                    />
                </svg></button>
                <a
                    href={`/properties?city=${cities[activeIndex].city}`}
                    className={styles.viewPropertiesLink}
                >
                    <div className={styles.cityContent}>
                        <h2 className={styles.title}>{cities[activeIndex].label}</h2>
                        <img src={`/${cities[activeIndex].image}`} alt={cities[activeIndex].label} className={styles.cityImage} />
                        <p className={styles.cityDescription}>{cities[activeIndex].description}</p>
                    </div>
                </a>
                <button onClick={handleNextCity} className={styles.navButton}><svg className="embla__button__svg" viewBox="0 0 532 532">
                    <path
                        fill="currentColor"
                        d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z"
                    />
                </svg></button>
            </div>

            <div className={styles.cityControls}>
                {cities.map((city, index) => (
                    <button
                        key={index}
                        onClick={() => handleCitySelect(index)}
                        className={`${styles.cityControlButton} ${activeIndex === index ? styles.active : ''}`}
                    >
                        <img src={`/${city.map_image}`} alt={city.label} className={styles.cityControlImage} />
                        <span className={styles.cityLabel}>{city.label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
};

export default NeighborhoodCarrousel;
