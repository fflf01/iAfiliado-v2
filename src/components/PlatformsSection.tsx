import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import enegiaLogo from "@/assets/logos/Enegia.png";
import bravoLogo from "@/assets/logos/Bravo.png";
import mcGamesLogo from "@/assets/logos/MCGames.png";
import playBetLogo from "@/assets/logos/PlayBet.png";
import galeraBetLogo from "@/assets/logos/Galerabet.png";
import braBetLogo from "@/assets/logos/BraBet.png";
import betDaSorteLogo from "@/assets/logos/BetdaSorte.png";
import estrelaBetLogo from "@/assets/logos/estrelabet.png";
import betsulLogo from "@/assets/logos/betsul.png";
import goldbetLogo from "@/assets/logos/goldbet.png";
import multibetLogo from "@/assets/logos/multibet2.png";
import geralbetLogo from "@/assets/logos/geralbet.png";
import seubetLogo from "@/assets/logos/seubet.png";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const partnerLogos = [
  { name: "Energia Bet", src: enegiaLogo },
  { name: "Bravo Bet", src: bravoLogo },
  { name: "MC Games", src: mcGamesLogo },
  { name: "Play Bet", src: playBetLogo },
  { name: "Galera Bet", src: galeraBetLogo },
  { name: "BraBet", src: braBetLogo },
  { name: "Bet da Sorte", src: betDaSorteLogo },
  { name: "EstrelaBet", src: estrelaBetLogo },
  { name: "BetSul", src: betsulLogo },
  { name: "GoldBet", src: goldbetLogo },
  { name: "Multibet", src: multibetLogo },
  { name: "GeralBet", src: geralbetLogo },
  { name: "SeuBet", src: seubetLogo },
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
