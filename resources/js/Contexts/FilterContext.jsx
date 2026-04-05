import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

const FilterContext = createContext();

export const useFilters = () => {
    return useContext(FilterContext);
};

const DEFAULT_FILTERS = {
    search: '',
    city: '',
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
    orderBy: '',
    page: 1,
};

export const FilterProvider = ({ children, initialListings = [], initialPagination = {} }) => {
    const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, page: initialPagination.current_page || 1 });
    const [listings, setListings] = useState(initialListings);
    const [pagination, setPagination] = useState({
        current_page: initialPagination.current_page || 1,
        last_page: initialPagination.last_page || 1,
        total: initialPagination.total || 0,
        per_page: initialPagination.per_page || 10,
    });
    const [loading, setLoading] = useState(false);
    // null = never fetched, false = fetched, true = fetched with results
    const hasFetchedRef = useRef(false);

    const filtersRef = useRef(filters);

    const fetchListings = useCallback(async (params) => {
        setLoading(true);
        try {
            const { data } = await axios.get('/getProperties', {
                params: {
                    search: params.search,
                    city: params.city,
                    min_sqr_footage: params.min_sqr_footage,
                    max_sqr_footage: params.max_sqr_footage,
                    bedrooms: params.bedrooms,
                    bathrooms: params.bathrooms,
                    half_bathrooms: params.half_bathrooms,
                    min_price: params.min_price,
                    max_price: params.max_price,
                    status: (params.status || []).join(','),
                    type: (params.type || []).join(','),
                    transactionType: (params.transactionType || []).join(','),
                    amenities: (params.amenities || []).join(','),
                    general_features: (params.general_features || []).join(','),
                    internal_features: (params.internal_features || []).join(','),
                    external_features: (params.external_features || []).join(','),
                    orderBy: params.orderBy,
                    page: params.page,
                },
            });
            hasFetchedRef.current = true;
            setListings(data.data ?? []);
            setPagination(data.pagination ?? pagination);
            return data;
        } catch (error) {
            console.error('[FilterContext] fetchListings error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateFilters = useCallback(async (newFilters) => {
        const updatedFilters = {
            ...filtersRef.current,
            ...newFilters,
            page: newFilters.page !== undefined ? newFilters.page : 1,
        };
        filtersRef.current = updatedFilters;
        setFilters(updatedFilters);
        return fetchListings(updatedFilters);
    }, [fetchListings]);

    useEffect(() => {
        if (listings.length === 0 && initialListings.length === 0) {
            fetchListings(filtersRef.current);
        }
    }, []);

    return (
        <FilterContext.Provider value={{ filters, updateFilters, listings, pagination, loading, hasFetched: hasFetchedRef.current }}>
            {children}
        </FilterContext.Provider>
    );
};
