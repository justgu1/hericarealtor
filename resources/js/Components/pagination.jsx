import React from 'react';

export default function Pagination({ filters, currentPage, lastPage, onPageChange }) {
    const handlePageChange = async (page) => {
        // Previne a navegação inválida para páginas fora do intervalo
        if (page < 1 || page > lastPage) return;

        try {
            // Chama a função onPageChange passada do componente pai (Properties)
            onPageChange(page);
        } catch (error) {
            console.error('Erro ao carregar a página:', error);
        }
    };

    return (
        <div className="pagination">
            {/* Botão de "Prev" */}
            <a
                href="#"
                className={`page-btn ${currentPage === 1 ? "disabled" : ""}`}
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
            >
                Prev
            </a>

            {/* Renderiza os números das páginas */}
            {Array.from({ length: lastPage }).map((_, index) => {
                const page = index + 1;
                return (
                    <a
                        key={page}
                        href="#"
                        className={`page-btn ${currentPage === page ? "active" : ""}`}
                        onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                    >
                        {page}
                    </a>
                );
            })}

            {/* Botão de "Next" */}
            <a
                href="#"
                className={`page-btn ${currentPage === lastPage ? "disabled" : ""}`}
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
            >
                Next
            </a>
        </div>
    );
}
