import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Home } from './pages/Home'
import { TrainingSystem } from './pages/TrainingSystem'
import { MyPlan } from './pages/MyPlan'
import { ContentHub } from './pages/ContentHub'
import { VirtualPractice } from './pages/VirtualPractice'
import { Cases } from './pages/Cases'
import { Assessment } from './pages/Assessment'
import { Incentives } from './pages/Incentives'
import { Community } from './pages/Community'
import { Experts } from './pages/Experts'
import { Tools } from './pages/Tools'
import { News } from './pages/News'
import { Profile } from './pages/Profile'
import { Admin } from './pages/Admin'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="system" element={<TrainingSystem />} />
        <Route path="content" element={<ContentHub />} />
        <Route path="virtual" element={<VirtualPractice />} />
        <Route path="cases" element={<Cases />} />
        <Route path="experts" element={<Experts />} />
        <Route path="tools" element={<Tools />} />
        <Route path="news" element={<News />} />
        <Route
          path="plan"
          element={
            <ProtectedRoute>
              <MyPlan />
            </ProtectedRoute>
          }
        />
        <Route
          path="assessment"
          element={
            <ProtectedRoute>
              <Assessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="incentives"
          element={
            <ProtectedRoute>
              <Incentives />
            </ProtectedRoute>
          }
        />
        <Route
          path="community"
          element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}
