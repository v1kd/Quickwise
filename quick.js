

(function() {

var defaults = {
  strToAmtReg : /\$(\d+)/,
  // http://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-in-javascript
  round: function(num) {
    return Math.round(num * 100) / 100;
  }
};

function getData(d, w) {
  
  var grpData = d.querySelector(".group_summary"),
    people,
    pData = d.querySelectorAll(".user_summary"),
    data = {},
    info = {},
    isMonth = false,
    peopleIndex = 3,
    dataDate,
    userData;
    
  info['group'] = grpData.getElementsByTagName('h2')[0].textContent;
  dataDate = grpData.getElementsByTagName('h4')[0];
  
  if (dataDate) {
    info['time'] = dataDate.textContent;
    isMonth = true;
    peopleIndex = 1;
  }
  
  data['info'] = info;
  
  people = getPeople(grpData.querySelector('table'), peopleIndex, isMonth);
  data['people'] = people;
  
  if (pData.length == people.all.length) {
    // get people data
    for (var i = 0; i < pData.length; i++) {
      userData = getUserData(pData[i].querySelector('table'));
      people.all[i]['spend'] = userData;
    }
    
  }
  
  // console.log(data);
  
  return data;
}

function getUserData(t) {
  // Get the user data
  var tot = t.querySelectorAll('.total td'),
    trs = t.querySelectorAll('.expense'),
    tds,
    data = {
      'totalPaid' : 0,
      'totalShare' : 0,
      'lent' : 0,
      'borrowed' : 0,
      'received': 0,
      'paid': 0,
      'expense': 0
    },
    obj;
    
    data['totalPaid'] = strToAmt(tot[1].textContent);
    data['totalShare'] = strToAmt(tot[2].textContent);
  
  
  for (var i = 0; i < trs.length; i++) {
    tds = trs[i].getElementsByTagName('td');
    obj = getBalance(tds[5].textContent);
    if (obj && obj['type'])
      data[obj['type']] += obj['amt'];
  }
  
  // caluculate expense = totalShare - received
  data['expense'] = data['totalShare'] - data['received'];
  
  return data;
  
}

function getPeople(t, index, isOwed) {
  var p = {},
    ts,
    man,
    name,
    oweAmt;
    
  p.p = {};
  p.all = [];
    
  if (!t)
    return p;
    
  
  ts = t.querySelectorAll('tr th');
  
  if (ts.length === 0)
    return p;
    
  for(var i = index; i < ts.length; i++) {
    name = ts[i].childNodes[0].textContent.trim();
    man = {
      'name' : name,
      'wasOwedBefore' : 0
    };
    
    p.p[name] = p.all.push(man) - 1;
    if (isOwed)
      oweAmt = getOwedAmt(ts[i].querySelector('div'));
    else
      oweAmt = 0;
      
    man['wasOwedBefore'] = oweAmt;
    
  }
  
  return p;
}

function getOwedAmt(div) {
  if (!div)
    return 0;
    
  var cl = div.getAttribute('class'),
    txt = div.innerText.trim(),
    oweAmt = 0,
    mult = 1;
  
  switch(cl) {
    case 'settled':
      return 0;
    case 'negative':
      mult = -1;
      break;
  }
  
  try {
    oweAmt = defaults.round(parseFloat(txt.replace(/.+ \$(.+)$/, '$1'))) * mult;
  } catch(e) {}
  
  return oweAmt;
}

function strToAmt(str) {
  str = str.trim();
  var amt = parseFloat(str.replace(defaults.strToAmtReg, '$1'));
  if (isNaN(amt))
    return 0;
  
  return defaults.round(amt);
}

function getBalance(str) {
  
  if (!str || str.trim() === '')
    return false;
    
  str = str.trim();
  
  if (str === 'no balance')
    return false;

  var arr = str.split(' ');
  
  if (arr.length !== 3 && arr[0] !== 'you')
    return false;
  
  var data = {
      'type' : false,
      'amt' : 0
    }, 
    mult = 0;
  
  data['amt'] = strToAmt(arr[2]);
  
  switch(arr[1]) {
    case 'received':
    case 'borrowed':
      mult = 1;
      break;
    case 'paid':
    case 'lent':
      mult = 1;
      break;
  }
  
  if (mult) {
    data['type'] = arr[1];
    data['amt'] *= mult;
  }
  
  return data;
}

chrome.extension.sendMessage({
    action: "getSource",
    source: getData(document, window)
});
})();