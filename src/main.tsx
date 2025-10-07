import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import '@smastrom/react-rating/style.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { store } from './redux/store/store.ts'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </BrowserRouter>,
    </Provider>
)
