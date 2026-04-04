import { useEffect, useRef, useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";
import { FaKey, FaBed, FaShower, FaSink, FaTreeCity } from "react-icons/fa6";
import { RxRulerSquare } from "react-icons/rx";
import { MdSource, MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from "react-icons/md";
import { TbTax } from "react-icons/tb";
import { IoCalendar } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";
import { GoogleMap, Marker } from "@react-google-maps/api";
import Select from "react-select";
import useEmblaCarousel from "embla-carousel-react";
import { PrevButton, NextButton, usePrevNextButtons } from "@/Components/EmblaCarouselArrowButtons";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function PropertiesShow(backendProps) {
    const { listing, apiKey } = backendProps.props;

    const images = [listing.thumbnail_url, ...listing.gallery.map(img => img.image_url)].filter(Boolean);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDetailsOpen, setIsDetailsOpen] = useState(true);
    const [openSections, setOpenSections] = useState({});

    const today = new Date();
    const initialMonth = today.getMonth();
    const initialYear = today.getFullYear();
    const initialDay = today.getDate() + 1;

    const { data: formData, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        phone: "",
        message: "I am interested in knowing this property",
        form: listing.address,
        attributes: [{
            label: "date",
            value: `${initialYear}-${String(initialMonth + 1).padStart(2, "0")}-${String(initialDay).padStart(2, "0")}`
        }],
    });

    const [selectedMonth, setSelectedMonth] = useState(initialMonth);
    const [selectedYear, setSelectedYear] = useState(initialYear);

    const [mapCenter, setMapCenter] = useState(null);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const swal = withReactContent(Swal);

    const daysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const monthOptions = () => {
        const options = [];
        for (let i = 0; i <= 3; i++) {
            const date = new Date(initialYear, initialMonth + i, 1);
            options.push({
                value: { month: date.getMonth(), year: date.getFullYear() },
                label: `${months[date.getMonth()]} ${date.getFullYear()}`
            });
        }
        return options;
    };

    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "center",
        dragFree: true,
        loop: true,
        slidesToScroll: 1,
    });

    const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = usePrevNextButtons(emblaApi);

    const updateAttribute = (label, value) => {
        setData((prev) => ({
            ...prev,
            attributes: [
                ...prev.attributes.filter((attr) => attr.label !== label),
                { label, value },
            ],
        }));
    };

    const getValidDay = (year, month, startDay = 1) => {
        let day = startDay;
        let dayDate = new Date(year, month, day);
        const maxAttempts = daysInMonth(year, month);
        let attempts = 0;

        while ((isWeekend(dayDate) || isPast(dayDate)) && attempts < maxAttempts) {
            day++;
            dayDate = new Date(year, month, day);
            attempts++;
        }

        return !isWeekend(dayDate) && !isPast(dayDate) ? day : null;
    };

    useEffect(() => {
        if (emblaApi) {
            const dateAttr = formData.attributes.find(attr => attr.label === "date")?.value;
            if (dateAttr) {
                const [year, month, day] = dateAttr.split("-").map(Number);
                if (year === selectedYear && month - 1 === selectedMonth) {
                    const index = day - 1;
                    emblaApi.scrollTo(index, false);
                }
            }
        }
    }, [emblaApi, formData.attributes, selectedMonth, selectedYear]);

    useEffect(() => {
        if (!emblaApi) return;

        const onSelect = () => {
            let selectedIndex = emblaApi.selectedScrollSnap();
            let newDay = selectedIndex + 1;
            let dayDate = new Date(selectedYear, selectedMonth, newDay);

            let attempts = 0;
            const maxAttempts = daysInMonth(selectedYear, selectedMonth);
            while ((isWeekend(dayDate) || isPast(dayDate)) && attempts < maxAttempts) {
                selectedIndex = (selectedIndex + 1) % maxAttempts;
                newDay = selectedIndex + 1;
                dayDate = new Date(selectedYear, selectedMonth, newDay);
                attempts++;
            }

            if (!isWeekend(dayDate) && !isPast(dayDate)) {
                updateAttribute("date", `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(newDay).padStart(2, "0")}`);
                emblaApi.scrollTo(selectedIndex, false);
            }
        };

        emblaApi.on("select", onSelect);
        return () => emblaApi.off("select", onSelect);
    }, [emblaApi, selectedMonth, selectedYear]);

    const isWithinRange = (date) => {
        const maxDate = new Date(initialYear, initialMonth + 3, 31);
        return date <= maxDate;
    };

    const isPast = (date) => {
        return date < new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    };

    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    const nextImage = () => {
        setCurrentIndex((prev) => (prev - 1 < 0 ? images.length - 1 : prev - 1));
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev + 1 >= images.length ? 0 : prev + 1));
    };

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

    const handleSubmit = (e) => {
        e.preventDefault();

        const isValidEmail = (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        };

        const isValidPhone = (phone) => {
            const phoneRegex = /^\+?1?\d{10,15}$/;
            return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
        };

        const errors = {};

        if (!formData.name.trim()) {
            errors.name = "Name is required";
        }

        if (!formData.email.trim()) {
            errors.email = "Email is required";
        } else if (!isValidEmail(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!formData.phone.trim()) {
            errors.phone = "Phone number is required";
        } else if (!isValidPhone(formData.phone)) {
            errors.phone = "Please enter a valid phone number";
        }

        const dateAttr = formData.attributes.find(attr => attr.label === "date")?.value;
        if (!dateAttr) {
            errors.date = "Please select a valid date";
        } else {
            const selectedDate = new Date(dateAttr);
            if (isPast(selectedDate) || isWeekend(selectedDate) || !isWithinRange(selectedDate)) {
                errors.date = "Selected date is invalid or unavailable";
            }
        }

        if (Object.keys(errors).length > 0) {
            swal.fire({
                icon: "error",
                title: "Validation Error",
                text: "Please correct the following errors: " + Object.values(errors).join(", "),
            });
            return;
        }

        post(route("leads.store"), {
            onSuccess: () => {
                swal.fire({
                    icon: "success",
                    title: "Message sent successfully!",
                    text: "We will contact you!",
                    showConfirmButton: true,
                });
                reset();
            },
            onError: (serverErrors) => {
                console.log(serverErrors);
                swal.fire({
                    icon: "error",
                    title: "Something went wrong",
                    text: "Please verify the fields and try again",
                });
            },
        });
    };

    const handleRequestDetails = () => {
        const message = `Hello, I would like to request more details about the property at ${listing.address}`;
        const phoneNumber = "15085092287";
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
    };

    const handleGetPDF = async () => {
        try {
            Swal.fire({
                allowOutsideClick: false,
                background: "transparent",
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const response = await axios.post(route('properties.pdf'), { listing }, {
                responseType: 'blob',
            });

            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL);

            Swal.close();
        } catch (error) {

            Swal.close();
            console.error('Erro ao gerar PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.error || 'Unable to generate PDF. Please try again later.',
            });
        }
    };

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

    useEffect(() => {
        // Ao mudar o mês, seleciona o primeiro dia válido
        const validDay = getValidDay(selectedYear, selectedMonth);
        if (validDay) {
            updateAttribute("date", `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(validDay).padStart(2, "0")}`);
        }
    }, [selectedMonth, selectedYear]);

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
                                className="image"
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
                                className="image"
                            />
                        </figure>
                        <figure>
                            <img
                                src={images.length > 1 ? images[(currentIndex + 2) % images.length] : '/img/default.jpg'}
                                alt="Property Image"
                                className="image"
                            />
                        </figure>
                    </div>
                </div>

                <div className="grid grid-cols-12 pt-4">
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
                                    {listing[featureType].map((feature) => (
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
                                {listing['amenities'].map((feature) => (
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
                            <button className="btn bg-bv-black px-6 py-2 rounded" onClick={handleRequestDetails}>
                                Request Details
                            </button>
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

                        <div className="mt-8 bg-bv-black p-4 rounded-lg">
                            <div className="flex items-center justify-between flex-col lg:flex-row">
                                <Select
                                    id="monthSelector"
                                    name="monthSelector"
                                    options={monthOptions()}
                                    classNamePrefix="react-select"
                                    placeholder="Select Month"
                                    value={{
                                        value: { month: selectedMonth, year: selectedYear },
                                        label: `${months[selectedMonth]} ${selectedYear}`
                                    }}
                                    onChange={(selected) => {
                                        setSelectedMonth(selected.value.month);
                                        setSelectedYear(selected.value.year);
                                    }}
                                />
                                <div className="daysController flex items-center gap-2">
                                    <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
                                    <span className="verticalSpacing !h-8"></span>
                                    <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
                                </div>
                            </div>

                            <section className="embla emblaProperties">
                                <div className="embla__viewport" ref={emblaRef}>
                                    <div className="embla__container pt-2 pb-8">
                                        {Array.from({ length: daysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1)
                                            .filter(day => !isWeekend(new Date(selectedYear, selectedMonth, day)))
                                            .map((day) => {
                                            const dayDate = new Date(selectedYear, selectedMonth, day);
                                            const isDisabled = isPast(dayDate) || isWeekend(dayDate);
                                            const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                            const isSelected = formData.attributes.find(attr => attr.label === "date")?.value === formattedDate;

                                            return (
                                                <div className="embla__slide" key={day}>
                                                    <button
                                                        type="button"
                                                        className={`day hover:text-bv-black py-8 flex flex-col gap-2 ${isSelected ? "day--selected" : ""} ${isDisabled ? "day--disabled" : ""}`}
                                                        value={formattedDate}
                                                        disabled={isDisabled}
                                                        onClick={() => {
                                                            if (!isDisabled) {
                                                                updateAttribute("date", formattedDate);
                                                            }
                                                        }}
                                                    >
                                                        <span className="day__weekday">
                                                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayDate.getDay()]}
                                                        </span>
                                                        <span className="font-semibold text-2xl day__number">{day}</span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>

                            <div className="mt-4">
                                <div className="InputGroup !py-0">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        className="input w-full mb-4"
                                        value={formData.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                    />
                                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                                </div>
                                <div className="InputGroup !py-0">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        className="input w-full mb-4"
                                        value={formData.email}
                                        onChange={(e) => setData("email", e.target.value)}
                                    />
                                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                                </div>
                                <div className="InputGroup !py-0">
                                    <input
                                        type="tel"
                                        placeholder="Phone"
                                        className="input w-full mb-4"
                                        value={formData.phone}
                                        onChange={(e) => setData("phone", e.target.value)}
                                    />
                                    {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                                </div>
                                <button
                                    className="btn bg-bv-gradient text-bv-black font-bold text-xl px-6 py-4 rounded-lg border-none w-full"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                >
                                    {processing ? "Submitting..." : "Request Visit"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
