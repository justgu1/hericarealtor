import React from 'react';
import styles from "/resources/css/Table.module.css";
import Swal from "sweetalert2";
import withReactContent from 'sweetalert2-react-content';

const swal = withReactContent(Swal);

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
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

export default function Table({ columns, data, renderActions, pagination, onPageChange }) {
    if (!data || data.length === 0) {
        return <p>No data available</p>;
    }

    return (
        <div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((column, index) => (
                            <th key={index}>{column.header}</th>
                        ))}
                        {renderActions && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index}>
                            {columns.map((column, columnIndex) => (
                                <td key={columnIndex}>
                                    {column.accessor === "thumbnail" ? (
                                        <img
                                            src={row.thumbnail_url || "/img/default.jpg"}
                                            alt="Thumbnail"
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    ) : column.accessor === "categories" || column.accessor === "tags" ? (
                                        <div
                                            className="flex flex-wrap gap-2"
                                            dangerouslySetInnerHTML={{
                                                __html: Array.isArray(row[column.accessor])
                                                    ? row[column.accessor]
                                                        .map(
                                                            (item) =>
                                                                `<span class="tag bg-bv-black-200 text-white p-1 rounded">${item.name || item.label}</span>`
                                                        )
                                                        .join(" ")
                                                    : row[column.accessor],
                                            }}
                                        />
                                    ) : column.accessor === "created_at" ? (
                                        formatDate(row[column.accessor])
                                    ) : column.accessor === "price" || column.accessor === "tax" ? (
                                        formatCurrency(row[column.accessor])
                                    ) : column.accessor === "status" || column.accessor === "transaction_type" || column.accessor === "type" ? (
                                        // Aqui verifica se o valor de status_enum, transaction_type_enum ou type_enum está disponível
                                        row[`${column.accessor}_enum`] && row[`${column.accessor}_enum`].name
                                    ) : (
                                        row[column.accessor]
                                    )}
                                </td>
                            ))}
                            {renderActions && <td>{renderActions(row)}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>

            {pagination && pagination.total && (
                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={() => onPageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="secondary prev"
                    >
                        Previous
                    </button>
                    <span className="text-bv-black">
                        Page {pagination.current_page} of {pagination.last_page}
                    </span>
                    <button
                        onClick={() => onPageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        className="principal next"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}