import { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { useDotButton, DotButton } from './EmblaCarouselDotButton';
import { PrevButton, NextButton, usePrevNextButtons } from './EmblaCarouselArrowButtons';
import useEmblaCarousel from 'embla-carousel-react';
import styles from '/resources/css/ClockWiseCarousel.module.css';
import { RxRulerSquare } from "react-icons/rx";
import { FaBed, FaShower, FaSink, FaTreeCity } from "react-icons/fa6";

const ClockWiseCarousel = ({ listings }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
  const props = {
    slides: listings,
    options: {
      dragFree: true,
      loop: false,
      slidesInView: isDesktop ? 3 : 1
    }
  };
  const { slides, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi);
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = usePrevNextButtons(emblaApi);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        console.log(`Slide atual: ${selectedIndex}`);
      });
    }
  }, [emblaApi, selectedIndex]);

  return (
    <section className={styles.embla}>
      <section className="embla">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container">
            {listings.map((listing, index) => (
              <div
                className={`embla__slide ${styles.embla__slide} ${selectedIndex + 1 === index && isDesktop ? styles.current : ''}`}
                key={index}
              >
                <div className="embla__slide__number">
                  <a href={route('properties.show', listing.id)}>
                    <article className={`${styles.card}`}>
                      <section className={styles.cardThumbnail}>
                        <span className={styles.status}>{listing.status_enum.name}</span>
                        <img
                          src={listing.thumbnail_url || '/img/default.jpg'}
                          alt={listing.address}
                          className={styles['card-image']}
                        />
                      </section>
                      <section className={styles.cardInfo}>
                        <p className={styles['card-text']}>{listing.address}</p>
                        <h3 className={styles['card-price']}>{formatPrice(listing.price)}</h3>
                      </section>
                      <section className={styles.cardDetails}>
                        <p><span className={styles.detailsKey}><RxRulerSquare /> sqr footage</span> <span className={styles.detailsValue}>{listing.sqr_footage}</span></p>
                        <p><span className={styles.detailsKey}><FaBed /> bedrooms</span> <span className={styles.detailsValue}>{listing.bedrooms}</span></p>
                        <p><span className={styles.detailsKey}><FaShower /> bathrooms</span> <span className={styles.detailsValue}>{listing.bathrooms}</span></p>
                        <p><span className={styles.detailsKey}><FaSink /> half bathrooms</span> <span className={styles.detailsValue}>{listing.half_bathrooms}</span></p>
                        <p><span className={styles.detailsKey}><FaTreeCity /> type</span> <span className={styles.detailsValue}>{listing.type_enum.name}</span></p>
                      </section>
                    </article>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="embla__controls">
          <div className="embla__buttons">
            <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
            <a className="button" href={route("properties")}>{window.innerWidth < 768 ? "See all" : "See all properties"}</a>
            <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
          </div>
        </div>
      </section>
    </section>
  );
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export default ClockWiseCarousel;
