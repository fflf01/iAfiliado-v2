import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import PlatformsSection from "@/components/PlatformsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <BenefitsSection />
      <PlatformsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
