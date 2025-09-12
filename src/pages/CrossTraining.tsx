import HeroSection from "@/components/HeroSection";
import DailyWorkout from "@/components/DailyWorkout";
import PremiumPlans from "@/components/PremiumPlans";
import Footer from "@/components/Footer";

const CrossTraining = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <DailyWorkout />
      <PremiumPlans />
      <Footer />
    </div>
  );
};

export default CrossTraining;