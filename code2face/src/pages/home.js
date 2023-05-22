import React from 'react'
import { Image, Form, Button } from 'react-bootstrap'

const Home = () => {

    
    return (
        <div className='main-home'>
            <Image src='/qna.png' className='img-fluid' />
            <div className='cen-container'>
                <div className='central'>
                    <div className='d-flex flex-column'>
                        <div className='jcontent'>
                            <h4>Start a New Session</h4>
                            <Form>
                                <Form.Group className="mmb fin" controlId="">
                                    <Button className="btn-dark">Generate Code</Button>
                                    {/* <Form.Control type="text" placeholder="Enter email" /> */}
                                </Form.Group>
                                <Form.Group >
                                    <Button>Start</Button>
                                </Form.Group>
                            </Form>
                            

                        </div>
                        <div className='jcontent mt-4'>
                            <h4>Join with Code</h4>
                            <Form>
                                <Form.Group className="mmb fin " >
                                    <Form.Control type="text" placeholder="Enter session Id/Code" />
                                </Form.Group>
                                <Form.Group >
                                    <Button>Join</Button>
                                </Form.Group>
                            </Form>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home