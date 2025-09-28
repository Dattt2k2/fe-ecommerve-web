export default function SellerOrders() {
  const orders = [
    { id: '#S-001', customer: 'Nguyen A', total: 199000, status: 'pending' },
    { id: '#S-002', customer: 'Tran B', total: 299000, status: 'shipped' },
  ];

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Đơn hàng</h2>
      <div className="bg-white rounded shadow">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Mã</th>
              <th className="p-3">Khách</th>
              <th className="p-3">Tổng</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="p-3 font-medium">{o.id}</td>
                <td className="p-3">{o.customer}</td>
                <td className="p-3">{o.total.toLocaleString()}₫</td>
                <td className="p-3"><span className={`inline-block px-2 py-1 rounded ${getStatusColor(o.status)}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

