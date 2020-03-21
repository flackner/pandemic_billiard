/* 
Declare global variables. 
*/

// HTML elements
let canvas;           // the HTML element containing the billiard canvas
let canvasGraph;      // the HTML element containing the graph canvas
let panel;            // the HTML element containing full top-left panel
let uninfectedOutput;    // output HTML element
let infectedOutput;   // output HTML element 
let recoveredOutput;  // output HTML element 
let deathsOutput;     // output HTML element

// canvas contexts
let ctx;         // the canvas context for the billiard canvas
let ctxGraph;    // the canvas context for the graph canvas

// Input parameters
let nParticles;
let minRadius;
let maxRadius;
let speed;
let recoverTime;
let caseFatality;
let immunityDuration;
let deathRate;

// Data Arrays
let timeArray;
let uninfectedArray;
let infectedArray;
let recoveredArray;
let deathsArray;

// Particle Array containing the particles
let particleArray;

// Width and Height of the panel
let xCut;
let yCut;

// Current time
let time = 0;

// Animation ID needed to start and stop the animation
let animationID;

// Skip frames when drawing the Graph 
let counterGraph = 0;
let skipRateGraph = 2;

// determines if the canvas size is updated dynamically 
// when the window is resized
let updateCanvasSize;

// The original size of window when page was loaded.
let originalWidth;
let originalHeight;

// Definition of Particle Class
class Particle {

    // Constructor
    constructor(x, y, vx, vy, radius, id) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.id = id;
        this.state = 1;
    }

    // Draw the Particle on screen
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        if (this.state == 1) {
            ctx.fillStyle = 'purple';
        } else if (this.state == 2) {
            ctx.fillStyle = 'red';
        } else if (this.state == 3) {
            ctx.fillStyle = 'green';
        } else if (this.state == 4) {
            ctx.fillStyle = 'white';
        }
        ctx.fill();
    }

    // Update the state of the particle
    // state=1 : uninfected
    // state=2 : infected
    // state=3 : recovered
    // state=4 : dead
    updateState(deltaT) {
        let currentTime = new Date

        if (this.state == 2) {
            // let percentDone = (currentTime - this.startTime) / recoverTime
            // if (Math.random() < 2 * percentDone * deathRate * deltaT) {
            if (Math.random() < deathRate * deltaT) {
                this.state = 4
                return
            }
            if (currentTime - this.startTime > recoverTime) {
                this.state = 3
		this.startTime = currentTime
                return
            }
        }
	if (this.state == 3){
	    if (currentTime - this.startTime > immunityDuration){
		this.state = 1
		return
	    }
	}
    }

    // Move particle according to velocity and boundary conditions
    move(deltaT) {

        // Reflection at bottom boundary
        if (this.y + this.radius > canvas.height) {
            this.vy = -Math.abs(this.vy)
        }

        // Reflection at left boundary
        if (this.x - this.radius < 0) {
            this.vx = Math.abs(this.vx)
        }

        // Reflection at top-left boundary
        if (this.x + this.radius < canvas.width - xCut && this.y - this.radius < 0) {
            this.vy = Math.abs(this.vy)
        }

        // Reflection at right-bottom boundary
        if (this.y - this.radius > yCut && this.x + this.radius > canvas.width) {
            this.vx = -Math.abs(this.vx)
        }

        if (this.x + this.radius > canvas.width - xCut && this.y - this.radius < yCut) {

            // Reflection at panel boundaries
            if (this.x > canvas.width - xCut && this.y > yCut) {
                this.vy = Math.abs(this.vy)
            } else if (this.x < canvas.width - xCut && this.y < yCut) {
                this.vx = -Math.abs(this.vx)
            } else {
                this.vx = -Math.abs(this.vx)
                this.vy = Math.abs(this.vy)
            }
        }

        // Move Particle to new position
        this.x += (this.vx * deltaT);
        this.y += (this.vy * deltaT);
    }
}

