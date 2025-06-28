import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/navigation";
import InvoiceForm from "../components/invoice-form";
import InvoiceTable from "../components/invoice-table";
import QRModal from "../components/qr-modal";
import AnalyticsChart from "../components/analytics-chart";
import { QpayButton } from "../components/ui/qpay-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Store,
  Plus,
  TrendingUp,
  Wallet,
  Clock,
  Bitcoin,
  Smartphone,
  Settings,
  BarChart3,
  ArrowUpRight,
  Copy,
  QrCode,
  FileText,
  Bell,
} from "lucide-react";

const Dashboard = () => {
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoices, setInvoices] = useState([
    {
      id: "INV-001",
      amount: 150.0,
      currency: "USD",
      description: "Website development services",
      customerEmail: "client@example.com",
      customerName: "John Client",
      store: "store1",
      settlementPreference: "mpesa" as const,
      status: "paid" as const,
      createdAt: "2024-01-15T10:00:00Z",
      expiresAt: "2024-01-16T10:00:00Z",
      reference: "WEB-001",
    },
    {
      id: "INV-002",
      amount: 75.5,
      currency: "USD",
      description: "Product consultation",
      customerEmail: "customer@test.com",
      customerName: "Jane Customer",
      store: "store2",
      settlementPreference: "btc" as const,
      status: "pending" as const,
      createdAt: "2024-01-14T15:30:00Z",
      expiresAt: "2024-01-15T15:30:00Z",
    },
    {
      id: "INV-003",
      amount: 320.0,
      currency: "USD",
      description: "Monthly subscription",
      customerEmail: "sub@company.com",
      customerName: "Business Corp",
      store: "store1",
      settlementPreference: "mpesa" as const,
      status: "expired" as const,
      createdAt: "2024-01-13T09:00:00Z",
      expiresAt: "2024-01-14T09:00:00Z",
      reference: "SUB-001",
    },
    {
      id: "INV-004",
      amount: 199.99,
      currency: "USD",
      description: "E-commerce store setup",
      customerEmail: "store@startup.co",
      customerName: "StartupCo Ltd",
      store: "store2",
      settlementPreference: "btc" as const,
      status: "pending" as const,
      createdAt: "2024-01-16T08:00:00Z",
      expiresAt: "2024-01-17T08:00:00Z",
      reference: "ECOM-004",
    },
    {
      id: "INV-005",
      amount: 50.0,
      currency: "USD",
      description: "Quick logo design",
      customerEmail: "design@client.com",
      customerName: "Maria Designer",
      store: "store1",
      settlementPreference: "mpesa" as const,
      status: "paid" as const,
      createdAt: "2024-01-16T12:00:00Z",
      expiresAt: "2024-01-17T12:00:00Z",
      reference: "LOGO-005",
    },
  ]);

  const [stores] = useState([
    {
      id: 1,
      name: "Main Store",
      status: "active",
      monthlyVolume: "$12,450",
      transactions: 156,
    },
    {
      id: 2,
      name: "Online Shop",
      status: "active",
      monthlyVolume: "$8,230",
      transactions: 89,
    },
  ]);

  const totalVolume = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingCount = invoices.filter(
    (inv) => inv.status === "pending",
  ).length;

  const stats = [
    {
      title: "Total Volume",
      value: `$${totalVolume.toLocaleString()}`,
      change: "+12.5%",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-qpay-success",
    },
    {
      title: "Invoices",
      value: invoices.length.toString(),
      change: "+8.2%",
      icon: <FileText className="w-5 h-5" />,
      color: "text-primary",
    },
    {
      title: "Pending",
      value: pendingCount.toString(),
      change: "-2",
      icon: <Clock className="w-5 h-5" />,
      color: "text-qpay-warning",
    },
    {
      title: "Stores",
      value: stores.length.toString(),
      change: "+1",
      icon: <Store className="w-5 h-5" />,
      color: "text-qpay-secondary",
    },
  ];

  const handleCreateInvoice = (newInvoice: any) => {
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    alert(
      `Viewing invoice ${invoice.id}\nAmount: ${invoice.currency} ${invoice.amount}\nStatus: ${invoice.status}\nCustomer: ${invoice.customerName}`,
    );
  };

  const handleEditInvoice = (invoice: any) => {
    alert(
      `Edit functionality for invoice ${invoice.id} - This would open an edit form`,
    );
    console.log("Edit invoice:", invoice.id);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm(`Are you sure you want to cancel invoice ${invoiceId}?`)) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: "cancelled" as const } : inv,
        ),
      );
      alert(`Invoice ${invoiceId} has been cancelled`);
    }
  };

  const handleGenerateQR = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowQRModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, Merchant! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your crypto payments today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="glass-card border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                    </div>
                    <div
                      className={`p-3 rounded-lg bg-primary/10 ${stat.color}`}
                    >
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Quick Actions */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <QpayButton
                    variant="glass"
                    className="h-16 flex-col space-y-1"
                    onClick={() => setShowInvoiceForm(true)}
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-xs">New Invoice</span>
                  </QpayButton>
                  <QpayButton
                    variant="glass"
                    className="h-16 flex-col space-y-1"
                  >
                    <Bitcoin className="w-5 h-5" />
                    <span className="text-xs">Rates</span>
                  </QpayButton>
                  <QpayButton
                    variant="glass"
                    className="h-16 flex-col space-y-1"
                  >
                    <Wallet className="w-5 h-5" />
                    <span className="text-xs">Wallet</span>
                  </QpayButton>
                  <Link to="/settings">
                    <QpayButton
                      variant="glass"
                      className="h-16 flex-col space-y-1 w-full"
                    >
                      <Settings className="w-5 h-5" />
                      <span className="text-xs">Settings</span>
                    </QpayButton>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="glass-card border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <Bell className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.slice(0, 4).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/5 border border-white/5"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground text-sm">
                            {invoice.id}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            ${invoice.amount}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          invoice.status === "paid"
                            ? "bg-qpay-success/10 text-qpay-success"
                            : invoice.status === "pending"
                              ? "bg-qpay-warning/10 text-qpay-warning"
                              : "bg-gray-500/10 text-gray-500"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stores Management */}
            <Card className="glass-card border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Your Stores</CardTitle>
                <QpayButton variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Store
                </QpayButton>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/5 border border-white/5"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Store className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground text-sm">
                            {store.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {store.transactions} transactions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground text-sm">
                          {store.monthlyVolume}
                        </p>
                        <span className="text-xs bg-qpay-success/10 text-qpay-success px-2 py-1 rounded-full">
                          {store.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Chart */}
          <div className="mb-8">
            <AnalyticsChart />
          </div>

          {/* Invoice Management */}
          <InvoiceTable
            invoices={invoices}
            onView={handleViewInvoice}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            onGenerateQR={handleGenerateQR}
          />

          {/* Integration Guide */}
          <Card className="glass-card border-white/10 mt-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-primary" />
                Start Accepting Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Copy API Key
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get your unique API credentials
                  </p>
                  <QpayButton variant="outline" size="sm" className="mt-3">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Key
                  </QpayButton>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Integrate
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add our SDK to your website
                  </p>
                  <QpayButton variant="outline" size="sm" className="mt-3">
                    View Docs
                  </QpayButton>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Go Live
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start receiving crypto payments
                  </p>
                  <QpayButton variant="primary" size="sm" className="mt-3">
                    Test Payment
                  </QpayButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showInvoiceForm && (
        <InvoiceForm
          onClose={() => setShowInvoiceForm(false)}
          onSubmit={handleCreateInvoice}
        />
      )}

      {showQRModal && selectedInvoice && (
        <QRModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowQRModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
