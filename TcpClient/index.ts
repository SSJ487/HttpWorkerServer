/*---------------------------------------------------------------
File Name : index.ts
Creator : Song Si Joon
Compiler : tsc
Copyright : Song Si Joon
Description : 웹소켓으로 client에서 받은 데이터 tcp 서버로 전송하는 버퍼에 전달
Create Date : 2024-02-02
Last Modified : 2024-02-02
----------------------------------------------------------------*/
import figlet from "figlet";
import { TcpClientController } from "./controllers"

const tcpClient = new TcpClientController("localhost", 8080);
tcpClient.connect();


const server = Bun.serve<{ authToken: string }>({
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      // Bun automatically returns a 101 Switching Protocols
      // if the upgrade succeeds
      return undefined;
    }

    // handle HTTP request normally
    return new Response("Hello world!  ");
  },
  websocket: {
    open(ws) {
      console.log('--open--');
      console.log('ws:', ws);
    },

    // this is called when a message is received
    async message(ws, data) {
      const requestData = JSON.parse(data.toString());
      requestData.tr_code = Number(requestData.tr_code);

      console.log(`Received ${JSON.stringify(requestData)}`);

      // request to tcp server and wait promise resolve.
      const response = await tcpClient.call(requestData);

      // send back a message to user
      ws.send(JSON.stringify(response));
    },

    close(ws) {
      console.log('--close--');
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);


