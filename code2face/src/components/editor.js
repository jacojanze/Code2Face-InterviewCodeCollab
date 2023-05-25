import React, {useState} from 'react'
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
// import languages 
import { javascript } from '@codemirror/lang-javascript';
// import themes 
import { githubDark } from '@uiw/codemirror-theme-github';
import { xcodeDark, xcodeLight } from '@uiw/codemirror-theme-xcode';
import { eclipse } from '@uiw/codemirror-theme-eclipse';
import { abcdef } from '@uiw/codemirror-theme-abcdef';
import { solarizedDark } from '@uiw/codemirror-theme-solarized';


const Editor = () => {

    const [theme, setTheme] = useState(githubDark);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const thememap = new Map()
    thememap.set("githubDark",githubDark)
    thememap.set("xcodeDark",xcodeDark)
    thememap.set("eclipse",eclipse)
    thememap.set("xcodeLight",xcodeLight)
    thememap.set("abcdef",abcdef)
    thememap.set("solarizedDark",solarizedDark)

    const handleChange = (editor, data, value) => {
        setCode(value);
    };

    const handleLanguageChange = (event) => {
        setLanguage(event.target.value);
    };

    const handleThemeChange = (event) => {
        setTheme(thememap.get(event.target.value));
    };



    return (
        <div className='editorcomponent'>
            <span>Theme</span>
            <select onChange={handleThemeChange}>
                <option value={"eclipse"}>eclipse</option>
                <option value={"xcodeLight"}>xcodeLight</option>
                <option value={"xcodeDark"}>xcodeDark</option>
                <option value={"githubDark"}>githubDark</option>
                <option value={"solarizedDark"}>solarizedDark</option>
                <option value={"abcdef"}>abcdef</option>
            </select>
            <CodeMirror
                value={code}
                height="70vh"
                width='45vw'
                basicSetup={{
                    foldGutter: false,
                    dropCursor: false,
                    // allowMultipleSelections: false,
                    indentOnInput: false,
                }}
                // className='ide'
                options={{
                    autoComplete:true,
                    }}
                extensions={[javascript({ jsx: true })]}
                theme={theme}
            />
        </div>
    );
}

export default Editor