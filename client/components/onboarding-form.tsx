import { useState } from "react";
import { QpayButton } from "./ui/qpay-button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  CheckCircle,
  User,
  Building2,
  CreditCard,
  Shield,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface FormData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Business Info
  businessName: string;
  businessType: string;
  website: string;
  description: string;

  // Financial Info
  mpesaNumber: string;
  estimatedVolume: string;

  // Verification
  kra: string;
  businessLicense: string;
}

const OnboardingForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "",
    website: "",
    description: "",
    mpesaNumber: "",
    estimatedVolume: "",
    kra: "",
    businessLicense: "",
  });

  const steps = [
    {
      number: 1,
      title: "Personal Information",
      icon: <User className="w-5 h-5" />,
      description: "Tell us about yourself",
    },
    {
      number: 2,
      title: "Business Details",
      icon: <Building2 className="w-5 h-5" />,
      description: "Your business information",
    },
    {
      number: 3,
      title: "Payment Setup",
      icon: <CreditCard className="w-5 h-5" />,
      description: "Configure your payouts",
    },
    {
      number: 4,
      title: "Verification",
      icon: <Shield className="w-5 h-5" />,
      description: "Verify your business",
    },
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    // Handle success
    alert("Application submitted successfully!");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+254 700 000 000"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Acme Corp Ltd"
                value={formData.businessName}
                onChange={(e) =>
                  handleInputChange("businessName", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <select
                className="w-full p-3 rounded-lg border border-input bg-background"
                value={formData.businessType}
                onChange={(e) =>
                  handleInputChange("businessType", e.target.value)
                }
              >
                <option value="">Select business type</option>
                <option value="retail">Retail</option>
                <option value="ecommerce">E-commerce</option>
                <option value="restaurant">Restaurant</option>
                <option value="services">Services</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                placeholder="https://acmecorp.com"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Business Description</Label>
              <textarea
                id="description"
                className="w-full p-3 rounded-lg border border-input bg-background min-h-[100px]"
                placeholder="Brief description of your business..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="mpesaNumber">Mpesa Number</Label>
              <Input
                id="mpesaNumber"
                placeholder="+254 700 000 000"
                value={formData.mpesaNumber}
                onChange={(e) =>
                  handleInputChange("mpesaNumber", e.target.value)
                }
              />
              <p className="text-sm text-muted-foreground mt-2">
                This is where you'll receive your KES settlements
              </p>
            </div>
            <div>
              <Label htmlFor="estimatedVolume">
                Estimated Monthly Volume (USD)
              </Label>
              <select
                className="w-full p-3 rounded-lg border border-input bg-background"
                value={formData.estimatedVolume}
                onChange={(e) =>
                  handleInputChange("estimatedVolume", e.target.value)
                }
              >
                <option value="">Select volume range</option>
                <option value="0-1000">$0 - $1,000</option>
                <option value="1000-5000">$1,000 - $5,000</option>
                <option value="5000-10000">$5,000 - $10,000</option>
                <option value="10000-50000">$10,000 - $50,000</option>
                <option value="50000+">$50,000+</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="kra">KRA PIN</Label>
              <Input
                id="kra"
                placeholder="A000000000A"
                value={formData.kra}
                onChange={(e) => handleInputChange("kra", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="businessLicense">Business License Number</Label>
              <Input
                id="businessLicense"
                placeholder="License number"
                value={formData.businessLicense}
                onChange={(e) =>
                  handleInputChange("businessLicense", e.target.value)
                }
              />
            </div>
            <div className="glass-card p-4 border border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">Next Steps</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• We'll verify your documents within 24 hours</li>
                <li>• You'll receive API credentials via email</li>
                <li>• Our team will help you with integration</li>
                <li>• Start accepting crypto payments immediately</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                        currentStep >= step.number
                          ? "bg-primary border-primary text-white"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > step.number ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-sm font-medium text-foreground">
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-4 transition-all duration-300 ${
                        currentStep > step.number ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl">
                {steps[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <QpayButton
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </QpayButton>

                {currentStep === steps.length ? (
                  <QpayButton
                    variant="primary"
                    onClick={handleSubmit}
                    loading={loading}
                    glow
                  >
                    Submit Application
                  </QpayButton>
                ) : (
                  <QpayButton
                    variant="primary"
                    onClick={handleNext}
                    className="flex items-center space-x-2"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </QpayButton>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OnboardingForm;
