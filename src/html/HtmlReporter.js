jasmine.HtmlReporter = function(__doc) {
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
      dom.reporter = self.createDom('div', { className: 'jasmine_reporter' },
        dom.banner = self.createDom('div', { className: 'banner' },
          self.createDom('span', { className: 'title' }, "Jasmine "),
          self.createDom('span', { className: 'version' }, version)),

        dom.symbolSummary = self.createDom('ul', {className: 'symbolSummary'}),
        dom.alert = self.createDom('div', {className: 'alert'}),
        dom.results = self.createDom('div', {className: 'results'},
          dom.summary = self.createDom('div', { className: 'summary' }),
          dom.details = self.createDom('div', { id: 'details' }))
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
};
jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter);