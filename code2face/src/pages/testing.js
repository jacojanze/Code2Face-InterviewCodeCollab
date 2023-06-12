import React, {useState, createContext, useRef, useEffect} from "react";

import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';

import { Button } from "react-bootstrap";

import * as faceapi from 'face-api.js'


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
        console.log('ds');
        const detection = await faceapi.detectSingleFace(videoElement)

      const predictions = await faceapi.detectFaceLandmarksTiny(videoElement);
      console.log(predictions);
  
  }
  



const Testing = () => {
    
    const location = useLocation();
    const history = useNavigate();
    const myName = location.state?.username
    
    const [stream, setstream] = useState()
    const myVideo = useRef()
    const socketRef = useRef(null);

    let dclient = {}
    let interviewer = localStorage.getItem('init')

    useEffect(() => {
        faceapi.nets.tinyFaceDetector.load('tiny_face_detector_model-weights_manifest.json')
        // faceapi.loadFaceLandmarkTinyModel('/')

        let dataStream = null


        navigator?.mediaDevices?.getUserMedia({video : true, audio : true})
            .then(videoStream => {
                myVideo.current.srcObject = videoStream;
                dataStream= videoStream
                setstream(videoStream);
                // initialize socket

                
            })
            .catch((error) => {
                console.log(error);
            });

        


        
    }, []);

    useEffect(() => {
        if(myVideo.current) {
            // faceapi.nets.tinyFaceDetector            
            detectFaceMotions(myVideo.current)
        }
    }, [myVideo.current])

    function leaveRoom() {
        
        socketRef.current.destroy();
        history('/');
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
                
                
                <div className='row options'>

                    <Button onClick={leaveRoom} className="mt-5">Leave</Button>
                </div>
                
            </div>
            
        </div>
    )
}

export default Testing