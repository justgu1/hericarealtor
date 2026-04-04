import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const FilterContext = createContext();

export const useFilters = () => {
    return useContext(FilterContext);
};

export const FilterProvider = ({ children, initialListings = [], initialPagination = {} }) => {
    const [filters, setFilters] = useState({
        search: '',
        min_sqr_footage: 0,
        max_sqr_footage: 100000000,
        bedrooms: 0,
        bathrooms: 0,
        half_bathrooms: 0,
        min_price: 0,
        max_price: 100000000,
        status: [],
        type: [],
        transactionType: [],
        amenities: [],
        general_features: [],
        internal_features: [],
        external_features: [],
        page: initialPagination.current_page || 1,
    });
    const [listings, setListings] = useState(initialListings);
    const [pagination, setPagination] = useState({
        current_page: initialPagination.current_page || 1,
        last_page: initialPagination.last_page || 1,
        total: initialPagination.total || 0,
        per_page: initialPagination.per_page || 10,
    });

    const updateFilters = async (newFilters) => {
        const updatedFilters = {
            ...filters,
            ...newFilters,
            page: newFilters.page || 1,
        };
        setFilters(updatedFilters);

        try {
            const { data } = await axios.get(route('getProperties'), {
                params: {
                    search: updatedFilters.search,
                    min_sqr_footage: updatedFilters.min_sqr_footage,
                    max_sqr_footage: updatedFilters.max_sqr_footage,
                    bedrooms: updatedFilters.bedrooms,
                    bathrooms: updatedFilters.bathrooms,
                    half_bathrooms: updatedFilters.half_bathrooms,
                    min_price: updatedFilters.min_price,
                    max_price: updatedFilters.max_price,
                    status: updatedFilters.status.join(','),
                    type: updatedFilters.type.join(','),
                    transactionType: updatedFilters.transactionType.join(','),
                    amenities: updatedFilters.amenities.join(','),
                    general_features: updatedFilters.general_features.join(','),
                    internal_features: updatedFilters.internal_features.join(','),
                    external_features: updatedFilters.external_features.join(','),
                    page: updatedFilters.page,
                },
            });
            setListings(data.data);
            setPagination(data.pagination);
            return data;
        } catch (error) {
            console.error('Erro ao buscar listings:', error);
            throw error;
        }
    };

    // Carregar listagens iniciais se não houver filtros aplicados
    useEffect(() => {
        if (listings.length === 0 && initialListings.length === 0) {
            updateFilters({});
        }
    }, []);

    return (
        <FilterContext.Provider value={{ filters, updateFilters, listings, pagination }}>
            {children}
        </FilterContext.Provider>
    );
};
