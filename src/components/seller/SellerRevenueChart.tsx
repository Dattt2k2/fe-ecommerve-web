'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const data = [
  { month: 'Tháng 1', revenue: 12000000 },
  { month: 'Tháng 2', revenue: 15000000 },
  { month: 'Tháng 3', revenue: 9000000 },
  { month: 'Tháng 4', revenue: 18000000 },
  { month: 'Tháng 5', revenue: 22000000 },
  { month: 'Tháng 6', revenue: 17000000 },
];

export default function SellerRevenueChart() {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Biểu đồ doanh thu theo tháng</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toLocaleString('vi-VN') + '₫'} />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
