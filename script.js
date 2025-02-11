var brd = document.createElement("DIV");
document.body.insertBefore(brd, document.getElementById("board"));
const speed = 0.5;
const fadeInTime = 3000;
const fadeOutTime = 3000;
var lanterns = [];
var xstart = 50;
var ystart = 100;
var xspace = 50;
var yspace = 50;
var xsplit = 300;

var ltrMap = {
  'L': [
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1]
  ],
  'I': [
    [1, 1, 1, 1],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [1, 1, 1, 1]
  ],
  'K': [
    [1, 0, 0, 1],
    [1, 0, 1, 0],
    [1, 1, 0, 0],
    [1, 0, 1, 0],
    [1, 0, 0, 1]
  ],
  'U': [
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1]
  ],
  'V': [
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
    [0, 0, 0, 0]
  ],
  'E': [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1]
  ]
};

function generateLantern(x, y) {
  var lantern = document.createElement("DIV");
  var ltrBdy = document.createElement("DIV");
  var otrLit = document.createElement("DIV");
  var inrLit = document.createElement("DIV");
  lantern.setAttribute('class', 'lantern');
  ltrBdy.setAttribute('class', 'lanternBody');
  otrLit.setAttribute('class', 'outerLight');
  inrLit.setAttribute('class', 'innerLight');
  ltrBdy.appendChild(inrLit);
  lantern.appendChild(ltrBdy);
  lantern.appendChild(otrLit);
  brd.appendChild(lantern);
  lantern.FIT = fadeInTime;
  lantern.FOT = fadeOutTime;
  lantern.style.opacity = 0.0;
  lantern.state = 0;
  lantern.x = x;
  lantern.y = y;
  lantern.bounce = 0;
  lantern.destination = [];
  lantern.destination.x = x;
  lantern.destination.y = y;
  lantern.arrived = true;
  lantern.style.left = lantern.x + "px";
  lantern.style.top = lantern.y + "px";
  if (lanterns == null) lanterns = [];
  lanterns.push(lantern);
  return lantern;
}

var wordBox = document.getElementById("wordBox");
var word = "";
wordBox.addEventListener("focusout", wordBoxFocusOut);

function wordBoxFocusOut() {
  word = wordBox.value;
  var fakeBox = document.createElement("DIV");
  fakeBox.setAttribute('class', 'fakeInput');
  fakeBox.textContent = word;
  wordBox.style.display = "none";
  brd.appendChild(fakeBox);
  setTimeout(function () {
    fakeBox.parentNode.removeChild(fakeBox);
  }, 2000);
  arrangeLanterns(word);
  wordBox.addEventListener("focusout", wordBoxFocusOut);
}

window.onkeydown = function (e) {
  key = e.keyCode;
  if (key == 13) {
    wordBox.blur();
  }
};

window.onload = function() {
  arrangeLanterns("ILIKEU");
};




var distance = function (a, b) {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
};

var lanternDestinationTree;
var arrivedCount = 0;
var requiredLanterns = 0;

function arrangeLanterns(word) {
  requiredLanterns = 0;

  // Count the number of lanterns required for the word
  for (c = 0; c < word.length; c++) {
    var letter = word[c];
    for (i = 0; i < ltrMap[letter].length; i++) {
      for (j = 0; j < ltrMap[letter][i].length; j++) {
        if (ltrMap[letter][i][j] === 1) {
          requiredLanterns++;
        }
      }
    }
  }

  // Generate additional lanterns if needed
  while (lanterns.length < requiredLanterns) {
    generateLantern(window.innerWidth * Math.random(), window.innerHeight * Math.random());
  }

  // Set up the k-d Tree for lantern destinations
  lanternDestinationTree = new kdTree([], distance, ["x", "y"]);
  for (c = 0; c < word.length; c++) {
    appendLanternDestinations(word[c], c);
  }

  // Assign destinations to lanterns
  for (i = 0; i < lanterns.length; i++) {
    if (i < requiredLanterns) {
      var nearest = lanternDestinationTree.nearest(lanterns[i].destination, 1);
      lanternDestinationTree.remove(nearest[0][0]);
      lanterns[i].destination = nearest[0][0];
      lanterns[i].arrived = false;
    } else {
      lanterns[i].state = 1; // Mark extra lanterns as "DEAD"
    }
  }

  // Optimize lantern destinations
  optimizeTotalDistance();
}

