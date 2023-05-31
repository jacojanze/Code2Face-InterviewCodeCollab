import React, {useState, createContext, useRef, useEffect} from "react";
import { initSocket } from '../socket';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import Editor from '../components/editor';
import ACTIONS from '../Actions';
import {io} from 'socket.io-client'
import Peer from 'simple-peer';
import { Button } from "react-bootstrap";
const SocketContext = createContext();

const socket = io('http://172.19.19.204:3007');



const CallPage = () => {
    
    const location = useLocation();
    const history = useNavigate();
    const myName = location.state?.username
    
    const [clients, setClients] = useState([]);
    const { roomId } = useParams();
    const [stream, setstream] = useState()
    const [accept, setAccept] = useState(false)
    const [ended, setEnded] = useState(false)
    const [otherName, setOtherName] = useState('')

    const myVideo = useRef()
    const userVideo = useRef()
    const connectionRef = useRef();
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    let dclient = {}


    useEffect(() => {
        let dataStream = null
        //take camera permission
        navigator?.mediaDevices?.getUserMedia({video : true, audio : true})
            .then(videoStream => {
                dataStream= videoStream
                setstream(videoStream);
                myVideo.current.srcObject = videoStream;
                // initialize socket
                init()
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

            //Send join info
            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: myName,
            });

            function InitPeer(type) {
                let peer = new Peer({initiator: type=='init' ? true : false, stream, trickle: false})
                peer.on('stream', (ustream) => {
                    const vel = (
                        <div className='row'>
                            <div className='velement'>

                                {/* <video playsInline ref={ustream} muted autoPlay className='' /> */}
                            </div>
                        </div>
                    )
                    document.querySelector('#peerDiv').appendChild(vel)
                })
                peer.on('data', (data) => {
                    userVideo.current.srcObject = data
                })
                console.log(1);
                
                return peer
            }

            //for peer of type init
            function MakePeer() {
                dclient.gotAnswer = false
                let peer = InitPeer('init')
                peer.on('signal', function (data) {
                    if (!dclient.gotAnswer) {
                        socket.emit('Offer', data)
                    }
                })
                console.log(12);
                dclient.peer = peer
            }

            // for peer of type not init
            function FrontAnswer(offer) {
                let peer = InitPeer('notInit')
                peer.on('signal', (data) => {
                    socket.emit('Answer', data)
                })
                peer.signal(offer)
                console.log(1123);
                dclient.peer = peer
            }

            function SignalAnswer(answer) {
                dclient.gotAnswer = true
                let peer = dclient.peer
                peer.signal(answer)
            }


            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                 
                    }
                    // setClients(clients);
                }
            );
            
            // recv user stream
            socketRef.current?.on(ACTIONS.RECV_STREAM, ({ username, stream }) => {
                console.log(`Received stream from ${username}`, stream);
                const video = document.getElementById('received-video');
                if (video) {
                    // video.srcObject = stream;
                }
                userVideo.current.srcObject = stream

              });

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

        
        // Clean up function to remove camera permissions ans end socket
        return () => {
            if (dataStream) {
                const tracks = dataStream.getTracks();
                tracks.forEach((track) => track.stop());
            }
            socketRef.current?.off(ACTIONS.JOINED);
            socketRef.current?.off(ACTIONS.DISCONNECTED);
            socketRef.current?.disconnect();
        };

        
    }, []);

    function leaveRoom() {
        setEnded(true)
        socketRef.current.destroy();
        history('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    const handleSendStream = () => {
        console.log(stream);
        socketRef.current.emit(ACTIONS.SEND_STREAM, {
        username:myName, // Replace with the appropriate username
        roomId,
        stream
        });
    };
    



    return (
        <div className='callpage'>
            <div className='vcont' id='peerDiv'>
                <div className='row'>
                {
                    stream &&
                    (
                        <div className='velement'>

                            <video playsInline ref={myVideo} muted autoPlay className='' id="myvid" />
                        </div>
                    )
                    
                }
                </div>
                <div className='row'>
                {
                    userVideo && 
                    (
                        <div className='velement'>
                            
                            <video playsInline ref={userVideo} muted autoPlay className='' id='received-video' />
                        </div>
                    )
                }
                    
                </div>

                
                <div className='row options'>
                    <Button onClick={handleSendStream}>Send Stream</Button>

                    <Button onClick={leaveRoom} className="mt-5">Leave</Button>
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