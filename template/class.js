//------------------------------------------------------------
//	_childClass :: Class, extends _parentClass

function _childClass() {
	_childClass.SUPERCLASS.call(this);
}
inherits(_childClass, _parentClass);


(function(p){

	p.className = "_childClass";
	
}(_childClass.prototype));


