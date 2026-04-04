import SectionTitle from "@/Components/SectionTitle";
import { useEffect, useState } from "react";

export default function ConciergeService() {
    const [h2, setH2] = useState(window.innerWidth < 768 ? "Our" : "Why list with me?");
    const [h3, setH3] = useState(window.innerWidth < 768 ? "Numbers" : "Our Numbers");

    useEffect(() => {
        const handleResize = () => {
            setH2(window.innerWidth < 768 ? "Our" : "Why list with me?");
            setH3(window.innerWidth < 768 ? "Numbers" : "Our Numbers");
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <section id="Ournumbers" className="OurNumbers">
            <div className="overlay"></div> {/* Overlay movido para baixo */}

            <div className="content">
                <SectionTitle h2={h2} h3={h3} color="brightness" />

                <div className="our-numbers-content">
                    {[
                        { number: "100", text: "Sales Volume" },
                        { number: "100", text: "Dreams Delivered" },
                        { number: "100", text: "Happy Families" },
                        { number: "100", text: "Posts For You" },
                    ].map((item, index) => (
                        <div key={index} className="relative flex flex-col items-center">
                            <p className="text-5xl font-bold">{item.number}</p>
                            <p className="text-lg">{item.text}</p>
                            {index !== 3 && <div className="our-numbers-separator"></div>}
                        </div>
                    ))}
                </div>
            </div>
        </section>



    );
}
