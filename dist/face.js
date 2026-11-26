// Only the detector and the 68-point landmark model are loaded.
// Model input, landmarks and photographs are processed in this browser tab.
const vendorDirectory = new URL('./vendor/', import.meta.url);
let modelPromise;

async function loadModels() {
  if (!modelPromise) {
    modelPromise = (async () => {
      await import(new URL('face-api.min.js', vendorDirectory).href);
      const api = globalThis.faceapi;
      // TinyFaceDetector is small enough for the CPU. This also works in tabs
      // that have no usable WebGL context or that block GPU access.
      await api.tf.setBackend('cpu');
      const location = new URL('models', vendorDirectory).href;
      await Promise.all([
        api.nets.tinyFaceDetector.loadFromUri(location),
        api.nets.faceLandmark68TinyNet.loadFromUri(location),
      ]);
      return api;
    })().catch(() => {
      modelPromise = undefined;
      throw new Error('얼굴 분석 도구를 불러오지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.');
    });
  }
  return modelPromise;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export async function analyzeFace(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height || Math.min(width, height) < 80) {
    throw new Error('사진 해상도가 낮습니다. 얼굴이 선명하게 보이는 사진을 골라 주세요.');
  }

  const api = await loadModels();
  const scale = Math.min(1, 960 / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const inputWidth = canvas.width;
  const inputHeight = canvas.height;
  let faces;
  try {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const options = new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.38 });
    faces = await api.detectAllFaces(canvas, options).withFaceLandmarks(true);
  } catch {
    throw new Error('이 사진을 분석하지 못했습니다. 다른 JPG, PNG 또는 WebP 사진으로 시도해 주세요.');
  } finally {
    canvas.width = 1;
    canvas.height = 1;
  }
  if (!faces.length) {
    throw new Error('얼굴을 찾지 못했습니다. 얼굴이 잘 보이는 밝은 정면 사진을 골라 주세요.');
  }
  if (faces.length > 1) {
    throw new Error('얼굴이 여러 개 보입니다. 한 사람만 나온 사진을 골라 주세요.');
  }

  const { detection, landmarks } = faces[0];
  const points = landmarks.positions;
  const cheekSpan = distance(points[0], points[16]);
  const eyeSpan = distance(points[36], points[45]);
  if (detection.box.width < 50 || cheekSpan < 40 || eyeSpan < 18) {
    throw new Error('사진 속 얼굴이 너무 작습니다. 얼굴을 크게 자른 사진을 올려 주세요.');
  }

  const noseTip = points[30];
  const leftReach = distance(points[0], noseTip);
  const rightReach = distance(points[16], noseTip);
  const tilt = Math.abs(points[45].y - points[36].y) / eyeSpan;
  if (Math.min(leftReach, rightReach) / Math.max(leftReach, rightReach) < 0.52 || tilt > 0.36) {
    throw new Error('정면에서 얼굴 전체가 보이는 사진이 필요합니다. 고개를 바로 한 사진을 골라 주세요.');
  }

  // Relative, dimensionless shape cues for the fictional interpretation.
  // Jaw width samples the middle of the lower jaw, away from ears and hair.
  const noseRatio = distance(points[31], points[35]) / eyeSpan;
  const jawRatio = distance(points[3], points[13]) / cheekSpan;
  // Positions in the entire uncropped image for an overlay with the same aspect ratio.
  const normalize = point => ({
    x: Math.max(0, Math.min(1, point.x / inputWidth)),
    y: Math.max(0, Math.min(1, point.y / inputHeight)),
  });
  return {
    nose: noseRatio < 0.32 ? 'narrow' : noseRatio > 0.41 ? 'full' : 'balanced',
    jaw: jawRatio < 0.72 ? 'narrow' : jawRatio > 0.82 ? 'wide' : 'balanced',
    marks: { nose: normalize(noseTip), jaw: normalize(points[8]) },
  };
}
