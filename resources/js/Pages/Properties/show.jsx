import { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";
import { FaKey, FaBed, FaShower, FaSink, FaTreeCity } from "react-icons/fa6";
import { RxRulerSquare } from "react-icons/rx";
import { MdSource, MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from "react-icons/md";
import { TbTax } from "react-icons/tb";
import { IoCalendar } from "react-icons/io5";
import { FaCheck, FaTimes } from "react-icons/fa";
import { GoogleMap, Marker } from "@react-google-maps/api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function PropertiesShow(backendProps) {
    const { listing, apiKey } = backendProps.props;

    const images = [listing.thumbnail_url, ...listing.gallery.map(img => img.image_url)].filter(Boolean);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDetailsOpen, setIsDetailsOpen] = useState(true);
    const [openSections, setOpenSections] = useState({});
    const [mapCenter, setMapCenter] = useState(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const swal = withReactContent(Swal);

    const nextImage = () => setCurrentIndex((prev) => (prev - 1 < 0 ? images.length - 1 : prev - 1));
    const prevImage = () => setCurrentIndex((prev) => (prev + 1 >= images.length ? 0 : prev + 1));

    const openLightbox = (index) => { setLightboxIndex(index); setLightboxOpen(true); };
    const closeLightbox = () => setLightboxOpen(false);
    const lightboxPrev = () => setLightboxIndex((p) => (p - 1 + images.length) % images.length);
    const lightboxNext = () => setLightboxIndex((p) => (p + 1) % images.length);

    const formatCurrency = (value) => {
        if (value) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }).format(value);
        }
        return "$0";
    };

    const toggleDetails = () => {
        setIsDetailsOpen((prev) => !prev);
    };

    const toggleSection = (sectionKey) => {
        setOpenSections((prev) => ({
            ...prev,
            [sectionKey]: !prev[sectionKey],
        }));
    };

    const handleGetPDF = async () => {
        try {
            Swal.fire({
                allowOutsideClick: false,
                background: "transparent",
                showConfirmButton: false,
                didOpen: () => { Swal.showLoading(); },
            });

            const response = await axios.post(route('properties.pdf'), { listing }, {
                responseType: 'blob',
            });

            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = fileURL;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(fileURL), 10000);

            Swal.close();
        } catch (error) {
            Swal.close();
            console.error('Erro ao gerar PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Unable to generate PDF. Please try again later.',
            });
        }
    };

    // Preload all images on mount
    useEffect(() => {
        images.forEach((src) => {
            if (src) {
                const img = new Image();
                img.src = src;
            }
        });
    }, []);

    useEffect(() => {
        const getCoordinates = async () => {
            try {
                const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(listing.address)}&key=${apiKey}`);
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    setMapCenter(data.results[0].geometry.location);
                }
            } catch (error) {
                console.error("Failed to fetch geocode:", error);
            }
        };
        getCoordinates();
    }, [listing.address]);

    const description = listing.description;
    const middleIndex = Math.floor(description.length / 2);
    const firstPartOfDescription = description.slice(0, middleIndex);
    const secondPartOfDescription = description.slice(middleIndex);

    return (
        <div className="page grid grid-cols-12">
            <div className="col-span-12 bg-bv-black h-16 mb-12"></div>
            <Head title={listing.address} />
            <section id="fullPropertie">
                <div className="gallery">
                    <div className="gallery-left">
                        <figure className="current">
                            <img
                                src={images.length > 0 ? images[currentIndex] : '/img/default.jpg'}
                                alt="Property Image"
                                className="image cursor-pointer"
                                onClick={() => openLightbox(currentIndex)}
                            />
                            <div className="nav">
                                <button onClick={prevImage} className="left-0 rounded-l-none">
                                    <MdKeyboardDoubleArrowLeft />
                                </button>
                                <button onClick={nextImage} className="right-0 rounded-r-none">
                                    <MdKeyboardDoubleArrowRight />
                                </button>
                            </div>
                            <div className={isDetailsOpen ? "info" : "info hide"}>
                                <div className="info-content">
                                    <h1 className="info-title">{listing.address}</h1>
                                    <p className="info-price">{formatCurrency(listing.price)}</p>
                                    <p className="info-size">{listing.sqr_footage} sqft</p>
                                </div>
                                <div className="info-btn">
                                    <button className="details-btn" onClick={toggleDetails}>
                                        Details
                                    </button>
                                </div>
                            </div>
                        </figure>
                    </div>
                    <div className="gallery-right">
                        <figure>
                            <img
                                src={images.length > 1 ? images[(currentIndex + 1) % images.length] : '/img/default.jpg'}
                                alt="Property Image"
                                className="image cursor-pointer"
                                onClick={() => openLightbox((currentIndex + 1) % images.length)}
                            />
                        </figure>
                        <figure>
                            <img
                                src={images.length > 1 ? images[(currentIndex + 2) % images.length] : '/img/default.jpg'}
                                alt="Property Image"
                                className="image cursor-pointer"
                                onClick={() => openLightbox((currentIndex + 2) % images.length)}
                            />
                        </figure>
                    </div>
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                    <div className="thumbnailStrip">
                        {images.map((src, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`thumbnailItem ${idx === currentIndex ? 'thumbnailItem--active' : ''}`}
                            >
                                <img src={src} alt={`Thumbnail ${idx + 1}`} />
                            </button>
                        ))}
                    </div>
                )}


                    <div className="content col-span-12 lg:col-span-7">
                        <div className="description">
                            <div className="pag1" dangerouslySetInnerHTML={{ __html: firstPartOfDescription }}></div>
                            <div className="verticalSpacing"></div>
                            <div className="pag2" dangerouslySetInnerHTML={{ __html: secondPartOfDescription }}></div>
                        </div>

                        <div className="basic_informations detailContainer">
                            <div className="headBtn" onClick={() => toggleSection('basic_informations')}>
                                <span className="title">Property Info</span>
                                <span className="icon">
                                    {!openSections['basic_informations'] ? <MdOutlineKeyboardArrowDown /> : <MdOutlineKeyboardArrowUp />}
                                </span>
                            </div>
                            <div className={`content ${openSections['basic_informations'] ? 'max-h-screen py-4' : 'max-h-0'}`}>
                                <div className="rowInfo">
                                    <div>
                                        <span className="icon"><FaKey /></span><span className="label">MLS</span>
                                    </div>
                                    <span className="value">{listing.mls}</span>
                                </div>
                                <div className="rowInfo">
                                    <div>
                                        <span className="icon"><FaTreeCity /></span><span className="label">Style</span>
                                    </div>
                                    <span className="value">{listing.style}</span>
                                </div>
                                <div className="rowInfo">
                                    <div>
                                        <span className="icon"><RxRulerSquare /></span><span className="label">Sqr Footage</span>
                                    </div>
                                    <span className="value">{listing.sqr_footage}²</span>
                                </div>
                                <div className="rowInfo">
                                    <div>
                                        <span className="icon"><FaBed /></span><span className="label">Bedrooms</span>
                                    </div>
                                    <span className="value">{listing.bedrooms}</span>
                                </div>
                                <div className="rowInfo">
                                    <div>
                                        <span className="icon"><FaShower /></span><span className="label">Bathrooms</span>
                                    </div>
                                    <span className="value">{listing.bathrooms}</span>
                                </div>
                                <div className="rowInfo">
                                    <div>
                                        <span className="icon"><FaSink /></span><span className="label">Half Bathrooms</span>
                                    </div>
                                    <span className="value">{listing.half_bathrooms}</span>
                                </div>
                                <div className="rowInfo">
                                    <div>
                                        <span className="icon"><MdSource /></span><span className="label">Data Source</span>
                                    </div>
                                    <span className="value">{listing.data_source}</span>
                                </div>
                                <div className="rowInfo">
                                    <div>
                                        <span className="icon"><TbTax /></span><span className="label">Tax</span>
                                    </div>
                                    <span className="value">{formatCurrency(listing.tax)}</span>
                                </div>
                                <div className="rowInfo">
                                    <div>
                                        <span className="icon"><IoCalendar /></span><span className="label">Built Date</span>
                                    </div>
                                    <span className="value">{listing.built_date}</span>
                                </div>
                            </div>
                        </div>

                        {["general_features", "external_features", "internal_features"].map((featureType) => (
                            <div key={featureType} className={`${featureType} detailContainer`}>
                                <div className="headBtn" onClick={() => toggleSection(featureType)}>
                                    <span className="title">{featureType.replaceAll('_', ' ')}</span>
                                    <span className="icon">
                                        {!openSections[featureType] ? <MdOutlineKeyboardArrowDown /> : <MdOutlineKeyboardArrowUp />}
                                    </span>
                                </div>
                                <div className={`content ${openSections[featureType] ? 'max-h-screen py-4' : 'max-h-0'}`}>
                                    {listing[featureType].length === 0 ? (
                                        <p className="text-gray-400 py-2 px-4 text-sm">No details here</p>
                                    ) : listing[featureType].map((feature) => (
                                        <div key={feature.id} className="rowInfo feature">
                                            <div>
                                                <span className="icon"><FaCheck /></span><span className="value">{feature.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className={`amenities detailContainer`}>
                            <div className="headBtn" onClick={() => toggleSection('amenities')}>
                                <span className="title">Amenities</span>
                                <span className="icon">
                                    {!openSections['amenities'] ? <MdOutlineKeyboardArrowDown /> : <MdOutlineKeyboardArrowUp />}
                                </span>
                            </div>
                            <div className={`content ${openSections['amenities'] ? 'max-h-screen py-4' : 'max-h-0'}`}>
                                {listing['amenities'].length === 0 ? (
                                    <p className="text-gray-400 py-2 px-4 text-sm">No details here</p>
                                ) : listing['amenities'].map((feature) => (
                                    <div key={feature.id} className="rowInfo feature">
                                        <div>
                                            <span className="icon"><FaCheck /></span><span className="value">{feature.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rightContent col-span-12 lg:col-span-4 lg:col-start-9">
                        <div className="flex flex-col gap-4 mt-8">
                            {listing.data_source === 'zillow' && listing.mls && (
                                <a
                                    href={`https://www.zillow.com/homedetails/${listing.mls}_zpid/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn bg-bv-black px-6 py-2 rounded text-center"
                                >
                                    View Details
                                </a>
                            )}
                            <button className="btn bg-bv-black px-6 py-2 rounded" onClick={handleGetPDF}>
                                Get PDF
                            </button>
                            {listing.virtualTour && (
                                <button className="btn bg-bv-black px-6 py-2 rounded">
                                    Virtual Tour
                                </button>
                            )}
                        </div>

                        <div className="mapSection" style={{ marginTop: '20px' }}>
                            {mapCenter && (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '300px' }}
                                    center={mapCenter}
                                    zoom={15}
                                    options={{
                                        zoomControl: false,
                                        mapTypeControl: false,
                                        streetViewControl: false,
                                        fullscreenControl: false,
                                        draggable: true,
                                    }}
                                >
                                    <Marker position={mapCenter} />
                                </GoogleMap>
                            )}
                        </div>

                    </div>
                </div>
            </section>

            {/* Lightbox */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-95"
                    onClick={closeLightbox}
                >
                    <button
                        className="absolute top-4 right-4 text-white text-3xl z-10"
                        onClick={closeLightbox}
                    >
                        <FaTimes />
                    </button>
                    <button
                        className="absolute left-4 text-white text-4xl z-10 p-2"
                        onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                    >
                        <MdKeyboardDoubleArrowLeft />
                    </button>
                    <img
                        src={images[lightboxIndex]}
                        alt={`Image ${lightboxIndex + 1}`}
                        className="max-h-[75vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        className="absolute right-4 text-white text-4xl z-10 p-2"
                        onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                    >
                        <MdKeyboardDoubleArrowRight />
                    </button>
                    <div
                        className="flex gap-2 mt-4 overflow-x-auto max-w-[90vw] pb-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {images.map((src, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                                className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${idx === lightboxIndex ? 'border-yellow-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                            >
                                <img src={src} alt={`thumb ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                    <div className="text-white text-sm mt-2">
                        {lightboxIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </div>
    );
}
