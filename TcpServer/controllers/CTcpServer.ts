/*---------------------------------------------------------------
File Name : /controllers/TcpServerController.ts
Creator : Song Si Joon
Compiler : tsc
Copyright : Song Si Joon
Description : client에서 들어온 데이터 버퍼에 저장 및 컨드롤
Create Date : 2024-02-02
Last Modified : 2024-02-02
----------------------------------------------------------------*/
import { EventHandler } from './EventHandler';
import { PacketContoroller } from './PacketContoroller';
import { TrController} from './TrController';

/**
 * TcpServerController
 */
class TcpServerController {
    tcpServer: any;
    static tcpEventHandler: EventHandler;
    static reqPacketController: PacketContoroller;
    static resPacketController: PacketContoroller;
    static trController: TrController;
    host: string;
    port: number;
    reqs: Map<any, any>;

    constructor(host: string, port: number) {
        // super();
        console.log("CTrReqController constructor !");

        this.host = host;
        this.port = port;
        this.reqs = new Map();

        TcpServerController.trController = new TrController();
        TcpServerController.reqPacketController = new PacketContoroller(0);
        TcpServerController.resPacketController = new PacketContoroller(0);
        TcpServerController.tcpEventHandler = new EventHandler();

        // 요청 데이터 처리하여 res buf에 저장
        TcpServerController.tcpEventHandler.on("req_parsed_data", async (socket: any, packet: PacketContoroller) => {
            const req_data_parse = JSON.parse(packet.payload.toString());
            //console.log("receive 'parsed_data' emit tr::", req_data_parse.tr_code);
            //console.log("receive 'parsed_data' emit data::", req_data_parse);

            // TR별 동작 실행
            let res_data = await TcpServerController.trController.doProc(req_data_parse.tr_code.toString(), req_data_parse);

            
            // result 데이터에 헤더정보 추가후 client로 전송
            const res_pkt = PacketContoroller.pktize(res_data.tr_code, res_data.req_id, res_data, null);
            if (socket)
            {
                //console.log(" data OUT:: ", res_pkt.buf.toString('hex'));  // 해당데이터 HxD 프로그램으로 돌려보면 데이터 보임
                (await socket).write(res_pkt.buf);
            }
        });

    }

    listen() {
        this.tcpServer = Bun.listen({
            hostname: this.host,
            port: this.port,
            socket: {
                data(socket, data) {
                    const receive_data: any = data;

                    if (Buffer.isBuffer(receive_data)) {
                        console.log(receive_data.length);
                        // console.log("data in:: ", receive_data.toString());

                        const tmp_buf = Buffer.from(receive_data);
                        TcpServerController.reqPacketController.buf = Buffer.concat([TcpServerController.reqPacketController.buf, tmp_buf]); // 총 received 데이터 관리 버퍼
                        // const receiveData = JSON.parse(receive_data.toString('utf-8'));
                        // console.log("data buf:: ", receiveData);

                        while (TcpServerController.reqPacketController._proc_idata(TcpServerController.tcpEventHandler, socket));
                    }
                    else {
                        var buf = Buffer.from(data);
                        console.log("This is not Buffer..");
                        socket.write("Error.");
                    }
                },
                open(socket) {
                    console.log("socket open:: ", socket);
                },
            },
        });
    }

}

export { TcpServerController };

