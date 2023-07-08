import React from 'react';
import {createRoot} from 'react-dom/client'
import './index.css';
import App from './App';
// import { ContextProvider } from './Context';
import 'bootstrap/dist/css/bootstrap.min.css';

const root_element = document.getElementById('root');
const root= createRoot(root_element)
root.render(<App />);

// root.render(
//     <React.StrictMode>
//         {/* <ContextProvider> */}
//             <App/>
//         {/* </ContextProvider> */}
//     </React.StrictMode>
// );
