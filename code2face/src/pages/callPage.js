import React, {useState, createContext, useRef, useEffect} from "react";
import { initSocket } from '../socket';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import Editor from '../components/editor';
import ACTIONS from '../Actions';
import {io} from 'socket.io-client'
import Peer from 'simple-peer';
import { Button } from "react-bootstrap";

import * as faceapi from 'face-api.js'
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/face-landmarks-detection';


const SocketContext = createContext();

const socket = io('http://172.19.19.204:3007');

const MOTION_THRESHOLD = 10;

let previousLandmarks = null;

function analyzeFaceMotions(predictions) {
  const currentLandmarks = predictions[0].scaledMesh;

  if (previousLandmarks) {
    let totalMotion = 0;
    for (let i = 0; i < currentLandmarks.length; i++) {
      const dx = currentLandmarks[i][0] - previousLandmarks[i][0];
      const dy = currentLandmarks[i][1] - previousLandmarks[i][1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      totalMotion += distance;
    }

    const averageMotion = totalMotion / currentLandmarks.length;

    if (averageMotion > MOTION_THRESHOLD) {
    toast('Face motion detected, Please concentrate on the inteerview', {
        icon: '❕',
      });
    }
  }

  previousLandmarks = currentLandmarks;
}

async function detectFaceMotions(videoElement) {
    // const model = facemesh.SupportedModels.MediaPipeFaceMesh;
    // const detectorConfig = {
    //   runtime: 'mediapipe', // or 'tfjs'
    //   solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
    // }
    // const detector = await facemesh.createDetector(model, detectorConfig);
    
    // setInterval(async () => {
      const predictions = await detector.estimateFaces({ input: videoElement });
  
    //   if (predictions.length > 0) {
    //     analyzeFaceMotions(predictions);
    //   }
    // }, 100); // Adjust the interval (in milliseconds) as needed
  }
  



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
    const [sid, setSid] = useState()
    const myVideo = useRef()
    const userVideo = useRef()
    const connectionRef = useRef();
    const socketRef = useRef(null);
    const codeRef = useRef(null);

    let dclient = {}
    let interviewer = localStorage.getItem('init')

    useEffect(() => {
        let dataStream = null
        //take camera permission
        navigator?.mediaDevices?.getUserMedia({video : true, audio : true})
            .then(videoStream => {
                dataStream= videoStream
                setstream(videoStream);
                myVideo.current.srcObject = videoStream;
                // initialize socket
                console.log(videoStream);
                init(videoStream)

                
            })
            .catch((error) => {
                console.log(error);
            });

        //socket connecting function
        const init = async (videoStream) => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            // // setSid(socketRef.current.id)
            // localStorage.setItem('sdf', socketRef.current)
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
                stream: videoStream
            });



            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId , ustream}) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        // console.log(ustream);
                        // userVideo.current.srcObject = ustream;
                    } else {
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
            if (dataStream) {
                const tracks = dataStream.getTracks();
                tracks.forEach((track) => track.stop());
            }
            socketRef.current?.off(ACTIONS.JOINED);
            socketRef.current?.off(ACTIONS.DISCONNECTED);
            socketRef.current?.disconnect();
        };

        
    }, []);

    useEffect(() => {
        if(myVideo.current) {
            detectFaceMotions(myVideo.current)
        }
    }, [myVideo.current])

    function leaveRoom() {
        setEnded(true)
        socketRef.current.destroy();
        history('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }


    

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
                {   
                // accept &&   (
                        <div className='velement'>
                            
                            <video playsInline ref={userVideo} muted autoPlay className='' id='received-video' />
                        </div>
                    // )
                }
                </div>
                <div className='row options'>

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