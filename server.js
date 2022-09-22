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
        if (users) {
            Room.find((err, channels) => {
                if (channels) {
                    res.render('index.ejs', {
                        users: users,
                        channels: channels
                    });
                } else {

                    res.render('index.ejs', {
                        users: users
                    });
                }
            });
        } else {
            Room.find((err, channels) => {
                if (channels) {
                    res.render('index.ejs', {
                        channels: channels
                    });
                } else {

                    res.render('index.ejs');
                }
            });
        }
    });
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
               // On join automatiquement le channel "salon1" par défaut
               
              console.log(2);
               // On conserve le pseudo dans la variable socket qui est propre à chaque utilisateur
               socket.pseudo = pseudo;
              
               connectedUsers.push(socket);
               console.log(socket.pseudo, connectedUsers[0]);
               // On previent les autres
               socket.broadcast.to(socket.channel).emit('newUser', pseudo);
            } else {
                let user = new User();
                user.pseudo = pseudo;
                user.save();

                // On join automatiquement le channel "salon1" par défaut
               console.log(1);

                socket.pseudo = pseudo;
                connectedUsers.push(socket)
                socket.broadcast.to(socket.channel).emit('newUser', pseudo);
                socket.broadcast.emit('newUserInDb', pseudo);
               
            }

           

            // Chat.find({
            //     receiver: 'all'
            // }, (err, messages) => {
            //     socket.emit('oldMessages', messages);
            // })
            
        });

    })



    socket.on('oldWhispers', (pseudo) => {
        Chat.find({
            receiver: pseudo
        }, (err, messages) => {

            if (err) {
                return false;
            } else {
                socket.emit('oldWhispers', messages)
            }

        });
    });

    socket.on('newMessage', (message, receiver) => {

        if (receiver === "all") {
          
            let chat = new Chat();
            chat._id_room = socket.channel;
            chat.content = message;
            chat.sender = socket.pseudo;
            chat.receiver = receiver;
            chat.save();

            socket.broadcast.to(socket.channel).emit('newMessageAll', {
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

    socket.on('changeChannel', (channel) => {
        _joinRoom(channel);
    })



    socket.on('writting', (pseudo) => {
        socket.broadcast.to(socket.channel).emit('writting', pseudo);
    })

    socket.on('notWritting', (pseudo) => {
        socket.broadcast.to(socket.channel).emit('notWritting',pseudo);
    })

    socket.on('disconnect', () => {
        let index = connectedUsers.indexOf(socket);
        if (index > -1) {
            connectedUsers.splice(index, 1)
        }
        socket.broadcast.emit('quitUser', socket.pseudo);
    })
console.log(connectedUsers.length);
    // FUNCTION

    function _joinRoom(channelParam) {

        let previousChannel = '';
        if (socket.channel) {
            previousChannel = socket.channel;
        }

        socket.leaveAll();
        socket.join(channelParam);
        socket.channel = channelParam;


        Room.findOne({
            name: socket.channel
        }, (err, channel) => {
           
            if (channel) {
                Chat.find({
                    _id_room: socket.channel
                }, (err, messages) => {

                
                    if (!messages) {
                        return false;
                    } else {
                        socket.emit('oldMessages', messages, socket.pseudo);
                        //Si l'utilisateur vient d'un autre channel, on le fait passer, sinon on ne fait passer que le nouveau
                        if (previousChannel) {
                            socket.emit('emitChannel', {
                                previousChannel: previousChannel,
                                newChannel: socket.channel
                            });
                        } else {
                            socket.emit('emitChannel', {
                                newChannel: socket.channel
                            });
                        }
                    }
                });

            } else {
                let room = new Room();
                room.name = socket.channel;
                room.save();
                if (socket.channel === "salon1") {
                    socket.broadcast.emit('newChannel', socket.channel)
                    socket.emit('emitChannel', {
                        previousChannel: previousChannel,
                        newChannel: socket.channel
                        
                    })
              
                } else {
                    socket.broadcast.emit('newChannel', socket.channel)
                    socket.emit('emitChannel', {
                        previousChannel: previousChannel,
                        newChannel: socket.channel
                    })
                   
              
                }

            }
        })
    }

})





server.listen(9999, () => console.log('server ok ! : http://localhost:9999'));