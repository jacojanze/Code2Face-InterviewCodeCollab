import React from 'react'
var qs = require('qs');
const Tests = () => {


    var data = qs.stringify({
        'code': 'val = int(iut("Enter your value: ")) + 5\nprint(val)',
        'language': 'py',
        'input': '7'
    });
    var config = {
        method: 'post',
        // url: 'https://api.codex.jaagrav.in',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body : data
    };

    fetch('https://api.codex.jaagrav.in',config)
   .then(res => res.json())
   .then(data => console.log(data))
    .catch(function (error) {
        console.log(error);
    });


  return (
    <div>Tests</div>
  )
}

export default Tests