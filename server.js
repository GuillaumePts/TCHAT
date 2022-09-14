
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const mongoose = require('mongoose');


const ObjectId = mongoose.Types.ObjectId;

const mdp = require('./env')

try {
    // Connect to the MongoDB cluster
    mongoose.connect(
        mdp.mongoAtlasUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        },
        () => console.log(" Mongoose is connected"),
    );
} catch (e) {
    console.log("could not connect");
}

require('./models/user.model');
require('./models/room.model');
require('./models/chat.model');
let User = mongoose.model('user');
let Room = mongoose.model('room');
let Chat = mongoose.model('chat');



app.use(express.static(__dirname + '/public'));

//ROuTER

app.get('/', function (req, res) {

    User.find((err, users) => {
        res.render('index.ejs', {
            users: users
        });
    })

});

app.use(function (req, res, next) {
    res.setHeader('Content-type', 'text/html');
    res.status(404).send('Page introuvable !');
});

// SOCKET.IO

let io = require('socket.io')(server);

let connectedUsers = [];

io.on('connection', (socket) => {

    socket.on('pseudo', (pseudo) => {
        User.findOne({
            pseudo: pseudo
        }, (err, user) => {
            if (user) {
                socket.pseudo = pseudo;
                socket.broadcast.emit('newUser', pseudo)
            } else {
                let user = new User();
                user.pseudo = pseudo;
                user.save();

                socket.pseudo = pseudo;
                socket.broadcast.emit('newUser', pseudo)
                socket.broadcast.emit('newUserInDb', pseudo)
            }

            connectedUsers.push(socket);

            Chat.find({
                receiver: 'all'
            }, (err, messages) => {
                socket.emit('oldMessages', messages);
            })
        });

    })

    socket.on('oldWhispers', (pseudo) => {
        Chat.find({
            receiver: pseudo
        }, (err, messages) => {

            if (err) {
                return false;
            } else {
                socket.emit('oldWhispers',messages)
            }

        });
    });

    socket.on('newMessage', (message, receiver) => {

        if (receiver === "all") {
            let chat = new Chat();
            chat.content = message;
            chat.sender = socket.pseudo;
            chat.receiver = "all";
            chat.save();

            socket.broadcast.emit('newMessageAll', {
                message: message,
                pseudo: socket.pseudo
            })
        } else {

            User.findOne({
                pseudo: receiver
            }, (err, user) => {

                if (!user) {
                    return false
                } else {
                     socketReceiver = connectedUsers.find(socket => socket.pseudo === user.pseudo);

                    if (socketReceiver) {

                        socketReceiver.emit('whisper', {
                            sender: socket.pseudo,
                            message: message
                        });

                    }


                    let chat = new Chat();
                    chat.content = message;
                    chat.sender = socket.pseudo;
                    chat.receiver = receiver;
                    chat.save();
                }




            });

        }

    });





    socket.on('writting', (pseudo) => {
        socket.broadcast.emit('writting', pseudo);
    })

    socket.on('notWritting', () => {
        socket.broadcast.emit('notWritting');
    })

    socket.on('disconnect', () => {
        let index = connectedUsers.indexOf(socket);
        if (index > -1) {
            connectedUsers.splice(index, 1)
        }
        socket.broadcast.emit('quitUser', socket.pseudo);
    })
})



server.listen(9999, () => console.log('server ok ! : http://localhost:9999'));