const main = document.getElementById('main');
const two = new Two({
  type: Two.Types.canvas,
  fullscreen: true,
  autostart: true
}).appendTo(document.body);


function disegnare(){
// The cursor, matched with your mouse
var mouse = new Two.Vector();
mouse.radius = 4;
mouse.radiusSquared = Math.pow(mouse.radius, 2);
mouse.dragging = false;
mouse.intersection = null;
mouse.selected = new Two.Circle(0, 0, 2);
mouse.selected.stroke = '#00AEFF';
mouse.selected.scale = 2;
mouse.selected.visible = false;

var content = two.makeGroup(); // Everything that is drawn black
var interaction = two.makeGroup();  // All the blue / pink interactive elements

// The blue path highlight
var selection = new Two.Path();
selection.stroke = '#00AEFF';
selection.noFill();
selection.automatic = false;
selection.visible = false;

interaction.add(selection);

// The pink control handles
var controls = new Two.Group();
controls.left = new Two.Circle(0, 0, 2);
controls.right = new Two.Circle(0, 0, 2);
controls.line = new Two.Path([
  new Two.Anchor(),
  new Two.Anchor(),
  new Two.Anchor()
]);
controls.left.translation.bind(Two.Events.Types.change, updateControlHandles);
controls.right.translation.bind(Two.Events.Types.change, updateControlHandles);
controls.add(controls.line, controls.left, controls.right);
controls.stroke = '#5AC6D2';
controls.anchor = null;
interaction.add(controls);

// A list of all the editable anchor points
var points = new Two.Points();
points.size = 8;
points.stroke = '#0B004E';
interaction.add(points, mouse.selected);

var path; // Used to reference the currently selected path
var domElement = two.renderer.domElement;

domElement.addEventListener('mousedown', mousedown, false);
domElement.addEventListener('dblclick', doubleclick, false);
domElement.addEventListener('mousemove', mousemove, false);

  function create_textarea(path,textareaX,textareaY){
    /* var size = 50;
    var shape = new Two.Text('inserisci misura',textareaX, textareaY);
    shape.noStroke().fill = '#ccc';
    content.add(shape);
    console.log(shape);
    shape.addEventListener("click", function() {
      console.log('si può fare');
    }); */
    
    let size = document.createElement("input");
    size.classList.add('input-size');
    console.log(size.style);
    document.body.appendChild(size);
    //size.style.bottom = textareaY + 'px';
    let project = document.querySelector("canvas");
    console.log(project.width);
    let posYperc = (textareaY * 100/project.height);
    let posXperc = (textareaX * 100/project.width);
    console.log( posYperc);
    let posY = posYperc + '%';
    let posX = posXperc + '%';
    let posSizeY = 'top: calc(' + posY + ' - 21px);';
    let posSizeX = 'left: calc(' + posX  + ' - 50px);';
    console.log(posSizeX);
    size.style.cssText = posSizeX + posSizeY;
  }

function create() {

  path = new Two.Path();
  path.linewidth = 2;
  path.noFill();
  path.automatic = false;

  points.vertices = path.vertices;
  selection.vertices = path.vertices;

  content.add(path);
}

function add(x, y) {

  var anchor = new Two.Anchor(x, y, 0, 0, 0, 0);
  anchor.command = Two.Commands[path.vertices.length > 0 ? 'curve' : 'move'];

  path.vertices.push(anchor);
  controls.anchor = anchor;
  controls.left.translation.copy(anchor);
  controls.right.translation.copy(anchor);
  return anchor;

}

function remove(i) {

  mouse.selected.visible = false;
  path.vertices.splice(i, 1);

}

function close(x, y) {

  controls.anchor = null;
  path.closed = true;
  deselect();

  path = null;

}
function close_open(x, y) {

  controls.anchor = null;
  path.closed = false;
  //console.log(path['vertices']['0']['y']);
  let pathLength = path['vertices'].length - 2;
  console.log(pathLength);
  for (i=0; i < pathLength; i++){
    let previousAnchor = i + 1;
    let textareaX = (path['vertices'][i]['x'] + path['vertices'][previousAnchor]['x'])/2;
    let textareaY = (path['vertices'][i]['y'] + path['vertices'][previousAnchor]['y'])/2;
    create_textarea(path,textareaX,textareaY);
  }
  deselect();

  path = null;

}

function select() {

  points.visible = true;
  selection.visible = true;

}

function deselect() {

  points.visible = false;
  selection.visible = false;

}

function updateControlHandles() {

  // Update the pink control handles based on whatever the current
  // path's details are — keeps things in sync

  if (!controls.anchor) {
    return;
  }

  controls.line.vertices[0].copy(controls.left.translation);
  controls.line.vertices[1].copy(controls.anchor);
  controls.line.vertices[2].copy(controls.right.translation);

}

/**
 * Browser interactions handle below
 */

function mousedown(e) {

  if (mouse.intersection) {
    mouse.dragging = true;
  } else {
    if (!path) {
      create();
      add(e.clientX, e.clientY);
      select();
    } else {
      add(e.clientX, e.clientY);
    }
  }

  window.addEventListener('mousemove', drag, false);
  window.addEventListener('mouseup', mouseup, false);

}

function doubleclick(doneInput) {

  if (!path) {
    return;
  }

  var first = path.vertices[0];
  

  if (!first.controls.left.isZero() || !first.controls.right.isZero()) {
    // Hack to emulate closing, but actually using
    // one last point to simulate the left control handle
    // of the first point.
    var last = add(first.x, first.y);
    last.controls.left.copy(first.controls.left);
  }

  deselect();
  close_open();

}

function mousemove(e) {

  // Calculate what object is intersecting the mouse
  // only when we're not already doing some other interaction

  if (mouse.dragging) {
    return;
  }

  var x = mouse.x;
  var y = mouse.y;

  mouse.set(e.clientX, e.clientY);

  mouse.intersection = null;

  for (var i = 0; i < points.vertices.length; i++) {

    var point = points.vertices[i];
    var d = point.distanceToSquared(mouse);

    if (d <= mouse.radiusSquared) {
      mouse.selected.visible = true;
      mouse.selected.position.copy(point);
      mouse.intersection = {
        object: mouse.selected,
        id: i
      };
    }

  }

  if (!mouse.intersection) {
    mouse.selected.visible = false;
  }

}

function drag(e) {

  mouse.set(e.clientX, e.clientY);

  // Like mousemove, but on the window and only occuring when
  // we've called `mousedown` effectively creating a drag event
 
  if (mouse.dragging) {

    if (controls.anchor) {

      var anchor = selection.vertices[selection.vertices.length - 1];
      anchor.controls.left.copy(mouse).sub(anchor);
      anchor.controls.right.clear();
      anchor.trigger(Two.Events.Types.change);

      controls.visible = true;
      controls.left.translation.copy(anchor.controls.left).add(anchor);
      controls.right.translation.copy(anchor.controls.right).add(anchor);

    } else {

      // Move an existing point
      mouse.dragging = 1;

      var object = mouse.intersection.object;
      object.translation.copy(mouse);

    }

  } else if (controls.anchor) {

    // Move a just created anchor point
    var anchor = selection.vertices[selection.vertices.length - 1];
    anchor.controls.right.copy(mouse).sub(anchor);
    anchor.controls.left.copy(anchor.controls.right).rotate(Math.PI);
    anchor.trigger(Two.Events.Types.change);

    controls.visible = true;
    controls.left.translation.copy(anchor.controls.left).add(anchor);
    controls.right.translation.copy(anchor.controls.right).add(anchor);

  }

}

function mouseup() {

  if (mouse.intersection) {

    if (mouse.dragging === true) {

      // Close or remove a point from a path

      if (mouse.intersection.id > 0) {

        remove(mouse.intersection.id);

      } else {

        if (controls.anchor) {

          // If there was a modification of control points then
          // update the path accordingly.

          var anchor = path.vertices[path.vertices.length - 1];

          anchor.controls.left.copy(controls.left.translation).sub(anchor);
          anchor.controls.right.copy(controls.right.translation).sub(anchor);

          anchor.trigger(Two.Events.Types.change);

        }

        close();

      }

    }

  } else if (controls.anchor) {

    // Set the control point from the anchor to the corresponding path
    var anchor = path.vertices[path.vertices.length - 1];
    anchor.controls.left.copy(controls.left.translation).sub(anchor);
    anchor.controls.right.copy(controls.right.translation).sub(anchor);
    anchor.trigger(Two.Events.Types.change);

  }

  // Reset listeners and context aware variables.

  window.removeEventListener('mousemove', drag, false);
  window.removeEventListener('mouseup', mouseup, false);

  mouse.dragging = false;
  mouse.intersection = null;

  selection.closed = false;
  controls.visible = false;

}
}

