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

                var peer1 = new Peer({ initiator: true, stream: stream })
           

                peer1.on('signal', data => {
         
                    console.log(data, '1');
                })

         
                peer1.on('stream', stream => {
                    // got remote video stream, now let's show it in a video tag
                    var video = document.querySelector('video')

                    if ('srcObject' in video) {
                    video.srcObject = stream
                    } else {
                    video.src = window.URL.createObjectURL(stream) // for older browsers
                    }

                    video.play()
                })
            })
            .catch((error) => {
                console.log(error);
            });

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

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                 
                    }
                    localStorage.setItem('sockId', socketId)
                }
            );
            
            // recv user stream
            socketRef.current?.on(ACTIONS.RECV_STREAM, ({ username, stream }) => {
                // setAccept(true)
                // console.log(`Received stream from ${username}`,stream);
                // const video = document.getElementById('received-video');
                // console.log(video);
                // // userVideo.current?.srcObject = stream
                // video.srcObject = stream
                // if (video) {
                //     if ('srcObject' in video) {
                //       video.srcObject = stream;
                //     } else {
                //       console.error('srcObject is not supported in this browser.');
                //     }
                //   } else {
                //     console.error('Video element with id "received-video" not found.');
                //   }
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

    // if(stream==null) alert('Please accept camera permissions prompt')

    const handleSendStream = () => {
        // const video = document.getElementById('myvid');
        // console.log('sending stream', video.srcObject);

        // socketRef.current.emit(ACTIONS.SEND_STREAM, {
        // username:myName,
        // roomId,
        // stream:video.srcObject
        // });
    };
    

    return (
        <div className='callpage'>
            <div className='vcont' id='peerDiv'>
                <div className='row'>
                    {  stream && (
                        <div className='velement'>

                            <video playsInline ref={myVideo} muted autoPlay className='' id="myvid" />
                        </div>
                    )
                }
                </div>
                <div className='row'>
                {   accept &&   (
                        <div className='velement'>
                            
                            <video playsInline ref={userVideo} muted autoPlay className='' id='received-video' />
                        </div>
                    )
                }
                </div>
                <div className='row options'>
                    {/* <Button onClick={handleSendStream}>Send Stream</Button> */}

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