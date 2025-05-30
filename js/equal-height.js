(function ($) {
  var _previousResizeWidth = -1,
    _updateTimeout = -1;
  var _rows = function (elements) {
    var tolerance = 1,
      $elements = $(elements),
      lastTop = null,
      rows = [];
    $elements.each(function () {
      var $that = $(this),
        top = $that.offset().top - _parse($that.css("margin-top")),
        lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
      if (lastRow === null) {
        rows.push($that);
      } else {
        if (Math.floor(Math.abs(lastTop - top)) <= tolerance) {
          rows[rows.length - 1] = lastRow.add($that);
        } else {
          rows.push($that);
        }
      }
      lastTop = top;
    });
    return rows;
  };
  var _parse = function (value) {
    return parseFloat(value) || 0;
  };
  var _parseOptions = function (options) {
    var opts = { byRow: true, remove: false, property: "height" };
    if (typeof options === "object") {
      return $.extend(opts, options);
    }
    if (typeof options === "boolean") {
      opts.byRow = options;
    } else if (options === "remove") {
      opts.remove = true;
    }
    return opts;
  };
  var matchHeight = ($.fn.matchHeight = function (options) {
    var opts = _parseOptions(options);
    if (opts.remove) {
      var that = this;
      this.css(opts.property, "");
      $.each(matchHeight._groups, function (key, group) {
        group.elements = group.elements.not(that);
      });
      return this;
    }
    if (this.length <= 1) return this;
    matchHeight._groups.push({ elements: this, options: opts });
    matchHeight._apply(this, opts);
    return this;
  });
  matchHeight._groups = [];
  matchHeight._throttle = 80;
  matchHeight._maintainScroll = false;
  matchHeight._beforeUpdate = null;
  matchHeight._afterUpdate = null;
  matchHeight._apply = function (elements, options) {
    var opts = _parseOptions(options),
      $elements = $(elements),
      rows = [$elements];
    var scrollTop = $(window).scrollTop(),
      htmlHeight = $("html").outerHeight(true);
    var $hiddenParents = $elements.parents().filter(":hidden");
    $hiddenParents.each(function () {
      var $that = $(this);
      $that.data("style-cache", $that.attr("style"));
    });
    $hiddenParents.css("display", "block");
    if (opts.byRow) {
      $elements.each(function () {
        var $that = $(this),
          display =
            $that.css("display") === "inline-block" ? "inline-block" : "block";
        $that.data("style-cache", $that.attr("style"));
        $that.css({
          display: display,
          "padding-top": "0",
          "padding-bottom": "0",
          "margin-top": "0",
          "margin-bottom": "0",
          "border-top-width": "0",
          "border-bottom-width": "0",
          height: "100px",
        });
      });
      rows = _rows($elements);
      $elements.each(function () {
        var $that = $(this);
        $that.attr("style", $that.data("style-cache") || "");
      });
    }
    $.each(rows, function (key, row) {
      var $row = $(row),
        maxHeight = 0;
      if (opts.byRow && $row.length <= 1) {
        $row.css(opts.property, "");
        return;
      }
      $row.each(function () {
        var $that = $(this),
          display =
            $that.css("display") === "inline-block" ? "inline-block" : "block";
        var css = { display: display };
        css[opts.property] = "";
        $that.css(css);
        if ($that.outerHeight(false) > maxHeight)
          maxHeight = $that.outerHeight(false);
        $that.css("display", "");
      });
      $row.each(function () {
        var $that = $(this),
          verticalPadding = 0;
        if ($that.css("box-sizing") !== "border-box") {
          verticalPadding +=
            _parse($that.css("border-top-width")) +
            _parse($that.css("border-bottom-width"));
          verticalPadding +=
            _parse($that.css("padding-top")) +
            _parse($that.css("padding-bottom"));
        }
        $that.css(opts.property, maxHeight - verticalPadding);
      });
    });
    $hiddenParents.each(function () {
      var $that = $(this);
      $that.attr("style", $that.data("style-cache") || null);
    });
    if (matchHeight._maintainScroll)
      $(window).scrollTop(
        (scrollTop / htmlHeight) * $("html").outerHeight(true)
      );
    return this;
  };
  matchHeight._applyDataApi = function () {
    var groups = {};
    $("[data-match-height], [data-mh]").each(function () {
      var $this = $(this),
        groupId = $this.attr("data-match-height") || $this.attr("data-mh");
      if (groupId in groups) {
        groups[groupId] = groups[groupId].add($this);
      } else {
        groups[groupId] = $this;
      }
    });
    $.each(groups, function () {
      this.matchHeight(true);
    });
  };
  var _update = function (event) {
    if (matchHeight._beforeUpdate)
      matchHeight._beforeUpdate(event, matchHeight._groups);
    $.each(matchHeight._groups, function () {
      matchHeight._apply(this.elements, this.options);
    });
    if (matchHeight._afterUpdate)
      matchHeight._afterUpdate(event, matchHeight._groups);
  };
  matchHeight._update = function (throttle, event) {
    if (event && event.type === "resize") {
      var windowWidth = $(window).width();
      if (windowWidth === _previousResizeWidth) return;
      _previousResizeWidth = windowWidth;
    }
    if (!throttle) {
      _update(event);
    } else if (_updateTimeout === -1) {
      _updateTimeout = setTimeout(function () {
        _update(event);
        _updateTimeout = -1;
      }, matchHeight._throttle);
    }
  };
  $(matchHeight._applyDataApi);
  $(window).bind("load", function (event) {
    matchHeight._update(false, event);
  });
  $(window).bind("resize orientationchange", function (event) {
    matchHeight._update(true, event);
  });
})(jQuery);