function appendLanternDestinations(char, charCount) {
  for (i = 0; i < ltrMap[char][0].length; i++) {
    for (j = 0; j < ltrMap[char].length; j++) {
      if (ltrMap[char][j][i] == 1) {
        var destination = {};
        destination.x = xstart + i * xspace + xsplit * charCount;
        destination.y = ystart + j * yspace;
        lanternDestinationTree.insert(destination);
      }
    }
  }
}

function optimizeTotalDistance() {
  var undone = true;
  while (undone) {
    undone = false;
    for (i = 0; i < lanterns.length; i++) {
      var lanternA = lanterns[i];
      for (j = 0; j < lanterns.length; j++) {
        var lanternB = lanterns[j];
        if (lanternA.state == 0 && lanternB.state == 0) {
          var oldDistance = distance(lanternA, lanternA.destination) + distance(lanternB, lanternB.destination);
          var newDistance = distance(lanternA, lanternB.destination) + distance(lanternB, lanternA.destination);
          if (newDistance < oldDistance) {
            [lanternA.destination, lanternB.destination] = [lanternB.destination, lanternA.destination];
            undone = true;
          }
        } else if (lanternA.state == 0 && lanternB.state == 1) {
          var oldDistance = distance(lanternA, lanternA.destination);
          var newDistance = distance(lanternB, lanternA.destination);
          if (newDistance < oldDistance) {
            lanternB.destination = { x: lanternA.destination.x, y: lanternA.destination.y };
            lanternA.destination = { x: lanternA.x, y: lanternA.y };
            lanternA.state = 1;
            lanternB.state = 0;
            lanternA.arrived = true;
            lanternB.arrived = false;
            undone = true;
          }
        } else if (lanternA.state == 1 && lanternB.state == 0) {
          var oldDistance = distance(lanternB, lanternB.destination);
          var newDistance = distance(lanternA, lanternB.destination);
          if (newDistance < oldDistance) {
            lanternA.destination = { x: lanternB.destination.x, y: lanternB.destination.y };
            lanternB.destination = { x: lanternB.x, y: lanternB.y };
            lanternA.state = 0;
            lanternB.state = 1;
            lanternA.arrived = false;
            lanternB.arrived = true;
            undone = true;
          }
        }
      }
    }
  }
}

const spedFctr = 0.025;
const arivThsh = 5 * spedFctr;
const bonsFctr = 0.001;
const bonsMrgn = 5;
var before = Date.now();
var id = setInterval(frame, 10);

function frame() {
  var current = Date.now();
  var deltaTime = current - before;
  before = current;
  for (i in lanterns) {
    var lantern = lanterns[i];
    switch (lantern.state) {
      case 0:
        if (lantern.FIT > 0) {
          lantern.FIT -= deltaTime;
          lantern.style.opacity = 1 - lantern.FIT / fadeOutTime;
        }
        break;
      case 1:
        if (lantern.FOT > 0) {
          lantern.FOT -= deltaTime;
          lantern.style.opacity = lantern.FOT / fadeOutTime;
        } else {
          lantern.parentNode.removeChild(lantern);
          lanterns.splice(i, 1);
        }
        break;
    }
    var xDiff = lantern.destination.x - lantern.x;
    var yDiff = lantern.destination.y - lantern.y;
    var dDiff = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    if (!lantern.arrived) {
      if (Math.abs(dDiff) < arivThsh) {
        lantern.arrived = true;
        arrivedCount++;
      } else {
        lantern.x += xDiff / dDiff * spedFctr * deltaTime;
        lantern.y += yDiff / dDiff * spedFctr * deltaTime;
      }
      lantern.style.left = lantern.x + "px";
    } else {
      lantern.bounce += bonsFctr * deltaTime;
    }
    lantern.style.top = lantern.y + Math.sin(lantern.bounce) * bonsMrgn + "px";
  }
}

var gr = setInterval(check, 100);

function check() {
  if (arrivedCount == requiredLanterns) {
    wordBox.style.display = "inline";
    arrivedCount = 0;
  }
}

window.addEventListener("load", function() {
  var audio = document.getElementById("bgMusic");

  // Try playing immediately
  audio.muted = false; // Unmute the audio
  audio.play().catch(function(error) {
    console.log("Autoplay blocked. User interaction may be required.");
  });
});



document.addEventListener("click", function() {
  var audio = document.getElementById("bgMusic");
  audio.play();
}, { once: true });
  
