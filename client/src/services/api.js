import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.message || 'Server error';
    toast.error(msg);
    return Promise.reject(err);
  }
);

const toArr  = r => (Array.isArray(r.data) ? r.data : []);
const toData = r => r.data ?? null;

export const getParts        = ()          => api.get('/api/parts').then(toArr);
export const getPart         = (id)        => api.get(`/api/parts/${id}`).then(toData);
export const createPart      = (payload)   => api.post('/api/parts', payload).then(toData);
export const updatePart      = (id, data)  => api.put(`/api/parts/${id}`, data).then(toData);
export const deletePart      = (id)        => api.delete(`/api/parts/${id}`).then(toData);
export const getBOM          = (id)        => api.get(`/api/parts/${id}/bom`).then(toArr);
export const addBOMLine      = (id, data)  => api.post(`/api/parts/${id}/bom`, data).then(toData);
export const deleteBOMLine   = (id, bomId) => api.delete(`/api/parts/${id}/bom/${bomId}`).then(toData);
export const getBOO          = (id)        => api.get(`/api/parts/${id}/boo`).then(toArr);
export const addBOOStep      = (id, data)  => api.post(`/api/parts/${id}/boo`, data).then(toData);
export const deleteBOOStep   = (id, booId) => api.delete(`/api/parts/${id}/boo/${booId}`).then(toData);

export const getCustomers    = ()          => api.get('/api/customers').then(toArr);
export const createCustomer  = (payload)   => api.post('/api/customers', payload).then(toData);
export const updateCustomer  = (id, data)  => api.put(`/api/customers/${id}`, data).then(toData);
export const deleteCustomer  = (id)        => api.delete(`/api/customers/${id}`).then(toData);

export const getSuppliers    = ()          => api.get('/api/suppliers').then(toArr);
export const createSupplier  = (payload)   => api.post('/api/suppliers', payload).then(toData);
export const updateSupplier  = (id, data)  => api.put(`/api/suppliers/${id}`, data).then(toData);
export const deleteSupplier  = (id)        => api.delete(`/api/suppliers/${id}`).then(toData);

export const getSalesOrders   = ()         => api.get('/api/sales-orders').then(toArr);
export const getSalesOrder    = (id)       => api.get(`/api/sales-orders/${id}`).then(toData);
export const createSalesOrder = (payload)  => api.post('/api/sales-orders', payload).then(toData);
export const updateSalesOrder = (id, data) => api.put(`/api/sales-orders/${id}`, data).then(toData);
export const deleteSalesOrder = (id)       => api.delete(`/api/sales-orders/${id}`).then(toData);

export const adjustInventory     = (payload) => api.post('/api/inventory/adjust', payload).then(toData);

export const runMrpCalculation   = ()      => api.post('/api/mrp/run').then(toData);
export const getMrpSuggestions   = ()      => api.get('/api/mrp/suggestions').then(toArr);
export const approveSuggestion   = (id)    => api.put(`/api/mrp/suggestions/${id}/approve`).then(toData);
export const cancelSuggestion    = (id)    => api.put(`/api/mrp/suggestions/${id}/cancel`).then(toData);

export default api;
