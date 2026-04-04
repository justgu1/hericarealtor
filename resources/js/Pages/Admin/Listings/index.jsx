import { Head, useForm, router } from "@inertiajs/react";
import styles from "/resources/css/admin.module.css";
import InputGroup from "@/Components/Form/InputGroup";
import Swal from "sweetalert2";
import withReactContent from 'sweetalert2-react-content';
import { IoSearchSharp } from "react-icons/io5";
import Table from "@/Components/Table";
import { MdEdit } from "react-icons/md";
import { FaEye } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { Component } from 'react';

// ErrorBoundary para capturar erros de renderização
class ErrorBoundary extends Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div>
                    <h1>Something went wrong.</h1>
                    <p>{this.state.error?.message}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

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

export default function Listings(listings) {
    const items = listings.props?.items || [];
    const pagination = listings.props?.pagination || { current_page: 1, last_page: 1 };
    const { data, setData, processing } = useForm({
        search: listings.props?.search || "",
    });

    const swal = withReactContent(Swal);

    const handleChangeSearch = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        swal.fire({
            allowOutsideClick: false,
            background: "none",
            showConfirmButton: false,
            didOpen: () => swal.showLoading(),
        });

        router.get(
            route("admin.listings.index"),
            { s: data.search, page: pagination.current_page },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    swal.fire({
                        icon: "success",
                        title: "Loaded listings successfully!",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
                onError: (errors) => {
                    swal.fire({
                        icon: "error",
                        title: "Failed to search",
                        text: Object.values(errors).join(", "),
                    });
                },
            }
        );
    };

    const columns = [
        {
            header: 'Thumbnail',
            accessor: 'thumbnail',
            render: (row) => (
                <img
                    src={row.thumbnail_url || '/img/default.jpg'}
                    alt="Thumbnail"
                    style={{ width: '3rem', height: '3rem', objectFit: 'cover' }}
                />
            ),
        },
        { header: 'Address', accessor: 'address' },
        { header: 'Square Footage', accessor: 'sqr_footage' },
        { header: 'Price', accessor: 'price' },
        { header: 'Status', accessor: 'status' },
        { header: 'Transaction Type', accessor: 'transaction_type' },
    ];

    const renderActions = (row) => {
        const handleShowMore = () => {
            swal.fire({
                title: 'Listing Details',
                html: `
                    <div class="listingModal">
                        ${row.thumbnail_url ? `<img src="${row.thumbnail_url}" alt="Thumbnail" style="width: 100px; height: 100px; object-fit: cover;margin: auto;" />` : '<img src="/img/default.jpg" alt="Thumbnail" style="width: 100px; height: 100px; object-fit: cover;margin: auto;" />'}
                        <p><strong>MLS:</strong> ${row.mls || 'N/A'}</p>
                        <p><strong>Address:</strong> ${row.address}</p>
                        <p><strong>Style:</strong> ${row.style || 'N/A'}</p>
                        <p><strong>Data Source:</strong> ${row.data_source || 'N/A'}</p>
                        <p><strong>Square Footage:</strong> ${row.sqr_footage}</p>
                        <p><strong>Price:</strong> ${formatCurrency(row.price) || 'N/A'}</p>
                        <p><strong>Tax:</strong> ${formatCurrency(row.tax) || 'N/A'}</p>
                        <p><strong>Bedrooms:</strong> ${row.bedrooms}</p>
                        <p><strong>Bathrooms:</strong> ${row.bathrooms}</p>
                        <p><strong>Half Bathrooms:</strong> ${row.half_bathrooms}</p>
                        <p><strong>Status:</strong> ${row.status_enum.name}</p>
                        <p><strong>Type:</strong> ${row.type_enum.name}</p>
                        <p><strong>Transaction Type:</strong> ${row.transaction_type_enum.name}</p>
                        <p><strong>Built Date:</strong> ${row.built_date || 'N/A'}</p>
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
                text: 'You will not be able to recover this listing!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
            }).then((result) => {
                if (result.isConfirmed) {
                    router.delete(route("admin.listings.destroy", row.id), {
                        preserveState: true,
                        onSuccess: () => {
                            swal.fire('Deleted!', 'Your listing has been deleted.', 'success');
                        },
                        onError: () => {
                            swal.fire('Error!', 'Failed to delete the listing.', 'error');
                        },
                    });
                }
            });
        };

        return (
            <div className="flex flex-col gap-2">
                <a href="#" onClick={handleShowMore}>
                    <FaEye className="inline-block" /> <span>Show More</span>
                </a>
                <a href={route("admin.listings.edit", row.id)}>
                    <MdEdit className="inline-block" /> <span>Edit</span>
                </a>
                <a href="#" onClick={handleDelete}>
                    <FaTrash className="inline-block" /> <span>Delete</span>
                </a>
            </div>
        );
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > pagination.last_page) return;

        router.get(
            route("admin.listings.index"),
            { page, s: data.search },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => { },
            }
        );
    };

    return (
        <ErrorBoundary>
            <div id="Listings" className={styles.Section}>
                <Head title="Listings" />
                <h3 className="py-8">Listings</h3>
                <section className={styles.PageActions}>
                    <nav>
                        <ul className="HorizontalList">
                            <li className="NavItemContainer">
                                <div className="NavItem">
                                    <a className="TextGradient" href={route("admin.listings.add")} data-content="New listing">
                                        New listing
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </nav>
                </section>
                <section className={styles.TableHead}>
                    <nav className={styles.StatusNav}>
                        <ul className={styles.StatusList}>
                            <li><span className="qty"></span>all</li>
                            <li><span className="qty"></span>publish</li>
                            <li><span className="qty"></span>sold</li>
                            <li><span className="qty"></span>draft</li>
                            <li><span className="qty"></span>bin</li>
                        </ul>
                    </nav>
                    <form onSubmit={handleSubmit} className={`${styles.SearchForm} SearchForm`}>
                        <InputGroup
                            id="search"
                            label="Search"
                            type="text"
                            placeholder="Search listing"
                            name="search"
                            value={data.search}
                            onChange={handleChangeSearch}
                            disabled={processing}
                        />
                        <button type="submit" className={`${styles.SearchSubmit} principal`} disabled={processing}>
                            <IoSearchSharp />
                        </button>
                    </form>
                </section>
                <section className={styles.TableSection}>
                    <Table
                        columns={columns}
                        data={items}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        renderActions={renderActions}
                    />
                </section>
            </div>
        </ErrorBoundary>
    );
}
