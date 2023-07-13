import React, {useEffect, useState, useRef, useMemo} from 'react'
import { useLocation } from 'react-router-dom';
// codemirror components
import { useCodeMirror } from '@uiw/react-codemirror';

// import languages 
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';

// import themes 
import { githubDark } from '@uiw/codemirror-theme-github';
import { xcodeDark, xcodeLight } from '@uiw/codemirror-theme-xcode';
import { eclipse } from '@uiw/codemirror-theme-eclipse';
import { abcdef } from '@uiw/codemirror-theme-abcdef';
import { solarizedDark } from '@uiw/codemirror-theme-solarized';
import "../styles/editor.css"



// const extensions = [javascript()]


const Editor = ({ sendHandler, roomId, onCodeChange, code, lang }) => {
    const history = useLocation()
    const location = useLocation()
    const uname = location?.state?.username
    const [theme, setTheme] = useState(githubDark);
    // const [code, setcode] = useState(code);
    const [selectValue, setSelectValue] = useState('javascript')
    const [extensions, setExtensions] = useState([javascript()])
    const [placeholder, setPlaceholder] = useState('Please enter the code.');
    const thememap = new Map()
    const langnMap = new Map()
    
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
            onCodeChange(value)
            sendHandler(3,{value})
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

    const langInit = () => {
        langnMap.set('java', java)
        langnMap.set('cpp', cpp)
        langnMap.set("javascript", javascript)
        langnMap.set('python', python)
    }


    const handleThemeChange = (event) => {
        setTheme(thememap.get(event.target.value));
    };

    const handleLanguageChange =  (event) => {
        setExtensions([langnMap.get(event.target.value)()]);
        
        sendHandler(4,{newLang : event.target.value})
        setSelectValue(event.target.value)
    };

    themeInit()
    langInit()

    useEffect(() => {
        if(!editorRef.current) {
            alert('error loading editor')
            history('/')
        }
        if(editorRef.current) {
            setContainer(editorRef.current)
        }

    },[editorRef.current])

    useEffect(() => {
        if(lang!=selectValue && lang) {
            setSelectValue(lang)
            setExtensions([langnMap.get(lang)()]);
        }
    },[lang])



    return (
        <div className='editorcomponent'>
            <span>Theme:</span>
            <select onChange={handleThemeChange} >
                <option default value={"githubDark"}>githubDark</option>
                <option value={"eclipse"}>eclipse</option>
                <option value={"xcodeLight"}>xcodeLight</option>
                <option value={"xcodeDark"}>xcodeDark</option>
                <option value={"solarizedDark"}>solarizedDark</option>
                <option value={"abcdef"}>abcdef</option>
            </select>
            <span>Language:</span>
            <select onChange={handleLanguageChange} value={selectValue}>
                <option default value={"javascript"}>javascript</option>
                <option value={"java"}>java</option>
                <option value={"cpp"}>cpp</option>
                <option value={"python"}>python</option>
            </select>
            <div ref={editorRef} className='ide' ></div>
       
        </div>
    );
}

export default Editor