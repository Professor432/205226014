import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from "react";
import AdminCategory from './components/AdminCategory/AdminCategory'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import RestaurantMenu from './components/RestaurantMenu/RestaurantMenu'
import Cart from './components/Cart/Cart'
import EnterMembers from './components/Table/EnterMembers';
import AdminUser from './components/AdminUser/AdminUser';
import BookedTable from './components/Table/BookedTable';
import Home from './components/Welcome/Home'
import _404NotFound from './components/_404NotFound/_404NotFound'
import Feedback from './components/Feedback/feedback'
import { About } from './components/About/About';
import UserLogin from './components/UserLogin/MainContentSignUp';
import AdminLogin from './components/AdminLogin/AdminLogin';
import AdminMenu from './components/AdminMenu/AdminMenu'
import AdminTable from './components/AdminTable/AdminTable'
import Reviewlist from "./components/Reviews/Reviewlist";
import Analysis from './components/AdminAnalysis/Analysis';
import Orders from './components/AdminOrders/Orders';
import UserSignIn from './components/Login/MainContentSignIn';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { isAdminAuthenticated, isUserAuthenticated } from './auth';

function RequireUser({ children }) {
  const [authenticated, setAuthenticated] = React.useState(isUserAuthenticated());

  React.useEffect(() => {
    const syncAuth = () => setAuthenticated(isUserAuthenticated());
    window.addEventListener("auth-change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("auth-change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  return authenticated ? children : <Navigate to="/signin" replace />;
}

function RequireAdmin({ children }) {
  const [authenticated, setAuthenticated] = React.useState(isAdminAuthenticated());

  React.useEffect(() => {
    const syncAuth = () => setAuthenticated(isAdminAuthenticated());
    window.addEventListener("auth-change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("auth-change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  return authenticated ? children : <Navigate to="/adminlogin" replace />;
}

function App() {

  return (
    <div style={{'backgroundColor': '#EBF2D5'}}>
          <ToastContainer />
          <Router>
            <Routes>
              <Route path='/menu' element={<><Header/> <RestaurantMenu/> <Footer/></>} />
              <Route path='/cart' element={<RequireUser><Header/> <Cart/> <Footer/></RequireUser>} />
              <Route path='/tablebooking' element={<RequireUser>{localStorage.getItem("table_id") ? <><Header/> <BookedTable/> <Footer/></> : <><Header/> <EnterMembers/> <Footer/></>}</RequireUser>} />
              <Route path='/' element={ <><Header/> <Home userName="User" /> <Footer/></>} />
              <Route path='/aboutus' element={<><Header/> <About/> <Footer/></>} />
              <Route path='/feedback' element={<RequireUser><Feedback /></RequireUser>} />
              <Route path='/userlogin' element={<><UserLogin /> <Footer/></>} />
              <Route path='/signin' element={<><Header /><UserSignIn /> <Footer /></>} />
              <Route path='/adminlogin' element={<AdminLogin />} />            
              <Route path='/admintable' element={<RequireAdmin><Header/> <AdminTable/> <Footer/></RequireAdmin>} />
              <Route path='/adminuser' element={<RequireAdmin><Header/> <AdminUser/> <Footer/></RequireAdmin>} />
              <Route path='/adminorders' element={<RequireAdmin><Header/> <Orders/> <Footer/></RequireAdmin>} />
              <Route path='/adminmenu' element={<RequireAdmin><Header/><AdminMenu/><Footer/></RequireAdmin>} />
              <Route path='/admincategory' element={<RequireAdmin><Header/> <AdminCategory/> <Footer/></RequireAdmin>} />
              <Route path='/adminfeedback' element={<><Header/> <Reviewlist/> <Footer/></>} />
              <Route path='/adminanalysis' element={<RequireAdmin><Header/> <Analysis/> <Footer/></RequireAdmin>} />
              <Route path='/*' element={<_404NotFound />} />
            </Routes>
          </Router>    
    </div>
  );
}


export default App;
