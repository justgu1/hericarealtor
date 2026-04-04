import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import styles from '/resources/css/admin.module.css';
import InputGroup from '@/Components/Form/InputGroup';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { IoSearchSharp } from 'react-icons/io5';
import Table from '@/Components/Table';
import { MdEdit } from 'react-icons/md';
import { FaTrash } from 'react-icons/fa';

export default function Features({ props: { features, type } }) {
    const { data, setData, processing } = useForm({
        search: '',
    });

    const [activeTab, setActiveTab] = useState(type || 'general');

    const swal = withReactContent(Swal);

    const handleTabChange = (tab) => {
        setActiveTab(tab);

        swal.fire({
            allowOutsideClick: false,
            background: 'transparent',
            showConfirmButton: false,
            didOpen: () => {
                swal.showLoading();
            },
        });

        router.get(
            route('admin.listings.features.index', { type: tab }),
            { s: data.search },
            {
                preserveState: true,
                onSuccess: () => {
                    swal.close();
                },
                onError: () => {
                    swal.close();
                },
            }
        );
    };

    const handleChangeSearch = (e) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        swal.fire({
            allowOutsideClick: false,
            background: 'none',
            showConfirmButton: false,
            didOpen: () => {
                swal.showLoading();
            },
        });

        router.get(
            route('admin.listings.features.index', { type: activeTab, s: data.search }),
            {
                onSuccess: () => {
                    swal.fire({
                        icon: 'success',
                        title: 'Features loaded successfully!',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
                onError: (errors) => {
                    swal.fire({
                        icon: 'error',
                        title: 'Failed to search',
                        text: errors.message || 'An error occurred',
                    });
                },
            }
        );
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
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
                text: 'You will not be able to recover this feature!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
            }).then((result) => {
                if (result.isConfirmed) {
                    router.delete(
                        route('admin.listings.features.destroy', { id: row.id, type: activeTab }),
                        {
                            onSuccess: () => {
                                swal.fire('Deleted!', 'Feature has been deleted.', 'success');
                            },
                            onError: () => {
                                swal.fire('Error!', 'Failed to delete the feature.', 'error');
                            },
                        }
                    );
                }
            });
        };

        return (
            <div className="flex flex-col gap-2">
                <a href={route('admin.listings.features.edit', { id: row.id, type: activeTab })}>
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
        if (page < 1 || page > features.pagination.last_page) return;
        router.get(
            route('admin.listings.features.index', { type: activeTab, page, s: data.search }),
            {
                preserveState: true,
            }
        );
    };

    return (
        <div id="Features" className={styles.Section}>
            <Head title="Features" />
            <h3 className="py-8">Features</h3>
            <section className={styles.PageActions}>
                <nav>
                    <ul className="HorizontalList">
                        <li className="NavItemContainer">
                            <div className="NavItem">
                                <a
                                    className="TextGradient"
                                    href={route('admin.listings.features.add', { type: activeTab })}
                                    data-content="New feature"
                                >
                                    New feature
                                </a>
                            </div>
                        </li>
                    </ul>
                </nav>
            </section>
            <section className={styles.Tabs}>
                <ul className="HorizontalList">
                    <li>
                        <button
                            className={activeTab === 'general' ? styles.ActiveTab : ''}
                            onClick={() => handleTabChange('general')}
                        >
                            General
                        </button>
                    </li>
                    <li>
                        <button
                            className={activeTab === 'internal' ? styles.ActiveTab : ''}
                            onClick={() => handleTabChange('internal')}
                        >
                            Internal
                        </button>
                    </li>
                    <li>
                        <button
                            className={activeTab === 'external' ? styles.ActiveTab : ''}
                            onClick={() => handleTabChange('external')}
                        >
                            External
                        </button>
                    </li>
                </ul>
            </section>
            <section className={styles.TableHead}>
                <form onSubmit={handleSubmit} className={`${styles.SearchForm} SearchForm`}>
                    <InputGroup
                        id="search"
                        label="Search"
                        type="text"
                        placeholder={`Search ${activeTab} features`}
                        name="search"
                        onChange={handleChangeSearch}
                        value={data.search}
                    />
                    <button type="submit" className={`${styles.SearchSubmit} principal`} disabled={processing}>
                        <IoSearchSharp />
                    </button>
                </form>
            </section>
            <section className={styles.TableSection}>
                <Table
                    columns={columns}
                    data={features.items}
                    pagination={features.pagination}
                    onPageChange={handlePageChange}
                    renderActions={renderActions}
                />
            </section>
        </div>
    );
}
