import React from 'react'
import { useState } from 'react'
import {Button, Form} from 'react-bootstrap'


import "../styles/register.css"

const Register = () => {

    
    return (
        <div className='container'>
            <div className='central btm-shadow'>
                <h2>Register</h2>
                <Form>
                    <Form.Group className="mmb fin" controlId="formBasicEmail">
                        <Form.Control type="email" placeholder="Enter email" />
                    </Form.Group>
                    <Form.Group className='mmb fin' >
                        <Form.Control type="password" placeholder='Enter Password' />
                    </Form.Group>
                    <Form.Group className='mmb fin' >
                        <Form.Control type="password" placeholder='Retype Password' />
                    </Form.Group>
                
                    <Button >Submit</Button>
                </Form>
            </div>
        </div>
    )
}

export default Register