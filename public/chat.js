let socket = io.connect('http://localhost:9999');


let pseudo = ''
if (pseudo === '') {

    pseudo = prompt('ton nom fdp ?');

}

console.log(pseudo);

socket.emit('pseudo', pseudo);
socket.emit('oldWhispers', pseudo);
document.title = pseudo + ' - ' + document.title;

//partie messages

document.querySelector('#chatForm').addEventListener('submit', (e) => {

    e.preventDefault();

    const textInput = document.querySelector('#msgInput').value;
    document.querySelector('#msgInput').value = '';

    const receiver = document.getElementById('receiverInput').value;

    if (textInput.length > 0) {
        socket.emit('newMessage', textInput, receiver);
        if (receiver === "all") {
            createElementFunction('newMessageMe', textInput)
        }

    } else {
        return false;
    }

})


//events

socket.on('newUser', (data) => {

    createElementFunction('newUser', data)

})

socket.on('newUserInDb', (data) =>{
    newOptions =document.createElement('option');
    newOptions.textContent=data;
    newOptions.value=data;
    document.querySelector('#receiverInput').appendChild(newOptions);
})

socket.on('newMessageAll', (content) => {
    createElementFunction('newMessageAll', content)
})

socket.on('whisper', (content) => {
    createElementFunction('whisper', content)
})

socket.on('newChannel', (newChannel) =>{
    createChannel(newChannel);
})

socket.on('emitChannel' , (channels) =>{
    if(channels.previousChannel){
        document.getElementById(channels.previousChannel).classList.remove('inChannel')
    }
    document.getElementById(channels.newChannel).classList.add('inChannel')
})

socket.on('oldWhispers', (messages) => {
    messages.forEach(message => {
        createElementFunction('oldWhispers', message)
    })
})

socket.on('oldMessages', (messages) => {
    messages.forEach(message => {
        if (message.sender === pseudo) {
            createElementFunction('oldMessagesMe', message)
        } else {
            createElementFunction('oldMessages', message)
        }
    });
})

socket.on('writting', (pseudo) => {
    document.querySelector('#isWritting').textContent = pseudo + ' est en train d\'écrire'
})
socket.on('notWritting', () => {
    document.querySelector('#isWritting').textContent = ''
})



socket.on('quitUser', (data) => {
    createElementFunction('quitUser', data)
})


// function

function writting() {
    socket.emit('writting', pseudo)
}

function notWritting() {
    socket.emit('notWritting')
}

function createChannel(newRoom){
    const newRoomItem = document.createElement("li");
    newRoomItem.classList.add('elementList');
    newRoomItem.id = newRoom;
    newRoomItem.textContent = newRoom;
    newRoomItem.setAttribute('onclick', "_joinRoom('" + newRoom + "')")
    document.getElementById('roomList').insertBefore(newRoomItem, document.getElementById('createNewRoom'));
}

function _joinRoom(channel){
    document.querySelector('#msgContainer').innerHTML ='';
    socket.emit('changeChannel', channel);
}

function _createRoom(){
    let newRoom = ''
if(newRoom === ''){
    newRoom = prompt('le nom de la room batard : ')
}

createChannel(newRoom);

_joinRoom(newRoom);
}

function createElementFunction(element, content) {
    let newElement = document.createElement('div');

    switch (element) {
        case 'newUser':

            newElement.classList.add(element, 'message');
            newElement.textContent = content + ' à rejoint le chat';
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'newMessageMe':
            newElement.classList.add(element, 'message');
            newElement.textContent = pseudo + ' : ' + content;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'newMessageAll':
            newElement.classList.add(element, 'message');
            newElement.textContent = content.pseudo + ' : ' + content.message;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'whisper':
            newElement.classList.add(element, 'message');
            newElement.textContent = content.sender + ' vous à chuchoté: ' + content.message;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'oldWhispers':
            newElement.classList.add(element, 'message');
            newElement.textContent = content.sender + ' vous à chuchoté: ' + content.content;
            document.getElementById('msgContainer').appendChild(newElement);
            break;


        case 'oldMessages':
            newElement.classList.add(element, 'message');
            newElement.textContent = content.sender + ' : ' + content.content;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'oldMessagesMe':
            newElement.classList.add('newMessageMe', 'message');
            newElement.textContent = content.sender + ' : ' + content.content;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'quitUser':

            newElement.classList.add(element, 'message');
            newElement.textContent = content + ' à quitté le chat';
            document.getElementById('msgContainer').appendChild(newElement);
            break;
    }
}