// Detect collisions and update the velocities of the particles
function detectCollisions() {
    let dx;
    let dy;
    let d2;
    let r1;
    let r2;
    let dvx;
    let dvy;
    let inp;
    let pref;

    for (let i1 = 0; i1 < particleArray.length; i1++) {
        r1 = particleArray[i1].radius

        for (let i2 = i1 + 1; i2 < particleArray.length; i2++) {
            r2 = particleArray[i2].radius

            dx = (particleArray[i1].x - particleArray[i2].x)
            dy = (particleArray[i1].y - particleArray[i2].y)

            d2 = dx * dx + dy * dy

            // if distance is too large for collision cycle back
            if (Math.sqrt(d2) > r1 + r2) continue

            if (particleArray[i2].state == 2 && particleArray[i1].state == 1) {
                particleArray[i1].state = 2
                particleArray[i1].startTime = new Date
            } else if (particleArray[i2].state == 1 && particleArray[i1].state == 2) {
                particleArray[i2].state = 2
                particleArray[i2].startTime = new Date
            }

            dvx = (particleArray[i1].vx - particleArray[i2].vx)
            dvy = (particleArray[i1].vy - particleArray[i2].vy)
            inp = dvx * dx + dvy * dy

            // If inp > 0 the particles are overlaping and the distance is actually increasing!
            // In this case there is no collision taling place.

            if (inp > 0) continue

            // The radius of the particles is proportional to its mass!!
            pref = 2 * r2 / (r1 + r2) * inp / d2

            particleArray[i1].vx -= pref * dx
            particleArray[i1].vy -= pref * dy

            particleArray[i2].vx += r1 / r2 * pref * dx
            particleArray[i2].vy += r1 / r2 * pref * dy
        }
    }
}

// The window.onload fucntion is a callback function that is called as soon the 
// window is fully loaded. By assigning window.onload to a (in this case unnamed) 
// javascript function this function is called as soon as the window is fully loaded.
window.onload = function () {

    // If mobile device is used the canvas is not dynamically updated
    if (isTouchDevice()) {
        updateCanvasSize = false
        // The viewport meta-tag sets up the size of the visible area in the browser.
        // is the viewport is too small to accomodate HTML elements with fixed size (given in px)
        // a scrollbar will be present. When overflow:hidden is defined the overflowing content
        // is hidden. In this webpage the panel has fixed size as defined in the CSS file which causes
        // overflowing if the the viewport is too small as in mobile devices. To avoid this we set 
        // initial-scale=0.4 and minimum-scale=0.4 so that the page loads with everything being 60%
        // smaller. This means if the panel is defined as 620px = 6.46 inch = 16,41 cm in the CSS file. On 
        // mobile devices it will be approximately 16,4 * 0.4 = 6.5 cm in size. 
        let viewport = document.querySelector("meta[name=viewport]");
        viewport.setAttribute("content", "height=" + window.innerHeight + "px, width=" + window.innerWidth + "px, "
        + "initial-scale=0.4, minimum-scale=0.4");

    } else {
        updateCanvasSize = true
    }

    // save the original size which is needed to restart with the correct size on mobile devices
    originalHeight = window.innerHeight;
    originalWidth = window.innerWidth;

    init();
}

// The function 'init' is the entry point for setting up the javascript canvas and starting the 
// animation as well as logging data to screen
function init() {

    // Get the HTML elements
    canvas = document.getElementById('canvasBilliard');
    canvasGraph = document.getElementById('canvasGraph');
    panel = document.getElementById('panel');

    uninfectedOutput = document.getElementById('uninfected');
    infectedOutput = document.getElementById('infected');
    recoveredOutput = document.getElementById('recovered');
    deathsOutput = document.getElementById('deaths');

    // Get the input
    nParticles = parseInt(document.getElementById('nParticles').value);
    minRadius = parseInt(document.getElementById('minRadius').value);
    maxRadius = parseInt(document.getElementById('maxRadius').value);
    speed = 0.01 * parseFloat(document.getElementById('speed').value);
    recoverTime = 1000 * parseFloat(document.getElementById('recoverTime').value);
    caseFatality = parseFloat(document.getElementById('caseFatality').value);
    immunityDuration = 1000 * parseFloat(document.getElementById('immunityduration').value);
    deathRate = -Math.log(1 - caseFatality) / recoverTime

    // setup canvas
    ctx = canvas.getContext('2d');
    ctxGraph = canvasGraph.getContext('2d');

    // Set the canvas size equal to the window size. This means that the billiard canvas 
    // is the full window size! For mobile browsers selecting the text input fields will 
    // bring up the soft keyboard. This also causes the window size to change which leads to
    // an unwanted resizing of the billiard canvas. Therefore for mobile browsers the original 
    // window size is used here.
    if (!updateCanvasSize) {
        canvas.width = originalWidth
        canvas.height = originalHeight
    } else {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    }

    // Set the graph canvas size in realation to the pannel size.
    canvasGraph.width = panel.clientWidth * 0.9;
    canvasGraph.height = panel.clientHeight - 260;

    // Set the xCut and yCut values equal to the panel size. This means particles
    // bounce off the panel walls.
    xCut = panel.clientWidth;
    yCut = panel.clientHeight;

    // Position the panel in the top left corner of the screen.
    panel.style.top = 0 + "px";
    panel.style.left = (canvas.width - xCut) + "px";

    // Initialize the data arrays containing the data points.
    timeArray = [];
    uninfectedArray = [];
    infectedArray = [];
    recoveredArray = [];
    deathsArray = [];

    // Initialize the particleArray containing the particle data.
    particleArray = [];
    for (let i = 0; i < nParticles; i++) {
        let radius = minRadius + Math.random() * (maxRadius - minRadius);

        let x = canvas.width
        let y = 0

        // Retry as long as the particle is inside the panel.
        while ((x + radius > canvas.width - xCut && y - radius < yCut)) {
            x = radius + Math.random() * (canvas.width - 2 * radius);
            y = radius + Math.random() * (canvas.height - 2 * radius);
        }

        let vx = speed * 2 * (Math.random() - 0.5);
        let vy = speed * 2 * (Math.random() - 0.5);

        particleArray.push(new Particle(x, y, vx, vy, radius, i));
    }

    // Put the first particle into infected state at current time.
    particleArray[0].state = 2;
    particleArray[0].startTime = new Date;

    // This call starts the animation loop!
    startAnimation();
}

