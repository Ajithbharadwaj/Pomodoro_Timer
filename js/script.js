// ===============================
// Focus Study Timer v2
// ===============================

const STUDY_DURATION = 30 * 60 * 1000;
const BREAK_DURATION = 5 * 60 * 1000;

let mode = "study"; // study | break
let timerState = "ready"; // ready | running | paused | finished

let duration = STUDY_DURATION;
let remaining = STUDY_DURATION;

let endTimestamp = null;
let interval = null;

let startDate = null;
let endDate = null;

let totalStudyMinutes = 0;
let totalBreaks = 0;

let alarmInterval = null;
let audioContext = null;


// ===============================
// DOM Elements
// ===============================

const timerDisplay = document.getElementById("timer");
const progressBar = document.getElementById("progressBar");

const statusBadge = document.getElementById("statusBadge");

const startBtn = document.getElementById("startBtn");
const breakBtn = document.getElementById("breakBtn");
const resetBtn = document.getElementById("resetBtn");

const studyTimeText = document.getElementById("studyTime");
const breakCountText = document.getElementById("breakCount");

const startTimeText = document.getElementById("startTime");
const endTimeText = document.getElementById("endTime");

const historyTable = document.getElementById("historyTable");


// ===============================
// Initialize
// ===============================

loadStorage();
updateDisplay();


// ===============================
// Button Events
// ===============================

startBtn.onclick = startStudy;
breakBtn.onclick = startBreak;
resetBtn.onclick = resetTimer;


// ===============================
// Study Timer
// ===============================

function startStudy(){

    stopAlarm();

    mode = "study";

    if(timerState === "paused"){

        resumeTimer();
        return;

    }


    duration = STUDY_DURATION;
    remaining = STUDY_DURATION;


    startDate = new Date();

    startTimeText.innerText =
        formatTime(startDate);


    startTimer();

}



function startBreak(){

    stopAlarm();

    mode = "break";

    duration = BREAK_DURATION;
    remaining = BREAK_DURATION;


    totalBreaks++;

    breakCountText.innerText =
        totalBreaks;


    saveStorage();


    startTimer();

}



// ===============================
// Timer Engine
// ===============================


function startTimer(){

    timerState="running";

    endTimestamp =
        Date.now() + remaining;


    interval =
        setInterval(tick,20);


    updateButtons();

}



function tick(){

    remaining =
        endTimestamp - Date.now();


    if(remaining <=0){

        remaining=0;

        clearInterval(interval);

        interval=null;


        finishTimer();

    }


    updateDisplay();

}



function pauseTimer(){

    if(timerState !== "running")
        return;


    clearInterval(interval);

    interval=null;

    timerState="paused";

    updateButtons();

}



function resumeTimer(){

    endTimestamp =
        Date.now()+remaining;


    timerState="running";


    interval=setInterval(tick,20);

    updateButtons();

}



// ===============================
// Completion
// ===============================

function finishTimer(){


    timerState="finished";


    if(mode==="study"){


        endDate=new Date();


        totalStudyMinutes+=30;


        studyTimeText.innerText =
            totalStudyMinutes+" min";


        endTimeText.innerText =
            formatTime(endDate);


        saveSession();


        notify(
            "Study Completed",
            "Take a 5 minute break"
        );


        statusBadge.className =
            "badge bg-danger";


        statusBadge.innerText =
            "Time Up - Break";


        breakBtn.disabled=false;


    }


    else{


        notify(
            "Break Finished",
            "Continue studying"
        );


        statusBadge.className =
            "badge bg-primary";


        statusBadge.innerText =
            "Break Finished";


        startBtn.disabled=false;


    }


    startAlarm();


}



// ===============================
// Display
// ===============================

function updateDisplay(){


    let ms=Math.max(remaining,0);


    let minutes =
        Math.floor(ms/60000);


    let seconds =
        Math.floor(
            (ms%60000)/1000
        );


    let milliseconds =
        ms%1000;



    timerDisplay.innerText =

        String(minutes).padStart(2,"0")
        +":"
        +
        String(seconds).padStart(2,"0")
        +":"
        +
        String(milliseconds)
        .padStart(3,"0");



    let percent =
        (remaining/duration)*100;


    progressBar.style.width =
        percent+"%";


}



