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

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
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
  if (points.length !== 68 || points.some(point =>
    !Number.isFinite(point.x) || !Number.isFinite(point.y) ||
    point.x <= 0 || point.y <= 0 || point.x >= inputWidth || point.y >= inputHeight)) {
    throw new Error('눈썹에서 턱끝까지 얼굴 윤곽이 모두 보이는 사진을 골라 주세요.');
  }
  const cheekSpan = distance(points[0], points[16]);
  const eyeSpan = distance(points[36], points[45]);
  if (detection.box.width < 50 || cheekSpan < 40 || eyeSpan < 18) {
    throw new Error('사진 속 얼굴이 너무 작습니다. 얼굴을 크게 자른 사진을 올려 주세요.');
  }

  const noseTip = points[30];
  const leftReach = distance(points[0], noseTip);
  const rightReach = distance(points[16], noseTip);
  const leftEyeWidth = distance(points[36], points[39]);
  const rightEyeWidth = distance(points[42], points[45]);
  const eyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
  if (Math.min(leftEyeWidth, rightEyeWidth) < 5) {
    throw new Error('눈 주변의 윤곽이 충분히 보이는 정면 사진을 골라 주세요.');
  }
  const leftEyeCenter = midpoint(points[36], points[39]);
  const rightEyeCenter = midpoint(points[42], points[45]);
  const dx = rightEyeCenter.x - leftEyeCenter.x;
  const dy = rightEyeCenter.y - leftEyeCenter.y;
  const roll = Math.atan2(dy, dx);
  if (Math.abs(roll) > 20 * Math.PI / 180) {
    throw new Error('사진 속 눈높이가 많이 기울어졌습니다. 두 눈이 수평으로 보이는 사진을 골라 주세요.');
  }
  const cheekSymmetry = Math.min(leftReach, rightReach) / Math.max(leftReach, rightReach);
  const eyeSymmetry = Math.min(leftEyeWidth, rightEyeWidth) / Math.max(leftEyeWidth, rightEyeWidth);
  if (cheekSymmetry < 0.55 || eyeSymmetry < 0.60) {
    throw new Error('한쪽 얼굴이 더 크게 보입니다. 양쪽 볼과 두 눈이 함께 보이는 정면 사진을 골라 주세요.');
  }

  // Relative, dimensionless shape cues for the fictional interpretation.
  // Jaw width samples the middle of the lower jaw, away from ears and hair.
  const noseRatio = distance(points[31], points[35]) / eyeSpan;
  const jawRatio = distance(points[3], points[13]) / cheekSpan;
  const eyeGap = distance(points[39], points[42]) / eyeWidth;
  const leftLid = midpoint(points[37], points[38]);
  const rightLid = midpoint(points[43], points[44]);
  // Project onto the direction perpendicular to the eye line so a slight
  // camera roll does not change the estimated brow-to-lid separation.
  const verticalGap = (brow, lid) =>
    -(lid.x - brow.x) * Math.sin(roll) + (lid.y - brow.y) * Math.cos(roll);
  const browGap = (verticalGap(points[19], leftLid) + verticalGap(points[24], rightLid)) / (2 * eyeWidth);
  if (browGap <= 0) {
    throw new Error('눈과 눈썹의 위치를 구분하기 어렵습니다. 눈썹이 가려지지 않은 사진을 골라 주세요.');
  }
  return {
    observations: [
      {
        name: '코',
        reading: `이 사진에서 콧방울 양끝의 너비는 두 눈 바깥꼬리 사이 거리의 약 ${Math.round(noseRatio * 100)}%입니다.`,
      },
      {
        name: '턱선',
        reading: `턱선 중간의 좌우 너비는 양쪽 볼 가장자리 사이 거리의 약 ${Math.round(jawRatio * 100)}%입니다.`,
      },
      {
        name: '눈 사이',
        reading: `두 눈의 안쪽 눈머리 사이 간격은 한쪽 눈의 평균 가로 길이와 비교해 약 ${eyeGap.toFixed(1)}배입니다.`,
      },
      {
        name: '눈썹',
        reading: `눈썹 한가운데에서 윗눈꺼풀까지의 간격은 양쪽 평균으로 눈 가로 길이의 약 ${Math.round(browGap * 100)}%입니다.`,
      },
    ],
  };
}
