import ClockWiseCarousel from "@/Components/ClockWiseCarousel";
import styles from "/resources/css/home.module.css";
import SectionTitle from "@/Components/SectionTitle";

export default function FeaturedListings({ listings, listingTypes }) {
    return (
        <section id="FeaturedListings" className={styles.FeaturedListings}>
            <SectionTitle h2="Featured" h3="Listings" color="darkness" />
                <ClockWiseCarousel listings={listings} />
        </section>
    );
}