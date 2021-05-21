// Size of canvas. gets updated to fill whole browser.
let width = 150;
let height = 150;

const numberBoids = 100;
let visualViewRange = 120;
let historyLength = 50;
let DRAW_TRAIL = true;
let boids = [];

let fps = 60;
let now;
let then = Date.now();
let interval = 1000/fps;
let delta;


function InitializeBoids() {
  for (var i = 0; i < numberBoids; i += 1) {
    boids[boids.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      trailHistory: [],
    };
  }
}

function InitSingleBoids() {
  for (var i = 0; i < 10; i += 1) {
    boids[boids.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      trailHistory: [],
    };
  }
}

function RemoveBoid(){
  for(let i = 0; i < 10; i++){
    boids.pop();
  }
}

function ResetBoids(){
  boids = [];
  InitializeBoids();
}


function CalcDistance(boid1, boid2) {
  return Math.sqrt(
    (boid1.x - boid2.x) * (boid1.x - boid2.x) +
      (boid1.y - boid2.y) * (boid1.y - boid2.y),
  );
}

// Called at start and whenever the window resizes to update the canvas with current window height/width
function GetCanvasSize() {
  const canvas = document.getElementById("boids");
  width = window.innerWidth;
  height = window.innerHeight * 0.9 ;
  canvas.width = width;
  canvas.height = height;
}


// Keep boids to within the window. If it gets too close to an edge, push it back in and reverse the direction.
function KeepInBounds(boid) {
  const margin = 200;
  const turnFactor = 1;

  if (boid.x < margin) {
    boid.dx += turnFactor;
  }
  if (boid.x > width - margin) {
    boid.dx -= turnFactor
  }
  if (boid.y < margin) {
    boid.dy += turnFactor;
  }
  if (boid.y > height - margin) {
    boid.dy -= turnFactor;
  }
}


// Real birds can't go infinitely fast
function LimitSpeed(boid) {
  const speedLimit = 15;

  const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
  if (speed > speedLimit) {
    boid.dx = (boid.dx / speed) * speedLimit;
    boid.dy = (boid.dy / speed) * speedLimit;
  }
}

function DrawTrail(){
  if (DRAW_TRAIL){
    DRAW_TRAIL = false;
  }
  else{
    DRAW_TRAIL = true;
  }
}

// Keep distance between boids to avoid collision
function AvoidOthers(boid) {
  const minDistance = document.getElementById("separation").value // The minimum distance to stay away from other boids
  const avoidFactor = 0.05; // Adjust velocity by this %
  let moveX = 0;
  let moveY = 0;
  for (let otherBoid of boids) {
    if (otherBoid !== boid) {
      if (CalcDistance(boid, otherBoid) < minDistance) {
        moveX += boid.x - otherBoid.x;
        moveY += boid.y - otherBoid.y;
      }
    }
  }

  boid.dx += moveX * avoidFactor;
  boid.dy += moveY * avoidFactor;
}

// Find center of mass of other boids and adjust velocity to fly towards it
function FlyToCenterMass(boid) {
  const centeringFactor = document.getElementById("coherence").value / 1000; // adjust velocity by this %

  let centerX = 0;
  let centerY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (CalcDistance(boid, otherBoid) < visualViewRange) {
      centerX += otherBoid.x;
      centerY += otherBoid.y;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    centerX = centerX / numNeighbors;
    centerY = centerY / numNeighbors;

    boid.dx += (centerX - boid.x) * centeringFactor;
    boid.dy += (centerY - boid.y) * centeringFactor;
  }
}

