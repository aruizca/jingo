
!(function(window, $, undefined) {

  var cheatsheetShown = false;

  var $toolbar;

  var Jingo = {

    init: function() {
      var navh = $(".navbar").height(),
          $tools = $(".tools"),
          qs, hl = null;

      if (location.search !== "") {
        $("input[name=term]").focus();
        qs = $.map(location.search.substr(1).split("&"), function(kv) {
          kv = kv.split("=");
          return { k: kv[0], v: decodeURIComponent(kv[1]) };
        });
        $.each(qs, function(i, t) { if (t.k == "hl") { hl = t.v; } });
        if (hl) {
          if (window.find && window.getSelection) {
              document.designMode = "on";
              var sel = window.getSelection();
              sel.collapse(document.body, 0);
              while (window.find(hl)) {
                document.execCommand("HiliteColor", false, "yellow");
                sel.collapseToEnd();
              }
              sel.collapse(document.body, 0);
              window.find(hl);
              sel.collapseToEnd();
              document.designMode = "off";
          } else if (document.body.createTextRange) {
              var textRange = document.body.createTextRange();
              while (textRange.findText(hl)) {
                  textRange.execCommand("BackColor", false, "yellow");
                  textRange.collapse(false);
              }
          }
        }
      }

      $("#login").attr("href", function() { return $(this).attr("href").replace("destination", "destination=" + encodeURIComponent(location.pathname)); });

      $(".tools").height(navh);

      if ($(".tools > ul > li").length > 0) {
        var $pah = $("<li class=\"tools-handle\">Tools</li>");
        var pahTo, bodyPadding = $('body').css('padding-top');
        $pah.on("mouseover", function() {
          $tools.animate({"margin-top": bodyPadding == "40px" ? "0" : "-20"});
          $pah.slideUp();
        });
        $tools.on("mouseenter", function() {
          clearTimeout(pahTo);
        }).on("mouseleave", function() {
          pahTo = setTimeout(function() {
            $tools.animate({"margin-top": "-62"});
            $pah.slideDown();
          }, 500);
        });
        $(".tools > ul").append($pah);
      } else {
      }

      $(".confirm-delete-page").on("click", function(evt) {
        return window.confirm("Do you really want to delete this page?");
      });

      var $hCol1 = $(".history td:first-child");

      if ($("#content").hasClass("edit")) {
        $("#editor").focus();
      } else {
        $("#pageTitle").focus();
      }

      $("#rev-compare").attr("disabled", true);

      toggleCompareCheckboxes();
      $hCol1.find("input").on("click", function() {
        toggleCompareCheckboxes();
      });

      $("#rev-compare").on("click", function() {
        if ($hCol1.find(":checked").length < 2) {
          return false;
        }
        window.location.href = "/wiki/" + $(this).data("pagename") + "/compare/" + $hCol1.find(":checked").map(function() { return $(this).val(); }).toArray().reverse().join("..");
        return false;
      });

      if (/^\/pages\/.*\/edit/.test(window.location.pathname) || 
          /^\/pages\/new/.test(window.location.pathname)) {
        $("#editor").closest("form").on("submit", function () {
          if (Jingo.cmInstance) {
            Jingo.cmInstance.save();
          }
          window.sessionStorage.setItem("jingo-page", $("#editor").val());
        });
        if (window.location.search == "?e=1") {
          // Edit page in error: restore the body
          var content;
          if (content = window.sessionStorage.getItem("jingo-page")) {
            $("#editor").val(content);
          }
        } 
        else {
          window.sessionStorage.removeItem("jingo-page");
        }
      }

      if (/^\/wiki\//.test(window.location.pathname)) {
        var pages = []
          , match
          , href;

        $("#content a.internal").each(function(i, a) {
          href = $(a).attr("href");
          if (match = /\/wiki\/(.+)/.exec(href)) {
            pages.push(decodeURIComponent(match[1]));
          }
        });

        $.getJSON("/misc/existence", {data: pages}, function(result) {
          $.each(result.data, function(href, a) {
            $("#content a[href='\\/wiki\\/" + encodeURIComponent(a) + "']").addClass("absent");
          });
        });
      }

      function toggleCompareCheckboxes() {

        $("#rev-compare").attr("disabled", true);

        if ($hCol1.find(":checkbox").length == 1) {
          $hCol1.find(":checkbox").hide();
          return;
        }
        if ($hCol1.find(":checked").length == 2) {
          $("#rev-compare").attr("disabled", false);
          $hCol1.find(":not(:checked)")
                .hide();
          $hCol1.parent("tr")
                .css({"color": "silver"});
          $hCol1.find(":checked")
                .parents("tr")
                .css({"color": "black"});
        } else {
          $hCol1.find("input")
                .show()
                .parents("tr")
                .css({"color": "black"});
        }
      }

    },

    //TODO Deprecated
    preview: function() {
      $("#preview").modal({keyboard: true, show: true, backdrop: false});
      $.post("/misc/preview", {data: $("#editor").val()}, function(data) {
        $("#preview .modal-body").html(data).get(0).scrollTop = 0;
      });
    },

    toggleFullscreen: function() {

      var isFullscreen = Jingo.cmInstance.getOption("fullScreen");

      Jingo.cmInstance.setOption("fullScreen", !Jingo.cmInstance.getOption("fullScreen"));
      Jingo.cmInstance.focus();

      $toolbar.toggleClass("fullscreen", !isFullscreen);
    },

    toolbar: function() {

      $toolbar = $("<ul class='toolbar'>");
      $toolbar.append("<li title=\"Toggle fullscreen (Ctrl/Cmd+Enter)\" class=\"fullscreen\"><span></span></li>\
        <li title=\"Syntax help\" class=\"info\"><span></span></li>\
        <li title=\"Preview\" class=\"preview\"><span></span></li></ul>").insertBefore($("form.edit textarea:first").closest("div"));

      $("ul.toolbar").on("click", "span", function() {
        if (this.parentNode.className == "info") {
          Jingo.markdownSyntax();
        }
        if (this.parentNode.className == "preview") {
          Jingo.cmInstance.save();
          Jingo.preview();
        }
        if (this.parentNode.className == "fullscreen") {
          Jingo.toggleFullscreen();
        }
      });
    },

    markdownSyntax: function() {
      $("#syntax-reference").modal({keyboard: true, show: true, backdrop: false});
      if (!cheatsheetShown) {
        $("#syntax-reference .modal-body").load("/misc/syntax-reference");
        cheatsheetShown = true;
      }
    },

    showUploadDialog: function() {
      $("#file-upload-dialog").modal({keyboard: true, show: true, backdrop: false});
      $("#file-upload-dialog .modal-body").load("/misc/upload-form");
    },

    showFileBrowserDialog: function() {
      $("#file-browser-dialog").modal({keyboard: true, show: true, backdrop: false});
      $("#file-browser-dialog .modal-body").load("/misc/file-browser");
    },

    initBootstrapMarkdownEditor: function() {
      Jingo.bsmdInstance = $('#editor').markdown({
        iconlibrary: 'fa',
        additionalButtons: [
          [
            {
              name: "groupMisc",
              data: [{
                name: "markdownInfo",
                toggle: false, // this param only take effect if you load bootstrap.js
                title: "Markdown cheatsheet",
                hotkey: 'Ctrl+I',
                icon: "fa fa-lg fa-info-circle",
                callback: function (e) {
                  Jingo.markdownSyntax();
                }
              }]
            }, {
              name: "groupLink",
              data: [{
                name: "fileUpload",
                toggle: false, // this param only take effect if you load bootstrap.js
                title: "Upload files",
                hotkey: 'Ctrl+U',
                icon: "fa fa-lg fa-upload",
                callback: function (e) {
                  Jingo.showUploadDialog();
                }
              }]
            }, {
              name: "groupLink",
              data: [{
                name: "browseUploadedFiles",
                toggle: false, // this param only take effect if you load bootstrap.js
                title: "Browse uploaded files",
                hotkey: 'Ctrl+E',
                icon: "fa fa-lg fa-folder-open-o",
                callback: function (e) {
                  Jingo.showFileBrowserDialog();
                }
              }]
            }]
        ],
        onPreview: function (e) {
          var content = e.getContent();
          $.post("/misc/preview",{data: content}, function (data) {
            $('.md-preview').html(data);
          });
        }
      });
    }
  };

  window.Jingo = Jingo;

})(this, jQuery);
