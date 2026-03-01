import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-gradient-subtle">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <footer className="py-12 px-6 border-t border-border">
        <div className="container max-w-5xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            SkillLingo — your skills deserve to be seen.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
