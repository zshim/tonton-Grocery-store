import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Filter, Banknote, Smartphone, Eye, X, Package, Share2, Download } from 'lucide-react';
import { PaymentMethod, Order } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Orders = () => {
  const { orders, users } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const generateInvoicePDF = () => {
      if (!selectedOrder) return;
      
      const customer = users.find(u => u.id === selectedOrder.customerId);
      const doc = new jsPDF();
      
      // Brand
      doc.setTextColor(16, 185, 129); // Emerald 600
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("ton2Store", 14, 20);
      
      doc.setTextColor(100);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("123 Grocery Lane, Market City", 14, 26);
      doc.text("Phone: +91 99999 99999", 14, 31);
      
      // Invoice Info
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 140, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice #: ${selectedOrder.id}`, 140, 26);
      doc.text(`Date: ${new Date(selectedOrder.date).toLocaleDateString()}`, 140, 31);
      
      // Customer Info
      doc.line(14, 35, 196, 35);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", 14, 42);
      doc.setFont("helvetica", "normal");
      doc.text(selectedOrder.customerName, 14, 48);
      if (customer) {
          doc.text(`Phone: ${customer.phone}`, 14, 53);
          if (customer.email) doc.text(customer.email, 14, 58);
      }
      
      // Table
      const tableColumn = ["Item", "Qty", "Unit", "Price", "Total"];
      const tableRows = selectedOrder.items.map(item => [
          item.name,
          item.quantity,
          item.unit,
          `Rs. ${item.price.toFixed(2)}`,
          `Rs. ${(item.price * item.quantity).toFixed(2)}`
      ]);
      
      autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 65,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] }, // Emerald
          styles: { fontSize: 9 },
      });
      
      // Totals
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(10);
      doc.text(`Subtotal:`, 140, finalY);
      doc.text(`Rs. ${selectedOrder.subtotal.toFixed(2)}`, 196, finalY, { align: 'right' });
      
      doc.text(`Tax:`, 140, finalY + 5);
      doc.text(`Rs. ${selectedOrder.tax.toFixed(2)}`, 196, finalY + 5, { align: 'right' });
      
      if (selectedOrder.discount > 0) {
          doc.setTextColor(16, 185, 129);
          doc.text(`Discount:`, 140, finalY + 10);
          doc.text(`- Rs. ${selectedOrder.discount.toFixed(2)}`, 196, finalY + 10, { align: 'right' });
          doc.setTextColor(0);
      }
      
      const totalY = finalY + (selectedOrder.discount > 0 ? 15 : 10);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total:`, 140, totalY);
      doc.text(`Rs. ${selectedOrder.total.toFixed(2)}`, 196, totalY, { align: 'right' });
      
      // Payment Status
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Status: ${selectedOrder.status}`, 14, finalY);
      doc.text(`Paid: Rs. ${selectedOrder.amountPaid.toFixed(2)}`, 14, finalY + 5);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Thank you for shopping with ton2Store!", 105, 280, { align: 'center' });
      
      doc.save(`Invoice_${selectedOrder.id}.pdf`);
  };

  const shareOnWhatsApp = () => {
      if (!selectedOrder) return;
      const customer = users.find(u => u.id === selectedOrder.customerId);
      if (!customer) {
          alert("Customer phone number not found.");
          return;
      }
      
      const message = `Hello ${selectedOrder.customerName}, Here is your invoice for Order #${selectedOrder.id}. Total Amount: Rs. ${selectedOrder.total.toFixed(2)}. Thank you for shopping with ton2Store!`;
      const url = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Order Management</h2>
            <p className="text-slate-500">Track and manage all customer orders.</p>
         </div>
         <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
            <Filter size={18} />
            Filter Status
         </button>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">Order ID</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">Customer</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right whitespace-nowrap">Total</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right whitespace-nowrap">Paid</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center whitespace-nowrap">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center whitespace-nowrap">Payment</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {orders.map(order => (
                 <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-700 whitespace-nowrap">#{order.id}</td>
                    <td className="p-4 text-slate-600 whitespace-nowrap">{order.customerName}</td>
                    <td className="p-4 text-slate-500 text-sm whitespace-nowrap">{new Date(order.date).toLocaleDateString()}</td>
                    <td className="p-4 text-right font-medium text-slate-800 whitespace-nowrap">₹{order.total.toFixed(2)}</td>
                    <td className="p-4 text-right text-slate-600 whitespace-nowrap">₹{order.amountPaid.toFixed(2)}</td>
                    <td className="p-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>
                            {order.status}
                        </span>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      {order.paymentMethod && order.paymentMethod !== 'N/A' && (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
                          order.paymentMethod === PaymentMethod.CASH 
                            ? 'bg-slate-50 border-slate-200 text-slate-600'
                            : 'bg-blue-50 border-blue-100 text-blue-600'
                        }`}>
                          {order.paymentMethod === PaymentMethod.CASH ? <Banknote size={12} /> : <Smartphone size={12} />}
                          {order.paymentMethod === PaymentMethod.CASH ? 'Cash' : 'Online'}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                        <button 
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                            title="View Details"
                        >
                            <Eye size={18} />
                        </button>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
          {orders.length === 0 && (
             <div className="p-12 text-center text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                No orders found.
             </div>
          )}
       </div>

       {/* Order Details Modal */}
       {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl animate-fade-in max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Package className="text-emerald-600" size={24} />
                            Order Details
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            ID: <span className="font-mono font-medium text-slate-700">#{selectedOrder.id}</span>
                            <span className="mx-2">•</span>
                            {new Date(selectedOrder.date).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={shareOnWhatsApp}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
                            title="Share on WhatsApp"
                        >
                            <Share2 size={20} />
                        </button>
                        <button 
                            onClick={generateInvoicePDF}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                            title="Download Invoice"
                        >
                            <Download size={20} />
                        </button>
                        <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-6 space-y-6">
                    {/* Customer & Status Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Customer Information</h4>
                            <p className="font-semibold text-slate-800">{selectedOrder.customerName}</p>
                            <div className="text-sm text-slate-500 mt-1">
                                Customer ID: {selectedOrder.customerId}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Order Status</h4>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Payment Status:</span>
                                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                                        selectedOrder.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                        selectedOrder.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Method:</span>
                                    <span className="font-medium text-slate-800">{selectedOrder.paymentMethod || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Items Purchased</h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-3 font-semibold text-slate-600">Product</th>
                                        <th className="p-3 font-semibold text-slate-600 text-center">Qty</th>
                                        <th className="p-3 font-semibold text-slate-600 text-right">Price</th>
                                        <th className="p-3 font-semibold text-slate-600 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedOrder.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="p-3">
                                                <div className="font-medium text-slate-800">{item.name}</div>
                                                <div className="text-xs text-slate-500">{item.unit}</div>
                                            </td>
                                            <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                                            <td className="p-3 text-right text-slate-600">₹{item.price.toFixed(2)}</td>
                                            <td className="p-3 text-right font-medium text-slate-800">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex justify-end">
                        <div className="w-full sm:w-1/2 bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-100">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Tax (8%)</span>
                                <span>₹{selectedOrder.tax.toFixed(2)}</span>
                            </div>
                            {selectedOrder.discount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>Discount</span>
                                    <span>-₹{selectedOrder.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800 text-lg">
                                <span>Total</span>
                                <span>₹{selectedOrder.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600 pt-1">
                                <span>Amount Paid</span>
                                <span className="font-medium text-emerald-600">₹{selectedOrder.amountPaid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Balance Due</span>
                                <span className={`font-medium ${selectedOrder.total - selectedOrder.amountPaid > 0.1 ? 'text-red-600' : 'text-slate-400'}`}>
                                    ₹{(selectedOrder.total - selectedOrder.amountPaid).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={generateInvoicePDF}
                        className="px-6 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm flex items-center gap-2"
                    >
                        <Download size={16} /> Download Invoice
                    </button>
                    <button 
                        onClick={() => setSelectedOrder(null)}
                        className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
       )}
    </div>
  );
};

export default Orders;