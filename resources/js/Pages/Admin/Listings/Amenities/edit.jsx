import { Head, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import styles from "/resources/css/admin.module.css";
import SectionTitle from "@/Components/SectionTitle";
import InputGroup from "@/Components/Form/InputGroup";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export default function Edit({ props }) {
    const amenity = props.amenity;

    const { data, setData, put, processing, errors, reset } = useForm({
        name: amenity.name
    });

    const [localErrors, setLocalErrors] = useState({});

    const swal = withReactContent(Swal);

    const handleSubmit = (e) => {
        e.preventDefault();

        swal.fire({
            allowOutsideClick: true,
            background: "none",
            showConfirmButton: false,
            didOpen: () => {
                swal.showLoading();
            },
        });

        put(route("admin.listings.amenities.update", amenity.id), {
            onSuccess: () => {
                swal.close();
                swal.fire({
                    icon: "success",
                    title: "amenity updated!",
                    timer: 2000,
                    showConfirmButton: true,
                }).then(() => {
                    window.location.href = route('admin.listings.amenities.index');
                });
            },
            onError: (errors) => {
                swal.close();
                swal.fire({
                    icon: "error",
                    title: "Something went wrong",
                    text: 'verify fields',
                });
                setLocalErrors((prevErrors) => ({
                    ...prevErrors,
                    errors
                }));
            },
        });
    };

    return (
        <div id="EditAmenity" className={styles.Section}>
            <Head title="Edit Amenity" />
            <SectionTitle h2="Edit" h3="amenity" />
            <section>
                <form onSubmit={handleSubmit}>
                    <fieldset>
                        <legend>Basic Information</legend>
                        <InputGroup
                            type="text"
                            placeholder="amenity name (slug auto define)"
                            label="name"
                            id="name"
                            name="name"
                            required
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                        />
                        <p className="error">{localErrors?.name}</p>
                    </fieldset>

                    <fieldset className={styles.Rightcolumn}>
                        <div>
                            <button type="submit" className="principal" disabled={processing}>
                                Save amenity
                            </button>
                        </div>
                    </fieldset>
                </form>
            </section>
        </div>
    );
}