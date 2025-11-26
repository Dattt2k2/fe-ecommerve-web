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
      
      // Tháng hiện tại - dùng dữ liệu từ API
      if (month === currentMonth && year === currentYear) {
        data.push({
          month: monthName,
          revenue: currentRevenue || 0
        });
      }
      // Tháng trước - dùng previous_revenue từ API
      else if (i === 5 && previousRevenue > 0) {
        data.push({
          month: monthName,
          revenue: previousRevenue
        });
      }
      // Các tháng khác - ước tính dựa trên xu hướng hoặc để 0
      else {
        // Nếu có cả previous và current, tính xu hướng
        if (previousRevenue > 0 && currentRevenue > 0) {
          const growthRate = (currentRevenue - previousRevenue) / previousRevenue;
          const monthsAgo = 5 - i;
          // Ước tính dựa trên xu hướng tăng trưởng
          const estimatedRevenue = previousRevenue * Math.pow(1 + growthRate, monthsAgo / 5);
          data.push({
            month: monthName,
            revenue: Math.max(0, estimatedRevenue)
          });
        } else {
          // Nếu không có dữ liệu, để 0
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
          <Tooltip formatter={(value: number) => value.toLocaleString('vi-VN') + '₫'} />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
