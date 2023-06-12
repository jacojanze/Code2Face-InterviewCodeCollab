import React, {useState} from 'react'
import { Form, Button } from 'react-bootstrap'
import toast from 'react-hot-toast'

import "../styles/chat.css"

const Chat = () => {

    const [msg, setmsg] = useState('message')

    const handleChange = (e) => {
        setmsg(e.target.value)
    }

    return (
        <div className='chatCont mt5'>
            <div className='chatBox'>
                <div className='scroller'>

                </div>
                <div className='minp'>
                    <Form>
                        <Form.Control
                            type="text" 
                            placeholder="Enter message" 
                            name="msg"
                            onChange={handleChange}
                            value={msg}
                            className='finp'
                        />
                        <Button className='finp'> Send</Button>
                    </Form>
                </div>
            </div>
        </div>
    )
}

export default Chat