// This function implements the animation loop based on requestAnimationFrame(loop)
// which recursively calls renderFrame(deltaT) where deltaT is the time between to frames. 
function startAnimation() {
    var lastFrame = +new Date;
    function loop(now) {
        animationID = requestAnimationFrame(loop);
        var deltaT = now - lastFrame;
        // Do not render frame when deltaT is too high
        if (Math.abs(deltaT) < 160) {
            renderFrame(deltaT);
        }
        lastFrame = now;
    }
    loop(lastFrame);
}

// This function is recursively called between from frame to frame
function renderFrame(deltaT) {

    // current time
    time += deltaT

    // Update canvas size if window is resized. This leads to the nice effect
    // that the window boundary is always the billiard boundary. In case of mobile
    // browsers the window is not resized usually so this feature is disabled
    if (updateCanvasSize) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    }

    // Update panel position if window size changes
    panel.style.top = 0 + "px";
    panel.style.left = (canvas.width - xCut) + "px";

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the boundary of the panel
    ctx.beginPath();
    ctx.moveTo(canvas.width - xCut, 0)
    ctx.lineTo(canvas.width - xCut, yCut)
    ctx.lineTo(canvas.width, yCut)
    ctx.lineWidth = "4";
    ctx.strokeStyle = "black";
    ctx.stroke();

    // Update state of particles in particleArray
    for (let i = 0; i < particleArray.length; i++) {
        particleArray[i].updateState(deltaT);
    }

    // Calculate the current status and remove dead particles
    nUninfected = 0;
    nInfected = 0;
    nRecovered = 0;

    let toBeRemoved = []

    for (let i = 0; i < particleArray.length; i++) {
        if (particleArray[i].state == 1) {
            nUninfected += 1
        } else if (particleArray[i].state == 2) {
            nInfected += 1
        } else if (particleArray[i].state == 3) {
            nRecovered += 1
        } else if (particleArray[i].state == 4) {
            toBeRemoved.push(i)
        }
    }

    // Remove dead particles from the particleArray.
    for (let i = 0; i < toBeRemoved.length; i++) {
        particleArray.splice(toBeRemoved[i], 1);
    }

    nDeaths = nParticles - particleArray.length;

    // Update the velocities according to interparticle collision
    detectCollisions();

    // Move particles and draw particles in particle Array
    for (let i = 0; i < particleArray.length; i++) {
        particleArray[i].move(deltaT);
        particleArray[i].draw();
    }

    // Show current status in HTML output elements
    uninfectedOutput.value = nUninfected
    infectedOutput.value = nInfected
    recoveredOutput.value = nRecovered
    deathsOutput.value = nDeaths

    // Plot the graph in the panel
    plot();
}

