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


const CallPage = () => {
    const location = useLocation();
    const history = useNavigate();
    const { roomId } = useParams();

    const myName = location.state?.username
    const interviewer = location.state?.interviewer

    const MOTION_THRESHOLD = 20;
    const userPeerIdMap = new Map()
    const idName = new Map()

 
    var userMoves =0 ;
    var previousLandmarks = null;
    var warned = false;
    var peer = null
    var dataStream = null
    var timer;

    const [stream, setstream] = useState()
    const [myPeerId, setmyPeerId] = useState(null)
    const [sirId, setsirId] = useState(null)
    const myVideo = useRef()
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const [globalCode, setglobalCode] = useState(`one
two
three
four
five`)
    
    //Face motion logic
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
        if(!myVideo.current) return;
        
        timer = setInterval(async()=> {
            if(warned) {
                if(sirId)
                    socketRef?.current?.emit(ACTIONS.BEHAVIOUR , {roomId})
                else {
                    toast.error('Please Behave until the Interviewer joins')
                }
                warned=false
                userMoves=0
                return
            }
            if(userMoves > 12) {
                toast.error("Warning! Interviewer will be notified if movement is observed again.")
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

        }, 1000 )
    }

    useEffect(() => {

        //take camera permission
        navigator?.mediaDevices?.getUserMedia({video : true, audio : true})
            .then(videoStream => {
                dataStream= videoStream
                setstream(videoStream);
                myVideo.current.srcObject = videoStream;
                // initialize socket
                init(videoStream)

                if(interviewer)
                    detectFaceMotions()
            })
            .catch((error) => {
                console.log(error);
                // alert('Camera permissions nedded to proceed with the Call')
            });

        //load faceapi Models
        loadModels()
        
        //socket connecting function
        const init = async (videoStream) => {
            socketRef.current = await initSocket();
             
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                history('/');
                return
            }
            
            // PeerJS functionality starts 
            peer = new Peer()
            // once peer created join room
            peer.on('open', function(id) {
                setmyPeerId(id)
                //Send joining info
                // console.log(interviewer);
                let flag = interviewer ? false : true
                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username: myName,
                    peerId:id,
                    flag
                });

            });

            peer.on("connection", (conn) => {
                conn.on('close', () => {
                    const element = document.getElementById(conn.peer);
                    element?.remove();
                })
            });

            peer.on('call', (call) => {
                call.answer(videoStream)
                call.on('stream', (remoteStream) => {
                    addVideo(remoteStream, call.peer)
                })
            })

            socketRef.current.on(ACTIONS.MONITOR, () => {
                toast('Please Monitor the Interviewees Movements')
            })

            //update existing users names and ids to current user
            socketRef.current.on(ACTIONS.SHARE_PEER_IDS, ({userPeer, InterviewPeer}) => {
                const keys = Object.keys(userPeer)
                if(InterviewPeer )
                    setsirId(InterviewPeer)
                for(let key of keys) {
                    idName[key] = userPeer[key]
                }
            })

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ username, socketId, peerId }) => {
                    if (username !== location.state?.username) {

                        socketRef.current.emit(ACTIONS.SYNC_CODE, {socketId, globalCode})
                        console.log(globalCode);
                        var conn = peer.connect(peerId)
                        idName[peerId] = username
                        userPeerIdMap[username] = conn

                        conn.on("open", () => {

                            var call = peer.call(peerId, videoStream)
                            call.on('stream', (remoteStream) => {
                                addVideo(remoteStream, peerId)
                            })
                        })


                        conn.on('close', () => {
                            const element = document.getElementById(peerId);
                            element?.remove();
                        })
                        toast.success(`${username} joined the room.`);
                        if(peerId == sirId) {
                            toast.success('Interviewer Joined')
                        }
                    } 
                }
            );

            socketRef.current.on(ACTIONS.SIR_JOined, ({peerId}) => {
                setsirId(peerId)
                toast.success('Interviewer Joined')

            })

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                }
            );
        };

        // Clean up function to remove camera permissions ans end socket
        return () => {

            clearInterval(timer)
            if (dataStream) {
                const tracks = dataStream.getTracks();
                tracks.forEach((track) => track.stop());
            }
            if(peer) {
                for(let vals of peer._connections) {
                    for(let conn of vals[1]) {
                        // console.log(conns);
                        conn.peerConnection.close();
                    }
                }
            }
            socketRef.current?.off(ACTIONS.JOINED);
            socketRef.current?.off(ACTIONS.DISCONNECTED);
            socketRef.current?.disconnect();
        };
    }, []);

    
    function addVideo(stream, peerID) {

        const row = document.createElement('div')
        row.setAttribute('className', 'row')
        row.setAttribute('id', peerID)

        const video = document.createElement('video')
        video.srcObject=stream;
        video.muted = true
        video.addEventListener('loadedmetadata', () => {
            video.play()
        })

        const span = document.createElement('span')
        span.innerText = idName[peerID]
        span.setAttribute('class', 'tagName')

        row.append(video)
        row.append(span)

        const exist = document.getElementById(peerID)
        if(exist) return

        const peerDiv  = document.getElementById('peerDiv')

        peerDiv.insertBefore(row, peerDiv.children[0])

    }

    const loadModels =  () => {
        Promise.all([
            faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
            faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
            faceapi.loadFaceLandmarkTinyModel("/models")
        ]).then(() => {
            // console.log('Models Loaded');
        }).catch(err => {
            console.log('FaceAPI modules loading error', err);
        })

    }

    function leaveRoom() {
        clearInterval(timer)
        history('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
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
                <div className="row">
                    <Chat 
                        socketRef={socketRef}
                        roomId={roomId}
                        username = {myName}
                    />
                </div>
                <div className='row options'>

                    <Button onClick={leaveRoom} className="mt-5 btn-danger" style={{width:'120px', margin:'auto'}}>Leave</Button>
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
                        globalCode = {globalCode}
                        setglobalCode = {setglobalCode}
                    />
                </div>
                
            </div>
        </div>
    )
}

export default CallPage