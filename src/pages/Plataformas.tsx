import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Zap, Globe } from "lucide-react";
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

const partnerLogos = [
  { name: "BrasilBet", src: brasilbetLogo },
  { name: "EstrelaBet", src: estrelabetLogo },
  { name: "GeralBet", src: geralbetLogo },
  { name: "GoldBet", src: goldbetLogo },
  { name: "LuvaBet", src: luvabetLogo },
  { name: "BetMGM", src: mgmbetLogo },
  { name: "Betsul", src: betsulLogo },
];

const Plataformas = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--cor-secundaria-suave)] via-transparent to-transparent" />
        <div className="container mx-auto relative z-10 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-secundario-suave texto-secundario text-sm font-semibold mb-4 uppercase tracking-wider">
            Parceiros Premium
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Nossas{" "}
            <span className="texto-gradiente-secundario">Plataformas</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trabalhe com as maiores e mais confiáveis casas de apostas do mundo
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 px-4 border-y border-border/30">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5 texto-destaque" />
              <span>Licenciadas e Regulamentadas</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-5 h-5 texto-destaque" />
              <span>Pagamentos Garantidos</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-5 h-5 texto-destaque" />
              <span>Alcance Global</span>
            </div>
          </div>
        </div>
      </section>

      {/* Parceiros Carousel */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {/* Estrutura do Carrossel */}
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

      <Footer />
    </div>
  );
};

export default Plataformas;
