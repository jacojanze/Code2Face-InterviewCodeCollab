import React, {useState, createContext, useRef, useEffect} from "react";
import { initSocket } from '../socket';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import Editor from '../components/editor';
import ACTIONS from '../Actions';
import {io} from 'socket.io-client'
import Peer from 'simple-peer';

const SocketContext = createContext();

const socket = io('http://172.19.19.204:3007');


const VElement = (userVideo) => {
    return (
        <div className='velement'>
            <video playsInline ref={userVideo} muted autoPlay className='' />
        </div>
    )
}

const CallPage = () => {
    
    const { roomId } = useParams();
    const [stream, setstream] = useState()
    const [accept, setAccept] = useState(false)
    const [ended, setEnded] = useState(false)

    const myVideo = useRef()
    const userVideo = useRef();
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const history = useNavigate();
    const [clients, setClients] = useState([]);


    useEffect(() => {
        let dataStream = null
        //take camera permission
        navigator?.mediaDevices?.getUserMedia({video : true, audio : true})
            .then(videoStream => {
                dataStream= videoStream
                setstream(videoStream);
                myVideo.current.srcObject = videoStream;
            })
            .catch(err => {
                setstream('/noCam.png')
            })

        //socket connecting function
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                history('/');
                return
            }
            console.log(socketRef);
            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        //initiate socket
        init();
        console.log(roomId);
        // Clean up function to remove camera permissions ans end socket
        return () => {
            if (dataStream) {
            const tracks = dataStream.getTracks();
            tracks.forEach((track) => track.stop());
            }
            socketRef.current?.disconnect();
            socketRef.current?.off(ACTIONS.JOINED);
            socketRef.current?.off(ACTIONS.DISCONNECTED);
        };

        
    }, []);

    function leaveRoom() {
        history('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

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
                {/* {
                    accept && !ended && 
                    (
                        <div className='velement'>

                            <video playsInline ref={userVideo} muted autoPlay className='' />
                        </div>
                    )
                } */}
                    <div className="clientsList">
                        {clients.map((client) => (
                            console.log(client.id)
                            // <VElement key={client.id}  userVideo= {userVideo} />
                        ))}
                    </div>
                </div>
                
                <div className='row options'>

                </div>
                
            </div>
            <div className='ECcont'>
                <div className='econt'>
                    <Editor
                        socketRef={socketRef}
                        roomId={roomId}
                        onCodeChange={(code) => {
                                codeRef.current = code;
                            }
                        }
                    />
                </div>
                <div className='ccont' >

                </div>
            </div>
        </div>
    )
}

export default CallPage