import { Head, router, useForm } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import styles from "/resources/css/admin.module.css";
import SectionTitle from "@/Components/SectionTitle";
import InputGroup from "@/Components/Form/InputGroup";
import { FaTrash } from "react-icons/fa";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { format } from 'date-fns';
import { LoadScript, Autocomplete } from "@react-google-maps/api";
import { MenuItem } from "@headlessui/react";

export default function Edit(backendData) {

    const { listing, statusData, typesData, transactionTypesData, successMessage, gallery, general_features, internal_features, external_features, amenities, apiKey, cities } = backendData.props;
    const { data, setData, post: submitPost, processing, errors, reset } = useForm({
        mls: listing.mls || '',
        address: listing.address || '',
        city: listing.city || '',
        description: listing.description || '',
        style: listing.style || '',
        data_source: listing.data_source || '',
        thumbnail: null,
        prev_gallery: gallery.length > 0 ? gallery : null,
        gallery: [],
        sqr_footage: listing.sqr_footage || 0,
        bedrooms: listing.bedrooms || 0,
        bathrooms: listing.bathrooms || 0,
        half_bathrooms: listing.half_bathrooms || 0,
        price: listing.price || 0,
        tax: listing.tax || 0,
        built_date: listing.built_date ? format(new Date(listing.built_date), 'yyyy-MM-dd') : '',
        listing_status: (listing.status !== undefined) ? listing.status : null,
        listing_type: (listing.type !== undefined) ? listing.type : null,
        transaction_type: (listing.transaction_type !== undefined) ? listing.transaction_type : null,
        general_features: listing.general_features.map((feature) => {
            return {
                value: feature.name,
                label: feature.name,
            }
        }) || [],
        internal_features: listing.internal_features.map((feature) => {
            return {
                value: feature.name,
                label: feature.name,
            }
        }) || [],
        external_features: listing.external_features.map((feature) => {
            return {
                value: feature.name,
                label: feature.name,
            }
        }) || [],
        amenities: listing.amenities.map((amenity) => {
            return {
                value: amenity.name,
                label: amenity.name,
            }
        }) || [],
    });
    const [thumbnailPreview, setThumbnailPreview] = useState(listing.thumbnail_url || null);
    const [galleryPreviews, setGalleryPreviews] = useState(gallery ? gallery.map((item) => item.image_url) : []);
    const [localErrors, setLocalErrors] = useState({});

    const swal = withReactContent(Swal);
    const autocompleteRef = useRef(null);

    useEffect(() => {
        if (successMessage) {
            swal.fire({
                icon: 'success',
                title: 'Success!',
                text: successMessage,
                timer: 2000,
                showConfirmButton: true,
            }).then(() => {
                window.location.href = "/admin/listings";
            });
        }
    }, [successMessage]);

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
        const fileList = Array.from(e.target.files);
        const maxSize = (1024 * 1024) * 4;
        const errors = [];

        fileList.forEach(file => {
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

        setData("gallery", [...(data.gallery || []), ...fileList]);
        setGalleryPreviews([...galleryPreviews, ...fileList.map(file => URL.createObjectURL(file))]);
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

    const removeImage = (index) => {
        setGalleryPreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index));

        setData((prevData) => {
            const updatedGallery = Array.isArray(prevData.gallery) ? prevData.gallery : [];
            const updatedPrevGallery = Array.isArray(prevData.prev_gallery) ? prevData.prev_gallery : [];

            if (index < updatedPrevGallery.length) {
                const newPrevGallery = updatedPrevGallery.filter((_, i) => i !== index);
                return {
                    ...prevData,
                    prev_gallery: newPrevGallery.length > 0 ? newPrevGallery : null,
                };
            } else {
                const newGallery = updatedGallery.filter((_, i) => i !== (index - updatedPrevGallery.length));
                return {
                    ...prevData,
                    gallery: newGallery.length > 0 ? newGallery : [],
                };
            }
        });
    };


    const handleChange = (e) => {
        const { name, type, value, checked, files } = e.target;

        if (["price", "tax"].includes(name)) {
            const formattedValue = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
            setData(name, formattedValue);
        } else if (name === "built_date") {
            const formattedDate = new Date(value).toISOString().split('T')[0];
            setData(name, formattedDate);
        } else if (name === "thumbnail") {
            handleThumbnailChange(e);
        } else if (name === "gallery") {
            handleGalleryChange(e);
        } else if (type === "select") {
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
                { type: "text", placeholder: "MLS", label: "MLS", id: "mls", name: "mls", value: data.mls },
                { type: "text", placeholder: "Address", label: "Address", id: "address", name: "address", required: "required", value: data.address },
                { type: "select", placeholder: "City", label: "City", id: "city", name: "city", value: data.city, options:cities },
                { type: "textarea", placeholder: "Description", label: "Propertie Description", id: "description", name: "description", required: "required", value: data.description },
                { type: "text", placeholder: "Style", label: "Style", id: "style", name: "style", value: data.style },
                { type: "text", placeholder: "Data Source", label: "Data Source", id: "data_source", name: "data_source", value: data.data_source },
            ]
        },
        {
            title: "Gallery", inputs: [
                { type: "file", label: "Thumbnail", id: "thumbnail", name: "thumbnail", required: false, multiple: false, onChange: handleThumbnailChange },
                { type: "file", label: "Gallery", id: "gallery", name: "gallery", required: false, multiple: true, onChange: handleGalleryChange }
            ]
        },
        {
            title: "Property Details", inputs: [
                { type: "number", placeholder: "Area (sqft)", label: "Area", id: "sqr_footage", name: "sqr_footage", required: "required", max: 100000, value: data.sqr_footage },
                { type: "number", placeholder: "Bedrooms", label: "Bedrooms", id: "bedrooms", name: "bedrooms", required: "required", min: "0", value: data.bedrooms },
                { type: "number", placeholder: "Bathrooms", label: "Bathrooms", id: "bathrooms", name: "bathrooms", min: "0", value: data.bathrooms },
                { type: "number", placeholder: "Half Baths", label: "Half Baths", id: "half_bathrooms", name: "half_bathrooms", min: "0", value: data.half_bathrooms }
            ]
        },
        {
            title: "Financial Information", inputs: [
                { type: "text", placeholder: "Price", label: "Price", id: "price", name: "price", required: "required", value: formatCurrency(data.price) },
                { type: "text", placeholder: "Taxes", label: "Taxes", id: "tax", name: "tax", value: formatCurrency(data.tax) }
            ]
        },
        {
            title: "Construction Info", inputs: [
                { type: "date", placeholder: "Year Built", label: "Year", id: "built_date", name: "built_date", value: data.built_date }
            ]
        },
    ];

    const handleSubmit = (e) => {
        console.log(data)
        e.preventDefault();
        Swal.fire({
            allowOutsideClick: true,
            background: "none",
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        submitPost(route("admin.listings.update", listing.id), {
            onSuccess: () => {
                Swal.close();
                Swal.fire({
                    icon: "success",
                    title: "Listing updated successfully!",
                    timer: 2000,
                    showConfirmButton: true,
                }).then(() => {
                    window.location.href = "/admin/listings";
                });
            },
            onError: (errors) => {
                console.log(errors)
                let message = "Please, check the fields:\n";
                Object.keys(errors).forEach(i => {
                    if (i.includes('gallery')) {
                        message += `${i}: the image has exceeded the maximum size\n`;
                    } else {
                        message += `${i}: ${errors[i]}\n`;
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
                    ...errors
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
                <Head title="Edit Listing" />
                <SectionTitle h2="Edit" h3="Listing" />
                <section>
                    <form onSubmit={handleSubmit} encType="multipart/form-data">
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
                                                    value={input.value}
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
                                value={data.general_features}
                                defaultValue={data.general_features}
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
                                value={data.internal_features}
                                defaultValue={data.internal_features}
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
                                value={data.external_features}
                                defaultValue={data.external_features}
                                onChange={(e) => {
                                    const selectedOptions = e;
                                    const selectedValues = selectedOptions.map(option => option.value);
                                    setData('external_features', selectedValues);
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
                                value={data.amenities}
                                defaultValue={data.amenities}
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
                            <InputGroup
                                type="select"
                                label="Status"
                                id="listing_status"
                                name="listing_status"
                                options={statusData}
                                onChange={(e) => handleChange(e)}
                                value={data.listing_status}
                            />
                            <InputGroup
                                type="select"
                                label="Type"
                                id="listing_type"
                                name="listing_type"
                                options={typesData}
                                onChange={(e) => handleChange(e)}
                                value={data.listing_type}
                            />
                            <InputGroup
                                type="select"
                                label="Transaction Type"
                                id="transaction_type"
                                name="transaction_type"
                                options={transactionTypesData}
                                onChange={(e) => handleChange(e)}
                                value={data.transaction_type}
                            />
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
                                    Update
                                </button>
                            </div>
                        </fieldset>
                    </form>
                </section>
            </div>
        </LoadScript>
    );
}