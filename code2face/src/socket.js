import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    // console.log('conecting to socket');
    // return io('https://c2f-api-vineethkumarm.koyeb.app:8000', options);
    return io('https://code2faceapi.onrender.com', options);
    // return io('https://amazing-croissant-5bbe89.netlify.app/', options);
    // return io('https://c2f-api.el.r.appspot.com', options);
    // return io('http://localhost:3007',options);
    // return io()
    console.log(process.env);
    return io(process.env.REACT_APP_BACKEND_URI, options);
};