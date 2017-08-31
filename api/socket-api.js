"use strict";
const cfg = require('../cfg/cfg.json');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const steam = require('steamidconvert')(cfg.api_key);

const PythonShell = require('python-shell');
const GENERATOR_FILE = '../generators/generate_graph.py';

io.sockets.on('connection', (socket) => {
    const msgs = {
        crawling: "Some users need to be crawled, this can take some time",
        crashed: "Something went wrong"
    };

    const getSteamId = (id, cb) => {
        const is_64 = !isNaN(id) && id.toString().indexOf("765611") === 0 && id.toString().length === 17;

        if(is_64){
            cb(null, id);
            socket.emit("get-steamid:return", {id: id})
        }else {
            steam.convertVanity(id, (err, res) => {
                cb(err, res);
            })
        }
    };


    socket.on("get-steamid", data => {
        getSteamId(data.id, (err, id) => {
            if (err) {
                console.log(err);
                socket.emit("message", {message: msgs.crashed});
                return
            }
            socket.emit("get-steamid:return", {id: id})
        })
    });


    const runScript = (user, command, depth=1) => {
        const options = {
            mode: 'json',
            pythonOptions: ['-W', 'ignore'],
            args: ['--user', user, '--print', '--depth', depth]

        };

        console.log(command, "Running", GENERATOR_FILE, ...options.args);

        PythonShell.run(GENERATOR_FILE, options, (err, res) => {
            if (err){
                console.log(err);
                socket.emit("message", {message: msgs.crashed});
                return
            }

            console.log("Got data");

            res.every(e => {
                if(e.friend_error){
                    console.log(e.friend_error);
                    return true;
                }else if(e.info_error) {
                    console.log(e.info_error);
                    return true;
                }else if(e.message){

                }else{
                    socket.emit(`${command}:return`, {graph: e, user: user});
                    return false;
                }
            });
        })
    };

    socket.on("get-graph", data => {
        const user = data.user;
        getSteamId(user, (err, id) => {
            if (err) {
                console.log("aa", err);
                socket.emit("message", {message: msgs.crashed});
                return
            }
            runScript(id, "get-graph");
        })
    });

});

server.listen(7000, ()=>{
    console.log("Server running on", 7000);
});