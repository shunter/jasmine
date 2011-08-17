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
};