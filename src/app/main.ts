import { createApp } from 'vue'
import App from '@/app/App.vue'
import pinia from '@/app/plugins/pinia'
import { registerVueQuery } from '@/app/plugins/query'
import vuetify from '@/app/plugins/vuetify'
import router from '@/app/router'

const app = createApp(App)
app.use(vuetify)
app.use(pinia)
app.use(router)
registerVueQuery(app)
app.mount('#app')