// Plot the current status as a chart
function plot() {

    // Skip some frames to avoid unnecessary workload
    counterGraph++
    if (counterGraph % skipRateGraph != 0) return

    // fill data arrays
    timeArray.push(time);
    uninfectedArray.push(nUninfected);
    infectedArray.push(nInfected);
    recoveredArray.push(nRecovered);
    deathsArray.push(nDeaths);

    // Clear graph canvas
    ctxGraph.clearRect(0, 0, canvasGraph.width, canvasGraph.height);

    // draw the axes
    drawAxes()

    // draw the uninfected
    ctxGraph.beginPath();
    ctxGraph.strokeStyle = "purple";
    ctxGraph.lineWidth = 3;
    drawGraph(timeArray, uninfectedArray)
    ctxGraph.stroke();

    // draw the infected
    ctxGraph.beginPath();
    ctxGraph.strokeStyle = "red";
    ctxGraph.lineWidth = 3;
    drawGraph(timeArray, infectedArray)
    ctxGraph.stroke();

    // draw the recovered
    ctxGraph.beginPath();
    ctxGraph.strokeStyle = "green";
    ctxGraph.lineWidth = 3;
    drawGraph(timeArray, recoveredArray)
    ctxGraph.stroke();

    // draw the deaths
    ctxGraph.beginPath();
    ctxGraph.strokeStyle = "black";
    ctxGraph.lineWidth = 3;
    drawGraph(timeArray, deathsArray)
    ctxGraph.stroke();
}

// Draw the axes. The Axes lables are positioned in the CSS file
function drawAxes() {

    var h = canvasGraph.height
    var w = canvasGraph.width

    // +X axis
    ctxGraph.beginPath();
    ctxGraph.strokeStyle = "black";
    ctxGraph.lineWidth = 1;
    ctxGraph.moveTo(5, h - 5);
    ctxGraph.lineTo(w, h - 5);
    ctxGraph.stroke();

    // +Y axis
    ctxGraph.beginPath();
    ctxGraph.strokeStyle = "black";
    ctxGraph.lineWidth = 1;
    ctxGraph.moveTo(5, 0);
    ctxGraph.lineTo(5, h - 5);
    ctxGraph.stroke();

    var delta = 30;
    // Y axis tick marks
    for (var i = 1; h - i * delta > 0; i++) {
        ctxGraph.beginPath();
        ctxGraph.moveTo(1, h - (i * delta));
        ctxGraph.lineTo(9, h - (i * delta));
        ctxGraph.stroke();
    }

    var delta = 30;
    // X axis tick marks
    for (var i = 1; i * delta < w; i++) {
        ctxGraph.beginPath();
        ctxGraph.moveTo((i * delta), h - 9);
        ctxGraph.lineTo((i * delta), h + 1);
        ctxGraph.stroke();
    }

}

// Draw the graph. I got the inspiration from
// http://matt.might.net/articles/rendering-mathematical-functions-in-javascript-with-canvas-html/
function drawGraph(xArray, yArray) {
    var xMax = Math.max(...xArray);
    var xMin = Math.min(...xArray);
    //var yMax = Math.max(...yArray);
    //var yMin = Math.min(...yArray);

    var yMax = nParticles * 1.13;
    var yMin = 0;

    // Conversion between the screen coordiantes and the axis coordiantes
    function xScreen(x) {
        return (x - xMin) / (xMax - xMin) * canvasGraph.width + 5;
    }
    function yScreen(y) {
        return canvasGraph.height - (y - yMin) / (yMax - yMin) * canvasGraph.height - 5;
    }

    var x = xArray[0];
    var y = yArray[0];
    ctxGraph.moveTo(xScreen(x), yScreen(y));
    for (var i = 1; i <= xArray.length; i++) {
        x = xArray[i];
        y = yArray[i];
        ctxGraph.lineTo(xScreen(x), yScreen(y));
    }
}

// Called when pressing the stop buttom
function stopAnimation() {
    cancelAnimationFrame(animationID)
}

// Called when pressing the restart buttom
function restartAnimation() {
    cancelAnimationFrame(animationID)
    init();
}

// Called when pressing the resume buttom
function resumeAnimation() {
    startAnimation()
}

// reload the whole page again from server if the orientation of 
// the mobile device changes
window.addEventListener("orientationchange", function () {
    window.location.reload(true); 
});

// Detect mobile browsers. Got it from here:
// https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript/4819886#4819886
function isTouchDevice() {
    return !!('ontouchstart' in window        // works on most browsers 
        || navigator.maxTouchPoints);       // works on IE10/11 and Surface
};
