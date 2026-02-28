import { motion } from "framer-motion";
import { MessageSquareText, Sparkles, Eye } from "lucide-react";

const features = [
  {
    icon: MessageSquareText,
    title: "Reflect",
    description: "Answer three powerful prompts designed to surface skills you didn't know you had.",
    color: "text-primary",
  },
  {
    icon: Sparkles,
    title: "Discover",
    description: "See your experience reframed — not as job titles, but as real capabilities.",
    color: "text-accent",
  },
  {
    icon: Eye,
    title: "Showcase",
    description: "Get a clean Skill Snapshot you can share, save, or use anywhere.",
    color: "text-success",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 px-6">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            How it works
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Three steps. No résumé required. No algorithms to game.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors duration-300 group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
            >
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
              </div>
              <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block">
                Step {index + 1}
              </span>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
