"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { 
  Download, 
  RefreshCw, 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Layers, 
  Search, 
  Calendar,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  X,
  History
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Combobox } from "../components/ui/combobox";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip
} from "recharts";

export function Reports() {
  const [activeTab, setActiveTab] = useState<"stock" | "sales" | "product-sales" | "pending-stock">("stock");
  const [mounted, setMounted] = useState(false);

  // Indian Currency Formatter Utility
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Shared Filter States (Dates & Customers)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customersList, setCustomersList] = useState<any[]>([]);

  // -------------------------------------------------------------
  // STOCK REPORT STATE & LOGIC
  // -------------------------------------------------------------
  const [sizes, setSizes] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchReport = async (searchValue?: string) => {
    setLoading(true);
    try {
      const res = await api.get("/report/stock", {
        params: { 
          search: searchValue !== undefined ? searchValue : search
        }
      });
      setSizes(res.data.data.sizes);
      setRows(res.data.data.rows);
    } catch {
      toast.error("Stock report load nahi hua");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customer/dropdown");
      setCustomersList(res.data.data || []);
    } catch {}
  };

  const handleDownloadStock = async () => {
    if (!rows.length) return;
    try {
      const res = await api.get("/report/stock/export", {
        params: { search },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `stock-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Stock report download failed");
    }
  };

  // Debounced search for Stock Report
  useEffect(() => {
    if (activeTab !== "stock") return;
    if (search === "") {
      fetchReport("");
      return;
    }
    const timer = setTimeout(() => {
      fetchReport(search);
    }, 600);
    return () => clearTimeout(timer);
  }, [search]);

  // -------------------------------------------------------------
  // MONTHLY SALES STATE & LOGIC
  // -------------------------------------------------------------
  const [salesLoading, setSalesLoading] = useState(false);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState<any>({});
  const [selectedYear, setSelectedYear] = useState("");

  const fetchSalesData = async (
    yearVal?: string,
    startVal?: string,
    endVal?: string,
    custVal?: string
  ) => {
    setSalesLoading(true);
    try {
      const res = await api.get("/report/sales", {
        params: { 
          year: yearVal !== undefined ? yearVal : selectedYear,
          startDate: startVal !== undefined ? startVal : startDate,
          endDate: endVal !== undefined ? endVal : endDate,
          customerId: custVal !== undefined ? custVal : selectedCustomer
        }
      });
      setMonthlySales(res.data.data.monthlySales || []);
      setSalesSummary(res.data.data.summary || {});
    } catch {
      toast.error("Sales report load nahi hua");
    } finally {
      setSalesLoading(false);
    }
  };

  const handleDownloadSales = async () => {
    if (!monthlySales.length) return;
    try {
      const res = await api.get("/report/sales/export", {
        params: {
          year: selectedYear,
          startDate,
          endDate,
          customerId: selectedCustomer,
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `monthly-sales-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Sales report download failed");
    }
  };

  // Trigger Sales Data fetch when filters change
  useEffect(() => {
    if (activeTab !== "sales") return;
    fetchSalesData(selectedYear, startDate, endDate, selectedCustomer);
  }, [selectedYear, startDate, endDate, selectedCustomer, activeTab]);

  // -------------------------------------------------------------
  // PRODUCT SALES STATE & LOGIC
  // -------------------------------------------------------------
  const [prodSalesLoading, setProdSalesLoading] = useState(false);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [prodSearch, setProdSearch] = useState("");

  const fetchProductSales = async (
    searchVal?: string,
    startVal?: string,
    endVal?: string,
    custVal?: string
  ) => {
    setProdSalesLoading(true);
    try {
      const res = await api.get("/report/product-sales", {
        params: {
          search: searchVal !== undefined ? searchVal : prodSearch,
          startDate: startVal !== undefined ? startVal : startDate,
          endDate: endVal !== undefined ? endVal : endDate,
          customerId: custVal !== undefined ? custVal : selectedCustomer
        }
      });
      setProductSales(res.data.data || []);
    } catch {
      toast.error("Product dispatch report load nahi hua");
    } finally {
      setProdSalesLoading(false);
    }
  };

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyProductTitle, setHistoryProductTitle] = useState("");

  const fetchProductHistory = async (productId: string, productCode: string, designNo: string) => {
    setHistoryProductTitle(`${designNo} / ${productCode}`);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/report/product-sales-history/${productId}`);
      setHistoryData(res.data.data || []);
    } catch {
      toast.error("History load failed");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDownloadProdSales = async () => {
    if (!productSales.length) return;
    try {
      const res = await api.get("/report/product-sales/export", {
        params: {
          search: prodSearch,
          startDate,
          endDate,
          customerId: selectedCustomer,
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `product-dispatch-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Product dispatch report download failed");
    }
  };

  // Debounced search and filters for Product Sales
  useEffect(() => {
    if (activeTab !== "product-sales") return;
    const timer = setTimeout(() => {
      fetchProductSales(prodSearch, startDate, endDate, selectedCustomer);
    }, 500);
    return () => clearTimeout(timer);
  }, [prodSearch, startDate, endDate, selectedCustomer, activeTab]);

  // -------------------------------------------------------------
  // PENDING STOCK STATE & LOGIC (Merged Report)
  // -------------------------------------------------------------
  const [pendingData, setPendingData] = useState<any[]>([]);
  const [pendingSummary, setPendingSummary] = useState<any>(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingSearch, setPendingSearch] = useState("");

  const fetchPendingReport = async (searchValue?: string) => {
    setPendingLoading(true);
    try {
      const res = await api.get("/report/pending-stock", {
        params: searchValue !== undefined ? { search: searchValue } : (pendingSearch ? { search: pendingSearch } : {}),
      });
      setPendingData(res.data.data || []);
      setPendingSummary(res.data.summary || null);
    } catch {
      toast.error("Pending stock report load nahi hua");
    } finally {
      setPendingLoading(false);
    }
  };

  const handleDownloadPendingSales = async () => {
    if (!pendingData.length) return;
    try {
      const res = await api.get("/report/pending-stock/export", {
        params: { search: pendingSearch },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `pending-factory-orders-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Pending stock report download failed");
    }
  };

  // Debounced search for Pending Stock Report
  useEffect(() => {
    if (activeTab !== "pending-stock") return;
    const timer = setTimeout(() => {
      fetchPendingReport(pendingSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [pendingSearch, activeTab]);

  // -------------------------------------------------------------
  // MOUNT & TAB CHANGE TRIGGERS
  // -------------------------------------------------------------
  useEffect(() => {
    setMounted(true);
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (activeTab === "stock" && rows.length === 0) {
      fetchReport();
    } else if (activeTab === "sales" && monthlySales.length === 0) {
      fetchSalesData();
    } else if (activeTab === "product-sales" && productSales.length === 0) {
      fetchProductSales();
    } else if (activeTab === "pending-stock" && pendingData.length === 0) {
      fetchPendingReport();
    }
  }, [activeTab]);

  const customerOptions = [
    { label: "All Customers", value: "" },
    ...customersList.map((c: any) => ({
      label: `${c.name}${c.number ? ` (${c.number})` : ""}`,
      value: c._id,
    })),
  ];

  const yearOptions = [
    { label: "All Years", value: "" },
    ...Array.from({ length: 5 }, (_, i) => {
      const y = (new Date().getFullYear() - i).toString();
      return { label: y, value: y };
    }),
  ];

  // Prepare chart data chronologically
  const chartData = [...monthlySales].reverse().map((item) => ({
    Month: item._id,
    "Revenue (₹)": item.totalAmount,
    "Quantity Sold": item.totalQty
  }));

  // Reset Shared Filters
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedCustomer("");
    setSelectedYear("");
    toast.success("Filters cleared successfully");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reports Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed stock, sales, monthly metrics, and factory dispatches.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl w-fit border border-gray-200 shadow-sm shrink-0">
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === "stock"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
            }`}
          >
            <Layers className="w-4 h-4" />
            Stock Report
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === "sales"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Monthly Sales
          </button>
          <button
            onClick={() => setActiveTab("product-sales")}
            className={`px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === "product-sales"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
            }`}
          >
            <Package className="w-4 h-4" />
            Product Sales (Dispatch)
          </button>
          <button
            onClick={() => setActiveTab("pending-stock")}
            className={`px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === "pending-stock"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Pending Stock
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: STOCK REPORT
          ------------------------------------------------------------- */}
      {activeTab === "stock" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2 flex-1 max-w-xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Design/SKU..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fetchReport()} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={handleDownloadStock} disabled={!rows.length} className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4 mr-2" /> Download CSV
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Design No</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">SKU</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Category</th>
                    {sizes.map((s) => (
                      <th key={s._id} className="text-center px-4 py-3 font-semibold whitespace-nowrap">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3 + sizes.length} className="text-center py-16 text-gray-400">
                        Loading stock data...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={3 + sizes.length} className="text-center py-16 text-gray-400">
                        No stock records found
                      </td>
                    </tr>
                  ) : (
                    <>
                      {rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white hover:bg-gray-50/50" : "bg-gray-50 border-y border-gray-100/50 hover:bg-gray-100/50"}>
                          <td className="px-4 py-2.5 font-bold text-indigo-600">{row.designNo}</td>
                          <td className="px-4 py-2.5">{row.sku}</td>
                          <td className="px-4 py-2.5 text-gray-600">{row.category}</td>
                          {sizes.map((s) => {
                            const val = row.sizeCounts[s._id];
                            return (
                              <td key={s._id} className="px-4 py-2.5 text-center">
                                {val === null ? (
                                  <span className="text-gray-300">—</span>
                                ) : (
                                  <span className={`font-bold ${val === 0 ? "text-red-500" : "text-gray-800"}`}>
                                    {val}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {/* GRAND TOTAL */}
                      <tr className="bg-indigo-50/50 border-t-2 border-indigo-100 font-black text-indigo-900">
                        <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-xs">Grand Total Qty</td>
                        {sizes.map((s) => {
                          const totalForSize = rows.reduce((sum, row) => sum + (row.sizeCounts[s._id] || 0), 0);
                          return (
                            <td key={s._id} className="px-4 py-3 text-center text-base">
                              {totalForSize}
                            </td>
                          );
                        })}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {!loading && rows.length > 0 && (
            <div className="flex justify-end">
              <div className="bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-lg shadow-indigo-100 flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80">Overall Total Pieces</span>
                <span className="text-4xl font-black">
                  {rows.reduce((grandSum, row) => {
                    const rowSum = Object.values(row.sizeCounts).reduce((s: number, v: any) => s + (v || 0), 0);
                    return grandSum + rowSum;
                  }, 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: MONTHLY SALES REPORT
          ------------------------------------------------------------- */}
      {activeTab === "sales" && (
        <div className="space-y-6">
          {/* Controls with Custom Date and Customer Filters */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              {/* Customer Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Filter Customer</label>
                <Combobox
                  options={customerOptions}
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  placeholder="Select Customer..."
                  className="w-full text-sm"
                />
              </div>

              {/* Year Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Filter Year</label>
                <Combobox
                  options={yearOptions}
                  value={selectedYear}
                  onChange={(val) => {
                    setSelectedYear(val);
                    setStartDate(""); // clear custom date if year is selected
                    setEndDate("");
                  }}
                  placeholder="Select Year..."
                  className="w-full text-sm"
                />
              </div>

              {/* Start Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSelectedYear(""); // clear year selection
                  }}
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSelectedYear(""); // clear year selection
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {(startDate || endDate || selectedCustomer || selectedYear) && (
                <Button variant="ghost" onClick={handleResetFilters} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4 mr-1" /> Reset
                </Button>
              )}
              <Button variant="outline" onClick={() => fetchSalesData()} disabled={salesLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${salesLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={handleDownloadSales} disabled={!monthlySales.length} className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4 mr-2" /> Download CSV
              </Button>
            </div>
          </div>

          {/* Metric KPI Cards (Indian Currency Layout) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border-gray-100 bg-gradient-to-br from-white to-gray-50/50">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Total Sales Revenue</p>
                  <p className="text-2xl font-black text-indigo-900 mt-1">
                    {formatCurrency(salesSummary?.grandTotalAmount || 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100">
                  <DollarSign className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100 bg-gradient-to-br from-white to-gray-50/50">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Total Pieces Sold</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">
                    {(salesSummary?.totalQty || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Package className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100 bg-gradient-to-br from-white to-gray-50/50">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Invoices / Slips Count</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">
                    {(salesSummary?.totalBills || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                  <Calendar className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100 bg-gradient-to-br from-white to-gray-50/50">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Avg Invoice Value</p>
                  <p className="text-2xl font-black text-indigo-600 mt-1">
                    {formatCurrency(Math.round((salesSummary?.grandTotalAmount || 0) / (salesSummary?.totalBills || 1)))}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          {monthlySales.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend Chart */}
              <Card className="p-6 border-gray-100 shadow-sm">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Monthly Sales Revenue Trend
                </h3>
                <div className="h-[300px]">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="Month" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                        <ChartTooltip formatter={(value: any) => [formatCurrency(value), "Revenue"]} />
                        <Area type="monotone" dataKey="Revenue (₹)" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">Loading chart...</div>
                  )}
                </div>
              </Card>

              {/* Quantity Sold Chart */}
              <Card className="p-6 border-gray-100 shadow-sm">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Monthly Quantity Dispatched (Pieces)
                </h3>
                <div className="h-[300px]">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="Month" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <ChartTooltip formatter={(value: any) => [value, "Pieces Sold"]} />
                        <Bar dataKey="Quantity Sold" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={35} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">Loading chart...</div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Table Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Month</th>
                    <th className="text-center px-4 py-3 font-semibold whitespace-nowrap">Invoices</th>
                    <th className="text-center px-4 py-3 font-semibold whitespace-nowrap">Pieces Sold</th>
                    <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Revenue</th>
                    <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Avg Invoice Value</th>
                  </tr>
                </thead>
                <tbody>
                  {salesLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-gray-400">
                        Loading sales report...
                      </td>
                    </tr>
                  ) : monthlySales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-gray-400">
                        No sales found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {monthlySales.map((m, i) => {
                        const avg = Math.round(m.totalAmount / (m.billCount || 1));
                        return (
                          <tr key={m._id} className={i % 2 === 0 ? "bg-white hover:bg-gray-50/50" : "bg-gray-50 border-y border-gray-100/50 hover:bg-gray-100/50"}>
                            <td className="px-4 py-2.5 font-bold text-indigo-600">{m._id}</td>
                            <td className="px-4 py-2.5 text-center text-gray-700">{m.billCount}</td>
                            <td className="px-4 py-2.5 text-center font-semibold text-gray-800">{m.totalQty}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-green-600">{formatCurrency(m.totalAmount)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(avg)}</td>
                          </tr>
                        );
                      })}
                      {/* Grand Total */}
                      <tr className="bg-indigo-50/50 border-t-2 border-indigo-100 font-black text-indigo-900">
                        <td className="px-4 py-3 text-left">Overall Summary</td>
                        <td className="px-4 py-3 text-center">{salesSummary?.totalBills || 0}</td>
                        <td className="px-4 py-3 text-center">{salesSummary?.totalQty || 0}</td>
                        <td className="px-4 py-3 text-right text-green-700">{formatCurrency(salesSummary?.grandTotalAmount || 0)}</td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(Math.round((salesSummary?.grandTotalAmount || 0) / (salesSummary?.totalBills || 1)))}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 3: PRODUCT SALES DISPATCH REPORT
          ------------------------------------------------------------- */}
      {activeTab === "product-sales" && (
        <div className="space-y-6">
          {/* Controls with customer and custom date ranges */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              {/* Search */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Search Product</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Design, SKU, Code..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Customer dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Customer</label>
                <Combobox
                  options={customerOptions}
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  placeholder="Select Customer..."
                  className="w-full text-xs"
                />
              </div>

              {/* Start Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                  }}
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {(prodSearch || startDate || endDate || selectedCustomer) && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4 mr-1" /> Reset
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => fetchProductSales()} disabled={prodSalesLoading}>
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${prodSalesLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={handleDownloadProdSales} disabled={!productSales.length} className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-3.5 h-3.5 mr-2" /> Download CSV
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Design No</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Product Code</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">SKU</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Category</th>
                    <th className="text-center px-4 py-3 font-semibold whitespace-nowrap">Pieces Sold</th>
                    <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Avg Sale Price</th>
                    <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Total Revenue</th>
                    <th className="text-center px-4 py-3 font-semibold whitespace-nowrap">History</th>
                  </tr>
                </thead>
                <tbody>
                  {prodSalesLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-400">
                        Loading dispatch data...
                      </td>
                    </tr>
                  ) : productSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-400">
                        No product sales found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {productSales.map((p, i) => (
                        <tr key={p._id || i} className={i % 2 === 0 ? "bg-white hover:bg-gray-50/50" : "bg-gray-50 border-y border-gray-100/50 hover:bg-gray-100/50"}>
                          <td className="px-4 py-2.5 font-bold text-indigo-600">{p.designNo}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-700">{p.productCode}</td>
                          <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{p.sku}</td>
                          <td className="px-4 py-2.5 text-gray-600">{p.category}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-indigo-950 text-base">{p.totalQty}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(Math.round(p.avgPrice))}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-green-600">{formatCurrency(p.totalRevenue)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <button onClick={() => fetchProductHistory(p._id, p.productCode, p.designNo)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Customer Sales History">
                              <History className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Grand Total */}
                      <tr className="bg-indigo-50/50 border-t-2 border-indigo-100 font-black text-indigo-900">
                        <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider text-xs">Grand Total</td>
                        <td className="px-4 py-3 text-center text-base">
                          {productSales.reduce((sum, p) => sum + p.totalQty, 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">—</td>
                        <td className="px-4 py-3 text-right text-green-700 text-base">
                          {formatCurrency(productSales.reduce((sum, p) => sum + p.totalRevenue, 0))}
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 4: PENDING STOCK REPORT (FACTORY PENDING ORDERS)
          ------------------------------------------------------------- */}
      {activeTab === "pending-stock" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                placeholder="Search by product, invoice..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold px-3 py-1.5 text-xs flex items-center">
                {pendingData.length} Orders Pending
              </Badge>
              <Button variant="outline" onClick={() => fetchPendingReport()} disabled={pendingLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${pendingLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={handleDownloadPendingSales} disabled={!pendingData.length} className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4 mr-2" /> Download CSV
              </Button>
            </div>
          </div>

          {/* Pending Summary Metrics */}
          {pendingSummary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="bg-amber-100 p-2.5 rounded-lg text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pending Entries</p>
                  <p className="text-xl font-bold text-gray-900">{pendingSummary.totalPendingEntries}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="bg-red-100 p-2.5 rounded-lg text-red-500">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Pending Sets</p>
                  <p className="text-xl font-bold text-red-600">{pendingSummary.totalPendingSets}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Expected</p>
                  <p className="text-xl font-bold text-gray-900">{pendingSummary.totalExpectedSets}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="bg-green-100 p-2.5 rounded-lg text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Received</p>
                  <p className="text-xl font-bold text-green-600">{pendingSummary.totalReceivedSets}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {pendingLoading ? (
              <div className="py-20 text-center text-gray-400 text-sm">Loading pending records...</div>
            ) : pendingData.length === 0 ? (
              <div className="py-20 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No pending stock from factory!</p>
                <p className="text-gray-400 text-sm mt-1">All factory stock orders are complete.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Supplier</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Invoice</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Product</th>
                      <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Expected</th>
                      <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Received</th>
                      <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Pending</th>
                      <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Progress</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingData.map((entry: any) => {
                      const pct = entry.expectedSets > 0
                        ? Math.round((entry.totalSets / entry.expectedSets) * 100)
                        : 100;
                      return (
                        <tr key={entry._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {new Date(entry.entryDate).toLocaleDateString("en-GB")}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {entry.supplier?.name || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                            {entry.invoiceNumber || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-indigo-600">{entry.product?.productCode}</span>
                              <span className="text-[10px] text-gray-400">
                                {entry.product?.sizes?.map((s: any) => s.name).join(", ")}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-gray-700">
                            {entry.expectedSets}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-green-600">{entry.totalSets}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold">
                              {entry.pendingQuantity} sets
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-2 rounded-full bg-indigo-500 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-gray-500 w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {entry.history && entry.history.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {entry.history.map((h: any) => (
                                  <div key={h._id} className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                    <span>{new Date(h.entryDate).toLocaleDateString("en-GB")}</span>
                                    <span className="font-bold text-green-700">+{h.totalSets} sets</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Customer Sales History</h3>
                <p className="text-xs text-gray-500 mt-0.5">{historyProductTitle}</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {historyLoading ? (
                <div className="text-center py-12 text-gray-400">Loading history...</div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No sales history found for this product.</div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer Name</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Pieces Sold</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historyData.map((h: any, idx: number) => (
                        <tr key={h._id || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800">{h.customerName}</div>
                            {h.customerNumber && <div className="text-xs text-gray-500 mt-0.5">{h.customerNumber}</div>}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-indigo-600">{h.totalQty}</td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(h.totalRevenue)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50/50 border-t-2 border-gray-100 font-bold">
                        <td className="px-4 py-3 text-right text-gray-600 uppercase text-xs">Total</td>
                        <td className="px-4 py-3 text-center text-indigo-700">{historyData.reduce((sum: number, h: any) => sum + h.totalQty, 0)}</td>
                        <td className="px-4 py-3 text-right text-green-700">{formatCurrency(historyData.reduce((sum: number, h: any) => sum + h.totalRevenue, 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
