import React from 'react'
import { Form, Button } from 'react-bootstrap'
const Login = () => {


    return (
        <div className='container'>
            <div className='central btm-shadow'>
                <h2>Login</h2>
                <Form>
                    <Form.Group className="mmb fin" controlId="formBasicEmail">
                        <Form.Control type="email" placeholder="Enter email" />
                    </Form.Group>
                    <Form.Group className='mmb fin' >
                        <Form.Control type="password" placeholder='Enter Password' />
                    </Form.Group>
                
                    <Button >Submit</Button>
                </Form>
            </div>
        </div>
    ) 
}

export default Login