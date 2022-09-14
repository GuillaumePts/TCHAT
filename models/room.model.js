const mongoose = require('mongoose');

let roomSchema = new mongoose.Schema({
    name : String
});

mongoose.model('room', roomSchema);