import { useState } from "react";
import Navigation from "../components/navigation";
import { QpayButton } from "../components/ui/qpay-button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  User,
  Building2,
  Smartphone,
  Bitcoin,
  Shield,
  Bell,
  Key,
  CreditCard,
  Settings as SettingsIcon,
} from "lucide-react";

const Settings = () => {
  const [businessData, setBusinessData] = useState({
    businessName: "Acme Corp Ltd",
    businessType: "retail",
    website: "https://acmecorp.com",
    description: "Modern retail solutions",
    address: "123 Business Street, Nairobi",
    phone: "+254 700 000 000",
    kraPin: "A000000000A",
    businessLicense: "BL123456789",
  });

  const [personalData, setPersonalData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@acmecorp.com",
    phone: "+254 700 000 000",
  });

  const [settlementData, setSettlementData] = useState({
    defaultSettlement: "mpesa",
    mpesaNumber: "+254 700 000 000",
    btcAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    autoSettlement: true,
    settlementThreshold: "100",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    paymentAlerts: true,
    settlementAlerts: true,
    securityAlerts: true,
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    // Handle success notification
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your business profile and preferences
              </p>
            </div>

            <Tabs defaultValue="business" className="space-y-6">
              <TabsList className="grid grid-cols-4 lg:grid-cols-5 w-full">
                <TabsTrigger value="business" className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Business</span>
                </TabsTrigger>
                <TabsTrigger value="personal" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger value="settlement" className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Settlement</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="flex items-center"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Alerts</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
              </TabsList>

              {/* Business Profile */}
              <TabsContent value="business">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={businessData.businessName}
                          onChange={(e) =>
                            setBusinessData((prev) => ({
                              ...prev,
                              businessName: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessType">Business Type</Label>
                        <select
                          className="w-full p-3 rounded-lg border border-input bg-background"
                          value={businessData.businessType}
                          onChange={(e) =>
                            setBusinessData((prev) => ({
                              ...prev,
                              businessType: e.target.value,
                            }))
                          }
                        >
                          <option value="retail">Retail</option>
                          <option value="ecommerce">E-commerce</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="services">Services</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={businessData.website}
                        onChange={(e) =>
                          setBusinessData((prev) => ({
                            ...prev,
                            website: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Business Description</Label>
                      <textarea
                        id="description"
                        className="w-full p-3 rounded-lg border border-input bg-background min-h-[100px]"
                        value={businessData.description}
                        onChange={(e) =>
                          setBusinessData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Business Address</Label>
                      <Input
                        id="address"
                        value={businessData.address}
                        onChange={(e) =>
                          setBusinessData((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="kraPin">KRA PIN</Label>
                        <Input
                          id="kraPin"
                          value={businessData.kraPin}
                          onChange={(e) =>
                            setBusinessData((prev) => ({
                              ...prev,
                              kraPin: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessLicense">
                          Business License
                        </Label>
                        <Input
                          id="businessLicense"
                          value={businessData.businessLicense}
                          onChange={(e) =>
                            setBusinessData((prev) => ({
                              ...prev,
                              businessLicense: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personal Information */}
              <TabsContent value="personal">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={personalData.firstName}
                          onChange={(e) =>
                            setPersonalData((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={personalData.lastName}
                          onChange={(e) =>
                            setPersonalData((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={personalData.email}
                        onChange={(e) =>
                          setPersonalData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={personalData.phone}
                        onChange={(e) =>
                          setPersonalData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settlement Preferences */}
              <TabsContent value="settlement">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Settlement Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Default Settlement Method</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            settlementData.defaultSettlement === "mpesa"
                              ? "border-primary bg-primary/10"
                              : "border-muted"
                          }`}
                          onClick={() =>
                            setSettlementData((prev) => ({
                              ...prev,
                              defaultSettlement: "mpesa",
                            }))
                          }
                        >
                          <div className="flex items-center space-x-3">
                            <Smartphone className="w-6 h-6 text-qpay-success" />
                            <div>
                              <h3 className="font-semibold">M-Pesa</h3>
                              <p className="text-sm text-muted-foreground">
                                Instant KES settlement
                              </p>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            settlementData.defaultSettlement === "btc"
                              ? "border-primary bg-primary/10"
                              : "border-muted"
                          }`}
                          onClick={() =>
                            setSettlementData((prev) => ({
                              ...prev,
                              defaultSettlement: "btc",
                            }))
                          }
                        >
                          <div className="flex items-center space-x-3">
                            <Bitcoin className="w-6 h-6 text-qpay-warning" />
                            <div>
                              <h3 className="font-semibold">Bitcoin</h3>
                              <p className="text-sm text-muted-foreground">
                                Keep as cryptocurrency
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mpesaNumber">M-Pesa Number</Label>
                      <Input
                        id="mpesaNumber"
                        value={settlementData.mpesaNumber}
                        onChange={(e) =>
                          setSettlementData((prev) => ({
                            ...prev,
                            mpesaNumber: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="btcAddress">Bitcoin Address</Label>
                      <Input
                        id="btcAddress"
                        value={settlementData.btcAddress}
                        onChange={(e) =>
                          setSettlementData((prev) => ({
                            ...prev,
                            btcAddress: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoSettlement"
                        checked={settlementData.autoSettlement}
                        onChange={(e) =>
                          setSettlementData((prev) => ({
                            ...prev,
                            autoSettlement: e.target.checked,
                          }))
                        }
                        className="rounded border-input"
                      />
                      <Label htmlFor="autoSettlement">
                        Enable automatic settlement
                      </Label>
                    </div>

                    <div>
                      <Label htmlFor="settlementThreshold">
                        Settlement Threshold (USD)
                      </Label>
                      <Input
                        id="settlementThreshold"
                        type="number"
                        value={settlementData.settlementThreshold}
                        onChange={(e) =>
                          setSettlementData((prev) => ({
                            ...prev,
                            settlementThreshold: e.target.value,
                          }))
                        }
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum amount to trigger automatic settlement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications */}
              <TabsContent value="notifications">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <h3 className="font-medium text-foreground">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {key === "emailNotifications" &&
                              "Receive notifications via email"}
                            {key === "smsNotifications" &&
                              "Receive notifications via SMS"}
                            {key === "paymentAlerts" &&
                              "Get notified when payments are received"}
                            {key === "settlementAlerts" &&
                              "Get notified when settlements are processed"}
                            {key === "securityAlerts" &&
                              "Get notified of security events"}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setNotifications((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                          className="rounded border-input"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security */}
              <TabsContent value="security">
                <div className="space-y-6">
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Key className="w-5 h-5 mr-2" />
                        API Keys
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted/5 border border-white/5">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">Live API Key</h3>
                            <p className="text-sm text-muted-foreground">
                              Used for production payments
                            </p>
                          </div>
                          <QpayButton variant="outline" size="sm">
                            Regenerate
                          </QpayButton>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/5 border border-white/5">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">Test API Key</h3>
                            <p className="text-sm text-muted-foreground">
                              Used for development and testing
                            </p>
                          </div>
                          <QpayButton variant="outline" size="sm">
                            Regenerate
                          </QpayButton>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Security Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <QpayButton variant="outline" className="w-full">
                        Change Password
                      </QpayButton>
                      <QpayButton variant="outline" className="w-full">
                        Enable Two-Factor Authentication
                      </QpayButton>
                      <QpayButton variant="outline" className="w-full">
                        View Login History
                      </QpayButton>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end">
              <QpayButton
                variant="primary"
                size="lg"
                onClick={handleSave}
                loading={loading}
                glow
              >
                Save Changes
              </QpayButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
