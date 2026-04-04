import { Head, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import styles from "/resources/css/admin.module.css";
import SectionTitle from "@/Components/SectionTitle";
import InputGroup from "@/Components/Form/InputGroup";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export default function Edit(backendProps) {
    const review = backendProps.props.review

    const { data, setData, put, processing, errors, reset } = useForm({
        title: review.title,
        content: review.content,
        author: review.author,
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

        put(route("admin.reviews.update", review.id), {
            onSuccess: () => {
                swal.close();
                swal.fire({
                    icon: "success",
                    title: "review updated!",
                    timer: 2000,
                    showConfirmButton: true,
                }).then(() => {
                    window.location.href = route('admin.reviews.index');
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
        <div id="AddBlogreview" className={styles.Section}>
            <Head title="Add Blog review" />
            <SectionTitle h2="New" h3="review" />
            <section>
                <form onSubmit={handleSubmit}>
                    <fieldset>
                        <legend>Basic Information</legend>
                        <InputGroup
                            type="text"
                            placeholder="review title "
                            label="title"
                            id="title"
                            name="title"
                            required
                            value={data.title}
                            maxLength={255}
                            onChange={(e) => setData('title', e.target.value)}
                            error={errors.title}
                        />
                        <p className="error">{localErrors?.title}</p>
                        <InputGroup
                            type="textarea"
                            placeholder="review content "
                            label="content"
                            id="content"
                            name="content"
                            required
                            value={data.content}
                            maxLength={255}
                            onChange={(e) => setData('content', e.target.value)}
                            error={errors.content}
                        />
                        <p className="error">{localErrors?.content}</p>
                        <InputGroup
                            type="text"
                            placeholder="review author "
                            label="author"
                            id="author"
                            name="author"
                            required
                            value={data.author}
                            maxLength={255}
                            onChange={(e) => setData('author', e.target.value)}
                            error={errors.author}
                        />
                        <p className="error">{localErrors?.author}</p>
                    </fieldset>

                    <fieldset className={styles.Rightcolumn}>
                        <div>
                            <button type="submit" className="principal" disabled={processing}>
                                Save review
                            </button>
                        </div>
                    </fieldset>
                </form>
            </section>
        </div>
    );
}