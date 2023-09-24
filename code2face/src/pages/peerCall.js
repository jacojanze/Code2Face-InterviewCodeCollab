import React, {useState, createContext, useRef, useEffect} from "react";

import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import {Peer} from 'peerjs'
import { Button } from "react-bootstrap";
import * as faceapi from 'face-api.js'
import Chat from "../components/pchat";
import copy from 'copy-to-clipboard';
import Editor from "../components/peditor";
import "../styles/callpage.css";
const server = process.env.REACT_APP_BACKEND_URI;
const server_host = process.env.REACT_APP_BACKEND_HOST;
const PeerCall = () => {
    const location = useLocation();
    const history = useNavigate();
    const { roomId } = useParams();

    const myName = location.state?.username
    const interviewer = location.state?.interviewer

    const MOTION_THRESHOLD = 40;
    // const myConns = new Map()
    const [myConns, setMyConns] = useState(new Map())
    const [mycalls,setMyCalls] = useState(new Set())
    const idName = new Map()

 
    var userMoves =0 ;
    var previousLandmarks = null;
    var warned = false;
    var peer = null
    var dataStream = null
    var screenStream = null
    var myPeerId;
    var timer;

    const [allPeers, setAllPeers] = useState([])
    const [stream, setstream] = useState(null)

    const [lang, setLang] = useState('javascript')
    const [chatState, setChatState] = useState(false)
    const [displayCheck, setDisplayCheck] = useState(false)
    const [sirId, setsirId] = useState(null)
    const myVideo = useRef() 
    const [code, setcode] = useState(`console.log("Live shared Code Editor")`)
    
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
                userMoves=userMoves-2;
                warned=true;
            }
            const detections  = await  faceapi.detectAllFaces(myVideo.current, 
                new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
            
            if(myVideo.current && detections.length==0) {
                toast.error("Please sit in a well lit room and face the Webcam!")
                alert('Face cannot be detected ! Please sit in a weel lit area.')
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

        }, 2500 )
    }

    useEffect(() => {
        //take camera permission
        navigator?.mediaDevices?.getUserMedia({video : true, audio: true})
            .then(videoStream => {
                dataStream= videoStream;
                setstream(videoStream);
                
                // initialize socket
                init(videoStream)

            })
            .catch((error) => {
                console.log(error);
                toast.error('Cannot connect without video and audio permissions')
                return <Navigate to="/" />;
            });
        //load faceapi Models
        loadModels()  
        //socket connecting function
        const init = async (videoStream) => {
            // PeerJS functionality starts 
            var peer_params = {
                host: server_host,
                path: '/myapp',
            }
            if(server_host=='localhost') peer_params['port'] = 3007
            peer = new Peer(peer_params)
            // once peer created join room
            peer.on('open', function(id) {
                myPeerId = id
                
                addVideo(videoStream, id, myName)
                if(interviewer)
                    detectFaceMotions()
                let flag = interviewer ? false :  true
                fetch(`${server}join`, {
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
                .then(res_arr => {
                    const {data} = res_arr
                    setAllPeers(data);
                    for(const {peerId, username} of data) {
                   
                        let conn = peer.connect(peerId)
    
                        conn.on("open", () => {
                            myConns.set(conn, username)
                            conn.send({sig:1,data:{id, name:myName}})
                            let call = peer.call(peerId, videoStream)
                            call.on('stream', (remoteStream) => {
                                mycalls.add(call)
                                addVideo(remoteStream, peerId, username)
                            })
                        })

                        conn.on('data', ({sig, data}) => {
                            recvHandler(conn, sig, data)
                        })

                        conn.on('close', () => {
                            myConns.delete(conn)
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
                conn.on('data', ({sig, data}) => {
                    recvHandler(conn,sig,data)
                })
                conn.on('close', () => {
                    myConns.delete(conn)
                    toast.success(`${idName[conn.peer]} left the Call`)
                    const element = document.getElementById(conn.peer);
                    element?.remove();
                })
            });

            peer.on('call', (call) => {
                call.answer(videoStream)
                mycalls.add(call)
                call.on('stream', (remoteStream) => {
                    addVideo(remoteStream, call.peer, idName[call.peer])
                })
                toast.success(`${idName[call.peer]} joined the Call`)
            }) 
        };

        // Clean up function to remove camera permissions and end socket
        return () => {
            const ele = document.getElementById(myPeerId)
            ele?.remove()
            clearInterval(timer)
            if(peer) {
                try {
                    fetch(`${server}leave`, {
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
                peer.destroy();
            }
            if (dataStream) {
                const tracks = dataStream.getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, []);

    //Funtions to be triggered by child components passed as props

    const sendHandler = (sig, data) => {
        for(const [conn, name] of myConns) {
            conn.send({sig, data})
        }
    }

    const recvHandler =  (conn, sig,data) => {
        switch (sig) {
            case 1: {
            //share name
                const {id,name} = data
                myConns.set(conn, name)
                idName[id]=name
                conn.send(3, {value:code})
                break;
            }
            case 2:{
            // chat msg
                const {username, msg} = data
                addRecvMsg(msg,username)
            }
            case 3:{
            // code update
                const {value} = data
                console.log(value);
                if(value!=code)
                    setcode(value);
            }
            case 4:{
            // language change
                const {newLang} = data
                if(lang!=newLang) setLang(newLang)
            }
            default:
                break;
        }
    }

    const addRecvMsg = (text,name='Unknown') => {
        setChatState(true)
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
        if(par)
            par.scrollTop = par.scrollHeight
    }
    

    //Functions related to this component
    function addVideo(vstream, peerID, userName="user" ) {
        const prev = document.getElementById(peerID)
        prev?.remove()
        const row = document.createElement('div')
        row.setAttribute('class', 'mt-2')
        row.setAttribute('id', peerID)

        const video = document.createElement('video')
        video.srcObject=vstream;
        video.addEventListener('loadedmetadata', () => {
            video.play()
        })
        // console.log(peerID, myPeerId);
        if(peerID==myPeerId) {
            video.muted = true
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

        peerDiv?.insertBefore(row, peerDiv.children[0])

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
            screenStream=displStream
            addVideo(displStream, 'screen','Screen')
            replaceStream(displStream)
        }).catch((error) => {
            console.log(error);
        });

    }

    const replaceStream = ( mediaStream) => {
        for(const call of mycalls) {
            for(let sender of call.peerConnection?.getSenders()){
                if(sender.track.kind == "audio") {
                    if(mediaStream.getAudioTracks().length > 0){
                        sender.replaceTrack(mediaStream.getAudioTracks()[0]);
                    }
                }
                if(sender.track.kind == "video") {
                    if(mediaStream.getVideoTracks().length > 0){
                        sender.replaceTrack(mediaStream.getVideoTracks()[0]);
                    }
                }
            }
        }
    }


    function stopCapture(evt) {
        evt.preventDefault()
        setDisplayCheck(!displayCheck)
        replaceStream(stream)
        let ele = document.getElementById('screen')
        const evid  = ele?.childNodes[1];
        if (evid && evid.srcObject ) {
            const tracks = evid.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
        }
        ele?.remove();
    }
    const copyCode = (e) => {
        e.preventDefault();
        if (copy(roomId))
            toast.success('Session ID copied')
        else toast.error('Cannot copy to clipboard')
    }

    function chatHider() {
        setChatState(chatState => !chatState)
    }

    function leaveRoom() {
        if(peer) {
            try {
                fetch(`${server}leave`, {
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
            peer.destroy()
        }
        if (dataStream) {
            const tracks = dataStream.getTracks();
            tracks.forEach((track) => track.stop());
        }
        clearInterval(timer)
        history('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }


    return (
    <>
        <div className='callpage d-flex flex-wrap'>
            <div className='vcont' >
                <div id="peerDiv">

                <div className='' id="users">
                    
                </div>
                </div>
                <div className="options d-flex flex-wrap">
                    <Button onClick={leaveRoom} className="mt-2 btn-danger" style={{width:'120px', margin:'auto'}}>Leave</Button>
                    <Button onClick={!displayCheck ? screenShareHandler : stopCapture} className="mt-2"  style={{width:'170px', margin:'auto'}}>{!displayCheck?'Screen Share' : 'Stop Share'}</Button>
                    <Button onClick={copyCode} className="mt-2 btn-info" style={{width:'160px', margin:'auto' , marginLeft: '20px'}}>Copy Session Id</Button>
                    <div className="chat-toggler" onClick={chatHider}>
                    { !chatState ? 
                            <img src="/toggle_chat.png"></img>
                            : <></>
                    }
                    </div>
                </div>
            </div>
            <div className='ECcont'>
                <div className='econt'>
                    <Editor
                        conns={myConns}
                        roomId={roomId}
                        onCodeChange={setcode}
                        code = {code}
                        lang={lang}
                        peer={peer}
                        sendHandler = {sendHandler}
                    />
                </div>
            
                
            </div>
        </div>
        
        { !chatState ? 
                    <></>
                    : <>
                    <Chat 
                        recvMsg={addRecvMsg}
                        conns = {myConns}
                        roomId={roomId}
                        username = {myName}
                        sendHandler = {sendHandler}
                        peer={peer}
                        className='chatCont'
                    />
                    <img src="/close_chat.png" onClick={chatHider} className="fix_close"></img>
                    </>
            }
    </>
    )
}

export default PeerCall