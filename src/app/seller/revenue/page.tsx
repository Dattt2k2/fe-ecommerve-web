'use client';

import SellerRevenueChart from '@/components/seller/SellerRevenueChart';
import Link from 'next/link';
import { TrendingUp, ShoppingBag } from 'lucide-react';

const topProducts = [
	{ name: 'Áo thun nam', sold: 120, revenue: 18000000 },
	{ name: 'Quần jeans nữ', sold: 95, revenue: 14500000 },
	{ name: 'Giày sneaker', sold: 80, revenue: 22000000 },
	{ name: 'Áo khoác', sold: 60, revenue: 9000000 },
	{ name: 'Túi xách', sold: 40, revenue: 7500000 },
];

export default function SellerRevenuePage() {
	// Giả lập dữ liệu, sau này lấy từ API
	const totalRevenue = 93000000;
	const totalSold = 420;

	return (
		<div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
			<h1 className="text-3xl font-bold mb-8 text-blue-900">Quản lý doanh thu</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div className="bg-gradient-to-r from-green-400 to-green-600 rounded-xl shadow-lg p-6 flex items-center gap-4 hover:scale-[1.03] transition-transform">
					<div className="bg-white/30 rounded-full p-3">
						<TrendingUp className="w-8 h-8 text-green-900" />
					</div>
					<div>
						<div className="text-white/80 mb-1">Tổng doanh thu</div>
						<div className="text-3xl font-bold text-white">
							{totalRevenue.toLocaleString('vi-VN')}₫
						</div>
					</div>
				</div>
				<div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl shadow-lg p-6 flex items-center gap-4 hover:scale-[1.03] transition-transform">
					<div className="bg-white/30 rounded-full p-3">
						<ShoppingBag className="w-8 h-8 text-blue-900" />
					</div>
					<div>
						<div className="text-white/80 mb-1">Tổng số lượng hàng đã bán</div>
						<div className="text-3xl font-bold text-white">{totalSold}</div>
					</div>
				</div>
			</div>
			<div className="mb-8">
				<SellerRevenueChart />
			</div>
			<div className="bg-white rounded-xl shadow p-6 mb-8">
				<h2 className="text-xl font-semibold mb-4 text-purple-700">
					Top sản phẩm bán chạy
				</h2>
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="bg-purple-50 text-purple-700">
								<th className="py-2 px-4 text-left">Sản phẩm</th>
								<th className="py-2 px-4 text-center">Đã bán</th>
								<th className="py-2 px-4 text-right">Doanh thu</th>
							</tr>
						</thead>
						<tbody>
							{topProducts.map((p, idx) => (
								<tr
									key={p.name}
									className={
										idx % 2 === 0 ? 'bg-white' : 'bg-purple-50'
									}
								>
									<td className="py-2 px-4 font-medium text-gray-900">
										{p.name}
									</td>
									<td className="py-2 px-4 text-center text-blue-700 font-bold">
										{p.sold}
									</td>
									<td className="py-2 px-4 text-right text-green-700 font-bold">
										{p.revenue.toLocaleString('vi-VN')}₫
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			<div className="mt-4">
				<Link
					href="/seller/products"
					className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 font-semibold transition"
				>
					Quản lý sản phẩm
				</Link>
			</div>
		</div>
	);
}
