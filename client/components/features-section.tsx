import {
  Wallet,
  Store,
  TrendingUp,
  Shield,
  Smartphone,
  BarChart3,
  Globe,
  Clock,
  Users,
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: <Store className="w-8 h-8" />,
      title: "Multi-Store Management",
      description:
        "Manage multiple stores from one dashboard. Perfect for enterprise businesses with various locations.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: "Instant KES Settlements",
      description:
        "Receive payments directly to your Mpesa account within 30 seconds of crypto confirmation.",
      color: "text-qpay-success",
      bgColor: "bg-qpay-success/10",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Zero Volatility Risk",
      description:
        "We handle the crypto-to-fiat conversion, protecting you from market fluctuations.",
      color: "text-qpay-warning",
      bgColor: "bg-qpay-warning/10",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Real-time Analytics",
      description:
        "Track your crypto payments, conversion rates, and settlement history in real-time.",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile-First Design",
      description:
        "Optimized for mobile payments with QR codes and seamless customer experience.",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Reach",
      description:
        "Accept payments from customers worldwide while receiving local currency.",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
  ];

  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      value: "1,000+",
      label: "Active Merchants",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      value: "$2M+",
      label: "Processed Volume",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      value: "99.9%",
      label: "Uptime",
    },
  ];

  return (
    <section id="features" className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Features</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything you need to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              accept crypto
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From payment processing to settlement, we've built the complete
            infrastructure for crypto payments in Kenya.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 hover:shadow-glow transition-all duration-300 group"
            >
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-xl ${feature.bgColor} ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats section */}
        <div className="glass-card p-8 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
    </section>
  );
};

export default FeaturesSection;