// ===============================
// Reset
// ===============================

function resetTimer(){


    clearInterval(interval);

    interval=null;


    stopAlarm();


    mode="study";

    duration=STUDY_DURATION;

    remaining=STUDY_DURATION;


    timerState="ready";


    statusBadge.className =
        "badge bg-primary";


    statusBadge.innerText =
        "Ready";


    updateButtons();

    updateDisplay();

}



// ===============================
// Buttons
// ===============================

function updateButtons(){


    if(timerState==="running"){

        startBtn.innerText="⏸ Pause";

        startBtn.onclick=pauseTimer;

    }


    else if(timerState==="paused"){

        startBtn.innerText="▶ Resume";

        startBtn.onclick=resumeTimer;

    }


    else{


        startBtn.innerText="▶ Countdown";

        startBtn.onclick=startStudy;

    }

}



// ===============================
// Alarm
// ===============================

function beep(){


    if(!audioContext){

        audioContext =
        new AudioContext();

    }


    let oscillator =
        audioContext.createOscillator();


    let gain =
        audioContext.createGain();


    oscillator.frequency.value=900;


    gain.gain.value=0.4;


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.start();


    oscillator.stop(
        audioContext.currentTime+0.3
    );


}



function startAlarm(){


    stopAlarm();


    alarmInterval =
        setInterval(beep,1000);


    timerDisplay.classList.add(
        "blink"
    );


}



function stopAlarm(){


    if(alarmInterval){

        clearInterval(alarmInterval);

        alarmInterval=null;

    }


    timerDisplay.classList.remove(
        "blink"
    );


}



// ===============================
// Local Storage
// ===============================

function saveStorage(){


    localStorage.setItem(
        "studyMinutes",
        totalStudyMinutes
    );


    localStorage.setItem(
        "breaks",
        totalBreaks
    );


}



function loadStorage(){


    totalStudyMinutes =
    Number(
        localStorage.getItem(
            "studyMinutes"
        )
    ) || 0;



    totalBreaks =
    Number(
        localStorage.getItem(
            "breaks"
        )
    ) || 0;



    studyTimeText.innerText =
        totalStudyMinutes+" min";


    breakCountText.innerText =
        totalBreaks;



    loadHistory();

}



// ===============================
// History
// ===============================

function saveSession(){


    let data =
    JSON.parse(
        localStorage.getItem(
            "history"
        )
    ) || [];



    data.unshift({

        date:
        new Date()
        .toLocaleDateString(),

        start:
        startTimeText.innerText,

        end:
        endTimeText.innerText,

        study:"30 min",

        breaks:totalBreaks

    });



    localStorage.setItem(
        "history",
        JSON.stringify(data)
    );


    loadHistory();

}



function loadHistory(){


    let data =
    JSON.parse(
        localStorage.getItem(
            "history"
        )
    ) || [];



    historyTable.innerHTML="";



    data.forEach(row=>{


        historyTable.innerHTML += `

        <tr>

        <td>${row.date}</td>

        <td>${row.start}</td>

        <td>${row.end}</td>

        <td>${row.study}</td>

        <td>${row.breaks}</td>

        </tr>

        `;


    });


}



// ===============================
// Notifications
// ===============================

if(Notification.permission==="default"){

    Notification.requestPermission();

}



function notify(title,message){


    if(Notification.permission==="granted"){

        new Notification(title,{
            body:message
        });

    }


}



// ===============================
// Keyboard Controls
// ===============================

document.addEventListener(
"keydown",
e=>{


    if(e.code==="Space"){

        e.preventDefault();

        startBtn.click();

    }


    if(e.key==="b" || e.key==="B"){

        if(!breakBtn.disabled)
            startBreak();

    }


    if(e.key==="r" || e.key==="R"){

        resetTimer();

    }


});