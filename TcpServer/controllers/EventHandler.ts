/*---------------------------------------------------------------
File Name : /controllers/EventHandler.ts
Creator : Song Si Joon
Compiler : tsc
Copyright : Song Si Joon
Description : 이벤트 발생 핸들러
Create Date : 2024-02-02
Last Modified : 2024-02-02
----------------------------------------------------------------*/
import type { Socket, SocketHandler, TCPSocket,SocketOptions } from 'bun';
import { EventEmitter } from 'events';
import { PacketContoroller } from './PacketContoroller';;

/**
 * EventHandler
 */
class EventHandler extends EventEmitter {

    constructor() {
        super();

    }

    TcpDataHandler(socket: any, packetData: PacketContoroller) {
        //console.log("type:: ", type, " parsed data:: ", packetData.payload);
        this.emit("req_parsed_data", socket, packetData);
    }
}


export { EventHandler };
