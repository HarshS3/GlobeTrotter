import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { List, X, Globe } from "phosphor-react";
import { Button } from "./ui/button";
import { useUser } from "@/context/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Trips", href: "/trips" },
    { label: "Search", href: "/search" },
    { label: "Activities", href: "/activities" },
    { label: "Calendar", href: "/calendar" },
    { label: "Community", href: "/community" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "nav-blur" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <Globe size={32} className="text-primary" weight="fill" />
            <span className="gradient-hero bg-clip-text text-transparent">
              GlobeTrotter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons + Avatar */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/register"><Button size="sm" className="btn-neumorph gradient-hero">Get Started</Button></Link>
            <Link to="/profile" className="ml-2">
              <Avatar className="h-8 w-8 ring-1 ring-primary/30">
                {user?.avatarDataUrl ? (
                  <AvatarImage src={user.avatarDataUrl} alt="me" />
                ) : (
                  <AvatarFallback>
                    {(user?.firstName?.[0] || "").toUpperCase()}
                    {(user?.lastName?.[0] || "").toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <List size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 right-0 w-80 glass-card border-l md:hidden"
          >
            <div className="flex flex-col p-6 pt-20 gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-6 border-t border-border">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}><Button variant="ghost">Sign In</Button></Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}><Button className="gradient-hero">Get Started</Button></Link>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="self-start">
                  <Avatar className="h-8 w-8 ring-1 ring-primary/30">
                    {user?.avatarDataUrl ? (
                      <AvatarImage src={user.avatarDataUrl} alt="me" />
                    ) : (
                      <AvatarFallback>
                        {(user?.firstName?.[0] || "").toUpperCase()}
                        {(user?.lastName?.[0] || "").toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navigation;