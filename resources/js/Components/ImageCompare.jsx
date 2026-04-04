import { useState, useRef, useEffect } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
const ImageCompare = ({ image1, image2 }) => {
    const [position, setPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);
    const dragRef = useRef(null);

    const handleDrag = (e) => {
        if (!containerRef.current || !isDragging) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - containerRect.left;
        const newPosition = Math.max(0, Math.min(100, (offsetX / containerRect.width) * 100));

        setPosition(newPosition);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        e.preventDefault();
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchMove = (e) => {
        if (!containerRef.current || !isDragging) return;
        handleDrag(e.touches[0]);
    };

    useEffect(() => {
        document.addEventListener("mousemove", handleDrag);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("touchmove", handleTouchMove);
        document.addEventListener("touchend", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleDrag);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div ref={containerRef} className="image-compare-container">
            <img src={image1} alt="Before" className="image-compare-image image-1" />

            <div className="image-compare-overlay" style={{ width: `${position}%` }}>
                <img src={image2} alt="After" className="image-compare-image image-2" />
            </div>

            <div className="image-compare-separator" style={{ left: `${position}%` }} ref={dragRef} onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
                <div className="separator-bar">
                    <div className="separator-text">
                        <span className="text-bv-white bg-bv-black p-1 border">Drag</span>
                    </div>
                </div>

                <div className="separator-grab">
                    <span className="grab-text"><IoIosArrowBack /> <IoIosArrowForward /></span>
                </div>
            </div>
        </div>
    );
};

export default ImageCompare;
