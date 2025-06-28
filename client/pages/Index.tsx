import Navigation from "../components/navigation";
import HeroSection from "../components/hero-section";
import FeaturesSection from "../components/features-section";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
    </div>
  );
};

export default Index;
