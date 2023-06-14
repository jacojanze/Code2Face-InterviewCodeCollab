import React, { useState } from 'react'
import { Image, Form, Button } from 'react-bootstrap'
import {useNavigate} from 'react-router-dom'
import ShortUniqueId from 'short-unique-id';
import toast from 'react-hot-toast'
import copy from 'copy-to-clipboard';

const Home = () => {
    const Suid = new ShortUniqueId()
    const history = useNavigate()
    const valt = 'Enter the Session Id', invalt = 'Invalid Session  Id';
    const lenvalt = 'Enter only 10 characters Session Id';
    const [uname, setuname] = useState('')    
    const [fclick, setFclick] = useState(false)
    const [sid, setSid] = useState('')
    const [sid1, setSid1] = useState('')
    const [validText, setvalidText] = useState(valt)
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    const [copier, setCopier] = useState({
        value:'',
        copied:false
    })
    const [interviewer, setInterviewer] = useState(true)
  

    const handleChange1 = (e) => {
        const input = e.target.value
        if (input && !alphanumericRegex.test(input)) {
            setvalidText(invalt)
            setSid1('')
            return;
        } 
        setvalidText(lenvalt)
        if(input.length>10) {
            setSid1('')
            return
        }
        setSid1(input)
    }

    const handleNameChange = (e) => {
        setuname(e.target.value)
    }

    const generateCode = (e) => {
        e.preventDefault();
        setFclick(true)
        let code  = Suid(10);
        setSid(code)
        setSid1(code)
        if (copy(code))
            toast.success('Session ID copied')
        else toast.error('Cannot copy to clipboard')
    }

    const handleSwitch = (e) => {
        setInterviewer(!interviewer)
        console.log(interviewer);
    }

    const handleJoin = async ()=> {
        if(sid.length==0 && sid1.length==0) {
            toast('Please generate or fill the Session ID', {
                icon: '❕',
              });
            return;
        }
        if(uname.length==0) {
            toast.error("Name field is empty")
            return;
        }
        const roomId = sid.length>0?sid:sid1
        if(sid.length>0) {
            localStorage.setItem('init', 'true')
        }
        toast.success('Joining new Call')
        history(`/call/${roomId}`, {
            state: {
                username: uname,
                interviewer,
            },
        });
    }
    
    return (
        <div className='main-home'>
            <div className='cen-container'>
                <Image src='/qna.png' className='img-fluid' />
            </div>
            <div className='cen-container'>
                <div className='central'>
                    <div className='d-flex flex-column'>
                        <div className='jcontent'>
                            <h3>Welcome to Code2Face</h3>

                        </div>
                        <div className='jcontent mt4'>
                            <h4>Start a New Session</h4>
                            <Form>
                                <Form.Group className="mmb fin d-flex" controlId="">
                                    
                                    <Form.Control 
                                        className='genInp' 
                                        type="text" 
                                        placeholder="#uniqueId" 
                                        disabled 
                                        name="sid"
                                        // onChange={handleChange}
                                        value={sid}
                                    />
                                    {/* <CopyToClipboard> */}
                                        <Button className="btn-dark gen-btn"
                                            onClick={generateCode}
                                        >Generate {fclick ? 'Again' : 'Code'}</Button>
                                    {/* </CopyToClipboard> */}
                                </Form.Group>
                                {/* <Form.Group >
                                    <Button onClick={handleJoin}>Start</Button>
                                </Form.Group> */}
                            </Form>
                            
                        </div>
                        <div className='jcontent mt-4'>
                            <h4>Join with Code</h4>
                            <Form>
                                <Form.Group className="mmb fin " >
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Id" 
                                        name="sid1"
                                        onChange={handleChange1}
                                        value={sid1}
                                        
                                    />
                                    <Form.Text>{validText}</Form.Text>
                                </Form.Group>
                                
                            </Form>

                        </div>
                        <div className='jcontent'>

                            <Form>
                                <Form.Group className="mmb fin d-flex" controlId="">
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Enter your good Name" 
                       
                                        name="uname"
                                        onChange={handleNameChange}
                                        value={uname}
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Check
                                        type="switch"
                                        id="custom-switch"
                                        label="I am Interviewer"
                                        value={interviewer}
                                        name='interviewer'
                                        onChange={handleSwitch}
                                    />
                                </Form.Group>
                                <Form.Group >
                                    <Button onClick={handleJoin}>Join Call</Button>
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