import ImageCompare from "@/Components/ImageCompare";
import SectionTitle from "@/Components/SectionTitle";

export default function ConciergeService() {
    return (
        <section id="Concierge" className="Concierge">
            <SectionTitle h2="Concierge" h3="Service" color="darkness" />
            <div className="flex justify-between items-center flex-col-reverse md:flex-row">
                <article className="pt-8 md:p-0 w-full md:w-2/6">
                    <p className="text-bv-black text-lg md:text-xl xl:text-3xl">
                        Our Concierge service prepares your property for its launch on the market, identifying opportunities to increase its value and profitability, ensuring an effective sale.
                    </p>
                </article>
                <div className="w-full md:w-3/6 flex items-center justify-center">
                    <ImageCompare image1="img/imageCompare1.webp" image2="img/imageCompare2.webp" />
                </div>
            </div>
        </section>
    );
}