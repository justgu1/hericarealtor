import { Head, useForm, router } from "@inertiajs/react";
import styles from "/resources/css/admin.module.css";
import InputGroup from "@/Components/Form/InputGroup";
import Swal from "sweetalert2";
import withReactContent from 'sweetalert2-react-content';
import { IoSearchSharp } from "react-icons/io5";
import Table from "@/Components/Table";
import { MdEdit } from "react-icons/md";
import { FaEye, FaTrash } from "react-icons/fa";

export default function tags({ props }) {
    const tags = props.tags.items || [];
    const pagination = props.tags.pagination || {};
    const { data, setData, tag, processing, errors, reset } = useForm({
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

        router.get(route("admin.blog.tags.index", { s: data.search }), {
            onSuccess: () => {
                swal.fire({
                    icon: "success",
                    title: "tags loaded successfully!",
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
        { header: 'name', accessor: 'name' },
        { header: 'Slug', accessor: 'slug' },
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

        const handleDelete = (e) => {
            e.preventDefault();

            swal.fire({
                title: 'Are you sure?',
                text: 'You will not be able to recover this tag!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
            }).then((result) => {
                if (result.isConfirmed) {
                    router.delete(route(`admin.blog.tags.destroy`, row.id), {
                        onSuccess: () => {
                            swal.fire(
                                'Deleted!',
                                'Your tag has been deleted.',
                                'success'
                            );
                        },
                        onError: () => {
                            swal.fire(
                                'Error!',
                                'Failed to delete the tag.',
                                'error'
                            );
                        },
                    });
                }
            });
        };

        return (
            <div className="flex flex-col gap-2">
                <a href={route(`admin.blog.tags.edit`, row.id)}>
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

        router.get(route("admin.blog.tags.index", { page: page }), {
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
                                <a className="TextGradient" href={route(`admin.blog.tags.add`)} data-content={"New tag"}>
                                    New tag
                                </a>
                            </div>
                        </li>
                    </ul>
                </nav>
            </section>
            <section className={styles.TableHead}>
                <form onSubmit={handleSubmit} className={`${styles.SearchForm} SearchForm`}>
                    <InputGroup id="search" label="Search" type="text" placeholder="Search tags" name="search" onChange={handleChangeSearch} />
                    <button type='submit' className={`${styles.SearchSubmit} principal`}><IoSearchSharp /></button>
                </form>
            </section>
            <section className={styles.TableSection}>
                <Table
                    columns={columns}
                    data={tags}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    renderActions={renderActions}
                />
            </section>
        </div>
    );
}
