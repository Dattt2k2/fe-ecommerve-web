import { redirect } from 'next/navigation'

export default function SellerHome() {
  // Always redirect the seller root to the inventory management page
  redirect('/seller/inventory')
}
