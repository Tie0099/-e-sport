import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from '@/styles/carousel.module.css';

class MyCarousel extends React.Component {
    render() {
        const settings = {
            dots: true,
            infinite: true,
            speed: 1500,
            slidesToShow: 1,
            slidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 5000,
            responsive: [
                {
                    breakpoint: 1024,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 1,
                        infinite: true,
                        dots: true
                    }
                },
                {
                    breakpoint: 600,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 1,
                        initialSlide: 2
                    }
                },
                {
                    breakpoint: 480,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1
                    }
                }
            ]
        };

        return (
            <Slider {...settings}>
                <div className={styles['shadow-2xl']}>
                    <img src="/1.png" className={styles['img-container']} />
                </div>
                <div className={styles['shadow-2xl']}>
                    <img src="/2.png" className={styles['img-container']} />
                </div>
                <div className={styles['shadow-2xl']}>
                    <img src="/3.png" className={styles['img-container']} />
                </div>
            </Slider>
        );
    }
}

export default MyCarousel;
