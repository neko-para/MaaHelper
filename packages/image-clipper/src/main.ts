import { createApp } from 'vue'
import App from './App.vue'
import {
  provideVSCodeDesignSystem,
  vsCodeButton
} from '@vscode/webview-ui-toolkit'

import './main.css'

provideVSCodeDesignSystem().register(vsCodeButton())

createApp(App).mount('#app')
