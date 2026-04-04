export default function UtilsLinksSection() {
    return (
        <section id="UtilsLinksSection" className="UtilsLinksSection">
            <div className="utilLinks">
                <a href={route("contact")}>
                    <div className="utilLink list-with-me">
                        <div className="overlay"></div>
                        <p>List With Me</p>
                    </div>
                </a>
                <a href={route("properties")}>
                    <div className="utilLink properties">
                        <div className="overlay"></div>
                        <p>Properties</p>
                    </div>
                </a>
                <a href={route("neighborhood")}>
                    <div className="utilLink neighborhood-guides">
                        <div className="overlay"></div>
                        <p>Neighborhood Guides</p>
                    </div>
                </a>
                <a href={route("seller")}>
                    <div className="utilLink home-valuation">
                        <div className="overlay"></div>
                        <p>Home Valuation</p>
                    </div>
                </a>
            </div>
        </section>
    );
}