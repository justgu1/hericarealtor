import { Head, useForm } from "@inertiajs/react";
import { useState, useRef } from "react";
import { Autocomplete } from "@react-google-maps/api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SectionTitle from "@/Components/SectionTitle";
import FullLogo from "@/Components/Icons/FullLogo";
import Facebook from "@/Components/Icons/Facebook";
import Instagram from "@/Components/Icons/Instagram";
import Phone from "@/Components/Icons/Phone";
import Whatsapp from "@/Components/Icons/Whatsapp";
import Linkedin from "@/Components/Icons/Linkedin";
import Youtube from "@/Components/Icons/Youtube";
import { usePage } from '@inertiajs/react';
import InputGroup from "@/Components/Form/InputGroup";

export default function HomeValuation({ general_features, internal_features, external_features, amenities }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
        phone: "",
        message: "",
        attributes: [],
        form: "seller",
    });

    const { settings } = usePage().props;

    const [step, setStep] = useState(1);
    const [localErrors, setLocalErrors] = useState({});
    const swal = withReactContent(Swal);
    const autocompleteRef = useRef(null);

    const handlePlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place && place.geometry) {
                const address = place.formatted_address;
                updateAttribute("Address", address);
            }
        }
    };

    const updateAttribute = (label, value) => {
        setData((prev) => ({
            ...prev,
            attributes: [
                ...prev.attributes.filter((attr) => attr.label !== label),
                { label, value },
            ],
        }));
    };

    const getAttribute = (label) =>
        data.attributes.find((attr) => attr.label === label)?.value || "";


    const isStepValid = (setLocalErrors) => {
        let errors = {};

        if (step === 1) {
            const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);

            if (!data.name) {
                errors.name = "Name is required.";
            }
            if (!data.email) {
                errors.email = "Email is required.";
            } else if (!isEmailValid) {
                errors.email = "Please enter a valid email address.";
            }
            if (!data.phone) {
                errors.phone = "Phone number is required.";
            }

            setLocalErrors(errors);
            return Object.keys(errors).length === 0;
        }

        else if (step === 2) {
            if (!data.phone) {
                errors.phone = "Phone number is required.";
            }

            const fields = ["Sqft", "Bedrooms", "Bathrooms", "Half Bathrooms"];

            fields.forEach((label) => {
                const attr = data.attributes.find((a) => a.label === label);
                const value = attr?.value;

                if (value === undefined || value === "") {
                    errors[label] = `${label} is required.`;
                } else {
                    const num = Number(value);
                    if (isNaN(num)) {
                        errors[label] = `${label} must be a number.`;
                    } else if (label != 'Sqft' && (num < 0 || num > 100)) {
                        errors[label] = `${label} must be between 0 and 100.`;
                    }
                }
            });

            const addressAttr = data.attributes.find((a) => a.label === "Address");
            if (!addressAttr?.value) {
                errors.Address = "Address is required.";
            }

            setLocalErrors(errors);
            return Object.keys(errors).length === 0;
        }

        return true;
    };



    const handleNext = () => {
        if (isStepValid(setLocalErrors)) {
            setStep((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        setStep((prev) => prev - 1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("leads.store"), {
            onSuccess: () => {
                swal.fire({
                    icon: "success",
                    title: "Message sent successfully!",
                    text: "We will contact you!",
                    showConfirmButton: true,
                });
            },
            onError: (errors) => {
                console.log(errors);
                swal.fire({
                    icon: "error",
                    title: "Something went wrong",
                    text: "Verify fields",
                });
                setLocalErrors(errors);
            },
        });
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <div className="leadGroup">
                            <input
                                placeholder="Full Name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                            />
                            <p className="error">{localErrors?.name}</p>
                        </div>

                        <div className="leadGroup">
                            <input
                                placeholder="Email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                            />
                            <p className="error">{localErrors?.email}</p>
                        </div>

                        <div className="leadGroup">
                            <input
                                placeholder="Phone"
                                type="tel"
                                value={data.phone}
                                onChange={(e) => setData("phone", e.target.value)}
                            />
                            <p className="error">{localErrors?.phone}</p>
                        </div>

                        <div className="leadGroup textArea">
                            <textarea
                                placeholder="Message (optional)"
                                value={data.message}
                                onChange={(e) => setData("message", e.target.value)}
                            />
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <div className="leadGroup">
                            <Autocomplete
                                onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                                onPlaceChanged={handlePlaceChanged}
                            >
                                <input
                                    placeholder="Address"
                                    value={getAttribute("Address")}
                                    onChange={(e) => updateAttribute("Address", e.target.value)}
                                />
                            </Autocomplete>
                            <p className="error">{localErrors?.["Address"]}</p>
                        </div>

                        <div className="leadGroup">
                            <input placeholder="Sqft²" type="number" value={getAttribute("Sqft")} onChange={(e) => updateAttribute("Sqft", e.target.value)} />
                            <p className="error">{localErrors?.["Sqft"]}</p>
                        </div>

                        <div className="leadGroup">
                            <input placeholder="Bedrooms" type="number" value={getAttribute("Bedrooms")} onChange={(e) => updateAttribute("Bedrooms", e.target.value)} />
                            <p className="error">{localErrors?.["Bedrooms"]}</p>
                        </div>

                        <div className="leadGroup">
                            <input placeholder="Bathrooms" type="number" value={getAttribute("Bathrooms")} onChange={(e) => updateAttribute("Bathrooms", e.target.value)} />
                            <p className="error">{localErrors?.["Bathrooms"]}</p>
                        </div>

                        <div className="leadGroup">
                            <input placeholder="Half Bathrooms" type="number" value={getAttribute("Half Bathrooms")} onChange={(e) => updateAttribute("Half Bathrooms", e.target.value)} />
                            <p className="error">{localErrors?.["Half Bathrooms"]}</p>
                        </div>
                    </>
                );
            case 3:
                return (
                    <div className="homeValuationFeaturesAndAmenities" >
                        <legend>Features & Amenities</legend>

                        <InputGroup
                            type="multiselect"
                            label="General Features"
                            id="general_features"
                            name="general_features"
                            options={general_features}
                            value={getAttribute("General Features")}
                            onChange={(e) => {
                                const selectedValues = e.map(option => option.value);
                                updateAttribute("General Features", selectedValues);
                            }}
                            error={errors.general_features}
                        />

                        <p className="error">{localErrors?.general_features}</p>

                        <InputGroup
                            type="multiselect"
                            label="Internal Features"
                            id="internal_features"
                            name="internal_features"
                            options={internal_features}
                            value={getAttribute("Internal Features")}
                            onChange={(e) => {
                                const selectedValues = e.map(option => option.value);
                                updateAttribute("Internal Features", selectedValues);
                            }}
                            error={errors.internal_features}
                        />
                        <p className="error">{localErrors?.internal_features}</p>

                        <InputGroup
                            type="multiselect"
                            label="External Features"
                            id="external_features"
                            name="external_features"
                            options={external_features}
                            value={getAttribute("External Features")}
                            onChange={(e) => {
                                const selectedValues = e.map(option => option.value);
                                updateAttribute("External Features", selectedValues);
                            }}
                            error={errors.external_features}
                        />
                        <p className="error">{localErrors?.external_features}</p>

                        <InputGroup
                            type="multiselect"
                            label="Amenities"
                            id="amenities"
                            name="amenities"
                            options={amenities}
                            value={getAttribute("Amenities")}
                            onChange={(e) => {
                                const selectedValues = e.map(option => option.value);
                                updateAttribute("Amenities", selectedValues);
                            }}
                            error={errors.amenities}
                        />
                        <p className="error">{localErrors?.amenities}</p>
                    </div>
                );
        }
    };

    return (
        <section id="contactMe">
            <SectionTitle h2="Home" h3="Valuation" color="darkness" />
            <div className="contactContainer">
                <form onSubmit={handleSubmit} className="contactMeForm minimalForm">
                    <div className="progress-container w-full flex justify-between items-center mb-8 relative">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-bv-black rounded-full z-0" />
                        <div className="absolute top-1/2 left-0 h-1 bg-bv-gradient rounded-full z-10 transition-all duration-500"
                            style={{ width: `${(step - 1) * 50}%` }} />

                        {[1, 2, 3].map((item) => (
                            <div key={item} className="relative z-20">
                                <div className={`w-10 h-10 flex items-center justify-center border-2 rounded-full
                ${step >= item ? 'bg-bv-black text-white border-bv-black' : 'bg-bv-white text-bv-black border-bv-black'}`}>
                                    {item}
                                </div>
                            </div>
                        ))}
                    </div>


                    {renderStep()}

                    <div className="form-nav-buttons" style={{ width: '100%', marginTop: "20px", display: "flex", gap: "10px", justifyContent: 'space-between' }}>
                        {step > 1 && <button type="button" onClick={handlePrev}>Previous</button>}
                        {step < 3 && (
                            <button type="button" onClick={handleNext}>
                                Next
                            </button>
                        )}
                        {step === 3 && <button type="submit" disabled={processing}>Submit</button>}
                    </div>
                </form>

                <aside className="sobrepositionAside">
                    <div className="w-full md:w-3/6 flex flex-col gap-4 items-center justify-end">
                        <div className="logo">
                            <FullLogo />
                        </div>
                        <img src="img/herica.png" className="w-full h-auto max-h-96 max-w-sm" />
                        <div className="rounded-xl p-1 bg-gradient-to-b from-bv-brown via-yellow to-bv-orange dark:from-bv-brown dark:via-bv-yellow dark:to-bv-orange">
                            <div className="FixedSocialIcons SocialIcons bg-bv-white p-4 rounded-lg">
                                <ul className="flex gap-4">
                                    <li>
                                        <a href={settings.facebook_link}>
                                            <Facebook />
                                        </a>
                                    </li>
                                    <li>
                                        <a href={settings.instagram_link}>
                                            <Instagram />
                                        </a>
                                    </li>
                                    <li>
                                        <a href={settings.youtube_link}>
                                            <Youtube />
                                        </a>
                                    </li>
                                    <li>
                                        <a href={settings.linkedin_link}>
                                            <Linkedin />
                                        </a>
                                    </li>
                                    <li>
                                        <a href={`https://wa.me/${settings.whatsapp}`}>
                                            <Whatsapp />
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    );
}
