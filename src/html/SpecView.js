jasmine.HtmlReporter.SpecView = function(spec, dom, views) {

  this.status = function() {
    return this.getSpecStatus(spec);
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
    this.appendToSummary(spec, this.summaryEl, dom, views);
  };

  this.appendFailureDetail = function() {
    this.detailEl.className += ' ' + this.status();

    var resultItems = spec.results().getItems();
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
      dom.details.appendChild(this.detailEl);
    }
  };

  this.symbolEl = this.createDom('li', { className: 'pending' });
  dom.symbolSummary.appendChild(this.symbolEl);

  this.summaryEl = this.createDom('div', { className: 'specSummary' },
      this.createDom('a', {
        className: 'description',
        href: '?spec=' + encodeURIComponent(spec.getFullName()),
        title: spec.getFullName()
      }, spec.description)
  );

  this.detailEl = this.createDom('div', { className: 'specDetail' },
      this.createDom('a', {
        className: 'description',
        href: '?spec=' + encodeURIComponent(spec.getFullName()),
        title: spec.getFullName()
      }, spec.getFullName())
  );

  return this;
};

jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter.SpecView);