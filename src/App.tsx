import { Routes, Route } from 'react-router-dom'
import NavHeader from './components/NavHeader'
import './App.css'
import Home from './components/Home'
import CartPage from './components/CartPage'
import NotFound from './components/NotFound'
import CheckoutPage from './components/CheckoutPage'
import { auth } from './components/FirebaseConfig'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useState, } from 'react'

function App() {
    const [user, setUser] = useState<User | null>(null)
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
        })

        return () => {
            unsubscribe()
        }
    }, [])

    return (
      <>
      <NavHeader user={user} setUser={setUser} />
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
