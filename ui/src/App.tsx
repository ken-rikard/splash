import { RouterProvider } from 'react-router'
import router from './routes'
import { AlertProvider } from './hooks/useAlerts'

function App() {
  return (
    <AlertProvider>
      <RouterProvider router={router} />
    </AlertProvider>
  )
}

export default App
