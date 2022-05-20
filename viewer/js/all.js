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
    var validPoints = points.map(function (x) {
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

// Noise generation with Fractional Brownian Motion
function fbm(octaves) {

    var noise = Noise.perlin2D;

    return function (x, y, t) {

        var frequency = 1;
        var amplitude = 1;
        const persistence = 0.7;
        const lacunarity = 2;

        var total = 0;

        for (var i = 0; i < octaves; i++) {

            total += noise(x * frequency, y * frequency, t * frequency) * amplitude;

            amplitude *= persistence;
            frequency *= lacunarity;
        }

        return total;
    }
};


function computeUVs(geometry) {

    geometry.computeBoundingBox();

    var max = geometry.boundingBox.max,
        min = geometry.boundingBox.min;
    var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
    var range = new THREE.Vector2(max.x - min.x, max.y - min.y);
    var faces = geometry.faces;
    var vertices = geometry.vertices;

    geometry.faceVertexUvs = [];
    geometry.faceVertexUvs[0] = [];

    for (var i = 0, il = faces.length; i < il; i++) {

        var v1 = vertices[faces[i].a],
            v2 = vertices[faces[i].b],
            v3 = vertices[faces[i].c];

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
            new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
            new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
        ]);
    }
    geometry.uvsNeedUpdate = true;
}


function createTextures() {
    // some random textures
    var data = new Uint8Array(512 * 256 * 4);
    var bump = new Uint8Array(512 * 256 * 4);
    var noise = fbm(8);
    var time = 0;

    //var scale = d3.interpolateRgb("#381b0a", '#c9ba8a');

    // generate texture and bump map
    for (var y = 0; y < 256; y++) {
        for (var x = 0; x < 512; x++) {

            var index = (x + y * 512) * 4;
            var xy = [x / 10, y / 10];
            var n = noise(xy[0], xy[1], time);
            //n = Math.abs(Math.cos(1 + noise(xy[0], xy[1], time)));
            // 0xff4444
            var col = {
                r: Math.max(0, Math.min(255, 255 + (100 * n))),
                g: Math.max(0, Math.min(255, 68 + (100 * n))),
                b: Math.max(0, Math.min(255, 68 + (100 * n))),
                alpha: 255
            };

            n = Math.abs(n);
            data[index] = col.r; // n * 220;
            data[index + 1] = col.g; // n * 180;
            data[index + 2] = col.b; // * 160;
            data[index + 3] = 255;

            // this is ignored if we have a normal map ... and we do
            bump[index] = n * 255; // n * 220;
            bump[index + 1] = n * 255; // n * 180;
            bump[index + 2] = n * 255; // * 160;
            bump[index + 3] = 255;
        }
    }

    // set texture and bump map
    var texture = new THREE.DataTexture(data, 512, 256, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.CubeUVReflectionMapping);
    texture.unpackAlignment = 1;
    texture.repeat.set(100, 100);
    texture.needsUpdate = true;

    var bumpMap = new THREE.DataTexture(bump, 512, 256, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.EquirectangularReflectionMapping);
    bumpMap.unpackAlignment = 1;
    bumpMap.repeat.set(10, 10);
    bumpMap.needsUpdate = true;

    return [texture, bumpMap];
}

function animate() {
    requestAnimationFrame(animate);
    if (centerline != null && centerline.length > 0) {
        camera.position.set(centerline[pos + 1][0], centerline[pos + 1][1], centerline[pos + 1][2]);
        camera.lookAt(centerline[pos][0], centerline[pos][1], centerline[pos][2]);
    }
    renderer.render(scene, camera);
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

jQuery(document).ready(function () {
    // read in the line
    jQuery.getJSON('data/centerline.json', function (data) {
        centerline = data;
        centerlineLR = data;
        const loader2 = new STLLoader()
        loader2.load(
            'data/stone.stl',
            function (geometry) {
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
                (function (mesh) {
                    jQuery.getJSON('data/stonePositions.json', function (data) {
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
    jQuery.getJSON('data/centerlineHR.json', function (data) {
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

    var erg = createTextures();
    material = new THREE.MeshPhongMaterial({
        color: 0xff4444,
        emissive: new THREE.Color("rgb(26,7,7)"),
        specular: new THREE.Color("rgb(14,14,14)"),
        map: erg[0],
        //bumpMap: erg[1],
        //bumpScale: 0.6,
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
    if (!depthMap) {
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
    }
    //scene.add(spotLight);
    camera.add(spotLight);
    camera.add(spotLight.target);

    jQuery.getJSON('data/uv.json', function (uv) {
        (function (material, uv) {

            // convert uv to typed array
            var uv_buffer = new ArrayBuffer(uv.length * 2 * 4);
            var float32View = new Float32Array(uv_buffer);
            for (let i = 0; i < uv.length; i++) {
                float32View[i * 2 + 0] = uv[i][0];
                float32View[i * 2 + 1] = uv[i][1];
            }

            const loader = new STLLoader()
            loader.load(
                'data/shai-hulud.stl',
                function (geometry) {
                    // we need normals that make sense not just for triangles but for vertices
                    geometry.deleteAttribute('normal');
                    geometry = mergeVertices(geometry, 0.01);
                    geometry.computeVertexNormals();
                    var poss = geometry.getAttribute('position');
                    geometry.addAttribute('uv', new THREE.BufferAttribute(float32View, 2));
                    geometry.uvsNeedUpdate = true;
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
            );
        })(material, uv);
    });
    animate();
})