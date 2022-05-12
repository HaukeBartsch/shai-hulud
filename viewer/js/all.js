import * as THREE from 'three'

import {
	STLLoader
} from './STLLoader.js'

//import {
//	OrbitControls
//} from './OrbitControls.js'
import {
	mergeVertices
} from 'BufferGeometryUtils';


let tick = 0;
let depthMap = false;
let showWireframe = true;

// check if the points in array points are inside the mesh
function validCenterLinePoints(scene, points, mesh) {
	// return a boolean array of centerline points that are 'valid', e.g. not inside a stone
	var validPoints = points.map(function(x) {
		return true;
	});
	// find the right geometry in the scene
	var geomID = -1;
	for (var i = 0; i < scene.children.length; i++) {
		if (scene.children[i] == mesh) {
			geomID = i;
			break;
		}
	}
	if (geomID == -1) {
		console.log("Error: Could not find that mesh in the scene.");
		return;
	}

	// algorithm is to shoot a ray and count the number of times it intersects with the object
	// if the number of intersections is odd the point is inside the surface
	var raycaster = new THREE.Raycaster();
	for (var j = 0; j < points.length; j++) {
		raycaster.ray.origin.set(points[j][0], points[j][1], points[j][2]);
		raycaster.ray.lookAt(new THREE.Vector3(0, 0, 1));
		const intersects = raycaster.intersectObjects([scene.children[geomID]], false);
		var counter = 0;
		for (var i = 0; i < intersects.length; i++) {
			//if (intersects[i].object == mesh) {
			counter++;
			//}
		}
		if (counter % 2 != 0) {
			validPoints[j] = false;
		}
	}
	return validPoints;
}

