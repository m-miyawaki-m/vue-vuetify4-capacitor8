import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// persist: true を付けた store は端末保存される(スペック §7.5 作業中データの保険)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
