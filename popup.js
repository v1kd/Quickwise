

defaults = {
  url : 'https://secure.splitwise.com/api/v3.0/get_printable_summary',
  errorMsg : '<span class="glyphicon glyphicon-remove"></span> '
    + 'App does not support this page',
  otherErrorMsg : '<span class="glyphicon glyphicon-thumbs-down"></span> '
    + 'Something went wrong. Please try again',
  round: function(num) {
    return Math.round(num * 100) / 100;
  },
  // http://stackoverflow.com/questions/17563677/convert-javascript-number-to-currency-format-but-without-or-any-currency-sym
  regex: /(\d)(?=(\d{3})+(?!\d))/g,
  amtToStr: function(num) {
    return '$' + (this.round(Math.abs(num)) + '')
      .replace(this.regex, "$1,");
  }
};

chrome.extension.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    // message.innerText = request.source;
    var data = request.source;
    // console.log(data);
    loadData(data);
  }
});

function onWindowLoad() {
  
  //
  $.fn.switchClass = function(a, b) {
    if (this.hasClass(a))
      this.removeClass(a).addClass(b);
    return this;
  };
  
  chrome.tabs.getSelected(function(tab) {
    
    if (tab.url.indexOf(defaults.url) === -1) {
      $('#message').html(defaults.errorMsg).show();
      return;
    }
    // inject the script
    chrome.tabs.executeScript(null, {
      file: "quick.js"
    }, function() {
      if (chrome.extension.lastError) {
        message.innerText = 'There was an error injecting script : \n' 
          + chrome.extension.lastError.message;
      }
    });
    
  });
}

function loadData(obj) {
  
  var $tb,
    $info,
    all,
    $tr;
  
  if (!obj) {
    $('#message').html(defaults.otherErrorMsg).show();
    return;
  }
  
  // set info
  $info = $('#info');
  $info.append($('<h3>').text(obj.info.group));
  
  if (obj.info.time)
    $info.append($('<h4>', {
      'html' : '<small><span class="glyphicon glyphicon-time"></span></small> ' 
      + obj.info.time}));
  
  // add table
  $tb = $('<tbody>');
  all = obj.people.all;
  
  if (!all || all.length === 0) {
    $('#message').html(defaults.otherErrorMsg).show();
    return;
  }
  
  for(var i = 0, len = all.length; i < len; i++) {
    $tr = $('<tr>');
    amt = 0;
    // name
    $td = $('<td>').text(all[i]['name']);
    $tr.append($td);
    
    // expense
    $tr.append(getAmtEle(all[i]['spend']['expense'])
      .switchClass('text-success', 'text-primary'));
    
    // borrowed
    $tr.append(getAmtEle(-all[i]['spend']['borrowed']));
    
    // Lent
    $tr.append(getAmtEle(all[i]['spend']['lent']));
    
    // Paid
    $tr.append(getAmtEle(all[i]['spend']['paid']));
    
    // Received
    $tr.append(getAmtEle(-all[i]['spend']['received']));
    
    // Owe before
    $tr.append(getAmtEle(all[i]['wasOwedBefore']));
    
    // Total owe
    $tr.append(getAmtEle(all[i]['spend']['totalPaid'] 
      - all[i]['spend']['totalShare'] + all[i]['wasOwedBefore']));
    
    $tb.append($tr);
  }
  
  
  $('#main-table-body').replaceWith($tb);
  $('#main').removeClass('hidden');
  
}

function formatEle($ele, amt) {
  var type = amt < 0 ? false : true,
    str = (amt !== 0 && !type ? '-' : '') + defaults.amtToStr(amt),
    className = (amt !== 0 && !type ? 'text-danger' : 
      (amt === 0 ? 'text-muted' : 'text-success'));
  
  $ele.text(str);
  $ele.addClass(className + ' amt');
}

function getAmtEle(amt) {
  var $td = $('<td>');
  formatEle($td, amt);
  
  return $td;
}

window.onload = onWindowLoad;