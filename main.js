import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Global variables
let scene, camera, renderer, particles, mainMesh, skillObjects = [], floatingObjects = [], orbitingRings = [];
let mouse = { x: 0, y: 0 };
let isLightTheme = false;
let clock = new THREE.Clock();
let raycaster = new THREE.Raycaster();
let mouseVector = new THREE.Vector2();

// --- Scene Setup ---
document.addEventListener('DOMContentLoaded', () => {
    init();
    createParticles();
    create3DSkills();
    createFloatingObjects();
    createOrbitingRings();
    setupAnimations();
    setupEventListeners();
    setupTheme();
    animate();
});

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0a, 15, 100);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 15);

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Add raycaster for mouse interactions
    raycaster = new THREE.Raycaster();

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x667eea, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Point light that follows mouse
    const pointLight = new THREE.PointLight(0x764ba2, 0.8, 50);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    // --- Main 3D Object ---
    const geometry = new THREE.IcosahedronGeometry(3, 2);
    const material = new THREE.MeshStandardMaterial({
        color: 0x667eea,
        metalness: 0.8,
        roughness: 0.2,
        wireframe: false,
        envMapIntensity: 1,
    });
    mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.position.set(0, 0, 0);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    mainMesh.userData = { originalScale: 1, hovered: false };
    scene.add(mainMesh);

    // Add wireframe overlay
    const wireframeGeometry = new THREE.IcosahedronGeometry(3.05, 2);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x764ba2,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    mainMesh.add(wireframeMesh);
    
    // Add inner glow effect
    const glowGeometry = new THREE.IcosahedronGeometry(2.8, 1);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x667eea,
        transparent: true,
        opacity: 0.1,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    mainMesh.add(glowMesh);
}

function createParticles() {
    const particleCount = 1500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 300;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

        const color = new THREE.Color();
        color.setHSL(Math.random() * 0.2 + 0.6, 0.9, 0.7);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        sizes[i] = Math.random() * 2 + 0.5;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
}

