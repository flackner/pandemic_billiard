/* 
Declare global variables. 
*/

// HTML elements
let canvas;           // the HTML element containing the billiard canvas
let canvasGraph;      // the HTML element containing the graph canvas
let panel;            // the HTML element containing full top-left panel
let virginsOutput;    // output HTML element
let infectedOutput;   // output HTML element 
let survivorsOutput;  // output HTML element 
let deathsOutput;     // output HTML element

// canvas contexts
let ctx;         // the canvas context for the billiard canvas
let ctxGraph;    // the canvas context for the graph canvas

// Input parameters
let nParticles;
let minRadius;
let maxRadius;
let speed;
let incubTime;
let caseFatality;
let deathRate;

// Data Arrays
let timeArray;
let virginsArray;
let infectedArray;
let survivorsArray;
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
    // state=1 : virgin
    // state=2 : infected
    // state=3 : survivor
    // state=4 : virgin
    updateState(deltaT) {
        let currentTime = new Date

        if (this.state == 2) {
            // let percentDone = (currentTime - this.startTime) / incubTime
            // if (Math.random() < 2 * percentDone * deathRate * deltaT) {
            if (Math.random() < deathRate * deltaT) {
                this.state = 4
                return
            }
            if (currentTime - this.startTime > incubTime) {
                this.state = 3
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
// window is fully loaded. By assigning window.onload to the javascript function 'init'
// this function 'init' is called as soon as the window is fully loaded.
window.onload = init;

// The function 'init' is the entry point for setting up the javascript canvas and starting the 
// animation as well as logging data to screen
function init() {

    // Get the HTML elements
    canvas = document.getElementById('canvasBilliard');
    canvasGraph = document.getElementById('canvasGraph');
    panel = document.getElementById('panel');

    virginsOutput = document.getElementById('virgins');
    infectedOutput = document.getElementById('infected');
    survivorsOutput = document.getElementById('survivors');
    deathsOutput = document.getElementById('deaths');

    // Get the input
    nParticles = parseInt(document.getElementById('nParticles').value);
    minRadius = parseInt(document.getElementById('minRadius').value);
    maxRadius = parseInt(document.getElementById('maxRadius').value);
    speed = 0.01 * parseFloat(document.getElementById('speed').value);
    incubTime = 1000 * parseFloat(document.getElementById('incubTime').value);
    caseFatality = parseFloat(document.getElementById('caseFatality').value);
    deathRate = -Math.log(1 - caseFatality) / incubTime

    // setup canvas
    ctx = canvas.getContext('2d');
    ctxGraph = canvasGraph.getContext('2d');

    // Set the canvas size equal to the window size. This means that the billiard canvas 
    // is the full window size! 
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    //alternative: canvas.width = document.documentElement.clientWidth;
    //alternative: canvas.height = document.documentElement.clientHeight;

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
    virginsArray = [];
    infectedArray = [];
    survivorsArray = [];
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

    // Update canvas size if window size changes
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

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
    nVirgins = 0;
    nInfected = 0;
    nSurvivors = 0;
    for (let i = 0; i < particleArray.length; i++) {
        if (particleArray[i].state == 1) {
            nVirgins++
        } else if (particleArray[i].state == 2) {
            nInfected++
        } else if (particleArray[i].state == 3) {
            nSurvivors++
        } else if (particleArray[i].state == 4) {
            // Remove dead particles from the particleArray.
            particleArray.splice(i, 1);
        }
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
    virginsOutput.value = nVirgins
    infectedOutput.value = nInfected
    survivorsOutput.value = nSurvivors
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
    virginsArray.push(nVirgins);
    infectedArray.push(nInfected);
    survivorsArray.push(nSurvivors);
    deathsArray.push(nDeaths);

    // Clear graph canvas
    ctxGraph.clearRect(0, 0, canvasGraph.width, canvasGraph.height);

    // draw the axes
    drawAxes()

    // draw the virgins
    ctxGraph.beginPath();
    ctxGraph.strokeStyle = "purple";
    ctxGraph.lineWidth = 3;
    drawGraph(timeArray, virginsArray)
    ctxGraph.stroke();

    // draw the infected
    ctxGraph.beginPath();
    ctxGraph.strokeStyle = "red";
    ctxGraph.lineWidth = 3;
    drawGraph(timeArray, infectedArray)
    ctxGraph.stroke();

    // draw the survivors
    ctxGraph.beginPath();
    ctxGraph.strokeStyle = "green";
    ctxGraph.lineWidth = 3;
    drawGraph(timeArray, survivorsArray)
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
    init()
}

// Called when pressing the resume buttom
function resumeAnimation() {
    startAnimation()
}