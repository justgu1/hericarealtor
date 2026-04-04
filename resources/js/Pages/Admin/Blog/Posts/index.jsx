import { Head, useForm, router } from "@inertiajs/react";
import styles from "/resources/css/admin.module.css";
import InputGroup from "@/Components/Form/InputGroup";
import Swal from "sweetalert2";
import withReactContent from 'sweetalert2-react-content';
import { IoSearchSharp } from "react-icons/io5";
import Table from "@/Components/Table";
import { MdEdit } from "react-icons/md";
import { FaEye, FaTrash } from "react-icons/fa";

export default function Blog({ props }) {
    const posts = props.posts.items || [];
    const pagination = props.posts.pagination || {};
    const { data, setData, post, processing, errors, reset } = useForm({
        search: ""
    });

    const swal = withReactContent(Swal);

    const handleChangeSearch = (e) => {
        const { name, value } = e.target;
        setData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        swal.fire({
            allowOutsideClick: false,
            background: "none",
            showConfirmButton: false,
            didOpen: () => {
                swal.showLoading();
            },
        });

        router.get(route("admin.blog.posts.index", { s: data.search }), {
            onSuccess: () => {
                swal.fire({
                    icon: "success",
                    title: "Posts loaded successfully!",
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => {
                    swal.close();
                });
            },
            onError: (errors) => {
                swal.fire({
                    icon: "error",
                    title: "Failed to search",
                    text: errors,
                });
            },
        });
    };

    const columns = [
        { header: 'Title', accessor: 'title' },
        { header: 'Categories', accessor: 'categories' },
        { header: 'Tags', accessor: 'tags' },
        { header: 'Status', accessor: 'status' },
        { header: 'Created At', accessor: 'created_at' },
    ];

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();

        return `${month}/${day}/${year}`;
    };

    const renderActions = (row) => {
        const handleShowMore = () => {
            const formattedDate = formatDate(row.created_at);

            const imageUrl = row.thumbnail_url || null;

            const thumbnailHtml = imageUrl
                ? `<img src="${imageUrl}" alt="Thumbnail" class="thumbnail w-auto m-auto h-32 rounded mb-4" />`
                : '';
            swal.fire({
                title: 'Post Details',
                html: `
                    <div class="postModal">
                        ${thumbnailHtml}  <!-- Thumbnail no topo -->
                        <p><strong>Title:</strong> ${row.title}</p>
                        <p><strong>Categories:</strong>` + row.categories + `</p>
                        <p><strong>Tags:</strong>` + row.tags + `</p>
                        <p><strong>Status:</strong> ${row.status}</p>
                        <p><strong>Created At:</strong> ${formattedDate}</p>
                        <h3>Content</h3>
                        <div class="px-8 overflow-y-scroll h-64 w-full">`+ row.content + `</div>
                    </div>
                `,
                showConfirmButton: false,
                showCloseButton: true,
            });
        };



        const handleDelete = (e) => {
            e.preventDefault();

            swal.fire({
                title: 'Are you sure?',
                text: 'You will not be able to recover this post!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
            }).then((result) => {
                if (result.isConfirmed) {
                    router.delete(route(`admin.blog.posts.destroy`, row.id), {
                        onSuccess: () => {
                            swal.fire(
                                'Deleted!',
                                'Your post has been deleted.',
                                'success'
                            );
                        },
                        onError: () => {
                            swal.fire(
                                'Error!',
                                'Failed to delete the post.',
                                'error'
                            );
                        },
                    });
                }
            });
        };

        return (
            <div className="flex flex-col gap-2">
                <a href="#" onClick={handleShowMore}>
                    <FaEye className="inline-block" />
                    <span>Show More</span>
                </a>

                <a href={route(`admin.blog.posts.edit`, row.id)}>
                    <MdEdit className="inline-block" />
                    <span>Edit</span>
                </a>

                <a href="#" onClick={handleDelete}>
                    <FaTrash className="inline-block" />
                    <span>Delete</span>
                </a>
            </div>
        );
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > pagination.last_page) return;

        router.get(route("admin.blog.posts.index", { page: page }), {
            onSuccess: () => {

            },
        });
    };

    return (
        <div id="Blog" className={styles.Section}>
            <Head title="Blog" />
            <h3 className="py-8">Blog</h3>
            <section className={styles.PageActions}>
                <nav>
                    <ul className="HorizontalList">
                        <li className="NavItemContainer">
                            <div className="NavItem">
                                <a className="TextGradient" href={route(`admin.blog.posts.add`)} data-content={"New Post"}>
                                    New Post
                                </a>
                            </div>
                        </li>
                    </ul>
                </nav>
            </section>
            <section className={styles.TableHead}>
                <form onSubmit={handleSubmit} className={`${styles.SearchForm} SearchForm`}>
                    <InputGroup id="search" label="Search" type="text" placeholder="Search posts" name="search" onChange={handleChangeSearch} />
                    <button type='submit' className={`${styles.SearchSubmit} principal`}><IoSearchSharp /></button>
                </form>
            </section>
            <section className={styles.TableSection}>
                <Table
                    columns={columns}
                    data={posts.map(post => ({
                        ...post,
                        categories: post.categories.map(category =>
                            `<span class="tag bg-bv-black-200 text-white p-1 rounded py-1 px-2">${category.name}</span>`
                        ).join(' '),
                        tags: post.tags.map(tag =>
                            `<span class="tag bg-bv-black-200 text-white p-1 rounded py-1 px-2">${tag.name}</span>`
                        ).join(' '),
                    }))}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    renderActions={renderActions}
                />
            </section>
        </div>
    );
}
