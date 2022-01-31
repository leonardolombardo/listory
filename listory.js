
function setDefaultSearchValues(force){
    
    let fromDateMillis = document.getElementById("fromDate").valueAsDate?.getTime();
    let toDateMillis = document.getElementById("toDate").valueAsDate?.getTime();
    let searchText = document.getElementById("searchText").value;
    
    let now = new Date();
    
    if(!searchText || force === true) searchText = "";
    if(!toDateMillis || force === true) document.getElementById("toDate").value = now.toISOString().substring(0,10);
    if(!fromDateMillis || force === true) document.getElementById("fromDate").value = (new Date(now.getTime() - 604800000)).toISOString().substring(0,10);;
}

function buildResultList(historyItems) {

    console.debug("BUILD RESULT LIST");

    var dateFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    let divResults = document.getElementById("divResults");
    divResults.innerHTML = "";
    
    let phantomCheck = document.createElement('input');
    phantomCheck.type = "checkbox";
    phantomCheck.name = "historyItem";
    phantomCheck.value = null;
    phantomCheck.classList.add("hidden");
    divResults.appendChild(phantomCheck);
    
    let table = document.createElement("table");
    table.setAttribute("cellspacing", 0);
    divResults.appendChild(table);
    
    let tbody = document.createElement("tbody");
    table.appendChild(tbody);
    
    
    
    let hrow = document.createElement('tr');
    hrow.classList.add("heading");
    tbody.appendChild(hrow);
                
    let hcol1 = document.createElement('th');
    hrow.appendChild(hcol1);
    
    let hchk = document.createElement('input');
    hchk.type = "checkbox";
    hchk.addEventListener('click', (evt) => { 

        doToggleAll(hchk.checked);
    });
    hcol1.appendChild(hchk);
    
    let hcol2 = document.createElement('th');
    hcol2.setAttribute("colspan", 4);
    hrow.appendChild(hcol2);
        
    let delall = document.createElement('a');
    delall.appendChild(document.createTextNode(chrome.i18n.getMessage("deleteselected")));
    delall.addEventListener('click', (evt) => { 

        doDeleteSelected();
    });
    hcol2.appendChild(delall);
    
    
    let dateGroup = "";
    
    for (let k = 0; k < historyItems.length; k++) {
        
        let item = historyItems[k];
        let lastVisitDate = new Date(item.lastVisitTime);
        let formattedDate = lastVisitDate.toLocaleDateString(chrome.i18n.getMessage("@@ui_locale"), dateFormatOptions);
        let formattedTime = lastVisitDate.toLocaleTimeString(chrome.i18n.getMessage("@@ui_locale"));
        let domainName = item.url.split('/')[2];
        let grouperId = formattedDate;
        
        if(dateGroup != formattedDate) {
            
            let grow = document.createElement('tr');
            grow.classList.add("grouper");
            tbody.appendChild(grow);
                        
            let gcol1 = document.createElement('td');
            grow.appendChild(gcol1);
            
            let gchk = document.createElement('input');
            gchk.type = "checkbox";
            gchk.name = "grouper";
            gchk.setAttribute("grouper", grouperId);
            gchk.addEventListener('click', (evt) => { 
                            
                divResults.historyItem.forEach(item => {
                    if(item.getAttribute("grouper") == grouperId) {
                        item.checked = gchk.checked;
                    }
                });
            });
            gcol1.appendChild(gchk);
            
            let gcol2 = document.createElement('td');
            gcol2.setAttribute("colspan", 4);
            grow.appendChild(gcol2);
                
            let gdate = document.createElement('p');
            gdate.appendChild(document.createTextNode(formattedDate));
            gcol2.appendChild(gdate);
            
            dateGroup = formattedDate;
        }

        let row = document.createElement('tr');
        
        let col1 = document.createElement('td');
        let col2 = document.createElement('td');
        let col3 = document.createElement('td');
        let col4 = document.createElement('td');
        let col5 = document.createElement('td');
        
        row.appendChild(col1);
        row.appendChild(col2);
        row.appendChild(col3);
        row.appendChild(col4);
        row.appendChild(col5);
        
        let chk = document.createElement('input');
        chk.type = "checkbox";
        chk.name = "historyItem";
        chk.value = item.url;
        chk.setAttribute("grouper", grouperId);
        col1.appendChild(chk);
        
        let time = document.createElement('p');
        time.appendChild(document.createTextNode(formattedTime));
        time.addEventListener('click', (evt) => { 
            
            chk.checked = !chk.checked;
        });
        col2.appendChild(time);
                
        let name = document.createElement('a');
        name.classList.add("pagetitle");
        name.appendChild(document.createTextNode(item.title || item.url));
        name.addEventListener('click', (evt) => { 
            chrome.tabs.create({
                selected: true,
                url: item.url
            });
            return false;
        });
        col3.appendChild(name);
        
        let site = document.createElement('a');
        site.classList.add("sitename");
        site.appendChild(document.createTextNode(' ' + domainName));
        site.addEventListener('click', (evt) => { 
            document.getElementById("searchText").value = domainName
            doSearch();
        });
        col3.appendChild(site);
        
        tbody.appendChild(row);
    }
}

function doSearch() {

    console.debug("DO SEARCH");

    setDefaultSearchValues(false);

    let fromDateMillis = document.getElementById("fromDate").valueAsDate.getTime();
    let toDateMillis = document.getElementById("toDate").valueAsDate.getTime() + 86399999;
    let searchText = document.getElementById("searchText").value;
    
    let options = {
       text: searchText,
       startTime: fromDateMillis,
       endTime: toDateMillis,
       maxResults: 50000
    };
    
    chrome.history.search(
        options,
        (historyItems) => {

            buildResultList(historyItems);
        }
    );
}

function doDeleteSelected(){
    
    console.debug("DO DELETE SELECTED");
    
    let divResults = document.getElementById("divResults");
    
    if(!divResults.historyItem.forEach) return;
    
    let urlToDelete = [];
    let deletionCount = 0;
    
    let deletionEnd = () => {
        
        console.debug("DELETION END");
    
        doSearch();
    };
    
    divResults.historyItem.forEach(item => {
        
        if(item.checked === true){
        
            urlToDelete.push( item.value );
        }
    });
    
    if(urlToDelete.length > 0) {
        
        urlToDelete.forEach(url => {
            
            chrome.history.deleteUrl(
                {
                    url: url
                },
                () => {
                    console.log(url);
                    
                    deletionCount += 1;
                    
                    if(deletionCount == urlToDelete.length) deletionEnd();
                }
            );
        });
    }
}

function doToggleAll(checked){
    
    let divResults = document.getElementById("divResults");
    
    divResults.historyItem.forEach(item => {
        
        item.checked = checked;
    });
    
    divResults.grouper.forEach(item => {
        
        item.checked = checked;
    });
}

document.addEventListener('DOMContentLoaded', function () {

    setDefaultSearchValues(true);
    
    document.getElementById("motto").innerText = chrome.i18n.getMessage("motto");
    document.getElementById("lblFromDate").innerText = chrome.i18n.getMessage("from");
    document.getElementById("lblToDate").innerText = chrome.i18n.getMessage("to");
    document.getElementById("lblSearch").innerText = chrome.i18n.getMessage("text");
    document.getElementById("searchButton").innerText = chrome.i18n.getMessage("search");
    
    document.getElementById("searchButton").addEventListener("click", doSearch);
    
    doSearch();
});
