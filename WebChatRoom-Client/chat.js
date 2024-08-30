"use strict";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:7265/chathub")
    .configureLogging(signalR.LogLevel.Information)
    .build();

const start = async () => {
    try {
        await connection.start();
        console.log("Connected to SignalR hub");
    } catch (error) {
        console.log(error);
    }
}

const joinUser = async () => {
    const name = window.prompt('Enter the name: ');
    if (name) {
        sessionStorage.setItem('user', name);
        await joinChat(name);
    }
}

const joinChat = async (user) => {
    if (!user) return;
    try {
        const message = `${user} joined`;
        await connection.invoke("JoinChat", user, message);
    } catch (error) {
        console.log(error);
    }
}

const getUser = () => sessionStorage.getItem('user');

const receiveMessage = async () => {
    const currentUser = getUser();
    if (!currentUser) return;
    try {
        await connection.on("ReceiveMessage", (user, message) => {
            const messageClass = currentUser === user ? "send" : "received";
            appendMessage(message, messageClass);
            const alertSound = new Audio('sms-sound.mp3');
            alertSound.play();
        });
    } catch (error) {
        console.log(error);
    }
}

const appendMessage = (message, messageClass) => {
    const messageSectionEl = document.getElementById('messageSection');
    const msgBoxEl = document.createElement("div");
    msgBoxEl.classList.add("msg-box");
    msgBoxEl.classList.add(messageClass);
    msgBoxEl.innerHTML = message;
    messageSectionEl.appendChild(msgBoxEl);
}

// Function to handle sending messages
const sendMessage = async (user, message) => {
    try {
        await connection.invoke('SendMessage', user, message);
    } catch (error) {
        console.log(error);
    }
}

// Function to handle sending messages when Enter key is pressed
const handleSend = async (e) => {
    e.preventDefault();
    const user = getUser();
    if (!user) return;
    const txtMessageEl = document.getElementById('txtMessage');
    const msg = txtMessageEl.value;
    if (msg) {
        await sendMessage(user, `${user}: ${msg}`);
        txtMessageEl.value = "";
    }
}

// Bind the event for the Send button
document.getElementById('btnSend').addEventListener('click', handleSend);

// Bind the event for the Enter key in the message input field
document.getElementById('txtMessage').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission if inside a form
        handleSend(e);
    }
});

// Bind the event for the Enter key in the search input field
document.getElementById('searchUser').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent default action (e.g., form submission)
        document.getElementById('btnSearch').click(); // Trigger the search button click event
    }
});

document.getElementById('btnSearch').addEventListener('click', async () => {
    const searchUser = document.getElementById('searchUser').value;
    if (searchUser) {
        try {
            const results = await connection.invoke('SearchMessagesByUser', searchUser);
            displaySearchResults(results);
        } catch (error) {
            console.error(error);
        }
    }
});

const displaySearchResults = (messages) => {
    const resultsEl = document.getElementById('searchResults');
    resultsEl.innerHTML = messages.length ? messages.join('<br/>') : 'No messages found.';
}

// Starting the app
const startApp = async () => {
    await start(); // Connection will be stabilized
    await joinUser();
    await receiveMessage();
}

startApp();
