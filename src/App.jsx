import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '../component/Sidebar'
import User from '../component/user-management/User'
import BuatUser from '../component/user-management/BuatUser'
import EditData from '../component/user-management/EditData'
import 'bootstrap-icons/font/bootstrap-icons.css';
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <div className="flex-grow-1">
      <Routes>
        <Route path="/" element={<User />} />
        <Route path="/user-management" element={<User />} />
        <Route path="/BuatUser" element={<BuatUser />} />
        <Route path="/editdata" element={<EditData />} />
      </Routes>
    </div>
  )
}

export default App