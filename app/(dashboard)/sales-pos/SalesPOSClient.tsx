"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
}

interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderFormData {
  customerId?: string;
  items: OrderItem[];
  notes?: string;
}

export default function SalesPOSClient() {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Order form state
  const [orderData, setOrderData] = useState<OrderFormData>({
    items: [],
    notes: "",
  });
  
  // Product selection
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  
  // Search terms
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Get tenant ID (simplified - in real app this would come from context/params)
  const tenantId = "demo-tenant"; // TODO: Get from URL params or context

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load products and customers in parallel
      const [productsResponse, customersResponse] = await Promise.all([
        fetch(`/api/tenants/${tenantId}/products?limit=100`),
        fetch(`/api/tenants/${tenantId}/customers?limit=100`)
      ]);

      if (!productsResponse.ok) {
        throw new Error(`Failed to load products: ${productsResponse.statusText}`);
      }
      if (!customersResponse.ok) {
        throw new Error(`Failed to load customers: ${customersResponse.statusText}`);
      }

      const productsData = await productsResponse.json();
      const customersData = await customersResponse.json();
      
      setProducts(productsData.products?.filter((p: Product) => p.isActive && p.stockQuantity > 0) || []);
      setCustomers(customersData.customers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const addItemToOrder = () => {
    if (!selectedProduct || quantity <= 0) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    if (quantity > product.stockQuantity) {
      setError(`Only ${product.stockQuantity} units available for ${product.name}`);
      return;
    }
    
    // Check if product already in order
    const existingItemIndex = orderData.items.findIndex(item => item.productId === selectedProduct);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...orderData.items];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stockQuantity) {
        setError(`Only ${product.stockQuantity} units available for ${product.name}`);
        return;
      }
      
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: newQuantity * product.price,
      };
      setOrderData({ ...orderData, items: updatedItems });
    } else {
      // Add new item
      const newItem: OrderItem = {
        productId: selectedProduct,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        totalPrice: quantity * product.price,
      };
      setOrderData({ ...orderData, items: [...orderData.items, newItem] });
    }
    
    // Reset selection
    setSelectedProduct("");
    setQuantity(1);
    setError(null);
  };

  const removeItemFromOrder = (productId: string) => {
    setOrderData({
      ...orderData,
      items: orderData.items.filter(item => item.productId !== productId),
    });
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromOrder(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (newQuantity > product.stockQuantity) {
      setError(`Only ${product.stockQuantity} units available for ${product.name}`);
      return;
    }
    
    const updatedItems = orderData.items.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: newQuantity * item.unitPrice,
        };
      }
      return item;
    });
    
    setOrderData({ ...orderData, items: updatedItems });
    setError(null);
  };

  const calculateTotal = () => {
    return orderData.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderData.items.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch(`/api/tenants/${tenantId}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: orderData.customerId || null,
          items: orderData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          notes: orderData.notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Reset form
      setOrderData({ items: [], notes: "" });
      
      // Show success (in a real app, you might navigate to order details)
      alert(`Order created successfully! Order ID: ${result.order.id}`);
      
      // Reload products to update stock quantities
      await loadData();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    `${customer.firstName} ${customer.lastName || ""}`.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const formatCustomerName = (customer: Customer) => {
    const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
    return customer.email ? `${name} (${customer.email})` : name;
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  if (!user) {
    return <div className="p-4">Please sign in to access the POS system.</div>;
  }

  if (loading) {
    return <div className="p-4">Loading POS system...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sales POS</h1>
        <div className="text-sm text-gray-600">
          Create new orders and process sales
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Product Selection */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Add Products</h2>
            
            {/* Product Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Product Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Product
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a product...</option>
                  {filteredProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price.toFixed(2)} (Stock: {product.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={addItemToOrder}
                disabled={!selectedProduct}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300"
              >
                Add to Order
              </button>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Customer (Optional)</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={orderData.customerId || ""}
              onChange={(e) => setOrderData({ ...orderData, customerId: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Walk-in customer (no account)</option>
              {filteredCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {formatCustomerName(customer)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>
            
            {orderData.items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No items added to order yet
              </p>
            ) : (
              <div className="space-y-4">
                {orderData.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.productName}</h3>
                      <p className="text-sm text-gray-600">
                        ${item.unitPrice.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="font-medium w-20 text-right">
                        ${item.totalPrice.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItemFromOrder(item.productId)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Notes and Submit */}
          <form onSubmit={handleSubmitOrder} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Notes (Optional)
              </label>
              <textarea
                value={orderData.notes}
                onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Special instructions, delivery notes, etc."
              />
            </div>

            <button
              type="submit"
              disabled={orderData.items.length === 0 || isSubmitting}
              className="w-full px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 font-medium"
            >
              {isSubmitting ? "Creating Order..." : `Create Order (${orderData.items.length} items)`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}