import { Head } from "@inertiajs/react";
import Listings from "./Sections/Listings";
import { useFilters } from "@/Contexts/FilterContext";

export default function Properties(data) {
    const { apiKey, listings: initialListings, pagination: initialPagination } = data.props;
    const { listings, pagination, updateFilters } = useFilters();

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
                listings={listings.length > 0 ? listings : initialListings}
                apiKey={apiKey}
                pagination={pagination.current_page ? pagination : initialPagination}
                onPageChange={handlePageChange}
            />
        </div>
    );
}