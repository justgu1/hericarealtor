import { Head, router, useForm } from "@inertiajs/react";
import { useState, useRef } from "react";
import styles from "/resources/css/admin.module.css";
import SectionTitle from "@/Components/SectionTitle";
import InputGroup from "@/Components/Form/InputGroup";
import { FaTrash } from "react-icons/fa";
import Swal from 'sweetalert2';
import { LoadScript, Autocomplete } from "@react-google-maps/api";
import withReactContent from 'sweetalert2-react-content';

export default function Add(backendProps) {
    const { statusData, typesData, transactionTypesData, general_features, internal_features, external_features, amenities, apiKey, cities } = backendProps.props
    const { data: formData, setData, post, processing, errors, reset } = useForm({
        mls: '',
        address: '',
        city: '',
        description: '',
        style: '',
        data_source: '',
        thumbnail: null,
        gallery: [],
        general_features: [],
        internal_features: [],
        external_features: [],
        amenities: [],
        sqr_footage: '',
        bedrooms: '',
        bathrooms: '',
        half_bathrooms: '',
        price: '',
        tax: '',
        built_date: '',
        listing_status: '',
        listing_type: '',
        transaction_type: ''
    });

    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [localErrors, setLocalErrors] = useState({});

    const swal = withReactContent(Swal);
    const autocompleteRef = useRef(null);

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > (1024 * 1024) * 4) {
                setLocalErrors((prevErrors) => ({
                    ...prevErrors,
                    thumbnail: "The max image size is 4MB"
                }));
                return;
            }
            setThumbnailPreview(URL.createObjectURL(file));
            setData('thumbnail', file);
        }
    };

    const handleGalleryChange = (e) => {
        const fileList = e.target.files;
        const maxSize = (1024 * 1024) * 4;
        const errors = [];
        Array.from(fileList).forEach(file => {
            if (file.size > maxSize) {
                errors.push(`${file.name} is too large. The max size is 4MB.`);
            }
        });
        if (errors.length) {
            setLocalErrors((prevErrors) => ({
                ...prevErrors,
                gallery: errors.join(' ')
            }));
            return;
        }
        setGalleryPreviews((prevPreviews) => [
            ...prevPreviews,
            ...Array.from(fileList).map(file => URL.createObjectURL(file))
        ]);
        setData("gallery", [...(Array.isArray(formData.gallery) ? formData.gallery : []), ...fileList]);
    };


    const removeImage = (index) => {
        setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));

        setData((prevData) => {
            const updatedGallery = prevData.gallery ? prevData.gallery : [];
            const newGallery = Array.from(updatedGallery).filter((_, i) => i !== index);
            return {
                ...prevData,
                gallery: newGallery
            };
        });
    };



    const handleChange = (e) => {
        const { name, type, value, checked, files } = e.target;
        if (["price", "tax", "max_price", "min_price"].includes(name)) {
            const formattedValue = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
            setData(name, formattedValue);
        } else if (name === "built_date") {
            const formattedDate = new Date(value).toISOString().split('T')[0];
            setData(name, formattedDate);
        } else if (name === "thumbnail") {
            handleThumbnailChange(e);
            setData(name, files[0]);
        } else if (name === "gallery") {
            handleGalleryChange(e);
            setData(name, files);
        } else if (type === "select" || type === "multiselect") {
            setData(name, value);
        } else if (type === "checkbox") {
            setData(name, checked);
        } else {
            setData(name, value);
        }
    };

    const steps = [
        {
            title: "Basic Information", inputs: [
                { type: "text", placeholder: "MLS", label: "MLS", id: "mls", name: "mls", },
                { type: "text", placeholder: "Address", label: "Address", id: "address", name: "address", required: "required", },
                { type: "select", placeholder: "City", label: "City", id: "city", name: "city", required: "required", options:cities },
                { type: "textarea", placeholder: "Description", label: "Propertie Description", id: "description", name: "description", required: "required", value: formData.description },
                { type: "text", placeholder: "Style", label: "Style", id: "style", name: "style", },
                { type: "text", placeholder: "Data Source", label: "Data Source", id: "data_source", name: "data_source", },
            ]
        },
        {
            title: "Gallery", inputs: [
                { type: "file", label: "Thumbnail", id: "thumbnail", name: "thumbnail", required: true, multiple: false, onChange: handleThumbnailChange },
                { type: "file", label: "Gallery", id: "gallery", name: "gallery", required: false, multiple: true, onChange: handleGalleryChange }
            ]
        },
        {
            title: "Property Details", inputs: [
                { type: "number", placeholder: "Area (sqft)", label: "Area", id: "sqr_footage", name: "sqr_footage", required: "required", max: 100000 },
                { type: "number", placeholder: "Bedrooms", label: "Bedrooms", id: "bedrooms", name: "bedrooms", required: "required", min: "0", },
                { type: "number", placeholder: "Bathrooms", label: "Bathrooms", id: "bathrooms", name: "bathrooms", min: "0", },
                { type: "number", placeholder: "Half Baths", label: "Half Baths", id: "half_bathrooms", name: "half_bathrooms", min: "0", }
            ]
        },
        {
            title: "Financial Information", inputs: [
                { type: "text", placeholder: "Price", label: "Price", id: "price", name: "price", required: "required", },
                { type: "text", placeholder: "Taxes", label: "Taxes", id: "tax", name: "tax", }
            ]
        },
        {
            title: "Construction Info", inputs: [
                { type: "date", placeholder: "Year Built", label: "Year", id: "built_date", name: "built_date", }
            ]
        },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        Swal.fire({
            allowOutsideClick: true,
            background: "none",
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        post(route("admin.listings.store"), {
            onSuccess: () => {
                Swal.close();
                Swal.fire({
                    icon: "success",
                    title: "Listing created successfully!",
                    timer: 2000,
                    showConfirmButton: true,
                }).then(() => {
                    window.location.href = "/admin/listings"
                });
            },
            onError: (errors) => {
                let message = `please, check the fields:`
                Object.keys(errors).forEach(i => {
                    console.log(i, errors[i])
                    if (i.includes('gallery')) {
                        message += `${i}: the image has exceeded the maximum size`
                    } else {
                        message += `${i}: ${errors[i]}`
                    }
                });
                Swal.close();
                Swal.fire({
                    icon: "error",
                    title: "Something went wrong",
                    text: message,
                });
                setLocalErrors((prevErrors) => ({
                    ...prevErrors,
                    errors
                }));
            },
        });
    };

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
        <LoadScript googleMapsApiKey={apiKey} libraries={["places"]}>
            <div id="Listings" className={styles.Section}>
                <Head title="Listings" />
                <SectionTitle h2="New" h3="Listing" />
                <section>
                    <form onSubmit={handleSubmit}>
                        {steps.map((step, index) => (
                            <fieldset key={index}>
                                <legend>{step.title}</legend>
                                {step.inputs && step.inputs.map((input, idx) => (
                                    <div key={input.id}>
                                        {input.name === 'address' ? (
                                            <Autocomplete
                                                onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                                                onPlaceChanged={handlePlaceChanged}
                                            >
                                                <InputGroup
                                                    type={input.type}
                                                    placeholder={input.placeholder}
                                                    label={input.label}
                                                    id={input.id}
                                                    name={input.name}
                                                    required={input.required}
                                                    multiple={input.multiple}
                                                    onChange={(e) => handleChange(e)}
                                                    max={input.max}
                                                />
                                            </Autocomplete>
                                        ) : <InputGroup
                                            type={input.type}
                                            placeholder={input.placeholder}
                                            label={input.label}
                                            id={input.id}
                                            name={input.name}
                                            required={input.required}
                                            multiple={input.multiple}
                                            value={input.value}
                                            onChange={(e) => handleChange(e)}
                                            max={input.max}
                                            options={input.options}
                                        />}

                                        {input.name === 'gallery' && galleryPreviews.length > 0 && (
                                            <div>
                                                <p>Gallery Previews:</p>
                                                <div className={styles.GalleryPreview}>
                                                    {galleryPreviews.map((src, index) => (
                                                        <div key={index} className={styles.ImageContainer}>
                                                            <img src={src} alt={`Gallery Preview ${index}`} className={styles.PreviewImage} />
                                                            <button
                                                                type="button"
                                                                className={styles.RemoveButton}
                                                                onClick={() => removeImage(index)}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <p className="error">{localErrors?.[input.name]}</p>
                                    </div>
                                ))}
                            </fieldset>
                        ))}

                        <fieldset>
                            <legend>Features & Amenities</legend>
                            <InputGroup
                                type="multiselect"
                                label="General Features"
                                id="general_features"
                                name="general_features"
                                options={general_features}
                                value={formData.general_features}
                                onChange={(e) => {
                                    const selectedOptions = e;
                                    const selectedValues = selectedOptions.map(option => option.value);
                                    setData('general_features', selectedValues);
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
                                value={formData.internal_features}
                                onChange={(e) => {
                                    const selectedOptions = e;
                                    const selectedValues = selectedOptions.map(option => option.value);
                                    setData('internal_features', selectedValues);
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
                                value={formData.external_features}
                                onChange={(e) => {
                                    const selectedOptions = e;
                                    const selectedValues = selectedOptions.map(option => option.value);
                                    setData('external_features', selectedValues);
                                    setLocalErrors((prevErrors) => ({
                                        ...prevErrors,
                                        external_features: selectedValues.length > 0 ? '' : 'At least 1 external_features is required'
                                    }));
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
                                value={formData.amenities}
                                onChange={(e) => {
                                    const selectedOptions = e;
                                    const selectedValues = selectedOptions.map(option => option.value);
                                    setData('amenities', selectedValues);
                                }}
                                error={errors.amenities}
                            />
                            <p className="error">{localErrors?.amenities}</p>
                        </fieldset>

                        <fieldset className={styles.Rightcolumn}>
                            <legend>Status & Transaction Type</legend>
                            <InputGroup type="select" label="Status" id="listing_status" name="listing_status" options={statusData} onChange={(e) => handleChange(e)} />
                            <InputGroup type="select" label="Type" id="listing_type" name="listing_type" options={typesData} onChange={(e) => handleChange(e)} />
                            <InputGroup type="select" label="Transaction Type" id="transaction_type" name="transaction_type" options={transactionTypesData} onChange={(e) => handleChange(e)} />
                            <div className={styles.Previews}>
                                {thumbnailPreview && (
                                    <div className={styles.ThumbnailPreview}>
                                        <p>Thumbnail Preview:</p>
                                        <img src={thumbnailPreview} alt="Thumbnail Preview" className={styles.PreviewImage} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <button type="submit" className="principal" disabled={processing}>
                                    Save
                                </button>
                            </div>
                        </fieldset>
                    </form>
                </section>
            </div>
        </LoadScript>
    );
}
