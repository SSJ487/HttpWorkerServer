declare var self: Worker;

// 타입 정의
type ResponseQueueItem = {
    response: ArrayBuffer;
    requestId: number;
  };
  
  // 메인 스레드로부터 메시지 수신
  self.onmessage = (event: MessageEvent) => {
    const { type, responseQueue } = event.data;
  
    if (type === 'new_response') {
      // 응답 큐 처리
      processResponseQueue(responseQueue);
    }
  };

  
  // 응답 큐를 처리하는 함수
  function processResponseQueue(responseQueue: ResponseQueueItem[]) {
    while (responseQueue.length > 0) {
      const { response, requestId } = responseQueue.shift()!;
      // 최종 응답 처리
      self.postMessage({ type: 'final_response', requestId, response });
    }
  }
  