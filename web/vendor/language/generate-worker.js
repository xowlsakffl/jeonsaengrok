import { Wllama } from "./wllama.js";

const contextSize = 4096;
const emit = (kind, text) => self.postMessage({ kind, text });

function formatPrompt(messages) {
  const turns = messages.map(({ role, content }) => {
    if (!["system", "user", "assistant"].includes(role) || typeof content !== "string") {
      throw new Error("대화 형식을 읽을 수 없습니다.");
    }
    // Escape reserved tokenizer markers in the caller's text, preserving normal Korean prose.
    const escaped = content.replace(/<\|/g, "〈|").replace(/\|>/g, "|〉");
    return `<|im_start|>${role}\n${escaped}<|im_end|>\n`;
  });
  // Qwen3's documented enable_thinking=false assistant prefix.
  return turns.join("") + "<|im_start|>assistant\n<think>\n\n</think>\n\n";
}

self.onmessage = async ({ data: { file, messages, maxTokens } }) => {
  let readingTimer;
  try {
    const silent = () => {};
    const model = new Wllama({
      "single-thread/wllama.wasm": new URL("./wllama.wasm", import.meta.url).href,
    }, {
      suppressNativeLog: true,
      logger: { debug: silent, log: silent, warn: silent, error: silent },
    });
    await model.loadModel([file], { n_ctx: contextSize, n_threads: 1, n_batch: 64, seed: 1643 });

    const prompt = formatPrompt(messages);
    const promptTokens = await model.tokenize(prompt);
    const available = contextSize - promptTokens.length - 8;
    if (available < Math.min(64, maxTokens)) throw new Error("입력 내용이 길어 모델에 담을 수 없습니다. 단서를 줄여 주세요.");
    emit("progress", "기기에서 단서를 읽고 첫 문장을 짓고 있습니다.");
    const startedAt = performance.now();
    readingTimer = setInterval(() => {
      const seconds = Math.round((performance.now() - startedAt) / 1000);
      emit("progress", `기기에서 단서를 읽고 있습니다. · ${seconds}초 경과`);
    }, 10000);

    let generated = 0;
    const complete = new AbortController();
    const answer = await model.createCompletion(prompt, {
      nPredict: Math.min(maxTokens, available),
      abortSignal: complete.signal,
      sampling: { temp: 0.65, top_p: 0.8, top_k: 20, penalty_repeat: 1.09 },
      onNewToken(token, piece, currentText) {
        generated++;
        if (generated === 1) clearInterval(readingTimer);
        if (generated > 75 && /[.!?。][”’"]?\s*$/.test(currentText) &&
            (currentText.match(/[가-힣][.!?。]/g)||[]).length >= 5) complete.abort();
        if (generated === 1 || generated % 8 === 0) {
          emit("progress", `기기에서 이야기를 짓고 있습니다. · ${generated}토큰`);
        }
      }
    });
    const text = answer.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").replace(/<\|im_(?:start|end)\|>[\s\S]*$/g, "").trim();
    if (!text) throw new Error("이야기 문장을 얻지 못했습니다. 다시 시도해 주세요.");
    emit("complete", text);
  } catch (error) {
    const friendly = /[가-힣]/.test(error.message) ? error.message : "언어 모델 실행에 실패했습니다. 메모리 여유와 브라우저 버전을 확인한 뒤 다시 시도해 주세요.";
    emit("error", friendly);
  } finally {
    clearInterval(readingTimer);
  }
};
