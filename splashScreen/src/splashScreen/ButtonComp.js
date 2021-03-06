var famous = require('famous');
var Scale = famous.components.Scale;

function ButtonComp (node) {
	this.node = node;
	this.id = node.addComponent(this);
	// node.addUIEvent('click');
	node.addUIEvent('touchstart');
	node.addUIEvent('touchmove');
	node.addUIEvent('touchend');
	node.onReceive = function onReceive(type, ev) {
		var scaleComp = new Scale(node);
	    // if (type === 'click') {
	    //     console.log('end');
	    // }
	    if (type === 'touchstart') {
	        scaleComp.set(1.5, 1.5, 1, {
	        	duration: 200,
	        	curve: 'inbounce'
	        });
	    }
	    if (type === 'touchmove') {
	    	scaleComp.set(1.5, 1.5, 1);
	    }
	    if (type === 'touchend') {
	        scaleComp.set(1, 1, 1, {
	        	duration: 200,
	        	curve: 'inbounce'
	        });
	    }
	    ev.stopPropagation();
	}
}

module.exports = ButtonComp;