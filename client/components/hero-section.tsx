import { Link } from "react-router-dom";
import { QpayButton } from "./ui/qpay-button";
import { ArrowRight, Shield, Zap, DollarSign } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-green-500/10" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 pt-16 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Secure • Fast • Reliable
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Accept{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent animate-gradient">
              Crypto Payments
            </span>
            <br />
            Get Paid in{" "}
            <span className="bg-gradient-success bg-clip-text text-transparent">
              Kenyan Shillings
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Let your customers pay with Bitcoin and USDT while you receive
            instant settlements in KES through Mpesa. Zero volatility risk,
            maximum convenience.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
            <div className="glass-card p-6 text-center">
              <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">&lt;30s</div>
              <div className="text-sm text-muted-foreground">
                Settlement Time
              </div>
            </div>
            <div className="glass-card p-6 text-center">
              <Shield className="w-8 h-8 text-qpay-success mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
            <div className="glass-card p-6 text-center">
              <DollarSign className="w-8 h-8 text-qpay-warning mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">2.5%</div>
              <div className="text-sm text-muted-foreground">
                Transaction Fee
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/onboarding">
              <QpayButton variant="primary" size="xl" glow className="group">
                Start Accepting Crypto
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </QpayButton>
            </Link>
            <QpayButton variant="outline" size="xl">
              Watch Demo
            </QpayButton>
          </div>

          {/* Trust indicators */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by 1000+ merchants across Kenya
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              <div className="h-8 w-20 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold">LOGO</span>
              </div>
              <div className="h-8 w-20 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold">LOGO</span>
              </div>
              <div className="h-8 w-20 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold">LOGO</span>
              </div>
              <div className="h-8 w-20 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold">LOGO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 right-10 w-16 h-16 bg-primary/20 rounded-full float blur-sm" />
      <div className="absolute bottom-40 left-10 w-12 h-12 bg-purple-500/20 rounded-full float delay-1000 blur-sm" />
      <div className="absolute top-1/2 right-20 w-8 h-8 bg-green-500/20 rounded-full float delay-2000 blur-sm" />
    </section>
  );
};

export default HeroSection;
