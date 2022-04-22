import * as THREE from 'three'

import {
	STLLoader
} from './STLLoader.js'

import {
	OrbitControls
} from './OrbitControls.js'


function animate() {
	requestAnimationFrame(animate);
	controls.update()
	renderer.render(scene, camera);
	//console.log(light.position);
	//console.log(camera.position);
}

let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let light = null;
let material = null;

jQuery(document).ready(function() {

	// read in the tube
	// read in the stone

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	scene.add(new THREE.AxesHelper(5))

	renderer = new THREE.WebGLRenderer({
		'canvas': document.getElementById('canvas')
	});
	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.setSize(window.innerWidth, window.innerHeight);
	//jQuery('#canvas').append(renderer.domElement);

	controls = new OrbitControls(camera, renderer.domElement)
	controls.enableDamping = true

	window.addEventListener('resize', onWindowResize, false)

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
		renderer.render(scene, camera);
	}

	material = new THREE.MeshPhysicalMaterial({
		color: 0xffffff,
		metalness: 1,
		roughness: 0.2,
		opacity: 2.0,
		transparent: false,
		transmission: 1,
		clearcoat: 0.3,
		thickness: 1,
		clearcoatRoughness: 0.25,
		ior: 1.2
	})

	light = new THREE.PointLight(0xffffff, 1, 100)
	light.position.set(0, 0, 0)
	camera.add(light);

	const loader = new STLLoader()
	loader.load(
		'data/shai-hulud.stl',
		function(geometry) {
			geometry.computeVertexNormals(true);
			material.shading = THREE.SmoothShading;
			const mesh = new THREE.Mesh(geometry, material)
			scene.add(mesh)
		},
		(xhr) => {
			console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
		},
		(error) => {
			console.log(error)
		}
	)


	/*const geometry = new THREE.BoxGeometry();
	const material2 = new THREE.MeshBasicMaterial({
		color: 0x00ff00
	});
	const cube = new THREE.Mesh(geometry, material2);
	scene.add(cube);*/


	camera.position.z = 5;
	scene.add(camera);
	animate();

})