// FORM DI SALVATAGGIO
let containerForm = document.getElementById('cont-form');
let containerTrigger = document.getElementById('container-trigger');
let containerTriggerClosing = document.getElementById('container-closing-trigger');

containerTrigger.onclick = function() {open_container()};
containerTriggerClosing.onclick = function() {open_container_closing()};

function open_container() {
  containerForm.classList.toggle("closing-form");
}
function open_container_closing() {
  containerForm.classList.toggle("closing-form");
}

// PULSANTE SALVA

let btn = document.getElementById('btn');
let page = document.getElementById('page');
let saveBtn = document.getElementById('save-btn');
let iconSave = document.getElementById('icon-save');
let projectName = document.getElementById('pname');


saveBtn.addEventListener('mouseover',hoverIconadd);
saveBtn.addEventListener('mouseout',hoverIconremove);

// hover effect
function hoverIconadd(){
  iconSave.classList.add('icon-hover-state');
}
function hoverIconremove(){
  iconSave.classList.remove('icon-hover-state');
}

// check if field value is empty or not

projectName.addEventListener("keyup", function (e) {
  const inputText = e.target.value;
  if (inputText.length > 0){
    saveBtn.classList.remove('disable-btn');
  }else{
    saveBtn.classList.add('disable-btn');
  }
});

// save the document
btn.addEventListener('submit', function(){
  let projectNameValue = document.getElementById('pname').value;
  html2PDF(page, {
    jsPDF: {
      format: 'a4',
      orientation: "landscape",
    },
    imageType: 'image/jpeg',
    output: projectNameValue
  });
});

