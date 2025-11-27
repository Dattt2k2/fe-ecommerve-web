'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface SellerRevenueChartProps {
  currentRevenue: number;
  previousRevenue: number;
  currentMonth: number;
  currentYear: number;
  loading?: boolean;
}

const monthNames = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

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
  currentRevenue,
  previousRevenue,
  currentMonth,
  currentYear,
  loading = false 
}: SellerRevenueChartProps) {
  // Tạo dữ liệu cho 6 tháng gần nhất dựa trên tháng hiện tại
  const generateChartData = () => {
    const data = [];
    const current = new Date(currentYear, currentMonth - 1);
    
    // Tạo dữ liệu cho 6 tháng gần nhất (từ 5 tháng trước đến tháng hiện tại)
    for (let i = 5; i >= 0; i--) {
      const date = new Date(current);
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthName = monthNames[month - 1];
      
      if (month === currentMonth && year === currentYear) {
        data.push({
          month: monthName,
          revenue: currentRevenue || 0
        });
      }
      else if (i === 5 && previousRevenue > 0) {
        data.push({
          month: monthName,
          revenue: previousRevenue
        });
      }
      else {
        if (previousRevenue > 0 && currentRevenue > 0) {
          const growthRate = (currentRevenue - previousRevenue) / previousRevenue;
          const monthsAgo = 5 - i;
          const estimatedRevenue = previousRevenue * Math.pow(1 + growthRate, monthsAgo / 5);
          data.push({
            month: monthName,
            revenue: Math.max(0, estimatedRevenue)
          });
        } else {
          data.push({
            month: monthName,
            revenue: 0
          });
        }
      }
    }
    
    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Biểu đồ doanh thu theo tháng</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
