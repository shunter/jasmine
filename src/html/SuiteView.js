jasmine.HtmlReporter.SuiteView = function(suite, dom, views) {

  this.status = function() {
    return this.getSpecStatus(suite);
  };

  this.refresh = function() {
    this.element.className += " " + this.status();
  };

  this.element = this.createDom('div', { className: 'suite' },
      this.createDom('a', { className: 'description', href: '?spec=' + encodeURIComponent(suite.getFullName()) }, suite.description)
  );

  this.appendToSummary(suite, this.element, dom, views);
};

jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter.SuiteView);

