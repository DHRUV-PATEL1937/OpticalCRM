import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingCart, AlertTriangle, Users, TrendingUp, TrendingDown, Package, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, chartRes, topRes, recentRes, alertsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getSalesChart(7),
        dashboardAPI.getTopProducts(),
        dashboardAPI.getRecentSales(),
        dashboardAPI.getAlerts(),
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data);
      setTopProducts(topRes.data);
      setRecentSales(recentRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const kpiCards = [
    { label: "Today's Sales", value: formatCurrency(stats?.todaySales), icon: DollarSign, color: 'from-emerald-500 to-emerald-600', orders: `${stats?.todayOrders || 0} orders` },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: ShoppingCart, color: 'from-amber-500 to-orange-500', sub: 'Needs attention' },
    { label: 'Low Stock Items', value: stats?.lowStockCount || 0, icon: AlertTriangle, color: 'from-red-500 to-rose-500', sub: 'Below threshold' },
    { label: 'Total Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'from-blue-500 to-indigo-500', sub: 'Active accounts' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-surface-500 text-sm mt-0.5">Overview of your optical business</p>
        </div>
        <Button onClick={() => navigate('/create-bill')} size="lg" icon={ShoppingCart}>
          Create Bill
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => (
          <Card key={idx} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${kpi.color} opacity-10 rounded-bl-[60px] transition-all duration-300 group-hover:opacity-20`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-surface-900 mt-1">{kpi.value}</p>
                <p className="text-xs text-surface-400 mt-1">{kpi.orders || kpi.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Overview (7 Days)</CardTitle>
          </CardHeader>
          <div className="h-64 min-h-[256px] w-full min-w-0">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={(d) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}`; }} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Sales']} labelFormatter={(l) => formatDate(l)} />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-surface-400 text-sm">
                No sales data available for this period.
              </div>
            )}
          </div>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-8">No sales data yet</p>
            ) : (
              topProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 transition-colors">
                  <span className="text-xs font-bold text-surface-400 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 truncate">{p.name}</p>
                    <p className="text-xs text-surface-400">{p.totalQty} sold</p>
                  </div>
                  <p className="text-sm font-semibold text-surface-700">{formatCurrency(p.totalRevenue)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Sales + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/sales')}>
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-500 border-b border-surface-100">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-surface-400">No sales yet. Create your first bill!</td></tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale._id} className="border-b border-surface-50 hover:bg-surface-50 cursor-pointer" onClick={() => navigate(`/sales/${sale._id}`)}>
                      <td className="py-3 font-medium text-primary-600">{sale.invoiceNumber}</td>
                      <td className="py-3 text-surface-700">{sale.customerName}</td>
                      <td className="py-3 font-semibold">{formatCurrency(sale.grandTotal)}</td>
                      <td className="py-3">
                        <Badge color={sale.status === 'completed' ? 'success' : sale.status === 'pending' ? 'warning' : 'danger'}>
                          {sale.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Action Center</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {alerts?.lowStock?.length > 0 && (
              <div className="p-3 bg-danger-50 rounded-xl border border-danger-100">
                <p className="text-sm font-medium text-danger-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Low Stock Alert
                </p>
                {alerts.lowStock.map((p) => (
                  <p key={p._id} className="text-xs text-danger-500 mt-1 ml-6">
                    {p.name} — {p.stockQuantity} left
                  </p>
                ))}
              </div>
            )}

            {alerts?.pendingSales?.length > 0 && (
              <div className="p-3 bg-warning-50 rounded-xl border border-amber-100">
                <p className="text-sm font-medium text-warning-600 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Pending Payments
                </p>
                {alerts.pendingSales.map((s) => (
                  <p key={s._id} className="text-xs text-warning-500 mt-1 ml-6">
                    {s.invoiceNumber} — {formatCurrency(s.balanceDue)} due
                  </p>
                ))}
              </div>
            )}

            {alerts?.upcomingBirthdays?.length > 0 && (
              <div className="p-3 bg-primary-50 rounded-xl border border-primary-100">
                <p className="text-sm font-medium text-primary-600 flex items-center gap-2 mb-2">
                  🎂 Upcoming Birthdays
                </p>
                {alerts.upcomingBirthdays.map((c) => {
                  const shopName = 'Shiv Chashma Ghar';
                  const bdayMsg = `Dear *${c.name}*,\n\n🎂🎉 *Happy Birthday!* 🎉🎂\n\nWishing you a wonderful day filled with joy and happiness!\n\nAs a token of our appreciation, visit *${shopName}* for a special birthday surprise!\n\nWarm regards,\n*${shopName}* Team`;
                  const cleanPhone = (c.phone || '').replace(/\D/g, '');
                  const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
                  const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(bdayMsg)}`;
                  return (
                    <div key={c._id} className="flex items-center justify-between mt-1 ml-6">
                      <div>
                        <p className="text-xs text-primary-700 font-medium">{c.name}</p>
                        <p className="text-[10px] text-primary-400">{formatDate(c.dateOfBirth)}</p>
                      </div>
                      {c.phone && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 bg-[#25D366] hover:bg-[#1da851] text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                        >
                          🎉 Send Wish
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {(!alerts?.lowStock?.length && !alerts?.pendingSales?.length && !alerts?.upcomingBirthdays?.length) && (
              <p className="text-sm text-surface-400 text-center py-6">✨ All clear! No pending actions.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
