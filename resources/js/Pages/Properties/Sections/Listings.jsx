import { GoogleMap, Marker, InfoWindow, Polygon } from "@react-google-maps/api";
import { useState, useEffect } from "react";
import { FaBed, FaShower, FaSink, FaTreeCity } from "react-icons/fa6";
import { IoIosPin } from "react-icons/io";
import { RxRulerSquare } from "react-icons/rx";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";
import withReactContent from 'sweetalert2-react-content';
import Select from "react-select";
import Swal from 'sweetalert2';
import { useFilters } from "@/Contexts/FilterContext";

export default function Listings({ apiKey, listings, pagination, onPageChange }) {
    const swal = withReactContent(Swal);
    const { filters, updateFilters } = useFilters();
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [coordinates, setCoordinates] = useState({});
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [hoveredPropertyId, setHoveredPropertyId] = useState(null);

    // ── Transaction type quick-filter ─────────────────────────────────────────
    // "sale" → transactionType=[0], status=[]
    // "rent" → transactionType=[1], status=[]
    // "sold" → transactionType=[], status=[4]
    const [activeTransactionFilters, setActiveTransactionFilters] = useState([]);

    const transactionFilters = [
        { key: 'sale', label: 'For Sale', transactionType: [0], status: [] },
        { key: 'rent', label: 'For Rent', transactionType: [1], status: [] },
        { key: 'sold', label: 'Sold',     transactionType: [], status: [4] },
    ];

    const statusFilters = [
        { value: 0, label: 'Active' },
        { value: 1, label: 'Coming Soon' },
        { value: 2, label: 'Contingent' },
        { value: 3, label: 'Pending' },
    ];

    const [activeStatusFilters, setActiveStatusFilters] = useState([]);

    const transactionOptions = transactionFilters.map(f => ({ value: f.key, label: f.label }));
    const statusOptions = statusFilters.map(f => ({ value: f.value, label: f.label }));

    const handleTransactionSelect = (selected) => {
        const keys = selected ? selected.map(s => s.value) : [];
        setActiveTransactionFilters(keys);
        setActiveStatusFilters([]);
        if (keys.length > 0) {
            const combinedTypes = [];
            const combinedStatus = [];
            keys.forEach(key => {
                const filter = transactionFilters.find(tf => tf.key === key);
                if (filter) {
                    combinedTypes.push(...filter.transactionType);
                    combinedStatus.push(...filter.status);
                }
            });
            updateFilters({ transactionType: combinedTypes, status: combinedStatus, page: 1 });
        } else {
            updateFilters({ transactionType: [], status: [], page: 1 });
        }
    };

    const handleStatusSelect = (selected) => {
        setActiveTransactionFilters([]);
        const vals = selected ? selected.map(s => s.value) : [];
        setActiveStatusFilters(vals);
        updateFilters({ status: vals, transactionType: [], page: 1 });
    };

    const OrderOptions = [
        { value: "lowest_price", label: "Lowest Price" },
        { value: "highest_price", label: "Highest Price" },
        { value: "newest", label: "Newest Listings" },
        { value: "beds", label: "Number of Beds" },
        { value: "baths", label: "Number of Baths" },
    ];

    const southFloridaPolygonCoords = [
        { lat: 26.8, lng: -80.2 },
        { lat: 26.7, lng: -80.03 },
        { lat: 26.5, lng: -80.02 },
        { lat: 26.4, lng: -80.01 },
        { lat: 26.3, lng: -80.05 },
        { lat: 26.15, lng: -80.1 },
        { lat: 25.9, lng: -80.05 },
        { lat: 25.75, lng: -80.05 },
        { lat: 25.7, lng: -80.2 },
        { lat: 26.0, lng: -80.3 },
        { lat: 26.3, lng: -80.3 },
        { lat: 26.6, lng: -80.25 },
    ];

    const defaultCenter = {
        lat: southFloridaPolygonCoords.reduce((sum, c) => sum + c.lat, 0) / southFloridaPolygonCoords.length,
        lng: southFloridaPolygonCoords.reduce((sum, c) => sum + c.lng, 0) / southFloridaPolygonCoords.length,
    };

    const [mapInstance, setMapInstance] = useState(null);
    const [hoveredMarker, setHoveredMarker] = useState(null);
    const [mapCenter, setMapCenter] = useState(defaultCenter);

    const handleSortChange = (selectedOption) => {
        updateFilters({ orderBy: selectedOption ? selectedOption.value : '', page: 1 });
    };

    const sortedListings = [...listings];

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const transactionLabel = (listing) => {
        if (listing.status_enum.value === 4) return { label: 'Sold', cls: 'badge-sold' };
        return listing.transaction_type_enum.value === 1
            ? { label: 'For Rent', cls: 'badge-rent' }
            : { label: 'For Sale', cls: 'badge-sale' };
    };

    const statusBadge = (listing) => {
        const map = { 0: 'badge-active', 1: 'badge-coming-soon', 2: 'badge-contingent', 3: 'badge-pending', 4: 'badge-sold' };
        return map[listing.status_enum.value] ?? 'badge-active';
    };

    const fetchCoordinates = async (address) => {
        if (coordinates[address]) return coordinates[address];

        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
            );
            const data = await response.json();
            if (data.status === "OK") {
                const location = data.results[0].geometry.location;
                setCoordinates((prev) => ({ ...prev, [address]: location }));
                return location;
            }
        } catch (error) {
            console.error("Erro ao buscar coordenadas:", error);
        }
        return null;
    };

    useEffect(() => {
        listings.forEach((listing) => {
            fetchCoordinates(listing.address);
        });
    }, [listings]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            setMessages([...messages, { text: newMessage, sender: "user" }]);
            setNewMessage("");
        }
    };

    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);

    const handleResize = () => {
        setIsDesktop(window.innerWidth > 1024);
    };

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleListingClick = (listing) => {
        if (isDesktop && selectedProperty?.id === listing.id) {
            window.location.href = route('properties.show', listing.id);
        } else {
            setSelectedProperty(listing);
        }
    };

    const createMarkerIcon = (price, hovered = false) => {
        if (!window.google || !window.google.maps) return null;

        const bgColor = hovered ? "#ffffff" : "#000000";
        const textColor = hovered ? "#000000" : "#ffffff";

        return {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="75" height="30" viewBox="0 0 100 50">
                    <rect x="0" y="0" width="75" height="30" rx="10" ry="10" fill="${bgColor}" />
                    <text x="37.5" y="20" font-size="14" text-anchor="middle" fill="${textColor}" font-family="Arial">
                        ${formatPrice(price)}
                    </text>
                </svg>`
            )}`,
            scaledSize: new window.google.maps.Size(100, 50),
        };
    };

    const handlePageChange = async (page) => {
        swal.fire({
            allowOutsideClick: false,
            background: "transparent",
            showConfirmButton: false,
            didOpen: () => {
                swal.showLoading();
            },
        });

        await onPageChange(page);
        swal.close();
    };

    const currentPage = pagination.current_page;

    return (
        <section id="listings" className="flex">
            <div className="loopingContainer">
                <div className="orderLooping">
                    <div className="total">Over {pagination.total} Listings</div>
                    <div className="listingFilters">
                        <Select
                            id="orderSort"
                            name="orderSort"
                            options={OrderOptions}
                            classNamePrefix="react-select"
                            placeholder="Sort by..."
                            isClearable
                            onChange={handleSortChange}
                        />
                        <Select
                            isMulti
                            options={transactionOptions}
                            classNamePrefix="react-select"
                            placeholder="Type..."
                            value={transactionOptions.filter(o => activeTransactionFilters.includes(o.value))}
                            onChange={handleTransactionSelect}
                        />
                        <Select
                            isMulti
                            options={statusOptions}
                            classNamePrefix="react-select"
                            placeholder="Status..."
                            value={statusOptions.filter(o => activeStatusFilters.includes(o.value))}
                            onChange={handleStatusSelect}
                        />
                    </div>
                </div>

                <div className="looping">
                    {sortedListings.map((listing, index) => (
                        isDesktop ? (
                            <div
                                key={index}
                                className="listing"
                                onClick={() => handleListingClick(listing)}
                                onMouseEnter={() => setHoveredPropertyId(listing.id)}
                                onMouseLeave={() => setHoveredPropertyId(null)}
                            >
                                <div className="thumbnail relative">
                                    <img src={listing.thumbnail_url || '/img/default.jpg'} />
                                    <div className="listingBadges">
                                        <span className={`listingBadge ${transactionLabel(listing).cls}`}>{transactionLabel(listing).label}</span>
                                        {listing.status_enum.value !== 4 && (
                                            <span className={`listingBadge ${statusBadge(listing)}`}>{listing.status_enum.name}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="details">
                                    <div className="typeAndPrice">
                                        <h2 className="price">{formatPrice(listing.price)}</h2>
                                        <p>
                                            <FaTreeCity /> {listing.type_enum.name}
                                        </p>
                                    </div>
                                    <h2 className="address">{listing.address}</h2>
                                    <div className="moredetails">
                                        <p>
                                            <FaBed /> {listing.bedrooms} beds
                                        </p>
                                        <p>
                                            <FaShower /> {listing.bathrooms} baths
                                        </p>
                                        <p>
                                            <RxRulerSquare /> {listing.sqr_footage} ft²
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <a
                                key={index}
                                href={route('properties.show', listing.id)}
                                className="listing"
                                onMouseEnter={() => setHoveredPropertyId(listing.id)}
                                onMouseLeave={() => setHoveredPropertyId(null)}
                            >
                                <div className="thumbnail relative">
                                    <img src={listing.thumbnail_url || '/img/default.jpg'} />
                                    <div className="listingBadges">
                                        <span className={`listingBadge ${transactionLabel(listing).cls}`}>{transactionLabel(listing).label}</span>
                                        {listing.status_enum.value !== 4 && (
                                            <span className={`listingBadge ${statusBadge(listing)}`}>{listing.status_enum.name}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="details">
                                    <div className="typeAndPrice">
                                        <h2 className="price">{formatPrice(listing.price)}</h2>
                                        <p>
                                            <FaTreeCity /> {listing.type_enum.name}
                                        </p>
                                    </div>
                                    <h2 className="address">{listing.address}</h2>
                                    <div className="moredetails">
                                        <p>
                                            <FaBed /> {listing.bedrooms} beds
                                        </p>
                                        <p>
                                            <FaShower /> {listing.bathrooms} baths
                                        </p>
                                        <p>
                                            <RxRulerSquare /> {listing.sqr_footage} ft²
                                        </p>
                                    </div>
                                </div>
                            </a>
                        )
                    ))}
                </div>
                <div className="pagination flex items-center gap-2 justify-center mt-4">
                    <button
                        onClick={() => handlePageChange(1)}
                        className={`FirstPageButton button ${currentPage === 1 ? "opacity-20 pointer-events-none" : ""}`}
                    >
                        <MdKeyboardDoubleArrowLeft />
                    </button>
                    {currentPage === 1 && pagination.last_page > 1 && (
                        <button
                            onClick={() => handlePageChange(pagination.last_page)}
                            className="button paginationButton"
                        >
                            {pagination.last_page}
                        </button>
                    )}
                    {currentPage > 1 && (
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="button paginationButton prevPage"
                        >
                            {currentPage - 1}
                        </button>
                    )}
                    <button
                        className={`button paginationButton ${currentPage ? "current" : ""}`}
                        disabled
                    >
                        {currentPage}
                    </button>
                    {currentPage < pagination.last_page && (
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="button paginationButton nextPage"
                        >
                            {currentPage + 1}
                        </button>
                    )}
                    {currentPage === pagination.last_page && pagination.last_page > 1 && (
                        <button
                            onClick={() => handlePageChange(1)}
                            className="button paginationButton"
                        >
                            1
                        </button>
                    )}
                    <button
                        onClick={() => handlePageChange(pagination.last_page)}
                        className={`LastPageButton button ${currentPage === pagination.last_page ? "opacity-20 pointer-events-none" : ""}`}
                    >
                        <MdKeyboardDoubleArrowRight />
                    </button>
                </div>
            </div>
            {isDesktop ? (
                <div onMouseLeave={() => setSelectedProperty(null)} className="googleMap">
                    <GoogleMap
                        mapContainerStyle={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "1rem",
                        }}
                        center={mapCenter}
                        zoom={10}
                        onLoad={(map) => {
                            setMapInstance(map);
                            map.setCenter(mapCenter);
                        }}
                    >
                        <Polygon
                            paths={southFloridaPolygonCoords}
                            options={{
                                fillColor: "#FF0000",
                                fillOpacity: 0.1,
                                strokeColor: "#FF0000",
                                strokeOpacity: 0.6,
                                strokeWeight: 2,
                            }}
                        />

                        {mapInstance &&
                            listings.map((listing) => {
                                const location = coordinates[listing.address];
                                if (!location) return null;

                                const icon = createMarkerIcon(listing.price);
                                if (!icon) return null;

                                return (
                                    <Marker
                                        key={listing.id}
                                        position={location}
                                        icon={createMarkerIcon(listing.price, hoveredPropertyId === listing.id)}
                                        onMouseOver={() => setHoveredPropertyId(listing.id)}
                                        onMouseOut={() => setHoveredPropertyId(null)}
                                        onClick={() => handleListingClick(listing)}
                                    >
                                        {selectedProperty && selectedProperty.id === listing.id && (
                                            <InfoWindow position={location}>
                                                <a href={route('properties.show', selectedProperty.id)}>
                                                    <article className="propertie">
                                                        <section className="propertieThumbnailContainer">
                                                            <span className="tag status">{listing.status_enum.name}</span>
                                                            <div
                                                                className="propertieThumbnail"
                                                                style={{
                                                                    backgroundImage: `url('${listing.thumbnail_url || '/img/default.jpg'}')`,
                                                                    backgroundSize: "cover",
                                                                    backgroundPosition: "center",
                                                                }}
                                                                aria-label={listing.address}
                                                            />
                                                        </section>
                                                        <section className="propertiePrincipalDetails">
                                                            <p className="propertieAddress">
                                                                <IoIosPin /> {listing.address}
                                                            </p>
                                                            <p className="propertiePrice">{formatPrice(listing.price)}</p>
                                                        </section>
                                                        <section className="propertieDetails">
                                                            <p>
                                                                <span className="detailsKey">
                                                                    <RxRulerSquare /> sqr footage
                                                                </span>{" "}
                                                                <span className="detailsValue">{listing.sqr_footage}</span>
                                                            </p>
                                                            <p>
                                                                <span className="detailsKey">
                                                                    <FaBed /> bedrooms
                                                                </span>{" "}
                                                                <span className="detailsValue">{listing.bedrooms}</span>
                                                            </p>
                                                            <p>
                                                                <span className="detailsKey">
                                                                    <FaShower /> bathrooms
                                                                </span>{" "}
                                                                <span className="detailsValue">{listing.bathrooms}</span>
                                                            </p>
                                                            <p>
                                                                <span className="detailsKey">
                                                                    <FaSink /> half bathrooms
                                                                </span>{" "}
                                                                <span className="detailsValue">{listing.half_bathrooms}</span>
                                                            </p>
                                                            <p>
                                                                <span className="detailsKey">
                                                                    <FaTreeCity /> type
                                                                </span>{" "}
                                                                <span className="detailsValue">{listing.type_enum.name}</span>
                                                            </p>
                                                        </section>
                                                        <div>
                                                            <button className="m-auto hover:bg-bv-white">
                                                                View Property
                                                            </button>
                                                        </div>
                                                    </article>
                                                </a>
                                            </InfoWindow>
                                        )}
                                    </Marker>
                                );
                            })}
                    </GoogleMap>
                </div>
            ) : (
                <></>
            )}
        </section>
    );
}