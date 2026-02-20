import "@/Stilos/stilo.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import brasilbetLogo from "@/assets/brasilbet.png";
import estrelabetLogo from "@/assets/estrelabet.png";
import geralbetLogo from "@/assets/geralbet.png";
import goldbetLogo from "@/assets/goldbet.png";
import luvabetLogo from "@/assets/luvabet.png";
import mgmbetLogo from "@/assets/MGMbet.png";
import betsulLogo from "@/assets/betsul.png";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const partnerLogos = [
  { name: "BrasilBet", src: brasilbetLogo },
  { name: "EstrelaBet", src: estrelabetLogo },
  { name: "GeralBet", src: geralbetLogo },
  { name: "GoldBet", src: goldbetLogo },
  { name: "LuvaBet", src: luvabetLogo },
  { name: "BetMGM", src: mgmbetLogo },
  { name: "Betsul", src: betsulLogo },
];

const PlatformsSection = () => {
  return (
    <section className="py-14 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-principal-suave opacity-50 rounded-full blur-[200px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secundario-suave rounded-full blur-[180px]" />

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Plataformas{" "}
            <span className="texto-gradiente-destaque">Parceiras</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trabalhe com as maiores e mais confiáveis casas de apostas do mundo
          </p>
        </div>

        <Swiper
          loop={true}
          spaceBetween={30}
          centeredSlides={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          navigation={true}
          modules={[Autoplay, Pagination, Navigation]}
          className="mySwiper !pb-12"
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 40,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 50,
            },
          }}
        >
          {partnerLogos.map((partner) => (
            <SwiperSlide
              key={partner.name}
              className="flex items-center justify-center"
            >
              <div className="w-[190px] h-[96px] flex items-center justify-center">
                <img
                  src={partner.src}
                  alt={`Logo ${partner.name}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default PlatformsSection;
