/*---------------------------------------------------------------
File Name : /controllers/EventHandler.ts
Creator : Song Si Joon
Compiler : tsc
Copyright : Song Si Joon
Description : 
Create Date : 2024-02-02
Last Modified : 2024-02-02
----------------------------------------------------------------*/
import type { Socket, SocketHandler, TCPSocket } from 'bun';
import { EventEmitter } from 'events';
import { PacketContoroller } from './PacketContoroller';;

/**
 * EventHandler
 */
class EventHandler extends EventEmitter {

    constructor() {
        super();

    }

    TcpDataHandler(socket: Socket, packetData: PacketContoroller) {
        //console.log("received tcp response:: ", packetData.payload);
        this.emit("res_data", packetData);
    }

    TcpCloseHandler(socket: Socket) {
        //console.log("not connected!!!");
        this.emit("close");
    }

    TcpEndHandler(socket: Socket) {
        //console.log("connection closed by server!!!");
        this.emit("end");
    }

    TcpConnectionErrorHandler(socket: Socket) {
        //console.log("connection fail!!!");
        this.emit("connectError");
    }
}


export { EventHandler };
