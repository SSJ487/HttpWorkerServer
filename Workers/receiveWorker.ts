declare var self: Worker;

// 타입 정의
type BufferQueueItem = {
  buffer: ArrayBuffer;
  requestId: number;
};

// 워커가 처리할 버퍼 큐
let workerBufferQueue: BufferQueueItem[] = [];
let isProcessing = false; // 처리 중인지 여부

// 메인 스레드로부터 메시지 수신
self.onmessage = (event: MessageEvent) => {
  const { type, newData } = event.data;
  console.log(type, newData);

  if (type === 'new_data') {
    // 받은 새 데이터 업데이트
    workerBufferQueue.push(...newData);
    if (!isProcessing) {
      processBufferQueue();
    }
  }
};

// 버퍼 큐 데이터를 처리하는 함수
function processBufferQueue() {
  try {
    if (workerBufferQueue.length === 0) {
      isProcessing = false;
      return;
    }

    isProcessing = true;
    let processedCount = 0;

    while (workerBufferQueue.length > 0) {
      const { buffer, requestId } = workerBufferQueue.shift()!;
      console.log(`Processing request ${requestId}`)
      
      // 워커 B에게 데이터 전달
      self.postMessage({ type: 'process', buffer, requestId });
      processedCount++;
    }

    // 처리된 데이터 개수를 메인 스레드에 알림
    self.postMessage({ type: 'processed', processedCount });

    // 다음 처리 단계 시작
    if (workerBufferQueue.length > 0) {
      processBufferQueue();
    }
  } catch (error) {
    console.log(error);
  } finally {
    isProcessing = false;
  }
}