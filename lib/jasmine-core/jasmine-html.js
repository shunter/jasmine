jasmine.HtmlReporter = function(__doc) {
  var createDom = jasmine.HtmlReporter.createDom;
  var SpecView = jasmine.HtmlReporter.SpecView;

  var self = this;
  var doc = __doc || window.document;

  var reporterView;

  var dom = {};
  var views = {
    suites: {},
    specs: {}
  };

  // Jasmine Reporter Public Interface
  self.logRunningSpecs = false;

  self.reportRunnerStarting = function(runner) {
    var specs = runner.specs() || [];

    if (specs.length == 0) {
      return;
    }

    createReporterDom(dom, runner.env.versionString());
    doc.body.appendChild(dom.reporter);

    reporterView = new jasmine.HtmlReporter.ReporterView(specs, self.specFilter, dom, views);

    function createReporterDom(dom, version) {
      dom.reporter = createDom('div', { className: 'jasmine_reporter' },
        dom.banner = createDom('div', { className: 'banner' },
          createDom('span', { className: 'title' }, "Jasmine "),
          createDom('span', { className: 'version' }, version)),

        dom.symbolSummary = createDom('ul', {className: 'symbolSummary'}),
        dom.alert = createDom('div', {className: 'alert'}),
        dom.results = createDom('div', {className: 'results'},
          dom.summary = createDom('div', { className: 'summary' }),
          dom.details = createDom('div', { id: 'details' }))
      );
    }
  };

  self.reportRunnerResults = function(runner) {
    reporterView.complete();
  };

  self.reportSuiteResults = function(suite) {
    if (typeof views.suites[suite.id] == 'undefined') {
      return;
    }
    views.suites[suite.id].refresh();
  };

  self.reportSpecStarting = function(spec) {
    if (self.logRunningSpecs) {
      self.log('>> Jasmine Running ' + spec.suite.description + ' ' + spec.description + '...');
    }
  };

  self.reportSpecResults = function(spec) {
    var specView = views.specs[spec.id];

    // TODO: is this code ever used? Maybe in the case of an it without a suite, but that's not allowed, right?
    if (typeof views.specs[spec.id] == 'undefined') {
      views.specs[spec.id] = new SpecView(spec, dom, views);
      specView = views.specs[spec.id];
    }

    specView.refresh();
    reporterView.specComplete(specView);
  };

  self.log = function() {
    var console = jasmine.getGlobal().console;
    if (console && console.log) {
      if (console.log.apply) {
        console.log.apply(console, arguments);
      } else {
        console.log(arguments); // ie fix: console.log.apply doesn't exist on ie
      }
    }
  };

  self.specFilter = function(spec) {
    if (!focusedSpecName()) {
      return true;
    }

    return spec.getFullName().indexOf(focusedSpecName()) === 0;
  };

  return self;

  function focusedSpecName() {
    var specName;

    (function memoizeFocusedSpec() {
      if (specName) {
        return;
      }

      var paramMap = [];
      var params = doc.location.search.substring(1).split('&');

      for (var i = 0; i < params.length; i++) {
        var p = params[i].split('=');
        paramMap[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
      }

      specName = paramMap.spec;
    })();

    return specName;
  }

};jasmine.HtmlReporter.createDom = function(type, attrs, childrenVarArgs) {
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

jasmine.HtmlReporter.getSpecStatus = function(child) {
  var results = child.results();
  var status = results.passed() ? 'passed' : 'failed';
  if (results.skipped) {
    status = 'skipped';
  }

  return status;
};

jasmine.HtmlReporter.ReporterView = function(specs, specFilter, dom, views) {
  this.startedAt = new Date();
  this.runningSpecCount = 0;
  this.completeSpecCount = 0;
  this.passedCount = 0;
  this.failedCount = 0;
  this.skippedCount = 0;

  var createDom = jasmine.HtmlReporter.createDom;

  this.createResultsMenu = function() {
    this.resultsMenu = createDom('span', {className: 'resultsMenu bar'},
        this.summaryMenuItem = createDom('a', {className: 'summaryMenuItem', href: "#"}, '0 specs'),
        ' | ',
        this.detailsMenuItem = createDom('a', {className: 'detailsMenuItem', href: "#"}, '0 failing'));

    this.summaryMenuItem.onclick = function() {
      dom.reporter.className = dom.reporter.className.replace(/ showDetails/g, '');
    };

    this.detailsMenuItem.onclick = function() {
      showDetails();
    };
  };

  this.specComplete = function(specView) {
    this.completeSpecCount++;

    switch (specView.status()) {
      case 'passed':
        this.passedCount++;
        break;

      case 'failed':
        this.failedCount++;
        break;

      case 'skipped':
        this.skippedCount++;
        break;
    }

    this.refresh();
  };

  this.refresh = function() {
    if (typeof this.runningAlert == 'undefined') {
      this.runningAlert = createDom('a', {href: "?", className: "runningAlert bar"});
      dom.alert.appendChild(this.runningAlert);
    }

    if (typeof this.skippedAlert == 'undefined') {
      this.skippedAlert = createDom('a', {href: "?", className: "skippedAlert bar"});
    }

    if (typeof this.passedAlert == 'undefined') {
      this.passedAlert = createDom('span', {href: "?", className: "passingAlert bar"});
    }

    if (typeof this.failedAlert == 'undefined') {
      this.failedAlert = createDom('span', {href: "?", className: "failingAlert bar"});
    }

    if (typeof this.resultsMenu == 'undefined') {
      this.createResultsMenu();
    }

    if (this.skippedCount === 1 && typeof dom.alert != 'undefined') {
      dom.alert.appendChild(this.skippedAlert);
    }

    if (this.failedCount === 1 && typeof dom.alert != 'undefined') {
      dom.alert.appendChild(this.failedAlert);
      dom.alert.appendChild(this.resultsMenu);
    }

    this.runningAlert.innerHTML = "Running " + this.completeSpecCount + " of " + this.totalSpecCount + " spec" + (this.totalSpecCount == 1 ? "" : "s" );
    this.passedAlert.innerHTML = "Passing " + this.passedCount + " spec" + (this.passedCount == 1 ? "" : "s" );
    this.failedAlert.innerHTML = "Failing " + this.failedCount + " spec" + (this.totalSpecCount == 1 ? "" : "s" );
    this.skippedAlert.innerHTML = "Skipping " + this.skippedCount + " of " + this.totalSpecCount + " spec" + (this.totalSpecCount == 1 ? "" : "s" ) + " - run all";

    this.summaryMenuItem.innerHTML = "" + this.runningSpecCount + " spec" + (this.runningSpecCount == 1 ? "" : "s" );
    this.detailsMenuItem.innerHTML = "" + this.failedCount + " failing";
  };

  this.complete = function() {
    dom.alert.removeChild(this.runningAlert);

    this.skippedAlert.innerHTML = "Ran " + this.runningSpecCount + " of " + this.totalSpecCount + " spec" + (this.totalSpecCount == 1 ? "" : "s" ) + " - run all";

    // if all specs are passing, show passing alert else show failing details
    if (this.failedCount === 0) {
      dom.alert.appendChild(createDom('span', {className: 'passingAlert bar'}, "Passing " + this.passedCount + " spec" + (this.passedCount == 1 ? "" : "s" )));
    } else {
      showDetails();
    }

    dom.banner.appendChild(createDom('span', {className: 'duration'}, "finished in " + ((new Date().getTime() - this.startedAt.getTime()) / 1000) + "s"));
  };

  for (var i = 0; i < specs.length; i++) {
    var currentSpec = specs[i];
    views.specs[currentSpec.id] = new jasmine.HtmlReporter.SpecView(currentSpec, dom, views);
    if (specFilter(currentSpec)) {
      this.runningSpecCount++;
    }
  }

  this.totalSpecCount = specs.length;

  return this;

  function showDetails() {
    if (dom.reporter.className.search(/showDetails/) === -1) {
      dom.reporter.className += " showDetails";
    }
  }
};
jasmine.HtmlReporter.SpecView = function(spec, dom, views) {
  var createDom = jasmine.HtmlReporter.createDom;

  this.status = function() {
    return jasmine.HtmlReporter.getSpecStatus(spec);
  };

  this.refresh = function() {
    this.symbolEl.className = this.status();

    switch (this.status()) {
      case 'skipped':
        break;

      case 'passed':
        this.appendSummaryToSuiteDiv();
        break;

      case 'failed':
        this.appendSummaryToSuiteDiv();
        this.appendFailureDetail();
        break;
    }
  };

  this.appendSummaryToSuiteDiv = function() {
    this.summaryEl.className += ' ' + this.status();
    appendToSummary(spec, this.summaryEl)
  };

  this.appendFailureDetail = function() {
    this.detailEl.className += ' ' + this.status();

    var resultItems = spec.results().getItems();
    var messagesDiv = createDom('div', { className: 'messages' });

    for (var i = 0; i < resultItems.length; i++) {
      var result = resultItems[i];

      if (result.type == 'log') {
        messagesDiv.appendChild(createDom('div', {className: 'resultMessage log'}, result.toString()));
      } else if (result.type == 'expect' && result.passed && !result.passed()) {
        messagesDiv.appendChild(createDom('div', {className: 'resultMessage fail'}, result.message));

        if (result.trace.stack) {
          messagesDiv.appendChild(createDom('div', {className: 'stackTrace'}, result.trace.stack));
        }
      }
    }

    if (messagesDiv.childNodes.length > 0) {
      this.detailEl.appendChild(messagesDiv);
      dom.details.appendChild(this.detailEl);
    }
  };

  this.symbolEl = createDom('li', { className: 'pending' });
  dom.symbolSummary.appendChild(this.symbolEl);

  this.summaryEl = createDom('div', { className: 'specSummary' },
      createDom('a', {
        className: 'description',
        href: '?spec=' + encodeURIComponent(spec.getFullName()),
        title: spec.getFullName()
      }, spec.description)
  );

  this.detailEl = createDom('div', { className: 'specDetail' },
      createDom('a', {
        className: 'description',
        href: '?spec=' + encodeURIComponent(spec.getFullName()),
        title: spec.getFullName()
      }, spec.getFullName())
  );

  return this;

  function appendToSummary(child, childElement) {
    var parentDiv = dom.summary;
    var parentSuite = (typeof child.parentSuite == 'undefined') ? 'suite' : 'parentSuite';
    var parent = child[parentSuite];

    if (parent) {
      if (typeof views.suites[parent.id] == 'undefined') {
        views.suites[parent.id] = new SuiteView(parent);
      }
      parentDiv = views.suites[parent.id].element;
    }

    parentDiv.appendChild(childElement);
  }

  function SuiteView(suite) {

    this.status = function() {
      return jasmine.HtmlReporter.getSpecStatus(suite);
    };

    this.refresh = function() {
      this.element.className += " " + this.status();
    };

    this.element = createDom('div', { className: 'suite' },
        createDom('a', { className: 'description', href: '?spec=' + encodeURIComponent(suite.getFullName()) }, suite.description)
    );
    appendToSummary(suite, this.element);

  }
};jasmine.TrivialReporter = function(doc) {
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
      if (child) { el.appendChild(child); }
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
  var showPassed, showSkipped;

  this.outerDiv = this.createDom('div', { className: 'jasmine_reporter' },
      this.createDom('div', { className: 'banner' },
        this.createDom('div', { className: 'logo' },
            this.createDom('span', { className: 'title' }, "Jasmine"),
            this.createDom('span', { className: 'version' }, runner.env.versionString())),
        this.createDom('div', { className: 'options' },
            "Show ",
            showPassed = this.createDom('input', { id: "__jasmine_TrivialReporter_showPassed__", type: 'checkbox' }),
            this.createDom('label', { "for": "__jasmine_TrivialReporter_showPassed__" }, " passed "),
            showSkipped = this.createDom('input', { id: "__jasmine_TrivialReporter_showSkipped__", type: 'checkbox' }),
            this.createDom('label', { "for": "__jasmine_TrivialReporter_showSkipped__" }, " skipped")
            )
          ),

      this.runnerDiv = this.createDom('div', { className: 'runner running' },
          this.createDom('a', { className: 'run_spec', href: '?' }, "run all"),
          this.runnerMessageSpan = this.createDom('span', {}, "Running..."),
          this.finishedAtSpan = this.createDom('span', { className: 'finished-at' }, ""))
      );

  this.document.body.appendChild(this.outerDiv);

  var suites = runner.suites();
  for (var i = 0; i < suites.length; i++) {
    var suite = suites[i];
    var suiteDiv = this.createDom('div', { className: 'suite' },
        this.createDom('a', { className: 'run_spec', href: '?spec=' + encodeURIComponent(suite.getFullName()) }, "run"),
        this.createDom('a', { className: 'description', href: '?spec=' + encodeURIComponent(suite.getFullName()) }, suite.description));
    this.suiteDivs[suite.id] = suiteDiv;
    var parentDiv = this.outerDiv;
    if (suite.parentSuite) {
      parentDiv = this.suiteDivs[suite.parentSuite.id];
    }
    parentDiv.appendChild(suiteDiv);
  }

  this.startedAt = new Date();

  var self = this;
  showPassed.onclick = function(evt) {
    if (showPassed.checked) {
      self.outerDiv.className += ' show-passed';
    } else {
      self.outerDiv.className = self.outerDiv.className.replace(/ show-passed/, '');
    }
  };

  showSkipped.onclick = function(evt) {
    if (showSkipped.checked) {
      self.outerDiv.className += ' show-skipped';
    } else {
      self.outerDiv.className = self.outerDiv.className.replace(/ show-skipped/, '');
    }
  };
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
  var message = "" + specCount + " spec" + (specCount == 1 ? "" : "s" ) + ", " + results.failedCount + " failure" + ((results.failedCount == 1) ? "" : "s");
  message += " in " + ((new Date().getTime() - this.startedAt.getTime()) / 1000) + "s";
  this.runnerMessageSpan.replaceChild(this.createDom('a', { className: 'description', href: '?'}, message), this.runnerMessageSpan.firstChild);

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
  var specDiv = this.createDom('div', { className: 'spec '  + status },
      this.createDom('a', { className: 'run_spec', href: '?spec=' + encodeURIComponent(spec.getFullName()) }, "run"),
      this.createDom('a', {
        className: 'description',
        href: '?spec=' + encodeURIComponent(spec.getFullName()),
        title: spec.getFullName()
      }, spec.description));


  var resultItems = results.getItems();
  var messagesDiv = this.createDom('div', { className: 'messages' });
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

jasmine.TrivialReporter.prototype.getLocation = function() {
  return this.document.location;
};

jasmine.TrivialReporter.prototype.specFilter = function(spec) {
  var paramMap = {};
  var params = this.getLocation().search.substring(1).split('&');
  for (var i = 0; i < params.length; i++) {
    var p = params[i].split('=');
    paramMap[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
  }

  if (!paramMap.spec) {
    return true;
  }
  return spec.getFullName().indexOf(paramMap.spec) === 0;
};