function create3DSkills() {
    const skillsData = [
        { name: 'JavaScript', position: [-8, 4, -5], color: 0xf7df1e },
        { name: 'Python', position: [8, 3, -3], color: 0x306998 },
        { name: 'Java', position: [-6, -4, -4], color: 0xed8b00 },
        { name: 'C++', position: [7, -3, -6], color: 0x00599c },
        { name: 'Three.js', position: [0, 6, -8], color: 0x049ef4 },
        { name: 'MongoDB', position: [-4, 2, 8], color: 0x47a248 },
    ];

    skillsData.forEach((skill, index) => {
        const geometry = new THREE.OctahedronGeometry(0.8);
        const material = new THREE.MeshStandardMaterial({
            color: skill.color,
            metalness: 0.5,
            roughness: 0.5,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...skill.position);
        mesh.userData = { name: skill.name, originalPosition: [...skill.position] };
        
        skillObjects.push(mesh);
        scene.add(mesh);

        // Add floating animation
        gsap.to(mesh.position, {
            y: mesh.position.y + Math.sin(index) * 0.5,
            duration: 2 + Math.random() * 2,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut',
        });

        gsap.to(mesh.rotation, {
            y: Math.PI * 2,
            duration: 5 + Math.random() * 5,
            repeat: -1,
            ease: 'none',
        });
    });
}

function setupAnimations() {
    // Hero section animations
    gsap.from('.hero-title', { duration: 1.5, y: 100, opacity: 0, ease: 'power3.out' });
    gsap.from('.hero-subtitle', { duration: 1.5, y: 50, opacity: 0, delay: 0.3, ease: 'power3.out' });
    gsap.from('.hero-description', { duration: 1.5, y: 30, opacity: 0, delay: 0.6, ease: 'power3.out' });
    gsap.from('.hero-buttons a', { duration: 1, y: 30, opacity: 0, delay: 0.9, stagger: 0.2, ease: 'power3.out' });

    // Skills section animations
    gsap.from('.skill-item', {
        scrollTrigger: {
            trigger: '.skills',
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 1,
        },
        y: 100,
        opacity: 0,
        stagger: 0.1,
        duration: 1,
    });

    // About section animations
    gsap.from('.about-text', {
        scrollTrigger: {
            trigger: '.about',
            start: 'top 80%',
        },
        x: -100,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
    });

    gsap.from('.stat-item', {
        scrollTrigger: {
            trigger: '.about',
            start: 'top 80%',
        },
        x: 100,
        opacity: 0,
        stagger: 0.2,
        duration: 1.5,
        ease: 'power3.out',
    });

    // Contact section animations
    gsap.from('.contact-info', {
        scrollTrigger: {
            trigger: '.contact',
            start: 'top 80%',
        },
        x: -50,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
    });

    gsap.from('.contact-form', {
        scrollTrigger: {
            trigger: '.contact',
            start: 'top 80%',
        },
        x: 50,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
    });
}

function setupEventListeners() {
    // Mouse movement for 3D interaction
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Create mailto link
            const mailtoLink = `mailto:anshitajain.2603@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
                `Hello Anshita,\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
            )}`;
            
            // Open mail client
            window.location.href = mailtoLink;
            
            // Show success message
            alert('Thank you for your message! Your mail client should open now.');
            
            // Reset form
            contactForm.reset();
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Resize handler
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Create floating geometric objects
function createFloatingObjects() {
    const geometries = [
        new THREE.TetrahedronGeometry(0.5),
        new THREE.ConeGeometry(0.4, 0.8, 6),
        new THREE.DodecahedronGeometry(0.3),
        new THREE.TorusGeometry(0.4, 0.2, 8, 16)
    ];
    
    for (let i = 0; i < 12; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
            metalness: 0.6,
            roughness: 0.4,
            transparent: true,
            opacity: 0.7
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40
        );
        
        mesh.userData = {
            originalPosition: mesh.position.clone(),
            speed: Math.random() * 0.02 + 0.01,
            rotationSpeed: Math.random() * 0.02 + 0.01
        };
        
        floatingObjects.push(mesh);
        scene.add(mesh);
    }
}

// Create orbiting rings around main object
function createOrbitingRings() {
    for (let i = 0; i < 3; i++) {
        const ringGeometry = new THREE.TorusGeometry(5 + i * 2, 0.1, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.6 + i * 0.1, 0.8, 0.5),
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.random() * Math.PI;
        ring.rotation.y = Math.random() * Math.PI;
        ring.userData = { 
            speed: 0.001 + i * 0.0005,
            axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize()
        };
        
        orbitingRings.push(ring);
        scene.add(ring);
    }
}

// Setup theme toggle functionality
function setupTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        isLightTheme = true;
        updateThemeColors();
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            isLightTheme = !isLightTheme;
            localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
            updateThemeColors();
        });
    }
    
    // Initialize skill progress bars
    initializeProgressBars();
}

// Update Three.js scene colors based on theme
function updateThemeColors() {
    if (scene && scene.fog) {
        scene.fog.color.setHex(isLightTheme ? 0xf8f9fa : 0x0a0a0a);
    }
    
    // Update particle colors
    if (particles) {
        const colors = particles.geometry.attributes.color.array;
        for (let i = 0; i < colors.length; i += 3) {
            const hue = isLightTheme ? Math.random() * 0.3 + 0.5 : Math.random() * 0.2 + 0.6;
            const color = new THREE.Color().setHSL(hue, 0.8, isLightTheme ? 0.4 : 0.7);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        particles.geometry.attributes.color.needsUpdate = true;
    }
}

// Initialize and animate skill progress bars
function initializeProgressBars() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target.querySelector('.progress-bar');
                if (progressBar) {
                    const progress = progressBar.getAttribute('data-progress');
                    setTimeout(() => {
                        progressBar.style.width = `${progress}%`;
                    }, Math.random() * 500);
                }
            }
        });
    }, { threshold: 0.5 });
    
    skillItems.forEach(item => {
        observer.observe(item);
    });
}

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Update main mesh rotation
    if (mainMesh) {
        mainMesh.rotation.x += 0.003;
        mainMesh.rotation.y += 0.005;
        
        // Mouse interaction
        mainMesh.rotation.x += mouse.y * 0.001;
        mainMesh.rotation.y += mouse.x * 0.001;
        
        // Subtle pulsing effect
        const scale = 1 + Math.sin(elapsedTime * 2) * 0.05;
        mainMesh.scale.setScalar(scale);
    }

    // Update particles
    if (particles) {
        particles.rotation.y += 0.0005;
        const positions = particles.geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += Math.sin(elapsedTime * 0.5 + i * 0.1) * 0.02;
            positions[i] += Math.cos(elapsedTime * 0.3 + i * 0.1) * 0.01;
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
    }

    // Update floating objects
    floatingObjects.forEach((obj, index) => {
        obj.rotation.x += obj.userData.rotationSpeed;
        obj.rotation.y += obj.userData.rotationSpeed * 0.7;
        obj.rotation.z += obj.userData.rotationSpeed * 0.5;
        
        // Gentle floating motion
        obj.position.y += Math.sin(elapsedTime * obj.userData.speed + index) * 0.02;
        obj.position.x += Math.cos(elapsedTime * obj.userData.speed * 0.7 + index) * 0.01;
    });
    
    // Update orbiting rings
    orbitingRings.forEach((ring, index) => {
        ring.rotateOnAxis(ring.userData.axis, ring.userData.speed);
    });

    // Update skill objects
    skillObjects.forEach((obj, index) => {
        obj.rotation.x += 0.01;
        obj.rotation.z += 0.005;
        
        // Add some hover effect based on mouse position
        const distance = obj.position.distanceTo(camera.position);
        const hoverScale = 1 + (1 / distance) * Math.abs(mouse.x + mouse.y) * 0.1;
        obj.scale.setScalar(Math.min(hoverScale, 1.2));
    });

    // Update camera position based on scroll with smooth easing
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const targetZ = 15 - scrollPercent * 8;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    
    // Add subtle camera shake based on mouse movement
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.02;

    renderer.render(scene, camera);
}

