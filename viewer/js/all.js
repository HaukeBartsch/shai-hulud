import * as THREE from 'three'

import {
	STLLoader
} from './STLLoader.js'

import {
	OrbitControls
} from './OrbitControls.js'
import {
	mergeVertices
} from 'BufferGeometryUtils';


let tick = 0;

function animate() {
    requestAnimationFrame(animate);
    if (centerline != null && centerline.length > 0) {
    	camera.position.set(centerline[pos][0], centerline[pos][1], centerline[pos][2]);
    	camera.lookAt(-centerline[pos + 1][0], -centerline[pos + 1][1], -centerline[pos + 1][2]);
    	//spotLight.position.set(centerline[pos][0], centerline[pos][1], centerline[pos][2]);
    	//spotLight.lookAt(centerline[pos + 1][0], centerline[pos + 1][1], centerline[pos + 1][2]);
    }

    //spotLightHelper.update();
    //controls.update()
	renderer.render(scene, camera);
	//console.log(light.position);
	//console.log(camera.position);
    if ((tick % 50) == 0) {
    	pos = (pos + 1) % (centerline.length - 1);
    }
    tick++;
}

let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let light = null;
let material = null;
let centerline = [];
let pos = 0;
let spotLight;
let spotLightHelper;

jQuery(document).ready(function() {
    // read in the line
    jQuery.getJSON('data/centerline.json', function(data) {
    	centerline = data;
    	// position the camera there
    	if (camera != null) {
    		camera.position.set(centerline[pos][0], centerline[pos][1], centerline[pos][2]);
    		camera.lookAt(-centerline[pos + 1][0], -centerline[pos + 1][1], -centerline[pos + 1][2]);
    		//camera.updateProjectionMatrix();
    	}
    });

	// read in the tube
	// read in the stone

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	//camera.position.z = 5;
	scene.add(camera);

	scene.add(new THREE.AxesHelper(5))

	renderer = new THREE.WebGLRenderer({
        'canvas': document.getElementById('canvas'),
        	'alpha': true
	});
	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.setSize(window.innerWidth, window.innerHeight);
	//jQuery('#canvas').append(renderer.domElement);

	//controls = new OrbitControls(camera, renderer.domElement)
	//controls.enableDamping = true

	window.addEventListener('resize', onWindowResize, false)

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
		renderer.render(scene, camera);
	}

    material = new THREE.MeshPhysicalMaterial({
        color: 0xff4444, // 0xffffff
        	metalness: 0,
        	roughness: 0.2,
        opacity: 1.0,
        	emissive: 0xff4444,
        	emissiveIntensity: 0.02,
        	transparent: false,
        transmission: 0.01,
        	clearcoat: 0.4,
        	thickness: 1,
        	clearcoatRoughness: 0.25,
        ior: 1.0,
        	flatShading: false,
        	transparent: false,
        	side: THREE.DoubleSide
        })
    material.needsUpdate = true;

    let material3 = new THREE.MeshLambertMaterial({
    	color: 0xff4444,
    	emissive: 0x000000,
    	side: THREE.DoubleSide
    });

	light = new THREE.PointLight(0xffffff, 0.5, 100)
	light.position.set(0, 0, 0)
    //camera.add(light);
    spotLight = new THREE.SpotLight();
    //	spotLightHelper = new THREE.SpotLightHelper(spotLight);
    //spotLight.add(spotLightHelper);
    camera.add(spotLight);
    spotLight.target.position.set(0, 0, -1);
    spotLight.position.copy(camera.position);

	const loader = new STLLoader()
	loader.load(
		'data/shai-hulud.stl',
        function(geometry) {
        	// we need normals that make sense not just for triangles but for vertices
        	geometry.removeAttribute('normal');
        	geometry = mergeVertices(geometry, 0.01);
        	geometry.computeVertexNormals();
        	//geometry.computeVertexNormals(true);
        	//geometry.computeFlatVertexNormals();
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
	animate();

})