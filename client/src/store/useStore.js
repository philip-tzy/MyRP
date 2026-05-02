import { create } from 'zustand';

const useStore = create((set) => ({
  // Global loading state (for MRP run)
  mrpRunning: false,
  setMrpRunning: (val) => set({ mrpRunning: val }),

  // Sidebar collapse state
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  // Cache for parts list (used in dropdowns)
  partsCache: [],
  setPartsCache: (parts) => set({ partsCache: parts }),

  // Cache for customers
  customersCache: [],
  setCustomersCache: (customers) => set({ customersCache: customers }),

  // Cache for suppliers
  suppliersCache: [],
  setSuppliersCache: (suppliers) => set({ suppliersCache: suppliers }),
}));

export default useStore;
