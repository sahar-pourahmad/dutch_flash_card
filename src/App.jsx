import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import ReviewSession from './components/ReviewSession'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review" element={<ReviewSession />} />
      </Routes>
    </BrowserRouter>
  )
}
