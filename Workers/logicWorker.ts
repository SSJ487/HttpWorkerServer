declare var self: Worker;

// 워커 C 생성
const returnWorkerURL = new URL("./returnWorker.ts", import.meta.url).href;
const returnWorker = new Worker(returnWorkerURL);

self.onmessage = (event: MessageEvent) => {
  const { type, buffer, requestId } = event.data;
  console.log(type, buffer, requestId);
  try {
    if (type === 'logic_process') {
      DoLogicProcess(buffer, requestId);
    }
  } catch (error) {
    console.log(error);
  } finally {
  }
};

// 로직처리
function DoLogicProcess(buffer: any, requestId: any) {
  try {
    // ArrayBuffer를 문자열로 변환
    const uint8Array = new Uint8Array(buffer);
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(uint8Array);

    // 문자열을 JSON 객체로 변환
    const jsonData = JSON.parse(jsonString);
    console.log(jsonData);

    // "ok" 메시지 추가
    jsonData.message = "ok";

    // JSON 데이터를 문자열로 변환
    const newJsonString = JSON.stringify(jsonData);
    const encoder = new TextEncoder();
    const newUint8Array = encoder.encode(newJsonString);
    const newArrayBuffer = newUint8Array.buffer as ArrayBuffer;
    console.log("newArrayBuffer:: ", newArrayBuffer, requestId);
    console.log("self:: ", self.postMessage);

    // 메인 스레드에 처리된 응답 전달
    //returnWorker.postMessage({ type: 'final_response', requestId});
    self.postMessage({ type: 'response', response: newArrayBuffer, requestId });

  } catch (error) {
    console.log(error);
  } finally {
  }
}