function animate() {
    requestAnimationFrame(animate);
    if (centerline != null && centerline.length > 0) {
    	camera.position.set(centerline[pos + 1][0], centerline[pos + 1][1], centerline[pos + 1][2]);
    	//spotLight.position.copy(camera.position);
    	//hemiLight.position.set(centerline[pos + 1][0],
    	//	centerline[pos + 1][1], centerline[pos + 1][2])
    	//spotLight.position.set(centerline[pos + 1][0] + 0.01,
    	//	centerline[pos + 1][1] + 0.01, centerline[pos + 1][2] + 0.01);
    	camera.lookAt(centerline[pos][0], centerline[pos][1], centerline[pos][2]);
    	//controls.target = new THREE.Vector3(centerline[pos + 1][0], centerline[pos + 1][1], centerline[pos + 1])
    	//spotLight.position.set(centerline[pos + 1][0], centerline[pos + 1][1], centerline[pos + 1][2]);
    	//spotLight.lookAt(centerline[pos][0], centerline[pos][1], centerline[pos][2]);
    	//spotLight.position.copy(camera.position);

    	//spotLight.target.position.set(centerline[pos][0], centerline[pos][1], centerline[pos][2]);
    	//spotLight.lookAt(centerline[pos][0], centerline[pos][1], centerline[pos][2])
    }

    //spotLightHelper.update();
    //controls.update()
	renderer.render(scene, camera);
	//console.log(light.position);
	//console.log(camera.position);
    if ((tick % 5) == 0) {
        //if (pos < 32)
		pos = (pos + 1) % (centerline.length - 1);
		if (validPoints.length == centerline.length) {
			// next valid point
			var tests = 0;
			while (!validPoints[pos] && tests < centerline.length) {
				pos = (pos + 1) % (centerline.length - 1);
				tests++;
			}
		}
        //console.log(spotLight.position);
        //console.log(camera.position);
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
let centerlineLR = []; // stone positions are relative to this array
let centerlineHR = [];
let validPoints = [];
let pos = 0;
let spotLight;
let stoneMeshes = [];
//let spotLightHelper;
let hemiLight;

jQuery(document).ready(function() {
    // read in the line
    jQuery.getJSON('data/centerline.json', function(data) {
		centerline = data;
		centerlineLR = data;
        const loader2 = new STLLoader()
        loader2.load(
        		'data/stone.stl',
        		function(geometry) {
        			geometry.center();
        			// we need normals that make sense not just for triangles but for vertices
        			geometry.deleteAttribute('normal');
        			geometry = mergeVertices(geometry, 0.01);
        			geometry.computeVertexNormals();
        			//geometry.computeVertexNormals(true);
        			//geometry.computeFlatVertexNormals();

        			let stoneMat = new THREE.MeshPhysicalMaterial({
        				color: 0x444444, // 0xffffff
        				metalness: 0.01,
        				roughness: 0.5,
        				opacity: 1.0,
        				emissive: 0x444444,
        				emissiveIntensity: 0.02,
        				transparent: false,
        				transmission: 0.01,
        				clearcoat: 0.2,
        				thickness: 1,
        				clearcoatRoughness: 0.25,
        				ior: 1.0,
        				flatShading: false,
        				transparent: false,
        				side: THREE.DoubleSide
        			})
        			//stoneMat.needsUpdate = true;
                    stoneMat = new THREE.MeshPhongMaterial({
                    	color: 0x444444,
                    	side: THREE.DoubleSide,
                    });
                    if (depthMap) {
                    	stoneMat = new THREE.MeshDepthMaterial({
                    		side: THREE.DoubleSide
                    	});
                    }
        			const mesh = new THREE.Mesh(geometry, stoneMat)
        			mesh.scale.set(0.01, 0.01, 0.01);
        			mesh.castShadow = true; //default is false
        			mesh.receiveShadow = true; //default
        			// move the mesh to a random position inside the tube
					(function(mesh) {
						jQuery.getJSON('data/stonePositions.json', function(data) {
									// move the stone to one of these positions, or to a position between the 
									// centerline and the stone position
									let pick = 30; // where to place the stone along the centerline
									mesh.position.set(centerlineLR[pick][0] - 0.2 * (data[pick][0] - centerlineLR[pick][0]), centerlineLR[pick][1] - 0.2 * (data[pick][1] - centerlineLR[pick][1]), centerlineLR[pick][2] - 0.2 * (data[pick][2] - centerlineLR[pick][2]));
									mesh.updateMatrixWorld();
									scene.add(mesh);
									stoneMeshes.push(mesh);
									validPoints = validCenterLinePoints(scene, centerline, stoneMeshes[0]);
									});
					})(mesh);
        		},
        		(xhr) => {
        			console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        		},
        		(error) => {
        			console.log(error)
        		}
        )
	});
	jQuery.getJSON('data/centerlineHR.json', function(data) {
		centerline = data; // higher resolution centerline
	});

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 100);
	//camera.position.z = 5;
	scene.add(camera);

	//scene.add(new THREE.AxesHelper(5))

	renderer = new THREE.WebGLRenderer({
        'canvas': document.getElementById('canvas'),
        	'alpha': true
	});
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	//jQuery('#canvas').append(renderer.domElement);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    renderer.autoClear = false;

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
        	emissiveIntensity: 0.05,
        	transparent: false,
        transmission: 0.01,
        	clearcoat: 0.4,
        	thickness: 1,
        	clearcoatRoughness: 0.25,
        ior: 1.5,
        	sheen: 1.0,
        	specularIntensity: 0.5,
        	flatShading: false,
        	transparent: false,
        	side: THREE.DoubleSide
        })
    //material.needsUpdate = true;

    material = new THREE.MeshPhongMaterial({
    	color: 0xff4444,
    	side: THREE.DoubleSide,
    });
    if (depthMap) {
    	material = new THREE.MeshDepthMaterial({
    		side: THREE.DoubleSide
    	});
    }

    //let material3 = new THREE.MeshLambertMaterial({
    // 	color: 0xff4444,
    // 	emissive: 0x000000,
    // 	side: THREE.DoubleSide
    //});
    //hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.2);
    //hemiLight.castShadow = true;
    //scene.add(hemiLight);

	//light = new THREE.PointLight(0xffffff, 0.5, 100)
	//light.position.set(0, 0, 0)
    //camera.add(light);
    spotLight = new THREE.SpotLight(0xffffff, 1.6, 10.5, Math.PI / 3, 0.5, 0.1);
    spotLight.target.position.set(0, 0, -1);
    spotLight.position.copy(camera.position);
    const shadowCameraSize = 75;
    //spotLight.castShadow = true;
    //spotLight.shadow.bias = -0.0001;
    spotLight.shadow.mapSize.width = 1024 * 4;
    spotLight.shadow.mapSize.height = 1024 * 4;
    spotLight.shadow.camera.left = -shadowCameraSize;
    spotLight.shadow.camera.right = shadowCameraSize;
    spotLight.shadow.camera.top = shadowCameraSize;
    spotLight.shadow.camera.bottom = -shadowCameraSize;
    spotLight.shadow.camera.near = 0.01;
    spotLight.shadow.camera.far = 50;
    //spotLight.shadow.camera.fov = 30;

    //scene.add(spotLight);
    camera.add(spotLight);
    camera.add(spotLight.target);

	const loader = new STLLoader()
	loader.load(
		'data/shai-hulud.stl',
        function(geometry) {
        	// we need normals that make sense not just for triangles but for vertices
        	geometry.deleteAttribute('normal');
        	geometry = mergeVertices(geometry, 0.01);
        	geometry.computeVertexNormals();
        	//geometry.computeVertexNormals(true);
        	//geometry.computeFlatVertexNormals();
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true; //default is false
            mesh.receiveShadow = true; //default
            if (showWireframe) {
                const wireframe = new THREE.WireframeGeometry(geometry);

                const line = new THREE.LineSegments(wireframe);
                line.material.depthTest = false;
                line.material.opacity = 0.25;
                line.material.transparent = true;
                scene.add(line);
            }
			scene.add(mesh)
		},
		(xhr) => {
			console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
		},
		(error) => {
			console.log(error)
		}
	)
	animate();

})