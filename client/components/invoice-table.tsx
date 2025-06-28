import { useState } from "react";
import { QpayButton } from "./ui/qpay-button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  QrCode,
  Copy,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";
import { Input } from "./ui/input";

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  store: string;
  settlementPreference: "mpesa" | "btc";
  status: "pending" | "paid" | "expired" | "cancelled";
  createdAt: string;
  expiresAt: string;
  reference?: string;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onGenerateQR: (invoice: Invoice) => void;
}

const InvoiceTable = ({
  invoices,
  onView,
  onEdit,
  onDelete,
  onGenerateQR,
}: InvoiceTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-qpay-success/10 text-qpay-success";
      case "pending":
        return "bg-qpay-warning/10 text-qpay-warning";
      case "expired":
        return "bg-gray-500/10 text-gray-500";
      case "cancelled":
        return "bg-qpay-error/10 text-qpay-error";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "expired":
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const copyInvoiceLink = (invoiceId: string) => {
    const link = `${window.location.origin}/pay/${invoiceId}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  return (
    <Card className="glass-card border-white/10">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl">Invoices</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No invoices found
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first invoice to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                    Invoice
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                    Settlement
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                    Created
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-2">
                      <div>
                        <div className="font-medium text-foreground">
                          {invoice.id}
                        </div>
                        <div className="text-sm text-muted-foreground truncate max-w-32">
                          {invoice.description}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div>
                        <div className="font-medium text-foreground">
                          {invoice.customerName || "Anonymous"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="font-semibold text-foreground">
                        {invoice.currency} {invoice.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          invoice.status,
                        )}`}
                      >
                        {getStatusIcon(invoice.status)}
                        <span className="capitalize">{invoice.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm text-muted-foreground capitalize">
                        {invoice.settlementPreference === "mpesa"
                          ? "M-Pesa"
                          : "Bitcoin"}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-sm text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <QpayButton variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </QpayButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(invoice)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyInvoiceLink(invoice.id)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onGenerateQR(invoice)}
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            QR Code
                          </DropdownMenuItem>
                          {invoice.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => onEdit(invoice)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDelete(invoice.id)}
                                className="text-red-500"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceTable;
