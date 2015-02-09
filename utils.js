var utils = {
	// arguments accepted:
	// 	objects - required. This could be an array or arguments split by ','.
	//			  which means this function accepts multiple objects to be 
	//			  merged,and merged result will be applied to the first object
	// 			  of the array/sequence.At least one object is required to be 
	//			  merged, when only one object is given,this function will 
	// 			  return a new object which copies the given object's keys and
	//			  values,by which it means that this function is equal to object 
	// 			  clone.
	//	recrusive - optional. If objects are nested,set this to true will try 
	//				to merge nested keys and values into the first object, and
	// 				override the original values when exists.However,to make it 
	//				simple,the recrusivly merge will only applied when typof is 
	// 				strictly equals to 'object'.
	// 				Default set to true.
	"merge": function () {
		// quick ends
		if (arguments.length == 0) return null;
		// if the last argument is a boolean type, take it, or default set to false
		var recrusive = true;
		if (arguments.length > 0 && typeof arguments[arguments.length - 1] === "boolean") {
			recrusive = arguments[arguments.length - 1];
			delete arguments[arguments.length - 1];
		}
		// console.log("[merge] recrusive: " + recrusive);
		// quick ends
		if (arguments.length == 0) return null;
		// concat all the arguments into an array
		var objects = Array.prototype.slice.call(arguments, 0), 
			first = objects.length > 0 ? 
						objects.length == 1 ? {} : objects.shift() : null;
		// console.log("[merge] objects: " + objects);
		// works only when needed
		if (first) {
			var tomerge = null, // temp variable to store the next object to be merged
				keyIn = 
					function (key, target) {
						return typeof target[key] === "undefined";
					},
				isObject = 
					function (key, target) {
						return typeof target[key] === "object";
					},
				mergeTwo = // function to merge two objects into one
					function (a, b, r) {
						// check b first to get all keys to be merged into a
						for (var k in b) {
							// if recrusive and b[k] is a pure object,
							// copy it recrusivly
							if (r && isObject(k, b)) {
								// console.log("[merge] recrusive merging: ");
								// console.log("    key: " + k + ", a: " + a[k] + ", b: " + b[k]);
								a[k] = {};
								mergeTwo(a[k], b[k]);
								// console.log("[merge] recrusive merged: ");
								// console.log("    key: " + k + ", a: " + a[k] + ", b: " + b[k]);
							} else {
								// console.log("[merge] merging: ");
								// console.log("    key: " + k + ", a: " + a[k] + ", b: " + b[k]);
								a[k] = b[k];
								// console.log("[merge] merged: ");
								// console.log("    key: " + k + ", a: " + a[k] + ", b: " + b[k]);
							}
						}
					};
			while (objects.length > 0) {
				tomerge = objects.shift();
				if (tomerge) {
					mergeTwo(first, tomerge, recrusive);
					// console.log("[merge] merged: ");
					// console.log(first);
				}
			}
		}

		return first;
	}

};

module.exports = utils;