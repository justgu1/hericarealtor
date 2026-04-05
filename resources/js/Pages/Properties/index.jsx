import { Head } from "@inertiajs/react";
import { useEffect } from "react";
import Listings from "./Sections/Listings";
import { useFilters } from "@/Contexts/FilterContext";

export default function Properties(data) {
    const { apiKey, listings: initialListings, pagination: initialPagination, filters: serverFilters } = data.props;
    const { listings, pagination, updateFilters, loading, hasFetched } = useFilters();

    useEffect(() => {
        if (serverFilters?.city || serverFilters?.search) {
            updateFilters({
                city: serverFilters.city || '',
                search: serverFilters.search || '',
            });
        }
    }, []);

    // After first fetch, always show context data (even if empty = filtered to 0)
    const displayListings = hasFetched ? listings : (listings.length > 0 ? listings : initialListings);
    const displayPagination = hasFetched ? pagination : (listings.length > 0 ? pagination : initialPagination);

    const handlePageChange = async (page) => {
        try {
            await updateFilters({ page });
        } catch (error) {
            console.error("Erro ao mudar de página:", error);
        }
    };

    return (
        <div className="page grid grid-cols-12 pt-16">
            <Head title="Properties" />
            <Listings
                listings={displayListings}
                apiKey={apiKey}
                pagination={displayPagination}
                onPageChange={handlePageChange}
                loading={loading}
            />
        </div>
    );
}
