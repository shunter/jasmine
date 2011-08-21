jasmine.HtmlReporter.SpecView = function(spec, dom, views) {
  this.spec = spec;
  this.dom = dom;
  this.views = views;

  this.symbolEl = this.createDom('li', { className: 'pending' });
  this.dom.symbolSummary.appendChild(this.symbolEl);

  this.summaryEl = this.createDom('div', { className: 'specSummary' },
      this.createDom('a', {
        className: 'description',
        href: '?spec=' + encodeURIComponent(this.spec.getFullName()),
        title: this.spec.getFullName()
      }, this.spec.description)
  );

  this.detailEl = this.createDom('div', { className: 'specDetail' },
      this.createDom('a', {
        className: 'description',
        href: '?spec=' + encodeURIComponent(this.spec.getFullName()),
        title: this.spec.getFullName()
      }, this.spec.getFullName())
  );
};

jasmine.HtmlReporter.SpecView.prototype.status = function() {
  return this.getSpecStatus(this.spec);
};

jasmine.HtmlReporter.SpecView.prototype.refresh = function() {
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

jasmine.HtmlReporter.SpecView.prototype.appendSummaryToSuiteDiv = function() {
  this.summaryEl.className += ' ' + this.status();
  this.appendToSummary(this.spec, this.summaryEl);
};

jasmine.HtmlReporter.SpecView.prototype.appendFailureDetail = function() {
  this.detailEl.className += ' ' + this.status();

  var resultItems = this.spec.results().getItems();
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
    this.detailEl.appendChild(messagesDiv);
    this.dom.details.appendChild(this.detailEl);
  }
};

jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter.SpecView);