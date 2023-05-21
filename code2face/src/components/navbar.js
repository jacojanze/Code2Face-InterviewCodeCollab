import React, {useState, useEffect, useContext} from 'react'
import { UserContext } from '../App'
import {NavDropdown, Navbar, NavbarBrand, OffcanvasBody} from 'react-bootstrap'
import { Link } from 'react-router-dom'

import "../styles/navbar.css"
const NavList = () => {
    return (
        <>
            <NavDropdown>
                <NavDropdown.Item>Login</NavDropdown.Item>
            </NavDropdown>
        </>
    )
}

const MyNavbar = () => {

    let {state, dispatch} = useContext(UserContext)
    const jwt = localStorage.getItem('xxklx')
    if(jwt) state=true;



    return (
        <nav className='main-nav'>
            <NavbarBrand>Code2Face</NavbarBrand>
            {/* <Link>Login</Link>
            <Link>Register</Link> */}
            <NavList />
        </nav>
        // <Navbar>
        //     <Navbar.Brand >
        //         Code2Face
        //     </Navbar.Brand>
        //     {/* <Navbar.Toggle aria-controls='offcanvasNavbar-expand-lg' /> */}
        //     {/* <Navbar.Offcanvas >
        //         <OffcanvasBody> */}
        //             <NavList/>
        //         {/* </OffcanvasBody>
        //     </Navbar.Offcanvas> */}
        // </Navbar>
    )
}

export default MyNavbar