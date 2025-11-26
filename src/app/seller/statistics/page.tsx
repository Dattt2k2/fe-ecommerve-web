'use client';

import { useState, useEffect } from 'react';
import SellerRevenueChart from '@/components/seller/SellerRevenueChart';
import { TrendingUp, ShoppingBag, Package, Users, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { ordersAPI, productsAPI } from '@/lib/api';

export default function SellerStatisticsPage() {
	// State cho dữ liệu từ API
	const [totalRevenue, setTotalRevenue] = useState(0);
	const [totalSold, setTotalSold] = useState(0);
	const [revenueChange, setRevenueChange] = useState(0);
	const [ordersChange, setOrdersChange] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
	const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
	const [previousRevenue, setPreviousRevenue] = useState(0);

	// State cho product statistics
	const [totalProducts, setTotalProducts] = useState(0);
	const [productsChange, setProductsChange] = useState(0);
	const [topProducts, setTopProducts] = useState<Array<{ name: string; sold: number; revenue: number }>>([]);

	// State cho customer statistics (chưa có API)
	const [totalCustomers, setTotalCustomers] = useState(0);
	const [customersChange, setCustomersChange] = useState(0);

	// Fetch statistics from API
	useEffect(() => {
		const fetchStatistics = async () => {
			try {
				setLoading(true);
				setError(null);
				console.log('[SellerStatistics] Fetching statistics...');
				
				// Fetch orders statistics
				const ordersStats = await ordersAPI.getStatistics();
				console.log('[SellerStatistics] Orders statistics received:', ordersStats);
				
				// Cập nhật dữ liệu từ orders API
				setTotalRevenue(ordersStats.total_revenue || 0);
				setTotalSold(ordersStats.total_orders || 0);
				setRevenueChange(ordersStats.revenue_growth || 0);
				setOrdersChange(ordersStats.order_growth || 0);
				setCurrentMonth(ordersStats.month || new Date().getMonth() + 1);
				setCurrentYear(ordersStats.year || new Date().getFullYear());
				setPreviousRevenue(ordersStats.previous_revenue || 0);
				
				// Fetch products statistics
				try {
					const productsStats = await productsAPI.getStatistics();
					console.log('[SellerStatistics] Products statistics received:', productsStats);
					
					if (productsStats.data) {
						// Cập nhật tổng số sản phẩm
						setTotalProducts(productsStats.data.total_products || 0);
						setProductsChange(productsStats.data.growth_percentage || 0);
						
						// Cập nhật top selling products
						const topSelling = productsStats.data.top_selling_products
							.filter((p): p is { name: string; price: number; product_id: string; sold_count: number } => p !== null)
							.map(p => ({
								name: p.name,
								sold: p.sold_count || 0,
								revenue: (p.price || 0) * (p.sold_count || 0)
							}))
							.sort((a, b) => b.sold - a.sold)
							.slice(0, 5); // Lấy top 5
						
						if (topSelling.length > 0) {
							setTopProducts(topSelling);
						}
					}
				} catch (productErr: any) {
					console.error('[SellerStatistics] Failed to fetch product statistics:', productErr);
				}
			} catch (err: any) {
				console.error('[SellerStatistics] Failed to fetch statistics:', err);
				setError(`Không thể tải dữ liệu thống kê: ${err.message || 'Unknown error'}`);
			} finally {
				setLoading(false);
			}
		};

		fetchStatistics();
	}, []);

	const stats = [
		{
			title: 'Tổng doanh thu',
			value: totalRevenue.toLocaleString('vi-VN') + '₫',
			change: revenueChange,
			icon: DollarSign,
			color: 'from-green-400 to-green-600',
		},
		{
			title: 'Đơn hàng',
			value: totalSold.toLocaleString(),
			change: ordersChange,
			icon: ShoppingBag,
			color: 'from-blue-400 to-blue-600',
		},
		{
			title: 'Sản phẩm',
			value: totalProducts.toLocaleString(),
			change: productsChange,
			icon: Package,
			color: 'from-purple-400 to-purple-600',
		},
		{
			title: 'Khách hàng',
			value: totalCustomers.toLocaleString(),
			change: customersChange,
			icon: Users,
			color: 'from-orange-400 to-orange-600',
		},
	];

	return (
		<div className="max-w-7xl mx-auto">
			<div className="mb-6">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thống kê bán hàng</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-2">Tổng quan về hiệu suất bán hàng của bạn</p>
				{error && (
					<div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
						<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
					</div>
				)}
			</div>

			{/* Stats Cards */}
			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					{[...Array(4)].map((_, i) => (
						<div key={i} className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl shadow-lg p-6 animate-pulse">
							<div className="h-24 bg-white/30 rounded"></div>
						</div>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					{stats.map((stat, index) => {
						const Icon = stat.icon;
						const isPositive = stat.change >= 0;
						return (
							<div
								key={index}
								className={`bg-gradient-to-r ${stat.color} rounded-xl shadow-lg p-6 flex items-center gap-4 hover:scale-[1.02] transition-transform`}
							>
								<div className="bg-white/30 rounded-full p-3">
									<Icon className="w-8 h-8 text-white" />
								</div>
								<div className="flex-1">
									<div className="text-white/80 mb-1 text-sm">{stat.title}</div>
									<div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
									<div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-100' : 'text-red-100'}`}>
										{isPositive ? (
											<ArrowUp className="w-3 h-3" />
										) : (
											<ArrowDown className="w-3 h-3" />
										)}
										<span>{Math.abs(stat.change)}% so với tháng trước</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Revenue Chart */}
			<div className="mb-8">
				<SellerRevenueChart 
					currentRevenue={totalRevenue}
					previousRevenue={previousRevenue}
					currentMonth={currentMonth}
					currentYear={currentYear}
					loading={loading}
				/>
			</div>

			{/* Top Products */}
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
				<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
					Top sản phẩm bán chạy
				</h2>
				{topProducts.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
									<th className="py-3 px-4 text-left font-semibold">Sản phẩm</th>
									<th className="py-3 px-4 text-center font-semibold">Đã bán</th>
									<th className="py-3 px-4 text-right font-semibold">Doanh thu</th>
								</tr>
							</thead>
							<tbody>
								{topProducts.map((p, idx) => (
									<tr
										key={p.name}
										className={
											idx % 2 === 0
												? 'bg-white dark:bg-gray-800'
												: 'bg-gray-50 dark:bg-gray-700'
										}
									>
										<td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
											{p.name}
										</td>
										<td className="py-3 px-4 text-center text-blue-700 dark:text-blue-400 font-bold">
											{p.sold}
										</td>
										<td className="py-3 px-4 text-right text-green-700 dark:text-green-400 font-bold">
											{p.revenue.toLocaleString('vi-VN')}₫
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="text-center py-8 text-gray-500 dark:text-gray-400">
						<p>Chưa có dữ liệu sản phẩm bán chạy</p>
					</div>
				)}
			</div>

		</div>
	);
}

