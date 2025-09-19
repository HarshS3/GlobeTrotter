import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MagnifyingGlass } from "phosphor-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Globe } from "@/components/magicui/globe";

const HeroSection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const stars = Array.from({ length: 120 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const path = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search";
    navigate(path);
  };

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      {/* Space-like background */}
  <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_10%,rgba(20,20,20,0.5),transparent_60%),radial-gradient(900px_900px_at_90%_90%,rgba(10,10,10,0.85),transparent_55%)] bg-background" />

      {/* Three.js Globe */}
      <Globe className="absolute inset-0 -z-0" radius={1.8} rotationSpeed={0.12} dark />

      {/* Centered overlay content */}
      <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-6 text-center">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-[0_0_18px_rgba(56,189,248,0.35)]"
          >
            Discover Your Next Adventure
          </motion.h1>

          {/* Subtle helper: search below heading to keep previous UX */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-8 mx-auto glass rounded-full p-2 pl-4 pr-2 flex items-center gap-3 max-w-xl"
          >
            <MagnifyingGlass size={20} className="text-white/70" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where would you like to go?"
              className="bg-transparent border-none focus-visible:ring-0 text-base text-white placeholder:text-white/50 flex-1"
            />
            <Button type="submit" className="rounded-full gradient-hero btn-neumorph px-6 py-6 shadow-[0_0_20px_rgba(56,189,248,0.35)] hover:shadow-[0_0_28px_rgba(56,189,248,0.55)]">
              Search
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </motion.form>
        </div>
      </div>
      {/* CTA buttons per mockup */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        <Link to="/login"><Button variant="secondary">Sign In</Button></Link>
        <Link to="/register"><Button className="gradient-hero btn-neumorph">Get Started</Button></Link>
      </div>
    </section>
  );
};

export default HeroSection;