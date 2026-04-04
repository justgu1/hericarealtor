import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import styles from '/resources/css/admin.module.css';
import InputGroup from '@/Components/Form/InputGroup';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { IoSearchSharp } from 'react-icons/io5';
import Table from '@/Components/Table';
import { FaEye } from 'react-icons/fa';

export default function Leads({ props: { leads } }) {
    const { data, setData, processing } = useForm({
        search: '',
    });

    const swal = withReactContent(Swal);

    const handleChangeSearch = (e) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        swal.fire({
            allowOutsideClick: false,
            background: 'transparent',
            showConfirmButton: false,
            didOpen: () => {
                swal.showLoading();
            },
        });

        router.get(
            route('admin.leads.index', { s: data.search }),
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

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        { header: 'Form', accessor: 'form' },
        { header: 'Created At', accessor: 'created_at' },
    ];

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const formatAttributeValue = (value) => {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return `
                    <ul style="margin: 0; padding-left: 20px;">
                        ${parsed.map((item) => `<li>${item}</li>`).join('')}
                    </ul>
                `;
            }
            return value;
        } catch (e) {
            return value; // Return as-is if not JSON
        }
    };

    const renderActions = (row) => {
        const handleView = (e) => {
            e.preventDefault();
            swal.fire({
                title: 'Lead Details',
                html: `
                    <div style="text-align: left;">
                        <p><strong>Name:</strong> ${row.name}</p>
                        <p><strong>Email:</strong> ${row.email}</p>
                        <p><strong>Form:</strong> ${row.form}</p>
                        <p><strong>Message:</strong> ${row.message}</p>
                        <p><strong>Created At:</strong> ${formatDate(row.created_at)}</p>
                        <h2 style="margin-top: 20px; font-size:1rem;">Attributes:</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #D3CAC2;">
                            <thead>
                                <tr>
                                    <th style="padding: 12px; background-color: #F7D9A6; border: 1px solid #D3CAC2; text-align: left; color:black;">Attribute</th>
                                    <th style="padding: 12px; background-color: #F7D9A6; border: 1px solid #D3CAC2; text-align: left; color:black;">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    row.attributes && row.attributes.length > 0
                                        ? row.attributes
                                              .map(
                                                  (attr) => `
                                                    <tr>
                                                        <td style="padding: 12px; border: 1px solid #D3CAC2;">${attr.label}</td>
                                                        <td style="padding: 12px; border: 1px solid #D3CAC2;">${formatAttributeValue(
                                                            attr.value
                                                        )}</td>
                                                    </tr>
                                                  `
                                              )
                                              .join('')
                                        : '<tr><td colspan="2" style="padding: 12px; border: 1px solid #D3CAC2; text-align: center;">No attributes available</td></tr>'
                                }
                            </tbody>
                        </table>
                    </div>
                `,
                showConfirmButton: true,
                confirmButtonText: 'Close',
                customClass: {
                    popup: 'lead-modal',
                },
            });
        };

        return (
            <div className="flex flex-col gap-2">
                <a href="#" onClick={handleView}>
                    <FaEye className="inline-block" />
                    <span>View</span>
                </a>
            </div>
        );
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > leads.pagination.last_page) return;
        router.get(
            route('admin.leads.index', { page, s: data.search }),
            {
                preserveState: true,
            }
        );
    };

    return (
        <div id="Leads" className={styles.Section}>
            <Head title="Leads" />
            <h3 className="py-8">Leads</h3>
            <section className={styles.TableHead}>
                <form onSubmit={handleSubmit} className={`${styles.SearchForm} SearchForm`}>
                    <InputGroup
                        id="search"
                        label="Search"
                        type="text"
                        placeholder="Search leads by name or email"
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
                    data={leads.items}
                    pagination={leads.pagination}
                    onPageChange={handlePageChange}
                    renderActions={renderActions}
                />
            </section>
        </div>
    );
}
