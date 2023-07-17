import React,{ useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";
import { NavbarBrand } from "react-bootstrap";
import "../styles/navbar.css"

const Navbar = () => {
	let { state, dispatch } = useContext(UserContext);
	const history = useNavigate()
	let jwt = localStorage.getItem("jwt")
	if(jwt) {
		state=true;
	}


	const renderList = () => {
		if (state) {
			return [
				<>
					<Link key='profile' className="navlink" to="/profile">Profile</Link>
					<Link key='dsf' className="navlink" to="/newPost">new post</Link>
					<button key={jwt.slice(0,3)} className="btn btn-primary" onClick={() => {
							localStorage.clear();
							dispatch({type:"CLEAR"})
							history('/')
						}
						}>
						Logout
					</button>
				
				</>
			];
		} else {
			return [
				<>
                    {/* <Link to='/testing' className="navlink">Test</Link>  */}
					{/* <Link key='login' className="navlink" to="/login">Login</Link> */}
					{/* <Link key='register' className="navlink" to="/register">Register</Link> */}
					<Link key='slides' className="navlink" to="/motivation">Motivation</Link>
					{/* <Link key='slides' className="navlink" to="/features">Features</Link> */}
					<Link key='slides' className="navlink" to="/slides">Revision</Link>
					
				</>,
			];
		}
	};

	return (
		<nav className="main-nav">
			{/* <div className="logo" ><h3 href="/">Code2Face</h3></div> */}
            <NavbarBrand className="logo">
                <Link key='logo' to="/">
                    Code2Face
                    {/* Test */}
                </Link>
            </NavbarBrand>
			<div className="navlinks">{renderList()}</div>
		</nav>
	);
};

export default Navbar;