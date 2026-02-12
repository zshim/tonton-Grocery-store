import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { generateProductDescription } from '../../services/geminiService';
import { Plus, Wand2, Search, Upload, Image as ImageIcon, X, Camera, Tag, Calculator, Percent, Edit2, Grid, List as ListIcon, LayoutGrid } from 'lucide-react';

const Products = () => {
  const { products, addProduct, updateProduct, applyDiscount } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Discount Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountProduct, setDiscountProduct] = useState<Product | null>(null);
  const [newDiscountPrice, setNewDiscountPrice] = useState<string>('');
  
  // Refs & State for Image Handling
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Form State
  const [newItem, setNewItem] = useState<Partial<Product>>({
    name: '',
    category: '',
    price: 0,
    originalPrice: 0, // Used as MRP
    stock: 0,
    unit: 'pc',
    description: '',
    imageUrl: ''
  });

  // Specific state for the pricing calculator in the form
  const [priceForm, setPriceForm] = useState({
    mrp: '',
    discountPercent: '',
    sellingPrice: ''
  });

  const [generatingDesc, setGeneratingDesc] = useState(false);
  
  // 1. Get Unique Categories for Filter Tabs
  const categories = useMemo(() => {
    const uniqueCats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(uniqueCats).sort()];
  }, [products]);

  // 2. Extensive Predefined Categories for "Add Product" + Custom ones
  const PREDEFINED_CATEGORIES = [
    "Fruits", "Vegetables", "Dairy & Milk", "Bakery", "Eggs & Meat", 
    "Grains & Rice", "Spices & Masalas", "Oil & Ghee", "Snacks & Chips", 
    "Beverages", "Instant Food", "Household", "Personal Care", 
    "Baby Care", "Pet Food", "Frozen Food", "Health & Wellness"
  ];

  const formCategories = useMemo(() => {
    const uniqueCats = new Set([...PREDEFINED_CATEGORIES, ...products.map(p => p.category)]);
    return Array.from(uniqueCats).sort();
  }, [products]);

  // 3. Filter and Sort Products (Alphabetical Sort)
  const displayedProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCategory, searchTerm]);

  // Camera Stream Management
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please check permissions.");
        setIsCameraOpen(false);
      }
    };

    if (isCameraOpen) {
      startStream();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen]);

  // Pricing Calculation Logic
  const handlePriceChange = (field: 'mrp' | 'discount' | 'selling', value: string) => {
    let mrp = parseFloat(field === 'mrp' ? value : priceForm.mrp) || 0;
    let discount = parseFloat(field === 'discount' ? value : priceForm.discountPercent) || 0;
    let selling = parseFloat(field === 'selling' ? value : priceForm.sellingPrice) || 0;

    if (field === 'mrp') {
      selling = mrp - (mrp * (discount / 100));
      setPriceForm({ mrp: value, discountPercent: priceForm.discountPercent, sellingPrice: selling.toFixed(2) });
    } else if (field === 'discount') {
      if (value === '' || parseFloat(value) < 0) discount = 0;
      if (parseFloat(value) > 100) discount = 100;
      selling = mrp - (mrp * (discount / 100));
      setPriceForm({ mrp: priceForm.mrp, discountPercent: value, sellingPrice: selling.toFixed(2) });
    } else if (field === 'selling') {
      if (mrp > 0) {
        discount = ((mrp - selling) / mrp) * 100;
        setPriceForm({ mrp: priceForm.mrp, discountPercent: discount.toFixed(1), sellingPrice: value });
      } else {
        setPriceForm({ ...priceForm, sellingPrice: value });
      }
    }
  };

  const handleGenerateDesc = async () => {
    if (!newItem.name) return;
    setGeneratingDesc(true);
    const desc = await generateProductDescription(newItem.name || '', newItem.category || '');
    setNewItem(prev => ({ ...prev, description: desc }));
    setGeneratingDesc(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setNewItem(prev => ({ ...prev, imageUrl: dataUrl }));
        setIsCameraOpen(false);
      }
    }
  };

  const openEditModal = (product: Product) => {
    setNewItem({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      unit: product.unit,
      description: product.description,
      imageUrl: product.imageUrl
    });
    
    // Calculate display values for pricing form
    const currentPrice = product.price;
    const originalPrice = product.originalPrice || product.price;
    let discount = 0;
    
    if (originalPrice > currentPrice) {
        discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    }

    setPriceForm({
      mrp: originalPrice.toFixed(2),
      discountPercent: discount.toFixed(1),
      sellingPrice: currentPrice.toFixed(2)
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsCameraOpen(false);
    setNewItem({ name: '', category: '', price: 0, originalPrice: 0, stock: 0, unit: 'pc', description: '', imageUrl: '' });
    setPriceForm({ mrp: '', discountPercent: '', sellingPrice: '' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name && priceForm.sellingPrice) {
      const finalCategory = newItem.category?.trim() || 'General';
      const finalPrice = parseFloat(priceForm.sellingPrice);
      const finalOriginalPrice = parseFloat(priceForm.mrp) || finalPrice;
      const stockValue = Number(newItem.stock);

      const existingProduct = !newItem.id 
        ? products.find(p => p.name.toLowerCase() === newItem.name!.trim().toLowerCase()) 
        : null;

      if (existingProduct) {
        const updatedStock = existingProduct.stock + stockValue;
        
        const mergedProduct: Product = {
            ...existingProduct,
            stock: updatedStock,
            price: finalPrice, 
            originalPrice: finalOriginalPrice,
            category: finalCategory,
            unit: newItem.unit || existingProduct.unit,
            description: newItem.description || existingProduct.description,
            imageUrl: newItem.imageUrl || existingProduct.imageUrl
        };

        updateProduct(mergedProduct);
        alert(`Product "${existingProduct.name}" updated with new details and stock.`);
      } else {
        const productData: Product = {
            id: newItem.id || `p${Date.now()}`,
            name: newItem.name!,
            category: finalCategory,
            price: finalPrice,
            originalPrice: finalOriginalPrice,
            stock: stockValue,
            unit: newItem.unit!,
            description: newItem.description,
            imageUrl: newItem.imageUrl || `https://picsum.photos/200/200?random=${Date.now()}`
        };

        if (newItem.id) {
            updateProduct(productData);
        } else {
            addProduct(productData);
        }
      }
      
      closeModal();
    }
  };

  const openDiscountModal = (product: Product) => {
    setDiscountProduct(product);
    setNewDiscountPrice(product.price.toString());
    setIsDiscountModalOpen(true);
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountProduct && newDiscountPrice) {
      applyDiscount(discountProduct.id, parseFloat(newDiscountPrice));
      setIsDiscountModalOpen(false);
      setDiscountProduct(null);
      alert(`Discount applied to ${discountProduct.name}. Customers have been notified.`);
    }
  };

  return (
    <div>
      {/* 1. Header with Title and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Product Catalog</h2>
          <p className="text-slate-500">Manage your product listings and details.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* 2. Prominent Search Bar (Top of screen) */}
      <div className="relative mb-6">
         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search size={20} />
         </div>
         <input 
            type="text" 
            placeholder="Search for products by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all text-base"
         />
      </div>

      {/* 3. Toolbar: Categories & View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1 w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-emerald-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
            <button 
                onClick={() => setViewMode('list')} 
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="List View"
            >
                <ListIcon size={18} />
            </button>
            <button 
                onClick={() => setViewMode('grid')} 
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Grid View"
            >
                <LayoutGrid size={18} />
            </button>
        </div>
      </div>

      {/* 4. Product List/Grid */}
      {displayedProducts.length === 0 ? (
           <div className="py-16 text-center text-slate-400 flex flex-col items-center">
              <Grid className="h-12 w-12 mb-4 opacity-20" />
              <p>No products found.</p>
           </div>
      ) : (
        viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayedProducts.map(product => {
                    const isDiscounted = product.originalPrice && product.originalPrice > product.price;
                    return (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                        <div className="h-40 bg-slate-50 relative shrink-0">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-slate-700 shadow-sm uppercase">
                            {product.category}
                        </div>
                        {isDiscounted && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                            SALE
                            </div>
                        )}
                        </div>
                        
                        <div className="p-4 flex flex-col flex-1">
                        <div className="mb-2">
                            <h3 className="font-bold text-slate-800 line-clamp-1" title={product.name}>{product.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                {isDiscounted && (
                                    <span className="text-xs line-through text-slate-400">₹{product.originalPrice?.toFixed(2)}</span>
                                )}
                                <span className="font-bold text-emerald-600">₹{product.price.toFixed(2)}</span>
                                <span className="text-xs text-slate-400 font-normal">/ {product.unit}</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${product.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                Stock: {product.stock}
                            </span>
                            
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => openEditModal(product)} 
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => openDiscountModal(product)} 
                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                    title="Discount"
                                >
                                    <Tag size={16} />
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        ) : (
            // List View
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {displayedProducts.map(product => {
                        const isDiscounted = product.originalPrice && product.originalPrice > product.price;
                        return (
                            <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                                {/* Image */}
                                <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 truncate text-sm sm:text-base">{product.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">{product.category}</span>
                                        <span>Stock: <span className={product.stock < 10 ? "text-red-600 font-bold" : "text-emerald-600 font-medium"}>{product.stock} {product.unit}</span></span>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                    {isDiscounted && (
                                        <div className="text-[10px] text-slate-400 line-through">₹{product.originalPrice?.toFixed(2)}</div>
                                    )}
                                    <div className="font-bold text-emerald-600 text-sm sm:text-base">₹{product.price.toFixed(2)}</div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => openEditModal(product)} 
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => openDiscountModal(product)} 
                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                        title="Discount"
                                    >
                                        <Tag size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )
      )}

      {/* Reused Modals (Same as Inventory) */}
      
      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{newItem.id ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                  <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                  <div className="relative">
                    <input 
                      required 
                      type="text" 
                      list="categoryOptions"
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" 
                      value={newItem.category} 
                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                      placeholder="Select or type..." 
                    />
                    <datalist id="categoryOptions">
                       {formCategories.map(cat => (
                         <option key={cat} value={cat} />
                       ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <Calculator size={14} /> Pricing & Discounts
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                      <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">MRP (₹)</label>
                          <input 
                            required 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00"
                            className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                            value={priceForm.mrp}
                            onChange={e => handlePriceChange('mrp', e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Discount (%)</label>
                          <div className="relative">
                            <input 
                                type="number" 
                                step="0.1" 
                                placeholder="0"
                                className="w-full border p-2 pr-6 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                                value={priceForm.discountPercent}
                                onChange={e => handlePriceChange('discount', e.target.value)}
                            />
                            <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-[10px] font-semibold text-emerald-600 mb-1">Selling Price (₹)</label>
                          <input 
                            required 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00"
                            className="w-full border-2 border-emerald-100 p-2 rounded text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none bg-white" 
                            value={priceForm.sellingPrice}
                            onChange={e => handlePriceChange('selling', e.target.value)}
                          />
                      </div>
                  </div>
              </div>
              
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Product Image</label>
                
                {isCameraOpen ? (
                    <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-video mb-2 shadow-inner">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                            <button 
                                type="button" 
                                onClick={() => setIsCameraOpen(false)} 
                                className="bg-red-500/80 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-red-600 backdrop-blur-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={capturePhoto} 
                                className="bg-white text-emerald-600 px-6 py-2 rounded-full text-xs font-bold hover:bg-slate-100 shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                            >
                                <Camera size={14} /> Capture
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-4">
                        <div className="h-24 w-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative shrink-0">
                            {newItem.imageUrl ? (
                            <>
                                <img src={newItem.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                <button 
                                type="button"
                                onClick={() => setNewItem({...newItem, imageUrl: ''})}
                                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl shadow-sm hover:bg-red-600 transition-colors"
                                >
                                <X size={14} />
                                </button>
                            </>
                            ) : (
                            <ImageIcon className="text-slate-300 h-8 w-8" />
                            )}
                        </div>
                        
                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    <Upload size={14} />
                                    Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCameraOpen(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    <Camera size={14} />
                                    Take Photo
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </div>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Or paste image URL..." 
                                    className="w-full border p-2 pl-3 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={newItem.imageUrl || ''}
                                    onChange={(e) => setNewItem({...newItem, imageUrl: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Stock</label>
                  <input required type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={newItem.stock} onChange={e => setNewItem({...newItem, stock: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Unit</label>
                  <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <div className="flex gap-2">
                  <textarea className="w-full border p-2 rounded text-sm h-20 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                  <button 
                    type="button"
                    onClick={handleGenerateDesc}
                    disabled={generatingDesc || !newItem.name}
                    className="bg-purple-50 text-purple-700 p-2 rounded flex flex-col items-center justify-center w-20 text-xs font-medium hover:bg-purple-100 disabled:opacity-50 border border-purple-200"
                  >
                    <Wand2 size={16} className="mb-1" />
                    {generatingDesc ? '...' : 'AI Write'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-sm">{newItem.id ? 'Update Product' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && discountProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Tag className="text-amber-500" /> Apply Discount
              </h3>
              <button onClick={() => setIsDiscountModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleApplyDiscount}>
               <div className="mb-4">
                  <p className="text-sm text-slate-600 mb-1">Product: <span className="font-semibold">{discountProduct.name}</span></p>
                  <p className="text-sm text-slate-600 mb-4">Current Price: <span className="font-semibold">₹{(discountProduct.originalPrice || discountProduct.price).toFixed(2)}</span></p>
                  
                  <label className="block text-xs font-bold text-slate-500 mb-2">New Sale Price (₹)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full border p-3 rounded-lg text-lg font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={newDiscountPrice} 
                    onChange={e => setNewDiscountPrice(e.target.value)} 
                    placeholder="0.00"
                  />
               </div>
               
               <p className="text-xs text-slate-400 mb-4">
                 Setting this price will automatically send a promotional notification to all customers.
               </p>

               <div className="flex justify-end gap-3">
                 <button type="button" onClick={() => setIsDiscountModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg">Cancel</button>
                 <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 shadow-sm">
                   Apply Offer
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;