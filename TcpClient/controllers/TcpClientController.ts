/*---------------------------------------------------------------
File Name : /controllers/TcpClientController.ts
Creator : Song Si Joon
Compiler : tsc
Copyright : Song Si Joon
Description : 
Create Date : 2024-02-02
Last Modified : 2024-02-02
----------------------------------------------------------------*/
import type { Socket, SocketHandler, TCPSocket } from 'bun';
import { EventHandler } from './EventHandler';
import { nanoid } from 'nanoid';
import { PacketContoroller } from './PacketContoroller';

/**
 * TcpClientController
 */
class TcpClientController {
    tcpSocket: any;
    static tcpEventHandler: EventHandler;
    static resPacketController: PacketContoroller;
    host: string;
    port: number;
    reqs: Map<any, any>;

    constructor(host: string, port: number) {
        // super();
        console.log("CTrReqController constructor !");

        this.host = host;
        this.port = port;
        this.reqs = new Map();

        TcpClientController.resPacketController = new PacketContoroller(0);
        TcpClientController.tcpEventHandler = new EventHandler();

        TcpClientController.tcpEventHandler.on("end", () => {
            console.log("receive 'end' emit");
            this.tcpSocket = null;
            setTimeout(() => {
                console.log("try reconnect ", this.host, " : ", this.port);
                this.connect();
            }, 2000);
        });

        TcpClientController.tcpEventHandler.on("connectError", () => {
            console.log("receive 'connectError' emit");
            this.tcpSocket = null;
            setTimeout(() => {
                console.log("try reconnect ", this.host, " : ", this.port);
                this.connect();
            }, 2000);
        });

        TcpClientController.tcpEventHandler.on("res_data", (pared_packet: any) => {
            console.log("receive 'res_data' from tcp server:: ", pared_packet);
            const resData = JSON.parse(pared_packet.payload.toString('utf-8'));

            const { resolve, reject } = this.reqs.get(pared_packet.req_id);
            this.reqs.delete(pared_packet.req_id);

            // unexpected
            if (!resolve) return;
            
            resolve(resData);
        });
    }

    connect() {
        this.tcpSocket = Bun.connect({
            hostname: this.host,
            port: this.port,
            socket: {
                data(socket, data) { // tcp 응답
                    const receive_data: any = data;

                    if (Buffer.isBuffer(receive_data)) {
                        //console.log("data in:: ", receive_data.toString('hex'));  // 해당데이터 HxD 프로그램으로 돌려보면 데이터 보임
                        TcpClientController.resPacketController.buf = Buffer.concat([TcpClientController.resPacketController.buf, receive_data]); // 총 received 데이터 관리 버퍼
                    
                        while (TcpClientController.resPacketController._proc_idata(TcpClientController.tcpEventHandler, socket));

                    }
                    else {
                        var buf = Buffer.from(data);
                        console.log("This is not Buffer Error...");
                    }
                },
                open(socket) {
                    console.log("socket connected!!!");
                },
                close(socket) { TcpClientController.tcpEventHandler.TcpCloseHandler(socket); },
                drain(socket) { },
                error(socket, error) { },

                // client-specific handlers
                connectError(socket, error) { TcpClientController.tcpEventHandler.TcpConnectionErrorHandler(socket); }, // connection failed
                end(socket) { TcpClientController.tcpEventHandler.TcpEndHandler(socket); }, // connection closed by server
                timeout(socket) { }, // connection timed out
            },
        });

    }

    // tcp 서버에 데이터 전송 함수 호출 및 {resolve, reject} 등록.
    async call(requestData: any) {
        requestData.tr_code = String(requestData.tr_code);

        return new Promise((resolve, reject) => {
            const req_id = nanoid(8);
            requestData.req_id = req_id;

            this.sendToTcp(requestData.tr_code, req_id, requestData);
            this.reqs.set(req_id, { resolve, reject });
        });
    }

    // tcp 서버로 데이터 전송
    async sendToTcp(tr_code: number | string, req_id: string, payloadOrError: any, header?: any) {
        const pkt = PacketContoroller.pktize(tr_code, req_id, payloadOrError, header);

        if (this.tcpSocket){
            let result = (await this.tcpSocket).write(pkt.buf);
            console.log(result);
        }
    }
}


export { TcpClientController };
