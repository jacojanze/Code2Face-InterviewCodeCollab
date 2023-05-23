import React from 'react'
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { go } from '@codemirror/legacy-modes/mode/go';



const Editor = () => {
    
    const code = 'const a = 0;';
    const goLang = `package main
    import "fmt"
    
    func main() {
      fmt.Println("Hello, 世界")
    }`;



    return (
        <div>
            <h2>Editor</h2>
            <CodeMirror value={goLang} height="200px" extensions={[StreamLanguage.define(go)]} />;

            {/* <CodeMirror 
                value={code}
                options={{
                    theme: 'monokai',
                    keyMap: 'sublime',
                    mode: 'jsx',
                }}
            /> */}
        </div>
    )
}

export default Editor