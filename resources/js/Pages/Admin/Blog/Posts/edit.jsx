import { Head, useForm, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import styles from "/resources/css/admin.module.css";
import SectionTitle from "@/Components/SectionTitle";
import InputGroup from "@/Components/Form/InputGroup";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function Edit(backendProps) {
    const { post, categories, tags } = backendProps.props;
    const { data, setData, post: submitPost, processing, errors } = useForm({
        title: post.title || "",
        content: post.content || "",
        categories: post.categories.map((category) => {
            return {
                value: category.name,
                label: category.name,
            }
        }) || [],
        tags: post.tags.map((tag) => {
            return {
                value: tag.name,
                label: tag.name,
            }
        }) || [],
        thumbnail: null,
    });
    const [thumbnailPreview, setThumbnailPreview] = useState(
        post.thumbnail_url || null
    );
    const [localErrors, setLocalErrors] = useState({});

    const swal = withReactContent(Swal);

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
        setData("errors", { ...errors, thumbnail: null });
    };

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

        submitPost(route("admin.blog.posts.update", post.id), {
            onSuccess: () => {
                swal.close();
                swal
                    .fire({
                        icon: "success",
                        title: "Post updated successfully!",
                        timer: 2000,
                        showConfirmButton: true,
                    })
                    .then(() => {
                        window.location.href = route("admin.blog.posts.index");
                    });
            },
            onError: (errors) => {
                swal.close();
                swal.fire({
                    icon: "error",
                    title: "Something went wrong",
                    text: errors.message || "Please check your form data and try again.",
                });
            },
        });
    };

    return (
        <div id="EditBlogPost" className={styles.Section}>
            <Head title="Edit Blog Post" />
            <SectionTitle h2="Edit" h3="Post" />
            <section>
                <form onSubmit={handleSubmit}>
                    <fieldset>
                        <legend>Basic Information</legend>
                        <InputGroup
                            type="text"
                            placeholder="Title"
                            label="Title"
                            id="title"
                            name="title"
                            required
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            error={errors.title}
                        />
                        <p className="error">{localErrors?.title}</p>
                        <InputGroup
                            type="textarea"
                            placeholder="Content"
                            label="Content"
                            id="content"
                            name="content"
                            required
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            error={errors.content}
                        />
                        <p className="error">{localErrors?.content}</p>
                    </fieldset>

                    <fieldset>
                        <legend>Category & Tags</legend>
                        <InputGroup
                            type="multiselect"
                            label="Categories"
                            id="categories"
                            name="categories"
                            required
                            options={categories}
                            value={data.categories}
                            defaultValue={data.categories}
                            onChange={(e) => {
                                const selectedOptions = e;
                                const selectedValues = selectedOptions.map(option => option.value);
                                setData('categories', selectedValues);
                                setLocalErrors((prevErrors) => ({
                                    ...prevErrors,
                                    categories: selectedValues.length > 0 ? '' : 'At least 1 category is required'
                                }));
                            }}
                            error={errors.categories}
                        />
                        <p className="error">{localErrors?.categories}</p>
                        <InputGroup
                            type="multiselect"
                            label="Tags"
                            id="tags"
                            name="tags"
                            options={tags}
                            value={data.tags}
                            defaultValue={data.tags}
                            onChange={(e) => {
                                const selectedOptions = e;
                                const selectedValues = selectedOptions.map(option => option.value);
                                setData('tags', selectedValues);
                            }}
                            error={errors.tags}
                        />
                        <p className="error">{localErrors?.tags}</p>
                    </fieldset>

                    <fieldset>
                        <legend>Thumbnail</legend>
                        <InputGroup
                            type="file"
                            label="Thumbnail"
                            id="thumbnail"
                            name="thumbnail"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            error={errors.thumbnail}
                        />
                        <p className="error">{localErrors.thumbnail}</p>
                    </fieldset>

                    <fieldset className={styles.Rightcolumn}>
                        <legend>Thumbnail Preview</legend>
                        {thumbnailPreview && (
                            <div className={styles.ThumbnailPreview}>
                                <p>Thumbnail Preview:</p>
                                <img src={thumbnailPreview} alt="Thumbnail Preview" className={styles.PreviewImage} />
                            </div>
                        )}
                    </fieldset>

                    <fieldset className={styles.Rightcolumn}>
                        <div>
                            <button type="submit" className="principal" disabled={processing}>
                                Save Post
                            </button>
                        </div>
                    </fieldset>
                </form>
            </section>
        </div>
    );
}
