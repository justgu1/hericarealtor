import ConciergeService from "@/Pages/Home/Sections/ConciergeService";
import LeadsForm from "../Home/Sections/LeadForm";
import HomeValuation from "./sections/HomeValuation";
import { Head } from "@inertiajs/react";
import FadeInWhenVisible from "@/Components/FadeInWhenVisible";
export default function Seller(backendProps) {
    const { apiKey, general_features, internal_features, external_features, amenities } = backendProps.props

    return (
        <div className="page grid grid-cols-12 overflow-hidden">
            <Head title="Seller" />
            <FadeInWhenVisible>
                <HomeValuation
                    apiKey={apiKey}
                    general_features={general_features}
                    internal_features={internal_features}
                    external_features={external_features}
                    amenities={amenities}
                />
            </FadeInWhenVisible>
            <FadeInWhenVisible>
                <ConciergeService />
            </FadeInWhenVisible>
            <FadeInWhenVisible>
                <LeadsForm />
            </FadeInWhenVisible>
        </div>
    )
}