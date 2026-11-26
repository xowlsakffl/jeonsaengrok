// Model weights are the only remote request. Personal inputs stay in a local worker.
const MODEL_URL = "https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/50968a4468ef4233ed78cd7c3de230dd1d61a56b/Qwen3-0.6B-Q4_K_M.gguf";
const MODEL_BYTES = 396705472;
const CACHE_NAME = "jeonsaeng-language-v1";
export const modelInfo = Object.freeze({ name: "Qwen3 0.6B", sizeLabel: "약 397 MB" });

function throwIfCancelled(signal) {
  if (signal?.aborted) throw new DOMException("생성을 취소했습니다.", "AbortError");
}

async function readModel(signal, onProgress) {
  const cache = await globalThis.caches?.open(CACHE_NAME).catch(() => null);
  const cached = await cache?.match(MODEL_URL).catch(() => null);
  if (cached) {
    const file = await cached.blob();
    throwIfCancelled(signal);
    if (file.size === MODEL_BYTES) return file;
    await cache.delete(MODEL_URL);
  }

  onProgress("한국어 모델 다운로드를 시작합니다. 약 397 MB");
  let response;
  try {
    response = await fetch(MODEL_URL, {
      mode: "cors", credentials: "omit", referrerPolicy: "no-referrer", signal
    });
  } catch {
    throwIfCancelled(signal);
    throw new Error("모델 다운로드 서버에 연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.");
  }
  if (!response.ok || !response.body) throw new Error("모델을 내려받지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.");

  let received = 0;
  let reported = -1;
  const meter = new TransformStream({
    transform(chunk, controller) {
      received += chunk.byteLength;
      const percent = Math.min(100, Math.floor(received * 100 / MODEL_BYTES));
      if (percent !== reported) {
        reported = percent;
        onProgress(`한국어 모델 다운로드 ${percent}% · ${Math.round(received / 1e6)} / 397 MB`);
      }
      controller.enqueue(chunk);
    }
  });
  let file;
  try {
    file = await new Response(response.body.pipeThrough(meter)).blob();
  } catch {
    throwIfCancelled(signal);
    throw new Error("모델 다운로드가 중간에 끊겼습니다. 다시 시도해 주세요.");
  }
  throwIfCancelled(signal);
  if (file.size !== MODEL_BYTES) throw new Error("모델 다운로드가 중간에 끊겼습니다. 다시 시도해 주세요.");
  if (cache) {
    onProgress("다음에 사용할 수 있도록 모델을 기기에 보관하고 있습니다.");
    // Quota-restricted and private browsing sessions can still use the downloaded file.
    await cache.put(MODEL_URL, new Response(file)).catch(() => {});
  }
  return file;
}

function generate(file, messages, maxTokens, signal, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./vendor/language/generate-worker.js", import.meta.url), { type: "module" });
    const cancel = () => finish(reject, new DOMException("생성을 취소했습니다.", "AbortError"));
    function finish(callback, value) {
      signal?.removeEventListener("abort", cancel);
      worker.terminate();
      callback(value);
    }
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) return cancel();
    worker.onerror = () => finish(reject, new Error("기기에서 언어 모델을 열 수 없습니다. 메모리 여유를 확인한 뒤 다시 시도해 주세요."));
    worker.onmessage = ({ data }) => {
      if (data.kind === "progress") return onProgress(data.text);
      if (data.kind === "error") return finish(reject, new Error(data.text));
      if (data.kind === "complete") finish(resolve, data.text);
    };
    worker.postMessage({ file, messages, maxTokens });
  });
}

export async function completeLocal({ messages, onProgress = () => {}, signal, maxTokens = 320 }) {
  throwIfCancelled(signal);
  if (!Array.isArray(messages) || !messages.some(message => message.role === "user" && typeof message.content === "string" && message.content.trim())) {
    throw new Error("이야기를 만들 단서가 비어 있습니다.");
  }
  const file = await readModel(signal, onProgress);
  throwIfCancelled(signal);
  onProgress("기기에서 한국어 언어 모델을 열고 있습니다.");
  const limit = Number.isFinite(maxTokens) ? Math.max(1, Math.min(1600, Math.floor(maxTokens))) : 320;
  return generate(file, messages, limit, signal, onProgress);
}
