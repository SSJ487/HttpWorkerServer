/*---------------------------------------------------------------
File Name : /controllers/TrController.ts
Creator : Song Si Joon
Compiler : tsc
Copyright : Song Si Joon
Description : 들어온 tr별 작업할 class 할당
Create Date : 2024-02-19
Last Modified : 2024-02-19
----------------------------------------------------------------*/
import type { Socket, SocketHandler, TCPSocket,SocketOptions } from 'bun';
import { Tr_test } from './trproc/Tr_test';
import { ERROR_OUT } from '../const/TrConst';

/**
 * TrController
 */
class TrController{

    constructor() {
        console.log("TrController");
    }

    async doProc(tr_code: string, data: any): Promise<any>
    {
        //console.log("tr::", tr_code, "doProc data:: ", data);
        let resPkt;
        let procClass;
        switch(Number(tr_code))
        {
            case 1:
                procClass = new Tr_test(tr_code);
                resPkt = await procClass.doProc(data);
                break;
            default:
                resPkt = new ERROR_OUT();
                resPkt.tr_code = tr_code;
                resPkt.req_id = data.req_id;
                resPkt.err_code = "1999";
                break;
        }

        return resPkt;
    }
}


export { TrController };
