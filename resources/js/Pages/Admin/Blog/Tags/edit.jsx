import { Head, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import styles from "/resources/css/admin.module.css";
import SectionTitle from "@/Components/SectionTitle";
import InputGroup from "@/Components/Form/InputGroup";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export default function Edit(backendProps) {
    const tag = backendProps.props.tag

    const { data, setData, put, processing, errors, reset } = useForm({
        name: tag.name
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

        put(route("admin.blog.tags.update", tag.id), {
            onSuccess: () => {
                swal.close();
                swal.fire({
                    icon: "success",
                    title: "tag updated!",
                    timer: 2000,
                    showConfirmButton: true,
                }).then(() => {
                    window.location.href = route('admin.blog.tags.index');
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
        <div id="AddBlogtag" className={styles.Section}>
            <Head title="Add Blog tag" />
            <SectionTitle h2="New" h3="tag" />
            <section>
                <form onSubmit={handleSubmit}>
                    <fieldset>
                        <legend>Basic Information</legend>
                        <InputGroup
                            type="text"
                            placeholder="tag name (slug auto define)"
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
                                Save tag
                            </button>
                        </div>
                    </fieldset>
                </form>
            </section>
        </div>
    );
}