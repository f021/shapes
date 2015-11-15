

    "use strict"



      let img, canvas, ctx, draft, shadow;

      const $ = str => document.querySelector(str);
      const _ = str => $(`input[name=${str}]`);
      const is = str => _(str).checked;
      let firstClick = true;

      // const imgBox = $('.img-box');
      const imgBox = $('form[name=img]');
      // const imgBox = $('body');
      const imgBtn = $('input[type=file]');

      const error = '<h1>Hey</h1><p>I\'m understand only img file types...</p>';     

      const who = (str) => [].filter.call(
        document.querySelectorAll(`input[name=${str}]`), e =>
          e.checked)[0].value;

      const getStyle = elm => window.getComputedStyle(elm);
      const getRect = (obj, elm) => obj.getBoundingClientRect(elm);

      const createCanvas = size => {
        let box = size;
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        draft = document.createElement('canvas');
        shadow = draft.getContext('2d');        
        canvas.width = box.w; canvas.height = box.h;
        draft.width = box.w; draft.height = box.h;
        removeChildren(imgBox);
        imgBox.appendChild(canvas);
        imgBox.appendChild(draft);
        draft.className = "hide";
        _('size').value = `w: ${canvas.width}, h: ${canvas.height}`;
        return {
          canvas,
          ctx
        };
      };

      const removeChildren = elm => {
        elm.innerHTML = '';
      }

      const size = elm => ({
        w: elm.clientWidth,
        h: elm.clientHeight
      });


      const initial = {
        offsetX: 0,
        offsetY: 0,
        zoom: 1
      };

      const btn = {
          create () {
          $('form[name=toolbox').className = 'hide';  // don't work in new canvas mode !!!!
          let obj = createCanvas(size(imgBox));
          canvas = obj.canvas;
          ctx = obj.ctx;
          setRange('input[name=offsetX]', canvas.width);
          setRange('input[name=offsetY]', canvas.height);
          listenCanvas();
          btn.launch();
        },
        reset () { 
          Object.keys(initial).forEach( e => {
            _(e).value = initial[e];
            updateUI({target: _(e)});
          });
        },
        launch () { timerFn(draw, 1000/60).start(); },
        newPath () { scene.newPath(); },
        delPath () { scene.delPath(); },
        pathOver () { scene.pathOver(); },
        pathUnder () { scene.pathUnder(); },
        prevPath () { scene.prevPath(); },
        nextPath () { scene.nextPath(); },
        save () { saveToFile(); },
        copy () { copyToBuffer();},
        collapse (e) { let elm = e.target.nextElementSibling.children;
          e.target.innerText = e.target.innerText === '+' && '-' || '+';
          for (let i = 0; i < elm.length; i++) {
            if ( elm[i].tagName !== 'LEGEND') {
              elm[i].classList.toggle("hide");
            }
          } 
        }
      };

      const mapping = () => ({
        x: _('offsetX').value * _('zoom').value,
        y: _('offsetY').value * _('zoom').value,
        z: _('zoom').value
      });

      const anchorType = {
        move (pos) { return moveDot(pos) },
        line (pos) { return lineDot(pos) },
        quadratic (pos) { return quadraticDot(pos) }
      }

      const toRGB = (hex) => {
        let i = hex[0] === '#' && -1 || -2;
        return () => {
          i += 2;
          return parseInt(hex.slice(i, i + 2), 16);
        }
      };


      const pathMethod = {

        // update (colors) {
          
        // },

        // show () {console.log(this.arr) },

        drawRect () {
          this.arr.forEach(elm => { ctx.beginPath(); elm.draw()});
        },

        add (pos) {
          let elm;
          if (this.arr.length === 0) {
            elm = anchorType.move(pos);
          } else {
            pos.prev = this.last();
            elm = anchorType[who('node')](pos);
          }  
          this.arr.push(elm);
          // console.log('add anchor: ', elm);
        },

        drawPath () {
          let ff = toRGB(this.pathColor);
          let aa = toRGB(this.fillColor);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${ff()}, ${ff()}, ${ff()}, ${this.lineOpacity})`;
          ctx.lineWidth = this.lineWidth;
          this.arr.forEach(elm => elm.path());
          if (this.closePath) {
            if (this.fillPath) {
              ctx.fillStyle = `rgba(${aa()}, ${aa()}, ${aa()}, ${this.shapeOpacity})`;
              ctx.fill();
            };
            ctx.closePath();
          };
          if (this.strokePath) {
            ctx.stroke();
          }
        },

        shadowPath (t) {
          shadow.lineWidth = 5;
          shadow.beginPath();
          this.arr.forEach(e => e.path(shadow));
          if (this.closePath) {
            shadow.closePath();
          };
          if (shadow.isPointInStroke(t.x, t.y)) {
            return this;
          } else {
            return false;
          }
        },

        toString(type) {
        let ff = toRGB(this.pathColor);
        let aa = toRGB(this.fillColor);
        let str =
`${!this.strokePath && 'noStroke();' 
||`stroke(${ ff() }, ${ ff() }, ${ ff() }, ${ Math.round(255 * this.lineOpacity) });`
+`\nstrokeWeight = ${ this.lineWidth };`}
${!this.fillPath && 'noFill();'
|| `fill(${ aa()}, ${ aa()}, ${ aa()}, ${ Math.round(255 * this.shapeOpacity) });`}
beginShape();
${ this.arr.map(e => e.toString('p5js')).join('\n') }
${ this.closePath && 'endShape(CLOSE);' || 'endShape();'}\n`;
          return str;
        },

        delNode (elm) {
          this.arr.splice(this.arr.indexOf(elm),1);
        },

        isDot (target) {
          let search = this.arr.filter(elm => len(elm, target) < elm.size)[0];
          if (!search) {
            return false;
          } else {
            return { path: this, elm: search, method: 'moveDot' };
          }
        },

        isLine (target, flag) {
          flag = flag || true;
          let len = this.arr.length;
          if (len > 0) {
            for (let i = 1; i < len; i++){
              if (this.arr[i].draggable) {
                shadow.lineWidth = 5;
                shadow.beginPath();
                shadow.moveTo(this.arr[i-1].x, this.arr[i-1].y);
                this.arr[i].path(shadow);
                if (shadow.isPointInStroke(target.x, target.y)) {
                  return { path: this, elm: this.arr[i], method: 'curve' };
                };
              };
            };
        };
        return false;
      }
    };


    const pathTuning = () => ({
      fillColor: _('fillColor').value, 
      lineWidth: _('lineWidth').value,
      pathColor: _('pathColor').value,
      lineWidth: _('lineWidth').value,
      shapeOpacity: _('shapeOpacity').value,
      lineOpacity: _('lineOpacity').value,
      closePath: is('closePath'),
      fillPath: is('fillPath'),
      strokePath: is('strokePath'),
    });

    const scrim = (state) => {
      let arr = [];
      let current = undefined;

      let method = {

        json () { $('textarea').value = arr.map(e => JSON.stringify(e, null, ' '));},

        renew () { btn.create(); },

        update (e) { current[e.target.name] = e.target.value; },

        updateUI() { 
          for (let elm in pathTuning()) {
            _(elm).value = current[elm];
            _(elm).checked = current[elm];
          };
        },
        
        clear () { ctx.clearRect(0,0, canvas.width, canvas.height); },
        
        newPath () { arr.push(shape({arr:[]})); current = arr.slice(-1)[0];},  // push in arr new path object
        
        add (elm) { current.add(elm); },

        pathOver () { 
          let i = arr.indexOf(current);
          if (i === arr.length - 1) return null;
          arr.splice(i, 1);
          arr.splice(i + 1, 0, current);
        },

        pathUnder () {
          let i = arr.indexOf(current);
          if (i ===0 ) return null;
          arr.splice(i, 1);
          arr.splice(i - 1, 0, current);
        },

        nextPath () { 
          let i = arr.indexOf(current);
          if (i === arr.length - 1) {
            current = arr[0];
          } else {
            current = arr[i + 1];
          };
          this.updateUI();
        },

        prevPath () { 
          let i = arr.indexOf(current);
          if (i===0) {
            current = arr.slice(-1)[0];
          } else {
            current = arr[i-1];
          };
          this.updateUI();
        },
        
        drawPath () {
          if (is('showShapes')){
            arr.forEach(e => e.drawPath());
          } else {
            if (is('showCurrent')) {
              current.drawPath();
            };
          };
          this.updateUI();
        },

        write(type) {
          $('textarea').value = `// createCanvas(${canvas.width}, ${canvas.height});\n
${arr.map((e,i) => `// shape #${i}\n${e.toString(type)}`).join('\n')}`;
        },

        delPath () { 
          arr.splice(arr.indexOf(current),1);
          if (!arr.length) {
            btn.newPath();
          } else {
            current = arr.slice(-1)[0];
          };
        },

        drawRect () { current.drawRect() },

        isDot (t) { return current.isDot(t); },
        isLine (t) { return current.isLine(t); },

        overmouse (t) {
          if (!current.arr.length) { // ugly
            return false;
          } else {
            let search = arr.filter(e => e.shadowPath(t))[0];
              if (search) {
                current = search;
                this.updateUI();
                return current;
              } else {
                return false;
              }
            };
        },

        // show() {console.log(arr)},
        get () {return current} // ugly
      };

      return  method;
    }


    const customArray = {
      head () { return this.arr[0]},
      tail () { return this.arr.slice(1)},
      init () { return this.arr.slice(0, -1)},
      last () { return this.arr.slice(-1)[0]}
    };

    const saveToFile = () => {
          let filename = 'shape.js';
          let text = $(textarea).value;
          let blob = new Blob([text], {type: "text/plain;charset=utf-8"});
          saveAs(blob, filename+".js");
        };
    
    const len = (a, b) => Math.sqrt(Math.pow(a.x-b.x, 2) + Math.pow(a.y-b.y, 2));

    const shape = (state) => { //after all remove state...
      return Object.assign(
        Object.create(Object.assign(
          Object.create(customArray), pathMethod)),
        { arr: state.arr || []},
        pathTuning()
        );
    };

      const scene = scrim();
      scene.newPath({arr:[]});
      // const scene = shape({arr: []});

      const node = {
        color: '#ff0000',
        size: 10,
        draggable: false,
        toString (type) { return `${this.write[type]}(${this.x}, ${this.y});` },
        write: {
          p5js: `vertex`,
          js: 'lineTo',
        }
      };

      const nodeMethod = {

        box () {
          let accuracy = 0;
          return {
            left: this.x - this.size/2 + accuracy,
            right: this.x + this.size/2 + accuracy,
            top: this.y - this.size/2 + accuracy,
            bottom: this.y + this.size/2 + accuracy 
          }
        },

        draw () {
          let r = this.box();
          ctx.strokeStyle = this.color;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(r.left, r.top, this.size, this.size);
        },

        moveDot (pos) {
          this.x = pos.x;
          this.y = pos.y;
        },
        // curve () {
            // hello, who are?
        // },
        path (context) {
          (context || ctx).lineTo(this.x, this.y);
        }
      };


      const moveDot = pos => {
        return Object.assign(
          lineDot(pos),
          Object.create({
            path (context) { (context || ctx).moveTo(this.x, this.y)} ,
            write: { p5js: 'vertex', js: 'moveTo'}
          })
        );
      };


      const curveMethod = {
        curve (xy) { this.px = xy.x; this.py = xy.y; this.path(); },
        path (context) {
          (context || ctx).quadraticCurveTo( this.px, this.py, this.x, this.y)} 
      };



      const curveRect = (pos) => {
        return Object.assign(
          Object.create(lineDot(pos)),
            { color: 'red', draggable: true,
              toString (type) { 
                return `${this.write[type]}(${this.px}, ${this.py}, ${this.x}, ${this.y});` },
              write: {
                p5js: 'quadraticVertex',
                js: 'quadraticCurveTo',
              },
              draw() {
                ctx.strokeStyle = this.color;
                ctx.lineWidth = .5;
                ctx.arc(this.x, this.y, this.size/2, 0, 2*Math.PI);
                ctx.stroke(); }
             },
            curveMethod
          );
      };

      const quadraticDot = pos => {
        let state = { px: pos.prev.x, py: pos.prev.y };
        return Object.assign(Object.create(curveRect(pos)), state);
      }

      const lineDot = pos => {
        let state = { x: pos.x, y: pos.y };
        return Object.assign(Object.create(
          Object.assign(Object.create(node), nodeMethod)),
          state);
      };      

      const timerFn = (fn, ms) => {
        let id;     
        const start = () => { id = setInterval(fn, ms) };
        const stop = () => { clearInterval(id) };
        return { start: start, stop: stop } ;
      };


      const draw = () => {
        let map = mapping();
        if ( $('#p5js').selected) { scene.write(); };
        if ( $('#json').selected) { scene.json(); };
        // scene.write();
        scene.clear();
        ctx.setTransform(map.z, 0, 0, map.z, map.x, map.y);
        if (img && is('showImage')) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        scene.drawPath(map);
        if (is('showNodes') && is('showCurrent')) scene.drawRect(map);
      };

      document.body.addEventListener('click', e => {
        if (firstClick) {
          $('.help').classList.toggle('hide');
          firstClick = false;
        };
        if (e.target.type === 'button') {
          btn[e.target.name](e);
        };
      });

      document.body.addEventListener('keydown', e => {
        switch (e.keyCode){
          case 32:
            _('fixedCurrent').checked = !_('fixedCurrent').checked;
            break;
          case 87: // w
            btn.pathOver();
            break;
          case 83: // s
            btn.pathUnder();
            break;
          case 68: // d
            btn.nextPath();
            break;
          case 65: // a
            btn.prevPath();
            break;
          case 81: // q
            $('#nodeLine').checked = true;
            break;
          case 69: // e
            $('#nodeCurve').checked = true;
            break;
          case 82: // r
            btn.newPath();
            break;
          case 88:  // x
            btn.delPath();
            break;
          case 86: // v
            _('showShapes').checked = !is('showShapes');
            break;
          case 67: //c
            _('showCurrent').checked = !is('showCurrent');
            break;
          default:
            // console.log(`pressed ${e.keyCode}`);
        };
      });

      // document.body.addEventListener('mouseDown', e => {
      //   if (e.target.name === 'color') {
      //     $(`#${e.target.name}`).style.backgroundColor = e.target.value;
      //   };
      // });

      const updateUI = e => {
        if (e.target.previousSibling) {
          e.target.previousSibling.innerHTML = ` ${e.target.value}`;
        }
      }


      document.body.addEventListener('input', updateUI);
      document.forms.customize.addEventListener('input', scene.update);
      document.forms.customize.addEventListener('change', e => {
        if (e.target.name === 'closePath') scene.get().closePath = e.target.checked; // ugly .................
        if (e.target.name === 'fillPath') scene.get().fillPath = e.target.checked; // .................
        if (e.target.name === 'strokePath') scene.get().strokePath = e.target.checked; //.................
      });

      const mouseXY = e => {
        let r = canvas.getBoundingClientRect(e);
        let map = mapping();
        return {
          x: Math.round((e.clientX - Math.floor(r.left))/map.z - map.x/map.z),
          y: Math.round((e.clientY - Math.floor(r.top))/map.z - map.y/map.z)
        };
      };

      const pixelXY = pos => ctx.getImageData(pos.x, pos.y, 1, 1).data;

      const listenCanvas = () => {

        let mouse;
        let drag = undefined;
        let mouseOverCanvas = false;
        let mouseOverLine = undefined;
        let mouseOverElm = undefined;

        const updateXYRGB = () => {
          _('xy').value = `x: ${mouse.x}, y: ${mouse.y}`;
         _('rgb').value = `rgb: ${pixelXY(mouse).slice(-3)}`;
        };


        canvas.addEventListener('click', e => {

          if (e.shiftKey && mouseOverLine) {
            scene.delPath(mouseOverLine);
            return null;
          }

          if (e.altKey && drag.method === "moveDot") {
            drag.path.delNode(drag.elm);
            drag = undefined;
            return null;
          }
          if (drag) {
            drag = undefined;
          } else {
            scene.add(mouse);
          } 

        });

        canvas.addEventListener('mousedown', (e) => {
          drag = mouseOverElm;
            // if (drag) scene.turn(drag.path);
          // console.log(drag);
        });

        // canvas.addEventListener('mouseup', (e) => {

        // });

        canvas.addEventListener('mousemove', e => {
          mouse = mouseXY(e);
          if (drag) {
            drag.elm[drag.method](mouse);
          } else {
            if (is('fixedCurrent')) {
              mouseOverLine = scene.overmouse(mouse);
            }
            mouseOverElm = scene.isDot(mouse) || scene.isLine(mouse)
            if (mouseOverElm) {
              canvas.style.cursor = 'pointer';
            } else {
              canvas.style.cursor = 'crosshair';
            };
          };
          updateXYRGB();
        });

        canvas.addEventListener('mouseover', () => {
          mouseOverCanvas = true;
        });

        canvas.addEventListener('mouseout', () => {
          mouseOverCanvas = false;
        });


        // canvas.addEventListener('mousewheel', e => console.log(e.deltaY));
    }



////////////////////////////////////
// load-image
////////////////////////////////////


// listen event 'change' on imgBtn (input[type=file])
// onchange call handleFile

  imgBtn.addEventListener('change', handleFile);

// sendMsd :: string element --> null
// remove all from element 'to', make new 'div', add class 'error'
// add msg, put it inside element 'to'

  function sendMsg(msg, to) { 
    let err = document.createElement('div');
    err.className = 'error';
    err.innerHTML = msg;
    imgBox.innerHTML = '';
    imgBox.appendChild(err);
  }

// isImage :: string --> bool
// return true if filetype image

  function isImage(filetype) {
    return /^image/.test(filetype);
  }


//  getSize :: element --> object
//  return width and height of the element

  function getSize(elm) {
    if (elm.clientHeight){
      return {
        w: elm.clientWidth,
        h: elm.clientHeight
      }
    } else {
      return {
        w: elm.width,
        h: elm.height
      }
    }
  }

// fitSize object --> object --> object
// resize 'a' to fit in 'b'

  function fitSize(a, b) {
    let rate = a.w / a.h;
    if (a.w > b.w) {
      a.h -= (a.w - b.w) / rate;
    } else {
      a.h += (b.w - a.w) / rate;
    }
    a.w = b.w;  
    if (a.h > b.h) {
      a.w -= (a.h - b.h) * rate;
      a.h -= a.h - b.h;
    } 
    a.w = Math.floor(a.w);
    a.h = Math.floor(a.h);    
    return a;
  
  }

// handleFile event --> img
// if event 'change' on input[type=file]
// if filetype image make new image and add to canvas

  function handleFile() {   
    let file = this.files[0];
    if ( !isImage(file.type) ) {
      sendMsg(error, imgBox);
    } else {
      img = new Image();
      img.src = window.URL.createObjectURL(file);     
      img.onload = function(){
        window.URL.revokeObjectURL(this.src);
        drawImg(this); // when img loaded... put it in canvas
      }
    }
  }

  function drawImg(img) {
    let size = fitSize(getSize(img),getSize(imgBox));
    createCanvas(size);
    ctx.drawImage(img, 0, 0, size.w, size.h);
    setRange('input[name=offsetX]', size.w);
    setRange('input[name=offsetY]', size.h);
    listenCanvas();
    btn.launch();
  }

    function setRange(str, value){
      let elm = document.querySelector(str);
      elm.min = -value;
      elm.max = value;
    }

    console.log('hello, there... \nif you have questions. \nyou can write me at\nandrei.fzto {meow} gmail.com')


