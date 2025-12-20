'use client';

import { useState, useEffect } from 'react';
import SellerRevenueChart from '@/components/seller/SellerRevenueChart';
import { TrendingUp, ShoppingBag, Package, Users, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { ordersAPI, productsAPI, usersAPI, adminAPI } from '@/lib/api';

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

	const [totalProducts, setTotalProducts] = useState(0);
	const [productsChange, setProductsChange] = useState(0);
	const [topProducts, setTopProducts] = useState<Array<{ name: string; sold: number; revenue: number }>>([]);

	const [totalCustomers, setTotalCustomers] = useState(0);
	const [customersChange, setCustomersChange] = useState(0);

	const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
	const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

	const [chartData, setChartData] = useState<Array<{ month: string; revenue: number }>>([]);
	
	// State cho thông tin doanh thu chi tiết
	const [averageRevenuePerOrder, setAverageRevenuePerOrder] = useState(0);
	const [revenueDifference, setRevenueDifference] = useState(0);
	
	// State cho top customers
	const [topCustomers, setTopCustomers] = useState<Array<{
		user_id: string;
		user_name?: string;
		user_email?: string;
		total_orders: number;
		total_spent: number;
		total_revenue: number;
		last_order_date: string;
	}>>([]);

	useEffect(() => {
		const fetchStatistics = async () => {
			try {
				setLoading(true);
				setError(null);
				console.log('[SellerStatistics] Fetching statistics...');
				
				// Fetch orders statistics
				const ordersStats = await ordersAPI.getStatistics(selectedMonth, selectedYear);
				
				// Cập nhật dữ liệu từ orders API
				const currentRevenue = Number(ordersStats.total_revenue) || 0;
				const currentOrders = Number(ordersStats.total_orders) || 0;
				const prevRevenue = Number(ordersStats.previous_revenue) || 0;
				
				setTotalRevenue(currentRevenue);
				setTotalSold(currentOrders);
				setRevenueChange(Number(ordersStats.revenue_growth) || 0);
				setOrdersChange(Number(ordersStats.order_growth) || 0);
				setCurrentMonth(ordersStats.month || new Date().getMonth() + 1);
				setCurrentYear(ordersStats.year || new Date().getFullYear());
				setPreviousRevenue(prevRevenue);
				
				// Tính toán thông tin doanh thu chi tiết
				const avgRevenue = currentOrders > 0 ? currentRevenue / currentOrders : 0;
				setAverageRevenuePerOrder(avgRevenue);
				setRevenueDifference(currentRevenue - prevRevenue);
				
				if (ordersStats.top_products && ordersStats.top_products.length > 0) {
					const topSelling = ordersStats.top_products.
					filter(p => p.name !== null).
					map(p => ({
						name: p.name,
						sold: p.total_quantity || 0,
						revenue: p.total_revenue || 0
					}))
					setTopProducts(topSelling);
				} else {
					setTopProducts([]);
				}
				
				try {
					const productsStats = await productsAPI.getStatistics(selectedMonth, selectedYear);
					console.log('[SellerStatistics] Products statistics received:', productsStats);
					
					if (productsStats.data) {
						setTotalProducts(productsStats.data.total_products || 0);
						setProductsChange(productsStats.data.growth_percentage || 0);
						
					}
					
				} catch (productErr: any) {
					console.error('[SellerStatistics] Failed to fetch product statistics:', productErr);
				}

				try {
					const usersStats = await usersAPI.getUserStatistics(selectedMonth, selectedYear);
					console.log('[SellerStatistics] Users statistics received:', usersStats);
					setTotalCustomers(usersStats.current_month_users || 0);
					setCustomersChange(usersStats.growth_percentage || 0);
				} catch (usersErr: any) {
					console.error('[SellerStatistics] Failed to fetch users statistics:', usersErr);
				}

				try {
					const revenueStats = await ordersAPI.getRevenue(selectedMonth, selectedYear);
					if (revenueStats.revenues && Array.isArray(revenueStats.revenues)) {
						setChartData(revenueStats.revenues.map(r => ({
							month: monthNames[r.month - 1],
							revenue: r.revenue
						})));
					}
				} catch (revenueErr: any) {
					console.error('[SellerStatistics] Failed to fetch revenue statistics:', revenueErr);
				}

				// Fetch top customers
				try {
					const topCustomersResponse: any = await ordersAPI.getTopCustomers(10, selectedMonth, selectedYear);
					console.log('[SellerStatistics] Top customers received:', topCustomersResponse);
					
					// Handle different response structures
					let topCustomersData: Array<{
						user_id: string;
						total_orders: number;
						total_spent: number;
						total_revenue: number;
						last_order_date: string;
					}> = [];
					
					if (Array.isArray(topCustomersResponse)) {
						topCustomersData = topCustomersResponse;
					} else if (topCustomersResponse && typeof topCustomersResponse === 'object') {
						topCustomersData = (topCustomersResponse as any).data || 
										   (topCustomersResponse as any).customers || 
										   (topCustomersResponse as any).top_customers || 
										   [];
					}
					
					// Fetch user info for each customer
					const customersWithUserInfo = await Promise.all(
						topCustomersData.map(async (customer) => {
							try {
								const userInfo = await adminAPI.getUserById(customer.user_id);
								const user = userInfo.user || userInfo;
								
								// Build user name from first_name and last_name
								let userName = 'Khách hàng';
								if (user?.first_name || user?.last_name) {
									const nameParts = [user?.first_name, user?.last_name].filter(Boolean);
									userName = nameParts.join(' ').trim() || 'Khách hàng';
								} else if (user?.name) {
									userName = user.name;
								}
								
								return {
									...customer,
									user_name: userName,
									user_email: user?.email || ''
								};
							} catch (err) {
								console.error(`[SellerStatistics] Failed to fetch user info for ${customer.user_id}:`, err);
								return {
									...customer,
									user_name: 'Khách hàng',
									user_email: ''
								};
							}
						})
					);
					
					setTopCustomers(customersWithUserInfo);
				} catch (customersErr: any) {
					console.error('[SellerStatistics] Failed to fetch top customers:', customersErr);
					setTopCustomers([]);
				}
			} catch (err: any) {
				console.error('[SellerStatistics] Failed to fetch statistics:', err);
				setError(`Không thể tải dữ liệu thống kê: ${err.message || 'Unknown error'}`);
			} finally {
				setLoading(false);
			}
		};

		fetchStatistics();
	}, [selectedYear, selectedMonth]);

	const months = Array.from({ length: 12 }, (_, i) => i + 1);
	const currentYearValue = new Date().getFullYear();
	const years = Array.from({ length: 5 }, (_, i) => currentYearValue - i);
	
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

	const monthNames = [
		'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
		'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
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

			<div className="mb-6">
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-2">
						<label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tháng:</label>
						<select
							value={selectedMonth ?? ''}
							onChange={(e) => {
								const value = e.target.value;
								if (value) {
									setSelectedMonth(parseInt(value));
								} else {
									setSelectedMonth(0);
								}
							}}
							className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="">Tất cả các tháng</option>
							{monthNames.map((month, idx) => (
								<option key={idx + 1} value={idx + 1}>
									{month}
								</option>
							))}
						</select>
					</div>
					<div className="flex items-center gap-2">
						<label className="text-sm font-medium text-gray-700 dark:text-gray-300">Năm:</label>
						<select
							value={selectedYear ?? ''}
							onChange={(e) => {
								const value = e.target.value;
								if (value) {
									setSelectedYear(parseInt(value));
								}
							}}
							className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="">Tất cả các năm</option>
							{years.map((year) => (
								<option key={year} value={year}>
									{year}
								</option>
							))}
						</select>
					</div>
					<button
						onClick={() => {
							setSelectedMonth(new Date().getMonth() + 1);
							setSelectedYear(new Date().getFullYear());
						}}
						className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
					>
						Đặt lại
					</button>
				</div>
			</div>

			{/* Stats Cards */}
			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
					{[...Array(4)].map((_, i) => (
						<div key={i} className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl shadow-lg p-6 animate-pulse">
							<div className="h-24 bg-white/30 rounded"></div>
						</div>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 w-full">
					{stats.map((stat, index) => {
						const Icon = stat.icon;
						const isPositive = stat.change >= 0;
						return (
							<div
								key={index}
								className={`bg-gradient-to-r ${stat.color} rounded-xl shadow-lg p-5 md:p-6 flex items-center gap-4 hover:scale-[1.02] transition-transform`}
							>
								<div className="bg-white/30 rounded-full p-2.5 md:p-3 flex-shrink-0">
									<Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="text-white/80 mb-1 text-xs md:text-sm font-medium truncate">{stat.title}</div>
									<div className="text-base md:text-lg lg:text-xl font-bold text-white mb-1">{stat.value}</div>
									<div className={`flex items-center gap-1 text-[10px] md:text-xs ${isPositive ? 'text-green-100' : 'text-red-100'}`}>
										{isPositive ? (
											<ArrowUp className="w-3 h-3 flex-shrink-0" />
										) : (
											<ArrowDown className="w-3 h-3 flex-shrink-0" />
										)}
										<span className="truncate">{Math.abs(stat.change)}% so với tháng trước</span>
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
					chartData={chartData}
					loading={loading}
				/>
			</div>

			{/* Revenue Details Section */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
					<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
						Chi tiết doanh thu
					</h2>
					<div className="space-y-4">
						<div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
							<span className="text-gray-600 dark:text-gray-400">Doanh thu trung bình/đơn:</span>
							<span className="text-lg font-bold text-green-600 dark:text-green-400">
								{totalSold > 0 
									? (totalRevenue / totalSold).toLocaleString('vi-VN') + '₫'
									: '0₫'
								}
							</span>
						</div>
						<div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
							<span className="text-gray-600 dark:text-gray-400">Doanh thu tháng trước:</span>
							<span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
								{previousRevenue.toLocaleString('vi-VN')}₫
							</span>
						</div>
						<div className="flex justify-between items-center py-3">
							<span className="text-gray-600 dark:text-gray-400">Chênh lệch so với tháng trước:</span>
							<span className={`text-lg font-bold ${revenueDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
								{revenueDifference >= 0 ? '+' : ''}{revenueDifference.toLocaleString('vi-VN')}₫
							</span>
						</div>
						{totalSold > 0 && (
							<div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
								<div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tổng số đơn hàng:</div>
								<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
									{totalSold.toLocaleString()} đơn
								</div>
							</div>
						)}
					</div>
				</div>
				
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
					<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
						Tổng quan doanh thu
					</h2>
					<div className="space-y-4">
						<div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
							<div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tổng doanh thu hiện tại</div>
							<div className="text-3xl font-bold text-green-600 dark:text-green-400">
								{totalRevenue.toLocaleString('vi-VN')}₫
							</div>
							<div className="mt-2 flex items-center gap-2">
								{revenueChange >= 0 ? (
									<ArrowUp className="w-4 h-4 text-green-600" />
								) : (
									<ArrowDown className="w-4 h-4 text-red-600" />
								)}
								<span className={`text-sm font-semibold ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
									{Math.abs(revenueChange)}% so với tháng trước
								</span>
							</div>
						</div>
						{totalSold > 0 && (
							<div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
								<div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Giá trị đơn hàng trung bình</div>
								<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
									{(totalRevenue / totalSold).toLocaleString('vi-VN')}₫
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									({totalRevenue.toLocaleString('vi-VN')}₫ ÷ {totalSold} đơn)
								</div>
							</div>
						)}
					</div>
				</div>
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

			{/* Top Customers */}
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
						Top khách hàng
					</h2>
				</div>
				{topCustomers.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
									<th className="py-3 px-4 text-left font-semibold">STT</th>
									<th className="py-3 px-4 text-left font-semibold">Khách hàng</th>
									<th className="py-3 px-4 text-center font-semibold">Số đơn hàng</th>
									<th className="py-3 px-4 text-right font-semibold">Tổng đã chi</th>
									<th className="py-3 px-4 text-right font-semibold">Lợi nhuận</th>
									<th className="py-3 px-4 text-right font-semibold">Đơn hàng cuối</th>
								</tr>
							</thead>
							<tbody>
								{topCustomers.map((customer, idx) => {
									const lastOrderDate = customer.last_order_date 
										? new Date(customer.last_order_date).toLocaleDateString('vi-VN')
										: '-';
									return (
										<tr
											key={customer.user_id}
											className={
												idx % 2 === 0
													? 'bg-white dark:bg-gray-800'
													: 'bg-gray-50 dark:bg-gray-700'
											}
										>
											<td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400 font-medium">
												{idx + 1}
											</td>
											<td className="py-3 px-4">
												<div className="font-medium text-gray-900 dark:text-white">
													{customer.user_name}
												</div>
												{customer.user_email && (
													<div className="text-xs text-gray-500 dark:text-gray-400">
														{customer.user_email}
													</div>
												)}
											</td>
											<td className="py-3 px-4 text-center text-blue-700 dark:text-blue-400 font-bold">
												{Number(customer.total_orders).toLocaleString('vi-VN')}
											</td>
											<td className="py-3 px-4 text-right text-green-700 dark:text-green-400 font-bold">
												{Number(customer.total_spent).toLocaleString('vi-VN')}₫
											</td>
											<td className="py-3 px-4 text-right text-orange-700 dark:text-orange-400 font-semibold">
												{Number(customer.total_revenue).toLocaleString('vi-VN')}₫
											</td>
											<td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 text-xs">
												{lastOrderDate}
											</td>
										</tr>
									);
								})}
							</tbody>
							<tfoot>
								<tr className="bg-gray-100 dark:bg-gray-700 border-t-2 border-gray-300 dark:border-gray-600">
									<td colSpan={2} className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
										Tổng cộng:
									</td>
									<td className="py-3 px-4 text-center font-bold text-blue-700 dark:text-blue-400">
										{topCustomers.reduce((sum, c) => sum + Number(c.total_orders), 0).toLocaleString('vi-VN')}
									</td>
									<td className="py-3 px-4 text-right font-bold text-green-700 dark:text-green-400">
										{topCustomers.reduce((sum, c) => sum + Number(c.total_spent), 0).toLocaleString('vi-VN')}₫
									</td>
									<td className="py-3 px-4 text-right font-bold text-orange-700 dark:text-orange-400">
										{topCustomers.reduce((sum, c) => sum + Number(c.total_revenue), 0).toLocaleString('vi-VN')}₫
									</td>
									<td className="py-3 px-4"></td>
								</tr>
							</tfoot>
						</table>
					</div>
				) : (
					<div className="text-center py-8 text-gray-500 dark:text-gray-400">
						<p>Chưa có dữ liệu khách hàng</p>
					</div>
				)}
			</div>

		</div>
	);
}

