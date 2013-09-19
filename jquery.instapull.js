/*!
 * jQuery InstaPull plugin
 *
 * Original author: @kbulis
 *
 * Further changes, comments: @kbulis
 *
 * Licensed under the MIT license
 *
 */
; (function ($, window, document, undefined) {
	var InstaPull = {
	};
	
    InstaPull.Plugin = function (oElement, oParameters) {
    	var oDefaults = {
	        clientId: "",
	        likingBy: "",
	        filterOn: "",
	        sortedBy: "",
	        untilNow: "",
	        afterNow: "",
	        pageSize: 20,
	        onWiring: function () {},
	        onPaging: function () {},
	        onFinish: function () {},
	        onNoMore: function () {},
	        onFailed: function () {}
	    };

    	this.parameters = $.extend({}, oDefaults, oParameters);

        if (typeof(this.parameters.clientId) !== "string" || this.parameters.clientId === "") {
        	this.parameters.clientId = this.parameters.clientid;
        }

        if (typeof(this.parameters.filterOn) !== "string") {
        	this.parameters.filterOn = "";
        }

        this.working = {
            array: [],
            index: +0,
            queue: ""
        };
        
        this.element = oElement;

        this.init();
    }

    InstaPull.Plugin.prototype.init = function () {
        var self = this, $element = $(self.element);

        self.fetch = function () {
        	if (typeof(self.parameters.clientId) === "string" && self.parameters.clientId !== "") {
        		function load() {
            		var sUrl = "https://api.instagram.com/v1/media/recent";
            		
            		if (self.parameters.filterOn !== "") {
            			sUrl = "https://api.instagram.com/v1/tags/" + self.parameters.filterOn + "/media/recent";
            		}

            		$.getJSON(sUrl + "?client_id=" + self.parameters.clientId + "&max_tag_id=" + self.working.queue + "&callback=?", function (oR) {
        				if (oR != null) {
    						if (typeof(oR.meta) !== "undefined" && typeof(oR.data) !== "undefined") {
    							var untilNow = 0, afterNow = 0, keepGoing = true;

								if (self.parameters.afterNow !== "") {
									try {
										afterNow = new Date(self.parameters.afterNow).getTime() / 1000;
									}
									catch (eX) {
										afterNow = 0;
									}
								}

								if (self.parameters.untilNow !== "") {
									try {
										untilNow = new Date(self.parameters.untilNow).getTime() / 1000;
									}
									catch (eX) {
										untilNow = 0;
									}
								}

								for (var iD = 0; iD < oR.data.length; ++iD) {
    								var oD = oR.data[iD];

    								if (untilNow > 0) {
    									if (oD.created_time > untilNow) {
    										continue;
    									}
    								}

    								if (afterNow > 0) {
    									if (oD.created_time < afterNow) {
    										continue;
    									}
    								}

    								if (oD.likes.count !== 0) {
    									self.working.array[self.working.array.length] = oD;
    								}
    							}

	    						if (oR.pagination.next_max_tag_id === undefined) {
	    							keepGoing = false;
	    						}
								
	    						if (keepGoing == true) {
	    							self.working.queue = oR.pagination.next_max_tag_id;
	
	        						load();
	    						}
	    						else {
	    	                        if (typeof(self.parameters.onFinish) === "function") {
	    	                        	try {
	    	                        		self.parameters.onFinish($element);
	    	                        	}
	    	                        	catch (eX) {
	    	                        	}
	    	                        }
	    							
	    							self.working.queue = "x";

	    							sort();

	    							keep();
	    						}
    						}
    						else {
    						}
        				}
        				else {
        				}
        			}).fail(function () {
                        if (typeof(self.parameters.onFailed) === "function") {
                        	try {
	                        	self.parameters.onFailed($element);
                        	}
                        	catch (eX) {
                        	}
                        }
        			});
        		}

        		function sort() {
        			if (self.parameters.sortedBy === "Recent" || self.parameters.sortedBy === "recent") {
        				self.working.array.sort(function (oA, oB) {
        					return oB.created_time - oA.created_time;
        				});
        			}
        			else
        			if (self.parameters.sortedBy === "Likes" || self.parameters.sortedBy === "likes") {
        				self.working.array.sort(function (oA, oB) {
        					return oB.likes.count - oA.likes.count;
        				});
        			}
        		}

        		function keep() {
        			if (self.parameters.likingBy !== "") {
	            		var aScatter = [];
	
	            		for (var iD = 0; iD < self.working.array.length; ++iD) {
							aScatter[iD] = $.getJSON("https://api.instagram.com/v1/media/" + self.working.array[iD].id + "/likes?client_id=" + self.parameters.clientId + "&callback=?", (function () {
								var cD = iD;
								
								return function (oL) {
									var bKeep = false;
									
									if (typeof(oL.data) !== "undefined") {
										for (var iL = 0; iL < oL.data.length; ++iL) {
											if (oL.data[iL].username === self.parameters.likingBy) {
												bKeep = true;
												break;
											}
										}
									}
	
									if (bKeep === false) {
										self.working.array[cD] = null;
									}
								};
							})()).fail(function () {
								self.working.array[cD] = null;
							});
	            		}
	            		
	            		$.when.apply($, aScatter).then(function () {
	            			var aA = [];
	            			
	            			for (var iA = 0, iD = 0; iD < self.working.array.length; ++iD) {
	            				if (self.working.array[iD] != null) {
		            				aA[iA] = self.working.array[iD];
		            				
		            				++iA;
	            				}
	            			}
	            			
	            			self.working.array = aA;
	            			self.working.index = +0;
	            			
	            			grab();
	            		});
        			}
        			else {
        				grab();
        			}
        		}
        		
        		function grab() {
        			var nI = self.parameters.pageSize;

        			while (nI > 0 && self.working.index !== self.working.array.length) {
        				var oD = self.working.array[self.working.index]; 

        				if (oD !== null) {
	        				if (typeof(self.parameters.onAdding) !== "function") {
	   							$element.append("<img src=\"" + oD.images.thumbnail.url + "\" alt=\"\" />");
		        		    }
		        		    else {
		        		    	try {
			        		    	self.parameters.onAdding($element, oD);
		        		    	}
		        		    	catch (eX) {
		        		    	}
		        		    }
	
		        		    --nI;
        				}
        				else {
        				}

	        		    ++self.working.index;
        			}
        			
        			if (self.working.index === self.working.array.length) {
                        if (typeof(self.parameters.onNoMore) === "function") {
                        	try {
                        		self.parameters.onNoMore($element);
                        	}
                        	catch (eX) {
                        	}
                        }
        			}
        		}
        		
        		if (self.working.index === self.working.array.length && self.working.queue !== "x") {
            		if (typeof(self.parameters.onPaging) === "function") {
                    	try {
                    		self.parameters.onPaging($element);
                    	}
                    	catch (eX) {
                    	}
                    }

            		load();
    			}
        		else {
        			grab();
        		}
	    	}
	    	else {
	    		console.error("Fetching requires parameter 'clientId'");
	    	}
        };

        self.reset = function () {
			self.working.array = [];
    		self.working.index = +0;
    		self.working.queue = "";
        };
        
        if (typeof(self.parameters.onWiring) === "function") {
        	try {
        		self.parameters.onWiring({ fetch: self.fetch.bind(self), reset: self.reset.bind(self) }, $element);
        	}
        	catch (eX) {
        	}
        }
    };

    $.fn["instapull"] = function (oParameters) {
        return this.each(function () {
            if (!$.data(this, "plugin_InstaPull")) {
        		if (typeof(oParameters) === "object") {
        			var oP = new InstaPull.Plugin(this, oParameters);

        			$.data(this, "plugin_InstaPull", oP);

        			oP.fetch();
        		}
        		else {
        			console.error("Expected parameters to be passed on first bind (don't forget to include 'clientId')");
        		}
            }
            else {
                $.data(this, "plugin_InstaPull").fetch();
            }
        });
    }

})(jQuery, window, document);