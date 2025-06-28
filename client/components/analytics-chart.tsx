import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { QpayButton } from "./ui/qpay-button";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
} from "lucide-react";

const AnalyticsChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [chartType, setChartType] = useState("volume");

  const periods = [
    { value: "24h", label: "24H" },
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
  ];

  const volumeData = [
    { day: "Mon", btc: 2400, usdt: 1800, total: 4200 },
    { day: "Tue", btc: 1800, usdt: 2200, total: 4000 },
    { day: "Wed", btc: 3200, usdt: 1600, total: 4800 },
    { day: "Thu", btc: 2800, usdt: 2400, total: 5200 },
    { day: "Fri", btc: 3600, usdt: 2000, total: 5600 },
    { day: "Sat", btc: 2200, usdt: 2800, total: 5000 },
    { day: "Sun", btc: 3000, usdt: 2200, total: 5200 },
  ];

  const transactionData = [
    { day: "Mon", count: 24 },
    { day: "Tue", count: 18 },
    { day: "Wed", count: 32 },
    { day: "Thu", count: 28 },
    { day: "Fri", count: 36 },
    { day: "Sat", count: 22 },
    { day: "Sun", count: 30 },
  ];

  const currentData = chartType === "volume" ? volumeData : transactionData;
  const maxValue = Math.max(
    ...currentData.map((d) => (chartType === "volume" ? d.total : d.count)),
  );

  const totalVolume = volumeData.reduce((sum, day) => sum + day.total, 0);
  const totalTransactions = transactionData.reduce(
    (sum, day) => sum + day.count,
    0,
  );

  return (
    <Card className="glass-card border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Analytics Dashboard
          </CardTitle>
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 rounded-lg border border-input bg-background text-sm"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart Type Selector */}
        <div className="flex space-x-2">
          <QpayButton
            variant={chartType === "volume" ? "primary" : "outline"}
            size="sm"
            onClick={() => setChartType("volume")}
          >
            Volume
          </QpayButton>
          <QpayButton
            variant={chartType === "transactions" ? "primary" : "outline"}
            size="sm"
            onClick={() => setChartType("transactions")}
          >
            Transactions
          </QpayButton>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/5 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Total Volume
              </span>
              <TrendingUp className="w-4 h-4 text-qpay-success" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${totalVolume.toLocaleString()}
            </div>
            <div className="text-sm text-qpay-success">+12.5% vs last week</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/5 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Transactions
              </span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {totalTransactions}
            </div>
            <div className="text-sm text-primary">+8.2% vs last week</div>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">
            {chartType === "volume" ? "Payment Volume" : "Transaction Count"} -
            Last 7 Days
          </h3>

          {/* Simple Bar Chart */}
          <div className="space-y-3">
            {currentData.map((item, index) => (
              <div key={item.day} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.day}</span>
                  <span className="font-medium text-foreground">
                    {chartType === "volume"
                      ? `$${item.total.toLocaleString()}`
                      : `${item.count} txns`}
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-muted/20 rounded-full h-2">
                    {chartType === "volume" ? (
                      <>
                        <div
                          className="bg-qpay-warning rounded-full h-2 transition-all duration-500"
                          style={{ width: `${(item.btc / maxValue) * 100}%` }}
                        />
                        <div
                          className="bg-qpay-success rounded-full h-2 transition-all duration-500 -mt-2 ml-auto"
                          style={{
                            width: `${(item.usdt / maxValue) * 100}%`,
                            marginLeft: `${(item.btc / maxValue) * 100}%`,
                          }}
                        />
                      </>
                    ) : (
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-500"
                        style={{ width: `${(item.count / maxValue) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          {chartType === "volume" && (
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-qpay-warning rounded" />
                <span className="text-muted-foreground">Bitcoin</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-qpay-success rounded" />
                <span className="text-muted-foreground">USDT</span>
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Key Insights</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="w-4 h-4 text-qpay-success" />
              <span className="text-muted-foreground">
                Peak volume on Friday with $5,600 in payments
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <PieChart className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                Bitcoin accounts for 58% of total volume
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-qpay-warning" />
              <span className="text-muted-foreground">
                Weekend activity remains strong at 85% of weekday average
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsChart;
