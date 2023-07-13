import { createApp } from 'vue'
import App from './App.vue'
import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeTextField
} from '@vscode/webview-ui-toolkit'

import './main.css'

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeTextField())

createApp(App).mount('#app')
