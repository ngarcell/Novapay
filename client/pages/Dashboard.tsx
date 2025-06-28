import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/navigation";
import InvoiceForm from "../components/invoice-form";
import InvoiceTable from "../components/invoice-table";
import QRModal from "../components/qr-modal";
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
    // Could open a detailed view modal
  };

  const handleEditInvoice = (invoice: any) => {
    // Implementation for editing invoice
    console.log("Edit invoice:", invoice.id);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "cancelled" as const } : inv,
      ),
    );
  };

  const handleGenerateQR = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowQRModal(true);
  };

  const recentTransactions = [
    {
      id: "TX001",
      amount: "$150.00",
      crypto: "BTC",
      status: "completed",
      time: "2 mins ago",
    },
    {
      id: "TX002",
      amount: "$75.50",
      crypto: "USDT",
      status: "completed",
      time: "15 mins ago",
    },
    {
      id: "TX003",
      amount: "$320.00",
      crypto: "BTC",
      status: "pending",
      time: "1 hour ago",
    },
  ];

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
                <div className="space-y-4">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/5 border border-white/5"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {store.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {store.transactions} transactions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
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

            {/* Quick Actions */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <QpayButton
                    variant="glass"
                    className="h-20 flex-col space-y-2"
                  >
                    <QrCode className="w-6 h-6" />
                    <span className="text-sm">Generate QR</span>
                  </QpayButton>
                  <QpayButton
                    variant="glass"
                    className="h-20 flex-col space-y-2"
                  >
                    <Bitcoin className="w-6 h-6" />
                    <span className="text-sm">Check Rates</span>
                  </QpayButton>
                  <QpayButton
                    variant="glass"
                    className="h-20 flex-col space-y-2"
                  >
                    <Wallet className="w-6 h-6" />
                    <span className="text-sm">Wallet</span>
                  </QpayButton>
                  <QpayButton
                    variant="glass"
                    className="h-20 flex-col space-y-2"
                  >
                    <Settings className="w-6 h-6" />
                    <span className="text-sm">Settings</span>
                  </QpayButton>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="glass-card border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Recent Transactions</CardTitle>
              <QpayButton variant="ghost" size="sm">
                View All
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </QpayButton>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/5 border border-white/5"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Bitcoin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {transaction.id}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {transaction.crypto} • {transaction.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {transaction.amount}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === "completed"
                            ? "bg-qpay-success/10 text-qpay-success"
                            : "bg-qpay-warning/10 text-qpay-warning"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
    </div>
  );
};

export default Dashboard;
