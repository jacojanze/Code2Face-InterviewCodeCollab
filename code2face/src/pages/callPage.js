import React, {useContext} from 'react'
import { useState,useEffect } from 'react';
import { SocketContext } from '../Context';



const CallPage = (sid) => {
    const {call,
        accept,
        ended,
        Id,
        myVideo,
        userVideo,
        stream,
        name,
    } = useContext(SocketContext)

    // console.log(context);

    return (
        <div className='callpage'>
            <div className='vcont'>
                <div className='row'>
                {
                    stream && (
                        <div className='velement'>
                            <video playsInline ref={myVideo} muted autoPlay className='' />
                        </div>
                    )
                }
                {
                    // accept && !ended && 
                    (
                        <div className='velement'>

                            <video playsInline ref={userVideo} muted autoPlay className='' />
                        </div>
                    )
                }
                </div>
                
                <div className='row options'>

                </div>
                
            </div>
            <div className='ECcont'>
                <div className='econt'>

                </div>
                <div className='ccont' >

                </div>
            </div>
        </div>
    )
}

export default CallPage