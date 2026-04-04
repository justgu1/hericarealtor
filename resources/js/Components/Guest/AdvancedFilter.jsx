import { useState, useEffect, useRef } from "react";
import Select from "react-select";
import styles from "/resources/css/Header.module.css";
import { Autocomplete } from "@react-google-maps/api";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const swal = withReactContent(Swal);

export default function AdvancedFilter({
    statusData,
    typesData,
    transactionTypesData,
    onFilterSubmit,
    amenities,
    general_features,
    internal_features,
    external_features
}) {
    const [filterOppened, setFilterOppened] = useState(false);
    const [isStickyVisible, setIsStickyVisible] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    const [filters, setFilters] = useState({
        search: '',
        min_sqr_footage: 0,
        max_sqr_footage: 100000000,
        bedrooms: 0,
        bathrooms: 0,
        half_bathrooms: 0,
        min_price: 0,
        max_price: 100000000,
        status: [],
        type: [],
        transactionType: [],
        amenities: [],
        general_features: [],
        internal_features: [],
        external_features: []
    });
    const autocompleteRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsStickyVisible(window.scrollY > 0);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleChange = (name, value) => {
        if (["price", "tax", "max_price", "min_price"].includes(name)) {
            const formattedValue = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
            setFilters(prev => ({ ...prev, [name]: formattedValue }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCheckboxChange = (name, value, isChecked) => {
        setFilters(prev => {
            const currentValues = prev[name] || [];
            return {
                ...prev,
                [name]: isChecked
                    ? [...currentValues, value]
                    : currentValues.filter(v => v !== value)
            };
        });
    };

    const handleRadioChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    const handleRangeChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value === '' ? 0 : parseFloat(value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        swal.fire({
            allowOutsideClick: false,
            background: "transparent",
            showConfirmButton: false,
            didOpen: () => {
                swal.showLoading();
            },
        });

        try {
            await onFilterSubmit(filters);
            // Fechar o filtro após a submissão
            setFilterOppened(false);
            // Mostrar alerta de sucesso
            swal.close();
        } catch (error) {
            console.error("Erro ao aplicar filtros:", error);
            swal.close();
            swal.fire({
                icon: "error",
                title: "Something went wrong",
                text: "Failed to load listings. Please try again.",
                showConfirmButton: true,
            });
        }
    };

    const handlePlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place && place.geometry) {
                handleChange('search', place.formatted_address);
            }
        }
    };

    // Fechar o filtro em mouseleave
    const handleMouseLeave = () => {
        setFilterOppened(false);
    };

    return (
        <div
            className={`${styles.AdvancedFilter} ${isStickyVisible && !isDesktop ? styles.sticked : ""}`}
            onMouseLeave={handleMouseLeave} // Fechar o filtro ao sair com o mouse
        >
            <div className={styles.overlay}></div>
            <button
                className={`${!filterOppened ? "" : "bg-bv-black-200"} rounded-none ${styles.ViewAllFilters}`}
                onClick={() => setFilterOppened(!filterOppened)}
            >
                Filter
            </button>

            <form onSubmit={handleSubmit} className={`${!filterOppened ? "!hidden" : ""} ${styles.FormFilter}`}>
                <div className={styles.filterInputGroup}>
                    <Autocomplete
                        onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                        onPlaceChanged={handlePlaceChanged}
                    >
                        <input
                            type="text"
                            placeholder="Enter city, zip code, MLS #, or address"
                            name="search"
                            className="search"
                            onChange={(e) => handleChange('search', e.target.value)}
                        />
                    </Autocomplete>
                </div>

                <div className={`${styles.filterInputGroup} filterInputGroup`}>
                    <Select
                        id="listingStatus"
                        name="listingStatus"
                        options={statusData}
                        isMulti
                        classNamePrefix="react-select"
                        placeholder="Property Statuses"
                        onChange={(selected) => handleChange('status', selected.map(s => s.value))}
                    />
                </div>

                <div className={`${styles.filterInputGroup} filterInputGroup`}>
                    <Select
                        id="typesData"
                        name="typesData"
                        options={typesData}
                        isMulti
                        classNamePrefix="react-select"
                        placeholder="Property Types"
                        onChange={(selected) => handleChange('type', selected.map(s => s.value))}
                    />
                </div>

                <div className={`${styles.filterInputGroup} filterInputGroup`}>
                    <Select
                        id="transactionTypes"
                        name="transactionTypes"
                        options={transactionTypesData}
                        isMulti
                        classNamePrefix="react-select"
                        placeholder="Transaction Types"
                        onChange={(selected) => handleChange('transactionType', selected.map(s => s.value))}
                    />
                </div>

                <div className={`${styles.filterInputGroup} filterInputGroup`}>
                    <label>Price</label>
                    <div className="minMaxContainer">
                        <input
                            type="text"
                            placeholder="Min"
                            value={filters.min_price ? `$${filters.min_price.toLocaleString()}` : ''}
                            onChange={(e) => handleChange('min_price', e.target.value)}
                        />
                        <span>-</span>
                        <input
                            type="text"
                            placeholder="Max"
                            value={filters.max_price ? `$${filters.max_price.toLocaleString()}` : ''}
                            onChange={(e) => handleChange('max_price', e.target.value)}
                        />
                    </div>
                </div>

                <div className={`${styles.filterInputGroup} filterInputGroup`}>
                    <label>Square Feet</label>
                    <div className="minMaxContainer">
                        <input
                            type="number"
                            placeholder="Min"
                            min="0"
                            onChange={(e) => handleRangeChange('min_sqr_footage', e.target.value)}
                        />
                        <span>-</span>
                        <input
                            type="number"
                            placeholder="Max"
                            min="100"
                            onChange={(e) => handleRangeChange('max_sqr_footage', e.target.value)}
                        />
                    </div>
                </div>

                <div className={`${styles.filterInputGroup} filterInputGroup`}>
                    <label>Bedrooms</label>
                    <div className="radioSelect">
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <div className="radioInput" key={`bedroom-${num}`}>
                                <input
                                    type="radio"
                                    id={`bedrooms${num}`}
                                    name="bedrooms"
                                    value={num}
                                    checked={filters.bedrooms === num}
                                    onChange={() => handleRadioChange('bedrooms', num)}
                                />
                                <label htmlFor={`bedrooms${num}`}>{num}+</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`${styles.filterInputGroup} filterInputGroup`}>
                    <label>Bathrooms</label>
                    <div className="radioSelect">
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <div className="radioInput" key={`bathroom-${num}`}>
                                <input
                                    type="radio"
                                    id={`bathrooms${num}`}
                                    name="bathrooms"
                                    value={num}
                                    checked={filters.bathrooms === num}
                                    onChange={() => handleRadioChange('bathrooms', num)}
                                />
                                <label htmlFor={`bathrooms${num}`}>{num}+</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`${styles.filterInputGroup} filterInputGroup`}>
                    <label>Amenities</label>
                    <div className="checkboxSelect">
                        {amenities.map((amenity, i) => (
                            <div className="checkboxInput" key={`amenity-${i}`}>
                                <input
                                    type="checkbox"
                                    id={`amenities${i}`}
                                    name="amenities"
                                    value={amenity.label}
                                    checked={filters.amenities.includes(amenity.label)}
                                    onChange={(e) => handleCheckboxChange('amenities', amenity.label, e.target.checked)}
                                />
                                <label htmlFor={`amenities${i}`}>{amenity.label}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`${styles.filterInputGroup} filterInputGroup`}>
                    <label>General Features</label>
                    <div className="checkboxSelect">
                        {general_features.map((item, i) => (
                            <div className="checkboxInput" key={`general-${i}`}>
                                <input
                                    type="checkbox"
                                    id={`general_features${i}`}
                                    name="general_features"
                                    value={item.label}
                                    checked={filters.general_features.includes(item.label)}
                                    onChange={(e) => handleCheckboxChange('general_features', item.label, e.target.checked)}
                                />
                                <label htmlFor={`general_features${i}`}>{item.label}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`${styles.filterInputGroup} filterInputGroup`}>
                    <label>Internal Features</label>
                    <div className="checkboxSelect">
                        {internal_features.map((item, i) => (
                            <div className="checkboxInput" key={`internal-${i}`}>
                                <input
                                    type="checkbox"
                                    id={`internal_features${i}`}
                                    name="internal_features"
                                    value={item.label}
                                    checked={filters.internal_features.includes(item.label)}
                                    onChange={(e) => handleCheckboxChange('internal_features', item.label, e.target.checked)}
                                />
                                <label htmlFor={`internal_features${i}`}>{item.label}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`${styles.filterInputGroup} filterInputGroup`}>
                    <label>External Features</label>
                    <div className="checkboxSelect">
                        {external_features.map((item, i) => (
                            <div className="checkboxInput" key={`external-${i}`}>
                                <input
                                    type="checkbox"
                                    id={`external_features${i}`}
                                    name="external_features"
                                    value={item.label}
                                    checked={filters.external_features.includes(item.label)}
                                    onChange={(e) => handleCheckboxChange('external_features', item.label, e.target.checked)}
                                />
                                <label htmlFor={`external_features${i}`}>{item.label}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit">View All</button>
            </form>
        </div>
    );
}