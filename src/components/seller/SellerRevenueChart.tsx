'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChartDataItems {
  month: string;
  revenue: number;
}

interface SellerRevenueChartProps {
  chartData: ChartDataItems[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-300 dark:border-gray-600 rounded shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <p className="text-blue-600 dark:text-blue-400">
          <span className="font-medium">Doanh thu: </span>
          <span className="font-bold">{payload[0].value.toLocaleString('vi-VN')}₫</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function SellerRevenueChart({ 
  chartData,
  loading = false 
}: SellerRevenueChartProps) {
  // Debug: log dữ liệu để kiểm tra
  console.log('[SellerRevenueChart] chartData:', chartData);
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Biểu đồ doanh thu theo tháng</h2>
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        </div>
      ) : !chartData || chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>Chưa có dữ liệu doanh thu</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
