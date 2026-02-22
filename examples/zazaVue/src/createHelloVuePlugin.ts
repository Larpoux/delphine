import { createApp, reactive } from 'vue'
import HelloDelphine from './components/HelloDelphine.vue'
import type { DelphineServices, UIPluginInstance } from '@vcl'

export function createHelloVuePlugin(): UIPluginInstance<{ message: string }> {
  let app: ReturnType<typeof createApp> | null = null
  const state = reactive<{ message: string }>({ message: '' })

  return {
    id: 'hello-vue',

    mount(container, props, _services: DelphineServices) {
      state.message = props.message
      app = createApp(HelloDelphine, state)
      app.mount(container)
    },

    update(props) {
      state.message = props.message
    },

    unmount() {
      app?.unmount()
      app = null
    },
  }
}
