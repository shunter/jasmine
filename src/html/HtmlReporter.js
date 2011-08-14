jasmine.HtmlReporter = function(doc) {
  var createDom = jasmine.HtmlReporter.createDom;
  var SpecView = jasmine.HtmlReporter.SpecView;

  var self = this;
  var _doc = doc || window.document;

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
    _doc.body.appendChild(dom.reporter);

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
    var paramMap = {};
    var params = _doc.location.search.substring(1).split('&');
    for (var i = 0; i < params.length; i++) {
      var p = params[i].split('=');
      paramMap[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
    }

    if (!paramMap.spec) {
      return true;
    }
    return spec.getFullName().indexOf(paramMap.spec) === 0;
  };

  return self;
};