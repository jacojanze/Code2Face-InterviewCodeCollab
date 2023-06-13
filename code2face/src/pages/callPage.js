import React, {useState, createContext, useRef, useEffect} from "react";
import { initSocket } from '../socket';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import Editor from '../components/editor';
import ACTIONS from '../Actions';
import {Peer} from 'peerjs'
import { Button } from "react-bootstrap";
import * as faceapi from 'face-api.js'
import Chat from "../components/chat";
import "../styles/callpage.css"
const SocketContext = createContext();


const CallPage = () => {
    const location = useLocation();
    const history = useNavigate();
    const myName = location.state?.username
    let interviewer = localStorage.getItem('init')
    const MOTION_THRESHOLD = 15;
    var userMoves =0 ;
    let isMounted = false;
    var previousLandmarks = null;
    var warned = false;
    let refresh = 1;

    const [clients, setClients] = useState([]);
    const { roomId } = useParams();
    const [stream, setstream] = useState()
    const [accept, setAccept] = useState(false)
    const [ended, setEnded] = useState(false)
    const [otherName, setOtherName] = useState('')
    const [sid, setSid] = useState()
    const myVideo = useRef()
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const [mySocketID, setmySocketID] = useState(null)
    
    

    function analyzeFaceMotions(landmarks) {       
        const currentLandmarks = landmarks._positions;

        if (previousLandmarks && currentLandmarks.length == 68) {
            let totalMotion = 0, averageMotion =0 ;
            for(let i=0;i<68;i++) {
                const dx=currentLandmarks[i]._x - previousLandmarks[i]._x;
                const dy = currentLandmarks[i]._y - previousLandmarks[i]._y;
                const distance = Math.sqrt(dx*dx + dy*dy)
                totalMotion+= distance
            }            
            averageMotion = totalMotion / 68;
            // console.log(averageMotion);
            if (averageMotion > MOTION_THRESHOLD) {
                toast('Face motion detected, Please concentrate on the interview', {
                    icon: '❕',
                });
                userMoves++;
            }
        } 
        previousLandmarks = currentLandmarks;
    }

    async function detectFaceMotions() {
        refresh = refresh%3;
        setInterval(async()=> {
            // if(warned) {
            //     leaveRoom();
            //     Location.reload()
            // }
            if(userMoves > 200) {
                toast.error("Warning! Session will be ended if movement is observed again.")
                warned=true;
            }
            const detections  = await  faceapi.detectAllFaces(myVideo.current, 
                new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
            
            if(myVideo.current && detections.length==0) {
                toast.error("Please sit in a well lit room and face the Webcam!")
                userMoves++;
            }
            else if(detections?.length > 1) {
                toast.error(`${detections.length} persons spotted in camera`)
                userMoves++;
            }
            else if(detections && detections.length==1){
                analyzeFaceMotions(detections[0].landmarks)
            } else {
                console.log(detections);
                toast.error(" Please face the webcam!")
            }

        }, 1200 * refresh)
        refresh++;
        
    }

    useEffect(() => {
        isMounted = true;
        let dataStream = null
        //take camera permission
        navigator?.mediaDevices?.getUserMedia({video : true, audio : true})
            .then(videoStream => {
                dataStream= videoStream
                setstream(videoStream);
                myVideo.current.srcObject = videoStream;
                // initialize socket
                // console.log(myVideo);
                init(videoStream)

                
            })
            .catch((error) => {
                console.log(error);
            });
        //load faceapi Models
        loadModels()
        
        //socket connecting function
        const init = async (videoStream) => {
            socketRef.current = await initSocket();
            // console.log(socketRef);
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                history('/');
                return
            }
            
            socketRef.current.on('yourID', data => {
                setmySocketID(data.id)
            })

            // const peer = new Peer(mySocketID, {host:'peerjs-server.herokuapp.com', secure:true, port:443})
            const peer = new Peer(mySocketID)
            // console.log(peer);

            peer.on("connection", (conn) => {
                console.log(conn);
                conn.on("data", (data) => {
                    // Will print 'hi!'
                    console.log(data);
                });
                conn.on("open", () => {
                    conn.send("hello!");
                });
            });

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
                        const conn = peer.connect(socketId)
                        console.log(peer, conn);
                        conn.on("open", () => {
                            conn.send('hi from ', mySocketID)
                        })
                        // console.log(username, 'joined!');
                        toast.success(`${username} joined the room.`);

                    } else {
                        // console.log('me mine');
                        localStorage.setItem('sid', socketId)
                        setSid(socketId)
                    }
                    // socket
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
        // Clean up function to remove camera permissions ans end socket
        return () => {
            isMounted = false
            if (dataStream) {
                const tracks = dataStream.getTracks();
                tracks.forEach((track) => track.stop());
            }
            // myVideo.current = null
            socketRef.current?.off(ACTIONS.JOINED);
            socketRef.current?.off(ACTIONS.DISCONNECTED);
            socketRef.current?.disconnect();
        };
    }, []);

    useEffect(() => {
        if(myVideo.current ) {
            // console.log(isMounted);
            // detectFaceMotions()
        }
    }, [myVideo])

    const loadModels =  () => {
        Promise.all([
            faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
            faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
            faceapi.loadFaceLandmarkTinyModel("/models")
        ]).then(() => {
            // console.log('Models Loaded');
        })
    }

    function leaveRoom() {
        setEnded(true)
        // myVideo?.current.clear();
        socketRef?.current.destroy();
        history('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    function addVideo(stream, username = 'user') {
        // // console.log(2);
        // if(bool) {
        //     const video  =document.getElementById('myVid')
        //     video.muted=true;
        //     video.srcObject=stream;
        //     video.addEventListener('loadedmetadata', () => {
        //         video.play()
        //     })
        // } else {
            const row = document.createElement('div')
            row.setAttribute('className', 'row')
            const video = document.createElement('video')
            video.srcObject=stream;
            video.addEventListener('loadedmetadata', () => {
                video.play()
            })
            const span = document.createElement('span')
            span.innerText = username
            span.setAttribute('className', 'tagName')
            row.append(video)
            row.append(span)
            const peerDiv  = document.getElementById('peerDiv')
            peerDiv.insertBefore(row, peerDiv.children[0])
        // }
    }

    return (
        <div className='callpage'>
            <div className='vcont' id='peerDiv'>
                <div className='row' id="myrow">
                    {  stream && (
                        <div className='velement'>

                            <video playsInline ref={myVideo} muted autoPlay className='' id="myvid" />
                            <span className="tagName">{myName}</span>
                        </div>
                    )
                }
                </div>
                <div className='row'>
                {/* {   
                accept &&   (
                        <div className='velement'>
                            
                            <video playsInline ref={userVideo} muted autoPlay className='' id='received-video' />
                        </div>
                    )
                } */}
                </div>
                <div className='row options'>

                    <Button onClick={leaveRoom} className="mt-5" style={{width:'120px', margin:'auto'}}>Leave</Button>
                </div>
                <div className="row">
                    <Chat />
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