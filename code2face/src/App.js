import './App.css';
import React,{useCallback,useContext, useState, useEffect, createContext, useReducer} from 'react';
import {Route , BrowserRouter as Router,Routes} from 'react-router-dom'
import { initialState, reducer } from './reducers/userReducer';
import 'react-bootstrap'
//components and pages
import MyNavbar from './components/navbar';
import Register from './components/Register';
import Login from './components/Login';
import Home from './pages/home';
import CallPage from './pages/callPage';
import NotFound from './pages/NotFound';
// import Testing from './pages/testing';
import { Toaster } from 'react-hot-toast';
import Chat from './components/chat';
import Slides from './pages/slides';
import AddSlides from './pages/addSlides';
import PeerCall from './pages/peerCall';


export const UserContext = createContext();

function App() {


	const [state, dispatch] = useReducer(reducer, initialState);
    return (
        <UserContext.Provider value={{state,dispatch}}>
            <div>
                <Toaster 
                    position='top-right'
                />
            </div>
            <Router >
                <div className='App'>
                    <MyNavbar/>
                    <div className='content'>
                        <Routes>
                                <Route eaxct path="/" element={<Home/>} />
                                <Route exact path="/register" element={<Register/>} />
                                <Route exact path="/login" element={<Login />} />
                                {/* <Route exact path="/call/:roomId" element={<CallPage/>} /> */}
                                <Route exact path="/call/:roomId" element={<PeerCall/>} />
                                <Route exact path='/slides' element={<Slides/>} />
                                <Route exact path='/add' element={<AddSlides/>} />
                                {/* <Route path="/chat" element={<Chat/>} /> */}
                                <Route path="*" element={<NotFound/>} />
                        </Routes>
                    </div>
                </div>
            </Router>
         </UserContext.Provider>
		
	
	);
}

export default App;
