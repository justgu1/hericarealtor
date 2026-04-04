import { useState, useEffect } from 'react';
import SectionTitle from "@/Components/SectionTitle";
import { PiArrowArcLeft, PiArrowArcRight } from 'react-icons/pi';
import { IoChatbubbleEllipses } from "react-icons/io5";
export default function Reviews({ reviews }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [numVisible, setNumVisible] = useState(2);

    useEffect(() => {
        const handleResize = () => {
            setNumVisible(window.innerWidth < 1024 ? 1 : 2);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + numVisible) % reviews.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - numVisible + reviews.length) % reviews.length);
    };

    return (
        <section id="Reviews" className="reviewsSection relative">
            <SectionTitle h2="What are they" h3="Saying?" color="darkness" />
            <div className="reviewsContainer">
                <div className="reviews">
                    {reviews.slice(currentIndex, currentIndex + numVisible).map((review, index) => (
                        <article key={index} className="review">
                            <h2 className="reviewTitle">{review.title}</h2>
                            <div className="reviewContent" dangerouslySetInnerHTML={{ __html: review.content }} />
                            <span className="reviewAuthor"><IoChatbubbleEllipses />{review.author}</span>
                        </article>
                    ))}
                    <div className='reviewsSeparator'></div>
                </div>
                <div className={"reviewsNav"}>
                    <button onClick={handlePrev} className="arrow-button">
                        <PiArrowArcLeft />
                    </button>
                    <button onClick={handleNext} className="arrow-button">
                        <PiArrowArcRight />
                    </button>
                </div>
            </div>
        </section>
    );
}
