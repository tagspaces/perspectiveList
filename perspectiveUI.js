/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

/* global define, Handlebars, isWin, Mousetrap  */
define(function(require, exports, module) {
  "use strict";

  console.log("Loading UI for perspectiveList");

  var TSCORE = require("tscore");
  var TSPOSTIO = require("tspostioapi");
  var saveAs = require("libs/filesaver.js/FileSaver.min");

  var TMB_SIZES = ["100px", "200px", "300px", "400px", "500px"];
  var supportedFileTypeThumnailing = ['jpg', 'jpeg', 'png', 'gif'];

  var extensionDirectory;

  var selectedIsFolderArr = [];
  var showFoldersInList = false;
  var showSortDataInList = 'byName', orderBy = false;
  var hasFolderInList = false;
  var extSettings;
  loadExtSettings();

  if (extSettings && extSettings.showFoldersInList) {
    showFoldersInList = extSettings.showFoldersInList;
  }

  if (extSettings && extSettings.orderBy) {
    orderBy = extSettings.orderBy;
  }

  if (extSettings && extSettings.showSortDataInList) {
    showSortDataInList = extSettings.showSortDataInList;
  }
  //save settings for perpectiveList
  function saveExtSettings() {
    var settings = {
      "showFoldersInList": showFoldersInList,
      "showSortDataInList": showSortDataInList,
      "orderBy": orderBy
    };
    localStorage.setItem('perpectiveListSettings', JSON.stringify(settings));
  }
  //load settings for perpectiveGrid
  function loadExtSettings() {
    extSettings = JSON.parse(localStorage.getItem("perpectiveListSettings"));
  }

  var fileTileTmpl = Handlebars.compile(
    '<tr class="odd ui-droppable ui-selected">' +
    '<td class="byExtension fileTitle noWrap">' +
    '<button filepath="{{filepath}}" isdirectory="" title="{{filepath}}" class="btn btn-link fileTitleButton fileExtColor ui-draggable ui-draggable-handle" data-ext="zip">' +
    '<span class="fileExt">{{fileext}}<span class="fa {{selected}} --->fa-ellipsis-v"></span></span></button><br><button filepath="{{filepath}}" class="btn btn-link fileSelection">' +
    '<i class="fa fa-fw fa-lg {{selected}} ---> fa-check-square-o"></i>'+
    '</button></td>'+
    '<td class="byName fileTitle forceWrap fileTitleWidth">{{title}}</td>'+
    '<td class="byTagCount fileTitle forceWrap">' +
    '{{#each tags}}' +
    '<button class="btn btn-sm tagButton fileTagsTile" tag="{{tag}}" filepath="{{filepath}}" style="{{style}}">{{tag}}' +
    '<!-- <span class="fa fa-ellipsis-v"></span--></button>' +
    '{{/each}}' +'</td>'+
    '<td class="byFileSize fileTitle">{{fileSize}}</td>'+
    '<td class="byDateModified fileTitle">{{dateModified}}</td></tr>'

   /* '<div title="{{filepath}}" filepath="{{filepath}}" class="fileTile" style="background-image: url(\'{{thumbPath}}\')">' +
    '<button class="btn btn-link fileTileSelector {{coloredExtClass}}" data-ext="{{fileext}}" filepath="{{filepath}}">' +
    '<i class="fa {{selected}} fa-lg"></i><span class="fileExtTile">{{fileext}}</span></button>' +
    '<div class="tagsInFileTile">' +
    '{{#each tags}}' +
    '<button class="btn btn-sm tagButton fileTagsTile" tag="{{tag}}" filepath="{{filepath}}" style="{{style}}">{{tag}}' +
    '<!-- <span class="fa fa-ellipsis-v"></span--></button>' +
    '{{/each}}' +
    '</div>' +
    '<div class="titleInFileTile">{{title}}</div>' +
    '</div>'*/
  );

 /* var folderTileTmpl = Handlebars.compile(
    '<div title="{{folderpath}}" folderpath="{{folderpath}}" class="fileTile">' +
    '<button class="btn btn-link fileTileSelector {{coloredExtClass}}" data-ext="folder" folderpath="{{folderpath}}">' +
    '<i class="fa fa-folder-o fa-lg"></i><!--span class="fileExtTile">{{title}}</span--></button>' +
    '<div class="tagsInFileTile">' +
    '{{#each tags}}' +
    '<button class="btn btn-sm tagButton fileTagsTile" tag="{{tag}}" folderpath="{{folderpath}}" style="{{style}}">{{tag}}</button>' +
    '{{/each}}' +
    '</div>' +
    '<div class="titleInFileTile">{{title}}</div>' +
    '</div>'
  );

  var mainLayoutTemplate = Handlebars.compile(
    '<div class="extMainContent accordion">' +
    '{{#each groups}}' +
    '<div class="accordion-group disableTextSelection" style="width: 100%; border: 0px #aaa solid;">' +
    '{{#if ../moreThanOneGroup}}' +
    '<div class="accordion-heading btn-group" style="width:100%; margin: 0px; border-bottom: solid 1px #eee; background-color: #f0f0f0;">' +
    '<button class="btn btn-link groupTitle" data-toggle="collapse" data-target="#{{../../id}}SortingButtons{{@index}}">' +
    '<i class="fa fa-minus-square">&nbsp;</i>' +
    '</button>' +
    '<span class="btn btn-link groupTitle" id="{{../../id}}HeaderTitle{{@index}}" style="margin-left: 0px; padding-left: 0px;"></span>' +
    '</div>' +
    '{{/if}}' +
    '<div class="accordion-body collapse in" id="{{../id}}SortingButtons{{@index}}" style="margin: 0px 0px 0px 3px; border: 0px;">' +
    '<div class="accordion-inner tileContainer" id="{{../id}}GroupContent{{@index}}"></div>' +
    '</div>' +
    '</div>' +
    '{{else}}' +
    '<p style="margin: 5px; font-size: 13px; text-align: center;">Directory does not contain any files or is currently being analysed.</p>' +
    '{{/each}}' +
    '<div id="gridShowAllFilesContainer">' +
    '<button class="btn btn-primary" id="gridShowAllFilesButton">Show all files</button>' +
    '</div>' +
    '</div>'
  );
*/
  function ExtUI(extID) {
    this.extensionID = extID;
    this.viewContainer = $("#" + this.extensionID + "Container").empty();
    this.viewToolbar = $("#" + this.extensionID + "Toolbar").empty();

    this.thumbEnabled = false;
    this.showFileDetails = false;
    this.showTags = true;
    this.currentTmbSize = 0;
    this.searchResults = [];

    extensionDirectory = TSCORE.Config.getExtensionPath() + "/" + this.extensionID;
  }

  ExtUI.prototype.buildUI = function(toolbarTemplate) {
    console.log("Init UI module");

    var self = this;

    var context = {
      id: this.extensionID
    };

    // Init Toolbar
    this.viewContainer.append(toolbarTemplate(context));

    $("#" + this.extensionID + "ToogleSelectAll").on("click", function() {
      self.toggleSelectAll();
    });

    $("#" + this.extensionID + "IncludeSubDirsButton").on("click", function() {
      TSCORE.IOUtils.createDirectoryIndex(TSCORE.currentPath);
    });

    $("#" + this.extensionID + "DeleteSelectedFilesButton").on("click", function() {
      if ($(this).parent().hasClass("disabled")) {
        return false;
      } else {
        TSCORE.UI.showDeleteFilesDialog();
      }
    });

    $("#" + this.extensionID + "TagButton").on("click", function() {
      if ($(this).parent().hasClass("disabled")) { return false; }
      TSCORE.showAddTagsDialog();
    });

    $("#" + this.extensionID + "CopyMoveButton").on("click", function() {
      if ($(this).parent().hasClass("disabled")) { return false; }
      TSCORE.showMoveCopyFilesDialog();
    });

    $("#" + this.extensionID + "Export2CSVButton").on("click", function() {
      var blob = new Blob([TSCORE.exportFileListCSV(TSCORE.fileList)], {
        type: "text/csv;charset=utf-8"
      });
      saveAs(blob, "Export.csv");
    });

    $("#" + this.extensionID + "ReloadFolderButton").on("click", function() {
      TSCORE.navigateToDirectory(TSCORE.currentPath);
    });

    $("#" + this.extensionID + "CreateFileButton").on("click", function() {
      TSCORE.showFileCreateDialog();
    });

    $("#" + this.extensionID + "showFoldersInListCheckbox").attr('checked', showFoldersInList);
    $("#" + this.extensionID + "showFoldersInListCheckbox").on("click", function(evt) {
      showFoldersInList = evt.currentTarget.checked;
      saveExtSettings();
    });

    $("#modal_button_ok").on("click", function(evt) {
      TSCORE.navigateToDirectory(TSCORE.currentPath);
    });

    $("#" + this.extensionID + "CreateDirectoryButton").on("click", function() {
      TSCORE.showCreateDirectoryDialog(TSCORE.currentPath);
    });

    $("#" + this.extensionID + "MainDropUp").on('click', function() {
      TSCORE.hideAllDropDownMenus();
      //$(this).dropdown('toggle');
    });

    // Disabling all buttons by no data
    this.viewToolbar.find(".btn").prop('disabled', true);

    // Init Toolbar END

    // Init Container

    // Init File Context Menu
    this.viewContainer.on("contextmenu click", ".fileTitleButton", function(e) {
      e.preventDefault();
      TSCORE.hideAllDropDownMenus();
      self.selectFile($(this).attr("filepath"));
      if (!$(this).attr("isDirectory")) {
        TSCORE.showContextMenu("#fileMenu", $(this));
      }
      return false;
    });

    //this.viewContainer.on("contextmenu mousedown", ".ui-selected td", function(e) {
    this.viewContainer.on("contextmenu", ".fileTitle", function(e) {
      var selEl = $(this).parent().find(".fileTitle button");
      //console.warn("right mousedown: " + selEl.attr("filepath"));
      e.preventDefault();
      TSCORE.hideAllDropDownMenus();
      TSCORE.PerspectiveManager.clearSelectedFiles();
      self.selectFile(selEl.attr("filepath"));
      TSCORE.showContextMenu("#fileMenu", $(this));
      return false;
    });

    // Init Tag Context Menu
    this.viewContainer.on("contextmenu click", ".tagButton", function(e) {
      e.preventDefault();
      TSCORE.hideAllDropDownMenus();
      self.selectFile($(this).attr("filepath"));
      TSCORE.openTagMenu(this, $(this).attr("tag"), $(this).attr("filepath"));
      TSCORE.showContextMenu("#tagMenu", $(this));
      return false;
    });

    // TODO for remove
    /*this.viewContainer.on("contextmenu mousedown", ".ui-selected td", function(e) {
      e.preventDefault();
      if (e.which == 3) {
        //console.warn("right mousedown");
        TSCORE.hideAllDropDownMenus();
        //self.selectFile(this, $(this).attr("filepath"));
        if (!$(this).attr("isDirectory")) {
          TSCORE.showContextMenu("#fileMenu", $(this));
        }
      }
      return false;
    });*/

    this.viewContainer.append($("<table>", {
      style: "width: 100%",
      class: "table content disableTextSelection",
      id: this.extensionID + "FileTable"
    }));

    this.viewContainer.append($("<div>", {
      style: "width: 100%; text-align: center; display: none;",
    }).append($("<button>", {
      style: "text-align: center; margin-bottom: 10px;",
      class: "btn btn-primary",
      text: "Show all files",
      title: "If you are trying to open more then 1000 files, TagSpaces may experience performance issues.",
      id: this.extensionID + "ShowAllResults"
    }).on("click", function() {
      self.reInit(true);
    })));

    this.fileTable = $('#' + this.extensionID + "FileTable")
/*    // get the reference for the body
    var body = document.getElementsByTagName("body")[0];
    var tblBody = document.getElementsByTagName("tbody");

    this.searchResults.forEach.call(document.querySelectorAll('#' + this.extensionID + 'FileTable > tbody  > tr'), function(tr) {
      var row = document.createElement("tr");

      for (var j = 0; j < this.searchResults.length; j++) {
        // Create a <td> element and a text node, make the text
        // node the contents of the <td>, and put the <td> at
        // the end of the table row
        var cell = document.createElement("td");
        var cellText = document.createTextNode("text");
        cell.appendChild(cellText);
        row.appendChild(cell);
      }

      // add the row to the end of the table body
      tblBody.appendChild(row);
    });*/
 /*   console.log(this.searchResults);
    var fileGroups = this.searchResults;
    _.each(fileGroups, function(value, index) {
      //$groupeContent = $("#" + self.extensionID + "GroupContent" + index);
      //$groupeTitle = $("#" + self.extensionID + "HeaderTitle" + index);

      //var groupingTitle = self.calculateGroupTitle(value[0]);
      //this.fileTable.text(groupingTitle);

      // Sort the files in group by name
      /!*
       value = _.sortBy(value, function(entry) {
       return entry.name;
       });
       *!/

      // Iterating over the files in group
      for (var j = 0; j < value.length; j++) {
        //console.warn("value: " +value[j].isDirectory + " -- " + value[j].name);
        if (value[j].isDirectory) {
          if (showFoldersInList) {
            hasFolderInList = true;
            fileGroups.append(self.createFileTile(
              value[j].name,
              value[j].path,
              false
            ));
          }
        } else {
          fileGroups.append(self.createFileTile(
            value[j].title,
            value[j].path,
            value[j].extension,
            value[j].tags,
            false,
            value[j].meta
          ));
        }
      }
    });*/
/*    .dataTable({
      "bStateSave": true,
      "iCookieDuration": 60 * 60 * 24 * 365,
      "bJQueryUI": false,
      "bPaginate": false,
      "bLengthChange": false,
      "bFilter": true,
      "bSort": false,
      "bInfo": false,
      "bAutoWidth": false,
      "oLanguage": {
        "sEmptyTable": " " // No files found
      },
      "aoColumns": [
        {
          "sType": 'natural',
          "sTitle": "File Ext.",
          "sClass": "byExtension fileTitle noWrap",
          "mRender": function(data, type, row) {
              return self.buttonizeTitle((row.isDirectory ? row.name : row.title), row.path, row.extension, row.isDirectory);
          },
          "mData": "extension",
        }, {
          "sTitle": "Title",
          "sClass": "byName fileTitle forceWrap fileTitleWidth",
          "mData": "title",
        }, {
          "sTitle": "Tags",
          "sClass": "byTagCount fileTitle forceWrap",
          "mRender": function(data, type, row) {
            return TSCORE.generateTagButtons(data, row.path);
          },
          "mData": "tags",
        }, {
          "sType": 'numeric',
          "sTitle": "Size",
          "sClass": "byFileSize fileTitle",
          "mData": "size",
          "mRender": function(data, type, row) {
            return TSCORE.TagUtils.formatFileSize(data, true);
          }
        }, {
          "sTitle": "Last Modified",
          "sClass": "byDateModified fileTitle",
          "mRender": function(data) {
            return TSCORE.TagUtils.formatDateTime(data, true); // moment(data).fromNow();
          },
          "mData": "lmdt",
        },
      ],
      "aaSorting": [
        [1, "asc"]
      ], // default sorting by filename
    });*/

    /*
    var dropTarget =  this.viewToolbar;
    //dropTarget.on("dragover", function () { dropTarget.css("border","2px red solid"); return false; });
    //dropTarget.on("dragend", function () { dropTarget.css("border","0px solid"); return false; });
    dropTarget.on("drop", function (e) {
      e.preventDefault();
      var droppedFilePath = e.originalEvent.dataTransfer.files[0].path;
      if( droppedFilePath != undefined){
          var targetFilePath = TSCORE.currentPath+TSCORE.dirSeparator+TSCORE.TagUtils.extractFileName(droppedFilePath);
          TSCORE.showConfirmDialog(
                "Confirm File Move",
                "Do you want to move '"+droppedFilePath+"' to '"+targetFilePath+"'?",
                function() { TSCORE.IO.renameFile(droppedFilePath,targetFilePath); }
            );
      }
      //for (var i = 0; i < e.originalEvent.dataTransfer.files.length; ++i) {
      //  console.log(e.originalEvent.dataTransfer.files[i].path);
      //}
      return false;
    }); */


    $(".byName").on("click", function() {
      if (orderBy === undefined || orderBy === false) {
        orderBy = true;
      } else {
        orderBy = false;
      }
      showSortDataInList = 'byName';
      saveExtSettings();
      self.reInit();
    });

    $(".byExtension").on("click", function() {
      if (orderBy === undefined || orderBy === false) {
        orderBy = true;
      } else {
        orderBy = false;
      }
      showSortDataInList = 'byExtension';
      saveExtSettings();
      self.reInit();
    });

    $(".byFileSize").on("click", function() {
      if (orderBy === undefined || orderBy === false) {
        orderBy = true;
      } else {
        orderBy = false;
      }
      showSortDataInList = 'byFileSize';
      saveExtSettings();
      self.reInit();
    });

    $(".byTagCount").on("click", function() {
      if (orderBy === undefined || orderBy === false) {
        orderBy = true;
      } else {
        orderBy = false;
      }
      showSortDataInList = 'byTagCount';
      saveExtSettings();
      self.reInit();
    });

    $(".byDateModified").on("click", function() {
      if (orderBy === undefined || orderBy === false) {
        orderBy = true;
      } else {
        orderBy = false;
      }
      showSortDataInList = 'byDateModified';
      saveExtSettings();
      self.reInit();
    });

    // Disable alerts in datatable
    this.fileTable.dataTableExt.sErrMode = 'throw';
  };

  ExtUI.prototype.reInit = function(showAllResult) {
    var self = this;

    // Clearing old data
    //this.fileTable.fnClearTable();

    if (showAllResult && this.partialResult && this.partialResult.length > 0) {
      this.searchResults = this.allResults;
      this.partialResult = [];
      $("#" + this.extensionID + "ShowAllResults").parent().hide();
    } else {
      this.allResults = TSCORE.Search.searchData(TSCORE.fileList, TSCORE.Search.nextQuery);
      //this.allResults = TSCORE.Search.searchData(arrFolderAndFiles, TSCORE.Search.nextQuery);
      if (this.allResults.length >= TSCORE.Config.getMaxSearchResultCount()) {
        this.partialResult = this.allResults.slice(0, TSCORE.Config.getMaxSearchResultCount());
        $("#" + this.extensionID + "ShowAllResults").parent().show();
        this.searchResults = this.partialResult;
      } else {
        this.searchResults = this.allResults;
        $("#" + this.extensionID + "ShowAllResults").parent().hide();
      }
    }

    function SortByName(a, b) {
      var aName = a.name.toLowerCase();
      var bName = b.name.toLowerCase();
      return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    }

    function SortByIsDirectory(a, b) {
      if (b.isDirectory && a.isDirectory) {
        return 0;
      }
      return a.isDirectory && !b.isDirectory ? -1 : 1;
    }

    //sort by isDirectory in order to show folders on the top of the list
    this.searchResults = this.searchResults.sort(SortByIsDirectory);

    if (showFoldersInList && this.searchResults.length > 0 && this.searchResults[0].isDirectory) { //sort by isDirectory and next by names only if in list have folders
      hasFolderInList = true;
      var arrFolders = [] , arrFiles = [];
      for (var inx = 0; inx < this.searchResults.length; inx++) {
        if (this.searchResults[inx].isDirectory) {
          arrFolders.push(this.searchResults[inx]);
        } else {
          arrFiles.push(this.searchResults[inx]);
        }
      }
      arrFolders = arrFolders.sort(SortByName);
      arrFiles = arrFiles.sort(SortByName);
      this.searchResults = arrFolders.concat(arrFiles);
    } else {
      if (this.searchResults.length > 0 && this.searchResults[0].isDirectory) {
        var arrFiles = [];
        for (var inx = 0; inx < this.searchResults.length; inx++) {
          if (!this.searchResults[inx].isDirectory) {
            arrFiles.push(this.searchResults[inx]);
          }
        }
        arrFiles = arrFiles.sort(SortByName);
        this.searchResults = arrFiles;
      } else {
        this.searchResults = this.searchResults.sort(SortByName);
      }
    }

    if (orderBy === undefined) {
      self.sortByCriteria('byName', true);
    } else {
      self.sortByCriteria(showSortDataInList, orderBy);
    }


    console.log(this.searchResults);
    var fileGroups = this.searchResults;
    _.each(fileGroups, function(value, index) {
      //$groupeContent = $("#" + self.extensionID + "GroupContent" + index);
      //$groupeTitle = $("#" + self.extensionID + "HeaderTitle" + index);

      //var groupingTitle = self.calculateGroupTitle(value[0]);
      //this.fileTable.text(groupingTitle);

      // Sort the files in group by name
      /*
       value = _.sortBy(value, function(entry) {
       return entry.name;
       });
       */

      // Iterating over the files in group
      for (var j = 0; j < value.length; j++) {
        //console.warn("value: " +value[j].isDirectory + " -- " + value[j].name);
        if (value[j].isDirectory) {
          if (showFoldersInList) {
            hasFolderInList = true;
            fileGroups.append(self.createFileTile(
              value[j].name,
              value[j].path,
              false
            ));
          }
        } else {
          fileGroups.append(self.createFileTile(
            value[j].title,
            value[j].path,
            value[j].extension,
            value[j].tags,
            false,
            value[j].meta
          ));
        }
      }
    });
    this.fileTable.fnAddData(this.searchResults);

    this.fileTable.$('tr')
      .droppable({
        accept: ".tagButton",
        hoverClass: "activeRow",
        drop: function(event, ui) {

          var tagName = TSCORE.selectedTag;
          var targetFilePath = $(this).find(".fileTitleButton").attr("filepath");

          // preventing self drag of tags
          var targetTags = TSCORE.TagUtils.extractTags(targetFilePath);
          for (var i = 0; i < targetTags.length; i++) {
            if (targetTags[i] === tagName) {
              return true;
            }
          }

          console.log("Tagging file: " + tagName + " to " + targetFilePath);
          $(this).toggleClass("ui-selected");
          TSCORE.PerspectiveManager.clearSelectedFiles();
          TSCORE.selectedFiles.push(targetFilePath);
          TSCORE.TagUtils.addTag(TSCORE.selectedFiles, [tagName]);
          self.handleElementActivation();

          $(ui.helper).remove();
        }
      })
      .click(function() {
        console.log("Selecting file...");
        var titleBut = $(this).find(".fileTitleButton");
        self.selectFile($(titleBut).attr("filepath"));
      });

    if (isCordova) {
      this.fileTable.$('tr').hammer().on("doubletap", function() {
          console.log("Doubletap & Opening file...");
          var titleBut = $(this).find(".fileTitleButton");
          TSCORE.FileOpener.openFile($(titleBut).attr("filepath"));
          self.selectFile($(titleBut).attr("filepath"));
        });
    } else {
      this.fileTable.$('tr')
        .on("dblclick", function() {
          console.log("Doubletap -> Opening file...");
          var titleBut = $(this).find(".fileTitleButton");
          if ($(titleBut).attr("isDirectory")) {
            TSCORE.navigateToDirectory($(titleBut).attr("filepath"));
          } else {
            TSCORE.FileOpener.openFile($(titleBut).attr("filepath"));
          }

          self.selectFile($(titleBut).attr("filepath"));
        });
    }

    this.fileTable.$('.fileTitleButton')
      //.on('click', function(e) { e.preventDefault(); return false; })
      .draggable({
        "zIndex": 10000,
        "cancel": false,
        "appendTo": "body",
        "helper": "clone",
        "revert": true,
        "start": function() {
          console.log("Start dragging -----");
          self.selectFile($(this).attr("filepath"));
        }
      });

    this.fileTable.$('.fileSelection')
      .on('click', function(e) {
        e.preventDefault();
        var fpath = $(this).parent().find(".fileTitleButton").attr("filepath");
        var stateTag = $(this).find("i");
        if (stateTag.hasClass("fa-square-o")) {
          stateTag.removeClass("fa-square-o").addClass("fa fa-check-square-o");
          $(this).parent().parent().addClass("ui-selected");
          TSCORE.selectedFiles.push(fpath);
          selectedIsFolderArr[fpath] =  $(this).parent().find(".fileTitleButton").attr("isDirectory");
        } else {
          stateTag.removeClass("fa-check-square-o").addClass("fa-square-o");
          $(this).parent().parent().removeClass("ui-selected");
          TSCORE.selectedFiles.splice(TSCORE.selectedFiles.indexOf(fpath), 1);
          selectedIsFolderArr[fpath] =  false;
        }
        self.handleElementActivation();
        return false;
      });

    this.fileTable.$('.tagButton')
      //.on('click', function(e) { e.preventDefault(); return false; })
      .draggable({
        "zIndex": 10000,
        "cancel": false,
        "appendTo": "body",
        "helper": "clone",
        "revert": true,
        "start": function() {
          TSCORE.selectedTag = $(this).attr("tag");
          self.selectFile($(this).attr("filepath"));
        }
      });

    // Enable all buttons
    this.viewToolbar.find(".btn").prop('disabled', false);
    // Disable certain buttons again
    $("#" + this.extensionID + "TagButton").prop('disabled', true);
    $("#" + this.extensionID + "CopyMoveButton").prop('disabled', true);

    //Update statusbar, TODO make an core.ui api call for statusbar updates
    if (this.searchResults.length) {
      if (TSCORE.Search.nextQuery.length > 0) {
        $("#statusBar").text(this.searchResults.length + " " + $.i18n.t("ns.perspectives:filesFoundFor") + " '" + TSCORE.Search.nextQuery + "'");
      } else {
        $("#statusBar").text(this.searchResults.length + " " + $.i18n.t("ns.perspectives:filesFound"));
      }
    }

    Mousetrap.unbind(TSCORE.Config.getSelectAllKeyBinding());
    Mousetrap.bind(TSCORE.Config.getSelectAllKeyBinding(), function() {
      self.toggleSelectAll();
    });

    this.refreshThumbnails();
    TSCORE.hideLoadingAnimation();
  };

  ExtUI.prototype.createFileTile = function(title, filePath, fileExt, fileTags, isSelected, metaObj) {
    var fileParentDir = TSCORE.TagUtils.extractParentDirectoryPath(filePath);
    var fileName = TSCORE.TagUtils.extractFileName(filePath);

    var tmbPath = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    var metaObj = metaObj || {thumbnailPath: ""};

    if (metaObj.thumbnailPath && metaObj.thumbnailPath.length > 2) {
      tmbPath = encodeURI(metaObj.thumbnailPath);
      if (isWin) {
        tmbPath = tmbPath.split('%5C').join('/').split('%3A').join(':');
      }
    }

    var context = {
      filepath: filePath,
      fileext: fileExt,
      title: title,
      coloredExtClass: TSCORE.Config.getColoredFileExtensionsEnabled() ? "fileExtColor" : "",
      tags: [],
      selected: isSelected ? "fa-check-square" : "fa-square-o",
      thumbPath: tmbPath
    };

    if (fileTags.length > 0) {
      var tagString = "" + fileTags;
      var tags = tagString.split(",");

      for (var i = 0; i < tags.length; i++) {
        context.tags.push({
          tag: tags[i],
          filepath: filePath,
          style: TSCORE.generateTagStyle(TSCORE.Config.findTag(tags[i]))
        });
      }
    }

    if (metaObj.metaData && metaObj.metaData.tags) {
      metaObj.metaData.tags.forEach(function(elem) {
        context.tags.push({
          tag: elem.title,
          filepath: filePath,
          style: elem.style
        });
      });
    }

    return fileTileTmpl(context);
  };

  var buttonCompTmpl = Handlebars.compile("" +
    '<button filepath="{{filepath}}" isDirectory="{{isDirectory}}" title="{{filepath}}" class="btn btn-link fileTitleButton {{coloredExtClass}}" data-ext="{{fileext}}">' +
    '<span class="fileExt">{{fileext}}&nbsp;&nbsp;<span class="fa fa-ellipsis-v"></span></span></button><br>' +
    '<button filepath="{{filepath}}" class="btn btn-link fileSelection"><i class="fa {{selected}} fa-fw fa-lg"></i></button>');

  // Helper function user by basic and search views
  ExtUI.prototype.buttonizeTitle = function(title, filePath, fileExt, isDirectory, isSelected) {
    if (title.length < 1) {
      title = filePath;
    }

    //TODO minimize platform specific calls
    var tmbPath;
    if (isCordova || isWeb) {
      tmbPath = filePath;
    } else {
      tmbPath = "file:///" + filePath;
    }

    var context = {
      filepath: filePath,
      isDirectory: isDirectory,
      coloredExtClass: TSCORE.Config.getColoredFileExtensionsEnabled() ? "fileExtColor" : "",
      tmbpath: tmbPath,
      fileext: fileExt,
      folder: isDirectory ? "fa fa-folder-o" : "",
      selected: isSelected ? "fa-check-square-o" : "fa-square-o"
    };

    return buttonCompTmpl(context);
  };

  ExtUI.prototype.clearSelectedFiles = function() {
    TSCORE.selectedFiles = [];
    $("#" + this.extensionID + "Container").find(".fileSelection").find("i")
      .removeClass("fa-check-square-o")
      .addClass("fa-square-o");
    $("#" + this.extensionID + "Container").find("tr").removeClass('ui-selected');
  };

  ExtUI.prototype.selectFile = function(filePath) {
    selectedIsFolderArr = [];
    TSCORE.PerspectiveManager.clearSelectedFiles();
    $(this.viewContainer).find('.fileSelection').each(function() {
      if ($(this).attr("filepath") === filePath) {
        $(this).parent().parent().toggleClass("ui-selected");
        $(this).parent().parent().find("i").toggleClass("fa-check-square-o").toggleClass("fa-square-o");
        //TSCORE.selectedFiles.push($(this).attr("filepath"));
        selectedIsFolderArr[$(this).attr("filepath")] = (typeof($(this).attr("folderpath")) != "undefined");

        var rectangle = this.getBoundingClientRect();
        var isVisible = (
          rectangle.top >= 100 &&
          rectangle.left >= 0 &&
          rectangle.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rectangle.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        if (!isVisible) {
          $("#viewContainers").animate({
            scrollTop: $('.ui-selected').offset().top - $("#perspectiveListContainer").offset().top
          }, 100);
        }
      }
    });
    TSCORE.selectedFiles.push(filePath);
    this.handleElementActivation();
  };

  ExtUI.prototype.handleElementActivation = function() {
    console.log("Entering element activation handler...");

    var tagButton = $("#" + this.extensionID + "TagButton");
    var copyMoveButton = $("#" + this.extensionID + "CopyMoveButton");
    var deleteSelectedFilesButton = $("#" + this.extensionID + "DeleteSelectedFilesButton");

    var isFolderInSelection = false;

    if (hasFolderInList) {
      for (var inx = 0; inx < TSCORE.selectedFiles.length; inx++) {
        if (selectedIsFolderArr[TSCORE.selectedFiles[inx]]) {
          isFolderInSelection = true;
          break;
        }
      }
    }

    if (TSCORE.selectedFiles.length >= 1 && !isFolderInSelection) {
      tagButton.parent().removeClass("disabled");
      copyMoveButton.parent().removeClass("disabled");
      deleteSelectedFilesButton.parent().removeClass("disabled");
    } else {
      tagButton.parent().addClass("disabled");
      copyMoveButton.parent().addClass("disabled");
      deleteSelectedFilesButton.parent().addClass("disabled");
    }
  };

  ExtUI.prototype.removeFileUI = function(filePath) {
    console.log("Removing from UI" + filePath + " from UI");

    // Updating the file selection
    TSCORE.selectedFiles.splice(TSCORE.selectedFiles.indexOf(filePath), 1);

    var row4remove;
    if (isWin && !isWeb) {
      filePath = filePath.replace("\\", "");
      $("#" + this.extensionID + "Container button[filepath]").each(function() {
        if ($(this).attr("filepath").replace("\\", "") === filePath) {
          row4remove = $(this).parent().parent();
        }
      });
    } else {
      row4remove = $("#" + this.extensionID + "Container button[filepath='" + filePath + "']").parent().parent();
    }
    if (row4remove !== undefined) {
      row4remove.remove();
    }
  };

  ExtUI.prototype.updateFileUI = function(oldFilePath, newFilePath) {
    console.log("Updating UI for oldfile " + oldFilePath + " newfile " + newFilePath);

    // Updating the file selection
    if (oldFilePath !== newFilePath) {
      TSCORE.selectedFiles.splice(TSCORE.selectedFiles.indexOf(oldFilePath), 1);
      TSCORE.selectedFiles.push(newFilePath);
    }

    var title = TSCORE.TagUtils.extractTitle(newFilePath),
      fileExt = TSCORE.TagUtils.extractFileExtension(newFilePath),
      fileTags = TSCORE.TagUtils.extractTags(newFilePath);

    var $fileRow;

    if (isWin && !isWeb) {
      oldFilePath = oldFilePath.replace("\\", "");
      $("#" + this.extensionID + "Container button[filepath]").each(function() {
        if ($(this).attr("filepath").replace("\\", "") === oldFilePath) {
          $fileRow = $(this).parent().parent();
        }
      });
    } else {
      $fileRow = $("#" + this.extensionID + "Container button[filepath='" + oldFilePath + "']").parent().parent();
    }

    $($fileRow.find("td")[0]).empty().append(this.buttonizeTitle(title, newFilePath, fileExt, false, true));
    $($fileRow.find("td")[1]).text(title);
    $($fileRow.find("td")[2]).empty().append(TSCORE.generateTagButtons(fileTags, newFilePath));

    this.refreshThumbnails();

    var self = this;
    $fileRow.find('.fileTitleButton')
      .draggable({
        "zIndex": 10000,
        "cancel": false,
        "appendTo": "body",
        "helper": "clone",
        "revert": true,
        "start": function() {
          TSCORE.selectedTag = $(this).attr("tag");
          self.selectFile($(this).attr("filepath"));
        }
      });

    $fileRow.find('.fileSelection')
      .click(function(e) {
        e.preventDefault();
        var fpath = $(this).parent().find(".fileTitleButton").attr("filepath");
        var stateTag = $(this).find("i");
        if (stateTag.hasClass("fa-square-o")) {
          stateTag.removeClass("fa-square-o").addClass("fa fa-check-square-o");
          $(this).parent().parent().addClass("ui-selected");
          TSCORE.selectedFiles.push(fpath);
          selectedIsFolderArr[fpath] =  $(this).parent().find(".fileTitleButton").attr("isDirectory");
        } else {
          stateTag.removeClass("fa-check-square-o").addClass("fa-square-o");
          $(this).parent().parent().removeClass("ui-selected");
          TSCORE.selectedFiles.splice(TSCORE.selectedFiles.indexOf(fpath), 1);
          selectedIsFolderArr[fpath] = false;
        }
        self.handleElementActivation();
        return false;
      });

    $fileRow.find('.tagButton')
      .draggable({
        "zIndex": 10000,
        "cancel": false,
        "appendTo": "body",
        "helper": "clone",
        "revert": true,
        "start": function() {
          //TSCORE.selectedTag = $(this).attr("tag");
          self.selectFile($(this).attr("filepath"));
        }
      });

  };

  ExtUI.prototype.getNextFile = function(filePath) {
    var nextFilePath;
    var self = this;
    this.searchResults.forEach(function(entry, index) {
      if (entry.path === filePath) {
        var nextIndex = index + 1;
        if (nextIndex < self.searchResults.length) {
          nextFilePath = self.searchResults[nextIndex].path;
        } else {
          nextFilePath = self.searchResults[0].path;
        }
      }
    });
    TSCORE.PerspectiveManager.clearSelectedFiles();
    console.log("Next file: " + nextFilePath);
    return nextFilePath;
  };

  ExtUI.prototype.getPrevFile = function(filePath) {
    var prevFilePath;
    var self = this;

    this.searchResults.forEach(function(entry, index) {
      if (entry.path === filePath) {
        var prevIndex = index - 1;
        if (prevIndex >= 0) {
          prevFilePath = self.searchResults[prevIndex].path;
        } else {
          prevFilePath = self.searchResults[self.searchResults.length - 1].path;
        }
      }
    });
    TSCORE.PerspectiveManager.clearSelectedFiles();
    console.log("Prev file: " + prevFilePath);
    return prevFilePath;
  };

  ExtUI.prototype.toggleSelectAll = function() {
    var $checkIcon = $("#" + this.extensionID + "ToogleSelectAll").find("i");
    if ($checkIcon.hasClass("fa-square-o")) {
      TSCORE.selectedFiles = [];
      $('#' + this.extensionID + 'FileTable tbody tr').each(function() {
        if (!$(this).attr("isDirectory")) {
          $(this).addClass('ui-selected');
          $(this).find(".fileSelection").find("i").addClass("fa-check-square-o").removeClass("fa-square-o");
          TSCORE.selectedFiles.push($(this).find(".fileTitleButton").attr("filepath"));
        } else {
          $(this).parent().removeClass("ui-selected");
          $(this).find(".fileSelection").find("i").removeClass("fa-check-square-o").addClass("fa-square-o");
        }
      });
      $checkIcon.removeClass("fa-square-o").addClass("fa-check-square-o");
    } else {
      TSCORE.PerspectiveManager.clearSelectedFiles();
      $checkIcon.removeClass("fa fa-check-square-o").addClass("fa fa-square-o");
    }
    this.handleElementActivation();
  };

  ExtUI.prototype.sortByCriteria = function(criteria, orderBy) {
    function sortByName(a, b) {
      if (orderBy) {
        return (b.isDirectory - a.isDirectory) || (a.name.toString().localeCompare(b.name));
      } else {
        return (b.isDirectory - a.isDirectory) || (b.name.toString().localeCompare(a.name));
      }
    }

    function sortByIsDirectory(a, b) {
      if (b.isDirectory && a.isDirectory) {
        return 0;
      }
      //if (orderBy) {
      return a.isDirectory && !b.isDirectory ? -1 : 1;
      //} else {
      //  return a.isDirectory && !b.isDirectory ? 1 : -1;
      //}
    }

    function sortBySize(a, b) {
      if (orderBy) {
        return (b.isDirectory - a.isDirectory) || (a.size - b.size);
      } else {
        return (b.isDirectory - a.isDirectory) || (b.size - a.size);
      }
    }

    function sortByDateModified(a, b) {
      if (orderBy) {
        return (b.isDirectory - a.isDirectory) || (a.lmdt - b.lmdt);
      } else {
        return (b.isDirectory - a.isDirectory) || (b.lmdt - a.lmdt);
      }
    }

    function sortByExtension(a, b) {
      if (orderBy) {
        return (b.isDirectory - a.isDirectory) || (a.extension.toString().localeCompare(b.extension));
      } else {
        return (b.isDirectory - a.isDirectory) || (b.extension.toString().localeCompare(a.extension));
      }
    }

    function sortByTagCount(a, b) {
      if (orderBy) {
        return (b.isDirectory - a.isDirectory) || (a.tags.length - b.tags.length);
      } else {
        return (b.isDirectory - a.isDirectory) || (b.tags.length - a.tags.length);
      }
    }

    if (this.searchResults.length > 0 && this.searchResults[0].isDirectory) {
      var arrFiles = [];
      for (var inx = 0; inx < this.searchResults.length; inx++) {
        if (!this.searchResults[inx].isDirectory) {
          arrFiles.push(this.searchResults[inx]);
        }
      }
      arrFiles = arrFiles.sort(sortByName);
      this.searchResults = arrFiles;
    } else {
      this.searchResults = this.searchResults.sort(sortByName);
    }

    switch (criteria) {
      case "byDirectory":
        this.searchResults = this.searchResults.sort(sortByIsDirectory);
        //showFoldersInList = true;
        if (showFoldersInList && this.searchResults.length > 0 && this.searchResults[0].isDirectory) { //sort by isDirectory and next by names only if in list have folders
          hasFolderInList = true;
          var arrFolders = [] , arrFiles = [];
          for (var inx = 0; inx < this.searchResults.length; inx++) {
            if (this.searchResults[inx].isDirectory) {
              arrFolders.push(this.searchResults[inx]);
            } else {
              arrFiles.push(this.searchResults[inx]);
            }
          }
          arrFolders = arrFolders.sort(sortByName);
          arrFiles = arrFiles.sort(sortByName);
          this.searchResults = arrFolders.concat(arrFiles);
        } else {
          if (this.searchResults.length > 0 && this.searchResults[0].isDirectory) {
            var arrFiles = [];
            for (var inx = 0; inx < this.searchResults.length; inx++) {
              if (!this.searchResults[inx].isDirectory) {
                arrFiles.push(this.searchResults[inx]);
              }
            }
            arrFiles = arrFiles.sort(sortByName);
            this.searchResults = arrFiles;
          } else {
            this.searchResults = this.searchResults.sort(sortByName);
          }
        }
        break;
      case "byName":
        this.searchResults = this.searchResults.sort(sortByName);
        break;
      case "byFileSize":
        this.searchResults = this.searchResults.sort(sortBySize);
        break;
      case "byDateModified":
        this.searchResults = this.searchResults.sort(sortByDateModified);
        break;
      case "byExtension":
        this.searchResults = this.searchResults.sort(sortByExtension);
        break;
      case "byTagCount":
        this.searchResults = this.searchResults.sort(sortByTagCount);
        break;
      default:
        this.searchResults = this.searchResults.sort(sortByName);
    }
  };

  exports.ExtUI = ExtUI;
});
