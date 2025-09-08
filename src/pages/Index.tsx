import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DailyWorkout from "@/components/DailyWorkout";
import PremiumPlans from "@/components/PremiumPlans";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <DailyWorkout />
      <PremiumPlans />
      <Footer />
    </div>
  );
};

export default Index;