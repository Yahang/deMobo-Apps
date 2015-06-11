(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Camera is a component that is responsible for sending information to the renderer about where
 * the camera is in the scene.  This allows the user to set the type of projection, the focal depth,
 * and other properties to adjust the way the scenes are rendered.
 *
 * @class Camera
 *
 * @param {Node} node to which the instance of Camera will be a component of
 */
function Camera(node) {
    this._node = node;
    this._projectionType = Camera.ORTHOGRAPHIC_PROJECTION;
    this._focalDepth = 0;
    this._near = 0;
    this._far = 0;
    this._requestingUpdate = false;
    this._id = node.addComponent(this);
    this._viewTransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this._viewDirty = false;
    this._perspectiveDirty = false;
    this.setFlat();
}

Camera.FRUSTUM_PROJECTION = 0;
Camera.PINHOLE_PROJECTION = 1;
Camera.ORTHOGRAPHIC_PROJECTION = 2;

/**
 * @method
 *
 * @return {String} Name of the component
 */
Camera.prototype.toString = function toString() {
    return 'Camera';
};

/**
 * Gets object containing serialized data for the component
 *
 * @method
 *
 * @return {Object} the state of the component
 */
Camera.prototype.getValue = function getValue() {
    return {
        component: this.toString(),
        projectionType: this._projectionType,
        focalDepth: this._focalDepth,
        near: this._near,
        far: this._far
    };
};

/**
 * Set the components state based on some serialized data
 *
 * @method
 *
 * @param {Object} state an object defining what the state of the component should be
 *
 * @return {Boolean} status of the set
 */
Camera.prototype.setValue = function setValue(state) {
    if (this.toString() === state.component) {
        this.set(state.projectionType, state.focalDepth, state.near, state.far);
        return true;
    }
    return false;
};

/**
 * Set the internals of the component
 *
 * @method
 *
 * @param {Number} type an id corresponding to the type of projection to use
 * @param {Number} depth the depth for the pinhole projection model
 * @param {Number} near the distance of the near clipping plane for a frustum projection
 * @param {Number} far the distance of the far clipping plane for a frustum projection
 *
 * @return {Boolean} status of the set
 */
Camera.prototype.set = function set(type, depth, near, far) {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }
    this._projectionType = type;
    this._focalDepth = depth;
    this._near = near;
    this._far = far;
};

/**
 * Set the camera depth for a pinhole projection model
 *
 * @method
 *
 * @param {Number} depth the distance between the Camera and the origin
 *
 * @return {Camera} this
 */
Camera.prototype.setDepth = function setDepth(depth) {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }
    this._perspectiveDirty = true;
    this._projectionType = Camera.PINHOLE_PROJECTION;
    this._focalDepth = depth;
    this._near = 0;
    this._far = 0;

    return this;
};

/**
 * Gets object containing serialized data for the component
 *
 * @method
 *
 * @param {Number} near distance from the near clipping plane to the camera
 * @param {Number} far distance from the far clipping plane to the camera
 *
 * @return {Camera} this
 */
Camera.prototype.setFrustum = function setFrustum(near, far) {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }

    this._perspectiveDirty = true;
    this._projectionType = Camera.FRUSTUM_PROJECTION;
    this._focalDepth = 0;
    this._near = near;
    this._far = far;

    return this;
};

/**
 * Set the Camera to have orthographic projection
 *
 * @method
 *
 * @return {Camera} this
 */
Camera.prototype.setFlat = function setFlat() {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }

    this._perspectiveDirty = true;
    this._projectionType = Camera.ORTHOGRAPHIC_PROJECTION;
    this._focalDepth = 0;
    this._near = 0;
    this._far = 0;

    return this;
};

/**
 * When the node this component is attached to updates, the Camera will
 * send new camera information to the Compositor to update the rendering
 * of the scene.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Camera.prototype.onUpdate = function onUpdate() {
    this._requestingUpdate = false;

    var path = this._node.getLocation();

    this._node
        .sendDrawCommand('WITH')
        .sendDrawCommand(path);

    if (this._perspectiveDirty) {
        this._perspectiveDirty = false;

        switch (this._projectionType) {
            case Camera.FRUSTUM_PROJECTION:
                this._node.sendDrawCommand('FRUSTUM_PROJECTION');
                this._node.sendDrawCommand(this._near);
                this._node.sendDrawCommand(this._far);
                break;
            case Camera.PINHOLE_PROJECTION:
                this._node.sendDrawCommand('PINHOLE_PROJECTION');
                this._node.sendDrawCommand(this._focalDepth);
                break;
            case Camera.ORTHOGRAPHIC_PROJECTION:
                this._node.sendDrawCommand('ORTHOGRAPHIC_PROJECTION');
                break;
        }
    }

    if (this._viewDirty) {
        this._viewDirty = false;

        this._node.sendDrawCommand('CHANGE_VIEW_TRANSFORM');
        this._node.sendDrawCommand(this._viewTransform[0]);
        this._node.sendDrawCommand(this._viewTransform[1]);
        this._node.sendDrawCommand(this._viewTransform[2]);
        this._node.sendDrawCommand(this._viewTransform[3]);

        this._node.sendDrawCommand(this._viewTransform[4]);
        this._node.sendDrawCommand(this._viewTransform[5]);
        this._node.sendDrawCommand(this._viewTransform[6]);
        this._node.sendDrawCommand(this._viewTransform[7]);

        this._node.sendDrawCommand(this._viewTransform[8]);
        this._node.sendDrawCommand(this._viewTransform[9]);
        this._node.sendDrawCommand(this._viewTransform[10]);
        this._node.sendDrawCommand(this._viewTransform[11]);

        this._node.sendDrawCommand(this._viewTransform[12]);
        this._node.sendDrawCommand(this._viewTransform[13]);
        this._node.sendDrawCommand(this._viewTransform[14]);
        this._node.sendDrawCommand(this._viewTransform[15]);
    }
};

/**
 * When the transform of the node this component is attached to
 * changes, have the Camera update its projection matrix and
 * if needed, flag to node to update.
 *
 * @method
 *
 * @param {Array} transform an array denoting the transform matrix of the node
 *
 * @return {Camera} this
 */
Camera.prototype.onTransformChange = function onTransformChange(transform) {
    var a = transform;
    this._viewDirty = true;

    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }

    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
    a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
    a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
    a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

    b00 = a00 * a11 - a01 * a10,
    b01 = a00 * a12 - a02 * a10,
    b02 = a00 * a13 - a03 * a10,
    b03 = a01 * a12 - a02 * a11,
    b04 = a01 * a13 - a03 * a11,
    b05 = a02 * a13 - a03 * a12,
    b06 = a20 * a31 - a21 * a30,
    b07 = a20 * a32 - a22 * a30,
    b08 = a20 * a33 - a23 * a30,
    b09 = a21 * a32 - a22 * a31,
    b10 = a21 * a33 - a23 * a31,
    b11 = a22 * a33 - a23 * a32,

    det = 1/(b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);

    this._viewTransform[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    this._viewTransform[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    this._viewTransform[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    this._viewTransform[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    this._viewTransform[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    this._viewTransform[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    this._viewTransform[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    this._viewTransform[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    this._viewTransform[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    this._viewTransform[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    this._viewTransform[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    this._viewTransform[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    this._viewTransform[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    this._viewTransform[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    this._viewTransform[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    this._viewTransform[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
};

module.exports = Camera;

},{}],2:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Channels are being used for interacting with the UI Thread when running in
 * a Web Worker or with the UIManager/ Compositor when running in single
 * threaded mode (no Web Worker).
 *
 * @class Channel
 * @constructor
 */
function Channel() {
    if (typeof self !== 'undefined' && self.window !== self) {
        this._enterWorkerMode();
    }
}


/**
 * Called during construction. Subscribes for `message` event and routes all
 * future `sendMessage` messages to the Main Thread ("UI Thread").
 *
 * Primarily used for testing.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Channel.prototype._enterWorkerMode = function _enterWorkerMode() {
    this._workerMode = true;
    var _this = this;
    self.addEventListener('message', function onmessage(ev) {
        _this.onMessage(ev.data);
    });
};

/**
 * Meant to be overridden by `Famous`.
 * Assigned method will be invoked for every received message.
 *
 * @type {Function}
 * @override
 *
 * @return {undefined} undefined
 */
Channel.prototype.onMessage = null;

/**
 * Sends a message to the UIManager.
 *
 * @param  {Any}    message Arbitrary message object.
 *
 * @return {undefined} undefined
 */
Channel.prototype.sendMessage = function sendMessage (message) {
    if (this._workerMode) {
        self.postMessage(message);
    }
    else {
        this.onmessage(message);
    }
};

/**
 * Meant to be overriden by the UIManager when running in the UI Thread.
 * Used for preserving API compatibility with Web Workers.
 * When running in Web Worker mode, this property won't be mutated.
 *
 * Assigned method will be invoked for every message posted by `famous-core`.
 *
 * @type {Function}
 * @override
 */
Channel.prototype.onmessage = null;

/**
 * Sends a message to the manager of this channel (the `Famous` singleton) by
 * invoking `onMessage`.
 * Used for preserving API compatibility with Web Workers.
 *
 * @private
 * @alias onMessage
 *
 * @param {Any} message a message to send over the channel
 *
 * @return {undefined} undefined
 */
Channel.prototype.postMessage = function postMessage(message) {
    return this.onMessage(message);
};

module.exports = Channel;

},{}],3:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Equivalent of an Engine in the Worker Thread. Used to synchronize and manage
 * time across different Threads.
 *
 * @class  Clock
 * @constructor
 * @private
 */
function Clock () {
    this._time = 0;
    this._frame = 0;
    this._timerQueue = [];
    this._updatingIndex = 0;

    this._scale = 1;
    this._scaledTime = this._time;
}

/**
 * Sets the scale at which the clock time is passing.
 * Useful for slow-motion or fast-forward effects.
 *
 * `1` means no time scaling ("realtime"),
 * `2` means the clock time is passing twice as fast,
 * `0.5` means the clock time is passing two times slower than the "actual"
 * time at which the Clock is being updated via `.step`.
 *
 * Initally the clock time is not being scaled (factor `1`).
 *
 * @method  setScale
 * @chainable
 *
 * @param {Number} scale    The scale at which the clock time is passing.
 *
 * @return {Clock} this
 */
Clock.prototype.setScale = function setScale (scale) {
    this._scale = scale;
    return this;
};

/**
 * @method  getScale
 *
 * @return {Number} scale    The scale at which the clock time is passing.
 */
Clock.prototype.getScale = function getScale () {
    return this._scale;
};

/**
 * Updates the internal clock time.
 *
 * @method  step
 * @chainable
 *
 * @param  {Number} time high resolution timestamp used for invoking the
 *                       `update` method on all registered objects
 * @return {Clock}       this
 */
Clock.prototype.step = function step (time) {
    this._frame++;

    this._scaledTime = this._scaledTime + (time - this._time)*this._scale;
    this._time = time;

    for (var i = 0; i < this._timerQueue.length; i++) {
        if (this._timerQueue[i](this._scaledTime)) {
            this._timerQueue.splice(i, 1);
        }
    }
    return this;
};

/**
 * Returns the internal clock time.
 *
 * @method  now
 *
 * @return  {Number} time high resolution timestamp used for invoking the
 *                       `update` method on all registered objects
 */
Clock.prototype.now = function now () {
    return this._scaledTime;
};

/**
 * Returns the internal clock time.
 *
 * @method  getTime
 * @deprecated Use #now instead
 *
 * @return  {Number} time high resolution timestamp used for invoking the
 *                       `update` method on all registered objects
 */
Clock.prototype.getTime = Clock.prototype.now;

/**
 * Returns the number of frames elapsed so far.
 *
 * @method getFrame
 *
 * @return {Number} frames
 */
Clock.prototype.getFrame = function getFrame () {
    return this._frame;
};

/**
 * Wraps a function to be invoked after a certain amount of time.
 * After a set duration has passed, it executes the function and
 * removes it as a listener to 'prerender'.
 *
 * @method setTimeout
 *
 * @param {Function} callback function to be run after a specified duration
 * @param {Number} delay milliseconds from now to execute the function
 *
 * @return {Function} timer function used for Clock#clearTimer
 */
Clock.prototype.setTimeout = function (callback, delay) {
    var params = Array.prototype.slice.call(arguments, 2);
    var startedAt = this._time;
    var timer = function(time) {
        if (time - startedAt >= delay) {
            callback.apply(null, params);
            return true;
        }
        return false;
    };
    this._timerQueue.push(timer);
    return timer;
};


/**
 * Wraps a function to be invoked after a certain amount of time.
 *  After a set duration has passed, it executes the function and
 *  resets the execution time.
 *
 * @method setInterval
 *
 * @param {Function} callback function to be run after a specified duration
 * @param {Number} delay interval to execute function in milliseconds
 *
 * @return {Function} timer function used for Clock#clearTimer
 */
Clock.prototype.setInterval = function setInterval(callback, delay) {
    var params = Array.prototype.slice.call(arguments, 2);
    var startedAt = this._time;
    var timer = function(time) {
        if (time - startedAt >= delay) {
            callback.apply(null, params);
            startedAt = time;
        }
        return false;
    };
    this._timerQueue.push(timer);
    return timer;
};

/**
 * Removes previously via `Clock#setTimeout` or `Clock#setInterval`
 * registered callback function
 *
 * @method clearTimer
 * @chainable
 *
 * @param  {Function} timer  previously by `Clock#setTimeout` or
 *                              `Clock#setInterval` returned callback function
 * @return {Clock}              this
 */
Clock.prototype.clearTimer = function (timer) {
    var index = this._timerQueue.indexOf(timer);
    if (index !== -1) {
        this._timerQueue.splice(index, 1);
    }
    return this;
};

module.exports = Clock;


},{}],4:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*jshint -W079 */

'use strict';

// TODO: Dispatch should be generalized so that it can work on any Node
// not just Contexts.

var Event = require('./Event');

/**
 * The Dispatch class is used to propogate events down the
 * scene graph.
 *
 * @class Dispatch
 * @param {Scene} context The context on which it operates
 * @constructor
 */
function Dispatch (context) {

    if (!context) throw new Error('Dispatch needs to be instantiated on a node');

    this._context = context; // A reference to the context
                             // on which the dispatcher
                             // operates

    this._queue = []; // The queue is used for two purposes
                      // 1. It is used to list indicies in the
                      //    Nodes path which are then used to lookup
                      //    a node in the scene graph.
                      // 2. It is used to assist dispatching
                      //    such that it is possible to do a breadth first
                      //    traversal of the scene graph.
}

/**
 * lookupNode takes a path and returns the node at the location specified
 * by the path, if one exists. If not, it returns undefined.
 *
 * @param {String} location The location of the node specified by its path
 *
 * @return {Node | undefined} The node at the requested path
 */
Dispatch.prototype.lookupNode = function lookupNode (location) {
    if (!location) throw new Error('lookupNode must be called with a path');

    var path = this._queue;

    _splitTo(location, path);

    if (path[0] !== this._context.getSelector()) return void 0;

    var children = this._context.getChildren();
    var child;
    var i = 1;
    path[0] = this._context;

    while (i < path.length) {
        child = children[path[i]];
        path[i] = child;
        if (child) children = child.getChildren();
        else return void 0;
        i++;
    }

    return child;
};

/**
 * dispatch takes an event name and a payload and dispatches it to the
 * entire scene graph below the node that the dispatcher is on. The nodes
 * receive the events in a breadth first traversal, meaning that parents
 * have the opportunity to react to the event before children.
 *
 * @param {String} event name of the event
 * @param {Any} payload the event payload
 *
 * @return {undefined} undefined
 */
Dispatch.prototype.dispatch = function dispatch (event, payload) {
    if (!event) throw new Error('dispatch requires an event name as it\'s first argument');

    var queue = this._queue;
    var item;
    var i;
    var len;
    var children;

    queue.length = 0;
    queue.push(this._context);

    while (queue.length) {
        item = queue.shift();
        if (item.onReceive) item.onReceive(event, payload);
        children = item.getChildren();
        for (i = 0, len = children.length ; i < len ; i++) queue.push(children[i]);
    }
};

/**
 * dispatchUIevent takes a path, an event name, and a payload and dispatches them in
 * a manner anologous to DOM bubbling. It first traverses down to the node specified at
 * the path. That node receives the event first, and then every ancestor receives the event
 * until the context.
 *
 * @param {String} path the path of the node
 * @param {String} event the event name
 * @param {Any} payload the payload
 *
 * @return {undefined} undefined
 */
Dispatch.prototype.dispatchUIEvent = function dispatchUIEvent (path, event, payload) {
    if (!path) throw new Error('dispatchUIEvent needs a valid path to dispatch to');
    if (!event) throw new Error('dispatchUIEvent needs an event name as its second argument');

    var queue = this._queue;
    var node;

    Event.call(payload);
    payload.node = this.lookupNode(path); // After this call, the path is loaded into the queue
                                          // (lookUp node doesn't clear the queue after the lookup)

    while (queue.length) {
        node = queue.pop(); // pop nodes off of the queue to move up the ancestor chain.
        if (node.onReceive) node.onReceive(event, payload);
        if (payload.propagationStopped) break;
    }
};

/**
 * _splitTo is a private method which takes a path and splits it at every '/'
 * pushing the result into the supplied array. This is a destructive change.
 *
 * @private
 * @param {String} string the specified path
 * @param {Array} target the array to which the result should be written
 *
 * @return {Array} the target after having been written to
 */
function _splitTo (string, target) {
    target.length = 0; // clears the array first.
    var last = 0;
    var i;
    var len = string.length;

    for (i = 0 ; i < len ; i++) {
        if (string[i] === '/') {
            target.push(string.substring(last, i));
            last = i + 1;
        }
    }

    if (i - last > 0) target.push(string.substring(last, i));

    return target;
}

module.exports = Dispatch;

},{"./Event":5}],5:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The Event class adds the stopPropagation functionality
 * to the UIEvents within the scene graph.
 *
 * @constructor Event
 */
function Event () {
    this.propagationStopped = false;
    this.stopPropagation = stopPropagation;
}

/**
 * stopPropagation ends the bubbling of the event in the
 * scene graph.
 *
 * @method stopPropagation
 *
 * @return {undefined} undefined
 */
function stopPropagation () {
    this.propagationStopped = true;
}

module.exports = Event;


},{}],6:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Clock = require('./Clock');
var Scene = require('./Scene');
var Channel = require('./Channel');
var UIManager = require('../renderers/UIManager');
var Compositor = require('../renderers/Compositor');
var RequestAnimationFrameLoop = require('../render-loops/RequestAnimationFrameLoop');

var ENGINE_START = ['ENGINE', 'START'];
var ENGINE_STOP = ['ENGINE', 'STOP'];
var TIME_UPDATE = ['TIME', null];

/**
 * Famous has two responsibilities, one to act as the highest level
 * updater and another to send messages over to the renderers. It is
 * a singleton.
 *
 * @class FamousEngine
 * @constructor
 */
function FamousEngine() {
    var _this = this;

    this._updateQueue = []; // The updateQueue is a place where nodes
                            // can place themselves in order to be
                            // updated on the frame.

    this._nextUpdateQueue = []; // the nextUpdateQueue is used to queue
                                // updates for the next tick.
                                // this prevents infinite loops where during
                                // an update a node continuously puts itself
                                // back in the update queue.

    this._scenes = {}; // a hash of all of the scenes's that the FamousEngine
                         // is responsible for.

    this._messages = TIME_UPDATE;   // a queue of all of the draw commands to
                                    // send to the the renderers this frame.

    this._inUpdate = false; // when the famous is updating this is true.
                            // all requests for updates will get put in the
                            // nextUpdateQueue

    this._clock = new Clock(); // a clock to keep track of time for the scene
                               // graph.

    this._channel = new Channel();
    this._channel.onMessage = function (message) {
        _this.handleMessage(message);
    };
}


/**
 * An init script that initializes the FamousEngine with options
 * or default parameters.
 *
 * @method
 *
 * @param {Object} options a set of options containing a compositor and a render loop
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.init = function init(options) {
    this.compositor = options && options.compositor || new Compositor();
    this.renderLoop = options && options.renderLoop || new RequestAnimationFrameLoop();
    this.uiManager = new UIManager(this.getChannel(), this.compositor, this.renderLoop);
    return this;
};

/**
 * Sets the channel that the engine will use to communicate to
 * the renderers.
 *
 * @method
 *
 * @param {Channel} channel     The channel to be used for communicating with
 *                              the `UIManager`/ `Compositor`.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.setChannel = function setChannel(channel) {
    this._channel = channel;
    return this;
};

/**
 * Returns the channel that the engine is currently using
 * to communicate with the renderers.
 *
 * @method
 *
 * @return {Channel} channel    The channel to be used for communicating with
 *                              the `UIManager`/ `Compositor`.
 */
FamousEngine.prototype.getChannel = function getChannel () {
    return this._channel;
};

/**
 * _update is the body of the update loop. The frame consists of
 * pulling in appending the nextUpdateQueue to the currentUpdate queue
 * then moving through the updateQueue and calling onUpdate with the current
 * time on all nodes. While _update is called _inUpdate is set to true and
 * all requests to be placed in the update queue will be forwarded to the
 * nextUpdateQueue.
 *
 * @method
 *
 * @return {undefined} undefined
 */
FamousEngine.prototype._update = function _update () {
    this._inUpdate = true;
    var time = this._clock.now();
    var nextQueue = this._nextUpdateQueue;
    var queue = this._updateQueue;
    var item;

    this._messages[1] = time;

    while (nextQueue.length) queue.unshift(nextQueue.pop());

    while (queue.length) {
        item = queue.shift();
        if (item && item.onUpdate) item.onUpdate(time);
    }

    this._inUpdate = false;
};

/**
 * requestUpdates takes a class that has an onUpdate method and puts it
 * into the updateQueue to be updated at the next frame.
 * If FamousEngine is currently in an update, requestUpdate
 * passes its argument to requestUpdateOnNextTick.
 *
 * @method
 *
 * @param {Object} requester an object with an onUpdate method
 *
 * @return {undefined} undefined
 */
FamousEngine.prototype.requestUpdate = function requestUpdate (requester) {
    if (!requester)
        throw new Error(
            'requestUpdate must be called with a class to be updated'
        );

    if (this._inUpdate) this.requestUpdateOnNextTick(requester);
    else this._updateQueue.push(requester);
};

/**
 * requestUpdateOnNextTick is requests an update on the next frame.
 * If FamousEngine is not currently in an update than it is functionally equivalent
 * to requestUpdate. This method should be used to prevent infinite loops where
 * a class is updated on the frame but needs to be updated again next frame.
 *
 * @method
 *
 * @param {Object} requester an object with an onUpdate method
 *
 * @return {undefined} undefined
 */
FamousEngine.prototype.requestUpdateOnNextTick = function requestUpdateOnNextTick (requester) {
    this._nextUpdateQueue.push(requester);
};

/**
 * postMessage sends a message queue into FamousEngine to be processed.
 * These messages will be interpreted and sent into the scene graph
 * as events if necessary.
 *
 * @method
 *
 * @param {Array} messages an array of commands.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.handleMessage = function handleMessage (messages) {
    if (!messages)
        throw new Error(
            'onMessage must be called with an array of messages'
        );

    var command;

    while (messages.length > 0) {
        command = messages.shift();
        switch (command) {
            case 'WITH':
                this.handleWith(messages);
                break;
            case 'FRAME':
                this.handleFrame(messages);
                break;
            default:
                throw new Error('received unknown command: ' + command);
        }
    }
    return this;
};

/**
 * handleWith is a method that takes an array of messages following the
 * WITH command. It'll then issue the next commands to the path specified
 * by the WITH command.
 *
 * @method
 *
 * @param {Array} messages array of messages.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.handleWith = function handleWith (messages) {
    var path = messages.shift();
    var command = messages.shift();

    switch (command) {
        case 'TRIGGER': // the TRIGGER command sends a UIEvent to the specified path
            var type = messages.shift();
            var ev = messages.shift();

            this.getContext(path).getDispatch().dispatchUIEvent(path, type, ev);
            break;
        default:
            throw new Error('received unknown command: ' + command);
    }
    return this;
};

/**
 * handleFrame is called when the renderers issue a FRAME command to
 * FamousEngine. FamousEngine will then step updating the scene graph to the current time.
 *
 * @method
 *
 * @param {Array} messages array of messages.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.handleFrame = function handleFrame (messages) {
    if (!messages) throw new Error('handleFrame must be called with an array of messages');
    if (!messages.length) throw new Error('FRAME must be sent with a time');

    this.step(messages.shift());
    return this;
};

/**
 * step updates the clock and the scene graph and then sends the draw commands
 * that accumulated in the update to the renderers.
 *
 * @method
 *
 * @param {Number} time current engine time
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.step = function step (time) {
    if (time == null) throw new Error('step must be called with a time');

    this._clock.step(time);
    this._update();

    if (this._messages.length) {
        this._channel.sendMessage(this._messages);
        this._messages.length = 2;
    }

    return this;
};

/**
 * returns the context of a particular path. The context is looked up by the selector
 * portion of the path and is listed from the start of the string to the first
 * '/'.
 *
 * @method
 *
 * @param {String} selector the path to look up the context for.
 *
 * @return {Context | Undefined} the context if found, else undefined.
 */
FamousEngine.prototype.getContext = function getContext (selector) {
    if (!selector) throw new Error('getContext must be called with a selector');

    var index = selector.indexOf('/');
    selector = index === -1 ? selector : selector.substring(0, index);

    return this._scenes[selector];
};

/**
 * returns the instance of clock within famous.
 *
 * @method
 *
 * @return {Clock} FamousEngine's clock
 */
FamousEngine.prototype.getClock = function getClock () {
    return this._clock;
};

/**
 * queues a message to be transfered to the renderers.
 *
 * @method
 *
 * @param {Any} command Draw Command
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.message = function message (command) {
    this._messages.push(command);
    return this;
};

/**
 * Creates a scene under which a scene graph could be built.
 *
 * @method
 *
 * @param {String} selector a dom selector for where the scene should be placed
 *
 * @return {Scene} a new instance of Scene.
 */
FamousEngine.prototype.createScene = function createScene (selector) {
    selector = selector || 'body';

    if (this._scenes[selector]) this._scenes[selector].dismount();
    this._scenes[selector] = new Scene(selector, this);
    return this._scenes[selector];
};

/**
 * Starts the engine running in the Main-Thread.
 * This effects **every** updateable managed by the Engine.
 *
 * @method
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.startEngine = function startEngine () {
    this._channel.sendMessage(ENGINE_START);
    return this;
};

/**
 * Stops the engine running in the Main-Thread.
 * This effects **every** updateable managed by the Engine.
 *
 * @method
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.stopEngine = function stopEngine () {
    this._channel.sendMessage(ENGINE_STOP);
    return this;
};

module.exports = new FamousEngine();

},{"../render-loops/RequestAnimationFrameLoop":31,"../renderers/Compositor":32,"../renderers/UIManager":34,"./Channel":2,"./Clock":3,"./Scene":8}],7:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*jshint -W079 */

'use strict';

var Transform = require('./Transform');
var Size = require('./Size');

var TRANSFORM_PROCESSOR = new Transform();
var SIZE_PROCESSOR = new Size();

var IDENT = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

var ONES = [1, 1, 1];
var QUAT = [0, 0, 0, 1];

/**
 * Nodes define hierarchy and geometrical transformations. They can be moved
 * (translated), scaled and rotated.
 *
 * A Node is either mounted or unmounted. Unmounted nodes are detached from the
 * scene graph. Unmounted nodes have no parent node, while each mounted node has
 * exactly one parent. Nodes have an arbitary number of children, which can be
 * dynamically added using {@link Node#addChild}.
 *
 * Each Node has an arbitrary number of `components`. Those components can
 * send `draw` commands to the renderer or mutate the node itself, in which case
 * they define behavior in the most explicit way. Components that send `draw`
 * commands are considered `renderables`. From the node's perspective, there is
 * no distinction between nodes that send draw commands and nodes that define
 * behavior.
 *
 * Because of the fact that Nodes themself are very unopinioted (they don't
 * "render" to anything), they are often being subclassed in order to add e.g.
 * components at initialization to them. Because of this flexibility, they might
 * as well have been called `Entities`.
 *
 * @example
 * // create three detached (unmounted) nodes
 * var parent = new Node();
 * var child1 = new Node();
 * var child2 = new Node();
 *
 * // build an unmounted subtree (parent is still detached)
 * parent.addChild(child1);
 * parent.addChild(child2);
 *
 * // mount parent by adding it to the context
 * var context = Famous.createContext("body");
 * context.addChild(parent);
 *
 * @class Node
 * @constructor
 */
function Node () {
    this._calculatedValues = {
        transform: new Float32Array(IDENT),
        size: new Float32Array(3)
    };

    this._requestingUpdate = false;
    this._inUpdate = false;

    this._updateQueue = [];
    this._nextUpdateQueue = [];

    this._freedComponentIndicies = [];
    this._components = [];

    this._freedChildIndicies = [];
    this._children = [];

    this._parent = null;
    this._globalUpdater = null;

    this._lastEulerX = 0;
    this._lastEulerY = 0;
    this._lastEulerZ = 0;
    this._lastEuler = false;

    this.value = new Node.Spec();
}

Node.RELATIVE_SIZE = Size.RELATIVE;
Node.ABSOLUTE_SIZE = Size.ABSOLUTE;
Node.RENDER_SIZE = Size.RENDER;
Node.DEFAULT_SIZE = Size.DEFAULT;

/**
 * A Node spec holds the "data" associated with a Node.
 *
 * @class Spec
 * @constructor
 *
 * @property {String} location path to the node (e.g. "body/0/1")
 * @property {Object} showState
 * @property {Boolean} showState.mounted
 * @property {Boolean} showState.shown
 * @property {Number} showState.opacity
 * @property {Object} offsets
 * @property {Float32Array.<Number>} offsets.mountPoint
 * @property {Float32Array.<Number>} offsets.align
 * @property {Float32Array.<Number>} offsets.origin
 * @property {Object} vectors
 * @property {Float32Array.<Number>} vectors.position
 * @property {Float32Array.<Number>} vectors.rotation
 * @property {Float32Array.<Number>} vectors.scale
 * @property {Object} size
 * @property {Float32Array.<Number>} size.sizeMode
 * @property {Float32Array.<Number>} size.proportional
 * @property {Float32Array.<Number>} size.differential
 * @property {Float32Array.<Number>} size.absolute
 * @property {Float32Array.<Number>} size.render
 */
Node.Spec = function Spec () {
    this.location = null;
    this.showState = {
        mounted: false,
        shown: false,
        opacity: 1
    };
    this.offsets = {
        mountPoint: new Float32Array(3),
        align: new Float32Array(3),
        origin: new Float32Array(3)
    };
    this.vectors = {
        position: new Float32Array(3),
        rotation: new Float32Array(QUAT),
        scale: new Float32Array(ONES)
    };
    this.size = {
        sizeMode: new Float32Array([Size.RELATIVE, Size.RELATIVE, Size.RELATIVE]),
        proportional: new Float32Array(ONES),
        differential: new Float32Array(3),
        absolute: new Float32Array(3),
        render: new Float32Array(3)
    };
    this.UIEvents = [];
};

/**
 * Determine the node's location in the scene graph hierarchy.
 * A location of `body/0/1` can be interpreted as the following scene graph
 * hierarchy (ignoring siblings of ancestors and additional child nodes):
 *
 * `Context:body` -> `Node:0` -> `Node:1`, where `Node:1` is the node the
 * `getLocation` method has been invoked on.
 *
 * @method getLocation
 *
 * @return {String} location (path), e.g. `body/0/1`
 */
Node.prototype.getLocation = function getLocation () {
    return this.value.location;
};

/**
 * @alias getId
 *
 * @return {String} the path of the Node
 */
Node.prototype.getId = Node.prototype.getLocation;

/**
 * Globally dispatches the event using the Scene's Dispatch. All nodes will
 * receive the dispatched event.
 *
 * @method emit
 *
 * @param  {String} event   Event type.
 * @param  {Object} payload Event object to be dispatched.
 *
 * @return {Node} this
 */
Node.prototype.emit = function emit (event, payload) {
    var current = this;

    while (current !== current.getParent()) {
        current = current.getParent();
    }

    current.getDispatch().dispatch(event, payload);
    return this;
};

// THIS WILL BE DEPRECATED
Node.prototype.sendDrawCommand = function sendDrawCommand (message) {
    this._globalUpdater.message(message);
    return this;
};

/**
 * Recursively serializes the Node, including all previously added components.
 *
 * @method getValue
 *
 * @return {Object}     Serialized representation of the node, including
 *                      components.
 */
Node.prototype.getValue = function getValue () {
    var numberOfChildren = this._children.length;
    var numberOfComponents = this._components.length;
    var i = 0;

    var value = {
        location: this.value.location,
        spec: this.value,
        components: new Array(numberOfComponents),
        children: new Array(numberOfChildren)
    };

    for (; i < numberOfChildren ; i++)
        if (this._children[i] && this._children[i].getValue)
            value.children[i] = this._children[i].getValue();

    for (i = 0 ; i < numberOfComponents ; i++)
        if (this._components[i] && this._components[i].getValue)
            value.components[i] = this._components[i].getValue();

    return value;
};

/**
 * Similar to {@link Node#getValue}, but returns the actual "computed" value. E.g.
 * a proportional size of 0.5 might resolve into a "computed" size of 200px
 * (assuming the parent has a width of 400px).
 *
 * @method getComputedValue
 *
 * @return {Object}     Serialized representation of the node, including
 *                      children, excluding components.
 */
Node.prototype.getComputedValue = function getComputedValue () {
    var numberOfChildren = this._children.length;

    var value = {
        location: this.value.location,
        computedValues: this._calculatedValues,
        children: new Array(numberOfChildren)
    };

    for (var i = 0 ; i < numberOfChildren ; i++)
        value.children[i] = this._children[i].getComputedValue();

    return value;
};

/**
 * Retrieves all children of the current node.
 *
 * @method getChildren
 *
 * @return {Array.<Node>}   An array of children.
 */
Node.prototype.getChildren = function getChildren () {
    return this._children;
};

/**
 * Retrieves the parent of the current node. Unmounted nodes do not have a
 * parent node.
 *
 * @method getParent
 *
 * @return {Node}       Parent node.
 */
Node.prototype.getParent = function getParent () {
    return this._parent;
};

/**
 * Schedules the {@link Node#update} function of the node to be invoked on the
 * next frame (if no update during this frame has been scheduled already).
 * If the node is currently being updated (which means one of the requesters
 * invoked requestsUpdate while being updated itself), an update will be
 * scheduled on the next frame.
 *
 * @method requestUpdate
 *
 * @param  {Object} requester   If the requester has an `onUpdate` method, it
 *                              will be invoked during the next update phase of
 *                              the node.
 *
 * @return {Node} this
 */
Node.prototype.requestUpdate = function requestUpdate (requester) {
    if (this._inUpdate || !this.isMounted())
        return this.requestUpdateOnNextTick(requester);
    this._updateQueue.push(requester);
    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};

/**
 * Schedules an update on the next tick. Similarily to
 * {@link Node#requestUpdate}, `requestUpdateOnNextTick` schedules the node's
 * `onUpdate` function to be invoked on the frame after the next invocation on
 * the node's onUpdate function.
 *
 * @method requestUpdateOnNextTick
 *
 * @param  {Object} requester   If the requester has an `onUpdate` method, it
 *                              will be invoked during the next update phase of
 *                              the node.
 *
 * @return {Node} this
 */
Node.prototype.requestUpdateOnNextTick = function requestUpdateOnNextTick (requester) {
    this._nextUpdateQueue.push(requester);
    return this;
};

/**
 * Get the object responsible for updating this node.
 *
 * @method
 *
 * @return {Object} The global updater.
 */
Node.prototype.getUpdater = function getUpdater () {
    return this._globalUpdater;
};

/**
 * Checks if the node is mounted. Unmounted nodes are detached from the scene
 * graph.
 *
 * @method isMounted
 *
 * @return {Boolean}    Boolean indicating whether the node is mounted or not.
 */
Node.prototype.isMounted = function isMounted () {
    return this.value.showState.mounted;
};

/**
 * Checks if the node is visible ("shown").
 *
 * @method isShown
 *
 * @return {Boolean}    Boolean indicating whether the node is visible
 *                      ("shown") or not.
 */
Node.prototype.isShown = function isShown () {
    return this.value.showState.shown;
};

/**
 * Determines the node's relative opacity.
 * The opacity needs to be within [0, 1], where 0 indicates a completely
 * transparent, therefore invisible node, whereas an opacity of 1 means the
 * node is completely solid.
 *
 * @method getOpacity
 *
 * @return {Number}         Relative opacity of the node.
 */
Node.prototype.getOpacity = function getOpacity () {
    return this.value.showState.opacity;
};

/**
 * Determines the node's previously set mount point.
 *
 * @method getMountPoint
 *
 * @return {Float32Array}   An array representing the mount point.
 */
Node.prototype.getMountPoint = function getMountPoint () {
    return this.value.offsets.mountPoint;
};

/**
 * Determines the node's previously set align.
 *
 * @method getAlign
 *
 * @return {Float32Array}   An array representing the align.
 */
Node.prototype.getAlign = function getAlign () {
    return this.value.offsets.align;
};

/**
 * Determines the node's previously set origin.
 *
 * @method getOrigin
 *
 * @return {Float32Array}   An array representing the origin.
 */
Node.prototype.getOrigin = function getOrigin () {
    return this.value.offsets.origin;
};

/**
 * Determines the node's previously set position.
 *
 * @method getPosition
 *
 * @return {Float32Array}   An array representing the position.
 */
Node.prototype.getPosition = function getPosition () {
    return this.value.vectors.position;
};

/**
 * Returns the node's current rotation
 *
 * @method getRotation
 *
 * @return {Float32Array} an array of four values, showing the rotation as a quaternion
 */
Node.prototype.getRotation = function getRotation () {
    return this.value.vectors.rotation;
};

/**
 * Returns the scale of the node
 *
 * @method
 *
 * @return {Float32Array} an array showing the current scale vector
 */
Node.prototype.getScale = function getScale () {
    return this.value.vectors.scale;
};

/**
 * Returns the current size mode of the node
 *
 * @method
 *
 * @return {Float32Array} an array of numbers showing the current size mode
 */
Node.prototype.getSizeMode = function getSizeMode () {
    return this.value.size.sizeMode;
};

/**
 * Returns the current proportional size
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current proportional size
 */
Node.prototype.getProportionalSize = function getProportionalSize () {
    return this.value.size.proportional;
};

/**
 * Returns the differential size of the node
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current differential size
 */
Node.prototype.getDifferentialSize = function getDifferentialSize () {
    return this.value.size.differential;
};

/**
 * Returns the absolute size of the node
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current absolute size of the node
 */
Node.prototype.getAbsoluteSize = function getAbsoluteSize () {
    return this.value.size.absolute;
};

/**
 * Returns the current Render Size of the node. Note that the render size
 * is asynchronous (will always be one frame behind) and needs to be explicitely
 * calculated by setting the proper size mode.
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current render size
 */
Node.prototype.getRenderSize = function getRenderSize () {
    return this.value.size.render;
};

/**
 * Returns the external size of the node
 *
 * @method
 *
 * @return {Float32Array} a vector 3 of the final calculated side of the node
 */
Node.prototype.getSize = function getSize () {
    return this._calculatedValues.size;
};

/**
 * Returns the current world transform of the node
 *
 * @method
 *
 * @return {Float32Array} a 16 value transform
 */
Node.prototype.getTransform = function getTransform () {
    return this._calculatedValues.transform;
};

/**
 * Get the list of the UI Events that are currently associated with this node
 *
 * @method
 *
 * @return {Array} an array of strings representing the current subscribed UI event of this node
 */
Node.prototype.getUIEvents = function getUIEvents () {
    return this.value.UIEvents;
};

/**
 * Adds a new child to this node. If this method is called with no argument it will
 * create a new node, however it can also be called with an existing node which it will
 * append to the node that this method is being called on. Returns the new or passed in node.
 *
 * @method
 *
 * @param {Node | void} child the node to appended or no node to create a new node.
 *
 * @return {Node} the appended node.
 */
Node.prototype.addChild = function addChild (child) {
    var index = child ? this._children.indexOf(child) : -1;
    child = child ? child : new Node();

    if (index === -1) {
        index = this._freedChildIndicies.length ? this._freedChildIndicies.pop() : this._children.length;
        this._children[index] = child;

        if (this.isMounted() && child.onMount) {
            var myId = this.getId();
            var childId = myId + '/' + index;
            child.onMount(this, childId);
        }

    }

    return child;
};

/**
 * Removes a child node from another node. The passed in node must be
 * a child of the node that this method is called upon.
 *
 * @method
 *
 * @param {Node} child node to be removed
 *
 * @return {Boolean} whether or not the node was successfully removed
 */
Node.prototype.removeChild = function removeChild (child) {
    var index = this._children.indexOf(child);
    var added = index !== -1;
    if (added) {
        this._freedChildIndicies.push(index);

        this._children[index] = null;

        if (this.isMounted() && child.onDismount)
            child.onDismount();
    }
    return added;
};

/**
 * Each component can only be added once per node.
 *
 * @method addComponent
 *
 * @param {Object} component    A component to be added.
 * @return {Number} index       The index at which the component has been
 *                              registered. Indices aren't necessarily
 *                              consecutive.
 */
Node.prototype.addComponent = function addComponent (component) {
    var index = this._components.indexOf(component);
    if (index === -1) {
        index = this._freedComponentIndicies.length ? this._freedComponentIndicies.pop() : this._components.length;
        this._components[index] = component;

        if (this.isMounted() && component.onMount)
            component.onMount(this, index);

        if (this.isShown() && component.onShow)
            component.onShow();
    }

    return index;
};

/**
 * @method  getComponent
 *
 * @param  {Number} index   Index at which the component has been registered
 *                          (using `Node#addComponent`).
 * @return {*}              The component registered at the passed in index (if
 *                          any).
 */
Node.prototype.getComponent = function getComponent (index) {
    return this._components[index];
};

/**
 * Removes a previously via {@link Node#addComponent} added component.
 *
 * @method removeComponent
 *
 * @param  {Object} component   An component that has previously been added
 *                              using {@link Node#addComponent}.
 *
 * @return {Node} this
 */
Node.prototype.removeComponent = function removeComponent (component) {
    var index = this._components.indexOf(component);
    if (index !== -1) {
        this._freedComponentIndicies.push(index);
        if (this.isShown() && component.onHide)
            component.onHide();

        if (this.isMounted() && component.onDismount)
            component.onDismount();

        this._components[index] = null;
    }
    return component;
};

/**
 * Subscribes a node to a UI Event. All components on the node
 * will have the opportunity to begin listening to that event
 * and alerting the scene graph.
 *
 * @method
 *
 * @param {String} eventName the name of the event
 *
 * @return {undefined} undefined
 */
Node.prototype.addUIEvent = function addUIEvent (eventName) {
    var UIEvents = this.getUIEvents();
    var components = this._components;
    var component;

    var added = UIEvents.indexOf(eventName) !== -1;
    if (!added) {
        UIEvents.push(eventName);
        for (var i = 0, len = components.length ; i < len ; i++) {
            component = components[i];
            if (component && component.onAddUIEvent) component.onAddUIEvent(eventName);
        }
    }
};

/**
 * Private method for the Node to request an update for itself.
 *
 * @method
 * @private
 *
 * @param {Boolean} force whether or not to force the update
 *
 * @return {undefined} undefined
 */
Node.prototype._requestUpdate = function _requestUpdate (force) {
    if (force || (!this._requestingUpdate && this._globalUpdater)) {
        this._globalUpdater.requestUpdate(this);
        this._requestingUpdate = true;
    }
};

/**
 * Private method to set an optional value in an array, and
 * request an update if this changes the value of the array.
 *
 * @method
 *
 * @param {Array} vec the array to insert the value into
 * @param {Number} index the index at which to insert the value
 * @param {Any} val the value to potentially insert (if not null or undefined)
 *
 * @return {Boolean} whether or not a new value was inserted.
 */
Node.prototype._vecOptionalSet = function _vecOptionalSet (vec, index, val) {
    if (val != null && vec[index] !== val) {
        vec[index] = val;
        if (!this._requestingUpdate) this._requestUpdate();
        return true;
    }
    return false;
};

/**
 * Shows the node, which is to say, calls onShow on all of the
 * node's components. Renderable components can then issue the
 * draw commands necessary to be shown.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.show = function show () {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    this.value.showState.shown = true;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onShow) item.onShow();
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentShow) item.onParentShow();
    }
    return this;
};

/**
 * Hides the node, which is to say, calls onHide on all of the
 * node's components. Renderable components can then issue
 * the draw commands necessary to be hidden
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.hide = function hide () {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    this.value.showState.shown = false;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onHide) item.onHide();
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentHide) item.onParentHide();
    }
    return this;
};

/**
 * Sets the align value of the node. Will call onAlignChange
 * on all of the Node's components.
 *
 * @method
 *
 * @param {Number} x Align value in the x dimension.
 * @param {Number} y Align value in the y dimension.
 * @param {Number} z Align value in the z dimension.
 *
 * @return {Node} this
 */
Node.prototype.setAlign = function setAlign (x, y, z) {
    var vec3 = this.value.offsets.align;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    if (z != null) propogate = this._vecOptionalSet(vec3, 2, (z - 0.5)) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onAlignChange) item.onAlignChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the mount point value of the node. Will call onMountPointChange
 * on all of the node's components.
 *
 * @method
 *
 * @param {Number} x MountPoint value in x dimension
 * @param {Number} y MountPoint value in y dimension
 * @param {Number} z MountPoint value in z dimension
 *
 * @return {Node} this
 */
Node.prototype.setMountPoint = function setMountPoint (x, y, z) {
    var vec3 = this.value.offsets.mountPoint;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    if (z != null) propogate = this._vecOptionalSet(vec3, 2, (z - 0.5)) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onMountPointChange) item.onMountPointChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the origin value of the node. Will call onOriginChange
 * on all of the node's components.
 *
 * @method
 *
 * @param {Number} x Origin value in x dimension
 * @param {Number} y Origin value in y dimension
 * @param {Number} z Origin value in z dimension
 *
 * @return {Node} this
 */
Node.prototype.setOrigin = function setOrigin (x, y, z) {
    var vec3 = this.value.offsets.origin;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    if (z != null) propogate = this._vecOptionalSet(vec3, 2, (z - 0.5)) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onOriginChange) item.onOriginChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the position of the node. Will call onPositionChange
 * on all of the node's components.
 *
 * @method
 *
 * @param {Number} x Position in x
 * @param {Number} y Position in y
 * @param {Number} z Position in z
 *
 * @return {Node} this
 */
Node.prototype.setPosition = function setPosition (x, y, z) {
    var vec3 = this.value.vectors.position;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onPositionChange) item.onPositionChange(x, y, z);
        }
    }

    return this;
};

/**
 * Sets the rotation of the node. Will call onRotationChange
 * on all of the node's components. This method takes either
 * Euler angles or a quaternion. If the fourth argument is undefined
 * Euler angles are assumed.
 *
 * @method
 *
 * @param {Number} x Either the rotation around the x axis or the magnitude in x of the axis of rotation.
 * @param {Number} y Either the rotation around the y axis or the magnitude in y of the axis of rotation.
 * @param {Number} z Either the rotation around the z axis or the magnitude in z of the axis of rotation.
 * @param {Number|undefined} w the amount of rotation around the axis of rotation, if a quaternion is specified.
 *
 * @return {Node} this
 */
Node.prototype.setRotation = function setRotation (x, y, z, w) {
    var quat = this.value.vectors.rotation;
    var propogate = false;
    var qx, qy, qz, qw;

    if (w != null) {
        qx = x;
        qy = y;
        qz = z;
        qw = w;
        this._lastEulerX = null;
        this._lastEulerY = null;
        this._lastEulerZ = null;
        this._lastEuler = false;
    }
    else {
        if (x == null || y == null || z == null) {
            if (this._lastEuler) {
                x = x == null ? this._lastEulerX : x;
                y = y == null ? this._lastEulerY : y;
                z = z == null ? this._lastEulerZ : z;
            }
            else {
                var sp = -2 * (quat[1] * quat[2] - quat[3] * quat[0]);

                if (Math.abs(sp) > 0.99999) {
                    y = y == null ? Math.PI * 0.5 * sp : y;
                    x = x == null ? Math.atan2(-quat[0] * quat[2] + quat[3] * quat[1], 0.5 - quat[1] * quat[1] - quat[2] * quat[2]) : x;
                    z = z == null ? 0 : z;
                }
                else {
                    y = y == null ? Math.asin(sp) : y;
                    x = x == null ? Math.atan2(quat[0] * quat[2] + quat[3] * quat[1], 0.5 - quat[0] * quat[0] - quat[1] * quat[1]) : x;
                    z = z == null ? Math.atan2(quat[0] * quat[1] + quat[3] * quat[2], 0.5 - quat[0] * quat[0] - quat[2] * quat[2]) : z;
                }
            }
        }

        var hx = x * 0.5;
        var hy = y * 0.5;
        var hz = z * 0.5;

        var sx = Math.sin(hx);
        var sy = Math.sin(hy);
        var sz = Math.sin(hz);
        var cx = Math.cos(hx);
        var cy = Math.cos(hy);
        var cz = Math.cos(hz);

        var sysz = sy * sz;
        var cysz = cy * sz;
        var sycz = sy * cz;
        var cycz = cy * cz;

        qx = sx * cycz + cx * sysz;
        qy = cx * sycz - sx * cysz;
        qz = cx * cysz + sx * sycz;
        qw = cx * cycz - sx * sysz;

        this._lastEuler = true;
        this._lastEulerX = x;
        this._lastEulerY = y;
        this._lastEulerZ = z;
    }

    propogate = this._vecOptionalSet(quat, 0, qx) || propogate;
    propogate = this._vecOptionalSet(quat, 1, qy) || propogate;
    propogate = this._vecOptionalSet(quat, 2, qz) || propogate;
    propogate = this._vecOptionalSet(quat, 3, qw) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = quat[0];
        y = quat[1];
        z = quat[2];
        w = quat[3];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onRotationChange) item.onRotationChange(x, y, z, w);
        }
    }
    return this;
};

/**
 * Sets the scale of the node. The default value is 1 in all dimensions.
 * The node's components will have onScaleChanged called on them.
 *
 * @method
 *
 * @param {Number} x Scale value in x
 * @param {Number} y Scale value in y
 * @param {Number} z Scale value in z
 *
 * @return {Node} this
 */
Node.prototype.setScale = function setScale (x, y, z) {
    var vec3 = this.value.vectors.scale;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onScaleChange) item.onScaleChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the value of the opacity of this node. All of the node's
 * components will have onOpacityChange called on them/
 *
 * @method
 *
 * @param {Number} val Value of the opacity. 1 is the default.
 *
 * @return {Node} this
 */
Node.prototype.setOpacity = function setOpacity (val) {
    if (val !== this.value.showState.opacity) {
        this.value.showState.opacity = val;
        if (!this._requestingUpdate) this._requestUpdate();

        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onOpacityChange) item.onOpacityChange(val);
        }
    }
    return this;
};

/**
 * Sets the size mode being used for determining the node's final width, height
 * and depth.
 * Size modes are a way to define the way the node's size is being calculated.
 * Size modes are enums set on the {@link Size} constructor (and aliased on
 * the Node).
 *
 * @example
 * node.setSizeMode(Node.RELATIVE_SIZE, Node.ABSOLUTE_SIZE, Node.ABSOLUTE_SIZE);
 * // Instead of null, any proportional height or depth can be passed in, since
 * // it would be ignored in any case.
 * node.setProportionalSize(0.5, null, null);
 * node.setAbsoluteSize(null, 100, 200);
 *
 * @method setSizeMode
 *
 * @param {SizeMode} x    The size mode being used for determining the size in
 *                        x direction ("width").
 * @param {SizeMode} y    The size mode being used for determining the size in
 *                        y direction ("height").
 * @param {SizeMode} z    The size mode being used for determining the size in
 *                        z direction ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setSizeMode = function setSizeMode (x, y, z) {
    var vec3 = this.value.size.sizeMode;
    var propogate = false;

    if (x != null) propogate = this._resolveSizeMode(vec3, 0, x) || propogate;
    if (y != null) propogate = this._resolveSizeMode(vec3, 1, y) || propogate;
    if (z != null) propogate = this._resolveSizeMode(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onSizeModeChange) item.onSizeModeChange(x, y, z);
        }
    }
    return this;
};

/**
 * A protected method that resolves string representations of size mode
 * to numeric values and applies them.
 *
 * @method
 *
 * @param {Array} vec the array to write size mode to
 * @param {Number} index the index to write to in the array
 * @param {String|Number} val the value to write
 *
 * @return {Bool} whether or not the sizemode has been changed for this index.
 */
Node.prototype._resolveSizeMode = function _resolveSizeMode (vec, index, val) {
    if (val.constructor === String) {
        switch (val.toLowerCase()) {
            case 'relative':
            case 'default':
                return this._vecOptionalSet(vec, index, 0);
            case 'absolute':
                return this._vecOptionalSet(vec, index, 1);
            case 'render':
                return this._vecOptionalSet(vec, index, 2);
            default: throw new Error('unknown size mode: ' + val);
        }
    }
    else return this._vecOptionalSet(vec, index, val);
};

/**
 * A proportional size defines the node's dimensions relative to its parents
 * final size.
 * Proportional sizes need to be within the range of [0, 1].
 *
 * @method setProportionalSize
 *
 * @param {Number} x    x-Size in pixels ("width").
 * @param {Number} y    y-Size in pixels ("height").
 * @param {Number} z    z-Size in pixels ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setProportionalSize = function setProportionalSize (x, y, z) {
    var vec3 = this.value.size.proportional;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onProportionalSizeChange) item.onProportionalSizeChange(x, y, z);
        }
    }
    return this;
};

/**
 * Differential sizing can be used to add or subtract an absolute size from an
 * otherwise proportionally sized node.
 * E.g. a differential width of `-10` and a proportional width of `0.5` is
 * being interpreted as setting the node's size to 50% of its parent's width
 * *minus* 10 pixels.
 *
 * @method setDifferentialSize
 *
 * @param {Number} x    x-Size to be added to the relatively sized node in
 *                      pixels ("width").
 * @param {Number} y    y-Size to be added to the relatively sized node in
 *                      pixels ("height").
 * @param {Number} z    z-Size to be added to the relatively sized node in
 *                      pixels ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setDifferentialSize = function setDifferentialSize (x, y, z) {
    var vec3 = this.value.size.differential;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onDifferentialSizeChange) item.onDifferentialSizeChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the node's size in pixels, independent of its parent.
 *
 * @method setAbsoluteSize
 *
 * @param {Number} x    x-Size in pixels ("width").
 * @param {Number} y    y-Size in pixels ("height").
 * @param {Number} z    z-Size in pixels ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setAbsoluteSize = function setAbsoluteSize (x, y, z) {
    var vec3 = this.value.size.absolute;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onAbsoluteSizeChange) item.onAbsoluteSizeChange(x, y, z);
        }
    }
    return this;
};

/**
 * Private method for alerting all components and children that
 * this node's transform has changed.
 *
 * @method
 *
 * @param {Float32Array} transform The transform that has changed
 *
 * @return {undefined} undefined
 */
Node.prototype._transformChanged = function _transformChanged (transform) {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onTransformChange) item.onTransformChange(transform);
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentTransformChange) item.onParentTransformChange(transform);
    }
};

/**
 * Private method for alerting all components and children that
 * this node's size has changed.
 *
 * @method
 *
 * @param {Float32Array} size the size that has changed
 *
 * @return {undefined} undefined
 */
Node.prototype._sizeChanged = function _sizeChanged (size) {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onSizeChange) item.onSizeChange(size);
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentSizeChange) item.onParentSizeChange(size);
    }
};

/**
 * Method for getting the current frame. Will be deprecated.
 *
 * @method
 *
 * @return {Number} current frame
 */
Node.prototype.getFrame = function getFrame () {
    return this._globalUpdater.getFrame();
};

/**
 * returns an array of the components currently attached to this
 * node.
 *
 * @method getComponents
 *
 * @return {Array} list of components.
 */
Node.prototype.getComponents = function getComponents () {
    return this._components;
};

/**
 * Enters the node's update phase while updating its own spec and updating its components.
 *
 * @method update
 *
 * @param  {Number} time    high-resolution timestamp, usually retrieved using
 *                          requestAnimationFrame
 *
 * @return {Node} this
 */
Node.prototype.update = function update (time){
    this._inUpdate = true;
    var nextQueue = this._nextUpdateQueue;
    var queue = this._updateQueue;
    var item;

    while (nextQueue.length) queue.unshift(nextQueue.pop());

    while (queue.length) {
        item = this._components[queue.shift()];
        if (item && item.onUpdate) item.onUpdate(time);
    }

    var mySize = this.getSize();
    var myTransform = this.getTransform();
    var parent = this.getParent();
    var parentSize = parent.getSize();
    var parentTransform = parent.getTransform();
    var sizeChanged = SIZE_PROCESSOR.fromSpecWithParent(parentSize, this, mySize);

    var transformChanged = TRANSFORM_PROCESSOR.fromSpecWithParent(parentTransform, this.value, mySize, parentSize, myTransform);
    if (transformChanged) this._transformChanged(myTransform);
    if (sizeChanged) this._sizeChanged(mySize);

    this._inUpdate = false;
    this._requestingUpdate = false;

    if (!this.isMounted()) {
        // last update
        this._parent = null;
        this.value.location = null;
        this._globalUpdater = null;
    }
    else if (this._nextUpdateQueue.length) {
        this._globalUpdater.requestUpdateOnNextTick(this);
        this._requestingUpdate = true;
    }
    return this;
};

/**
 * Mounts the node and therefore its subtree by setting it as a child of the
 * passed in parent.
 *
 * @method mount
 *
 * @param  {Node} parent    parent node
 * @param  {String} myId    path to node (e.g. `body/0/1`)
 *
 * @return {Node} this
 */
Node.prototype.mount = function mount (parent, myId) {
    if (this.isMounted()) return this;
    var i = 0;
    var list = this._components;
    var len = list.length;
    var item;

    this._parent = parent;
    this._globalUpdater = parent.getUpdater();
    this.value.location = myId;
    this.value.showState.mounted = true;

    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onMount) item.onMount(this, i);
    }

    i = 0;
    list = this._children;
    len = list.length;
    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onParentMount) item.onParentMount(this, myId, i);
    }

    if (!this._requestingUpdate) this._requestUpdate(true);
    return this;
};

/**
 * Dismounts (detaches) the node from the scene graph by removing it as a
 * child of its parent.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.dismount = function dismount () {
    if (!this.isMounted()) return this;
    var i = 0;
    var list = this._components;
    var len = list.length;
    var item;

    this.value.showState.mounted = false;

    this._parent.removeChild(this);

    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onDismount) item.onDismount();
    }

    i = 0;
    list = this._children;
    len = list.length;
    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onParentDismount) item.onParentDismount();
    }

    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};

/**
 * Function to be invoked by the parent as soon as the parent is
 * being mounted.
 *
 * @method onParentMount
 *
 * @param  {Node} parent        The parent node.
 * @param  {String} parentId    The parent id (path to parent).
 * @param  {Number} index       Id the node should be mounted to.
 *
 * @return {Node} this
 */
Node.prototype.onParentMount = function onParentMount (parent, parentId, index) {
    return this.mount(parent, parentId + '/' + index);
};

/**
 * Function to be invoked by the parent as soon as the parent is being
 * unmounted.
 *
 * @method onParentDismount
 *
 * @return {Node} this
 */
Node.prototype.onParentDismount = function onParentDismount () {
    return this.dismount();
};

/**
 * Method to be called in order to dispatch an event to the node and all its
 * components. Note that this doesn't recurse the subtree.
 *
 * @method receive
 *
 * @param  {String} type   The event type (e.g. "click").
 * @param  {Object} ev     The event payload object to be dispatched.
 *
 * @return {Node} this
 */
Node.prototype.receive = function receive (type, ev) {
    var i = 0;
    var list = this._components;
    var len = list.length;
    var item;
    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onReceive) item.onReceive(type, ev);
    }
    return this;
};


/**
 * Private method to avoid accidentally passing arguments
 * to update events.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Node.prototype._requestUpdateWithoutArgs = function _requestUpdateWithoutArgs () {
    if (!this._requestingUpdate) this._requestUpdate();
};

/**
 * A method to execute logic on update. Defaults to the
 * node's .update method.
 *
 * @method
 *
 * @param {Number} current time
 *
 * @return {undefined} undefined
 */
Node.prototype.onUpdate = Node.prototype.update;

/**
 * A method to execute logic when a parent node is shown. Delegates
 * to Node.show.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onParentShow = Node.prototype.show;

/**
 * A method to execute logic when the parent is hidden. Delegates
 * to Node.hide.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onParentHide = Node.prototype.hide;

/**
 * A method to execute logic when the parent transform changes.
 * Delegates to Node._requestUpdateWithoutArgs.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Node.prototype.onParentTransformChange = Node.prototype._requestUpdateWithoutArgs;

/**
 * A method to execute logic when the parent size changes.
 * Delegates to Node._requestUpdateWIthoutArgs.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Node.prototype.onParentSizeChange = Node.prototype._requestUpdateWithoutArgs;

/**
 * A method to execute logic when the node something wants
 * to show the node. Delegates to Node.show.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onShow = Node.prototype.show;

/**
 * A method to execute logic when something wants to hide this
 * node. Delegates to Node.hide.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onHide = Node.prototype.hide;

/**
 * A method which can execute logic when this node is added to
 * to the scene graph. Delegates to mount.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onMount = Node.prototype.mount;

/**
 * A method which can execute logic when this node is removed from
 * the scene graph. Delegates to Node.dismount.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onDismount = Node.prototype.dismount;

/**
 * A method which can execute logic when this node receives
 * an event from the scene graph. Delegates to Node.receive.
 *
 * @method
 *
 * @param {String} event name
 * @param {Object} payload
 *
 * @return {undefined} undefined
 */
Node.prototype.onReceive = Node.prototype.receive;

module.exports = Node;

},{"./Size":9,"./Transform":10}],8:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*jshint -W079 */

'use strict';

var Dispatch = require('./Dispatch');
var Node = require('./Node');
var Size = require('./Size');

/**
 * Scene is the bottom of the scene graph. It is its own
 * parent and provides the global updater to the scene graph.
 *
 * @class Scene
 * @constructor
 *
 * @param {String} selector a string which is a dom selector
 *                 signifying which dom element the context
 *                 should be set upon
 * @param {Famous} updater a class which conforms to Famous' interface
 *                 it needs to be able to send methods to
 *                 the renderers and update nodes in the scene graph
 */
function Scene (selector, updater) {
    if (!selector) throw new Error('Scene needs to be created with a DOM selector');
    if (!updater) throw new Error('Scene needs to be created with a class like Famous');

    Node.call(this);         // Scene inherits from node

    this._updater = updater; // The updater that will both
                             // send messages to the renderers
                             // and update dirty nodes

    this._dispatch = new Dispatch(this); // instantiates a dispatcher
                                         // to send events to the scene
                                         // graph below this context

    this._selector = selector; // reference to the DOM selector
                               // that represents the element
                               // in the dom that this context
                               // inhabits

    this.onMount(this, selector); // Mount the context to itself
                                  // (it is its own parent)

    this._updater                  // message a request for the dom
        .message('NEED_SIZE_FOR')  // size of the context so that
        .message(selector);        // the scene graph has a total size

    this.show(); // the context begins shown (it's already present in the dom)

}

// Scene inherits from node
Scene.prototype = Object.create(Node.prototype);
Scene.prototype.constructor = Scene;

/**
 * Scene getUpdater function returns the passed in updater
 *
 * @return {Famous} the updater for this Scene
 */
Scene.prototype.getUpdater = function getUpdater () {
    return this._updater;
};

/**
 * Returns the selector that the context was instantiated with
 *
 * @return {String} dom selector
 */
Scene.prototype.getSelector = function getSelector () {
    return this._selector;
};

/**
 * Returns the dispatcher of the context. Used to send events
 * to the nodes in the scene graph.
 *
 * @return {Dispatch} the Scene's Dispatch
 */
Scene.prototype.getDispatch = function getDispatch () {
    return this._dispatch;
};

/**
 * Receives an event. If the event is 'CONTEXT_RESIZE' it sets the size of the scene
 * graph to the payload, which must be an array of numbers of at least
 * length three representing the pixel size in 3 dimensions.
 *
 * @param {String} event the name of the event being received
 * @param {*} payload the object being sent
 *
 * @return {undefined} undefined
 */
Scene.prototype.onReceive = function onReceive (event, payload) {
    // TODO: In the future the dom element that the context is attached to
    // should have a representation as a component. It would be render sized
    // and the context would receive its size the same way that any render size
    // component receives its size.
    if (event === 'CONTEXT_RESIZE') {

        if (payload.length < 2)
            throw new Error(
                    'CONTEXT_RESIZE\'s payload needs to be at least a pair' +
                    ' of pixel sizes'
            );

        this.setSizeMode(Size.ABSOLUTE, Size.ABSOLUTE, Size.ABSOLUTE);
        this.setAbsoluteSize(payload[0],
                             payload[1],
                             payload[2] ? payload[2] : 0);

    }
};

module.exports = Scene;


},{"./Dispatch":4,"./Node":7,"./Size":9}],9:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The Size class is responsible for processing Size from a node
 * @constructor Size
 */
function Size () {
    this._size = new Float32Array(3);
}

// an enumeration of the different types of size modes
Size.RELATIVE = 0;
Size.ABSOLUTE = 1;
Size.RENDER = 2;
Size.DEFAULT = Size.RELATIVE;

/**
 * fromSpecWithParent takes the parent node's size, the target node's spec,
 * and a target array to write to. Using the node's size mode it calculates
 * a final size for the node from the node's spec. Returns whether or not
 * the final size has changed from its last value.
 *
 * @param {Array} parentSize parent node's calculated size
 * @param {Node.Spec} node the target node's spec
 * @param {Array} target an array to write the result to
 *
 * @return {Boolean} true if the size of the node has changed.
 */
Size.prototype.fromSpecWithParent = function fromSpecWithParent (parentSize, node, target) {
    var spec = node.getValue().spec;
    var components = node.getComponents();
    var mode = spec.size.sizeMode;
    var prev;
    var changed = false;
    var len = components.length;
    var j;
    for (var i = 0 ; i < 3 ; i++) {
        switch (mode[i]) {
            case Size.RELATIVE:
                prev = target[i];
                target[i] = parentSize[i] * spec.size.proportional[i] + spec.size.differential[i];
                break;
            case Size.ABSOLUTE:
                prev = target[i];
                target[i] = spec.size.absolute[i];
                break;
            case Size.RENDER:
                var candidate;
                var component;
                for (j = 0; j < len ; j++) {
                    component = components[j];
                    if (component && component.getRenderSize) {
                        candidate = component.getRenderSize()[i];
                        prev = target[i];
                        target[i] = target[i] < candidate || target[i] === 0 ? candidate : target[i];
                    }
                }
                break;
        }
        changed = changed || prev !== target[i];
    }
    return changed;
};

module.exports = Size;

},{}],10:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The transform class is responsible for calculating the transform of a particular
 * node from the data on the node and its parent
 *
 * @constructor Transform
 */
function Transform () {
    this._matrix = new Float32Array(16);
}

/**
 * Returns the last calculated transform
 *
 * @return {Array} a transform
 */
Transform.prototype.get = function get () {
    return this._matrix;
};

/**
 * Uses the parent transform, the node's spec, the node's size, and the parent's size
 * to calculate a final transform for the node. Returns true if the transform has changed.
 *
 * @param {Array} parentMatrix the parent matrix
 * @param {Node.Spec} spec the target node's spec
 * @param {Array} mySize the size of the node
 * @param {Array} parentSize the size of the parent
 * @param {Array} target the target array to write the resulting transform to
 *
 * @return {Boolean} whether or not the transform changed
 */
Transform.prototype.fromSpecWithParent = function fromSpecWithParent (parentMatrix, spec, mySize, parentSize, target) {
    target = target ? target : this._matrix;

    // local cache of everything
    var t00         = target[0];
    var t01         = target[1];
    var t02         = target[2];
    var t10         = target[4];
    var t11         = target[5];
    var t12         = target[6];
    var t20         = target[8];
    var t21         = target[9];
    var t22         = target[10];
    var t30         = target[12];
    var t31         = target[13];
    var t32         = target[14];
    var p00         = parentMatrix[0];
    var p01         = parentMatrix[1];
    var p02         = parentMatrix[2];
    var p10         = parentMatrix[4];
    var p11         = parentMatrix[5];
    var p12         = parentMatrix[6];
    var p20         = parentMatrix[8];
    var p21         = parentMatrix[9];
    var p22         = parentMatrix[10];
    var p30         = parentMatrix[12];
    var p31         = parentMatrix[13];
    var p32         = parentMatrix[14];
    var posX        = spec.vectors.position[0];
    var posY        = spec.vectors.position[1];
    var posZ        = spec.vectors.position[2];
    var rotX        = spec.vectors.rotation[0];
    var rotY        = spec.vectors.rotation[1];
    var rotZ        = spec.vectors.rotation[2];
    var rotW        = spec.vectors.rotation[3];
    var scaleX      = spec.vectors.scale[0];
    var scaleY      = spec.vectors.scale[1];
    var scaleZ      = spec.vectors.scale[2];
    var alignX      = spec.offsets.align[0] * parentSize[0];
    var alignY      = spec.offsets.align[1] * parentSize[1];
    var alignZ      = spec.offsets.align[2] * parentSize[2];
    var mountPointX = spec.offsets.mountPoint[0] * mySize[0];
    var mountPointY = spec.offsets.mountPoint[1] * mySize[1];
    var mountPointZ = spec.offsets.mountPoint[2] * mySize[2];
    var originX     = spec.offsets.origin[0] * mySize[0];
    var originY     = spec.offsets.origin[1] * mySize[1];
    var originZ     = spec.offsets.origin[2] * mySize[2];

    var wx = rotW * rotX;
    var wy = rotW * rotY;
    var wz = rotW * rotZ;
    var xx = rotX * rotX;
    var yy = rotY * rotY;
    var zz = rotZ * rotZ;
    var xy = rotX * rotY;
    var xz = rotX * rotZ;
    var yz = rotY * rotZ;

    var rs0 = (1 - 2 * (yy + zz)) * scaleX;
    var rs1 = (2 * (xy + wz)) * scaleX;
    var rs2 = (2 * (xz - wy)) * scaleX;
    var rs3 = (2 * (xy - wz)) * scaleY;
    var rs4 = (1 - 2 * (xx + zz)) * scaleY;
    var rs5 = (2 * (yz + wx)) * scaleY;
    var rs6 = (2 * (xz + wy)) * scaleZ;
    var rs7 = (2 * (yz - wx)) * scaleZ;
    var rs8 = (1 - 2 * (xx + yy)) * scaleZ;

    var tx = alignX + posX - mountPointX + originX - (rs0 * originX + rs3 * originY + rs6 * originZ);
    var ty = alignY + posY - mountPointY + originY - (rs1 * originX + rs4 * originY + rs7 * originZ);
    var tz = alignZ + posZ - mountPointZ + originZ - (rs2 * originX + rs5 * originY + rs8 * originZ);

    target[0] = p00 * rs0 + p10 * rs1 + p20 * rs2;
    target[1] = p01 * rs0 + p11 * rs1 + p21 * rs2;
    target[2] = p02 * rs0 + p12 * rs1 + p22 * rs2;
    target[3] = 0;
    target[4] = p00 * rs3 + p10 * rs4 + p20 * rs5;
    target[5] = p01 * rs3 + p11 * rs4 + p21 * rs5;
    target[6] = p02 * rs3 + p12 * rs4 + p22 * rs5;
    target[7] = 0;
    target[8] = p00 * rs6 + p10 * rs7 + p20 * rs8;
    target[9] = p01 * rs6 + p11 * rs7 + p21 * rs8;
    target[10] = p02 * rs6 + p12 * rs7 + p22 * rs8;
    target[11] = 0;
    target[12] = p00 * tx + p10 * ty + p20 * tz + p30;
    target[13] = p01 * tx + p11 * ty + p21 * tz + p31;
    target[14] = p02 * tx + p12 * ty + p22 * tz + p32;
    target[15] = 1;

    return t00 !== target[0] ||
        t01 !== target[1] ||
        t02 !== target[2] ||
        t10 !== target[4] ||
        t11 !== target[5] ||
        t12 !== target[6] ||
        t20 !== target[8] ||
        t21 !== target[9] ||
        t22 !== target[10] ||
        t30 !== target[12] ||
        t31 !== target[13] ||
        t32 !== target[14];

};

module.exports = Transform;

},{}],11:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var CallbackStore = require('../utilities/CallbackStore');

var RENDER_SIZE = 2;

/**
 * A DOMElement is a component that can be added to a Node with the
 * purpose of sending draw commands to the renderer. Renderables send draw commands
 * to through their Nodes to the Compositor where they are acted upon.
 *
 * @class DOMElement
 *
 * @param {Node} node                   The Node to which the `DOMElement`
 *                                      renderable should be attached to.
 * @param {Object} options              Initial options used for instantiating
 *                                      the Node.
 * @param {Object} options.properties   CSS properties that should be added to
 *                                      the actual DOMElement on the initial draw.
 * @param {Object} options.attributes   Element attributes that should be added to
 *                                      the actual DOMElement.
 * @param {String} options.id           String to be applied as 'id' of the actual
 *                                      DOMElement.
 * @param {String} options.content      String to be applied as the content of the
 *                                      actual DOMElement.
 * @param {Boolean} options.cutout      Specifies the presence of a 'cutout' in the
 *                                      WebGL canvas over this element which allows
 *                                      for DOM and WebGL layering.  On by default.
 */
function DOMElement(node, options) {
    if (!node) throw new Error('DOMElement must be instantiated on a node');

    this._node = node;

    this._requestingUpdate = false;
    this._renderSized = false;
    this._requestRenderSize = false;

    this._changeQueue = [];

    this._UIEvents = node.getUIEvents().slice(0);
    this._classes = ['famous-dom-element'];
    this._requestingEventListeners = [];
    this._styles = {};

    this.setProperty('display', node.isShown() ? 'none' : 'block');
    this.onOpacityChange(node.getOpacity());

    this._attributes = {};
    this._content = '';

    this._tagName = options && options.tagName ? options.tagName : 'div';
    this._id = node.addComponent(this);

    this._renderSize = [0, 0, 0];

    this._callbacks = new CallbackStore();

    if (!options) return;

    var i;
    var key;

    if (options.classes)
        for (i = 0; i < options.classes.length; i++)
            this.addClass(options.classes[i]);

    if (options.attributes)
        for (key in options.attributes)
            this.setAttribute(key, options.attributes[key]);

    if (options.properties)
        for (key in options.properties)
            this.setProperty(key, options.properties[key]);

    if (options.id) this.setId(options.id);
    if (options.content) this.setContent(options.content);
    if (options.cutout === false) this.setCutoutState(options.cutout);
}

/**
 * Serializes the state of the DOMElement.
 *
 * @method
 *
 * @return {Object} serialized interal state
 */
DOMElement.prototype.getValue = function getValue() {
    return {
        classes: this._classes,
        styles: this._styles,
        attributes: this._attributes,
        content: this._content,
        id: this._attributes.id,
        tagName: this._tagName
    };
};

/**
 * Method to be invoked by the node as soon as an update occurs. This allows
 * the DOMElement renderable to dynamically react to state changes on the Node.
 *
 * This flushes the internal draw command queue by sending individual commands
 * to the node using `sendDrawCommand`.
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onUpdate = function onUpdate() {
    var node = this._node;
    var queue = this._changeQueue;
    var len = queue.length;

    if (len && node) {
        node.sendDrawCommand('WITH');
        node.sendDrawCommand(node.getLocation());

        while (len--) node.sendDrawCommand(queue.shift());
        if (this._requestRenderSize) {
            node.sendDrawCommand('DOM_RENDER_SIZE');
            node.sendDrawCommand(node.getLocation());
            this._requestRenderSize = false;
        }

    }

    this._requestingUpdate = false;
};

/**
 * Method to be invoked by the Node as soon as the node (or any of its
 * ancestors) is being mounted.
 *
 * @method onMount
 *
 * @param {Node} node      Parent node to which the component should be added.
 * @param {String} id      Path at which the component (or node) is being
 *                          attached. The path is being set on the actual
 *                          DOMElement as a `data-fa-path`-attribute.
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onMount = function onMount(node, id) {
    this._node = node;
    this._id = id;
    this._UIEvents = node.getUIEvents().slice(0);
    this.draw();
    this.setAttribute('data-fa-path', node.getLocation());
};

/**
 * Method to be invoked by the Node as soon as the node is being dismounted
 * either directly or by dismounting one of its ancestors.
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onDismount = function onDismount() {
    this.setProperty('display', 'none');
    this.setAttribute('data-fa-path', '');
    this._initialized = false;
};

/**
 * Method to be invoked by the node as soon as the DOMElement is being shown.
 * This results into the DOMElement setting the `display` property to `block`
 * and therefore visually showing the corresponding DOMElement (again).
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onShow = function onShow() {
    this.setProperty('display', 'block');
};

/**
 * Method to be invoked by the node as soon as the DOMElement is being hidden.
 * This results into the DOMElement setting the `display` property to `none`
 * and therefore visually hiding the corresponding DOMElement (again).
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onHide = function onHide() {
    this.setProperty('display', 'none');
};

/**
 * Enables or disables WebGL 'cutout' for this element, which affects
 * how the element is layered with WebGL objects in the scene.  This is designed
 * mainly as a way to acheive
 *
 * @method
 *
 * @param {Boolean} usesCutout  The presence of a WebGL 'cutout' for this element.
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.setCutoutState = function setCutoutState(usesCutout) {
    this._changeQueue.push('GL_CUTOUT_STATE', usesCutout);

    if (this._initialized) this._requestUpdate();
};

/**
 * Method to be invoked by the node as soon as the transform matrix associated
 * with the node changes. The DOMElement will react to transform changes by sending
 * `CHANGE_TRANSFORM` commands to the `DOMRenderer`.
 *
 * @method
 *
 * @param {Float32Array} transform The final transform matrix
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onTransformChange = function onTransformChange (transform) {
    this._changeQueue.push('CHANGE_TRANSFORM');
    for (var i = 0, len = transform.length ; i < len ; i++)
        this._changeQueue.push(transform[i]);

    this.onUpdate();
};

/**
 * Method to be invoked by the node as soon as its computed size changes.
 *
 * @method
 *
 * @param {Float32Array} size Size of the Node in pixels
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.onSizeChange = function onSizeChange(size) {
    var sizeMode = this._node.getSizeMode();
    var sizedX = sizeMode[0] !== RENDER_SIZE;
    var sizedY = sizeMode[1] !== RENDER_SIZE;
    if (this._initialized)
        this._changeQueue.push('CHANGE_SIZE',
            sizedX ? size[0] : sizedX,
            sizedY ? size[1] : sizedY);

    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};

/**
 * Method to be invoked by the node as soon as its opacity changes
 *
 * @method
 *
 * @param {Number} opacity The new opacity, as a scalar from 0 to 1
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.onOpacityChange = function onOpacityChange(opacity) {
    return this.setProperty('opacity', opacity);
};

/**
 * Method to be invoked by the node as soon as a new UIEvent is being added.
 * This results into an `ADD_EVENT_LISTENER` command being sent.
 *
 * @param {String} UIEvent UIEvent to be subscribed to (e.g. `click`)
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onAddUIEvent = function onAddUIEvent(UIEvent) {
    if (this._UIEvents.indexOf(UIEvent) === -1) {
        this._subscribe(UIEvent);
        this._UIEvents.push(UIEvent);
    }
    else if (this._inDraw) {
        this._subscribe(UIEvent);
    }
    return this;
};

/**
 * Appends an `ADD_EVENT_LISTENER` command to the command queue.
 *
 * @method
 * @private
 *
 * @param {String} UIEvent Event type (e.g. `click`)
 *
 * @return {undefined} undefined
 */
DOMElement.prototype._subscribe = function _subscribe (UIEvent) {
    if (this._initialized) {
        this._changeQueue.push('SUBSCRIBE', UIEvent, true);
    }
    if (!this._requestingUpdate) this._requestUpdate();
};

/**
 * Method to be invoked by the node as soon as the underlying size mode
 * changes. This results into the size being fetched from the node in
 * order to update the actual, rendered size.
 *
 * @method
 *
 * @param {Number} x the sizing mode in use for determining size in the x direction
 * @param {Number} y the sizing mode in use for determining size in the y direction
 * @param {Number} z the sizing mode in use for determining size in the z direction
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onSizeModeChange = function onSizeModeChange(x, y, z) {
    if (x === RENDER_SIZE || y === RENDER_SIZE || z === RENDER_SIZE) {
        this._renderSized = true;
        this._requestRenderSize = true;
    }
    this.onSizeChange(this._node.getSize());
};

/**
 * Method to be retrieve the rendered size of the DOM element that is
 * drawn for this node.
 *
 * @method
 *
 * @return {Array} size of the rendered DOM element in pixels
 */
DOMElement.prototype.getRenderSize = function getRenderSize() {
    return this._renderSize;
};

/**
 * Method to have the component request an update from its Node
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMElement.prototype._requestUpdate = function _requestUpdate() {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }
};

/**
 * Initializes the DOMElement by sending the `INIT_DOM` command. This creates
 * or reallocates a new Element in the actual DOM hierarchy.
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.init = function init() {
    this._changeQueue.push('INIT_DOM', this._tagName);
    this._initialized = true;
    this.onTransformChange(this._node.getTransform());
    this.onSizeChange(this._node.getSize());
    if (!this._requestingUpdate) this._requestUpdate();
};

/**
 * Sets the id attribute of the DOMElement.
 *
 * @method
 *
 * @param {String} id New id to be set
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setId = function setId (id) {
    this.setAttribute('id', id);
    return this;
};

/**
 * Adds a new class to the internal class list of the underlying Element in the
 * DOM.
 *
 * @method
 *
 * @param {String} value New class name to be added
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.addClass = function addClass (value) {
    if (this._classes.indexOf(value) < 0) {
        if (this._initialized) this._changeQueue.push('ADD_CLASS', value);
        this._classes.push(value);
        if (!this._requestingUpdate) this._requestUpdate();
        if (this._renderSized) this._requestRenderSize = true;
        return this;
    }

    if (this._inDraw) {
        if (this._initialized) this._changeQueue.push('ADD_CLASS', value);
        if (!this._requestingUpdate) this._requestUpdate();
    }
    return this;
};

/**
 * Removes a class from the DOMElement's classList.
 *
 * @method
 *
 * @param {String} value Class name to be removed
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.removeClass = function removeClass (value) {
    var index = this._classes.indexOf(value);

    if (index < 0) return this;

    this._changeQueue.push('REMOVE_CLASS', value);

    this._classes.splice(index, 1);

    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};


/**
 * Checks if the DOMElement has the passed in class.
 *
 * @method
 *
 * @param {String} value The class name
 *
 * @return {Boolean} Boolean value indicating whether the passed in class name is in the DOMElement's class list.
 */
DOMElement.prototype.hasClass = function hasClass (value) {
    return this._classes.indexOf(value) !== -1;
};

/**
 * Sets an attribute of the DOMElement.
 *
 * @method
 *
 * @param {String} name Attribute key (e.g. `src`)
 * @param {String} value Attribute value (e.g. `http://famo.us`)
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setAttribute = function setAttribute (name, value) {
    if (this._attributes[name] !== value || this._inDraw) {
        this._attributes[name] = value;
        if (this._initialized) this._changeQueue.push('CHANGE_ATTRIBUTE', name, value);
        if (!this._requestUpdate) this._requestUpdate();
    }

    return this;
};

/**
 * Sets a CSS property
 *
 * @chainable
 *
 * @param {String} name  Name of the CSS rule (e.g. `background-color`)
 * @param {String} value Value of CSS property (e.g. `red`)
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setProperty = function setProperty (name, value) {
    if (this._styles[name] !== value || this._inDraw) {
        this._styles[name] = value;
        if (this._initialized) this._changeQueue.push('CHANGE_PROPERTY', name, value);
        if (!this._requestingUpdate) this._requestUpdate();
        if (this._renderSized) this._requestRenderSize = true;
    }

    return this;
};

/**
 * Sets the content of the DOMElement. This is using `innerHTML`, escaping user
 * generated content is therefore essential for security purposes.
 *
 * @method
 *
 * @param {String} content Content to be set using `.innerHTML = ...`
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setContent = function setContent (content) {
    if (this._content !== content || this._inDraw) {
        this._content = content;
        if (this._initialized) this._changeQueue.push('CHANGE_CONTENT', content);
        if (!this._requestingUpdate) this._requestUpdate();
        if (this._renderSized) this._requestRenderSize = true;
    }

    return this;
};

/**
 * Subscribes to a DOMElement using.
 *
 * @method on
 *
 * @param {String} event       The event type (e.g. `click`).
 * @param {Function} listener  Handler function for the specified event type
 *                              in which the payload event object will be
 *                              passed into.
 *
 * @return {Function} A function to call if you want to remove the callback
 */
DOMElement.prototype.on = function on (event, listener) {
    return this._callbacks.on(event, listener);
};

/**
 * Function to be invoked by the Node whenever an event is being received.
 * There are two different ways to subscribe for those events:
 *
 * 1. By overriding the onReceive method (and possibly using `switch` in order
 *     to differentiate between the different event types).
 * 2. By using DOMElement and using the built-in CallbackStore.
 *
 * @method
 *
 * @param {String} event Event type (e.g. `click`)
 * @param {Object} payload Event object.
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onReceive = function onReceive (event, payload) {
    if (event === 'resize') {
        this._renderSize[0] = payload.val[0];
        this._renderSize[1] = payload.val[1];
        if (!this._requestingUpdate) this._requestUpdate();
    }
    this._callbacks.trigger(event, payload);
};

/**
 * The draw function is being used in order to allow mutating the DOMElement
 * before actually mounting the corresponding node.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.draw = function draw() {
    var key;
    var i;
    var len;

    this._inDraw = true;

    this.init();

    for (i = 0, len = this._classes.length ; i < len ; i++)
        this.addClass(this._classes[i]);

    if (this._content) this.setContent(this._content);

    for (key in this._styles)
        if (this._styles[key])
            this.setProperty(key, this._styles[key]);

    for (key in this._attributes)
        if (this._attributes[key])
            this.setAttribute(key, this._attributes[key]);

    for (i = 0, len = this._UIEvents.length ; i < len ; i++)
        this.onAddUIEvent(this._UIEvents[i]);

    this._inDraw = false;
};

module.exports = DOMElement;

},{"../utilities/CallbackStore":36}],12:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var ElementCache = require('./ElementCache');
var math = require('./Math');
var vendorPrefix = require('../utilities/vendorPrefix');
var eventMap = require('./events/EventMap');

var TRANSFORM = null;

/**
 * DOMRenderer is a class responsible for adding elements
 * to the DOM and writing to those elements.
 * There is a DOMRenderer per context, represented as an
 * element and a selector. It is instantiated in the
 * context class.
 *
 * @class DOMRenderer
 *
 * @param {HTMLElement} element an element.
 * @param {String} selector the selector of the element.
 * @param {Compositor} compositor the compositor controlling the renderer
 */
function DOMRenderer (element, selector, compositor) {
    var _this = this;

    element.classList.add('famous-dom-renderer');

    TRANSFORM = TRANSFORM || vendorPrefix('transform');
    this._compositor = compositor; // a reference to the compositor

    this._target = null; // a register for holding the current
                         // element that the Renderer is operating
                         // upon

    this._parent = null; // a register for holding the parent
                         // of the target

    this._path = null; // a register for holding the path of the target
                       // this register must be set first, and then
                       // children, target, and parent are all looked
                       // up from that.

    this._children = []; // a register for holding the children of the
                         // current target.

    this._root = new ElementCache(element, selector); // the root
                                                      // of the dom tree that this
                                                      // renderer is responsible
                                                      // for

    this._boundTriggerEvent = function (ev) {
        return _this._triggerEvent(ev);
    };

    this._selector = selector;

    this._elements = {};

    this._elements[selector] = this._root;

    this.perspectiveTransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this._VPtransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    this._size = [null, null];
}


/**
 * Attaches an EventListener to the element associated with the passed in path.
 * Prevents the default browser action on all subsequent events if
 * `preventDefault` is truthy.
 * All incoming events will be forwarded to the compositor by invoking the
 * `sendEvent` method.
 * Delegates events if possible by attaching the event listener to the context.
 *
 * @method
 *
 * @param {String} type DOM event type (e.g. click, mouseover).
 * @param {Boolean} preventDefault Whether or not the default browser action should be prevented.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.subscribe = function subscribe(type, preventDefault) {
    // TODO preventDefault should be a separate command
    this._assertTargetLoaded();

    this._target.preventDefault[type] = preventDefault;
    this._target.subscribe[type] = true;

    if (
        !this._target.listeners[type] && !this._root.listeners[type]
    ) {
        var target = eventMap[type][1] ? this._root : this._target;
        target.listeners[type] = this._boundTriggerEvent;
        target.element.addEventListener(type, this._boundTriggerEvent);
    }
};

/**
 * Function to be added using `addEventListener` to the corresponding
 * DOMElement.
 *
 * @method
 * @private
 *
 * @param {Event} ev DOM Event payload
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._triggerEvent = function _triggerEvent(ev) {
    // Use ev.path, which is an array of Elements (polyfilled if needed).
    var evPath = ev.path ? ev.path : _getPath(ev);
    // First element in the path is the element on which the event has actually
    // been emitted.
    for (var i = 0; i < evPath.length; i++) {
        // Skip nodes that don't have a dataset property or data-fa-path
        // attribute.
        if (!evPath[i].dataset) continue;
        var path = evPath[i].dataset.faPath;
        if (!path) continue;

        // Stop further event propogation and path traversal as soon as the
        // first ElementCache subscribing for the emitted event has been found.
        if (this._elements[path] && this._elements[path].subscribe[ev.type]) {
            ev.stopPropagation();

            // Optionally preventDefault. This needs forther consideration and
            // should be optional. Eventually this should be a separate command/
            // method.
            if (this._elements[path].preventDefault[ev.type]) {
                ev.preventDefault();
            }

            var NormalizedEventConstructor = eventMap[ev.type][0];

            // Finally send the event to the Worker Thread through the
            // compositor.
            this._compositor.sendEvent(path, ev.type, new NormalizedEventConstructor(ev));

            break;
        }
    }
};


/**
 * getSizeOf gets the dom size of a particular DOM element.  This is
 * needed for render sizing in the scene graph.
 *
 * @method
 *
 * @param {String} path path of the Node in the scene graph
 *
 * @return {Array} a vec3 of the offset size of the dom element
 */
DOMRenderer.prototype.getSizeOf = function getSizeOf(path) {
    var element = this._elements[path];
    if (!element) return null;

    var res = {val: element.size};
    this._compositor.sendEvent(path, 'resize', res);
    return res;
};

function _getPath(ev) {
    // TODO move into _triggerEvent, avoid object allocation
    var path = [];
    var node = ev.target;
    while (node !== document.body) {
        path.push(node);
        node = node.parentNode;
    }
    return path;
}


/**
 * Determines the size of the context by querying the DOM for `offsetWidth` and
 * `offsetHeight`.
 *
 * @method
 *
 * @return {Array} Offset size.
 */
DOMRenderer.prototype.getSize = function getSize() {
    this._size[0] = this._root.element.offsetWidth;
    this._size[1] = this._root.element.offsetHeight;
    return this._size;
};

DOMRenderer.prototype._getSize = DOMRenderer.prototype.getSize;


/**
 * Executes the retrieved draw commands. Draw commands only refer to the
 * cross-browser normalized `transform` property.
 *
 * @method
 *
 * @param {Object} renderState description
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.draw = function draw(renderState) {
    if (renderState.perspectiveDirty) {
        this.perspectiveDirty = true;

        this.perspectiveTransform[0] = renderState.perspectiveTransform[0];
        this.perspectiveTransform[1] = renderState.perspectiveTransform[1];
        this.perspectiveTransform[2] = renderState.perspectiveTransform[2];
        this.perspectiveTransform[3] = renderState.perspectiveTransform[3];

        this.perspectiveTransform[4] = renderState.perspectiveTransform[4];
        this.perspectiveTransform[5] = renderState.perspectiveTransform[5];
        this.perspectiveTransform[6] = renderState.perspectiveTransform[6];
        this.perspectiveTransform[7] = renderState.perspectiveTransform[7];

        this.perspectiveTransform[8] = renderState.perspectiveTransform[8];
        this.perspectiveTransform[9] = renderState.perspectiveTransform[9];
        this.perspectiveTransform[10] = renderState.perspectiveTransform[10];
        this.perspectiveTransform[11] = renderState.perspectiveTransform[11];

        this.perspectiveTransform[12] = renderState.perspectiveTransform[12];
        this.perspectiveTransform[13] = renderState.perspectiveTransform[13];
        this.perspectiveTransform[14] = renderState.perspectiveTransform[14];
        this.perspectiveTransform[15] = renderState.perspectiveTransform[15];
    }

    if (renderState.viewDirty || renderState.perspectiveDirty) {
        math.multiply(this._VPtransform, this.perspectiveTransform, renderState.viewTransform);
        this._root.element.style[TRANSFORM] = this._stringifyMatrix(this._VPtransform);
    }
};


/**
 * Internal helper function used for ensuring that a path is currently loaded.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertPathLoaded = function _asserPathLoaded() {
    if (!this._path) throw new Error('path not loaded');
};

/**
 * Internal helper function used for ensuring that a parent is currently loaded.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertParentLoaded = function _assertParentLoaded() {
    if (!this._parent) throw new Error('parent not loaded');
};

/**
 * Internal helper function used for ensuring that children are currently
 * loaded.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertChildrenLoaded = function _assertChildrenLoaded() {
    if (!this._children) throw new Error('children not loaded');
};

/**
 * Internal helper function used for ensuring that a target is currently loaded.
 *
 * @method  _assertTargetLoaded
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertTargetLoaded = function _assertTargetLoaded() {
    if (!this._target) throw new Error('No target loaded');
};

/**
 * Finds and sets the parent of the currently loaded element (path).
 *
 * @method
 * @private
 *
 * @return {ElementCache} Parent element.
 */
DOMRenderer.prototype.findParent = function findParent () {
    this._assertPathLoaded();

    var path = this._path;
    var parent;

    while (!parent && path.length) {
        path = path.substring(0, path.lastIndexOf('/'));
        parent = this._elements[path];
    }
    this._parent = parent;
    return parent;
};


/**
 * Finds all children of the currently loaded element.
 *
 * @method
 * @private
 *
 * @param {Array} array Output-Array used for writing to (subsequently appending children)
 *
 * @return {Array} array of children elements
 */
DOMRenderer.prototype.findChildren = function findChildren(array) {
    // TODO: Optimize me.
    this._assertPathLoaded();

    var path = this._path + '/';
    var keys = Object.keys(this._elements);
    var i = 0;
    var len;
    array = array ? array : this._children;

    this._children.length = 0;

    while (i < keys.length) {
        if (keys[i].indexOf(path) === -1 || keys[i] === path) keys.splice(i, 1);
        else i++;
    }
    var currentPath;
    var j = 0;
    for (i = 0 ; i < keys.length ; i++) {
        currentPath = keys[i];
        for (j = 0 ; j < keys.length ; j++) {
            if (i !== j && keys[j].indexOf(currentPath) !== -1) {
                keys.splice(j, 1);
                i--;
            }
        }
    }
    for (i = 0, len = keys.length ; i < len ; i++)
        array[i] = this._elements[keys[i]];

    return array;
};


/**
 * Used for determining the target loaded under the current path.
 *
 * @method
 *
 * @return {ElementCache|undefined} Element loaded under defined path.
 */
DOMRenderer.prototype.findTarget = function findTarget() {
    this._target = this._elements[this._path];
    return this._target;
};


/**
 * Loads the passed in path.
 *
 * @method
 *
 * @param {String} path Path to be loaded
 *
 * @return {String} Loaded path
 */
DOMRenderer.prototype.loadPath = function loadPath (path) {
    this._path = path;
    return this._path;
};


/**
 * Inserts a DOMElement at the currently loaded path, assuming no target is
 * loaded. Only one DOMElement can be associated with each path.
 *
 * @method
 *
 * @param {String} tagName Tag name (capitalization will be normalized).
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.insertEl = function insertEl (tagName) {
    if (!this._target ||
        this._target.element.tagName.toLowerCase() !== tagName.toLowerCase()) {

        this.findParent();
        this.findChildren();

        this._assertParentLoaded();
        this._assertChildrenLoaded();

        if (this._target) this._parent.element.removeChild(this._target.element);

        this._target = new ElementCache(document.createElement(tagName), this._path);
        this._parent.element.appendChild(this._target.element);
        this._elements[this._path] = this._target;

        for (var i = 0, len = this._children.length ; i < len ; i++) {
            this._target.element.appendChild(this._children[i].element);
        }
    }
};


/**
 * Sets a property on the currently loaded target.
 *
 * @method
 *
 * @param {String} name Property name (e.g. background, color, font)
 * @param {String} value Proprty value (e.g. black, 20px)
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setProperty = function setProperty (name, value) {
    this._assertTargetLoaded();
    this._target.element.style[name] = value;
};


/**
 * Sets the size of the currently loaded target.
 * Removes any explicit sizing constraints when passed in `false`
 * ("true-sizing").
 *
 * @method
 *
 * @param {Number|false} width   Width to be set.
 * @param {Number|false} height  Height to be set.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setSize = function setSize (width, height) {
    this._assertTargetLoaded();

    this.setWidth(width);
    this.setHeight(height);
};

/**
 * Sets the width of the currently loaded target.
 * Removes any explicit sizing constraints when passed in `false`
 * ("true-sizing").
 *
 * @method
 *
 * @param {Number|false} width Width to be set.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setWidth = function setWidth(width) {
    this._assertTargetLoaded();

    var contentWrapper = this._target.content;

    if (width === false) {
        this._target.explicitWidth = true;
        if (contentWrapper) contentWrapper.style.width = '';
        width = contentWrapper ? contentWrapper.offsetWidth : 0;
        this._target.element.style.width = width + 'px';
    }
    else {
        this._target.explicitWidth = false;
        if (contentWrapper) contentWrapper.style.width = width + 'px';
        this._target.element.style.width = width + 'px';
    }

    this._target.size[0] = width;
};

/**
 * Sets the height of the currently loaded target.
 * Removes any explicit sizing constraints when passed in `false`
 * ("true-sizing").
 *
 * @method
 *
 * @param {Number|false} height Height to be set.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setHeight = function setHeight(height) {
    this._assertTargetLoaded();

    var contentWrapper = this._target.content;

    if (height === false) {
        this._target.explicitHeight = true;
        if (contentWrapper) contentWrapper.style.height = '';
        height = contentWrapper ? contentWrapper.offsetHeight : 0;
        this._target.element.style.height = height + 'px';
    }
    else {
        this._target.explicitHeight = false;
        if (contentWrapper) contentWrapper.style.height = height + 'px';
        this._target.element.style.height = height + 'px';
    }

    this._target.size[1] = height;
};

/**
 * Sets an attribute on the currently loaded target.
 *
 * @method
 *
 * @param {String} name Attribute name (e.g. href)
 * @param {String} value Attribute value (e.g. http://famous.org)
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setAttribute = function setAttribute(name, value) {
    this._assertTargetLoaded();
    this._target.element.setAttribute(name, value);
};

/**
 * Sets the `innerHTML` content of the currently loaded target.
 *
 * @method
 *
 * @param {String} content Content to be set as `innerHTML`
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setContent = function setContent(content) {
    this._assertTargetLoaded();
    this.findChildren();

    if (!this._target.content) {
        this._target.content = document.createElement('div');
        this._target.content.classList.add('famous-dom-element-content');
        this._target.element.insertBefore(
            this._target.content,
            this._target.element.firstChild
        );
    }
    this._target.content.innerHTML = content;

    this.setSize(
        this._target.explicitWidth ? false : this._target.size[0],
        this._target.explicitHeight ? false : this._target.size[1]
    );
};


/**
 * Sets the passed in transform matrix (world space). Inverts the parent's world
 * transform.
 *
 * @method
 *
 * @param {Float32Array} transform The transform for the loaded DOM Element in world space
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setMatrix = function setMatrix(transform) {
    // TODO Don't multiply matrics in the first place.
    this._assertTargetLoaded();
    this.findParent();
    var worldTransform = this._target.worldTransform;
    var changed = false;

    var i;
    var len;

    if (transform)
        for (i = 0, len = 16 ; i < len ; i++) {
            changed = changed ? changed : worldTransform[i] === transform[i];
            worldTransform[i] = transform[i];
        }
    else changed = true;

    if (changed) {
        math.invert(this._target.invertedParent, this._parent.worldTransform);
        math.multiply(this._target.finalTransform, this._target.invertedParent, worldTransform);

        // TODO: this is a temporary fix for draw commands
        // coming in out of order
        var children = this.findChildren([]);
        var previousPath = this._path;
        var previousTarget = this._target;
        for (i = 0, len = children.length ; i < len ; i++) {
            this._target = children[i];
            this._path = this._target.path;
            this.setMatrix();
        }
        this._path = previousPath;
        this._target = previousTarget;
    }

    this._target.element.style[TRANSFORM] = this._stringifyMatrix(this._target.finalTransform);
};


/**
 * Adds a class to the classList associated with the currently loaded target.
 *
 * @method
 *
 * @param {String} domClass Class name to be added to the current target.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.addClass = function addClass(domClass) {
    this._assertTargetLoaded();
    this._target.element.classList.add(domClass);
};


/**
 * Removes a class from the classList associated with the currently loaded
 * target.
 *
 * @method
 *
 * @param {String} domClass Class name to be removed from currently loaded target.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.removeClass = function removeClass(domClass) {
    this._assertTargetLoaded();
    this._target.element.classList.remove(domClass);
};


/**
 * Stringifies the passed in matrix for setting the `transform` property.
 *
 * @method  _stringifyMatrix
 * @private
 *
 * @param {Array} m    Matrix as an array or array-like object.
 * @return {String}     Stringified matrix as `matrix3d`-property.
 */
DOMRenderer.prototype._stringifyMatrix = function _stringifyMatrix(m) {
    var r = 'matrix3d(';

    r += (m[0] < 0.000001 && m[0] > -0.000001) ? '0,' : m[0] + ',';
    r += (m[1] < 0.000001 && m[1] > -0.000001) ? '0,' : m[1] + ',';
    r += (m[2] < 0.000001 && m[2] > -0.000001) ? '0,' : m[2] + ',';
    r += (m[3] < 0.000001 && m[3] > -0.000001) ? '0,' : m[3] + ',';
    r += (m[4] < 0.000001 && m[4] > -0.000001) ? '0,' : m[4] + ',';
    r += (m[5] < 0.000001 && m[5] > -0.000001) ? '0,' : m[5] + ',';
    r += (m[6] < 0.000001 && m[6] > -0.000001) ? '0,' : m[6] + ',';
    r += (m[7] < 0.000001 && m[7] > -0.000001) ? '0,' : m[7] + ',';
    r += (m[8] < 0.000001 && m[8] > -0.000001) ? '0,' : m[8] + ',';
    r += (m[9] < 0.000001 && m[9] > -0.000001) ? '0,' : m[9] + ',';
    r += (m[10] < 0.000001 && m[10] > -0.000001) ? '0,' : m[10] + ',';
    r += (m[11] < 0.000001 && m[11] > -0.000001) ? '0,' : m[11] + ',';
    r += (m[12] < 0.000001 && m[12] > -0.000001) ? '0,' : m[12] + ',';
    r += (m[13] < 0.000001 && m[13] > -0.000001) ? '0,' : m[13] + ',';
    r += (m[14] < 0.000001 && m[14] > -0.000001) ? '0,' : m[14] + ',';

    r += m[15] + ')';
    return r;
};

module.exports = DOMRenderer;

},{"../utilities/vendorPrefix":39,"./ElementCache":13,"./Math":14,"./events/EventMap":17}],13:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

// Transform identity matrix. 
var ident = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

/**
 * ElementCache is being used for keeping track of an element's DOM Element,
 * path, world transform, inverted parent, final transform (as being used for
 * setting the actual `transform`-property) and post render size (final size as
 * being rendered to the DOM).
 * 
 * @class ElementCache
 *  
 * @param {Element} element DOMElement
 * @param {String} path Path used for uniquely identifying the location in the scene graph.
 */ 
function ElementCache (element, path) {
    this.element = element;
    this.path = path;
    this.content = null;
    this.size = new Int16Array(3);
    this.explicitHeight = false;
    this.explicitWidth = false;
    this.worldTransform = new Float32Array(ident);
    this.invertedParent = new Float32Array(ident);
    this.finalTransform = new Float32Array(ident);
    this.postRenderSize = new Float32Array(2);
    this.listeners = {};
    this.preventDefault = {};
    this.subscribe = {};
}

module.exports = ElementCache;

},{}],14:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A method for inverting a transform matrix
 *
 * @method
 *
 * @param {Array} out array to store the return of the inversion
 * @param {Array} a transform matrix to inverse
 *
 * @return {Array} out
 *   output array that is storing the transform matrix
 */
function invert (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
}

/**
 * A method for multiplying two matricies
 *
 * @method
 *
 * @param {Array} out array to store the return of the multiplication
 * @param {Array} a transform matrix to multiply
 * @param {Array} b transform matrix to multiply
 *
 * @return {Array} out
 *   output array that is storing the transform matrix
 */
function multiply (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3],
        b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7],
        b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11],
        b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];

    var changed = false;
    var out0, out1, out2, out3;

    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[0] ||
                        out1 === out[1] ||
                        out2 === out[2] ||
                        out3 === out[3];

    out[0] = out0;
    out[1] = out1;
    out[2] = out2;
    out[3] = out3;

    b0 = b4; b1 = b5; b2 = b6; b3 = b7;
    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[4] ||
                        out1 === out[5] ||
                        out2 === out[6] ||
                        out3 === out[7];

    out[4] = out0;
    out[5] = out1;
    out[6] = out2;
    out[7] = out3;

    b0 = b8; b1 = b9; b2 = b10; b3 = b11;
    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[8] ||
                        out1 === out[9] ||
                        out2 === out[10] ||
                        out3 === out[11];

    out[8] = out0;
    out[9] = out1;
    out[10] = out2;
    out[11] = out3;

    b0 = b12; b1 = b13; b2 = b14; b3 = b15;
    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[12] ||
                        out1 === out[13] ||
                        out2 === out[14] ||
                        out3 === out[15];

    out[12] = out0;
    out[13] = out1;
    out[14] = out2;
    out[15] = out3;

    return out;
}

module.exports = {
    multiply: multiply,
    invert: invert
};

},{}],15:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-compositionevents).
 *
 * @class CompositionEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function CompositionEvent(ev) {
    // [Constructor(DOMString typeArg, optional CompositionEventInit compositionEventInitDict)]
    // interface CompositionEvent : UIEvent {
    //     readonly    attribute DOMString data;
    // };

    UIEvent.call(this, ev);

    /**
     * @name CompositionEvent#data
     * @type String
     */
    this.data = ev.data;
}

CompositionEvent.prototype = Object.create(UIEvent.prototype);
CompositionEvent.prototype.constructor = CompositionEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
CompositionEvent.prototype.toString = function toString () {
    return 'CompositionEvent';
};

module.exports = CompositionEvent;

},{"./UIEvent":23}],16:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The Event class is being used in order to normalize native DOM events.
 * Events need to be normalized in order to be serialized through the structured
 * cloning algorithm used by the `postMessage` method (Web Workers).
 *
 * Wrapping DOM events also has the advantage of providing a consistent
 * interface for interacting with DOM events across browsers by copying over a
 * subset of the exposed properties that is guaranteed to be consistent across
 * browsers.
 *
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#interface-Event).
 *
 * @class Event
 *
 * @param {Event} ev The native DOM event.
 */
function Event(ev) {
    // [Constructor(DOMString type, optional EventInit eventInitDict),
    //  Exposed=Window,Worker]
    // interface Event {
    //   readonly attribute DOMString type;
    //   readonly attribute EventTarget? target;
    //   readonly attribute EventTarget? currentTarget;

    //   const unsigned short NONE = 0;
    //   const unsigned short CAPTURING_PHASE = 1;
    //   const unsigned short AT_TARGET = 2;
    //   const unsigned short BUBBLING_PHASE = 3;
    //   readonly attribute unsigned short eventPhase;

    //   void stopPropagation();
    //   void stopImmediatePropagation();

    //   readonly attribute boolean bubbles;
    //   readonly attribute boolean cancelable;
    //   void preventDefault();
    //   readonly attribute boolean defaultPrevented;

    //   [Unforgeable] readonly attribute boolean isTrusted;
    //   readonly attribute DOMTimeStamp timeStamp;

    //   void initEvent(DOMString type, boolean bubbles, boolean cancelable);
    // };

    /**
     * @name Event#type
     * @type String
     */
    this.type = ev.type;

    /**
     * @name Event#defaultPrevented
     * @type Boolean
     */
    this.defaultPrevented = ev.defaultPrevented;

    /**
     * @name Event#timeStamp
     * @type Number
     */
    this.timeStamp = ev.timeStamp;


    /**
     * Used for exposing the current target's value.
     *
     * @name Event#value
     * @type String
     */
    var targetConstructor = ev.target.constructor;
    // TODO Support HTMLKeygenElement
    if (
        targetConstructor === HTMLInputElement ||
        targetConstructor === HTMLTextAreaElement ||
        targetConstructor === HTMLSelectElement
    ) {
        this.value = ev.target.value;
    }
}

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
Event.prototype.toString = function toString () {
    return 'Event';
};

module.exports = Event;

},{}],17:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var CompositionEvent = require('./CompositionEvent');
var Event = require('./Event');
var FocusEvent = require('./FocusEvent');
var InputEvent = require('./InputEvent');
var KeyboardEvent = require('./KeyboardEvent');
var MouseEvent = require('./MouseEvent');
var TouchEvent = require('./TouchEvent');
var UIEvent = require('./UIEvent');
var WheelEvent = require('./WheelEvent');

/**
 * A mapping of DOM events to the corresponding handlers
 *
 * @name EventMap
 * @type Object
 */
var EventMap = {
    change                         : [Event, true],
    submit                         : [Event, true],

    // UI Events (http://www.w3.org/TR/uievents/)
    abort                          : [Event, false],
    beforeinput                    : [InputEvent, true],
    blur                           : [FocusEvent, false],
    click                          : [MouseEvent, true],
    compositionend                 : [CompositionEvent, true],
    compositionstart               : [CompositionEvent, true],
    compositionupdate              : [CompositionEvent, true],
    dblclick                       : [MouseEvent, true],
    focus                          : [FocusEvent, false],
    focusin                        : [FocusEvent, true],
    focusout                       : [FocusEvent, true],
    input                          : [InputEvent, true],
    keydown                        : [KeyboardEvent, true],
    keyup                          : [KeyboardEvent, true],
    load                           : [Event, false],
    mousedown                      : [MouseEvent, true],
    mouseenter                     : [MouseEvent, false],
    mouseleave                     : [MouseEvent, false],

    // bubbles, but will be triggered very frequently
    mousemove                      : [MouseEvent, false],

    mouseout                       : [MouseEvent, true],
    mouseover                      : [MouseEvent, true],
    mouseup                        : [MouseEvent, true],
    resize                         : [UIEvent, false],

    // might bubble
    scroll                         : [UIEvent, false],

    select                         : [Event, true],
    unload                         : [Event, false],
    wheel                          : [WheelEvent, true],

    // Touch Events Extension (http://www.w3.org/TR/touch-events-extensions/)
    touchcancel                    : [TouchEvent, true],
    touchend                       : [TouchEvent, true],
    touchmove                      : [TouchEvent, true],
    touchstart                     : [TouchEvent, true]
};

module.exports = EventMap;

},{"./CompositionEvent":15,"./Event":16,"./FocusEvent":18,"./InputEvent":19,"./KeyboardEvent":20,"./MouseEvent":21,"./TouchEvent":22,"./UIEvent":23,"./WheelEvent":24}],18:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-focusevent).
 *
 * @class FocusEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function FocusEvent(ev) {
    // [Constructor(DOMString typeArg, optional FocusEventInit focusEventInitDict)]
    // interface FocusEvent : UIEvent {
    //     readonly    attribute EventTarget? relatedTarget;
    // };

    UIEvent.call(this, ev);
}

FocusEvent.prototype = Object.create(UIEvent.prototype);
FocusEvent.prototype.constructor = FocusEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
FocusEvent.prototype.toString = function toString () {
    return 'FocusEvent';
};

module.exports = FocusEvent;

},{"./UIEvent":23}],19:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [Input Events](http://w3c.github.io/editing-explainer/input-events.html#idl-def-InputEvent).
 *
 * @class InputEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function InputEvent(ev) {
    // [Constructor(DOMString typeArg, optional InputEventInit inputEventInitDict)]
    // interface InputEvent : UIEvent {
    //     readonly    attribute DOMString inputType;
    //     readonly    attribute DOMString data;
    //     readonly    attribute boolean   isComposing;
    //     readonly    attribute Range     targetRange;
    // };

    UIEvent.call(this, ev);

    /**
     * @name    InputEvent#inputType
     * @type    String
     */
    this.inputType = ev.inputType;

    /**
     * @name    InputEvent#data
     * @type    String
     */
    this.data = ev.data;

    /**
     * @name    InputEvent#isComposing
     * @type    Boolean
     */
    this.isComposing = ev.isComposing;

    /**
     * **Limited browser support**.
     *
     * @name    InputEvent#targetRange
     * @type    Boolean
     */
    this.targetRange = ev.targetRange;
}

InputEvent.prototype = Object.create(UIEvent.prototype);
InputEvent.prototype.constructor = InputEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
InputEvent.prototype.toString = function toString () {
    return 'InputEvent';
};

module.exports = InputEvent;

},{"./UIEvent":23}],20:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-keyboardevents).
 *
 * @class KeyboardEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function KeyboardEvent(ev) {
    // [Constructor(DOMString typeArg, optional KeyboardEventInit keyboardEventInitDict)]
    // interface KeyboardEvent : UIEvent {
    //     // KeyLocationCode
    //     const unsigned long DOM_KEY_LOCATION_STANDARD = 0x00;
    //     const unsigned long DOM_KEY_LOCATION_LEFT = 0x01;
    //     const unsigned long DOM_KEY_LOCATION_RIGHT = 0x02;
    //     const unsigned long DOM_KEY_LOCATION_NUMPAD = 0x03;
    //     readonly    attribute DOMString     key;
    //     readonly    attribute DOMString     code;
    //     readonly    attribute unsigned long location;
    //     readonly    attribute boolean       ctrlKey;
    //     readonly    attribute boolean       shiftKey;
    //     readonly    attribute boolean       altKey;
    //     readonly    attribute boolean       metaKey;
    //     readonly    attribute boolean       repeat;
    //     readonly    attribute boolean       isComposing;
    //     boolean getModifierState (DOMString keyArg);
    // };

    UIEvent.call(this, ev);

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_STANDARD
     * @type Number
     */
    this.DOM_KEY_LOCATION_STANDARD = 0x00;

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_LEFT
     * @type Number
     */
    this.DOM_KEY_LOCATION_LEFT = 0x01;

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_RIGHT
     * @type Number
     */
    this.DOM_KEY_LOCATION_RIGHT = 0x02;

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_NUMPAD
     * @type Number
     */
    this.DOM_KEY_LOCATION_NUMPAD = 0x03;

    /**
     * @name KeyboardEvent#key
     * @type String
     */
    this.key = ev.key;

    /**
     * @name KeyboardEvent#code
     * @type String
     */
    this.code = ev.code;

    /**
     * @name KeyboardEvent#location
     * @type Number
     */
    this.location = ev.location;

    /**
     * @name KeyboardEvent#ctrlKey
     * @type Boolean
     */
    this.ctrlKey = ev.ctrlKey;

    /**
     * @name KeyboardEvent#shiftKey
     * @type Boolean
     */
    this.shiftKey = ev.shiftKey;

    /**
     * @name KeyboardEvent#altKey
     * @type Boolean
     */
    this.altKey = ev.altKey;

    /**
     * @name KeyboardEvent#metaKey
     * @type Boolean
     */
    this.metaKey = ev.metaKey;

    /**
     * @name KeyboardEvent#repeat
     * @type Boolean
     */
    this.repeat = ev.repeat;

    /**
     * @name KeyboardEvent#isComposing
     * @type Boolean
     */
    this.isComposing = ev.isComposing;

    /**
     * @name KeyboardEvent#keyCode
     * @type String
     * @deprecated
     */
    this.keyCode = ev.keyCode;
}

KeyboardEvent.prototype = Object.create(UIEvent.prototype);
KeyboardEvent.prototype.constructor = KeyboardEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
KeyboardEvent.prototype.toString = function toString () {
    return 'KeyboardEvent';
};

module.exports = KeyboardEvent;

},{"./UIEvent":23}],21:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-mouseevents).
 *
 * @class KeyboardEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function MouseEvent(ev) {
    // [Constructor(DOMString typeArg, optional MouseEventInit mouseEventInitDict)]
    // interface MouseEvent : UIEvent {
    //     readonly    attribute long           screenX;
    //     readonly    attribute long           screenY;
    //     readonly    attribute long           clientX;
    //     readonly    attribute long           clientY;
    //     readonly    attribute boolean        ctrlKey;
    //     readonly    attribute boolean        shiftKey;
    //     readonly    attribute boolean        altKey;
    //     readonly    attribute boolean        metaKey;
    //     readonly    attribute short          button;
    //     readonly    attribute EventTarget?   relatedTarget;
    //     // Introduced in this specification
    //     readonly    attribute unsigned short buttons;
    //     boolean getModifierState (DOMString keyArg);
    // };

    UIEvent.call(this, ev);

    /**
     * @name MouseEvent#screenX
     * @type Number
     */
    this.screenX = ev.screenX;

    /**
     * @name MouseEvent#screenY
     * @type Number
     */
    this.screenY = ev.screenY;

    /**
     * @name MouseEvent#clientX
     * @type Number
     */
    this.clientX = ev.clientX;

    /**
     * @name MouseEvent#clientY
     * @type Number
     */
    this.clientY = ev.clientY;

    /**
     * @name MouseEvent#ctrlKey
     * @type Boolean
     */
    this.ctrlKey = ev.ctrlKey;

    /**
     * @name MouseEvent#shiftKey
     * @type Boolean
     */
    this.shiftKey = ev.shiftKey;

    /**
     * @name MouseEvent#altKey
     * @type Boolean
     */
    this.altKey = ev.altKey;

    /**
     * @name MouseEvent#metaKey
     * @type Boolean
     */
    this.metaKey = ev.metaKey;

    /**
     * @type MouseEvent#button
     * @type Number
     */
    this.button = ev.button;

    /**
     * @type MouseEvent#buttons
     * @type Number
     */
    this.buttons = ev.buttons;

    /**
     * @type MouseEvent#pageX
     * @type Number
     */
    this.pageX = ev.pageX;

    /**
     * @type MouseEvent#pageY
     * @type Number
     */
    this.pageY = ev.pageY;

    /**
     * @type MouseEvent#x
     * @type Number
     */
    this.x = ev.x;

    /**
     * @type MouseEvent#y
     * @type Number
     */
    this.y = ev.y;

    /**
     * @type MouseEvent#offsetX
     * @type Number
     */
    this.offsetX = ev.offsetX;

    /**
     * @type MouseEvent#offsetY
     * @type Number
     */
    this.offsetY = ev.offsetY;
}

MouseEvent.prototype = Object.create(UIEvent.prototype);
MouseEvent.prototype.constructor = MouseEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
MouseEvent.prototype.toString = function toString () {
    return 'MouseEvent';
};

module.exports = MouseEvent;

},{"./UIEvent":23}],22:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

var EMPTY_ARRAY = [];

/**
 * See [Touch Interface](http://www.w3.org/TR/2013/REC-touch-events-20131010/#touch-interface).
 *
 * @class Touch
 * @private
 *
 * @param {Touch} touch The native Touch object.
 */
function Touch(touch) {
    // interface Touch {
    //     readonly    attribute long        identifier;
    //     readonly    attribute EventTarget target;
    //     readonly    attribute double      screenX;
    //     readonly    attribute double      screenY;
    //     readonly    attribute double      clientX;
    //     readonly    attribute double      clientY;
    //     readonly    attribute double      pageX;
    //     readonly    attribute double      pageY;
    // };

    /**
     * @name Touch#identifier
     * @type Number
     */
    this.identifier = touch.identifier;

    /**
     * @name Touch#screenX
     * @type Number
     */
    this.screenX = touch.screenX;

    /**
     * @name Touch#screenY
     * @type Number
     */
    this.screenY = touch.screenY;

    /**
     * @name Touch#clientX
     * @type Number
     */
    this.clientX = touch.clientX;

    /**
     * @name Touch#clientY
     * @type Number
     */
    this.clientY = touch.clientY;

    /**
     * @name Touch#pageX
     * @type Number
     */
    this.pageX = touch.pageX;

    /**
     * @name Touch#pageY
     * @type Number
     */
    this.pageY = touch.pageY;
}


/**
 * Normalizes the browser's native TouchList by converting it into an array of
 * normalized Touch objects.
 *
 * @method  cloneTouchList
 * @private
 *
 * @param  {TouchList} touchList    The native TouchList array.
 * @return {Array.<Touch>}          An array of normalized Touch objects.
 */
function cloneTouchList(touchList) {
    if (!touchList) return EMPTY_ARRAY;
    // interface TouchList {
    //     readonly    attribute unsigned long length;
    //     getter Touch? item (unsigned long index);
    // };

    var touchListArray = [];
    for (var i = 0; i < touchList.length; i++) {
        touchListArray[i] = new Touch(touchList[i]);
    }
    return touchListArray;
}

/**
 * See [Touch Event Interface](http://www.w3.org/TR/2013/REC-touch-events-20131010/#touchevent-interface).
 *
 * @class TouchEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function TouchEvent(ev) {
    // interface TouchEvent : UIEvent {
    //     readonly    attribute TouchList touches;
    //     readonly    attribute TouchList targetTouches;
    //     readonly    attribute TouchList changedTouches;
    //     readonly    attribute boolean   altKey;
    //     readonly    attribute boolean   metaKey;
    //     readonly    attribute boolean   ctrlKey;
    //     readonly    attribute boolean   shiftKey;
    // };
    UIEvent.call(this, ev);

    /**
     * @name TouchEvent#touches
     * @type Array.<Touch>
     */
    this.touches = cloneTouchList(ev.touches);

    /**
     * @name TouchEvent#targetTouches
     * @type Array.<Touch>
     */
    this.targetTouches = cloneTouchList(ev.targetTouches);

    /**
     * @name TouchEvent#changedTouches
     * @type TouchList
     */
    this.changedTouches = cloneTouchList(ev.changedTouches);

    /**
     * @name TouchEvent#altKey
     * @type Boolean
     */
    this.altKey = ev.altKey;

    /**
     * @name TouchEvent#metaKey
     * @type Boolean
     */
    this.metaKey = ev.metaKey;

    /**
     * @name TouchEvent#ctrlKey
     * @type Boolean
     */
    this.ctrlKey = ev.ctrlKey;

    /**
     * @name TouchEvent#shiftKey
     * @type Boolean
     */
    this.shiftKey = ev.shiftKey;
}

TouchEvent.prototype = Object.create(UIEvent.prototype);
TouchEvent.prototype.constructor = TouchEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
TouchEvent.prototype.toString = function toString () {
    return 'TouchEvent';
};

module.exports = TouchEvent;

},{"./UIEvent":23}],23:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Event = require('./Event');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428).
 *
 * @class UIEvent
 * @augments Event
 *
 * @param  {Event} ev   The native DOM event.
 */
function UIEvent(ev) {
    // [Constructor(DOMString type, optional UIEventInit eventInitDict)]
    // interface UIEvent : Event {
    //     readonly    attribute Window? view;
    //     readonly    attribute long    detail;
    // };
    Event.call(this, ev);

    /**
     * @name UIEvent#detail
     * @type Number
     */
    this.detail = ev.detail;
}

UIEvent.prototype = Object.create(Event.prototype);
UIEvent.prototype.constructor = UIEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
UIEvent.prototype.toString = function toString () {
    return 'UIEvent';
};

module.exports = UIEvent;

},{"./Event":16}],24:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var MouseEvent = require('./MouseEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-wheelevents).
 *
 * @class WheelEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function WheelEvent(ev) {
    // [Constructor(DOMString typeArg, optional WheelEventInit wheelEventInitDict)]
    // interface WheelEvent : MouseEvent {
    //     // DeltaModeCode
    //     const unsigned long DOM_DELTA_PIXEL = 0x00;
    //     const unsigned long DOM_DELTA_LINE = 0x01;
    //     const unsigned long DOM_DELTA_PAGE = 0x02;
    //     readonly    attribute double        deltaX;
    //     readonly    attribute double        deltaY;
    //     readonly    attribute double        deltaZ;
    //     readonly    attribute unsigned long deltaMode;
    // };

    MouseEvent.call(this, ev);

    /**
     * @name WheelEvent#DOM_DELTA_PIXEL
     * @type Number
     */
    this.DOM_DELTA_PIXEL = 0x00;

    /**
     * @name WheelEvent#DOM_DELTA_LINE
     * @type Number
     */
    this.DOM_DELTA_LINE = 0x01;

    /**
     * @name WheelEvent#DOM_DELTA_PAGE
     * @type Number
     */
    this.DOM_DELTA_PAGE = 0x02;

    /**
     * @name WheelEvent#deltaX
     * @type Number
     */
    this.deltaX = ev.deltaX;

    /**
     * @name WheelEvent#deltaY
     * @type Number
     */
    this.deltaY = ev.deltaY;

    /**
     * @name WheelEvent#deltaZ
     * @type Number
     */
    this.deltaZ = ev.deltaZ;

    /**
     * @name WheelEvent#deltaMode
     * @type Number
     */
    this.deltaMode = ev.deltaMode;
}

WheelEvent.prototype = Object.create(MouseEvent.prototype);
WheelEvent.prototype.constructor = WheelEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
WheelEvent.prototype.toString = function toString () {
    return 'WheelEvent';
};

module.exports = WheelEvent;

},{"./MouseEvent":21}],25:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A two-dimensional vector.
 *
 * @class Vec2
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 */
var Vec2 = function(x, y) {
    if (x instanceof Array || x instanceof Float32Array) {
        this.x = x[0] || 0;
        this.y = x[1] || 0;
    }
    else {
        this.x = x || 0;
        this.y = y || 0;
    }
};

/**
 * Set the components of the current Vec2.
 *
 * @method
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 *
 * @return {Vec2} this
 */
Vec2.prototype.set = function set(x, y) {
    if (x != null) this.x = x;
    if (y != null) this.y = y;
    return this;
};

/**
 * Add the input v to the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to add.
 *
 * @return {Vec2} this
 */
Vec2.prototype.add = function add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
};

/**
 * Subtract the input v from the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to subtract.
 *
 * @return {Vec2} this
 */
Vec2.prototype.subtract = function subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
};

/**
 * Scale the current Vec2 by a scalar or Vec2.
 *
 * @method
 *
 * @param {Number|Vec2} s The Number or vec2 by which to scale.
 *
 * @return {Vec2} this
 */
Vec2.prototype.scale = function scale(s) {
    if (s instanceof Vec2) {
        this.x *= s.x;
        this.y *= s.y;
    }
    else {
        this.x *= s;
        this.y *= s;
    }
    return this;
};

/**
 * Rotate the Vec2 counter-clockwise by theta about the z-axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec2} this
 */
Vec2.prototype.rotate = function(theta) {
    var x = this.x;
    var y = this.y;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = x * cosTheta - y * sinTheta;
    this.y = x * sinTheta + y * cosTheta;

    return this;
};

/**
 * The dot product of of the current Vec2 with the input Vec2.
 *
 * @method
 *
 * @param {Number} v The other Vec2.
 *
 * @return {Vec2} this
 */
Vec2.prototype.dot = function(v) {
    return this.x * v.x + this.y * v.y;
};

/**
 * The cross product of of the current Vec2 with the input Vec2.
 *
 * @method
 *
 * @param {Number} v The other Vec2.
 *
 * @return {Vec2} this
 */
Vec2.prototype.cross = function(v) {
    return this.x * v.y - this.y * v.x;
};

/**
 * Preserve the magnitude but invert the orientation of the current Vec2.
 *
 * @method
 *
 * @return {Vec2} this
 */
Vec2.prototype.invert = function invert() {
    this.x *= -1;
    this.y *= -1;
    return this;
};

/**
 * Apply a function component-wise to the current Vec2.
 *
 * @method
 *
 * @param {Function} fn Function to apply.
 *
 * @return {Vec2} this
 */
Vec2.prototype.map = function map(fn) {
    this.x = fn(this.x);
    this.y = fn(this.y);
    return this;
};

/**
 * Get the magnitude of the current Vec2.
 *
 * @method
 *
 * @return {Number} the length of the vector
 */
Vec2.prototype.length = function length() {
    var x = this.x;
    var y = this.y;

    return Math.sqrt(x * x + y * y);
};

/**
 * Copy the input onto the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v Vec2 to copy
 *
 * @return {Vec2} this
 */
Vec2.prototype.copy = function copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
};

/**
 * Reset the current Vec2.
 *
 * @method
 *
 * @return {Vec2} this
 */
Vec2.prototype.clear = function clear() {
    this.x = 0;
    this.y = 0;
    return this;
};

/**
 * Check whether the magnitude of the current Vec2 is exactly 0.
 *
 * @method
 *
 * @return {Boolean} whether or not the length is 0
 */
Vec2.prototype.isZero = function isZero() {
    if (this.x !== 0 || this.y !== 0) return false;
    else return true;
};

/**
 * The array form of the current Vec2.
 *
 * @method
 *
 * @return {Array} the Vec to as an array
 */
Vec2.prototype.toArray = function toArray() {
    return [this.x, this.y];
};

/**
 * Normalize the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The reference Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The normalized Vec2.
 */
Vec2.normalize = function normalize(v, output) {
    var x = v.x;
    var y = v.y;

    var length = Math.sqrt(x * x + y * y) || 1;
    length = 1 / length;
    output.x = v.x * length;
    output.y = v.y * length;

    return output;
};

/**
 * Clone the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to clone.
 *
 * @return {Vec2} The cloned Vec2.
 */
Vec2.clone = function clone(v) {
    return new Vec2(v.x, v.y);
};

/**
 * Add the input Vec2's.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the addition.
 */
Vec2.add = function add(v1, v2, output) {
    output.x = v1.x + v2.x;
    output.y = v1.y + v2.y;

    return output;
};

/**
 * Subtract the second Vec2 from the first.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the subtraction.
 */
Vec2.subtract = function subtract(v1, v2, output) {
    output.x = v1.x - v2.x;
    output.y = v1.y - v2.y;
    return output;
};

/**
 * Scale the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The reference Vec2.
 * @param {Number} s Number to scale by.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the scaling.
 */
Vec2.scale = function scale(v, s, output) {
    output.x = v.x * s;
    output.y = v.y * s;
    return output;
};

/**
 * The dot product of the input Vec2's.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 *
 * @return {Number} The dot product.
 */
Vec2.dot = function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
};

/**
 * The cross product of the input Vec2's.
 *
 * @method
 *
 * @param {Number} v1 The left Vec2.
 * @param {Number} v2 The right Vec2.
 *
 * @return {Number} The z-component of the cross product.
 */
Vec2.cross = function(v1,v2) {
    return v1.x * v2.y - v1.y * v2.x;
};

module.exports = Vec2;

},{}],26:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A three-dimensional vector.
 *
 * @class Vec3
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 * @param {Number} z The z component.
 */
var Vec3 = function(x ,y, z){
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
};

/**
 * Set the components of the current Vec3.
 *
 * @method
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 * @param {Number} z The z component.
 *
 * @return {Vec3} this
 */
Vec3.prototype.set = function set(x, y, z) {
    if (x != null) this.x = x;
    if (y != null) this.y = y;
    if (z != null) this.z = z;

    return this;
};

/**
 * Add the input v to the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to add.
 *
 * @return {Vec3} this
 */
Vec3.prototype.add = function add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
};

/**
 * Subtract the input v from the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to subtract.
 *
 * @return {Vec3} this
 */
Vec3.prototype.subtract = function subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;
};

/**
 * Rotate the current Vec3 by theta clockwise about the x axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateX = function rotateX(theta) {
    var y = this.y;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.y = y * cosTheta - z * sinTheta;
    this.z = y * sinTheta + z * cosTheta;

    return this;
};

/**
 * Rotate the current Vec3 by theta clockwise about the y axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateY = function rotateY(theta) {
    var x = this.x;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = z * sinTheta + x * cosTheta;
    this.z = z * cosTheta - x * sinTheta;

    return this;
};

/**
 * Rotate the current Vec3 by theta clockwise about the z axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateZ = function rotateZ(theta) {
    var x = this.x;
    var y = this.y;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = x * cosTheta - y * sinTheta;
    this.y = x * sinTheta + y * cosTheta;

    return this;
};

/**
 * The dot product of the current Vec3 with input Vec3 v.
 *
 * @method
 *
 * @param {Vec3} v The other Vec3.
 *
 * @return {Vec3} this
 */
Vec3.prototype.dot = function dot(v) {
    return this.x*v.x + this.y*v.y + this.z*v.z;
};

/**
 * The dot product of the current Vec3 with input Vec3 v.
 * Stores the result in the current Vec3.
 *
 * @method cross
 *
 * @param {Vec3} v The other Vec3
 *
 * @return {Vec3} this
 */
Vec3.prototype.cross = function cross(v) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var vx = v.x;
    var vy = v.y;
    var vz = v.z;

    this.x = y * vz - z * vy;
    this.y = z * vx - x * vz;
    this.z = x * vy - y * vx;
    return this;
};

/**
 * Scale the current Vec3 by a scalar.
 *
 * @method
 *
 * @param {Number} s The Number by which to scale
 *
 * @return {Vec3} this
 */
Vec3.prototype.scale = function scale(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;

    return this;
};

/**
 * Preserve the magnitude but invert the orientation of the current Vec3.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.invert = function invert() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;

    return this;
};

/**
 * Apply a function component-wise to the current Vec3.
 *
 * @method
 *
 * @param {Function} fn Function to apply.
 *
 * @return {Vec3} this
 */
Vec3.prototype.map = function map(fn) {
    this.x = fn(this.x);
    this.y = fn(this.y);
    this.z = fn(this.z);

    return this;
};

/**
 * The magnitude of the current Vec3.
 *
 * @method
 *
 * @return {Number} the magnitude of the Vec3
 */
Vec3.prototype.length = function length() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    return Math.sqrt(x * x + y * y + z * z);
};

/**
 * The magnitude squared of the current Vec3.
 *
 * @method
 *
 * @return {Number} magnitude of the Vec3 squared
 */
Vec3.prototype.lengthSq = function lengthSq() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    return x * x + y * y + z * z;
};

/**
 * Copy the input onto the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v Vec3 to copy
 *
 * @return {Vec3} this
 */
Vec3.prototype.copy = function copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
};

/**
 * Reset the current Vec3.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.clear = function clear() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    return this;
};

/**
 * Check whether the magnitude of the current Vec3 is exactly 0.
 *
 * @method
 *
 * @return {Boolean} whether or not the magnitude is zero
 */
Vec3.prototype.isZero = function isZero() {
    return this.x === 0 && this.y === 0 && this.z === 0;
};

/**
 * The array form of the current Vec3.
 *
 * @method
 *
 * @return {Array} a three element array representing the components of the Vec3
 */
Vec3.prototype.toArray = function toArray() {
    return [this.x, this.y, this.z];
};

/**
 * Preserve the orientation but change the length of the current Vec3 to 1.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.normalize = function normalize() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var len = Math.sqrt(x * x + y * y + z * z) || 1;
    len = 1 / len;

    this.x *= len;
    this.y *= len;
    this.z *= len;
    return this;
};

/**
 * Apply the rotation corresponding to the input (unit) Quaternion
 * to the current Vec3.
 *
 * @method
 *
 * @param {Quaternion} q Unit Quaternion representing the rotation to apply
 *
 * @return {Vec3} this
 */
Vec3.prototype.applyRotation = function applyRotation(q) {
    var cw = q.w;
    var cx = -q.x;
    var cy = -q.y;
    var cz = -q.z;

    var vx = this.x;
    var vy = this.y;
    var vz = this.z;

    var tw = -cx * vx - cy * vy - cz * vz;
    var tx = vx * cw + vy * cz - cy * vz;
    var ty = vy * cw + cx * vz - vx * cz;
    var tz = vz * cw + vx * cy - cx * vy;

    var w = cw;
    var x = -cx;
    var y = -cy;
    var z = -cz;

    this.x = tx * w + x * tw + y * tz - ty * z;
    this.y = ty * w + y * tw + tx * z - x * tz;
    this.z = tz * w + z * tw + x * ty - tx * y;
    return this;
};

/**
 * Apply the input Mat33 the the current Vec3.
 *
 * @method
 *
 * @param {Mat33} matrix Mat33 to apply
 *
 * @return {Vec3} this
 */
Vec3.prototype.applyMatrix = function applyMatrix(matrix) {
    var M = matrix.get();

    var x = this.x;
    var y = this.y;
    var z = this.z;

    this.x = M[0]*x + M[1]*y + M[2]*z;
    this.y = M[3]*x + M[4]*y + M[5]*z;
    this.z = M[6]*x + M[7]*y + M[8]*z;
    return this;
};

/**
 * Normalize the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The normalize Vec3.
 */
Vec3.normalize = function normalize(v, output) {
    var x = v.x;
    var y = v.y;
    var z = v.z;

    var length = Math.sqrt(x * x + y * y + z * z) || 1;
    length = 1 / length;

    output.x = x * length;
    output.y = y * length;
    output.z = z * length;
    return output;
};

/**
 * Apply a rotation to the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Quaternion} q Unit Quaternion representing the rotation to apply.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The rotated version of the input Vec3.
 */
Vec3.applyRotation = function applyRotation(v, q, output) {
    var cw = q.w;
    var cx = -q.x;
    var cy = -q.y;
    var cz = -q.z;

    var vx = v.x;
    var vy = v.y;
    var vz = v.z;

    var tw = -cx * vx - cy * vy - cz * vz;
    var tx = vx * cw + vy * cz - cy * vz;
    var ty = vy * cw + cx * vz - vx * cz;
    var tz = vz * cw + vx * cy - cx * vy;

    var w = cw;
    var x = -cx;
    var y = -cy;
    var z = -cz;

    output.x = tx * w + x * tw + y * tz - ty * z;
    output.y = ty * w + y * tw + tx * z - x * tz;
    output.z = tz * w + z * tw + x * ty - tx * y;
    return output;
};

/**
 * Clone the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to clone.
 *
 * @return {Vec3} The cloned Vec3.
 */
Vec3.clone = function clone(v) {
    return new Vec3(v.x, v.y, v.z);
};

/**
 * Add the input Vec3's.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the addition.
 */
Vec3.add = function add(v1, v2, output) {
    output.x = v1.x + v2.x;
    output.y = v1.y + v2.y;
    output.z = v1.z + v2.z;
    return output;
};

/**
 * Subtract the second Vec3 from the first.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the subtraction.
 */
Vec3.subtract = function subtract(v1, v2, output) {
    output.x = v1.x - v2.x;
    output.y = v1.y - v2.y;
    output.z = v1.z - v2.z;
    return output;
};

/**
 * Scale the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Number} s Number to scale by.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the scaling.
 */
Vec3.scale = function scale(v, s, output) {
    output.x = v.x * s;
    output.y = v.y * s;
    output.z = v.z * s;
    return output;
};

/**
 * The dot product of the input Vec3's.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 *
 * @return {Number} The dot product.
 */
Vec3.dot = function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
};

/**
 * The (right-handed) cross product of the input Vec3's.
 * v1 x v2.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Object} the object the result of the cross product was placed into
 */
Vec3.cross = function cross(v1, v2, output) {
    var x1 = v1.x;
    var y1 = v1.y;
    var z1 = v1.z;
    var x2 = v2.x;
    var y2 = v2.y;
    var z2 = v2.z;

    output.x = y1 * z2 - z1 * y2;
    output.y = z1 * x2 - x1 * z2;
    output.z = x1 * y2 - y1 * x2;
    return output;
};

/**
 * The projection of v1 onto v2.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Object} the object the result of the cross product was placed into 
 */
Vec3.project = function project(v1, v2, output) {
    var x1 = v1.x;
    var y1 = v1.y;
    var z1 = v1.z;
    var x2 = v2.x;
    var y2 = v2.y;
    var z2 = v2.z;

    var scale = x1 * x2 + y1 * y2 + z1 * z2;
    scale /= x2 * x2 + y2 * y2 + z2 * z2;

    output.x = x2 * scale;
    output.y = y2 * scale;
    output.z = z2 * scale;

    return output;
};

module.exports = Vec3;

},{}],27:[function(require,module,exports){
module.exports = noop

function noop() {
  throw new Error(
      'You should bundle your code ' +
      'using `glslify` as a transform.'
  )
}

},{}],28:[function(require,module,exports){
module.exports = programify

function programify(vertex, fragment, uniforms, attributes) {
  return {
    vertex: vertex, 
    fragment: fragment,
    uniforms: uniforms, 
    attributes: attributes
  };
}

},{}],29:[function(require,module,exports){
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license

'use strict';

var lastTime = 0;
var vendors = ['ms', 'moz', 'webkit', 'o'];

var rAF, cAF;

if (typeof window === 'object') {
    rAF = window.requestAnimationFrame;
    cAF = window.cancelAnimationFrame || window.cancelRequestAnimationFrame;
    for (var x = 0; x < vendors.length && !rAF; ++x) {
        rAF = window[vendors[x] + 'RequestAnimationFrame'];
        cAF = window[vendors[x] + 'CancelRequestAnimationFrame'] ||
              window[vendors[x] + 'CancelAnimationFrame'];
    }

    if (rAF && !cAF) {
        // cAF not supported.
        // Fall back to setInterval for now (very rare).
        rAF = null;
    }
}

if (!rAF) {
    var now = Date.now ? Date.now : function () {
        return new Date().getTime();
    };

    rAF = function(callback) {
        var currTime = now();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = setTimeout(function () {
            callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };

    cAF = function (id) {
        clearTimeout(id);
    };
}

var animationFrame = {
    /**
     * Cross browser version of [requestAnimationFrame]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame}.
     *
     * Used by Engine in order to establish a render loop.
     *
     * If no (vendor prefixed version of) `requestAnimationFrame` is available,
     * `setTimeout` will be used in order to emulate a render loop running at
     * approximately 60 frames per second.
     *
     * @method  requestAnimationFrame
     *
     * @param   {Function}  callback function to be invoked on the next frame.
     * @return  {Number}    requestId to be used to cancel the request using
     *                      {@link cancelAnimationFrame}.
     */
    requestAnimationFrame: rAF,

    /**
     * Cross browser version of [cancelAnimationFrame]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame}.
     *
     * Cancels a previously using [requestAnimationFrame]{@link animationFrame#requestAnimationFrame}
     * scheduled request.
     *
     * Used for immediately stopping the render loop within the Engine.
     *
     * @method  cancelAnimationFrame
     *
     * @param   {Number}    requestId of the scheduled callback function
     *                      returned by [requestAnimationFrame]{@link animationFrame#requestAnimationFrame}.
     */
    cancelAnimationFrame: cAF
};

module.exports = animationFrame;

},{}],30:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

module.exports = {
    requestAnimationFrame: require('./animationFrame').requestAnimationFrame,
    cancelAnimationFrame: require('./animationFrame').cancelAnimationFrame
};

},{"./animationFrame":29}],31:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var polyfills = require('../polyfills');
var rAF = polyfills.requestAnimationFrame;
var cAF = polyfills.cancelAnimationFrame;

/**
 * Boolean constant indicating whether the RequestAnimationFrameLoop has access
 * to the document. The document is being used in order to subscribe for
 * visibilitychange events used for normalizing the RequestAnimationFrameLoop
 * time when e.g. when switching tabs.
 *
 * @constant
 * @type {Boolean}
 */
var DOCUMENT_ACCESS = typeof document !== 'undefined';

if (DOCUMENT_ACCESS) {
    var VENDOR_HIDDEN, VENDOR_VISIBILITY_CHANGE;

    // Opera 12.10 and Firefox 18 and later support
    if (typeof document.hidden !== 'undefined') {
        VENDOR_HIDDEN = 'hidden';
        VENDOR_VISIBILITY_CHANGE = 'visibilitychange';
    }
    else if (typeof document.mozHidden !== 'undefined') {
        VENDOR_HIDDEN = 'mozHidden';
        VENDOR_VISIBILITY_CHANGE = 'mozvisibilitychange';
    }
    else if (typeof document.msHidden !== 'undefined') {
        VENDOR_HIDDEN = 'msHidden';
        VENDOR_VISIBILITY_CHANGE = 'msvisibilitychange';
    }
    else if (typeof document.webkitHidden !== 'undefined') {
        VENDOR_HIDDEN = 'webkitHidden';
        VENDOR_VISIBILITY_CHANGE = 'webkitvisibilitychange';
    }
}

/**
 * RequestAnimationFrameLoop class used for updating objects on a frame-by-frame.
 * Synchronizes the `update` method invocations to the refresh rate of the
 * screen. Manages the `requestAnimationFrame`-loop by normalizing the passed in
 * timestamp when switching tabs.
 *
 * @class RequestAnimationFrameLoop
 */
function RequestAnimationFrameLoop() {
    var _this = this;

    // References to objects to be updated on next frame.
    this._updates = [];

    this._looper = function(time) {
        _this.loop(time);
    };
    this._time = 0;
    this._stoppedAt = 0;
    this._sleep = 0;

    // Indicates whether the engine should be restarted when the tab/ window is
    // being focused again (visibility change).
    this._startOnVisibilityChange = true;

    // requestId as returned by requestAnimationFrame function;
    this._rAF = null;

    this._sleepDiff = true;

    // The engine is being started on instantiation.
    // TODO(alexanderGugel)
    this.start();

    // The RequestAnimationFrameLoop supports running in a non-browser
    // environment (e.g. Worker).
    if (DOCUMENT_ACCESS) {
        document.addEventListener(VENDOR_VISIBILITY_CHANGE, function() {
            _this._onVisibilityChange();
        });
    }
}

/**
 * Handle the switching of tabs.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
RequestAnimationFrameLoop.prototype._onVisibilityChange = function _onVisibilityChange() {
    if (document[VENDOR_HIDDEN]) {
        this._onUnfocus();
    }
    else {
        this._onFocus();
    }
};

/**
 * Internal helper function to be invoked as soon as the window/ tab is being
 * focused after a visibiltiy change.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
RequestAnimationFrameLoop.prototype._onFocus = function _onFocus() {
    if (this._startOnVisibilityChange) {
        this._start();
    }
};

/**
 * Internal helper function to be invoked as soon as the window/ tab is being
 * unfocused (hidden) after a visibiltiy change.
 *
 * @method  _onFocus
 * @private
 *
 * @return {undefined} undefined
 */
RequestAnimationFrameLoop.prototype._onUnfocus = function _onUnfocus() {
    this._stop();
};

/**
 * Starts the RequestAnimationFrameLoop. When switching to a differnt tab/
 * window (changing the visibiltiy), the engine will be retarted when switching
 * back to a visible state.
 *
 * @method
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.start = function start() {
    if (!this._running) {
        this._startOnVisibilityChange = true;
        this._start();
    }
    return this;
};

/**
 * Internal version of RequestAnimationFrameLoop's start function, not affecting
 * behavior on visibilty change.
 *
 * @method
 * @private
*
 * @return {undefined} undefined
 */
RequestAnimationFrameLoop.prototype._start = function _start() {
    this._running = true;
    this._sleepDiff = true;
    this._rAF = rAF(this._looper);
};

/**
 * Stops the RequestAnimationFrameLoop.
 *
 * @method
 * @private
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.stop = function stop() {
    if (this._running) {
        this._startOnVisibilityChange = false;
        this._stop();
    }
    return this;
};

/**
 * Internal version of RequestAnimationFrameLoop's stop function, not affecting
 * behavior on visibilty change.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
RequestAnimationFrameLoop.prototype._stop = function _stop() {
    this._running = false;
    this._stoppedAt = this._time;

    // Bug in old versions of Fx. Explicitly cancel.
    cAF(this._rAF);
};

/**
 * Determines whether the RequestAnimationFrameLoop is currently running or not.
 *
 * @method
 *
 * @return {Boolean} boolean value indicating whether the
 * RequestAnimationFrameLoop is currently running or not
 */
RequestAnimationFrameLoop.prototype.isRunning = function isRunning() {
    return this._running;
};

/**
 * Updates all registered objects.
 *
 * @method
 *
 * @param {Number} time high resolution timstamp used for invoking the `update`
 * method on all registered objects
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.step = function step (time) {
    this._time = time;
    if (this._sleepDiff) {
        this._sleep += time - this._stoppedAt;
        this._sleepDiff = false;
    }

    // The same timetamp will be emitted immediately before and after visibility
    // change.
    var normalizedTime = time - this._sleep;
    for (var i = 0, len = this._updates.length ; i < len ; i++) {
        this._updates[i].update(normalizedTime);
    }
    return this;
};

/**
 * Method being called by `requestAnimationFrame` on every paint. Indirectly
 * recursive by scheduling a future invocation of itself on the next paint.
 *
 * @method
 *
 * @param {Number} time high resolution timstamp used for invoking the `update`
 * method on all registered objects
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.loop = function loop(time) {
    this.step(time);
    this._rAF = rAF(this._looper);
    return this;
};

/**
 * Registeres an updateable object which `update` method should be invoked on
 * every paint, starting on the next paint (assuming the
 * RequestAnimationFrameLoop is running).
 *
 * @method
 *
 * @param {Object} updateable object to be updated
 * @param {Function} updateable.update update function to be called on the
 * registered object
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.update = function update(updateable) {
    if (this._updates.indexOf(updateable) === -1) {
        this._updates.push(updateable);
    }
    return this;
};

/**
 * Deregisters an updateable object previously registered using `update` to be
 * no longer updated.
 *
 * @method
 *
 * @param {Object} updateable updateable object previously registered using
 * `update`
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.noLongerUpdate = function noLongerUpdate(updateable) {
    var index = this._updates.indexOf(updateable);
    if (index > -1) {
        this._updates.splice(index, 1);
    }
    return this;
};

module.exports = RequestAnimationFrameLoop;

},{"../polyfills":30}],32:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Context = require('./Context');
var injectCSS = require('./inject-css');

/**
 * Instantiates a new Compositor.
 * The Compositor receives draw commands frm the UIManager and routes the to the
 * respective context objects.
 *
 * Upon creation, it injects a stylesheet used for styling the individual
 * renderers used in the context objects.
 *
 * @class Compositor
 * @constructor
 * @return {undefined} undefined
 */
function Compositor() {
    injectCSS();

    this._contexts = {};
    this._outCommands = [];
    this._inCommands = [];
    this._time = null;

    this._resized = false;

    var _this = this;
    window.addEventListener('resize', function() {
        _this._resized = true;
    });
}

/**
 * Retrieves the time being used by the internal clock managed by
 * `FamousEngine`.
 *
 * The time is being passed into core by the Engine through the UIManager.
 * Since core has the ability to scale the time, the time needs to be passed
 * back to the rendering system.
 *
 * @method
 *
 * @return {Number} time The clock time used in core.
 */
Compositor.prototype.getTime = function getTime() {
    return this._time;
};

/**
 * Schedules an event to be sent the next time the out command queue is being
 * flushed.
 *
 * @method
 * @private
 *
 * @param  {String} path Render path to the node the event should be triggered
 * on (*targeted event*)
 * @param  {String} ev Event type
 * @param  {Object} payload Event object (serializable using structured cloning
 * algorithm)
 *
 * @return {undefined} undefined
 */
Compositor.prototype.sendEvent = function sendEvent(path, ev, payload) {
    this._outCommands.push('WITH', path, 'TRIGGER', ev, payload);
};

/**
 * Internal helper method used for notifying externally
 * resized contexts (e.g. by resizing the browser window).
 *
 * @method
 * @private
 *
 * @param  {String} selector render path to the node (context) that should be
 * resized
 * @param  {Array} size new context size
 *
 * @return {undefined} undefined
 */
Compositor.prototype.sendResize = function sendResize (selector, size) {
    this.sendEvent(selector, 'CONTEXT_RESIZE', size);
};

/**
 * Internal helper method used by `drawCommands`.
 * Subsequent commands are being associated with the node defined the the path
 * following the `WITH` command.
 *
 * @method
 * @private
 *
 * @param  {Number} iterator position index within the commands queue
 * @param  {Array} commands remaining message queue received, used to
 * shift single messages from
 *
 * @return {undefined} undefined
 */
Compositor.prototype.handleWith = function handleWith (iterator, commands) {
    var path = commands[iterator];
    var pathArr = path.split('/');
    var context = this.getOrSetContext(pathArr.shift());
    return context.receive(path, commands, iterator);
};

/**
 * Retrieves the top-level Context associated with the passed in document
 * query selector. If no such Context exists, a new one will be instantiated.
 *
 * @method
 * @private
 *
 * @param  {String} selector document query selector used for retrieving the
 * DOM node the VirtualElement should be attached to
 *
 * @return {Context} context
 */
Compositor.prototype.getOrSetContext = function getOrSetContext(selector) {
    if (this._contexts[selector]) {
        return this._contexts[selector];
    }
    else {
        var context = new Context(selector, this);
        this._contexts[selector] = context;
        return context;
    }
};

/**
 * Internal helper method used by `drawCommands`.
 *
 * @method
 * @private
 *
 * @param  {Number} iterator position index within the command queue
 * @param  {Array} commands remaining message queue received, used to
 * shift single messages
 *
 * @return {undefined} undefined
 */
Compositor.prototype.giveSizeFor = function giveSizeFor(iterator, commands) {
    var selector = commands[iterator];
    var size = this.getOrSetContext(selector).getRootSize();
    this.sendResize(selector, size);
};

/**
 * Processes the previously via `receiveCommands` updated incoming "in"
 * command queue.
 * Called by UIManager on a frame by frame basis.
 *
 * @method
 *
 * @return {Array} outCommands set of commands to be sent back
 */
Compositor.prototype.drawCommands = function drawCommands() {
    var commands = this._inCommands;
    var localIterator = 0;
    var command = commands[localIterator];
    while (command) {
        switch (command) {
            case 'TIME':
                this._time = commands[++localIterator];
                break;
            case 'WITH':
                localIterator = this.handleWith(++localIterator, commands);
                break;
            case 'NEED_SIZE_FOR':
                this.giveSizeFor(++localIterator, commands);
                break;
        }
        command = commands[++localIterator];
    }

    // TODO: Switch to associative arrays here...

    for (var key in this._contexts) {
        this._contexts[key].draw();
    }

    if (this._resized) {
        this.updateSize();
    }

    return this._outCommands;
};


/**
 * Updates the size of all previously registered context objects.
 * This results into CONTEXT_RESIZE events being sent and the root elements
 * used by the individual renderers being resized to the the DOMRenderer's root
 * size.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Compositor.prototype.updateSize = function updateSize() {
    for (var selector in this._contexts) {
        this._contexts[selector].updateSize();
    }
};

/**
 * Used by ThreadManager to update the internal queue of incoming commands.
 * Receiving commands does not immediately start the rendering process.
 *
 * @method
 *
 * @param  {Array} commands command queue to be processed by the compositor's
 * `drawCommands` method
 *
 * @return {undefined} undefined
 */
Compositor.prototype.receiveCommands = function receiveCommands(commands) {
    var len = commands.length;
    for (var i = 0; i < len; i++) {
        this._inCommands.push(commands[i]);
    }
};

/**
 * Flushes the queue of outgoing "out" commands.
 * Called by ThreadManager.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Compositor.prototype.clearCommands = function clearCommands() {
    this._inCommands.length = 0;
    this._outCommands.length = 0;
    this._resized = false;
};

module.exports = Compositor;

},{"./Context":33,"./inject-css":35}],33:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var WebGLRenderer = require('../webgl-renderers/WebGLRenderer');
var Camera = require('../components/Camera');
var DOMRenderer = require('../dom-renderers/DOMRenderer');

/**
 * Context is a render layer with its own WebGLRenderer and DOMRenderer.
 * It is the interface between the Compositor which receives commands
 * and the renderers that interpret them. It also relays information to
 * the renderers about resizing.
 *
 * The DOMElement at the given query selector is used as the root. A
 * new DOMElement is appended to this root element, and used as the
 * parent element for all Famous DOM rendering at this context. A
 * canvas is added and used for all WebGL rendering at this context.
 *
 * @class Context
 * @constructor
 *
 * @param {String} selector Query selector used to locate root element of
 * context layer.
 * @param {Compositor} compositor Compositor reference to pass down to
 * WebGLRenderer.
 *
 * @return {undefined} undefined
 */
function Context(selector, compositor) {
    this._compositor = compositor;
    this._rootEl = document.querySelector(selector);

    this._selector = selector;

    // Create DOM element to be used as root for all famous DOM
    // rendering and append element to the root element.

    var DOMLayerEl = document.createElement('div');
    this._rootEl.appendChild(DOMLayerEl);

    // Instantiate renderers

    this.DOMRenderer = new DOMRenderer(DOMLayerEl, selector, compositor);
    this.WebGLRenderer = null;
    this.canvas = null;

    // State holders

    this._renderState = {
        projectionType: Camera.ORTHOGRAPHIC_PROJECTION,
        perspectiveTransform: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        viewTransform: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        viewDirty: false,
        perspectiveDirty: false
    };

    this._size = [];
    this._children = {};
    this._elementHash = {};

    this._meshTransform = [];
    this._meshSize = [0, 0, 0];
}

/**
 * Queries DOMRenderer size and updates canvas size. Relays size information to
 * WebGLRenderer.
 *
 * @return {Context} this
 */
Context.prototype.updateSize = function () {
    var newSize = this.DOMRenderer.getSize();
    this._compositor.sendResize(this._selector, newSize);

    if (this.canvas && this.WebGLRenderer) {
        this.WebGLRenderer.updateSize(newSize);
    }

    return this;
};

/**
 * Draw function called after all commands have been handled for current frame.
 * Issues draw commands to all renderers with current renderState.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Context.prototype.draw = function draw() {
    this.DOMRenderer.draw(this._renderState);
    if (this.WebGLRenderer) this.WebGLRenderer.draw(this._renderState);

    if (this._renderState.perspectiveDirty) this._renderState.perspectiveDirty = false;
    if (this._renderState.viewDirty) this._renderState.viewDirty = false;
};

/**
 * Gets the size of the parent element of the DOMRenderer for this context.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Context.prototype.getRootSize = function getRootSize() {
    return this.DOMRenderer.getSize();
};

/**
 * Handles initialization of WebGLRenderer when necessary, including creation
 * of the canvas element and instantiation of the renderer. Also updates size
 * to pass size information to the renderer.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Context.prototype.initWebGL = function initWebGL() {
    this.canvas = document.createElement('canvas');
    this._rootEl.appendChild(this.canvas);
    this.WebGLRenderer = new WebGLRenderer(this.canvas, this._compositor);
    this.updateSize();
};

/**
 * Handles delegation of commands to renderers of this context.
 *
 * @method
 *
 * @param {String} path String used as identifier of a given node in the
 * scene graph.
 * @param {Array} commands List of all commands from this frame.
 * @param {Number} iterator Number indicating progress through the command
 * queue.
 *
 * @return {Number} iterator indicating progress through the command queue.
 */
Context.prototype.receive = function receive(path, commands, iterator) {
    var localIterator = iterator;

    var command = commands[++localIterator];
    this.DOMRenderer.loadPath(path);
    this.DOMRenderer.findTarget();
    while (command) {

        switch (command) {
            case 'INIT_DOM':
                this.DOMRenderer.insertEl(commands[++localIterator]);
                break;

            case 'DOM_RENDER_SIZE':
                this.DOMRenderer.getSizeOf(commands[++localIterator]);
                break;

            case 'CHANGE_TRANSFORM':
                for (var i = 0 ; i < 16 ; i++) this._meshTransform[i] = commands[++localIterator];

                this.DOMRenderer.setMatrix(this._meshTransform);

                if (this.WebGLRenderer)
                    this.WebGLRenderer.setCutoutUniform(path, 'u_transform', this._meshTransform);

                break;

            case 'CHANGE_SIZE':
                var width = commands[++localIterator];
                var height = commands[++localIterator];

                this.DOMRenderer.setSize(width, height);
                if (this.WebGLRenderer) {
                    this._meshSize[0] = width;
                    this._meshSize[1] = height;
                    this.WebGLRenderer.setCutoutUniform(path, 'u_size', this._meshSize);
                }
                break;

            case 'CHANGE_PROPERTY':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.setProperty(commands[++localIterator], commands[++localIterator]);
                break;

            case 'CHANGE_CONTENT':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.setContent(commands[++localIterator]);
                break;

            case 'CHANGE_ATTRIBUTE':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.setAttribute(commands[++localIterator], commands[++localIterator]);
                break;

            case 'ADD_CLASS':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.addClass(commands[++localIterator]);
                break;

            case 'REMOVE_CLASS':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.removeClass(commands[++localIterator]);
                break;

            case 'SUBSCRIBE':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.subscribe(commands[++localIterator], commands[++localIterator]);
                break;

            case 'GL_SET_DRAW_OPTIONS':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setMeshOptions(path, commands[++localIterator]);
                break;

            case 'GL_AMBIENT_LIGHT':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setAmbientLightColor(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_LIGHT_POSITION':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setLightPosition(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_LIGHT_COLOR':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setLightColor(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'MATERIAL_INPUT':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.handleMaterialInput(
                    path,
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_SET_GEOMETRY':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setGeometry(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_UNIFORMS':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setMeshUniform(
                    path,
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_BUFFER_DATA':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.bufferData(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_CUTOUT_STATE':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setCutoutState(path, commands[++localIterator]);
                break;

            case 'GL_MESH_VISIBILITY':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setMeshVisibility(path, commands[++localIterator]);
                break;

            case 'GL_REMOVE_MESH':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.removeMesh(path);
                break;

            case 'PINHOLE_PROJECTION':
                this._renderState.projectionType = Camera.PINHOLE_PROJECTION;
                this._renderState.perspectiveTransform[11] = -1 / commands[++localIterator];

                this._renderState.perspectiveDirty = true;
                break;

            case 'ORTHOGRAPHIC_PROJECTION':
                this._renderState.projectionType = Camera.ORTHOGRAPHIC_PROJECTION;
                this._renderState.perspectiveTransform[11] = 0;

                this._renderState.perspectiveDirty = true;
                break;

            case 'CHANGE_VIEW_TRANSFORM':
                this._renderState.viewTransform[0] = commands[++localIterator];
                this._renderState.viewTransform[1] = commands[++localIterator];
                this._renderState.viewTransform[2] = commands[++localIterator];
                this._renderState.viewTransform[3] = commands[++localIterator];

                this._renderState.viewTransform[4] = commands[++localIterator];
                this._renderState.viewTransform[5] = commands[++localIterator];
                this._renderState.viewTransform[6] = commands[++localIterator];
                this._renderState.viewTransform[7] = commands[++localIterator];

                this._renderState.viewTransform[8] = commands[++localIterator];
                this._renderState.viewTransform[9] = commands[++localIterator];
                this._renderState.viewTransform[10] = commands[++localIterator];
                this._renderState.viewTransform[11] = commands[++localIterator];

                this._renderState.viewTransform[12] = commands[++localIterator];
                this._renderState.viewTransform[13] = commands[++localIterator];
                this._renderState.viewTransform[14] = commands[++localIterator];
                this._renderState.viewTransform[15] = commands[++localIterator];

                this._renderState.viewDirty = true;
                break;

            case 'WITH': return localIterator - 1;
        }

        command = commands[++localIterator];
    }

    return localIterator;
};

module.exports = Context;

},{"../components/Camera":1,"../dom-renderers/DOMRenderer":12,"../webgl-renderers/WebGLRenderer":49}],34:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The UIManager is being updated by an Engine by consecutively calling its
 * `update` method. It can either manage a real Web-Worker or the global
 * FamousEngine core singleton.
 *
 * @example
 * var compositor = new Compositor();
 * var engine = new Engine();
 *
 * // Using a Web Worker
 * var worker = new Worker('worker.bundle.js');
 * var threadmanger = new UIManager(worker, compositor, engine);
 *
 * // Without using a Web Worker
 * var threadmanger = new UIManager(Famous, compositor, engine);
 *
 * @class  UIManager
 * @constructor
 *
 * @param {Famous|Worker} thread The thread being used to receive messages
 * from and post messages to. Expected to expose a WebWorker-like API, which
 * means providing a way to listen for updates by setting its `onmessage`
 * property and sending updates using `postMessage`.
 * @param {Compositor} compositor an instance of Compositor used to extract
 * enqueued draw commands from to be sent to the thread.
 * @param {RenderLoop} renderLoop an instance of Engine used for executing
 * the `ENGINE` commands on.
 */
function UIManager (thread, compositor, renderLoop) {
    this._thread = thread;
    this._compositor = compositor;
    this._renderLoop = renderLoop;

    this._renderLoop.update(this);

    var _this = this;
    this._thread.onmessage = function (ev) {
        var message = ev.data ? ev.data : ev;
        if (message[0] === 'ENGINE') {
            switch (message[1]) {
                case 'START':
                    _this._renderLoop.start();
                    break;
                case 'STOP':
                    _this._renderLoop.stop();
                    break;
                default:
                    console.error(
                        'Unknown ENGINE command "' + message[1] + '"'
                    );
                    break;
            }
        }
        else {
            _this._compositor.receiveCommands(message);
        }
    };
    this._thread.onerror = function (error) {
        console.error(error);
    };
}

/**
 * Returns the thread being used by the UIManager.
 * This could either be an an actual web worker or a `FamousEngine` singleton.
 *
 * @method
 *
 * @return {Worker|FamousEngine} Either a web worker or a `FamousEngine` singleton.
 */
UIManager.prototype.getThread = function getThread() {
    return this._thread;
};

/**
 * Returns the compositor being used by this UIManager.
 *
 * @method
 *
 * @return {Compositor} The compositor used by the UIManager.
 */
UIManager.prototype.getCompositor = function getCompositor() {
    return this._compositor;
};

/**
 * Returns the engine being used by this UIManager.
 *
 * @method
 *
 * @return {Engine} The engine used by the UIManager.
 */
UIManager.prototype.getEngine = function getEngine() {
    return this._renderLoop;
};

/**
 * Update method being invoked by the Engine on every `requestAnimationFrame`.
 * Used for updating the notion of time within the managed thread by sending
 * a FRAME command and sending messages to
 *
 * @method
 *
 * @param  {Number} time unix timestamp to be passed down to the worker as a
 * FRAME command
 * @return {undefined} undefined
 */
UIManager.prototype.update = function update (time) {
    this._thread.postMessage(['FRAME', time]);
    var threadMessages = this._compositor.drawCommands();
    this._thread.postMessage(threadMessages);
    this._compositor.clearCommands();
};

module.exports = UIManager;

},{}],35:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var css = '.famous-dom-renderer {' +
    'width:100%;' +
    'height:100%;' +
    'transform-style:preserve-3d;' +
    '-webkit-transform-style:preserve-3d;' +
'}' +

'.famous-dom-element {' +
    '-webkit-transform-origin:0% 0%;' +
    'transform-origin:0% 0%;' +
    '-webkit-backface-visibility:visible;' +
    'backface-visibility:visible;' +
    '-webkit-transform-style:preserve-3d;' +
    'transform-style:preserve-3d;' +
    '-webkit-tap-highlight-color:transparent;' +
    'pointer-events:auto;' +
    'z-index:1;' +
'}' +

'.famous-dom-element-content,' +
'.famous-dom-element {' +
    'position:absolute;' +
    'box-sizing:border-box;' +
    '-moz-box-sizing:border-box;' +
    '-webkit-box-sizing:border-box;' +
'}' +

'.famous-webgl-renderer {' +
    '-webkit-transform:translateZ(1000000px);' +  /* TODO: Fix when Safari Fixes*/
    'transform:translateZ(1000000px);' +
    'pointer-events:none;' +
    'position:absolute;' +
    'z-index:1;' +
    'top:0;' +
    'width:100%;' +
    'height:100%;' +
'}';

var INJECTED = typeof document === 'undefined';

function injectCSS() {
    if (INJECTED) return;
    INJECTED = true;
    if (document.createStyleSheet) {
        var sheet = document.createStyleSheet();
        sheet.cssText = css;
    }
    else {
        var head = document.getElementsByTagName('head')[0];
        var style = document.createElement('style');

        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        }
        else {
            style.appendChild(document.createTextNode(css));
        }

        (head ? head : document.documentElement).appendChild(style);
    }
}

module.exports = injectCSS;

},{}],36:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A lightweight, featureless EventEmitter.
 *
 * @class CallbackStore
 * @constructor
 */
function CallbackStore () {
    this._events = {};
}

/**
 * Adds a listener for the specified event (= key).
 *
 * @method on
 * @chainable
 *
 * @param  {String}   key       The event type (e.g. `click`).
 * @param  {Function} callback  A callback function to be invoked whenever `key`
 *                              event is being triggered.
 * @return {Function} destroy   A function to call if you want to remove the
 *                              callback.
 */
CallbackStore.prototype.on = function on (key, callback) {
    if (!this._events[key]) this._events[key] = [];
    var callbackList = this._events[key];
    callbackList.push(callback);
    return function () {
        callbackList.splice(callbackList.indexOf(callback), 1);
    };
};

/**
 * Removes a previously added event listener.
 *
 * @method off
 * @chainable
 *
 * @param  {String} key         The event type from which the callback function
 *                              should be removed.
 * @param  {Function} callback  The callback function to be removed from the
 *                              listeners for key.
 * @return {CallbackStore} this
 */
CallbackStore.prototype.off = function off (key, callback) {
    var events = this._events[key];
    if (events) events.splice(events.indexOf(callback), 1);
    return this;
};

/**
 * Invokes all the previously for this key registered callbacks.
 *
 * @method trigger
 * @chainable
 *
 * @param  {String}        key      The event type.
 * @param  {Object}        payload  The event payload (event object).
 * @return {CallbackStore} this
 */
CallbackStore.prototype.trigger = function trigger (key, payload) {
    var events = this._events[key];
    if (events) {
        var i = 0;
        var len = events.length;
        for (; i < len ; i++) events[i](payload);
    }
    return this;
};

module.exports = CallbackStore;

},{}],37:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Deep clone an object.
 *
 * @method  clone
 *
 * @param {Object} b       Object to be cloned.
 * @return {Object} a      Cloned object (deep equality).
 */
var clone = function clone(b) {
    var a;
    if (typeof b === 'object') {
        a = (b instanceof Array) ? [] : {};
        for (var key in b) {
            if (typeof b[key] === 'object' && b[key] !== null) {
                if (b[key] instanceof Array) {
                    a[key] = new Array(b[key].length);
                    for (var i = 0; i < b[key].length; i++) {
                        a[key][i] = clone(b[key][i]);
                    }
                }
                else {
                  a[key] = clone(b[key]);
                }
            }
            else {
                a[key] = b[key];
            }
        }
    }
    else {
        a = b;
    }
    return a;
};

module.exports = clone;

},{}],38:[function(require,module,exports){
'use strict';

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Takes an object containing keys and values and returns an object
 * comprising two "associate" arrays, one with the keys and the other
 * with the values.
 *
 * @method keyValuesToArrays
 *
 * @param {Object} obj                      Objects where to extract keys and values
 *                                          from.
 * @return {Object}         result
 *         {Array.<String>} result.keys     Keys of `result`, as returned by
 *                                          `Object.keys()`
 *         {Array}          result.values   Values of passed in object.
 */
module.exports = function keyValuesToArrays(obj) {
    var keysArray = [], valuesArray = [];
    var i = 0;
    for(var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keysArray[i] = key;
            valuesArray[i] = obj[key];
            i++;
        }
    }
    return {
        keys: keysArray,
        values: valuesArray
    };
};

},{}],39:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var PREFIXES = ['', '-ms-', '-webkit-', '-moz-', '-o-'];

/**
 * A helper function used for determining the vendor prefixed version of the
 * passed in CSS property.
 *
 * Vendor checks are being conducted in the following order:
 *
 * 1. (no prefix)
 * 2. `-mz-`
 * 3. `-webkit-`
 * 4. `-moz-`
 * 5. `-o-`
 *
 * @method vendorPrefix
 *
 * @param {String} property     CSS property (no camelCase), e.g.
 *                              `border-radius`.
 * @return {String} prefixed    Vendor prefixed version of passed in CSS
 *                              property (e.g. `-webkit-border-radius`).
 */
function vendorPrefix(property) {
    for (var i = 0; i < PREFIXES.length; i++) {
        var prefixed = PREFIXES[i] + property;
        if (document.documentElement.style[prefixed] === '') {
            return prefixed;
        }
    }
    return property;
}

module.exports = vendorPrefix;

},{}],40:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var GeometryIds = 0;

/**
 * Geometry is a component that defines and manages data
 * (vertex data and attributes) that is used to draw to WebGL.
 *
 * @class Geometry
 * @constructor
 *
 * @param {Object} options instantiation options
 * @return {undefined} undefined
 */
function Geometry(options) {
    this.options = options || {};
    this.DEFAULT_BUFFER_SIZE = 3;

    this.spec = {
        id: GeometryIds++,
        dynamic: false,
        type: this.options.type || 'TRIANGLES',
        bufferNames: [],
        bufferValues: [],
        bufferSpacings: [],
        invalidations: []
    };

    if (this.options.buffers) {
        var len = this.options.buffers.length;
        for (var i = 0; i < len;) {
            this.spec.bufferNames.push(this.options.buffers[i].name);
            this.spec.bufferValues.push(this.options.buffers[i].data);
            this.spec.bufferSpacings.push(this.options.buffers[i].size || this.DEFAULT_BUFFER_SIZE);
            this.spec.invalidations.push(i++);
        }
    }
}

module.exports = Geometry;

},{}],41:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Vec3 = require('../math/Vec3');
var Vec2 = require('../math/Vec2');

var outputs = [
    new Vec3(),
    new Vec3(),
    new Vec3(),
    new Vec2(),
    new Vec2()
];

/**
 * A helper object used to calculate buffers for complicated geometries.
 * Tailored for the WebGLRenderer, used by most primitives.
 *
 * @static
 * @class GeometryHelper
 * @return {undefined} undefined
 */
var GeometryHelper = {};

/**
 * A function that iterates through vertical and horizontal slices
 * based on input detail, and generates vertices and indices for each
 * subdivision.
 *
 * @static
 * @method
 *
 * @param  {Number} detailX Amount of slices to iterate through.
 * @param  {Number} detailY Amount of stacks to iterate through.
 * @param  {Function} func Function used to generate vertex positions at each point.
 * @param  {Boolean} wrap Optional parameter (default: Pi) for setting a custom wrap range
 *
 * @return {Object} Object containing generated vertices and indices.
 */
GeometryHelper.generateParametric = function generateParametric(detailX, detailY, func, wrap) {
    var vertices = [];
    var i;
    var theta;
    var phi;
    var j;

    // We can wrap around slightly more than once for uv coordinates to look correct.

    var Xrange = wrap ? Math.PI + (Math.PI / (detailX - 1)) : Math.PI;
    var out = [];

    for (i = 0; i < detailX + 1; i++) {
        theta = i * Xrange / detailX;
        for (j = 0; j < detailY; j++) {
            phi = j * 2.0 * Xrange / detailY;
            func(theta, phi, out);
            vertices.push(out[0], out[1], out[2]);
        }
    }

    var indices = [],
        v = 0,
        next;
    for (i = 0; i < detailX; i++) {
        for (j = 0; j < detailY; j++) {
            next = (j + 1) % detailY;
            indices.push(v + j, v + j + detailY, v + next);
            indices.push(v + next, v + j + detailY, v + next + detailY);
        }
        v += detailY;
    }

    return {
        vertices: vertices,
        indices: indices
    };
};

/**
 * Calculates normals belonging to each face of a geometry.
 * Assumes clockwise declaration of vertices.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry.
 * @param {Array} indices Indices declaring faces of geometry.
 * @param {Array} out Array to be filled and returned.
 *
 * @return {Array} Calculated face normals.
 */
GeometryHelper.computeNormals = function computeNormals(vertices, indices, out) {
    var normals = out || [];
    var indexOne;
    var indexTwo;
    var indexThree;
    var normal;
    var j;
    var len = indices.length / 3;
    var i;
    var x;
    var y;
    var z;
    var length;

    for (i = 0; i < len; i++) {
        indexTwo = indices[i*3 + 0] * 3;
        indexOne = indices[i*3 + 1] * 3;
        indexThree = indices[i*3 + 2] * 3;

        outputs[0].set(vertices[indexOne], vertices[indexOne + 1], vertices[indexOne + 2]);
        outputs[1].set(vertices[indexTwo], vertices[indexTwo + 1], vertices[indexTwo + 2]);
        outputs[2].set(vertices[indexThree], vertices[indexThree + 1], vertices[indexThree + 2]);

        normal = outputs[2].subtract(outputs[0]).cross(outputs[1].subtract(outputs[0])).normalize();

        normals[indexOne + 0] = (normals[indexOne + 0] || 0) + normal.x;
        normals[indexOne + 1] = (normals[indexOne + 1] || 0) + normal.y;
        normals[indexOne + 2] = (normals[indexOne + 2] || 0) + normal.z;

        normals[indexTwo + 0] = (normals[indexTwo + 0] || 0) + normal.x;
        normals[indexTwo + 1] = (normals[indexTwo + 1] || 0) + normal.y;
        normals[indexTwo + 2] = (normals[indexTwo + 2] || 0) + normal.z;

        normals[indexThree + 0] = (normals[indexThree + 0] || 0) + normal.x;
        normals[indexThree + 1] = (normals[indexThree + 1] || 0) + normal.y;
        normals[indexThree + 2] = (normals[indexThree + 2] || 0) + normal.z;
    }

    for (i = 0; i < normals.length; i += 3) {
        x = normals[i];
        y = normals[i+1];
        z = normals[i+2];
        length = Math.sqrt(x * x + y * y + z * z);
        for(j = 0; j< 3; j++) {
            normals[i+j] /= length;
        }
    }

    return normals;
};

/**
 * Divides all inserted triangles into four sub-triangles. Alters the
 * passed in arrays.
 *
 * @static
 * @method
 *
 * @param {Array} indices Indices declaring faces of geometry
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} textureCoords Texture coordinates of all points on the geometry
 * @return {undefined} undefined
 */
GeometryHelper.subdivide = function subdivide(indices, vertices, textureCoords) {
    var triangleIndex = indices.length / 3;
    var face;
    var i;
    var j;
    var k;
    var pos;
    var tex;

    while (triangleIndex--) {
        face = indices.slice(triangleIndex * 3, triangleIndex * 3 + 3);

        pos = face.map(function(vertIndex) {
            return new Vec3(vertices[vertIndex * 3], vertices[vertIndex * 3 + 1], vertices[vertIndex * 3 + 2]);
        });
        vertices.push.apply(vertices, Vec3.scale(Vec3.add(pos[0], pos[1], outputs[0]), 0.5, outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.scale(Vec3.add(pos[1], pos[2], outputs[0]), 0.5, outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.scale(Vec3.add(pos[0], pos[2], outputs[0]), 0.5, outputs[1]).toArray());

        if (textureCoords) {
            tex = face.map(function(vertIndex) {
                return new Vec2(textureCoords[vertIndex * 2], textureCoords[vertIndex * 2 + 1]);
            });
            textureCoords.push.apply(textureCoords, Vec2.scale(Vec2.add(tex[0], tex[1], outputs[3]), 0.5, outputs[4]).toArray());
            textureCoords.push.apply(textureCoords, Vec2.scale(Vec2.add(tex[1], tex[2], outputs[3]), 0.5, outputs[4]).toArray());
            textureCoords.push.apply(textureCoords, Vec2.scale(Vec2.add(tex[0], tex[2], outputs[3]), 0.5, outputs[4]).toArray());
        }

        i = vertices.length - 3;
        j = i + 1;
        k = i + 2;

        indices.push(i, j, k);
        indices.push(face[0], i, k);
        indices.push(i, face[1], j);
        indices[triangleIndex] = k;
        indices[triangleIndex + 1] = j;
        indices[triangleIndex + 2] = face[2];
    }
};

/**
 * Creates duplicate of vertices that are shared between faces.
 * Alters the input vertex and index arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} indices Indices declaring faces of geometry
 * @return {undefined} undefined
 */
GeometryHelper.getUniqueFaces = function getUniqueFaces(vertices, indices) {
    var triangleIndex = indices.length / 3,
        registered = [],
        index;

    while (triangleIndex--) {
        for (var i = 0; i < 3; i++) {

            index = indices[triangleIndex * 3 + i];

            if (registered[index]) {
                vertices.push(vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2]);
                indices[triangleIndex * 3 + i] = vertices.length / 3 - 1;
            }
            else {
                registered[index] = true;
            }
        }
    }
};

/**
 * Divides all inserted triangles into four sub-triangles while maintaining
 * a radius of one. Alters the passed in arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} indices Indices declaring faces of geometry
 * @return {undefined} undefined
 */
GeometryHelper.subdivideSpheroid = function subdivideSpheroid(vertices, indices) {
    var triangleIndex = indices.length / 3,
        abc,
        face,
        i, j, k;

    while (triangleIndex--) {
        face = indices.slice(triangleIndex * 3, triangleIndex * 3 + 3);
        abc = face.map(function(vertIndex) {
            return new Vec3(vertices[vertIndex * 3], vertices[vertIndex * 3 + 1], vertices[vertIndex * 3 + 2]);
        });

        vertices.push.apply(vertices, Vec3.normalize(Vec3.add(abc[0], abc[1], outputs[0]), outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.normalize(Vec3.add(abc[1], abc[2], outputs[0]), outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.normalize(Vec3.add(abc[0], abc[2], outputs[0]), outputs[1]).toArray());

        i = vertices.length / 3 - 3;
        j = i + 1;
        k = i + 2;

        indices.push(i, j, k);
        indices.push(face[0], i, k);
        indices.push(i, face[1], j);
        indices[triangleIndex * 3] = k;
        indices[triangleIndex * 3 + 1] = j;
        indices[triangleIndex * 3 + 2] = face[2];
    }
};

/**
 * Divides all inserted triangles into four sub-triangles while maintaining
 * a radius of one. Alters the passed in arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with resulting normals.
 *
 * @return {Array} New list of calculated normals.
 */
GeometryHelper.getSpheroidNormals = function getSpheroidNormals(vertices, out) {
    out = out || [];
    var length = vertices.length / 3;
    var normalized;

    for (var i = 0; i < length; i++) {
        normalized = new Vec3(
            vertices[i * 3 + 0],
            vertices[i * 3 + 1],
            vertices[i * 3 + 2]
        ).normalize().toArray();

        out[i * 3 + 0] = normalized[0];
        out[i * 3 + 1] = normalized[1];
        out[i * 3 + 2] = normalized[2];
    }

    return out;
};

/**
 * Calculates texture coordinates for spheroid primitives based on
 * input vertices.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with resulting texture coordinates.
 *
 * @return {Array} New list of calculated texture coordinates
 */
GeometryHelper.getSpheroidUV = function getSpheroidUV(vertices, out) {
    out = out || [];
    var length = vertices.length / 3;
    var vertex;

    var uv = [];

    for(var i = 0; i < length; i++) {
        vertex = outputs[0].set(
            vertices[i * 3],
            vertices[i * 3 + 1],
            vertices[i * 3 + 2]
        )
        .normalize()
        .toArray();

        uv[0] = this.getAzimuth(vertex) * 0.5 / Math.PI + 0.5;
        uv[1] = this.getAltitude(vertex) / Math.PI + 0.5;

        out.push.apply(out, uv);
    }

    return out;
};

/**
 * Iterates through and normalizes a list of vertices.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with resulting normalized vectors.
 *
 * @return {Array} New list of normalized vertices
 */
GeometryHelper.normalizeAll = function normalizeAll(vertices, out) {
    out = out || [];
    var len = vertices.length / 3;

    for (var i = 0; i < len; i++) {
        Array.prototype.push.apply(out, new Vec3(vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]).normalize().toArray());
    }

    return out;
};

/**
 * Normalizes a set of vertices to model space.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with model space position vectors.
 *
 * @return {Array} Output vertices.
 */
GeometryHelper.normalizeVertices = function normalizeVertices(vertices, out) {
    out = out || [];
    var len = vertices.length / 3;
    var vectors = [];
    var minX;
    var maxX;
    var minY;
    var maxY;
    var minZ;
    var maxZ;
    var v;
    var i;

    for (i = 0; i < len; i++) {
        v = vectors[i] = new Vec3(
            vertices[i * 3],
            vertices[i * 3 + 1],
            vertices[i * 3 + 2]
        );

        if (minX == null || v.x < minX) minX = v.x;
        if (maxX == null || v.x > maxX) maxX = v.x;

        if (minY == null || v.y < minY) minY = v.y;
        if (maxY == null || v.y > maxY) maxY = v.y;

        if (minZ == null || v.z < minZ) minZ = v.z;
        if (maxZ == null || v.z > maxZ) maxZ = v.z;
    }

    var translation = new Vec3(
        getTranslationFactor(maxX, minX),
        getTranslationFactor(maxY, minY),
        getTranslationFactor(maxZ, minZ)
    );

    var scale = Math.min(
        getScaleFactor(maxX + translation.x, minX + translation.x),
        getScaleFactor(maxY + translation.y, minY + translation.y),
        getScaleFactor(maxZ + translation.z, minZ + translation.z)
    );

    for (i = 0; i < vectors.length; i++) {
        out.push.apply(out, vectors[i].add(translation).scale(scale).toArray());
    }

    return out;
};

/**
 * Determines translation amount for a given axis to normalize model coordinates.
 *
 * @method
 * @private
 *
 * @param {Number} max Maximum position value of given axis on the model.
 * @param {Number} min Minimum position value of given axis on the model.
 *
 * @return {Number} Number by which the given axis should be translated for all vertices.
 */
function getTranslationFactor(max, min) {
    return -(min + (max - min) / 2);
}

/**
 * Determines scale amount for a given axis to normalize model coordinates.
 *
 * @method
 * @private
 *
 * @param {Number} max Maximum scale value of given axis on the model.
 * @param {Number} min Minimum scale value of given axis on the model.
 *
 * @return {Number} Number by which the given axis should be scaled for all vertices.
 */
function getScaleFactor(max, min) {
    return 1 / ((max - min) / 2);
}

/**
 * Finds the azimuth, or angle above the XY plane, of a given vector.
 *
 * @static
 * @method
 *
 * @param {Array} v Vertex to retreive azimuth from.
 *
 * @return {Number} Azimuth value in radians.
 */
GeometryHelper.getAzimuth = function azimuth(v) {
    return Math.atan2(v[2], -v[0]);
};

/**
 * Finds the altitude, or angle above the XZ plane, of a given vector.
 *
 * @static
 * @method
 *
 * @param {Array} v Vertex to retreive altitude from.
 *
 * @return {Number} Altitude value in radians.
 */
GeometryHelper.getAltitude = function altitude(v) {
    return Math.atan2(-v[1], Math.sqrt((v[0] * v[0]) + (v[2] * v[2])));
};

/**
 * Converts a list of indices from 'triangle' to 'line' format.
 *
 * @static
 * @method
 *
 * @param {Array} indices Indices of all faces on the geometry
 * @param {Array} out Indices of all faces on the geometry
 *
 * @return {Array} New list of line-formatted indices
 */
GeometryHelper.trianglesToLines = function triangleToLines(indices, out) {
    var numVectors = indices.length / 3;
    out = out || [];
    var i;

    for (i = 0; i < numVectors; i++) {
        out.push(indices[i * 3 + 0], indices[i * 3 + 1]);
        out.push(indices[i * 3 + 1], indices[i * 3 + 2]);
        out.push(indices[i * 3 + 2], indices[i * 3 + 0]);
    }

    return out;
};

/**
 * Adds a reverse order triangle for every triangle in the mesh. Adds extra vertices
 * and indices to input arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices X, Y, Z positions of all vertices in the geometry
 * @param {Array} indices Indices of all faces on the geometry
 * @return {undefined} undefined
 */
GeometryHelper.addBackfaceTriangles = function addBackfaceTriangles(vertices, indices) {
    var nFaces = indices.length / 3;

    var maxIndex = 0;
    var i = indices.length;
    while (i--) if (indices[i] > maxIndex) maxIndex = indices[i];

    maxIndex++;

    for (i = 0; i < nFaces; i++) {
        var indexOne = indices[i * 3],
            indexTwo = indices[i * 3 + 1],
            indexThree = indices[i * 3 + 2];

        indices.push(indexOne + maxIndex, indexThree + maxIndex, indexTwo + maxIndex);
    }

    // Iterating instead of .slice() here to avoid max call stack issue.

    var nVerts = vertices.length;
    for (i = 0; i < nVerts; i++) {
        vertices.push(vertices[i]);
    }
};

module.exports = GeometryHelper;

},{"../math/Vec2":25,"../math/Vec3":26}],42:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Geometry = require('../Geometry');
var GeometryHelper = require('../GeometryHelper');

/**
 * This function returns a new static geometry, which is passed
 * custom buffer data.
 *
 * @class Plane
 * @constructor
 *
 * @param {Object} options Parameters that alter the
 * vertex buffers of the generated geometry.
 *
 * @return {Object} constructed geometry
 */
function Plane(options) {
    options = options || {};
    var detailX = options.detailX || options.detail || 1;
    var detailY = options.detailY || options.detail || 1;

    var vertices      = [];
    var textureCoords = [];
    var normals       = [];
    var indices       = [];

    var i;

    for (var y = 0; y <= detailY; y++) {
        var t = y / detailY;
        for (var x = 0; x <= detailX; x++) {
            var s = x / detailX;
            vertices.push(2. * (s - .5), 2 * (t - .5), 0);
            textureCoords.push(s, 1 - t);
            if (x < detailX && y < detailY) {
                i = x + y * (detailX + 1);
                indices.push(i, i + 1, i + detailX + 1);
                indices.push(i + detailX + 1, i + 1, i + detailX + 2);
            }
        }
    }

    if (options.backface !== false) {
        GeometryHelper.addBackfaceTriangles(vertices, indices);

        // duplicate texture coordinates as well

        var len = textureCoords.length;
        for (i = 0; i < len; i++) textureCoords.push(textureCoords[i]);
    }

    normals = GeometryHelper.computeNormals(vertices, indices);

    return new Geometry({
        buffers: [
            { name: 'a_pos', data: vertices },
            { name: 'a_texCoord', data: textureCoords, size: 2 },
            { name: 'a_normals', data: normals },
            { name: 'indices', data: indices, size: 1 }
        ]
    });
}

module.exports = Plane;

},{"../Geometry":40,"../GeometryHelper":41}],43:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Buffer is a private class that wraps the vertex data that defines
 * the the points of the triangles that webgl draws. Each buffer
 * maps to one attribute of a mesh.
 *
 * @class Buffer
 * @constructor
 *
 * @param {Number} target The bind target of the buffer to update: ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER
 * @param {Object} type Array type to be used in calls to gl.bufferData.
 * @param {WebGLContext} gl The WebGL context that the buffer is hosted by.
 *
 * @return {undefined} undefined
 */
function Buffer(target, type, gl) {
    this.buffer = null;
    this.target = target;
    this.type = type;
    this.data = [];
    this.gl = gl;
}

/**
 * Creates a WebGL buffer if one does not yet exist and binds the buffer to
 * to the context. Runs bufferData with appropriate data.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Buffer.prototype.subData = function subData() {
    var gl = this.gl;
    var data = [];

    // to prevent against maximum call-stack issue.
    for (var i = 0, chunk = 10000; i < this.data.length; i += chunk)
        data = Array.prototype.concat.apply(data, this.data.slice(i, i + chunk));

    this.buffer = this.buffer || gl.createBuffer();
    gl.bindBuffer(this.target, this.buffer);
    gl.bufferData(this.target, new this.type(data), gl.STATIC_DRAW);
};

module.exports = Buffer;

},{}],44:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var INDICES = 'indices';

var Buffer = require('./Buffer');

/**
 * BufferRegistry is a class that manages allocation of buffers to
 * input geometries.
 *
 * @class BufferRegistry
 * @constructor
 *
 * @param {WebGLContext} context WebGL drawing context to be passed to buffers.
 *
 * @return {undefined} undefined
 */
function BufferRegistry(context) {
    this.gl = context;

    this.registry = {};
    this._dynamicBuffers = [];
    this._staticBuffers = [];

    this._arrayBufferMax = 30000;
    this._elementBufferMax = 30000;
}

/**
 * Binds and fills all the vertex data into webgl buffers.  Will reuse buffers if
 * possible.  Populates registry with the name of the buffer, the WebGL buffer
 * object, spacing of the attribute, the attribute's offset within the buffer,
 * and finally the length of the buffer.  This information is later accessed by
 * the root to draw the buffers.
 *
 * @method
 *
 * @param {Number} geometryId Id of the geometry instance that holds the buffers.
 * @param {String} name Key of the input buffer in the geometry.
 * @param {Array} value Flat array containing input data for buffer.
 * @param {Number} spacing The spacing, or itemSize, of the input buffer.
 * @param {Boolean} dynamic Boolean denoting whether a geometry is dynamic or static.
 *
 * @return {undefined} undefined
 */
BufferRegistry.prototype.allocate = function allocate(geometryId, name, value, spacing, dynamic) {
    var vertexBuffers = this.registry[geometryId] || (this.registry[geometryId] = { keys: [], values: [], spacing: [], offset: [], length: [] });

    var j = vertexBuffers.keys.indexOf(name);
    var isIndex = name === INDICES;
    var bufferFound = false;
    var newOffset;
    var offset = 0;
    var length;
    var buffer;
    var k;

    if (j === -1) {
        j = vertexBuffers.keys.length;
        length = isIndex ? value.length : Math.floor(value.length / spacing);

        if (!dynamic) {

            // Use a previously created buffer if available.

            for (k = 0; k < this._staticBuffers.length; k++) {

                if (isIndex === this._staticBuffers[k].isIndex) {
                    newOffset = this._staticBuffers[k].offset + value.length;
                    if ((!isIndex && newOffset < this._arrayBufferMax) || (isIndex && newOffset < this._elementBufferMax)) {
                        buffer = this._staticBuffers[k].buffer;
                        offset = this._staticBuffers[k].offset;
                        this._staticBuffers[k].offset += value.length;
                        bufferFound = true;
                        break;
                    }
                }
            }

            // Create a new static buffer in none were found.

            if (!bufferFound) {
                buffer = new Buffer(
                    isIndex ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER,
                    isIndex ? Uint16Array : Float32Array,
                    this.gl
                );

                this._staticBuffers.push({ buffer: buffer, offset: value.length, isIndex: isIndex });
            }
        }
        else {

            // For dynamic geometries, always create new buffer.

            buffer = new Buffer(
                isIndex ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER,
                isIndex ? Uint16Array : Float32Array,
                this.gl
            );

            this._dynamicBuffers.push({ buffer: buffer, offset: value.length, isIndex: isIndex });
        }

        // Update the registry for the spec with buffer information.

        vertexBuffers.keys.push(name);
        vertexBuffers.values.push(buffer);
        vertexBuffers.spacing.push(spacing);
        vertexBuffers.offset.push(offset);
        vertexBuffers.length.push(length);
    }

    var len = value.length;
    for (k = 0; k < len; k++) {
        vertexBuffers.values[j].data[offset + k] = value[k];
    }
    vertexBuffers.values[j].subData();
};

module.exports = BufferRegistry;

},{"./Buffer":43}],45:[function(require,module,exports){
'use strict';

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Takes the original rendering contexts' compiler function
 * and augments it with added functionality for parsing and
 * displaying errors.
 *
 * @method
 *
 * @returns {Function} Augmented function
 */
module.exports = function Debug() {
    return _augmentFunction(
        this.gl.compileShader,
        function(shader) {
            if (!this.getShaderParameter(shader, this.COMPILE_STATUS)) {
                var errors = this.getShaderInfoLog(shader);
                var source = this.getShaderSource(shader);
                _processErrors(errors, source);
            }
        }
    );
};

// Takes a function, keeps the reference and replaces it by a closure that
// executes the original function and the provided callback.
function _augmentFunction(func, callback) {
    return function() {
        var res = func.apply(this, arguments);
        callback.apply(this, arguments);
        return res;
    };
}

// Parses errors and failed source code from shaders in order
// to build displayable error blocks.
// Inspired by Jaume Sanchez Elias.
function _processErrors(errors, source) {

    var css = 'body,html{background:#e3e3e3;font-family:monaco,monospace;font-size:14px;line-height:1.7em}' +
              '#shaderReport{left:0;top:0;right:0;box-sizing:border-box;position:absolute;z-index:1000;color:' +
              '#222;padding:15px;white-space:normal;list-style-type:none;margin:50px auto;max-width:1200px}' +
              '#shaderReport li{background-color:#fff;margin:13px 0;box-shadow:0 1px 2px rgba(0,0,0,.15);' +
              'padding:20px 30px;border-radius:2px;border-left:20px solid #e01111}span{color:#e01111;' +
              'text-decoration:underline;font-weight:700}#shaderReport li p{padding:0;margin:0}' +
              '#shaderReport li:nth-child(even){background-color:#f4f4f4}' +
              '#shaderReport li p:first-child{margin-bottom:10px;color:#666}';

    var el = document.createElement('style');
    document.getElementsByTagName('head')[0].appendChild(el);
    el.textContent = css;

    var report = document.createElement('ul');
    report.setAttribute('id', 'shaderReport');
    document.body.appendChild(report);

    var re = /ERROR: [\d]+:([\d]+): (.+)/gmi;
    var lines = source.split('\n');

    var m;
    while ((m = re.exec(errors)) != null) {
        if (m.index === re.lastIndex) re.lastIndex++;
        var li = document.createElement('li');
        var code = '<p><span>ERROR</span> "' + m[2] + '" in line ' + m[1] + '</p>';
        code += '<p><b>' + lines[m[1] - 1].replace(/^[ \t]+/g, '') + '</b></p>';
        li.innerHTML = code;
        report.appendChild(li);
    }
}

},{}],46:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var clone = require('../utilities/clone');
var keyValueToArrays = require('../utilities/keyValueToArrays');

var vertexWrapper = require('../webgl-shaders').vertex;
var fragmentWrapper = require('../webgl-shaders').fragment;
var Debug = require('./Debug');

var VERTEX_SHADER = 35633;
var FRAGMENT_SHADER = 35632;
var identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

var header = 'precision mediump float;\n';

var TYPES = {
    undefined: 'float ',
    1: 'float ',
    2: 'vec2 ',
    3: 'vec3 ',
    4: 'vec4 ',
    16: 'mat4 '
};

var inputTypes = {
    u_baseColor: 'vec4',
    u_normals: 'vert',
    u_glossiness: 'vec4',
    u_positionOffset: 'vert'
};

var masks =  {
    vert: 1,
    vec3: 2,
    vec4: 4,
    float: 8
};

/**
 * Uniform keys and values
 */
var uniforms = keyValueToArrays({
    u_perspective: identityMatrix,
    u_view: identityMatrix,
    u_resolution: [0, 0, 0],
    u_transform: identityMatrix,
    u_size: [1, 1, 1],
    u_time: 0,
    u_opacity: 1,
    u_metalness: 0,
    u_glossiness: [0, 0, 0, 0],
    u_baseColor: [1, 1, 1, 1],
    u_normals: [1, 1, 1],
    u_positionOffset: [0, 0, 0],
    u_lightPosition: identityMatrix,
    u_lightColor: identityMatrix,
    u_ambientLight: [0, 0, 0],
    u_flatShading: 0,
    u_numLights: 0
});

/**
 * Attributes keys and values
 */
var attributes = keyValueToArrays({
    a_pos: [0, 0, 0],
    a_texCoord: [0, 0],
    a_normals: [0, 0, 0]
});

/**
 * Varyings keys and values
 */
var varyings = keyValueToArrays({
    v_textureCoordinate: [0, 0],
    v_normal: [0, 0, 0],
    v_position: [0, 0, 0],
    v_eyeVector: [0, 0, 0]
});

/**
 * A class that handles interactions with the WebGL shader program
 * used by a specific context.  It manages creation of the shader program
 * and the attached vertex and fragment shaders.  It is also in charge of
 * passing all uniforms to the WebGLContext.
 *
 * @class Program
 * @constructor
 *
 * @param {WebGL_Context} gl Context to be used to create the shader program
 * @param {Object} options Program options
 *
 * @return {undefined} undefined
 */
function Program(gl, options) {
    this.gl = gl;
    this.textureSlots = 1;
    this.options = options || {};

    this.registeredMaterials = {};
    this.flaggedUniforms = [];
    this.cachedUniforms  = {};
    this.uniformTypes = [];

    this.definitionVec4 = [];
    this.definitionVec3 = [];
    this.definitionFloat = [];
    this.applicationVec3 = [];
    this.applicationVec4 = [];
    this.applicationFloat = [];
    this.applicationVert = [];
    this.definitionVert = [];

    this.resetProgram();
}

/**
 * Determines whether a material has already been registered to
 * the shader program.
 *
 * @method
 *
 * @param {String} name Name of target input of material.
 * @param {Object} material Compiled material object being verified.
 *
 * @return {Program} this Current program.
 */
Program.prototype.registerMaterial = function registerMaterial(name, material) {
    var compiled = material;
    var type = inputTypes[name];
    var mask = masks[type];

    if ((this.registeredMaterials[material._id] & mask) === mask) return this;

    var k;

    for (k in compiled.uniforms) {
        if (uniforms.keys.indexOf(k) === -1) {
            uniforms.keys.push(k);
            uniforms.values.push(compiled.uniforms[k]);
        }
    }

    for (k in compiled.varyings) {
        if (varyings.keys.indexOf(k) === -1) {
            varyings.keys.push(k);
            varyings.values.push(compiled.varyings[k]);
        }
    }

    for (k in compiled.attributes) {
        if (attributes.keys.indexOf(k) === -1) {
            attributes.keys.push(k);
            attributes.values.push(compiled.attributes[k]);
        }
    }

    this.registeredMaterials[material._id] |= mask;

    if (type === 'float') {
        this.definitionFloat.push(material.defines);
        this.definitionFloat.push('float fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationFloat.push('if (int(abs(ID)) == ' + material._id + ') return fa_' + material._id  + '();');
    }

    if (type === 'vec3') {
        this.definitionVec3.push(material.defines);
        this.definitionVec3.push('vec3 fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationVec3.push('if (int(abs(ID.x)) == ' + material._id + ') return fa_' + material._id + '();');
    }

    if (type === 'vec4') {
        this.definitionVec4.push(material.defines);
        this.definitionVec4.push('vec4 fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationVec4.push('if (int(abs(ID.x)) == ' + material._id + ') return fa_' + material._id + '();');
    }

    if (type === 'vert') {
        this.definitionVert.push(material.defines);
        this.definitionVert.push('vec3 fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationVert.push('if (int(abs(ID.x)) == ' + material._id + ') return fa_' + material._id + '();');
    }

    return this.resetProgram();
};

/**
 * Clears all cached uniforms and attribute locations.  Assembles
 * new fragment and vertex shaders and based on material from
 * currently registered materials.  Attaches said shaders to new
 * shader program and upon success links program to the WebGL
 * context.
 *
 * @method
 *
 * @return {Program} Current program.
 */
Program.prototype.resetProgram = function resetProgram() {
    var vertexHeader = [header];
    var fragmentHeader = [header];

    var fragmentSource;
    var vertexSource;
    var program;
    var name;
    var value;
    var i;

    this.uniformLocations   = [];
    this.attributeLocations = {};

    this.uniformTypes = {};

    this.attributeNames = clone(attributes.keys);
    this.attributeValues = clone(attributes.values);

    this.varyingNames = clone(varyings.keys);
    this.varyingValues = clone(varyings.values);

    this.uniformNames = clone(uniforms.keys);
    this.uniformValues = clone(uniforms.values);

    this.flaggedUniforms = [];
    this.cachedUniforms = {};

    fragmentHeader.push('uniform sampler2D u_textures[7];\n');

    if (this.applicationVert.length) {
        vertexHeader.push('uniform sampler2D u_textures[7];\n');
    }

    for(i = 0; i < this.uniformNames.length; i++) {
        name = this.uniformNames[i];
        value = this.uniformValues[i];
        vertexHeader.push('uniform ' + TYPES[value.length] + name + ';\n');
        fragmentHeader.push('uniform ' + TYPES[value.length] + name + ';\n');
    }

    for(i = 0; i < this.attributeNames.length; i++) {
        name = this.attributeNames[i];
        value = this.attributeValues[i];
        vertexHeader.push('attribute ' + TYPES[value.length] + name + ';\n');
    }

    for(i = 0; i < this.varyingNames.length; i++) {
        name = this.varyingNames[i];
        value = this.varyingValues[i];
        vertexHeader.push('varying ' + TYPES[value.length]  + name + ';\n');
        fragmentHeader.push('varying ' + TYPES[value.length] + name + ';\n');
    }

    vertexSource = vertexHeader.join('') + vertexWrapper
        .replace('#vert_definitions', this.definitionVert.join('\n'))
        .replace('#vert_applications', this.applicationVert.join('\n'));

    fragmentSource = fragmentHeader.join('') + fragmentWrapper
        .replace('#vec3_definitions', this.definitionVec3.join('\n'))
        .replace('#vec3_applications', this.applicationVec3.join('\n'))
        .replace('#vec4_definitions', this.definitionVec4.join('\n'))
        .replace('#vec4_applications', this.applicationVec4.join('\n'))
        .replace('#float_definitions', this.definitionFloat.join('\n'))
        .replace('#float_applications', this.applicationFloat.join('\n'));

    program = this.gl.createProgram();

    this.gl.attachShader(
        program,
        this.compileShader(this.gl.createShader(VERTEX_SHADER), vertexSource)
    );

    this.gl.attachShader(
        program,
        this.compileShader(this.gl.createShader(FRAGMENT_SHADER), fragmentSource)
    );

    this.gl.linkProgram(program);

    if (! this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        console.error('link error: ' + this.gl.getProgramInfoLog(program));
        this.program = null;
    }
    else {
        this.program = program;
        this.gl.useProgram(this.program);
    }

    this.setUniforms(this.uniformNames, this.uniformValues);

    var textureLocation = this.gl.getUniformLocation(this.program, 'u_textures[0]');
    this.gl.uniform1iv(textureLocation, [0, 1, 2, 3, 4, 5, 6]);

    return this;
};

/**
 * Compares the value of the input uniform value against
 * the cached value stored on the Program class.  Updates and
 * creates new entries in the cache when necessary.
 *
 * @method
 * @param {String} targetName Key of uniform spec being evaluated.
 * @param {Number|Array} value Value of uniform spec being evaluated.
 *
 * @return {Boolean} boolean Indicating whether the uniform being set is cached.
 */
Program.prototype.uniformIsCached = function(targetName, value) {
    if(this.cachedUniforms[targetName] == null) {
        if (value.length) {
            this.cachedUniforms[targetName] = new Float32Array(value);
        }
        else {
            this.cachedUniforms[targetName] = value;
        }
        return false;
    }
    else if (value.length) {
        var i = value.length;
        while (i--) {
            if(value[i] !== this.cachedUniforms[targetName][i]) {
                i = value.length;
                while(i--) this.cachedUniforms[targetName][i] = value[i];
                return false;
            }
        }
    }

    else if (this.cachedUniforms[targetName] !== value) {
        this.cachedUniforms[targetName] = value;
        return false;
    }

    return true;
};

/**
 * Handles all passing of uniforms to WebGL drawing context.  This
 * function will find the uniform location and then, based on
 * a type inferred from the javascript value of the uniform, it will call
 * the appropriate function to pass the uniform to WebGL.  Finally,
 * setUniforms will iterate through the passed in shaderChunks (if any)
 * and set the appropriate uniforms to specify which chunks to use.
 *
 * @method
 * @param {Array} uniformNames Array containing the keys of all uniforms to be set.
 * @param {Array} uniformValue Array containing the values of all uniforms to be set.
 *
 * @return {Program} Current program.
 */
Program.prototype.setUniforms = function (uniformNames, uniformValue) {
    var gl = this.gl;
    var location;
    var value;
    var name;
    var len;
    var i;

    if (!this.program) return this;

    len = uniformNames.length;
    for (i = 0; i < len; i++) {
        name = uniformNames[i];
        value = uniformValue[i];

        // Retreive the cached location of the uniform,
        // requesting a new location from the WebGL context
        // if it does not yet exist.

        location = this.uniformLocations[name];

        if (location === null) continue;
        if (location === undefined) {
            location = gl.getUniformLocation(this.program, name);
            this.uniformLocations[name] = location;
        }

        // Check if the value is already set for the
        // given uniform.

        if (this.uniformIsCached(name, value)) continue;

        // Determine the correct function and pass the uniform
        // value to WebGL.

        if (!this.uniformTypes[name]) {
            this.uniformTypes[name] = this.getUniformTypeFromValue(value);
        }

        // Call uniform setter function on WebGL context with correct value

        switch (this.uniformTypes[name]) {
            case 'uniform4fv':  gl.uniform4fv(location, value); break;
            case 'uniform3fv':  gl.uniform3fv(location, value); break;
            case 'uniform2fv':  gl.uniform2fv(location, value); break;
            case 'uniform1fv':  gl.uniform1fv(location, value); break;
            case 'uniform1f' :  gl.uniform1f(location, value); break;
            case 'uniformMatrix3fv': gl.uniformMatrix3fv(location, false, value); break;
            case 'uniformMatrix4fv': gl.uniformMatrix4fv(location, false, value); break;
        }
    }

    return this;
};

/**
 * Infers uniform setter function to be called on the WebGL context, based
 * on an input value.
 *
 * @method
 *
 * @param {Number|Array} value Value from which uniform type is inferred.
 *
 * @return {String} Name of uniform function for given value.
 */
Program.prototype.getUniformTypeFromValue = function getUniformTypeFromValue(value) {
    if (Array.isArray(value) || value instanceof Float32Array) {
        switch (value.length) {
            case 1:  return 'uniform1fv';
            case 2:  return 'uniform2fv';
            case 3:  return 'uniform3fv';
            case 4:  return 'uniform4fv';
            case 9:  return 'uniformMatrix3fv';
            case 16: return 'uniformMatrix4fv';
        }
    }
    else if (!isNaN(parseFloat(value)) && isFinite(value)) {
        return 'uniform1f';
    }

    throw 'cant load uniform "' + name + '" with value:' + JSON.stringify(value);
};

/**
 * Adds shader source to shader and compiles the input shader.  Checks
 * compile status and logs error if necessary.
 *
 * @method
 *
 * @param {Object} shader Program to be compiled.
 * @param {String} source Source to be used in the shader.
 *
 * @return {Object} Compiled shader.
 */
Program.prototype.compileShader = function compileShader(shader, source) {
    var i = 1;

    if (this.options.debug) {
        this.gl.compileShader = Debug.call(this);
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        console.error('compile error: ' + this.gl.getShaderInfoLog(shader));
        console.error('1: ' + source.replace(/\n/g, function () {
            return '\n' + (i+=1) + ': ';
        }));
    }

    return shader;
};

module.exports = Program;

},{"../utilities/clone":37,"../utilities/keyValueToArrays":38,"../webgl-shaders":53,"./Debug":45}],47:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Texture is a private class that stores image data
 * to be accessed from a shader or used as a render target.
 *
 * @class Texture
 * @constructor
 *
 * @param {GL} gl GL
 * @param {Object} options Options
 *
 * @return {undefined} undefined
 */
function Texture(gl, options) {
    options = options || {};
    this.id = gl.createTexture();
    this.width = options.width || 0;
    this.height = options.height || 0;
    this.mipmap = options.mipmap;
    this.format = options.format || 'RGBA';
    this.type = options.type || 'UNSIGNED_BYTE';
    this.gl = gl;

    this.bind();

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options.flipYWebgl || false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, options.premultiplyAlphaWebgl || false);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[options.magFilter] || gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[options.minFilter] || gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[options.wrapS] || gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[options.wrapT] || gl.CLAMP_TO_EDGE);
}

/**
 * Binds this texture as the selected target.
 *
 * @method
 * @return {Object} Current texture instance.
 */
Texture.prototype.bind = function bind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
    return this;
};

/**
 * Erases the texture data in the given texture slot.
 *
 * @method
 * @return {Object} Current texture instance.
 */
Texture.prototype.unbind = function unbind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    return this;
};

/**
 * Replaces the image data in the texture with the given image.
 *
 * @method
 *
 * @param {Image}   img     The image object to upload pixel data from.
 * @return {Object}         Current texture instance.
 */
Texture.prototype.setImage = function setImage(img) {
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl[this.format], this.gl[this.format], this.gl[this.type], img);
    if (this.mipmap) this.gl.generateMipmap(this.gl.TEXTURE_2D);
    return this;
};

/**
 * Replaces the image data in the texture with an array of arbitrary data.
 *
 * @method
 *
 * @param {Array}   input   Array to be set as data to texture.
 * @return {Object}         Current texture instance.
 */
Texture.prototype.setArray = function setArray(input) {
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl[this.format], this.width, this.height, 0, this.gl[this.format], this.gl[this.type], input);
    return this;
};

/**
 * Dumps the rgb-pixel contents of a texture into an array for debugging purposes
 *
 * @method
 *
 * @param {Number} x        x-offset between texture coordinates and snapshot
 * @param {Number} y        y-offset between texture coordinates and snapshot
 * @param {Number} width    x-depth of the snapshot
 * @param {Number} height   y-depth of the snapshot
 *
 * @return {Array}          An array of the pixels contained in the snapshot.
 */
Texture.prototype.readBack = function readBack(x, y, width, height) {
    var gl = this.gl;
    var pixels;
    x = x || 0;
    y = y || 0;
    width = width || this.width;
    height = height || this.height;
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
        pixels = new Uint8Array(width * height * 4);
        gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    }
    return pixels;
};

module.exports = Texture;

},{}],48:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

var Texture = require('./Texture');
var createCheckerboard = require('./createCheckerboard');

/**
 * Handles loading, binding, and resampling of textures for WebGLRenderer.
 *
 * @class TextureManager
 * @constructor
 *
 * @param {WebGL_Context} gl Context used to create and bind textures.
 *
 * @return {undefined} undefined
 */
function TextureManager(gl) {
    this.registry = [];
    this._needsResample = [];

    this._activeTexture = 0;
    this._boundTexture = null;

    this._checkerboard = createCheckerboard();

    this.gl = gl;
}

/**
 * Update function used by WebGLRenderer to queue resamples on
 * registered textures.
 *
 * @method
 *
 * @param {Number}      time    Time in milliseconds according to the compositor.
 * @return {undefined}          undefined
 */
TextureManager.prototype.update = function update(time) {
    var registryLength = this.registry.length;

    for (var i = 1; i < registryLength; i++) {
        var texture = this.registry[i];

        if (texture && texture.isLoaded && texture.resampleRate) {
            if (!texture.lastResample || time - texture.lastResample > texture.resampleRate) {
                if (!this._needsResample[texture.id]) {
                    this._needsResample[texture.id] = true;
                    texture.lastResample = time;
                }
            }
        }
    }
};

/**
 * Creates a spec and creates a texture based on given texture data.
 * Handles loading assets if necessary.
 *
 * @method
 *
 * @param {Object}  input   Object containing texture id, texture data
 *                          and options used to draw texture.
 * @param {Number}  slot    Texture slot to bind generated texture to.
 * @return {undefined}      undefined
 */
TextureManager.prototype.register = function register(input, slot) {
    var _this = this;

    var source = input.data;
    var textureId = input.id;
    var options = input.options || {};
    var texture = this.registry[textureId];
    var spec;

    if (!texture) {

        texture = new Texture(this.gl, options);
        texture.setImage(this._checkerboard);

        // Add texture to registry

        spec = this.registry[textureId] = {
            resampleRate: options.resampleRate || null,
            lastResample: null,
            isLoaded: false,
            texture: texture,
            source: source,
            id: textureId,
            slot: slot
        };

        // Handle array

        if (Array.isArray(source) || source instanceof Uint8Array || source instanceof Float32Array) {
            this.bindTexture(textureId);
            texture.setArray(source);
            spec.isLoaded = true;
        }

        // Handle video

        else if (window && source instanceof window.HTMLVideoElement) {
            source.addEventListener('loadeddata', function() {
                _this.bindTexture(textureId);
                texture.setImage(source);

                spec.isLoaded = true;
                spec.source = source;
            });
        }

        // Handle image url

        else if (typeof source === 'string') {
            loadImage(source, function (img) {
                _this.bindTexture(textureId);
                texture.setImage(img);

                spec.isLoaded = true;
                spec.source = img;
            });
        }
    }

    return textureId;
};

/**
 * Loads an image from a string or Image object and executes a callback function.
 *
 * @method
 * @private
 *
 * @param {Object|String} input The input image data to load as an asset.
 * @param {Function} callback The callback function to be fired when the image has finished loading.
 *
 * @return {Object} Image object being loaded.
 */
function loadImage (input, callback) {
    var image = (typeof input === 'string' ? new Image() : input) || {};
        image.crossOrigin = 'anonymous';

    if (!image.src) image.src = input;
    if (!image.complete) {
        image.onload = function () {
            callback(image);
        };
    }
    else {
        callback(image);
    }

    return image;
}

/**
 * Sets active texture slot and binds target texture.  Also handles
 * resampling when necessary.
 *
 * @method
 *
 * @param {Number} id Identifier used to retreive texture spec
 *
 * @return {undefined} undefined
 */
TextureManager.prototype.bindTexture = function bindTexture(id) {
    var spec = this.registry[id];

    if (this._activeTexture !== spec.slot) {
        this.gl.activeTexture(this.gl.TEXTURE0 + spec.slot);
        this._activeTexture = spec.slot;
    }

    if (this._boundTexture !== id) {
        this._boundTexture = id;
        spec.texture.bind();
    }

    if (this._needsResample[spec.id]) {

        // TODO: Account for resampling of arrays.

        spec.texture.setImage(spec.source);
        this._needsResample[spec.id] = false;
    }
};

module.exports = TextureManager;

},{"./Texture":47,"./createCheckerboard":51}],49:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Program = require('./Program');
var BufferRegistry = require('./BufferRegistry');
var Plane = require('../webgl-geometries/primitives/Plane');
var sorter = require('./radixSort');
var keyValueToArrays = require('../utilities/keyValueToArrays');
var TextureManager = require('./TextureManager');
var compileMaterial = require('./compileMaterial');

var identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

var globalUniforms = keyValueToArrays({
    'u_numLights': 0,
    'u_ambientLight': new Array(3),
    'u_lightPosition': new Array(3),
    'u_lightColor': new Array(3),
    'u_perspective': new Array(16),
    'u_time': 0,
    'u_view': new Array(16)
});

/**
 * WebGLRenderer is a private class that manages all interactions with the WebGL
 * API. Each frame it receives commands from the compositor and updates its
 * registries accordingly. Subsequently, the draw function is called and the
 * WebGLRenderer issues draw calls for all meshes in its registry.
 *
 * @class WebGLRenderer
 * @constructor
 *
 * @param {Element} canvas The DOM element that GL will paint itself onto.
 * @param {Compositor} compositor Compositor used for querying the time from.
 *
 * @return {undefined} undefined
 */
function WebGLRenderer(canvas, compositor) {
    canvas.classList.add('famous-webgl-renderer');

    this.canvas = canvas;
    this.compositor = compositor;

    var gl = this.gl = this.getWebGLContext(this.canvas);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.polygonOffset(0.1, 0.1);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    this.meshRegistry = {};
    this.meshRegistryKeys = [];

    this.cutoutRegistry = {};

    this.cutoutRegistryKeys = [];

    /**
     * Lights
     */
    this.numLights = 0;
    this.ambientLightColor = [0, 0, 0];
    this.lightRegistry = {};
    this.lightRegistryKeys = [];
    this.lightPositions = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.lightColors = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.textureManager = new TextureManager(gl);
    this.texCache = {};
    this.bufferRegistry = new BufferRegistry(gl);
    this.program = new Program(gl, { debug: true });

    this.state = {
        boundArrayBuffer: null,
        boundElementBuffer: null,
        lastDrawn: null,
        enabledAttributes: {},
        enabledAttributesKeys: []
    };

    this.resolutionName = ['u_resolution'];
    this.resolutionValues = [];

    this.cachedSize = [];

    /*
    The projectionTransform has some constant components, i.e. the z scale, and the x and y translation.

    The z scale keeps the final z position of any vertex within the clip's domain by scaling it by an
    arbitrarily small coefficient. This has the advantage of being a useful default in the event of the
    user forgoing a near and far plane, an alien convention in dom space as in DOM overlapping is
    conducted via painter's algorithm.

    The x and y translation transforms the world space origin to the top left corner of the screen.

    The final component (this.projectionTransform[15]) is initialized as 1 because certain projection models,
    e.g. the WC3 specified model, keep the XY plane as the projection hyperplane.
    */
    this.projectionTransform = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -0.000001, 0, -1, 1, 0, 1];

    // TODO: remove this hack

    var cutout = this.cutoutGeometry = new Plane();

    this.bufferRegistry.allocate(cutout.spec.id, 'a_pos', cutout.spec.bufferValues[0], 3);
    this.bufferRegistry.allocate(cutout.spec.id, 'a_texCoord', cutout.spec.bufferValues[1], 2);
    this.bufferRegistry.allocate(cutout.spec.id, 'a_normals', cutout.spec.bufferValues[2], 3);
    this.bufferRegistry.allocate(cutout.spec.id, 'indices', cutout.spec.bufferValues[3], 1);
}

/**
 * Attempts to retreive the WebGLRenderer context using several
 * accessors. For browser compatability. Throws on error.
 *
 * @method
 *
 * @param {Object} canvas Canvas element from which the context is retreived
 *
 * @return {Object} WebGLContext of canvas element
 */
WebGLRenderer.prototype.getWebGLContext = function getWebGLContext(canvas) {
    var names = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
    var context = null;
    for (var i = 0; i < names.length; i++) {
        try {
            context = canvas.getContext(names[i]);
        }
        catch (error) {
            var msg = 'Error creating WebGL context: ' + error.prototype.toString();
            console.error(msg);
        }
        if (context) {
            break;
        }
    }
    return context ? context : false;
};

/**
 * Adds a new base spec to the light registry at a given path.
 *
 * @method
 *
 * @param {String} path Path used as id of new light in lightRegistry
 *
 * @return {Object} Newly created light spec
 */
WebGLRenderer.prototype.createLight = function createLight(path) {
    this.numLights++;
    this.lightRegistryKeys.push(path);
    this.lightRegistry[path] = {
        color: [0, 0, 0],
        position: [0, 0, 0]
    };
    return this.lightRegistry[path];
};

/**
 * Adds a new base spec to the mesh registry at a given path.
 *
 * @method
 *
 * @param {String} path Path used as id of new mesh in meshRegistry.
 *
 * @return {Object} Newly created mesh spec.
 */
WebGLRenderer.prototype.createMesh = function createMesh(path) {
    this.meshRegistryKeys.push(path);

    var uniforms = keyValueToArrays({
        u_opacity: 1,
        u_transform: identity,
        u_size: [0, 0, 0],
        u_baseColor: [0.5, 0.5, 0.5, 1],
        u_positionOffset: [0, 0, 0],
        u_normals: [0, 0, 0],
        u_flatShading: 0,
        u_glossiness: [0, 0, 0, 0]
    });
    this.meshRegistry[path] = {
        depth: null,
        uniformKeys: uniforms.keys,
        uniformValues: uniforms.values,
        buffers: {},
        geometry: null,
        drawType: null,
        textures: [],
        visible: true
    };
    return this.meshRegistry[path];
};

/**
 * Sets flag on indicating whether to do skip draw phase for
 * cutout mesh at given path.
 *
 * @method
 *
 * @param {String} path Path used as id of target cutout mesh.
 * @param {Boolean} usesCutout Indicates the presence of a cutout mesh
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setCutoutState = function setCutoutState(path, usesCutout) {
    var cutout = this.getOrSetCutout(path);

    cutout.visible = usesCutout;
};

/**
 * Creates or retreives cutout
 *
 * @method
 *
 * @param {String} path Path used as id of target cutout mesh.
 *
 * @return {Object} Newly created cutout spec.
 */
WebGLRenderer.prototype.getOrSetCutout = function getOrSetCutout(path) {
    if (this.cutoutRegistry[path]) {
        return this.cutoutRegistry[path];
    }
    else {
        var uniforms = keyValueToArrays({
            u_opacity: 0,
            u_transform: identity.slice(),
            u_size: [0, 0, 0],
            u_origin: [0, 0, 0],
            u_baseColor: [0, 0, 0, 1]
        });

        this.cutoutRegistryKeys.push(path);

        this.cutoutRegistry[path] = {
            uniformKeys: uniforms.keys,
            uniformValues: uniforms.values,
            geometry: this.cutoutGeometry.spec.id,
            drawType: this.cutoutGeometry.spec.type,
            visible: true
        };

        return this.cutoutRegistry[path];
    }
};

/**
 * Sets flag on indicating whether to do skip draw phase for
 * mesh at given path.
 *
 * @method
 * @param {String} path Path used as id of target mesh.
 * @param {Boolean} visibility Indicates the visibility of target mesh.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setMeshVisibility = function setMeshVisibility(path, visibility) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    mesh.visible = visibility;
};

/**
 * Deletes a mesh from the meshRegistry.
 *
 * @method
 * @param {String} path Path used as id of target mesh.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.removeMesh = function removeMesh(path) {
    var keyLocation = this.meshRegistryKeys.indexOf(path);
    this.meshRegistryKeys.splice(keyLocation, 1);
    this.meshRegistry[path] = null;
};

/**
 * Creates or retreives cutout
 *
 * @method
 * @param {String} path Path used as id of cutout in cutout registry.
 * @param {String} uniformName Identifier used to upload value
 * @param {Array} uniformValue Value of uniform data
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setCutoutUniform = function setCutoutUniform(path, uniformName, uniformValue) {
    var cutout = this.getOrSetCutout(path);

    var index = cutout.uniformKeys.indexOf(uniformName);

    if (Array.isArray(uniformValue)) {
        for (var i = 0, len = uniformValue.length; i < len; i++) {
            cutout.uniformValues[index][i] = uniformValue[i];
        }
    }
    else {
        cutout.uniformValues[index] = uniformValue;
    }
};

/**
 * Edits the options field on a mesh
 *
 * @method
 * @param {String} path Path used as id of target mesh
 * @param {Object} options Map of draw options for mesh
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setMeshOptions = function(path, options) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    mesh.options = options;
    return this;
};

/**
 * Changes the color of the fixed intensity lighting in the scene
 *
 * @method
 *
 * @param {String} path Path used as id of light
 * @param {Number} r red channel
 * @param {Number} g green channel
 * @param {Number} b blue channel
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setAmbientLightColor = function setAmbientLightColor(path, r, g, b) {
    this.ambientLightColor[0] = r;
    this.ambientLightColor[1] = g;
    this.ambientLightColor[2] = b;
    return this;
};

/**
 * Changes the location of the light in the scene
 *
 * @method
 *
 * @param {String} path Path used as id of light
 * @param {Number} x x position
 * @param {Number} y y position
 * @param {Number} z z position
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setLightPosition = function setLightPosition(path, x, y, z) {
    var light = this.lightRegistry[path] || this.createLight(path);

    light.position[0] = x;
    light.position[1] = y;
    light.position[2] = z;
    return this;
};

/**
 * Changes the color of a dynamic intensity lighting in the scene
 *
 * @method
 *
 * @param {String} path Path used as id of light in light Registry.
 * @param {Number} r red channel
 * @param {Number} g green channel
 * @param {Number} b blue channel
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setLightColor = function setLightColor(path, r, g, b) {
    var light = this.lightRegistry[path] || this.createLight(path);

    light.color[0] = r;
    light.color[1] = g;
    light.color[2] = b;
    return this;
};

/**
 * Compiles material spec into program shader
 *
 * @method
 *
 * @param {String} path Path used as id of cutout in cutout registry.
 * @param {String} name Name that the rendering input the material is bound to
 * @param {Object} material Material spec
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.handleMaterialInput = function handleMaterialInput(path, name, material) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);
    material = compileMaterial(material, mesh.textures.length);

    // Set uniforms to enable texture!

    mesh.uniformValues[mesh.uniformKeys.indexOf(name)][0] = -material._id;

    // Register textures!

    var i = material.textures.length;
    while (i--) {
        mesh.textures.push(
            this.textureManager.register(material.textures[i], mesh.textures.length + i)
        );
    }

    // Register material!

    this.program.registerMaterial(name, material);

    return this.updateSize();
};

/**
 * Changes the geometry data of a mesh
 *
 * @method
 *
 * @param {String} path Path used as id of cutout in cutout registry.
 * @param {Object} geometry Geometry object containing vertex data to be drawn
 * @param {Number} drawType Primitive identifier
 * @param {Boolean} dynamic Whether geometry is dynamic
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setGeometry = function setGeometry(path, geometry, drawType, dynamic) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    mesh.geometry = geometry;
    mesh.drawType = drawType;
    mesh.dynamic = dynamic;

    return this;
};

/**
 * Uploads a new value for the uniform data when the mesh is being drawn
 *
 * @method
 *
 * @param {String} path Path used as id of mesh in mesh registry
 * @param {String} uniformName Identifier used to upload value
 * @param {Array} uniformValue Value of uniform data
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setMeshUniform = function setMeshUniform(path, uniformName, uniformValue) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    var index = mesh.uniformKeys.indexOf(uniformName);

    if (index === -1) {
        mesh.uniformKeys.push(uniformName);
        mesh.uniformValues.push(uniformValue);
    }
    else {
        mesh.uniformValues[index] = uniformValue;
    }
};

/**
 * Triggers the 'draw' phase of the WebGLRenderer. Iterates through registries
 * to set uniforms, set attributes and issue draw commands for renderables.
 *
 * @method
 *
 * @param {String} path Path used as id of mesh in mesh registry
 * @param {Number} geometryId Id of geometry in geometry registry
 * @param {String} bufferName Attribute location name
 * @param {Array} bufferValue Vertex data
 * @param {Number} bufferSpacing The dimensions of the vertex
 * @param {Boolean} isDynamic Whether geometry is dynamic
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.bufferData = function bufferData(path, geometryId, bufferName, bufferValue, bufferSpacing, isDynamic) {
    this.bufferRegistry.allocate(geometryId, bufferName, bufferValue, bufferSpacing, isDynamic);

    return this;
};

/**
 * Triggers the 'draw' phase of the WebGLRenderer. Iterates through registries
 * to set uniforms, set attributes and issue draw commands for renderables.
 *
 * @method
 *
 * @param {Object} renderState Parameters provided by the compositor, that affect the rendering of all renderables.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.draw = function draw(renderState) {
    var time = this.compositor.getTime();

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.textureManager.update(time);

    this.meshRegistryKeys = sorter(this.meshRegistryKeys, this.meshRegistry);

    this.setGlobalUniforms(renderState);
    this.drawCutouts();
    this.drawMeshes();
};

/**
 * Iterates through and draws all registered meshes. This includes
 * binding textures, handling draw options, setting mesh uniforms
 * and drawing mesh buffers.
 *
 * @method
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.drawMeshes = function drawMeshes() {
    var gl = this.gl;
    var buffers;
    var mesh;

    for(var i = 0; i < this.meshRegistryKeys.length; i++) {
        mesh = this.meshRegistry[this.meshRegistryKeys[i]];
        buffers = this.bufferRegistry.registry[mesh.geometry];

        if (!mesh.visible) continue;

        if (mesh.uniformValues[0] < 1) {
            gl.depthMask(false);
            gl.enable(gl.BLEND);
        }
        else {
            gl.depthMask(true);
            gl.disable(gl.BLEND);
        }

        if (!buffers) continue;

        var j = mesh.textures.length;
        while (j--) this.textureManager.bindTexture(mesh.textures[j]);

        if (mesh.options) this.handleOptions(mesh.options, mesh);

        this.program.setUniforms(mesh.uniformKeys, mesh.uniformValues);
        this.drawBuffers(buffers, mesh.drawType, mesh.geometry);

        if (mesh.options) this.resetOptions(mesh.options);
    }
};

/**
 * Iterates through and draws all registered cutout meshes. Blending
 * is disabled, cutout uniforms are set and finally buffers are drawn.
 *
 * @method
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.drawCutouts = function drawCutouts() {
    var cutout;
    var buffers;
    var len = this.cutoutRegistryKeys.length;

    if (len) {
        this.gl.enable(this.gl.BLEND);
        this.gl.depthMask(true);
    }

    for (var i = 0; i < len; i++) {
        cutout = this.cutoutRegistry[this.cutoutRegistryKeys[i]];
        buffers = this.bufferRegistry.registry[cutout.geometry];

        if (!cutout.visible) continue;

        this.program.setUniforms(cutout.uniformKeys, cutout.uniformValues);
        this.drawBuffers(buffers, cutout.drawType, cutout.geometry);
    }
};

/**
 * Sets uniforms to be shared by all meshes.
 *
 * @method
 *
 * @param {Object} renderState Draw state options passed down from compositor.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setGlobalUniforms = function setGlobalUniforms(renderState) {
    var light;
    var stride;

    for (var i = 0, len = this.lightRegistryKeys.length; i < len; i++) {
        light = this.lightRegistry[this.lightRegistryKeys[i]];
        stride = i * 4;

        // Build the light positions' 4x4 matrix

        this.lightPositions[0 + stride] = light.position[0];
        this.lightPositions[1 + stride] = light.position[1];
        this.lightPositions[2 + stride] = light.position[2];

        // Build the light colors' 4x4 matrix

        this.lightColors[0 + stride] = light.color[0];
        this.lightColors[1 + stride] = light.color[1];
        this.lightColors[2 + stride] = light.color[2];
    }

    globalUniforms.values[0] = this.numLights;
    globalUniforms.values[1] = this.ambientLightColor;
    globalUniforms.values[2] = this.lightPositions;
    globalUniforms.values[3] = this.lightColors;

    /*
     * Set time and projection uniforms
     * projecting world space into a 2d plane representation of the canvas.
     * The x and y scale (this.projectionTransform[0] and this.projectionTransform[5] respectively)
     * convert the projected geometry back into clipspace.
     * The perpective divide (this.projectionTransform[11]), adds the z value of the point
     * multiplied by the perspective divide to the w value of the point. In the process
     * of converting from homogenous coordinates to NDC (normalized device coordinates)
     * the x and y values of the point are divided by w, which implements perspective.
     */
    this.projectionTransform[0] = 1 / (this.cachedSize[0] * 0.5);
    this.projectionTransform[5] = -1 / (this.cachedSize[1] * 0.5);
    this.projectionTransform[11] = renderState.perspectiveTransform[11];

    globalUniforms.values[4] = this.projectionTransform;
    globalUniforms.values[5] = this.compositor.getTime() * 0.001;
    globalUniforms.values[6] = renderState.viewTransform;

    this.program.setUniforms(globalUniforms.keys, globalUniforms.values);
};

/**
 * Loads the buffers and issues the draw command for a geometry.
 *
 * @method
 *
 * @param {Object} vertexBuffers All buffers used to draw the geometry.
 * @param {Number} mode Enumerator defining what primitive to draw
 * @param {Number} id ID of geometry being drawn.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.drawBuffers = function drawBuffers(vertexBuffers, mode, id) {
    var gl = this.gl;
    var length = 0;
    var attribute;
    var location;
    var spacing;
    var offset;
    var buffer;
    var iter;
    var j;
    var i;

    iter = vertexBuffers.keys.length;
    for (i = 0; i < iter; i++) {
        attribute = vertexBuffers.keys[i];

        // Do not set vertexAttribPointer if index buffer.

        if (attribute === 'indices') {
            j = i; continue;
        }

        // Retreive the attribute location and make sure it is enabled.

        location = this.program.attributeLocations[attribute];

        if (location === -1) continue;
        if (location === undefined) {
            location = gl.getAttribLocation(this.program.program, attribute);
            this.program.attributeLocations[attribute] = location;
            if (location === -1) continue;
        }

        if (!this.state.enabledAttributes[attribute]) {
            gl.enableVertexAttribArray(location);
            this.state.enabledAttributes[attribute] = true;
            this.state.enabledAttributesKeys.push(attribute);
        }

        // Retreive buffer information used to set attribute pointer.

        buffer = vertexBuffers.values[i];
        spacing = vertexBuffers.spacing[i];
        offset = vertexBuffers.offset[i];
        length = vertexBuffers.length[i];

        // Skip bindBuffer if buffer is currently bound.

        if (this.state.boundArrayBuffer !== buffer) {
            gl.bindBuffer(buffer.target, buffer.buffer);
            this.state.boundArrayBuffer = buffer;
        }

        if (this.state.lastDrawn !== id) {
            gl.vertexAttribPointer(location, spacing, gl.FLOAT, gl.FALSE, 0, 4 * offset);
        }
    }

    // Disable any attributes that not currently being used.

    var len = this.state.enabledAttributesKeys.length;
    for (i = 0; i < len; i++) {
        var key = this.state.enabledAttributesKeys[i];
        if (this.state.enabledAttributes[key] && vertexBuffers.keys.indexOf(key) === -1) {
            gl.disableVertexAttribArray(this.program.attributeLocations[key]);
            this.state.enabledAttributes[key] = false;
        }
    }

    if (length) {

        // If index buffer, use drawElements.

        if (j !== undefined) {
            buffer = vertexBuffers.values[j];
            offset = vertexBuffers.offset[j];
            spacing = vertexBuffers.spacing[j];
            length = vertexBuffers.length[j];

            // Skip bindBuffer if buffer is currently bound.

            if (this.state.boundElementBuffer !== buffer) {
                gl.bindBuffer(buffer.target, buffer.buffer);
                this.state.boundElementBuffer = buffer;
            }

            gl.drawElements(gl[mode], length, gl.UNSIGNED_SHORT, 2 * offset);
        }
        else {
            gl.drawArrays(gl[mode], 0, length);
        }
    }

    this.state.lastDrawn = id;
};

/**
 * Updates the width and height of parent canvas, sets the viewport size on
 * the WebGL context and updates the resolution uniform for the shader program.
 * Size is retreived from the container object of the renderer.
 *
 * @method
 *
 * @param {Array} size width, height and depth of canvas
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.updateSize = function updateSize(size) {
    if (size) {
        var pixelRatio = window.devicePixelRatio || 1;
        var displayWidth = ~~(size[0] * pixelRatio);
        var displayHeight = ~~(size[1] * pixelRatio);
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
        this.gl.viewport(0, 0, displayWidth, displayHeight);

        this.cachedSize[0] = size[0];
        this.cachedSize[1] = size[1];
        this.cachedSize[2] = (size[0] > size[1]) ? size[0] : size[1];
        this.resolutionValues[0] = this.cachedSize;
    }

    this.program.setUniforms(this.resolutionName, this.resolutionValues);

    return this;
};

/**
 * Updates the state of the WebGL drawing context based on custom parameters
 * defined on a mesh.
 *
 * @method
 *
 * @param {Object} options Draw state options to be set to the context.
 * @param {Mesh} mesh Associated Mesh
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.handleOptions = function handleOptions(options, mesh) {
    var gl = this.gl;
    if (!options) return;

    if (options.side === 'double') {
        this.gl.cullFace(this.gl.FRONT);
        this.drawBuffers(this.bufferRegistry.registry[mesh.geometry], mesh.drawType, mesh.geometry);
        this.gl.cullFace(this.gl.BACK);
    }

    if (options.blending) gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    if (options.side === 'back') gl.cullFace(gl.FRONT);
};

/**
 * Resets the state of the WebGL drawing context to default values.
 *
 * @method
 *
 * @param {Object} options Draw state options to be set to the context.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.resetOptions = function resetOptions(options) {
    var gl = this.gl;
    if (!options) return;
    if (options.blending) gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    if (options.side === 'back') gl.cullFace(gl.BACK);
};

module.exports = WebGLRenderer;

},{"../utilities/keyValueToArrays":38,"../webgl-geometries/primitives/Plane":42,"./BufferRegistry":44,"./Program":46,"./TextureManager":48,"./compileMaterial":50,"./radixSort":52}],50:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

var types = {
    1: 'float ',
    2: 'vec2 ',
    3: 'vec3 ',
    4: 'vec4 '
};

/**
 * Traverses material to create a string of glsl code to be applied in
 * the vertex or fragment shader.
 *
 * @method
 * @protected
 *
 * @param {Object} material Material to be compiled.
 * @param {Number} textureSlot Next available texture slot for Mesh.
 *
 * @return {undefined} undefined
 */
function compileMaterial(material, textureSlot) {
    var glsl = '';
    var uniforms = {};
    var varyings = {};
    var attributes = {};
    var defines = [];
    var textures = [];

    _traverse(material, function (node, depth) {
        if (! node.chunk) return;

        var type = types[_getOutputLength(node)];
        var label = _makeLabel(node);
        var output = _processGLSL(node.chunk.glsl, node.inputs, textures.length + textureSlot);

        glsl += type + label + ' = ' + output + '\n ';

        if (node.uniforms) _extend(uniforms, node.uniforms);
        if (node.varyings) _extend(varyings, node.varyings);
        if (node.attributes) _extend(attributes, node.attributes);
        if (node.chunk.defines) defines.push(node.chunk.defines);
        if (node.texture) textures.push(node.texture);
    });

    return {
        _id: material._id,
        glsl: glsl + 'return ' + _makeLabel(material) + ';',
        defines: defines.join('\n'),
        uniforms: uniforms,
        varyings: varyings,
        attributes: attributes,
        textures: textures
    };
}

// Recursively iterates over a material's inputs, invoking a given callback
// with the current material
function _traverse(material, callback) {
	var inputs = material.inputs;
    var len = inputs && inputs.length;
    var idx = -1;

    while (++idx < len) _traverse(inputs[idx], callback);

    callback(material);

    return material;
}

// Helper function used to infer length of the output
// from a given material node.
function _getOutputLength(node) {

    // Handle constant values

    if (typeof node === 'number') return 1;
    if (Array.isArray(node)) return node.length;

    // Handle materials

    var output = node.chunk.output;
    if (typeof output === 'number') return output;

    // Handle polymorphic output

    var key = node.inputs.map(function recurse(node) {
        return _getOutputLength(node);
    }).join(',');

    return output[key];
}

// Helper function to run replace inputs and texture tags with
// correct glsl.
function _processGLSL(str, inputs, textureSlot) {
    return str
        .replace(/%\d/g, function (s) {
            return _makeLabel(inputs[s[1]-1]);
        })
        .replace(/\$TEXTURE/, 'u_textures[' + textureSlot + ']');
}

// Helper function used to create glsl definition of the
// input material node.
function _makeLabel (n) {
    if (Array.isArray(n)) return _arrayToVec(n);
    if (typeof n === 'object') return 'fa_' + (n._id);
    else return n.toFixed(6);
}

// Helper to copy the properties of an object onto another object.
function _extend (a, b) {
	for (var k in b) a[k] = b[k];
}

// Helper to create glsl vector representation of a javascript array.
function _arrayToVec(array) {
    var len = array.length;
    return 'vec' + len + '(' + array.join(',')  + ')';
}

module.exports = compileMaterial;

},{}],51:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

// Generates a checkerboard pattern to be used as a placeholder texture while an
// image loads over the network.
function createCheckerBoard() {
    var context = document.createElement('canvas').getContext('2d');
    context.canvas.width = context.canvas.height = 128;
    for (var y = 0; y < context.canvas.height; y += 16) {
        for (var x = 0; x < context.canvas.width; x += 16) {
            context.fillStyle = (x ^ y) & 16 ? '#FFF' : '#DDD';
            context.fillRect(x, y, 16, 16);
        }
    }

    return context.canvas;
}

module.exports = createCheckerBoard;

},{}],52:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

var radixBits = 11,
    maxRadix = 1 << (radixBits),
    radixMask = maxRadix - 1,
    buckets = new Array(maxRadix * Math.ceil(64 / radixBits)),
    msbMask = 1 << ((32 - 1) % radixBits),
    lastMask = (msbMask << 1) - 1,
    passCount = ((32 / radixBits) + 0.999999999999999) | 0,
    maxOffset = maxRadix * (passCount - 1),
    normalizer = Math.pow(20, 6);

var buffer = new ArrayBuffer(4);
var floatView = new Float32Array(buffer, 0, 1);
var intView = new Int32Array(buffer, 0, 1);

// comparator pulls relevant sorting keys out of mesh
function comp(list, registry, i) {
    var key = list[i];
    var item = registry[key];
    return (item.depth ? item.depth : registry[key].uniformValues[1][14]) + normalizer;
}

//mutator function records mesh's place in previous pass
function mutator(list, registry, i, value) {
    var key = list[i];
    registry[key].depth = intToFloat(value) - normalizer;
    return key;
}

//clean function removes mutator function's record
function clean(list, registry, i) {
    registry[list[i]].depth = null;
}

//converts a javascript float to a 32bit integer using an array buffer
//of size one
function floatToInt(k) {
    floatView[0] = k;
    return intView[0];
}
//converts a 32 bit integer to a regular javascript float using an array buffer
//of size one
function intToFloat(k) {
    intView[0] = k;
    return floatView[0];
}

//sorts a list of mesh IDs according to their z-depth
function radixSort(list, registry) {
    var pass = 0;
    var out = [];

    var i, j, k, n, div, offset, swap, id, sum, tsum, size;

    passCount = ((32 / radixBits) + 0.999999999999999) | 0;

    for (i = 0, n = maxRadix * passCount; i < n; i++) buckets[i] = 0;

    for (i = 0, n = list.length; i < n; i++) {
        div = floatToInt(comp(list, registry, i));
        div ^= div >> 31 | 0x80000000;
        for (j = 0, k = 0; j < maxOffset; j += maxRadix, k += radixBits) {
            buckets[j + (div >>> k & radixMask)]++;
        }
        buckets[j + (div >>> k & lastMask)]++;
    }

    for (j = 0; j <= maxOffset; j += maxRadix) {
        for (id = j, sum = 0; id < j + maxRadix; id++) {
            tsum = buckets[id] + sum;
            buckets[id] = sum - 1;
            sum = tsum;
        }
    }
    if (--passCount) {
        for (i = 0, n = list.length; i < n; i++) {
            div = floatToInt(comp(list, registry, i));
            out[++buckets[div & radixMask]] = mutator(list, registry, i, div ^= div >> 31 | 0x80000000);
        }
        
        swap = out;
        out = list;
        list = swap;
        while (++pass < passCount) {
            for (i = 0, n = list.length, offset = pass * maxRadix, size = pass * radixBits; i < n; i++) {
                div = floatToInt(comp(list, registry, i));
                out[++buckets[offset + (div >>> size & radixMask)]] = list[i];
            }

            swap = out;
            out = list;
            list = swap;
        }
    }

    for (i = 0, n = list.length, offset = pass * maxRadix, size = pass * radixBits; i < n; i++) {
        div = floatToInt(comp(list, registry, i));
        out[++buckets[offset + (div >>> size & lastMask)]] = mutator(list, registry, i, div ^ (~div >> 31 | 0x80000000));
        clean(list, registry, i);
    }

    return out;
}

module.exports = radixSort;

},{}],53:[function(require,module,exports){
"use strict";
var glslify = require("glslify");
var shaders = require("glslify/simple-adapter.js")("\n#define GLSLIFY 1\n\nmat3 a_x_getNormalMatrix(in mat4 t) {\n  mat3 matNorm;\n  mat4 a = t;\n  float a00 = a[0][0], a01 = a[0][1], a02 = a[0][2], a03 = a[0][3], a10 = a[1][0], a11 = a[1][1], a12 = a[1][2], a13 = a[1][3], a20 = a[2][0], a21 = a[2][1], a22 = a[2][2], a23 = a[2][3], a30 = a[3][0], a31 = a[3][1], a32 = a[3][2], a33 = a[3][3], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;\n  det = 1.0 / det;\n  matNorm[0][0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;\n  matNorm[0][1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;\n  matNorm[0][2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;\n  matNorm[1][0] = (a02 * b10 - a01 * b11 - a03 * b09) * det;\n  matNorm[1][1] = (a00 * b11 - a02 * b08 + a03 * b07) * det;\n  matNorm[1][2] = (a01 * b08 - a00 * b10 - a03 * b06) * det;\n  matNorm[2][0] = (a31 * b05 - a32 * b04 + a33 * b03) * det;\n  matNorm[2][1] = (a32 * b02 - a30 * b05 - a33 * b01) * det;\n  matNorm[2][2] = (a30 * b04 - a31 * b02 + a33 * b00) * det;\n  return matNorm;\n}\nfloat b_x_inverse(float m) {\n  return 1.0 / m;\n}\nmat2 b_x_inverse(mat2 m) {\n  return mat2(m[1][1], -m[0][1], -m[1][0], m[0][0]) / (m[0][0] * m[1][1] - m[0][1] * m[1][0]);\n}\nmat3 b_x_inverse(mat3 m) {\n  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];\n  float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];\n  float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];\n  float b01 = a22 * a11 - a12 * a21;\n  float b11 = -a22 * a10 + a12 * a20;\n  float b21 = a21 * a10 - a11 * a20;\n  float det = a00 * b01 + a01 * b11 + a02 * b21;\n  return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11), b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10), b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;\n}\nmat4 b_x_inverse(mat4 m) {\n  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3], a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3], a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3], a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;\n  return mat4(a11 * b11 - a12 * b10 + a13 * b09, a02 * b10 - a01 * b11 - a03 * b09, a31 * b05 - a32 * b04 + a33 * b03, a22 * b04 - a21 * b05 - a23 * b03, a12 * b08 - a10 * b11 - a13 * b07, a00 * b11 - a02 * b08 + a03 * b07, a32 * b02 - a30 * b05 - a33 * b01, a20 * b05 - a22 * b02 + a23 * b01, a10 * b10 - a11 * b08 + a13 * b06, a01 * b08 - a00 * b10 - a03 * b06, a30 * b04 - a31 * b02 + a33 * b00, a21 * b02 - a20 * b04 - a23 * b00, a11 * b07 - a10 * b09 - a12 * b06, a00 * b09 - a01 * b07 + a02 * b06, a31 * b01 - a30 * b03 - a32 * b00, a20 * b03 - a21 * b01 + a22 * b00) / det;\n}\nfloat c_x_transpose(float m) {\n  return m;\n}\nmat2 c_x_transpose(mat2 m) {\n  return mat2(m[0][0], m[1][0], m[0][1], m[1][1]);\n}\nmat3 c_x_transpose(mat3 m) {\n  return mat3(m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]);\n}\nmat4 c_x_transpose(mat4 m) {\n  return mat4(m[0][0], m[1][0], m[2][0], m[3][0], m[0][1], m[1][1], m[2][1], m[3][1], m[0][2], m[1][2], m[2][2], m[3][2], m[0][3], m[1][3], m[2][3], m[3][3]);\n}\nvec4 applyTransform(vec4 pos) {\n  mat4 MVMatrix = u_view * u_transform;\n  pos.x += 1.0;\n  pos.y -= 1.0;\n  pos.xyz *= u_size * 0.5;\n  pos.y *= -1.0;\n  v_position = (MVMatrix * pos).xyz;\n  v_eyeVector = (u_resolution * 0.5) - v_position;\n  pos = u_perspective * MVMatrix * pos;\n  return pos;\n}\n#vert_definitions\n\nvec3 calculateOffset(vec3 ID) {\n  \n  #vert_applications\n  return vec3(0.0);\n}\nvoid main() {\n  v_textureCoordinate = a_texCoord;\n  vec3 invertedNormals = a_normals + (u_normals.x < 0.0 ? calculateOffset(u_normals) * 2.0 - 1.0 : vec3(0.0));\n  invertedNormals.y *= -1.0;\n  v_normal = c_x_transpose(mat3(b_x_inverse(u_transform))) * invertedNormals;\n  vec3 offsetPos = a_pos + calculateOffset(u_positionOffset);\n  gl_Position = applyTransform(vec4(offsetPos, 1.0));\n}", "\n#define GLSLIFY 1\n\n#float_definitions\n\nfloat a_x_applyMaterial(float ID) {\n  \n  #float_applications\n  return 1.;\n}\n#vec3_definitions\n\nvec3 a_x_applyMaterial(vec3 ID) {\n  \n  #vec3_applications\n  return vec3(0);\n}\n#vec4_definitions\n\nvec4 a_x_applyMaterial(vec4 ID) {\n  \n  #vec4_applications\n  return vec4(0);\n}\nvec4 b_x_applyLight(in vec4 baseColor, in vec3 normal, in vec4 glossiness) {\n  int numLights = int(u_numLights);\n  vec3 ambientColor = u_ambientLight * baseColor.rgb;\n  vec3 eyeVector = normalize(v_eyeVector);\n  vec3 diffuse = vec3(0.0);\n  bool hasGlossiness = glossiness.a > 0.0;\n  bool hasSpecularColor = length(glossiness.rgb) > 0.0;\n  for(int i = 0; i < 4; i++) {\n    if(i >= numLights)\n      break;\n    vec3 lightDirection = normalize(u_lightPosition[i].xyz - v_position);\n    float lambertian = max(dot(lightDirection, normal), 0.0);\n    if(lambertian > 0.0) {\n      diffuse += u_lightColor[i].rgb * baseColor.rgb * lambertian;\n      if(hasGlossiness) {\n        vec3 halfVector = normalize(lightDirection + eyeVector);\n        float specularWeight = pow(max(dot(halfVector, normal), 0.0), glossiness.a);\n        vec3 specularColor = hasSpecularColor ? glossiness.rgb : u_lightColor[i].rgb;\n        diffuse += specularColor * specularWeight * lambertian;\n      }\n    }\n  }\n  return vec4(ambientColor + diffuse, baseColor.a);\n}\nvoid main() {\n  vec4 material = u_baseColor.r >= 0.0 ? u_baseColor : a_x_applyMaterial(u_baseColor);\n  bool lightsEnabled = (u_flatShading == 0.0) && (u_numLights > 0.0 || length(u_ambientLight) > 0.0);\n  vec3 normal = normalize(v_normal);\n  vec4 glossiness = u_glossiness.x < 0.0 ? a_x_applyMaterial(u_glossiness) : u_glossiness;\n  vec4 color = lightsEnabled ? b_x_applyLight(material, normalize(v_normal), glossiness) : material;\n  gl_FragColor = color;\n  gl_FragColor.a *= u_opacity;\n}", [], []);
module.exports = shaders;
},{"glslify":27,"glslify/simple-adapter.js":28}],54:[function(require,module,exports){
'use strict';

var DOMElement = require('famous/dom-renderables/DOMElement');
var Node = require('famous/core/Node');

function Camera(mount) {
	// Extend Node
	Node.call(this);
	this.dom = new DOMElement(this, {
		tagName: 'video',
		attributes: {
			width: '100%',
			height: '100%',
			autoplay: true,
			id: 'cameraVideo'
		},
		properties: {
			zIndex: 20
		}
	});
	initWebCam.call(this);
}

Camera.prototype = Object.create(Node.prototype);

function initWebCam() {

	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

	if (navigator.getUserMedia) {
		navigator.getUserMedia({ video: true }, handleVideo, videoError);
	}

	function handleVideo(stream) {
		var video = document.querySelector('#cameraVideo');
		video.src = window.URL.createObjectURL(stream);
	}

	function videoError(e) {}
}

module.exports = Camera;

// do something

},{"famous/core/Node":7,"famous/dom-renderables/DOMElement":11}],55:[function(require,module,exports){
'use strict';

var Node = require('famous/core/Node');
var Camera = require('./Camera');
var Video = require('./Video');

function Mirror(mount) {
    // Extend Node
    Node.call(this);
    this.setSizeMode('absolute', 'absolute', 'absolute').setAbsoluteSize(innerWidth, innerHeight);
    makeCamera.call(this);
    makeVideo.call(this);
}

// Extend the prototype
Mirror.prototype = Object.create(Node.prototype);

// make the camera
function makeCamera() {
    this.camera = new Camera();
    this.addChild(this.camera);
    this.camera.setOpacity(0.5).setProportionalSize(1, 1, 1);
}

// make the video
function makeVideo() {
    this.video = new Video();
    this.addChild(this.video);
    this.video.setOpacity(1).setProportionalSize(1, 1, 1);
}

module.exports = Mirror;

},{"./Camera":54,"./Video":56,"famous/core/Node":7}],56:[function(require,module,exports){
'use strict';

var DOMElement = require('famous/dom-renderables/DOMElement');
var Node = require('famous/core/Node');

function Video(mount) {
				// Extend Node
				Node.call(this);
				this.dom = new DOMElement(this, {
								tagName: 'iframe',
								attributes: {
												width: '100%',
												height: '100%',
												src: 'http://www.youtube.com/embed/ZL_jcMiqSeI?rel=0&autoplay=1',
												frameborder: 0
								},
								properties: {
												zIndex: 10
								}
				});
}

Video.prototype = Object.create(Node.prototype);

module.exports = Video;

},{"famous/core/Node":7,"famous/dom-renderables/DOMElement":11}],57:[function(require,module,exports){
'use strict';

var Mirror = require('./Mirror');
var FamousEngine = require('famous/core/FamousEngine');

FamousEngine.init();
FamousEngine.createScene().addChild(new Mirror());

},{"./Mirror":55,"famous/core/FamousEngine":6}]},{},[57])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvbXBvbmVudHMvQ2FtZXJhLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9jb3JlL0NoYW5uZWwuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvQ2xvY2suanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvRGlzcGF0Y2guanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvRmFtb3VzRW5naW5lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9jb3JlL05vZGUuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvU2NlbmUuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvU2l6ZS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvY29yZS9UcmFuc2Zvcm0uanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJhYmxlcy9ET01FbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL0RPTVJlbmRlcmVyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL0VsZW1lbnRDYWNoZS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvZG9tLXJlbmRlcmVycy9NYXRoLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL2V2ZW50cy9Db21wb3NpdGlvbkV2ZW50LmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL2V2ZW50cy9FdmVudC5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvZG9tLXJlbmRlcmVycy9ldmVudHMvRXZlbnRNYXAuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL0ZvY3VzRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL0lucHV0RXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL0tleWJvYXJkRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL01vdXNlRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL1RvdWNoRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL1VJRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL1doZWVsRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL21hdGgvVmVjMi5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvbWF0aC9WZWMzLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9ub2RlX21vZHVsZXMvZ2xzbGlmeS9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9ub2RlX21vZHVsZXMvZ2xzbGlmeS9zaW1wbGUtYWRhcHRlci5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvcG9seWZpbGxzL2FuaW1hdGlvbkZyYW1lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9wb2x5ZmlsbHMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3JlbmRlci1sb29wcy9SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9yZW5kZXJlcnMvQ29tcG9zaXRvci5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvcmVuZGVyZXJzL0NvbnRleHQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3JlbmRlcmVycy9VSU1hbmFnZXIuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3JlbmRlcmVycy9pbmplY3QtY3NzLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy91dGlsaXRpZXMvQ2FsbGJhY2tTdG9yZS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvdXRpbGl0aWVzL2Nsb25lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy91dGlsaXRpZXMva2V5VmFsdWVUb0FycmF5cy5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvdXRpbGl0aWVzL3ZlbmRvclByZWZpeC5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtZ2VvbWV0cmllcy9HZW9tZXRyeS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtZ2VvbWV0cmllcy9HZW9tZXRyeUhlbHBlci5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtZ2VvbWV0cmllcy9wcmltaXRpdmVzL1BsYW5lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvQnVmZmVyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvQnVmZmVyUmVnaXN0cnkuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3dlYmdsLXJlbmRlcmVycy9EZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtcmVuZGVyZXJzL1Byb2dyYW0uanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3dlYmdsLXJlbmRlcmVycy9UZXh0dXJlLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvVGV4dHVyZU1hbmFnZXIuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3dlYmdsLXJlbmRlcmVycy9XZWJHTFJlbmRlcmVyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvY29tcGlsZU1hdGVyaWFsLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvY3JlYXRlQ2hlY2tlcmJvYXJkLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvcmFkaXhTb3J0LmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1zaGFkZXJzL2luZGV4LmpzIiwiL1VzZXJzL1lhaGFuZy9HaXRodWIvZGVNb2JvL21pcnJvci9zcmMvbWlycm9yL0NhbWVyYS5qcyIsIi9Vc2Vycy9ZYWhhbmcvR2l0aHViL2RlTW9iby9taXJyb3Ivc3JjL21pcnJvci9NaXJyb3IuanMiLCIvVXNlcnMvWWFoYW5nL0dpdGh1Yi9kZU1vYm8vbWlycm9yL3NyYy9taXJyb3IvVmlkZW8uanMiLCIvVXNlcnMvWWFoYW5nL0dpdGh1Yi9kZU1vYm8vbWlycm9yL3NyYy9taXJyb3IvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzb0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMWxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDampCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0ZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2MEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0hBLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO0FBQzlELElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDOztBQUV2QyxTQUFTLE1BQU0sQ0FBQyxLQUFLLEVBQUU7O0FBRW5CLEtBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEIsS0FBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUU7QUFDL0IsU0FBTyxFQUFFLE9BQU87QUFDaEIsWUFBVSxFQUFFO0FBQ1gsUUFBSyxFQUFFLE1BQU07QUFDYixTQUFNLEVBQUUsTUFBTTtBQUNkLFdBQVEsRUFBRSxJQUFJO0FBQ2QsS0FBRSxFQUFFLGFBQWE7R0FDakI7QUFDRCxZQUFVLEVBQUU7QUFDTCxTQUFNLEVBQUUsRUFBRTtHQUNiO0VBQ1AsQ0FBQyxDQUFDO0FBQ0gsV0FBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUN0Qjs7QUFFRCxNQUFNLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUVqRCxTQUFTLFVBQVUsR0FBRzs7QUFFckIsVUFBUyxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUMsWUFBWSxJQUFJLFNBQVMsQ0FBQyxrQkFBa0IsSUFBSSxTQUFTLENBQUMsZUFBZSxJQUFJLFNBQVMsQ0FBQyxjQUFjLElBQUksU0FBUyxDQUFDLGFBQWEsQ0FBQzs7QUFFcEssS0FBSSxTQUFTLENBQUMsWUFBWSxFQUFFO0FBQ3hCLFdBQVMsQ0FBQyxZQUFZLENBQUMsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFDLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0VBQ2xFOztBQUVELFVBQVMsV0FBVyxDQUFDLE1BQU0sRUFBRTtBQUM1QixNQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ2hELE9BQUssQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDbEQ7O0FBRUQsVUFBUyxVQUFVLENBQUMsQ0FBQyxFQUFFLEVBRXRCO0NBQ0Q7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7Ozs7Ozs7QUN6Q3hCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ3ZDLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNqQyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRS9CLFNBQVMsTUFBTSxDQUFDLEtBQUssRUFBRTs7QUFFbkIsUUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNoQixRQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQy9DLGVBQWUsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDOUMsY0FBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0QixhQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ3hCOzs7QUFHRCxNQUFNLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7QUFHakQsU0FBUyxVQUFVLEdBQUk7QUFDbkIsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQzNCLFFBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNCLFFBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUUsQ0FBQyxDQUNyQixtQkFBbUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ3JDOzs7QUFHRCxTQUFTLFNBQVMsR0FBSTtBQUNsQixRQUFJLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDekIsUUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUIsUUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQ25CLG1CQUFtQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDckM7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7Ozs7O0FDaEN4QixJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsbUNBQW1DLENBQUMsQ0FBQztBQUM5RCxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7QUFFdkMsU0FBUyxLQUFLLENBQUMsS0FBSyxFQUFFOztBQUVsQixRQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hCLFFBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxFQUFFO0FBQy9CLGVBQU8sRUFBRSxRQUFRO0FBQ2pCLGtCQUFVLEVBQUU7QUFDWCxpQkFBSyxFQUFFLE1BQU07QUFDYixrQkFBTSxFQUFFLE1BQU07QUFDZCxlQUFHLEVBQUUsMkRBQTJEO0FBQ2hFLHVCQUFXLEVBQUUsQ0FBQztTQUNkO0FBQ0Qsa0JBQVUsRUFBRTtBQUNMLGtCQUFNLEVBQUUsRUFBRTtTQUNiO0tBQ1AsQ0FBQyxDQUFDO0NBQ0g7O0FBRUQsS0FBSyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFaEQsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7Ozs7O0FDdEJ2QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDakMsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7O0FBRXZELFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNwQixZQUFZLENBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQ2FtZXJhIGlzIGEgY29tcG9uZW50IHRoYXQgaXMgcmVzcG9uc2libGUgZm9yIHNlbmRpbmcgaW5mb3JtYXRpb24gdG8gdGhlIHJlbmRlcmVyIGFib3V0IHdoZXJlXG4gKiB0aGUgY2FtZXJhIGlzIGluIHRoZSBzY2VuZS4gIFRoaXMgYWxsb3dzIHRoZSB1c2VyIHRvIHNldCB0aGUgdHlwZSBvZiBwcm9qZWN0aW9uLCB0aGUgZm9jYWwgZGVwdGgsXG4gKiBhbmQgb3RoZXIgcHJvcGVydGllcyB0byBhZGp1c3QgdGhlIHdheSB0aGUgc2NlbmVzIGFyZSByZW5kZXJlZC5cbiAqXG4gKiBAY2xhc3MgQ2FtZXJhXG4gKlxuICogQHBhcmFtIHtOb2RlfSBub2RlIHRvIHdoaWNoIHRoZSBpbnN0YW5jZSBvZiBDYW1lcmEgd2lsbCBiZSBhIGNvbXBvbmVudCBvZlxuICovXG5mdW5jdGlvbiBDYW1lcmEobm9kZSkge1xuICAgIHRoaXMuX25vZGUgPSBub2RlO1xuICAgIHRoaXMuX3Byb2plY3Rpb25UeXBlID0gQ2FtZXJhLk9SVEhPR1JBUEhJQ19QUk9KRUNUSU9OO1xuICAgIHRoaXMuX2ZvY2FsRGVwdGggPSAwO1xuICAgIHRoaXMuX25lYXIgPSAwO1xuICAgIHRoaXMuX2ZhciA9IDA7XG4gICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMuX2lkID0gbm9kZS5hZGRDb21wb25lbnQodGhpcyk7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybSA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKTtcbiAgICB0aGlzLl92aWV3RGlydHkgPSBmYWxzZTtcbiAgICB0aGlzLl9wZXJzcGVjdGl2ZURpcnR5ID0gZmFsc2U7XG4gICAgdGhpcy5zZXRGbGF0KCk7XG59XG5cbkNhbWVyYS5GUlVTVFVNX1BST0pFQ1RJT04gPSAwO1xuQ2FtZXJhLlBJTkhPTEVfUFJPSkVDVElPTiA9IDE7XG5DYW1lcmEuT1JUSE9HUkFQSElDX1BST0pFQ1RJT04gPSAyO1xuXG4vKipcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGNvbXBvbmVudFxuICovXG5DYW1lcmEucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuICdDYW1lcmEnO1xufTtcblxuLyoqXG4gKiBHZXRzIG9iamVjdCBjb250YWluaW5nIHNlcmlhbGl6ZWQgZGF0YSBmb3IgdGhlIGNvbXBvbmVudFxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IHRoZSBzdGF0ZSBvZiB0aGUgY29tcG9uZW50XG4gKi9cbkNhbWVyYS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiBnZXRWYWx1ZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb21wb25lbnQ6IHRoaXMudG9TdHJpbmcoKSxcbiAgICAgICAgcHJvamVjdGlvblR5cGU6IHRoaXMuX3Byb2plY3Rpb25UeXBlLFxuICAgICAgICBmb2NhbERlcHRoOiB0aGlzLl9mb2NhbERlcHRoLFxuICAgICAgICBuZWFyOiB0aGlzLl9uZWFyLFxuICAgICAgICBmYXI6IHRoaXMuX2ZhclxuICAgIH07XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29tcG9uZW50cyBzdGF0ZSBiYXNlZCBvbiBzb21lIHNlcmlhbGl6ZWQgZGF0YVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gc3RhdGUgYW4gb2JqZWN0IGRlZmluaW5nIHdoYXQgdGhlIHN0YXRlIG9mIHRoZSBjb21wb25lbnQgc2hvdWxkIGJlXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gc3RhdHVzIG9mIHRoZSBzZXRcbiAqL1xuQ2FtZXJhLnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uIHNldFZhbHVlKHN0YXRlKSB7XG4gICAgaWYgKHRoaXMudG9TdHJpbmcoKSA9PT0gc3RhdGUuY29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuc2V0KHN0YXRlLnByb2plY3Rpb25UeXBlLCBzdGF0ZS5mb2NhbERlcHRoLCBzdGF0ZS5uZWFyLCBzdGF0ZS5mYXIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGludGVybmFscyBvZiB0aGUgY29tcG9uZW50XG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0eXBlIGFuIGlkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHR5cGUgb2YgcHJvamVjdGlvbiB0byB1c2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBkZXB0aCB0aGUgZGVwdGggZm9yIHRoZSBwaW5ob2xlIHByb2plY3Rpb24gbW9kZWxcbiAqIEBwYXJhbSB7TnVtYmVyfSBuZWFyIHRoZSBkaXN0YW5jZSBvZiB0aGUgbmVhciBjbGlwcGluZyBwbGFuZSBmb3IgYSBmcnVzdHVtIHByb2plY3Rpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBmYXIgdGhlIGRpc3RhbmNlIG9mIHRoZSBmYXIgY2xpcHBpbmcgcGxhbmUgZm9yIGEgZnJ1c3R1bSBwcm9qZWN0aW9uXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gc3RhdHVzIG9mIHRoZSBzZXRcbiAqL1xuQ2FtZXJhLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQodHlwZSwgZGVwdGgsIG5lYXIsIGZhcikge1xuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkge1xuICAgICAgICB0aGlzLl9ub2RlLnJlcXVlc3RVcGRhdGUodGhpcy5faWQpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5fcHJvamVjdGlvblR5cGUgPSB0eXBlO1xuICAgIHRoaXMuX2ZvY2FsRGVwdGggPSBkZXB0aDtcbiAgICB0aGlzLl9uZWFyID0gbmVhcjtcbiAgICB0aGlzLl9mYXIgPSBmYXI7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY2FtZXJhIGRlcHRoIGZvciBhIHBpbmhvbGUgcHJvamVjdGlvbiBtb2RlbFxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gZGVwdGggdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIENhbWVyYSBhbmQgdGhlIG9yaWdpblxuICpcbiAqIEByZXR1cm4ge0NhbWVyYX0gdGhpc1xuICovXG5DYW1lcmEucHJvdG90eXBlLnNldERlcHRoID0gZnVuY3Rpb24gc2V0RGVwdGgoZGVwdGgpIHtcbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHtcbiAgICAgICAgdGhpcy5fbm9kZS5yZXF1ZXN0VXBkYXRlKHRoaXMuX2lkKTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMuX3BlcnNwZWN0aXZlRGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX3Byb2plY3Rpb25UeXBlID0gQ2FtZXJhLlBJTkhPTEVfUFJPSkVDVElPTjtcbiAgICB0aGlzLl9mb2NhbERlcHRoID0gZGVwdGg7XG4gICAgdGhpcy5fbmVhciA9IDA7XG4gICAgdGhpcy5fZmFyID0gMDtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBHZXRzIG9iamVjdCBjb250YWluaW5nIHNlcmlhbGl6ZWQgZGF0YSBmb3IgdGhlIGNvbXBvbmVudFxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbmVhciBkaXN0YW5jZSBmcm9tIHRoZSBuZWFyIGNsaXBwaW5nIHBsYW5lIHRvIHRoZSBjYW1lcmFcbiAqIEBwYXJhbSB7TnVtYmVyfSBmYXIgZGlzdGFuY2UgZnJvbSB0aGUgZmFyIGNsaXBwaW5nIHBsYW5lIHRvIHRoZSBjYW1lcmFcbiAqXG4gKiBAcmV0dXJuIHtDYW1lcmF9IHRoaXNcbiAqL1xuQ2FtZXJhLnByb3RvdHlwZS5zZXRGcnVzdHVtID0gZnVuY3Rpb24gc2V0RnJ1c3R1bShuZWFyLCBmYXIpIHtcbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHtcbiAgICAgICAgdGhpcy5fbm9kZS5yZXF1ZXN0VXBkYXRlKHRoaXMuX2lkKTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5fcGVyc3BlY3RpdmVEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fcHJvamVjdGlvblR5cGUgPSBDYW1lcmEuRlJVU1RVTV9QUk9KRUNUSU9OO1xuICAgIHRoaXMuX2ZvY2FsRGVwdGggPSAwO1xuICAgIHRoaXMuX25lYXIgPSBuZWFyO1xuICAgIHRoaXMuX2ZhciA9IGZhcjtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIENhbWVyYSB0byBoYXZlIG9ydGhvZ3JhcGhpYyBwcm9qZWN0aW9uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0NhbWVyYX0gdGhpc1xuICovXG5DYW1lcmEucHJvdG90eXBlLnNldEZsYXQgPSBmdW5jdGlvbiBzZXRGbGF0KCkge1xuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkge1xuICAgICAgICB0aGlzLl9ub2RlLnJlcXVlc3RVcGRhdGUodGhpcy5faWQpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLl9wZXJzcGVjdGl2ZURpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9wcm9qZWN0aW9uVHlwZSA9IENhbWVyYS5PUlRIT0dSQVBISUNfUFJPSkVDVElPTjtcbiAgICB0aGlzLl9mb2NhbERlcHRoID0gMDtcbiAgICB0aGlzLl9uZWFyID0gMDtcbiAgICB0aGlzLl9mYXIgPSAwO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFdoZW4gdGhlIG5vZGUgdGhpcyBjb21wb25lbnQgaXMgYXR0YWNoZWQgdG8gdXBkYXRlcywgdGhlIENhbWVyYSB3aWxsXG4gKiBzZW5kIG5ldyBjYW1lcmEgaW5mb3JtYXRpb24gdG8gdGhlIENvbXBvc2l0b3IgdG8gdXBkYXRlIHRoZSByZW5kZXJpbmdcbiAqIG9mIHRoZSBzY2VuZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ2FtZXJhLnByb3RvdHlwZS5vblVwZGF0ZSA9IGZ1bmN0aW9uIG9uVXBkYXRlKCkge1xuICAgIHRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgPSBmYWxzZTtcblxuICAgIHZhciBwYXRoID0gdGhpcy5fbm9kZS5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5fbm9kZVxuICAgICAgICAuc2VuZERyYXdDb21tYW5kKCdXSVRIJylcbiAgICAgICAgLnNlbmREcmF3Q29tbWFuZChwYXRoKTtcblxuICAgIGlmICh0aGlzLl9wZXJzcGVjdGl2ZURpcnR5KSB7XG4gICAgICAgIHRoaXMuX3BlcnNwZWN0aXZlRGlydHkgPSBmYWxzZTtcblxuICAgICAgICBzd2l0Y2ggKHRoaXMuX3Byb2plY3Rpb25UeXBlKSB7XG4gICAgICAgICAgICBjYXNlIENhbWVyYS5GUlVTVFVNX1BST0pFQ1RJT046XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQoJ0ZSVVNUVU1fUFJPSkVDVElPTicpO1xuICAgICAgICAgICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX25lYXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX2Zhcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIENhbWVyYS5QSU5IT0xFX1BST0pFQ1RJT046XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQoJ1BJTkhPTEVfUFJPSkVDVElPTicpO1xuICAgICAgICAgICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX2ZvY2FsRGVwdGgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBDYW1lcmEuT1JUSE9HUkFQSElDX1BST0pFQ1RJT046XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQoJ09SVEhPR1JBUEhJQ19QUk9KRUNUSU9OJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fdmlld0RpcnR5KSB7XG4gICAgICAgIHRoaXMuX3ZpZXdEaXJ0eSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKCdDSEFOR0VfVklFV19UUkFOU0ZPUk0nKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVswXSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMV0pO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzJdKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVszXSk7XG5cbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVs0XSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bNV0pO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzZdKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVs3XSk7XG5cbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVs4XSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bOV0pO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzEwXSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTFdKTtcblxuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzEyXSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTNdKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVsxNF0pO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzE1XSk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBXaGVuIHRoZSB0cmFuc2Zvcm0gb2YgdGhlIG5vZGUgdGhpcyBjb21wb25lbnQgaXMgYXR0YWNoZWQgdG9cbiAqIGNoYW5nZXMsIGhhdmUgdGhlIENhbWVyYSB1cGRhdGUgaXRzIHByb2plY3Rpb24gbWF0cml4IGFuZFxuICogaWYgbmVlZGVkLCBmbGFnIHRvIG5vZGUgdG8gdXBkYXRlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB0cmFuc2Zvcm0gYW4gYXJyYXkgZGVub3RpbmcgdGhlIHRyYW5zZm9ybSBtYXRyaXggb2YgdGhlIG5vZGVcbiAqXG4gKiBAcmV0dXJuIHtDYW1lcmF9IHRoaXNcbiAqL1xuQ2FtZXJhLnByb3RvdHlwZS5vblRyYW5zZm9ybUNoYW5nZSA9IGZ1bmN0aW9uIG9uVHJhbnNmb3JtQ2hhbmdlKHRyYW5zZm9ybSkge1xuICAgIHZhciBhID0gdHJhbnNmb3JtO1xuICAgIHRoaXMuX3ZpZXdEaXJ0eSA9IHRydWU7XG5cbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHtcbiAgICAgICAgdGhpcy5fbm9kZS5yZXF1ZXN0VXBkYXRlKHRoaXMuX2lkKTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgYTMwID0gYVsxMl0sIGEzMSA9IGFbMTNdLCBhMzIgPSBhWzE0XSwgYTMzID0gYVsxNV0sXG5cbiAgICBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsXG4gICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgIGIwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMCxcbiAgICBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsXG4gICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgIGIwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMixcbiAgICBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsXG4gICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgIGIwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMCxcbiAgICBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsXG4gICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgIGIxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMixcblxuICAgIGRldCA9IDEvKGIwMCAqIGIxMSAtIGIwMSAqIGIxMCArIGIwMiAqIGIwOSArIGIwMyAqIGIwOCAtIGIwNCAqIGIwNyArIGIwNSAqIGIwNik7XG5cbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzBdID0gKGExMSAqIGIxMSAtIGExMiAqIGIxMCArIGExMyAqIGIwOSkgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVsxXSA9IChhMDIgKiBiMTAgLSBhMDEgKiBiMTEgLSBhMDMgKiBiMDkpICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMl0gPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzNdID0gKGEyMiAqIGIwNCAtIGEyMSAqIGIwNSAtIGEyMyAqIGIwMykgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVs0XSA9IChhMTIgKiBiMDggLSBhMTAgKiBiMTEgLSBhMTMgKiBiMDcpICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bNV0gPSAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzZdID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVs3XSA9IChhMjAgKiBiMDUgLSBhMjIgKiBiMDIgKyBhMjMgKiBiMDEpICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bOF0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzldID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVsxMF0gPSAoYTMwICogYjA0IC0gYTMxICogYjAyICsgYTMzICogYjAwKSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzExXSA9IChhMjEgKiBiMDIgLSBhMjAgKiBiMDQgLSBhMjMgKiBiMDApICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTJdID0gKGExMSAqIGIwNyAtIGExMCAqIGIwOSAtIGExMiAqIGIwNikgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVsxM10gPSAoYTAwICogYjA5IC0gYTAxICogYjA3ICsgYTAyICogYjA2KSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzE0XSA9IChhMzEgKiBiMDEgLSBhMzAgKiBiMDMgLSBhMzIgKiBiMDApICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTVdID0gKGEyMCAqIGIwMyAtIGEyMSAqIGIwMSArIGEyMiAqIGIwMCkgKiBkZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBDaGFubmVscyBhcmUgYmVpbmcgdXNlZCBmb3IgaW50ZXJhY3Rpbmcgd2l0aCB0aGUgVUkgVGhyZWFkIHdoZW4gcnVubmluZyBpblxuICogYSBXZWIgV29ya2VyIG9yIHdpdGggdGhlIFVJTWFuYWdlci8gQ29tcG9zaXRvciB3aGVuIHJ1bm5pbmcgaW4gc2luZ2xlXG4gKiB0aHJlYWRlZCBtb2RlIChubyBXZWIgV29ya2VyKS5cbiAqXG4gKiBAY2xhc3MgQ2hhbm5lbFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENoYW5uZWwoKSB7XG4gICAgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyAmJiBzZWxmLndpbmRvdyAhPT0gc2VsZikge1xuICAgICAgICB0aGlzLl9lbnRlcldvcmtlck1vZGUoKTtcbiAgICB9XG59XG5cblxuLyoqXG4gKiBDYWxsZWQgZHVyaW5nIGNvbnN0cnVjdGlvbi4gU3Vic2NyaWJlcyBmb3IgYG1lc3NhZ2VgIGV2ZW50IGFuZCByb3V0ZXMgYWxsXG4gKiBmdXR1cmUgYHNlbmRNZXNzYWdlYCBtZXNzYWdlcyB0byB0aGUgTWFpbiBUaHJlYWQgKFwiVUkgVGhyZWFkXCIpLlxuICpcbiAqIFByaW1hcmlseSB1c2VkIGZvciB0ZXN0aW5nLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5DaGFubmVsLnByb3RvdHlwZS5fZW50ZXJXb3JrZXJNb2RlID0gZnVuY3Rpb24gX2VudGVyV29ya2VyTW9kZSgpIHtcbiAgICB0aGlzLl93b3JrZXJNb2RlID0gdHJ1ZTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIG9ubWVzc2FnZShldikge1xuICAgICAgICBfdGhpcy5vbk1lc3NhZ2UoZXYuZGF0YSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIE1lYW50IHRvIGJlIG92ZXJyaWRkZW4gYnkgYEZhbW91c2AuXG4gKiBBc3NpZ25lZCBtZXRob2Qgd2lsbCBiZSBpbnZva2VkIGZvciBldmVyeSByZWNlaXZlZCBtZXNzYWdlLlxuICpcbiAqIEB0eXBlIHtGdW5jdGlvbn1cbiAqIEBvdmVycmlkZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNoYW5uZWwucHJvdG90eXBlLm9uTWVzc2FnZSA9IG51bGw7XG5cbi8qKlxuICogU2VuZHMgYSBtZXNzYWdlIHRvIHRoZSBVSU1hbmFnZXIuXG4gKlxuICogQHBhcmFtICB7QW55fSAgICBtZXNzYWdlIEFyYml0cmFyeSBtZXNzYWdlIG9iamVjdC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5DaGFubmVsLnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uIHNlbmRNZXNzYWdlIChtZXNzYWdlKSB7XG4gICAgaWYgKHRoaXMuX3dvcmtlck1vZGUpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZShtZXNzYWdlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMub25tZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH1cbn07XG5cbi8qKlxuICogTWVhbnQgdG8gYmUgb3ZlcnJpZGVuIGJ5IHRoZSBVSU1hbmFnZXIgd2hlbiBydW5uaW5nIGluIHRoZSBVSSBUaHJlYWQuXG4gKiBVc2VkIGZvciBwcmVzZXJ2aW5nIEFQSSBjb21wYXRpYmlsaXR5IHdpdGggV2ViIFdvcmtlcnMuXG4gKiBXaGVuIHJ1bm5pbmcgaW4gV2ViIFdvcmtlciBtb2RlLCB0aGlzIHByb3BlcnR5IHdvbid0IGJlIG11dGF0ZWQuXG4gKlxuICogQXNzaWduZWQgbWV0aG9kIHdpbGwgYmUgaW52b2tlZCBmb3IgZXZlcnkgbWVzc2FnZSBwb3N0ZWQgYnkgYGZhbW91cy1jb3JlYC5cbiAqXG4gKiBAdHlwZSB7RnVuY3Rpb259XG4gKiBAb3ZlcnJpZGVcbiAqL1xuQ2hhbm5lbC5wcm90b3R5cGUub25tZXNzYWdlID0gbnVsbDtcblxuLyoqXG4gKiBTZW5kcyBhIG1lc3NhZ2UgdG8gdGhlIG1hbmFnZXIgb2YgdGhpcyBjaGFubmVsICh0aGUgYEZhbW91c2Agc2luZ2xldG9uKSBieVxuICogaW52b2tpbmcgYG9uTWVzc2FnZWAuXG4gKiBVc2VkIGZvciBwcmVzZXJ2aW5nIEFQSSBjb21wYXRpYmlsaXR5IHdpdGggV2ViIFdvcmtlcnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBhbGlhcyBvbk1lc3NhZ2VcbiAqXG4gKiBAcGFyYW0ge0FueX0gbWVzc2FnZSBhIG1lc3NhZ2UgdG8gc2VuZCBvdmVyIHRoZSBjaGFubmVsXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ2hhbm5lbC5wcm90b3R5cGUucG9zdE1lc3NhZ2UgPSBmdW5jdGlvbiBwb3N0TWVzc2FnZShtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMub25NZXNzYWdlKG1lc3NhZ2UpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGFubmVsO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEVxdWl2YWxlbnQgb2YgYW4gRW5naW5lIGluIHRoZSBXb3JrZXIgVGhyZWFkLiBVc2VkIHRvIHN5bmNocm9uaXplIGFuZCBtYW5hZ2VcbiAqIHRpbWUgYWNyb3NzIGRpZmZlcmVudCBUaHJlYWRzLlxuICpcbiAqIEBjbGFzcyAgQ2xvY2tcbiAqIEBjb25zdHJ1Y3RvclxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gQ2xvY2sgKCkge1xuICAgIHRoaXMuX3RpbWUgPSAwO1xuICAgIHRoaXMuX2ZyYW1lID0gMDtcbiAgICB0aGlzLl90aW1lclF1ZXVlID0gW107XG4gICAgdGhpcy5fdXBkYXRpbmdJbmRleCA9IDA7XG5cbiAgICB0aGlzLl9zY2FsZSA9IDE7XG4gICAgdGhpcy5fc2NhbGVkVGltZSA9IHRoaXMuX3RpbWU7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgc2NhbGUgYXQgd2hpY2ggdGhlIGNsb2NrIHRpbWUgaXMgcGFzc2luZy5cbiAqIFVzZWZ1bCBmb3Igc2xvdy1tb3Rpb24gb3IgZmFzdC1mb3J3YXJkIGVmZmVjdHMuXG4gKlxuICogYDFgIG1lYW5zIG5vIHRpbWUgc2NhbGluZyAoXCJyZWFsdGltZVwiKSxcbiAqIGAyYCBtZWFucyB0aGUgY2xvY2sgdGltZSBpcyBwYXNzaW5nIHR3aWNlIGFzIGZhc3QsXG4gKiBgMC41YCBtZWFucyB0aGUgY2xvY2sgdGltZSBpcyBwYXNzaW5nIHR3byB0aW1lcyBzbG93ZXIgdGhhbiB0aGUgXCJhY3R1YWxcIlxuICogdGltZSBhdCB3aGljaCB0aGUgQ2xvY2sgaXMgYmVpbmcgdXBkYXRlZCB2aWEgYC5zdGVwYC5cbiAqXG4gKiBJbml0YWxseSB0aGUgY2xvY2sgdGltZSBpcyBub3QgYmVpbmcgc2NhbGVkIChmYWN0b3IgYDFgKS5cbiAqXG4gKiBAbWV0aG9kICBzZXRTY2FsZVxuICogQGNoYWluYWJsZVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBzY2FsZSAgICBUaGUgc2NhbGUgYXQgd2hpY2ggdGhlIGNsb2NrIHRpbWUgaXMgcGFzc2luZy5cbiAqXG4gKiBAcmV0dXJuIHtDbG9ja30gdGhpc1xuICovXG5DbG9jay5wcm90b3R5cGUuc2V0U2NhbGUgPSBmdW5jdGlvbiBzZXRTY2FsZSAoc2NhbGUpIHtcbiAgICB0aGlzLl9zY2FsZSA9IHNjYWxlO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kICBnZXRTY2FsZVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gc2NhbGUgICAgVGhlIHNjYWxlIGF0IHdoaWNoIHRoZSBjbG9jayB0aW1lIGlzIHBhc3NpbmcuXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5nZXRTY2FsZSA9IGZ1bmN0aW9uIGdldFNjYWxlICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2NhbGU7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGludGVybmFsIGNsb2NrIHRpbWUuXG4gKlxuICogQG1ldGhvZCAgc3RlcFxuICogQGNoYWluYWJsZVxuICpcbiAqIEBwYXJhbSAge051bWJlcn0gdGltZSBoaWdoIHJlc29sdXRpb24gdGltZXN0YW1wIHVzZWQgZm9yIGludm9raW5nIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgIGB1cGRhdGVgIG1ldGhvZCBvbiBhbGwgcmVnaXN0ZXJlZCBvYmplY3RzXG4gKiBAcmV0dXJuIHtDbG9ja30gICAgICAgdGhpc1xuICovXG5DbG9jay5wcm90b3R5cGUuc3RlcCA9IGZ1bmN0aW9uIHN0ZXAgKHRpbWUpIHtcbiAgICB0aGlzLl9mcmFtZSsrO1xuXG4gICAgdGhpcy5fc2NhbGVkVGltZSA9IHRoaXMuX3NjYWxlZFRpbWUgKyAodGltZSAtIHRoaXMuX3RpbWUpKnRoaXMuX3NjYWxlO1xuICAgIHRoaXMuX3RpbWUgPSB0aW1lO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl90aW1lclF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLl90aW1lclF1ZXVlW2ldKHRoaXMuX3NjYWxlZFRpbWUpKSB7XG4gICAgICAgICAgICB0aGlzLl90aW1lclF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW50ZXJuYWwgY2xvY2sgdGltZS5cbiAqXG4gKiBAbWV0aG9kICBub3dcbiAqXG4gKiBAcmV0dXJuICB7TnVtYmVyfSB0aW1lIGhpZ2ggcmVzb2x1dGlvbiB0aW1lc3RhbXAgdXNlZCBmb3IgaW52b2tpbmcgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgYHVwZGF0ZWAgbWV0aG9kIG9uIGFsbCByZWdpc3RlcmVkIG9iamVjdHNcbiAqL1xuQ2xvY2sucHJvdG90eXBlLm5vdyA9IGZ1bmN0aW9uIG5vdyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NjYWxlZFRpbWU7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGludGVybmFsIGNsb2NrIHRpbWUuXG4gKlxuICogQG1ldGhvZCAgZ2V0VGltZVxuICogQGRlcHJlY2F0ZWQgVXNlICNub3cgaW5zdGVhZFxuICpcbiAqIEByZXR1cm4gIHtOdW1iZXJ9IHRpbWUgaGlnaCByZXNvbHV0aW9uIHRpbWVzdGFtcCB1c2VkIGZvciBpbnZva2luZyB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICBgdXBkYXRlYCBtZXRob2Qgb24gYWxsIHJlZ2lzdGVyZWQgb2JqZWN0c1xuICovXG5DbG9jay5wcm90b3R5cGUuZ2V0VGltZSA9IENsb2NrLnByb3RvdHlwZS5ub3c7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGZyYW1lcyBlbGFwc2VkIHNvIGZhci5cbiAqXG4gKiBAbWV0aG9kIGdldEZyYW1lXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBmcmFtZXNcbiAqL1xuQ2xvY2sucHJvdG90eXBlLmdldEZyYW1lID0gZnVuY3Rpb24gZ2V0RnJhbWUgKCkge1xuICAgIHJldHVybiB0aGlzLl9mcmFtZTtcbn07XG5cbi8qKlxuICogV3JhcHMgYSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIGFmdGVyIGEgY2VydGFpbiBhbW91bnQgb2YgdGltZS5cbiAqIEFmdGVyIGEgc2V0IGR1cmF0aW9uIGhhcyBwYXNzZWQsIGl0IGV4ZWN1dGVzIHRoZSBmdW5jdGlvbiBhbmRcbiAqIHJlbW92ZXMgaXQgYXMgYSBsaXN0ZW5lciB0byAncHJlcmVuZGVyJy5cbiAqXG4gKiBAbWV0aG9kIHNldFRpbWVvdXRcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBydW4gYWZ0ZXIgYSBzcGVjaWZpZWQgZHVyYXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSBtaWxsaXNlY29uZHMgZnJvbSBub3cgdG8gZXhlY3V0ZSB0aGUgZnVuY3Rpb25cbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGltZXIgZnVuY3Rpb24gdXNlZCBmb3IgQ2xvY2sjY2xlYXJUaW1lclxuICovXG5DbG9jay5wcm90b3R5cGUuc2V0VGltZW91dCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgZGVsYXkpIHtcbiAgICB2YXIgcGFyYW1zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgc3RhcnRlZEF0ID0gdGhpcy5fdGltZTtcbiAgICB2YXIgdGltZXIgPSBmdW5jdGlvbih0aW1lKSB7XG4gICAgICAgIGlmICh0aW1lIC0gc3RhcnRlZEF0ID49IGRlbGF5KSB7XG4gICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBwYXJhbXMpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgdGhpcy5fdGltZXJRdWV1ZS5wdXNoKHRpbWVyKTtcbiAgICByZXR1cm4gdGltZXI7XG59O1xuXG5cbi8qKlxuICogV3JhcHMgYSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIGFmdGVyIGEgY2VydGFpbiBhbW91bnQgb2YgdGltZS5cbiAqICBBZnRlciBhIHNldCBkdXJhdGlvbiBoYXMgcGFzc2VkLCBpdCBleGVjdXRlcyB0aGUgZnVuY3Rpb24gYW5kXG4gKiAgcmVzZXRzIHRoZSBleGVjdXRpb24gdGltZS5cbiAqXG4gKiBAbWV0aG9kIHNldEludGVydmFsXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgZnVuY3Rpb24gdG8gYmUgcnVuIGFmdGVyIGEgc3BlY2lmaWVkIGR1cmF0aW9uXG4gKiBAcGFyYW0ge051bWJlcn0gZGVsYXkgaW50ZXJ2YWwgdG8gZXhlY3V0ZSBmdW5jdGlvbiBpbiBtaWxsaXNlY29uZHNcbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGltZXIgZnVuY3Rpb24gdXNlZCBmb3IgQ2xvY2sjY2xlYXJUaW1lclxuICovXG5DbG9jay5wcm90b3R5cGUuc2V0SW50ZXJ2YWwgPSBmdW5jdGlvbiBzZXRJbnRlcnZhbChjYWxsYmFjaywgZGVsYXkpIHtcbiAgICB2YXIgcGFyYW1zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgc3RhcnRlZEF0ID0gdGhpcy5fdGltZTtcbiAgICB2YXIgdGltZXIgPSBmdW5jdGlvbih0aW1lKSB7XG4gICAgICAgIGlmICh0aW1lIC0gc3RhcnRlZEF0ID49IGRlbGF5KSB7XG4gICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBwYXJhbXMpO1xuICAgICAgICAgICAgc3RhcnRlZEF0ID0gdGltZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICB0aGlzLl90aW1lclF1ZXVlLnB1c2godGltZXIpO1xuICAgIHJldHVybiB0aW1lcjtcbn07XG5cbi8qKlxuICogUmVtb3ZlcyBwcmV2aW91c2x5IHZpYSBgQ2xvY2sjc2V0VGltZW91dGAgb3IgYENsb2NrI3NldEludGVydmFsYFxuICogcmVnaXN0ZXJlZCBjYWxsYmFjayBmdW5jdGlvblxuICpcbiAqIEBtZXRob2QgY2xlYXJUaW1lclxuICogQGNoYWluYWJsZVxuICpcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSB0aW1lciAgcHJldmlvdXNseSBieSBgQ2xvY2sjc2V0VGltZW91dGAgb3JcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYENsb2NrI3NldEludGVydmFsYCByZXR1cm5lZCBjYWxsYmFjayBmdW5jdGlvblxuICogQHJldHVybiB7Q2xvY2t9ICAgICAgICAgICAgICB0aGlzXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5jbGVhclRpbWVyID0gZnVuY3Rpb24gKHRpbWVyKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5fdGltZXJRdWV1ZS5pbmRleE9mKHRpbWVyKTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIHRoaXMuX3RpbWVyUXVldWUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENsb2NrO1xuXG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4vKmpzaGludCAtVzA3OSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFRPRE86IERpc3BhdGNoIHNob3VsZCBiZSBnZW5lcmFsaXplZCBzbyB0aGF0IGl0IGNhbiB3b3JrIG9uIGFueSBOb2RlXG4vLyBub3QganVzdCBDb250ZXh0cy5cblxudmFyIEV2ZW50ID0gcmVxdWlyZSgnLi9FdmVudCcpO1xuXG4vKipcbiAqIFRoZSBEaXNwYXRjaCBjbGFzcyBpcyB1c2VkIHRvIHByb3BvZ2F0ZSBldmVudHMgZG93biB0aGVcbiAqIHNjZW5lIGdyYXBoLlxuICpcbiAqIEBjbGFzcyBEaXNwYXRjaFxuICogQHBhcmFtIHtTY2VuZX0gY29udGV4dCBUaGUgY29udGV4dCBvbiB3aGljaCBpdCBvcGVyYXRlc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIERpc3BhdGNoIChjb250ZXh0KSB7XG5cbiAgICBpZiAoIWNvbnRleHQpIHRocm93IG5ldyBFcnJvcignRGlzcGF0Y2ggbmVlZHMgdG8gYmUgaW5zdGFudGlhdGVkIG9uIGEgbm9kZScpO1xuXG4gICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7IC8vIEEgcmVmZXJlbmNlIHRvIHRoZSBjb250ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9uIHdoaWNoIHRoZSBkaXNwYXRjaGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9wZXJhdGVzXG5cbiAgICB0aGlzLl9xdWV1ZSA9IFtdOyAvLyBUaGUgcXVldWUgaXMgdXNlZCBmb3IgdHdvIHB1cnBvc2VzXG4gICAgICAgICAgICAgICAgICAgICAgLy8gMS4gSXQgaXMgdXNlZCB0byBsaXN0IGluZGljaWVzIGluIHRoZVxuICAgICAgICAgICAgICAgICAgICAgIC8vICAgIE5vZGVzIHBhdGggd2hpY2ggYXJlIHRoZW4gdXNlZCB0byBsb29rdXBcbiAgICAgICAgICAgICAgICAgICAgICAvLyAgICBhIG5vZGUgaW4gdGhlIHNjZW5lIGdyYXBoLlxuICAgICAgICAgICAgICAgICAgICAgIC8vIDIuIEl0IGlzIHVzZWQgdG8gYXNzaXN0IGRpc3BhdGNoaW5nXG4gICAgICAgICAgICAgICAgICAgICAgLy8gICAgc3VjaCB0aGF0IGl0IGlzIHBvc3NpYmxlIHRvIGRvIGEgYnJlYWR0aCBmaXJzdFxuICAgICAgICAgICAgICAgICAgICAgIC8vICAgIHRyYXZlcnNhbCBvZiB0aGUgc2NlbmUgZ3JhcGguXG59XG5cbi8qKlxuICogbG9va3VwTm9kZSB0YWtlcyBhIHBhdGggYW5kIHJldHVybnMgdGhlIG5vZGUgYXQgdGhlIGxvY2F0aW9uIHNwZWNpZmllZFxuICogYnkgdGhlIHBhdGgsIGlmIG9uZSBleGlzdHMuIElmIG5vdCwgaXQgcmV0dXJucyB1bmRlZmluZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGxvY2F0aW9uIFRoZSBsb2NhdGlvbiBvZiB0aGUgbm9kZSBzcGVjaWZpZWQgYnkgaXRzIHBhdGhcbiAqXG4gKiBAcmV0dXJuIHtOb2RlIHwgdW5kZWZpbmVkfSBUaGUgbm9kZSBhdCB0aGUgcmVxdWVzdGVkIHBhdGhcbiAqL1xuRGlzcGF0Y2gucHJvdG90eXBlLmxvb2t1cE5vZGUgPSBmdW5jdGlvbiBsb29rdXBOb2RlIChsb2NhdGlvbikge1xuICAgIGlmICghbG9jYXRpb24pIHRocm93IG5ldyBFcnJvcignbG9va3VwTm9kZSBtdXN0IGJlIGNhbGxlZCB3aXRoIGEgcGF0aCcpO1xuXG4gICAgdmFyIHBhdGggPSB0aGlzLl9xdWV1ZTtcblxuICAgIF9zcGxpdFRvKGxvY2F0aW9uLCBwYXRoKTtcblxuICAgIGlmIChwYXRoWzBdICE9PSB0aGlzLl9jb250ZXh0LmdldFNlbGVjdG9yKCkpIHJldHVybiB2b2lkIDA7XG5cbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLl9jb250ZXh0LmdldENoaWxkcmVuKCk7XG4gICAgdmFyIGNoaWxkO1xuICAgIHZhciBpID0gMTtcbiAgICBwYXRoWzBdID0gdGhpcy5fY29udGV4dDtcblxuICAgIHdoaWxlIChpIDwgcGF0aC5sZW5ndGgpIHtcbiAgICAgICAgY2hpbGQgPSBjaGlsZHJlbltwYXRoW2ldXTtcbiAgICAgICAgcGF0aFtpXSA9IGNoaWxkO1xuICAgICAgICBpZiAoY2hpbGQpIGNoaWxkcmVuID0gY2hpbGQuZ2V0Q2hpbGRyZW4oKTtcbiAgICAgICAgZWxzZSByZXR1cm4gdm9pZCAwO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcblxuLyoqXG4gKiBkaXNwYXRjaCB0YWtlcyBhbiBldmVudCBuYW1lIGFuZCBhIHBheWxvYWQgYW5kIGRpc3BhdGNoZXMgaXQgdG8gdGhlXG4gKiBlbnRpcmUgc2NlbmUgZ3JhcGggYmVsb3cgdGhlIG5vZGUgdGhhdCB0aGUgZGlzcGF0Y2hlciBpcyBvbi4gVGhlIG5vZGVzXG4gKiByZWNlaXZlIHRoZSBldmVudHMgaW4gYSBicmVhZHRoIGZpcnN0IHRyYXZlcnNhbCwgbWVhbmluZyB0aGF0IHBhcmVudHNcbiAqIGhhdmUgdGhlIG9wcG9ydHVuaXR5IHRvIHJlYWN0IHRvIHRoZSBldmVudCBiZWZvcmUgY2hpbGRyZW4uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IG5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0ge0FueX0gcGF5bG9hZCB0aGUgZXZlbnQgcGF5bG9hZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRpc3BhdGNoLnByb3RvdHlwZS5kaXNwYXRjaCA9IGZ1bmN0aW9uIGRpc3BhdGNoIChldmVudCwgcGF5bG9hZCkge1xuICAgIGlmICghZXZlbnQpIHRocm93IG5ldyBFcnJvcignZGlzcGF0Y2ggcmVxdWlyZXMgYW4gZXZlbnQgbmFtZSBhcyBpdFxcJ3MgZmlyc3QgYXJndW1lbnQnKTtcblxuICAgIHZhciBxdWV1ZSA9IHRoaXMuX3F1ZXVlO1xuICAgIHZhciBpdGVtO1xuICAgIHZhciBpO1xuICAgIHZhciBsZW47XG4gICAgdmFyIGNoaWxkcmVuO1xuXG4gICAgcXVldWUubGVuZ3RoID0gMDtcbiAgICBxdWV1ZS5wdXNoKHRoaXMuX2NvbnRleHQpO1xuXG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBpdGVtID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgaWYgKGl0ZW0ub25SZWNlaXZlKSBpdGVtLm9uUmVjZWl2ZShldmVudCwgcGF5bG9hZCk7XG4gICAgICAgIGNoaWxkcmVuID0gaXRlbS5nZXRDaGlsZHJlbigpO1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBjaGlsZHJlbi5sZW5ndGggOyBpIDwgbGVuIDsgaSsrKSBxdWV1ZS5wdXNoKGNoaWxkcmVuW2ldKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIGRpc3BhdGNoVUlldmVudCB0YWtlcyBhIHBhdGgsIGFuIGV2ZW50IG5hbWUsIGFuZCBhIHBheWxvYWQgYW5kIGRpc3BhdGNoZXMgdGhlbSBpblxuICogYSBtYW5uZXIgYW5vbG9nb3VzIHRvIERPTSBidWJibGluZy4gSXQgZmlyc3QgdHJhdmVyc2VzIGRvd24gdG8gdGhlIG5vZGUgc3BlY2lmaWVkIGF0XG4gKiB0aGUgcGF0aC4gVGhhdCBub2RlIHJlY2VpdmVzIHRoZSBldmVudCBmaXJzdCwgYW5kIHRoZW4gZXZlcnkgYW5jZXN0b3IgcmVjZWl2ZXMgdGhlIGV2ZW50XG4gKiB1bnRpbCB0aGUgY29udGV4dC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCB0aGUgcGF0aCBvZiB0aGUgbm9kZVxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IHRoZSBldmVudCBuYW1lXG4gKiBAcGFyYW0ge0FueX0gcGF5bG9hZCB0aGUgcGF5bG9hZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRpc3BhdGNoLnByb3RvdHlwZS5kaXNwYXRjaFVJRXZlbnQgPSBmdW5jdGlvbiBkaXNwYXRjaFVJRXZlbnQgKHBhdGgsIGV2ZW50LCBwYXlsb2FkKSB7XG4gICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgRXJyb3IoJ2Rpc3BhdGNoVUlFdmVudCBuZWVkcyBhIHZhbGlkIHBhdGggdG8gZGlzcGF0Y2ggdG8nKTtcbiAgICBpZiAoIWV2ZW50KSB0aHJvdyBuZXcgRXJyb3IoJ2Rpc3BhdGNoVUlFdmVudCBuZWVkcyBhbiBldmVudCBuYW1lIGFzIGl0cyBzZWNvbmQgYXJndW1lbnQnKTtcblxuICAgIHZhciBxdWV1ZSA9IHRoaXMuX3F1ZXVlO1xuICAgIHZhciBub2RlO1xuXG4gICAgRXZlbnQuY2FsbChwYXlsb2FkKTtcbiAgICBwYXlsb2FkLm5vZGUgPSB0aGlzLmxvb2t1cE5vZGUocGF0aCk7IC8vIEFmdGVyIHRoaXMgY2FsbCwgdGhlIHBhdGggaXMgbG9hZGVkIGludG8gdGhlIHF1ZXVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAobG9va1VwIG5vZGUgZG9lc24ndCBjbGVhciB0aGUgcXVldWUgYWZ0ZXIgdGhlIGxvb2t1cClcblxuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgbm9kZSA9IHF1ZXVlLnBvcCgpOyAvLyBwb3Agbm9kZXMgb2ZmIG9mIHRoZSBxdWV1ZSB0byBtb3ZlIHVwIHRoZSBhbmNlc3RvciBjaGFpbi5cbiAgICAgICAgaWYgKG5vZGUub25SZWNlaXZlKSBub2RlLm9uUmVjZWl2ZShldmVudCwgcGF5bG9hZCk7XG4gICAgICAgIGlmIChwYXlsb2FkLnByb3BhZ2F0aW9uU3RvcHBlZCkgYnJlYWs7XG4gICAgfVxufTtcblxuLyoqXG4gKiBfc3BsaXRUbyBpcyBhIHByaXZhdGUgbWV0aG9kIHdoaWNoIHRha2VzIGEgcGF0aCBhbmQgc3BsaXRzIGl0IGF0IGV2ZXJ5ICcvJ1xuICogcHVzaGluZyB0aGUgcmVzdWx0IGludG8gdGhlIHN1cHBsaWVkIGFycmF5LiBUaGlzIGlzIGEgZGVzdHJ1Y3RpdmUgY2hhbmdlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nIHRoZSBzcGVjaWZpZWQgcGF0aFxuICogQHBhcmFtIHtBcnJheX0gdGFyZ2V0IHRoZSBhcnJheSB0byB3aGljaCB0aGUgcmVzdWx0IHNob3VsZCBiZSB3cml0dGVuXG4gKlxuICogQHJldHVybiB7QXJyYXl9IHRoZSB0YXJnZXQgYWZ0ZXIgaGF2aW5nIGJlZW4gd3JpdHRlbiB0b1xuICovXG5mdW5jdGlvbiBfc3BsaXRUbyAoc3RyaW5nLCB0YXJnZXQpIHtcbiAgICB0YXJnZXQubGVuZ3RoID0gMDsgLy8gY2xlYXJzIHRoZSBhcnJheSBmaXJzdC5cbiAgICB2YXIgbGFzdCA9IDA7XG4gICAgdmFyIGk7XG4gICAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGg7XG5cbiAgICBmb3IgKGkgPSAwIDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpZiAoc3RyaW5nW2ldID09PSAnLycpIHtcbiAgICAgICAgICAgIHRhcmdldC5wdXNoKHN0cmluZy5zdWJzdHJpbmcobGFzdCwgaSkpO1xuICAgICAgICAgICAgbGFzdCA9IGkgKyAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGkgLSBsYXN0ID4gMCkgdGFyZ2V0LnB1c2goc3RyaW5nLnN1YnN0cmluZyhsYXN0LCBpKSk7XG5cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERpc3BhdGNoO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgRXZlbnQgY2xhc3MgYWRkcyB0aGUgc3RvcFByb3BhZ2F0aW9uIGZ1bmN0aW9uYWxpdHlcbiAqIHRvIHRoZSBVSUV2ZW50cyB3aXRoaW4gdGhlIHNjZW5lIGdyYXBoLlxuICpcbiAqIEBjb25zdHJ1Y3RvciBFdmVudFxuICovXG5mdW5jdGlvbiBFdmVudCAoKSB7XG4gICAgdGhpcy5wcm9wYWdhdGlvblN0b3BwZWQgPSBmYWxzZTtcbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHN0b3BQcm9wYWdhdGlvbjtcbn1cblxuLyoqXG4gKiBzdG9wUHJvcGFnYXRpb24gZW5kcyB0aGUgYnViYmxpbmcgb2YgdGhlIGV2ZW50IGluIHRoZVxuICogc2NlbmUgZ3JhcGguXG4gKlxuICogQG1ldGhvZCBzdG9wUHJvcGFnYXRpb25cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkge1xuICAgIHRoaXMucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudDtcblxuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENsb2NrID0gcmVxdWlyZSgnLi9DbG9jaycpO1xudmFyIFNjZW5lID0gcmVxdWlyZSgnLi9TY2VuZScpO1xudmFyIENoYW5uZWwgPSByZXF1aXJlKCcuL0NoYW5uZWwnKTtcbnZhciBVSU1hbmFnZXIgPSByZXF1aXJlKCcuLi9yZW5kZXJlcnMvVUlNYW5hZ2VyJyk7XG52YXIgQ29tcG9zaXRvciA9IHJlcXVpcmUoJy4uL3JlbmRlcmVycy9Db21wb3NpdG9yJyk7XG52YXIgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCA9IHJlcXVpcmUoJy4uL3JlbmRlci1sb29wcy9SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wJyk7XG5cbnZhciBFTkdJTkVfU1RBUlQgPSBbJ0VOR0lORScsICdTVEFSVCddO1xudmFyIEVOR0lORV9TVE9QID0gWydFTkdJTkUnLCAnU1RPUCddO1xudmFyIFRJTUVfVVBEQVRFID0gWydUSU1FJywgbnVsbF07XG5cbi8qKlxuICogRmFtb3VzIGhhcyB0d28gcmVzcG9uc2liaWxpdGllcywgb25lIHRvIGFjdCBhcyB0aGUgaGlnaGVzdCBsZXZlbFxuICogdXBkYXRlciBhbmQgYW5vdGhlciB0byBzZW5kIG1lc3NhZ2VzIG92ZXIgdG8gdGhlIHJlbmRlcmVycy4gSXQgaXNcbiAqIGEgc2luZ2xldG9uLlxuICpcbiAqIEBjbGFzcyBGYW1vdXNFbmdpbmVcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBGYW1vdXNFbmdpbmUoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuX3VwZGF0ZVF1ZXVlID0gW107IC8vIFRoZSB1cGRhdGVRdWV1ZSBpcyBhIHBsYWNlIHdoZXJlIG5vZGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FuIHBsYWNlIHRoZW1zZWx2ZXMgaW4gb3JkZXIgdG8gYmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGVkIG9uIHRoZSBmcmFtZS5cblxuICAgIHRoaXMuX25leHRVcGRhdGVRdWV1ZSA9IFtdOyAvLyB0aGUgbmV4dFVwZGF0ZVF1ZXVlIGlzIHVzZWQgdG8gcXVldWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlcyBmb3IgdGhlIG5leHQgdGljay5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBwcmV2ZW50cyBpbmZpbml0ZSBsb29wcyB3aGVyZSBkdXJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYW4gdXBkYXRlIGEgbm9kZSBjb250aW51b3VzbHkgcHV0cyBpdHNlbGZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYmFjayBpbiB0aGUgdXBkYXRlIHF1ZXVlLlxuXG4gICAgdGhpcy5fc2NlbmVzID0ge307IC8vIGEgaGFzaCBvZiBhbGwgb2YgdGhlIHNjZW5lcydzIHRoYXQgdGhlIEZhbW91c0VuZ2luZVxuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlzIHJlc3BvbnNpYmxlIGZvci5cblxuICAgIHRoaXMuX21lc3NhZ2VzID0gVElNRV9VUERBVEU7ICAgLy8gYSBxdWV1ZSBvZiBhbGwgb2YgdGhlIGRyYXcgY29tbWFuZHMgdG9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlbmQgdG8gdGhlIHRoZSByZW5kZXJlcnMgdGhpcyBmcmFtZS5cblxuICAgIHRoaXMuX2luVXBkYXRlID0gZmFsc2U7IC8vIHdoZW4gdGhlIGZhbW91cyBpcyB1cGRhdGluZyB0aGlzIGlzIHRydWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWxsIHJlcXVlc3RzIGZvciB1cGRhdGVzIHdpbGwgZ2V0IHB1dCBpbiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXh0VXBkYXRlUXVldWVcblxuICAgIHRoaXMuX2Nsb2NrID0gbmV3IENsb2NrKCk7IC8vIGEgY2xvY2sgdG8ga2VlcCB0cmFjayBvZiB0aW1lIGZvciB0aGUgc2NlbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBncmFwaC5cblxuICAgIHRoaXMuX2NoYW5uZWwgPSBuZXcgQ2hhbm5lbCgpO1xuICAgIHRoaXMuX2NoYW5uZWwub25NZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgX3RoaXMuaGFuZGxlTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9O1xufVxuXG5cbi8qKlxuICogQW4gaW5pdCBzY3JpcHQgdGhhdCBpbml0aWFsaXplcyB0aGUgRmFtb3VzRW5naW5lIHdpdGggb3B0aW9uc1xuICogb3IgZGVmYXVsdCBwYXJhbWV0ZXJzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBhIHNldCBvZiBvcHRpb25zIGNvbnRhaW5pbmcgYSBjb21wb3NpdG9yIGFuZCBhIHJlbmRlciBsb29wXG4gKlxuICogQHJldHVybiB7RmFtb3VzRW5naW5lfSB0aGlzXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIGluaXQob3B0aW9ucykge1xuICAgIHRoaXMuY29tcG9zaXRvciA9IG9wdGlvbnMgJiYgb3B0aW9ucy5jb21wb3NpdG9yIHx8IG5ldyBDb21wb3NpdG9yKCk7XG4gICAgdGhpcy5yZW5kZXJMb29wID0gb3B0aW9ucyAmJiBvcHRpb25zLnJlbmRlckxvb3AgfHwgbmV3IFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AoKTtcbiAgICB0aGlzLnVpTWFuYWdlciA9IG5ldyBVSU1hbmFnZXIodGhpcy5nZXRDaGFubmVsKCksIHRoaXMuY29tcG9zaXRvciwgdGhpcy5yZW5kZXJMb29wKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgY2hhbm5lbCB0aGF0IHRoZSBlbmdpbmUgd2lsbCB1c2UgdG8gY29tbXVuaWNhdGUgdG9cbiAqIHRoZSByZW5kZXJlcnMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7Q2hhbm5lbH0gY2hhbm5lbCAgICAgVGhlIGNoYW5uZWwgdG8gYmUgdXNlZCBmb3IgY29tbXVuaWNhdGluZyB3aXRoXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBgVUlNYW5hZ2VyYC8gYENvbXBvc2l0b3JgLlxuICpcbiAqIEByZXR1cm4ge0ZhbW91c0VuZ2luZX0gdGhpc1xuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLnNldENoYW5uZWwgPSBmdW5jdGlvbiBzZXRDaGFubmVsKGNoYW5uZWwpIHtcbiAgICB0aGlzLl9jaGFubmVsID0gY2hhbm5lbDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY2hhbm5lbCB0aGF0IHRoZSBlbmdpbmUgaXMgY3VycmVudGx5IHVzaW5nXG4gKiB0byBjb21tdW5pY2F0ZSB3aXRoIHRoZSByZW5kZXJlcnMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0NoYW5uZWx9IGNoYW5uZWwgICAgVGhlIGNoYW5uZWwgdG8gYmUgdXNlZCBmb3IgY29tbXVuaWNhdGluZyB3aXRoXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBgVUlNYW5hZ2VyYC8gYENvbXBvc2l0b3JgLlxuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLmdldENoYW5uZWwgPSBmdW5jdGlvbiBnZXRDaGFubmVsICgpIHtcbiAgICByZXR1cm4gdGhpcy5fY2hhbm5lbDtcbn07XG5cbi8qKlxuICogX3VwZGF0ZSBpcyB0aGUgYm9keSBvZiB0aGUgdXBkYXRlIGxvb3AuIFRoZSBmcmFtZSBjb25zaXN0cyBvZlxuICogcHVsbGluZyBpbiBhcHBlbmRpbmcgdGhlIG5leHRVcGRhdGVRdWV1ZSB0byB0aGUgY3VycmVudFVwZGF0ZSBxdWV1ZVxuICogdGhlbiBtb3ZpbmcgdGhyb3VnaCB0aGUgdXBkYXRlUXVldWUgYW5kIGNhbGxpbmcgb25VcGRhdGUgd2l0aCB0aGUgY3VycmVudFxuICogdGltZSBvbiBhbGwgbm9kZXMuIFdoaWxlIF91cGRhdGUgaXMgY2FsbGVkIF9pblVwZGF0ZSBpcyBzZXQgdG8gdHJ1ZSBhbmRcbiAqIGFsbCByZXF1ZXN0cyB0byBiZSBwbGFjZWQgaW4gdGhlIHVwZGF0ZSBxdWV1ZSB3aWxsIGJlIGZvcndhcmRlZCB0byB0aGVcbiAqIG5leHRVcGRhdGVRdWV1ZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5fdXBkYXRlID0gZnVuY3Rpb24gX3VwZGF0ZSAoKSB7XG4gICAgdGhpcy5faW5VcGRhdGUgPSB0cnVlO1xuICAgIHZhciB0aW1lID0gdGhpcy5fY2xvY2subm93KCk7XG4gICAgdmFyIG5leHRRdWV1ZSA9IHRoaXMuX25leHRVcGRhdGVRdWV1ZTtcbiAgICB2YXIgcXVldWUgPSB0aGlzLl91cGRhdGVRdWV1ZTtcbiAgICB2YXIgaXRlbTtcblxuICAgIHRoaXMuX21lc3NhZ2VzWzFdID0gdGltZTtcblxuICAgIHdoaWxlIChuZXh0UXVldWUubGVuZ3RoKSBxdWV1ZS51bnNoaWZ0KG5leHRRdWV1ZS5wb3AoKSk7XG5cbiAgICB3aGlsZSAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGl0ZW0gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uVXBkYXRlKSBpdGVtLm9uVXBkYXRlKHRpbWUpO1xuICAgIH1cblxuICAgIHRoaXMuX2luVXBkYXRlID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIHJlcXVlc3RVcGRhdGVzIHRha2VzIGEgY2xhc3MgdGhhdCBoYXMgYW4gb25VcGRhdGUgbWV0aG9kIGFuZCBwdXRzIGl0XG4gKiBpbnRvIHRoZSB1cGRhdGVRdWV1ZSB0byBiZSB1cGRhdGVkIGF0IHRoZSBuZXh0IGZyYW1lLlxuICogSWYgRmFtb3VzRW5naW5lIGlzIGN1cnJlbnRseSBpbiBhbiB1cGRhdGUsIHJlcXVlc3RVcGRhdGVcbiAqIHBhc3NlcyBpdHMgYXJndW1lbnQgdG8gcmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2suXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXF1ZXN0ZXIgYW4gb2JqZWN0IHdpdGggYW4gb25VcGRhdGUgbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5yZXF1ZXN0VXBkYXRlID0gZnVuY3Rpb24gcmVxdWVzdFVwZGF0ZSAocmVxdWVzdGVyKSB7XG4gICAgaWYgKCFyZXF1ZXN0ZXIpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICdyZXF1ZXN0VXBkYXRlIG11c3QgYmUgY2FsbGVkIHdpdGggYSBjbGFzcyB0byBiZSB1cGRhdGVkJ1xuICAgICAgICApO1xuXG4gICAgaWYgKHRoaXMuX2luVXBkYXRlKSB0aGlzLnJlcXVlc3RVcGRhdGVPbk5leHRUaWNrKHJlcXVlc3Rlcik7XG4gICAgZWxzZSB0aGlzLl91cGRhdGVRdWV1ZS5wdXNoKHJlcXVlc3Rlcik7XG59O1xuXG4vKipcbiAqIHJlcXVlc3RVcGRhdGVPbk5leHRUaWNrIGlzIHJlcXVlc3RzIGFuIHVwZGF0ZSBvbiB0aGUgbmV4dCBmcmFtZS5cbiAqIElmIEZhbW91c0VuZ2luZSBpcyBub3QgY3VycmVudGx5IGluIGFuIHVwZGF0ZSB0aGFuIGl0IGlzIGZ1bmN0aW9uYWxseSBlcXVpdmFsZW50XG4gKiB0byByZXF1ZXN0VXBkYXRlLiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgdXNlZCB0byBwcmV2ZW50IGluZmluaXRlIGxvb3BzIHdoZXJlXG4gKiBhIGNsYXNzIGlzIHVwZGF0ZWQgb24gdGhlIGZyYW1lIGJ1dCBuZWVkcyB0byBiZSB1cGRhdGVkIGFnYWluIG5leHQgZnJhbWUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXF1ZXN0ZXIgYW4gb2JqZWN0IHdpdGggYW4gb25VcGRhdGUgbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5yZXF1ZXN0VXBkYXRlT25OZXh0VGljayA9IGZ1bmN0aW9uIHJlcXVlc3RVcGRhdGVPbk5leHRUaWNrIChyZXF1ZXN0ZXIpIHtcbiAgICB0aGlzLl9uZXh0VXBkYXRlUXVldWUucHVzaChyZXF1ZXN0ZXIpO1xufTtcblxuLyoqXG4gKiBwb3N0TWVzc2FnZSBzZW5kcyBhIG1lc3NhZ2UgcXVldWUgaW50byBGYW1vdXNFbmdpbmUgdG8gYmUgcHJvY2Vzc2VkLlxuICogVGhlc2UgbWVzc2FnZXMgd2lsbCBiZSBpbnRlcnByZXRlZCBhbmQgc2VudCBpbnRvIHRoZSBzY2VuZSBncmFwaFxuICogYXMgZXZlbnRzIGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gbWVzc2FnZXMgYW4gYXJyYXkgb2YgY29tbWFuZHMuXG4gKlxuICogQHJldHVybiB7RmFtb3VzRW5naW5lfSB0aGlzXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuaGFuZGxlTWVzc2FnZSA9IGZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UgKG1lc3NhZ2VzKSB7XG4gICAgaWYgKCFtZXNzYWdlcylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgJ29uTWVzc2FnZSBtdXN0IGJlIGNhbGxlZCB3aXRoIGFuIGFycmF5IG9mIG1lc3NhZ2VzJ1xuICAgICAgICApO1xuXG4gICAgdmFyIGNvbW1hbmQ7XG5cbiAgICB3aGlsZSAobWVzc2FnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb21tYW5kID0gbWVzc2FnZXMuc2hpZnQoKTtcbiAgICAgICAgc3dpdGNoIChjb21tYW5kKSB7XG4gICAgICAgICAgICBjYXNlICdXSVRIJzpcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVdpdGgobWVzc2FnZXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnRlJBTUUnOlxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlRnJhbWUobWVzc2FnZXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlY2VpdmVkIHVua25vd24gY29tbWFuZDogJyArIGNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBoYW5kbGVXaXRoIGlzIGEgbWV0aG9kIHRoYXQgdGFrZXMgYW4gYXJyYXkgb2YgbWVzc2FnZXMgZm9sbG93aW5nIHRoZVxuICogV0lUSCBjb21tYW5kLiBJdCdsbCB0aGVuIGlzc3VlIHRoZSBuZXh0IGNvbW1hbmRzIHRvIHRoZSBwYXRoIHNwZWNpZmllZFxuICogYnkgdGhlIFdJVEggY29tbWFuZC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gbWVzc2FnZXMgYXJyYXkgb2YgbWVzc2FnZXMuXG4gKlxuICogQHJldHVybiB7RmFtb3VzRW5naW5lfSB0aGlzXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuaGFuZGxlV2l0aCA9IGZ1bmN0aW9uIGhhbmRsZVdpdGggKG1lc3NhZ2VzKSB7XG4gICAgdmFyIHBhdGggPSBtZXNzYWdlcy5zaGlmdCgpO1xuICAgIHZhciBjb21tYW5kID0gbWVzc2FnZXMuc2hpZnQoKTtcblxuICAgIHN3aXRjaCAoY29tbWFuZCkge1xuICAgICAgICBjYXNlICdUUklHR0VSJzogLy8gdGhlIFRSSUdHRVIgY29tbWFuZCBzZW5kcyBhIFVJRXZlbnQgdG8gdGhlIHNwZWNpZmllZCBwYXRoXG4gICAgICAgICAgICB2YXIgdHlwZSA9IG1lc3NhZ2VzLnNoaWZ0KCk7XG4gICAgICAgICAgICB2YXIgZXYgPSBtZXNzYWdlcy5zaGlmdCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdldENvbnRleHQocGF0aCkuZ2V0RGlzcGF0Y2goKS5kaXNwYXRjaFVJRXZlbnQocGF0aCwgdHlwZSwgZXYpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlY2VpdmVkIHVua25vd24gY29tbWFuZDogJyArIGNvbW1hbmQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogaGFuZGxlRnJhbWUgaXMgY2FsbGVkIHdoZW4gdGhlIHJlbmRlcmVycyBpc3N1ZSBhIEZSQU1FIGNvbW1hbmQgdG9cbiAqIEZhbW91c0VuZ2luZS4gRmFtb3VzRW5naW5lIHdpbGwgdGhlbiBzdGVwIHVwZGF0aW5nIHRoZSBzY2VuZSBncmFwaCB0byB0aGUgY3VycmVudCB0aW1lLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBtZXNzYWdlcyBhcnJheSBvZiBtZXNzYWdlcy5cbiAqXG4gKiBAcmV0dXJuIHtGYW1vdXNFbmdpbmV9IHRoaXNcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5oYW5kbGVGcmFtZSA9IGZ1bmN0aW9uIGhhbmRsZUZyYW1lIChtZXNzYWdlcykge1xuICAgIGlmICghbWVzc2FnZXMpIHRocm93IG5ldyBFcnJvcignaGFuZGxlRnJhbWUgbXVzdCBiZSBjYWxsZWQgd2l0aCBhbiBhcnJheSBvZiBtZXNzYWdlcycpO1xuICAgIGlmICghbWVzc2FnZXMubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ0ZSQU1FIG11c3QgYmUgc2VudCB3aXRoIGEgdGltZScpO1xuXG4gICAgdGhpcy5zdGVwKG1lc3NhZ2VzLnNoaWZ0KCkpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBzdGVwIHVwZGF0ZXMgdGhlIGNsb2NrIGFuZCB0aGUgc2NlbmUgZ3JhcGggYW5kIHRoZW4gc2VuZHMgdGhlIGRyYXcgY29tbWFuZHNcbiAqIHRoYXQgYWNjdW11bGF0ZWQgaW4gdGhlIHVwZGF0ZSB0byB0aGUgcmVuZGVyZXJzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGltZSBjdXJyZW50IGVuZ2luZSB0aW1lXG4gKlxuICogQHJldHVybiB7RmFtb3VzRW5naW5lfSB0aGlzXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuc3RlcCA9IGZ1bmN0aW9uIHN0ZXAgKHRpbWUpIHtcbiAgICBpZiAodGltZSA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoJ3N0ZXAgbXVzdCBiZSBjYWxsZWQgd2l0aCBhIHRpbWUnKTtcblxuICAgIHRoaXMuX2Nsb2NrLnN0ZXAodGltZSk7XG4gICAgdGhpcy5fdXBkYXRlKCk7XG5cbiAgICBpZiAodGhpcy5fbWVzc2FnZXMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuX2NoYW5uZWwuc2VuZE1lc3NhZ2UodGhpcy5fbWVzc2FnZXMpO1xuICAgICAgICB0aGlzLl9tZXNzYWdlcy5sZW5ndGggPSAyO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiByZXR1cm5zIHRoZSBjb250ZXh0IG9mIGEgcGFydGljdWxhciBwYXRoLiBUaGUgY29udGV4dCBpcyBsb29rZWQgdXAgYnkgdGhlIHNlbGVjdG9yXG4gKiBwb3J0aW9uIG9mIHRoZSBwYXRoIGFuZCBpcyBsaXN0ZWQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHN0cmluZyB0byB0aGUgZmlyc3RcbiAqICcvJy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIHRoZSBwYXRoIHRvIGxvb2sgdXAgdGhlIGNvbnRleHQgZm9yLlxuICpcbiAqIEByZXR1cm4ge0NvbnRleHQgfCBVbmRlZmluZWR9IHRoZSBjb250ZXh0IGlmIGZvdW5kLCBlbHNlIHVuZGVmaW5lZC5cbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5nZXRDb250ZXh0ID0gZnVuY3Rpb24gZ2V0Q29udGV4dCAoc2VsZWN0b3IpIHtcbiAgICBpZiAoIXNlbGVjdG9yKSB0aHJvdyBuZXcgRXJyb3IoJ2dldENvbnRleHQgbXVzdCBiZSBjYWxsZWQgd2l0aCBhIHNlbGVjdG9yJyk7XG5cbiAgICB2YXIgaW5kZXggPSBzZWxlY3Rvci5pbmRleE9mKCcvJyk7XG4gICAgc2VsZWN0b3IgPSBpbmRleCA9PT0gLTEgPyBzZWxlY3RvciA6IHNlbGVjdG9yLnN1YnN0cmluZygwLCBpbmRleCk7XG5cbiAgICByZXR1cm4gdGhpcy5fc2NlbmVzW3NlbGVjdG9yXTtcbn07XG5cbi8qKlxuICogcmV0dXJucyB0aGUgaW5zdGFuY2Ugb2YgY2xvY2sgd2l0aGluIGZhbW91cy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Q2xvY2t9IEZhbW91c0VuZ2luZSdzIGNsb2NrXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuZ2V0Q2xvY2sgPSBmdW5jdGlvbiBnZXRDbG9jayAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Nsb2NrO1xufTtcblxuLyoqXG4gKiBxdWV1ZXMgYSBtZXNzYWdlIHRvIGJlIHRyYW5zZmVyZWQgdG8gdGhlIHJlbmRlcmVycy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBbnl9IGNvbW1hbmQgRHJhdyBDb21tYW5kXG4gKlxuICogQHJldHVybiB7RmFtb3VzRW5naW5lfSB0aGlzXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUubWVzc2FnZSA9IGZ1bmN0aW9uIG1lc3NhZ2UgKGNvbW1hbmQpIHtcbiAgICB0aGlzLl9tZXNzYWdlcy5wdXNoKGNvbW1hbmQpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgc2NlbmUgdW5kZXIgd2hpY2ggYSBzY2VuZSBncmFwaCBjb3VsZCBiZSBidWlsdC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIGEgZG9tIHNlbGVjdG9yIGZvciB3aGVyZSB0aGUgc2NlbmUgc2hvdWxkIGJlIHBsYWNlZFxuICpcbiAqIEByZXR1cm4ge1NjZW5lfSBhIG5ldyBpbnN0YW5jZSBvZiBTY2VuZS5cbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5jcmVhdGVTY2VuZSA9IGZ1bmN0aW9uIGNyZWF0ZVNjZW5lIChzZWxlY3Rvcikge1xuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgJ2JvZHknO1xuXG4gICAgaWYgKHRoaXMuX3NjZW5lc1tzZWxlY3Rvcl0pIHRoaXMuX3NjZW5lc1tzZWxlY3Rvcl0uZGlzbW91bnQoKTtcbiAgICB0aGlzLl9zY2VuZXNbc2VsZWN0b3JdID0gbmV3IFNjZW5lKHNlbGVjdG9yLCB0aGlzKTtcbiAgICByZXR1cm4gdGhpcy5fc2NlbmVzW3NlbGVjdG9yXTtcbn07XG5cbi8qKlxuICogU3RhcnRzIHRoZSBlbmdpbmUgcnVubmluZyBpbiB0aGUgTWFpbi1UaHJlYWQuXG4gKiBUaGlzIGVmZmVjdHMgKipldmVyeSoqIHVwZGF0ZWFibGUgbWFuYWdlZCBieSB0aGUgRW5naW5lLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtGYW1vdXNFbmdpbmV9IHRoaXNcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5zdGFydEVuZ2luZSA9IGZ1bmN0aW9uIHN0YXJ0RW5naW5lICgpIHtcbiAgICB0aGlzLl9jaGFubmVsLnNlbmRNZXNzYWdlKEVOR0lORV9TVEFSVCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFN0b3BzIHRoZSBlbmdpbmUgcnVubmluZyBpbiB0aGUgTWFpbi1UaHJlYWQuXG4gKiBUaGlzIGVmZmVjdHMgKipldmVyeSoqIHVwZGF0ZWFibGUgbWFuYWdlZCBieSB0aGUgRW5naW5lLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtGYW1vdXNFbmdpbmV9IHRoaXNcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5zdG9wRW5naW5lID0gZnVuY3Rpb24gc3RvcEVuZ2luZSAoKSB7XG4gICAgdGhpcy5fY2hhbm5lbC5zZW5kTWVzc2FnZShFTkdJTkVfU1RPUCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBGYW1vdXNFbmdpbmUoKTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbi8qanNoaW50IC1XMDc5ICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyk7XG52YXIgU2l6ZSA9IHJlcXVpcmUoJy4vU2l6ZScpO1xuXG52YXIgVFJBTlNGT1JNX1BST0NFU1NPUiA9IG5ldyBUcmFuc2Zvcm0oKTtcbnZhciBTSVpFX1BST0NFU1NPUiA9IG5ldyBTaXplKCk7XG5cbnZhciBJREVOVCA9IFtcbiAgICAxLCAwLCAwLCAwLFxuICAgIDAsIDEsIDAsIDAsXG4gICAgMCwgMCwgMSwgMCxcbiAgICAwLCAwLCAwLCAxXG5dO1xuXG52YXIgT05FUyA9IFsxLCAxLCAxXTtcbnZhciBRVUFUID0gWzAsIDAsIDAsIDFdO1xuXG4vKipcbiAqIE5vZGVzIGRlZmluZSBoaWVyYXJjaHkgYW5kIGdlb21ldHJpY2FsIHRyYW5zZm9ybWF0aW9ucy4gVGhleSBjYW4gYmUgbW92ZWRcbiAqICh0cmFuc2xhdGVkKSwgc2NhbGVkIGFuZCByb3RhdGVkLlxuICpcbiAqIEEgTm9kZSBpcyBlaXRoZXIgbW91bnRlZCBvciB1bm1vdW50ZWQuIFVubW91bnRlZCBub2RlcyBhcmUgZGV0YWNoZWQgZnJvbSB0aGVcbiAqIHNjZW5lIGdyYXBoLiBVbm1vdW50ZWQgbm9kZXMgaGF2ZSBubyBwYXJlbnQgbm9kZSwgd2hpbGUgZWFjaCBtb3VudGVkIG5vZGUgaGFzXG4gKiBleGFjdGx5IG9uZSBwYXJlbnQuIE5vZGVzIGhhdmUgYW4gYXJiaXRhcnkgbnVtYmVyIG9mIGNoaWxkcmVuLCB3aGljaCBjYW4gYmVcbiAqIGR5bmFtaWNhbGx5IGFkZGVkIHVzaW5nIHtAbGluayBOb2RlI2FkZENoaWxkfS5cbiAqXG4gKiBFYWNoIE5vZGUgaGFzIGFuIGFyYml0cmFyeSBudW1iZXIgb2YgYGNvbXBvbmVudHNgLiBUaG9zZSBjb21wb25lbnRzIGNhblxuICogc2VuZCBgZHJhd2AgY29tbWFuZHMgdG8gdGhlIHJlbmRlcmVyIG9yIG11dGF0ZSB0aGUgbm9kZSBpdHNlbGYsIGluIHdoaWNoIGNhc2VcbiAqIHRoZXkgZGVmaW5lIGJlaGF2aW9yIGluIHRoZSBtb3N0IGV4cGxpY2l0IHdheS4gQ29tcG9uZW50cyB0aGF0IHNlbmQgYGRyYXdgXG4gKiBjb21tYW5kcyBhcmUgY29uc2lkZXJlZCBgcmVuZGVyYWJsZXNgLiBGcm9tIHRoZSBub2RlJ3MgcGVyc3BlY3RpdmUsIHRoZXJlIGlzXG4gKiBubyBkaXN0aW5jdGlvbiBiZXR3ZWVuIG5vZGVzIHRoYXQgc2VuZCBkcmF3IGNvbW1hbmRzIGFuZCBub2RlcyB0aGF0IGRlZmluZVxuICogYmVoYXZpb3IuXG4gKlxuICogQmVjYXVzZSBvZiB0aGUgZmFjdCB0aGF0IE5vZGVzIHRoZW1zZWxmIGFyZSB2ZXJ5IHVub3BpbmlvdGVkICh0aGV5IGRvbid0XG4gKiBcInJlbmRlclwiIHRvIGFueXRoaW5nKSwgdGhleSBhcmUgb2Z0ZW4gYmVpbmcgc3ViY2xhc3NlZCBpbiBvcmRlciB0byBhZGQgZS5nLlxuICogY29tcG9uZW50cyBhdCBpbml0aWFsaXphdGlvbiB0byB0aGVtLiBCZWNhdXNlIG9mIHRoaXMgZmxleGliaWxpdHksIHRoZXkgbWlnaHRcbiAqIGFzIHdlbGwgaGF2ZSBiZWVuIGNhbGxlZCBgRW50aXRpZXNgLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBjcmVhdGUgdGhyZWUgZGV0YWNoZWQgKHVubW91bnRlZCkgbm9kZXNcbiAqIHZhciBwYXJlbnQgPSBuZXcgTm9kZSgpO1xuICogdmFyIGNoaWxkMSA9IG5ldyBOb2RlKCk7XG4gKiB2YXIgY2hpbGQyID0gbmV3IE5vZGUoKTtcbiAqXG4gKiAvLyBidWlsZCBhbiB1bm1vdW50ZWQgc3VidHJlZSAocGFyZW50IGlzIHN0aWxsIGRldGFjaGVkKVxuICogcGFyZW50LmFkZENoaWxkKGNoaWxkMSk7XG4gKiBwYXJlbnQuYWRkQ2hpbGQoY2hpbGQyKTtcbiAqXG4gKiAvLyBtb3VudCBwYXJlbnQgYnkgYWRkaW5nIGl0IHRvIHRoZSBjb250ZXh0XG4gKiB2YXIgY29udGV4dCA9IEZhbW91cy5jcmVhdGVDb250ZXh0KFwiYm9keVwiKTtcbiAqIGNvbnRleHQuYWRkQ2hpbGQocGFyZW50KTtcbiAqXG4gKiBAY2xhc3MgTm9kZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE5vZGUgKCkge1xuICAgIHRoaXMuX2NhbGN1bGF0ZWRWYWx1ZXMgPSB7XG4gICAgICAgIHRyYW5zZm9ybTogbmV3IEZsb2F0MzJBcnJheShJREVOVCksXG4gICAgICAgIHNpemU6IG5ldyBGbG9hdDMyQXJyYXkoMylcbiAgICB9O1xuXG4gICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMuX2luVXBkYXRlID0gZmFsc2U7XG5cbiAgICB0aGlzLl91cGRhdGVRdWV1ZSA9IFtdO1xuICAgIHRoaXMuX25leHRVcGRhdGVRdWV1ZSA9IFtdO1xuXG4gICAgdGhpcy5fZnJlZWRDb21wb25lbnRJbmRpY2llcyA9IFtdO1xuICAgIHRoaXMuX2NvbXBvbmVudHMgPSBbXTtcblxuICAgIHRoaXMuX2ZyZWVkQ2hpbGRJbmRpY2llcyA9IFtdO1xuICAgIHRoaXMuX2NoaWxkcmVuID0gW107XG5cbiAgICB0aGlzLl9wYXJlbnQgPSBudWxsO1xuICAgIHRoaXMuX2dsb2JhbFVwZGF0ZXIgPSBudWxsO1xuXG4gICAgdGhpcy5fbGFzdEV1bGVyWCA9IDA7XG4gICAgdGhpcy5fbGFzdEV1bGVyWSA9IDA7XG4gICAgdGhpcy5fbGFzdEV1bGVyWiA9IDA7XG4gICAgdGhpcy5fbGFzdEV1bGVyID0gZmFsc2U7XG5cbiAgICB0aGlzLnZhbHVlID0gbmV3IE5vZGUuU3BlYygpO1xufVxuXG5Ob2RlLlJFTEFUSVZFX1NJWkUgPSBTaXplLlJFTEFUSVZFO1xuTm9kZS5BQlNPTFVURV9TSVpFID0gU2l6ZS5BQlNPTFVURTtcbk5vZGUuUkVOREVSX1NJWkUgPSBTaXplLlJFTkRFUjtcbk5vZGUuREVGQVVMVF9TSVpFID0gU2l6ZS5ERUZBVUxUO1xuXG4vKipcbiAqIEEgTm9kZSBzcGVjIGhvbGRzIHRoZSBcImRhdGFcIiBhc3NvY2lhdGVkIHdpdGggYSBOb2RlLlxuICpcbiAqIEBjbGFzcyBTcGVjXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcHJvcGVydHkge1N0cmluZ30gbG9jYXRpb24gcGF0aCB0byB0aGUgbm9kZSAoZS5nLiBcImJvZHkvMC8xXCIpXG4gKiBAcHJvcGVydHkge09iamVjdH0gc2hvd1N0YXRlXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IHNob3dTdGF0ZS5tb3VudGVkXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IHNob3dTdGF0ZS5zaG93blxuICogQHByb3BlcnR5IHtOdW1iZXJ9IHNob3dTdGF0ZS5vcGFjaXR5XG4gKiBAcHJvcGVydHkge09iamVjdH0gb2Zmc2V0c1xuICogQHByb3BlcnR5IHtGbG9hdDMyQXJyYXkuPE51bWJlcj59IG9mZnNldHMubW91bnRQb2ludFxuICogQHByb3BlcnR5IHtGbG9hdDMyQXJyYXkuPE51bWJlcj59IG9mZnNldHMuYWxpZ25cbiAqIEBwcm9wZXJ0eSB7RmxvYXQzMkFycmF5LjxOdW1iZXI+fSBvZmZzZXRzLm9yaWdpblxuICogQHByb3BlcnR5IHtPYmplY3R9IHZlY3RvcnNcbiAqIEBwcm9wZXJ0eSB7RmxvYXQzMkFycmF5LjxOdW1iZXI+fSB2ZWN0b3JzLnBvc2l0aW9uXG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gdmVjdG9ycy5yb3RhdGlvblxuICogQHByb3BlcnR5IHtGbG9hdDMyQXJyYXkuPE51bWJlcj59IHZlY3RvcnMuc2NhbGVcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBzaXplXG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gc2l6ZS5zaXplTW9kZVxuICogQHByb3BlcnR5IHtGbG9hdDMyQXJyYXkuPE51bWJlcj59IHNpemUucHJvcG9ydGlvbmFsXG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gc2l6ZS5kaWZmZXJlbnRpYWxcbiAqIEBwcm9wZXJ0eSB7RmxvYXQzMkFycmF5LjxOdW1iZXI+fSBzaXplLmFic29sdXRlXG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gc2l6ZS5yZW5kZXJcbiAqL1xuTm9kZS5TcGVjID0gZnVuY3Rpb24gU3BlYyAoKSB7XG4gICAgdGhpcy5sb2NhdGlvbiA9IG51bGw7XG4gICAgdGhpcy5zaG93U3RhdGUgPSB7XG4gICAgICAgIG1vdW50ZWQ6IGZhbHNlLFxuICAgICAgICBzaG93bjogZmFsc2UsXG4gICAgICAgIG9wYWNpdHk6IDFcbiAgICB9O1xuICAgIHRoaXMub2Zmc2V0cyA9IHtcbiAgICAgICAgbW91bnRQb2ludDogbmV3IEZsb2F0MzJBcnJheSgzKSxcbiAgICAgICAgYWxpZ246IG5ldyBGbG9hdDMyQXJyYXkoMyksXG4gICAgICAgIG9yaWdpbjogbmV3IEZsb2F0MzJBcnJheSgzKVxuICAgIH07XG4gICAgdGhpcy52ZWN0b3JzID0ge1xuICAgICAgICBwb3NpdGlvbjogbmV3IEZsb2F0MzJBcnJheSgzKSxcbiAgICAgICAgcm90YXRpb246IG5ldyBGbG9hdDMyQXJyYXkoUVVBVCksXG4gICAgICAgIHNjYWxlOiBuZXcgRmxvYXQzMkFycmF5KE9ORVMpXG4gICAgfTtcbiAgICB0aGlzLnNpemUgPSB7XG4gICAgICAgIHNpemVNb2RlOiBuZXcgRmxvYXQzMkFycmF5KFtTaXplLlJFTEFUSVZFLCBTaXplLlJFTEFUSVZFLCBTaXplLlJFTEFUSVZFXSksXG4gICAgICAgIHByb3BvcnRpb25hbDogbmV3IEZsb2F0MzJBcnJheShPTkVTKSxcbiAgICAgICAgZGlmZmVyZW50aWFsOiBuZXcgRmxvYXQzMkFycmF5KDMpLFxuICAgICAgICBhYnNvbHV0ZTogbmV3IEZsb2F0MzJBcnJheSgzKSxcbiAgICAgICAgcmVuZGVyOiBuZXcgRmxvYXQzMkFycmF5KDMpXG4gICAgfTtcbiAgICB0aGlzLlVJRXZlbnRzID0gW107XG59O1xuXG4vKipcbiAqIERldGVybWluZSB0aGUgbm9kZSdzIGxvY2F0aW9uIGluIHRoZSBzY2VuZSBncmFwaCBoaWVyYXJjaHkuXG4gKiBBIGxvY2F0aW9uIG9mIGBib2R5LzAvMWAgY2FuIGJlIGludGVycHJldGVkIGFzIHRoZSBmb2xsb3dpbmcgc2NlbmUgZ3JhcGhcbiAqIGhpZXJhcmNoeSAoaWdub3Jpbmcgc2libGluZ3Mgb2YgYW5jZXN0b3JzIGFuZCBhZGRpdGlvbmFsIGNoaWxkIG5vZGVzKTpcbiAqXG4gKiBgQ29udGV4dDpib2R5YCAtPiBgTm9kZTowYCAtPiBgTm9kZToxYCwgd2hlcmUgYE5vZGU6MWAgaXMgdGhlIG5vZGUgdGhlXG4gKiBgZ2V0TG9jYXRpb25gIG1ldGhvZCBoYXMgYmVlbiBpbnZva2VkIG9uLlxuICpcbiAqIEBtZXRob2QgZ2V0TG9jYXRpb25cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IGxvY2F0aW9uIChwYXRoKSwgZS5nLiBgYm9keS8wLzFgXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldExvY2F0aW9uID0gZnVuY3Rpb24gZ2V0TG9jYXRpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLmxvY2F0aW9uO1xufTtcblxuLyoqXG4gKiBAYWxpYXMgZ2V0SWRcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHRoZSBwYXRoIG9mIHRoZSBOb2RlXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldElkID0gTm9kZS5wcm90b3R5cGUuZ2V0TG9jYXRpb247XG5cbi8qKlxuICogR2xvYmFsbHkgZGlzcGF0Y2hlcyB0aGUgZXZlbnQgdXNpbmcgdGhlIFNjZW5lJ3MgRGlzcGF0Y2guIEFsbCBub2RlcyB3aWxsXG4gKiByZWNlaXZlIHRoZSBkaXNwYXRjaGVkIGV2ZW50LlxuICpcbiAqIEBtZXRob2QgZW1pdFxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gZXZlbnQgICBFdmVudCB0eXBlLlxuICogQHBhcmFtICB7T2JqZWN0fSBwYXlsb2FkIEV2ZW50IG9iamVjdCB0byBiZSBkaXNwYXRjaGVkLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQgKGV2ZW50LCBwYXlsb2FkKSB7XG4gICAgdmFyIGN1cnJlbnQgPSB0aGlzO1xuXG4gICAgd2hpbGUgKGN1cnJlbnQgIT09IGN1cnJlbnQuZ2V0UGFyZW50KCkpIHtcbiAgICAgICAgY3VycmVudCA9IGN1cnJlbnQuZ2V0UGFyZW50KCk7XG4gICAgfVxuXG4gICAgY3VycmVudC5nZXREaXNwYXRjaCgpLmRpc3BhdGNoKGV2ZW50LCBwYXlsb2FkKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8vIFRISVMgV0lMTCBCRSBERVBSRUNBVEVEXG5Ob2RlLnByb3RvdHlwZS5zZW5kRHJhd0NvbW1hbmQgPSBmdW5jdGlvbiBzZW5kRHJhd0NvbW1hbmQgKG1lc3NhZ2UpIHtcbiAgICB0aGlzLl9nbG9iYWxVcGRhdGVyLm1lc3NhZ2UobWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZXMgdGhlIE5vZGUsIGluY2x1ZGluZyBhbGwgcHJldmlvdXNseSBhZGRlZCBjb21wb25lbnRzLlxuICpcbiAqIEBtZXRob2QgZ2V0VmFsdWVcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICBTZXJpYWxpemVkIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBub2RlLCBpbmNsdWRpbmdcbiAqICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHMuXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gZ2V0VmFsdWUgKCkge1xuICAgIHZhciBudW1iZXJPZkNoaWxkcmVuID0gdGhpcy5fY2hpbGRyZW4ubGVuZ3RoO1xuICAgIHZhciBudW1iZXJPZkNvbXBvbmVudHMgPSB0aGlzLl9jb21wb25lbnRzLmxlbmd0aDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICB2YXIgdmFsdWUgPSB7XG4gICAgICAgIGxvY2F0aW9uOiB0aGlzLnZhbHVlLmxvY2F0aW9uLFxuICAgICAgICBzcGVjOiB0aGlzLnZhbHVlLFxuICAgICAgICBjb21wb25lbnRzOiBuZXcgQXJyYXkobnVtYmVyT2ZDb21wb25lbnRzKSxcbiAgICAgICAgY2hpbGRyZW46IG5ldyBBcnJheShudW1iZXJPZkNoaWxkcmVuKVxuICAgIH07XG5cbiAgICBmb3IgKDsgaSA8IG51bWJlck9mQ2hpbGRyZW4gOyBpKyspXG4gICAgICAgIGlmICh0aGlzLl9jaGlsZHJlbltpXSAmJiB0aGlzLl9jaGlsZHJlbltpXS5nZXRWYWx1ZSlcbiAgICAgICAgICAgIHZhbHVlLmNoaWxkcmVuW2ldID0gdGhpcy5fY2hpbGRyZW5baV0uZ2V0VmFsdWUoKTtcblxuICAgIGZvciAoaSA9IDAgOyBpIDwgbnVtYmVyT2ZDb21wb25lbnRzIDsgaSsrKVxuICAgICAgICBpZiAodGhpcy5fY29tcG9uZW50c1tpXSAmJiB0aGlzLl9jb21wb25lbnRzW2ldLmdldFZhbHVlKVxuICAgICAgICAgICAgdmFsdWUuY29tcG9uZW50c1tpXSA9IHRoaXMuX2NvbXBvbmVudHNbaV0uZ2V0VmFsdWUoKTtcblxuICAgIHJldHVybiB2YWx1ZTtcbn07XG5cbi8qKlxuICogU2ltaWxhciB0byB7QGxpbmsgTm9kZSNnZXRWYWx1ZX0sIGJ1dCByZXR1cm5zIHRoZSBhY3R1YWwgXCJjb21wdXRlZFwiIHZhbHVlLiBFLmcuXG4gKiBhIHByb3BvcnRpb25hbCBzaXplIG9mIDAuNSBtaWdodCByZXNvbHZlIGludG8gYSBcImNvbXB1dGVkXCIgc2l6ZSBvZiAyMDBweFxuICogKGFzc3VtaW5nIHRoZSBwYXJlbnQgaGFzIGEgd2lkdGggb2YgNDAwcHgpLlxuICpcbiAqIEBtZXRob2QgZ2V0Q29tcHV0ZWRWYWx1ZVxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gICAgIFNlcmlhbGl6ZWQgcmVwcmVzZW50YXRpb24gb2YgdGhlIG5vZGUsIGluY2x1ZGluZ1xuICogICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4sIGV4Y2x1ZGluZyBjb21wb25lbnRzLlxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRDb21wdXRlZFZhbHVlID0gZnVuY3Rpb24gZ2V0Q29tcHV0ZWRWYWx1ZSAoKSB7XG4gICAgdmFyIG51bWJlck9mQ2hpbGRyZW4gPSB0aGlzLl9jaGlsZHJlbi5sZW5ndGg7XG5cbiAgICB2YXIgdmFsdWUgPSB7XG4gICAgICAgIGxvY2F0aW9uOiB0aGlzLnZhbHVlLmxvY2F0aW9uLFxuICAgICAgICBjb21wdXRlZFZhbHVlczogdGhpcy5fY2FsY3VsYXRlZFZhbHVlcyxcbiAgICAgICAgY2hpbGRyZW46IG5ldyBBcnJheShudW1iZXJPZkNoaWxkcmVuKVxuICAgIH07XG5cbiAgICBmb3IgKHZhciBpID0gMCA7IGkgPCBudW1iZXJPZkNoaWxkcmVuIDsgaSsrKVxuICAgICAgICB2YWx1ZS5jaGlsZHJlbltpXSA9IHRoaXMuX2NoaWxkcmVuW2ldLmdldENvbXB1dGVkVmFsdWUoKTtcblxuICAgIHJldHVybiB2YWx1ZTtcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIGFsbCBjaGlsZHJlbiBvZiB0aGUgY3VycmVudCBub2RlLlxuICpcbiAqIEBtZXRob2QgZ2V0Q2hpbGRyZW5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheS48Tm9kZT59ICAgQW4gYXJyYXkgb2YgY2hpbGRyZW4uXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldENoaWxkcmVuID0gZnVuY3Rpb24gZ2V0Q2hpbGRyZW4gKCkge1xuICAgIHJldHVybiB0aGlzLl9jaGlsZHJlbjtcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBwYXJlbnQgb2YgdGhlIGN1cnJlbnQgbm9kZS4gVW5tb3VudGVkIG5vZGVzIGRvIG5vdCBoYXZlIGFcbiAqIHBhcmVudCBub2RlLlxuICpcbiAqIEBtZXRob2QgZ2V0UGFyZW50XG4gKlxuICogQHJldHVybiB7Tm9kZX0gICAgICAgUGFyZW50IG5vZGUuXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFBhcmVudCA9IGZ1bmN0aW9uIGdldFBhcmVudCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudDtcbn07XG5cbi8qKlxuICogU2NoZWR1bGVzIHRoZSB7QGxpbmsgTm9kZSN1cGRhdGV9IGZ1bmN0aW9uIG9mIHRoZSBub2RlIHRvIGJlIGludm9rZWQgb24gdGhlXG4gKiBuZXh0IGZyYW1lIChpZiBubyB1cGRhdGUgZHVyaW5nIHRoaXMgZnJhbWUgaGFzIGJlZW4gc2NoZWR1bGVkIGFscmVhZHkpLlxuICogSWYgdGhlIG5vZGUgaXMgY3VycmVudGx5IGJlaW5nIHVwZGF0ZWQgKHdoaWNoIG1lYW5zIG9uZSBvZiB0aGUgcmVxdWVzdGVyc1xuICogaW52b2tlZCByZXF1ZXN0c1VwZGF0ZSB3aGlsZSBiZWluZyB1cGRhdGVkIGl0c2VsZiksIGFuIHVwZGF0ZSB3aWxsIGJlXG4gKiBzY2hlZHVsZWQgb24gdGhlIG5leHQgZnJhbWUuXG4gKlxuICogQG1ldGhvZCByZXF1ZXN0VXBkYXRlXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSByZXF1ZXN0ZXIgICBJZiB0aGUgcmVxdWVzdGVyIGhhcyBhbiBgb25VcGRhdGVgIG1ldGhvZCwgaXRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lsbCBiZSBpbnZva2VkIGR1cmluZyB0aGUgbmV4dCB1cGRhdGUgcGhhc2Ugb2ZcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIG5vZGUuXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5yZXF1ZXN0VXBkYXRlID0gZnVuY3Rpb24gcmVxdWVzdFVwZGF0ZSAocmVxdWVzdGVyKSB7XG4gICAgaWYgKHRoaXMuX2luVXBkYXRlIHx8ICF0aGlzLmlzTW91bnRlZCgpKVxuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0VXBkYXRlT25OZXh0VGljayhyZXF1ZXN0ZXIpO1xuICAgIHRoaXMuX3VwZGF0ZVF1ZXVlLnB1c2gocmVxdWVzdGVyKTtcbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2NoZWR1bGVzIGFuIHVwZGF0ZSBvbiB0aGUgbmV4dCB0aWNrLiBTaW1pbGFyaWx5IHRvXG4gKiB7QGxpbmsgTm9kZSNyZXF1ZXN0VXBkYXRlfSwgYHJlcXVlc3RVcGRhdGVPbk5leHRUaWNrYCBzY2hlZHVsZXMgdGhlIG5vZGUnc1xuICogYG9uVXBkYXRlYCBmdW5jdGlvbiB0byBiZSBpbnZva2VkIG9uIHRoZSBmcmFtZSBhZnRlciB0aGUgbmV4dCBpbnZvY2F0aW9uIG9uXG4gKiB0aGUgbm9kZSdzIG9uVXBkYXRlIGZ1bmN0aW9uLlxuICpcbiAqIEBtZXRob2QgcmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2tcbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IHJlcXVlc3RlciAgIElmIHRoZSByZXF1ZXN0ZXIgaGFzIGFuIGBvblVwZGF0ZWAgbWV0aG9kLCBpdFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWxsIGJlIGludm9rZWQgZHVyaW5nIHRoZSBuZXh0IHVwZGF0ZSBwaGFzZSBvZlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgbm9kZS5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnJlcXVlc3RVcGRhdGVPbk5leHRUaWNrID0gZnVuY3Rpb24gcmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2sgKHJlcXVlc3Rlcikge1xuICAgIHRoaXMuX25leHRVcGRhdGVRdWV1ZS5wdXNoKHJlcXVlc3Rlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgb2JqZWN0IHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyB0aGlzIG5vZGUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGdsb2JhbCB1cGRhdGVyLlxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRVcGRhdGVyID0gZnVuY3Rpb24gZ2V0VXBkYXRlciAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dsb2JhbFVwZGF0ZXI7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgbm9kZSBpcyBtb3VudGVkLiBVbm1vdW50ZWQgbm9kZXMgYXJlIGRldGFjaGVkIGZyb20gdGhlIHNjZW5lXG4gKiBncmFwaC5cbiAqXG4gKiBAbWV0aG9kIGlzTW91bnRlZFxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgIEJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBub2RlIGlzIG1vdW50ZWQgb3Igbm90LlxuICovXG5Ob2RlLnByb3RvdHlwZS5pc01vdW50ZWQgPSBmdW5jdGlvbiBpc01vdW50ZWQgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnNob3dTdGF0ZS5tb3VudGVkO1xufTtcblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIG5vZGUgaXMgdmlzaWJsZSAoXCJzaG93blwiKS5cbiAqXG4gKiBAbWV0aG9kIGlzU2hvd25cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICBCb29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGUgbm9kZSBpcyB2aXNpYmxlXG4gKiAgICAgICAgICAgICAgICAgICAgICAoXCJzaG93blwiKSBvciBub3QuXG4gKi9cbk5vZGUucHJvdG90eXBlLmlzU2hvd24gPSBmdW5jdGlvbiBpc1Nob3duICgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5zaG93U3RhdGUuc2hvd247XG59O1xuXG4vKipcbiAqIERldGVybWluZXMgdGhlIG5vZGUncyByZWxhdGl2ZSBvcGFjaXR5LlxuICogVGhlIG9wYWNpdHkgbmVlZHMgdG8gYmUgd2l0aGluIFswLCAxXSwgd2hlcmUgMCBpbmRpY2F0ZXMgYSBjb21wbGV0ZWx5XG4gKiB0cmFuc3BhcmVudCwgdGhlcmVmb3JlIGludmlzaWJsZSBub2RlLCB3aGVyZWFzIGFuIG9wYWNpdHkgb2YgMSBtZWFucyB0aGVcbiAqIG5vZGUgaXMgY29tcGxldGVseSBzb2xpZC5cbiAqXG4gKiBAbWV0aG9kIGdldE9wYWNpdHlcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgICAgUmVsYXRpdmUgb3BhY2l0eSBvZiB0aGUgbm9kZS5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0T3BhY2l0eSA9IGZ1bmN0aW9uIGdldE9wYWNpdHkgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnNob3dTdGF0ZS5vcGFjaXR5O1xufTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBub2RlJ3MgcHJldmlvdXNseSBzZXQgbW91bnQgcG9pbnQuXG4gKlxuICogQG1ldGhvZCBnZXRNb3VudFBvaW50XG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSAgIEFuIGFycmF5IHJlcHJlc2VudGluZyB0aGUgbW91bnQgcG9pbnQuXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldE1vdW50UG9pbnQgPSBmdW5jdGlvbiBnZXRNb3VudFBvaW50ICgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5vZmZzZXRzLm1vdW50UG9pbnQ7XG59O1xuXG4vKipcbiAqIERldGVybWluZXMgdGhlIG5vZGUncyBwcmV2aW91c2x5IHNldCBhbGlnbi5cbiAqXG4gKiBAbWV0aG9kIGdldEFsaWduXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSAgIEFuIGFycmF5IHJlcHJlc2VudGluZyB0aGUgYWxpZ24uXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldEFsaWduID0gZnVuY3Rpb24gZ2V0QWxpZ24gKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLm9mZnNldHMuYWxpZ247XG59O1xuXG4vKipcbiAqIERldGVybWluZXMgdGhlIG5vZGUncyBwcmV2aW91c2x5IHNldCBvcmlnaW4uXG4gKlxuICogQG1ldGhvZCBnZXRPcmlnaW5cbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9ICAgQW4gYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBvcmlnaW4uXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldE9yaWdpbiA9IGZ1bmN0aW9uIGdldE9yaWdpbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUub2Zmc2V0cy5vcmlnaW47XG59O1xuXG4vKipcbiAqIERldGVybWluZXMgdGhlIG5vZGUncyBwcmV2aW91c2x5IHNldCBwb3NpdGlvbi5cbiAqXG4gKiBAbWV0aG9kIGdldFBvc2l0aW9uXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSAgIEFuIGFycmF5IHJlcHJlc2VudGluZyB0aGUgcG9zaXRpb24uXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFBvc2l0aW9uID0gZnVuY3Rpb24gZ2V0UG9zaXRpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnZlY3RvcnMucG9zaXRpb247XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG5vZGUncyBjdXJyZW50IHJvdGF0aW9uXG4gKlxuICogQG1ldGhvZCBnZXRSb3RhdGlvblxuICpcbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gYW4gYXJyYXkgb2YgZm91ciB2YWx1ZXMsIHNob3dpbmcgdGhlIHJvdGF0aW9uIGFzIGEgcXVhdGVybmlvblxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRSb3RhdGlvbiA9IGZ1bmN0aW9uIGdldFJvdGF0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS52ZWN0b3JzLnJvdGF0aW9uO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBzY2FsZSBvZiB0aGUgbm9kZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9IGFuIGFycmF5IHNob3dpbmcgdGhlIGN1cnJlbnQgc2NhbGUgdmVjdG9yXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFNjYWxlID0gZnVuY3Rpb24gZ2V0U2NhbGUgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnZlY3RvcnMuc2NhbGU7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgc2l6ZSBtb2RlIG9mIHRoZSBub2RlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gYW4gYXJyYXkgb2YgbnVtYmVycyBzaG93aW5nIHRoZSBjdXJyZW50IHNpemUgbW9kZVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRTaXplTW9kZSA9IGZ1bmN0aW9uIGdldFNpemVNb2RlICgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5zaXplLnNpemVNb2RlO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IHByb3BvcnRpb25hbCBzaXplXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gYSB2ZWN0b3IgMyBzaG93aW5nIHRoZSBjdXJyZW50IHByb3BvcnRpb25hbCBzaXplXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFByb3BvcnRpb25hbFNpemUgPSBmdW5jdGlvbiBnZXRQcm9wb3J0aW9uYWxTaXplICgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5zaXplLnByb3BvcnRpb25hbDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZGlmZmVyZW50aWFsIHNpemUgb2YgdGhlIG5vZGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhIHZlY3RvciAzIHNob3dpbmcgdGhlIGN1cnJlbnQgZGlmZmVyZW50aWFsIHNpemVcbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0RGlmZmVyZW50aWFsU2l6ZSA9IGZ1bmN0aW9uIGdldERpZmZlcmVudGlhbFNpemUgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnNpemUuZGlmZmVyZW50aWFsO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBhYnNvbHV0ZSBzaXplIG9mIHRoZSBub2RlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gYSB2ZWN0b3IgMyBzaG93aW5nIHRoZSBjdXJyZW50IGFic29sdXRlIHNpemUgb2YgdGhlIG5vZGVcbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0QWJzb2x1dGVTaXplID0gZnVuY3Rpb24gZ2V0QWJzb2x1dGVTaXplICgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5zaXplLmFic29sdXRlO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IFJlbmRlciBTaXplIG9mIHRoZSBub2RlLiBOb3RlIHRoYXQgdGhlIHJlbmRlciBzaXplXG4gKiBpcyBhc3luY2hyb25vdXMgKHdpbGwgYWx3YXlzIGJlIG9uZSBmcmFtZSBiZWhpbmQpIGFuZCBuZWVkcyB0byBiZSBleHBsaWNpdGVseVxuICogY2FsY3VsYXRlZCBieSBzZXR0aW5nIHRoZSBwcm9wZXIgc2l6ZSBtb2RlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9IGEgdmVjdG9yIDMgc2hvd2luZyB0aGUgY3VycmVudCByZW5kZXIgc2l6ZVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRSZW5kZXJTaXplID0gZnVuY3Rpb24gZ2V0UmVuZGVyU2l6ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUuc2l6ZS5yZW5kZXI7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGV4dGVybmFsIHNpemUgb2YgdGhlIG5vZGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhIHZlY3RvciAzIG9mIHRoZSBmaW5hbCBjYWxjdWxhdGVkIHNpZGUgb2YgdGhlIG5vZGVcbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0U2l6ZSA9IGZ1bmN0aW9uIGdldFNpemUgKCkge1xuICAgIHJldHVybiB0aGlzLl9jYWxjdWxhdGVkVmFsdWVzLnNpemU7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgd29ybGQgdHJhbnNmb3JtIG9mIHRoZSBub2RlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gYSAxNiB2YWx1ZSB0cmFuc2Zvcm1cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0VHJhbnNmb3JtID0gZnVuY3Rpb24gZ2V0VHJhbnNmb3JtICgpIHtcbiAgICByZXR1cm4gdGhpcy5fY2FsY3VsYXRlZFZhbHVlcy50cmFuc2Zvcm07XG59O1xuXG4vKipcbiAqIEdldCB0aGUgbGlzdCBvZiB0aGUgVUkgRXZlbnRzIHRoYXQgYXJlIGN1cnJlbnRseSBhc3NvY2lhdGVkIHdpdGggdGhpcyBub2RlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBhbiBhcnJheSBvZiBzdHJpbmdzIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCBzdWJzY3JpYmVkIFVJIGV2ZW50IG9mIHRoaXMgbm9kZVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRVSUV2ZW50cyA9IGZ1bmN0aW9uIGdldFVJRXZlbnRzICgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5VSUV2ZW50cztcbn07XG5cbi8qKlxuICogQWRkcyBhIG5ldyBjaGlsZCB0byB0aGlzIG5vZGUuIElmIHRoaXMgbWV0aG9kIGlzIGNhbGxlZCB3aXRoIG5vIGFyZ3VtZW50IGl0IHdpbGxcbiAqIGNyZWF0ZSBhIG5ldyBub2RlLCBob3dldmVyIGl0IGNhbiBhbHNvIGJlIGNhbGxlZCB3aXRoIGFuIGV4aXN0aW5nIG5vZGUgd2hpY2ggaXQgd2lsbFxuICogYXBwZW5kIHRvIHRoZSBub2RlIHRoYXQgdGhpcyBtZXRob2QgaXMgYmVpbmcgY2FsbGVkIG9uLiBSZXR1cm5zIHRoZSBuZXcgb3IgcGFzc2VkIGluIG5vZGUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7Tm9kZSB8IHZvaWR9IGNoaWxkIHRoZSBub2RlIHRvIGFwcGVuZGVkIG9yIG5vIG5vZGUgdG8gY3JlYXRlIGEgbmV3IG5vZGUuXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhlIGFwcGVuZGVkIG5vZGUuXG4gKi9cbk5vZGUucHJvdG90eXBlLmFkZENoaWxkID0gZnVuY3Rpb24gYWRkQ2hpbGQgKGNoaWxkKSB7XG4gICAgdmFyIGluZGV4ID0gY2hpbGQgPyB0aGlzLl9jaGlsZHJlbi5pbmRleE9mKGNoaWxkKSA6IC0xO1xuICAgIGNoaWxkID0gY2hpbGQgPyBjaGlsZCA6IG5ldyBOb2RlKCk7XG5cbiAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgIGluZGV4ID0gdGhpcy5fZnJlZWRDaGlsZEluZGljaWVzLmxlbmd0aCA/IHRoaXMuX2ZyZWVkQ2hpbGRJbmRpY2llcy5wb3AoKSA6IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgdGhpcy5fY2hpbGRyZW5baW5kZXhdID0gY2hpbGQ7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNNb3VudGVkKCkgJiYgY2hpbGQub25Nb3VudCkge1xuICAgICAgICAgICAgdmFyIG15SWQgPSB0aGlzLmdldElkKCk7XG4gICAgICAgICAgICB2YXIgY2hpbGRJZCA9IG15SWQgKyAnLycgKyBpbmRleDtcbiAgICAgICAgICAgIGNoaWxkLm9uTW91bnQodGhpcywgY2hpbGRJZCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiBjaGlsZDtcbn07XG5cbi8qKlxuICogUmVtb3ZlcyBhIGNoaWxkIG5vZGUgZnJvbSBhbm90aGVyIG5vZGUuIFRoZSBwYXNzZWQgaW4gbm9kZSBtdXN0IGJlXG4gKiBhIGNoaWxkIG9mIHRoZSBub2RlIHRoYXQgdGhpcyBtZXRob2QgaXMgY2FsbGVkIHVwb24uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gY2hpbGQgbm9kZSB0byBiZSByZW1vdmVkXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gd2hldGhlciBvciBub3QgdGhlIG5vZGUgd2FzIHN1Y2Nlc3NmdWxseSByZW1vdmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLnJlbW92ZUNoaWxkID0gZnVuY3Rpb24gcmVtb3ZlQ2hpbGQgKGNoaWxkKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5fY2hpbGRyZW4uaW5kZXhPZihjaGlsZCk7XG4gICAgdmFyIGFkZGVkID0gaW5kZXggIT09IC0xO1xuICAgIGlmIChhZGRlZCkge1xuICAgICAgICB0aGlzLl9mcmVlZENoaWxkSW5kaWNpZXMucHVzaChpbmRleCk7XG5cbiAgICAgICAgdGhpcy5fY2hpbGRyZW5baW5kZXhdID0gbnVsbDtcblxuICAgICAgICBpZiAodGhpcy5pc01vdW50ZWQoKSAmJiBjaGlsZC5vbkRpc21vdW50KVxuICAgICAgICAgICAgY2hpbGQub25EaXNtb3VudCgpO1xuICAgIH1cbiAgICByZXR1cm4gYWRkZWQ7XG59O1xuXG4vKipcbiAqIEVhY2ggY29tcG9uZW50IGNhbiBvbmx5IGJlIGFkZGVkIG9uY2UgcGVyIG5vZGUuXG4gKlxuICogQG1ldGhvZCBhZGRDb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50ICAgIEEgY29tcG9uZW50IHRvIGJlIGFkZGVkLlxuICogQHJldHVybiB7TnVtYmVyfSBpbmRleCAgICAgICBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIGNvbXBvbmVudCBoYXMgYmVlblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWdpc3RlcmVkLiBJbmRpY2VzIGFyZW4ndCBuZWNlc3NhcmlseVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zZWN1dGl2ZS5cbiAqL1xuTm9kZS5wcm90b3R5cGUuYWRkQ29tcG9uZW50ID0gZnVuY3Rpb24gYWRkQ29tcG9uZW50IChjb21wb25lbnQpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9jb21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50KTtcbiAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgIGluZGV4ID0gdGhpcy5fZnJlZWRDb21wb25lbnRJbmRpY2llcy5sZW5ndGggPyB0aGlzLl9mcmVlZENvbXBvbmVudEluZGljaWVzLnBvcCgpIDogdGhpcy5fY29tcG9uZW50cy5sZW5ndGg7XG4gICAgICAgIHRoaXMuX2NvbXBvbmVudHNbaW5kZXhdID0gY29tcG9uZW50O1xuXG4gICAgICAgIGlmICh0aGlzLmlzTW91bnRlZCgpICYmIGNvbXBvbmVudC5vbk1vdW50KVxuICAgICAgICAgICAgY29tcG9uZW50Lm9uTW91bnQodGhpcywgaW5kZXgpO1xuXG4gICAgICAgIGlmICh0aGlzLmlzU2hvd24oKSAmJiBjb21wb25lbnQub25TaG93KVxuICAgICAgICAgICAgY29tcG9uZW50Lm9uU2hvdygpO1xuICAgIH1cblxuICAgIHJldHVybiBpbmRleDtcbn07XG5cbi8qKlxuICogQG1ldGhvZCAgZ2V0Q29tcG9uZW50XG4gKlxuICogQHBhcmFtICB7TnVtYmVyfSBpbmRleCAgIEluZGV4IGF0IHdoaWNoIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gcmVnaXN0ZXJlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICh1c2luZyBgTm9kZSNhZGRDb21wb25lbnRgKS5cbiAqIEByZXR1cm4geyp9ICAgICAgICAgICAgICBUaGUgY29tcG9uZW50IHJlZ2lzdGVyZWQgYXQgdGhlIHBhc3NlZCBpbiBpbmRleCAoaWZcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBhbnkpLlxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRDb21wb25lbnQgPSBmdW5jdGlvbiBnZXRDb21wb25lbnQgKGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBvbmVudHNbaW5kZXhdO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGEgcHJldmlvdXNseSB2aWEge0BsaW5rIE5vZGUjYWRkQ29tcG9uZW50fSBhZGRlZCBjb21wb25lbnQuXG4gKlxuICogQG1ldGhvZCByZW1vdmVDb21wb25lbnRcbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IGNvbXBvbmVudCAgIEFuIGNvbXBvbmVudCB0aGF0IGhhcyBwcmV2aW91c2x5IGJlZW4gYWRkZWRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNpbmcge0BsaW5rIE5vZGUjYWRkQ29tcG9uZW50fS5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnJlbW92ZUNvbXBvbmVudCA9IGZ1bmN0aW9uIHJlbW92ZUNvbXBvbmVudCAoY29tcG9uZW50KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5fY29tcG9uZW50cy5pbmRleE9mKGNvbXBvbmVudCk7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICB0aGlzLl9mcmVlZENvbXBvbmVudEluZGljaWVzLnB1c2goaW5kZXgpO1xuICAgICAgICBpZiAodGhpcy5pc1Nob3duKCkgJiYgY29tcG9uZW50Lm9uSGlkZSlcbiAgICAgICAgICAgIGNvbXBvbmVudC5vbkhpZGUoKTtcblxuICAgICAgICBpZiAodGhpcy5pc01vdW50ZWQoKSAmJiBjb21wb25lbnQub25EaXNtb3VudClcbiAgICAgICAgICAgIGNvbXBvbmVudC5vbkRpc21vdW50KCk7XG5cbiAgICAgICAgdGhpcy5fY29tcG9uZW50c1tpbmRleF0gPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50O1xufTtcblxuLyoqXG4gKiBTdWJzY3JpYmVzIGEgbm9kZSB0byBhIFVJIEV2ZW50LiBBbGwgY29tcG9uZW50cyBvbiB0aGUgbm9kZVxuICogd2lsbCBoYXZlIHRoZSBvcHBvcnR1bml0eSB0byBiZWdpbiBsaXN0ZW5pbmcgdG8gdGhhdCBldmVudFxuICogYW5kIGFsZXJ0aW5nIHRoZSBzY2VuZSBncmFwaC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSB0aGUgbmFtZSBvZiB0aGUgZXZlbnRcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Ob2RlLnByb3RvdHlwZS5hZGRVSUV2ZW50ID0gZnVuY3Rpb24gYWRkVUlFdmVudCAoZXZlbnROYW1lKSB7XG4gICAgdmFyIFVJRXZlbnRzID0gdGhpcy5nZXRVSUV2ZW50cygpO1xuICAgIHZhciBjb21wb25lbnRzID0gdGhpcy5fY29tcG9uZW50cztcbiAgICB2YXIgY29tcG9uZW50O1xuXG4gICAgdmFyIGFkZGVkID0gVUlFdmVudHMuaW5kZXhPZihldmVudE5hbWUpICE9PSAtMTtcbiAgICBpZiAoIWFkZGVkKSB7XG4gICAgICAgIFVJRXZlbnRzLnB1c2goZXZlbnROYW1lKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvbXBvbmVudHMubGVuZ3RoIDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgY29tcG9uZW50ID0gY29tcG9uZW50c1tpXTtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnQgJiYgY29tcG9uZW50Lm9uQWRkVUlFdmVudCkgY29tcG9uZW50Lm9uQWRkVUlFdmVudChldmVudE5hbWUpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBQcml2YXRlIG1ldGhvZCBmb3IgdGhlIE5vZGUgdG8gcmVxdWVzdCBhbiB1cGRhdGUgZm9yIGl0c2VsZi5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZm9yY2Ugd2hldGhlciBvciBub3QgdG8gZm9yY2UgdGhlIHVwZGF0ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLl9yZXF1ZXN0VXBkYXRlID0gZnVuY3Rpb24gX3JlcXVlc3RVcGRhdGUgKGZvcmNlKSB7XG4gICAgaWYgKGZvcmNlIHx8ICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSAmJiB0aGlzLl9nbG9iYWxVcGRhdGVyKSkge1xuICAgICAgICB0aGlzLl9nbG9iYWxVcGRhdGVyLnJlcXVlc3RVcGRhdGUodGhpcyk7XG4gICAgICAgIHRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgPSB0cnVlO1xuICAgIH1cbn07XG5cbi8qKlxuICogUHJpdmF0ZSBtZXRob2QgdG8gc2V0IGFuIG9wdGlvbmFsIHZhbHVlIGluIGFuIGFycmF5LCBhbmRcbiAqIHJlcXVlc3QgYW4gdXBkYXRlIGlmIHRoaXMgY2hhbmdlcyB0aGUgdmFsdWUgb2YgdGhlIGFycmF5LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2ZWMgdGhlIGFycmF5IHRvIGluc2VydCB0aGUgdmFsdWUgaW50b1xuICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IHRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIHZhbHVlXG4gKiBAcGFyYW0ge0FueX0gdmFsIHRoZSB2YWx1ZSB0byBwb3RlbnRpYWxseSBpbnNlcnQgKGlmIG5vdCBudWxsIG9yIHVuZGVmaW5lZClcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIG9yIG5vdCBhIG5ldyB2YWx1ZSB3YXMgaW5zZXJ0ZWQuXG4gKi9cbk5vZGUucHJvdG90eXBlLl92ZWNPcHRpb25hbFNldCA9IGZ1bmN0aW9uIF92ZWNPcHRpb25hbFNldCAodmVjLCBpbmRleCwgdmFsKSB7XG4gICAgaWYgKHZhbCAhPSBudWxsICYmIHZlY1tpbmRleF0gIT09IHZhbCkge1xuICAgICAgICB2ZWNbaW5kZXhdID0gdmFsO1xuICAgICAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogU2hvd3MgdGhlIG5vZGUsIHdoaWNoIGlzIHRvIHNheSwgY2FsbHMgb25TaG93IG9uIGFsbCBvZiB0aGVcbiAqIG5vZGUncyBjb21wb25lbnRzLiBSZW5kZXJhYmxlIGNvbXBvbmVudHMgY2FuIHRoZW4gaXNzdWUgdGhlXG4gKiBkcmF3IGNvbW1hbmRzIG5lY2Vzc2FyeSB0byBiZSBzaG93bi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyAoKSB7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBpdGVtcyA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgdmFyIGxlbiA9IGl0ZW1zLmxlbmd0aDtcbiAgICB2YXIgaXRlbTtcblxuICAgIHRoaXMudmFsdWUuc2hvd1N0YXRlLnNob3duID0gdHJ1ZTtcblxuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblNob3cpIGl0ZW0ub25TaG93KCk7XG4gICAgfVxuXG4gICAgaSA9IDA7XG4gICAgaXRlbXMgPSB0aGlzLl9jaGlsZHJlbjtcbiAgICBsZW4gPSBpdGVtcy5sZW5ndGg7XG5cbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25QYXJlbnRTaG93KSBpdGVtLm9uUGFyZW50U2hvdygpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSGlkZXMgdGhlIG5vZGUsIHdoaWNoIGlzIHRvIHNheSwgY2FsbHMgb25IaWRlIG9uIGFsbCBvZiB0aGVcbiAqIG5vZGUncyBjb21wb25lbnRzLiBSZW5kZXJhYmxlIGNvbXBvbmVudHMgY2FuIHRoZW4gaXNzdWVcbiAqIHRoZSBkcmF3IGNvbW1hbmRzIG5lY2Vzc2FyeSB0byBiZSBoaWRkZW5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gaGlkZSAoKSB7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBpdGVtcyA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgdmFyIGxlbiA9IGl0ZW1zLmxlbmd0aDtcbiAgICB2YXIgaXRlbTtcblxuICAgIHRoaXMudmFsdWUuc2hvd1N0YXRlLnNob3duID0gZmFsc2U7XG5cbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25IaWRlKSBpdGVtLm9uSGlkZSgpO1xuICAgIH1cblxuICAgIGkgPSAwO1xuICAgIGl0ZW1zID0gdGhpcy5fY2hpbGRyZW47XG4gICAgbGVuID0gaXRlbXMubGVuZ3RoO1xuXG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uUGFyZW50SGlkZSkgaXRlbS5vblBhcmVudEhpZGUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIGFsaWduIHZhbHVlIG9mIHRoZSBub2RlLiBXaWxsIGNhbGwgb25BbGlnbkNoYW5nZVxuICogb24gYWxsIG9mIHRoZSBOb2RlJ3MgY29tcG9uZW50cy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggQWxpZ24gdmFsdWUgaW4gdGhlIHggZGltZW5zaW9uLlxuICogQHBhcmFtIHtOdW1iZXJ9IHkgQWxpZ24gdmFsdWUgaW4gdGhlIHkgZGltZW5zaW9uLlxuICogQHBhcmFtIHtOdW1iZXJ9IHogQWxpZ24gdmFsdWUgaW4gdGhlIHogZGltZW5zaW9uLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuc2V0QWxpZ24gPSBmdW5jdGlvbiBzZXRBbGlnbiAoeCwgeSwgeikge1xuICAgIHZhciB2ZWMzID0gdGhpcy52YWx1ZS5vZmZzZXRzLmFsaWduO1xuICAgIHZhciBwcm9wb2dhdGUgPSBmYWxzZTtcblxuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDAsIHgpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAxLCB5KSB8fCBwcm9wb2dhdGU7XG4gICAgaWYgKHogIT0gbnVsbCkgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMiwgKHogLSAwLjUpKSB8fCBwcm9wb2dhdGU7XG5cbiAgICBpZiAocHJvcG9nYXRlKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciBpdGVtO1xuICAgICAgICB4ID0gdmVjM1swXTtcbiAgICAgICAgeSA9IHZlYzNbMV07XG4gICAgICAgIHogPSB2ZWMzWzJdO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uQWxpZ25DaGFuZ2UpIGl0ZW0ub25BbGlnbkNoYW5nZSh4LCB5LCB6KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgbW91bnQgcG9pbnQgdmFsdWUgb2YgdGhlIG5vZGUuIFdpbGwgY2FsbCBvbk1vdW50UG9pbnRDaGFuZ2VcbiAqIG9uIGFsbCBvZiB0aGUgbm9kZSdzIGNvbXBvbmVudHMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IE1vdW50UG9pbnQgdmFsdWUgaW4geCBkaW1lbnNpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IE1vdW50UG9pbnQgdmFsdWUgaW4geSBkaW1lbnNpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IE1vdW50UG9pbnQgdmFsdWUgaW4geiBkaW1lbnNpb25cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldE1vdW50UG9pbnQgPSBmdW5jdGlvbiBzZXRNb3VudFBvaW50ICh4LCB5LCB6KSB7XG4gICAgdmFyIHZlYzMgPSB0aGlzLnZhbHVlLm9mZnNldHMubW91bnRQb2ludDtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG5cbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAwLCB4KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMSwgeSkgfHwgcHJvcG9nYXRlO1xuICAgIGlmICh6ICE9IG51bGwpIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDIsICh6IC0gMC41KSkgfHwgcHJvcG9nYXRlO1xuXG4gICAgaWYgKHByb3BvZ2F0ZSkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgeCA9IHZlYzNbMF07XG4gICAgICAgIHkgPSB2ZWMzWzFdO1xuICAgICAgICB6ID0gdmVjM1syXTtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vbk1vdW50UG9pbnRDaGFuZ2UpIGl0ZW0ub25Nb3VudFBvaW50Q2hhbmdlKHgsIHksIHopO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBvcmlnaW4gdmFsdWUgb2YgdGhlIG5vZGUuIFdpbGwgY2FsbCBvbk9yaWdpbkNoYW5nZVxuICogb24gYWxsIG9mIHRoZSBub2RlJ3MgY29tcG9uZW50cy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggT3JpZ2luIHZhbHVlIGluIHggZGltZW5zaW9uXG4gKiBAcGFyYW0ge051bWJlcn0geSBPcmlnaW4gdmFsdWUgaW4geSBkaW1lbnNpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IE9yaWdpbiB2YWx1ZSBpbiB6IGRpbWVuc2lvblxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuc2V0T3JpZ2luID0gZnVuY3Rpb24gc2V0T3JpZ2luICh4LCB5LCB6KSB7XG4gICAgdmFyIHZlYzMgPSB0aGlzLnZhbHVlLm9mZnNldHMub3JpZ2luO1xuICAgIHZhciBwcm9wb2dhdGUgPSBmYWxzZTtcblxuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDAsIHgpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAxLCB5KSB8fCBwcm9wb2dhdGU7XG4gICAgaWYgKHogIT0gbnVsbCkgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMiwgKHogLSAwLjUpKSB8fCBwcm9wb2dhdGU7XG5cbiAgICBpZiAocHJvcG9nYXRlKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciBpdGVtO1xuICAgICAgICB4ID0gdmVjM1swXTtcbiAgICAgICAgeSA9IHZlYzNbMV07XG4gICAgICAgIHogPSB2ZWMzWzJdO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uT3JpZ2luQ2hhbmdlKSBpdGVtLm9uT3JpZ2luQ2hhbmdlKHgsIHksIHopO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiB0aGUgbm9kZS4gV2lsbCBjYWxsIG9uUG9zaXRpb25DaGFuZ2VcbiAqIG9uIGFsbCBvZiB0aGUgbm9kZSdzIGNvbXBvbmVudHMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFBvc2l0aW9uIGluIHhcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFBvc2l0aW9uIGluIHlcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFBvc2l0aW9uIGluIHpcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldFBvc2l0aW9uID0gZnVuY3Rpb24gc2V0UG9zaXRpb24gKHgsIHksIHopIHtcbiAgICB2YXIgdmVjMyA9IHRoaXMudmFsdWUudmVjdG9ycy5wb3NpdGlvbjtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG5cbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAwLCB4KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMSwgeSkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDIsIHopIHx8IHByb3BvZ2F0ZTtcblxuICAgIGlmIChwcm9wb2dhdGUpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHggPSB2ZWMzWzBdO1xuICAgICAgICB5ID0gdmVjM1sxXTtcbiAgICAgICAgeiA9IHZlYzNbMl07XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25Qb3NpdGlvbkNoYW5nZSkgaXRlbS5vblBvc2l0aW9uQ2hhbmdlKHgsIHksIHopO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHJvdGF0aW9uIG9mIHRoZSBub2RlLiBXaWxsIGNhbGwgb25Sb3RhdGlvbkNoYW5nZVxuICogb24gYWxsIG9mIHRoZSBub2RlJ3MgY29tcG9uZW50cy4gVGhpcyBtZXRob2QgdGFrZXMgZWl0aGVyXG4gKiBFdWxlciBhbmdsZXMgb3IgYSBxdWF0ZXJuaW9uLiBJZiB0aGUgZm91cnRoIGFyZ3VtZW50IGlzIHVuZGVmaW5lZFxuICogRXVsZXIgYW5nbGVzIGFyZSBhc3N1bWVkLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBFaXRoZXIgdGhlIHJvdGF0aW9uIGFyb3VuZCB0aGUgeCBheGlzIG9yIHRoZSBtYWduaXR1ZGUgaW4geCBvZiB0aGUgYXhpcyBvZiByb3RhdGlvbi5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IEVpdGhlciB0aGUgcm90YXRpb24gYXJvdW5kIHRoZSB5IGF4aXMgb3IgdGhlIG1hZ25pdHVkZSBpbiB5IG9mIHRoZSBheGlzIG9mIHJvdGF0aW9uLlxuICogQHBhcmFtIHtOdW1iZXJ9IHogRWl0aGVyIHRoZSByb3RhdGlvbiBhcm91bmQgdGhlIHogYXhpcyBvciB0aGUgbWFnbml0dWRlIGluIHogb2YgdGhlIGF4aXMgb2Ygcm90YXRpb24uXG4gKiBAcGFyYW0ge051bWJlcnx1bmRlZmluZWR9IHcgdGhlIGFtb3VudCBvZiByb3RhdGlvbiBhcm91bmQgdGhlIGF4aXMgb2Ygcm90YXRpb24sIGlmIGEgcXVhdGVybmlvbiBpcyBzcGVjaWZpZWQuXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRSb3RhdGlvbiA9IGZ1bmN0aW9uIHNldFJvdGF0aW9uICh4LCB5LCB6LCB3KSB7XG4gICAgdmFyIHF1YXQgPSB0aGlzLnZhbHVlLnZlY3RvcnMucm90YXRpb247XG4gICAgdmFyIHByb3BvZ2F0ZSA9IGZhbHNlO1xuICAgIHZhciBxeCwgcXksIHF6LCBxdztcblxuICAgIGlmICh3ICE9IG51bGwpIHtcbiAgICAgICAgcXggPSB4O1xuICAgICAgICBxeSA9IHk7XG4gICAgICAgIHF6ID0gejtcbiAgICAgICAgcXcgPSB3O1xuICAgICAgICB0aGlzLl9sYXN0RXVsZXJYID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbGFzdEV1bGVyWSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2xhc3RFdWxlclogPSBudWxsO1xuICAgICAgICB0aGlzLl9sYXN0RXVsZXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmICh4ID09IG51bGwgfHwgeSA9PSBudWxsIHx8IHogPT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2xhc3RFdWxlcikge1xuICAgICAgICAgICAgICAgIHggPSB4ID09IG51bGwgPyB0aGlzLl9sYXN0RXVsZXJYIDogeDtcbiAgICAgICAgICAgICAgICB5ID0geSA9PSBudWxsID8gdGhpcy5fbGFzdEV1bGVyWSA6IHk7XG4gICAgICAgICAgICAgICAgeiA9IHogPT0gbnVsbCA/IHRoaXMuX2xhc3RFdWxlclogOiB6O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHNwID0gLTIgKiAocXVhdFsxXSAqIHF1YXRbMl0gLSBxdWF0WzNdICogcXVhdFswXSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoc3ApID4gMC45OTk5OSkge1xuICAgICAgICAgICAgICAgICAgICB5ID0geSA9PSBudWxsID8gTWF0aC5QSSAqIDAuNSAqIHNwIDogeTtcbiAgICAgICAgICAgICAgICAgICAgeCA9IHggPT0gbnVsbCA/IE1hdGguYXRhbjIoLXF1YXRbMF0gKiBxdWF0WzJdICsgcXVhdFszXSAqIHF1YXRbMV0sIDAuNSAtIHF1YXRbMV0gKiBxdWF0WzFdIC0gcXVhdFsyXSAqIHF1YXRbMl0pIDogeDtcbiAgICAgICAgICAgICAgICAgICAgeiA9IHogPT0gbnVsbCA/IDAgOiB6O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgeSA9IHkgPT0gbnVsbCA/IE1hdGguYXNpbihzcCkgOiB5O1xuICAgICAgICAgICAgICAgICAgICB4ID0geCA9PSBudWxsID8gTWF0aC5hdGFuMihxdWF0WzBdICogcXVhdFsyXSArIHF1YXRbM10gKiBxdWF0WzFdLCAwLjUgLSBxdWF0WzBdICogcXVhdFswXSAtIHF1YXRbMV0gKiBxdWF0WzFdKSA6IHg7XG4gICAgICAgICAgICAgICAgICAgIHogPSB6ID09IG51bGwgPyBNYXRoLmF0YW4yKHF1YXRbMF0gKiBxdWF0WzFdICsgcXVhdFszXSAqIHF1YXRbMl0sIDAuNSAtIHF1YXRbMF0gKiBxdWF0WzBdIC0gcXVhdFsyXSAqIHF1YXRbMl0pIDogejtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaHggPSB4ICogMC41O1xuICAgICAgICB2YXIgaHkgPSB5ICogMC41O1xuICAgICAgICB2YXIgaHogPSB6ICogMC41O1xuXG4gICAgICAgIHZhciBzeCA9IE1hdGguc2luKGh4KTtcbiAgICAgICAgdmFyIHN5ID0gTWF0aC5zaW4oaHkpO1xuICAgICAgICB2YXIgc3ogPSBNYXRoLnNpbihoeik7XG4gICAgICAgIHZhciBjeCA9IE1hdGguY29zKGh4KTtcbiAgICAgICAgdmFyIGN5ID0gTWF0aC5jb3MoaHkpO1xuICAgICAgICB2YXIgY3ogPSBNYXRoLmNvcyhoeik7XG5cbiAgICAgICAgdmFyIHN5c3ogPSBzeSAqIHN6O1xuICAgICAgICB2YXIgY3lzeiA9IGN5ICogc3o7XG4gICAgICAgIHZhciBzeWN6ID0gc3kgKiBjejtcbiAgICAgICAgdmFyIGN5Y3ogPSBjeSAqIGN6O1xuXG4gICAgICAgIHF4ID0gc3ggKiBjeWN6ICsgY3ggKiBzeXN6O1xuICAgICAgICBxeSA9IGN4ICogc3ljeiAtIHN4ICogY3lzejtcbiAgICAgICAgcXogPSBjeCAqIGN5c3ogKyBzeCAqIHN5Y3o7XG4gICAgICAgIHF3ID0gY3ggKiBjeWN6IC0gc3ggKiBzeXN6O1xuXG4gICAgICAgIHRoaXMuX2xhc3RFdWxlciA9IHRydWU7XG4gICAgICAgIHRoaXMuX2xhc3RFdWxlclggPSB4O1xuICAgICAgICB0aGlzLl9sYXN0RXVsZXJZID0geTtcbiAgICAgICAgdGhpcy5fbGFzdEV1bGVyWiA9IHo7XG4gICAgfVxuXG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQocXVhdCwgMCwgcXgpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldChxdWF0LCAxLCBxeSkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHF1YXQsIDIsIHF6KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQocXVhdCwgMywgcXcpIHx8IHByb3BvZ2F0ZTtcblxuICAgIGlmIChwcm9wb2dhdGUpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHggPSBxdWF0WzBdO1xuICAgICAgICB5ID0gcXVhdFsxXTtcbiAgICAgICAgeiA9IHF1YXRbMl07XG4gICAgICAgIHcgPSBxdWF0WzNdO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uUm90YXRpb25DaGFuZ2UpIGl0ZW0ub25Sb3RhdGlvbkNoYW5nZSh4LCB5LCB6LCB3KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgc2NhbGUgb2YgdGhlIG5vZGUuIFRoZSBkZWZhdWx0IHZhbHVlIGlzIDEgaW4gYWxsIGRpbWVuc2lvbnMuXG4gKiBUaGUgbm9kZSdzIGNvbXBvbmVudHMgd2lsbCBoYXZlIG9uU2NhbGVDaGFuZ2VkIGNhbGxlZCBvbiB0aGVtLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBTY2FsZSB2YWx1ZSBpbiB4XG4gKiBAcGFyYW0ge051bWJlcn0geSBTY2FsZSB2YWx1ZSBpbiB5XG4gKiBAcGFyYW0ge051bWJlcn0geiBTY2FsZSB2YWx1ZSBpbiB6XG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRTY2FsZSA9IGZ1bmN0aW9uIHNldFNjYWxlICh4LCB5LCB6KSB7XG4gICAgdmFyIHZlYzMgPSB0aGlzLnZhbHVlLnZlY3RvcnMuc2NhbGU7XG4gICAgdmFyIHByb3BvZ2F0ZSA9IGZhbHNlO1xuXG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMCwgeCkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDEsIHkpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAyLCB6KSB8fCBwcm9wb2dhdGU7XG5cbiAgICBpZiAocHJvcG9nYXRlKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciBpdGVtO1xuICAgICAgICB4ID0gdmVjM1swXTtcbiAgICAgICAgeSA9IHZlYzNbMV07XG4gICAgICAgIHogPSB2ZWMzWzJdO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uU2NhbGVDaGFuZ2UpIGl0ZW0ub25TY2FsZUNoYW5nZSh4LCB5LCB6KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgdmFsdWUgb2YgdGhlIG9wYWNpdHkgb2YgdGhpcyBub2RlLiBBbGwgb2YgdGhlIG5vZGUnc1xuICogY29tcG9uZW50cyB3aWxsIGhhdmUgb25PcGFjaXR5Q2hhbmdlIGNhbGxlZCBvbiB0aGVtL1xuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsIFZhbHVlIG9mIHRoZSBvcGFjaXR5LiAxIGlzIHRoZSBkZWZhdWx0LlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuc2V0T3BhY2l0eSA9IGZ1bmN0aW9uIHNldE9wYWNpdHkgKHZhbCkge1xuICAgIGlmICh2YWwgIT09IHRoaXMudmFsdWUuc2hvd1N0YXRlLm9wYWNpdHkpIHtcbiAgICAgICAgdGhpcy52YWx1ZS5zaG93U3RhdGUub3BhY2l0eSA9IHZhbDtcbiAgICAgICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG5cbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25PcGFjaXR5Q2hhbmdlKSBpdGVtLm9uT3BhY2l0eUNoYW5nZSh2YWwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBzaXplIG1vZGUgYmVpbmcgdXNlZCBmb3IgZGV0ZXJtaW5pbmcgdGhlIG5vZGUncyBmaW5hbCB3aWR0aCwgaGVpZ2h0XG4gKiBhbmQgZGVwdGguXG4gKiBTaXplIG1vZGVzIGFyZSBhIHdheSB0byBkZWZpbmUgdGhlIHdheSB0aGUgbm9kZSdzIHNpemUgaXMgYmVpbmcgY2FsY3VsYXRlZC5cbiAqIFNpemUgbW9kZXMgYXJlIGVudW1zIHNldCBvbiB0aGUge0BsaW5rIFNpemV9IGNvbnN0cnVjdG9yIChhbmQgYWxpYXNlZCBvblxuICogdGhlIE5vZGUpLlxuICpcbiAqIEBleGFtcGxlXG4gKiBub2RlLnNldFNpemVNb2RlKE5vZGUuUkVMQVRJVkVfU0laRSwgTm9kZS5BQlNPTFVURV9TSVpFLCBOb2RlLkFCU09MVVRFX1NJWkUpO1xuICogLy8gSW5zdGVhZCBvZiBudWxsLCBhbnkgcHJvcG9ydGlvbmFsIGhlaWdodCBvciBkZXB0aCBjYW4gYmUgcGFzc2VkIGluLCBzaW5jZVxuICogLy8gaXQgd291bGQgYmUgaWdub3JlZCBpbiBhbnkgY2FzZS5cbiAqIG5vZGUuc2V0UHJvcG9ydGlvbmFsU2l6ZSgwLjUsIG51bGwsIG51bGwpO1xuICogbm9kZS5zZXRBYnNvbHV0ZVNpemUobnVsbCwgMTAwLCAyMDApO1xuICpcbiAqIEBtZXRob2Qgc2V0U2l6ZU1vZGVcbiAqXG4gKiBAcGFyYW0ge1NpemVNb2RlfSB4ICAgIFRoZSBzaXplIG1vZGUgYmVpbmcgdXNlZCBmb3IgZGV0ZXJtaW5pbmcgdGhlIHNpemUgaW5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgeCBkaXJlY3Rpb24gKFwid2lkdGhcIikuXG4gKiBAcGFyYW0ge1NpemVNb2RlfSB5ICAgIFRoZSBzaXplIG1vZGUgYmVpbmcgdXNlZCBmb3IgZGV0ZXJtaW5pbmcgdGhlIHNpemUgaW5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgeSBkaXJlY3Rpb24gKFwiaGVpZ2h0XCIpLlxuICogQHBhcmFtIHtTaXplTW9kZX0geiAgICBUaGUgc2l6ZSBtb2RlIGJlaW5nIHVzZWQgZm9yIGRldGVybWluaW5nIHRoZSBzaXplIGluXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIHogZGlyZWN0aW9uIChcImRlcHRoXCIpLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuc2V0U2l6ZU1vZGUgPSBmdW5jdGlvbiBzZXRTaXplTW9kZSAoeCwgeSwgeikge1xuICAgIHZhciB2ZWMzID0gdGhpcy52YWx1ZS5zaXplLnNpemVNb2RlO1xuICAgIHZhciBwcm9wb2dhdGUgPSBmYWxzZTtcblxuICAgIGlmICh4ICE9IG51bGwpIHByb3BvZ2F0ZSA9IHRoaXMuX3Jlc29sdmVTaXplTW9kZSh2ZWMzLCAwLCB4KSB8fCBwcm9wb2dhdGU7XG4gICAgaWYgKHkgIT0gbnVsbCkgcHJvcG9nYXRlID0gdGhpcy5fcmVzb2x2ZVNpemVNb2RlKHZlYzMsIDEsIHkpIHx8IHByb3BvZ2F0ZTtcbiAgICBpZiAoeiAhPSBudWxsKSBwcm9wb2dhdGUgPSB0aGlzLl9yZXNvbHZlU2l6ZU1vZGUodmVjMywgMiwgeikgfHwgcHJvcG9nYXRlO1xuXG4gICAgaWYgKHByb3BvZ2F0ZSkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgeCA9IHZlYzNbMF07XG4gICAgICAgIHkgPSB2ZWMzWzFdO1xuICAgICAgICB6ID0gdmVjM1syXTtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblNpemVNb2RlQ2hhbmdlKSBpdGVtLm9uU2l6ZU1vZGVDaGFuZ2UoeCwgeSwgeik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEEgcHJvdGVjdGVkIG1ldGhvZCB0aGF0IHJlc29sdmVzIHN0cmluZyByZXByZXNlbnRhdGlvbnMgb2Ygc2l6ZSBtb2RlXG4gKiB0byBudW1lcmljIHZhbHVlcyBhbmQgYXBwbGllcyB0aGVtLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2ZWMgdGhlIGFycmF5IHRvIHdyaXRlIHNpemUgbW9kZSB0b1xuICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IHRoZSBpbmRleCB0byB3cml0ZSB0byBpbiB0aGUgYXJyYXlcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsIHRoZSB2YWx1ZSB0byB3cml0ZVxuICpcbiAqIEByZXR1cm4ge0Jvb2x9IHdoZXRoZXIgb3Igbm90IHRoZSBzaXplbW9kZSBoYXMgYmVlbiBjaGFuZ2VkIGZvciB0aGlzIGluZGV4LlxuICovXG5Ob2RlLnByb3RvdHlwZS5fcmVzb2x2ZVNpemVNb2RlID0gZnVuY3Rpb24gX3Jlc29sdmVTaXplTW9kZSAodmVjLCBpbmRleCwgdmFsKSB7XG4gICAgaWYgKHZhbC5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nKSB7XG4gICAgICAgIHN3aXRjaCAodmFsLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgIGNhc2UgJ3JlbGF0aXZlJzpcbiAgICAgICAgICAgIGNhc2UgJ2RlZmF1bHQnOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMsIGluZGV4LCAwKTtcbiAgICAgICAgICAgIGNhc2UgJ2Fic29sdXRlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjLCBpbmRleCwgMSk7XG4gICAgICAgICAgICBjYXNlICdyZW5kZXInOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMsIGluZGV4LCAyKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcigndW5rbm93biBzaXplIG1vZGU6ICcgKyB2YWwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgcmV0dXJuIHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYywgaW5kZXgsIHZhbCk7XG59O1xuXG4vKipcbiAqIEEgcHJvcG9ydGlvbmFsIHNpemUgZGVmaW5lcyB0aGUgbm9kZSdzIGRpbWVuc2lvbnMgcmVsYXRpdmUgdG8gaXRzIHBhcmVudHNcbiAqIGZpbmFsIHNpemUuXG4gKiBQcm9wb3J0aW9uYWwgc2l6ZXMgbmVlZCB0byBiZSB3aXRoaW4gdGhlIHJhbmdlIG9mIFswLCAxXS5cbiAqXG4gKiBAbWV0aG9kIHNldFByb3BvcnRpb25hbFNpemVcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCAgICB4LVNpemUgaW4gcGl4ZWxzIChcIndpZHRoXCIpLlxuICogQHBhcmFtIHtOdW1iZXJ9IHkgICAgeS1TaXplIGluIHBpeGVscyAoXCJoZWlnaHRcIikuXG4gKiBAcGFyYW0ge051bWJlcn0geiAgICB6LVNpemUgaW4gcGl4ZWxzIChcImRlcHRoXCIpLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuc2V0UHJvcG9ydGlvbmFsU2l6ZSA9IGZ1bmN0aW9uIHNldFByb3BvcnRpb25hbFNpemUgKHgsIHksIHopIHtcbiAgICB2YXIgdmVjMyA9IHRoaXMudmFsdWUuc2l6ZS5wcm9wb3J0aW9uYWw7XG4gICAgdmFyIHByb3BvZ2F0ZSA9IGZhbHNlO1xuXG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMCwgeCkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDEsIHkpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAyLCB6KSB8fCBwcm9wb2dhdGU7XG5cbiAgICBpZiAocHJvcG9nYXRlKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciBpdGVtO1xuICAgICAgICB4ID0gdmVjM1swXTtcbiAgICAgICAgeSA9IHZlYzNbMV07XG4gICAgICAgIHogPSB2ZWMzWzJdO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uUHJvcG9ydGlvbmFsU2l6ZUNoYW5nZSkgaXRlbS5vblByb3BvcnRpb25hbFNpemVDaGFuZ2UoeCwgeSwgeik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIERpZmZlcmVudGlhbCBzaXppbmcgY2FuIGJlIHVzZWQgdG8gYWRkIG9yIHN1YnRyYWN0IGFuIGFic29sdXRlIHNpemUgZnJvbSBhblxuICogb3RoZXJ3aXNlIHByb3BvcnRpb25hbGx5IHNpemVkIG5vZGUuXG4gKiBFLmcuIGEgZGlmZmVyZW50aWFsIHdpZHRoIG9mIGAtMTBgIGFuZCBhIHByb3BvcnRpb25hbCB3aWR0aCBvZiBgMC41YCBpc1xuICogYmVpbmcgaW50ZXJwcmV0ZWQgYXMgc2V0dGluZyB0aGUgbm9kZSdzIHNpemUgdG8gNTAlIG9mIGl0cyBwYXJlbnQncyB3aWR0aFxuICogKm1pbnVzKiAxMCBwaXhlbHMuXG4gKlxuICogQG1ldGhvZCBzZXREaWZmZXJlbnRpYWxTaXplXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggICAgeC1TaXplIHRvIGJlIGFkZGVkIHRvIHRoZSByZWxhdGl2ZWx5IHNpemVkIG5vZGUgaW5cbiAqICAgICAgICAgICAgICAgICAgICAgIHBpeGVscyAoXCJ3aWR0aFwiKS5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5ICAgIHktU2l6ZSB0byBiZSBhZGRlZCB0byB0aGUgcmVsYXRpdmVseSBzaXplZCBub2RlIGluXG4gKiAgICAgICAgICAgICAgICAgICAgICBwaXhlbHMgKFwiaGVpZ2h0XCIpLlxuICogQHBhcmFtIHtOdW1iZXJ9IHogICAgei1TaXplIHRvIGJlIGFkZGVkIHRvIHRoZSByZWxhdGl2ZWx5IHNpemVkIG5vZGUgaW5cbiAqICAgICAgICAgICAgICAgICAgICAgIHBpeGVscyAoXCJkZXB0aFwiKS5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldERpZmZlcmVudGlhbFNpemUgPSBmdW5jdGlvbiBzZXREaWZmZXJlbnRpYWxTaXplICh4LCB5LCB6KSB7XG4gICAgdmFyIHZlYzMgPSB0aGlzLnZhbHVlLnNpemUuZGlmZmVyZW50aWFsO1xuICAgIHZhciBwcm9wb2dhdGUgPSBmYWxzZTtcblxuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDAsIHgpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAxLCB5KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMiwgeikgfHwgcHJvcG9nYXRlO1xuXG4gICAgaWYgKHByb3BvZ2F0ZSkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgeCA9IHZlYzNbMF07XG4gICAgICAgIHkgPSB2ZWMzWzFdO1xuICAgICAgICB6ID0gdmVjM1syXTtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vbkRpZmZlcmVudGlhbFNpemVDaGFuZ2UpIGl0ZW0ub25EaWZmZXJlbnRpYWxTaXplQ2hhbmdlKHgsIHksIHopO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBub2RlJ3Mgc2l6ZSBpbiBwaXhlbHMsIGluZGVwZW5kZW50IG9mIGl0cyBwYXJlbnQuXG4gKlxuICogQG1ldGhvZCBzZXRBYnNvbHV0ZVNpemVcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCAgICB4LVNpemUgaW4gcGl4ZWxzIChcIndpZHRoXCIpLlxuICogQHBhcmFtIHtOdW1iZXJ9IHkgICAgeS1TaXplIGluIHBpeGVscyAoXCJoZWlnaHRcIikuXG4gKiBAcGFyYW0ge051bWJlcn0geiAgICB6LVNpemUgaW4gcGl4ZWxzIChcImRlcHRoXCIpLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuc2V0QWJzb2x1dGVTaXplID0gZnVuY3Rpb24gc2V0QWJzb2x1dGVTaXplICh4LCB5LCB6KSB7XG4gICAgdmFyIHZlYzMgPSB0aGlzLnZhbHVlLnNpemUuYWJzb2x1dGU7XG4gICAgdmFyIHByb3BvZ2F0ZSA9IGZhbHNlO1xuXG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMCwgeCkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDEsIHkpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAyLCB6KSB8fCBwcm9wb2dhdGU7XG5cbiAgICBpZiAocHJvcG9nYXRlKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciBpdGVtO1xuICAgICAgICB4ID0gdmVjM1swXTtcbiAgICAgICAgeSA9IHZlYzNbMV07XG4gICAgICAgIHogPSB2ZWMzWzJdO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uQWJzb2x1dGVTaXplQ2hhbmdlKSBpdGVtLm9uQWJzb2x1dGVTaXplQ2hhbmdlKHgsIHksIHopO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBQcml2YXRlIG1ldGhvZCBmb3IgYWxlcnRpbmcgYWxsIGNvbXBvbmVudHMgYW5kIGNoaWxkcmVuIHRoYXRcbiAqIHRoaXMgbm9kZSdzIHRyYW5zZm9ybSBoYXMgY2hhbmdlZC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtGbG9hdDMyQXJyYXl9IHRyYW5zZm9ybSBUaGUgdHJhbnNmb3JtIHRoYXQgaGFzIGNoYW5nZWRcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Ob2RlLnByb3RvdHlwZS5fdHJhbnNmb3JtQ2hhbmdlZCA9IGZ1bmN0aW9uIF90cmFuc2Zvcm1DaGFuZ2VkICh0cmFuc2Zvcm0pIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGl0ZW1zID0gdGhpcy5fY29tcG9uZW50cztcbiAgICB2YXIgbGVuID0gaXRlbXMubGVuZ3RoO1xuICAgIHZhciBpdGVtO1xuXG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uVHJhbnNmb3JtQ2hhbmdlKSBpdGVtLm9uVHJhbnNmb3JtQ2hhbmdlKHRyYW5zZm9ybSk7XG4gICAgfVxuXG4gICAgaSA9IDA7XG4gICAgaXRlbXMgPSB0aGlzLl9jaGlsZHJlbjtcbiAgICBsZW4gPSBpdGVtcy5sZW5ndGg7XG5cbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25QYXJlbnRUcmFuc2Zvcm1DaGFuZ2UpIGl0ZW0ub25QYXJlbnRUcmFuc2Zvcm1DaGFuZ2UodHJhbnNmb3JtKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFByaXZhdGUgbWV0aG9kIGZvciBhbGVydGluZyBhbGwgY29tcG9uZW50cyBhbmQgY2hpbGRyZW4gdGhhdFxuICogdGhpcyBub2RlJ3Mgc2l6ZSBoYXMgY2hhbmdlZC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtGbG9hdDMyQXJyYXl9IHNpemUgdGhlIHNpemUgdGhhdCBoYXMgY2hhbmdlZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLl9zaXplQ2hhbmdlZCA9IGZ1bmN0aW9uIF9zaXplQ2hhbmdlZCAoc2l6ZSkge1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgaXRlbXMgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgIHZhciBsZW4gPSBpdGVtcy5sZW5ndGg7XG4gICAgdmFyIGl0ZW07XG5cbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25TaXplQ2hhbmdlKSBpdGVtLm9uU2l6ZUNoYW5nZShzaXplKTtcbiAgICB9XG5cbiAgICBpID0gMDtcbiAgICBpdGVtcyA9IHRoaXMuX2NoaWxkcmVuO1xuICAgIGxlbiA9IGl0ZW1zLmxlbmd0aDtcblxuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblBhcmVudFNpemVDaGFuZ2UpIGl0ZW0ub25QYXJlbnRTaXplQ2hhbmdlKHNpemUpO1xuICAgIH1cbn07XG5cbi8qKlxuICogTWV0aG9kIGZvciBnZXR0aW5nIHRoZSBjdXJyZW50IGZyYW1lLiBXaWxsIGJlIGRlcHJlY2F0ZWQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gY3VycmVudCBmcmFtZVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRGcmFtZSA9IGZ1bmN0aW9uIGdldEZyYW1lICgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2xvYmFsVXBkYXRlci5nZXRGcmFtZSgpO1xufTtcblxuLyoqXG4gKiByZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBjb21wb25lbnRzIGN1cnJlbnRseSBhdHRhY2hlZCB0byB0aGlzXG4gKiBub2RlLlxuICpcbiAqIEBtZXRob2QgZ2V0Q29tcG9uZW50c1xuICpcbiAqIEByZXR1cm4ge0FycmF5fSBsaXN0IG9mIGNvbXBvbmVudHMuXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldENvbXBvbmVudHMgPSBmdW5jdGlvbiBnZXRDb21wb25lbnRzICgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50cztcbn07XG5cbi8qKlxuICogRW50ZXJzIHRoZSBub2RlJ3MgdXBkYXRlIHBoYXNlIHdoaWxlIHVwZGF0aW5nIGl0cyBvd24gc3BlYyBhbmQgdXBkYXRpbmcgaXRzIGNvbXBvbmVudHMuXG4gKlxuICogQG1ldGhvZCB1cGRhdGVcbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHRpbWUgICAgaGlnaC1yZXNvbHV0aW9uIHRpbWVzdGFtcCwgdXN1YWxseSByZXRyaWV2ZWQgdXNpbmdcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSAodGltZSl7XG4gICAgdGhpcy5faW5VcGRhdGUgPSB0cnVlO1xuICAgIHZhciBuZXh0UXVldWUgPSB0aGlzLl9uZXh0VXBkYXRlUXVldWU7XG4gICAgdmFyIHF1ZXVlID0gdGhpcy5fdXBkYXRlUXVldWU7XG4gICAgdmFyIGl0ZW07XG5cbiAgICB3aGlsZSAobmV4dFF1ZXVlLmxlbmd0aCkgcXVldWUudW5zaGlmdChuZXh0UXVldWUucG9wKCkpO1xuXG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBpdGVtID0gdGhpcy5fY29tcG9uZW50c1txdWV1ZS5zaGlmdCgpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblVwZGF0ZSkgaXRlbS5vblVwZGF0ZSh0aW1lKTtcbiAgICB9XG5cbiAgICB2YXIgbXlTaXplID0gdGhpcy5nZXRTaXplKCk7XG4gICAgdmFyIG15VHJhbnNmb3JtID0gdGhpcy5nZXRUcmFuc2Zvcm0oKTtcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5nZXRQYXJlbnQoKTtcbiAgICB2YXIgcGFyZW50U2l6ZSA9IHBhcmVudC5nZXRTaXplKCk7XG4gICAgdmFyIHBhcmVudFRyYW5zZm9ybSA9IHBhcmVudC5nZXRUcmFuc2Zvcm0oKTtcbiAgICB2YXIgc2l6ZUNoYW5nZWQgPSBTSVpFX1BST0NFU1NPUi5mcm9tU3BlY1dpdGhQYXJlbnQocGFyZW50U2l6ZSwgdGhpcywgbXlTaXplKTtcblxuICAgIHZhciB0cmFuc2Zvcm1DaGFuZ2VkID0gVFJBTlNGT1JNX1BST0NFU1NPUi5mcm9tU3BlY1dpdGhQYXJlbnQocGFyZW50VHJhbnNmb3JtLCB0aGlzLnZhbHVlLCBteVNpemUsIHBhcmVudFNpemUsIG15VHJhbnNmb3JtKTtcbiAgICBpZiAodHJhbnNmb3JtQ2hhbmdlZCkgdGhpcy5fdHJhbnNmb3JtQ2hhbmdlZChteVRyYW5zZm9ybSk7XG4gICAgaWYgKHNpemVDaGFuZ2VkKSB0aGlzLl9zaXplQ2hhbmdlZChteVNpemUpO1xuXG4gICAgdGhpcy5faW5VcGRhdGUgPSBmYWxzZTtcbiAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gZmFsc2U7XG5cbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgICAgLy8gbGFzdCB1cGRhdGVcbiAgICAgICAgdGhpcy5fcGFyZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy52YWx1ZS5sb2NhdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX2dsb2JhbFVwZGF0ZXIgPSBudWxsO1xuICAgIH1cbiAgICBlbHNlIGlmICh0aGlzLl9uZXh0VXBkYXRlUXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuX2dsb2JhbFVwZGF0ZXIucmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2sodGhpcyk7XG4gICAgICAgIHRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTW91bnRzIHRoZSBub2RlIGFuZCB0aGVyZWZvcmUgaXRzIHN1YnRyZWUgYnkgc2V0dGluZyBpdCBhcyBhIGNoaWxkIG9mIHRoZVxuICogcGFzc2VkIGluIHBhcmVudC5cbiAqXG4gKiBAbWV0aG9kIG1vdW50XG4gKlxuICogQHBhcmFtICB7Tm9kZX0gcGFyZW50ICAgIHBhcmVudCBub2RlXG4gKiBAcGFyYW0gIHtTdHJpbmd9IG15SWQgICAgcGF0aCB0byBub2RlIChlLmcuIGBib2R5LzAvMWApXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5tb3VudCA9IGZ1bmN0aW9uIG1vdW50IChwYXJlbnQsIG15SWQpIHtcbiAgICBpZiAodGhpcy5pc01vdW50ZWQoKSkgcmV0dXJuIHRoaXM7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgdmFyIGl0ZW07XG5cbiAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5fZ2xvYmFsVXBkYXRlciA9IHBhcmVudC5nZXRVcGRhdGVyKCk7XG4gICAgdGhpcy52YWx1ZS5sb2NhdGlvbiA9IG15SWQ7XG4gICAgdGhpcy52YWx1ZS5zaG93U3RhdGUubW91bnRlZCA9IHRydWU7XG5cbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vbk1vdW50KSBpdGVtLm9uTW91bnQodGhpcywgaSk7XG4gICAgfVxuXG4gICAgaSA9IDA7XG4gICAgbGlzdCA9IHRoaXMuX2NoaWxkcmVuO1xuICAgIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uUGFyZW50TW91bnQpIGl0ZW0ub25QYXJlbnRNb3VudCh0aGlzLCBteUlkLCBpKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUodHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIERpc21vdW50cyAoZGV0YWNoZXMpIHRoZSBub2RlIGZyb20gdGhlIHNjZW5lIGdyYXBoIGJ5IHJlbW92aW5nIGl0IGFzIGFcbiAqIGNoaWxkIG9mIGl0cyBwYXJlbnQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuZGlzbW91bnQgPSBmdW5jdGlvbiBkaXNtb3VudCAoKSB7XG4gICAgaWYgKCF0aGlzLmlzTW91bnRlZCgpKSByZXR1cm4gdGhpcztcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICB2YXIgaXRlbTtcblxuICAgIHRoaXMudmFsdWUuc2hvd1N0YXRlLm1vdW50ZWQgPSBmYWxzZTtcblxuICAgIHRoaXMuX3BhcmVudC5yZW1vdmVDaGlsZCh0aGlzKTtcblxuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uRGlzbW91bnQpIGl0ZW0ub25EaXNtb3VudCgpO1xuICAgIH1cblxuICAgIGkgPSAwO1xuICAgIGxpc3QgPSB0aGlzLl9jaGlsZHJlbjtcbiAgICBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblBhcmVudERpc21vdW50KSBpdGVtLm9uUGFyZW50RGlzbW91bnQoKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYmUgaW52b2tlZCBieSB0aGUgcGFyZW50IGFzIHNvb24gYXMgdGhlIHBhcmVudCBpc1xuICogYmVpbmcgbW91bnRlZC5cbiAqXG4gKiBAbWV0aG9kIG9uUGFyZW50TW91bnRcbiAqXG4gKiBAcGFyYW0gIHtOb2RlfSBwYXJlbnQgICAgICAgIFRoZSBwYXJlbnQgbm9kZS5cbiAqIEBwYXJhbSAge1N0cmluZ30gcGFyZW50SWQgICAgVGhlIHBhcmVudCBpZCAocGF0aCB0byBwYXJlbnQpLlxuICogQHBhcmFtICB7TnVtYmVyfSBpbmRleCAgICAgICBJZCB0aGUgbm9kZSBzaG91bGQgYmUgbW91bnRlZCB0by5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uUGFyZW50TW91bnQgPSBmdW5jdGlvbiBvblBhcmVudE1vdW50IChwYXJlbnQsIHBhcmVudElkLCBpbmRleCkge1xuICAgIHJldHVybiB0aGlzLm1vdW50KHBhcmVudCwgcGFyZW50SWQgKyAnLycgKyBpbmRleCk7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYnkgdGhlIHBhcmVudCBhcyBzb29uIGFzIHRoZSBwYXJlbnQgaXMgYmVpbmdcbiAqIHVubW91bnRlZC5cbiAqXG4gKiBAbWV0aG9kIG9uUGFyZW50RGlzbW91bnRcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uUGFyZW50RGlzbW91bnQgPSBmdW5jdGlvbiBvblBhcmVudERpc21vdW50ICgpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNtb3VudCgpO1xufTtcblxuLyoqXG4gKiBNZXRob2QgdG8gYmUgY2FsbGVkIGluIG9yZGVyIHRvIGRpc3BhdGNoIGFuIGV2ZW50IHRvIHRoZSBub2RlIGFuZCBhbGwgaXRzXG4gKiBjb21wb25lbnRzLiBOb3RlIHRoYXQgdGhpcyBkb2Vzbid0IHJlY3Vyc2UgdGhlIHN1YnRyZWUuXG4gKlxuICogQG1ldGhvZCByZWNlaXZlXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSB0eXBlICAgVGhlIGV2ZW50IHR5cGUgKGUuZy4gXCJjbGlja1wiKS5cbiAqIEBwYXJhbSAge09iamVjdH0gZXYgICAgIFRoZSBldmVudCBwYXlsb2FkIG9iamVjdCB0byBiZSBkaXNwYXRjaGVkLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUucmVjZWl2ZSA9IGZ1bmN0aW9uIHJlY2VpdmUgKHR5cGUsIGV2KSB7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgdmFyIGl0ZW07XG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25SZWNlaXZlKSBpdGVtLm9uUmVjZWl2ZSh0eXBlLCBldik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuXG4vKipcbiAqIFByaXZhdGUgbWV0aG9kIHRvIGF2b2lkIGFjY2lkZW50YWxseSBwYXNzaW5nIGFyZ3VtZW50c1xuICogdG8gdXBkYXRlIGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuTm9kZS5wcm90b3R5cGUuX3JlcXVlc3RVcGRhdGVXaXRob3V0QXJncyA9IGZ1bmN0aW9uIF9yZXF1ZXN0VXBkYXRlV2l0aG91dEFyZ3MgKCkge1xuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xufTtcblxuLyoqXG4gKiBBIG1ldGhvZCB0byBleGVjdXRlIGxvZ2ljIG9uIHVwZGF0ZS4gRGVmYXVsdHMgdG8gdGhlXG4gKiBub2RlJ3MgLnVwZGF0ZSBtZXRob2QuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBjdXJyZW50IHRpbWVcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Ob2RlLnByb3RvdHlwZS5vblVwZGF0ZSA9IE5vZGUucHJvdG90eXBlLnVwZGF0ZTtcblxuLyoqXG4gKiBBIG1ldGhvZCB0byBleGVjdXRlIGxvZ2ljIHdoZW4gYSBwYXJlbnQgbm9kZSBpcyBzaG93bi4gRGVsZWdhdGVzXG4gKiB0byBOb2RlLnNob3cuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUub25QYXJlbnRTaG93ID0gTm9kZS5wcm90b3R5cGUuc2hvdztcblxuLyoqXG4gKiBBIG1ldGhvZCB0byBleGVjdXRlIGxvZ2ljIHdoZW4gdGhlIHBhcmVudCBpcyBoaWRkZW4uIERlbGVnYXRlc1xuICogdG8gTm9kZS5oaWRlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uUGFyZW50SGlkZSA9IE5vZGUucHJvdG90eXBlLmhpZGU7XG5cbi8qKlxuICogQSBtZXRob2QgdG8gZXhlY3V0ZSBsb2dpYyB3aGVuIHRoZSBwYXJlbnQgdHJhbnNmb3JtIGNoYW5nZXMuXG4gKiBEZWxlZ2F0ZXMgdG8gTm9kZS5fcmVxdWVzdFVwZGF0ZVdpdGhvdXRBcmdzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Ob2RlLnByb3RvdHlwZS5vblBhcmVudFRyYW5zZm9ybUNoYW5nZSA9IE5vZGUucHJvdG90eXBlLl9yZXF1ZXN0VXBkYXRlV2l0aG91dEFyZ3M7XG5cbi8qKlxuICogQSBtZXRob2QgdG8gZXhlY3V0ZSBsb2dpYyB3aGVuIHRoZSBwYXJlbnQgc2l6ZSBjaGFuZ2VzLlxuICogRGVsZWdhdGVzIHRvIE5vZGUuX3JlcXVlc3RVcGRhdGVXSXRob3V0QXJncy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuTm9kZS5wcm90b3R5cGUub25QYXJlbnRTaXplQ2hhbmdlID0gTm9kZS5wcm90b3R5cGUuX3JlcXVlc3RVcGRhdGVXaXRob3V0QXJncztcblxuLyoqXG4gKiBBIG1ldGhvZCB0byBleGVjdXRlIGxvZ2ljIHdoZW4gdGhlIG5vZGUgc29tZXRoaW5nIHdhbnRzXG4gKiB0byBzaG93IHRoZSBub2RlLiBEZWxlZ2F0ZXMgdG8gTm9kZS5zaG93LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uU2hvdyA9IE5vZGUucHJvdG90eXBlLnNob3c7XG5cbi8qKlxuICogQSBtZXRob2QgdG8gZXhlY3V0ZSBsb2dpYyB3aGVuIHNvbWV0aGluZyB3YW50cyB0byBoaWRlIHRoaXNcbiAqIG5vZGUuIERlbGVnYXRlcyB0byBOb2RlLmhpZGUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUub25IaWRlID0gTm9kZS5wcm90b3R5cGUuaGlkZTtcblxuLyoqXG4gKiBBIG1ldGhvZCB3aGljaCBjYW4gZXhlY3V0ZSBsb2dpYyB3aGVuIHRoaXMgbm9kZSBpcyBhZGRlZCB0b1xuICogdG8gdGhlIHNjZW5lIGdyYXBoLiBEZWxlZ2F0ZXMgdG8gbW91bnQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUub25Nb3VudCA9IE5vZGUucHJvdG90eXBlLm1vdW50O1xuXG4vKipcbiAqIEEgbWV0aG9kIHdoaWNoIGNhbiBleGVjdXRlIGxvZ2ljIHdoZW4gdGhpcyBub2RlIGlzIHJlbW92ZWQgZnJvbVxuICogdGhlIHNjZW5lIGdyYXBoLiBEZWxlZ2F0ZXMgdG8gTm9kZS5kaXNtb3VudC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5vbkRpc21vdW50ID0gTm9kZS5wcm90b3R5cGUuZGlzbW91bnQ7XG5cbi8qKlxuICogQSBtZXRob2Qgd2hpY2ggY2FuIGV4ZWN1dGUgbG9naWMgd2hlbiB0aGlzIG5vZGUgcmVjZWl2ZXNcbiAqIGFuIGV2ZW50IGZyb20gdGhlIHNjZW5lIGdyYXBoLiBEZWxlZ2F0ZXMgdG8gTm9kZS5yZWNlaXZlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgbmFtZVxuICogQHBhcmFtIHtPYmplY3R9IHBheWxvYWRcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Ob2RlLnByb3RvdHlwZS5vblJlY2VpdmUgPSBOb2RlLnByb3RvdHlwZS5yZWNlaXZlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5vZGU7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4vKmpzaGludCAtVzA3OSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBEaXNwYXRjaCA9IHJlcXVpcmUoJy4vRGlzcGF0Y2gnKTtcbnZhciBOb2RlID0gcmVxdWlyZSgnLi9Ob2RlJyk7XG52YXIgU2l6ZSA9IHJlcXVpcmUoJy4vU2l6ZScpO1xuXG4vKipcbiAqIFNjZW5lIGlzIHRoZSBib3R0b20gb2YgdGhlIHNjZW5lIGdyYXBoLiBJdCBpcyBpdHMgb3duXG4gKiBwYXJlbnQgYW5kIHByb3ZpZGVzIHRoZSBnbG9iYWwgdXBkYXRlciB0byB0aGUgc2NlbmUgZ3JhcGguXG4gKlxuICogQGNsYXNzIFNjZW5lXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgYSBzdHJpbmcgd2hpY2ggaXMgYSBkb20gc2VsZWN0b3JcbiAqICAgICAgICAgICAgICAgICBzaWduaWZ5aW5nIHdoaWNoIGRvbSBlbGVtZW50IHRoZSBjb250ZXh0XG4gKiAgICAgICAgICAgICAgICAgc2hvdWxkIGJlIHNldCB1cG9uXG4gKiBAcGFyYW0ge0ZhbW91c30gdXBkYXRlciBhIGNsYXNzIHdoaWNoIGNvbmZvcm1zIHRvIEZhbW91cycgaW50ZXJmYWNlXG4gKiAgICAgICAgICAgICAgICAgaXQgbmVlZHMgdG8gYmUgYWJsZSB0byBzZW5kIG1ldGhvZHMgdG9cbiAqICAgICAgICAgICAgICAgICB0aGUgcmVuZGVyZXJzIGFuZCB1cGRhdGUgbm9kZXMgaW4gdGhlIHNjZW5lIGdyYXBoXG4gKi9cbmZ1bmN0aW9uIFNjZW5lIChzZWxlY3RvciwgdXBkYXRlcikge1xuICAgIGlmICghc2VsZWN0b3IpIHRocm93IG5ldyBFcnJvcignU2NlbmUgbmVlZHMgdG8gYmUgY3JlYXRlZCB3aXRoIGEgRE9NIHNlbGVjdG9yJyk7XG4gICAgaWYgKCF1cGRhdGVyKSB0aHJvdyBuZXcgRXJyb3IoJ1NjZW5lIG5lZWRzIHRvIGJlIGNyZWF0ZWQgd2l0aCBhIGNsYXNzIGxpa2UgRmFtb3VzJyk7XG5cbiAgICBOb2RlLmNhbGwodGhpcyk7ICAgICAgICAgLy8gU2NlbmUgaW5oZXJpdHMgZnJvbSBub2RlXG5cbiAgICB0aGlzLl91cGRhdGVyID0gdXBkYXRlcjsgLy8gVGhlIHVwZGF0ZXIgdGhhdCB3aWxsIGJvdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VuZCBtZXNzYWdlcyB0byB0aGUgcmVuZGVyZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuZCB1cGRhdGUgZGlydHkgbm9kZXNcblxuICAgIHRoaXMuX2Rpc3BhdGNoID0gbmV3IERpc3BhdGNoKHRoaXMpOyAvLyBpbnN0YW50aWF0ZXMgYSBkaXNwYXRjaGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvIHNlbmQgZXZlbnRzIHRvIHRoZSBzY2VuZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBncmFwaCBiZWxvdyB0aGlzIGNvbnRleHRcblxuICAgIHRoaXMuX3NlbGVjdG9yID0gc2VsZWN0b3I7IC8vIHJlZmVyZW5jZSB0byB0aGUgRE9NIHNlbGVjdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhhdCByZXByZXNlbnRzIHRoZSBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIGRvbSB0aGF0IHRoaXMgY29udGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluaGFiaXRzXG5cbiAgICB0aGlzLm9uTW91bnQodGhpcywgc2VsZWN0b3IpOyAvLyBNb3VudCB0aGUgY29udGV4dCB0byBpdHNlbGZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAoaXQgaXMgaXRzIG93biBwYXJlbnQpXG5cbiAgICB0aGlzLl91cGRhdGVyICAgICAgICAgICAgICAgICAgLy8gbWVzc2FnZSBhIHJlcXVlc3QgZm9yIHRoZSBkb21cbiAgICAgICAgLm1lc3NhZ2UoJ05FRURfU0laRV9GT1InKSAgLy8gc2l6ZSBvZiB0aGUgY29udGV4dCBzbyB0aGF0XG4gICAgICAgIC5tZXNzYWdlKHNlbGVjdG9yKTsgICAgICAgIC8vIHRoZSBzY2VuZSBncmFwaCBoYXMgYSB0b3RhbCBzaXplXG5cbiAgICB0aGlzLnNob3coKTsgLy8gdGhlIGNvbnRleHQgYmVnaW5zIHNob3duIChpdCdzIGFscmVhZHkgcHJlc2VudCBpbiB0aGUgZG9tKVxuXG59XG5cbi8vIFNjZW5lIGluaGVyaXRzIGZyb20gbm9kZVxuU2NlbmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShOb2RlLnByb3RvdHlwZSk7XG5TY2VuZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTY2VuZTtcblxuLyoqXG4gKiBTY2VuZSBnZXRVcGRhdGVyIGZ1bmN0aW9uIHJldHVybnMgdGhlIHBhc3NlZCBpbiB1cGRhdGVyXG4gKlxuICogQHJldHVybiB7RmFtb3VzfSB0aGUgdXBkYXRlciBmb3IgdGhpcyBTY2VuZVxuICovXG5TY2VuZS5wcm90b3R5cGUuZ2V0VXBkYXRlciA9IGZ1bmN0aW9uIGdldFVwZGF0ZXIgKCkge1xuICAgIHJldHVybiB0aGlzLl91cGRhdGVyO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBzZWxlY3RvciB0aGF0IHRoZSBjb250ZXh0IHdhcyBpbnN0YW50aWF0ZWQgd2l0aFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gZG9tIHNlbGVjdG9yXG4gKi9cblNjZW5lLnByb3RvdHlwZS5nZXRTZWxlY3RvciA9IGZ1bmN0aW9uIGdldFNlbGVjdG9yICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0b3I7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGRpc3BhdGNoZXIgb2YgdGhlIGNvbnRleHQuIFVzZWQgdG8gc2VuZCBldmVudHNcbiAqIHRvIHRoZSBub2RlcyBpbiB0aGUgc2NlbmUgZ3JhcGguXG4gKlxuICogQHJldHVybiB7RGlzcGF0Y2h9IHRoZSBTY2VuZSdzIERpc3BhdGNoXG4gKi9cblNjZW5lLnByb3RvdHlwZS5nZXREaXNwYXRjaCA9IGZ1bmN0aW9uIGdldERpc3BhdGNoICgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzcGF0Y2g7XG59O1xuXG4vKipcbiAqIFJlY2VpdmVzIGFuIGV2ZW50LiBJZiB0aGUgZXZlbnQgaXMgJ0NPTlRFWFRfUkVTSVpFJyBpdCBzZXRzIHRoZSBzaXplIG9mIHRoZSBzY2VuZVxuICogZ3JhcGggdG8gdGhlIHBheWxvYWQsIHdoaWNoIG11c3QgYmUgYW4gYXJyYXkgb2YgbnVtYmVycyBvZiBhdCBsZWFzdFxuICogbGVuZ3RoIHRocmVlIHJlcHJlc2VudGluZyB0aGUgcGl4ZWwgc2l6ZSBpbiAzIGRpbWVuc2lvbnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IHRoZSBuYW1lIG9mIHRoZSBldmVudCBiZWluZyByZWNlaXZlZFxuICogQHBhcmFtIHsqfSBwYXlsb2FkIHRoZSBvYmplY3QgYmVpbmcgc2VudFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cblNjZW5lLnByb3RvdHlwZS5vblJlY2VpdmUgPSBmdW5jdGlvbiBvblJlY2VpdmUgKGV2ZW50LCBwYXlsb2FkKSB7XG4gICAgLy8gVE9ETzogSW4gdGhlIGZ1dHVyZSB0aGUgZG9tIGVsZW1lbnQgdGhhdCB0aGUgY29udGV4dCBpcyBhdHRhY2hlZCB0b1xuICAgIC8vIHNob3VsZCBoYXZlIGEgcmVwcmVzZW50YXRpb24gYXMgYSBjb21wb25lbnQuIEl0IHdvdWxkIGJlIHJlbmRlciBzaXplZFxuICAgIC8vIGFuZCB0aGUgY29udGV4dCB3b3VsZCByZWNlaXZlIGl0cyBzaXplIHRoZSBzYW1lIHdheSB0aGF0IGFueSByZW5kZXIgc2l6ZVxuICAgIC8vIGNvbXBvbmVudCByZWNlaXZlcyBpdHMgc2l6ZS5cbiAgICBpZiAoZXZlbnQgPT09ICdDT05URVhUX1JFU0laRScpIHtcblxuICAgICAgICBpZiAocGF5bG9hZC5sZW5ndGggPCAyKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAnQ09OVEVYVF9SRVNJWkVcXCdzIHBheWxvYWQgbmVlZHMgdG8gYmUgYXQgbGVhc3QgYSBwYWlyJyArXG4gICAgICAgICAgICAgICAgICAgICcgb2YgcGl4ZWwgc2l6ZXMnXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuc2V0U2l6ZU1vZGUoU2l6ZS5BQlNPTFVURSwgU2l6ZS5BQlNPTFVURSwgU2l6ZS5BQlNPTFVURSk7XG4gICAgICAgIHRoaXMuc2V0QWJzb2x1dGVTaXplKHBheWxvYWRbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWRbMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWRbMl0gPyBwYXlsb2FkWzJdIDogMCk7XG5cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5lO1xuXG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogVGhlIFNpemUgY2xhc3MgaXMgcmVzcG9uc2libGUgZm9yIHByb2Nlc3NpbmcgU2l6ZSBmcm9tIGEgbm9kZVxuICogQGNvbnN0cnVjdG9yIFNpemVcbiAqL1xuZnVuY3Rpb24gU2l6ZSAoKSB7XG4gICAgdGhpcy5fc2l6ZSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG59XG5cbi8vIGFuIGVudW1lcmF0aW9uIG9mIHRoZSBkaWZmZXJlbnQgdHlwZXMgb2Ygc2l6ZSBtb2Rlc1xuU2l6ZS5SRUxBVElWRSA9IDA7XG5TaXplLkFCU09MVVRFID0gMTtcblNpemUuUkVOREVSID0gMjtcblNpemUuREVGQVVMVCA9IFNpemUuUkVMQVRJVkU7XG5cbi8qKlxuICogZnJvbVNwZWNXaXRoUGFyZW50IHRha2VzIHRoZSBwYXJlbnQgbm9kZSdzIHNpemUsIHRoZSB0YXJnZXQgbm9kZSdzIHNwZWMsXG4gKiBhbmQgYSB0YXJnZXQgYXJyYXkgdG8gd3JpdGUgdG8uIFVzaW5nIHRoZSBub2RlJ3Mgc2l6ZSBtb2RlIGl0IGNhbGN1bGF0ZXNcbiAqIGEgZmluYWwgc2l6ZSBmb3IgdGhlIG5vZGUgZnJvbSB0aGUgbm9kZSdzIHNwZWMuIFJldHVybnMgd2hldGhlciBvciBub3RcbiAqIHRoZSBmaW5hbCBzaXplIGhhcyBjaGFuZ2VkIGZyb20gaXRzIGxhc3QgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gcGFyZW50U2l6ZSBwYXJlbnQgbm9kZSdzIGNhbGN1bGF0ZWQgc2l6ZVxuICogQHBhcmFtIHtOb2RlLlNwZWN9IG5vZGUgdGhlIHRhcmdldCBub2RlJ3Mgc3BlY1xuICogQHBhcmFtIHtBcnJheX0gdGFyZ2V0IGFuIGFycmF5IHRvIHdyaXRlIHRoZSByZXN1bHQgdG9cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIHRoZSBzaXplIG9mIHRoZSBub2RlIGhhcyBjaGFuZ2VkLlxuICovXG5TaXplLnByb3RvdHlwZS5mcm9tU3BlY1dpdGhQYXJlbnQgPSBmdW5jdGlvbiBmcm9tU3BlY1dpdGhQYXJlbnQgKHBhcmVudFNpemUsIG5vZGUsIHRhcmdldCkge1xuICAgIHZhciBzcGVjID0gbm9kZS5nZXRWYWx1ZSgpLnNwZWM7XG4gICAgdmFyIGNvbXBvbmVudHMgPSBub2RlLmdldENvbXBvbmVudHMoKTtcbiAgICB2YXIgbW9kZSA9IHNwZWMuc2l6ZS5zaXplTW9kZTtcbiAgICB2YXIgcHJldjtcbiAgICB2YXIgY2hhbmdlZCA9IGZhbHNlO1xuICAgIHZhciBsZW4gPSBjb21wb25lbnRzLmxlbmd0aDtcbiAgICB2YXIgajtcbiAgICBmb3IgKHZhciBpID0gMCA7IGkgPCAzIDsgaSsrKSB7XG4gICAgICAgIHN3aXRjaCAobW9kZVtpXSkge1xuICAgICAgICAgICAgY2FzZSBTaXplLlJFTEFUSVZFOlxuICAgICAgICAgICAgICAgIHByZXYgPSB0YXJnZXRbaV07XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2ldID0gcGFyZW50U2l6ZVtpXSAqIHNwZWMuc2l6ZS5wcm9wb3J0aW9uYWxbaV0gKyBzcGVjLnNpemUuZGlmZmVyZW50aWFsW2ldO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTaXplLkFCU09MVVRFOlxuICAgICAgICAgICAgICAgIHByZXYgPSB0YXJnZXRbaV07XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2ldID0gc3BlYy5zaXplLmFic29sdXRlW2ldO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTaXplLlJFTkRFUjpcbiAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlO1xuICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnQ7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGxlbiA7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQgPSBjb21wb25lbnRzW2pdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50ICYmIGNvbXBvbmVudC5nZXRSZW5kZXJTaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGUgPSBjb21wb25lbnQuZ2V0UmVuZGVyU2l6ZSgpW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldiA9IHRhcmdldFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtpXSA9IHRhcmdldFtpXSA8IGNhbmRpZGF0ZSB8fCB0YXJnZXRbaV0gPT09IDAgPyBjYW5kaWRhdGUgOiB0YXJnZXRbaV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2hhbmdlZCA9IGNoYW5nZWQgfHwgcHJldiAhPT0gdGFyZ2V0W2ldO1xuICAgIH1cbiAgICByZXR1cm4gY2hhbmdlZDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2l6ZTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogVGhlIHRyYW5zZm9ybSBjbGFzcyBpcyByZXNwb25zaWJsZSBmb3IgY2FsY3VsYXRpbmcgdGhlIHRyYW5zZm9ybSBvZiBhIHBhcnRpY3VsYXJcbiAqIG5vZGUgZnJvbSB0aGUgZGF0YSBvbiB0aGUgbm9kZSBhbmQgaXRzIHBhcmVudFxuICpcbiAqIEBjb25zdHJ1Y3RvciBUcmFuc2Zvcm1cbiAqL1xuZnVuY3Rpb24gVHJhbnNmb3JtICgpIHtcbiAgICB0aGlzLl9tYXRyaXggPSBuZXcgRmxvYXQzMkFycmF5KDE2KTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBsYXN0IGNhbGN1bGF0ZWQgdHJhbnNmb3JtXG4gKlxuICogQHJldHVybiB7QXJyYXl9IGEgdHJhbnNmb3JtXG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0ICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbWF0cml4O1xufTtcblxuLyoqXG4gKiBVc2VzIHRoZSBwYXJlbnQgdHJhbnNmb3JtLCB0aGUgbm9kZSdzIHNwZWMsIHRoZSBub2RlJ3Mgc2l6ZSwgYW5kIHRoZSBwYXJlbnQncyBzaXplXG4gKiB0byBjYWxjdWxhdGUgYSBmaW5hbCB0cmFuc2Zvcm0gZm9yIHRoZSBub2RlLiBSZXR1cm5zIHRydWUgaWYgdGhlIHRyYW5zZm9ybSBoYXMgY2hhbmdlZC5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBwYXJlbnRNYXRyaXggdGhlIHBhcmVudCBtYXRyaXhcbiAqIEBwYXJhbSB7Tm9kZS5TcGVjfSBzcGVjIHRoZSB0YXJnZXQgbm9kZSdzIHNwZWNcbiAqIEBwYXJhbSB7QXJyYXl9IG15U2l6ZSB0aGUgc2l6ZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIHtBcnJheX0gcGFyZW50U2l6ZSB0aGUgc2l6ZSBvZiB0aGUgcGFyZW50XG4gKiBAcGFyYW0ge0FycmF5fSB0YXJnZXQgdGhlIHRhcmdldCBhcnJheSB0byB3cml0ZSB0aGUgcmVzdWx0aW5nIHRyYW5zZm9ybSB0b1xuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgb3Igbm90IHRoZSB0cmFuc2Zvcm0gY2hhbmdlZFxuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmZyb21TcGVjV2l0aFBhcmVudCA9IGZ1bmN0aW9uIGZyb21TcGVjV2l0aFBhcmVudCAocGFyZW50TWF0cml4LCBzcGVjLCBteVNpemUsIHBhcmVudFNpemUsIHRhcmdldCkge1xuICAgIHRhcmdldCA9IHRhcmdldCA/IHRhcmdldCA6IHRoaXMuX21hdHJpeDtcblxuICAgIC8vIGxvY2FsIGNhY2hlIG9mIGV2ZXJ5dGhpbmdcbiAgICB2YXIgdDAwICAgICAgICAgPSB0YXJnZXRbMF07XG4gICAgdmFyIHQwMSAgICAgICAgID0gdGFyZ2V0WzFdO1xuICAgIHZhciB0MDIgICAgICAgICA9IHRhcmdldFsyXTtcbiAgICB2YXIgdDEwICAgICAgICAgPSB0YXJnZXRbNF07XG4gICAgdmFyIHQxMSAgICAgICAgID0gdGFyZ2V0WzVdO1xuICAgIHZhciB0MTIgICAgICAgICA9IHRhcmdldFs2XTtcbiAgICB2YXIgdDIwICAgICAgICAgPSB0YXJnZXRbOF07XG4gICAgdmFyIHQyMSAgICAgICAgID0gdGFyZ2V0WzldO1xuICAgIHZhciB0MjIgICAgICAgICA9IHRhcmdldFsxMF07XG4gICAgdmFyIHQzMCAgICAgICAgID0gdGFyZ2V0WzEyXTtcbiAgICB2YXIgdDMxICAgICAgICAgPSB0YXJnZXRbMTNdO1xuICAgIHZhciB0MzIgICAgICAgICA9IHRhcmdldFsxNF07XG4gICAgdmFyIHAwMCAgICAgICAgID0gcGFyZW50TWF0cml4WzBdO1xuICAgIHZhciBwMDEgICAgICAgICA9IHBhcmVudE1hdHJpeFsxXTtcbiAgICB2YXIgcDAyICAgICAgICAgPSBwYXJlbnRNYXRyaXhbMl07XG4gICAgdmFyIHAxMCAgICAgICAgID0gcGFyZW50TWF0cml4WzRdO1xuICAgIHZhciBwMTEgICAgICAgICA9IHBhcmVudE1hdHJpeFs1XTtcbiAgICB2YXIgcDEyICAgICAgICAgPSBwYXJlbnRNYXRyaXhbNl07XG4gICAgdmFyIHAyMCAgICAgICAgID0gcGFyZW50TWF0cml4WzhdO1xuICAgIHZhciBwMjEgICAgICAgICA9IHBhcmVudE1hdHJpeFs5XTtcbiAgICB2YXIgcDIyICAgICAgICAgPSBwYXJlbnRNYXRyaXhbMTBdO1xuICAgIHZhciBwMzAgICAgICAgICA9IHBhcmVudE1hdHJpeFsxMl07XG4gICAgdmFyIHAzMSAgICAgICAgID0gcGFyZW50TWF0cml4WzEzXTtcbiAgICB2YXIgcDMyICAgICAgICAgPSBwYXJlbnRNYXRyaXhbMTRdO1xuICAgIHZhciBwb3NYICAgICAgICA9IHNwZWMudmVjdG9ycy5wb3NpdGlvblswXTtcbiAgICB2YXIgcG9zWSAgICAgICAgPSBzcGVjLnZlY3RvcnMucG9zaXRpb25bMV07XG4gICAgdmFyIHBvc1ogICAgICAgID0gc3BlYy52ZWN0b3JzLnBvc2l0aW9uWzJdO1xuICAgIHZhciByb3RYICAgICAgICA9IHNwZWMudmVjdG9ycy5yb3RhdGlvblswXTtcbiAgICB2YXIgcm90WSAgICAgICAgPSBzcGVjLnZlY3RvcnMucm90YXRpb25bMV07XG4gICAgdmFyIHJvdFogICAgICAgID0gc3BlYy52ZWN0b3JzLnJvdGF0aW9uWzJdO1xuICAgIHZhciByb3RXICAgICAgICA9IHNwZWMudmVjdG9ycy5yb3RhdGlvblszXTtcbiAgICB2YXIgc2NhbGVYICAgICAgPSBzcGVjLnZlY3RvcnMuc2NhbGVbMF07XG4gICAgdmFyIHNjYWxlWSAgICAgID0gc3BlYy52ZWN0b3JzLnNjYWxlWzFdO1xuICAgIHZhciBzY2FsZVogICAgICA9IHNwZWMudmVjdG9ycy5zY2FsZVsyXTtcbiAgICB2YXIgYWxpZ25YICAgICAgPSBzcGVjLm9mZnNldHMuYWxpZ25bMF0gKiBwYXJlbnRTaXplWzBdO1xuICAgIHZhciBhbGlnblkgICAgICA9IHNwZWMub2Zmc2V0cy5hbGlnblsxXSAqIHBhcmVudFNpemVbMV07XG4gICAgdmFyIGFsaWduWiAgICAgID0gc3BlYy5vZmZzZXRzLmFsaWduWzJdICogcGFyZW50U2l6ZVsyXTtcbiAgICB2YXIgbW91bnRQb2ludFggPSBzcGVjLm9mZnNldHMubW91bnRQb2ludFswXSAqIG15U2l6ZVswXTtcbiAgICB2YXIgbW91bnRQb2ludFkgPSBzcGVjLm9mZnNldHMubW91bnRQb2ludFsxXSAqIG15U2l6ZVsxXTtcbiAgICB2YXIgbW91bnRQb2ludFogPSBzcGVjLm9mZnNldHMubW91bnRQb2ludFsyXSAqIG15U2l6ZVsyXTtcbiAgICB2YXIgb3JpZ2luWCAgICAgPSBzcGVjLm9mZnNldHMub3JpZ2luWzBdICogbXlTaXplWzBdO1xuICAgIHZhciBvcmlnaW5ZICAgICA9IHNwZWMub2Zmc2V0cy5vcmlnaW5bMV0gKiBteVNpemVbMV07XG4gICAgdmFyIG9yaWdpblogICAgID0gc3BlYy5vZmZzZXRzLm9yaWdpblsyXSAqIG15U2l6ZVsyXTtcblxuICAgIHZhciB3eCA9IHJvdFcgKiByb3RYO1xuICAgIHZhciB3eSA9IHJvdFcgKiByb3RZO1xuICAgIHZhciB3eiA9IHJvdFcgKiByb3RaO1xuICAgIHZhciB4eCA9IHJvdFggKiByb3RYO1xuICAgIHZhciB5eSA9IHJvdFkgKiByb3RZO1xuICAgIHZhciB6eiA9IHJvdFogKiByb3RaO1xuICAgIHZhciB4eSA9IHJvdFggKiByb3RZO1xuICAgIHZhciB4eiA9IHJvdFggKiByb3RaO1xuICAgIHZhciB5eiA9IHJvdFkgKiByb3RaO1xuXG4gICAgdmFyIHJzMCA9ICgxIC0gMiAqICh5eSArIHp6KSkgKiBzY2FsZVg7XG4gICAgdmFyIHJzMSA9ICgyICogKHh5ICsgd3opKSAqIHNjYWxlWDtcbiAgICB2YXIgcnMyID0gKDIgKiAoeHogLSB3eSkpICogc2NhbGVYO1xuICAgIHZhciByczMgPSAoMiAqICh4eSAtIHd6KSkgKiBzY2FsZVk7XG4gICAgdmFyIHJzNCA9ICgxIC0gMiAqICh4eCArIHp6KSkgKiBzY2FsZVk7XG4gICAgdmFyIHJzNSA9ICgyICogKHl6ICsgd3gpKSAqIHNjYWxlWTtcbiAgICB2YXIgcnM2ID0gKDIgKiAoeHogKyB3eSkpICogc2NhbGVaO1xuICAgIHZhciByczcgPSAoMiAqICh5eiAtIHd4KSkgKiBzY2FsZVo7XG4gICAgdmFyIHJzOCA9ICgxIC0gMiAqICh4eCArIHl5KSkgKiBzY2FsZVo7XG5cbiAgICB2YXIgdHggPSBhbGlnblggKyBwb3NYIC0gbW91bnRQb2ludFggKyBvcmlnaW5YIC0gKHJzMCAqIG9yaWdpblggKyByczMgKiBvcmlnaW5ZICsgcnM2ICogb3JpZ2luWik7XG4gICAgdmFyIHR5ID0gYWxpZ25ZICsgcG9zWSAtIG1vdW50UG9pbnRZICsgb3JpZ2luWSAtIChyczEgKiBvcmlnaW5YICsgcnM0ICogb3JpZ2luWSArIHJzNyAqIG9yaWdpblopO1xuICAgIHZhciB0eiA9IGFsaWduWiArIHBvc1ogLSBtb3VudFBvaW50WiArIG9yaWdpblogLSAocnMyICogb3JpZ2luWCArIHJzNSAqIG9yaWdpblkgKyByczggKiBvcmlnaW5aKTtcblxuICAgIHRhcmdldFswXSA9IHAwMCAqIHJzMCArIHAxMCAqIHJzMSArIHAyMCAqIHJzMjtcbiAgICB0YXJnZXRbMV0gPSBwMDEgKiByczAgKyBwMTEgKiByczEgKyBwMjEgKiByczI7XG4gICAgdGFyZ2V0WzJdID0gcDAyICogcnMwICsgcDEyICogcnMxICsgcDIyICogcnMyO1xuICAgIHRhcmdldFszXSA9IDA7XG4gICAgdGFyZ2V0WzRdID0gcDAwICogcnMzICsgcDEwICogcnM0ICsgcDIwICogcnM1O1xuICAgIHRhcmdldFs1XSA9IHAwMSAqIHJzMyArIHAxMSAqIHJzNCArIHAyMSAqIHJzNTtcbiAgICB0YXJnZXRbNl0gPSBwMDIgKiByczMgKyBwMTIgKiByczQgKyBwMjIgKiByczU7XG4gICAgdGFyZ2V0WzddID0gMDtcbiAgICB0YXJnZXRbOF0gPSBwMDAgKiByczYgKyBwMTAgKiByczcgKyBwMjAgKiByczg7XG4gICAgdGFyZ2V0WzldID0gcDAxICogcnM2ICsgcDExICogcnM3ICsgcDIxICogcnM4O1xuICAgIHRhcmdldFsxMF0gPSBwMDIgKiByczYgKyBwMTIgKiByczcgKyBwMjIgKiByczg7XG4gICAgdGFyZ2V0WzExXSA9IDA7XG4gICAgdGFyZ2V0WzEyXSA9IHAwMCAqIHR4ICsgcDEwICogdHkgKyBwMjAgKiB0eiArIHAzMDtcbiAgICB0YXJnZXRbMTNdID0gcDAxICogdHggKyBwMTEgKiB0eSArIHAyMSAqIHR6ICsgcDMxO1xuICAgIHRhcmdldFsxNF0gPSBwMDIgKiB0eCArIHAxMiAqIHR5ICsgcDIyICogdHogKyBwMzI7XG4gICAgdGFyZ2V0WzE1XSA9IDE7XG5cbiAgICByZXR1cm4gdDAwICE9PSB0YXJnZXRbMF0gfHxcbiAgICAgICAgdDAxICE9PSB0YXJnZXRbMV0gfHxcbiAgICAgICAgdDAyICE9PSB0YXJnZXRbMl0gfHxcbiAgICAgICAgdDEwICE9PSB0YXJnZXRbNF0gfHxcbiAgICAgICAgdDExICE9PSB0YXJnZXRbNV0gfHxcbiAgICAgICAgdDEyICE9PSB0YXJnZXRbNl0gfHxcbiAgICAgICAgdDIwICE9PSB0YXJnZXRbOF0gfHxcbiAgICAgICAgdDIxICE9PSB0YXJnZXRbOV0gfHxcbiAgICAgICAgdDIyICE9PSB0YXJnZXRbMTBdIHx8XG4gICAgICAgIHQzMCAhPT0gdGFyZ2V0WzEyXSB8fFxuICAgICAgICB0MzEgIT09IHRhcmdldFsxM10gfHxcbiAgICAgICAgdDMyICE9PSB0YXJnZXRbMTRdO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENhbGxiYWNrU3RvcmUgPSByZXF1aXJlKCcuLi91dGlsaXRpZXMvQ2FsbGJhY2tTdG9yZScpO1xuXG52YXIgUkVOREVSX1NJWkUgPSAyO1xuXG4vKipcbiAqIEEgRE9NRWxlbWVudCBpcyBhIGNvbXBvbmVudCB0aGF0IGNhbiBiZSBhZGRlZCB0byBhIE5vZGUgd2l0aCB0aGVcbiAqIHB1cnBvc2Ugb2Ygc2VuZGluZyBkcmF3IGNvbW1hbmRzIHRvIHRoZSByZW5kZXJlci4gUmVuZGVyYWJsZXMgc2VuZCBkcmF3IGNvbW1hbmRzXG4gKiB0byB0aHJvdWdoIHRoZWlyIE5vZGVzIHRvIHRoZSBDb21wb3NpdG9yIHdoZXJlIHRoZXkgYXJlIGFjdGVkIHVwb24uXG4gKlxuICogQGNsYXNzIERPTUVsZW1lbnRcbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgICAgICAgICAgICAgICAgICAgVGhlIE5vZGUgdG8gd2hpY2ggdGhlIGBET01FbGVtZW50YFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmFibGUgc2hvdWxkIGJlIGF0dGFjaGVkIHRvLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgICAgICAgICAgICAgIEluaXRpYWwgb3B0aW9ucyB1c2VkIGZvciBpbnN0YW50aWF0aW5nXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIE5vZGUuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5wcm9wZXJ0aWVzICAgQ1NTIHByb3BlcnRpZXMgdGhhdCBzaG91bGQgYmUgYWRkZWQgdG9cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgYWN0dWFsIERPTUVsZW1lbnQgb24gdGhlIGluaXRpYWwgZHJhdy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLmF0dHJpYnV0ZXMgICBFbGVtZW50IGF0dHJpYnV0ZXMgdGhhdCBzaG91bGQgYmUgYWRkZWQgdG9cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgYWN0dWFsIERPTUVsZW1lbnQuXG4gKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5pZCAgICAgICAgICAgU3RyaW5nIHRvIGJlIGFwcGxpZWQgYXMgJ2lkJyBvZiB0aGUgYWN0dWFsXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRE9NRWxlbWVudC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLmNvbnRlbnQgICAgICBTdHJpbmcgdG8gYmUgYXBwbGllZCBhcyB0aGUgY29udGVudCBvZiB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWwgRE9NRWxlbWVudC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5jdXRvdXQgICAgICBTcGVjaWZpZXMgdGhlIHByZXNlbmNlIG9mIGEgJ2N1dG91dCcgaW4gdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgV2ViR0wgY2FudmFzIG92ZXIgdGhpcyBlbGVtZW50IHdoaWNoIGFsbG93c1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBET00gYW5kIFdlYkdMIGxheWVyaW5nLiAgT24gYnkgZGVmYXVsdC5cbiAqL1xuZnVuY3Rpb24gRE9NRWxlbWVudChub2RlLCBvcHRpb25zKSB7XG4gICAgaWYgKCFub2RlKSB0aHJvdyBuZXcgRXJyb3IoJ0RPTUVsZW1lbnQgbXVzdCBiZSBpbnN0YW50aWF0ZWQgb24gYSBub2RlJyk7XG5cbiAgICB0aGlzLl9ub2RlID0gbm9kZTtcblxuICAgIHRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgPSBmYWxzZTtcbiAgICB0aGlzLl9yZW5kZXJTaXplZCA9IGZhbHNlO1xuICAgIHRoaXMuX3JlcXVlc3RSZW5kZXJTaXplID0gZmFsc2U7XG5cbiAgICB0aGlzLl9jaGFuZ2VRdWV1ZSA9IFtdO1xuXG4gICAgdGhpcy5fVUlFdmVudHMgPSBub2RlLmdldFVJRXZlbnRzKCkuc2xpY2UoMCk7XG4gICAgdGhpcy5fY2xhc3NlcyA9IFsnZmFtb3VzLWRvbS1lbGVtZW50J107XG4gICAgdGhpcy5fcmVxdWVzdGluZ0V2ZW50TGlzdGVuZXJzID0gW107XG4gICAgdGhpcy5fc3R5bGVzID0ge307XG5cbiAgICB0aGlzLnNldFByb3BlcnR5KCdkaXNwbGF5Jywgbm9kZS5pc1Nob3duKCkgPyAnbm9uZScgOiAnYmxvY2snKTtcbiAgICB0aGlzLm9uT3BhY2l0eUNoYW5nZShub2RlLmdldE9wYWNpdHkoKSk7XG5cbiAgICB0aGlzLl9hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5fY29udGVudCA9ICcnO1xuXG4gICAgdGhpcy5fdGFnTmFtZSA9IG9wdGlvbnMgJiYgb3B0aW9ucy50YWdOYW1lID8gb3B0aW9ucy50YWdOYW1lIDogJ2Rpdic7XG4gICAgdGhpcy5faWQgPSBub2RlLmFkZENvbXBvbmVudCh0aGlzKTtcblxuICAgIHRoaXMuX3JlbmRlclNpemUgPSBbMCwgMCwgMF07XG5cbiAgICB0aGlzLl9jYWxsYmFja3MgPSBuZXcgQ2FsbGJhY2tTdG9yZSgpO1xuXG4gICAgaWYgKCFvcHRpb25zKSByZXR1cm47XG5cbiAgICB2YXIgaTtcbiAgICB2YXIga2V5O1xuXG4gICAgaWYgKG9wdGlvbnMuY2xhc3NlcylcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG9wdGlvbnMuY2xhc3Nlcy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3Mob3B0aW9ucy5jbGFzc2VzW2ldKTtcblxuICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZXMpXG4gICAgICAgIGZvciAoa2V5IGluIG9wdGlvbnMuYXR0cmlidXRlcylcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGtleSwgb3B0aW9ucy5hdHRyaWJ1dGVzW2tleV0pO1xuXG4gICAgaWYgKG9wdGlvbnMucHJvcGVydGllcylcbiAgICAgICAgZm9yIChrZXkgaW4gb3B0aW9ucy5wcm9wZXJ0aWVzKVxuICAgICAgICAgICAgdGhpcy5zZXRQcm9wZXJ0eShrZXksIG9wdGlvbnMucHJvcGVydGllc1trZXldKTtcblxuICAgIGlmIChvcHRpb25zLmlkKSB0aGlzLnNldElkKG9wdGlvbnMuaWQpO1xuICAgIGlmIChvcHRpb25zLmNvbnRlbnQpIHRoaXMuc2V0Q29udGVudChvcHRpb25zLmNvbnRlbnQpO1xuICAgIGlmIChvcHRpb25zLmN1dG91dCA9PT0gZmFsc2UpIHRoaXMuc2V0Q3V0b3V0U3RhdGUob3B0aW9ucy5jdXRvdXQpO1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZXMgdGhlIHN0YXRlIG9mIHRoZSBET01FbGVtZW50LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IHNlcmlhbGl6ZWQgaW50ZXJhbCBzdGF0ZVxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uIGdldFZhbHVlKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGNsYXNzZXM6IHRoaXMuX2NsYXNzZXMsXG4gICAgICAgIHN0eWxlczogdGhpcy5fc3R5bGVzLFxuICAgICAgICBhdHRyaWJ1dGVzOiB0aGlzLl9hdHRyaWJ1dGVzLFxuICAgICAgICBjb250ZW50OiB0aGlzLl9jb250ZW50LFxuICAgICAgICBpZDogdGhpcy5fYXR0cmlidXRlcy5pZCxcbiAgICAgICAgdGFnTmFtZTogdGhpcy5fdGFnTmFtZVxuICAgIH07XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBpbnZva2VkIGJ5IHRoZSBub2RlIGFzIHNvb24gYXMgYW4gdXBkYXRlIG9jY3Vycy4gVGhpcyBhbGxvd3NcbiAqIHRoZSBET01FbGVtZW50IHJlbmRlcmFibGUgdG8gZHluYW1pY2FsbHkgcmVhY3QgdG8gc3RhdGUgY2hhbmdlcyBvbiB0aGUgTm9kZS5cbiAqXG4gKiBUaGlzIGZsdXNoZXMgdGhlIGludGVybmFsIGRyYXcgY29tbWFuZCBxdWV1ZSBieSBzZW5kaW5nIGluZGl2aWR1YWwgY29tbWFuZHNcbiAqIHRvIHRoZSBub2RlIHVzaW5nIGBzZW5kRHJhd0NvbW1hbmRgLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vblVwZGF0ZSA9IGZ1bmN0aW9uIG9uVXBkYXRlKCkge1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZTtcbiAgICB2YXIgcXVldWUgPSB0aGlzLl9jaGFuZ2VRdWV1ZTtcbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuXG4gICAgaWYgKGxlbiAmJiBub2RlKSB7XG4gICAgICAgIG5vZGUuc2VuZERyYXdDb21tYW5kKCdXSVRIJyk7XG4gICAgICAgIG5vZGUuc2VuZERyYXdDb21tYW5kKG5vZGUuZ2V0TG9jYXRpb24oKSk7XG5cbiAgICAgICAgd2hpbGUgKGxlbi0tKSBub2RlLnNlbmREcmF3Q29tbWFuZChxdWV1ZS5zaGlmdCgpKTtcbiAgICAgICAgaWYgKHRoaXMuX3JlcXVlc3RSZW5kZXJTaXplKSB7XG4gICAgICAgICAgICBub2RlLnNlbmREcmF3Q29tbWFuZCgnRE9NX1JFTkRFUl9TSVpFJyk7XG4gICAgICAgICAgICBub2RlLnNlbmREcmF3Q29tbWFuZChub2RlLmdldExvY2F0aW9uKCkpO1xuICAgICAgICAgICAgdGhpcy5fcmVxdWVzdFJlbmRlclNpemUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBNZXRob2QgdG8gYmUgaW52b2tlZCBieSB0aGUgTm9kZSBhcyBzb29uIGFzIHRoZSBub2RlIChvciBhbnkgb2YgaXRzXG4gKiBhbmNlc3RvcnMpIGlzIGJlaW5nIG1vdW50ZWQuXG4gKlxuICogQG1ldGhvZCBvbk1vdW50XG4gKlxuICogQHBhcmFtIHtOb2RlfSBub2RlICAgICAgUGFyZW50IG5vZGUgdG8gd2hpY2ggdGhlIGNvbXBvbmVudCBzaG91bGQgYmUgYWRkZWQuXG4gKiBAcGFyYW0ge1N0cmluZ30gaWQgICAgICBQYXRoIGF0IHdoaWNoIHRoZSBjb21wb25lbnQgKG9yIG5vZGUpIGlzIGJlaW5nXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0YWNoZWQuIFRoZSBwYXRoIGlzIGJlaW5nIHNldCBvbiB0aGUgYWN0dWFsXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgRE9NRWxlbWVudCBhcyBhIGBkYXRhLWZhLXBhdGhgLWF0dHJpYnV0ZS5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vbk1vdW50ID0gZnVuY3Rpb24gb25Nb3VudChub2RlLCBpZCkge1xuICAgIHRoaXMuX25vZGUgPSBub2RlO1xuICAgIHRoaXMuX2lkID0gaWQ7XG4gICAgdGhpcy5fVUlFdmVudHMgPSBub2RlLmdldFVJRXZlbnRzKCkuc2xpY2UoMCk7XG4gICAgdGhpcy5kcmF3KCk7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ2RhdGEtZmEtcGF0aCcsIG5vZGUuZ2V0TG9jYXRpb24oKSk7XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBpbnZva2VkIGJ5IHRoZSBOb2RlIGFzIHNvb24gYXMgdGhlIG5vZGUgaXMgYmVpbmcgZGlzbW91bnRlZFxuICogZWl0aGVyIGRpcmVjdGx5IG9yIGJ5IGRpc21vdW50aW5nIG9uZSBvZiBpdHMgYW5jZXN0b3JzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vbkRpc21vdW50ID0gZnVuY3Rpb24gb25EaXNtb3VudCgpIHtcbiAgICB0aGlzLnNldFByb3BlcnR5KCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZSgnZGF0YS1mYS1wYXRoJywgJycpO1xuICAgIHRoaXMuX2luaXRpYWxpemVkID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBpbnZva2VkIGJ5IHRoZSBub2RlIGFzIHNvb24gYXMgdGhlIERPTUVsZW1lbnQgaXMgYmVpbmcgc2hvd24uXG4gKiBUaGlzIHJlc3VsdHMgaW50byB0aGUgRE9NRWxlbWVudCBzZXR0aW5nIHRoZSBgZGlzcGxheWAgcHJvcGVydHkgdG8gYGJsb2NrYFxuICogYW5kIHRoZXJlZm9yZSB2aXN1YWxseSBzaG93aW5nIHRoZSBjb3JyZXNwb25kaW5nIERPTUVsZW1lbnQgKGFnYWluKS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUub25TaG93ID0gZnVuY3Rpb24gb25TaG93KCkge1xuICAgIHRoaXMuc2V0UHJvcGVydHkoJ2Rpc3BsYXknLCAnYmxvY2snKTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIG5vZGUgYXMgc29vbiBhcyB0aGUgRE9NRWxlbWVudCBpcyBiZWluZyBoaWRkZW4uXG4gKiBUaGlzIHJlc3VsdHMgaW50byB0aGUgRE9NRWxlbWVudCBzZXR0aW5nIHRoZSBgZGlzcGxheWAgcHJvcGVydHkgdG8gYG5vbmVgXG4gKiBhbmQgdGhlcmVmb3JlIHZpc3VhbGx5IGhpZGluZyB0aGUgY29ycmVzcG9uZGluZyBET01FbGVtZW50IChhZ2FpbikuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uSGlkZSA9IGZ1bmN0aW9uIG9uSGlkZSgpIHtcbiAgICB0aGlzLnNldFByb3BlcnR5KCdkaXNwbGF5JywgJ25vbmUnKTtcbn07XG5cbi8qKlxuICogRW5hYmxlcyBvciBkaXNhYmxlcyBXZWJHTCAnY3V0b3V0JyBmb3IgdGhpcyBlbGVtZW50LCB3aGljaCBhZmZlY3RzXG4gKiBob3cgdGhlIGVsZW1lbnQgaXMgbGF5ZXJlZCB3aXRoIFdlYkdMIG9iamVjdHMgaW4gdGhlIHNjZW5lLiAgVGhpcyBpcyBkZXNpZ25lZFxuICogbWFpbmx5IGFzIGEgd2F5IHRvIGFjaGVpdmVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtCb29sZWFufSB1c2VzQ3V0b3V0ICBUaGUgcHJlc2VuY2Ugb2YgYSBXZWJHTCAnY3V0b3V0JyBmb3IgdGhpcyBlbGVtZW50LlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLnNldEN1dG91dFN0YXRlID0gZnVuY3Rpb24gc2V0Q3V0b3V0U3RhdGUodXNlc0N1dG91dCkge1xuICAgIHRoaXMuX2NoYW5nZVF1ZXVlLnB1c2goJ0dMX0NVVE9VVF9TVEFURScsIHVzZXNDdXRvdXQpO1xuXG4gICAgaWYgKHRoaXMuX2luaXRpYWxpemVkKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBpbnZva2VkIGJ5IHRoZSBub2RlIGFzIHNvb24gYXMgdGhlIHRyYW5zZm9ybSBtYXRyaXggYXNzb2NpYXRlZFxuICogd2l0aCB0aGUgbm9kZSBjaGFuZ2VzLiBUaGUgRE9NRWxlbWVudCB3aWxsIHJlYWN0IHRvIHRyYW5zZm9ybSBjaGFuZ2VzIGJ5IHNlbmRpbmdcbiAqIGBDSEFOR0VfVFJBTlNGT1JNYCBjb21tYW5kcyB0byB0aGUgYERPTVJlbmRlcmVyYC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtGbG9hdDMyQXJyYXl9IHRyYW5zZm9ybSBUaGUgZmluYWwgdHJhbnNmb3JtIG1hdHJpeFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uVHJhbnNmb3JtQ2hhbmdlID0gZnVuY3Rpb24gb25UcmFuc2Zvcm1DaGFuZ2UgKHRyYW5zZm9ybSkge1xuICAgIHRoaXMuX2NoYW5nZVF1ZXVlLnB1c2goJ0NIQU5HRV9UUkFOU0ZPUk0nKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdHJhbnNmb3JtLmxlbmd0aCA7IGkgPCBsZW4gOyBpKyspXG4gICAgICAgIHRoaXMuX2NoYW5nZVF1ZXVlLnB1c2godHJhbnNmb3JtW2ldKTtcblxuICAgIHRoaXMub25VcGRhdGUoKTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIG5vZGUgYXMgc29vbiBhcyBpdHMgY29tcHV0ZWQgc2l6ZSBjaGFuZ2VzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Zsb2F0MzJBcnJheX0gc2l6ZSBTaXplIG9mIHRoZSBOb2RlIGluIHBpeGVsc1xuICpcbiAqIEByZXR1cm4ge0RPTUVsZW1lbnR9IHRoaXNcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUub25TaXplQ2hhbmdlID0gZnVuY3Rpb24gb25TaXplQ2hhbmdlKHNpemUpIHtcbiAgICB2YXIgc2l6ZU1vZGUgPSB0aGlzLl9ub2RlLmdldFNpemVNb2RlKCk7XG4gICAgdmFyIHNpemVkWCA9IHNpemVNb2RlWzBdICE9PSBSRU5ERVJfU0laRTtcbiAgICB2YXIgc2l6ZWRZID0gc2l6ZU1vZGVbMV0gIT09IFJFTkRFUl9TSVpFO1xuICAgIGlmICh0aGlzLl9pbml0aWFsaXplZClcbiAgICAgICAgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnQ0hBTkdFX1NJWkUnLFxuICAgICAgICAgICAgc2l6ZWRYID8gc2l6ZVswXSA6IHNpemVkWCxcbiAgICAgICAgICAgIHNpemVkWSA/IHNpemVbMV0gOiBzaXplZFkpO1xuXG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBpbnZva2VkIGJ5IHRoZSBub2RlIGFzIHNvb24gYXMgaXRzIG9wYWNpdHkgY2hhbmdlc1xuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gb3BhY2l0eSBUaGUgbmV3IG9wYWNpdHksIGFzIGEgc2NhbGFyIGZyb20gMCB0byAxXG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gdGhpc1xuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vbk9wYWNpdHlDaGFuZ2UgPSBmdW5jdGlvbiBvbk9wYWNpdHlDaGFuZ2Uob3BhY2l0eSkge1xuICAgIHJldHVybiB0aGlzLnNldFByb3BlcnR5KCdvcGFjaXR5Jywgb3BhY2l0eSk7XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBpbnZva2VkIGJ5IHRoZSBub2RlIGFzIHNvb24gYXMgYSBuZXcgVUlFdmVudCBpcyBiZWluZyBhZGRlZC5cbiAqIFRoaXMgcmVzdWx0cyBpbnRvIGFuIGBBRERfRVZFTlRfTElTVEVORVJgIGNvbW1hbmQgYmVpbmcgc2VudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gVUlFdmVudCBVSUV2ZW50IHRvIGJlIHN1YnNjcmliZWQgdG8gKGUuZy4gYGNsaWNrYClcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vbkFkZFVJRXZlbnQgPSBmdW5jdGlvbiBvbkFkZFVJRXZlbnQoVUlFdmVudCkge1xuICAgIGlmICh0aGlzLl9VSUV2ZW50cy5pbmRleE9mKFVJRXZlbnQpID09PSAtMSkge1xuICAgICAgICB0aGlzLl9zdWJzY3JpYmUoVUlFdmVudCk7XG4gICAgICAgIHRoaXMuX1VJRXZlbnRzLnB1c2goVUlFdmVudCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMuX2luRHJhdykge1xuICAgICAgICB0aGlzLl9zdWJzY3JpYmUoVUlFdmVudCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBcHBlbmRzIGFuIGBBRERfRVZFTlRfTElTVEVORVJgIGNvbW1hbmQgdG8gdGhlIGNvbW1hbmQgcXVldWUuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gVUlFdmVudCBFdmVudCB0eXBlIChlLmcuIGBjbGlja2ApXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuX3N1YnNjcmliZSA9IGZ1bmN0aW9uIF9zdWJzY3JpYmUgKFVJRXZlbnQpIHtcbiAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnU1VCU0NSSUJFJywgVUlFdmVudCwgdHJ1ZSk7XG4gICAgfVxuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xufTtcblxuLyoqXG4gKiBNZXRob2QgdG8gYmUgaW52b2tlZCBieSB0aGUgbm9kZSBhcyBzb29uIGFzIHRoZSB1bmRlcmx5aW5nIHNpemUgbW9kZVxuICogY2hhbmdlcy4gVGhpcyByZXN1bHRzIGludG8gdGhlIHNpemUgYmVpbmcgZmV0Y2hlZCBmcm9tIHRoZSBub2RlIGluXG4gKiBvcmRlciB0byB1cGRhdGUgdGhlIGFjdHVhbCwgcmVuZGVyZWQgc2l6ZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggdGhlIHNpemluZyBtb2RlIGluIHVzZSBmb3IgZGV0ZXJtaW5pbmcgc2l6ZSBpbiB0aGUgeCBkaXJlY3Rpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IHRoZSBzaXppbmcgbW9kZSBpbiB1c2UgZm9yIGRldGVybWluaW5nIHNpemUgaW4gdGhlIHkgZGlyZWN0aW9uXG4gKiBAcGFyYW0ge051bWJlcn0geiB0aGUgc2l6aW5nIG1vZGUgaW4gdXNlIGZvciBkZXRlcm1pbmluZyBzaXplIGluIHRoZSB6IGRpcmVjdGlvblxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uU2l6ZU1vZGVDaGFuZ2UgPSBmdW5jdGlvbiBvblNpemVNb2RlQ2hhbmdlKHgsIHksIHopIHtcbiAgICBpZiAoeCA9PT0gUkVOREVSX1NJWkUgfHwgeSA9PT0gUkVOREVSX1NJWkUgfHwgeiA9PT0gUkVOREVSX1NJWkUpIHtcbiAgICAgICAgdGhpcy5fcmVuZGVyU2l6ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0UmVuZGVyU2l6ZSA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMub25TaXplQ2hhbmdlKHRoaXMuX25vZGUuZ2V0U2l6ZSgpKTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIHJldHJpZXZlIHRoZSByZW5kZXJlZCBzaXplIG9mIHRoZSBET00gZWxlbWVudCB0aGF0IGlzXG4gKiBkcmF3biBmb3IgdGhpcyBub2RlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gc2l6ZSBvZiB0aGUgcmVuZGVyZWQgRE9NIGVsZW1lbnQgaW4gcGl4ZWxzXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLmdldFJlbmRlclNpemUgPSBmdW5jdGlvbiBnZXRSZW5kZXJTaXplKCkge1xuICAgIHJldHVybiB0aGlzLl9yZW5kZXJTaXplO1xufTtcblxuLyoqXG4gKiBNZXRob2QgdG8gaGF2ZSB0aGUgY29tcG9uZW50IHJlcXVlc3QgYW4gdXBkYXRlIGZyb20gaXRzIE5vZGVcbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLl9yZXF1ZXN0VXBkYXRlID0gZnVuY3Rpb24gX3JlcXVlc3RVcGRhdGUoKSB7XG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB7XG4gICAgICAgIHRoaXMuX25vZGUucmVxdWVzdFVwZGF0ZSh0aGlzLl9pZCk7XG4gICAgICAgIHRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgPSB0cnVlO1xuICAgIH1cbn07XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIERPTUVsZW1lbnQgYnkgc2VuZGluZyB0aGUgYElOSVRfRE9NYCBjb21tYW5kLiBUaGlzIGNyZWF0ZXNcbiAqIG9yIHJlYWxsb2NhdGVzIGEgbmV3IEVsZW1lbnQgaW4gdGhlIGFjdHVhbCBET00gaGllcmFyY2h5LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcbiAgICB0aGlzLl9jaGFuZ2VRdWV1ZS5wdXNoKCdJTklUX0RPTScsIHRoaXMuX3RhZ05hbWUpO1xuICAgIHRoaXMuX2luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB0aGlzLm9uVHJhbnNmb3JtQ2hhbmdlKHRoaXMuX25vZGUuZ2V0VHJhbnNmb3JtKCkpO1xuICAgIHRoaXMub25TaXplQ2hhbmdlKHRoaXMuX25vZGUuZ2V0U2l6ZSgpKTtcbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgaWQgYXR0cmlidXRlIG9mIHRoZSBET01FbGVtZW50LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaWQgTmV3IGlkIHRvIGJlIHNldFxuICpcbiAqIEByZXR1cm4ge0RPTUVsZW1lbnR9IHRoaXNcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuc2V0SWQgPSBmdW5jdGlvbiBzZXRJZCAoaWQpIHtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZSgnaWQnLCBpZCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZHMgYSBuZXcgY2xhc3MgdG8gdGhlIGludGVybmFsIGNsYXNzIGxpc3Qgb2YgdGhlIHVuZGVybHlpbmcgRWxlbWVudCBpbiB0aGVcbiAqIERPTS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlIE5ldyBjbGFzcyBuYW1lIHRvIGJlIGFkZGVkXG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gdGhpc1xuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5hZGRDbGFzcyA9IGZ1bmN0aW9uIGFkZENsYXNzICh2YWx1ZSkge1xuICAgIGlmICh0aGlzLl9jbGFzc2VzLmluZGV4T2YodmFsdWUpIDwgMCkge1xuICAgICAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHRoaXMuX2NoYW5nZVF1ZXVlLnB1c2goJ0FERF9DTEFTUycsIHZhbHVlKTtcbiAgICAgICAgdGhpcy5fY2xhc3Nlcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgICAgIGlmICh0aGlzLl9yZW5kZXJTaXplZCkgdGhpcy5fcmVxdWVzdFJlbmRlclNpemUgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5faW5EcmF3KSB7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnQUREX0NMQVNTJywgdmFsdWUpO1xuICAgICAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgYSBjbGFzcyBmcm9tIHRoZSBET01FbGVtZW50J3MgY2xhc3NMaXN0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgQ2xhc3MgbmFtZSB0byBiZSByZW1vdmVkXG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gdGhpc1xuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uIHJlbW92ZUNsYXNzICh2YWx1ZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuX2NsYXNzZXMuaW5kZXhPZih2YWx1ZSk7XG5cbiAgICBpZiAoaW5kZXggPCAwKSByZXR1cm4gdGhpcztcblxuICAgIHRoaXMuX2NoYW5nZVF1ZXVlLnB1c2goJ1JFTU9WRV9DTEFTUycsIHZhbHVlKTtcblxuICAgIHRoaXMuX2NsYXNzZXMuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgRE9NRWxlbWVudCBoYXMgdGhlIHBhc3NlZCBpbiBjbGFzcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlIFRoZSBjbGFzcyBuYW1lXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gQm9vbGVhbiB2YWx1ZSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHBhc3NlZCBpbiBjbGFzcyBuYW1lIGlzIGluIHRoZSBET01FbGVtZW50J3MgY2xhc3MgbGlzdC5cbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuaGFzQ2xhc3MgPSBmdW5jdGlvbiBoYXNDbGFzcyAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5fY2xhc3Nlcy5pbmRleE9mKHZhbHVlKSAhPT0gLTE7XG59O1xuXG4vKipcbiAqIFNldHMgYW4gYXR0cmlidXRlIG9mIHRoZSBET01FbGVtZW50LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBBdHRyaWJ1dGUga2V5IChlLmcuIGBzcmNgKVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlIEF0dHJpYnV0ZSB2YWx1ZSAoZS5nLiBgaHR0cDovL2ZhbW8udXNgKVxuICpcbiAqIEByZXR1cm4ge0RPTUVsZW1lbnR9IHRoaXNcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuc2V0QXR0cmlidXRlID0gZnVuY3Rpb24gc2V0QXR0cmlidXRlIChuYW1lLCB2YWx1ZSkge1xuICAgIGlmICh0aGlzLl9hdHRyaWJ1dGVzW25hbWVdICE9PSB2YWx1ZSB8fCB0aGlzLl9pbkRyYXcpIHtcbiAgICAgICAgdGhpcy5fYXR0cmlidXRlc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHRoaXMuX2NoYW5nZVF1ZXVlLnB1c2goJ0NIQU5HRV9BVFRSSUJVVEUnLCBuYW1lLCB2YWx1ZSk7XG4gICAgICAgIGlmICghdGhpcy5fcmVxdWVzdFVwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIGEgQ1NTIHByb3BlcnR5XG4gKlxuICogQGNoYWluYWJsZVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lICBOYW1lIG9mIHRoZSBDU1MgcnVsZSAoZS5nLiBgYmFja2dyb3VuZC1jb2xvcmApXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgVmFsdWUgb2YgQ1NTIHByb3BlcnR5IChlLmcuIGByZWRgKVxuICpcbiAqIEByZXR1cm4ge0RPTUVsZW1lbnR9IHRoaXNcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuc2V0UHJvcGVydHkgPSBmdW5jdGlvbiBzZXRQcm9wZXJ0eSAobmFtZSwgdmFsdWUpIHtcbiAgICBpZiAodGhpcy5fc3R5bGVzW25hbWVdICE9PSB2YWx1ZSB8fCB0aGlzLl9pbkRyYXcpIHtcbiAgICAgICAgdGhpcy5fc3R5bGVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnQ0hBTkdFX1BST1BFUlRZJywgbmFtZSwgdmFsdWUpO1xuICAgICAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbiAgICAgICAgaWYgKHRoaXMuX3JlbmRlclNpemVkKSB0aGlzLl9yZXF1ZXN0UmVuZGVyU2l6ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIGNvbnRlbnQgb2YgdGhlIERPTUVsZW1lbnQuIFRoaXMgaXMgdXNpbmcgYGlubmVySFRNTGAsIGVzY2FwaW5nIHVzZXJcbiAqIGdlbmVyYXRlZCBjb250ZW50IGlzIHRoZXJlZm9yZSBlc3NlbnRpYWwgZm9yIHNlY3VyaXR5IHB1cnBvc2VzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gY29udGVudCBDb250ZW50IHRvIGJlIHNldCB1c2luZyBgLmlubmVySFRNTCA9IC4uLmBcbiAqXG4gKiBAcmV0dXJuIHtET01FbGVtZW50fSB0aGlzXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLnNldENvbnRlbnQgPSBmdW5jdGlvbiBzZXRDb250ZW50IChjb250ZW50KSB7XG4gICAgaWYgKHRoaXMuX2NvbnRlbnQgIT09IGNvbnRlbnQgfHwgdGhpcy5faW5EcmF3KSB7XG4gICAgICAgIHRoaXMuX2NvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHRoaXMuX2NoYW5nZVF1ZXVlLnB1c2goJ0NIQU5HRV9DT05URU5UJywgY29udGVudCk7XG4gICAgICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xuICAgICAgICBpZiAodGhpcy5fcmVuZGVyU2l6ZWQpIHRoaXMuX3JlcXVlc3RSZW5kZXJTaXplID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU3Vic2NyaWJlcyB0byBhIERPTUVsZW1lbnQgdXNpbmcuXG4gKlxuICogQG1ldGhvZCBvblxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCAgICAgICBUaGUgZXZlbnQgdHlwZSAoZS5nLiBgY2xpY2tgKS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyICBIYW5kbGVyIGZ1bmN0aW9uIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50IHR5cGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4gd2hpY2ggdGhlIHBheWxvYWQgZXZlbnQgb2JqZWN0IHdpbGwgYmVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkIGludG8uXG4gKlxuICogQHJldHVybiB7RnVuY3Rpb259IEEgZnVuY3Rpb24gdG8gY2FsbCBpZiB5b3Ugd2FudCB0byByZW1vdmUgdGhlIGNhbGxiYWNrXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24gKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIHJldHVybiB0aGlzLl9jYWxsYmFja3Mub24oZXZlbnQsIGxpc3RlbmVyKTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYmUgaW52b2tlZCBieSB0aGUgTm9kZSB3aGVuZXZlciBhbiBldmVudCBpcyBiZWluZyByZWNlaXZlZC5cbiAqIFRoZXJlIGFyZSB0d28gZGlmZmVyZW50IHdheXMgdG8gc3Vic2NyaWJlIGZvciB0aG9zZSBldmVudHM6XG4gKlxuICogMS4gQnkgb3ZlcnJpZGluZyB0aGUgb25SZWNlaXZlIG1ldGhvZCAoYW5kIHBvc3NpYmx5IHVzaW5nIGBzd2l0Y2hgIGluIG9yZGVyXG4gKiAgICAgdG8gZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIHRoZSBkaWZmZXJlbnQgZXZlbnQgdHlwZXMpLlxuICogMi4gQnkgdXNpbmcgRE9NRWxlbWVudCBhbmQgdXNpbmcgdGhlIGJ1aWx0LWluIENhbGxiYWNrU3RvcmUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBFdmVudCB0eXBlIChlLmcuIGBjbGlja2ApXG4gKiBAcGFyYW0ge09iamVjdH0gcGF5bG9hZCBFdmVudCBvYmplY3QuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUub25SZWNlaXZlID0gZnVuY3Rpb24gb25SZWNlaXZlIChldmVudCwgcGF5bG9hZCkge1xuICAgIGlmIChldmVudCA9PT0gJ3Jlc2l6ZScpIHtcbiAgICAgICAgdGhpcy5fcmVuZGVyU2l6ZVswXSA9IHBheWxvYWQudmFsWzBdO1xuICAgICAgICB0aGlzLl9yZW5kZXJTaXplWzFdID0gcGF5bG9hZC52YWxbMV07XG4gICAgICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xuICAgIH1cbiAgICB0aGlzLl9jYWxsYmFja3MudHJpZ2dlcihldmVudCwgcGF5bG9hZCk7XG59O1xuXG4vKipcbiAqIFRoZSBkcmF3IGZ1bmN0aW9uIGlzIGJlaW5nIHVzZWQgaW4gb3JkZXIgdG8gYWxsb3cgbXV0YXRpbmcgdGhlIERPTUVsZW1lbnRcbiAqIGJlZm9yZSBhY3R1YWxseSBtb3VudGluZyB0aGUgY29ycmVzcG9uZGluZyBub2RlLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIGRyYXcoKSB7XG4gICAgdmFyIGtleTtcbiAgICB2YXIgaTtcbiAgICB2YXIgbGVuO1xuXG4gICAgdGhpcy5faW5EcmF3ID0gdHJ1ZTtcblxuICAgIHRoaXMuaW5pdCgpO1xuXG4gICAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5fY2xhc3Nlcy5sZW5ndGggOyBpIDwgbGVuIDsgaSsrKVxuICAgICAgICB0aGlzLmFkZENsYXNzKHRoaXMuX2NsYXNzZXNbaV0pO1xuXG4gICAgaWYgKHRoaXMuX2NvbnRlbnQpIHRoaXMuc2V0Q29udGVudCh0aGlzLl9jb250ZW50KTtcblxuICAgIGZvciAoa2V5IGluIHRoaXMuX3N0eWxlcylcbiAgICAgICAgaWYgKHRoaXMuX3N0eWxlc1trZXldKVxuICAgICAgICAgICAgdGhpcy5zZXRQcm9wZXJ0eShrZXksIHRoaXMuX3N0eWxlc1trZXldKTtcblxuICAgIGZvciAoa2V5IGluIHRoaXMuX2F0dHJpYnV0ZXMpXG4gICAgICAgIGlmICh0aGlzLl9hdHRyaWJ1dGVzW2tleV0pXG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShrZXksIHRoaXMuX2F0dHJpYnV0ZXNba2V5XSk7XG5cbiAgICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLl9VSUV2ZW50cy5sZW5ndGggOyBpIDwgbGVuIDsgaSsrKVxuICAgICAgICB0aGlzLm9uQWRkVUlFdmVudCh0aGlzLl9VSUV2ZW50c1tpXSk7XG5cbiAgICB0aGlzLl9pbkRyYXcgPSBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRE9NRWxlbWVudDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEVsZW1lbnRDYWNoZSA9IHJlcXVpcmUoJy4vRWxlbWVudENhY2hlJyk7XG52YXIgbWF0aCA9IHJlcXVpcmUoJy4vTWF0aCcpO1xudmFyIHZlbmRvclByZWZpeCA9IHJlcXVpcmUoJy4uL3V0aWxpdGllcy92ZW5kb3JQcmVmaXgnKTtcbnZhciBldmVudE1hcCA9IHJlcXVpcmUoJy4vZXZlbnRzL0V2ZW50TWFwJyk7XG5cbnZhciBUUkFOU0ZPUk0gPSBudWxsO1xuXG4vKipcbiAqIERPTVJlbmRlcmVyIGlzIGEgY2xhc3MgcmVzcG9uc2libGUgZm9yIGFkZGluZyBlbGVtZW50c1xuICogdG8gdGhlIERPTSBhbmQgd3JpdGluZyB0byB0aG9zZSBlbGVtZW50cy5cbiAqIFRoZXJlIGlzIGEgRE9NUmVuZGVyZXIgcGVyIGNvbnRleHQsIHJlcHJlc2VudGVkIGFzIGFuXG4gKiBlbGVtZW50IGFuZCBhIHNlbGVjdG9yLiBJdCBpcyBpbnN0YW50aWF0ZWQgaW4gdGhlXG4gKiBjb250ZXh0IGNsYXNzLlxuICpcbiAqIEBjbGFzcyBET01SZW5kZXJlclxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgYW4gZWxlbWVudC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciB0aGUgc2VsZWN0b3Igb2YgdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0ge0NvbXBvc2l0b3J9IGNvbXBvc2l0b3IgdGhlIGNvbXBvc2l0b3IgY29udHJvbGxpbmcgdGhlIHJlbmRlcmVyXG4gKi9cbmZ1bmN0aW9uIERPTVJlbmRlcmVyIChlbGVtZW50LCBzZWxlY3RvciwgY29tcG9zaXRvcikge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2ZhbW91cy1kb20tcmVuZGVyZXInKTtcblxuICAgIFRSQU5TRk9STSA9IFRSQU5TRk9STSB8fCB2ZW5kb3JQcmVmaXgoJ3RyYW5zZm9ybScpO1xuICAgIHRoaXMuX2NvbXBvc2l0b3IgPSBjb21wb3NpdG9yOyAvLyBhIHJlZmVyZW5jZSB0byB0aGUgY29tcG9zaXRvclxuXG4gICAgdGhpcy5fdGFyZ2V0ID0gbnVsbDsgLy8gYSByZWdpc3RlciBmb3IgaG9sZGluZyB0aGUgY3VycmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVsZW1lbnQgdGhhdCB0aGUgUmVuZGVyZXIgaXMgb3BlcmF0aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXBvblxuXG4gICAgdGhpcy5fcGFyZW50ID0gbnVsbDsgLy8gYSByZWdpc3RlciBmb3IgaG9sZGluZyB0aGUgcGFyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2YgdGhlIHRhcmdldFxuXG4gICAgdGhpcy5fcGF0aCA9IG51bGw7IC8vIGEgcmVnaXN0ZXIgZm9yIGhvbGRpbmcgdGhlIHBhdGggb2YgdGhlIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHJlZ2lzdGVyIG11c3QgYmUgc2V0IGZpcnN0LCBhbmQgdGhlblxuICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGlsZHJlbiwgdGFyZ2V0LCBhbmQgcGFyZW50IGFyZSBhbGwgbG9va2VkXG4gICAgICAgICAgICAgICAgICAgICAgIC8vIHVwIGZyb20gdGhhdC5cblxuICAgIHRoaXMuX2NoaWxkcmVuID0gW107IC8vIGEgcmVnaXN0ZXIgZm9yIGhvbGRpbmcgdGhlIGNoaWxkcmVuIG9mIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGN1cnJlbnQgdGFyZ2V0LlxuXG4gICAgdGhpcy5fcm9vdCA9IG5ldyBFbGVtZW50Q2FjaGUoZWxlbWVudCwgc2VsZWN0b3IpOyAvLyB0aGUgcm9vdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2YgdGhlIGRvbSB0cmVlIHRoYXQgdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVuZGVyZXIgaXMgcmVzcG9uc2libGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvclxuXG4gICAgdGhpcy5fYm91bmRUcmlnZ2VyRXZlbnQgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzLl90cmlnZ2VyRXZlbnQoZXYpO1xuICAgIH07XG5cbiAgICB0aGlzLl9zZWxlY3RvciA9IHNlbGVjdG9yO1xuXG4gICAgdGhpcy5fZWxlbWVudHMgPSB7fTtcblxuICAgIHRoaXMuX2VsZW1lbnRzW3NlbGVjdG9yXSA9IHRoaXMuX3Jvb3Q7XG5cbiAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pO1xuICAgIHRoaXMuX1ZQdHJhbnNmb3JtID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pO1xuXG4gICAgdGhpcy5fc2l6ZSA9IFtudWxsLCBudWxsXTtcbn1cblxuXG4vKipcbiAqIEF0dGFjaGVzIGFuIEV2ZW50TGlzdGVuZXIgdG8gdGhlIGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBwYXNzZWQgaW4gcGF0aC5cbiAqIFByZXZlbnRzIHRoZSBkZWZhdWx0IGJyb3dzZXIgYWN0aW9uIG9uIGFsbCBzdWJzZXF1ZW50IGV2ZW50cyBpZlxuICogYHByZXZlbnREZWZhdWx0YCBpcyB0cnV0aHkuXG4gKiBBbGwgaW5jb21pbmcgZXZlbnRzIHdpbGwgYmUgZm9yd2FyZGVkIHRvIHRoZSBjb21wb3NpdG9yIGJ5IGludm9raW5nIHRoZVxuICogYHNlbmRFdmVudGAgbWV0aG9kLlxuICogRGVsZWdhdGVzIGV2ZW50cyBpZiBwb3NzaWJsZSBieSBhdHRhY2hpbmcgdGhlIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBjb250ZXh0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBET00gZXZlbnQgdHlwZSAoZS5nLiBjbGljaywgbW91c2VvdmVyKS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcHJldmVudERlZmF1bHQgV2hldGhlciBvciBub3QgdGhlIGRlZmF1bHQgYnJvd3NlciBhY3Rpb24gc2hvdWxkIGJlIHByZXZlbnRlZC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gc3Vic2NyaWJlKHR5cGUsIHByZXZlbnREZWZhdWx0KSB7XG4gICAgLy8gVE9ETyBwcmV2ZW50RGVmYXVsdCBzaG91bGQgYmUgYSBzZXBhcmF0ZSBjb21tYW5kXG4gICAgdGhpcy5fYXNzZXJ0VGFyZ2V0TG9hZGVkKCk7XG5cbiAgICB0aGlzLl90YXJnZXQucHJldmVudERlZmF1bHRbdHlwZV0gPSBwcmV2ZW50RGVmYXVsdDtcbiAgICB0aGlzLl90YXJnZXQuc3Vic2NyaWJlW3R5cGVdID0gdHJ1ZTtcblxuICAgIGlmIChcbiAgICAgICAgIXRoaXMuX3RhcmdldC5saXN0ZW5lcnNbdHlwZV0gJiYgIXRoaXMuX3Jvb3QubGlzdGVuZXJzW3R5cGVdXG4gICAgKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSBldmVudE1hcFt0eXBlXVsxXSA/IHRoaXMuX3Jvb3QgOiB0aGlzLl90YXJnZXQ7XG4gICAgICAgIHRhcmdldC5saXN0ZW5lcnNbdHlwZV0gPSB0aGlzLl9ib3VuZFRyaWdnZXJFdmVudDtcbiAgICAgICAgdGFyZ2V0LmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCB0aGlzLl9ib3VuZFRyaWdnZXJFdmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBiZSBhZGRlZCB1c2luZyBgYWRkRXZlbnRMaXN0ZW5lcmAgdG8gdGhlIGNvcnJlc3BvbmRpbmdcbiAqIERPTUVsZW1lbnQuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldiBET00gRXZlbnQgcGF5bG9hZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5fdHJpZ2dlckV2ZW50ID0gZnVuY3Rpb24gX3RyaWdnZXJFdmVudChldikge1xuICAgIC8vIFVzZSBldi5wYXRoLCB3aGljaCBpcyBhbiBhcnJheSBvZiBFbGVtZW50cyAocG9seWZpbGxlZCBpZiBuZWVkZWQpLlxuICAgIHZhciBldlBhdGggPSBldi5wYXRoID8gZXYucGF0aCA6IF9nZXRQYXRoKGV2KTtcbiAgICAvLyBGaXJzdCBlbGVtZW50IGluIHRoZSBwYXRoIGlzIHRoZSBlbGVtZW50IG9uIHdoaWNoIHRoZSBldmVudCBoYXMgYWN0dWFsbHlcbiAgICAvLyBiZWVuIGVtaXR0ZWQuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldlBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gU2tpcCBub2RlcyB0aGF0IGRvbid0IGhhdmUgYSBkYXRhc2V0IHByb3BlcnR5IG9yIGRhdGEtZmEtcGF0aFxuICAgICAgICAvLyBhdHRyaWJ1dGUuXG4gICAgICAgIGlmICghZXZQYXRoW2ldLmRhdGFzZXQpIGNvbnRpbnVlO1xuICAgICAgICB2YXIgcGF0aCA9IGV2UGF0aFtpXS5kYXRhc2V0LmZhUGF0aDtcbiAgICAgICAgaWYgKCFwYXRoKSBjb250aW51ZTtcblxuICAgICAgICAvLyBTdG9wIGZ1cnRoZXIgZXZlbnQgcHJvcG9nYXRpb24gYW5kIHBhdGggdHJhdmVyc2FsIGFzIHNvb24gYXMgdGhlXG4gICAgICAgIC8vIGZpcnN0IEVsZW1lbnRDYWNoZSBzdWJzY3JpYmluZyBmb3IgdGhlIGVtaXR0ZWQgZXZlbnQgaGFzIGJlZW4gZm91bmQuXG4gICAgICAgIGlmICh0aGlzLl9lbGVtZW50c1twYXRoXSAmJiB0aGlzLl9lbGVtZW50c1twYXRoXS5zdWJzY3JpYmVbZXYudHlwZV0pIHtcbiAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5IHByZXZlbnREZWZhdWx0LiBUaGlzIG5lZWRzIGZvcnRoZXIgY29uc2lkZXJhdGlvbiBhbmRcbiAgICAgICAgICAgIC8vIHNob3VsZCBiZSBvcHRpb25hbC4gRXZlbnR1YWxseSB0aGlzIHNob3VsZCBiZSBhIHNlcGFyYXRlIGNvbW1hbmQvXG4gICAgICAgICAgICAvLyBtZXRob2QuXG4gICAgICAgICAgICBpZiAodGhpcy5fZWxlbWVudHNbcGF0aF0ucHJldmVudERlZmF1bHRbZXYudHlwZV0pIHtcbiAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgTm9ybWFsaXplZEV2ZW50Q29uc3RydWN0b3IgPSBldmVudE1hcFtldi50eXBlXVswXTtcblxuICAgICAgICAgICAgLy8gRmluYWxseSBzZW5kIHRoZSBldmVudCB0byB0aGUgV29ya2VyIFRocmVhZCB0aHJvdWdoIHRoZVxuICAgICAgICAgICAgLy8gY29tcG9zaXRvci5cbiAgICAgICAgICAgIHRoaXMuX2NvbXBvc2l0b3Iuc2VuZEV2ZW50KHBhdGgsIGV2LnR5cGUsIG5ldyBOb3JtYWxpemVkRXZlbnRDb25zdHJ1Y3RvcihldikpO1xuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblxuLyoqXG4gKiBnZXRTaXplT2YgZ2V0cyB0aGUgZG9tIHNpemUgb2YgYSBwYXJ0aWN1bGFyIERPTSBlbGVtZW50LiAgVGhpcyBpc1xuICogbmVlZGVkIGZvciByZW5kZXIgc2l6aW5nIGluIHRoZSBzY2VuZSBncmFwaC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggcGF0aCBvZiB0aGUgTm9kZSBpbiB0aGUgc2NlbmUgZ3JhcGhcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYSB2ZWMzIG9mIHRoZSBvZmZzZXQgc2l6ZSBvZiB0aGUgZG9tIGVsZW1lbnRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLmdldFNpemVPZiA9IGZ1bmN0aW9uIGdldFNpemVPZihwYXRoKSB7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50c1twYXRoXTtcbiAgICBpZiAoIWVsZW1lbnQpIHJldHVybiBudWxsO1xuXG4gICAgdmFyIHJlcyA9IHt2YWw6IGVsZW1lbnQuc2l6ZX07XG4gICAgdGhpcy5fY29tcG9zaXRvci5zZW5kRXZlbnQocGF0aCwgJ3Jlc2l6ZScsIHJlcyk7XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbmZ1bmN0aW9uIF9nZXRQYXRoKGV2KSB7XG4gICAgLy8gVE9ETyBtb3ZlIGludG8gX3RyaWdnZXJFdmVudCwgYXZvaWQgb2JqZWN0IGFsbG9jYXRpb25cbiAgICB2YXIgcGF0aCA9IFtdO1xuICAgIHZhciBub2RlID0gZXYudGFyZ2V0O1xuICAgIHdoaWxlIChub2RlICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgIHBhdGgucHVzaChub2RlKTtcbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGg7XG59XG5cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBzaXplIG9mIHRoZSBjb250ZXh0IGJ5IHF1ZXJ5aW5nIHRoZSBET00gZm9yIGBvZmZzZXRXaWR0aGAgYW5kXG4gKiBgb2Zmc2V0SGVpZ2h0YC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7QXJyYXl9IE9mZnNldCBzaXplLlxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuZ2V0U2l6ZSA9IGZ1bmN0aW9uIGdldFNpemUoKSB7XG4gICAgdGhpcy5fc2l6ZVswXSA9IHRoaXMuX3Jvb3QuZWxlbWVudC5vZmZzZXRXaWR0aDtcbiAgICB0aGlzLl9zaXplWzFdID0gdGhpcy5fcm9vdC5lbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICByZXR1cm4gdGhpcy5fc2l6ZTtcbn07XG5cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5fZ2V0U2l6ZSA9IERPTVJlbmRlcmVyLnByb3RvdHlwZS5nZXRTaXplO1xuXG5cbi8qKlxuICogRXhlY3V0ZXMgdGhlIHJldHJpZXZlZCBkcmF3IGNvbW1hbmRzLiBEcmF3IGNvbW1hbmRzIG9ubHkgcmVmZXIgdG8gdGhlXG4gKiBjcm9zcy1icm93c2VyIG5vcm1hbGl6ZWQgYHRyYW5zZm9ybWAgcHJvcGVydHkuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZW5kZXJTdGF0ZSBkZXNjcmlwdGlvblxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gZHJhdyhyZW5kZXJTdGF0ZSkge1xuICAgIGlmIChyZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZURpcnR5KSB7XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVEaXJ0eSA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVswXSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzBdO1xuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzFdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMV07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMl0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsyXTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVszXSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzNdO1xuXG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bNF0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs0XTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs1XSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzVdO1xuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzZdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bNl07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bN10gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs3XTtcblxuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzhdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bOF07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bOV0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs5XTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMF0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMF07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTFdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTFdO1xuXG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTJdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTJdO1xuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzEzXSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzEzXTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxNF0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxNF07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTVdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTVdO1xuICAgIH1cblxuICAgIGlmIChyZW5kZXJTdGF0ZS52aWV3RGlydHkgfHwgcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVEaXJ0eSkge1xuICAgICAgICBtYXRoLm11bHRpcGx5KHRoaXMuX1ZQdHJhbnNmb3JtLCB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtLCByZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtKTtcbiAgICAgICAgdGhpcy5fcm9vdC5lbGVtZW50LnN0eWxlW1RSQU5TRk9STV0gPSB0aGlzLl9zdHJpbmdpZnlNYXRyaXgodGhpcy5fVlB0cmFuc2Zvcm0pO1xuICAgIH1cbn07XG5cblxuLyoqXG4gKiBJbnRlcm5hbCBoZWxwZXIgZnVuY3Rpb24gdXNlZCBmb3IgZW5zdXJpbmcgdGhhdCBhIHBhdGggaXMgY3VycmVudGx5IGxvYWRlZC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5fYXNzZXJ0UGF0aExvYWRlZCA9IGZ1bmN0aW9uIF9hc3NlclBhdGhMb2FkZWQoKSB7XG4gICAgaWYgKCF0aGlzLl9wYXRoKSB0aHJvdyBuZXcgRXJyb3IoJ3BhdGggbm90IGxvYWRlZCcpO1xufTtcblxuLyoqXG4gKiBJbnRlcm5hbCBoZWxwZXIgZnVuY3Rpb24gdXNlZCBmb3IgZW5zdXJpbmcgdGhhdCBhIHBhcmVudCBpcyBjdXJyZW50bHkgbG9hZGVkLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLl9hc3NlcnRQYXJlbnRMb2FkZWQgPSBmdW5jdGlvbiBfYXNzZXJ0UGFyZW50TG9hZGVkKCkge1xuICAgIGlmICghdGhpcy5fcGFyZW50KSB0aHJvdyBuZXcgRXJyb3IoJ3BhcmVudCBub3QgbG9hZGVkJyk7XG59O1xuXG4vKipcbiAqIEludGVybmFsIGhlbHBlciBmdW5jdGlvbiB1c2VkIGZvciBlbnN1cmluZyB0aGF0IGNoaWxkcmVuIGFyZSBjdXJyZW50bHlcbiAqIGxvYWRlZC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5fYXNzZXJ0Q2hpbGRyZW5Mb2FkZWQgPSBmdW5jdGlvbiBfYXNzZXJ0Q2hpbGRyZW5Mb2FkZWQoKSB7XG4gICAgaWYgKCF0aGlzLl9jaGlsZHJlbikgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiBub3QgbG9hZGVkJyk7XG59O1xuXG4vKipcbiAqIEludGVybmFsIGhlbHBlciBmdW5jdGlvbiB1c2VkIGZvciBlbnN1cmluZyB0aGF0IGEgdGFyZ2V0IGlzIGN1cnJlbnRseSBsb2FkZWQuXG4gKlxuICogQG1ldGhvZCAgX2Fzc2VydFRhcmdldExvYWRlZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5fYXNzZXJ0VGFyZ2V0TG9hZGVkID0gZnVuY3Rpb24gX2Fzc2VydFRhcmdldExvYWRlZCgpIHtcbiAgICBpZiAoIXRoaXMuX3RhcmdldCkgdGhyb3cgbmV3IEVycm9yKCdObyB0YXJnZXQgbG9hZGVkJyk7XG59O1xuXG4vKipcbiAqIEZpbmRzIGFuZCBzZXRzIHRoZSBwYXJlbnQgb2YgdGhlIGN1cnJlbnRseSBsb2FkZWQgZWxlbWVudCAocGF0aCkuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcmV0dXJuIHtFbGVtZW50Q2FjaGV9IFBhcmVudCBlbGVtZW50LlxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuZmluZFBhcmVudCA9IGZ1bmN0aW9uIGZpbmRQYXJlbnQgKCkge1xuICAgIHRoaXMuX2Fzc2VydFBhdGhMb2FkZWQoKTtcblxuICAgIHZhciBwYXRoID0gdGhpcy5fcGF0aDtcbiAgICB2YXIgcGFyZW50O1xuXG4gICAgd2hpbGUgKCFwYXJlbnQgJiYgcGF0aC5sZW5ndGgpIHtcbiAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIHBhdGgubGFzdEluZGV4T2YoJy8nKSk7XG4gICAgICAgIHBhcmVudCA9IHRoaXMuX2VsZW1lbnRzW3BhdGhdO1xuICAgIH1cbiAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gICAgcmV0dXJuIHBhcmVudDtcbn07XG5cblxuLyoqXG4gKiBGaW5kcyBhbGwgY2hpbGRyZW4gb2YgdGhlIGN1cnJlbnRseSBsb2FkZWQgZWxlbWVudC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IE91dHB1dC1BcnJheSB1c2VkIGZvciB3cml0aW5nIHRvIChzdWJzZXF1ZW50bHkgYXBwZW5kaW5nIGNoaWxkcmVuKVxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheSBvZiBjaGlsZHJlbiBlbGVtZW50c1xuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuZmluZENoaWxkcmVuID0gZnVuY3Rpb24gZmluZENoaWxkcmVuKGFycmF5KSB7XG4gICAgLy8gVE9ETzogT3B0aW1pemUgbWUuXG4gICAgdGhpcy5fYXNzZXJ0UGF0aExvYWRlZCgpO1xuXG4gICAgdmFyIHBhdGggPSB0aGlzLl9wYXRoICsgJy8nO1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGhpcy5fZWxlbWVudHMpO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgbGVuO1xuICAgIGFycmF5ID0gYXJyYXkgPyBhcnJheSA6IHRoaXMuX2NoaWxkcmVuO1xuXG4gICAgdGhpcy5fY2hpbGRyZW4ubGVuZ3RoID0gMDtcblxuICAgIHdoaWxlIChpIDwga2V5cy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGtleXNbaV0uaW5kZXhPZihwYXRoKSA9PT0gLTEgfHwga2V5c1tpXSA9PT0gcGF0aCkga2V5cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGVsc2UgaSsrO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFBhdGg7XG4gICAgdmFyIGogPSAwO1xuICAgIGZvciAoaSA9IDAgOyBpIDwga2V5cy5sZW5ndGggOyBpKyspIHtcbiAgICAgICAgY3VycmVudFBhdGggPSBrZXlzW2ldO1xuICAgICAgICBmb3IgKGogPSAwIDsgaiA8IGtleXMubGVuZ3RoIDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoaSAhPT0gaiAmJiBrZXlzW2pdLmluZGV4T2YoY3VycmVudFBhdGgpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGtleXMuc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aCA7IGkgPCBsZW4gOyBpKyspXG4gICAgICAgIGFycmF5W2ldID0gdGhpcy5fZWxlbWVudHNba2V5c1tpXV07XG5cbiAgICByZXR1cm4gYXJyYXk7XG59O1xuXG5cbi8qKlxuICogVXNlZCBmb3IgZGV0ZXJtaW5pbmcgdGhlIHRhcmdldCBsb2FkZWQgdW5kZXIgdGhlIGN1cnJlbnQgcGF0aC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RWxlbWVudENhY2hlfHVuZGVmaW5lZH0gRWxlbWVudCBsb2FkZWQgdW5kZXIgZGVmaW5lZCBwYXRoLlxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuZmluZFRhcmdldCA9IGZ1bmN0aW9uIGZpbmRUYXJnZXQoKSB7XG4gICAgdGhpcy5fdGFyZ2V0ID0gdGhpcy5fZWxlbWVudHNbdGhpcy5fcGF0aF07XG4gICAgcmV0dXJuIHRoaXMuX3RhcmdldDtcbn07XG5cblxuLyoqXG4gKiBMb2FkcyB0aGUgcGFzc2VkIGluIHBhdGguXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdG8gYmUgbG9hZGVkXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBMb2FkZWQgcGF0aFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUubG9hZFBhdGggPSBmdW5jdGlvbiBsb2FkUGF0aCAocGF0aCkge1xuICAgIHRoaXMuX3BhdGggPSBwYXRoO1xuICAgIHJldHVybiB0aGlzLl9wYXRoO1xufTtcblxuXG4vKipcbiAqIEluc2VydHMgYSBET01FbGVtZW50IGF0IHRoZSBjdXJyZW50bHkgbG9hZGVkIHBhdGgsIGFzc3VtaW5nIG5vIHRhcmdldCBpc1xuICogbG9hZGVkLiBPbmx5IG9uZSBET01FbGVtZW50IGNhbiBiZSBhc3NvY2lhdGVkIHdpdGggZWFjaCBwYXRoLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdGFnTmFtZSBUYWcgbmFtZSAoY2FwaXRhbGl6YXRpb24gd2lsbCBiZSBub3JtYWxpemVkKS5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuaW5zZXJ0RWwgPSBmdW5jdGlvbiBpbnNlcnRFbCAodGFnTmFtZSkge1xuICAgIGlmICghdGhpcy5fdGFyZ2V0IHx8XG4gICAgICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSAhPT0gdGFnTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG5cbiAgICAgICAgdGhpcy5maW5kUGFyZW50KCk7XG4gICAgICAgIHRoaXMuZmluZENoaWxkcmVuKCk7XG5cbiAgICAgICAgdGhpcy5fYXNzZXJ0UGFyZW50TG9hZGVkKCk7XG4gICAgICAgIHRoaXMuX2Fzc2VydENoaWxkcmVuTG9hZGVkKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuX3RhcmdldCkgdGhpcy5fcGFyZW50LmVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5fdGFyZ2V0LmVsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuX3RhcmdldCA9IG5ldyBFbGVtZW50Q2FjaGUoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKSwgdGhpcy5fcGF0aCk7XG4gICAgICAgIHRoaXMuX3BhcmVudC5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX3RhcmdldC5lbGVtZW50KTtcbiAgICAgICAgdGhpcy5fZWxlbWVudHNbdGhpcy5fcGF0aF0gPSB0aGlzLl90YXJnZXQ7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aCA7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2NoaWxkcmVuW2ldLmVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuXG4vKipcbiAqIFNldHMgYSBwcm9wZXJ0eSBvbiB0aGUgY3VycmVudGx5IGxvYWRlZCB0YXJnZXQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFByb3BlcnR5IG5hbWUgKGUuZy4gYmFja2dyb3VuZCwgY29sb3IsIGZvbnQpXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgUHJvcHJ0eSB2YWx1ZSAoZS5nLiBibGFjaywgMjBweClcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuc2V0UHJvcGVydHkgPSBmdW5jdGlvbiBzZXRQcm9wZXJ0eSAobmFtZSwgdmFsdWUpIHtcbiAgICB0aGlzLl9hc3NlcnRUYXJnZXRMb2FkZWQoKTtcbiAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5zdHlsZVtuYW1lXSA9IHZhbHVlO1xufTtcblxuXG4vKipcbiAqIFNldHMgdGhlIHNpemUgb2YgdGhlIGN1cnJlbnRseSBsb2FkZWQgdGFyZ2V0LlxuICogUmVtb3ZlcyBhbnkgZXhwbGljaXQgc2l6aW5nIGNvbnN0cmFpbnRzIHdoZW4gcGFzc2VkIGluIGBmYWxzZWBcbiAqIChcInRydWUtc2l6aW5nXCIpLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcnxmYWxzZX0gd2lkdGggICBXaWR0aCB0byBiZSBzZXQuXG4gKiBAcGFyYW0ge051bWJlcnxmYWxzZX0gaGVpZ2h0ICBIZWlnaHQgdG8gYmUgc2V0LlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5zZXRTaXplID0gZnVuY3Rpb24gc2V0U2l6ZSAod2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMuX2Fzc2VydFRhcmdldExvYWRlZCgpO1xuXG4gICAgdGhpcy5zZXRXaWR0aCh3aWR0aCk7XG4gICAgdGhpcy5zZXRIZWlnaHQoaGVpZ2h0KTtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgd2lkdGggb2YgdGhlIGN1cnJlbnRseSBsb2FkZWQgdGFyZ2V0LlxuICogUmVtb3ZlcyBhbnkgZXhwbGljaXQgc2l6aW5nIGNvbnN0cmFpbnRzIHdoZW4gcGFzc2VkIGluIGBmYWxzZWBcbiAqIChcInRydWUtc2l6aW5nXCIpLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcnxmYWxzZX0gd2lkdGggV2lkdGggdG8gYmUgc2V0LlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5zZXRXaWR0aCA9IGZ1bmN0aW9uIHNldFdpZHRoKHdpZHRoKSB7XG4gICAgdGhpcy5fYXNzZXJ0VGFyZ2V0TG9hZGVkKCk7XG5cbiAgICB2YXIgY29udGVudFdyYXBwZXIgPSB0aGlzLl90YXJnZXQuY29udGVudDtcblxuICAgIGlmICh3aWR0aCA9PT0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmV4cGxpY2l0V2lkdGggPSB0cnVlO1xuICAgICAgICBpZiAoY29udGVudFdyYXBwZXIpIGNvbnRlbnRXcmFwcGVyLnN0eWxlLndpZHRoID0gJyc7XG4gICAgICAgIHdpZHRoID0gY29udGVudFdyYXBwZXIgPyBjb250ZW50V3JhcHBlci5vZmZzZXRXaWR0aCA6IDA7XG4gICAgICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmV4cGxpY2l0V2lkdGggPSBmYWxzZTtcbiAgICAgICAgaWYgKGNvbnRlbnRXcmFwcGVyKSBjb250ZW50V3JhcHBlci5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgfVxuXG4gICAgdGhpcy5fdGFyZ2V0LnNpemVbMF0gPSB3aWR0aDtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgaGVpZ2h0IG9mIHRoZSBjdXJyZW50bHkgbG9hZGVkIHRhcmdldC5cbiAqIFJlbW92ZXMgYW55IGV4cGxpY2l0IHNpemluZyBjb25zdHJhaW50cyB3aGVuIHBhc3NlZCBpbiBgZmFsc2VgXG4gKiAoXCJ0cnVlLXNpemluZ1wiKS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ8ZmFsc2V9IGhlaWdodCBIZWlnaHQgdG8gYmUgc2V0LlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5zZXRIZWlnaHQgPSBmdW5jdGlvbiBzZXRIZWlnaHQoaGVpZ2h0KSB7XG4gICAgdGhpcy5fYXNzZXJ0VGFyZ2V0TG9hZGVkKCk7XG5cbiAgICB2YXIgY29udGVudFdyYXBwZXIgPSB0aGlzLl90YXJnZXQuY29udGVudDtcblxuICAgIGlmIChoZWlnaHQgPT09IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuX3RhcmdldC5leHBsaWNpdEhlaWdodCA9IHRydWU7XG4gICAgICAgIGlmIChjb250ZW50V3JhcHBlcikgY29udGVudFdyYXBwZXIuc3R5bGUuaGVpZ2h0ID0gJyc7XG4gICAgICAgIGhlaWdodCA9IGNvbnRlbnRXcmFwcGVyID8gY29udGVudFdyYXBwZXIub2Zmc2V0SGVpZ2h0IDogMDtcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMuX3RhcmdldC5leHBsaWNpdEhlaWdodCA9IGZhbHNlO1xuICAgICAgICBpZiAoY29udGVudFdyYXBwZXIpIGNvbnRlbnRXcmFwcGVyLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gICAgICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gICAgfVxuXG4gICAgdGhpcy5fdGFyZ2V0LnNpemVbMV0gPSBoZWlnaHQ7XG59O1xuXG4vKipcbiAqIFNldHMgYW4gYXR0cmlidXRlIG9uIHRoZSBjdXJyZW50bHkgbG9hZGVkIHRhcmdldC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgQXR0cmlidXRlIG5hbWUgKGUuZy4gaHJlZilcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZSBBdHRyaWJ1dGUgdmFsdWUgKGUuZy4gaHR0cDovL2ZhbW91cy5vcmcpXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLnNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uIHNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMuX2Fzc2VydFRhcmdldExvYWRlZCgpO1xuICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIGBpbm5lckhUTUxgIGNvbnRlbnQgb2YgdGhlIGN1cnJlbnRseSBsb2FkZWQgdGFyZ2V0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gY29udGVudCBDb250ZW50IHRvIGJlIHNldCBhcyBgaW5uZXJIVE1MYFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24gc2V0Q29udGVudChjb250ZW50KSB7XG4gICAgdGhpcy5fYXNzZXJ0VGFyZ2V0TG9hZGVkKCk7XG4gICAgdGhpcy5maW5kQ2hpbGRyZW4oKTtcblxuICAgIGlmICghdGhpcy5fdGFyZ2V0LmNvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmNvbnRlbnQuY2xhc3NMaXN0LmFkZCgnZmFtb3VzLWRvbS1lbGVtZW50LWNvbnRlbnQnKTtcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuaW5zZXJ0QmVmb3JlKFxuICAgICAgICAgICAgdGhpcy5fdGFyZ2V0LmNvbnRlbnQsXG4gICAgICAgICAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5maXJzdENoaWxkXG4gICAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuX3RhcmdldC5jb250ZW50LmlubmVySFRNTCA9IGNvbnRlbnQ7XG5cbiAgICB0aGlzLnNldFNpemUoXG4gICAgICAgIHRoaXMuX3RhcmdldC5leHBsaWNpdFdpZHRoID8gZmFsc2UgOiB0aGlzLl90YXJnZXQuc2l6ZVswXSxcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmV4cGxpY2l0SGVpZ2h0ID8gZmFsc2UgOiB0aGlzLl90YXJnZXQuc2l6ZVsxXVxuICAgICk7XG59O1xuXG5cbi8qKlxuICogU2V0cyB0aGUgcGFzc2VkIGluIHRyYW5zZm9ybSBtYXRyaXggKHdvcmxkIHNwYWNlKS4gSW52ZXJ0cyB0aGUgcGFyZW50J3Mgd29ybGRcbiAqIHRyYW5zZm9ybS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtGbG9hdDMyQXJyYXl9IHRyYW5zZm9ybSBUaGUgdHJhbnNmb3JtIGZvciB0aGUgbG9hZGVkIERPTSBFbGVtZW50IGluIHdvcmxkIHNwYWNlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLnNldE1hdHJpeCA9IGZ1bmN0aW9uIHNldE1hdHJpeCh0cmFuc2Zvcm0pIHtcbiAgICAvLyBUT0RPIERvbid0IG11bHRpcGx5IG1hdHJpY3MgaW4gdGhlIGZpcnN0IHBsYWNlLlxuICAgIHRoaXMuX2Fzc2VydFRhcmdldExvYWRlZCgpO1xuICAgIHRoaXMuZmluZFBhcmVudCgpO1xuICAgIHZhciB3b3JsZFRyYW5zZm9ybSA9IHRoaXMuX3RhcmdldC53b3JsZFRyYW5zZm9ybTtcbiAgICB2YXIgY2hhbmdlZCA9IGZhbHNlO1xuXG4gICAgdmFyIGk7XG4gICAgdmFyIGxlbjtcblxuICAgIGlmICh0cmFuc2Zvcm0pXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IDE2IDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgY2hhbmdlZCA9IGNoYW5nZWQgPyBjaGFuZ2VkIDogd29ybGRUcmFuc2Zvcm1baV0gPT09IHRyYW5zZm9ybVtpXTtcbiAgICAgICAgICAgIHdvcmxkVHJhbnNmb3JtW2ldID0gdHJhbnNmb3JtW2ldO1xuICAgICAgICB9XG4gICAgZWxzZSBjaGFuZ2VkID0gdHJ1ZTtcblxuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICAgIG1hdGguaW52ZXJ0KHRoaXMuX3RhcmdldC5pbnZlcnRlZFBhcmVudCwgdGhpcy5fcGFyZW50LndvcmxkVHJhbnNmb3JtKTtcbiAgICAgICAgbWF0aC5tdWx0aXBseSh0aGlzLl90YXJnZXQuZmluYWxUcmFuc2Zvcm0sIHRoaXMuX3RhcmdldC5pbnZlcnRlZFBhcmVudCwgd29ybGRUcmFuc2Zvcm0pO1xuXG4gICAgICAgIC8vIFRPRE86IHRoaXMgaXMgYSB0ZW1wb3JhcnkgZml4IGZvciBkcmF3IGNvbW1hbmRzXG4gICAgICAgIC8vIGNvbWluZyBpbiBvdXQgb2Ygb3JkZXJcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5maW5kQ2hpbGRyZW4oW10pO1xuICAgICAgICB2YXIgcHJldmlvdXNQYXRoID0gdGhpcy5fcGF0aDtcbiAgICAgICAgdmFyIHByZXZpb3VzVGFyZ2V0ID0gdGhpcy5fdGFyZ2V0O1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBjaGlsZHJlbi5sZW5ndGggOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLl90YXJnZXQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgIHRoaXMuX3BhdGggPSB0aGlzLl90YXJnZXQucGF0aDtcbiAgICAgICAgICAgIHRoaXMuc2V0TWF0cml4KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcGF0aCA9IHByZXZpb3VzUGF0aDtcbiAgICAgICAgdGhpcy5fdGFyZ2V0ID0gcHJldmlvdXNUYXJnZXQ7XG4gICAgfVxuXG4gICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuc3R5bGVbVFJBTlNGT1JNXSA9IHRoaXMuX3N0cmluZ2lmeU1hdHJpeCh0aGlzLl90YXJnZXQuZmluYWxUcmFuc2Zvcm0pO1xufTtcblxuXG4vKipcbiAqIEFkZHMgYSBjbGFzcyB0byB0aGUgY2xhc3NMaXN0IGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudGx5IGxvYWRlZCB0YXJnZXQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBkb21DbGFzcyBDbGFzcyBuYW1lIHRvIGJlIGFkZGVkIHRvIHRoZSBjdXJyZW50IHRhcmdldC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuYWRkQ2xhc3MgPSBmdW5jdGlvbiBhZGRDbGFzcyhkb21DbGFzcykge1xuICAgIHRoaXMuX2Fzc2VydFRhcmdldExvYWRlZCgpO1xuICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LmNsYXNzTGlzdC5hZGQoZG9tQ2xhc3MpO1xufTtcblxuXG4vKipcbiAqIFJlbW92ZXMgYSBjbGFzcyBmcm9tIHRoZSBjbGFzc0xpc3QgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50bHkgbG9hZGVkXG4gKiB0YXJnZXQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBkb21DbGFzcyBDbGFzcyBuYW1lIHRvIGJlIHJlbW92ZWQgZnJvbSBjdXJyZW50bHkgbG9hZGVkIHRhcmdldC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbiByZW1vdmVDbGFzcyhkb21DbGFzcykge1xuICAgIHRoaXMuX2Fzc2VydFRhcmdldExvYWRlZCgpO1xuICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoZG9tQ2xhc3MpO1xufTtcblxuXG4vKipcbiAqIFN0cmluZ2lmaWVzIHRoZSBwYXNzZWQgaW4gbWF0cml4IGZvciBzZXR0aW5nIHRoZSBgdHJhbnNmb3JtYCBwcm9wZXJ0eS5cbiAqXG4gKiBAbWV0aG9kICBfc3RyaW5naWZ5TWF0cml4XG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IG0gICAgTWF0cml4IGFzIGFuIGFycmF5IG9yIGFycmF5LWxpa2Ugb2JqZWN0LlxuICogQHJldHVybiB7U3RyaW5nfSAgICAgU3RyaW5naWZpZWQgbWF0cml4IGFzIGBtYXRyaXgzZGAtcHJvcGVydHkuXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5fc3RyaW5naWZ5TWF0cml4ID0gZnVuY3Rpb24gX3N0cmluZ2lmeU1hdHJpeChtKSB7XG4gICAgdmFyIHIgPSAnbWF0cml4M2QoJztcblxuICAgIHIgKz0gKG1bMF0gPCAwLjAwMDAwMSAmJiBtWzBdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzBdICsgJywnO1xuICAgIHIgKz0gKG1bMV0gPCAwLjAwMDAwMSAmJiBtWzFdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzFdICsgJywnO1xuICAgIHIgKz0gKG1bMl0gPCAwLjAwMDAwMSAmJiBtWzJdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzJdICsgJywnO1xuICAgIHIgKz0gKG1bM10gPCAwLjAwMDAwMSAmJiBtWzNdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzNdICsgJywnO1xuICAgIHIgKz0gKG1bNF0gPCAwLjAwMDAwMSAmJiBtWzRdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzRdICsgJywnO1xuICAgIHIgKz0gKG1bNV0gPCAwLjAwMDAwMSAmJiBtWzVdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzVdICsgJywnO1xuICAgIHIgKz0gKG1bNl0gPCAwLjAwMDAwMSAmJiBtWzZdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzZdICsgJywnO1xuICAgIHIgKz0gKG1bN10gPCAwLjAwMDAwMSAmJiBtWzddID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzddICsgJywnO1xuICAgIHIgKz0gKG1bOF0gPCAwLjAwMDAwMSAmJiBtWzhdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzhdICsgJywnO1xuICAgIHIgKz0gKG1bOV0gPCAwLjAwMDAwMSAmJiBtWzldID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzldICsgJywnO1xuICAgIHIgKz0gKG1bMTBdIDwgMC4wMDAwMDEgJiYgbVsxMF0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bMTBdICsgJywnO1xuICAgIHIgKz0gKG1bMTFdIDwgMC4wMDAwMDEgJiYgbVsxMV0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bMTFdICsgJywnO1xuICAgIHIgKz0gKG1bMTJdIDwgMC4wMDAwMDEgJiYgbVsxMl0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bMTJdICsgJywnO1xuICAgIHIgKz0gKG1bMTNdIDwgMC4wMDAwMDEgJiYgbVsxM10gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bMTNdICsgJywnO1xuICAgIHIgKz0gKG1bMTRdIDwgMC4wMDAwMDEgJiYgbVsxNF0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bMTRdICsgJywnO1xuXG4gICAgciArPSBtWzE1XSArICcpJztcbiAgICByZXR1cm4gcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRE9NUmVuZGVyZXI7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBUcmFuc2Zvcm0gaWRlbnRpdHkgbWF0cml4LiBcbnZhciBpZGVudCA9IFtcbiAgICAxLCAwLCAwLCAwLFxuICAgIDAsIDEsIDAsIDAsXG4gICAgMCwgMCwgMSwgMCxcbiAgICAwLCAwLCAwLCAxXG5dO1xuXG4vKipcbiAqIEVsZW1lbnRDYWNoZSBpcyBiZWluZyB1c2VkIGZvciBrZWVwaW5nIHRyYWNrIG9mIGFuIGVsZW1lbnQncyBET00gRWxlbWVudCxcbiAqIHBhdGgsIHdvcmxkIHRyYW5zZm9ybSwgaW52ZXJ0ZWQgcGFyZW50LCBmaW5hbCB0cmFuc2Zvcm0gKGFzIGJlaW5nIHVzZWQgZm9yXG4gKiBzZXR0aW5nIHRoZSBhY3R1YWwgYHRyYW5zZm9ybWAtcHJvcGVydHkpIGFuZCBwb3N0IHJlbmRlciBzaXplIChmaW5hbCBzaXplIGFzXG4gKiBiZWluZyByZW5kZXJlZCB0byB0aGUgRE9NKS5cbiAqIFxuICogQGNsYXNzIEVsZW1lbnRDYWNoZVxuICogIFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IERPTUVsZW1lbnRcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBmb3IgdW5pcXVlbHkgaWRlbnRpZnlpbmcgdGhlIGxvY2F0aW9uIGluIHRoZSBzY2VuZSBncmFwaC5cbiAqLyBcbmZ1bmN0aW9uIEVsZW1lbnRDYWNoZSAoZWxlbWVudCwgcGF0aCkge1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLmNvbnRlbnQgPSBudWxsO1xuICAgIHRoaXMuc2l6ZSA9IG5ldyBJbnQxNkFycmF5KDMpO1xuICAgIHRoaXMuZXhwbGljaXRIZWlnaHQgPSBmYWxzZTtcbiAgICB0aGlzLmV4cGxpY2l0V2lkdGggPSBmYWxzZTtcbiAgICB0aGlzLndvcmxkVHJhbnNmb3JtID0gbmV3IEZsb2F0MzJBcnJheShpZGVudCk7XG4gICAgdGhpcy5pbnZlcnRlZFBhcmVudCA9IG5ldyBGbG9hdDMyQXJyYXkoaWRlbnQpO1xuICAgIHRoaXMuZmluYWxUcmFuc2Zvcm0gPSBuZXcgRmxvYXQzMkFycmF5KGlkZW50KTtcbiAgICB0aGlzLnBvc3RSZW5kZXJTaXplID0gbmV3IEZsb2F0MzJBcnJheSgyKTtcbiAgICB0aGlzLmxpc3RlbmVycyA9IHt9O1xuICAgIHRoaXMucHJldmVudERlZmF1bHQgPSB7fTtcbiAgICB0aGlzLnN1YnNjcmliZSA9IHt9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVsZW1lbnRDYWNoZTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBBIG1ldGhvZCBmb3IgaW52ZXJ0aW5nIGEgdHJhbnNmb3JtIG1hdHJpeFxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBvdXQgYXJyYXkgdG8gc3RvcmUgdGhlIHJldHVybiBvZiB0aGUgaW52ZXJzaW9uXG4gKiBAcGFyYW0ge0FycmF5fSBhIHRyYW5zZm9ybSBtYXRyaXggdG8gaW52ZXJzZVxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBvdXRcbiAqICAgb3V0cHV0IGFycmF5IHRoYXQgaXMgc3RvcmluZyB0aGUgdHJhbnNmb3JtIG1hdHJpeFxuICovXG5mdW5jdGlvbiBpbnZlcnQgKG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdLFxuXG4gICAgICAgIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCxcbiAgICAgICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgICAgICBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsXG4gICAgICAgIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSxcbiAgICAgICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgICAgICBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsXG4gICAgICAgIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCxcbiAgICAgICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgICAgICBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsXG4gICAgICAgIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSxcbiAgICAgICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgICAgICBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzIsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgICAgICBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XG5cbiAgICBpZiAoIWRldCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZGV0ID0gMS4wIC8gZGV0O1xuXG4gICAgb3V0WzBdID0gKGExMSAqIGIxMSAtIGExMiAqIGIxMCArIGExMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0WzFdID0gKGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0WzJdID0gKGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0WzNdID0gKGEyMiAqIGIwNCAtIGEyMSAqIGIwNSAtIGEyMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0WzRdID0gKGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0WzVdID0gKGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0WzZdID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0WzddID0gKGEyMCAqIGIwNSAtIGEyMiAqIGIwMiArIGEyMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0WzhdID0gKGExMCAqIGIxMCAtIGExMSAqIGIwOCArIGExMyAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzldID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzEwXSA9IChhMzAgKiBiMDQgLSBhMzEgKiBiMDIgKyBhMzMgKiBiMDApICogZGV0O1xuICAgIG91dFsxMV0gPSAoYTIxICogYjAyIC0gYTIwICogYjA0IC0gYTIzICogYjAwKSAqIGRldDtcbiAgICBvdXRbMTJdID0gKGExMSAqIGIwNyAtIGExMCAqIGIwOSAtIGExMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzEzXSA9IChhMDAgKiBiMDkgLSBhMDEgKiBiMDcgKyBhMDIgKiBiMDYpICogZGV0O1xuICAgIG91dFsxNF0gPSAoYTMxICogYjAxIC0gYTMwICogYjAzIC0gYTMyICogYjAwKSAqIGRldDtcbiAgICBvdXRbMTVdID0gKGEyMCAqIGIwMyAtIGEyMSAqIGIwMSArIGEyMiAqIGIwMCkgKiBkZXQ7XG5cbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEEgbWV0aG9kIGZvciBtdWx0aXBseWluZyB0d28gbWF0cmljaWVzXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IG91dCBhcnJheSB0byBzdG9yZSB0aGUgcmV0dXJuIG9mIHRoZSBtdWx0aXBsaWNhdGlvblxuICogQHBhcmFtIHtBcnJheX0gYSB0cmFuc2Zvcm0gbWF0cml4IHRvIG11bHRpcGx5XG4gKiBAcGFyYW0ge0FycmF5fSBiIHRyYW5zZm9ybSBtYXRyaXggdG8gbXVsdGlwbHlcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gb3V0XG4gKiAgIG91dHB1dCBhcnJheSB0aGF0IGlzIHN0b3JpbmcgdGhlIHRyYW5zZm9ybSBtYXRyaXhcbiAqL1xuZnVuY3Rpb24gbXVsdGlwbHkgKG91dCwgYSwgYikge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdLFxuXG4gICAgICAgIGIwID0gYlswXSwgYjEgPSBiWzFdLCBiMiA9IGJbMl0sIGIzID0gYlszXSxcbiAgICAgICAgYjQgPSBiWzRdLCBiNSA9IGJbNV0sIGI2ID0gYls2XSwgYjcgPSBiWzddLFxuICAgICAgICBiOCA9IGJbOF0sIGI5ID0gYls5XSwgYjEwID0gYlsxMF0sIGIxMSA9IGJbMTFdLFxuICAgICAgICBiMTIgPSBiWzEyXSwgYjEzID0gYlsxM10sIGIxNCA9IGJbMTRdLCBiMTUgPSBiWzE1XTtcblxuICAgIHZhciBjaGFuZ2VkID0gZmFsc2U7XG4gICAgdmFyIG91dDAsIG91dDEsIG91dDIsIG91dDM7XG5cbiAgICBvdXQwID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dDEgPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0MiA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXQzID0gYjAqYTAzICsgYjEqYTEzICsgYjIqYTIzICsgYjMqYTMzO1xuXG4gICAgY2hhbmdlZCA9IGNoYW5nZWQgP1xuICAgICAgICAgICAgICBjaGFuZ2VkIDogb3V0MCA9PT0gb3V0WzBdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQxID09PSBvdXRbMV0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDIgPT09IG91dFsyXSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MyA9PT0gb3V0WzNdO1xuXG4gICAgb3V0WzBdID0gb3V0MDtcbiAgICBvdXRbMV0gPSBvdXQxO1xuICAgIG91dFsyXSA9IG91dDI7XG4gICAgb3V0WzNdID0gb3V0MztcblxuICAgIGIwID0gYjQ7IGIxID0gYjU7IGIyID0gYjY7IGIzID0gYjc7XG4gICAgb3V0MCA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXQxID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dDIgPSBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzI7XG4gICAgb3V0MyA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcblxuICAgIGNoYW5nZWQgPSBjaGFuZ2VkID9cbiAgICAgICAgICAgICAgY2hhbmdlZCA6IG91dDAgPT09IG91dFs0XSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MSA9PT0gb3V0WzVdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQyID09PSBvdXRbNl0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDMgPT09IG91dFs3XTtcblxuICAgIG91dFs0XSA9IG91dDA7XG4gICAgb3V0WzVdID0gb3V0MTtcbiAgICBvdXRbNl0gPSBvdXQyO1xuICAgIG91dFs3XSA9IG91dDM7XG5cbiAgICBiMCA9IGI4OyBiMSA9IGI5OyBiMiA9IGIxMDsgYjMgPSBiMTE7XG4gICAgb3V0MCA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXQxID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dDIgPSBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzI7XG4gICAgb3V0MyA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcblxuICAgIGNoYW5nZWQgPSBjaGFuZ2VkID9cbiAgICAgICAgICAgICAgY2hhbmdlZCA6IG91dDAgPT09IG91dFs4XSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MSA9PT0gb3V0WzldIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQyID09PSBvdXRbMTBdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQzID09PSBvdXRbMTFdO1xuXG4gICAgb3V0WzhdID0gb3V0MDtcbiAgICBvdXRbOV0gPSBvdXQxO1xuICAgIG91dFsxMF0gPSBvdXQyO1xuICAgIG91dFsxMV0gPSBvdXQzO1xuXG4gICAgYjAgPSBiMTI7IGIxID0gYjEzOyBiMiA9IGIxNDsgYjMgPSBiMTU7XG4gICAgb3V0MCA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXQxID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dDIgPSBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzI7XG4gICAgb3V0MyA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcblxuICAgIGNoYW5nZWQgPSBjaGFuZ2VkID9cbiAgICAgICAgICAgICAgY2hhbmdlZCA6IG91dDAgPT09IG91dFsxMl0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDEgPT09IG91dFsxM10gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDIgPT09IG91dFsxNF0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDMgPT09IG91dFsxNV07XG5cbiAgICBvdXRbMTJdID0gb3V0MDtcbiAgICBvdXRbMTNdID0gb3V0MTtcbiAgICBvdXRbMTRdID0gb3V0MjtcbiAgICBvdXRbMTVdID0gb3V0MztcblxuICAgIHJldHVybiBvdXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG11bHRpcGx5OiBtdWx0aXBseSxcbiAgICBpbnZlcnQ6IGludmVydFxufTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFVJRXZlbnQgPSByZXF1aXJlKCcuL1VJRXZlbnQnKTtcblxuLyoqXG4gKiBTZWUgW1VJIEV2ZW50cyAoZm9ybWVybHkgRE9NIExldmVsIDMgRXZlbnRzKV0oaHR0cDovL3d3dy53My5vcmcvVFIvMjAxNS9XRC11aWV2ZW50cy0yMDE1MDQyOC8jZXZlbnRzLWNvbXBvc2l0aW9uZXZlbnRzKS5cbiAqXG4gKiBAY2xhc3MgQ29tcG9zaXRpb25FdmVudFxuICogQGF1Z21lbnRzIFVJRXZlbnRcbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldiBUaGUgbmF0aXZlIERPTSBldmVudC5cbiAqL1xuZnVuY3Rpb24gQ29tcG9zaXRpb25FdmVudChldikge1xuICAgIC8vIFtDb25zdHJ1Y3RvcihET01TdHJpbmcgdHlwZUFyZywgb3B0aW9uYWwgQ29tcG9zaXRpb25FdmVudEluaXQgY29tcG9zaXRpb25FdmVudEluaXREaWN0KV1cbiAgICAvLyBpbnRlcmZhY2UgQ29tcG9zaXRpb25FdmVudCA6IFVJRXZlbnQge1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgRE9NU3RyaW5nIGRhdGE7XG4gICAgLy8gfTtcblxuICAgIFVJRXZlbnQuY2FsbCh0aGlzLCBldik7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBDb21wb3NpdGlvbkV2ZW50I2RhdGFcbiAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgKi9cbiAgICB0aGlzLmRhdGEgPSBldi5kYXRhO1xufVxuXG5Db21wb3NpdGlvbkV2ZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFdmVudC5wcm90b3R5cGUpO1xuQ29tcG9zaXRpb25FdmVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDb21wb3NpdGlvbkV2ZW50O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqL1xuQ29tcG9zaXRpb25FdmVudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICdDb21wb3NpdGlvbkV2ZW50Jztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9zaXRpb25FdmVudDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgRXZlbnQgY2xhc3MgaXMgYmVpbmcgdXNlZCBpbiBvcmRlciB0byBub3JtYWxpemUgbmF0aXZlIERPTSBldmVudHMuXG4gKiBFdmVudHMgbmVlZCB0byBiZSBub3JtYWxpemVkIGluIG9yZGVyIHRvIGJlIHNlcmlhbGl6ZWQgdGhyb3VnaCB0aGUgc3RydWN0dXJlZFxuICogY2xvbmluZyBhbGdvcml0aG0gdXNlZCBieSB0aGUgYHBvc3RNZXNzYWdlYCBtZXRob2QgKFdlYiBXb3JrZXJzKS5cbiAqXG4gKiBXcmFwcGluZyBET00gZXZlbnRzIGFsc28gaGFzIHRoZSBhZHZhbnRhZ2Ugb2YgcHJvdmlkaW5nIGEgY29uc2lzdGVudFxuICogaW50ZXJmYWNlIGZvciBpbnRlcmFjdGluZyB3aXRoIERPTSBldmVudHMgYWNyb3NzIGJyb3dzZXJzIGJ5IGNvcHlpbmcgb3ZlciBhXG4gKiBzdWJzZXQgb2YgdGhlIGV4cG9zZWQgcHJvcGVydGllcyB0aGF0IGlzIGd1YXJhbnRlZWQgdG8gYmUgY29uc2lzdGVudCBhY3Jvc3NcbiAqIGJyb3dzZXJzLlxuICpcbiAqIFNlZSBbVUkgRXZlbnRzIChmb3JtZXJseSBET00gTGV2ZWwgMyBFdmVudHMpXShodHRwOi8vd3d3LnczLm9yZy9UUi8yMDE1L1dELXVpZXZlbnRzLTIwMTUwNDI4LyNpbnRlcmZhY2UtRXZlbnQpLlxuICpcbiAqIEBjbGFzcyBFdmVudFxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2IFRoZSBuYXRpdmUgRE9NIGV2ZW50LlxuICovXG5mdW5jdGlvbiBFdmVudChldikge1xuICAgIC8vIFtDb25zdHJ1Y3RvcihET01TdHJpbmcgdHlwZSwgb3B0aW9uYWwgRXZlbnRJbml0IGV2ZW50SW5pdERpY3QpLFxuICAgIC8vICBFeHBvc2VkPVdpbmRvdyxXb3JrZXJdXG4gICAgLy8gaW50ZXJmYWNlIEV2ZW50IHtcbiAgICAvLyAgIHJlYWRvbmx5IGF0dHJpYnV0ZSBET01TdHJpbmcgdHlwZTtcbiAgICAvLyAgIHJlYWRvbmx5IGF0dHJpYnV0ZSBFdmVudFRhcmdldD8gdGFyZ2V0O1xuICAgIC8vICAgcmVhZG9ubHkgYXR0cmlidXRlIEV2ZW50VGFyZ2V0PyBjdXJyZW50VGFyZ2V0O1xuXG4gICAgLy8gICBjb25zdCB1bnNpZ25lZCBzaG9ydCBOT05FID0gMDtcbiAgICAvLyAgIGNvbnN0IHVuc2lnbmVkIHNob3J0IENBUFRVUklOR19QSEFTRSA9IDE7XG4gICAgLy8gICBjb25zdCB1bnNpZ25lZCBzaG9ydCBBVF9UQVJHRVQgPSAyO1xuICAgIC8vICAgY29uc3QgdW5zaWduZWQgc2hvcnQgQlVCQkxJTkdfUEhBU0UgPSAzO1xuICAgIC8vICAgcmVhZG9ubHkgYXR0cmlidXRlIHVuc2lnbmVkIHNob3J0IGV2ZW50UGhhc2U7XG5cbiAgICAvLyAgIHZvaWQgc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgLy8gICB2b2lkIHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXG4gICAgLy8gICByZWFkb25seSBhdHRyaWJ1dGUgYm9vbGVhbiBidWJibGVzO1xuICAgIC8vICAgcmVhZG9ubHkgYXR0cmlidXRlIGJvb2xlYW4gY2FuY2VsYWJsZTtcbiAgICAvLyAgIHZvaWQgcHJldmVudERlZmF1bHQoKTtcbiAgICAvLyAgIHJlYWRvbmx5IGF0dHJpYnV0ZSBib29sZWFuIGRlZmF1bHRQcmV2ZW50ZWQ7XG5cbiAgICAvLyAgIFtVbmZvcmdlYWJsZV0gcmVhZG9ubHkgYXR0cmlidXRlIGJvb2xlYW4gaXNUcnVzdGVkO1xuICAgIC8vICAgcmVhZG9ubHkgYXR0cmlidXRlIERPTVRpbWVTdGFtcCB0aW1lU3RhbXA7XG5cbiAgICAvLyAgIHZvaWQgaW5pdEV2ZW50KERPTVN0cmluZyB0eXBlLCBib29sZWFuIGJ1YmJsZXMsIGJvb2xlYW4gY2FuY2VsYWJsZSk7XG4gICAgLy8gfTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEV2ZW50I3R5cGVcbiAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgKi9cbiAgICB0aGlzLnR5cGUgPSBldi50eXBlO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgRXZlbnQjZGVmYXVsdFByZXZlbnRlZFxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLmRlZmF1bHRQcmV2ZW50ZWQgPSBldi5kZWZhdWx0UHJldmVudGVkO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgRXZlbnQjdGltZVN0YW1wXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy50aW1lU3RhbXAgPSBldi50aW1lU3RhbXA7XG5cblxuICAgIC8qKlxuICAgICAqIFVzZWQgZm9yIGV4cG9zaW5nIHRoZSBjdXJyZW50IHRhcmdldCdzIHZhbHVlLlxuICAgICAqXG4gICAgICogQG5hbWUgRXZlbnQjdmFsdWVcbiAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgKi9cbiAgICB2YXIgdGFyZ2V0Q29uc3RydWN0b3IgPSBldi50YXJnZXQuY29uc3RydWN0b3I7XG4gICAgLy8gVE9ETyBTdXBwb3J0IEhUTUxLZXlnZW5FbGVtZW50XG4gICAgaWYgKFxuICAgICAgICB0YXJnZXRDb25zdHJ1Y3RvciA9PT0gSFRNTElucHV0RWxlbWVudCB8fFxuICAgICAgICB0YXJnZXRDb25zdHJ1Y3RvciA9PT0gSFRNTFRleHRBcmVhRWxlbWVudCB8fFxuICAgICAgICB0YXJnZXRDb25zdHJ1Y3RvciA9PT0gSFRNTFNlbGVjdEVsZW1lbnRcbiAgICApIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IGV2LnRhcmdldC52YWx1ZTtcbiAgICB9XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gTmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICovXG5FdmVudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICdFdmVudCc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29tcG9zaXRpb25FdmVudCA9IHJlcXVpcmUoJy4vQ29tcG9zaXRpb25FdmVudCcpO1xudmFyIEV2ZW50ID0gcmVxdWlyZSgnLi9FdmVudCcpO1xudmFyIEZvY3VzRXZlbnQgPSByZXF1aXJlKCcuL0ZvY3VzRXZlbnQnKTtcbnZhciBJbnB1dEV2ZW50ID0gcmVxdWlyZSgnLi9JbnB1dEV2ZW50Jyk7XG52YXIgS2V5Ym9hcmRFdmVudCA9IHJlcXVpcmUoJy4vS2V5Ym9hcmRFdmVudCcpO1xudmFyIE1vdXNlRXZlbnQgPSByZXF1aXJlKCcuL01vdXNlRXZlbnQnKTtcbnZhciBUb3VjaEV2ZW50ID0gcmVxdWlyZSgnLi9Ub3VjaEV2ZW50Jyk7XG52YXIgVUlFdmVudCA9IHJlcXVpcmUoJy4vVUlFdmVudCcpO1xudmFyIFdoZWVsRXZlbnQgPSByZXF1aXJlKCcuL1doZWVsRXZlbnQnKTtcblxuLyoqXG4gKiBBIG1hcHBpbmcgb2YgRE9NIGV2ZW50cyB0byB0aGUgY29ycmVzcG9uZGluZyBoYW5kbGVyc1xuICpcbiAqIEBuYW1lIEV2ZW50TWFwXG4gKiBAdHlwZSBPYmplY3RcbiAqL1xudmFyIEV2ZW50TWFwID0ge1xuICAgIGNoYW5nZSAgICAgICAgICAgICAgICAgICAgICAgICA6IFtFdmVudCwgdHJ1ZV0sXG4gICAgc3VibWl0ICAgICAgICAgICAgICAgICAgICAgICAgIDogW0V2ZW50LCB0cnVlXSxcblxuICAgIC8vIFVJIEV2ZW50cyAoaHR0cDovL3d3dy53My5vcmcvVFIvdWlldmVudHMvKVxuICAgIGFib3J0ICAgICAgICAgICAgICAgICAgICAgICAgICA6IFtFdmVudCwgZmFsc2VdLFxuICAgIGJlZm9yZWlucHV0ICAgICAgICAgICAgICAgICAgICA6IFtJbnB1dEV2ZW50LCB0cnVlXSxcbiAgICBibHVyICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBbRm9jdXNFdmVudCwgZmFsc2VdLFxuICAgIGNsaWNrICAgICAgICAgICAgICAgICAgICAgICAgICA6IFtNb3VzZUV2ZW50LCB0cnVlXSxcbiAgICBjb21wb3NpdGlvbmVuZCAgICAgICAgICAgICAgICAgOiBbQ29tcG9zaXRpb25FdmVudCwgdHJ1ZV0sXG4gICAgY29tcG9zaXRpb25zdGFydCAgICAgICAgICAgICAgIDogW0NvbXBvc2l0aW9uRXZlbnQsIHRydWVdLFxuICAgIGNvbXBvc2l0aW9udXBkYXRlICAgICAgICAgICAgICA6IFtDb21wb3NpdGlvbkV2ZW50LCB0cnVlXSxcbiAgICBkYmxjbGljayAgICAgICAgICAgICAgICAgICAgICAgOiBbTW91c2VFdmVudCwgdHJ1ZV0sXG4gICAgZm9jdXMgICAgICAgICAgICAgICAgICAgICAgICAgIDogW0ZvY3VzRXZlbnQsIGZhbHNlXSxcbiAgICBmb2N1c2luICAgICAgICAgICAgICAgICAgICAgICAgOiBbRm9jdXNFdmVudCwgdHJ1ZV0sXG4gICAgZm9jdXNvdXQgICAgICAgICAgICAgICAgICAgICAgIDogW0ZvY3VzRXZlbnQsIHRydWVdLFxuICAgIGlucHV0ICAgICAgICAgICAgICAgICAgICAgICAgICA6IFtJbnB1dEV2ZW50LCB0cnVlXSxcbiAgICBrZXlkb3duICAgICAgICAgICAgICAgICAgICAgICAgOiBbS2V5Ym9hcmRFdmVudCwgdHJ1ZV0sXG4gICAga2V5dXAgICAgICAgICAgICAgICAgICAgICAgICAgIDogW0tleWJvYXJkRXZlbnQsIHRydWVdLFxuICAgIGxvYWQgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFtFdmVudCwgZmFsc2VdLFxuICAgIG1vdXNlZG93biAgICAgICAgICAgICAgICAgICAgICA6IFtNb3VzZUV2ZW50LCB0cnVlXSxcbiAgICBtb3VzZWVudGVyICAgICAgICAgICAgICAgICAgICAgOiBbTW91c2VFdmVudCwgZmFsc2VdLFxuICAgIG1vdXNlbGVhdmUgICAgICAgICAgICAgICAgICAgICA6IFtNb3VzZUV2ZW50LCBmYWxzZV0sXG5cbiAgICAvLyBidWJibGVzLCBidXQgd2lsbCBiZSB0cmlnZ2VyZWQgdmVyeSBmcmVxdWVudGx5XG4gICAgbW91c2Vtb3ZlICAgICAgICAgICAgICAgICAgICAgIDogW01vdXNlRXZlbnQsIGZhbHNlXSxcblxuICAgIG1vdXNlb3V0ICAgICAgICAgICAgICAgICAgICAgICA6IFtNb3VzZUV2ZW50LCB0cnVlXSxcbiAgICBtb3VzZW92ZXIgICAgICAgICAgICAgICAgICAgICAgOiBbTW91c2VFdmVudCwgdHJ1ZV0sXG4gICAgbW91c2V1cCAgICAgICAgICAgICAgICAgICAgICAgIDogW01vdXNlRXZlbnQsIHRydWVdLFxuICAgIHJlc2l6ZSAgICAgICAgICAgICAgICAgICAgICAgICA6IFtVSUV2ZW50LCBmYWxzZV0sXG5cbiAgICAvLyBtaWdodCBidWJibGVcbiAgICBzY3JvbGwgICAgICAgICAgICAgICAgICAgICAgICAgOiBbVUlFdmVudCwgZmFsc2VdLFxuXG4gICAgc2VsZWN0ICAgICAgICAgICAgICAgICAgICAgICAgIDogW0V2ZW50LCB0cnVlXSxcbiAgICB1bmxvYWQgICAgICAgICAgICAgICAgICAgICAgICAgOiBbRXZlbnQsIGZhbHNlXSxcbiAgICB3aGVlbCAgICAgICAgICAgICAgICAgICAgICAgICAgOiBbV2hlZWxFdmVudCwgdHJ1ZV0sXG5cbiAgICAvLyBUb3VjaCBFdmVudHMgRXh0ZW5zaW9uIChodHRwOi8vd3d3LnczLm9yZy9UUi90b3VjaC1ldmVudHMtZXh0ZW5zaW9ucy8pXG4gICAgdG91Y2hjYW5jZWwgICAgICAgICAgICAgICAgICAgIDogW1RvdWNoRXZlbnQsIHRydWVdLFxuICAgIHRvdWNoZW5kICAgICAgICAgICAgICAgICAgICAgICA6IFtUb3VjaEV2ZW50LCB0cnVlXSxcbiAgICB0b3VjaG1vdmUgICAgICAgICAgICAgICAgICAgICAgOiBbVG91Y2hFdmVudCwgdHJ1ZV0sXG4gICAgdG91Y2hzdGFydCAgICAgICAgICAgICAgICAgICAgIDogW1RvdWNoRXZlbnQsIHRydWVdXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50TWFwO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVUlFdmVudCA9IHJlcXVpcmUoJy4vVUlFdmVudCcpO1xuXG4vKipcbiAqIFNlZSBbVUkgRXZlbnRzIChmb3JtZXJseSBET00gTGV2ZWwgMyBFdmVudHMpXShodHRwOi8vd3d3LnczLm9yZy9UUi8yMDE1L1dELXVpZXZlbnRzLTIwMTUwNDI4LyNldmVudHMtZm9jdXNldmVudCkuXG4gKlxuICogQGNsYXNzIEZvY3VzRXZlbnRcbiAqIEBhdWdtZW50cyBVSUV2ZW50XG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXYgVGhlIG5hdGl2ZSBET00gZXZlbnQuXG4gKi9cbmZ1bmN0aW9uIEZvY3VzRXZlbnQoZXYpIHtcbiAgICAvLyBbQ29uc3RydWN0b3IoRE9NU3RyaW5nIHR5cGVBcmcsIG9wdGlvbmFsIEZvY3VzRXZlbnRJbml0IGZvY3VzRXZlbnRJbml0RGljdCldXG4gICAgLy8gaW50ZXJmYWNlIEZvY3VzRXZlbnQgOiBVSUV2ZW50IHtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIEV2ZW50VGFyZ2V0PyByZWxhdGVkVGFyZ2V0O1xuICAgIC8vIH07XG5cbiAgICBVSUV2ZW50LmNhbGwodGhpcywgZXYpO1xufVxuXG5Gb2N1c0V2ZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFdmVudC5wcm90b3R5cGUpO1xuRm9jdXNFdmVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGb2N1c0V2ZW50O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqL1xuRm9jdXNFdmVudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICdGb2N1c0V2ZW50Jztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRm9jdXNFdmVudDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFVJRXZlbnQgPSByZXF1aXJlKCcuL1VJRXZlbnQnKTtcblxuLyoqXG4gKiBTZWUgW0lucHV0IEV2ZW50c10oaHR0cDovL3czYy5naXRodWIuaW8vZWRpdGluZy1leHBsYWluZXIvaW5wdXQtZXZlbnRzLmh0bWwjaWRsLWRlZi1JbnB1dEV2ZW50KS5cbiAqXG4gKiBAY2xhc3MgSW5wdXRFdmVudFxuICogQGF1Z21lbnRzIFVJRXZlbnRcbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldiBUaGUgbmF0aXZlIERPTSBldmVudC5cbiAqL1xuZnVuY3Rpb24gSW5wdXRFdmVudChldikge1xuICAgIC8vIFtDb25zdHJ1Y3RvcihET01TdHJpbmcgdHlwZUFyZywgb3B0aW9uYWwgSW5wdXRFdmVudEluaXQgaW5wdXRFdmVudEluaXREaWN0KV1cbiAgICAvLyBpbnRlcmZhY2UgSW5wdXRFdmVudCA6IFVJRXZlbnQge1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgRE9NU3RyaW5nIGlucHV0VHlwZTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIERPTVN0cmluZyBkYXRhO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgIGlzQ29tcG9zaW5nO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgUmFuZ2UgICAgIHRhcmdldFJhbmdlO1xuICAgIC8vIH07XG5cbiAgICBVSUV2ZW50LmNhbGwodGhpcywgZXYpO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgICAgSW5wdXRFdmVudCNpbnB1dFR5cGVcbiAgICAgKiBAdHlwZSAgICBTdHJpbmdcbiAgICAgKi9cbiAgICB0aGlzLmlucHV0VHlwZSA9IGV2LmlucHV0VHlwZTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lICAgIElucHV0RXZlbnQjZGF0YVxuICAgICAqIEB0eXBlICAgIFN0cmluZ1xuICAgICAqL1xuICAgIHRoaXMuZGF0YSA9IGV2LmRhdGE7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSAgICBJbnB1dEV2ZW50I2lzQ29tcG9zaW5nXG4gICAgICogQHR5cGUgICAgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuaXNDb21wb3NpbmcgPSBldi5pc0NvbXBvc2luZztcblxuICAgIC8qKlxuICAgICAqICoqTGltaXRlZCBicm93c2VyIHN1cHBvcnQqKi5cbiAgICAgKlxuICAgICAqIEBuYW1lICAgIElucHV0RXZlbnQjdGFyZ2V0UmFuZ2VcbiAgICAgKiBAdHlwZSAgICBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy50YXJnZXRSYW5nZSA9IGV2LnRhcmdldFJhbmdlO1xufVxuXG5JbnB1dEV2ZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFdmVudC5wcm90b3R5cGUpO1xuSW5wdXRFdmVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBJbnB1dEV2ZW50O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqL1xuSW5wdXRFdmVudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICdJbnB1dEV2ZW50Jztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW5wdXRFdmVudDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFVJRXZlbnQgPSByZXF1aXJlKCcuL1VJRXZlbnQnKTtcblxuLyoqXG4gKiBTZWUgW1VJIEV2ZW50cyAoZm9ybWVybHkgRE9NIExldmVsIDMgRXZlbnRzKV0oaHR0cDovL3d3dy53My5vcmcvVFIvMjAxNS9XRC11aWV2ZW50cy0yMDE1MDQyOC8jZXZlbnRzLWtleWJvYXJkZXZlbnRzKS5cbiAqXG4gKiBAY2xhc3MgS2V5Ym9hcmRFdmVudFxuICogQGF1Z21lbnRzIFVJRXZlbnRcbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldiBUaGUgbmF0aXZlIERPTSBldmVudC5cbiAqL1xuZnVuY3Rpb24gS2V5Ym9hcmRFdmVudChldikge1xuICAgIC8vIFtDb25zdHJ1Y3RvcihET01TdHJpbmcgdHlwZUFyZywgb3B0aW9uYWwgS2V5Ym9hcmRFdmVudEluaXQga2V5Ym9hcmRFdmVudEluaXREaWN0KV1cbiAgICAvLyBpbnRlcmZhY2UgS2V5Ym9hcmRFdmVudCA6IFVJRXZlbnQge1xuICAgIC8vICAgICAvLyBLZXlMb2NhdGlvbkNvZGVcbiAgICAvLyAgICAgY29uc3QgdW5zaWduZWQgbG9uZyBET01fS0VZX0xPQ0FUSU9OX1NUQU5EQVJEID0gMHgwMDtcbiAgICAvLyAgICAgY29uc3QgdW5zaWduZWQgbG9uZyBET01fS0VZX0xPQ0FUSU9OX0xFRlQgPSAweDAxO1xuICAgIC8vICAgICBjb25zdCB1bnNpZ25lZCBsb25nIERPTV9LRVlfTE9DQVRJT05fUklHSFQgPSAweDAyO1xuICAgIC8vICAgICBjb25zdCB1bnNpZ25lZCBsb25nIERPTV9LRVlfTE9DQVRJT05fTlVNUEFEID0gMHgwMztcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIERPTVN0cmluZyAgICAga2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgRE9NU3RyaW5nICAgICBjb2RlO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgdW5zaWduZWQgbG9uZyBsb2NhdGlvbjtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICAgICAgY3RybEtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICAgICAgc2hpZnRLZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgICAgIGFsdEtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICAgICAgbWV0YUtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICAgICAgcmVwZWF0O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgICAgICBpc0NvbXBvc2luZztcbiAgICAvLyAgICAgYm9vbGVhbiBnZXRNb2RpZmllclN0YXRlIChET01TdHJpbmcga2V5QXJnKTtcbiAgICAvLyB9O1xuXG4gICAgVUlFdmVudC5jYWxsKHRoaXMsIGV2KTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjRE9NX0tFWV9MT0NBVElPTl9TVEFOREFSRFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuRE9NX0tFWV9MT0NBVElPTl9TVEFOREFSRCA9IDB4MDA7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I0RPTV9LRVlfTE9DQVRJT05fTEVGVFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuRE9NX0tFWV9MT0NBVElPTl9MRUZUID0gMHgwMTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjRE9NX0tFWV9MT0NBVElPTl9SSUdIVFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuRE9NX0tFWV9MT0NBVElPTl9SSUdIVCA9IDB4MDI7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I0RPTV9LRVlfTE9DQVRJT05fTlVNUEFEXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5ET01fS0VZX0xPQ0FUSU9OX05VTVBBRCA9IDB4MDM7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I2tleVxuICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAqL1xuICAgIHRoaXMua2V5ID0gZXYua2V5O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNjb2RlXG4gICAgICogQHR5cGUgU3RyaW5nXG4gICAgICovXG4gICAgdGhpcy5jb2RlID0gZXYuY29kZTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjbG9jYXRpb25cbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmxvY2F0aW9uID0gZXYubG9jYXRpb247XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I2N0cmxLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5jdHJsS2V5ID0gZXYuY3RybEtleTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjc2hpZnRLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5zaGlmdEtleSA9IGV2LnNoaWZ0S2V5O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNhbHRLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5hbHRLZXkgPSBldi5hbHRLZXk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I21ldGFLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5tZXRhS2V5ID0gZXYubWV0YUtleTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjcmVwZWF0XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMucmVwZWF0ID0gZXYucmVwZWF0O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNpc0NvbXBvc2luZ1xuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLmlzQ29tcG9zaW5nID0gZXYuaXNDb21wb3Npbmc7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I2tleUNvZGVcbiAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgKiBAZGVwcmVjYXRlZFxuICAgICAqL1xuICAgIHRoaXMua2V5Q29kZSA9IGV2LmtleUNvZGU7XG59XG5cbktleWJvYXJkRXZlbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUV2ZW50LnByb3RvdHlwZSk7XG5LZXlib2FyZEV2ZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEtleWJvYXJkRXZlbnQ7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gTmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICovXG5LZXlib2FyZEV2ZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJ0tleWJvYXJkRXZlbnQnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBLZXlib2FyZEV2ZW50O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVUlFdmVudCA9IHJlcXVpcmUoJy4vVUlFdmVudCcpO1xuXG4vKipcbiAqIFNlZSBbVUkgRXZlbnRzIChmb3JtZXJseSBET00gTGV2ZWwgMyBFdmVudHMpXShodHRwOi8vd3d3LnczLm9yZy9UUi8yMDE1L1dELXVpZXZlbnRzLTIwMTUwNDI4LyNldmVudHMtbW91c2VldmVudHMpLlxuICpcbiAqIEBjbGFzcyBLZXlib2FyZEV2ZW50XG4gKiBAYXVnbWVudHMgVUlFdmVudFxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2IFRoZSBuYXRpdmUgRE9NIGV2ZW50LlxuICovXG5mdW5jdGlvbiBNb3VzZUV2ZW50KGV2KSB7XG4gICAgLy8gW0NvbnN0cnVjdG9yKERPTVN0cmluZyB0eXBlQXJnLCBvcHRpb25hbCBNb3VzZUV2ZW50SW5pdCBtb3VzZUV2ZW50SW5pdERpY3QpXVxuICAgIC8vIGludGVyZmFjZSBNb3VzZUV2ZW50IDogVUlFdmVudCB7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBsb25nICAgICAgICAgICBzY3JlZW5YO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgbG9uZyAgICAgICAgICAgc2NyZWVuWTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGxvbmcgICAgICAgICAgIGNsaWVudFg7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBsb25nICAgICAgICAgICBjbGllbnRZO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgICAgICAgY3RybEtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICAgICAgIHNoaWZ0S2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgICAgICAgYWx0S2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgICAgICAgbWV0YUtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIHNob3J0ICAgICAgICAgIGJ1dHRvbjtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIEV2ZW50VGFyZ2V0PyAgIHJlbGF0ZWRUYXJnZXQ7XG4gICAgLy8gICAgIC8vIEludHJvZHVjZWQgaW4gdGhpcyBzcGVjaWZpY2F0aW9uXG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSB1bnNpZ25lZCBzaG9ydCBidXR0b25zO1xuICAgIC8vICAgICBib29sZWFuIGdldE1vZGlmaWVyU3RhdGUgKERPTVN0cmluZyBrZXlBcmcpO1xuICAgIC8vIH07XG5cbiAgICBVSUV2ZW50LmNhbGwodGhpcywgZXYpO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgTW91c2VFdmVudCNzY3JlZW5YXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5zY3JlZW5YID0gZXYuc2NyZWVuWDtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIE1vdXNlRXZlbnQjc2NyZWVuWVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuc2NyZWVuWSA9IGV2LnNjcmVlblk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBNb3VzZUV2ZW50I2NsaWVudFhcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmNsaWVudFggPSBldi5jbGllbnRYO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgTW91c2VFdmVudCNjbGllbnRZXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5jbGllbnRZID0gZXYuY2xpZW50WTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIE1vdXNlRXZlbnQjY3RybEtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLmN0cmxLZXkgPSBldi5jdHJsS2V5O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgTW91c2VFdmVudCNzaGlmdEtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLnNoaWZ0S2V5ID0gZXYuc2hpZnRLZXk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBNb3VzZUV2ZW50I2FsdEtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLmFsdEtleSA9IGV2LmFsdEtleTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIE1vdXNlRXZlbnQjbWV0YUtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLm1ldGFLZXkgPSBldi5tZXRhS2V5O1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgTW91c2VFdmVudCNidXR0b25cbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmJ1dHRvbiA9IGV2LmJ1dHRvbjtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIE1vdXNlRXZlbnQjYnV0dG9uc1xuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuYnV0dG9ucyA9IGV2LmJ1dHRvbnM7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSBNb3VzZUV2ZW50I3BhZ2VYXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5wYWdlWCA9IGV2LnBhZ2VYO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgTW91c2VFdmVudCNwYWdlWVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMucGFnZVkgPSBldi5wYWdlWTtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIE1vdXNlRXZlbnQjeFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMueCA9IGV2Lng7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSBNb3VzZUV2ZW50I3lcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnkgPSBldi55O1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgTW91c2VFdmVudCNvZmZzZXRYXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5vZmZzZXRYID0gZXYub2Zmc2V0WDtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIE1vdXNlRXZlbnQjb2Zmc2V0WVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMub2Zmc2V0WSA9IGV2Lm9mZnNldFk7XG59XG5cbk1vdXNlRXZlbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUV2ZW50LnByb3RvdHlwZSk7XG5Nb3VzZUV2ZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1vdXNlRXZlbnQ7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gTmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICovXG5Nb3VzZUV2ZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJ01vdXNlRXZlbnQnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb3VzZUV2ZW50O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVUlFdmVudCA9IHJlcXVpcmUoJy4vVUlFdmVudCcpO1xuXG52YXIgRU1QVFlfQVJSQVkgPSBbXTtcblxuLyoqXG4gKiBTZWUgW1RvdWNoIEludGVyZmFjZV0oaHR0cDovL3d3dy53My5vcmcvVFIvMjAxMy9SRUMtdG91Y2gtZXZlbnRzLTIwMTMxMDEwLyN0b3VjaC1pbnRlcmZhY2UpLlxuICpcbiAqIEBjbGFzcyBUb3VjaFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge1RvdWNofSB0b3VjaCBUaGUgbmF0aXZlIFRvdWNoIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gVG91Y2godG91Y2gpIHtcbiAgICAvLyBpbnRlcmZhY2UgVG91Y2gge1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgbG9uZyAgICAgICAgaWRlbnRpZmllcjtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIEV2ZW50VGFyZ2V0IHRhcmdldDtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGRvdWJsZSAgICAgIHNjcmVlblg7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBkb3VibGUgICAgICBzY3JlZW5ZO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgZG91YmxlICAgICAgY2xpZW50WDtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGRvdWJsZSAgICAgIGNsaWVudFk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBkb3VibGUgICAgICBwYWdlWDtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGRvdWJsZSAgICAgIHBhZ2VZO1xuICAgIC8vIH07XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaCNpZGVudGlmaWVyXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5pZGVudGlmaWVyID0gdG91Y2guaWRlbnRpZmllcjtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoI3NjcmVlblhcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnNjcmVlblggPSB0b3VjaC5zY3JlZW5YO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2gjc2NyZWVuWVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuc2NyZWVuWSA9IHRvdWNoLnNjcmVlblk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaCNjbGllbnRYXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5jbGllbnRYID0gdG91Y2guY2xpZW50WDtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoI2NsaWVudFlcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmNsaWVudFkgPSB0b3VjaC5jbGllbnRZO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2gjcGFnZVhcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnBhZ2VYID0gdG91Y2gucGFnZVg7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaCNwYWdlWVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMucGFnZVkgPSB0b3VjaC5wYWdlWTtcbn1cblxuXG4vKipcbiAqIE5vcm1hbGl6ZXMgdGhlIGJyb3dzZXIncyBuYXRpdmUgVG91Y2hMaXN0IGJ5IGNvbnZlcnRpbmcgaXQgaW50byBhbiBhcnJheSBvZlxuICogbm9ybWFsaXplZCBUb3VjaCBvYmplY3RzLlxuICpcbiAqIEBtZXRob2QgIGNsb25lVG91Y2hMaXN0XG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSAge1RvdWNoTGlzdH0gdG91Y2hMaXN0ICAgIFRoZSBuYXRpdmUgVG91Y2hMaXN0IGFycmF5LlxuICogQHJldHVybiB7QXJyYXkuPFRvdWNoPn0gICAgICAgICAgQW4gYXJyYXkgb2Ygbm9ybWFsaXplZCBUb3VjaCBvYmplY3RzLlxuICovXG5mdW5jdGlvbiBjbG9uZVRvdWNoTGlzdCh0b3VjaExpc3QpIHtcbiAgICBpZiAoIXRvdWNoTGlzdCkgcmV0dXJuIEVNUFRZX0FSUkFZO1xuICAgIC8vIGludGVyZmFjZSBUb3VjaExpc3Qge1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgdW5zaWduZWQgbG9uZyBsZW5ndGg7XG4gICAgLy8gICAgIGdldHRlciBUb3VjaD8gaXRlbSAodW5zaWduZWQgbG9uZyBpbmRleCk7XG4gICAgLy8gfTtcblxuICAgIHZhciB0b3VjaExpc3RBcnJheSA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG91Y2hMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdWNoTGlzdEFycmF5W2ldID0gbmV3IFRvdWNoKHRvdWNoTGlzdFtpXSk7XG4gICAgfVxuICAgIHJldHVybiB0b3VjaExpc3RBcnJheTtcbn1cblxuLyoqXG4gKiBTZWUgW1RvdWNoIEV2ZW50IEludGVyZmFjZV0oaHR0cDovL3d3dy53My5vcmcvVFIvMjAxMy9SRUMtdG91Y2gtZXZlbnRzLTIwMTMxMDEwLyN0b3VjaGV2ZW50LWludGVyZmFjZSkuXG4gKlxuICogQGNsYXNzIFRvdWNoRXZlbnRcbiAqIEBhdWdtZW50cyBVSUV2ZW50XG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXYgVGhlIG5hdGl2ZSBET00gZXZlbnQuXG4gKi9cbmZ1bmN0aW9uIFRvdWNoRXZlbnQoZXYpIHtcbiAgICAvLyBpbnRlcmZhY2UgVG91Y2hFdmVudCA6IFVJRXZlbnQge1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgVG91Y2hMaXN0IHRvdWNoZXM7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBUb3VjaExpc3QgdGFyZ2V0VG91Y2hlcztcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIFRvdWNoTGlzdCBjaGFuZ2VkVG91Y2hlcztcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICBhbHRLZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgbWV0YUtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICBjdHJsS2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgIHNoaWZ0S2V5O1xuICAgIC8vIH07XG4gICAgVUlFdmVudC5jYWxsKHRoaXMsIGV2KTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoRXZlbnQjdG91Y2hlc1xuICAgICAqIEB0eXBlIEFycmF5LjxUb3VjaD5cbiAgICAgKi9cbiAgICB0aGlzLnRvdWNoZXMgPSBjbG9uZVRvdWNoTGlzdChldi50b3VjaGVzKTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoRXZlbnQjdGFyZ2V0VG91Y2hlc1xuICAgICAqIEB0eXBlIEFycmF5LjxUb3VjaD5cbiAgICAgKi9cbiAgICB0aGlzLnRhcmdldFRvdWNoZXMgPSBjbG9uZVRvdWNoTGlzdChldi50YXJnZXRUb3VjaGVzKTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoRXZlbnQjY2hhbmdlZFRvdWNoZXNcbiAgICAgKiBAdHlwZSBUb3VjaExpc3RcbiAgICAgKi9cbiAgICB0aGlzLmNoYW5nZWRUb3VjaGVzID0gY2xvbmVUb3VjaExpc3QoZXYuY2hhbmdlZFRvdWNoZXMpO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2hFdmVudCNhbHRLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5hbHRLZXkgPSBldi5hbHRLZXk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaEV2ZW50I21ldGFLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5tZXRhS2V5ID0gZXYubWV0YUtleTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoRXZlbnQjY3RybEtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLmN0cmxLZXkgPSBldi5jdHJsS2V5O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2hFdmVudCNzaGlmdEtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLnNoaWZ0S2V5ID0gZXYuc2hpZnRLZXk7XG59XG5cblRvdWNoRXZlbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUV2ZW50LnByb3RvdHlwZSk7XG5Ub3VjaEV2ZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRvdWNoRXZlbnQ7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gTmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICovXG5Ub3VjaEV2ZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJ1RvdWNoRXZlbnQnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb3VjaEV2ZW50O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRXZlbnQgPSByZXF1aXJlKCcuL0V2ZW50Jyk7XG5cbi8qKlxuICogU2VlIFtVSSBFdmVudHMgKGZvcm1lcmx5IERPTSBMZXZlbCAzIEV2ZW50cyldKGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTUvV0QtdWlldmVudHMtMjAxNTA0MjgpLlxuICpcbiAqIEBjbGFzcyBVSUV2ZW50XG4gKiBAYXVnbWVudHMgRXZlbnRcbiAqXG4gKiBAcGFyYW0gIHtFdmVudH0gZXYgICBUaGUgbmF0aXZlIERPTSBldmVudC5cbiAqL1xuZnVuY3Rpb24gVUlFdmVudChldikge1xuICAgIC8vIFtDb25zdHJ1Y3RvcihET01TdHJpbmcgdHlwZSwgb3B0aW9uYWwgVUlFdmVudEluaXQgZXZlbnRJbml0RGljdCldXG4gICAgLy8gaW50ZXJmYWNlIFVJRXZlbnQgOiBFdmVudCB7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBXaW5kb3c/IHZpZXc7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBsb25nICAgIGRldGFpbDtcbiAgICAvLyB9O1xuICAgIEV2ZW50LmNhbGwodGhpcywgZXYpO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVUlFdmVudCNkZXRhaWxcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmRldGFpbCA9IGV2LmRldGFpbDtcbn1cblxuVUlFdmVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50LnByb3RvdHlwZSk7XG5VSUV2ZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFVJRXZlbnQ7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gTmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICovXG5VSUV2ZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJ1VJRXZlbnQnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBVSUV2ZW50O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgTW91c2VFdmVudCA9IHJlcXVpcmUoJy4vTW91c2VFdmVudCcpO1xuXG4vKipcbiAqIFNlZSBbVUkgRXZlbnRzIChmb3JtZXJseSBET00gTGV2ZWwgMyBFdmVudHMpXShodHRwOi8vd3d3LnczLm9yZy9UUi8yMDE1L1dELXVpZXZlbnRzLTIwMTUwNDI4LyNldmVudHMtd2hlZWxldmVudHMpLlxuICpcbiAqIEBjbGFzcyBXaGVlbEV2ZW50XG4gKiBAYXVnbWVudHMgVUlFdmVudFxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2IFRoZSBuYXRpdmUgRE9NIGV2ZW50LlxuICovXG5mdW5jdGlvbiBXaGVlbEV2ZW50KGV2KSB7XG4gICAgLy8gW0NvbnN0cnVjdG9yKERPTVN0cmluZyB0eXBlQXJnLCBvcHRpb25hbCBXaGVlbEV2ZW50SW5pdCB3aGVlbEV2ZW50SW5pdERpY3QpXVxuICAgIC8vIGludGVyZmFjZSBXaGVlbEV2ZW50IDogTW91c2VFdmVudCB7XG4gICAgLy8gICAgIC8vIERlbHRhTW9kZUNvZGVcbiAgICAvLyAgICAgY29uc3QgdW5zaWduZWQgbG9uZyBET01fREVMVEFfUElYRUwgPSAweDAwO1xuICAgIC8vICAgICBjb25zdCB1bnNpZ25lZCBsb25nIERPTV9ERUxUQV9MSU5FID0gMHgwMTtcbiAgICAvLyAgICAgY29uc3QgdW5zaWduZWQgbG9uZyBET01fREVMVEFfUEFHRSA9IDB4MDI7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBkb3VibGUgICAgICAgIGRlbHRhWDtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGRvdWJsZSAgICAgICAgZGVsdGFZO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgZG91YmxlICAgICAgICBkZWx0YVo7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSB1bnNpZ25lZCBsb25nIGRlbHRhTW9kZTtcbiAgICAvLyB9O1xuXG4gICAgTW91c2VFdmVudC5jYWxsKHRoaXMsIGV2KTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFdoZWVsRXZlbnQjRE9NX0RFTFRBX1BJWEVMXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5ET01fREVMVEFfUElYRUwgPSAweDAwO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgV2hlZWxFdmVudCNET01fREVMVEFfTElORVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuRE9NX0RFTFRBX0xJTkUgPSAweDAxO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgV2hlZWxFdmVudCNET01fREVMVEFfUEFHRVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuRE9NX0RFTFRBX1BBR0UgPSAweDAyO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgV2hlZWxFdmVudCNkZWx0YVhcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmRlbHRhWCA9IGV2LmRlbHRhWDtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFdoZWVsRXZlbnQjZGVsdGFZXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5kZWx0YVkgPSBldi5kZWx0YVk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBXaGVlbEV2ZW50I2RlbHRhWlxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuZGVsdGFaID0gZXYuZGVsdGFaO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgV2hlZWxFdmVudCNkZWx0YU1vZGVcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmRlbHRhTW9kZSA9IGV2LmRlbHRhTW9kZTtcbn1cblxuV2hlZWxFdmVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE1vdXNlRXZlbnQucHJvdG90eXBlKTtcbldoZWVsRXZlbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gV2hlZWxFdmVudDtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBOYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKi9cbldoZWVsRXZlbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiAnV2hlZWxFdmVudCc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdoZWVsRXZlbnQ7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQSB0d28tZGltZW5zaW9uYWwgdmVjdG9yLlxuICpcbiAqIEBjbGFzcyBWZWMyXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggVGhlIHggY29tcG9uZW50LlxuICogQHBhcmFtIHtOdW1iZXJ9IHkgVGhlIHkgY29tcG9uZW50LlxuICovXG52YXIgVmVjMiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEFycmF5IHx8IHggaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgdGhpcy54ID0geFswXSB8fCAwO1xuICAgICAgICB0aGlzLnkgPSB4WzFdIHx8IDA7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnggPSB4IHx8IDA7XG4gICAgICAgIHRoaXMueSA9IHkgfHwgMDtcbiAgICB9XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29tcG9uZW50cyBvZiB0aGUgY3VycmVudCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBUaGUgeCBjb21wb25lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0geSBUaGUgeSBjb21wb25lbnQuXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQoeCwgeSkge1xuICAgIGlmICh4ICE9IG51bGwpIHRoaXMueCA9IHg7XG4gICAgaWYgKHkgIT0gbnVsbCkgdGhpcy55ID0geTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIHRoZSBpbnB1dCB2IHRvIHRoZSBjdXJyZW50IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdiBUaGUgVmVjMiB0byBhZGQuXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQodikge1xuICAgIHRoaXMueCArPSB2Lng7XG4gICAgdGhpcy55ICs9IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU3VidHJhY3QgdGhlIGlucHV0IHYgZnJvbSB0aGUgY3VycmVudCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzJ9IHYgVGhlIFZlYzIgdG8gc3VidHJhY3QuXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uIHN1YnRyYWN0KHYpIHtcbiAgICB0aGlzLnggLT0gdi54O1xuICAgIHRoaXMueSAtPSB2Lnk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNjYWxlIHRoZSBjdXJyZW50IFZlYzIgYnkgYSBzY2FsYXIgb3IgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ8VmVjMn0gcyBUaGUgTnVtYmVyIG9yIHZlYzIgYnkgd2hpY2ggdG8gc2NhbGUuXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uIHNjYWxlKHMpIHtcbiAgICBpZiAocyBpbnN0YW5jZW9mIFZlYzIpIHtcbiAgICAgICAgdGhpcy54ICo9IHMueDtcbiAgICAgICAgdGhpcy55ICo9IHMueTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMueCAqPSBzO1xuICAgICAgICB0aGlzLnkgKj0gcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJvdGF0ZSB0aGUgVmVjMiBjb3VudGVyLWNsb2Nrd2lzZSBieSB0aGV0YSBhYm91dCB0aGUgei1heGlzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGhldGEgQW5nbGUgYnkgd2hpY2ggdG8gcm90YXRlLlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IHRoaXNcbiAqL1xuVmVjMi5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24odGhldGEpIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcblxuICAgIHZhciBjb3NUaGV0YSA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luVGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XG5cbiAgICB0aGlzLnggPSB4ICogY29zVGhldGEgLSB5ICogc2luVGhldGE7XG4gICAgdGhpcy55ID0geCAqIHNpblRoZXRhICsgeSAqIGNvc1RoZXRhO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRoZSBkb3QgcHJvZHVjdCBvZiBvZiB0aGUgY3VycmVudCBWZWMyIHdpdGggdGhlIGlucHV0IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB2IFRoZSBvdGhlciBWZWMyLlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IHRoaXNcbiAqL1xuVmVjMi5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2Lnk7XG59O1xuXG4vKipcbiAqIFRoZSBjcm9zcyBwcm9kdWN0IG9mIG9mIHRoZSBjdXJyZW50IFZlYzIgd2l0aCB0aGUgaW5wdXQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHYgVGhlIG90aGVyIFZlYzIuXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5jcm9zcyA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gdGhpcy54ICogdi55IC0gdGhpcy55ICogdi54O1xufTtcblxuLyoqXG4gKiBQcmVzZXJ2ZSB0aGUgbWFnbml0dWRlIGJ1dCBpbnZlcnQgdGhlIG9yaWVudGF0aW9uIG9mIHRoZSBjdXJyZW50IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IHRoaXNcbiAqL1xuVmVjMi5wcm90b3R5cGUuaW52ZXJ0ID0gZnVuY3Rpb24gaW52ZXJ0KCkge1xuICAgIHRoaXMueCAqPSAtMTtcbiAgICB0aGlzLnkgKj0gLTE7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFwcGx5IGEgZnVuY3Rpb24gY29tcG9uZW50LXdpc2UgdG8gdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gYXBwbHkuXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiBtYXAoZm4pIHtcbiAgICB0aGlzLnggPSBmbih0aGlzLngpO1xuICAgIHRoaXMueSA9IGZuKHRoaXMueSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgbWFnbml0dWRlIG9mIHRoZSBjdXJyZW50IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIGxlbmd0aCBvZiB0aGUgdmVjdG9yXG4gKi9cblZlYzIucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uIGxlbmd0aCgpIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcblxuICAgIHJldHVybiBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSk7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIGlucHV0IG9udG8gdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMyfSB2IFZlYzIgdG8gY29weVxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IHRoaXNcbiAqL1xuVmVjMi5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkodikge1xuICAgIHRoaXMueCA9IHYueDtcbiAgICB0aGlzLnkgPSB2Lnk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlc2V0IHRoZSBjdXJyZW50IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IHRoaXNcbiAqL1xuVmVjMi5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICB0aGlzLnggPSAwO1xuICAgIHRoaXMueSA9IDA7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIG1hZ25pdHVkZSBvZiB0aGUgY3VycmVudCBWZWMyIGlzIGV4YWN0bHkgMC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gd2hldGhlciBvciBub3QgdGhlIGxlbmd0aCBpcyAwXG4gKi9cblZlYzIucHJvdG90eXBlLmlzWmVybyA9IGZ1bmN0aW9uIGlzWmVybygpIHtcbiAgICBpZiAodGhpcy54ICE9PSAwIHx8IHRoaXMueSAhPT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIGVsc2UgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFRoZSBhcnJheSBmb3JtIG9mIHRoZSBjdXJyZW50IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0FycmF5fSB0aGUgVmVjIHRvIGFzIGFuIGFycmF5XG4gKi9cblZlYzIucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiB0b0FycmF5KCkge1xuICAgIHJldHVybiBbdGhpcy54LCB0aGlzLnldO1xufTtcblxuLyoqXG4gKiBOb3JtYWxpemUgdGhlIGlucHV0IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdiBUaGUgcmVmZXJlbmNlIFZlYzIuXG4gKiBAcGFyYW0ge1ZlYzJ9IG91dHB1dCBWZWMyIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjMn0gVGhlIG5vcm1hbGl6ZWQgVmVjMi5cbiAqL1xuVmVjMi5ub3JtYWxpemUgPSBmdW5jdGlvbiBub3JtYWxpemUodiwgb3V0cHV0KSB7XG4gICAgdmFyIHggPSB2Lng7XG4gICAgdmFyIHkgPSB2Lnk7XG5cbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpIHx8IDE7XG4gICAgbGVuZ3RoID0gMSAvIGxlbmd0aDtcbiAgICBvdXRwdXQueCA9IHYueCAqIGxlbmd0aDtcbiAgICBvdXRwdXQueSA9IHYueSAqIGxlbmd0aDtcblxuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIENsb25lIHRoZSBpbnB1dCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzJ9IHYgVGhlIFZlYzIgdG8gY2xvbmUuXG4gKlxuICogQHJldHVybiB7VmVjMn0gVGhlIGNsb25lZCBWZWMyLlxuICovXG5WZWMyLmNsb25lID0gZnVuY3Rpb24gY2xvbmUodikge1xuICAgIHJldHVybiBuZXcgVmVjMih2LngsIHYueSk7XG59O1xuXG4vKipcbiAqIEFkZCB0aGUgaW5wdXQgVmVjMidzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzJ9IHYxIFRoZSBsZWZ0IFZlYzIuXG4gKiBAcGFyYW0ge1ZlYzJ9IHYyIFRoZSByaWdodCBWZWMyLlxuICogQHBhcmFtIHtWZWMyfSBvdXRwdXQgVmVjMiBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IFRoZSByZXN1bHQgb2YgdGhlIGFkZGl0aW9uLlxuICovXG5WZWMyLmFkZCA9IGZ1bmN0aW9uIGFkZCh2MSwgdjIsIG91dHB1dCkge1xuICAgIG91dHB1dC54ID0gdjEueCArIHYyLng7XG4gICAgb3V0cHV0LnkgPSB2MS55ICsgdjIueTtcblxuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0IHRoZSBzZWNvbmQgVmVjMiBmcm9tIHRoZSBmaXJzdC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMyfSB2MSBUaGUgbGVmdCBWZWMyLlxuICogQHBhcmFtIHtWZWMyfSB2MiBUaGUgcmlnaHQgVmVjMi5cbiAqIEBwYXJhbSB7VmVjMn0gb3V0cHV0IFZlYzIgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSBUaGUgcmVzdWx0IG9mIHRoZSBzdWJ0cmFjdGlvbi5cbiAqL1xuVmVjMi5zdWJ0cmFjdCA9IGZ1bmN0aW9uIHN1YnRyYWN0KHYxLCB2Miwgb3V0cHV0KSB7XG4gICAgb3V0cHV0LnggPSB2MS54IC0gdjIueDtcbiAgICBvdXRwdXQueSA9IHYxLnkgLSB2Mi55O1xuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlIHRoZSBpbnB1dCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzJ9IHYgVGhlIHJlZmVyZW5jZSBWZWMyLlxuICogQHBhcmFtIHtOdW1iZXJ9IHMgTnVtYmVyIHRvIHNjYWxlIGJ5LlxuICogQHBhcmFtIHtWZWMyfSBvdXRwdXQgVmVjMiBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IFRoZSByZXN1bHQgb2YgdGhlIHNjYWxpbmcuXG4gKi9cblZlYzIuc2NhbGUgPSBmdW5jdGlvbiBzY2FsZSh2LCBzLCBvdXRwdXQpIHtcbiAgICBvdXRwdXQueCA9IHYueCAqIHM7XG4gICAgb3V0cHV0LnkgPSB2LnkgKiBzO1xuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIFRoZSBkb3QgcHJvZHVjdCBvZiB0aGUgaW5wdXQgVmVjMidzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzJ9IHYxIFRoZSBsZWZ0IFZlYzIuXG4gKiBAcGFyYW0ge1ZlYzJ9IHYyIFRoZSByaWdodCBWZWMyLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gVGhlIGRvdCBwcm9kdWN0LlxuICovXG5WZWMyLmRvdCA9IGZ1bmN0aW9uIGRvdCh2MSwgdjIpIHtcbiAgICByZXR1cm4gdjEueCAqIHYyLnggKyB2MS55ICogdjIueTtcbn07XG5cbi8qKlxuICogVGhlIGNyb3NzIHByb2R1Y3Qgb2YgdGhlIGlucHV0IFZlYzIncy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHYxIFRoZSBsZWZ0IFZlYzIuXG4gKiBAcGFyYW0ge051bWJlcn0gdjIgVGhlIHJpZ2h0IFZlYzIuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBUaGUgei1jb21wb25lbnQgb2YgdGhlIGNyb3NzIHByb2R1Y3QuXG4gKi9cblZlYzIuY3Jvc3MgPSBmdW5jdGlvbih2MSx2Mikge1xuICAgIHJldHVybiB2MS54ICogdjIueSAtIHYxLnkgKiB2Mi54O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWMyO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEEgdGhyZWUtZGltZW5zaW9uYWwgdmVjdG9yLlxuICpcbiAqIEBjbGFzcyBWZWMzXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggVGhlIHggY29tcG9uZW50LlxuICogQHBhcmFtIHtOdW1iZXJ9IHkgVGhlIHkgY29tcG9uZW50LlxuICogQHBhcmFtIHtOdW1iZXJ9IHogVGhlIHogY29tcG9uZW50LlxuICovXG52YXIgVmVjMyA9IGZ1bmN0aW9uKHggLHksIHope1xuICAgIHRoaXMueCA9IHggfHwgMDtcbiAgICB0aGlzLnkgPSB5IHx8IDA7XG4gICAgdGhpcy56ID0geiB8fCAwO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGNvbXBvbmVudHMgb2YgdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggVGhlIHggY29tcG9uZW50LlxuICogQHBhcmFtIHtOdW1iZXJ9IHkgVGhlIHkgY29tcG9uZW50LlxuICogQHBhcmFtIHtOdW1iZXJ9IHogVGhlIHogY29tcG9uZW50LlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KHgsIHksIHopIHtcbiAgICBpZiAoeCAhPSBudWxsKSB0aGlzLnggPSB4O1xuICAgIGlmICh5ICE9IG51bGwpIHRoaXMueSA9IHk7XG4gICAgaWYgKHogIT0gbnVsbCkgdGhpcy56ID0gejtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgdGhlIGlucHV0IHYgdG8gdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2IFRoZSBWZWMzIHRvIGFkZC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZCh2KSB7XG4gICAgdGhpcy54ICs9IHYueDtcbiAgICB0aGlzLnkgKz0gdi55O1xuICAgIHRoaXMueiArPSB2Lno7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU3VidHJhY3QgdGhlIGlucHV0IHYgZnJvbSB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVGhlIFZlYzMgdG8gc3VidHJhY3QuXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uIHN1YnRyYWN0KHYpIHtcbiAgICB0aGlzLnggLT0gdi54O1xuICAgIHRoaXMueSAtPSB2Lnk7XG4gICAgdGhpcy56IC09IHYuejtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSb3RhdGUgdGhlIGN1cnJlbnQgVmVjMyBieSB0aGV0YSBjbG9ja3dpc2UgYWJvdXQgdGhlIHggYXhpcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZXRhIEFuZ2xlIGJ5IHdoaWNoIHRvIHJvdGF0ZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLnJvdGF0ZVggPSBmdW5jdGlvbiByb3RhdGVYKHRoZXRhKSB7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuXG4gICAgdGhpcy55ID0geSAqIGNvc1RoZXRhIC0geiAqIHNpblRoZXRhO1xuICAgIHRoaXMueiA9IHkgKiBzaW5UaGV0YSArIHogKiBjb3NUaGV0YTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSb3RhdGUgdGhlIGN1cnJlbnQgVmVjMyBieSB0aGV0YSBjbG9ja3dpc2UgYWJvdXQgdGhlIHkgYXhpcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZXRhIEFuZ2xlIGJ5IHdoaWNoIHRvIHJvdGF0ZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLnJvdGF0ZVkgPSBmdW5jdGlvbiByb3RhdGVZKHRoZXRhKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuXG4gICAgdGhpcy54ID0geiAqIHNpblRoZXRhICsgeCAqIGNvc1RoZXRhO1xuICAgIHRoaXMueiA9IHogKiBjb3NUaGV0YSAtIHggKiBzaW5UaGV0YTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSb3RhdGUgdGhlIGN1cnJlbnQgVmVjMyBieSB0aGV0YSBjbG9ja3dpc2UgYWJvdXQgdGhlIHogYXhpcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZXRhIEFuZ2xlIGJ5IHdoaWNoIHRvIHJvdGF0ZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLnJvdGF0ZVogPSBmdW5jdGlvbiByb3RhdGVaKHRoZXRhKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG5cbiAgICB2YXIgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuXG4gICAgdGhpcy54ID0geCAqIGNvc1RoZXRhIC0geSAqIHNpblRoZXRhO1xuICAgIHRoaXMueSA9IHggKiBzaW5UaGV0YSArIHkgKiBjb3NUaGV0YTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBUaGUgZG90IHByb2R1Y3Qgb2YgdGhlIGN1cnJlbnQgVmVjMyB3aXRoIGlucHV0IFZlYzMgdi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2IFRoZSBvdGhlciBWZWMzLlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gZG90KHYpIHtcbiAgICByZXR1cm4gdGhpcy54KnYueCArIHRoaXMueSp2LnkgKyB0aGlzLnoqdi56O1xufTtcblxuLyoqXG4gKiBUaGUgZG90IHByb2R1Y3Qgb2YgdGhlIGN1cnJlbnQgVmVjMyB3aXRoIGlucHV0IFZlYzMgdi5cbiAqIFN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZCBjcm9zc1xuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgb3RoZXIgVmVjM1xuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuY3Jvc3MgPSBmdW5jdGlvbiBjcm9zcyh2KSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgdnggPSB2Lng7XG4gICAgdmFyIHZ5ID0gdi55O1xuICAgIHZhciB2eiA9IHYuejtcblxuICAgIHRoaXMueCA9IHkgKiB2eiAtIHogKiB2eTtcbiAgICB0aGlzLnkgPSB6ICogdnggLSB4ICogdno7XG4gICAgdGhpcy56ID0geCAqIHZ5IC0geSAqIHZ4O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTY2FsZSB0aGUgY3VycmVudCBWZWMzIGJ5IGEgc2NhbGFyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcyBUaGUgTnVtYmVyIGJ5IHdoaWNoIHRvIHNjYWxlXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uIHNjYWxlKHMpIHtcbiAgICB0aGlzLnggKj0gcztcbiAgICB0aGlzLnkgKj0gcztcbiAgICB0aGlzLnogKj0gcztcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBQcmVzZXJ2ZSB0aGUgbWFnbml0dWRlIGJ1dCBpbnZlcnQgdGhlIG9yaWVudGF0aW9uIG9mIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuaW52ZXJ0ID0gZnVuY3Rpb24gaW52ZXJ0KCkge1xuICAgIHRoaXMueCA9IC10aGlzLng7XG4gICAgdGhpcy55ID0gLXRoaXMueTtcbiAgICB0aGlzLnogPSAtdGhpcy56O1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFwcGx5IGEgZnVuY3Rpb24gY29tcG9uZW50LXdpc2UgdG8gdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gYXBwbHkuXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiBtYXAoZm4pIHtcbiAgICB0aGlzLnggPSBmbih0aGlzLngpO1xuICAgIHRoaXMueSA9IGZuKHRoaXMueSk7XG4gICAgdGhpcy56ID0gZm4odGhpcy56KTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBUaGUgbWFnbml0dWRlIG9mIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIG1hZ25pdHVkZSBvZiB0aGUgVmVjM1xuICovXG5WZWMzLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiBsZW5ndGgoKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICByZXR1cm4gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeik7XG59O1xuXG4vKipcbiAqIFRoZSBtYWduaXR1ZGUgc3F1YXJlZCBvZiB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IG1hZ25pdHVkZSBvZiB0aGUgVmVjMyBzcXVhcmVkXG4gKi9cblZlYzMucHJvdG90eXBlLmxlbmd0aFNxID0gZnVuY3Rpb24gbGVuZ3RoU3EoKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICByZXR1cm4geCAqIHggKyB5ICogeSArIHogKiB6O1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSBpbnB1dCBvbnRvIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBWZWMzIHRvIGNvcHlcbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5KHYpIHtcbiAgICB0aGlzLnggPSB2Lng7XG4gICAgdGhpcy55ID0gdi55O1xuICAgIHRoaXMueiA9IHYuejtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy55ID0gMDtcbiAgICB0aGlzLnogPSAwO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBtYWduaXR1ZGUgb2YgdGhlIGN1cnJlbnQgVmVjMyBpcyBleGFjdGx5IDAuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgb3Igbm90IHRoZSBtYWduaXR1ZGUgaXMgemVyb1xuICovXG5WZWMzLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbiBpc1plcm8oKSB7XG4gICAgcmV0dXJuIHRoaXMueCA9PT0gMCAmJiB0aGlzLnkgPT09IDAgJiYgdGhpcy56ID09PSAwO1xufTtcblxuLyoqXG4gKiBUaGUgYXJyYXkgZm9ybSBvZiB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYSB0aHJlZSBlbGVtZW50IGFycmF5IHJlcHJlc2VudGluZyB0aGUgY29tcG9uZW50cyBvZiB0aGUgVmVjM1xuICovXG5WZWMzLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gdG9BcnJheSgpIHtcbiAgICByZXR1cm4gW3RoaXMueCwgdGhpcy55LCB0aGlzLnpdO1xufTtcblxuLyoqXG4gKiBQcmVzZXJ2ZSB0aGUgb3JpZW50YXRpb24gYnV0IGNoYW5nZSB0aGUgbGVuZ3RoIG9mIHRoZSBjdXJyZW50IFZlYzMgdG8gMS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiBub3JtYWxpemUoKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgbGVuID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeikgfHwgMTtcbiAgICBsZW4gPSAxIC8gbGVuO1xuXG4gICAgdGhpcy54ICo9IGxlbjtcbiAgICB0aGlzLnkgKj0gbGVuO1xuICAgIHRoaXMueiAqPSBsZW47XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFwcGx5IHRoZSByb3RhdGlvbiBjb3JyZXNwb25kaW5nIHRvIHRoZSBpbnB1dCAodW5pdCkgUXVhdGVybmlvblxuICogdG8gdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtRdWF0ZXJuaW9ufSBxIFVuaXQgUXVhdGVybmlvbiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uIHRvIGFwcGx5XG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5hcHBseVJvdGF0aW9uID0gZnVuY3Rpb24gYXBwbHlSb3RhdGlvbihxKSB7XG4gICAgdmFyIGN3ID0gcS53O1xuICAgIHZhciBjeCA9IC1xLng7XG4gICAgdmFyIGN5ID0gLXEueTtcbiAgICB2YXIgY3ogPSAtcS56O1xuXG4gICAgdmFyIHZ4ID0gdGhpcy54O1xuICAgIHZhciB2eSA9IHRoaXMueTtcbiAgICB2YXIgdnogPSB0aGlzLno7XG5cbiAgICB2YXIgdHcgPSAtY3ggKiB2eCAtIGN5ICogdnkgLSBjeiAqIHZ6O1xuICAgIHZhciB0eCA9IHZ4ICogY3cgKyB2eSAqIGN6IC0gY3kgKiB2ejtcbiAgICB2YXIgdHkgPSB2eSAqIGN3ICsgY3ggKiB2eiAtIHZ4ICogY3o7XG4gICAgdmFyIHR6ID0gdnogKiBjdyArIHZ4ICogY3kgLSBjeCAqIHZ5O1xuXG4gICAgdmFyIHcgPSBjdztcbiAgICB2YXIgeCA9IC1jeDtcbiAgICB2YXIgeSA9IC1jeTtcbiAgICB2YXIgeiA9IC1jejtcblxuICAgIHRoaXMueCA9IHR4ICogdyArIHggKiB0dyArIHkgKiB0eiAtIHR5ICogejtcbiAgICB0aGlzLnkgPSB0eSAqIHcgKyB5ICogdHcgKyB0eCAqIHogLSB4ICogdHo7XG4gICAgdGhpcy56ID0gdHogKiB3ICsgeiAqIHR3ICsgeCAqIHR5IC0gdHggKiB5O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBcHBseSB0aGUgaW5wdXQgTWF0MzMgdGhlIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TWF0MzN9IG1hdHJpeCBNYXQzMyB0byBhcHBseVxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuYXBwbHlNYXRyaXggPSBmdW5jdGlvbiBhcHBseU1hdHJpeChtYXRyaXgpIHtcbiAgICB2YXIgTSA9IG1hdHJpeC5nZXQoKTtcblxuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdGhpcy54ID0gTVswXSp4ICsgTVsxXSp5ICsgTVsyXSp6O1xuICAgIHRoaXMueSA9IE1bM10qeCArIE1bNF0qeSArIE1bNV0qejtcbiAgICB0aGlzLnogPSBNWzZdKnggKyBNWzddKnkgKyBNWzhdKno7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgaW5wdXQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2IFRoZSByZWZlcmVuY2UgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gb3V0cHV0IFZlYzMgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSBUaGUgbm9ybWFsaXplIFZlYzMuXG4gKi9cblZlYzMubm9ybWFsaXplID0gZnVuY3Rpb24gbm9ybWFsaXplKHYsIG91dHB1dCkge1xuICAgIHZhciB4ID0gdi54O1xuICAgIHZhciB5ID0gdi55O1xuICAgIHZhciB6ID0gdi56O1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopIHx8IDE7XG4gICAgbGVuZ3RoID0gMSAvIGxlbmd0aDtcblxuICAgIG91dHB1dC54ID0geCAqIGxlbmd0aDtcbiAgICBvdXRwdXQueSA9IHkgKiBsZW5ndGg7XG4gICAgb3V0cHV0LnogPSB6ICogbGVuZ3RoO1xuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIEFwcGx5IGEgcm90YXRpb24gdG8gdGhlIGlucHV0IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgcmVmZXJlbmNlIFZlYzMuXG4gKiBAcGFyYW0ge1F1YXRlcm5pb259IHEgVW5pdCBRdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgcm90YXRpb24gdG8gYXBwbHkuXG4gKiBAcGFyYW0ge1ZlYzN9IG91dHB1dCBWZWMzIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjM30gVGhlIHJvdGF0ZWQgdmVyc2lvbiBvZiB0aGUgaW5wdXQgVmVjMy5cbiAqL1xuVmVjMy5hcHBseVJvdGF0aW9uID0gZnVuY3Rpb24gYXBwbHlSb3RhdGlvbih2LCBxLCBvdXRwdXQpIHtcbiAgICB2YXIgY3cgPSBxLnc7XG4gICAgdmFyIGN4ID0gLXEueDtcbiAgICB2YXIgY3kgPSAtcS55O1xuICAgIHZhciBjeiA9IC1xLno7XG5cbiAgICB2YXIgdnggPSB2Lng7XG4gICAgdmFyIHZ5ID0gdi55O1xuICAgIHZhciB2eiA9IHYuejtcblxuICAgIHZhciB0dyA9IC1jeCAqIHZ4IC0gY3kgKiB2eSAtIGN6ICogdno7XG4gICAgdmFyIHR4ID0gdnggKiBjdyArIHZ5ICogY3ogLSBjeSAqIHZ6O1xuICAgIHZhciB0eSA9IHZ5ICogY3cgKyBjeCAqIHZ6IC0gdnggKiBjejtcbiAgICB2YXIgdHogPSB2eiAqIGN3ICsgdnggKiBjeSAtIGN4ICogdnk7XG5cbiAgICB2YXIgdyA9IGN3O1xuICAgIHZhciB4ID0gLWN4O1xuICAgIHZhciB5ID0gLWN5O1xuICAgIHZhciB6ID0gLWN6O1xuXG4gICAgb3V0cHV0LnggPSB0eCAqIHcgKyB4ICogdHcgKyB5ICogdHogLSB0eSAqIHo7XG4gICAgb3V0cHV0LnkgPSB0eSAqIHcgKyB5ICogdHcgKyB0eCAqIHogLSB4ICogdHo7XG4gICAgb3V0cHV0LnogPSB0eiAqIHcgKyB6ICogdHcgKyB4ICogdHkgLSB0eCAqIHk7XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogQ2xvbmUgdGhlIGlucHV0IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgVmVjMyB0byBjbG9uZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSBUaGUgY2xvbmVkIFZlYzMuXG4gKi9cblZlYzMuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSh2KSB7XG4gICAgcmV0dXJuIG5ldyBWZWMzKHYueCwgdi55LCB2LnopO1xufTtcblxuLyoqXG4gKiBBZGQgdGhlIGlucHV0IFZlYzMncy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2MSBUaGUgbGVmdCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSB2MiBUaGUgcmlnaHQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gb3V0cHV0IFZlYzMgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSBUaGUgcmVzdWx0IG9mIHRoZSBhZGRpdGlvbi5cbiAqL1xuVmVjMy5hZGQgPSBmdW5jdGlvbiBhZGQodjEsIHYyLCBvdXRwdXQpIHtcbiAgICBvdXRwdXQueCA9IHYxLnggKyB2Mi54O1xuICAgIG91dHB1dC55ID0gdjEueSArIHYyLnk7XG4gICAgb3V0cHV0LnogPSB2MS56ICsgdjIuejtcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdCB0aGUgc2Vjb25kIFZlYzMgZnJvbSB0aGUgZmlyc3QuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdjEgVGhlIGxlZnQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gdjIgVGhlIHJpZ2h0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IG91dHB1dCBWZWMzIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjM30gVGhlIHJlc3VsdCBvZiB0aGUgc3VidHJhY3Rpb24uXG4gKi9cblZlYzMuc3VidHJhY3QgPSBmdW5jdGlvbiBzdWJ0cmFjdCh2MSwgdjIsIG91dHB1dCkge1xuICAgIG91dHB1dC54ID0gdjEueCAtIHYyLng7XG4gICAgb3V0cHV0LnkgPSB2MS55IC0gdjIueTtcbiAgICBvdXRwdXQueiA9IHYxLnogLSB2Mi56O1xuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlIHRoZSBpbnB1dCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVGhlIHJlZmVyZW5jZSBWZWMzLlxuICogQHBhcmFtIHtOdW1iZXJ9IHMgTnVtYmVyIHRvIHNjYWxlIGJ5LlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IFRoZSByZXN1bHQgb2YgdGhlIHNjYWxpbmcuXG4gKi9cblZlYzMuc2NhbGUgPSBmdW5jdGlvbiBzY2FsZSh2LCBzLCBvdXRwdXQpIHtcbiAgICBvdXRwdXQueCA9IHYueCAqIHM7XG4gICAgb3V0cHV0LnkgPSB2LnkgKiBzO1xuICAgIG91dHB1dC56ID0gdi56ICogcztcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBUaGUgZG90IHByb2R1Y3Qgb2YgdGhlIGlucHV0IFZlYzMncy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2MSBUaGUgbGVmdCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSB2MiBUaGUgcmlnaHQgVmVjMy5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBkb3QgcHJvZHVjdC5cbiAqL1xuVmVjMy5kb3QgPSBmdW5jdGlvbiBkb3QodjEsIHYyKSB7XG4gICAgcmV0dXJuIHYxLnggKiB2Mi54ICsgdjEueSAqIHYyLnkgKyB2MS56ICogdjIuejtcbn07XG5cbi8qKlxuICogVGhlIChyaWdodC1oYW5kZWQpIGNyb3NzIHByb2R1Y3Qgb2YgdGhlIGlucHV0IFZlYzMncy5cbiAqIHYxIHggdjIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdjEgVGhlIGxlZnQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gdjIgVGhlIHJpZ2h0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IG91dHB1dCBWZWMzIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSB0aGUgb2JqZWN0IHRoZSByZXN1bHQgb2YgdGhlIGNyb3NzIHByb2R1Y3Qgd2FzIHBsYWNlZCBpbnRvXG4gKi9cblZlYzMuY3Jvc3MgPSBmdW5jdGlvbiBjcm9zcyh2MSwgdjIsIG91dHB1dCkge1xuICAgIHZhciB4MSA9IHYxLng7XG4gICAgdmFyIHkxID0gdjEueTtcbiAgICB2YXIgejEgPSB2MS56O1xuICAgIHZhciB4MiA9IHYyLng7XG4gICAgdmFyIHkyID0gdjIueTtcbiAgICB2YXIgejIgPSB2Mi56O1xuXG4gICAgb3V0cHV0LnggPSB5MSAqIHoyIC0gejEgKiB5MjtcbiAgICBvdXRwdXQueSA9IHoxICogeDIgLSB4MSAqIHoyO1xuICAgIG91dHB1dC56ID0geDEgKiB5MiAtIHkxICogeDI7XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogVGhlIHByb2plY3Rpb24gb2YgdjEgb250byB2Mi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2MSBUaGUgbGVmdCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSB2MiBUaGUgcmlnaHQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gb3V0cHV0IFZlYzMgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IHRoZSBvYmplY3QgdGhlIHJlc3VsdCBvZiB0aGUgY3Jvc3MgcHJvZHVjdCB3YXMgcGxhY2VkIGludG8gXG4gKi9cblZlYzMucHJvamVjdCA9IGZ1bmN0aW9uIHByb2plY3QodjEsIHYyLCBvdXRwdXQpIHtcbiAgICB2YXIgeDEgPSB2MS54O1xuICAgIHZhciB5MSA9IHYxLnk7XG4gICAgdmFyIHoxID0gdjEuejtcbiAgICB2YXIgeDIgPSB2Mi54O1xuICAgIHZhciB5MiA9IHYyLnk7XG4gICAgdmFyIHoyID0gdjIuejtcblxuICAgIHZhciBzY2FsZSA9IHgxICogeDIgKyB5MSAqIHkyICsgejEgKiB6MjtcbiAgICBzY2FsZSAvPSB4MiAqIHgyICsgeTIgKiB5MiArIHoyICogejI7XG5cbiAgICBvdXRwdXQueCA9IHgyICogc2NhbGU7XG4gICAgb3V0cHV0LnkgPSB5MiAqIHNjYWxlO1xuICAgIG91dHB1dC56ID0gejIgKiBzY2FsZTtcblxuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlYzM7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IG5vb3BcblxuZnVuY3Rpb24gbm9vcCgpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ1lvdSBzaG91bGQgYnVuZGxlIHlvdXIgY29kZSAnICtcbiAgICAgICd1c2luZyBgZ2xzbGlmeWAgYXMgYSB0cmFuc2Zvcm0uJ1xuICApXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2dyYW1pZnlcblxuZnVuY3Rpb24gcHJvZ3JhbWlmeSh2ZXJ0ZXgsIGZyYWdtZW50LCB1bmlmb3JtcywgYXR0cmlidXRlcykge1xuICByZXR1cm4ge1xuICAgIHZlcnRleDogdmVydGV4LCBcbiAgICBmcmFnbWVudDogZnJhZ21lbnQsXG4gICAgdW5pZm9ybXM6IHVuaWZvcm1zLCBcbiAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzXG4gIH07XG59XG4iLCIvLyBodHRwOi8vcGF1bGlyaXNoLmNvbS8yMDExL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtYW5pbWF0aW5nL1xuLy8gaHR0cDovL215Lm9wZXJhLmNvbS9lbW9sbGVyL2Jsb2cvMjAxMS8xMi8yMC9yZXF1ZXN0YW5pbWF0aW9uZnJhbWUtZm9yLXNtYXJ0LWVyLWFuaW1hdGluZ1xuLy8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsIGJ5IEVyaWsgTcO2bGxlci4gZml4ZXMgZnJvbSBQYXVsIElyaXNoIGFuZCBUaW5vIFppamRlbFxuLy8gTUlUIGxpY2Vuc2VcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgbGFzdFRpbWUgPSAwO1xudmFyIHZlbmRvcnMgPSBbJ21zJywgJ21veicsICd3ZWJraXQnLCAnbyddO1xuXG52YXIgckFGLCBjQUY7XG5cbmlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0Jykge1xuICAgIHJBRiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gICAgY0FGID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5jYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gICAgZm9yICh2YXIgeCA9IDA7IHggPCB2ZW5kb3JzLmxlbmd0aCAmJiAhckFGOyArK3gpIHtcbiAgICAgICAgckFGID0gd2luZG93W3ZlbmRvcnNbeF0gKyAnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICAgIGNBRiA9IHdpbmRvd1t2ZW5kb3JzW3hdICsgJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddIHx8XG4gICAgICAgICAgICAgIHdpbmRvd1t2ZW5kb3JzW3hdICsgJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ107XG4gICAgfVxuXG4gICAgaWYgKHJBRiAmJiAhY0FGKSB7XG4gICAgICAgIC8vIGNBRiBub3Qgc3VwcG9ydGVkLlxuICAgICAgICAvLyBGYWxsIGJhY2sgdG8gc2V0SW50ZXJ2YWwgZm9yIG5vdyAodmVyeSByYXJlKS5cbiAgICAgICAgckFGID0gbnVsbDtcbiAgICB9XG59XG5cbmlmICghckFGKSB7XG4gICAgdmFyIG5vdyA9IERhdGUubm93ID8gRGF0ZS5ub3cgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB9O1xuXG4gICAgckFGID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGN1cnJUaW1lID0gbm93KCk7XG4gICAgICAgIHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xuICAgICAgICB2YXIgaWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7XG4gICAgICAgIH0sIHRpbWVUb0NhbGwpO1xuICAgICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH07XG5cbiAgICBjQUYgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICB9O1xufVxuXG52YXIgYW5pbWF0aW9uRnJhbWUgPSB7XG4gICAgLyoqXG4gICAgICogQ3Jvc3MgYnJvd3NlciB2ZXJzaW9uIG9mIFtyZXF1ZXN0QW5pbWF0aW9uRnJhbWVde0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS93aW5kb3cvcmVxdWVzdEFuaW1hdGlvbkZyYW1lfS5cbiAgICAgKlxuICAgICAqIFVzZWQgYnkgRW5naW5lIGluIG9yZGVyIHRvIGVzdGFibGlzaCBhIHJlbmRlciBsb29wLlxuICAgICAqXG4gICAgICogSWYgbm8gKHZlbmRvciBwcmVmaXhlZCB2ZXJzaW9uIG9mKSBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBpcyBhdmFpbGFibGUsXG4gICAgICogYHNldFRpbWVvdXRgIHdpbGwgYmUgdXNlZCBpbiBvcmRlciB0byBlbXVsYXRlIGEgcmVuZGVyIGxvb3AgcnVubmluZyBhdFxuICAgICAqIGFwcHJveGltYXRlbHkgNjAgZnJhbWVzIHBlciBzZWNvbmQuXG4gICAgICpcbiAgICAgKiBAbWV0aG9kICByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSAgIHtGdW5jdGlvbn0gIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgb24gdGhlIG5leHQgZnJhbWUuXG4gICAgICogQHJldHVybiAge051bWJlcn0gICAgcmVxdWVzdElkIHRvIGJlIHVzZWQgdG8gY2FuY2VsIHRoZSByZXF1ZXN0IHVzaW5nXG4gICAgICogICAgICAgICAgICAgICAgICAgICAge0BsaW5rIGNhbmNlbEFuaW1hdGlvbkZyYW1lfS5cbiAgICAgKi9cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWU6IHJBRixcblxuICAgIC8qKlxuICAgICAqIENyb3NzIGJyb3dzZXIgdmVyc2lvbiBvZiBbY2FuY2VsQW5pbWF0aW9uRnJhbWVde0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS93aW5kb3cvY2FuY2VsQW5pbWF0aW9uRnJhbWV9LlxuICAgICAqXG4gICAgICogQ2FuY2VscyBhIHByZXZpb3VzbHkgdXNpbmcgW3JlcXVlc3RBbmltYXRpb25GcmFtZV17QGxpbmsgYW5pbWF0aW9uRnJhbWUjcmVxdWVzdEFuaW1hdGlvbkZyYW1lfVxuICAgICAqIHNjaGVkdWxlZCByZXF1ZXN0LlxuICAgICAqXG4gICAgICogVXNlZCBmb3IgaW1tZWRpYXRlbHkgc3RvcHBpbmcgdGhlIHJlbmRlciBsb29wIHdpdGhpbiB0aGUgRW5naW5lLlxuICAgICAqXG4gICAgICogQG1ldGhvZCAgY2FuY2VsQW5pbWF0aW9uRnJhbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSAgIHtOdW1iZXJ9ICAgIHJlcXVlc3RJZCBvZiB0aGUgc2NoZWR1bGVkIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgcmV0dXJuZWQgYnkgW3JlcXVlc3RBbmltYXRpb25GcmFtZV17QGxpbmsgYW5pbWF0aW9uRnJhbWUjcmVxdWVzdEFuaW1hdGlvbkZyYW1lfS5cbiAgICAgKi9cbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZTogY0FGXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFuaW1hdGlvbkZyYW1lO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lOiByZXF1aXJlKCcuL2FuaW1hdGlvbkZyYW1lJykucmVxdWVzdEFuaW1hdGlvbkZyYW1lLFxuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lOiByZXF1aXJlKCcuL2FuaW1hdGlvbkZyYW1lJykuY2FuY2VsQW5pbWF0aW9uRnJhbWVcbn07XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBwb2x5ZmlsbHMgPSByZXF1aXJlKCcuLi9wb2x5ZmlsbHMnKTtcbnZhciByQUYgPSBwb2x5ZmlsbHMucmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xudmFyIGNBRiA9IHBvbHlmaWxscy5jYW5jZWxBbmltYXRpb25GcmFtZTtcblxuLyoqXG4gKiBCb29sZWFuIGNvbnN0YW50IGluZGljYXRpbmcgd2hldGhlciB0aGUgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCBoYXMgYWNjZXNzXG4gKiB0byB0aGUgZG9jdW1lbnQuIFRoZSBkb2N1bWVudCBpcyBiZWluZyB1c2VkIGluIG9yZGVyIHRvIHN1YnNjcmliZSBmb3JcbiAqIHZpc2liaWxpdHljaGFuZ2UgZXZlbnRzIHVzZWQgZm9yIG5vcm1hbGl6aW5nIHRoZSBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wXG4gKiB0aW1lIHdoZW4gZS5nLiB3aGVuIHN3aXRjaGluZyB0YWJzLlxuICpcbiAqIEBjb25zdGFudFxuICogQHR5cGUge0Jvb2xlYW59XG4gKi9cbnZhciBET0NVTUVOVF9BQ0NFU1MgPSB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnO1xuXG5pZiAoRE9DVU1FTlRfQUNDRVNTKSB7XG4gICAgdmFyIFZFTkRPUl9ISURERU4sIFZFTkRPUl9WSVNJQklMSVRZX0NIQU5HRTtcblxuICAgIC8vIE9wZXJhIDEyLjEwIGFuZCBGaXJlZm94IDE4IGFuZCBsYXRlciBzdXBwb3J0XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudC5oaWRkZW4gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIFZFTkRPUl9ISURERU4gPSAnaGlkZGVuJztcbiAgICAgICAgVkVORE9SX1ZJU0lCSUxJVFlfQ0hBTkdFID0gJ3Zpc2liaWxpdHljaGFuZ2UnO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQubW96SGlkZGVuICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBWRU5ET1JfSElEREVOID0gJ21vekhpZGRlbic7XG4gICAgICAgIFZFTkRPUl9WSVNJQklMSVRZX0NIQU5HRSA9ICdtb3p2aXNpYmlsaXR5Y2hhbmdlJztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50Lm1zSGlkZGVuICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBWRU5ET1JfSElEREVOID0gJ21zSGlkZGVuJztcbiAgICAgICAgVkVORE9SX1ZJU0lCSUxJVFlfQ0hBTkdFID0gJ21zdmlzaWJpbGl0eWNoYW5nZSc7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkb2N1bWVudC53ZWJraXRIaWRkZW4gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIFZFTkRPUl9ISURERU4gPSAnd2Via2l0SGlkZGVuJztcbiAgICAgICAgVkVORE9SX1ZJU0lCSUxJVFlfQ0hBTkdFID0gJ3dlYmtpdHZpc2liaWxpdHljaGFuZ2UnO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wIGNsYXNzIHVzZWQgZm9yIHVwZGF0aW5nIG9iamVjdHMgb24gYSBmcmFtZS1ieS1mcmFtZS5cbiAqIFN5bmNocm9uaXplcyB0aGUgYHVwZGF0ZWAgbWV0aG9kIGludm9jYXRpb25zIHRvIHRoZSByZWZyZXNoIHJhdGUgb2YgdGhlXG4gKiBzY3JlZW4uIE1hbmFnZXMgdGhlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLWxvb3AgYnkgbm9ybWFsaXppbmcgdGhlIHBhc3NlZCBpblxuICogdGltZXN0YW1wIHdoZW4gc3dpdGNoaW5nIHRhYnMuXG4gKlxuICogQGNsYXNzIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3BcbiAqL1xuZnVuY3Rpb24gUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gUmVmZXJlbmNlcyB0byBvYmplY3RzIHRvIGJlIHVwZGF0ZWQgb24gbmV4dCBmcmFtZS5cbiAgICB0aGlzLl91cGRhdGVzID0gW107XG5cbiAgICB0aGlzLl9sb29wZXIgPSBmdW5jdGlvbih0aW1lKSB7XG4gICAgICAgIF90aGlzLmxvb3AodGltZSk7XG4gICAgfTtcbiAgICB0aGlzLl90aW1lID0gMDtcbiAgICB0aGlzLl9zdG9wcGVkQXQgPSAwO1xuICAgIHRoaXMuX3NsZWVwID0gMDtcblxuICAgIC8vIEluZGljYXRlcyB3aGV0aGVyIHRoZSBlbmdpbmUgc2hvdWxkIGJlIHJlc3RhcnRlZCB3aGVuIHRoZSB0YWIvIHdpbmRvdyBpc1xuICAgIC8vIGJlaW5nIGZvY3VzZWQgYWdhaW4gKHZpc2liaWxpdHkgY2hhbmdlKS5cbiAgICB0aGlzLl9zdGFydE9uVmlzaWJpbGl0eUNoYW5nZSA9IHRydWU7XG5cbiAgICAvLyByZXF1ZXN0SWQgYXMgcmV0dXJuZWQgYnkgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIGZ1bmN0aW9uO1xuICAgIHRoaXMuX3JBRiA9IG51bGw7XG5cbiAgICB0aGlzLl9zbGVlcERpZmYgPSB0cnVlO1xuXG4gICAgLy8gVGhlIGVuZ2luZSBpcyBiZWluZyBzdGFydGVkIG9uIGluc3RhbnRpYXRpb24uXG4gICAgLy8gVE9ETyhhbGV4YW5kZXJHdWdlbClcbiAgICB0aGlzLnN0YXJ0KCk7XG5cbiAgICAvLyBUaGUgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCBzdXBwb3J0cyBydW5uaW5nIGluIGEgbm9uLWJyb3dzZXJcbiAgICAvLyBlbnZpcm9ubWVudCAoZS5nLiBXb3JrZXIpLlxuICAgIGlmIChET0NVTUVOVF9BQ0NFU1MpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihWRU5ET1JfVklTSUJJTElUWV9DSEFOR0UsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuX29uVmlzaWJpbGl0eUNoYW5nZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbi8qKlxuICogSGFuZGxlIHRoZSBzd2l0Y2hpbmcgb2YgdGFicy5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLl9vblZpc2liaWxpdHlDaGFuZ2UgPSBmdW5jdGlvbiBfb25WaXNpYmlsaXR5Q2hhbmdlKCkge1xuICAgIGlmIChkb2N1bWVudFtWRU5ET1JfSElEREVOXSkge1xuICAgICAgICB0aGlzLl9vblVuZm9jdXMoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMuX29uRm9jdXMoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEludGVybmFsIGhlbHBlciBmdW5jdGlvbiB0byBiZSBpbnZva2VkIGFzIHNvb24gYXMgdGhlIHdpbmRvdy8gdGFiIGlzIGJlaW5nXG4gKiBmb2N1c2VkIGFmdGVyIGEgdmlzaWJpbHRpeSBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLnByb3RvdHlwZS5fb25Gb2N1cyA9IGZ1bmN0aW9uIF9vbkZvY3VzKCkge1xuICAgIGlmICh0aGlzLl9zdGFydE9uVmlzaWJpbGl0eUNoYW5nZSkge1xuICAgICAgICB0aGlzLl9zdGFydCgpO1xuICAgIH1cbn07XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYXMgc29vbiBhcyB0aGUgd2luZG93LyB0YWIgaXMgYmVpbmdcbiAqIHVuZm9jdXNlZCAoaGlkZGVuKSBhZnRlciBhIHZpc2liaWx0aXkgY2hhbmdlLlxuICpcbiAqIEBtZXRob2QgIF9vbkZvY3VzXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLl9vblVuZm9jdXMgPSBmdW5jdGlvbiBfb25VbmZvY3VzKCkge1xuICAgIHRoaXMuX3N0b3AoKTtcbn07XG5cbi8qKlxuICogU3RhcnRzIHRoZSBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLiBXaGVuIHN3aXRjaGluZyB0byBhIGRpZmZlcm50IHRhYi9cbiAqIHdpbmRvdyAoY2hhbmdpbmcgdGhlIHZpc2liaWx0aXkpLCB0aGUgZW5naW5lIHdpbGwgYmUgcmV0YXJ0ZWQgd2hlbiBzd2l0Y2hpbmdcbiAqIGJhY2sgdG8gYSB2aXNpYmxlIHN0YXRlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wfSB0aGlzXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgaWYgKCF0aGlzLl9ydW5uaW5nKSB7XG4gICAgICAgIHRoaXMuX3N0YXJ0T25WaXNpYmlsaXR5Q2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fc3RhcnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEludGVybmFsIHZlcnNpb24gb2YgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCdzIHN0YXJ0IGZ1bmN0aW9uLCBub3QgYWZmZWN0aW5nXG4gKiBiZWhhdmlvciBvbiB2aXNpYmlsdHkgY2hhbmdlLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4qXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiBfc3RhcnQoKSB7XG4gICAgdGhpcy5fcnVubmluZyA9IHRydWU7XG4gICAgdGhpcy5fc2xlZXBEaWZmID0gdHJ1ZTtcbiAgICB0aGlzLl9yQUYgPSByQUYodGhpcy5fbG9vcGVyKTtcbn07XG5cbi8qKlxuICogU3RvcHMgdGhlIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wfSB0aGlzXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wKCkge1xuICAgIGlmICh0aGlzLl9ydW5uaW5nKSB7XG4gICAgICAgIHRoaXMuX3N0YXJ0T25WaXNpYmlsaXR5Q2hhbmdlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3N0b3AoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEludGVybmFsIHZlcnNpb24gb2YgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCdzIHN0b3AgZnVuY3Rpb24sIG5vdCBhZmZlY3RpbmdcbiAqIGJlaGF2aW9yIG9uIHZpc2liaWx0eSBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uIF9zdG9wKCkge1xuICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLl9zdG9wcGVkQXQgPSB0aGlzLl90aW1lO1xuXG4gICAgLy8gQnVnIGluIG9sZCB2ZXJzaW9ucyBvZiBGeC4gRXhwbGljaXRseSBjYW5jZWwuXG4gICAgY0FGKHRoaXMuX3JBRik7XG59O1xuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCBpcyBjdXJyZW50bHkgcnVubmluZyBvciBub3QuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGJvb2xlYW4gdmFsdWUgaW5kaWNhdGluZyB3aGV0aGVyIHRoZVxuICogUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCBpcyBjdXJyZW50bHkgcnVubmluZyBvciBub3RcbiAqL1xuUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5wcm90b3R5cGUuaXNSdW5uaW5nID0gZnVuY3Rpb24gaXNSdW5uaW5nKCkge1xuICAgIHJldHVybiB0aGlzLl9ydW5uaW5nO1xufTtcblxuLyoqXG4gKiBVcGRhdGVzIGFsbCByZWdpc3RlcmVkIG9iamVjdHMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lIGhpZ2ggcmVzb2x1dGlvbiB0aW1zdGFtcCB1c2VkIGZvciBpbnZva2luZyB0aGUgYHVwZGF0ZWBcbiAqIG1ldGhvZCBvbiBhbGwgcmVnaXN0ZXJlZCBvYmplY3RzXG4gKlxuICogQHJldHVybiB7UmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcH0gdGhpc1xuICovXG5SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLnByb3RvdHlwZS5zdGVwID0gZnVuY3Rpb24gc3RlcCAodGltZSkge1xuICAgIHRoaXMuX3RpbWUgPSB0aW1lO1xuICAgIGlmICh0aGlzLl9zbGVlcERpZmYpIHtcbiAgICAgICAgdGhpcy5fc2xlZXAgKz0gdGltZSAtIHRoaXMuX3N0b3BwZWRBdDtcbiAgICAgICAgdGhpcy5fc2xlZXBEaWZmID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVGhlIHNhbWUgdGltZXRhbXAgd2lsbCBiZSBlbWl0dGVkIGltbWVkaWF0ZWx5IGJlZm9yZSBhbmQgYWZ0ZXIgdmlzaWJpbGl0eVxuICAgIC8vIGNoYW5nZS5cbiAgICB2YXIgbm9ybWFsaXplZFRpbWUgPSB0aW1lIC0gdGhpcy5fc2xlZXA7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX3VwZGF0ZXMubGVuZ3RoIDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICB0aGlzLl91cGRhdGVzW2ldLnVwZGF0ZShub3JtYWxpemVkVGltZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBNZXRob2QgYmVpbmcgY2FsbGVkIGJ5IGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIG9uIGV2ZXJ5IHBhaW50LiBJbmRpcmVjdGx5XG4gKiByZWN1cnNpdmUgYnkgc2NoZWR1bGluZyBhIGZ1dHVyZSBpbnZvY2F0aW9uIG9mIGl0c2VsZiBvbiB0aGUgbmV4dCBwYWludC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUgaGlnaCByZXNvbHV0aW9uIHRpbXN0YW1wIHVzZWQgZm9yIGludm9raW5nIHRoZSBgdXBkYXRlYFxuICogbWV0aG9kIG9uIGFsbCByZWdpc3RlcmVkIG9iamVjdHNcbiAqIEByZXR1cm4ge1JlcXVlc3RBbmltYXRpb25GcmFtZUxvb3B9IHRoaXNcbiAqL1xuUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5wcm90b3R5cGUubG9vcCA9IGZ1bmN0aW9uIGxvb3AodGltZSkge1xuICAgIHRoaXMuc3RlcCh0aW1lKTtcbiAgICB0aGlzLl9yQUYgPSByQUYodGhpcy5fbG9vcGVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVnaXN0ZXJlcyBhbiB1cGRhdGVhYmxlIG9iamVjdCB3aGljaCBgdXBkYXRlYCBtZXRob2Qgc2hvdWxkIGJlIGludm9rZWQgb25cbiAqIGV2ZXJ5IHBhaW50LCBzdGFydGluZyBvbiB0aGUgbmV4dCBwYWludCAoYXNzdW1pbmcgdGhlXG4gKiBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wIGlzIHJ1bm5pbmcpLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdXBkYXRlYWJsZSBvYmplY3QgdG8gYmUgdXBkYXRlZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gdXBkYXRlYWJsZS51cGRhdGUgdXBkYXRlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiB0aGVcbiAqIHJlZ2lzdGVyZWQgb2JqZWN0XG4gKlxuICogQHJldHVybiB7UmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcH0gdGhpc1xuICovXG5SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUodXBkYXRlYWJsZSkge1xuICAgIGlmICh0aGlzLl91cGRhdGVzLmluZGV4T2YodXBkYXRlYWJsZSkgPT09IC0xKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZXMucHVzaCh1cGRhdGVhYmxlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIERlcmVnaXN0ZXJzIGFuIHVwZGF0ZWFibGUgb2JqZWN0IHByZXZpb3VzbHkgcmVnaXN0ZXJlZCB1c2luZyBgdXBkYXRlYCB0byBiZVxuICogbm8gbG9uZ2VyIHVwZGF0ZWQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB1cGRhdGVhYmxlIHVwZGF0ZWFibGUgb2JqZWN0IHByZXZpb3VzbHkgcmVnaXN0ZXJlZCB1c2luZ1xuICogYHVwZGF0ZWBcbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wfSB0aGlzXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLm5vTG9uZ2VyVXBkYXRlID0gZnVuY3Rpb24gbm9Mb25nZXJVcGRhdGUodXBkYXRlYWJsZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuX3VwZGF0ZXMuaW5kZXhPZih1cGRhdGVhYmxlKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICB0aGlzLl91cGRhdGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29udGV4dCA9IHJlcXVpcmUoJy4vQ29udGV4dCcpO1xudmFyIGluamVjdENTUyA9IHJlcXVpcmUoJy4vaW5qZWN0LWNzcycpO1xuXG4vKipcbiAqIEluc3RhbnRpYXRlcyBhIG5ldyBDb21wb3NpdG9yLlxuICogVGhlIENvbXBvc2l0b3IgcmVjZWl2ZXMgZHJhdyBjb21tYW5kcyBmcm0gdGhlIFVJTWFuYWdlciBhbmQgcm91dGVzIHRoZSB0byB0aGVcbiAqIHJlc3BlY3RpdmUgY29udGV4dCBvYmplY3RzLlxuICpcbiAqIFVwb24gY3JlYXRpb24sIGl0IGluamVjdHMgYSBzdHlsZXNoZWV0IHVzZWQgZm9yIHN0eWxpbmcgdGhlIGluZGl2aWR1YWxcbiAqIHJlbmRlcmVycyB1c2VkIGluIHRoZSBjb250ZXh0IG9iamVjdHMuXG4gKlxuICogQGNsYXNzIENvbXBvc2l0b3JcbiAqIEBjb25zdHJ1Y3RvclxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuZnVuY3Rpb24gQ29tcG9zaXRvcigpIHtcbiAgICBpbmplY3RDU1MoKTtcblxuICAgIHRoaXMuX2NvbnRleHRzID0ge307XG4gICAgdGhpcy5fb3V0Q29tbWFuZHMgPSBbXTtcbiAgICB0aGlzLl9pbkNvbW1hbmRzID0gW107XG4gICAgdGhpcy5fdGltZSA9IG51bGw7XG5cbiAgICB0aGlzLl9yZXNpemVkID0gZmFsc2U7XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuX3Jlc2l6ZWQgPSB0cnVlO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgdGltZSBiZWluZyB1c2VkIGJ5IHRoZSBpbnRlcm5hbCBjbG9jayBtYW5hZ2VkIGJ5XG4gKiBgRmFtb3VzRW5naW5lYC5cbiAqXG4gKiBUaGUgdGltZSBpcyBiZWluZyBwYXNzZWQgaW50byBjb3JlIGJ5IHRoZSBFbmdpbmUgdGhyb3VnaCB0aGUgVUlNYW5hZ2VyLlxuICogU2luY2UgY29yZSBoYXMgdGhlIGFiaWxpdHkgdG8gc2NhbGUgdGhlIHRpbWUsIHRoZSB0aW1lIG5lZWRzIHRvIGJlIHBhc3NlZFxuICogYmFjayB0byB0aGUgcmVuZGVyaW5nIHN5c3RlbS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aW1lIFRoZSBjbG9jayB0aW1lIHVzZWQgaW4gY29yZS5cbiAqL1xuQ29tcG9zaXRvci5wcm90b3R5cGUuZ2V0VGltZSA9IGZ1bmN0aW9uIGdldFRpbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RpbWU7XG59O1xuXG4vKipcbiAqIFNjaGVkdWxlcyBhbiBldmVudCB0byBiZSBzZW50IHRoZSBuZXh0IHRpbWUgdGhlIG91dCBjb21tYW5kIHF1ZXVlIGlzIGJlaW5nXG4gKiBmbHVzaGVkLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBwYXRoIFJlbmRlciBwYXRoIHRvIHRoZSBub2RlIHRoZSBldmVudCBzaG91bGQgYmUgdHJpZ2dlcmVkXG4gKiBvbiAoKnRhcmdldGVkIGV2ZW50KilcbiAqIEBwYXJhbSAge1N0cmluZ30gZXYgRXZlbnQgdHlwZVxuICogQHBhcmFtICB7T2JqZWN0fSBwYXlsb2FkIEV2ZW50IG9iamVjdCAoc2VyaWFsaXphYmxlIHVzaW5nIHN0cnVjdHVyZWQgY2xvbmluZ1xuICogYWxnb3JpdGhtKVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNvbXBvc2l0b3IucHJvdG90eXBlLnNlbmRFdmVudCA9IGZ1bmN0aW9uIHNlbmRFdmVudChwYXRoLCBldiwgcGF5bG9hZCkge1xuICAgIHRoaXMuX291dENvbW1hbmRzLnB1c2goJ1dJVEgnLCBwYXRoLCAnVFJJR0dFUicsIGV2LCBwYXlsb2FkKTtcbn07XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIG1ldGhvZCB1c2VkIGZvciBub3RpZnlpbmcgZXh0ZXJuYWxseVxuICogcmVzaXplZCBjb250ZXh0cyAoZS5nLiBieSByZXNpemluZyB0aGUgYnJvd3NlciB3aW5kb3cpLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBzZWxlY3RvciByZW5kZXIgcGF0aCB0byB0aGUgbm9kZSAoY29udGV4dCkgdGhhdCBzaG91bGQgYmVcbiAqIHJlc2l6ZWRcbiAqIEBwYXJhbSAge0FycmF5fSBzaXplIG5ldyBjb250ZXh0IHNpemVcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Db21wb3NpdG9yLnByb3RvdHlwZS5zZW5kUmVzaXplID0gZnVuY3Rpb24gc2VuZFJlc2l6ZSAoc2VsZWN0b3IsIHNpemUpIHtcbiAgICB0aGlzLnNlbmRFdmVudChzZWxlY3RvciwgJ0NPTlRFWFRfUkVTSVpFJywgc2l6ZSk7XG59O1xuXG4vKipcbiAqIEludGVybmFsIGhlbHBlciBtZXRob2QgdXNlZCBieSBgZHJhd0NvbW1hbmRzYC5cbiAqIFN1YnNlcXVlbnQgY29tbWFuZHMgYXJlIGJlaW5nIGFzc29jaWF0ZWQgd2l0aCB0aGUgbm9kZSBkZWZpbmVkIHRoZSB0aGUgcGF0aFxuICogZm9sbG93aW5nIHRoZSBgV0lUSGAgY29tbWFuZC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSAge051bWJlcn0gaXRlcmF0b3IgcG9zaXRpb24gaW5kZXggd2l0aGluIHRoZSBjb21tYW5kcyBxdWV1ZVxuICogQHBhcmFtICB7QXJyYXl9IGNvbW1hbmRzIHJlbWFpbmluZyBtZXNzYWdlIHF1ZXVlIHJlY2VpdmVkLCB1c2VkIHRvXG4gKiBzaGlmdCBzaW5nbGUgbWVzc2FnZXMgZnJvbVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNvbXBvc2l0b3IucHJvdG90eXBlLmhhbmRsZVdpdGggPSBmdW5jdGlvbiBoYW5kbGVXaXRoIChpdGVyYXRvciwgY29tbWFuZHMpIHtcbiAgICB2YXIgcGF0aCA9IGNvbW1hbmRzW2l0ZXJhdG9yXTtcbiAgICB2YXIgcGF0aEFyciA9IHBhdGguc3BsaXQoJy8nKTtcbiAgICB2YXIgY29udGV4dCA9IHRoaXMuZ2V0T3JTZXRDb250ZXh0KHBhdGhBcnIuc2hpZnQoKSk7XG4gICAgcmV0dXJuIGNvbnRleHQucmVjZWl2ZShwYXRoLCBjb21tYW5kcywgaXRlcmF0b3IpO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIHRvcC1sZXZlbCBDb250ZXh0IGFzc29jaWF0ZWQgd2l0aCB0aGUgcGFzc2VkIGluIGRvY3VtZW50XG4gKiBxdWVyeSBzZWxlY3Rvci4gSWYgbm8gc3VjaCBDb250ZXh0IGV4aXN0cywgYSBuZXcgb25lIHdpbGwgYmUgaW5zdGFudGlhdGVkLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBzZWxlY3RvciBkb2N1bWVudCBxdWVyeSBzZWxlY3RvciB1c2VkIGZvciByZXRyaWV2aW5nIHRoZVxuICogRE9NIG5vZGUgdGhlIFZpcnR1YWxFbGVtZW50IHNob3VsZCBiZSBhdHRhY2hlZCB0b1xuICpcbiAqIEByZXR1cm4ge0NvbnRleHR9IGNvbnRleHRcbiAqL1xuQ29tcG9zaXRvci5wcm90b3R5cGUuZ2V0T3JTZXRDb250ZXh0ID0gZnVuY3Rpb24gZ2V0T3JTZXRDb250ZXh0KHNlbGVjdG9yKSB7XG4gICAgaWYgKHRoaXMuX2NvbnRleHRzW3NlbGVjdG9yXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dHNbc2VsZWN0b3JdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dChzZWxlY3RvciwgdGhpcyk7XG4gICAgICAgIHRoaXMuX2NvbnRleHRzW3NlbGVjdG9yXSA9IGNvbnRleHQ7XG4gICAgICAgIHJldHVybiBjb250ZXh0O1xuICAgIH1cbn07XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIG1ldGhvZCB1c2VkIGJ5IGBkcmF3Q29tbWFuZHNgLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtICB7TnVtYmVyfSBpdGVyYXRvciBwb3NpdGlvbiBpbmRleCB3aXRoaW4gdGhlIGNvbW1hbmQgcXVldWVcbiAqIEBwYXJhbSAge0FycmF5fSBjb21tYW5kcyByZW1haW5pbmcgbWVzc2FnZSBxdWV1ZSByZWNlaXZlZCwgdXNlZCB0b1xuICogc2hpZnQgc2luZ2xlIG1lc3NhZ2VzXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ29tcG9zaXRvci5wcm90b3R5cGUuZ2l2ZVNpemVGb3IgPSBmdW5jdGlvbiBnaXZlU2l6ZUZvcihpdGVyYXRvciwgY29tbWFuZHMpIHtcbiAgICB2YXIgc2VsZWN0b3IgPSBjb21tYW5kc1tpdGVyYXRvcl07XG4gICAgdmFyIHNpemUgPSB0aGlzLmdldE9yU2V0Q29udGV4dChzZWxlY3RvcikuZ2V0Um9vdFNpemUoKTtcbiAgICB0aGlzLnNlbmRSZXNpemUoc2VsZWN0b3IsIHNpemUpO1xufTtcblxuLyoqXG4gKiBQcm9jZXNzZXMgdGhlIHByZXZpb3VzbHkgdmlhIGByZWNlaXZlQ29tbWFuZHNgIHVwZGF0ZWQgaW5jb21pbmcgXCJpblwiXG4gKiBjb21tYW5kIHF1ZXVlLlxuICogQ2FsbGVkIGJ5IFVJTWFuYWdlciBvbiBhIGZyYW1lIGJ5IGZyYW1lIGJhc2lzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gb3V0Q29tbWFuZHMgc2V0IG9mIGNvbW1hbmRzIHRvIGJlIHNlbnQgYmFja1xuICovXG5Db21wb3NpdG9yLnByb3RvdHlwZS5kcmF3Q29tbWFuZHMgPSBmdW5jdGlvbiBkcmF3Q29tbWFuZHMoKSB7XG4gICAgdmFyIGNvbW1hbmRzID0gdGhpcy5faW5Db21tYW5kcztcbiAgICB2YXIgbG9jYWxJdGVyYXRvciA9IDA7XG4gICAgdmFyIGNvbW1hbmQgPSBjb21tYW5kc1tsb2NhbEl0ZXJhdG9yXTtcbiAgICB3aGlsZSAoY29tbWFuZCkge1xuICAgICAgICBzd2l0Y2ggKGNvbW1hbmQpIHtcbiAgICAgICAgICAgIGNhc2UgJ1RJTUUnOlxuICAgICAgICAgICAgICAgIHRoaXMuX3RpbWUgPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnV0lUSCc6XG4gICAgICAgICAgICAgICAgbG9jYWxJdGVyYXRvciA9IHRoaXMuaGFuZGxlV2l0aCgrK2xvY2FsSXRlcmF0b3IsIGNvbW1hbmRzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ05FRURfU0laRV9GT1InOlxuICAgICAgICAgICAgICAgIHRoaXMuZ2l2ZVNpemVGb3IoKytsb2NhbEl0ZXJhdG9yLCBjb21tYW5kcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY29tbWFuZCA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgfVxuXG4gICAgLy8gVE9ETzogU3dpdGNoIHRvIGFzc29jaWF0aXZlIGFycmF5cyBoZXJlLi4uXG5cbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fY29udGV4dHMpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dHNba2V5XS5kcmF3KCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3Jlc2l6ZWQpIHtcbiAgICAgICAgdGhpcy51cGRhdGVTaXplKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX291dENvbW1hbmRzO1xufTtcblxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHNpemUgb2YgYWxsIHByZXZpb3VzbHkgcmVnaXN0ZXJlZCBjb250ZXh0IG9iamVjdHMuXG4gKiBUaGlzIHJlc3VsdHMgaW50byBDT05URVhUX1JFU0laRSBldmVudHMgYmVpbmcgc2VudCBhbmQgdGhlIHJvb3QgZWxlbWVudHNcbiAqIHVzZWQgYnkgdGhlIGluZGl2aWR1YWwgcmVuZGVyZXJzIGJlaW5nIHJlc2l6ZWQgdG8gdGhlIHRoZSBET01SZW5kZXJlcidzIHJvb3RcbiAqIHNpemUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNvbXBvc2l0b3IucHJvdG90eXBlLnVwZGF0ZVNpemUgPSBmdW5jdGlvbiB1cGRhdGVTaXplKCkge1xuICAgIGZvciAodmFyIHNlbGVjdG9yIGluIHRoaXMuX2NvbnRleHRzKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHRzW3NlbGVjdG9yXS51cGRhdGVTaXplKCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBVc2VkIGJ5IFRocmVhZE1hbmFnZXIgdG8gdXBkYXRlIHRoZSBpbnRlcm5hbCBxdWV1ZSBvZiBpbmNvbWluZyBjb21tYW5kcy5cbiAqIFJlY2VpdmluZyBjb21tYW5kcyBkb2VzIG5vdCBpbW1lZGlhdGVseSBzdGFydCB0aGUgcmVuZGVyaW5nIHByb2Nlc3MuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSAge0FycmF5fSBjb21tYW5kcyBjb21tYW5kIHF1ZXVlIHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgY29tcG9zaXRvcidzXG4gKiBgZHJhd0NvbW1hbmRzYCBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Db21wb3NpdG9yLnByb3RvdHlwZS5yZWNlaXZlQ29tbWFuZHMgPSBmdW5jdGlvbiByZWNlaXZlQ29tbWFuZHMoY29tbWFuZHMpIHtcbiAgICB2YXIgbGVuID0gY29tbWFuZHMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdGhpcy5faW5Db21tYW5kcy5wdXNoKGNvbW1hbmRzW2ldKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZsdXNoZXMgdGhlIHF1ZXVlIG9mIG91dGdvaW5nIFwib3V0XCIgY29tbWFuZHMuXG4gKiBDYWxsZWQgYnkgVGhyZWFkTWFuYWdlci5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ29tcG9zaXRvci5wcm90b3R5cGUuY2xlYXJDb21tYW5kcyA9IGZ1bmN0aW9uIGNsZWFyQ29tbWFuZHMoKSB7XG4gICAgdGhpcy5faW5Db21tYW5kcy5sZW5ndGggPSAwO1xuICAgIHRoaXMuX291dENvbW1hbmRzLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5fcmVzaXplZCA9IGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb3NpdG9yO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgV2ViR0xSZW5kZXJlciA9IHJlcXVpcmUoJy4uL3dlYmdsLXJlbmRlcmVycy9XZWJHTFJlbmRlcmVyJyk7XG52YXIgQ2FtZXJhID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9DYW1lcmEnKTtcbnZhciBET01SZW5kZXJlciA9IHJlcXVpcmUoJy4uL2RvbS1yZW5kZXJlcnMvRE9NUmVuZGVyZXInKTtcblxuLyoqXG4gKiBDb250ZXh0IGlzIGEgcmVuZGVyIGxheWVyIHdpdGggaXRzIG93biBXZWJHTFJlbmRlcmVyIGFuZCBET01SZW5kZXJlci5cbiAqIEl0IGlzIHRoZSBpbnRlcmZhY2UgYmV0d2VlbiB0aGUgQ29tcG9zaXRvciB3aGljaCByZWNlaXZlcyBjb21tYW5kc1xuICogYW5kIHRoZSByZW5kZXJlcnMgdGhhdCBpbnRlcnByZXQgdGhlbS4gSXQgYWxzbyByZWxheXMgaW5mb3JtYXRpb24gdG9cbiAqIHRoZSByZW5kZXJlcnMgYWJvdXQgcmVzaXppbmcuXG4gKlxuICogVGhlIERPTUVsZW1lbnQgYXQgdGhlIGdpdmVuIHF1ZXJ5IHNlbGVjdG9yIGlzIHVzZWQgYXMgdGhlIHJvb3QuIEFcbiAqIG5ldyBET01FbGVtZW50IGlzIGFwcGVuZGVkIHRvIHRoaXMgcm9vdCBlbGVtZW50LCBhbmQgdXNlZCBhcyB0aGVcbiAqIHBhcmVudCBlbGVtZW50IGZvciBhbGwgRmFtb3VzIERPTSByZW5kZXJpbmcgYXQgdGhpcyBjb250ZXh0LiBBXG4gKiBjYW52YXMgaXMgYWRkZWQgYW5kIHVzZWQgZm9yIGFsbCBXZWJHTCByZW5kZXJpbmcgYXQgdGhpcyBjb250ZXh0LlxuICpcbiAqIEBjbGFzcyBDb250ZXh0XG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgUXVlcnkgc2VsZWN0b3IgdXNlZCB0byBsb2NhdGUgcm9vdCBlbGVtZW50IG9mXG4gKiBjb250ZXh0IGxheWVyLlxuICogQHBhcmFtIHtDb21wb3NpdG9yfSBjb21wb3NpdG9yIENvbXBvc2l0b3IgcmVmZXJlbmNlIHRvIHBhc3MgZG93biB0b1xuICogV2ViR0xSZW5kZXJlci5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBDb250ZXh0KHNlbGVjdG9yLCBjb21wb3NpdG9yKSB7XG4gICAgdGhpcy5fY29tcG9zaXRvciA9IGNvbXBvc2l0b3I7XG4gICAgdGhpcy5fcm9vdEVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG5cbiAgICB0aGlzLl9zZWxlY3RvciA9IHNlbGVjdG9yO1xuXG4gICAgLy8gQ3JlYXRlIERPTSBlbGVtZW50IHRvIGJlIHVzZWQgYXMgcm9vdCBmb3IgYWxsIGZhbW91cyBET01cbiAgICAvLyByZW5kZXJpbmcgYW5kIGFwcGVuZCBlbGVtZW50IHRvIHRoZSByb290IGVsZW1lbnQuXG5cbiAgICB2YXIgRE9NTGF5ZXJFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuX3Jvb3RFbC5hcHBlbmRDaGlsZChET01MYXllckVsKTtcblxuICAgIC8vIEluc3RhbnRpYXRlIHJlbmRlcmVyc1xuXG4gICAgdGhpcy5ET01SZW5kZXJlciA9IG5ldyBET01SZW5kZXJlcihET01MYXllckVsLCBzZWxlY3RvciwgY29tcG9zaXRvcik7XG4gICAgdGhpcy5XZWJHTFJlbmRlcmVyID0gbnVsbDtcbiAgICB0aGlzLmNhbnZhcyA9IG51bGw7XG5cbiAgICAvLyBTdGF0ZSBob2xkZXJzXG5cbiAgICB0aGlzLl9yZW5kZXJTdGF0ZSA9IHtcbiAgICAgICAgcHJvamVjdGlvblR5cGU6IENhbWVyYS5PUlRIT0dSQVBISUNfUFJPSkVDVElPTixcbiAgICAgICAgcGVyc3BlY3RpdmVUcmFuc2Zvcm06IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKSxcbiAgICAgICAgdmlld1RyYW5zZm9ybTogbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pLFxuICAgICAgICB2aWV3RGlydHk6IGZhbHNlLFxuICAgICAgICBwZXJzcGVjdGl2ZURpcnR5OiBmYWxzZVxuICAgIH07XG5cbiAgICB0aGlzLl9zaXplID0gW107XG4gICAgdGhpcy5fY2hpbGRyZW4gPSB7fTtcbiAgICB0aGlzLl9lbGVtZW50SGFzaCA9IHt9O1xuXG4gICAgdGhpcy5fbWVzaFRyYW5zZm9ybSA9IFtdO1xuICAgIHRoaXMuX21lc2hTaXplID0gWzAsIDAsIDBdO1xufVxuXG4vKipcbiAqIFF1ZXJpZXMgRE9NUmVuZGVyZXIgc2l6ZSBhbmQgdXBkYXRlcyBjYW52YXMgc2l6ZS4gUmVsYXlzIHNpemUgaW5mb3JtYXRpb24gdG9cbiAqIFdlYkdMUmVuZGVyZXIuXG4gKlxuICogQHJldHVybiB7Q29udGV4dH0gdGhpc1xuICovXG5Db250ZXh0LnByb3RvdHlwZS51cGRhdGVTaXplID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuZXdTaXplID0gdGhpcy5ET01SZW5kZXJlci5nZXRTaXplKCk7XG4gICAgdGhpcy5fY29tcG9zaXRvci5zZW5kUmVzaXplKHRoaXMuX3NlbGVjdG9yLCBuZXdTaXplKTtcblxuICAgIGlmICh0aGlzLmNhbnZhcyAmJiB0aGlzLldlYkdMUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnVwZGF0ZVNpemUobmV3U2l6ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIERyYXcgZnVuY3Rpb24gY2FsbGVkIGFmdGVyIGFsbCBjb21tYW5kcyBoYXZlIGJlZW4gaGFuZGxlZCBmb3IgY3VycmVudCBmcmFtZS5cbiAqIElzc3VlcyBkcmF3IGNvbW1hbmRzIHRvIGFsbCByZW5kZXJlcnMgd2l0aCBjdXJyZW50IHJlbmRlclN0YXRlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Db250ZXh0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gZHJhdygpIHtcbiAgICB0aGlzLkRPTVJlbmRlcmVyLmRyYXcodGhpcy5fcmVuZGVyU3RhdGUpO1xuICAgIGlmICh0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuV2ViR0xSZW5kZXJlci5kcmF3KHRoaXMuX3JlbmRlclN0YXRlKTtcblxuICAgIGlmICh0aGlzLl9yZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZURpcnR5KSB0aGlzLl9yZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZURpcnR5ID0gZmFsc2U7XG4gICAgaWYgKHRoaXMuX3JlbmRlclN0YXRlLnZpZXdEaXJ0eSkgdGhpcy5fcmVuZGVyU3RhdGUudmlld0RpcnR5ID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIHNpemUgb2YgdGhlIHBhcmVudCBlbGVtZW50IG9mIHRoZSBET01SZW5kZXJlciBmb3IgdGhpcyBjb250ZXh0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Db250ZXh0LnByb3RvdHlwZS5nZXRSb290U2l6ZSA9IGZ1bmN0aW9uIGdldFJvb3RTaXplKCkge1xuICAgIHJldHVybiB0aGlzLkRPTVJlbmRlcmVyLmdldFNpemUoKTtcbn07XG5cbi8qKlxuICogSGFuZGxlcyBpbml0aWFsaXphdGlvbiBvZiBXZWJHTFJlbmRlcmVyIHdoZW4gbmVjZXNzYXJ5LCBpbmNsdWRpbmcgY3JlYXRpb25cbiAqIG9mIHRoZSBjYW52YXMgZWxlbWVudCBhbmQgaW5zdGFudGlhdGlvbiBvZiB0aGUgcmVuZGVyZXIuIEFsc28gdXBkYXRlcyBzaXplXG4gKiB0byBwYXNzIHNpemUgaW5mb3JtYXRpb24gdG8gdGhlIHJlbmRlcmVyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Db250ZXh0LnByb3RvdHlwZS5pbml0V2ViR0wgPSBmdW5jdGlvbiBpbml0V2ViR0woKSB7XG4gICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB0aGlzLl9yb290RWwuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpO1xuICAgIHRoaXMuV2ViR0xSZW5kZXJlciA9IG5ldyBXZWJHTFJlbmRlcmVyKHRoaXMuY2FudmFzLCB0aGlzLl9jb21wb3NpdG9yKTtcbiAgICB0aGlzLnVwZGF0ZVNpemUoKTtcbn07XG5cbi8qKlxuICogSGFuZGxlcyBkZWxlZ2F0aW9uIG9mIGNvbW1hbmRzIHRvIHJlbmRlcmVycyBvZiB0aGlzIGNvbnRleHQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFN0cmluZyB1c2VkIGFzIGlkZW50aWZpZXIgb2YgYSBnaXZlbiBub2RlIGluIHRoZVxuICogc2NlbmUgZ3JhcGguXG4gKiBAcGFyYW0ge0FycmF5fSBjb21tYW5kcyBMaXN0IG9mIGFsbCBjb21tYW5kcyBmcm9tIHRoaXMgZnJhbWUuXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlcmF0b3IgTnVtYmVyIGluZGljYXRpbmcgcHJvZ3Jlc3MgdGhyb3VnaCB0aGUgY29tbWFuZFxuICogcXVldWUuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBpdGVyYXRvciBpbmRpY2F0aW5nIHByb2dyZXNzIHRocm91Z2ggdGhlIGNvbW1hbmQgcXVldWUuXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLnJlY2VpdmUgPSBmdW5jdGlvbiByZWNlaXZlKHBhdGgsIGNvbW1hbmRzLCBpdGVyYXRvcikge1xuICAgIHZhciBsb2NhbEl0ZXJhdG9yID0gaXRlcmF0b3I7XG5cbiAgICB2YXIgY29tbWFuZCA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgdGhpcy5ET01SZW5kZXJlci5sb2FkUGF0aChwYXRoKTtcbiAgICB0aGlzLkRPTVJlbmRlcmVyLmZpbmRUYXJnZXQoKTtcbiAgICB3aGlsZSAoY29tbWFuZCkge1xuXG4gICAgICAgIHN3aXRjaCAoY29tbWFuZCkge1xuICAgICAgICAgICAgY2FzZSAnSU5JVF9ET00nOlxuICAgICAgICAgICAgICAgIHRoaXMuRE9NUmVuZGVyZXIuaW5zZXJ0RWwoY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0RPTV9SRU5ERVJfU0laRSc6XG4gICAgICAgICAgICAgICAgdGhpcy5ET01SZW5kZXJlci5nZXRTaXplT2YoY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0NIQU5HRV9UUkFOU0ZPUk0nOlxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwIDsgaSA8IDE2IDsgaSsrKSB0aGlzLl9tZXNoVHJhbnNmb3JtW2ldID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuRE9NUmVuZGVyZXIuc2V0TWF0cml4KHRoaXMuX21lc2hUcmFuc2Zvcm0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuV2ViR0xSZW5kZXJlcilcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnNldEN1dG91dFVuaWZvcm0ocGF0aCwgJ3VfdHJhbnNmb3JtJywgdGhpcy5fbWVzaFRyYW5zZm9ybSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnQ0hBTkdFX1NJWkUnOlxuICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG5cbiAgICAgICAgICAgICAgICB0aGlzLkRPTVJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuV2ViR0xSZW5kZXJlcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tZXNoU2l6ZVswXSA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tZXNoU2l6ZVsxXSA9IGhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnNldEN1dG91dFVuaWZvcm0ocGF0aCwgJ3Vfc2l6ZScsIHRoaXMuX21lc2hTaXplKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0NIQU5HRV9QUk9QRVJUWSc6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5XZWJHTFJlbmRlcmVyLmdldE9yU2V0Q3V0b3V0KHBhdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMuRE9NUmVuZGVyZXIuc2V0UHJvcGVydHkoY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSwgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0NIQU5HRV9DT05URU5UJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLldlYkdMUmVuZGVyZXIuZ2V0T3JTZXRDdXRvdXQocGF0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5ET01SZW5kZXJlci5zZXRDb250ZW50KGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdDSEFOR0VfQVRUUklCVVRFJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLldlYkdMUmVuZGVyZXIuZ2V0T3JTZXRDdXRvdXQocGF0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5ET01SZW5kZXJlci5zZXRBdHRyaWJ1dGUoY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSwgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0FERF9DTEFTUyc6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5XZWJHTFJlbmRlcmVyLmdldE9yU2V0Q3V0b3V0KHBhdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMuRE9NUmVuZGVyZXIuYWRkQ2xhc3MoY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ1JFTU9WRV9DTEFTUyc6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5XZWJHTFJlbmRlcmVyLmdldE9yU2V0Q3V0b3V0KHBhdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMuRE9NUmVuZGVyZXIucmVtb3ZlQ2xhc3MoY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ1NVQlNDUklCRSc6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5XZWJHTFJlbmRlcmVyLmdldE9yU2V0Q3V0b3V0KHBhdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMuRE9NUmVuZGVyZXIuc3Vic2NyaWJlKGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHTF9TRVRfRFJBV19PUFRJT05TJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5pbml0V2ViR0woKTtcbiAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuc2V0TWVzaE9wdGlvbnMocGF0aCwgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0dMX0FNQklFTlRfTElHSFQnOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLmluaXRXZWJHTCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5zZXRBbWJpZW50TGlnaHRDb2xvcihcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0dMX0xJR0hUX1BPU0lUSU9OJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5pbml0V2ViR0woKTtcbiAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuc2V0TGlnaHRQb3NpdGlvbihcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0dMX0xJR0hUX0NPTE9SJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5pbml0V2ViR0woKTtcbiAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuc2V0TGlnaHRDb2xvcihcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ01BVEVSSUFMX0lOUFVUJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5pbml0V2ViR0woKTtcbiAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuaGFuZGxlTWF0ZXJpYWxJbnB1dChcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0dMX1NFVF9HRU9NRVRSWSc6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuaW5pdFdlYkdMKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnNldEdlb21ldHJ5KFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0xfVU5JRk9STVMnOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLmluaXRXZWJHTCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5zZXRNZXNoVW5pZm9ybShcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0dMX0JVRkZFUl9EQVRBJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5pbml0V2ViR0woKTtcbiAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuYnVmZmVyRGF0YShcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0dMX0NVVE9VVF9TVEFURSc6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuaW5pdFdlYkdMKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnNldEN1dG91dFN0YXRlKHBhdGgsIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHTF9NRVNIX1ZJU0lCSUxJVFknOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLmluaXRXZWJHTCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5zZXRNZXNoVmlzaWJpbGl0eShwYXRoLCBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0xfUkVNT1ZFX01FU0gnOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLmluaXRXZWJHTCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5yZW1vdmVNZXNoKHBhdGgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdQSU5IT0xFX1BST0pFQ1RJT04nOlxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnByb2plY3Rpb25UeXBlID0gQ2FtZXJhLlBJTkhPTEVfUFJPSkVDVElPTjtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMV0gPSAtMSAvIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZURpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnT1JUSE9HUkFQSElDX1BST0pFQ1RJT04nOlxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnByb2plY3Rpb25UeXBlID0gQ2FtZXJhLk9SVEhPR1JBUEhJQ19QUk9KRUNUSU9OO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzExXSA9IDA7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZURpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnQ0hBTkdFX1ZJRVdfVFJBTlNGT1JNJzpcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzBdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzFdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzJdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzNdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bNF0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bNV0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bNl0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bN10gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVs4XSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVs5XSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVsxMF0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bMTFdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bMTJdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzEzXSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVsxNF0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bMTVdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdEaXJ0eSA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ1dJVEgnOiByZXR1cm4gbG9jYWxJdGVyYXRvciAtIDE7XG4gICAgICAgIH1cblxuICAgICAgICBjb21tYW5kID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICB9XG5cbiAgICByZXR1cm4gbG9jYWxJdGVyYXRvcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGV4dDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgVUlNYW5hZ2VyIGlzIGJlaW5nIHVwZGF0ZWQgYnkgYW4gRW5naW5lIGJ5IGNvbnNlY3V0aXZlbHkgY2FsbGluZyBpdHNcbiAqIGB1cGRhdGVgIG1ldGhvZC4gSXQgY2FuIGVpdGhlciBtYW5hZ2UgYSByZWFsIFdlYi1Xb3JrZXIgb3IgdGhlIGdsb2JhbFxuICogRmFtb3VzRW5naW5lIGNvcmUgc2luZ2xldG9uLlxuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgY29tcG9zaXRvciA9IG5ldyBDb21wb3NpdG9yKCk7XG4gKiB2YXIgZW5naW5lID0gbmV3IEVuZ2luZSgpO1xuICpcbiAqIC8vIFVzaW5nIGEgV2ViIFdvcmtlclxuICogdmFyIHdvcmtlciA9IG5ldyBXb3JrZXIoJ3dvcmtlci5idW5kbGUuanMnKTtcbiAqIHZhciB0aHJlYWRtYW5nZXIgPSBuZXcgVUlNYW5hZ2VyKHdvcmtlciwgY29tcG9zaXRvciwgZW5naW5lKTtcbiAqXG4gKiAvLyBXaXRob3V0IHVzaW5nIGEgV2ViIFdvcmtlclxuICogdmFyIHRocmVhZG1hbmdlciA9IG5ldyBVSU1hbmFnZXIoRmFtb3VzLCBjb21wb3NpdG9yLCBlbmdpbmUpO1xuICpcbiAqIEBjbGFzcyAgVUlNYW5hZ2VyXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge0ZhbW91c3xXb3JrZXJ9IHRocmVhZCBUaGUgdGhyZWFkIGJlaW5nIHVzZWQgdG8gcmVjZWl2ZSBtZXNzYWdlc1xuICogZnJvbSBhbmQgcG9zdCBtZXNzYWdlcyB0by4gRXhwZWN0ZWQgdG8gZXhwb3NlIGEgV2ViV29ya2VyLWxpa2UgQVBJLCB3aGljaFxuICogbWVhbnMgcHJvdmlkaW5nIGEgd2F5IHRvIGxpc3RlbiBmb3IgdXBkYXRlcyBieSBzZXR0aW5nIGl0cyBgb25tZXNzYWdlYFxuICogcHJvcGVydHkgYW5kIHNlbmRpbmcgdXBkYXRlcyB1c2luZyBgcG9zdE1lc3NhZ2VgLlxuICogQHBhcmFtIHtDb21wb3NpdG9yfSBjb21wb3NpdG9yIGFuIGluc3RhbmNlIG9mIENvbXBvc2l0b3IgdXNlZCB0byBleHRyYWN0XG4gKiBlbnF1ZXVlZCBkcmF3IGNvbW1hbmRzIGZyb20gdG8gYmUgc2VudCB0byB0aGUgdGhyZWFkLlxuICogQHBhcmFtIHtSZW5kZXJMb29wfSByZW5kZXJMb29wIGFuIGluc3RhbmNlIG9mIEVuZ2luZSB1c2VkIGZvciBleGVjdXRpbmdcbiAqIHRoZSBgRU5HSU5FYCBjb21tYW5kcyBvbi5cbiAqL1xuZnVuY3Rpb24gVUlNYW5hZ2VyICh0aHJlYWQsIGNvbXBvc2l0b3IsIHJlbmRlckxvb3ApIHtcbiAgICB0aGlzLl90aHJlYWQgPSB0aHJlYWQ7XG4gICAgdGhpcy5fY29tcG9zaXRvciA9IGNvbXBvc2l0b3I7XG4gICAgdGhpcy5fcmVuZGVyTG9vcCA9IHJlbmRlckxvb3A7XG5cbiAgICB0aGlzLl9yZW5kZXJMb29wLnVwZGF0ZSh0aGlzKTtcblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy5fdGhyZWFkLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IGV2LmRhdGEgPyBldi5kYXRhIDogZXY7XG4gICAgICAgIGlmIChtZXNzYWdlWzBdID09PSAnRU5HSU5FJykge1xuICAgICAgICAgICAgc3dpdGNoIChtZXNzYWdlWzFdKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnU1RBUlQnOlxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5fcmVuZGVyTG9vcC5zdGFydCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdTVE9QJzpcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuX3JlbmRlckxvb3Auc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgJ1Vua25vd24gRU5HSU5FIGNvbW1hbmQgXCInICsgbWVzc2FnZVsxXSArICdcIidcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBfdGhpcy5fY29tcG9zaXRvci5yZWNlaXZlQ29tbWFuZHMobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuX3RocmVhZC5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH07XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdGhyZWFkIGJlaW5nIHVzZWQgYnkgdGhlIFVJTWFuYWdlci5cbiAqIFRoaXMgY291bGQgZWl0aGVyIGJlIGFuIGFuIGFjdHVhbCB3ZWIgd29ya2VyIG9yIGEgYEZhbW91c0VuZ2luZWAgc2luZ2xldG9uLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtXb3JrZXJ8RmFtb3VzRW5naW5lfSBFaXRoZXIgYSB3ZWIgd29ya2VyIG9yIGEgYEZhbW91c0VuZ2luZWAgc2luZ2xldG9uLlxuICovXG5VSU1hbmFnZXIucHJvdG90eXBlLmdldFRocmVhZCA9IGZ1bmN0aW9uIGdldFRocmVhZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdGhyZWFkO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjb21wb3NpdG9yIGJlaW5nIHVzZWQgYnkgdGhpcyBVSU1hbmFnZXIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0NvbXBvc2l0b3J9IFRoZSBjb21wb3NpdG9yIHVzZWQgYnkgdGhlIFVJTWFuYWdlci5cbiAqL1xuVUlNYW5hZ2VyLnByb3RvdHlwZS5nZXRDb21wb3NpdG9yID0gZnVuY3Rpb24gZ2V0Q29tcG9zaXRvcigpIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcG9zaXRvcjtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZW5naW5lIGJlaW5nIHVzZWQgYnkgdGhpcyBVSU1hbmFnZXIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0VuZ2luZX0gVGhlIGVuZ2luZSB1c2VkIGJ5IHRoZSBVSU1hbmFnZXIuXG4gKi9cblVJTWFuYWdlci5wcm90b3R5cGUuZ2V0RW5naW5lID0gZnVuY3Rpb24gZ2V0RW5naW5lKCkge1xuICAgIHJldHVybiB0aGlzLl9yZW5kZXJMb29wO1xufTtcblxuLyoqXG4gKiBVcGRhdGUgbWV0aG9kIGJlaW5nIGludm9rZWQgYnkgdGhlIEVuZ2luZSBvbiBldmVyeSBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYC5cbiAqIFVzZWQgZm9yIHVwZGF0aW5nIHRoZSBub3Rpb24gb2YgdGltZSB3aXRoaW4gdGhlIG1hbmFnZWQgdGhyZWFkIGJ5IHNlbmRpbmdcbiAqIGEgRlJBTUUgY29tbWFuZCBhbmQgc2VuZGluZyBtZXNzYWdlcyB0b1xuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHRpbWUgdW5peCB0aW1lc3RhbXAgdG8gYmUgcGFzc2VkIGRvd24gdG8gdGhlIHdvcmtlciBhcyBhXG4gKiBGUkFNRSBjb21tYW5kXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5VSU1hbmFnZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSAodGltZSkge1xuICAgIHRoaXMuX3RocmVhZC5wb3N0TWVzc2FnZShbJ0ZSQU1FJywgdGltZV0pO1xuICAgIHZhciB0aHJlYWRNZXNzYWdlcyA9IHRoaXMuX2NvbXBvc2l0b3IuZHJhd0NvbW1hbmRzKCk7XG4gICAgdGhpcy5fdGhyZWFkLnBvc3RNZXNzYWdlKHRocmVhZE1lc3NhZ2VzKTtcbiAgICB0aGlzLl9jb21wb3NpdG9yLmNsZWFyQ29tbWFuZHMoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVUlNYW5hZ2VyO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3NzID0gJy5mYW1vdXMtZG9tLXJlbmRlcmVyIHsnICtcbiAgICAnd2lkdGg6MTAwJTsnICtcbiAgICAnaGVpZ2h0OjEwMCU7JyArXG4gICAgJ3RyYW5zZm9ybS1zdHlsZTpwcmVzZXJ2ZS0zZDsnICtcbiAgICAnLXdlYmtpdC10cmFuc2Zvcm0tc3R5bGU6cHJlc2VydmUtM2Q7JyArXG4nfScgK1xuXG4nLmZhbW91cy1kb20tZWxlbWVudCB7JyArXG4gICAgJy13ZWJraXQtdHJhbnNmb3JtLW9yaWdpbjowJSAwJTsnICtcbiAgICAndHJhbnNmb3JtLW9yaWdpbjowJSAwJTsnICtcbiAgICAnLXdlYmtpdC1iYWNrZmFjZS12aXNpYmlsaXR5OnZpc2libGU7JyArXG4gICAgJ2JhY2tmYWNlLXZpc2liaWxpdHk6dmlzaWJsZTsnICtcbiAgICAnLXdlYmtpdC10cmFuc2Zvcm0tc3R5bGU6cHJlc2VydmUtM2Q7JyArXG4gICAgJ3RyYW5zZm9ybS1zdHlsZTpwcmVzZXJ2ZS0zZDsnICtcbiAgICAnLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yOnRyYW5zcGFyZW50OycgK1xuICAgICdwb2ludGVyLWV2ZW50czphdXRvOycgK1xuICAgICd6LWluZGV4OjE7JyArXG4nfScgK1xuXG4nLmZhbW91cy1kb20tZWxlbWVudC1jb250ZW50LCcgK1xuJy5mYW1vdXMtZG9tLWVsZW1lbnQgeycgK1xuICAgICdwb3NpdGlvbjphYnNvbHV0ZTsnICtcbiAgICAnYm94LXNpemluZzpib3JkZXItYm94OycgK1xuICAgICctbW96LWJveC1zaXppbmc6Ym9yZGVyLWJveDsnICtcbiAgICAnLXdlYmtpdC1ib3gtc2l6aW5nOmJvcmRlci1ib3g7JyArXG4nfScgK1xuXG4nLmZhbW91cy13ZWJnbC1yZW5kZXJlciB7JyArXG4gICAgJy13ZWJraXQtdHJhbnNmb3JtOnRyYW5zbGF0ZVooMTAwMDAwMHB4KTsnICsgIC8qIFRPRE86IEZpeCB3aGVuIFNhZmFyaSBGaXhlcyovXG4gICAgJ3RyYW5zZm9ybTp0cmFuc2xhdGVaKDEwMDAwMDBweCk7JyArXG4gICAgJ3BvaW50ZXItZXZlbnRzOm5vbmU7JyArXG4gICAgJ3Bvc2l0aW9uOmFic29sdXRlOycgK1xuICAgICd6LWluZGV4OjE7JyArXG4gICAgJ3RvcDowOycgK1xuICAgICd3aWR0aDoxMDAlOycgK1xuICAgICdoZWlnaHQ6MTAwJTsnICtcbid9JztcblxudmFyIElOSkVDVEVEID0gdHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJztcblxuZnVuY3Rpb24gaW5qZWN0Q1NTKCkge1xuICAgIGlmIChJTkpFQ1RFRCkgcmV0dXJuO1xuICAgIElOSkVDVEVEID0gdHJ1ZTtcbiAgICBpZiAoZG9jdW1lbnQuY3JlYXRlU3R5bGVTaGVldCkge1xuICAgICAgICB2YXIgc2hlZXQgPSBkb2N1bWVudC5jcmVhdGVTdHlsZVNoZWV0KCk7XG4gICAgICAgIHNoZWV0LmNzc1RleHQgPSBjc3M7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5cbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzcztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHN0eWxlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICAgICAgICB9XG5cbiAgICAgICAgKGhlYWQgPyBoZWFkIDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGluamVjdENTUztcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBBIGxpZ2h0d2VpZ2h0LCBmZWF0dXJlbGVzcyBFdmVudEVtaXR0ZXIuXG4gKlxuICogQGNsYXNzIENhbGxiYWNrU3RvcmVcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBDYWxsYmFja1N0b3JlICgpIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbn1cblxuLyoqXG4gKiBBZGRzIGEgbGlzdGVuZXIgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQgKD0ga2V5KS5cbiAqXG4gKiBAbWV0aG9kIG9uXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSAgIGtleSAgICAgICBUaGUgZXZlbnQgdHlwZSAoZS5nLiBgY2xpY2tgKS5cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayAgQSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBpbnZva2VkIHdoZW5ldmVyIGBrZXlgXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50IGlzIGJlaW5nIHRyaWdnZXJlZC5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBkZXN0cm95ICAgQSBmdW5jdGlvbiB0byBjYWxsIGlmIHlvdSB3YW50IHRvIHJlbW92ZSB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suXG4gKi9cbkNhbGxiYWNrU3RvcmUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24gKGtleSwgY2FsbGJhY2spIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1trZXldKSB0aGlzLl9ldmVudHNba2V5XSA9IFtdO1xuICAgIHZhciBjYWxsYmFja0xpc3QgPSB0aGlzLl9ldmVudHNba2V5XTtcbiAgICBjYWxsYmFja0xpc3QucHVzaChjYWxsYmFjayk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2FsbGJhY2tMaXN0LnNwbGljZShjYWxsYmFja0xpc3QuaW5kZXhPZihjYWxsYmFjayksIDEpO1xuICAgIH07XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgYSBwcmV2aW91c2x5IGFkZGVkIGV2ZW50IGxpc3RlbmVyLlxuICpcbiAqIEBtZXRob2Qgb2ZmXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBrZXkgICAgICAgICBUaGUgZXZlbnQgdHlwZSBmcm9tIHdoaWNoIHRoZSBjYWxsYmFjayBmdW5jdGlvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG91bGQgYmUgcmVtb3ZlZC5cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayAgVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIHJlbW92ZWQgZnJvbSB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzIGZvciBrZXkuXG4gKiBAcmV0dXJuIHtDYWxsYmFja1N0b3JlfSB0aGlzXG4gKi9cbkNhbGxiYWNrU3RvcmUucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uIG9mZiAoa2V5LCBjYWxsYmFjaykge1xuICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNba2V5XTtcbiAgICBpZiAoZXZlbnRzKSBldmVudHMuc3BsaWNlKGV2ZW50cy5pbmRleE9mKGNhbGxiYWNrKSwgMSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYWxsIHRoZSBwcmV2aW91c2x5IGZvciB0aGlzIGtleSByZWdpc3RlcmVkIGNhbGxiYWNrcy5cbiAqXG4gKiBAbWV0aG9kIHRyaWdnZXJcbiAqIEBjaGFpbmFibGVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAgICBrZXkgICAgICBUaGUgZXZlbnQgdHlwZS5cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgIHBheWxvYWQgIFRoZSBldmVudCBwYXlsb2FkIChldmVudCBvYmplY3QpLlxuICogQHJldHVybiB7Q2FsbGJhY2tTdG9yZX0gdGhpc1xuICovXG5DYWxsYmFja1N0b3JlLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gdHJpZ2dlciAoa2V5LCBwYXlsb2FkKSB7XG4gICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1trZXldO1xuICAgIGlmIChldmVudHMpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGVuID0gZXZlbnRzLmxlbmd0aDtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIGV2ZW50c1tpXShwYXlsb2FkKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbGxiYWNrU3RvcmU7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRGVlcCBjbG9uZSBhbiBvYmplY3QuXG4gKlxuICogQG1ldGhvZCAgY2xvbmVcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYiAgICAgICBPYmplY3QgdG8gYmUgY2xvbmVkLlxuICogQHJldHVybiB7T2JqZWN0fSBhICAgICAgQ2xvbmVkIG9iamVjdCAoZGVlcCBlcXVhbGl0eSkuXG4gKi9cbnZhciBjbG9uZSA9IGZ1bmN0aW9uIGNsb25lKGIpIHtcbiAgICB2YXIgYTtcbiAgICBpZiAodHlwZW9mIGIgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGEgPSAoYiBpbnN0YW5jZW9mIEFycmF5KSA/IFtdIDoge307XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBiKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGJba2V5XSA9PT0gJ29iamVjdCcgJiYgYltrZXldICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGJba2V5XSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGFba2V5XSA9IG5ldyBBcnJheShiW2tleV0ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBiW2tleV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFba2V5XVtpXSA9IGNsb25lKGJba2V5XVtpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICBhW2tleV0gPSBjbG9uZShiW2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFba2V5XSA9IGJba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYSA9IGI7XG4gICAgfVxuICAgIHJldHVybiBhO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbG9uZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBUYWtlcyBhbiBvYmplY3QgY29udGFpbmluZyBrZXlzIGFuZCB2YWx1ZXMgYW5kIHJldHVybnMgYW4gb2JqZWN0XG4gKiBjb21wcmlzaW5nIHR3byBcImFzc29jaWF0ZVwiIGFycmF5cywgb25lIHdpdGggdGhlIGtleXMgYW5kIHRoZSBvdGhlclxuICogd2l0aCB0aGUgdmFsdWVzLlxuICpcbiAqIEBtZXRob2Qga2V5VmFsdWVzVG9BcnJheXNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqICAgICAgICAgICAgICAgICAgICAgIE9iamVjdHMgd2hlcmUgdG8gZXh0cmFjdCBrZXlzIGFuZCB2YWx1ZXNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbS5cbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICByZXN1bHRcbiAqICAgICAgICAge0FycmF5LjxTdHJpbmc+fSByZXN1bHQua2V5cyAgICAgS2V5cyBvZiBgcmVzdWx0YCwgYXMgcmV0dXJuZWQgYnlcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYE9iamVjdC5rZXlzKClgXG4gKiAgICAgICAgIHtBcnJheX0gICAgICAgICAgcmVzdWx0LnZhbHVlcyAgIFZhbHVlcyBvZiBwYXNzZWQgaW4gb2JqZWN0LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGtleVZhbHVlc1RvQXJyYXlzKG9iaikge1xuICAgIHZhciBrZXlzQXJyYXkgPSBbXSwgdmFsdWVzQXJyYXkgPSBbXTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAga2V5c0FycmF5W2ldID0ga2V5O1xuICAgICAgICAgICAgdmFsdWVzQXJyYXlbaV0gPSBvYmpba2V5XTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBrZXlzOiBrZXlzQXJyYXksXG4gICAgICAgIHZhbHVlczogdmFsdWVzQXJyYXlcbiAgICB9O1xufTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFBSRUZJWEVTID0gWycnLCAnLW1zLScsICctd2Via2l0LScsICctbW96LScsICctby0nXTtcblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB1c2VkIGZvciBkZXRlcm1pbmluZyB0aGUgdmVuZG9yIHByZWZpeGVkIHZlcnNpb24gb2YgdGhlXG4gKiBwYXNzZWQgaW4gQ1NTIHByb3BlcnR5LlxuICpcbiAqIFZlbmRvciBjaGVja3MgYXJlIGJlaW5nIGNvbmR1Y3RlZCBpbiB0aGUgZm9sbG93aW5nIG9yZGVyOlxuICpcbiAqIDEuIChubyBwcmVmaXgpXG4gKiAyLiBgLW16LWBcbiAqIDMuIGAtd2Via2l0LWBcbiAqIDQuIGAtbW96LWBcbiAqIDUuIGAtby1gXG4gKlxuICogQG1ldGhvZCB2ZW5kb3JQcmVmaXhcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHkgICAgIENTUyBwcm9wZXJ0eSAobm8gY2FtZWxDYXNlKSwgZS5nLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgYm9yZGVyLXJhZGl1c2AuXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHByZWZpeGVkICAgIFZlbmRvciBwcmVmaXhlZCB2ZXJzaW9uIG9mIHBhc3NlZCBpbiBDU1NcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgKGUuZy4gYC13ZWJraXQtYm9yZGVyLXJhZGl1c2ApLlxuICovXG5mdW5jdGlvbiB2ZW5kb3JQcmVmaXgocHJvcGVydHkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IFBSRUZJWEVTLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwcmVmaXhlZCA9IFBSRUZJWEVTW2ldICsgcHJvcGVydHk7XG4gICAgICAgIGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGVbcHJlZml4ZWRdID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIHByZWZpeGVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcm9wZXJ0eTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB2ZW5kb3JQcmVmaXg7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBHZW9tZXRyeUlkcyA9IDA7XG5cbi8qKlxuICogR2VvbWV0cnkgaXMgYSBjb21wb25lbnQgdGhhdCBkZWZpbmVzIGFuZCBtYW5hZ2VzIGRhdGFcbiAqICh2ZXJ0ZXggZGF0YSBhbmQgYXR0cmlidXRlcykgdGhhdCBpcyB1c2VkIHRvIGRyYXcgdG8gV2ViR0wuXG4gKlxuICogQGNsYXNzIEdlb21ldHJ5XG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBpbnN0YW50aWF0aW9uIG9wdGlvbnNcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIEdlb21ldHJ5KG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMuREVGQVVMVF9CVUZGRVJfU0laRSA9IDM7XG5cbiAgICB0aGlzLnNwZWMgPSB7XG4gICAgICAgIGlkOiBHZW9tZXRyeUlkcysrLFxuICAgICAgICBkeW5hbWljOiBmYWxzZSxcbiAgICAgICAgdHlwZTogdGhpcy5vcHRpb25zLnR5cGUgfHwgJ1RSSUFOR0xFUycsXG4gICAgICAgIGJ1ZmZlck5hbWVzOiBbXSxcbiAgICAgICAgYnVmZmVyVmFsdWVzOiBbXSxcbiAgICAgICAgYnVmZmVyU3BhY2luZ3M6IFtdLFxuICAgICAgICBpbnZhbGlkYXRpb25zOiBbXVxuICAgIH07XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmJ1ZmZlcnMpIHtcbiAgICAgICAgdmFyIGxlbiA9IHRoaXMub3B0aW9ucy5idWZmZXJzLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47KSB7XG4gICAgICAgICAgICB0aGlzLnNwZWMuYnVmZmVyTmFtZXMucHVzaCh0aGlzLm9wdGlvbnMuYnVmZmVyc1tpXS5uYW1lKTtcbiAgICAgICAgICAgIHRoaXMuc3BlYy5idWZmZXJWYWx1ZXMucHVzaCh0aGlzLm9wdGlvbnMuYnVmZmVyc1tpXS5kYXRhKTtcbiAgICAgICAgICAgIHRoaXMuc3BlYy5idWZmZXJTcGFjaW5ncy5wdXNoKHRoaXMub3B0aW9ucy5idWZmZXJzW2ldLnNpemUgfHwgdGhpcy5ERUZBVUxUX0JVRkZFUl9TSVpFKTtcbiAgICAgICAgICAgIHRoaXMuc3BlYy5pbnZhbGlkYXRpb25zLnB1c2goaSsrKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHZW9tZXRyeTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFZlYzMgPSByZXF1aXJlKCcuLi9tYXRoL1ZlYzMnKTtcbnZhciBWZWMyID0gcmVxdWlyZSgnLi4vbWF0aC9WZWMyJyk7XG5cbnZhciBvdXRwdXRzID0gW1xuICAgIG5ldyBWZWMzKCksXG4gICAgbmV3IFZlYzMoKSxcbiAgICBuZXcgVmVjMygpLFxuICAgIG5ldyBWZWMyKCksXG4gICAgbmV3IFZlYzIoKVxuXTtcblxuLyoqXG4gKiBBIGhlbHBlciBvYmplY3QgdXNlZCB0byBjYWxjdWxhdGUgYnVmZmVycyBmb3IgY29tcGxpY2F0ZWQgZ2VvbWV0cmllcy5cbiAqIFRhaWxvcmVkIGZvciB0aGUgV2ViR0xSZW5kZXJlciwgdXNlZCBieSBtb3N0IHByaW1pdGl2ZXMuXG4gKlxuICogQHN0YXRpY1xuICogQGNsYXNzIEdlb21ldHJ5SGVscGVyXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG52YXIgR2VvbWV0cnlIZWxwZXIgPSB7fTtcblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgaXRlcmF0ZXMgdGhyb3VnaCB2ZXJ0aWNhbCBhbmQgaG9yaXpvbnRhbCBzbGljZXNcbiAqIGJhc2VkIG9uIGlucHV0IGRldGFpbCwgYW5kIGdlbmVyYXRlcyB2ZXJ0aWNlcyBhbmQgaW5kaWNlcyBmb3IgZWFjaFxuICogc3ViZGl2aXNpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSAge051bWJlcn0gZGV0YWlsWCBBbW91bnQgb2Ygc2xpY2VzIHRvIGl0ZXJhdGUgdGhyb3VnaC5cbiAqIEBwYXJhbSAge051bWJlcn0gZGV0YWlsWSBBbW91bnQgb2Ygc3RhY2tzIHRvIGl0ZXJhdGUgdGhyb3VnaC5cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmdW5jIEZ1bmN0aW9uIHVzZWQgdG8gZ2VuZXJhdGUgdmVydGV4IHBvc2l0aW9ucyBhdCBlYWNoIHBvaW50LlxuICogQHBhcmFtICB7Qm9vbGVhbn0gd3JhcCBPcHRpb25hbCBwYXJhbWV0ZXIgKGRlZmF1bHQ6IFBpKSBmb3Igc2V0dGluZyBhIGN1c3RvbSB3cmFwIHJhbmdlXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBPYmplY3QgY29udGFpbmluZyBnZW5lcmF0ZWQgdmVydGljZXMgYW5kIGluZGljZXMuXG4gKi9cbkdlb21ldHJ5SGVscGVyLmdlbmVyYXRlUGFyYW1ldHJpYyA9IGZ1bmN0aW9uIGdlbmVyYXRlUGFyYW1ldHJpYyhkZXRhaWxYLCBkZXRhaWxZLCBmdW5jLCB3cmFwKSB7XG4gICAgdmFyIHZlcnRpY2VzID0gW107XG4gICAgdmFyIGk7XG4gICAgdmFyIHRoZXRhO1xuICAgIHZhciBwaGk7XG4gICAgdmFyIGo7XG5cbiAgICAvLyBXZSBjYW4gd3JhcCBhcm91bmQgc2xpZ2h0bHkgbW9yZSB0aGFuIG9uY2UgZm9yIHV2IGNvb3JkaW5hdGVzIHRvIGxvb2sgY29ycmVjdC5cblxuICAgIHZhciBYcmFuZ2UgPSB3cmFwID8gTWF0aC5QSSArIChNYXRoLlBJIC8gKGRldGFpbFggLSAxKSkgOiBNYXRoLlBJO1xuICAgIHZhciBvdXQgPSBbXTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBkZXRhaWxYICsgMTsgaSsrKSB7XG4gICAgICAgIHRoZXRhID0gaSAqIFhyYW5nZSAvIGRldGFpbFg7XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBkZXRhaWxZOyBqKyspIHtcbiAgICAgICAgICAgIHBoaSA9IGogKiAyLjAgKiBYcmFuZ2UgLyBkZXRhaWxZO1xuICAgICAgICAgICAgZnVuYyh0aGV0YSwgcGhpLCBvdXQpO1xuICAgICAgICAgICAgdmVydGljZXMucHVzaChvdXRbMF0sIG91dFsxXSwgb3V0WzJdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBpbmRpY2VzID0gW10sXG4gICAgICAgIHYgPSAwLFxuICAgICAgICBuZXh0O1xuICAgIGZvciAoaSA9IDA7IGkgPCBkZXRhaWxYOyBpKyspIHtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGRldGFpbFk7IGorKykge1xuICAgICAgICAgICAgbmV4dCA9IChqICsgMSkgJSBkZXRhaWxZO1xuICAgICAgICAgICAgaW5kaWNlcy5wdXNoKHYgKyBqLCB2ICsgaiArIGRldGFpbFksIHYgKyBuZXh0KTtcbiAgICAgICAgICAgIGluZGljZXMucHVzaCh2ICsgbmV4dCwgdiArIGogKyBkZXRhaWxZLCB2ICsgbmV4dCArIGRldGFpbFkpO1xuICAgICAgICB9XG4gICAgICAgIHYgKz0gZGV0YWlsWTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJ0aWNlczogdmVydGljZXMsXG4gICAgICAgIGluZGljZXM6IGluZGljZXNcbiAgICB9O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIG5vcm1hbHMgYmVsb25naW5nIHRvIGVhY2ggZmFjZSBvZiBhIGdlb21ldHJ5LlxuICogQXNzdW1lcyBjbG9ja3dpc2UgZGVjbGFyYXRpb24gb2YgdmVydGljZXMuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZlcnRpY2VzIFZlcnRpY2VzIG9mIGFsbCBwb2ludHMgb24gdGhlIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gaW5kaWNlcyBJbmRpY2VzIGRlY2xhcmluZyBmYWNlcyBvZiBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IG91dCBBcnJheSB0byBiZSBmaWxsZWQgYW5kIHJldHVybmVkLlxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBDYWxjdWxhdGVkIGZhY2Ugbm9ybWFscy5cbiAqL1xuR2VvbWV0cnlIZWxwZXIuY29tcHV0ZU5vcm1hbHMgPSBmdW5jdGlvbiBjb21wdXRlTm9ybWFscyh2ZXJ0aWNlcywgaW5kaWNlcywgb3V0KSB7XG4gICAgdmFyIG5vcm1hbHMgPSBvdXQgfHwgW107XG4gICAgdmFyIGluZGV4T25lO1xuICAgIHZhciBpbmRleFR3bztcbiAgICB2YXIgaW5kZXhUaHJlZTtcbiAgICB2YXIgbm9ybWFsO1xuICAgIHZhciBqO1xuICAgIHZhciBsZW4gPSBpbmRpY2VzLmxlbmd0aCAvIDM7XG4gICAgdmFyIGk7XG4gICAgdmFyIHg7XG4gICAgdmFyIHk7XG4gICAgdmFyIHo7XG4gICAgdmFyIGxlbmd0aDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpbmRleFR3byA9IGluZGljZXNbaSozICsgMF0gKiAzO1xuICAgICAgICBpbmRleE9uZSA9IGluZGljZXNbaSozICsgMV0gKiAzO1xuICAgICAgICBpbmRleFRocmVlID0gaW5kaWNlc1tpKjMgKyAyXSAqIDM7XG5cbiAgICAgICAgb3V0cHV0c1swXS5zZXQodmVydGljZXNbaW5kZXhPbmVdLCB2ZXJ0aWNlc1tpbmRleE9uZSArIDFdLCB2ZXJ0aWNlc1tpbmRleE9uZSArIDJdKTtcbiAgICAgICAgb3V0cHV0c1sxXS5zZXQodmVydGljZXNbaW5kZXhUd29dLCB2ZXJ0aWNlc1tpbmRleFR3byArIDFdLCB2ZXJ0aWNlc1tpbmRleFR3byArIDJdKTtcbiAgICAgICAgb3V0cHV0c1syXS5zZXQodmVydGljZXNbaW5kZXhUaHJlZV0sIHZlcnRpY2VzW2luZGV4VGhyZWUgKyAxXSwgdmVydGljZXNbaW5kZXhUaHJlZSArIDJdKTtcblxuICAgICAgICBub3JtYWwgPSBvdXRwdXRzWzJdLnN1YnRyYWN0KG91dHB1dHNbMF0pLmNyb3NzKG91dHB1dHNbMV0uc3VidHJhY3Qob3V0cHV0c1swXSkpLm5vcm1hbGl6ZSgpO1xuXG4gICAgICAgIG5vcm1hbHNbaW5kZXhPbmUgKyAwXSA9IChub3JtYWxzW2luZGV4T25lICsgMF0gfHwgMCkgKyBub3JtYWwueDtcbiAgICAgICAgbm9ybWFsc1tpbmRleE9uZSArIDFdID0gKG5vcm1hbHNbaW5kZXhPbmUgKyAxXSB8fCAwKSArIG5vcm1hbC55O1xuICAgICAgICBub3JtYWxzW2luZGV4T25lICsgMl0gPSAobm9ybWFsc1tpbmRleE9uZSArIDJdIHx8IDApICsgbm9ybWFsLno7XG5cbiAgICAgICAgbm9ybWFsc1tpbmRleFR3byArIDBdID0gKG5vcm1hbHNbaW5kZXhUd28gKyAwXSB8fCAwKSArIG5vcm1hbC54O1xuICAgICAgICBub3JtYWxzW2luZGV4VHdvICsgMV0gPSAobm9ybWFsc1tpbmRleFR3byArIDFdIHx8IDApICsgbm9ybWFsLnk7XG4gICAgICAgIG5vcm1hbHNbaW5kZXhUd28gKyAyXSA9IChub3JtYWxzW2luZGV4VHdvICsgMl0gfHwgMCkgKyBub3JtYWwuejtcblxuICAgICAgICBub3JtYWxzW2luZGV4VGhyZWUgKyAwXSA9IChub3JtYWxzW2luZGV4VGhyZWUgKyAwXSB8fCAwKSArIG5vcm1hbC54O1xuICAgICAgICBub3JtYWxzW2luZGV4VGhyZWUgKyAxXSA9IChub3JtYWxzW2luZGV4VGhyZWUgKyAxXSB8fCAwKSArIG5vcm1hbC55O1xuICAgICAgICBub3JtYWxzW2luZGV4VGhyZWUgKyAyXSA9IChub3JtYWxzW2luZGV4VGhyZWUgKyAyXSB8fCAwKSArIG5vcm1hbC56O1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBub3JtYWxzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIHggPSBub3JtYWxzW2ldO1xuICAgICAgICB5ID0gbm9ybWFsc1tpKzFdO1xuICAgICAgICB6ID0gbm9ybWFsc1tpKzJdO1xuICAgICAgICBsZW5ndGggPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KTtcbiAgICAgICAgZm9yKGogPSAwOyBqPCAzOyBqKyspIHtcbiAgICAgICAgICAgIG5vcm1hbHNbaStqXSAvPSBsZW5ndGg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbm9ybWFscztcbn07XG5cbi8qKlxuICogRGl2aWRlcyBhbGwgaW5zZXJ0ZWQgdHJpYW5nbGVzIGludG8gZm91ciBzdWItdHJpYW5nbGVzLiBBbHRlcnMgdGhlXG4gKiBwYXNzZWQgaW4gYXJyYXlzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBpbmRpY2VzIEluZGljZXMgZGVjbGFyaW5nIGZhY2VzIG9mIGdlb21ldHJ5XG4gKiBAcGFyYW0ge0FycmF5fSB2ZXJ0aWNlcyBWZXJ0aWNlcyBvZiBhbGwgcG9pbnRzIG9uIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gdGV4dHVyZUNvb3JkcyBUZXh0dXJlIGNvb3JkaW5hdGVzIG9mIGFsbCBwb2ludHMgb24gdGhlIGdlb21ldHJ5XG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5HZW9tZXRyeUhlbHBlci5zdWJkaXZpZGUgPSBmdW5jdGlvbiBzdWJkaXZpZGUoaW5kaWNlcywgdmVydGljZXMsIHRleHR1cmVDb29yZHMpIHtcbiAgICB2YXIgdHJpYW5nbGVJbmRleCA9IGluZGljZXMubGVuZ3RoIC8gMztcbiAgICB2YXIgZmFjZTtcbiAgICB2YXIgaTtcbiAgICB2YXIgajtcbiAgICB2YXIgaztcbiAgICB2YXIgcG9zO1xuICAgIHZhciB0ZXg7XG5cbiAgICB3aGlsZSAodHJpYW5nbGVJbmRleC0tKSB7XG4gICAgICAgIGZhY2UgPSBpbmRpY2VzLnNsaWNlKHRyaWFuZ2xlSW5kZXggKiAzLCB0cmlhbmdsZUluZGV4ICogMyArIDMpO1xuXG4gICAgICAgIHBvcyA9IGZhY2UubWFwKGZ1bmN0aW9uKHZlcnRJbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBWZWMzKHZlcnRpY2VzW3ZlcnRJbmRleCAqIDNdLCB2ZXJ0aWNlc1t2ZXJ0SW5kZXggKiAzICsgMV0sIHZlcnRpY2VzW3ZlcnRJbmRleCAqIDMgKyAyXSk7XG4gICAgICAgIH0pO1xuICAgICAgICB2ZXJ0aWNlcy5wdXNoLmFwcGx5KHZlcnRpY2VzLCBWZWMzLnNjYWxlKFZlYzMuYWRkKHBvc1swXSwgcG9zWzFdLCBvdXRwdXRzWzBdKSwgMC41LCBvdXRwdXRzWzFdKS50b0FycmF5KCkpO1xuICAgICAgICB2ZXJ0aWNlcy5wdXNoLmFwcGx5KHZlcnRpY2VzLCBWZWMzLnNjYWxlKFZlYzMuYWRkKHBvc1sxXSwgcG9zWzJdLCBvdXRwdXRzWzBdKSwgMC41LCBvdXRwdXRzWzFdKS50b0FycmF5KCkpO1xuICAgICAgICB2ZXJ0aWNlcy5wdXNoLmFwcGx5KHZlcnRpY2VzLCBWZWMzLnNjYWxlKFZlYzMuYWRkKHBvc1swXSwgcG9zWzJdLCBvdXRwdXRzWzBdKSwgMC41LCBvdXRwdXRzWzFdKS50b0FycmF5KCkpO1xuXG4gICAgICAgIGlmICh0ZXh0dXJlQ29vcmRzKSB7XG4gICAgICAgICAgICB0ZXggPSBmYWNlLm1hcChmdW5jdGlvbih2ZXJ0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFZlYzIodGV4dHVyZUNvb3Jkc1t2ZXJ0SW5kZXggKiAyXSwgdGV4dHVyZUNvb3Jkc1t2ZXJ0SW5kZXggKiAyICsgMV0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0ZXh0dXJlQ29vcmRzLnB1c2guYXBwbHkodGV4dHVyZUNvb3JkcywgVmVjMi5zY2FsZShWZWMyLmFkZCh0ZXhbMF0sIHRleFsxXSwgb3V0cHV0c1szXSksIDAuNSwgb3V0cHV0c1s0XSkudG9BcnJheSgpKTtcbiAgICAgICAgICAgIHRleHR1cmVDb29yZHMucHVzaC5hcHBseSh0ZXh0dXJlQ29vcmRzLCBWZWMyLnNjYWxlKFZlYzIuYWRkKHRleFsxXSwgdGV4WzJdLCBvdXRwdXRzWzNdKSwgMC41LCBvdXRwdXRzWzRdKS50b0FycmF5KCkpO1xuICAgICAgICAgICAgdGV4dHVyZUNvb3Jkcy5wdXNoLmFwcGx5KHRleHR1cmVDb29yZHMsIFZlYzIuc2NhbGUoVmVjMi5hZGQodGV4WzBdLCB0ZXhbMl0sIG91dHB1dHNbM10pLCAwLjUsIG91dHB1dHNbNF0pLnRvQXJyYXkoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpID0gdmVydGljZXMubGVuZ3RoIC0gMztcbiAgICAgICAgaiA9IGkgKyAxO1xuICAgICAgICBrID0gaSArIDI7XG5cbiAgICAgICAgaW5kaWNlcy5wdXNoKGksIGosIGspO1xuICAgICAgICBpbmRpY2VzLnB1c2goZmFjZVswXSwgaSwgayk7XG4gICAgICAgIGluZGljZXMucHVzaChpLCBmYWNlWzFdLCBqKTtcbiAgICAgICAgaW5kaWNlc1t0cmlhbmdsZUluZGV4XSA9IGs7XG4gICAgICAgIGluZGljZXNbdHJpYW5nbGVJbmRleCArIDFdID0gajtcbiAgICAgICAgaW5kaWNlc1t0cmlhbmdsZUluZGV4ICsgMl0gPSBmYWNlWzJdO1xuICAgIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBkdXBsaWNhdGUgb2YgdmVydGljZXMgdGhhdCBhcmUgc2hhcmVkIGJldHdlZW4gZmFjZXMuXG4gKiBBbHRlcnMgdGhlIGlucHV0IHZlcnRleCBhbmQgaW5kZXggYXJyYXlzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2ZXJ0aWNlcyBWZXJ0aWNlcyBvZiBhbGwgcG9pbnRzIG9uIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gaW5kaWNlcyBJbmRpY2VzIGRlY2xhcmluZyBmYWNlcyBvZiBnZW9tZXRyeVxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuR2VvbWV0cnlIZWxwZXIuZ2V0VW5pcXVlRmFjZXMgPSBmdW5jdGlvbiBnZXRVbmlxdWVGYWNlcyh2ZXJ0aWNlcywgaW5kaWNlcykge1xuICAgIHZhciB0cmlhbmdsZUluZGV4ID0gaW5kaWNlcy5sZW5ndGggLyAzLFxuICAgICAgICByZWdpc3RlcmVkID0gW10sXG4gICAgICAgIGluZGV4O1xuXG4gICAgd2hpbGUgKHRyaWFuZ2xlSW5kZXgtLSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuXG4gICAgICAgICAgICBpbmRleCA9IGluZGljZXNbdHJpYW5nbGVJbmRleCAqIDMgKyBpXTtcblxuICAgICAgICAgICAgaWYgKHJlZ2lzdGVyZWRbaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgdmVydGljZXMucHVzaCh2ZXJ0aWNlc1tpbmRleCAqIDNdLCB2ZXJ0aWNlc1tpbmRleCAqIDMgKyAxXSwgdmVydGljZXNbaW5kZXggKiAzICsgMl0pO1xuICAgICAgICAgICAgICAgIGluZGljZXNbdHJpYW5nbGVJbmRleCAqIDMgKyBpXSA9IHZlcnRpY2VzLmxlbmd0aCAvIDMgLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVnaXN0ZXJlZFtpbmRleF0gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBEaXZpZGVzIGFsbCBpbnNlcnRlZCB0cmlhbmdsZXMgaW50byBmb3VyIHN1Yi10cmlhbmdsZXMgd2hpbGUgbWFpbnRhaW5pbmdcbiAqIGEgcmFkaXVzIG9mIG9uZS4gQWx0ZXJzIHRoZSBwYXNzZWQgaW4gYXJyYXlzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2ZXJ0aWNlcyBWZXJ0aWNlcyBvZiBhbGwgcG9pbnRzIG9uIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gaW5kaWNlcyBJbmRpY2VzIGRlY2xhcmluZyBmYWNlcyBvZiBnZW9tZXRyeVxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuR2VvbWV0cnlIZWxwZXIuc3ViZGl2aWRlU3BoZXJvaWQgPSBmdW5jdGlvbiBzdWJkaXZpZGVTcGhlcm9pZCh2ZXJ0aWNlcywgaW5kaWNlcykge1xuICAgIHZhciB0cmlhbmdsZUluZGV4ID0gaW5kaWNlcy5sZW5ndGggLyAzLFxuICAgICAgICBhYmMsXG4gICAgICAgIGZhY2UsXG4gICAgICAgIGksIGosIGs7XG5cbiAgICB3aGlsZSAodHJpYW5nbGVJbmRleC0tKSB7XG4gICAgICAgIGZhY2UgPSBpbmRpY2VzLnNsaWNlKHRyaWFuZ2xlSW5kZXggKiAzLCB0cmlhbmdsZUluZGV4ICogMyArIDMpO1xuICAgICAgICBhYmMgPSBmYWNlLm1hcChmdW5jdGlvbih2ZXJ0SW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVmVjMyh2ZXJ0aWNlc1t2ZXJ0SW5kZXggKiAzXSwgdmVydGljZXNbdmVydEluZGV4ICogMyArIDFdLCB2ZXJ0aWNlc1t2ZXJ0SW5kZXggKiAzICsgMl0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB2ZXJ0aWNlcy5wdXNoLmFwcGx5KHZlcnRpY2VzLCBWZWMzLm5vcm1hbGl6ZShWZWMzLmFkZChhYmNbMF0sIGFiY1sxXSwgb3V0cHV0c1swXSksIG91dHB1dHNbMV0pLnRvQXJyYXkoKSk7XG4gICAgICAgIHZlcnRpY2VzLnB1c2guYXBwbHkodmVydGljZXMsIFZlYzMubm9ybWFsaXplKFZlYzMuYWRkKGFiY1sxXSwgYWJjWzJdLCBvdXRwdXRzWzBdKSwgb3V0cHV0c1sxXSkudG9BcnJheSgpKTtcbiAgICAgICAgdmVydGljZXMucHVzaC5hcHBseSh2ZXJ0aWNlcywgVmVjMy5ub3JtYWxpemUoVmVjMy5hZGQoYWJjWzBdLCBhYmNbMl0sIG91dHB1dHNbMF0pLCBvdXRwdXRzWzFdKS50b0FycmF5KCkpO1xuXG4gICAgICAgIGkgPSB2ZXJ0aWNlcy5sZW5ndGggLyAzIC0gMztcbiAgICAgICAgaiA9IGkgKyAxO1xuICAgICAgICBrID0gaSArIDI7XG5cbiAgICAgICAgaW5kaWNlcy5wdXNoKGksIGosIGspO1xuICAgICAgICBpbmRpY2VzLnB1c2goZmFjZVswXSwgaSwgayk7XG4gICAgICAgIGluZGljZXMucHVzaChpLCBmYWNlWzFdLCBqKTtcbiAgICAgICAgaW5kaWNlc1t0cmlhbmdsZUluZGV4ICogM10gPSBrO1xuICAgICAgICBpbmRpY2VzW3RyaWFuZ2xlSW5kZXggKiAzICsgMV0gPSBqO1xuICAgICAgICBpbmRpY2VzW3RyaWFuZ2xlSW5kZXggKiAzICsgMl0gPSBmYWNlWzJdO1xuICAgIH1cbn07XG5cbi8qKlxuICogRGl2aWRlcyBhbGwgaW5zZXJ0ZWQgdHJpYW5nbGVzIGludG8gZm91ciBzdWItdHJpYW5nbGVzIHdoaWxlIG1haW50YWluaW5nXG4gKiBhIHJhZGl1cyBvZiBvbmUuIEFsdGVycyB0aGUgcGFzc2VkIGluIGFycmF5cy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmVydGljZXMgVmVydGljZXMgb2YgYWxsIHBvaW50cyBvbiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7QXJyYXl9IG91dCBPcHRpb25hbCBhcnJheSB0byBiZSBmaWxsZWQgd2l0aCByZXN1bHRpbmcgbm9ybWFscy5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gTmV3IGxpc3Qgb2YgY2FsY3VsYXRlZCBub3JtYWxzLlxuICovXG5HZW9tZXRyeUhlbHBlci5nZXRTcGhlcm9pZE5vcm1hbHMgPSBmdW5jdGlvbiBnZXRTcGhlcm9pZE5vcm1hbHModmVydGljZXMsIG91dCkge1xuICAgIG91dCA9IG91dCB8fCBbXTtcbiAgICB2YXIgbGVuZ3RoID0gdmVydGljZXMubGVuZ3RoIC8gMztcbiAgICB2YXIgbm9ybWFsaXplZDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbm9ybWFsaXplZCA9IG5ldyBWZWMzKFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDMgKyAwXSxcbiAgICAgICAgICAgIHZlcnRpY2VzW2kgKiAzICsgMV0sXG4gICAgICAgICAgICB2ZXJ0aWNlc1tpICogMyArIDJdXG4gICAgICAgICkubm9ybWFsaXplKCkudG9BcnJheSgpO1xuXG4gICAgICAgIG91dFtpICogMyArIDBdID0gbm9ybWFsaXplZFswXTtcbiAgICAgICAgb3V0W2kgKiAzICsgMV0gPSBub3JtYWxpemVkWzFdO1xuICAgICAgICBvdXRbaSAqIDMgKyAyXSA9IG5vcm1hbGl6ZWRbMl07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0ZXh0dXJlIGNvb3JkaW5hdGVzIGZvciBzcGhlcm9pZCBwcmltaXRpdmVzIGJhc2VkIG9uXG4gKiBpbnB1dCB2ZXJ0aWNlcy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmVydGljZXMgVmVydGljZXMgb2YgYWxsIHBvaW50cyBvbiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7QXJyYXl9IG91dCBPcHRpb25hbCBhcnJheSB0byBiZSBmaWxsZWQgd2l0aCByZXN1bHRpbmcgdGV4dHVyZSBjb29yZGluYXRlcy5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gTmV3IGxpc3Qgb2YgY2FsY3VsYXRlZCB0ZXh0dXJlIGNvb3JkaW5hdGVzXG4gKi9cbkdlb21ldHJ5SGVscGVyLmdldFNwaGVyb2lkVVYgPSBmdW5jdGlvbiBnZXRTcGhlcm9pZFVWKHZlcnRpY2VzLCBvdXQpIHtcbiAgICBvdXQgPSBvdXQgfHwgW107XG4gICAgdmFyIGxlbmd0aCA9IHZlcnRpY2VzLmxlbmd0aCAvIDM7XG4gICAgdmFyIHZlcnRleDtcblxuICAgIHZhciB1diA9IFtdO1xuXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZlcnRleCA9IG91dHB1dHNbMF0uc2V0KFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDNdLFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDMgKyAxXSxcbiAgICAgICAgICAgIHZlcnRpY2VzW2kgKiAzICsgMl1cbiAgICAgICAgKVxuICAgICAgICAubm9ybWFsaXplKClcbiAgICAgICAgLnRvQXJyYXkoKTtcblxuICAgICAgICB1dlswXSA9IHRoaXMuZ2V0QXppbXV0aCh2ZXJ0ZXgpICogMC41IC8gTWF0aC5QSSArIDAuNTtcbiAgICAgICAgdXZbMV0gPSB0aGlzLmdldEFsdGl0dWRlKHZlcnRleCkgLyBNYXRoLlBJICsgMC41O1xuXG4gICAgICAgIG91dC5wdXNoLmFwcGx5KG91dCwgdXYpO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggYW5kIG5vcm1hbGl6ZXMgYSBsaXN0IG9mIHZlcnRpY2VzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2ZXJ0aWNlcyBWZXJ0aWNlcyBvZiBhbGwgcG9pbnRzIG9uIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gb3V0IE9wdGlvbmFsIGFycmF5IHRvIGJlIGZpbGxlZCB3aXRoIHJlc3VsdGluZyBub3JtYWxpemVkIHZlY3RvcnMuXG4gKlxuICogQHJldHVybiB7QXJyYXl9IE5ldyBsaXN0IG9mIG5vcm1hbGl6ZWQgdmVydGljZXNcbiAqL1xuR2VvbWV0cnlIZWxwZXIubm9ybWFsaXplQWxsID0gZnVuY3Rpb24gbm9ybWFsaXplQWxsKHZlcnRpY2VzLCBvdXQpIHtcbiAgICBvdXQgPSBvdXQgfHwgW107XG4gICAgdmFyIGxlbiA9IHZlcnRpY2VzLmxlbmd0aCAvIDM7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KG91dCwgbmV3IFZlYzModmVydGljZXNbaSAqIDNdLCB2ZXJ0aWNlc1tpICogMyArIDFdLCB2ZXJ0aWNlc1tpICogMyArIDJdKS5ub3JtYWxpemUoKS50b0FycmF5KCkpO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZXMgYSBzZXQgb2YgdmVydGljZXMgdG8gbW9kZWwgc3BhY2UuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZlcnRpY2VzIFZlcnRpY2VzIG9mIGFsbCBwb2ludHMgb24gdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge0FycmF5fSBvdXQgT3B0aW9uYWwgYXJyYXkgdG8gYmUgZmlsbGVkIHdpdGggbW9kZWwgc3BhY2UgcG9zaXRpb24gdmVjdG9ycy5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gT3V0cHV0IHZlcnRpY2VzLlxuICovXG5HZW9tZXRyeUhlbHBlci5ub3JtYWxpemVWZXJ0aWNlcyA9IGZ1bmN0aW9uIG5vcm1hbGl6ZVZlcnRpY2VzKHZlcnRpY2VzLCBvdXQpIHtcbiAgICBvdXQgPSBvdXQgfHwgW107XG4gICAgdmFyIGxlbiA9IHZlcnRpY2VzLmxlbmd0aCAvIDM7XG4gICAgdmFyIHZlY3RvcnMgPSBbXTtcbiAgICB2YXIgbWluWDtcbiAgICB2YXIgbWF4WDtcbiAgICB2YXIgbWluWTtcbiAgICB2YXIgbWF4WTtcbiAgICB2YXIgbWluWjtcbiAgICB2YXIgbWF4WjtcbiAgICB2YXIgdjtcbiAgICB2YXIgaTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2ID0gdmVjdG9yc1tpXSA9IG5ldyBWZWMzKFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDNdLFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDMgKyAxXSxcbiAgICAgICAgICAgIHZlcnRpY2VzW2kgKiAzICsgMl1cbiAgICAgICAgKTtcblxuICAgICAgICBpZiAobWluWCA9PSBudWxsIHx8IHYueCA8IG1pblgpIG1pblggPSB2Lng7XG4gICAgICAgIGlmIChtYXhYID09IG51bGwgfHwgdi54ID4gbWF4WCkgbWF4WCA9IHYueDtcblxuICAgICAgICBpZiAobWluWSA9PSBudWxsIHx8IHYueSA8IG1pblkpIG1pblkgPSB2Lnk7XG4gICAgICAgIGlmIChtYXhZID09IG51bGwgfHwgdi55ID4gbWF4WSkgbWF4WSA9IHYueTtcblxuICAgICAgICBpZiAobWluWiA9PSBudWxsIHx8IHYueiA8IG1pblopIG1pblogPSB2Lno7XG4gICAgICAgIGlmIChtYXhaID09IG51bGwgfHwgdi56ID4gbWF4WikgbWF4WiA9IHYuejtcbiAgICB9XG5cbiAgICB2YXIgdHJhbnNsYXRpb24gPSBuZXcgVmVjMyhcbiAgICAgICAgZ2V0VHJhbnNsYXRpb25GYWN0b3IobWF4WCwgbWluWCksXG4gICAgICAgIGdldFRyYW5zbGF0aW9uRmFjdG9yKG1heFksIG1pblkpLFxuICAgICAgICBnZXRUcmFuc2xhdGlvbkZhY3RvcihtYXhaLCBtaW5aKVxuICAgICk7XG5cbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbihcbiAgICAgICAgZ2V0U2NhbGVGYWN0b3IobWF4WCArIHRyYW5zbGF0aW9uLngsIG1pblggKyB0cmFuc2xhdGlvbi54KSxcbiAgICAgICAgZ2V0U2NhbGVGYWN0b3IobWF4WSArIHRyYW5zbGF0aW9uLnksIG1pblkgKyB0cmFuc2xhdGlvbi55KSxcbiAgICAgICAgZ2V0U2NhbGVGYWN0b3IobWF4WiArIHRyYW5zbGF0aW9uLnosIG1pblogKyB0cmFuc2xhdGlvbi56KVxuICAgICk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgdmVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBvdXQucHVzaC5hcHBseShvdXQsIHZlY3RvcnNbaV0uYWRkKHRyYW5zbGF0aW9uKS5zY2FsZShzY2FsZSkudG9BcnJheSgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRyYW5zbGF0aW9uIGFtb3VudCBmb3IgYSBnaXZlbiBheGlzIHRvIG5vcm1hbGl6ZSBtb2RlbCBjb29yZGluYXRlcy5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtYXggTWF4aW11bSBwb3NpdGlvbiB2YWx1ZSBvZiBnaXZlbiBheGlzIG9uIHRoZSBtb2RlbC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBtaW4gTWluaW11bSBwb3NpdGlvbiB2YWx1ZSBvZiBnaXZlbiBheGlzIG9uIHRoZSBtb2RlbC5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IE51bWJlciBieSB3aGljaCB0aGUgZ2l2ZW4gYXhpcyBzaG91bGQgYmUgdHJhbnNsYXRlZCBmb3IgYWxsIHZlcnRpY2VzLlxuICovXG5mdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkZhY3RvcihtYXgsIG1pbikge1xuICAgIHJldHVybiAtKG1pbiArIChtYXggLSBtaW4pIC8gMik7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBzY2FsZSBhbW91bnQgZm9yIGEgZ2l2ZW4gYXhpcyB0byBub3JtYWxpemUgbW9kZWwgY29vcmRpbmF0ZXMuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbWF4IE1heGltdW0gc2NhbGUgdmFsdWUgb2YgZ2l2ZW4gYXhpcyBvbiB0aGUgbW9kZWwuXG4gKiBAcGFyYW0ge051bWJlcn0gbWluIE1pbmltdW0gc2NhbGUgdmFsdWUgb2YgZ2l2ZW4gYXhpcyBvbiB0aGUgbW9kZWwuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBOdW1iZXIgYnkgd2hpY2ggdGhlIGdpdmVuIGF4aXMgc2hvdWxkIGJlIHNjYWxlZCBmb3IgYWxsIHZlcnRpY2VzLlxuICovXG5mdW5jdGlvbiBnZXRTY2FsZUZhY3RvcihtYXgsIG1pbikge1xuICAgIHJldHVybiAxIC8gKChtYXggLSBtaW4pIC8gMik7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGF6aW11dGgsIG9yIGFuZ2xlIGFib3ZlIHRoZSBYWSBwbGFuZSwgb2YgYSBnaXZlbiB2ZWN0b3IuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHYgVmVydGV4IHRvIHJldHJlaXZlIGF6aW11dGggZnJvbS5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEF6aW11dGggdmFsdWUgaW4gcmFkaWFucy5cbiAqL1xuR2VvbWV0cnlIZWxwZXIuZ2V0QXppbXV0aCA9IGZ1bmN0aW9uIGF6aW11dGgodikge1xuICAgIHJldHVybiBNYXRoLmF0YW4yKHZbMl0sIC12WzBdKTtcbn07XG5cbi8qKlxuICogRmluZHMgdGhlIGFsdGl0dWRlLCBvciBhbmdsZSBhYm92ZSB0aGUgWFogcGxhbmUsIG9mIGEgZ2l2ZW4gdmVjdG9yLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2IFZlcnRleCB0byByZXRyZWl2ZSBhbHRpdHVkZSBmcm9tLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gQWx0aXR1ZGUgdmFsdWUgaW4gcmFkaWFucy5cbiAqL1xuR2VvbWV0cnlIZWxwZXIuZ2V0QWx0aXR1ZGUgPSBmdW5jdGlvbiBhbHRpdHVkZSh2KSB7XG4gICAgcmV0dXJuIE1hdGguYXRhbjIoLXZbMV0sIE1hdGguc3FydCgodlswXSAqIHZbMF0pICsgKHZbMl0gKiB2WzJdKSkpO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIGxpc3Qgb2YgaW5kaWNlcyBmcm9tICd0cmlhbmdsZScgdG8gJ2xpbmUnIGZvcm1hdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gaW5kaWNlcyBJbmRpY2VzIG9mIGFsbCBmYWNlcyBvbiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7QXJyYXl9IG91dCBJbmRpY2VzIG9mIGFsbCBmYWNlcyBvbiB0aGUgZ2VvbWV0cnlcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gTmV3IGxpc3Qgb2YgbGluZS1mb3JtYXR0ZWQgaW5kaWNlc1xuICovXG5HZW9tZXRyeUhlbHBlci50cmlhbmdsZXNUb0xpbmVzID0gZnVuY3Rpb24gdHJpYW5nbGVUb0xpbmVzKGluZGljZXMsIG91dCkge1xuICAgIHZhciBudW1WZWN0b3JzID0gaW5kaWNlcy5sZW5ndGggLyAzO1xuICAgIG91dCA9IG91dCB8fCBbXTtcbiAgICB2YXIgaTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBudW1WZWN0b3JzOyBpKyspIHtcbiAgICAgICAgb3V0LnB1c2goaW5kaWNlc1tpICogMyArIDBdLCBpbmRpY2VzW2kgKiAzICsgMV0pO1xuICAgICAgICBvdXQucHVzaChpbmRpY2VzW2kgKiAzICsgMV0sIGluZGljZXNbaSAqIDMgKyAyXSk7XG4gICAgICAgIG91dC5wdXNoKGluZGljZXNbaSAqIDMgKyAyXSwgaW5kaWNlc1tpICogMyArIDBdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBZGRzIGEgcmV2ZXJzZSBvcmRlciB0cmlhbmdsZSBmb3IgZXZlcnkgdHJpYW5nbGUgaW4gdGhlIG1lc2guIEFkZHMgZXh0cmEgdmVydGljZXNcbiAqIGFuZCBpbmRpY2VzIHRvIGlucHV0IGFycmF5cy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmVydGljZXMgWCwgWSwgWiBwb3NpdGlvbnMgb2YgYWxsIHZlcnRpY2VzIGluIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gaW5kaWNlcyBJbmRpY2VzIG9mIGFsbCBmYWNlcyBvbiB0aGUgZ2VvbWV0cnlcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkdlb21ldHJ5SGVscGVyLmFkZEJhY2tmYWNlVHJpYW5nbGVzID0gZnVuY3Rpb24gYWRkQmFja2ZhY2VUcmlhbmdsZXModmVydGljZXMsIGluZGljZXMpIHtcbiAgICB2YXIgbkZhY2VzID0gaW5kaWNlcy5sZW5ndGggLyAzO1xuXG4gICAgdmFyIG1heEluZGV4ID0gMDtcbiAgICB2YXIgaSA9IGluZGljZXMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIGlmIChpbmRpY2VzW2ldID4gbWF4SW5kZXgpIG1heEluZGV4ID0gaW5kaWNlc1tpXTtcblxuICAgIG1heEluZGV4Kys7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbkZhY2VzOyBpKyspIHtcbiAgICAgICAgdmFyIGluZGV4T25lID0gaW5kaWNlc1tpICogM10sXG4gICAgICAgICAgICBpbmRleFR3byA9IGluZGljZXNbaSAqIDMgKyAxXSxcbiAgICAgICAgICAgIGluZGV4VGhyZWUgPSBpbmRpY2VzW2kgKiAzICsgMl07XG5cbiAgICAgICAgaW5kaWNlcy5wdXNoKGluZGV4T25lICsgbWF4SW5kZXgsIGluZGV4VGhyZWUgKyBtYXhJbmRleCwgaW5kZXhUd28gKyBtYXhJbmRleCk7XG4gICAgfVxuXG4gICAgLy8gSXRlcmF0aW5nIGluc3RlYWQgb2YgLnNsaWNlKCkgaGVyZSB0byBhdm9pZCBtYXggY2FsbCBzdGFjayBpc3N1ZS5cblxuICAgIHZhciBuVmVydHMgPSB2ZXJ0aWNlcy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IG5WZXJ0czsgaSsrKSB7XG4gICAgICAgIHZlcnRpY2VzLnB1c2godmVydGljZXNbaV0pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2VvbWV0cnlIZWxwZXI7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBHZW9tZXRyeSA9IHJlcXVpcmUoJy4uL0dlb21ldHJ5Jyk7XG52YXIgR2VvbWV0cnlIZWxwZXIgPSByZXF1aXJlKCcuLi9HZW9tZXRyeUhlbHBlcicpO1xuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBhIG5ldyBzdGF0aWMgZ2VvbWV0cnksIHdoaWNoIGlzIHBhc3NlZFxuICogY3VzdG9tIGJ1ZmZlciBkYXRhLlxuICpcbiAqIEBjbGFzcyBQbGFuZVxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgUGFyYW1ldGVycyB0aGF0IGFsdGVyIHRoZVxuICogdmVydGV4IGJ1ZmZlcnMgb2YgdGhlIGdlbmVyYXRlZCBnZW9tZXRyeS5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IGNvbnN0cnVjdGVkIGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIFBsYW5lKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgZGV0YWlsWCA9IG9wdGlvbnMuZGV0YWlsWCB8fCBvcHRpb25zLmRldGFpbCB8fCAxO1xuICAgIHZhciBkZXRhaWxZID0gb3B0aW9ucy5kZXRhaWxZIHx8IG9wdGlvbnMuZGV0YWlsIHx8IDE7XG5cbiAgICB2YXIgdmVydGljZXMgICAgICA9IFtdO1xuICAgIHZhciB0ZXh0dXJlQ29vcmRzID0gW107XG4gICAgdmFyIG5vcm1hbHMgICAgICAgPSBbXTtcbiAgICB2YXIgaW5kaWNlcyAgICAgICA9IFtdO1xuXG4gICAgdmFyIGk7XG5cbiAgICBmb3IgKHZhciB5ID0gMDsgeSA8PSBkZXRhaWxZOyB5KyspIHtcbiAgICAgICAgdmFyIHQgPSB5IC8gZGV0YWlsWTtcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPD0gZGV0YWlsWDsgeCsrKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHggLyBkZXRhaWxYO1xuICAgICAgICAgICAgdmVydGljZXMucHVzaCgyLiAqIChzIC0gLjUpLCAyICogKHQgLSAuNSksIDApO1xuICAgICAgICAgICAgdGV4dHVyZUNvb3Jkcy5wdXNoKHMsIDEgLSB0KTtcbiAgICAgICAgICAgIGlmICh4IDwgZGV0YWlsWCAmJiB5IDwgZGV0YWlsWSkge1xuICAgICAgICAgICAgICAgIGkgPSB4ICsgeSAqIChkZXRhaWxYICsgMSk7XG4gICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGksIGkgKyAxLCBpICsgZGV0YWlsWCArIDEpO1xuICAgICAgICAgICAgICAgIGluZGljZXMucHVzaChpICsgZGV0YWlsWCArIDEsIGkgKyAxLCBpICsgZGV0YWlsWCArIDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuYmFja2ZhY2UgIT09IGZhbHNlKSB7XG4gICAgICAgIEdlb21ldHJ5SGVscGVyLmFkZEJhY2tmYWNlVHJpYW5nbGVzKHZlcnRpY2VzLCBpbmRpY2VzKTtcblxuICAgICAgICAvLyBkdXBsaWNhdGUgdGV4dHVyZSBjb29yZGluYXRlcyBhcyB3ZWxsXG5cbiAgICAgICAgdmFyIGxlbiA9IHRleHR1cmVDb29yZHMubGVuZ3RoO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHRleHR1cmVDb29yZHMucHVzaCh0ZXh0dXJlQ29vcmRzW2ldKTtcbiAgICB9XG5cbiAgICBub3JtYWxzID0gR2VvbWV0cnlIZWxwZXIuY29tcHV0ZU5vcm1hbHModmVydGljZXMsIGluZGljZXMpO1xuXG4gICAgcmV0dXJuIG5ldyBHZW9tZXRyeSh7XG4gICAgICAgIGJ1ZmZlcnM6IFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2FfcG9zJywgZGF0YTogdmVydGljZXMgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2FfdGV4Q29vcmQnLCBkYXRhOiB0ZXh0dXJlQ29vcmRzLCBzaXplOiAyIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdhX25vcm1hbHMnLCBkYXRhOiBub3JtYWxzIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdpbmRpY2VzJywgZGF0YTogaW5kaWNlcywgc2l6ZTogMSB9XG4gICAgICAgIF1cbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQbGFuZTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBCdWZmZXIgaXMgYSBwcml2YXRlIGNsYXNzIHRoYXQgd3JhcHMgdGhlIHZlcnRleCBkYXRhIHRoYXQgZGVmaW5lc1xuICogdGhlIHRoZSBwb2ludHMgb2YgdGhlIHRyaWFuZ2xlcyB0aGF0IHdlYmdsIGRyYXdzLiBFYWNoIGJ1ZmZlclxuICogbWFwcyB0byBvbmUgYXR0cmlidXRlIG9mIGEgbWVzaC5cbiAqXG4gKiBAY2xhc3MgQnVmZmVyXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGFyZ2V0IFRoZSBiaW5kIHRhcmdldCBvZiB0aGUgYnVmZmVyIHRvIHVwZGF0ZTogQVJSQVlfQlVGRkVSIG9yIEVMRU1FTlRfQVJSQVlfQlVGRkVSXG4gKiBAcGFyYW0ge09iamVjdH0gdHlwZSBBcnJheSB0eXBlIHRvIGJlIHVzZWQgaW4gY2FsbHMgdG8gZ2wuYnVmZmVyRGF0YS5cbiAqIEBwYXJhbSB7V2ViR0xDb250ZXh0fSBnbCBUaGUgV2ViR0wgY29udGV4dCB0aGF0IHRoZSBidWZmZXIgaXMgaG9zdGVkIGJ5LlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlcih0YXJnZXQsIHR5cGUsIGdsKSB7XG4gICAgdGhpcy5idWZmZXIgPSBudWxsO1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5kYXRhID0gW107XG4gICAgdGhpcy5nbCA9IGdsO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBXZWJHTCBidWZmZXIgaWYgb25lIGRvZXMgbm90IHlldCBleGlzdCBhbmQgYmluZHMgdGhlIGJ1ZmZlciB0b1xuICogdG8gdGhlIGNvbnRleHQuIFJ1bnMgYnVmZmVyRGF0YSB3aXRoIGFwcHJvcHJpYXRlIGRhdGEuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUuc3ViRGF0YSA9IGZ1bmN0aW9uIHN1YkRhdGEoKSB7XG4gICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgICB2YXIgZGF0YSA9IFtdO1xuXG4gICAgLy8gdG8gcHJldmVudCBhZ2FpbnN0IG1heGltdW0gY2FsbC1zdGFjayBpc3N1ZS5cbiAgICBmb3IgKHZhciBpID0gMCwgY2h1bmsgPSAxMDAwMDsgaSA8IHRoaXMuZGF0YS5sZW5ndGg7IGkgKz0gY2h1bmspXG4gICAgICAgIGRhdGEgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KGRhdGEsIHRoaXMuZGF0YS5zbGljZShpLCBpICsgY2h1bmspKTtcblxuICAgIHRoaXMuYnVmZmVyID0gdGhpcy5idWZmZXIgfHwgZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLnRhcmdldCwgdGhpcy5idWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEodGhpcy50YXJnZXQsIG5ldyB0aGlzLnR5cGUoZGF0YSksIGdsLlNUQVRJQ19EUkFXKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQnVmZmVyO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgSU5ESUNFUyA9ICdpbmRpY2VzJztcblxudmFyIEJ1ZmZlciA9IHJlcXVpcmUoJy4vQnVmZmVyJyk7XG5cbi8qKlxuICogQnVmZmVyUmVnaXN0cnkgaXMgYSBjbGFzcyB0aGF0IG1hbmFnZXMgYWxsb2NhdGlvbiBvZiBidWZmZXJzIHRvXG4gKiBpbnB1dCBnZW9tZXRyaWVzLlxuICpcbiAqIEBjbGFzcyBCdWZmZXJSZWdpc3RyeVxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtXZWJHTENvbnRleHR9IGNvbnRleHQgV2ViR0wgZHJhd2luZyBjb250ZXh0IHRvIGJlIHBhc3NlZCB0byBidWZmZXJzLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlclJlZ2lzdHJ5KGNvbnRleHQpIHtcbiAgICB0aGlzLmdsID0gY29udGV4dDtcblxuICAgIHRoaXMucmVnaXN0cnkgPSB7fTtcbiAgICB0aGlzLl9keW5hbWljQnVmZmVycyA9IFtdO1xuICAgIHRoaXMuX3N0YXRpY0J1ZmZlcnMgPSBbXTtcblxuICAgIHRoaXMuX2FycmF5QnVmZmVyTWF4ID0gMzAwMDA7XG4gICAgdGhpcy5fZWxlbWVudEJ1ZmZlck1heCA9IDMwMDAwO1xufVxuXG4vKipcbiAqIEJpbmRzIGFuZCBmaWxscyBhbGwgdGhlIHZlcnRleCBkYXRhIGludG8gd2ViZ2wgYnVmZmVycy4gIFdpbGwgcmV1c2UgYnVmZmVycyBpZlxuICogcG9zc2libGUuICBQb3B1bGF0ZXMgcmVnaXN0cnkgd2l0aCB0aGUgbmFtZSBvZiB0aGUgYnVmZmVyLCB0aGUgV2ViR0wgYnVmZmVyXG4gKiBvYmplY3QsIHNwYWNpbmcgb2YgdGhlIGF0dHJpYnV0ZSwgdGhlIGF0dHJpYnV0ZSdzIG9mZnNldCB3aXRoaW4gdGhlIGJ1ZmZlcixcbiAqIGFuZCBmaW5hbGx5IHRoZSBsZW5ndGggb2YgdGhlIGJ1ZmZlci4gIFRoaXMgaW5mb3JtYXRpb24gaXMgbGF0ZXIgYWNjZXNzZWQgYnlcbiAqIHRoZSByb290IHRvIGRyYXcgdGhlIGJ1ZmZlcnMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBnZW9tZXRyeUlkIElkIG9mIHRoZSBnZW9tZXRyeSBpbnN0YW5jZSB0aGF0IGhvbGRzIHRoZSBidWZmZXJzLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgS2V5IG9mIHRoZSBpbnB1dCBidWZmZXIgaW4gdGhlIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gdmFsdWUgRmxhdCBhcnJheSBjb250YWluaW5nIGlucHV0IGRhdGEgZm9yIGJ1ZmZlci5cbiAqIEBwYXJhbSB7TnVtYmVyfSBzcGFjaW5nIFRoZSBzcGFjaW5nLCBvciBpdGVtU2l6ZSwgb2YgdGhlIGlucHV0IGJ1ZmZlci5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZHluYW1pYyBCb29sZWFuIGRlbm90aW5nIHdoZXRoZXIgYSBnZW9tZXRyeSBpcyBkeW5hbWljIG9yIHN0YXRpYy5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5CdWZmZXJSZWdpc3RyeS5wcm90b3R5cGUuYWxsb2NhdGUgPSBmdW5jdGlvbiBhbGxvY2F0ZShnZW9tZXRyeUlkLCBuYW1lLCB2YWx1ZSwgc3BhY2luZywgZHluYW1pYykge1xuICAgIHZhciB2ZXJ0ZXhCdWZmZXJzID0gdGhpcy5yZWdpc3RyeVtnZW9tZXRyeUlkXSB8fCAodGhpcy5yZWdpc3RyeVtnZW9tZXRyeUlkXSA9IHsga2V5czogW10sIHZhbHVlczogW10sIHNwYWNpbmc6IFtdLCBvZmZzZXQ6IFtdLCBsZW5ndGg6IFtdIH0pO1xuXG4gICAgdmFyIGogPSB2ZXJ0ZXhCdWZmZXJzLmtleXMuaW5kZXhPZihuYW1lKTtcbiAgICB2YXIgaXNJbmRleCA9IG5hbWUgPT09IElORElDRVM7XG4gICAgdmFyIGJ1ZmZlckZvdW5kID0gZmFsc2U7XG4gICAgdmFyIG5ld09mZnNldDtcbiAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICB2YXIgbGVuZ3RoO1xuICAgIHZhciBidWZmZXI7XG4gICAgdmFyIGs7XG5cbiAgICBpZiAoaiA9PT0gLTEpIHtcbiAgICAgICAgaiA9IHZlcnRleEJ1ZmZlcnMua2V5cy5sZW5ndGg7XG4gICAgICAgIGxlbmd0aCA9IGlzSW5kZXggPyB2YWx1ZS5sZW5ndGggOiBNYXRoLmZsb29yKHZhbHVlLmxlbmd0aCAvIHNwYWNpbmcpO1xuXG4gICAgICAgIGlmICghZHluYW1pYykge1xuXG4gICAgICAgICAgICAvLyBVc2UgYSBwcmV2aW91c2x5IGNyZWF0ZWQgYnVmZmVyIGlmIGF2YWlsYWJsZS5cblxuICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IHRoaXMuX3N0YXRpY0J1ZmZlcnMubGVuZ3RoOyBrKyspIHtcblxuICAgICAgICAgICAgICAgIGlmIChpc0luZGV4ID09PSB0aGlzLl9zdGF0aWNCdWZmZXJzW2tdLmlzSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3T2Zmc2V0ID0gdGhpcy5fc3RhdGljQnVmZmVyc1trXS5vZmZzZXQgKyB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoIWlzSW5kZXggJiYgbmV3T2Zmc2V0IDwgdGhpcy5fYXJyYXlCdWZmZXJNYXgpIHx8IChpc0luZGV4ICYmIG5ld09mZnNldCA8IHRoaXMuX2VsZW1lbnRCdWZmZXJNYXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSB0aGlzLl9zdGF0aWNCdWZmZXJzW2tdLmJ1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRoaXMuX3N0YXRpY0J1ZmZlcnNba10ub2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhdGljQnVmZmVyc1trXS5vZmZzZXQgKz0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIG5ldyBzdGF0aWMgYnVmZmVyIGluIG5vbmUgd2VyZSBmb3VuZC5cblxuICAgICAgICAgICAgaWYgKCFidWZmZXJGb3VuZCkge1xuICAgICAgICAgICAgICAgIGJ1ZmZlciA9IG5ldyBCdWZmZXIoXG4gICAgICAgICAgICAgICAgICAgIGlzSW5kZXggPyB0aGlzLmdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSIDogdGhpcy5nbC5BUlJBWV9CVUZGRVIsXG4gICAgICAgICAgICAgICAgICAgIGlzSW5kZXggPyBVaW50MTZBcnJheSA6IEZsb2F0MzJBcnJheSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nbFxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0aWNCdWZmZXJzLnB1c2goeyBidWZmZXI6IGJ1ZmZlciwgb2Zmc2V0OiB2YWx1ZS5sZW5ndGgsIGlzSW5kZXg6IGlzSW5kZXggfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIEZvciBkeW5hbWljIGdlb21ldHJpZXMsIGFsd2F5cyBjcmVhdGUgbmV3IGJ1ZmZlci5cblxuICAgICAgICAgICAgYnVmZmVyID0gbmV3IEJ1ZmZlcihcbiAgICAgICAgICAgICAgICBpc0luZGV4ID8gdGhpcy5nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiA6IHRoaXMuZ2wuQVJSQVlfQlVGRkVSLFxuICAgICAgICAgICAgICAgIGlzSW5kZXggPyBVaW50MTZBcnJheSA6IEZsb2F0MzJBcnJheSxcbiAgICAgICAgICAgICAgICB0aGlzLmdsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB0aGlzLl9keW5hbWljQnVmZmVycy5wdXNoKHsgYnVmZmVyOiBidWZmZXIsIG9mZnNldDogdmFsdWUubGVuZ3RoLCBpc0luZGV4OiBpc0luZGV4IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSByZWdpc3RyeSBmb3IgdGhlIHNwZWMgd2l0aCBidWZmZXIgaW5mb3JtYXRpb24uXG5cbiAgICAgICAgdmVydGV4QnVmZmVycy5rZXlzLnB1c2gobmFtZSk7XG4gICAgICAgIHZlcnRleEJ1ZmZlcnMudmFsdWVzLnB1c2goYnVmZmVyKTtcbiAgICAgICAgdmVydGV4QnVmZmVycy5zcGFjaW5nLnB1c2goc3BhY2luZyk7XG4gICAgICAgIHZlcnRleEJ1ZmZlcnMub2Zmc2V0LnB1c2gob2Zmc2V0KTtcbiAgICAgICAgdmVydGV4QnVmZmVycy5sZW5ndGgucHVzaChsZW5ndGgpO1xuICAgIH1cblxuICAgIHZhciBsZW4gPSB2YWx1ZS5sZW5ndGg7XG4gICAgZm9yIChrID0gMDsgayA8IGxlbjsgaysrKSB7XG4gICAgICAgIHZlcnRleEJ1ZmZlcnMudmFsdWVzW2pdLmRhdGFbb2Zmc2V0ICsga10gPSB2YWx1ZVtrXTtcbiAgICB9XG4gICAgdmVydGV4QnVmZmVycy52YWx1ZXNbal0uc3ViRGF0YSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdWZmZXJSZWdpc3RyeTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBUYWtlcyB0aGUgb3JpZ2luYWwgcmVuZGVyaW5nIGNvbnRleHRzJyBjb21waWxlciBmdW5jdGlvblxuICogYW5kIGF1Z21lbnRzIGl0IHdpdGggYWRkZWQgZnVuY3Rpb25hbGl0eSBmb3IgcGFyc2luZyBhbmRcbiAqIGRpc3BsYXlpbmcgZXJyb3JzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IEF1Z21lbnRlZCBmdW5jdGlvblxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIERlYnVnKCkge1xuICAgIHJldHVybiBfYXVnbWVudEZ1bmN0aW9uKFxuICAgICAgICB0aGlzLmdsLmNvbXBpbGVTaGFkZXIsXG4gICAgICAgIGZ1bmN0aW9uKHNoYWRlcikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIHRoaXMuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVycm9ycyA9IHRoaXMuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xuICAgICAgICAgICAgICAgIHZhciBzb3VyY2UgPSB0aGlzLmdldFNoYWRlclNvdXJjZShzaGFkZXIpO1xuICAgICAgICAgICAgICAgIF9wcm9jZXNzRXJyb3JzKGVycm9ycywgc291cmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG59O1xuXG4vLyBUYWtlcyBhIGZ1bmN0aW9uLCBrZWVwcyB0aGUgcmVmZXJlbmNlIGFuZCByZXBsYWNlcyBpdCBieSBhIGNsb3N1cmUgdGhhdFxuLy8gZXhlY3V0ZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFuZCB0aGUgcHJvdmlkZWQgY2FsbGJhY2suXG5mdW5jdGlvbiBfYXVnbWVudEZ1bmN0aW9uKGZ1bmMsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVzID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG59XG5cbi8vIFBhcnNlcyBlcnJvcnMgYW5kIGZhaWxlZCBzb3VyY2UgY29kZSBmcm9tIHNoYWRlcnMgaW4gb3JkZXJcbi8vIHRvIGJ1aWxkIGRpc3BsYXlhYmxlIGVycm9yIGJsb2Nrcy5cbi8vIEluc3BpcmVkIGJ5IEphdW1lIFNhbmNoZXogRWxpYXMuXG5mdW5jdGlvbiBfcHJvY2Vzc0Vycm9ycyhlcnJvcnMsIHNvdXJjZSkge1xuXG4gICAgdmFyIGNzcyA9ICdib2R5LGh0bWx7YmFja2dyb3VuZDojZTNlM2UzO2ZvbnQtZmFtaWx5Om1vbmFjbyxtb25vc3BhY2U7Zm9udC1zaXplOjE0cHg7bGluZS1oZWlnaHQ6MS43ZW19JyArXG4gICAgICAgICAgICAgICcjc2hhZGVyUmVwb3J0e2xlZnQ6MDt0b3A6MDtyaWdodDowO2JveC1zaXppbmc6Ym9yZGVyLWJveDtwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwMDA7Y29sb3I6JyArXG4gICAgICAgICAgICAgICcjMjIyO3BhZGRpbmc6MTVweDt3aGl0ZS1zcGFjZTpub3JtYWw7bGlzdC1zdHlsZS10eXBlOm5vbmU7bWFyZ2luOjUwcHggYXV0bzttYXgtd2lkdGg6MTIwMHB4fScgK1xuICAgICAgICAgICAgICAnI3NoYWRlclJlcG9ydCBsaXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7bWFyZ2luOjEzcHggMDtib3gtc2hhZG93OjAgMXB4IDJweCByZ2JhKDAsMCwwLC4xNSk7JyArXG4gICAgICAgICAgICAgICdwYWRkaW5nOjIwcHggMzBweDtib3JkZXItcmFkaXVzOjJweDtib3JkZXItbGVmdDoyMHB4IHNvbGlkICNlMDExMTF9c3Bhbntjb2xvcjojZTAxMTExOycgK1xuICAgICAgICAgICAgICAndGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZTtmb250LXdlaWdodDo3MDB9I3NoYWRlclJlcG9ydCBsaSBwe3BhZGRpbmc6MDttYXJnaW46MH0nICtcbiAgICAgICAgICAgICAgJyNzaGFkZXJSZXBvcnQgbGk6bnRoLWNoaWxkKGV2ZW4pe2JhY2tncm91bmQtY29sb3I6I2Y0ZjRmNH0nICtcbiAgICAgICAgICAgICAgJyNzaGFkZXJSZXBvcnQgbGkgcDpmaXJzdC1jaGlsZHttYXJnaW4tYm90dG9tOjEwcHg7Y29sb3I6IzY2Nn0nO1xuXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGVsKTtcbiAgICBlbC50ZXh0Q29udGVudCA9IGNzcztcblxuICAgIHZhciByZXBvcnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgIHJlcG9ydC5zZXRBdHRyaWJ1dGUoJ2lkJywgJ3NoYWRlclJlcG9ydCcpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocmVwb3J0KTtcblxuICAgIHZhciByZSA9IC9FUlJPUjogW1xcZF0rOihbXFxkXSspOiAoLispL2dtaTtcbiAgICB2YXIgbGluZXMgPSBzb3VyY2Uuc3BsaXQoJ1xcbicpO1xuXG4gICAgdmFyIG07XG4gICAgd2hpbGUgKChtID0gcmUuZXhlYyhlcnJvcnMpKSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChtLmluZGV4ID09PSByZS5sYXN0SW5kZXgpIHJlLmxhc3RJbmRleCsrO1xuICAgICAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICB2YXIgY29kZSA9ICc8cD48c3Bhbj5FUlJPUjwvc3Bhbj4gXCInICsgbVsyXSArICdcIiBpbiBsaW5lICcgKyBtWzFdICsgJzwvcD4nO1xuICAgICAgICBjb2RlICs9ICc8cD48Yj4nICsgbGluZXNbbVsxXSAtIDFdLnJlcGxhY2UoL15bIFxcdF0rL2csICcnKSArICc8L2I+PC9wPic7XG4gICAgICAgIGxpLmlubmVySFRNTCA9IGNvZGU7XG4gICAgICAgIHJlcG9ydC5hcHBlbmRDaGlsZChsaSk7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xvbmUgPSByZXF1aXJlKCcuLi91dGlsaXRpZXMvY2xvbmUnKTtcbnZhciBrZXlWYWx1ZVRvQXJyYXlzID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzL2tleVZhbHVlVG9BcnJheXMnKTtcblxudmFyIHZlcnRleFdyYXBwZXIgPSByZXF1aXJlKCcuLi93ZWJnbC1zaGFkZXJzJykudmVydGV4O1xudmFyIGZyYWdtZW50V3JhcHBlciA9IHJlcXVpcmUoJy4uL3dlYmdsLXNoYWRlcnMnKS5mcmFnbWVudDtcbnZhciBEZWJ1ZyA9IHJlcXVpcmUoJy4vRGVidWcnKTtcblxudmFyIFZFUlRFWF9TSEFERVIgPSAzNTYzMztcbnZhciBGUkFHTUVOVF9TSEFERVIgPSAzNTYzMjtcbnZhciBpZGVudGl0eU1hdHJpeCA9IFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXTtcblxudmFyIGhlYWRlciA9ICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcXG4nO1xuXG52YXIgVFlQRVMgPSB7XG4gICAgdW5kZWZpbmVkOiAnZmxvYXQgJyxcbiAgICAxOiAnZmxvYXQgJyxcbiAgICAyOiAndmVjMiAnLFxuICAgIDM6ICd2ZWMzICcsXG4gICAgNDogJ3ZlYzQgJyxcbiAgICAxNjogJ21hdDQgJ1xufTtcblxudmFyIGlucHV0VHlwZXMgPSB7XG4gICAgdV9iYXNlQ29sb3I6ICd2ZWM0JyxcbiAgICB1X25vcm1hbHM6ICd2ZXJ0JyxcbiAgICB1X2dsb3NzaW5lc3M6ICd2ZWM0JyxcbiAgICB1X3Bvc2l0aW9uT2Zmc2V0OiAndmVydCdcbn07XG5cbnZhciBtYXNrcyA9ICB7XG4gICAgdmVydDogMSxcbiAgICB2ZWMzOiAyLFxuICAgIHZlYzQ6IDQsXG4gICAgZmxvYXQ6IDhcbn07XG5cbi8qKlxuICogVW5pZm9ybSBrZXlzIGFuZCB2YWx1ZXNcbiAqL1xudmFyIHVuaWZvcm1zID0ga2V5VmFsdWVUb0FycmF5cyh7XG4gICAgdV9wZXJzcGVjdGl2ZTogaWRlbnRpdHlNYXRyaXgsXG4gICAgdV92aWV3OiBpZGVudGl0eU1hdHJpeCxcbiAgICB1X3Jlc29sdXRpb246IFswLCAwLCAwXSxcbiAgICB1X3RyYW5zZm9ybTogaWRlbnRpdHlNYXRyaXgsXG4gICAgdV9zaXplOiBbMSwgMSwgMV0sXG4gICAgdV90aW1lOiAwLFxuICAgIHVfb3BhY2l0eTogMSxcbiAgICB1X21ldGFsbmVzczogMCxcbiAgICB1X2dsb3NzaW5lc3M6IFswLCAwLCAwLCAwXSxcbiAgICB1X2Jhc2VDb2xvcjogWzEsIDEsIDEsIDFdLFxuICAgIHVfbm9ybWFsczogWzEsIDEsIDFdLFxuICAgIHVfcG9zaXRpb25PZmZzZXQ6IFswLCAwLCAwXSxcbiAgICB1X2xpZ2h0UG9zaXRpb246IGlkZW50aXR5TWF0cml4LFxuICAgIHVfbGlnaHRDb2xvcjogaWRlbnRpdHlNYXRyaXgsXG4gICAgdV9hbWJpZW50TGlnaHQ6IFswLCAwLCAwXSxcbiAgICB1X2ZsYXRTaGFkaW5nOiAwLFxuICAgIHVfbnVtTGlnaHRzOiAwXG59KTtcblxuLyoqXG4gKiBBdHRyaWJ1dGVzIGtleXMgYW5kIHZhbHVlc1xuICovXG52YXIgYXR0cmlidXRlcyA9IGtleVZhbHVlVG9BcnJheXMoe1xuICAgIGFfcG9zOiBbMCwgMCwgMF0sXG4gICAgYV90ZXhDb29yZDogWzAsIDBdLFxuICAgIGFfbm9ybWFsczogWzAsIDAsIDBdXG59KTtcblxuLyoqXG4gKiBWYXJ5aW5ncyBrZXlzIGFuZCB2YWx1ZXNcbiAqL1xudmFyIHZhcnlpbmdzID0ga2V5VmFsdWVUb0FycmF5cyh7XG4gICAgdl90ZXh0dXJlQ29vcmRpbmF0ZTogWzAsIDBdLFxuICAgIHZfbm9ybWFsOiBbMCwgMCwgMF0sXG4gICAgdl9wb3NpdGlvbjogWzAsIDAsIDBdLFxuICAgIHZfZXllVmVjdG9yOiBbMCwgMCwgMF1cbn0pO1xuXG4vKipcbiAqIEEgY2xhc3MgdGhhdCBoYW5kbGVzIGludGVyYWN0aW9ucyB3aXRoIHRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICogdXNlZCBieSBhIHNwZWNpZmljIGNvbnRleHQuICBJdCBtYW5hZ2VzIGNyZWF0aW9uIG9mIHRoZSBzaGFkZXIgcHJvZ3JhbVxuICogYW5kIHRoZSBhdHRhY2hlZCB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlcnMuICBJdCBpcyBhbHNvIGluIGNoYXJnZSBvZlxuICogcGFzc2luZyBhbGwgdW5pZm9ybXMgdG8gdGhlIFdlYkdMQ29udGV4dC5cbiAqXG4gKiBAY2xhc3MgUHJvZ3JhbVxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtXZWJHTF9Db250ZXh0fSBnbCBDb250ZXh0IHRvIGJlIHVzZWQgdG8gY3JlYXRlIHRoZSBzaGFkZXIgcHJvZ3JhbVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgUHJvZ3JhbSBvcHRpb25zXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuZnVuY3Rpb24gUHJvZ3JhbShnbCwgb3B0aW9ucykge1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLnRleHR1cmVTbG90cyA9IDE7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHRoaXMucmVnaXN0ZXJlZE1hdGVyaWFscyA9IHt9O1xuICAgIHRoaXMuZmxhZ2dlZFVuaWZvcm1zID0gW107XG4gICAgdGhpcy5jYWNoZWRVbmlmb3JtcyAgPSB7fTtcbiAgICB0aGlzLnVuaWZvcm1UeXBlcyA9IFtdO1xuXG4gICAgdGhpcy5kZWZpbml0aW9uVmVjNCA9IFtdO1xuICAgIHRoaXMuZGVmaW5pdGlvblZlYzMgPSBbXTtcbiAgICB0aGlzLmRlZmluaXRpb25GbG9hdCA9IFtdO1xuICAgIHRoaXMuYXBwbGljYXRpb25WZWMzID0gW107XG4gICAgdGhpcy5hcHBsaWNhdGlvblZlYzQgPSBbXTtcbiAgICB0aGlzLmFwcGxpY2F0aW9uRmxvYXQgPSBbXTtcbiAgICB0aGlzLmFwcGxpY2F0aW9uVmVydCA9IFtdO1xuICAgIHRoaXMuZGVmaW5pdGlvblZlcnQgPSBbXTtcblxuICAgIHRoaXMucmVzZXRQcm9ncmFtKCk7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgbWF0ZXJpYWwgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkIHRvXG4gKiB0aGUgc2hhZGVyIHByb2dyYW0uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGFyZ2V0IGlucHV0IG9mIG1hdGVyaWFsLlxuICogQHBhcmFtIHtPYmplY3R9IG1hdGVyaWFsIENvbXBpbGVkIG1hdGVyaWFsIG9iamVjdCBiZWluZyB2ZXJpZmllZC5cbiAqXG4gKiBAcmV0dXJuIHtQcm9ncmFtfSB0aGlzIEN1cnJlbnQgcHJvZ3JhbS5cbiAqL1xuUHJvZ3JhbS5wcm90b3R5cGUucmVnaXN0ZXJNYXRlcmlhbCA9IGZ1bmN0aW9uIHJlZ2lzdGVyTWF0ZXJpYWwobmFtZSwgbWF0ZXJpYWwpIHtcbiAgICB2YXIgY29tcGlsZWQgPSBtYXRlcmlhbDtcbiAgICB2YXIgdHlwZSA9IGlucHV0VHlwZXNbbmFtZV07XG4gICAgdmFyIG1hc2sgPSBtYXNrc1t0eXBlXTtcblxuICAgIGlmICgodGhpcy5yZWdpc3RlcmVkTWF0ZXJpYWxzW21hdGVyaWFsLl9pZF0gJiBtYXNrKSA9PT0gbWFzaykgcmV0dXJuIHRoaXM7XG5cbiAgICB2YXIgaztcblxuICAgIGZvciAoayBpbiBjb21waWxlZC51bmlmb3Jtcykge1xuICAgICAgICBpZiAodW5pZm9ybXMua2V5cy5pbmRleE9mKGspID09PSAtMSkge1xuICAgICAgICAgICAgdW5pZm9ybXMua2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgdW5pZm9ybXMudmFsdWVzLnB1c2goY29tcGlsZWQudW5pZm9ybXNba10pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChrIGluIGNvbXBpbGVkLnZhcnlpbmdzKSB7XG4gICAgICAgIGlmICh2YXJ5aW5ncy5rZXlzLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICB2YXJ5aW5ncy5rZXlzLnB1c2goayk7XG4gICAgICAgICAgICB2YXJ5aW5ncy52YWx1ZXMucHVzaChjb21waWxlZC52YXJ5aW5nc1trXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGsgaW4gY29tcGlsZWQuYXR0cmlidXRlcykge1xuICAgICAgICBpZiAoYXR0cmlidXRlcy5rZXlzLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLmtleXMucHVzaChrKTtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMudmFsdWVzLnB1c2goY29tcGlsZWQuYXR0cmlidXRlc1trXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJlZ2lzdGVyZWRNYXRlcmlhbHNbbWF0ZXJpYWwuX2lkXSB8PSBtYXNrO1xuXG4gICAgaWYgKHR5cGUgPT09ICdmbG9hdCcpIHtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uRmxvYXQucHVzaChtYXRlcmlhbC5kZWZpbmVzKTtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uRmxvYXQucHVzaCgnZmxvYXQgZmFfJyArIG1hdGVyaWFsLl9pZCArICcoKSB7XFxuICcgICsgY29tcGlsZWQuZ2xzbCArICcgXFxufScpO1xuICAgICAgICB0aGlzLmFwcGxpY2F0aW9uRmxvYXQucHVzaCgnaWYgKGludChhYnMoSUQpKSA9PSAnICsgbWF0ZXJpYWwuX2lkICsgJykgcmV0dXJuIGZhXycgKyBtYXRlcmlhbC5faWQgICsgJygpOycpO1xuICAgIH1cblxuICAgIGlmICh0eXBlID09PSAndmVjMycpIHtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uVmVjMy5wdXNoKG1hdGVyaWFsLmRlZmluZXMpO1xuICAgICAgICB0aGlzLmRlZmluaXRpb25WZWMzLnB1c2goJ3ZlYzMgZmFfJyArIG1hdGVyaWFsLl9pZCArICcoKSB7XFxuICcgICsgY29tcGlsZWQuZ2xzbCArICcgXFxufScpO1xuICAgICAgICB0aGlzLmFwcGxpY2F0aW9uVmVjMy5wdXNoKCdpZiAoaW50KGFicyhJRC54KSkgPT0gJyArIG1hdGVyaWFsLl9pZCArICcpIHJldHVybiBmYV8nICsgbWF0ZXJpYWwuX2lkICsgJygpOycpO1xuICAgIH1cblxuICAgIGlmICh0eXBlID09PSAndmVjNCcpIHtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uVmVjNC5wdXNoKG1hdGVyaWFsLmRlZmluZXMpO1xuICAgICAgICB0aGlzLmRlZmluaXRpb25WZWM0LnB1c2goJ3ZlYzQgZmFfJyArIG1hdGVyaWFsLl9pZCArICcoKSB7XFxuICcgICsgY29tcGlsZWQuZ2xzbCArICcgXFxufScpO1xuICAgICAgICB0aGlzLmFwcGxpY2F0aW9uVmVjNC5wdXNoKCdpZiAoaW50KGFicyhJRC54KSkgPT0gJyArIG1hdGVyaWFsLl9pZCArICcpIHJldHVybiBmYV8nICsgbWF0ZXJpYWwuX2lkICsgJygpOycpO1xuICAgIH1cblxuICAgIGlmICh0eXBlID09PSAndmVydCcpIHtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uVmVydC5wdXNoKG1hdGVyaWFsLmRlZmluZXMpO1xuICAgICAgICB0aGlzLmRlZmluaXRpb25WZXJ0LnB1c2goJ3ZlYzMgZmFfJyArIG1hdGVyaWFsLl9pZCArICcoKSB7XFxuICcgICsgY29tcGlsZWQuZ2xzbCArICcgXFxufScpO1xuICAgICAgICB0aGlzLmFwcGxpY2F0aW9uVmVydC5wdXNoKCdpZiAoaW50KGFicyhJRC54KSkgPT0gJyArIG1hdGVyaWFsLl9pZCArICcpIHJldHVybiBmYV8nICsgbWF0ZXJpYWwuX2lkICsgJygpOycpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnJlc2V0UHJvZ3JhbSgpO1xufTtcblxuLyoqXG4gKiBDbGVhcnMgYWxsIGNhY2hlZCB1bmlmb3JtcyBhbmQgYXR0cmlidXRlIGxvY2F0aW9ucy4gIEFzc2VtYmxlc1xuICogbmV3IGZyYWdtZW50IGFuZCB2ZXJ0ZXggc2hhZGVycyBhbmQgYmFzZWQgb24gbWF0ZXJpYWwgZnJvbVxuICogY3VycmVudGx5IHJlZ2lzdGVyZWQgbWF0ZXJpYWxzLiAgQXR0YWNoZXMgc2FpZCBzaGFkZXJzIHRvIG5ld1xuICogc2hhZGVyIHByb2dyYW0gYW5kIHVwb24gc3VjY2VzcyBsaW5rcyBwcm9ncmFtIHRvIHRoZSBXZWJHTFxuICogY29udGV4dC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7UHJvZ3JhbX0gQ3VycmVudCBwcm9ncmFtLlxuICovXG5Qcm9ncmFtLnByb3RvdHlwZS5yZXNldFByb2dyYW0gPSBmdW5jdGlvbiByZXNldFByb2dyYW0oKSB7XG4gICAgdmFyIHZlcnRleEhlYWRlciA9IFtoZWFkZXJdO1xuICAgIHZhciBmcmFnbWVudEhlYWRlciA9IFtoZWFkZXJdO1xuXG4gICAgdmFyIGZyYWdtZW50U291cmNlO1xuICAgIHZhciB2ZXJ0ZXhTb3VyY2U7XG4gICAgdmFyIHByb2dyYW07XG4gICAgdmFyIG5hbWU7XG4gICAgdmFyIHZhbHVlO1xuICAgIHZhciBpO1xuXG4gICAgdGhpcy51bmlmb3JtTG9jYXRpb25zICAgPSBbXTtcbiAgICB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9ucyA9IHt9O1xuXG4gICAgdGhpcy51bmlmb3JtVHlwZXMgPSB7fTtcblxuICAgIHRoaXMuYXR0cmlidXRlTmFtZXMgPSBjbG9uZShhdHRyaWJ1dGVzLmtleXMpO1xuICAgIHRoaXMuYXR0cmlidXRlVmFsdWVzID0gY2xvbmUoYXR0cmlidXRlcy52YWx1ZXMpO1xuXG4gICAgdGhpcy52YXJ5aW5nTmFtZXMgPSBjbG9uZSh2YXJ5aW5ncy5rZXlzKTtcbiAgICB0aGlzLnZhcnlpbmdWYWx1ZXMgPSBjbG9uZSh2YXJ5aW5ncy52YWx1ZXMpO1xuXG4gICAgdGhpcy51bmlmb3JtTmFtZXMgPSBjbG9uZSh1bmlmb3Jtcy5rZXlzKTtcbiAgICB0aGlzLnVuaWZvcm1WYWx1ZXMgPSBjbG9uZSh1bmlmb3Jtcy52YWx1ZXMpO1xuXG4gICAgdGhpcy5mbGFnZ2VkVW5pZm9ybXMgPSBbXTtcbiAgICB0aGlzLmNhY2hlZFVuaWZvcm1zID0ge307XG5cbiAgICBmcmFnbWVudEhlYWRlci5wdXNoKCd1bmlmb3JtIHNhbXBsZXIyRCB1X3RleHR1cmVzWzddO1xcbicpO1xuXG4gICAgaWYgKHRoaXMuYXBwbGljYXRpb25WZXJ0Lmxlbmd0aCkge1xuICAgICAgICB2ZXJ0ZXhIZWFkZXIucHVzaCgndW5pZm9ybSBzYW1wbGVyMkQgdV90ZXh0dXJlc1s3XTtcXG4nKTtcbiAgICB9XG5cbiAgICBmb3IoaSA9IDA7IGkgPCB0aGlzLnVuaWZvcm1OYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBuYW1lID0gdGhpcy51bmlmb3JtTmFtZXNbaV07XG4gICAgICAgIHZhbHVlID0gdGhpcy51bmlmb3JtVmFsdWVzW2ldO1xuICAgICAgICB2ZXJ0ZXhIZWFkZXIucHVzaCgndW5pZm9ybSAnICsgVFlQRVNbdmFsdWUubGVuZ3RoXSArIG5hbWUgKyAnO1xcbicpO1xuICAgICAgICBmcmFnbWVudEhlYWRlci5wdXNoKCd1bmlmb3JtICcgKyBUWVBFU1t2YWx1ZS5sZW5ndGhdICsgbmFtZSArICc7XFxuJyk7XG4gICAgfVxuXG4gICAgZm9yKGkgPSAwOyBpIDwgdGhpcy5hdHRyaWJ1dGVOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBuYW1lID0gdGhpcy5hdHRyaWJ1dGVOYW1lc1tpXTtcbiAgICAgICAgdmFsdWUgPSB0aGlzLmF0dHJpYnV0ZVZhbHVlc1tpXTtcbiAgICAgICAgdmVydGV4SGVhZGVyLnB1c2goJ2F0dHJpYnV0ZSAnICsgVFlQRVNbdmFsdWUubGVuZ3RoXSArIG5hbWUgKyAnO1xcbicpO1xuICAgIH1cblxuICAgIGZvcihpID0gMDsgaSA8IHRoaXMudmFyeWluZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5hbWUgPSB0aGlzLnZhcnlpbmdOYW1lc1tpXTtcbiAgICAgICAgdmFsdWUgPSB0aGlzLnZhcnlpbmdWYWx1ZXNbaV07XG4gICAgICAgIHZlcnRleEhlYWRlci5wdXNoKCd2YXJ5aW5nICcgKyBUWVBFU1t2YWx1ZS5sZW5ndGhdICArIG5hbWUgKyAnO1xcbicpO1xuICAgICAgICBmcmFnbWVudEhlYWRlci5wdXNoKCd2YXJ5aW5nICcgKyBUWVBFU1t2YWx1ZS5sZW5ndGhdICsgbmFtZSArICc7XFxuJyk7XG4gICAgfVxuXG4gICAgdmVydGV4U291cmNlID0gdmVydGV4SGVhZGVyLmpvaW4oJycpICsgdmVydGV4V3JhcHBlclxuICAgICAgICAucmVwbGFjZSgnI3ZlcnRfZGVmaW5pdGlvbnMnLCB0aGlzLmRlZmluaXRpb25WZXJ0LmpvaW4oJ1xcbicpKVxuICAgICAgICAucmVwbGFjZSgnI3ZlcnRfYXBwbGljYXRpb25zJywgdGhpcy5hcHBsaWNhdGlvblZlcnQuam9pbignXFxuJykpO1xuXG4gICAgZnJhZ21lbnRTb3VyY2UgPSBmcmFnbWVudEhlYWRlci5qb2luKCcnKSArIGZyYWdtZW50V3JhcHBlclxuICAgICAgICAucmVwbGFjZSgnI3ZlYzNfZGVmaW5pdGlvbnMnLCB0aGlzLmRlZmluaXRpb25WZWMzLmpvaW4oJ1xcbicpKVxuICAgICAgICAucmVwbGFjZSgnI3ZlYzNfYXBwbGljYXRpb25zJywgdGhpcy5hcHBsaWNhdGlvblZlYzMuam9pbignXFxuJykpXG4gICAgICAgIC5yZXBsYWNlKCcjdmVjNF9kZWZpbml0aW9ucycsIHRoaXMuZGVmaW5pdGlvblZlYzQuam9pbignXFxuJykpXG4gICAgICAgIC5yZXBsYWNlKCcjdmVjNF9hcHBsaWNhdGlvbnMnLCB0aGlzLmFwcGxpY2F0aW9uVmVjNC5qb2luKCdcXG4nKSlcbiAgICAgICAgLnJlcGxhY2UoJyNmbG9hdF9kZWZpbml0aW9ucycsIHRoaXMuZGVmaW5pdGlvbkZsb2F0LmpvaW4oJ1xcbicpKVxuICAgICAgICAucmVwbGFjZSgnI2Zsb2F0X2FwcGxpY2F0aW9ucycsIHRoaXMuYXBwbGljYXRpb25GbG9hdC5qb2luKCdcXG4nKSk7XG5cbiAgICBwcm9ncmFtID0gdGhpcy5nbC5jcmVhdGVQcm9ncmFtKCk7XG5cbiAgICB0aGlzLmdsLmF0dGFjaFNoYWRlcihcbiAgICAgICAgcHJvZ3JhbSxcbiAgICAgICAgdGhpcy5jb21waWxlU2hhZGVyKHRoaXMuZ2wuY3JlYXRlU2hhZGVyKFZFUlRFWF9TSEFERVIpLCB2ZXJ0ZXhTb3VyY2UpXG4gICAgKTtcblxuICAgIHRoaXMuZ2wuYXR0YWNoU2hhZGVyKFxuICAgICAgICBwcm9ncmFtLFxuICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXIodGhpcy5nbC5jcmVhdGVTaGFkZXIoRlJBR01FTlRfU0hBREVSKSwgZnJhZ21lbnRTb3VyY2UpXG4gICAgKTtcblxuICAgIHRoaXMuZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG5cbiAgICBpZiAoISB0aGlzLmdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgdGhpcy5nbC5MSU5LX1NUQVRVUykpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignbGluayBlcnJvcjogJyArIHRoaXMuZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSkpO1xuICAgICAgICB0aGlzLnByb2dyYW0gPSBudWxsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICAgICAgdGhpcy5nbC51c2VQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRVbmlmb3Jtcyh0aGlzLnVuaWZvcm1OYW1lcywgdGhpcy51bmlmb3JtVmFsdWVzKTtcblxuICAgIHZhciB0ZXh0dXJlTG9jYXRpb24gPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnByb2dyYW0sICd1X3RleHR1cmVzWzBdJyk7XG4gICAgdGhpcy5nbC51bmlmb3JtMWl2KHRleHR1cmVMb2NhdGlvbiwgWzAsIDEsIDIsIDMsIDQsIDUsIDZdKTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDb21wYXJlcyB0aGUgdmFsdWUgb2YgdGhlIGlucHV0IHVuaWZvcm0gdmFsdWUgYWdhaW5zdFxuICogdGhlIGNhY2hlZCB2YWx1ZSBzdG9yZWQgb24gdGhlIFByb2dyYW0gY2xhc3MuICBVcGRhdGVzIGFuZFxuICogY3JlYXRlcyBuZXcgZW50cmllcyBpbiB0aGUgY2FjaGUgd2hlbiBuZWNlc3NhcnkuXG4gKlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IHRhcmdldE5hbWUgS2V5IG9mIHVuaWZvcm0gc3BlYyBiZWluZyBldmFsdWF0ZWQuXG4gKiBAcGFyYW0ge051bWJlcnxBcnJheX0gdmFsdWUgVmFsdWUgb2YgdW5pZm9ybSBzcGVjIGJlaW5nIGV2YWx1YXRlZC5cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSBib29sZWFuIEluZGljYXRpbmcgd2hldGhlciB0aGUgdW5pZm9ybSBiZWluZyBzZXQgaXMgY2FjaGVkLlxuICovXG5Qcm9ncmFtLnByb3RvdHlwZS51bmlmb3JtSXNDYWNoZWQgPSBmdW5jdGlvbih0YXJnZXROYW1lLCB2YWx1ZSkge1xuICAgIGlmKHRoaXMuY2FjaGVkVW5pZm9ybXNbdGFyZ2V0TmFtZV0gPT0gbnVsbCkge1xuICAgICAgICBpZiAodmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmNhY2hlZFVuaWZvcm1zW3RhcmdldE5hbWVdID0gbmV3IEZsb2F0MzJBcnJheSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNhY2hlZFVuaWZvcm1zW3RhcmdldE5hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIGlmICh2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGkgPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIGlmKHZhbHVlW2ldICE9PSB0aGlzLmNhY2hlZFVuaWZvcm1zW3RhcmdldE5hbWVdW2ldKSB7XG4gICAgICAgICAgICAgICAgaSA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZShpLS0pIHRoaXMuY2FjaGVkVW5pZm9ybXNbdGFyZ2V0TmFtZV1baV0gPSB2YWx1ZVtpXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlbHNlIGlmICh0aGlzLmNhY2hlZFVuaWZvcm1zW3RhcmdldE5hbWVdICE9PSB2YWx1ZSkge1xuICAgICAgICB0aGlzLmNhY2hlZFVuaWZvcm1zW3RhcmdldE5hbWVdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogSGFuZGxlcyBhbGwgcGFzc2luZyBvZiB1bmlmb3JtcyB0byBXZWJHTCBkcmF3aW5nIGNvbnRleHQuICBUaGlzXG4gKiBmdW5jdGlvbiB3aWxsIGZpbmQgdGhlIHVuaWZvcm0gbG9jYXRpb24gYW5kIHRoZW4sIGJhc2VkIG9uXG4gKiBhIHR5cGUgaW5mZXJyZWQgZnJvbSB0aGUgamF2YXNjcmlwdCB2YWx1ZSBvZiB0aGUgdW5pZm9ybSwgaXQgd2lsbCBjYWxsXG4gKiB0aGUgYXBwcm9wcmlhdGUgZnVuY3Rpb24gdG8gcGFzcyB0aGUgdW5pZm9ybSB0byBXZWJHTC4gIEZpbmFsbHksXG4gKiBzZXRVbmlmb3JtcyB3aWxsIGl0ZXJhdGUgdGhyb3VnaCB0aGUgcGFzc2VkIGluIHNoYWRlckNodW5rcyAoaWYgYW55KVxuICogYW5kIHNldCB0aGUgYXBwcm9wcmlhdGUgdW5pZm9ybXMgdG8gc3BlY2lmeSB3aGljaCBjaHVua3MgdG8gdXNlLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7QXJyYXl9IHVuaWZvcm1OYW1lcyBBcnJheSBjb250YWluaW5nIHRoZSBrZXlzIG9mIGFsbCB1bmlmb3JtcyB0byBiZSBzZXQuXG4gKiBAcGFyYW0ge0FycmF5fSB1bmlmb3JtVmFsdWUgQXJyYXkgY29udGFpbmluZyB0aGUgdmFsdWVzIG9mIGFsbCB1bmlmb3JtcyB0byBiZSBzZXQuXG4gKlxuICogQHJldHVybiB7UHJvZ3JhbX0gQ3VycmVudCBwcm9ncmFtLlxuICovXG5Qcm9ncmFtLnByb3RvdHlwZS5zZXRVbmlmb3JtcyA9IGZ1bmN0aW9uICh1bmlmb3JtTmFtZXMsIHVuaWZvcm1WYWx1ZSkge1xuICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgdmFyIGxvY2F0aW9uO1xuICAgIHZhciB2YWx1ZTtcbiAgICB2YXIgbmFtZTtcbiAgICB2YXIgbGVuO1xuICAgIHZhciBpO1xuXG4gICAgaWYgKCF0aGlzLnByb2dyYW0pIHJldHVybiB0aGlzO1xuXG4gICAgbGVuID0gdW5pZm9ybU5hbWVzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbmFtZSA9IHVuaWZvcm1OYW1lc1tpXTtcbiAgICAgICAgdmFsdWUgPSB1bmlmb3JtVmFsdWVbaV07XG5cbiAgICAgICAgLy8gUmV0cmVpdmUgdGhlIGNhY2hlZCBsb2NhdGlvbiBvZiB0aGUgdW5pZm9ybSxcbiAgICAgICAgLy8gcmVxdWVzdGluZyBhIG5ldyBsb2NhdGlvbiBmcm9tIHRoZSBXZWJHTCBjb250ZXh0XG4gICAgICAgIC8vIGlmIGl0IGRvZXMgbm90IHlldCBleGlzdC5cblxuICAgICAgICBsb2NhdGlvbiA9IHRoaXMudW5pZm9ybUxvY2F0aW9uc1tuYW1lXTtcblxuICAgICAgICBpZiAobG9jYXRpb24gPT09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5wcm9ncmFtLCBuYW1lKTtcbiAgICAgICAgICAgIHRoaXMudW5pZm9ybUxvY2F0aW9uc1tuYW1lXSA9IGxvY2F0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGFscmVhZHkgc2V0IGZvciB0aGVcbiAgICAgICAgLy8gZ2l2ZW4gdW5pZm9ybS5cblxuICAgICAgICBpZiAodGhpcy51bmlmb3JtSXNDYWNoZWQobmFtZSwgdmFsdWUpKSBjb250aW51ZTtcblxuICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIGNvcnJlY3QgZnVuY3Rpb24gYW5kIHBhc3MgdGhlIHVuaWZvcm1cbiAgICAgICAgLy8gdmFsdWUgdG8gV2ViR0wuXG5cbiAgICAgICAgaWYgKCF0aGlzLnVuaWZvcm1UeXBlc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhpcy51bmlmb3JtVHlwZXNbbmFtZV0gPSB0aGlzLmdldFVuaWZvcm1UeXBlRnJvbVZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGwgdW5pZm9ybSBzZXR0ZXIgZnVuY3Rpb24gb24gV2ViR0wgY29udGV4dCB3aXRoIGNvcnJlY3QgdmFsdWVcblxuICAgICAgICBzd2l0Y2ggKHRoaXMudW5pZm9ybVR5cGVzW25hbWVdKSB7XG4gICAgICAgICAgICBjYXNlICd1bmlmb3JtNGZ2JzogIGdsLnVuaWZvcm00ZnYobG9jYXRpb24sIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd1bmlmb3JtM2Z2JzogIGdsLnVuaWZvcm0zZnYobG9jYXRpb24sIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd1bmlmb3JtMmZ2JzogIGdsLnVuaWZvcm0yZnYobG9jYXRpb24sIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd1bmlmb3JtMWZ2JzogIGdsLnVuaWZvcm0xZnYobG9jYXRpb24sIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd1bmlmb3JtMWYnIDogIGdsLnVuaWZvcm0xZihsb2NhdGlvbiwgdmFsdWUpOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3VuaWZvcm1NYXRyaXgzZnYnOiBnbC51bmlmb3JtTWF0cml4M2Z2KGxvY2F0aW9uLCBmYWxzZSwgdmFsdWUpOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3VuaWZvcm1NYXRyaXg0ZnYnOiBnbC51bmlmb3JtTWF0cml4NGZ2KGxvY2F0aW9uLCBmYWxzZSwgdmFsdWUpOyBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJbmZlcnMgdW5pZm9ybSBzZXR0ZXIgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIHRoZSBXZWJHTCBjb250ZXh0LCBiYXNlZFxuICogb24gYW4gaW5wdXQgdmFsdWUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfEFycmF5fSB2YWx1ZSBWYWx1ZSBmcm9tIHdoaWNoIHVuaWZvcm0gdHlwZSBpcyBpbmZlcnJlZC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdW5pZm9ybSBmdW5jdGlvbiBmb3IgZ2l2ZW4gdmFsdWUuXG4gKi9cblByb2dyYW0ucHJvdG90eXBlLmdldFVuaWZvcm1UeXBlRnJvbVZhbHVlID0gZnVuY3Rpb24gZ2V0VW5pZm9ybVR5cGVGcm9tVmFsdWUodmFsdWUpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgdmFsdWUgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgc3dpdGNoICh2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMTogIHJldHVybiAndW5pZm9ybTFmdic7XG4gICAgICAgICAgICBjYXNlIDI6ICByZXR1cm4gJ3VuaWZvcm0yZnYnO1xuICAgICAgICAgICAgY2FzZSAzOiAgcmV0dXJuICd1bmlmb3JtM2Z2JztcbiAgICAgICAgICAgIGNhc2UgNDogIHJldHVybiAndW5pZm9ybTRmdic7XG4gICAgICAgICAgICBjYXNlIDk6ICByZXR1cm4gJ3VuaWZvcm1NYXRyaXgzZnYnO1xuICAgICAgICAgICAgY2FzZSAxNjogcmV0dXJuICd1bmlmb3JtTWF0cml4NGZ2JztcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICghaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZSkpICYmIGlzRmluaXRlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gJ3VuaWZvcm0xZic7XG4gICAgfVxuXG4gICAgdGhyb3cgJ2NhbnQgbG9hZCB1bmlmb3JtIFwiJyArIG5hbWUgKyAnXCIgd2l0aCB2YWx1ZTonICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xufTtcblxuLyoqXG4gKiBBZGRzIHNoYWRlciBzb3VyY2UgdG8gc2hhZGVyIGFuZCBjb21waWxlcyB0aGUgaW5wdXQgc2hhZGVyLiAgQ2hlY2tzXG4gKiBjb21waWxlIHN0YXR1cyBhbmQgbG9ncyBlcnJvciBpZiBuZWNlc3NhcnkuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBzaGFkZXIgUHJvZ3JhbSB0byBiZSBjb21waWxlZC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgU291cmNlIHRvIGJlIHVzZWQgaW4gdGhlIHNoYWRlci5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IENvbXBpbGVkIHNoYWRlci5cbiAqL1xuUHJvZ3JhbS5wcm90b3R5cGUuY29tcGlsZVNoYWRlciA9IGZ1bmN0aW9uIGNvbXBpbGVTaGFkZXIoc2hhZGVyLCBzb3VyY2UpIHtcbiAgICB2YXIgaSA9IDE7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmRlYnVnKSB7XG4gICAgICAgIHRoaXMuZ2wuY29tcGlsZVNoYWRlciA9IERlYnVnLmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5nbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xuICAgIHRoaXMuZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xuICAgIGlmICghdGhpcy5nbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCB0aGlzLmdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdjb21waWxlIGVycm9yOiAnICsgdGhpcy5nbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCcxOiAnICsgc291cmNlLnJlcGxhY2UoL1xcbi9nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1xcbicgKyAoaSs9MSkgKyAnOiAnO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNoYWRlcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvZ3JhbTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUZXh0dXJlIGlzIGEgcHJpdmF0ZSBjbGFzcyB0aGF0IHN0b3JlcyBpbWFnZSBkYXRhXG4gKiB0byBiZSBhY2Nlc3NlZCBmcm9tIGEgc2hhZGVyIG9yIHVzZWQgYXMgYSByZW5kZXIgdGFyZ2V0LlxuICpcbiAqIEBjbGFzcyBUZXh0dXJlXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge0dMfSBnbCBHTFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9uc1xuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIFRleHR1cmUoZ2wsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLmlkID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgIHRoaXMud2lkdGggPSBvcHRpb25zLndpZHRoIHx8IDA7XG4gICAgdGhpcy5oZWlnaHQgPSBvcHRpb25zLmhlaWdodCB8fCAwO1xuICAgIHRoaXMubWlwbWFwID0gb3B0aW9ucy5taXBtYXA7XG4gICAgdGhpcy5mb3JtYXQgPSBvcHRpb25zLmZvcm1hdCB8fCAnUkdCQSc7XG4gICAgdGhpcy50eXBlID0gb3B0aW9ucy50eXBlIHx8ICdVTlNJR05FRF9CWVRFJztcbiAgICB0aGlzLmdsID0gZ2w7XG5cbiAgICB0aGlzLmJpbmQoKTtcblxuICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIG9wdGlvbnMuZmxpcFlXZWJnbCB8fCBmYWxzZSk7XG4gICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCBvcHRpb25zLnByZW11bHRpcGx5QWxwaGFXZWJnbCB8fCBmYWxzZSk7XG5cbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2xbb3B0aW9ucy5tYWdGaWx0ZXJdIHx8IGdsLk5FQVJFU1QpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbFtvcHRpb25zLm1pbkZpbHRlcl0gfHwgZ2wuTkVBUkVTVCk7XG5cbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbFtvcHRpb25zLndyYXBTXSB8fCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbFtvcHRpb25zLndyYXBUXSB8fCBnbC5DTEFNUF9UT19FREdFKTtcbn1cblxuLyoqXG4gKiBCaW5kcyB0aGlzIHRleHR1cmUgYXMgdGhlIHNlbGVjdGVkIHRhcmdldC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgdGV4dHVyZSBpbnN0YW5jZS5cbiAqL1xuVGV4dHVyZS5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIGJpbmQoKSB7XG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBFcmFzZXMgdGhlIHRleHR1cmUgZGF0YSBpbiB0aGUgZ2l2ZW4gdGV4dHVyZSBzbG90LlxuICpcbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCB0ZXh0dXJlIGluc3RhbmNlLlxuICovXG5UZXh0dXJlLnByb3RvdHlwZS51bmJpbmQgPSBmdW5jdGlvbiB1bmJpbmQoKSB7XG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXBsYWNlcyB0aGUgaW1hZ2UgZGF0YSBpbiB0aGUgdGV4dHVyZSB3aXRoIHRoZSBnaXZlbiBpbWFnZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtJbWFnZX0gICBpbWcgICAgIFRoZSBpbWFnZSBvYmplY3QgdG8gdXBsb2FkIHBpeGVsIGRhdGEgZnJvbS5cbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICBDdXJyZW50IHRleHR1cmUgaW5zdGFuY2UuXG4gKi9cblRleHR1cmUucHJvdG90eXBlLnNldEltYWdlID0gZnVuY3Rpb24gc2V0SW1hZ2UoaW1nKSB7XG4gICAgdGhpcy5nbC50ZXhJbWFnZTJEKHRoaXMuZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5nbFt0aGlzLmZvcm1hdF0sIHRoaXMuZ2xbdGhpcy5mb3JtYXRdLCB0aGlzLmdsW3RoaXMudHlwZV0sIGltZyk7XG4gICAgaWYgKHRoaXMubWlwbWFwKSB0aGlzLmdsLmdlbmVyYXRlTWlwbWFwKHRoaXMuZ2wuVEVYVFVSRV8yRCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlcGxhY2VzIHRoZSBpbWFnZSBkYXRhIGluIHRoZSB0ZXh0dXJlIHdpdGggYW4gYXJyYXkgb2YgYXJiaXRyYXJ5IGRhdGEuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9ICAgaW5wdXQgICBBcnJheSB0byBiZSBzZXQgYXMgZGF0YSB0byB0ZXh0dXJlLlxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgIEN1cnJlbnQgdGV4dHVyZSBpbnN0YW5jZS5cbiAqL1xuVGV4dHVyZS5wcm90b3R5cGUuc2V0QXJyYXkgPSBmdW5jdGlvbiBzZXRBcnJheShpbnB1dCkge1xuICAgIHRoaXMuZ2wudGV4SW1hZ2UyRCh0aGlzLmdsLlRFWFRVUkVfMkQsIDAsIHRoaXMuZ2xbdGhpcy5mb3JtYXRdLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgMCwgdGhpcy5nbFt0aGlzLmZvcm1hdF0sIHRoaXMuZ2xbdGhpcy50eXBlXSwgaW5wdXQpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBEdW1wcyB0aGUgcmdiLXBpeGVsIGNvbnRlbnRzIG9mIGEgdGV4dHVyZSBpbnRvIGFuIGFycmF5IGZvciBkZWJ1Z2dpbmcgcHVycG9zZXNcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggICAgICAgIHgtb2Zmc2V0IGJldHdlZW4gdGV4dHVyZSBjb29yZGluYXRlcyBhbmQgc25hcHNob3RcbiAqIEBwYXJhbSB7TnVtYmVyfSB5ICAgICAgICB5LW9mZnNldCBiZXR3ZWVuIHRleHR1cmUgY29vcmRpbmF0ZXMgYW5kIHNuYXBzaG90XG4gKiBAcGFyYW0ge051bWJlcn0gd2lkdGggICAgeC1kZXB0aCBvZiB0aGUgc25hcHNob3RcbiAqIEBwYXJhbSB7TnVtYmVyfSBoZWlnaHQgICB5LWRlcHRoIG9mIHRoZSBzbmFwc2hvdFxuICpcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICBBbiBhcnJheSBvZiB0aGUgcGl4ZWxzIGNvbnRhaW5lZCBpbiB0aGUgc25hcHNob3QuXG4gKi9cblRleHR1cmUucHJvdG90eXBlLnJlYWRCYWNrID0gZnVuY3Rpb24gcmVhZEJhY2soeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgdmFyIHBpeGVscztcbiAgICB4ID0geCB8fCAwO1xuICAgIHkgPSB5IHx8IDA7XG4gICAgd2lkdGggPSB3aWR0aCB8fCB0aGlzLndpZHRoO1xuICAgIGhlaWdodCA9IGhlaWdodCB8fCB0aGlzLmhlaWdodDtcbiAgICB2YXIgZmIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZmIpO1xuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgdGhpcy5pZCwgMCk7XG4gICAgaWYgKGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpID09PSBnbC5GUkFNRUJVRkZFUl9DT01QTEVURSkge1xuICAgICAgICBwaXhlbHMgPSBuZXcgVWludDhBcnJheSh3aWR0aCAqIGhlaWdodCAqIDQpO1xuICAgICAgICBnbC5yZWFkUGl4ZWxzKHgsIHksIHdpZHRoLCBoZWlnaHQsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIHBpeGVscyk7XG4gICAgfVxuICAgIHJldHVybiBwaXhlbHM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHR1cmU7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVGV4dHVyZSA9IHJlcXVpcmUoJy4vVGV4dHVyZScpO1xudmFyIGNyZWF0ZUNoZWNrZXJib2FyZCA9IHJlcXVpcmUoJy4vY3JlYXRlQ2hlY2tlcmJvYXJkJyk7XG5cbi8qKlxuICogSGFuZGxlcyBsb2FkaW5nLCBiaW5kaW5nLCBhbmQgcmVzYW1wbGluZyBvZiB0ZXh0dXJlcyBmb3IgV2ViR0xSZW5kZXJlci5cbiAqXG4gKiBAY2xhc3MgVGV4dHVyZU1hbmFnZXJcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7V2ViR0xfQ29udGV4dH0gZ2wgQ29udGV4dCB1c2VkIHRvIGNyZWF0ZSBhbmQgYmluZCB0ZXh0dXJlcy5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBUZXh0dXJlTWFuYWdlcihnbCkge1xuICAgIHRoaXMucmVnaXN0cnkgPSBbXTtcbiAgICB0aGlzLl9uZWVkc1Jlc2FtcGxlID0gW107XG5cbiAgICB0aGlzLl9hY3RpdmVUZXh0dXJlID0gMDtcbiAgICB0aGlzLl9ib3VuZFRleHR1cmUgPSBudWxsO1xuXG4gICAgdGhpcy5fY2hlY2tlcmJvYXJkID0gY3JlYXRlQ2hlY2tlcmJvYXJkKCk7XG5cbiAgICB0aGlzLmdsID0gZ2w7XG59XG5cbi8qKlxuICogVXBkYXRlIGZ1bmN0aW9uIHVzZWQgYnkgV2ViR0xSZW5kZXJlciB0byBxdWV1ZSByZXNhbXBsZXMgb25cbiAqIHJlZ2lzdGVyZWQgdGV4dHVyZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSAgICAgIHRpbWUgICAgVGltZSBpbiBtaWxsaXNlY29uZHMgYWNjb3JkaW5nIHRvIHRoZSBjb21wb3NpdG9yLlxuICogQHJldHVybiB7dW5kZWZpbmVkfSAgICAgICAgICB1bmRlZmluZWRcbiAqL1xuVGV4dHVyZU1hbmFnZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSh0aW1lKSB7XG4gICAgdmFyIHJlZ2lzdHJ5TGVuZ3RoID0gdGhpcy5yZWdpc3RyeS5sZW5ndGg7XG5cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHJlZ2lzdHJ5TGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHRleHR1cmUgPSB0aGlzLnJlZ2lzdHJ5W2ldO1xuXG4gICAgICAgIGlmICh0ZXh0dXJlICYmIHRleHR1cmUuaXNMb2FkZWQgJiYgdGV4dHVyZS5yZXNhbXBsZVJhdGUpIHtcbiAgICAgICAgICAgIGlmICghdGV4dHVyZS5sYXN0UmVzYW1wbGUgfHwgdGltZSAtIHRleHR1cmUubGFzdFJlc2FtcGxlID4gdGV4dHVyZS5yZXNhbXBsZVJhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX25lZWRzUmVzYW1wbGVbdGV4dHVyZS5pZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbmVlZHNSZXNhbXBsZVt0ZXh0dXJlLmlkXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUubGFzdFJlc2FtcGxlID0gdGltZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBzcGVjIGFuZCBjcmVhdGVzIGEgdGV4dHVyZSBiYXNlZCBvbiBnaXZlbiB0ZXh0dXJlIGRhdGEuXG4gKiBIYW5kbGVzIGxvYWRpbmcgYXNzZXRzIGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICBpbnB1dCAgIE9iamVjdCBjb250YWluaW5nIHRleHR1cmUgaWQsIHRleHR1cmUgZGF0YVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIGFuZCBvcHRpb25zIHVzZWQgdG8gZHJhdyB0ZXh0dXJlLlxuICogQHBhcmFtIHtOdW1iZXJ9ICBzbG90ICAgIFRleHR1cmUgc2xvdCB0byBiaW5kIGdlbmVyYXRlZCB0ZXh0dXJlIHRvLlxuICogQHJldHVybiB7dW5kZWZpbmVkfSAgICAgIHVuZGVmaW5lZFxuICovXG5UZXh0dXJlTWFuYWdlci5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbiByZWdpc3RlcihpbnB1dCwgc2xvdCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgc291cmNlID0gaW5wdXQuZGF0YTtcbiAgICB2YXIgdGV4dHVyZUlkID0gaW5wdXQuaWQ7XG4gICAgdmFyIG9wdGlvbnMgPSBpbnB1dC5vcHRpb25zIHx8IHt9O1xuICAgIHZhciB0ZXh0dXJlID0gdGhpcy5yZWdpc3RyeVt0ZXh0dXJlSWRdO1xuICAgIHZhciBzcGVjO1xuXG4gICAgaWYgKCF0ZXh0dXJlKSB7XG5cbiAgICAgICAgdGV4dHVyZSA9IG5ldyBUZXh0dXJlKHRoaXMuZ2wsIG9wdGlvbnMpO1xuICAgICAgICB0ZXh0dXJlLnNldEltYWdlKHRoaXMuX2NoZWNrZXJib2FyZCk7XG5cbiAgICAgICAgLy8gQWRkIHRleHR1cmUgdG8gcmVnaXN0cnlcblxuICAgICAgICBzcGVjID0gdGhpcy5yZWdpc3RyeVt0ZXh0dXJlSWRdID0ge1xuICAgICAgICAgICAgcmVzYW1wbGVSYXRlOiBvcHRpb25zLnJlc2FtcGxlUmF0ZSB8fCBudWxsLFxuICAgICAgICAgICAgbGFzdFJlc2FtcGxlOiBudWxsLFxuICAgICAgICAgICAgaXNMb2FkZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdGV4dHVyZTogdGV4dHVyZSxcbiAgICAgICAgICAgIHNvdXJjZTogc291cmNlLFxuICAgICAgICAgICAgaWQ6IHRleHR1cmVJZCxcbiAgICAgICAgICAgIHNsb3Q6IHNsb3RcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBIYW5kbGUgYXJyYXlcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzb3VyY2UpIHx8IHNvdXJjZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgfHwgc291cmNlIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgICAgICAgICB0aGlzLmJpbmRUZXh0dXJlKHRleHR1cmVJZCk7XG4gICAgICAgICAgICB0ZXh0dXJlLnNldEFycmF5KHNvdXJjZSk7XG4gICAgICAgICAgICBzcGVjLmlzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSB2aWRlb1xuXG4gICAgICAgIGVsc2UgaWYgKHdpbmRvdyAmJiBzb3VyY2UgaW5zdGFuY2VvZiB3aW5kb3cuSFRNTFZpZGVvRWxlbWVudCkge1xuICAgICAgICAgICAgc291cmNlLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWRlZGRhdGEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5iaW5kVGV4dHVyZSh0ZXh0dXJlSWQpO1xuICAgICAgICAgICAgICAgIHRleHR1cmUuc2V0SW1hZ2Uoc291cmNlKTtcblxuICAgICAgICAgICAgICAgIHNwZWMuaXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNwZWMuc291cmNlID0gc291cmNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgaW1hZ2UgdXJsXG5cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHNvdXJjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGxvYWRJbWFnZShzb3VyY2UsIGZ1bmN0aW9uIChpbWcpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5iaW5kVGV4dHVyZSh0ZXh0dXJlSWQpO1xuICAgICAgICAgICAgICAgIHRleHR1cmUuc2V0SW1hZ2UoaW1nKTtcblxuICAgICAgICAgICAgICAgIHNwZWMuaXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNwZWMuc291cmNlID0gaW1nO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGV4dHVyZUlkO1xufTtcblxuLyoqXG4gKiBMb2FkcyBhbiBpbWFnZSBmcm9tIGEgc3RyaW5nIG9yIEltYWdlIG9iamVjdCBhbmQgZXhlY3V0ZXMgYSBjYWxsYmFjayBmdW5jdGlvbi5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gaW5wdXQgVGhlIGlucHV0IGltYWdlIGRhdGEgdG8gbG9hZCBhcyBhbiBhc3NldC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBmaXJlZCB3aGVuIHRoZSBpbWFnZSBoYXMgZmluaXNoZWQgbG9hZGluZy5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IEltYWdlIG9iamVjdCBiZWluZyBsb2FkZWQuXG4gKi9cbmZ1bmN0aW9uIGxvYWRJbWFnZSAoaW5wdXQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGltYWdlID0gKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycgPyBuZXcgSW1hZ2UoKSA6IGlucHV0KSB8fCB7fTtcbiAgICAgICAgaW1hZ2UuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcblxuICAgIGlmICghaW1hZ2Uuc3JjKSBpbWFnZS5zcmMgPSBpbnB1dDtcbiAgICBpZiAoIWltYWdlLmNvbXBsZXRlKSB7XG4gICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGltYWdlKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrKGltYWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW1hZ2U7XG59XG5cbi8qKlxuICogU2V0cyBhY3RpdmUgdGV4dHVyZSBzbG90IGFuZCBiaW5kcyB0YXJnZXQgdGV4dHVyZS4gIEFsc28gaGFuZGxlc1xuICogcmVzYW1wbGluZyB3aGVuIG5lY2Vzc2FyeS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IGlkIElkZW50aWZpZXIgdXNlZCB0byByZXRyZWl2ZSB0ZXh0dXJlIHNwZWNcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5UZXh0dXJlTWFuYWdlci5wcm90b3R5cGUuYmluZFRleHR1cmUgPSBmdW5jdGlvbiBiaW5kVGV4dHVyZShpZCkge1xuICAgIHZhciBzcGVjID0gdGhpcy5yZWdpc3RyeVtpZF07XG5cbiAgICBpZiAodGhpcy5fYWN0aXZlVGV4dHVyZSAhPT0gc3BlYy5zbG90KSB7XG4gICAgICAgIHRoaXMuZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkUwICsgc3BlYy5zbG90KTtcbiAgICAgICAgdGhpcy5fYWN0aXZlVGV4dHVyZSA9IHNwZWMuc2xvdDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fYm91bmRUZXh0dXJlICE9PSBpZCkge1xuICAgICAgICB0aGlzLl9ib3VuZFRleHR1cmUgPSBpZDtcbiAgICAgICAgc3BlYy50ZXh0dXJlLmJpbmQoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbmVlZHNSZXNhbXBsZVtzcGVjLmlkXSkge1xuXG4gICAgICAgIC8vIFRPRE86IEFjY291bnQgZm9yIHJlc2FtcGxpbmcgb2YgYXJyYXlzLlxuXG4gICAgICAgIHNwZWMudGV4dHVyZS5zZXRJbWFnZShzcGVjLnNvdXJjZSk7XG4gICAgICAgIHRoaXMuX25lZWRzUmVzYW1wbGVbc3BlYy5pZF0gPSBmYWxzZTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHR1cmVNYW5hZ2VyO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUHJvZ3JhbSA9IHJlcXVpcmUoJy4vUHJvZ3JhbScpO1xudmFyIEJ1ZmZlclJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi9CdWZmZXJSZWdpc3RyeScpO1xudmFyIFBsYW5lID0gcmVxdWlyZSgnLi4vd2ViZ2wtZ2VvbWV0cmllcy9wcmltaXRpdmVzL1BsYW5lJyk7XG52YXIgc29ydGVyID0gcmVxdWlyZSgnLi9yYWRpeFNvcnQnKTtcbnZhciBrZXlWYWx1ZVRvQXJyYXlzID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzL2tleVZhbHVlVG9BcnJheXMnKTtcbnZhciBUZXh0dXJlTWFuYWdlciA9IHJlcXVpcmUoJy4vVGV4dHVyZU1hbmFnZXInKTtcbnZhciBjb21waWxlTWF0ZXJpYWwgPSByZXF1aXJlKCcuL2NvbXBpbGVNYXRlcmlhbCcpO1xuXG52YXIgaWRlbnRpdHkgPSBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV07XG5cbnZhciBnbG9iYWxVbmlmb3JtcyA9IGtleVZhbHVlVG9BcnJheXMoe1xuICAgICd1X251bUxpZ2h0cyc6IDAsXG4gICAgJ3VfYW1iaWVudExpZ2h0JzogbmV3IEFycmF5KDMpLFxuICAgICd1X2xpZ2h0UG9zaXRpb24nOiBuZXcgQXJyYXkoMyksXG4gICAgJ3VfbGlnaHRDb2xvcic6IG5ldyBBcnJheSgzKSxcbiAgICAndV9wZXJzcGVjdGl2ZSc6IG5ldyBBcnJheSgxNiksXG4gICAgJ3VfdGltZSc6IDAsXG4gICAgJ3Vfdmlldyc6IG5ldyBBcnJheSgxNilcbn0pO1xuXG4vKipcbiAqIFdlYkdMUmVuZGVyZXIgaXMgYSBwcml2YXRlIGNsYXNzIHRoYXQgbWFuYWdlcyBhbGwgaW50ZXJhY3Rpb25zIHdpdGggdGhlIFdlYkdMXG4gKiBBUEkuIEVhY2ggZnJhbWUgaXQgcmVjZWl2ZXMgY29tbWFuZHMgZnJvbSB0aGUgY29tcG9zaXRvciBhbmQgdXBkYXRlcyBpdHNcbiAqIHJlZ2lzdHJpZXMgYWNjb3JkaW5nbHkuIFN1YnNlcXVlbnRseSwgdGhlIGRyYXcgZnVuY3Rpb24gaXMgY2FsbGVkIGFuZCB0aGVcbiAqIFdlYkdMUmVuZGVyZXIgaXNzdWVzIGRyYXcgY2FsbHMgZm9yIGFsbCBtZXNoZXMgaW4gaXRzIHJlZ2lzdHJ5LlxuICpcbiAqIEBjbGFzcyBXZWJHTFJlbmRlcmVyXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGNhbnZhcyBUaGUgRE9NIGVsZW1lbnQgdGhhdCBHTCB3aWxsIHBhaW50IGl0c2VsZiBvbnRvLlxuICogQHBhcmFtIHtDb21wb3NpdG9yfSBjb21wb3NpdG9yIENvbXBvc2l0b3IgdXNlZCBmb3IgcXVlcnlpbmcgdGhlIHRpbWUgZnJvbS5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBXZWJHTFJlbmRlcmVyKGNhbnZhcywgY29tcG9zaXRvcikge1xuICAgIGNhbnZhcy5jbGFzc0xpc3QuYWRkKCdmYW1vdXMtd2ViZ2wtcmVuZGVyZXInKTtcblxuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xuICAgIHRoaXMuY29tcG9zaXRvciA9IGNvbXBvc2l0b3I7XG5cbiAgICB2YXIgZ2wgPSB0aGlzLmdsID0gdGhpcy5nZXRXZWJHTENvbnRleHQodGhpcy5jYW52YXMpO1xuXG4gICAgZ2wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAwLjApO1xuICAgIGdsLnBvbHlnb25PZmZzZXQoMC4xLCAwLjEpO1xuICAgIGdsLmVuYWJsZShnbC5QT0xZR09OX09GRlNFVF9GSUxMKTtcbiAgICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICBnbC5kZXB0aEZ1bmMoZ2wuTEVRVUFMKTtcbiAgICBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBKTtcbiAgICBnbC5lbmFibGUoZ2wuQ1VMTF9GQUNFKTtcbiAgICBnbC5jdWxsRmFjZShnbC5CQUNLKTtcblxuICAgIHRoaXMubWVzaFJlZ2lzdHJ5ID0ge307XG4gICAgdGhpcy5tZXNoUmVnaXN0cnlLZXlzID0gW107XG5cbiAgICB0aGlzLmN1dG91dFJlZ2lzdHJ5ID0ge307XG5cbiAgICB0aGlzLmN1dG91dFJlZ2lzdHJ5S2V5cyA9IFtdO1xuXG4gICAgLyoqXG4gICAgICogTGlnaHRzXG4gICAgICovXG4gICAgdGhpcy5udW1MaWdodHMgPSAwO1xuICAgIHRoaXMuYW1iaWVudExpZ2h0Q29sb3IgPSBbMCwgMCwgMF07XG4gICAgdGhpcy5saWdodFJlZ2lzdHJ5ID0ge307XG4gICAgdGhpcy5saWdodFJlZ2lzdHJ5S2V5cyA9IFtdO1xuICAgIHRoaXMubGlnaHRQb3NpdGlvbnMgPSBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF07XG4gICAgdGhpcy5saWdodENvbG9ycyA9IFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXTtcblxuICAgIHRoaXMudGV4dHVyZU1hbmFnZXIgPSBuZXcgVGV4dHVyZU1hbmFnZXIoZ2wpO1xuICAgIHRoaXMudGV4Q2FjaGUgPSB7fTtcbiAgICB0aGlzLmJ1ZmZlclJlZ2lzdHJ5ID0gbmV3IEJ1ZmZlclJlZ2lzdHJ5KGdsKTtcbiAgICB0aGlzLnByb2dyYW0gPSBuZXcgUHJvZ3JhbShnbCwgeyBkZWJ1ZzogdHJ1ZSB9KTtcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgIGJvdW5kQXJyYXlCdWZmZXI6IG51bGwsXG4gICAgICAgIGJvdW5kRWxlbWVudEJ1ZmZlcjogbnVsbCxcbiAgICAgICAgbGFzdERyYXduOiBudWxsLFxuICAgICAgICBlbmFibGVkQXR0cmlidXRlczoge30sXG4gICAgICAgIGVuYWJsZWRBdHRyaWJ1dGVzS2V5czogW11cbiAgICB9O1xuXG4gICAgdGhpcy5yZXNvbHV0aW9uTmFtZSA9IFsndV9yZXNvbHV0aW9uJ107XG4gICAgdGhpcy5yZXNvbHV0aW9uVmFsdWVzID0gW107XG5cbiAgICB0aGlzLmNhY2hlZFNpemUgPSBbXTtcblxuICAgIC8qXG4gICAgVGhlIHByb2plY3Rpb25UcmFuc2Zvcm0gaGFzIHNvbWUgY29uc3RhbnQgY29tcG9uZW50cywgaS5lLiB0aGUgeiBzY2FsZSwgYW5kIHRoZSB4IGFuZCB5IHRyYW5zbGF0aW9uLlxuXG4gICAgVGhlIHogc2NhbGUga2VlcHMgdGhlIGZpbmFsIHogcG9zaXRpb24gb2YgYW55IHZlcnRleCB3aXRoaW4gdGhlIGNsaXAncyBkb21haW4gYnkgc2NhbGluZyBpdCBieSBhblxuICAgIGFyYml0cmFyaWx5IHNtYWxsIGNvZWZmaWNpZW50LiBUaGlzIGhhcyB0aGUgYWR2YW50YWdlIG9mIGJlaW5nIGEgdXNlZnVsIGRlZmF1bHQgaW4gdGhlIGV2ZW50IG9mIHRoZVxuICAgIHVzZXIgZm9yZ29pbmcgYSBuZWFyIGFuZCBmYXIgcGxhbmUsIGFuIGFsaWVuIGNvbnZlbnRpb24gaW4gZG9tIHNwYWNlIGFzIGluIERPTSBvdmVybGFwcGluZyBpc1xuICAgIGNvbmR1Y3RlZCB2aWEgcGFpbnRlcidzIGFsZ29yaXRobS5cblxuICAgIFRoZSB4IGFuZCB5IHRyYW5zbGF0aW9uIHRyYW5zZm9ybXMgdGhlIHdvcmxkIHNwYWNlIG9yaWdpbiB0byB0aGUgdG9wIGxlZnQgY29ybmVyIG9mIHRoZSBzY3JlZW4uXG5cbiAgICBUaGUgZmluYWwgY29tcG9uZW50ICh0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm1bMTVdKSBpcyBpbml0aWFsaXplZCBhcyAxIGJlY2F1c2UgY2VydGFpbiBwcm9qZWN0aW9uIG1vZGVscyxcbiAgICBlLmcuIHRoZSBXQzMgc3BlY2lmaWVkIG1vZGVsLCBrZWVwIHRoZSBYWSBwbGFuZSBhcyB0aGUgcHJvamVjdGlvbiBoeXBlcnBsYW5lLlxuICAgICovXG4gICAgdGhpcy5wcm9qZWN0aW9uVHJhbnNmb3JtID0gWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIC0wLjAwMDAwMSwgMCwgLTEsIDEsIDAsIDFdO1xuXG4gICAgLy8gVE9ETzogcmVtb3ZlIHRoaXMgaGFja1xuXG4gICAgdmFyIGN1dG91dCA9IHRoaXMuY3V0b3V0R2VvbWV0cnkgPSBuZXcgUGxhbmUoKTtcblxuICAgIHRoaXMuYnVmZmVyUmVnaXN0cnkuYWxsb2NhdGUoY3V0b3V0LnNwZWMuaWQsICdhX3BvcycsIGN1dG91dC5zcGVjLmJ1ZmZlclZhbHVlc1swXSwgMyk7XG4gICAgdGhpcy5idWZmZXJSZWdpc3RyeS5hbGxvY2F0ZShjdXRvdXQuc3BlYy5pZCwgJ2FfdGV4Q29vcmQnLCBjdXRvdXQuc3BlYy5idWZmZXJWYWx1ZXNbMV0sIDIpO1xuICAgIHRoaXMuYnVmZmVyUmVnaXN0cnkuYWxsb2NhdGUoY3V0b3V0LnNwZWMuaWQsICdhX25vcm1hbHMnLCBjdXRvdXQuc3BlYy5idWZmZXJWYWx1ZXNbMl0sIDMpO1xuICAgIHRoaXMuYnVmZmVyUmVnaXN0cnkuYWxsb2NhdGUoY3V0b3V0LnNwZWMuaWQsICdpbmRpY2VzJywgY3V0b3V0LnNwZWMuYnVmZmVyVmFsdWVzWzNdLCAxKTtcbn1cblxuLyoqXG4gKiBBdHRlbXB0cyB0byByZXRyZWl2ZSB0aGUgV2ViR0xSZW5kZXJlciBjb250ZXh0IHVzaW5nIHNldmVyYWxcbiAqIGFjY2Vzc29ycy4gRm9yIGJyb3dzZXIgY29tcGF0YWJpbGl0eS4gVGhyb3dzIG9uIGVycm9yLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gY2FudmFzIENhbnZhcyBlbGVtZW50IGZyb20gd2hpY2ggdGhlIGNvbnRleHQgaXMgcmV0cmVpdmVkXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBXZWJHTENvbnRleHQgb2YgY2FudmFzIGVsZW1lbnRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuZ2V0V2ViR0xDb250ZXh0ID0gZnVuY3Rpb24gZ2V0V2ViR0xDb250ZXh0KGNhbnZhcykge1xuICAgIHZhciBuYW1lcyA9IFsnd2ViZ2wnLCAnZXhwZXJpbWVudGFsLXdlYmdsJywgJ3dlYmtpdC0zZCcsICdtb3otd2ViZ2wnXTtcbiAgICB2YXIgY29udGV4dCA9IG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KG5hbWVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHZhciBtc2cgPSAnRXJyb3IgY3JlYXRpbmcgV2ViR0wgY29udGV4dDogJyArIGVycm9yLnByb3RvdHlwZS50b1N0cmluZygpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGV4dCA/IGNvbnRleHQgOiBmYWxzZTtcbn07XG5cbi8qKlxuICogQWRkcyBhIG5ldyBiYXNlIHNwZWMgdG8gdGhlIGxpZ2h0IHJlZ2lzdHJ5IGF0IGEgZ2l2ZW4gcGF0aC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIG5ldyBsaWdodCBpbiBsaWdodFJlZ2lzdHJ5XG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBOZXdseSBjcmVhdGVkIGxpZ2h0IHNwZWNcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuY3JlYXRlTGlnaHQgPSBmdW5jdGlvbiBjcmVhdGVMaWdodChwYXRoKSB7XG4gICAgdGhpcy5udW1MaWdodHMrKztcbiAgICB0aGlzLmxpZ2h0UmVnaXN0cnlLZXlzLnB1c2gocGF0aCk7XG4gICAgdGhpcy5saWdodFJlZ2lzdHJ5W3BhdGhdID0ge1xuICAgICAgICBjb2xvcjogWzAsIDAsIDBdLFxuICAgICAgICBwb3NpdGlvbjogWzAsIDAsIDBdXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5saWdodFJlZ2lzdHJ5W3BhdGhdO1xufTtcblxuLyoqXG4gKiBBZGRzIGEgbmV3IGJhc2Ugc3BlYyB0byB0aGUgbWVzaCByZWdpc3RyeSBhdCBhIGdpdmVuIHBhdGguXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiBuZXcgbWVzaCBpbiBtZXNoUmVnaXN0cnkuXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBOZXdseSBjcmVhdGVkIG1lc2ggc3BlYy5cbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuY3JlYXRlTWVzaCA9IGZ1bmN0aW9uIGNyZWF0ZU1lc2gocGF0aCkge1xuICAgIHRoaXMubWVzaFJlZ2lzdHJ5S2V5cy5wdXNoKHBhdGgpO1xuXG4gICAgdmFyIHVuaWZvcm1zID0ga2V5VmFsdWVUb0FycmF5cyh7XG4gICAgICAgIHVfb3BhY2l0eTogMSxcbiAgICAgICAgdV90cmFuc2Zvcm06IGlkZW50aXR5LFxuICAgICAgICB1X3NpemU6IFswLCAwLCAwXSxcbiAgICAgICAgdV9iYXNlQ29sb3I6IFswLjUsIDAuNSwgMC41LCAxXSxcbiAgICAgICAgdV9wb3NpdGlvbk9mZnNldDogWzAsIDAsIDBdLFxuICAgICAgICB1X25vcm1hbHM6IFswLCAwLCAwXSxcbiAgICAgICAgdV9mbGF0U2hhZGluZzogMCxcbiAgICAgICAgdV9nbG9zc2luZXNzOiBbMCwgMCwgMCwgMF1cbiAgICB9KTtcbiAgICB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSA9IHtcbiAgICAgICAgZGVwdGg6IG51bGwsXG4gICAgICAgIHVuaWZvcm1LZXlzOiB1bmlmb3Jtcy5rZXlzLFxuICAgICAgICB1bmlmb3JtVmFsdWVzOiB1bmlmb3Jtcy52YWx1ZXMsXG4gICAgICAgIGJ1ZmZlcnM6IHt9LFxuICAgICAgICBnZW9tZXRyeTogbnVsbCxcbiAgICAgICAgZHJhd1R5cGU6IG51bGwsXG4gICAgICAgIHRleHR1cmVzOiBbXSxcbiAgICAgICAgdmlzaWJsZTogdHJ1ZVxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMubWVzaFJlZ2lzdHJ5W3BhdGhdO1xufTtcblxuLyoqXG4gKiBTZXRzIGZsYWcgb24gaW5kaWNhdGluZyB3aGV0aGVyIHRvIGRvIHNraXAgZHJhdyBwaGFzZSBmb3JcbiAqIGN1dG91dCBtZXNoIGF0IGdpdmVuIHBhdGguXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiB0YXJnZXQgY3V0b3V0IG1lc2guXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHVzZXNDdXRvdXQgSW5kaWNhdGVzIHRoZSBwcmVzZW5jZSBvZiBhIGN1dG91dCBtZXNoXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuc2V0Q3V0b3V0U3RhdGUgPSBmdW5jdGlvbiBzZXRDdXRvdXRTdGF0ZShwYXRoLCB1c2VzQ3V0b3V0KSB7XG4gICAgdmFyIGN1dG91dCA9IHRoaXMuZ2V0T3JTZXRDdXRvdXQocGF0aCk7XG5cbiAgICBjdXRvdXQudmlzaWJsZSA9IHVzZXNDdXRvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgb3IgcmV0cmVpdmVzIGN1dG91dFxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgYXMgaWQgb2YgdGFyZ2V0IGN1dG91dCBtZXNoLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gTmV3bHkgY3JlYXRlZCBjdXRvdXQgc3BlYy5cbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuZ2V0T3JTZXRDdXRvdXQgPSBmdW5jdGlvbiBnZXRPclNldEN1dG91dChwYXRoKSB7XG4gICAgaWYgKHRoaXMuY3V0b3V0UmVnaXN0cnlbcGF0aF0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3V0b3V0UmVnaXN0cnlbcGF0aF07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgdW5pZm9ybXMgPSBrZXlWYWx1ZVRvQXJyYXlzKHtcbiAgICAgICAgICAgIHVfb3BhY2l0eTogMCxcbiAgICAgICAgICAgIHVfdHJhbnNmb3JtOiBpZGVudGl0eS5zbGljZSgpLFxuICAgICAgICAgICAgdV9zaXplOiBbMCwgMCwgMF0sXG4gICAgICAgICAgICB1X29yaWdpbjogWzAsIDAsIDBdLFxuICAgICAgICAgICAgdV9iYXNlQ29sb3I6IFswLCAwLCAwLCAxXVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmN1dG91dFJlZ2lzdHJ5S2V5cy5wdXNoKHBhdGgpO1xuXG4gICAgICAgIHRoaXMuY3V0b3V0UmVnaXN0cnlbcGF0aF0gPSB7XG4gICAgICAgICAgICB1bmlmb3JtS2V5czogdW5pZm9ybXMua2V5cyxcbiAgICAgICAgICAgIHVuaWZvcm1WYWx1ZXM6IHVuaWZvcm1zLnZhbHVlcyxcbiAgICAgICAgICAgIGdlb21ldHJ5OiB0aGlzLmN1dG91dEdlb21ldHJ5LnNwZWMuaWQsXG4gICAgICAgICAgICBkcmF3VHlwZTogdGhpcy5jdXRvdXRHZW9tZXRyeS5zcGVjLnR5cGUsXG4gICAgICAgICAgICB2aXNpYmxlOiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3V0b3V0UmVnaXN0cnlbcGF0aF07XG4gICAgfVxufTtcblxuLyoqXG4gKiBTZXRzIGZsYWcgb24gaW5kaWNhdGluZyB3aGV0aGVyIHRvIGRvIHNraXAgZHJhdyBwaGFzZSBmb3JcbiAqIG1lc2ggYXQgZ2l2ZW4gcGF0aC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgYXMgaWQgb2YgdGFyZ2V0IG1lc2guXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHZpc2liaWxpdHkgSW5kaWNhdGVzIHRoZSB2aXNpYmlsaXR5IG9mIHRhcmdldCBtZXNoLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnNldE1lc2hWaXNpYmlsaXR5ID0gZnVuY3Rpb24gc2V0TWVzaFZpc2liaWxpdHkocGF0aCwgdmlzaWJpbGl0eSkge1xuICAgIHZhciBtZXNoID0gdGhpcy5tZXNoUmVnaXN0cnlbcGF0aF0gfHwgdGhpcy5jcmVhdGVNZXNoKHBhdGgpO1xuXG4gICAgbWVzaC52aXNpYmxlID0gdmlzaWJpbGl0eTtcbn07XG5cbi8qKlxuICogRGVsZXRlcyBhIG1lc2ggZnJvbSB0aGUgbWVzaFJlZ2lzdHJ5LlxuICpcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiB0YXJnZXQgbWVzaC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5yZW1vdmVNZXNoID0gZnVuY3Rpb24gcmVtb3ZlTWVzaChwYXRoKSB7XG4gICAgdmFyIGtleUxvY2F0aW9uID0gdGhpcy5tZXNoUmVnaXN0cnlLZXlzLmluZGV4T2YocGF0aCk7XG4gICAgdGhpcy5tZXNoUmVnaXN0cnlLZXlzLnNwbGljZShrZXlMb2NhdGlvbiwgMSk7XG4gICAgdGhpcy5tZXNoUmVnaXN0cnlbcGF0aF0gPSBudWxsO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIG9yIHJldHJlaXZlcyBjdXRvdXRcbiAqXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgYXMgaWQgb2YgY3V0b3V0IGluIGN1dG91dCByZWdpc3RyeS5cbiAqIEBwYXJhbSB7U3RyaW5nfSB1bmlmb3JtTmFtZSBJZGVudGlmaWVyIHVzZWQgdG8gdXBsb2FkIHZhbHVlXG4gKiBAcGFyYW0ge0FycmF5fSB1bmlmb3JtVmFsdWUgVmFsdWUgb2YgdW5pZm9ybSBkYXRhXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuc2V0Q3V0b3V0VW5pZm9ybSA9IGZ1bmN0aW9uIHNldEN1dG91dFVuaWZvcm0ocGF0aCwgdW5pZm9ybU5hbWUsIHVuaWZvcm1WYWx1ZSkge1xuICAgIHZhciBjdXRvdXQgPSB0aGlzLmdldE9yU2V0Q3V0b3V0KHBhdGgpO1xuXG4gICAgdmFyIGluZGV4ID0gY3V0b3V0LnVuaWZvcm1LZXlzLmluZGV4T2YodW5pZm9ybU5hbWUpO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodW5pZm9ybVZhbHVlKSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdW5pZm9ybVZhbHVlLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBjdXRvdXQudW5pZm9ybVZhbHVlc1tpbmRleF1baV0gPSB1bmlmb3JtVmFsdWVbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGN1dG91dC51bmlmb3JtVmFsdWVzW2luZGV4XSA9IHVuaWZvcm1WYWx1ZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEVkaXRzIHRoZSBvcHRpb25zIGZpZWxkIG9uIGEgbWVzaFxuICpcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiB0YXJnZXQgbWVzaFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgTWFwIG9mIGRyYXcgb3B0aW9ucyBmb3IgbWVzaFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4qKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnNldE1lc2hPcHRpb25zID0gZnVuY3Rpb24ocGF0aCwgb3B0aW9ucykge1xuICAgIHZhciBtZXNoID0gdGhpcy5tZXNoUmVnaXN0cnlbcGF0aF0gfHwgdGhpcy5jcmVhdGVNZXNoKHBhdGgpO1xuXG4gICAgbWVzaC5vcHRpb25zID0gb3B0aW9ucztcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0aGUgY29sb3Igb2YgdGhlIGZpeGVkIGludGVuc2l0eSBsaWdodGluZyBpbiB0aGUgc2NlbmVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIGxpZ2h0XG4gKiBAcGFyYW0ge051bWJlcn0gciByZWQgY2hhbm5lbFxuICogQHBhcmFtIHtOdW1iZXJ9IGcgZ3JlZW4gY2hhbm5lbFxuICogQHBhcmFtIHtOdW1iZXJ9IGIgYmx1ZSBjaGFubmVsXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbioqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuc2V0QW1iaWVudExpZ2h0Q29sb3IgPSBmdW5jdGlvbiBzZXRBbWJpZW50TGlnaHRDb2xvcihwYXRoLCByLCBnLCBiKSB7XG4gICAgdGhpcy5hbWJpZW50TGlnaHRDb2xvclswXSA9IHI7XG4gICAgdGhpcy5hbWJpZW50TGlnaHRDb2xvclsxXSA9IGc7XG4gICAgdGhpcy5hbWJpZW50TGlnaHRDb2xvclsyXSA9IGI7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBsaWdodCBpbiB0aGUgc2NlbmVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIGxpZ2h0XG4gKiBAcGFyYW0ge051bWJlcn0geCB4IHBvc2l0aW9uXG4gKiBAcGFyYW0ge051bWJlcn0geSB5IHBvc2l0aW9uXG4gKiBAcGFyYW0ge051bWJlcn0geiB6IHBvc2l0aW9uXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbioqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuc2V0TGlnaHRQb3NpdGlvbiA9IGZ1bmN0aW9uIHNldExpZ2h0UG9zaXRpb24ocGF0aCwgeCwgeSwgeikge1xuICAgIHZhciBsaWdodCA9IHRoaXMubGlnaHRSZWdpc3RyeVtwYXRoXSB8fCB0aGlzLmNyZWF0ZUxpZ2h0KHBhdGgpO1xuXG4gICAgbGlnaHQucG9zaXRpb25bMF0gPSB4O1xuICAgIGxpZ2h0LnBvc2l0aW9uWzFdID0geTtcbiAgICBsaWdodC5wb3NpdGlvblsyXSA9IHo7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdGhlIGNvbG9yIG9mIGEgZHluYW1pYyBpbnRlbnNpdHkgbGlnaHRpbmcgaW4gdGhlIHNjZW5lXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiBsaWdodCBpbiBsaWdodCBSZWdpc3RyeS5cbiAqIEBwYXJhbSB7TnVtYmVyfSByIHJlZCBjaGFubmVsXG4gKiBAcGFyYW0ge051bWJlcn0gZyBncmVlbiBjaGFubmVsXG4gKiBAcGFyYW0ge051bWJlcn0gYiBibHVlIGNoYW5uZWxcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuKiovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5zZXRMaWdodENvbG9yID0gZnVuY3Rpb24gc2V0TGlnaHRDb2xvcihwYXRoLCByLCBnLCBiKSB7XG4gICAgdmFyIGxpZ2h0ID0gdGhpcy5saWdodFJlZ2lzdHJ5W3BhdGhdIHx8IHRoaXMuY3JlYXRlTGlnaHQocGF0aCk7XG5cbiAgICBsaWdodC5jb2xvclswXSA9IHI7XG4gICAgbGlnaHQuY29sb3JbMV0gPSBnO1xuICAgIGxpZ2h0LmNvbG9yWzJdID0gYjtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ29tcGlsZXMgbWF0ZXJpYWwgc3BlYyBpbnRvIHByb2dyYW0gc2hhZGVyXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiBjdXRvdXQgaW4gY3V0b3V0IHJlZ2lzdHJ5LlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSB0aGF0IHRoZSByZW5kZXJpbmcgaW5wdXQgdGhlIG1hdGVyaWFsIGlzIGJvdW5kIHRvXG4gKiBAcGFyYW0ge09iamVjdH0gbWF0ZXJpYWwgTWF0ZXJpYWwgc3BlY1xuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4qKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLmhhbmRsZU1hdGVyaWFsSW5wdXQgPSBmdW5jdGlvbiBoYW5kbGVNYXRlcmlhbElucHV0KHBhdGgsIG5hbWUsIG1hdGVyaWFsKSB7XG4gICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSB8fCB0aGlzLmNyZWF0ZU1lc2gocGF0aCk7XG4gICAgbWF0ZXJpYWwgPSBjb21waWxlTWF0ZXJpYWwobWF0ZXJpYWwsIG1lc2gudGV4dHVyZXMubGVuZ3RoKTtcblxuICAgIC8vIFNldCB1bmlmb3JtcyB0byBlbmFibGUgdGV4dHVyZSFcblxuICAgIG1lc2gudW5pZm9ybVZhbHVlc1ttZXNoLnVuaWZvcm1LZXlzLmluZGV4T2YobmFtZSldWzBdID0gLW1hdGVyaWFsLl9pZDtcblxuICAgIC8vIFJlZ2lzdGVyIHRleHR1cmVzIVxuXG4gICAgdmFyIGkgPSBtYXRlcmlhbC50ZXh0dXJlcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBtZXNoLnRleHR1cmVzLnB1c2goXG4gICAgICAgICAgICB0aGlzLnRleHR1cmVNYW5hZ2VyLnJlZ2lzdGVyKG1hdGVyaWFsLnRleHR1cmVzW2ldLCBtZXNoLnRleHR1cmVzLmxlbmd0aCArIGkpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gUmVnaXN0ZXIgbWF0ZXJpYWwhXG5cbiAgICB0aGlzLnByb2dyYW0ucmVnaXN0ZXJNYXRlcmlhbChuYW1lLCBtYXRlcmlhbCk7XG5cbiAgICByZXR1cm4gdGhpcy51cGRhdGVTaXplKCk7XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdGhlIGdlb21ldHJ5IGRhdGEgb2YgYSBtZXNoXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiBjdXRvdXQgaW4gY3V0b3V0IHJlZ2lzdHJ5LlxuICogQHBhcmFtIHtPYmplY3R9IGdlb21ldHJ5IEdlb21ldHJ5IG9iamVjdCBjb250YWluaW5nIHZlcnRleCBkYXRhIHRvIGJlIGRyYXduXG4gKiBAcGFyYW0ge051bWJlcn0gZHJhd1R5cGUgUHJpbWl0aXZlIGlkZW50aWZpZXJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZHluYW1pYyBXaGV0aGVyIGdlb21ldHJ5IGlzIGR5bmFtaWNcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuKiovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5zZXRHZW9tZXRyeSA9IGZ1bmN0aW9uIHNldEdlb21ldHJ5KHBhdGgsIGdlb21ldHJ5LCBkcmF3VHlwZSwgZHluYW1pYykge1xuICAgIHZhciBtZXNoID0gdGhpcy5tZXNoUmVnaXN0cnlbcGF0aF0gfHwgdGhpcy5jcmVhdGVNZXNoKHBhdGgpO1xuXG4gICAgbWVzaC5nZW9tZXRyeSA9IGdlb21ldHJ5O1xuICAgIG1lc2guZHJhd1R5cGUgPSBkcmF3VHlwZTtcbiAgICBtZXNoLmR5bmFtaWMgPSBkeW5hbWljO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFVwbG9hZHMgYSBuZXcgdmFsdWUgZm9yIHRoZSB1bmlmb3JtIGRhdGEgd2hlbiB0aGUgbWVzaCBpcyBiZWluZyBkcmF3blxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgYXMgaWQgb2YgbWVzaCBpbiBtZXNoIHJlZ2lzdHJ5XG4gKiBAcGFyYW0ge1N0cmluZ30gdW5pZm9ybU5hbWUgSWRlbnRpZmllciB1c2VkIHRvIHVwbG9hZCB2YWx1ZVxuICogQHBhcmFtIHtBcnJheX0gdW5pZm9ybVZhbHVlIFZhbHVlIG9mIHVuaWZvcm0gZGF0YVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4qKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnNldE1lc2hVbmlmb3JtID0gZnVuY3Rpb24gc2V0TWVzaFVuaWZvcm0ocGF0aCwgdW5pZm9ybU5hbWUsIHVuaWZvcm1WYWx1ZSkge1xuICAgIHZhciBtZXNoID0gdGhpcy5tZXNoUmVnaXN0cnlbcGF0aF0gfHwgdGhpcy5jcmVhdGVNZXNoKHBhdGgpO1xuXG4gICAgdmFyIGluZGV4ID0gbWVzaC51bmlmb3JtS2V5cy5pbmRleE9mKHVuaWZvcm1OYW1lKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgbWVzaC51bmlmb3JtS2V5cy5wdXNoKHVuaWZvcm1OYW1lKTtcbiAgICAgICAgbWVzaC51bmlmb3JtVmFsdWVzLnB1c2godW5pZm9ybVZhbHVlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG1lc2gudW5pZm9ybVZhbHVlc1tpbmRleF0gPSB1bmlmb3JtVmFsdWU7XG4gICAgfVxufTtcblxuLyoqXG4gKiBUcmlnZ2VycyB0aGUgJ2RyYXcnIHBoYXNlIG9mIHRoZSBXZWJHTFJlbmRlcmVyLiBJdGVyYXRlcyB0aHJvdWdoIHJlZ2lzdHJpZXNcbiAqIHRvIHNldCB1bmlmb3Jtcywgc2V0IGF0dHJpYnV0ZXMgYW5kIGlzc3VlIGRyYXcgY29tbWFuZHMgZm9yIHJlbmRlcmFibGVzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgYXMgaWQgb2YgbWVzaCBpbiBtZXNoIHJlZ2lzdHJ5XG4gKiBAcGFyYW0ge051bWJlcn0gZ2VvbWV0cnlJZCBJZCBvZiBnZW9tZXRyeSBpbiBnZW9tZXRyeSByZWdpc3RyeVxuICogQHBhcmFtIHtTdHJpbmd9IGJ1ZmZlck5hbWUgQXR0cmlidXRlIGxvY2F0aW9uIG5hbWVcbiAqIEBwYXJhbSB7QXJyYXl9IGJ1ZmZlclZhbHVlIFZlcnRleCBkYXRhXG4gKiBAcGFyYW0ge051bWJlcn0gYnVmZmVyU3BhY2luZyBUaGUgZGltZW5zaW9ucyBvZiB0aGUgdmVydGV4XG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzRHluYW1pYyBXaGV0aGVyIGdlb21ldHJ5IGlzIGR5bmFtaWNcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5idWZmZXJEYXRhID0gZnVuY3Rpb24gYnVmZmVyRGF0YShwYXRoLCBnZW9tZXRyeUlkLCBidWZmZXJOYW1lLCBidWZmZXJWYWx1ZSwgYnVmZmVyU3BhY2luZywgaXNEeW5hbWljKSB7XG4gICAgdGhpcy5idWZmZXJSZWdpc3RyeS5hbGxvY2F0ZShnZW9tZXRyeUlkLCBidWZmZXJOYW1lLCBidWZmZXJWYWx1ZSwgYnVmZmVyU3BhY2luZywgaXNEeW5hbWljKTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VycyB0aGUgJ2RyYXcnIHBoYXNlIG9mIHRoZSBXZWJHTFJlbmRlcmVyLiBJdGVyYXRlcyB0aHJvdWdoIHJlZ2lzdHJpZXNcbiAqIHRvIHNldCB1bmlmb3Jtcywgc2V0IGF0dHJpYnV0ZXMgYW5kIGlzc3VlIGRyYXcgY29tbWFuZHMgZm9yIHJlbmRlcmFibGVzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcmVuZGVyU3RhdGUgUGFyYW1ldGVycyBwcm92aWRlZCBieSB0aGUgY29tcG9zaXRvciwgdGhhdCBhZmZlY3QgdGhlIHJlbmRlcmluZyBvZiBhbGwgcmVuZGVyYWJsZXMuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIGRyYXcocmVuZGVyU3RhdGUpIHtcbiAgICB2YXIgdGltZSA9IHRoaXMuY29tcG9zaXRvci5nZXRUaW1lKCk7XG5cbiAgICB0aGlzLmdsLmNsZWFyKHRoaXMuZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IHRoaXMuZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG4gICAgdGhpcy50ZXh0dXJlTWFuYWdlci51cGRhdGUodGltZSk7XG5cbiAgICB0aGlzLm1lc2hSZWdpc3RyeUtleXMgPSBzb3J0ZXIodGhpcy5tZXNoUmVnaXN0cnlLZXlzLCB0aGlzLm1lc2hSZWdpc3RyeSk7XG5cbiAgICB0aGlzLnNldEdsb2JhbFVuaWZvcm1zKHJlbmRlclN0YXRlKTtcbiAgICB0aGlzLmRyYXdDdXRvdXRzKCk7XG4gICAgdGhpcy5kcmF3TWVzaGVzKCk7XG59O1xuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggYW5kIGRyYXdzIGFsbCByZWdpc3RlcmVkIG1lc2hlcy4gVGhpcyBpbmNsdWRlc1xuICogYmluZGluZyB0ZXh0dXJlcywgaGFuZGxpbmcgZHJhdyBvcHRpb25zLCBzZXR0aW5nIG1lc2ggdW5pZm9ybXNcbiAqIGFuZCBkcmF3aW5nIG1lc2ggYnVmZmVycy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuZHJhd01lc2hlcyA9IGZ1bmN0aW9uIGRyYXdNZXNoZXMoKSB7XG4gICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgICB2YXIgYnVmZmVycztcbiAgICB2YXIgbWVzaDtcblxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLm1lc2hSZWdpc3RyeUtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbWVzaCA9IHRoaXMubWVzaFJlZ2lzdHJ5W3RoaXMubWVzaFJlZ2lzdHJ5S2V5c1tpXV07XG4gICAgICAgIGJ1ZmZlcnMgPSB0aGlzLmJ1ZmZlclJlZ2lzdHJ5LnJlZ2lzdHJ5W21lc2guZ2VvbWV0cnldO1xuXG4gICAgICAgIGlmICghbWVzaC52aXNpYmxlKSBjb250aW51ZTtcblxuICAgICAgICBpZiAobWVzaC51bmlmb3JtVmFsdWVzWzBdIDwgMSkge1xuICAgICAgICAgICAgZ2wuZGVwdGhNYXNrKGZhbHNlKTtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5CTEVORCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBnbC5kZXB0aE1hc2sodHJ1ZSk7XG4gICAgICAgICAgICBnbC5kaXNhYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYnVmZmVycykgY29udGludWU7XG5cbiAgICAgICAgdmFyIGogPSBtZXNoLnRleHR1cmVzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGotLSkgdGhpcy50ZXh0dXJlTWFuYWdlci5iaW5kVGV4dHVyZShtZXNoLnRleHR1cmVzW2pdKTtcblxuICAgICAgICBpZiAobWVzaC5vcHRpb25zKSB0aGlzLmhhbmRsZU9wdGlvbnMobWVzaC5vcHRpb25zLCBtZXNoKTtcblxuICAgICAgICB0aGlzLnByb2dyYW0uc2V0VW5pZm9ybXMobWVzaC51bmlmb3JtS2V5cywgbWVzaC51bmlmb3JtVmFsdWVzKTtcbiAgICAgICAgdGhpcy5kcmF3QnVmZmVycyhidWZmZXJzLCBtZXNoLmRyYXdUeXBlLCBtZXNoLmdlb21ldHJ5KTtcblxuICAgICAgICBpZiAobWVzaC5vcHRpb25zKSB0aGlzLnJlc2V0T3B0aW9ucyhtZXNoLm9wdGlvbnMpO1xuICAgIH1cbn07XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCBhbmQgZHJhd3MgYWxsIHJlZ2lzdGVyZWQgY3V0b3V0IG1lc2hlcy4gQmxlbmRpbmdcbiAqIGlzIGRpc2FibGVkLCBjdXRvdXQgdW5pZm9ybXMgYXJlIHNldCBhbmQgZmluYWxseSBidWZmZXJzIGFyZSBkcmF3bi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuZHJhd0N1dG91dHMgPSBmdW5jdGlvbiBkcmF3Q3V0b3V0cygpIHtcbiAgICB2YXIgY3V0b3V0O1xuICAgIHZhciBidWZmZXJzO1xuICAgIHZhciBsZW4gPSB0aGlzLmN1dG91dFJlZ2lzdHJ5S2V5cy5sZW5ndGg7XG5cbiAgICBpZiAobGVuKSB7XG4gICAgICAgIHRoaXMuZ2wuZW5hYmxlKHRoaXMuZ2wuQkxFTkQpO1xuICAgICAgICB0aGlzLmdsLmRlcHRoTWFzayh0cnVlKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGN1dG91dCA9IHRoaXMuY3V0b3V0UmVnaXN0cnlbdGhpcy5jdXRvdXRSZWdpc3RyeUtleXNbaV1dO1xuICAgICAgICBidWZmZXJzID0gdGhpcy5idWZmZXJSZWdpc3RyeS5yZWdpc3RyeVtjdXRvdXQuZ2VvbWV0cnldO1xuXG4gICAgICAgIGlmICghY3V0b3V0LnZpc2libGUpIGNvbnRpbnVlO1xuXG4gICAgICAgIHRoaXMucHJvZ3JhbS5zZXRVbmlmb3JtcyhjdXRvdXQudW5pZm9ybUtleXMsIGN1dG91dC51bmlmb3JtVmFsdWVzKTtcbiAgICAgICAgdGhpcy5kcmF3QnVmZmVycyhidWZmZXJzLCBjdXRvdXQuZHJhd1R5cGUsIGN1dG91dC5nZW9tZXRyeSk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBTZXRzIHVuaWZvcm1zIHRvIGJlIHNoYXJlZCBieSBhbGwgbWVzaGVzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcmVuZGVyU3RhdGUgRHJhdyBzdGF0ZSBvcHRpb25zIHBhc3NlZCBkb3duIGZyb20gY29tcG9zaXRvci5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5zZXRHbG9iYWxVbmlmb3JtcyA9IGZ1bmN0aW9uIHNldEdsb2JhbFVuaWZvcm1zKHJlbmRlclN0YXRlKSB7XG4gICAgdmFyIGxpZ2h0O1xuICAgIHZhciBzdHJpZGU7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5saWdodFJlZ2lzdHJ5S2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBsaWdodCA9IHRoaXMubGlnaHRSZWdpc3RyeVt0aGlzLmxpZ2h0UmVnaXN0cnlLZXlzW2ldXTtcbiAgICAgICAgc3RyaWRlID0gaSAqIDQ7XG5cbiAgICAgICAgLy8gQnVpbGQgdGhlIGxpZ2h0IHBvc2l0aW9ucycgNHg0IG1hdHJpeFxuXG4gICAgICAgIHRoaXMubGlnaHRQb3NpdGlvbnNbMCArIHN0cmlkZV0gPSBsaWdodC5wb3NpdGlvblswXTtcbiAgICAgICAgdGhpcy5saWdodFBvc2l0aW9uc1sxICsgc3RyaWRlXSA9IGxpZ2h0LnBvc2l0aW9uWzFdO1xuICAgICAgICB0aGlzLmxpZ2h0UG9zaXRpb25zWzIgKyBzdHJpZGVdID0gbGlnaHQucG9zaXRpb25bMl07XG5cbiAgICAgICAgLy8gQnVpbGQgdGhlIGxpZ2h0IGNvbG9ycycgNHg0IG1hdHJpeFxuXG4gICAgICAgIHRoaXMubGlnaHRDb2xvcnNbMCArIHN0cmlkZV0gPSBsaWdodC5jb2xvclswXTtcbiAgICAgICAgdGhpcy5saWdodENvbG9yc1sxICsgc3RyaWRlXSA9IGxpZ2h0LmNvbG9yWzFdO1xuICAgICAgICB0aGlzLmxpZ2h0Q29sb3JzWzIgKyBzdHJpZGVdID0gbGlnaHQuY29sb3JbMl07XG4gICAgfVxuXG4gICAgZ2xvYmFsVW5pZm9ybXMudmFsdWVzWzBdID0gdGhpcy5udW1MaWdodHM7XG4gICAgZ2xvYmFsVW5pZm9ybXMudmFsdWVzWzFdID0gdGhpcy5hbWJpZW50TGlnaHRDb2xvcjtcbiAgICBnbG9iYWxVbmlmb3Jtcy52YWx1ZXNbMl0gPSB0aGlzLmxpZ2h0UG9zaXRpb25zO1xuICAgIGdsb2JhbFVuaWZvcm1zLnZhbHVlc1szXSA9IHRoaXMubGlnaHRDb2xvcnM7XG5cbiAgICAvKlxuICAgICAqIFNldCB0aW1lIGFuZCBwcm9qZWN0aW9uIHVuaWZvcm1zXG4gICAgICogcHJvamVjdGluZyB3b3JsZCBzcGFjZSBpbnRvIGEgMmQgcGxhbmUgcmVwcmVzZW50YXRpb24gb2YgdGhlIGNhbnZhcy5cbiAgICAgKiBUaGUgeCBhbmQgeSBzY2FsZSAodGhpcy5wcm9qZWN0aW9uVHJhbnNmb3JtWzBdIGFuZCB0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm1bNV0gcmVzcGVjdGl2ZWx5KVxuICAgICAqIGNvbnZlcnQgdGhlIHByb2plY3RlZCBnZW9tZXRyeSBiYWNrIGludG8gY2xpcHNwYWNlLlxuICAgICAqIFRoZSBwZXJwZWN0aXZlIGRpdmlkZSAodGhpcy5wcm9qZWN0aW9uVHJhbnNmb3JtWzExXSksIGFkZHMgdGhlIHogdmFsdWUgb2YgdGhlIHBvaW50XG4gICAgICogbXVsdGlwbGllZCBieSB0aGUgcGVyc3BlY3RpdmUgZGl2aWRlIHRvIHRoZSB3IHZhbHVlIG9mIHRoZSBwb2ludC4gSW4gdGhlIHByb2Nlc3NcbiAgICAgKiBvZiBjb252ZXJ0aW5nIGZyb20gaG9tb2dlbm91cyBjb29yZGluYXRlcyB0byBOREMgKG5vcm1hbGl6ZWQgZGV2aWNlIGNvb3JkaW5hdGVzKVxuICAgICAqIHRoZSB4IGFuZCB5IHZhbHVlcyBvZiB0aGUgcG9pbnQgYXJlIGRpdmlkZWQgYnkgdywgd2hpY2ggaW1wbGVtZW50cyBwZXJzcGVjdGl2ZS5cbiAgICAgKi9cbiAgICB0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm1bMF0gPSAxIC8gKHRoaXMuY2FjaGVkU2l6ZVswXSAqIDAuNSk7XG4gICAgdGhpcy5wcm9qZWN0aW9uVHJhbnNmb3JtWzVdID0gLTEgLyAodGhpcy5jYWNoZWRTaXplWzFdICogMC41KTtcbiAgICB0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm1bMTFdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTFdO1xuXG4gICAgZ2xvYmFsVW5pZm9ybXMudmFsdWVzWzRdID0gdGhpcy5wcm9qZWN0aW9uVHJhbnNmb3JtO1xuICAgIGdsb2JhbFVuaWZvcm1zLnZhbHVlc1s1XSA9IHRoaXMuY29tcG9zaXRvci5nZXRUaW1lKCkgKiAwLjAwMTtcbiAgICBnbG9iYWxVbmlmb3Jtcy52YWx1ZXNbNl0gPSByZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtO1xuXG4gICAgdGhpcy5wcm9ncmFtLnNldFVuaWZvcm1zKGdsb2JhbFVuaWZvcm1zLmtleXMsIGdsb2JhbFVuaWZvcm1zLnZhbHVlcyk7XG59O1xuXG4vKipcbiAqIExvYWRzIHRoZSBidWZmZXJzIGFuZCBpc3N1ZXMgdGhlIGRyYXcgY29tbWFuZCBmb3IgYSBnZW9tZXRyeS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHZlcnRleEJ1ZmZlcnMgQWxsIGJ1ZmZlcnMgdXNlZCB0byBkcmF3IHRoZSBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBtb2RlIEVudW1lcmF0b3IgZGVmaW5pbmcgd2hhdCBwcmltaXRpdmUgdG8gZHJhd1xuICogQHBhcmFtIHtOdW1iZXJ9IGlkIElEIG9mIGdlb21ldHJ5IGJlaW5nIGRyYXduLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLmRyYXdCdWZmZXJzID0gZnVuY3Rpb24gZHJhd0J1ZmZlcnModmVydGV4QnVmZmVycywgbW9kZSwgaWQpIHtcbiAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgIHZhciBsZW5ndGggPSAwO1xuICAgIHZhciBhdHRyaWJ1dGU7XG4gICAgdmFyIGxvY2F0aW9uO1xuICAgIHZhciBzcGFjaW5nO1xuICAgIHZhciBvZmZzZXQ7XG4gICAgdmFyIGJ1ZmZlcjtcbiAgICB2YXIgaXRlcjtcbiAgICB2YXIgajtcbiAgICB2YXIgaTtcblxuICAgIGl0ZXIgPSB2ZXJ0ZXhCdWZmZXJzLmtleXMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBpdGVyOyBpKyspIHtcbiAgICAgICAgYXR0cmlidXRlID0gdmVydGV4QnVmZmVycy5rZXlzW2ldO1xuXG4gICAgICAgIC8vIERvIG5vdCBzZXQgdmVydGV4QXR0cmliUG9pbnRlciBpZiBpbmRleCBidWZmZXIuXG5cbiAgICAgICAgaWYgKGF0dHJpYnV0ZSA9PT0gJ2luZGljZXMnKSB7XG4gICAgICAgICAgICBqID0gaTsgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXRyZWl2ZSB0aGUgYXR0cmlidXRlIGxvY2F0aW9uIGFuZCBtYWtlIHN1cmUgaXQgaXMgZW5hYmxlZC5cblxuICAgICAgICBsb2NhdGlvbiA9IHRoaXMucHJvZ3JhbS5hdHRyaWJ1dGVMb2NhdGlvbnNbYXR0cmlidXRlXTtcblxuICAgICAgICBpZiAobG9jYXRpb24gPT09IC0xKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGxvY2F0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5wcm9ncmFtLnByb2dyYW0sIGF0dHJpYnV0ZSk7XG4gICAgICAgICAgICB0aGlzLnByb2dyYW0uYXR0cmlidXRlTG9jYXRpb25zW2F0dHJpYnV0ZV0gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbiA9PT0gLTEpIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmVuYWJsZWRBdHRyaWJ1dGVzW2F0dHJpYnV0ZV0pIHtcbiAgICAgICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvY2F0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNbYXR0cmlidXRlXSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmVuYWJsZWRBdHRyaWJ1dGVzS2V5cy5wdXNoKGF0dHJpYnV0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXRyZWl2ZSBidWZmZXIgaW5mb3JtYXRpb24gdXNlZCB0byBzZXQgYXR0cmlidXRlIHBvaW50ZXIuXG5cbiAgICAgICAgYnVmZmVyID0gdmVydGV4QnVmZmVycy52YWx1ZXNbaV07XG4gICAgICAgIHNwYWNpbmcgPSB2ZXJ0ZXhCdWZmZXJzLnNwYWNpbmdbaV07XG4gICAgICAgIG9mZnNldCA9IHZlcnRleEJ1ZmZlcnMub2Zmc2V0W2ldO1xuICAgICAgICBsZW5ndGggPSB2ZXJ0ZXhCdWZmZXJzLmxlbmd0aFtpXTtcblxuICAgICAgICAvLyBTa2lwIGJpbmRCdWZmZXIgaWYgYnVmZmVyIGlzIGN1cnJlbnRseSBib3VuZC5cblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5ib3VuZEFycmF5QnVmZmVyICE9PSBidWZmZXIpIHtcbiAgICAgICAgICAgIGdsLmJpbmRCdWZmZXIoYnVmZmVyLnRhcmdldCwgYnVmZmVyLmJ1ZmZlcik7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmJvdW5kQXJyYXlCdWZmZXIgPSBidWZmZXI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5sYXN0RHJhd24gIT09IGlkKSB7XG4gICAgICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGxvY2F0aW9uLCBzcGFjaW5nLCBnbC5GTE9BVCwgZ2wuRkFMU0UsIDAsIDQgKiBvZmZzZXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGlzYWJsZSBhbnkgYXR0cmlidXRlcyB0aGF0IG5vdCBjdXJyZW50bHkgYmVpbmcgdXNlZC5cblxuICAgIHZhciBsZW4gPSB0aGlzLnN0YXRlLmVuYWJsZWRBdHRyaWJ1dGVzS2V5cy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSB0aGlzLnN0YXRlLmVuYWJsZWRBdHRyaWJ1dGVzS2V5c1tpXTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNba2V5XSAmJiB2ZXJ0ZXhCdWZmZXJzLmtleXMuaW5kZXhPZihrZXkpID09PSAtMSkge1xuICAgICAgICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KHRoaXMucHJvZ3JhbS5hdHRyaWJ1dGVMb2NhdGlvbnNba2V5XSk7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmVuYWJsZWRBdHRyaWJ1dGVzW2tleV0gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsZW5ndGgpIHtcblxuICAgICAgICAvLyBJZiBpbmRleCBidWZmZXIsIHVzZSBkcmF3RWxlbWVudHMuXG5cbiAgICAgICAgaWYgKGogIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYnVmZmVyID0gdmVydGV4QnVmZmVycy52YWx1ZXNbal07XG4gICAgICAgICAgICBvZmZzZXQgPSB2ZXJ0ZXhCdWZmZXJzLm9mZnNldFtqXTtcbiAgICAgICAgICAgIHNwYWNpbmcgPSB2ZXJ0ZXhCdWZmZXJzLnNwYWNpbmdbal07XG4gICAgICAgICAgICBsZW5ndGggPSB2ZXJ0ZXhCdWZmZXJzLmxlbmd0aFtqXTtcblxuICAgICAgICAgICAgLy8gU2tpcCBiaW5kQnVmZmVyIGlmIGJ1ZmZlciBpcyBjdXJyZW50bHkgYm91bmQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmJvdW5kRWxlbWVudEJ1ZmZlciAhPT0gYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgZ2wuYmluZEJ1ZmZlcihidWZmZXIudGFyZ2V0LCBidWZmZXIuYnVmZmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmJvdW5kRWxlbWVudEJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZ2wuZHJhd0VsZW1lbnRzKGdsW21vZGVdLCBsZW5ndGgsIGdsLlVOU0lHTkVEX1NIT1JULCAyICogb2Zmc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdsLmRyYXdBcnJheXMoZ2xbbW9kZV0sIDAsIGxlbmd0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnN0YXRlLmxhc3REcmF3biA9IGlkO1xufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSB3aWR0aCBhbmQgaGVpZ2h0IG9mIHBhcmVudCBjYW52YXMsIHNldHMgdGhlIHZpZXdwb3J0IHNpemUgb25cbiAqIHRoZSBXZWJHTCBjb250ZXh0IGFuZCB1cGRhdGVzIHRoZSByZXNvbHV0aW9uIHVuaWZvcm0gZm9yIHRoZSBzaGFkZXIgcHJvZ3JhbS5cbiAqIFNpemUgaXMgcmV0cmVpdmVkIGZyb20gdGhlIGNvbnRhaW5lciBvYmplY3Qgb2YgdGhlIHJlbmRlcmVyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBzaXplIHdpZHRoLCBoZWlnaHQgYW5kIGRlcHRoIG9mIGNhbnZhc1xuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnVwZGF0ZVNpemUgPSBmdW5jdGlvbiB1cGRhdGVTaXplKHNpemUpIHtcbiAgICBpZiAoc2l6ZSkge1xuICAgICAgICB2YXIgcGl4ZWxSYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDE7XG4gICAgICAgIHZhciBkaXNwbGF5V2lkdGggPSB+fihzaXplWzBdICogcGl4ZWxSYXRpbyk7XG4gICAgICAgIHZhciBkaXNwbGF5SGVpZ2h0ID0gfn4oc2l6ZVsxXSAqIHBpeGVsUmF0aW8pO1xuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IGRpc3BsYXlXaWR0aDtcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gZGlzcGxheUhlaWdodDtcbiAgICAgICAgdGhpcy5nbC52aWV3cG9ydCgwLCAwLCBkaXNwbGF5V2lkdGgsIGRpc3BsYXlIZWlnaHQpO1xuXG4gICAgICAgIHRoaXMuY2FjaGVkU2l6ZVswXSA9IHNpemVbMF07XG4gICAgICAgIHRoaXMuY2FjaGVkU2l6ZVsxXSA9IHNpemVbMV07XG4gICAgICAgIHRoaXMuY2FjaGVkU2l6ZVsyXSA9IChzaXplWzBdID4gc2l6ZVsxXSkgPyBzaXplWzBdIDogc2l6ZVsxXTtcbiAgICAgICAgdGhpcy5yZXNvbHV0aW9uVmFsdWVzWzBdID0gdGhpcy5jYWNoZWRTaXplO1xuICAgIH1cblxuICAgIHRoaXMucHJvZ3JhbS5zZXRVbmlmb3Jtcyh0aGlzLnJlc29sdXRpb25OYW1lLCB0aGlzLnJlc29sdXRpb25WYWx1ZXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHN0YXRlIG9mIHRoZSBXZWJHTCBkcmF3aW5nIGNvbnRleHQgYmFzZWQgb24gY3VzdG9tIHBhcmFtZXRlcnNcbiAqIGRlZmluZWQgb24gYSBtZXNoLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBEcmF3IHN0YXRlIG9wdGlvbnMgdG8gYmUgc2V0IHRvIHRoZSBjb250ZXh0LlxuICogQHBhcmFtIHtNZXNofSBtZXNoIEFzc29jaWF0ZWQgTWVzaFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLmhhbmRsZU9wdGlvbnMgPSBmdW5jdGlvbiBoYW5kbGVPcHRpb25zKG9wdGlvbnMsIG1lc2gpIHtcbiAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgIGlmICghb3B0aW9ucykgcmV0dXJuO1xuXG4gICAgaWYgKG9wdGlvbnMuc2lkZSA9PT0gJ2RvdWJsZScpIHtcbiAgICAgICAgdGhpcy5nbC5jdWxsRmFjZSh0aGlzLmdsLkZST05UKTtcbiAgICAgICAgdGhpcy5kcmF3QnVmZmVycyh0aGlzLmJ1ZmZlclJlZ2lzdHJ5LnJlZ2lzdHJ5W21lc2guZ2VvbWV0cnldLCBtZXNoLmRyYXdUeXBlLCBtZXNoLmdlb21ldHJ5KTtcbiAgICAgICAgdGhpcy5nbC5jdWxsRmFjZSh0aGlzLmdsLkJBQ0spO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmJsZW5kaW5nKSBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLCBnbC5PTkUpO1xuICAgIGlmIChvcHRpb25zLnNpZGUgPT09ICdiYWNrJykgZ2wuY3VsbEZhY2UoZ2wuRlJPTlQpO1xufTtcblxuLyoqXG4gKiBSZXNldHMgdGhlIHN0YXRlIG9mIHRoZSBXZWJHTCBkcmF3aW5nIGNvbnRleHQgdG8gZGVmYXVsdCB2YWx1ZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIERyYXcgc3RhdGUgb3B0aW9ucyB0byBiZSBzZXQgdG8gdGhlIGNvbnRleHQuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUucmVzZXRPcHRpb25zID0gZnVuY3Rpb24gcmVzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgIGlmICghb3B0aW9ucykgcmV0dXJuO1xuICAgIGlmIChvcHRpb25zLmJsZW5kaW5nKSBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBKTtcbiAgICBpZiAob3B0aW9ucy5zaWRlID09PSAnYmFjaycpIGdsLmN1bGxGYWNlKGdsLkJBQ0spO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWJHTFJlbmRlcmVyO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHR5cGVzID0ge1xuICAgIDE6ICdmbG9hdCAnLFxuICAgIDI6ICd2ZWMyICcsXG4gICAgMzogJ3ZlYzMgJyxcbiAgICA0OiAndmVjNCAnXG59O1xuXG4vKipcbiAqIFRyYXZlcnNlcyBtYXRlcmlhbCB0byBjcmVhdGUgYSBzdHJpbmcgb2YgZ2xzbCBjb2RlIHRvIGJlIGFwcGxpZWQgaW5cbiAqIHRoZSB2ZXJ0ZXggb3IgZnJhZ21lbnQgc2hhZGVyLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcm90ZWN0ZWRcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbWF0ZXJpYWwgTWF0ZXJpYWwgdG8gYmUgY29tcGlsZWQuXG4gKiBAcGFyYW0ge051bWJlcn0gdGV4dHVyZVNsb3QgTmV4dCBhdmFpbGFibGUgdGV4dHVyZSBzbG90IGZvciBNZXNoLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVNYXRlcmlhbChtYXRlcmlhbCwgdGV4dHVyZVNsb3QpIHtcbiAgICB2YXIgZ2xzbCA9ICcnO1xuICAgIHZhciB1bmlmb3JtcyA9IHt9O1xuICAgIHZhciB2YXJ5aW5ncyA9IHt9O1xuICAgIHZhciBhdHRyaWJ1dGVzID0ge307XG4gICAgdmFyIGRlZmluZXMgPSBbXTtcbiAgICB2YXIgdGV4dHVyZXMgPSBbXTtcblxuICAgIF90cmF2ZXJzZShtYXRlcmlhbCwgZnVuY3Rpb24gKG5vZGUsIGRlcHRoKSB7XG4gICAgICAgIGlmICghIG5vZGUuY2h1bmspIHJldHVybjtcblxuICAgICAgICB2YXIgdHlwZSA9IHR5cGVzW19nZXRPdXRwdXRMZW5ndGgobm9kZSldO1xuICAgICAgICB2YXIgbGFiZWwgPSBfbWFrZUxhYmVsKG5vZGUpO1xuICAgICAgICB2YXIgb3V0cHV0ID0gX3Byb2Nlc3NHTFNMKG5vZGUuY2h1bmsuZ2xzbCwgbm9kZS5pbnB1dHMsIHRleHR1cmVzLmxlbmd0aCArIHRleHR1cmVTbG90KTtcblxuICAgICAgICBnbHNsICs9IHR5cGUgKyBsYWJlbCArICcgPSAnICsgb3V0cHV0ICsgJ1xcbiAnO1xuXG4gICAgICAgIGlmIChub2RlLnVuaWZvcm1zKSBfZXh0ZW5kKHVuaWZvcm1zLCBub2RlLnVuaWZvcm1zKTtcbiAgICAgICAgaWYgKG5vZGUudmFyeWluZ3MpIF9leHRlbmQodmFyeWluZ3MsIG5vZGUudmFyeWluZ3MpO1xuICAgICAgICBpZiAobm9kZS5hdHRyaWJ1dGVzKSBfZXh0ZW5kKGF0dHJpYnV0ZXMsIG5vZGUuYXR0cmlidXRlcyk7XG4gICAgICAgIGlmIChub2RlLmNodW5rLmRlZmluZXMpIGRlZmluZXMucHVzaChub2RlLmNodW5rLmRlZmluZXMpO1xuICAgICAgICBpZiAobm9kZS50ZXh0dXJlKSB0ZXh0dXJlcy5wdXNoKG5vZGUudGV4dHVyZSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBfaWQ6IG1hdGVyaWFsLl9pZCxcbiAgICAgICAgZ2xzbDogZ2xzbCArICdyZXR1cm4gJyArIF9tYWtlTGFiZWwobWF0ZXJpYWwpICsgJzsnLFxuICAgICAgICBkZWZpbmVzOiBkZWZpbmVzLmpvaW4oJ1xcbicpLFxuICAgICAgICB1bmlmb3JtczogdW5pZm9ybXMsXG4gICAgICAgIHZhcnlpbmdzOiB2YXJ5aW5ncyxcbiAgICAgICAgYXR0cmlidXRlczogYXR0cmlidXRlcyxcbiAgICAgICAgdGV4dHVyZXM6IHRleHR1cmVzXG4gICAgfTtcbn1cblxuLy8gUmVjdXJzaXZlbHkgaXRlcmF0ZXMgb3ZlciBhIG1hdGVyaWFsJ3MgaW5wdXRzLCBpbnZva2luZyBhIGdpdmVuIGNhbGxiYWNrXG4vLyB3aXRoIHRoZSBjdXJyZW50IG1hdGVyaWFsXG5mdW5jdGlvbiBfdHJhdmVyc2UobWF0ZXJpYWwsIGNhbGxiYWNrKSB7XG5cdHZhciBpbnB1dHMgPSBtYXRlcmlhbC5pbnB1dHM7XG4gICAgdmFyIGxlbiA9IGlucHV0cyAmJiBpbnB1dHMubGVuZ3RoO1xuICAgIHZhciBpZHggPSAtMTtcblxuICAgIHdoaWxlICgrK2lkeCA8IGxlbikgX3RyYXZlcnNlKGlucHV0c1tpZHhdLCBjYWxsYmFjayk7XG5cbiAgICBjYWxsYmFjayhtYXRlcmlhbCk7XG5cbiAgICByZXR1cm4gbWF0ZXJpYWw7XG59XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB1c2VkIHRvIGluZmVyIGxlbmd0aCBvZiB0aGUgb3V0cHV0XG4vLyBmcm9tIGEgZ2l2ZW4gbWF0ZXJpYWwgbm9kZS5cbmZ1bmN0aW9uIF9nZXRPdXRwdXRMZW5ndGgobm9kZSkge1xuXG4gICAgLy8gSGFuZGxlIGNvbnN0YW50IHZhbHVlc1xuXG4gICAgaWYgKHR5cGVvZiBub2RlID09PSAnbnVtYmVyJykgcmV0dXJuIDE7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHJldHVybiBub2RlLmxlbmd0aDtcblxuICAgIC8vIEhhbmRsZSBtYXRlcmlhbHNcblxuICAgIHZhciBvdXRwdXQgPSBub2RlLmNodW5rLm91dHB1dDtcbiAgICBpZiAodHlwZW9mIG91dHB1dCA9PT0gJ251bWJlcicpIHJldHVybiBvdXRwdXQ7XG5cbiAgICAvLyBIYW5kbGUgcG9seW1vcnBoaWMgb3V0cHV0XG5cbiAgICB2YXIga2V5ID0gbm9kZS5pbnB1dHMubWFwKGZ1bmN0aW9uIHJlY3Vyc2Uobm9kZSkge1xuICAgICAgICByZXR1cm4gX2dldE91dHB1dExlbmd0aChub2RlKTtcbiAgICB9KS5qb2luKCcsJyk7XG5cbiAgICByZXR1cm4gb3V0cHV0W2tleV07XG59XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBydW4gcmVwbGFjZSBpbnB1dHMgYW5kIHRleHR1cmUgdGFncyB3aXRoXG4vLyBjb3JyZWN0IGdsc2wuXG5mdW5jdGlvbiBfcHJvY2Vzc0dMU0woc3RyLCBpbnB1dHMsIHRleHR1cmVTbG90KSB7XG4gICAgcmV0dXJuIHN0clxuICAgICAgICAucmVwbGFjZSgvJVxcZC9nLCBmdW5jdGlvbiAocykge1xuICAgICAgICAgICAgcmV0dXJuIF9tYWtlTGFiZWwoaW5wdXRzW3NbMV0tMV0pO1xuICAgICAgICB9KVxuICAgICAgICAucmVwbGFjZSgvXFwkVEVYVFVSRS8sICd1X3RleHR1cmVzWycgKyB0ZXh0dXJlU2xvdCArICddJyk7XG59XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBnbHNsIGRlZmluaXRpb24gb2YgdGhlXG4vLyBpbnB1dCBtYXRlcmlhbCBub2RlLlxuZnVuY3Rpb24gX21ha2VMYWJlbCAobikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KG4pKSByZXR1cm4gX2FycmF5VG9WZWMobik7XG4gICAgaWYgKHR5cGVvZiBuID09PSAnb2JqZWN0JykgcmV0dXJuICdmYV8nICsgKG4uX2lkKTtcbiAgICBlbHNlIHJldHVybiBuLnRvRml4ZWQoNik7XG59XG5cbi8vIEhlbHBlciB0byBjb3B5IHRoZSBwcm9wZXJ0aWVzIG9mIGFuIG9iamVjdCBvbnRvIGFub3RoZXIgb2JqZWN0LlxuZnVuY3Rpb24gX2V4dGVuZCAoYSwgYikge1xuXHRmb3IgKHZhciBrIGluIGIpIGFba10gPSBiW2tdO1xufVxuXG4vLyBIZWxwZXIgdG8gY3JlYXRlIGdsc2wgdmVjdG9yIHJlcHJlc2VudGF0aW9uIG9mIGEgamF2YXNjcmlwdCBhcnJheS5cbmZ1bmN0aW9uIF9hcnJheVRvVmVjKGFycmF5KSB7XG4gICAgdmFyIGxlbiA9IGFycmF5Lmxlbmd0aDtcbiAgICByZXR1cm4gJ3ZlYycgKyBsZW4gKyAnKCcgKyBhcnJheS5qb2luKCcsJykgICsgJyknO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbXBpbGVNYXRlcmlhbDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gR2VuZXJhdGVzIGEgY2hlY2tlcmJvYXJkIHBhdHRlcm4gdG8gYmUgdXNlZCBhcyBhIHBsYWNlaG9sZGVyIHRleHR1cmUgd2hpbGUgYW5cbi8vIGltYWdlIGxvYWRzIG92ZXIgdGhlIG5ldHdvcmsuXG5mdW5jdGlvbiBjcmVhdGVDaGVja2VyQm9hcmQoKSB7XG4gICAgdmFyIGNvbnRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKS5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGNvbnRleHQuY2FudmFzLndpZHRoID0gY29udGV4dC5jYW52YXMuaGVpZ2h0ID0gMTI4O1xuICAgIGZvciAodmFyIHkgPSAwOyB5IDwgY29udGV4dC5jYW52YXMuaGVpZ2h0OyB5ICs9IDE2KSB7XG4gICAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgY29udGV4dC5jYW52YXMud2lkdGg7IHggKz0gMTYpIHtcbiAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gKHggXiB5KSAmIDE2ID8gJyNGRkYnIDogJyNEREQnO1xuICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh4LCB5LCAxNiwgMTYpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRleHQuY2FudmFzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUNoZWNrZXJCb2FyZDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciByYWRpeEJpdHMgPSAxMSxcbiAgICBtYXhSYWRpeCA9IDEgPDwgKHJhZGl4Qml0cyksXG4gICAgcmFkaXhNYXNrID0gbWF4UmFkaXggLSAxLFxuICAgIGJ1Y2tldHMgPSBuZXcgQXJyYXkobWF4UmFkaXggKiBNYXRoLmNlaWwoNjQgLyByYWRpeEJpdHMpKSxcbiAgICBtc2JNYXNrID0gMSA8PCAoKDMyIC0gMSkgJSByYWRpeEJpdHMpLFxuICAgIGxhc3RNYXNrID0gKG1zYk1hc2sgPDwgMSkgLSAxLFxuICAgIHBhc3NDb3VudCA9ICgoMzIgLyByYWRpeEJpdHMpICsgMC45OTk5OTk5OTk5OTk5OTkpIHwgMCxcbiAgICBtYXhPZmZzZXQgPSBtYXhSYWRpeCAqIChwYXNzQ291bnQgLSAxKSxcbiAgICBub3JtYWxpemVyID0gTWF0aC5wb3coMjAsIDYpO1xuXG52YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKDQpO1xudmFyIGZsb2F0VmlldyA9IG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyLCAwLCAxKTtcbnZhciBpbnRWaWV3ID0gbmV3IEludDMyQXJyYXkoYnVmZmVyLCAwLCAxKTtcblxuLy8gY29tcGFyYXRvciBwdWxscyByZWxldmFudCBzb3J0aW5nIGtleXMgb3V0IG9mIG1lc2hcbmZ1bmN0aW9uIGNvbXAobGlzdCwgcmVnaXN0cnksIGkpIHtcbiAgICB2YXIga2V5ID0gbGlzdFtpXTtcbiAgICB2YXIgaXRlbSA9IHJlZ2lzdHJ5W2tleV07XG4gICAgcmV0dXJuIChpdGVtLmRlcHRoID8gaXRlbS5kZXB0aCA6IHJlZ2lzdHJ5W2tleV0udW5pZm9ybVZhbHVlc1sxXVsxNF0pICsgbm9ybWFsaXplcjtcbn1cblxuLy9tdXRhdG9yIGZ1bmN0aW9uIHJlY29yZHMgbWVzaCdzIHBsYWNlIGluIHByZXZpb3VzIHBhc3NcbmZ1bmN0aW9uIG11dGF0b3IobGlzdCwgcmVnaXN0cnksIGksIHZhbHVlKSB7XG4gICAgdmFyIGtleSA9IGxpc3RbaV07XG4gICAgcmVnaXN0cnlba2V5XS5kZXB0aCA9IGludFRvRmxvYXQodmFsdWUpIC0gbm9ybWFsaXplcjtcbiAgICByZXR1cm4ga2V5O1xufVxuXG4vL2NsZWFuIGZ1bmN0aW9uIHJlbW92ZXMgbXV0YXRvciBmdW5jdGlvbidzIHJlY29yZFxuZnVuY3Rpb24gY2xlYW4obGlzdCwgcmVnaXN0cnksIGkpIHtcbiAgICByZWdpc3RyeVtsaXN0W2ldXS5kZXB0aCA9IG51bGw7XG59XG5cbi8vY29udmVydHMgYSBqYXZhc2NyaXB0IGZsb2F0IHRvIGEgMzJiaXQgaW50ZWdlciB1c2luZyBhbiBhcnJheSBidWZmZXJcbi8vb2Ygc2l6ZSBvbmVcbmZ1bmN0aW9uIGZsb2F0VG9JbnQoaykge1xuICAgIGZsb2F0Vmlld1swXSA9IGs7XG4gICAgcmV0dXJuIGludFZpZXdbMF07XG59XG4vL2NvbnZlcnRzIGEgMzIgYml0IGludGVnZXIgdG8gYSByZWd1bGFyIGphdmFzY3JpcHQgZmxvYXQgdXNpbmcgYW4gYXJyYXkgYnVmZmVyXG4vL29mIHNpemUgb25lXG5mdW5jdGlvbiBpbnRUb0Zsb2F0KGspIHtcbiAgICBpbnRWaWV3WzBdID0gaztcbiAgICByZXR1cm4gZmxvYXRWaWV3WzBdO1xufVxuXG4vL3NvcnRzIGEgbGlzdCBvZiBtZXNoIElEcyBhY2NvcmRpbmcgdG8gdGhlaXIgei1kZXB0aFxuZnVuY3Rpb24gcmFkaXhTb3J0KGxpc3QsIHJlZ2lzdHJ5KSB7XG4gICAgdmFyIHBhc3MgPSAwO1xuICAgIHZhciBvdXQgPSBbXTtcblxuICAgIHZhciBpLCBqLCBrLCBuLCBkaXYsIG9mZnNldCwgc3dhcCwgaWQsIHN1bSwgdHN1bSwgc2l6ZTtcblxuICAgIHBhc3NDb3VudCA9ICgoMzIgLyByYWRpeEJpdHMpICsgMC45OTk5OTk5OTk5OTk5OTkpIHwgMDtcblxuICAgIGZvciAoaSA9IDAsIG4gPSBtYXhSYWRpeCAqIHBhc3NDb3VudDsgaSA8IG47IGkrKykgYnVja2V0c1tpXSA9IDA7XG5cbiAgICBmb3IgKGkgPSAwLCBuID0gbGlzdC5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgZGl2ID0gZmxvYXRUb0ludChjb21wKGxpc3QsIHJlZ2lzdHJ5LCBpKSk7XG4gICAgICAgIGRpdiBePSBkaXYgPj4gMzEgfCAweDgwMDAwMDAwO1xuICAgICAgICBmb3IgKGogPSAwLCBrID0gMDsgaiA8IG1heE9mZnNldDsgaiArPSBtYXhSYWRpeCwgayArPSByYWRpeEJpdHMpIHtcbiAgICAgICAgICAgIGJ1Y2tldHNbaiArIChkaXYgPj4+IGsgJiByYWRpeE1hc2spXSsrO1xuICAgICAgICB9XG4gICAgICAgIGJ1Y2tldHNbaiArIChkaXYgPj4+IGsgJiBsYXN0TWFzayldKys7XG4gICAgfVxuXG4gICAgZm9yIChqID0gMDsgaiA8PSBtYXhPZmZzZXQ7IGogKz0gbWF4UmFkaXgpIHtcbiAgICAgICAgZm9yIChpZCA9IGosIHN1bSA9IDA7IGlkIDwgaiArIG1heFJhZGl4OyBpZCsrKSB7XG4gICAgICAgICAgICB0c3VtID0gYnVja2V0c1tpZF0gKyBzdW07XG4gICAgICAgICAgICBidWNrZXRzW2lkXSA9IHN1bSAtIDE7XG4gICAgICAgICAgICBzdW0gPSB0c3VtO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICgtLXBhc3NDb3VudCkge1xuICAgICAgICBmb3IgKGkgPSAwLCBuID0gbGlzdC5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGRpdiA9IGZsb2F0VG9JbnQoY29tcChsaXN0LCByZWdpc3RyeSwgaSkpO1xuICAgICAgICAgICAgb3V0WysrYnVja2V0c1tkaXYgJiByYWRpeE1hc2tdXSA9IG11dGF0b3IobGlzdCwgcmVnaXN0cnksIGksIGRpdiBePSBkaXYgPj4gMzEgfCAweDgwMDAwMDAwKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgc3dhcCA9IG91dDtcbiAgICAgICAgb3V0ID0gbGlzdDtcbiAgICAgICAgbGlzdCA9IHN3YXA7XG4gICAgICAgIHdoaWxlICgrK3Bhc3MgPCBwYXNzQ291bnQpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSBsaXN0Lmxlbmd0aCwgb2Zmc2V0ID0gcGFzcyAqIG1heFJhZGl4LCBzaXplID0gcGFzcyAqIHJhZGl4Qml0czsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgIGRpdiA9IGZsb2F0VG9JbnQoY29tcChsaXN0LCByZWdpc3RyeSwgaSkpO1xuICAgICAgICAgICAgICAgIG91dFsrK2J1Y2tldHNbb2Zmc2V0ICsgKGRpdiA+Pj4gc2l6ZSAmIHJhZGl4TWFzayldXSA9IGxpc3RbaV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3YXAgPSBvdXQ7XG4gICAgICAgICAgICBvdXQgPSBsaXN0O1xuICAgICAgICAgICAgbGlzdCA9IHN3YXA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwLCBuID0gbGlzdC5sZW5ndGgsIG9mZnNldCA9IHBhc3MgKiBtYXhSYWRpeCwgc2l6ZSA9IHBhc3MgKiByYWRpeEJpdHM7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgZGl2ID0gZmxvYXRUb0ludChjb21wKGxpc3QsIHJlZ2lzdHJ5LCBpKSk7XG4gICAgICAgIG91dFsrK2J1Y2tldHNbb2Zmc2V0ICsgKGRpdiA+Pj4gc2l6ZSAmIGxhc3RNYXNrKV1dID0gbXV0YXRvcihsaXN0LCByZWdpc3RyeSwgaSwgZGl2IF4gKH5kaXYgPj4gMzEgfCAweDgwMDAwMDAwKSk7XG4gICAgICAgIGNsZWFuKGxpc3QsIHJlZ2lzdHJ5LCBpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJhZGl4U29ydDtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIGdsc2xpZnkgPSByZXF1aXJlKFwiZ2xzbGlmeVwiKTtcbnZhciBzaGFkZXJzID0gcmVxdWlyZShcImdsc2xpZnkvc2ltcGxlLWFkYXB0ZXIuanNcIikoXCJcXG4jZGVmaW5lIEdMU0xJRlkgMVxcblxcbm1hdDMgYV94X2dldE5vcm1hbE1hdHJpeChpbiBtYXQ0IHQpIHtcXG4gIG1hdDMgbWF0Tm9ybTtcXG4gIG1hdDQgYSA9IHQ7XFxuICBmbG9hdCBhMDAgPSBhWzBdWzBdLCBhMDEgPSBhWzBdWzFdLCBhMDIgPSBhWzBdWzJdLCBhMDMgPSBhWzBdWzNdLCBhMTAgPSBhWzFdWzBdLCBhMTEgPSBhWzFdWzFdLCBhMTIgPSBhWzFdWzJdLCBhMTMgPSBhWzFdWzNdLCBhMjAgPSBhWzJdWzBdLCBhMjEgPSBhWzJdWzFdLCBhMjIgPSBhWzJdWzJdLCBhMjMgPSBhWzJdWzNdLCBhMzAgPSBhWzNdWzBdLCBhMzEgPSBhWzNdWzFdLCBhMzIgPSBhWzNdWzJdLCBhMzMgPSBhWzNdWzNdLCBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMCwgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLCBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMSwgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLCBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMCwgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLCBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMSwgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyLCBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XFxuICBkZXQgPSAxLjAgLyBkZXQ7XFxuICBtYXROb3JtWzBdWzBdID0gKGExMSAqIGIxMSAtIGExMiAqIGIxMCArIGExMyAqIGIwOSkgKiBkZXQ7XFxuICBtYXROb3JtWzBdWzFdID0gKGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNykgKiBkZXQ7XFxuICBtYXROb3JtWzBdWzJdID0gKGExMCAqIGIxMCAtIGExMSAqIGIwOCArIGExMyAqIGIwNikgKiBkZXQ7XFxuICBtYXROb3JtWzFdWzBdID0gKGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSkgKiBkZXQ7XFxuICBtYXROb3JtWzFdWzFdID0gKGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNykgKiBkZXQ7XFxuICBtYXROb3JtWzFdWzJdID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXQ7XFxuICBtYXROb3JtWzJdWzBdID0gKGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMykgKiBkZXQ7XFxuICBtYXROb3JtWzJdWzFdID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XFxuICBtYXROb3JtWzJdWzJdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXQ7XFxuICByZXR1cm4gbWF0Tm9ybTtcXG59XFxuZmxvYXQgYl94X2ludmVyc2UoZmxvYXQgbSkge1xcbiAgcmV0dXJuIDEuMCAvIG07XFxufVxcbm1hdDIgYl94X2ludmVyc2UobWF0MiBtKSB7XFxuICByZXR1cm4gbWF0MihtWzFdWzFdLCAtbVswXVsxXSwgLW1bMV1bMF0sIG1bMF1bMF0pIC8gKG1bMF1bMF0gKiBtWzFdWzFdIC0gbVswXVsxXSAqIG1bMV1bMF0pO1xcbn1cXG5tYXQzIGJfeF9pbnZlcnNlKG1hdDMgbSkge1xcbiAgZmxvYXQgYTAwID0gbVswXVswXSwgYTAxID0gbVswXVsxXSwgYTAyID0gbVswXVsyXTtcXG4gIGZsb2F0IGExMCA9IG1bMV1bMF0sIGExMSA9IG1bMV1bMV0sIGExMiA9IG1bMV1bMl07XFxuICBmbG9hdCBhMjAgPSBtWzJdWzBdLCBhMjEgPSBtWzJdWzFdLCBhMjIgPSBtWzJdWzJdO1xcbiAgZmxvYXQgYjAxID0gYTIyICogYTExIC0gYTEyICogYTIxO1xcbiAgZmxvYXQgYjExID0gLWEyMiAqIGExMCArIGExMiAqIGEyMDtcXG4gIGZsb2F0IGIyMSA9IGEyMSAqIGExMCAtIGExMSAqIGEyMDtcXG4gIGZsb2F0IGRldCA9IGEwMCAqIGIwMSArIGEwMSAqIGIxMSArIGEwMiAqIGIyMTtcXG4gIHJldHVybiBtYXQzKGIwMSwgKC1hMjIgKiBhMDEgKyBhMDIgKiBhMjEpLCAoYTEyICogYTAxIC0gYTAyICogYTExKSwgYjExLCAoYTIyICogYTAwIC0gYTAyICogYTIwKSwgKC1hMTIgKiBhMDAgKyBhMDIgKiBhMTApLCBiMjEsICgtYTIxICogYTAwICsgYTAxICogYTIwKSwgKGExMSAqIGEwMCAtIGEwMSAqIGExMCkpIC8gZGV0O1xcbn1cXG5tYXQ0IGJfeF9pbnZlcnNlKG1hdDQgbSkge1xcbiAgZmxvYXQgYTAwID0gbVswXVswXSwgYTAxID0gbVswXVsxXSwgYTAyID0gbVswXVsyXSwgYTAzID0gbVswXVszXSwgYTEwID0gbVsxXVswXSwgYTExID0gbVsxXVsxXSwgYTEyID0gbVsxXVsyXSwgYTEzID0gbVsxXVszXSwgYTIwID0gbVsyXVswXSwgYTIxID0gbVsyXVsxXSwgYTIyID0gbVsyXVsyXSwgYTIzID0gbVsyXVszXSwgYTMwID0gbVszXVswXSwgYTMxID0gbVszXVsxXSwgYTMyID0gbVszXVsyXSwgYTMzID0gbVszXVszXSwgYjAwID0gYTAwICogYTExIC0gYTAxICogYTEwLCBiMDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTAsIGIwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMCwgYjAzID0gYTAxICogYTEyIC0gYTAyICogYTExLCBiMDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTEsIGIwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMiwgYjA2ID0gYTIwICogYTMxIC0gYTIxICogYTMwLCBiMDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzAsIGIwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMCwgYjA5ID0gYTIxICogYTMyIC0gYTIyICogYTMxLCBiMTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzEsIGIxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMiwgZGV0ID0gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xcbiAgcmV0dXJuIG1hdDQoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5LCBhMDIgKiBiMTAgLSBhMDEgKiBiMTEgLSBhMDMgKiBiMDksIGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMywgYTIyICogYjA0IC0gYTIxICogYjA1IC0gYTIzICogYjAzLCBhMTIgKiBiMDggLSBhMTAgKiBiMTEgLSBhMTMgKiBiMDcsIGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNywgYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxLCBhMjAgKiBiMDUgLSBhMjIgKiBiMDIgKyBhMjMgKiBiMDEsIGExMCAqIGIxMCAtIGExMSAqIGIwOCArIGExMyAqIGIwNiwgYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2LCBhMzAgKiBiMDQgLSBhMzEgKiBiMDIgKyBhMzMgKiBiMDAsIGEyMSAqIGIwMiAtIGEyMCAqIGIwNCAtIGEyMyAqIGIwMCwgYTExICogYjA3IC0gYTEwICogYjA5IC0gYTEyICogYjA2LCBhMDAgKiBiMDkgLSBhMDEgKiBiMDcgKyBhMDIgKiBiMDYsIGEzMSAqIGIwMSAtIGEzMCAqIGIwMyAtIGEzMiAqIGIwMCwgYTIwICogYjAzIC0gYTIxICogYjAxICsgYTIyICogYjAwKSAvIGRldDtcXG59XFxuZmxvYXQgY194X3RyYW5zcG9zZShmbG9hdCBtKSB7XFxuICByZXR1cm4gbTtcXG59XFxubWF0MiBjX3hfdHJhbnNwb3NlKG1hdDIgbSkge1xcbiAgcmV0dXJuIG1hdDIobVswXVswXSwgbVsxXVswXSwgbVswXVsxXSwgbVsxXVsxXSk7XFxufVxcbm1hdDMgY194X3RyYW5zcG9zZShtYXQzIG0pIHtcXG4gIHJldHVybiBtYXQzKG1bMF1bMF0sIG1bMV1bMF0sIG1bMl1bMF0sIG1bMF1bMV0sIG1bMV1bMV0sIG1bMl1bMV0sIG1bMF1bMl0sIG1bMV1bMl0sIG1bMl1bMl0pO1xcbn1cXG5tYXQ0IGNfeF90cmFuc3Bvc2UobWF0NCBtKSB7XFxuICByZXR1cm4gbWF0NChtWzBdWzBdLCBtWzFdWzBdLCBtWzJdWzBdLCBtWzNdWzBdLCBtWzBdWzFdLCBtWzFdWzFdLCBtWzJdWzFdLCBtWzNdWzFdLCBtWzBdWzJdLCBtWzFdWzJdLCBtWzJdWzJdLCBtWzNdWzJdLCBtWzBdWzNdLCBtWzFdWzNdLCBtWzJdWzNdLCBtWzNdWzNdKTtcXG59XFxudmVjNCBhcHBseVRyYW5zZm9ybSh2ZWM0IHBvcykge1xcbiAgbWF0NCBNVk1hdHJpeCA9IHVfdmlldyAqIHVfdHJhbnNmb3JtO1xcbiAgcG9zLnggKz0gMS4wO1xcbiAgcG9zLnkgLT0gMS4wO1xcbiAgcG9zLnh5eiAqPSB1X3NpemUgKiAwLjU7XFxuICBwb3MueSAqPSAtMS4wO1xcbiAgdl9wb3NpdGlvbiA9IChNVk1hdHJpeCAqIHBvcykueHl6O1xcbiAgdl9leWVWZWN0b3IgPSAodV9yZXNvbHV0aW9uICogMC41KSAtIHZfcG9zaXRpb247XFxuICBwb3MgPSB1X3BlcnNwZWN0aXZlICogTVZNYXRyaXggKiBwb3M7XFxuICByZXR1cm4gcG9zO1xcbn1cXG4jdmVydF9kZWZpbml0aW9uc1xcblxcbnZlYzMgY2FsY3VsYXRlT2Zmc2V0KHZlYzMgSUQpIHtcXG4gIFxcbiAgI3ZlcnRfYXBwbGljYXRpb25zXFxuICByZXR1cm4gdmVjMygwLjApO1xcbn1cXG52b2lkIG1haW4oKSB7XFxuICB2X3RleHR1cmVDb29yZGluYXRlID0gYV90ZXhDb29yZDtcXG4gIHZlYzMgaW52ZXJ0ZWROb3JtYWxzID0gYV9ub3JtYWxzICsgKHVfbm9ybWFscy54IDwgMC4wID8gY2FsY3VsYXRlT2Zmc2V0KHVfbm9ybWFscykgKiAyLjAgLSAxLjAgOiB2ZWMzKDAuMCkpO1xcbiAgaW52ZXJ0ZWROb3JtYWxzLnkgKj0gLTEuMDtcXG4gIHZfbm9ybWFsID0gY194X3RyYW5zcG9zZShtYXQzKGJfeF9pbnZlcnNlKHVfdHJhbnNmb3JtKSkpICogaW52ZXJ0ZWROb3JtYWxzO1xcbiAgdmVjMyBvZmZzZXRQb3MgPSBhX3BvcyArIGNhbGN1bGF0ZU9mZnNldCh1X3Bvc2l0aW9uT2Zmc2V0KTtcXG4gIGdsX1Bvc2l0aW9uID0gYXBwbHlUcmFuc2Zvcm0odmVjNChvZmZzZXRQb3MsIDEuMCkpO1xcbn1cIiwgXCJcXG4jZGVmaW5lIEdMU0xJRlkgMVxcblxcbiNmbG9hdF9kZWZpbml0aW9uc1xcblxcbmZsb2F0IGFfeF9hcHBseU1hdGVyaWFsKGZsb2F0IElEKSB7XFxuICBcXG4gICNmbG9hdF9hcHBsaWNhdGlvbnNcXG4gIHJldHVybiAxLjtcXG59XFxuI3ZlYzNfZGVmaW5pdGlvbnNcXG5cXG52ZWMzIGFfeF9hcHBseU1hdGVyaWFsKHZlYzMgSUQpIHtcXG4gIFxcbiAgI3ZlYzNfYXBwbGljYXRpb25zXFxuICByZXR1cm4gdmVjMygwKTtcXG59XFxuI3ZlYzRfZGVmaW5pdGlvbnNcXG5cXG52ZWM0IGFfeF9hcHBseU1hdGVyaWFsKHZlYzQgSUQpIHtcXG4gIFxcbiAgI3ZlYzRfYXBwbGljYXRpb25zXFxuICByZXR1cm4gdmVjNCgwKTtcXG59XFxudmVjNCBiX3hfYXBwbHlMaWdodChpbiB2ZWM0IGJhc2VDb2xvciwgaW4gdmVjMyBub3JtYWwsIGluIHZlYzQgZ2xvc3NpbmVzcykge1xcbiAgaW50IG51bUxpZ2h0cyA9IGludCh1X251bUxpZ2h0cyk7XFxuICB2ZWMzIGFtYmllbnRDb2xvciA9IHVfYW1iaWVudExpZ2h0ICogYmFzZUNvbG9yLnJnYjtcXG4gIHZlYzMgZXllVmVjdG9yID0gbm9ybWFsaXplKHZfZXllVmVjdG9yKTtcXG4gIHZlYzMgZGlmZnVzZSA9IHZlYzMoMC4wKTtcXG4gIGJvb2wgaGFzR2xvc3NpbmVzcyA9IGdsb3NzaW5lc3MuYSA+IDAuMDtcXG4gIGJvb2wgaGFzU3BlY3VsYXJDb2xvciA9IGxlbmd0aChnbG9zc2luZXNzLnJnYikgPiAwLjA7XFxuICBmb3IoaW50IGkgPSAwOyBpIDwgNDsgaSsrKSB7XFxuICAgIGlmKGkgPj0gbnVtTGlnaHRzKVxcbiAgICAgIGJyZWFrO1xcbiAgICB2ZWMzIGxpZ2h0RGlyZWN0aW9uID0gbm9ybWFsaXplKHVfbGlnaHRQb3NpdGlvbltpXS54eXogLSB2X3Bvc2l0aW9uKTtcXG4gICAgZmxvYXQgbGFtYmVydGlhbiA9IG1heChkb3QobGlnaHREaXJlY3Rpb24sIG5vcm1hbCksIDAuMCk7XFxuICAgIGlmKGxhbWJlcnRpYW4gPiAwLjApIHtcXG4gICAgICBkaWZmdXNlICs9IHVfbGlnaHRDb2xvcltpXS5yZ2IgKiBiYXNlQ29sb3IucmdiICogbGFtYmVydGlhbjtcXG4gICAgICBpZihoYXNHbG9zc2luZXNzKSB7XFxuICAgICAgICB2ZWMzIGhhbGZWZWN0b3IgPSBub3JtYWxpemUobGlnaHREaXJlY3Rpb24gKyBleWVWZWN0b3IpO1xcbiAgICAgICAgZmxvYXQgc3BlY3VsYXJXZWlnaHQgPSBwb3cobWF4KGRvdChoYWxmVmVjdG9yLCBub3JtYWwpLCAwLjApLCBnbG9zc2luZXNzLmEpO1xcbiAgICAgICAgdmVjMyBzcGVjdWxhckNvbG9yID0gaGFzU3BlY3VsYXJDb2xvciA/IGdsb3NzaW5lc3MucmdiIDogdV9saWdodENvbG9yW2ldLnJnYjtcXG4gICAgICAgIGRpZmZ1c2UgKz0gc3BlY3VsYXJDb2xvciAqIHNwZWN1bGFyV2VpZ2h0ICogbGFtYmVydGlhbjtcXG4gICAgICB9XFxuICAgIH1cXG4gIH1cXG4gIHJldHVybiB2ZWM0KGFtYmllbnRDb2xvciArIGRpZmZ1c2UsIGJhc2VDb2xvci5hKTtcXG59XFxudm9pZCBtYWluKCkge1xcbiAgdmVjNCBtYXRlcmlhbCA9IHVfYmFzZUNvbG9yLnIgPj0gMC4wID8gdV9iYXNlQ29sb3IgOiBhX3hfYXBwbHlNYXRlcmlhbCh1X2Jhc2VDb2xvcik7XFxuICBib29sIGxpZ2h0c0VuYWJsZWQgPSAodV9mbGF0U2hhZGluZyA9PSAwLjApICYmICh1X251bUxpZ2h0cyA+IDAuMCB8fCBsZW5ndGgodV9hbWJpZW50TGlnaHQpID4gMC4wKTtcXG4gIHZlYzMgbm9ybWFsID0gbm9ybWFsaXplKHZfbm9ybWFsKTtcXG4gIHZlYzQgZ2xvc3NpbmVzcyA9IHVfZ2xvc3NpbmVzcy54IDwgMC4wID8gYV94X2FwcGx5TWF0ZXJpYWwodV9nbG9zc2luZXNzKSA6IHVfZ2xvc3NpbmVzcztcXG4gIHZlYzQgY29sb3IgPSBsaWdodHNFbmFibGVkID8gYl94X2FwcGx5TGlnaHQobWF0ZXJpYWwsIG5vcm1hbGl6ZSh2X25vcm1hbCksIGdsb3NzaW5lc3MpIDogbWF0ZXJpYWw7XFxuICBnbF9GcmFnQ29sb3IgPSBjb2xvcjtcXG4gIGdsX0ZyYWdDb2xvci5hICo9IHVfb3BhY2l0eTtcXG59XCIsIFtdLCBbXSk7XG5tb2R1bGUuZXhwb3J0cyA9IHNoYWRlcnM7IiwidmFyIERPTUVsZW1lbnQgPSByZXF1aXJlKCdmYW1vdXMvZG9tLXJlbmRlcmFibGVzL0RPTUVsZW1lbnQnKTtcbnZhciBOb2RlID0gcmVxdWlyZSgnZmFtb3VzL2NvcmUvTm9kZScpO1xuXG5mdW5jdGlvbiBDYW1lcmEobW91bnQpIHtcbiAgICAvLyBFeHRlbmQgTm9kZVxuICAgIE5vZGUuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmRvbSA9IG5ldyBET01FbGVtZW50KHRoaXMsIHsgXG5cdCAgICB0YWdOYW1lOiAndmlkZW8nLFxuXHQgICAgYXR0cmlidXRlczoge1xuXHQgICAgXHR3aWR0aDogJzEwMCUnLFxuXHQgICAgXHRoZWlnaHQ6ICcxMDAlJyxcblx0ICAgIFx0YXV0b3BsYXk6IHRydWUsXG5cdCAgICBcdGlkOiAnY2FtZXJhVmlkZW8nXG5cdCAgICB9LFxuXHQgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgekluZGV4OiAyMFxuICAgICAgICB9XG5cdH0pO1xuXHRpbml0V2ViQ2FtLmNhbGwodGhpcyk7XG59XG5cbkNhbWVyYS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE5vZGUucHJvdG90eXBlKTtcblxuZnVuY3Rpb24gaW5pdFdlYkNhbSgpIHtcblxuXHRuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1zR2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5vR2V0VXNlck1lZGlhO1xuXHQgXG5cdGlmIChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKSB7ICAgICAgIFxuXHQgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7dmlkZW86IHRydWV9LCBoYW5kbGVWaWRlbywgdmlkZW9FcnJvcik7XG5cdH1cblx0IFxuXHRmdW5jdGlvbiBoYW5kbGVWaWRlbyhzdHJlYW0pIHtcblx0XHR2YXIgdmlkZW8gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NhbWVyYVZpZGVvXCIpO1xuXHQgICAgdmlkZW8uc3JjID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoc3RyZWFtKTtcblx0fVxuXHQgXG5cdGZ1bmN0aW9uIHZpZGVvRXJyb3IoZSkge1xuXHQgICAgLy8gZG8gc29tZXRoaW5nXG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7IiwidmFyIE5vZGUgPSByZXF1aXJlKCdmYW1vdXMvY29yZS9Ob2RlJyk7XG52YXIgQ2FtZXJhID0gcmVxdWlyZSgnLi9DYW1lcmEnKTtcbnZhciBWaWRlbyA9IHJlcXVpcmUoJy4vVmlkZW8nKTtcblxuZnVuY3Rpb24gTWlycm9yKG1vdW50KSB7XG4gICAgLy8gRXh0ZW5kIE5vZGVcbiAgICBOb2RlLmNhbGwodGhpcyk7XG4gICAgdGhpcy5zZXRTaXplTW9kZSgnYWJzb2x1dGUnLCAnYWJzb2x1dGUnLCAnYWJzb2x1dGUnKVxuICAgICAgICAuc2V0QWJzb2x1dGVTaXplKGlubmVyV2lkdGgsIGlubmVySGVpZ2h0KTtcbiAgICBtYWtlQ2FtZXJhLmNhbGwodGhpcyk7XG4gICAgbWFrZVZpZGVvLmNhbGwodGhpcyk7XG59XG5cbi8vIEV4dGVuZCB0aGUgcHJvdG90eXBlXG5NaXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShOb2RlLnByb3RvdHlwZSk7XG5cbi8vIG1ha2UgdGhlIGNhbWVyYVxuZnVuY3Rpb24gbWFrZUNhbWVyYSAoKSB7XG4gICAgdGhpcy5jYW1lcmEgPSBuZXcgQ2FtZXJhKCk7XG4gICAgdGhpcy5hZGRDaGlsZCh0aGlzLmNhbWVyYSk7XG4gICAgdGhpcy5jYW1lcmEuc2V0T3BhY2l0eSguNSlcbiAgICAgICAgLnNldFByb3BvcnRpb25hbFNpemUoMSwgMSwgMSk7XG59XG5cbi8vIG1ha2UgdGhlIHZpZGVvXG5mdW5jdGlvbiBtYWtlVmlkZW8gKCkge1xuICAgIHRoaXMudmlkZW8gPSBuZXcgVmlkZW8oKTtcbiAgICB0aGlzLmFkZENoaWxkKHRoaXMudmlkZW8pO1xuICAgIHRoaXMudmlkZW8uc2V0T3BhY2l0eSgxKVxuICAgICAgICAuc2V0UHJvcG9ydGlvbmFsU2l6ZSgxLCAxLCAxKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNaXJyb3I7XG4iLCJ2YXIgRE9NRWxlbWVudCA9IHJlcXVpcmUoJ2ZhbW91cy9kb20tcmVuZGVyYWJsZXMvRE9NRWxlbWVudCcpO1xudmFyIE5vZGUgPSByZXF1aXJlKCdmYW1vdXMvY29yZS9Ob2RlJyk7XG5cbmZ1bmN0aW9uIFZpZGVvKG1vdW50KSB7XG4gICAgLy8gRXh0ZW5kIE5vZGVcbiAgICBOb2RlLmNhbGwodGhpcyk7XG4gICAgdGhpcy5kb20gPSBuZXcgRE9NRWxlbWVudCh0aGlzLCB7IFxuXHQgICAgdGFnTmFtZTogJ2lmcmFtZScsXG5cdCAgICBhdHRyaWJ1dGVzOiB7XG5cdCAgICBcdHdpZHRoOiAnMTAwJScsXG5cdCAgICBcdGhlaWdodDogJzEwMCUnLFxuXHQgICAgXHRzcmM6ICdodHRwOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL1pMX2pjTWlxU2VJP3JlbD0wJmF1dG9wbGF5PTEnLFxuXHQgICAgXHRmcmFtZWJvcmRlcjogMFxuXHQgICAgfSxcblx0ICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgIHpJbmRleDogMTBcbiAgICAgICAgfVxuXHR9KTtcbn1cblxuVmlkZW8ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShOb2RlLnByb3RvdHlwZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVmlkZW87IiwidmFyIE1pcnJvciA9IHJlcXVpcmUoJy4vTWlycm9yJyk7XG52YXIgRmFtb3VzRW5naW5lID0gcmVxdWlyZSgnZmFtb3VzL2NvcmUvRmFtb3VzRW5naW5lJyk7XG5cbkZhbW91c0VuZ2luZS5pbml0KCk7XG5GYW1vdXNFbmdpbmUuY3JlYXRlU2NlbmUoKS5hZGRDaGlsZChuZXcgTWlycm9yKCkpO1xuIl19