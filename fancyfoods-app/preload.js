const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');

contextBridge.exposeInMainWorld('fancyAPI', {
  listProducts: () => ipcRenderer.invoke('products:list'),
  searchProducts: (term) => ipcRenderer.invoke('products:search', term),
  saveProduct: (product) => ipcRenderer.invoke('products:save', product),
  deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),

  listClients: () => ipcRenderer.invoke('clients:list'),
  searchClients: (term) => ipcRenderer.invoke('clients:search', term),
  saveClient: (client) => ipcRenderer.invoke('clients:save', client),
  deleteClient: (id) => ipcRenderer.invoke('clients:delete', id),

  listDeals: () => ipcRenderer.invoke('broker:list'),
  saveDeal: (deal) => ipcRenderer.invoke('broker:save', deal),
  deleteDeal: (id) => ipcRenderer.invoke('broker:delete', id),
  getAttachmentPath: (id) => ipcRenderer.invoke('broker:attachment-path', id),
  attachFileToDeal: (id) => ipcRenderer.invoke('broker:attach-file', id),

  listOrders: () => ipcRenderer.invoke('orders:list'),
  getOrderItems: (id) => ipcRenderer.invoke('orders:items', id),
  saveOrder: (order) => ipcRenderer.invoke('orders:save', order),
  deleteOrder: (id) => ipcRenderer.invoke('orders:delete', id),

  listTemplates: () => ipcRenderer.invoke('templates:list'),
  saveTemplate: (template) => ipcRenderer.invoke('templates:save', template),
  deleteTemplate: (id) => ipcRenderer.invoke('templates:delete', id),
  sendEmail: (payload) => ipcRenderer.invoke('email:send', payload),
  saveEmailLocal: (payload) => ipcRenderer.invoke('email:save-local', payload),

  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (data) => ipcRenderer.invoke('config:set', data),

  exportBackup: () => ipcRenderer.invoke('backup:export'),
  importBackup: () => ipcRenderer.invoke('backup:import'),

  readDir: (dir) => fs.readdirSync(dir)
});
