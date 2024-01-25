import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  LitElement,
  html,
  css,
  // @ts-ignore
} from "lit";

function r(a, b, c) {
  return [c, b, a];
}

function t(a, b, c) {
  return [a, b, c];
}

export class ThreeRender extends LitElement {
  static properties = {
    perpPoints: { type: Array },
  };

  render() {
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    scene.add(group);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // soft white lights
    const light = new THREE.PointLight(0x404040, 1000000);
    light.position.set(0, 100, 200);
    scene.add(light);

    const alight = new THREE.AmbientLight(0x404040, 5);
    scene.add(alight);

    const geometry = new THREE.BufferGeometry();
    const indices = [];
    const vertices = [];

    const wall_width = 1; //TODO
    const channel_depth = 5; //TODO
    const top = wall_width + channel_depth;
    var i = 0;
    //
    this.perpPoints.forEach(({ covered, points }) => {
      //  1---2345---6   wall_width + channel_depth
      //  |0\1|__|4/ |   wall_width
      //  |  / \  \ 5|
      //  | / 2  \3\ |
      // 0|/_______\\|7  0
      //
      //  0   1  2   3

      // Each perp_points is 8 vertices (2 z positions for each 4 2d points)
      // between each set of 8 vertices is 8 square faces = 16 triangles)
      // At the end is 6 triangles for the 1 face.

      // 10  2
      // 09  1

      //add vertices for these perpPoints
      points.forEach((point) => {
        vertices.push(point.lo[1], point.lo[2], 0);
        vertices.push(point.lo[1], point.lo[2], top);
        vertices.push(point.li[1], point.li[2], top);
        vertices.push(point.li[1], point.li[2], wall_width);
        vertices.push(point.ri[1], point.ri[2], wall_width);
        vertices.push(point.ri[1], point.ri[2], top);
        vertices.push(point.ro[1], point.ro[2], top);
        vertices.push(point.ro[1], point.ro[2], 0);
      });

      //add indices to draw the actual triangles using those vertices.

      //end face
      indices.push(...r(i * 8 + 3, i * 8 + 1, i * 8 + 0));
      indices.push(...r(i * 8 + 2, i * 8 + 1, i * 8 + 3));
      indices.push(...r(i * 8 + 7, i * 8 + 3, i * 8 + 0));
      indices.push(...r(i * 8 + 7, i * 8 + 4, i * 8 + 3));
      indices.push(...r(i * 8 + 6, i * 8 + 5, i * 8 + 4));
      indices.push(...r(i * 8 + 6, i * 8 + 4, i * 8 + 7));

      //connecting faces
      for (let j = 0; j < points.length - 1; j++) {
        indices.push(...r(i * 8 + 0, i * 8 + 1, i * 8 + 8));
        indices.push(...r(i * 8 + 1, i * 8 + 9, i * 8 + 8));
        indices.push(...r(i * 8 + 1, i * 8 + 2, i * 8 + 9));
        indices.push(...r(i * 8 + 2, i * 8 + 10, i * 8 + 9));
        indices.push(...r(i * 8 + 2, i * 8 + 3, i * 8 + 10));
        indices.push(...r(i * 8 + 3, i * 8 + 11, i * 8 + 10));
        indices.push(...r(i * 8 + 3, i * 8 + 4, i * 8 + 11));
        indices.push(...r(i * 8 + 4, i * 8 + 12, i * 8 + 11));
        indices.push(...r(i * 8 + 4, i * 8 + 5, i * 8 + 12));
        indices.push(...r(i * 8 + 5, i * 8 + 13, i * 8 + 12));
        indices.push(...r(i * 8 + 5, i * 8 + 6, i * 8 + 13));
        indices.push(...r(i * 8 + 6, i * 8 + 14, i * 8 + 13));

        indices.push(...r(i * 8 + 6, i * 8 + 7, i * 8 + 14));
        indices.push(...r(i * 8 + 7, i * 8 + 15, i * 8 + 14));
        indices.push(...r(i * 8 + 7, i * 8 + 0, i * 8 + 15));
        indices.push(...r(i * 8 + 0, i * 8 + 8, i * 8 + 15));
        i++;
      }

      //end face
      indices.push(...r(i * 8 + 0, i * 8 + 1, i * 8 + 3));
      indices.push(...r(i * 8 + 3, i * 8 + 1, i * 8 + 2));
      indices.push(...r(i * 8 + 0, i * 8 + 3, i * 8 + 7));
      indices.push(...r(i * 8 + 3, i * 8 + 4, i * 8 + 7));
      indices.push(...r(i * 8 + 4, i * 8 + 5, i * 8 + 6));
      indices.push(...r(i * 8 + 7, i * 8 + 4, i * 8 + 6));
      i++;
    });

    console.log(vertices);
    console.log(indices);

    geometry.setIndex(indices);
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.computeBoundingBox();
    const bbc = geometry.boundingBox.getCenter(new THREE.Vector3());
    const bbMin = geometry.boundingBox.min;
    geometry.translate(-bbc.x, -bbc.y, -bbc.z);

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      //   emissive: 0xffffff,
      //   emissiveIntensity: 0.1,
      //   side: THREE.DoubleSide,
      //   wireframe: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    material.envMap = pmremGenerator.fromScene(scene);

    const axesHelper = new THREE.AxesHelper(500);
    group.add(axesHelper);

    const box = new THREE.BoxHelper(mesh, 0xffff00);
    group.add(box);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );

    camera.position.z = 200;
    // camera.translateX(-750);
    camera.translateY(-150);
    // console.log(bbMin.x - bbc.x, bbMin.y - bbc.y);
    // camera.translateY(bbMin.y - bbc.y);
    // camera.translateX(bbMin.x - bbc.x);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 0, 1);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;

    function animate() {
      requestAnimationFrame(animate);

      controls.update();

      renderer.render(scene, camera);
    }

    animate();
    return renderer.domElement;
  }
}

customElements.define("three-render", ThreeRender);
