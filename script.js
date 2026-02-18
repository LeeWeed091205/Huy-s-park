import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';



//Scene
const scene = new THREE.Scene();

//Camera
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
    -30 * aspect,
    30 * aspect,
    30,
    -30,
    0.1,
    1000
)
camera.position.set(-100,41,-35);

scene.add(camera)

//Light
const light = new THREE.AmbientLight(0x404040,3);
scene.add(light);

const sun = new THREE.DirectionalLight(0xffffff);
sun.position.set(75,80,0);
sun.target.position.set(30,0,0);
sun.castShadow = true;
sun.shadow.camera.left =  -100; 
sun.shadow.camera.right =  100; 
sun.shadow.camera.top =  100; 
sun.shadow.camera.bottom =  -100; 
sun.shadow.mapSize.width = 2048; // Tăng độ phân giải của shadow map
sun.shadow.mapSize.height = 2048; // Tăng độ phân giải của shadow map
sun.shadow.bias = -0.001; // Thử các số: -0.0001, -0.001, -0.005
sun.shadow.normalBias = 0.05; // Giữ lại một chút normalBias nếu cần

scene.add(sun);





//Renderer
const Canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({canvas: Canvas, antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.75;
document.body.appendChild(renderer.domElement);

let character = {
    instance : null,
    distance : 5,
    jumpHeight : 4,
    moveDuration : 0.3,
    isMoving : false,
}







//Resize
window.addEventListener('resize',()=>{
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -30 * aspect;
    camera.right = 30 * aspect;
    camera.top = 30;
    camera.bottom = -30;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

})

//Loop
const Loop = ()=>{
    renderer.render(scene,camera);
    requestAnimationFrame(Loop);
}

Loop();


const intersectObjectNames = ['Character','Project1','Project2','Project3'];
const intersectObjects = [];
const collidableObjects = [];
let intersectObject = '';


//Load model
const loader = new GLTFLoader();
loader.load('./prj2_final_model.glb',(glb)=>{
    glb.scene.traverse((node)=>{
        if (intersectObjectNames.includes(node.name)){
            intersectObjects.push(node);
        }

        
        if(node.isMesh){
            node.castShadow = true;
            node.receiveShadow = true;
            if (node.name !== "Character" && (!node.parent || node.parent.name !== "Character")){
                collidableObjects.push(node);
            }
        }

        if (node.name == 'Collider'){
            node.visible = false;
        }

        if (node.name === "Character"){
            character.instance = node;
            camera.lookAt(character.instance.position);

        }
    });

   

    scene.add(glb.scene);
},undefined,(error)=>{
    console.error(error);
});

// RayCaster
const rayCaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onPointermove(event){
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function render(){
    rayCaster.setFromCamera(mouse,camera);
    const intersects = rayCaster.intersectObjects(intersectObjects);
    if (intersects.length > 0){
        document.body.style.cursor = 'pointer';
    }else{
        document.body.style.cursor = 'default';
        intersectObject = '';
    }

    for (let i = 0; i < intersects.length; i++){
        intersectObject = intersects[0].object.parent.name;
    }

    

    renderer.render(scene,camera);
    requestAnimationFrame(render);

}
render();

window.addEventListener('pointermove',onPointermove);
window.addEventListener('click',()=>{
    console.log(intersectObject);
})
window.addEventListener('click',()=>{
    if (intersectObject != '' && projects.some(project => project.name === intersectObject)){
        const project = projects.find((project) => project.name === intersectObject);
        modalTitle.textContent = project.title;
        modalContent.textContent = project.content;
        modalLink.href = project.link;
        modal.classList.remove('hidden');
        console.log(intersectObject);
    }
})

function movingCharacter(targetPosition, targetRotation){
    character.isMoving = true;
    
    // TÍNH TOÁN QUÃNG ĐƯỜNG DI CHUYỂN
    // Lấy đích đến trừ đi vị trí hiện tại để biết nhân vật vừa bước đi bao xa
    const deltaX = targetPosition.x - character.instance.position.x;
    const deltaZ = targetPosition.z - character.instance.position.z;

    const t1 = gsap.timeline({
        onComplete : ()=>{
            character.isMoving = false;
        }
    });

    // --- 1. ANIMATION CỦA NHÂN VẬT (Code cũ của bạn) ---
    t1.to(character.instance.position,{
        x : targetPosition.x,
        z : targetPosition.z,
        duration : character.moveDuration,
    }, 0) // Số 0 ở cuối nghĩa là: Bắt đầu ngay lập tức ở giây thứ 0

    t1.to(character.instance.rotation,{
        y : targetRotation,
        duration : character.moveDuration,
    }, 0)

    t1.to(character.instance.position,{
        y : targetPosition.y + character.jumpHeight,
        duration : character.moveDuration / 2,
    }, 0)

    t1.to(character.instance.position,{
        y : targetPosition.y,
        duration : character.moveDuration / 2,
    }, character.moveDuration / 2)


    // --- 2. ANIMATION CỦA CAMERA (Thêm mới) ---
    // Cộng thêm quãng đường nhân vật vừa đi vào vị trí Camera hiện tại
    t1.to(camera.position, {
        x: camera.position.x + deltaX,
        z: camera.position.z + deltaZ,
        duration: character.moveDuration,
        ease: "power1.inOut" // Thêm chút ease cho camera trượt êm hơn
    }, 0); 


}

window.addEventListener('keydown',(event)=>{
    if (character.isMoving) return;
    console.log(event.key);
    let targetPosition = new THREE.Vector3().copy(character.instance.position);
    let targetRotation = 0;
    const offSet = Math.PI / 2;
 
    switch(event.key.toLowerCase()){
        case 'w':
        case 'arrowup':
            targetPosition.x += character.distance;
            targetRotation = offSet + 0; 

            break;
        case 's':
        case 'arrowdown':
            targetPosition.x -= character.distance;
            targetRotation = offSet + Math.PI;
            break;
        case 'a':
        case 'arrowleft':
            targetPosition.z -= character.distance;
            targetRotation = offSet - Math.PI / 2;
            break;
        case 'd':
        case 'arrowright':
            targetPosition.z += character.distance;
            targetRotation = offSet + Math.PI / 2;
            break;
            default:
    }
    const direction = new THREE.Vector3().subVectors(targetPosition,character.instance.position).normalize();
    const origin = new THREE.Vector3().copy(character.instance.position);
    origin.y -= 1; 
    const moveCaster = new THREE.Raycaster(origin,direction);

    const intersects = moveCaster.intersectObjects(collidableObjects,false);
    let canMove = true;
    if (intersects.length > 0){
        if (intersects[0].distance <= character.distance + 0.3)
            canMove = false;
    }

    if (canMove){
        movingCharacter(targetPosition,targetRotation);
    }
})


//Content of project 1,2,3
const projects =[
    {
        name:'Project1',
        title:'ProJect One',
        link:'https://example.com/',
        content:' Project 1 de Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro ipsum quod suscipit aliquam doloribus odio maxime, fuga adipisci eos ab inventore, necessitatibus eum ipsa recusandae temporibus deserunt? Doloremque, quas sunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. Veritatis, blanditiis, itaque molestiae, neque accusamus facilis consectetur commodi dolores vitae officia totam mollitia assumenda consequuntur dolore culpa odit atque vero recusandae.'
    },
    {
        name:'Project2',
        title:'ProJect Two',
        link:'https://example.com/',
        content:'Project 2 de Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro ipsum quod suscipit aliquam doloribus odio maxime, fuga adipisci eos ab inventore, necessitatibus eum ipsa recusandae temporibus deserunt? Doloremque, quas sunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. Veritatis, blanditiis, itaque molestiae, neque accusamus facilis consectetur commodi dolores vitae officia totam mollitia assumenda consequuntur dolore culpa odit atque vero recusandae.'
    },
    {
        name:'Project3',
        title:'ProJect Three',
        link:'https://example.com/',
        content:'Project 3 de Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro ipsum quod suscipit aliquam doloribus odio maxime, fuga adipisci eos ab inventore, necessitatibus eum ipsa recusandae temporibus deserunt? Doloremque, quas sunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. Veritatis, blanditiis, itaque molestiae, neque accusamus facilis consectetur commodi dolores vitae officia totam mollitia assumenda consequuntur dolore culpa odit atque vero recusandae.'
    }
];

const modal = document.querySelector('.modal');
const modalTitle = document.querySelector('.modal .header h2');
const modalContent = document.querySelector('.modal .body .content');
const modalLink = document.querySelector('.modal .link');
const exitBtn = document.querySelector('.modal .header .exit-btn');

exitBtn.addEventListener('click',()=>{
    modal.classList.add('hidden');
})


//Dark mode
const darkmodeBtn = document.querySelector('.dark-mode');
let iconMode = document.querySelector('#iconMode');

let isDarkMode = false;
darkmodeBtn.addEventListener('click',()=>{
    console.log('Clicked');
    isDarkMode = !isDarkMode;
    const t2 = gsap.timeline();

    if(isDarkMode){
        t2.to(sun,{
            intensity: 0.5,
            duration : 1
        })

        t2.to(sun.solor,{
            r: 0.1, g: 0.1, b: 0.2, duration: 1
        },0)

        t2.to(light,{
            intensity:0.3,
            duration:1,
        },0)

        t2.to(sun.color, { r: 0.5, g: 0.6, b: 0.9, duration: 1 },0);

        iconMode.classList.replace("fa-moon","fa-sun");
        darkmodeBtn.style.backgroundColor = "yellow";
        darkmodeBtn.style.border = "1px solid gold"
        iconMode.style.color = "orange";
        
    }else{
        t2.to(sun,{
            intensity:1,
            duration:1
        })

        t2.to(sun.color, { r: 1, g: 1, b: 1, duration: 1 },0);

        t2.to(light,{
            intensity:3,
            duration:1
        },0)

        t2.to(light.color, { r: 0.25, g: 0.25, b: 0.25, duration: 1},0);
        
        iconMode.classList.replace("fa-sun","fa-moon");
        darkmodeBtn.style.backgroundColor = "black";
        darkmodeBtn.style.border = "1px solid white"
        iconMode.style.color = "white";
    }

    
})


//Turn off loading screen
const loadingScreen = document.querySelector('.loading-screen');
setTimeout(()=>{
    loadingScreen.style.display = "none";
},5000);


//Movement control table
const directions = {
    up:    { dx: character.distance,  dz: 0,  rot: Math.PI / 2 },
    down:  { dx: -character.distance, dz: 0,  rot: -Math.PI / 2 },
    left:  { dx: 0,  dz: -character.distance, rot: 0 },
    right: { dx: 0,  dz: character.distance,  rot: Math.PI }
};

function moveMent(targetPosition,targetRotation){
    if(character.isMoving) return;

    const direction = new THREE.Vector3().subVectors(targetPosition,character.instance.position).normalize();
    const origin = new THREE.Vector3().copy(character.instance.position) - 1;
    const raycaster = new THREE.Raycaster(origin,direction);
    let canMove = true;
    const intersects = raycaster.intersectObjects(collidableObjects,false);
    if (intersects.length > 0){
        if (intersects[0].distance  <= character.instance.distance + 0.3){
            canMove = false;
        }
    }

    if (canMove)
        movingCharacter(targetPosition,targetRotation);

}

Object.keys(directions).forEach((dir)=>{
    

    const Btn = document.querySelector(`.movement-control #${dir}`);
    Btn.addEventListener('click',()=>{
        const {dx,dz,rot} = directions[dir];
        const chaPosition = new THREE.Vector3().copy(character.instance.position);
        chaPosition.x += dx;
        chaPosition.z += dz;

        moveMent(chaPosition,rot);
    })
})
