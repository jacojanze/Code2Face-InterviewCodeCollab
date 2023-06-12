import React, {useEffect, useState, useRef, useMemo} from 'react'
import { useLocation } from 'react-router-dom';
// codemirror components
import { UseCodeMirror, useCodeMirror } from '@uiw/react-codemirror';

// import languages 
import { javascript } from '@codemirror/lang-javascript';
// import themes 
import { githubDark } from '@uiw/codemirror-theme-github';
import { xcodeDark, xcodeLight } from '@uiw/codemirror-theme-xcode';
import { eclipse } from '@uiw/codemirror-theme-eclipse';
import { abcdef } from '@uiw/codemirror-theme-abcdef';
import { solarizedDark } from '@uiw/codemirror-theme-solarized';
import ACTIONS from '../Actions';

import "../styles/editor.css"


const extensions = [javascript()]


const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const history = useLocation()
    const [theme, setTheme] = useState(githubDark);
    const [code, setCode] = useState(`one
two
three
four
five`);
    const [placeholder, setPlaceholder] = useState('Please enter the code.');
    const [language, setLanguage] = useState('javascript');
    const thememap = new Map()
    
    const editorRef = useRef(null)
    const {setContainer} = useCodeMirror({
        container: editorRef.current,
        extensions,
        value: code,
        theme,
        editable: true,
        height: `70vh`,
        width:`45vw`,
        basicSetup:{
            foldGutter: false,
            dropCursor: false,
            indentOnInput: false,
        },
        options:{
            autoComplete:true,
            },
        placeholder : placeholder,
        style : {
            position: `relative`,
            zIndex: `999`,
            borderRadius: `10px`,
          },
        onChange:  (value) => {
            socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                roomId,
                code:value,
            })
        }

    })


    const themeInit = () => {
        thememap.set("githubDark",githubDark)
        thememap.set("xcodeDark",xcodeDark)
        thememap.set("eclipse",eclipse)
        thememap.set("xcodeLight",xcodeLight)
        thememap.set("abcdef",abcdef)
        thememap.set("solarizedDark",solarizedDark)
    }

    const handleChange = (editor, data, value) => {
        setCode(value);
    };

    const handleLanguageChange = (event) => {
        setLanguage(event.target.value);
    };

    const handleThemeChange = (event) => {
        setTheme(thememap.get(event.target.value));
    };

    themeInit()


    useEffect(() => {
        if(!editorRef.current) {
            alert('error loading editor')
            history('/')
        }
        if(editorRef.current) {
            setContainer(editorRef.current)
        }

        socketRef.current?.on(ACTIONS.CODE_CHANGE, (data) => {
            if(data !==null && data.code!==null && data.code!=code) {
                setCode(data.code)
            }   

        })

    },[editorRef.current,socketRef.current])

    return (
        <div className='editorcomponent'>
            <span>Theme</span>
            <select onChange={handleThemeChange}>
                <option default value={"githubDark"}>githubDark</option>
                <option value={"eclipse"}>eclipse</option>
                <option value={"xcodeLight"}>xcodeLight</option>
                <option value={"xcodeDark"}>xcodeDark</option>
                <option value={"solarizedDark"}>solarizedDark</option>
                <option value={"abcdef"}>abcdef</option>
            </select>
            <div ref={editorRef} className='ide' ></div>
        </div>
    );
}

export default Editor