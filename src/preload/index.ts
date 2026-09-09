import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getTheme: (): Promise<'light' | 'dark' | 'system'> => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: 'light' | 'dark' | 'system'): Promise<void> =>
    ipcRenderer.invoke('set-theme', theme),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version')
})
