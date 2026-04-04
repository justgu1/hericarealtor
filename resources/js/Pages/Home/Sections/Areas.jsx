import React from "react";

export default function Areas() {
    return (
        <section id="Areas" className="area-section">
            <div className="area-wrapper">
                {[
                    { name: "Boca Raton", label: "boca_raton", img: "/img/bocaraton.jpg" },
                    { name: "Delray Beach", label: "delray_beach", img: "/img/delraybeach.jpg" },
                    { name: "Fort Lauderdale", label: "fort_lauderdale", img: "/img/fortlauderdale.jpg" },
                    { name: "Palm Beach ", label: "palm_beach ", img: "/img/westpalm.jpg" },
                    { name: "Miami", label: "miami", img: "/img/miami.jpg" },
                ].map((area, index) => (
                    <a
                        key={index}
                        href={route("properties", {city: area.label})}
                        className={`area-item area-item-${index + 1} group ${
                            index === 4 ? "z-10" : ""
                        }`}
                    >
                        <img src={area.img} alt={area.name} className="area-image" />
                        <div className="area-overlay" />
                        <div className="area-content">
                            <div className="area-inner">
                                <h2 className="area-title">{area.name}</h2>
                                <span className="area-button">See Properties</span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
