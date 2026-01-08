import { useState } from 'react';
import { Package, Search, Plus, AlertTriangle } from 'lucide-react';

export function DrugInventoryView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Note: Drug inventory would connect to API endpoints
  // For now, showing empty state
  const drugs: any[] = [];

  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch = drug.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || drug.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockDrugs = drugs.filter(drug => drug.stockQuantity <= drug.reorderLevel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl mb-1">Drug Inventory</h3>
          <p className="text-gray-600">Manage drug stock and supplies</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="size-5" />
          Add Drug
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-2xl text-blue-700 mb-1">{drugs.length}</p>
          <p className="text-sm text-blue-700">Total Drugs</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-2xl text-red-700 mb-1">{lowStockDrugs.length}</p>
          <p className="text-sm text-red-700">Low Stock Items</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-2xl text-green-700 mb-1">{drugs.length - lowStockDrugs.length}</p>
          <p className="text-sm text-green-700">In Stock</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockDrugs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-red-900 mb-1">Low Stock Alert</p>
              <p className="text-sm text-red-800">
                {lowStockDrugs.length} item{lowStockDrugs.length !== 1 ? 's are' : ' is'} running low on stock and need{lowStockDrugs.length === 1 ? 's' : ''} to be reordered.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search drugs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="Antibiotic">Antibiotics</option>
            <option value="Antihypertensive">Antihypertensives</option>
            <option value="Antidiabetic">Antidiabetics</option>
            <option value="Analgesic">Analgesics</option>
            <option value="Antiplatelet">Antiplatelets</option>
          </select>
        </div>
      </div>

      {/* Drugs List */}
      <div className="grid gap-4">
        {drugs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-900 mb-2">Drug Inventory</p>
            <p className="text-gray-600 text-sm">
              The drug inventory system is ready to be configured. Add drugs to track stock levels, manage reordering, and monitor expiry dates.
            </p>
          </div>
        ) : filteredDrugs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No drugs found matching your search</p>
          </div>
        ) : (
          filteredDrugs.map((drug) => (
            <DrugCard key={drug.id} drug={drug} />
          ))
        )}
      </div>
    </div>
  );
}

function DrugCard({ drug }: { drug: any }) {
  const isLowStock = drug.stockQuantity <= drug.reorderLevel;
  const daysToExpiry = Math.floor((new Date(drug.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysToExpiry <= 90;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg">{drug.name}</h4>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              {drug.category}
            </span>
          </div>
          <p className="text-sm text-gray-600">Generic: {drug.genericName}</p>
          <p className="text-sm text-gray-600">Drug ID: {drug.id}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isLowStock && (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
              <AlertTriangle className="size-3" />
              Low Stock
            </span>
          )}
          {isExpiringSoon && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
              Expiring Soon
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Stock Quantity</p>
          <p className={`${isLowStock ? 'text-red-600' : ''}`}>
            {drug.stockQuantity} units
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Reorder Level</p>
          <p>{drug.reorderLevel} units</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Price/Unit</p>
          <p>${drug.price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Expiry Date</p>
          <p className={isExpiringSoon ? 'text-amber-600' : ''}>
            {new Date(drug.expiryDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-600">Manufacturer</p>
        <p className="text-sm">{drug.manufacturer}</p>
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Update Stock
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          View Details
        </button>
        {isLowStock && (
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Reorder
          </button>
        )}
      </div>
    </div>
  );
}
