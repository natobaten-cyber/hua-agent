import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  transactions: {
    getAll: (filters?: { type?: string; projectId?: number }) =>
      ipcRenderer.invoke('transactions:getAll', filters),
    add: (data: unknown) => ipcRenderer.invoke('transactions:add', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('transactions:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('transactions:delete', id),
  },
  projects: {
    getAll: () => ipcRenderer.invoke('projects:getAll'),
    add: (data: unknown) => ipcRenderer.invoke('projects:add', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('projects:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('projects:delete', id),
  },
  stats: {
    getSummary: () => ipcRenderer.invoke('stats:getSummary'),
  },
})
