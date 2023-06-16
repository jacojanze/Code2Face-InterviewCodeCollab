import React, {useEffect, useState} from 'react'
import { Form, Button } from 'react-bootstrap'
import toast from 'react-hot-toast'

import "../styles/chat.css"
import ACTIONS from '../Actions'

const Chat = ({socketRef, roomId, username}) => {

    const [msg, setmsg] = useState('')

    useEffect(() => {
        socketRef.current?.on(ACTIONS.RECV_MSG, ({sender,text}) => {
            addRecvMsg(text,sender)
        })
    },[socketRef.current])

    const handleChange = (e) => {
        setmsg(e.target.value)
    }

    const handleSend = (e) => {
        e.preventDefault();
        if(msg.length==0) return;
        
        socketRef?.current?.emit(ACTIONS.SEND_MSG, {
            roomId,
            sender:username,
            msg
        })
        addSendMsg(msg)
        setmsg('')
    }


    const addRecvMsg = (text,name='Unknown') => {
        const element = 
            ` <div class='receive'>
                    <div class='msg'>
                    <span class='senderName' >${name}</span>
                       ${text}
                    </div>
                </div>`;
        const rdiv = document.createElement('div')
        rdiv.innerHTML=element
        rdiv.setAttribute('class', 'msg-container')
        const par = document.getElementById('msg-div')
        par?.appendChild(rdiv)  
        par.scrollTop = par.scrollHeight
    }
    
    const addSendMsg = (text) => {
        const element = 
            ` <div class='send'>
                    <div class='msg'>
                       ${text}
                    </div>
                </div>`;
        const rdiv = document.createElement('div')
        rdiv.innerHTML=element
        rdiv.setAttribute('class', 'msg-container')
        
        const par = document.getElementById('msg-div')
        par?.appendChild(rdiv)  
        par.scrollTop = par.scrollHeight  
    }


    return (
        <div className='chatCont mt5'>
            <div className='chatBox'>
                <div className='scroller' id='msg-div'>
                </div>
                <div className='minp'>
                    <Form onSubmit={handleSend}>

                    
                        <Form.Control
                            type="text" 
                            placeholder="Enter message" 
                            name="msg"
                            onChange={handleChange}
                            value={msg}
                            className='finp inlin'
                        />
                        {/* <Button className='inlin' onClick={handleSend}> Send</Button> */}
                    </Form>
                </div>
            </div>
        </div>
    )
}

export default Chat