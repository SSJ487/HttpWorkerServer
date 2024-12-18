/*---------------------------------------------------------------
File Name : index.ts
Creator : Song Si Joon
Compiler : tsc
Copyright : Song Si Joon
Description : http client에서 받은 데이터 tcp 서버로 전송하는 버퍼에 전달
Create Date : 2024-02-02
Last Modified : 2024-02-02
----------------------------------------------------------------*/
// 타입 정의
type BufferQueueItem = {
  buffer: ArrayBuffer;
  requestId: number;
};

type ResponseQueueItem = {
  response: ArrayBuffer;
  requestId: number;
};

type RequestMapValue = {
  resolve: (value: Response) => void;
};

// 버퍼 큐 초기화
let receiveQueue: BufferQueueItem[] = [];
let responseQueue: ResponseQueueItem[] = []; // 큐 2
let lastProcessedIndex = 0; // 마지막으로 워커에게 전달된 인덱스

const receiveWorker = new Worker(new URL("./Workers/receiveWorker.ts", import.meta.url).href);
const logicWorker = new Worker(new URL("./Workers/logicWorker.ts", import.meta.url).href);
const returnWorker = new Worker(new URL("./Workers/returnWorker.ts", import.meta.url).href);

// 워커 A에서 메시지 수신 (처리 완료 알림)
receiveWorker.onmessage = (event: MessageEvent) => {
  try {
    const { type, processedCount, buffer, requestId } = event.data;
    if (type === 'processed') {
      console.log(type, processedCount);
      receiveQueue = receiveQueue.slice(processedCount);
      lastProcessedIndex = receiveQueue.length;
    }
    else if (type == 'process') {
      logicWorker.postMessage({ type: 'logic_process', buffer, requestId });
    }
  } catch (error) {
    console.error("Error in receiveWorker.onmessage:", error);
  }
};

// 워커 B에서 메시지 수신 (응답 준비 완료)
logicWorker.onmessage = (event: MessageEvent) => {
  try {
    const { type, response, requestId } = event.data;
    if (type === 'response') {
      console.log(type, response, requestId);
      responseQueue.push({ response, requestId });
      returnWorker.postMessage({ type: 'new_response', responseQueue });
    }
  } catch (error) {
    console.error("Error in logicWorker.onmessage:", error);
  }
};

// 워커 C에서 메시지 수신 (최종 응답 처리)
returnWorker.onmessage = (event: MessageEvent) => {
  try {
    const { type, requestId, response } = event.data;
    if (type === 'final_response') {
      const requestInfo = requestMap.get(requestId);
      if (requestInfo) {
        requestInfo.resolve(new Response(response));
        requestMap.delete(requestId);
      }
    }
  } catch (error) {
    console.error("Error in returnWorker.onmessage:", error);
  }
};



// 요청을 추적할 맵
const requestMap: Map<number, RequestMapValue> = new Map();
let requestIdCounter = 0;

const server = Bun.serve({
  port: 8080, // defaults to $BUN_PORT, $PORT, $NODE_PORT otherwise 3000
  hostname: "10.0.2.15", // defaults to "0.0.0.0"

  async fetch(req: Request) {
    const path = new URL(req.url).pathname;
    console.log(path);

    // respond with text/html
    if (path === "/") return new Response("Welcome to Bun!");

    // redirect
    if (path === "/abc") return Response.redirect("/source", 301);

    // send back a file (in this case, *this* file)
    if (path === "/source") return new Response(Bun.file(import.meta.path));

    // respond with JSON
    if (path === "/api") return Response.json({ some: "buns", for: "you" });

    // receive JSON data to a POST request
    if (req.method === "POST" && path === "/api/post") {
      // 고유 요청 ID 생성
      const requestId = requestIdCounter++;

      // 요청을 Promise로 관리
      const responsePromise = new Promise<Response>((resolve) => {
        requestMap.set(requestId, { resolve });
      });


      const jsonData = await req.json();
      console.log("Received JSON:", jsonData);

      // JSON 데이터를 문자열로 변환
      const jsonString = JSON.stringify(jsonData);

      // 문자열을 Uint8Array로 변환
      const encoder = new TextEncoder();
      const uint8ArrayFromJson = encoder.encode(jsonString);

      // Uint8Array를 ArrayBuffer로 변환
      const arrayBufferFromJson = uint8ArrayFromJson.buffer;
      console.log('ArrayBuffer from JSON:', arrayBufferFromJson);

      // Uint8Array로 변환하여 출력
      const uint8ArrayFromJsonResult = new Uint8Array(arrayBufferFromJson);
      console.log('Uint8Array from JSON:', uint8ArrayFromJsonResult);

      const chunk = arrayBufferFromJson as ArrayBuffer;

      // 버퍼 큐에 데이터 추가
      receiveQueue.push({ buffer: chunk, requestId });

      // 워커 A에게 새로운 데이터만 전달
      const newData = receiveQueue.slice(lastProcessedIndex);
      lastProcessedIndex = receiveQueue.length; // 인덱스 업데이트
      receiveWorker.postMessage({ type: 'new_data', newData });

      // Promise를 반환하여 응답 처리
      return responsePromise;
    }

    // receive POST data from a form
    if (req.method === "POST" && path === "/form") {
      const data = await req.formData();
      console.log(data.get("someField"));
      return new Response("Success");
    }

    // 404s
    return new Response("Page not found", { status: 404 });
  }
})

console.log(`Listening on:?:? ${server.hostname}:${server.port}`);


