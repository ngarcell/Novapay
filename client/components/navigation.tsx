import { Link, useLocation } from "react-router-dom";
import { QpayButton } from "./ui/qpay-button";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Security", href: "#security" },
    { name: "Support", href: "#support" },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 glass backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <span className="text-lg font-bold text-white">Q</span>
            </div>
            <span className="text-xl font-bold text-foreground">Qpay</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <Link to="/login" className="hidden sm:block">
              <QpayButton variant="ghost" size="sm">
                Sign In
              </QpayButton>
            </Link>
            <Link to="/onboarding">
              <QpayButton variant="primary" size="sm" glow>
                Get Started
              </QpayButton>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
