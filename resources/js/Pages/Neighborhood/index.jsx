import LeadsForm from "../Home/Sections/LeadForm";
import SectionTitle from "@/Components/SectionTitle";
import NeighborhoodCarrousel from "./Sections/NeighborhoodCarrousel";
import { Head } from "@inertiajs/react";
export default function Neighborhood() {
    return (
        <div className="page grid grid-cols-12">
            <Head title="Neighborhood" />
            <section id="Neighborhood">
                <SectionTitle h2="Neighborhood" h3="Guide" color="darkness" />
                <NeighborhoodCarrousel />
            </section>
            <LeadsForm />
        </div>
    )
}