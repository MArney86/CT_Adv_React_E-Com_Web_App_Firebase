import { Routes, Route } from 'react-router-dom'
import NavHeader from './components/NavHeader'
import './App.css'
import Home from './components/Home'
import CartPage from './components/CartPage'
import NotFound from './components/NotFound'
import CheckoutPage from './components/CheckoutPage'

function App() {
    return (
      <>
      <NavHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </>
    )
}

export default App