// Find the average velocity of other boids and adjust velocity to match.
function MatchVelocity(boid) {
  const matchingFactor = document.getElementById("alignment").value / 100; // Adjust by this % of avg velocity

  let numNeighbors = 0;
  let avgDX = 0;
  let avgDY = 0;


  for (let otherBoid of boids) {
    if (CalcDistance(boid, otherBoid) < visualViewRange) {
      avgDX += otherBoid.dx;
      avgDY += otherBoid.dy;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    avgDX = avgDX / numNeighbors;
    avgDY = avgDY / numNeighbors;

    boid.dx += (avgDX - boid.dx) * matchingFactor;
    boid.dy += (avgDY - boid.dy) * matchingFactor;
  }
}


function DrawBoid(ctx, boid) {
  const angle = Math.atan2(boid.dy, boid.dx);
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(boid.x, boid.y);
  ctx.lineTo(boid.x - 15, boid.y + 5);
  ctx.lineTo(boid.x - 15, boid.y - 5);
  ctx.lineTo(boid.x, boid.y);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (DRAW_TRAIL) {
    ctx.strokeStyle = "#558cf466";
    ctx.beginPath();
    ctx.moveTo(boid.trailHistory[0][0], boid.trailHistory[0][1]);
    for (const point of boid.trailHistory) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.stroke();
  }
}
let thisTime = 0, lastTime = 0;


function AnimationLoop() {

  window.requestAnimationFrame(AnimationLoop);
  now = Date.now();
  delta = now - then;
  thisTime = performance.now();
  if (delta > interval) {
    document.getElementById('framesPerSecond').innerText = (1000/ (thisTime - lastTime)).toFixed(0);
    lastTime = thisTime;
    then = now - (delta % interval);


    for (let boid of boids) {
      // calculate and update the velocities
      FlyToCenterMass(boid);
      AvoidOthers(boid);
      MatchVelocity(boid);
      LimitSpeed(boid);
      KeepInBounds(boid);

      // Update the position
      boid.x += boid.dx;
      boid.y += boid.dy
      if (DRAW_TRAIL) {
        boid.trailHistory.push([boid.x, boid.y])
      } else {
        boid.trailHistory = [];
      }
      boid.trailHistory = boid.trailHistory.slice(-historyLength);
    }

    // Clear canvas and draw all boids in current positions
    const ctx = document.getElementById("boids").getContext("2d");
    ctx.clearRect(0, 0, width, height);
    for (let boid of boids) {
      DrawBoid(ctx, boid);
    }
  }
}

window.onload = () => {
  //canvas always fills the whole window
  window.addEventListener("resize", GetCanvasSize, false);
  GetCanvasSize();

  // Randomly initialize boids at start
  InitializeBoids();

  let menuContainerEle = document.getElementById('menuContainer');
  let sliderContainerEle = document.getElementById('slidecontainer')
  let arrowDownEle = document.getElementById('arrowDown');
  let arrowUpEle = document.getElementById('arrowUp');
  let menuTitleEle = document.getElementById('menuTitle');

  let sCoherence = document.getElementById('coherence');
  let sSeparation = document.getElementById('separation');
  let sAlignment = document.getElementById('alignment');
  let sHistoryLength = document.getElementById('historyLength');
  let sVisualRange = document.getElementById('visualRange');
  document.getElementById("p_coherence").innerHTML = "Coherence: " + (sCoherence.value / 1000);
  document.getElementById("p_separation").innerHTML = "Separation: " + (sSeparation.value);
  document.getElementById("p_alignment").innerHTML = "Alignment: " + (sAlignment.value / 100);
  document.getElementById("p_historyLength").innerHTML = "History Length: " + (sHistoryLength.value);
  document.getElementById("p_visualRange").innerHTML = "Visual Range: " + sVisualRange.value;

  sCoherence.addEventListener("input", function(){
    document.getElementById("p_coherence").innerHTML = "Coherence: " + (sCoherence.value / 1000);
  });
  sSeparation.addEventListener("input", function(){
    document.getElementById("p_separation").innerHTML = "Separation: " + (sSeparation.value);
  });
  sAlignment.addEventListener("input", function(){
    document.getElementById("p_alignment").innerHTML = "Alignment: " + (sAlignment.value / 100);
  });
  sHistoryLength.addEventListener("input", function(){
    historyLength = sHistoryLength.value;
    document.getElementById("p_historyLength").innerHTML = "Trail Length: " + sHistoryLength.value;
  });
  sVisualRange.addEventListener("input", function(){
    document.getElementById("p_visualRange").innerHTML = "Visual Range: " + sVisualRange.value;
    visualViewRange = sVisualRange.value;
  });

  menuTitleEle.addEventListener("click", function(){
    if (sliderContainerEle.style.visibility === "hidden") {
      sliderContainerEle.style.visibility = "visible";
      menuContainerEle.style.backgroundColor = "rgba(54,57,63,0.5)"
      arrowDownEle.style.display = "inline-block";
      arrowUpEle.style.display = "none";
    } else {
      sliderContainerEle.style.visibility = "hidden";
      menuContainerEle.style.backgroundColor = "rgba(0,0,0,0)"
      arrowDownEle.style.display = "none";
      arrowUpEle.style.display = "inline-block";

    }
  });

  // start the main animation loop
  window.requestAnimationFrame(AnimationLoop);

};
