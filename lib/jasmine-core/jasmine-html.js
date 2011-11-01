(function() {

	function encode(name) {
		if (!name) {
			return name;
		}
		return encodeURIComponent(name).replace( /%20/g , '+');
	}

	function decode(name) {
		if (!name) {
			return name;
		}
		return decodeURIComponent(name.replace( /\+/g , ' '));
	}

	var paramMap;

	function getParamMap() {
		if (!paramMap) {
			paramMap = {};
			var params = document.location.search.substring(1).split('&');

			for (var i = 0; i < params.length; i++) {
				var p = params[i].split('=');
				paramMap[decode(p[0])] = decode(p[1]);
			}
		}
		return paramMap;
	}

	function isCollapsedByDefault(suite) {
		var paramMap = getParamMap();

		if (suite.getFullName() === paramMap.suite) {
			return false;
		}

		var parentSuite = suite.parentSuite;
		while (parentSuite) {
			if (parentSuite.getFullName() === paramMap.suite) {
				return false;
			}
			parentSuite = parentSuite.parentSuite;
		}

		var childSpecs = suite.specs();
		for (var i = 0, len = childSpecs.length; i < len; i++) {
			if (childSpecs[i].getFullName() === paramMap.spec) {
				return false;
			}
		}

		var childSuites = suite.suites();
		for (var i = 0, len = childSuites.length; i < len; i++) {
			if (!isCollapsedByDefault(childSuites[i])) {
				return false;
			}
		}

		return true;
	}

	jasmine.TrivialReporter = function(doc) {
		this.document = doc || document;
		this.suiteDivs = {};
		this.logRunningSpecs = false;
	};

	jasmine.TrivialReporter.prototype.createDom = function(type, attrs, childrenVarArgs) {
		var el = document.createElement(type);

		for (var i = 2; i < arguments.length; i++) {
			var child = arguments[i];

			if (typeof child === 'string') {
				el.appendChild(document.createTextNode(child));
			} else {
				if (child) {
					el.appendChild(child);
				}
			}
		}

		for (var attr in attrs) {
			if (attr == "className") {
				el[attr] = attrs[attr];
			} else {
				el.setAttribute(attr, attrs[attr]);
			}
		}

		return el;
	};

	jasmine.TrivialReporter.prototype.reportRunnerStarting = function(runner) {
		this.outerDiv = this.createDom('div', {className: 'jasmine_reporter'},
			this.createDom('div', {className: 'banner'},
				this.createDom('div', {className: 'logo'},
					this.createDom('span', {className: 'title'}, "Jasmine"),
					this.createDom('span', {className: 'version'}, runner.env.versionString()))
          ),
			this.runnerDiv = this.createDom('div', {className: 'runner running'},
				this.createDom('a', {className: 'run_spec', href: '?'}, "run all"),
				this.runnerMessageSpan = this.createDom('span', {}, "Running..."),
				this.finishedAtSpan = this.createDom('span', {className: 'finished-at'}, ""))
      );

		this.document.body.appendChild(this.outerDiv);

		var suites = runner.suites();
		for (var i = 0; i < suites.length; i++) {
			var suite = suites[i];
			var name = encode(suite.getFullName());
			var expander, collapser;
			var suiteDiv = this.createDom('div', {className: 'suite' + (isCollapsedByDefault(suite) ? ' collapse' : ''), id: name},
				this.createDom('a', {className: 'run_spec', href: '?suite=' + name}, "run"),
				expander = this.createDom('a', {className: 'expander'}, '[+]'),
				collapser = this.createDom('a', {className: 'collapser'}, '[-]'),
				this.createDom('a', {className: 'description', href: '?suite=' + name}, suite.description));

			expander.onclick = (function(suiteDiv) {
				return function(evt) {
					var classes = suiteDiv.className.split(' ');
					for (var i = classes.length - 1; i >= 0; i--) {
						if (classes[i] == 'collapse') {
							classes.splice(i, 1);
						}
					}
					suiteDiv.className = classes.join(' ');
				};
			}(suiteDiv));
			collapser.onclick = (function(suiteDiv) {
				return function(evt) {
					suiteDiv.className += ' collapse';
				};
			}(suiteDiv));

			this.suiteDivs[suite.id] = suiteDiv;
			var parentDiv = this.outerDiv;
			if (suite.parentSuite) {
				parentDiv = this.suiteDivs[suite.parentSuite.id];
			}
			parentDiv.appendChild(suiteDiv);
		}

		this.startedAt = new Date();
	};

	jasmine.TrivialReporter.prototype.reportRunnerResults = function(runner) {
		var results = runner.results();
		var className = (results.failedCount > 0) ? "runner failed" : "runner passed";
		this.runnerDiv.setAttribute("class", className);
		//do it twice for IE
		this.runnerDiv.setAttribute("className", className);
		var specs = runner.specs();
		var specCount = 0;
		for (var i = 0; i < specs.length; i++) {
			if (this.specFilter(specs[i])) {
				specCount++;
			}
		}
		var message = "" + specCount + " spec" + (specCount == 1 ? "" : "s") + ", " + results.failedCount + " failure" + ((results.failedCount == 1) ? "" : "s");
		message += " in " + ((new Date().getTime() - this.startedAt.getTime()) / 1000) + "s";
		this.runnerMessageSpan.replaceChild(this.createDom('a', {className: 'description', href: '?'}, message), this.runnerMessageSpan.firstChild);

		this.finishedAtSpan.appendChild(document.createTextNode("Finished at " + new Date().toString()));
	};

	jasmine.TrivialReporter.prototype.reportSuiteResults = function(suite) {
		var results = suite.results();
		var status = results.passed() ? 'passed' : 'failed';
		if (results.totalCount === 0) { // todo: change this to check results.skipped
			status = 'skipped';
		}
		this.suiteDivs[suite.id].className += " " + status;
	};

	jasmine.TrivialReporter.prototype.reportSpecStarting = function(spec) {
		if (this.logRunningSpecs) {
			this.log('>> Jasmine Running ' + spec.suite.description + ' ' + spec.description + '...');
		}
	};

	jasmine.TrivialReporter.prototype.reportSpecResults = function(spec) {
		var results = spec.results();
		var status = results.passed() ? 'passed' : 'failed';
		if (results.skipped) {
			status = 'skipped';
		}
		var name = encode(spec.getFullName());
		var specDiv = this.createDom('div', {className: 'spec ' + status, id: name},
			this.createDom('a', {className: 'run_spec', href: '?spec=' + name}, "run"),
			this.createDom('a', {
				className: 'description',
				href: '?spec=' + name,
				title: spec.getFullName()
			}, spec.description));

		var resultItems = results.getItems();
		var messagesDiv = this.createDom('div', {className: 'messages'});
		for (var i = 0; i < resultItems.length; i++) {
			var result = resultItems[i];

			if (result.type == 'log') {
				messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage log'}, result.toString()));
			} else if (result.type == 'expect' && result.passed && !result.passed()) {
				messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage fail'}, result.message));

				if (result.trace.stack) {
					messagesDiv.appendChild(this.createDom('div', {className: 'stackTrace'}, result.trace.stack));
				}
			}
		}

		if (messagesDiv.childNodes.length > 0) {
			specDiv.appendChild(messagesDiv);
		}

		this.suiteDivs[spec.suite.id].appendChild(specDiv);
	};

	jasmine.TrivialReporter.prototype.log = function() {
		var console = jasmine.getGlobal().console;
		if (console && console.log) {
			if (console.log.apply) {
				console.log.apply(console, arguments);
			} else {
				console.log(arguments); // ie fix: console.log.apply doesn't exist on ie
			}
		}
	};

	jasmine.TrivialReporter.prototype.specFilter = function(spec) {
		var paramMap = getParamMap();

		if (paramMap.spec) {
			return spec.getFullName() === paramMap.spec;
		}

		if (paramMap.suite) {
			var suite = spec.suite;
			while (suite) {
				if (suite.getFullName() === paramMap.suite) {
					return true;
				}
				suite = suite.parentSuite;
			}
			return false;
		}

		return true;
	};

})();