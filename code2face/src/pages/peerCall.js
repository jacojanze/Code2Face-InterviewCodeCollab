import React, {useState, createContext, useRef, useEffect} from "react";

import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';

import {Peer} from 'peerjs'
import { Button } from "react-bootstrap";
import * as faceapi from 'face-api.js'
import Chat from "../components/chat";
import "../styles/callpage.css"


const PeerCall = () => {
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

    const [allPeers, setAllPeers] = useState([])
    const [stream, setstream] = useState(null)
    const [audio, setAudio] = useState()
    const [display, setdisplay] = useState()
    const [displayCheck, setDisplayCheck] = useState(false)
    const [myPeerId, setMyPeerId] = useState(null)
    const [sirId, setsirId] = useState(null)
    const myVideo = useRef() 
    const codeRef = useRef(null);
    const [code, setcode] = useState(`one\ntwo\nthree\nfour\nfive`)
    
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
        // console.log(myVideo);
        if(!myVideo.current) return;
        
        timer = setInterval(async()=> {
            if(warned) {
                if(sirId) {}
                    // socketRef?.current?.emit(ACTIONS.BEHAVIOUR , {roomId})
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
        navigator?.mediaDevices?.getUserMedia({video : true})
            .then(videoStream => {
                dataStream= videoStream;
                setstream(videoStream);
                // myVideo.current.srcObject = videoStream;
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
            
            // PeerJS functionality starts 
            peer = new Peer()
            // once peer created join room
            peer.on('open', function(id) {
                setMyPeerId(id)
                console.log('my peer id ', id, myPeerId);
                addVideo(videoStream, id, myName)
                let flag = interviewer ? false :  true
                fetch('http://localhost:3007/join', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        roomId,
                    username: myName,
                    peerId:id,
                    flag
                    })
                }).then(res => res.json())
                .then(data => {
                    // console.log(data);
                    setAllPeers(data);
                    for(const {peerId, username} of data) {
                   
                        let conn = peer.connect(peerId)
    
                        conn.on("open", () => {
                            
                            conn.send({id, name:myName})
                            let call = peer.call(peerId, videoStream)
                           
                            console.log('Connected to ', peerId);
                            
                            call.on('stream', (remoteStream) => {
                                console.log('call accepted ', username);
                                addVideo(remoteStream, peerId, username)
                            })
                        })
    
    
                        conn.on('close', () => {
                            const element = document.getElementById(peerId);
                            element?.remove();
                        })
                  
                        if(peerId == sirId) {
                            toast.success('Interviewer Joined')
                        }
                    }
                })
                .catch(err => {
                    console.log(err);
                })
                
            });

            peer.on("connection", (conn) => {
                conn.on('data', ({id,name}) => {
                    console.log('received name form ,', name);
                    idName[id]=name
                })
                conn.on('close', () => {
                    toast.success(`${idName[conn.peer]} left the Call`)
                    const element = document.getElementById(conn.peer);
                    element?.remove();
                })
            });

            peer.on('call', (call) => {
                call.answer(videoStream)
                console.log('call received ', call.peer, idName);
                call.on('stream', (remoteStream) => {
                    console.log('received stream from remote user');
                    addVideo(remoteStream, call.peer, idName[call.peer])
                })
                toast.success(`${call.peer} joined the Call`)
            })


            
        };

        // Clean up function to remove camera permissions and end socket
        return () => {

            clearInterval(timer)
            if(peer) {
                try {
                    fetch('http://localhost:3007/leave', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        roomId,
                        peerId:myPeerId,
                    })
                    })
                } catch(err) {
                    console.log(err);
                    toast.error("Coudn't leave the room at the current moment")
                }
                for(let vals of peer._connections) {
                    for(let conn of vals[1]) {
                        // console.log(conns);
                        conn.peerConnection.close();
                    }
                }
            }
        };
    }, []);

    
    function addVideo(vstream, peerID, userName="user" ) {
        const prev = document.getElementById(peerID)
        prev?.remove()
        const row = document.createElement('div')
        row.setAttribute('className', 'row')
        row.setAttribute('id', peerID)

        const video = document.createElement('video')
        video.srcObject=vstream;
        video.muted = true
        video.addEventListener('loadedmetadata', () => {
            video.play()
        })
        console.log(peerID, myPeerId);
        if(peerID==myPeerId) {
            myVideo.current = video
        }

        const span = document.createElement('span')
        span.innerText = userName
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

    const screenShareHandler = async(e) => {
        e.preventDefault()
        setDisplayCheck(!displayCheck)
        idName['screen'] = 'screen'
        navigator?.mediaDevices?.getDisplayMedia({audio : true}).then( displStream => {

            dataStream=displStream
            let ele = document.getElementById('myvid');
            ele.srcObject = displStream

        }).catch((error) => {
            console.log(error);
        });

    }

    function stopCapture(evt) {
        setDisplayCheck(!displayCheck)

        let ele = document.getElementById('myvid');
        if (ele && ele.srcObject ) {
            const tracks = ele.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
        }
        dataStream = stream
        ele.srcObject = stream

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
                
                <div className='row options'>
                    <Button onClick={!displayCheck ? screenShareHandler : stopCapture} className="mt-2"  style={{width:'180px', margin:'auto'}}>{!displayCheck?'Screen Share' : 'Stop Share'}</Button>
                    <Button onClick={leaveRoom} className="mt-2 btn-danger" style={{width:'120px', margin:'auto'}}>Leave</Button>

                </div>
                
            </div>
            
            
        </div>
    )
}

export default PeerCall