import React, {useState, createContext, useRef, useEffect} from "react";
import {io} from 'socket.io-client'
import Peer from 'simple-peer';

const SocketContext = createContext();

const socket = io('http://localhost:3007');

const ContextProvider = ({children}) => {
    
    const [call, setCall] = useState({})
    const [name, setName] = useState('')
    const [Id, setId] = useState('')
    const [stream, setstream] = useState()
    const [accept, setAccept] = useState(false)
    const [ended, setEnded] = useState(false)

    const myVideo = useRef()
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({video : true, audio : true})
            .then(dataStream => {
                setstream(dataStream);
                myVideo.current.srcObject = dataStream;
            })
            .catch(err => {
                setstream('/noCam.png')
            })

        socket.on('user joined', id => setId(id))
        socket.on('calluser', ({src,name:callerName, signal}) => {
            setCall({isReceive : true, src,name : callerName, signal})
        })
    },[])

    const answerCall = () => {
        setAccept(true)

        const peer = new Peer({initiator:false, trickle:false, stream})
        peer.on('signal', (data) => {
            socket.emit('answercall', {signal : data, to:call.dest})
        })

        peer.on('stream', (dataStream) => {
            userVideo.current.srcObject = dataStream;
        })

        peer.signal(call.signal)

        connectionRef.current = peer;
    }

    const caller = (id) => {
        const peer = new Peer({initiator:true, trickle:false, stream});

        peer.on('signal', (data) => {
            socket.emit('calluser', {
                dest:id,
                signalData:data,
                src:Id,
                name
            })
        })
        peer.on('stream' , dataStream => {
            userVideo.current.srcObject = dataStream
        })

        socket.on('callAccepted', signal => {
            setAccept(true);
            peer.signal(signal)
        })

        connectionRef.current = peer;
    }

    const leaveCall = () => {
        setEnded(true);
    
        connectionRef.current.destroy();
    
        window.location.reload();
    };

    return(
        <SocketContext.Provider 
            value={{
                call,
                accept,
                ended,
                Id,
                myVideo,
                userVideo,
                stream,
                name,
                setName,
                caller,
                answerCall,
                leaveCall
            }}
        >
            {children}
        </SocketContext.Provider>
    )
}

export {ContextProvider , SocketContext}


