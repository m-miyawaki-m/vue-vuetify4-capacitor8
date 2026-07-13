import { createApp } from 'vue'
import App from '@/app/App.vue'
import vuetify from '@/app/plugins/vuetify'

const app = createApp(App)
app.use(vuetify)
app.mount('#app')
