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

export const UserContext = createContext();

function App() {


	const [state, dispatch] = useReducer(reducer, initialState);
    return (
        <UserContext.Provider value={{state,dispatch}}>
            <Router >
                <div className='App'>
                    <MyNavbar/>
                    <div className='content'>
                        <Routes>
                                <Route eaxct path="/" element={<Home/>} />
                                <Route exact path="/register" element={<Register/>} />
                                <Route exact path="/login" element={<Login />} />
                        </Routes>
                    </div>
                </div>
            </Router>
        </UserContext.Provider>
		
	
	);
}

export default App;
