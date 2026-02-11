import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Search } from 'lucide-react';

const Shop = () => {
  const { products, addToCart } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Shop Groceries</h2>
          <p className="text-slate-500">Fresh quality products for your daily needs.</p>
        </div>
        
        <div className="relative w-full md:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
           <input 
             type="text" 
             placeholder="Search for items..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all"
           />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
         <div className="text-center py-16">
            <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600">No products found</h3>
            <p className="text-slate-400">Try searching for something else like "Milk" or "Rice"</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const isDiscounted = product.originalPrice && product.originalPrice > product.price;
            const discountPercent = isDiscounted 
              ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) 
              : 0;
            const savingAmount = isDiscounted ? (product.originalPrice! - product.price).toFixed(2) : 0;

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow relative group">
                {isDiscounted && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10">
                    {discountPercent}% OFF
                  </div>
                )}
                
                <div className="h-48 bg-slate-100 relative">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-semibold text-slate-700 shadow-sm">
                    {product.category}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 line-clamp-1">{product.name}</h3>
                    <div className="text-right">
                      {isDiscounted && (
                        <span className="block text-xs line-through text-slate-400">₹{product.originalPrice!.toFixed(2)}</span>
                      )}
                      <span className="font-bold text-emerald-600">₹{product.price.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {isDiscounted && (
                     <div className="text-right mb-2">
                         <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                             Save ₹{savingAmount}
                         </span>
                     </div>
                  )}

                  <p className="text-xs text-slate-500 mb-4 h-10 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                     <span className="text-xs text-slate-400">per {product.unit}</span>
                     <button 
                      onClick={() => addToCart(product)}
                      className="bg-emerald-50 text-emerald-700 p-2 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                     >
                       <Plus size={20} />
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Shop;