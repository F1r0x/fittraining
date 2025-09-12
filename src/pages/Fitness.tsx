import GymHeroSection from "@/components/GymHeroSection";
import GymDailyWorkout from "@/components/GymDailyWorkout";
import PremiumPlans from "@/components/PremiumPlans";
import Footer from "@/components/Footer";

const Fitness = () => {
  return (
    <div className="min-h-screen">
      <GymHeroSection />
      <GymDailyWorkout />
      <PremiumPlans />
      <Footer />
    </div>
  );
};

export default Fitness;