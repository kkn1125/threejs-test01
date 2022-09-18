// import * as THREE from "../node_modules/three/build/three.module.js";
// import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js";

import * as dat from "https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.module.js";
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.11.1/index.js";
// import * as dat from "../node_modules/dat.gui/build/dat.gui.module.js";
// import gsap from "../node_modules/gsap/index.js";

// console.log(gsap)
const gui = new dat.GUI();
const world = {
  plane: {
    width: 400,
    height: 400,
    widthSegments: 50,
    heightSegments: 50,
  },
};

const generatePlane = () => {
  planeMesh.geometry.dispose();
  planeMesh.geometry = new THREE.PlaneGeometry(
    world.plane.width,
    world.plane.height,
    world.plane.widthSegments,
    world.plane.heightSegments
  );

  // TODO: 지형 모양 설정
  const randomValues = [];
  const { array } = planeMesh.geometry.attributes.position;
  for (let i = 0; i < array.length; i++) {
    if (i % 3 === 0) {
      const x = array[i];
      const y = array[i + 1];
      const z = array[i + 2];

      array[i] = x + (Math.random() - 0.5) * 3;
      array[i + 1] = y + (Math.random() - 0.5) * 3;
      array[i + 2] = z + (Math.random() - 0.5) * 3;
    }

    randomValues.push(Math.random() * Math.PI * 2);
  }

  planeMesh.geometry.attributes.position.randomValues = randomValues;
  planeMesh.geometry.attributes.position.originalPosition =
    planeMesh.geometry.attributes.position.array;

  const colors = [];
  for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
    // console.log(i);
    colors.push(0, 0.19, 0.4);
  }

  planeMesh.geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(colors), 3)
  );
};

gui.add(world.plane, "width", 1, 500).onChange(generatePlane);
gui.add(world.plane, "height", 1, 500).onChange(generatePlane);
gui.add(world.plane, "widthSegments", 1, 100).onChange(generatePlane);
gui.add(world.plane, "heightSegments", 1, 100).onChange(generatePlane);

// 레이저포인트라고 생각하면 편함
const raycaster = new THREE.Raycaster();
// 장면 생성
const scene = new THREE.Scene();
// 카메라 생성
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
);

// 렌더러 생성
const renderer = new THREE.WebGLRenderer();

// renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);

document.body.appendChild(renderer.domElement);

// TODO: 박스 만들기
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

const mesh = new THREE.Mesh(boxGeometry, boxMaterial);
// scene.add(mesh);

//  TODO: 평지 만들기
const planeGeometry = new THREE.PlaneGeometry(
  world.plane.width,
  world.plane.height,
  world.plane.widthSegments,
  world.plane.heightSegments
);
const planeMaterial = new THREE.MeshPhongMaterial({
  // color: 0xff0000,
  side: THREE.DoubleSide,
  flatShading: true,
  vertexColors: true,
});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
// console.log(planeMesh);
scene.add(planeMesh);

generatePlane();

camera.position.set(-15, -35, 80);

const controls = new OrbitControls(camera, renderer.domElement);
// console.log(controls);

// TODO: 빛 설정
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 1);
scene.add(light);

// TODO: 뒷면 빛 설정
const backLight = new THREE.DirectionalLight(0xffffff, 1);
backLight.position.set(0, 0, -1);
scene.add(backLight);

const mouse = {
  x: undefined,
  y: undefined,
};
addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  // console.log(mouse);
});

// canvas size sync with Display Size
function resizeCanvasToDisplaySize() {
  // 캔버스 엘리먼트
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    // you must pass false here or three.js sadly fights the browser
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // set render target sizes here
  }
}

let frame = 0;
function animation() {
  frame += 0.01;

  resizeCanvasToDisplaySize();

  renderer.render(scene, camera);
  camera.autoRotate = true;

  // mesh.rotation.x += 0.01;
  // mesh.rotation.y += 0.01;
  // planeMesh.rotation.x = 90;

  raycaster.setFromCamera(mouse, camera);

  const { array, originalPosition, randomValues } =
    planeMesh.geometry.attributes.position;
  for (let i = 0; i < array.length; i += 3) {
    // x
    array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.01;
    // y
    array[i + 1] =
      originalPosition[i + 1] + Math.sin(frame + randomValues[i + 1]) * 0.001;
    // z
    // array[i + 2] =
    //   originalPosition[i + 2] + Math.cos(frame + randomValues[i + 2]) * 0.003;
  }

  planeMesh.geometry.attributes.position.needsUpdate = true;

  const intersects = raycaster.intersectObject(planeMesh);
  // console.log(intersects);
  if (intersects.length > 0) {
    const { color } = intersects[0].object.geometry.attributes;

    color.needsUpdate = true;
    // console.log("intersecting");

    const initialColor = {
      r: 0,
      g: 0.19,
      b: 0.4,
    };

    const hoverColor = {
      r: 0.1,
      g: 0.5,
      b: 1,
    };

    gsap.to(hoverColor, {
      r: initialColor.r,
      g: initialColor.g,
      b: initialColor.b,
      onUpdate: () => {
        // console.log("update");

        // vertice 1
        color.setX(intersects[0].face.a, hoverColor.r);
        color.setY(intersects[0].face.a, hoverColor.g);
        color.setZ(intersects[0].face.a, hoverColor.b);

        // vertice 2
        color.setX(intersects[0].face.b, hoverColor.r);
        color.setY(intersects[0].face.b, hoverColor.g);
        color.setZ(intersects[0].face.b, hoverColor.b);

        // vertice 3
        color.setX(intersects[0].face.c, hoverColor.r);
        color.setY(intersects[0].face.c, hoverColor.g);
        color.setZ(intersects[0].face.c, hoverColor.b);
      },
    });

    // document.body.style = `cursor: pointer`;
  } else {
    // document.body.style = `cursor: normal`;
  }

  // camera.aspect = canvas.clientWidth / canvas.clientHeight;
  // camera.updateProjectionMatrix();

  controls.update();
  controls.autoRotate = false;
  requestAnimationFrame(animation);
}

animation();

// addEventListener("resize", () => {
//   canvas.width = innerWidth;
//   canvas.height = innerHeight;
// });

// gsap으로 카메라 이동 부드럽게
function handleRestView() {
  gsap.to(camera.position, {
    x: -15,
    y: -35,
    z: 80,
    duration: 2.5,
  });
  controls.update();
}

// gsap으로 카메라 이동 부드럽게
function handleChangeView() {
  gsap.to(camera.position, {
    x: 0,
    y: -100,
    z: 8,
    duration: 2.5,
  });
  // camera.position.set(-15, -35, 8);
  controls.update();
}

const changeButton = document.querySelector("button#change");
const resetButton = document.querySelector("button#reset");

changeButton.addEventListener("click", handleChangeView);
resetButton.addEventListener("click", handleRestView);
