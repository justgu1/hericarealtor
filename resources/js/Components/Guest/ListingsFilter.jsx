import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import InputGroup from "@/Components/Form/InputGroup";
import { motion } from "framer-motion"; // Importando animação

export default function ListingsFilter({ listingTypes }) {
    const { data: formData, setData, errors } = useForm({
        address: '',
        min_sqr_footage: 0,
        max_sqr_footage: 0,
        bedrooms: 0,
        bathrooms: 0,
        half_bathrooms: 0,
        min_price: '0',
        max_price: '0',
        listing_types: [],
    });

    const [activeStep, setActiveStep] = useState(0);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;

        if (["price", "tax", "min", "max"].includes(name)) {
            const formattedValue = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
            setData((prevData) => ({
                ...prevData,
                [name]: formattedValue
            }));
        } else if (name === "built_date") {
            const formattedDate = new Date(value).toISOString().split('T')[0];
            setData((prevData) => ({
                ...prevData,
                [name]: formattedDate
            }));
        } else if (type === "select" || type === "multiselect") {
            const selectedValue = e.target.value;
            setData((prevData) => ({
                ...prevData,
                [name]: selectedValue
            }));
        } else if (type === "checkbox") {
            setData((prevData) => ({
                ...prevData,
                [name]: checked
            }));
        } else {
            setData((prevData) => ({
                ...prevData,
                [name]: value
            }));
        }
    };

    const onChangeListingTypesInput = (selectedOptions) => {
        const selectedValues = selectedOptions.map(option => option.value);
        setData("listing_types", selectedValues);
    };

    const steps = [
        {
            title: "Basic Information", inputs: [
                { type: "text", placeholder: "Address", label: "Address", id: "address", name: "address", required: "required", value: formData.address },
                { type: "multiselect", label: "Type", id: "type", name: "type", required: "required", options: listingTypes, value: formData.listing_types, defaultValue: listingTypes[0], error: errors.categories, onChange: onChangeListingTypesInput },
                { type: "number", placeholder: "Bedrooms", label: "Bedrooms (min)", id: "bedrooms", name: "bedrooms", required: "required", min: "0", value: formData.bedrooms },
                { type: "number", placeholder: "Bathrooms", label: "Bathrooms (min)", id: "bathrooms", name: "bathrooms", min: "0", value: formData.bathrooms },
                { type: "number", placeholder: "Half Baths", label: "Half Baths (min)", id: "half_bathrooms", name: "half_bathrooms", min: "0", value: formData.half_bathrooms },
            ]
        },
        {
            title: "Area (sqft)", inputs: [
                { type: "number", placeholder: "Min (sqft)", label: "Area (min)", id: "min_sqr_footage", name: "min_sqr_footage", required: "required", max: 100000, value: formData.min_sqr_footage },
                { type: "number", placeholder: "Max (sqft)", label: "Area (max)", id: "max_sqr_footage", name: "max_sqr_footage", required: "required", max: 100000, value: formData.max_sqr_footage },
            ]
        },
        {
            title: "Price ($)", inputs: [
                { type: "text", placeholder: "Min", label: "Min", id: "min_price", name: "min_price", required: "required", min: 0, max: 100000000, value: formData.min_price },
                { type: "text", placeholder: "Max", label: "Max", id: "max_price", name: "max_price", required: "required", value: formData.max_price },
            ]
        },
    ];

    return (
        <form id="AdvancedFilter" className="AdvancedFilter">
            <div className="header">
                <h2>Filter</h2>
            </div>

            <div className="legends">
                {steps.map((step, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`legendSelector ${activeStep === index ? "active" : ""}`}
                        onClick={() => setActiveStep(index)}
                    >
                        {step.title}
                    </button>
                ))}
            </div>

            <div className="inputs">
                {steps.map((step, index) => (
                    activeStep === index && (
                        <motion.fieldset
                            key={index}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="filterStep" step={index}>
                                {step.inputs.map((input) => (
                                    <InputGroup
                                        key={input.id}
                                        type={input.type}
                                        placeholder={input.placeholder}
                                        label={input.label}
                                        id={input.id}
                                        name={input.name}
                                        required={input.required}
                                        onChange={input.type === "multiselect" ? input.onChange : handleChange}
                                        max={input.max}
                                        options={input.options}
                                        value={input.value}
                                        defaultValue={input.defaultValue}
                                        error={input.error}
                                    />
                                ))}
                            </div>
                        </motion.fieldset>
                    )
                ))}
            </div>

            <div className="bottom">
                <a className="button principal" href={route('properties', formData)}>
                    Search
                </a>
            </div>
        </form>
    );
}
