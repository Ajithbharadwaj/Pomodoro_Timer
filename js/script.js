// ===============================
// Focus Study Timer v3
// ===============================

const STUDY_DURATION = 30 * 60 * 1000;
const BREAK_DURATION = 5 * 60 * 1000;

let mode = "study";
let timerState = "ready";

let duration = STUDY_DURATION;
let remaining = STUDY_DURATION;

let interval = null;
let endTimestamp = null;

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
updateButtons();

startBtn.addEventListener("click", handleStartButton);
breakBtn.addEventListener("click", startBreak);
resetBtn.addEventListener("click", resetTimer);

// ===============================
// Helpers
// ===============================

function formatTime(date) {
    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function formatNumber(num, digits = 2) {
    return String(num).padStart(digits, "0");
}

// ===============================
// Start Button Controller
// ===============================

function handleStartButton() {

    if (timerState === "running") {
        pauseTimer();
        return;
    }

    if (timerState === "paused") {
        resumeTimer();
        return;
    }

    startStudy();
}

// ===============================
// Study
// ===============================

function startStudy() {

    stopAlarm();

    clearInterval(interval);

    mode = "study";
    duration = STUDY_DURATION;
    remaining = STUDY_DURATION;

    timerState = "running";

    startDate = new Date();

    startTimeText.innerText = formatTime(startDate);

    statusBadge.className = "badge bg-success";
    statusBadge.innerText = "Studying";

    breakBtn.disabled = true;

    endTimestamp = Date.now() + remaining;

    interval = setInterval(tick, 20);

    updateButtons();
}

// ===============================
// Break
// ===============================

function startBreak() {

    stopAlarm();

    clearInterval(interval);

    mode = "break";
    duration = BREAK_DURATION;
    remaining = BREAK_DURATION;

    timerState = "running";

    totalBreaks++;

    breakCountText.innerText = totalBreaks;

    saveStorage();

    statusBadge.className = "badge bg-warning";
    statusBadge.innerText = "Break";

    breakBtn.disabled = true;

    endTimestamp = Date.now() + remaining;

    interval = setInterval(tick, 20);

    updateButtons();
}

// ===============================
// Timer Engine
// ===============================

function tick() {

    remaining = endTimestamp - Date.now();

    if (remaining <= 0) {

        remaining = 0;

        clearInterval(interval);

        interval = null;

        updateDisplay();

        finishTimer();

        return;
    }

    updateDisplay();
}

function pauseTimer() {

    if (timerState !== "running") return;

    clearInterval(interval);

    interval = null;

    timerState = "paused";

    statusBadge.className = "badge bg-secondary";
    statusBadge.innerText = "Paused";

    updateButtons();
}

function resumeTimer() {

    if (timerState !== "paused") return;

    timerState = "running";

    statusBadge.className =
        mode === "study"
            ? "badge bg-success"
            : "badge bg-warning";

    statusBadge.innerText =
        mode === "study"
            ? "Studying"
            : "Break";

    endTimestamp = Date.now() + remaining;

    interval = setInterval(tick, 20);

    updateButtons();
}

// ===============================
// Finish Timer
// ===============================

function finishTimer() {

    timerState = "finished";

    clearInterval(interval);
    interval = null;

    if (mode === "study") {

        endDate = new Date();

        totalStudyMinutes += 30;

        studyTimeText.innerText = totalStudyMinutes + " min";

        endTimeText.innerText = formatTime(endDate);

        saveStorage();
        saveSession();

        statusBadge.className = "badge bg-danger";
        statusBadge.innerText = "Study Complete";

        breakBtn.disabled = false;

        notify(
            "Study Completed",
            "Time for a 5 minute break!"
        );

    } else {

        statusBadge.className = "badge bg-primary";
        statusBadge.innerText = "Break Finished";

        notify(
            "Break Finished",
            "Ready to study again."
        );

        breakBtn.disabled = true;
    }

    startAlarm();

    updateButtons();
}

// ===============================
// Display
// ===============================

function updateDisplay() {

    const ms = Math.max(remaining, 0);

    const minutes = Math.floor(ms / 60000);

    const seconds = Math.floor((ms % 60000) / 1000);

    const milliseconds = ms % 1000;

    timerDisplay.innerText =
        formatNumber(minutes) +
        ":" +
        formatNumber(seconds) +
        ":" +
        formatNumber(milliseconds, 3);

    const percent = (remaining / duration) * 100;

    progressBar.style.width = percent + "%";

    progressBar.setAttribute(
        "aria-valuenow",
        Math.round(percent)
    );
}

// ===============================
// Reset
// ===============================

function resetTimer() {

    clearInterval(interval);

    interval = null;

    stopAlarm();

    mode = "study";

    timerState = "ready";

    duration = STUDY_DURATION;

    remaining = STUDY_DURATION;

    statusBadge.className = "badge bg-primary";
    statusBadge.innerText = "Ready";

    breakBtn.disabled = true;

    updateDisplay();

    updateButtons();
}

// ===============================
// Buttons
// ===============================

function updateButtons() {

    if (timerState === "running") {

        startBtn.innerHTML = "⏸ Pause";

    } else if (timerState === "paused") {

        startBtn.innerHTML = "▶ Resume";

    } else {

        startBtn.innerHTML = "▶ Countdown";
    }
}

// ===============================
// Alarm
// ===============================

function beep() {

    if (!audioContext) {

        audioContext = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.value = 900;

    gain.gain.value = 0.35;

    oscillator.connect(gain);

    gain.connect(audioContext.destination);

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + 0.3
    );
}

function startAlarm() {

    stopAlarm();

    timerDisplay.classList.add("blink");

    alarmInterval = setInterval(beep, 1000);
}

function stopAlarm() {

    if (alarmInterval) {

        clearInterval(alarmInterval);

        alarmInterval = null;
    }

    timerDisplay.classList.remove("blink");
}

// ===============================
// Notifications
// ===============================

if ("Notification" in window &&
    Notification.permission === "default") {

    Notification.requestPermission();
}

function notify(title, message) {

    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {

        new Notification(title, {
            body: message
        });
    }
}

// ===============================
// Local Storage
// ===============================

function saveStorage() {
    localStorage.setItem("studyMinutes", totalStudyMinutes);
    localStorage.setItem("breaks", totalBreaks);
}

function loadStorage() {

    totalStudyMinutes =
        Number(localStorage.getItem("studyMinutes")) || 0;

    totalBreaks =
        Number(localStorage.getItem("breaks")) || 0;

    studyTimeText.innerText = totalStudyMinutes + " min";
    breakCountText.innerText = totalBreaks;

    loadHistory();
}

// ===============================
// Session History
// ===============================

function saveSession() {

    let history =
        JSON.parse(localStorage.getItem("history")) || [];

    history.unshift({
        date: new Date().toLocaleDateString(),
        start: startTimeText.innerText,
        end: endTimeText.innerText,
        study: "30 min",
        breaks: totalBreaks
    });

    // Keep only latest 20 sessions
    history = history.slice(0, 20);

    localStorage.setItem(
        "history",
        JSON.stringify(history)
    );

    loadHistory();
}

function loadHistory() {

    const history =
        JSON.parse(localStorage.getItem("history")) || [];

    historyTable.innerHTML = "";

    history.forEach(item => {

        historyTable.innerHTML += `
        <tr>
            <td>${item.date}</td>
            <td>${item.start}</td>
            <td>${item.end}</td>
            <td>${item.study}</td>
            <td>${item.breaks}</td>
        </tr>
        `;
    });
}

// ===============================
// Keyboard Shortcuts
// ===============================

document.addEventListener("keydown", function (e) {

    // Space = Start / Pause / Resume
    if (e.code === "Space") {

        e.preventDefault();

        handleStartButton();
    }

    // B = Break
    if (
        (e.key === "b" || e.key === "B") &&
        !breakBtn.disabled
    ) {
        startBreak();
    }

    // R = Reset
    if (e.key === "r" || e.key === "R") {
        resetTimer();
    }
});

// ===============================
// Save before leaving page
// ===============================

window.addEventListener("beforeunload", function () {
    saveStorage();
});

// ===============================
// Initial UI State
// ===============================

updateDisplay();
updateButtons();