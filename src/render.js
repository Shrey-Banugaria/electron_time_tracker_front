// renderer.js
const { ipcRenderer } = require('electron');
const axios = require('axios');
const BASE_URL = "http://localhost:3000/api/v1"
const timerAlert = document.getElementById('timer-alert');
const moment = require('moment-timezone');
const currentTime = moment().tz('Asia/Kolkata');

let timer;
let seconds = 0;
let isTimerRunning = false;
let startTime;
let totalBreakDuration = 0;
let pauseStartTime;

async function startTimer() {
  document.getElementById('startBtn').disabled = true;
  document.getElementById('pauseBtn').disabled = false;
  document.getElementById('stopBtn').disabled = false;

  timer = setInterval(() => {
    seconds++;
    const formattedTime = moment(seconds);
    document.getElementById('timer').innerText = formattedTime;
  }, 1000);

  const token = localStorage.getItem('token');
  if (!token)  window.location.href = './public/login.html';
  else {
    if (!isTimerRunning) {
        isTimerRunning = true;
        startTime = moment()
        updateUI('Timmer Started');
    } else if (!isTimerRunning && pauseStartTime) {
        const pauseEndTime = moment();
        totalBreakDuration += moment.duration(pauseEndTime.subtract(pauseStartTime));
        pauseStartTime = null;
        isTimerRunning = true;
        updateUI('Timmer Resumned');
      } else {
        console.error('Timer is already running or not paused.');
      }
  }
}

function pauseTimer() {
  document.getElementById('startBtn').disabled = false;
  document.getElementById('pauseBtn').disabled = true;
  document.getElementById('stopBtn').disabled = true;

  clearInterval(timer);
  ipcRenderer.send('pause-timer');

  const token = localStorage.getItem('token');
  if (!token)  window.location.href = './public/login.html'
  else {
    if (isTimerRunning) {
        isTimerRunning = false;
        pauseStartTime = moment();
        updateUI('Timmer Paused');
      } else {
        console.error('Timer is not running.');
      }
  }
}

async function stopTimer() {
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('timer').textContent = '00:00:00';
  
    const token = localStorage.getItem('token');
  
    if (!token) window.location.href = './public/login.html';
    else {
      if (isTimerRunning) {
        isTimerRunning = false;
        const stopTime = moment()
        const totalWorkDuration = moment.duration(stopTime.diff(startTime)).subtract(totalBreakDuration).asMilliseconds();
        const dataObj = {
          startTime,
          stopTime,
          breakDuration: totalBreakDuration,
          workDuration: totalWorkDuration,
          date: new Date(),
        };
  
  
        try {
          const response = await axios.post(`${BASE_URL}/work/add`, dataObj, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${token}`,
            },
          });
          console.log('API response:', response);
        } catch (error) {
          console.error('API error:', error);
        }
  
        // Reset the timer and clear interval
        document.getElementById('timer').textContent = '00:00:00';
        clearInterval(timer);
        seconds = 0;
      } else {
        console.error('Timer is not running.');
      }
    }
  }

async function registerUser(email, password, contactNumber) {
    try {
        const response = await axios.post(`${BASE_URL}/user/register`, {
            email,
            password,
            contactNumber, // Assuming you want to include contactNumber in the registration
        });
        ipcRenderer.send('register', response.data);
        window.location.href = './public/login.html';
    } catch (error) {
        console.error(error);
        ipcRenderer.send('register', error.message || 'Registration failed');
        throw error;
    }
}
 
async function loginUser(email, password) {
    try {
        const response = await axios.post(`${BASE_URL}/user/login`, {
            email,
            password,
        });
        ipcRenderer.send('login', response.data);
        window.location.href = '../index.html'; 
    } catch (error) {
        throw error.response.data || 'Login failed';
    }
}

function updateUI(message) {
    timerAlert.textContent = `${message}`;
    timerAlert.style.display = 'block';

    // Hide the alert after a short delay (adjust as needed)
    setTimeout(() => {
      timerAlert.style.display = 'none';
    }, 1000);
}

// function getCurrentTime() {
//     const hours = currentTime.format('HH');
//     const minutes = currentTime.format('mm');
//     const seconds = currentTime.format('ss');

//     return `${hours}:${minutes}:${seconds}`
// }