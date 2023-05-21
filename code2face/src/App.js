import './App.css';
import React,{useCallback,useContext, useState, useEffect, createContext, useReducer} from 'react';
import {Route , BrowserRouter as Router,Routes} from 'react-router-dom'
import { initialState, reducer } from './reducers/userReducer';
import MyNavbar from './components/navbar';

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
                                <Route eaxct path="" />
                        </Routes>
                    </div>
                </div>
            </Router>
        </UserContext.Provider>
		
	
	);
}

export default App;
