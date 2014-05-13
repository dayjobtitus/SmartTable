/*

    SmartTable version 2.2a
    Build Date: Tue, 13 May 2014 14:32:10 -0700

*/

/*!
 * Smart Table Builder, Version 2
 *
 * Date: Jan 10, 2014
 * Developer: Jeremy Titus jeremyjtitus@gmail.com
 */

(function() {
    'use strict';
    if (!window.SmartTable) {
        window.SmartTable = {};
    }
    
    // get the size/count of an object (much like length for an array)
    function objSize(myobj) {
        var element_count = 0, key;
        for (key in myobj) {
            if (myobj.hasOwnProperty(key)) {
                element_count += 1;
            }
        }
        return element_count;
    }
    
    // this can verify if things are the same (arrays, objects, functions...)
    function objectEquals(v1, v2) {
        var key, result = false;
        if (typeof(v1) !== typeof(v2)) {
            result = false;
        } else if (typeof(v1) === "function") {
            result = (v1.toString() === v2.toString()) ? true : false;
        } else if (v1 instanceof Object && v2 instanceof Object) {
            result = true;
            if (objSize(v1) !== objSize(v2)) {
                result = false;
            } else {
                var r = true;
                for (key in v1) {
                    if (v1.hasOwnProperty(key)) {
                        r = objectEquals(v1[key], v2[key]);
                        if (!r) {
                            result = false;
                        }
                    }
                }
            }
        } else {
            result = (v1 === v2) ? true : false;
        }
        return result;
    }

    // used to take style attributes and apply them to an html object
    function applyStyles(obj) {
        var key;
        for (key in obj.styleObj) {
            if (obj.styleObj.hasOwnProperty(key)) {
                if (!obj.element.hasOwnProperty('style')) {
                    obj.element.style = {};
                }
                obj.element.style[key] = obj.styleObj[key];
            }
        }
    }

    // merge obj2 into obj1 (no validation here)
    function mergeObjects(obj1, obj2) {
        var key;        
        if (obj1) {
            for (key in obj2) {
                if (obj2.hasOwnProperty(key)) {
                    obj1[key] = obj2[key];
                }
            }
        }
        return obj1;
    }

    // custom sortby method that uses our object layour and sortby value
    function sortyBySorter(property) {
        var sortOrder = 1;

        if ((property || property===0) && property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function(a, b) {
            var result = 0;
            if ((property || property===0)) {
                if (!a.hasOwnProperty('static_row') || (a.hasOwnProperty('static_row')&& !a.static_row)) { // if row is not static_row
                    if (a.children[property] && a.children[property].hasOwnProperty('sortby_value')) {
                        result = (a.children[property].sortby_value < b.children[property].sortby_value) ? -1 : (a.children[property].sortby_value > b.children[property].sortby_value) ? 1 : 0;
                    }
                    else if (a.children[property] && a.children[property].hasOwnProperty('innerHTML')) {
                        result = (a.children[property].innerHTML < b.children[property].innerHTML) ? -1 : (a.children[property].innerHTML > b.children[property].innerHTML) ? 1 : 0;
                    }
                }
            }
            return result * sortOrder;
        };
    }

    // generic dynamic (can specifify object names or array index) multisorter (can specify an array of object names or array indexes)
    function dynamicSortMultiple(sort_columns) {
        return function(obj1, obj2) {
            var i = 0, result = 0, numberOfProperties = sort_columns.length;
            while (result === 0 && i < numberOfProperties) {
                result = sortyBySorter(sort_columns[i])(obj1, obj2);
                i += 1;
            }
            return result;
        };
    }

    // spinner will create an html element with a spinner class that can be styled in any way
    // target (optional) - parent element to hold spinner element, start (optional) - boolean to begin or remove spinner element
    function spinner(smartTableObject, start) {
        if (smartTableObject.builder_obj.target && start) {
            smartTableObject.spinner_element = smartTableObject.spinner_element || document.createElement("div");
            smartTableObject.spinner_element.className = "spinner";
            smartTableObject.builder_obj.target.appendChild(smartTableObject.spinner_element);
        }
        else if (smartTableObject.spinner_element) {
            smartTableObject.spinner_element.parentNode.removeChild(smartTableObject.spinner_element);
            smartTableObject.spinner_element = false;
        }
    }
    
    function selectAllRows(smartTableObject, selected) {
        var pointers = {};
        
        for (pointers.rows_i = 0; pointers.rows_i < smartTableObject.body.children.length; pointers.rows_i += 1) {
            smartTableObject.body.children[pointers.rows_i].rowSelected = selected;
            
            if (smartTableObject.table.childNodes[1].childNodes[pointers.rows_i]) {
                smartTableObject.table.childNodes[1].childNodes[pointers.rows_i].childNodes[0].childNodes[0].checked = selected;
            }
        }
    }
    
    function selectPageRows(smartTableObject) {
        var pointers = {}, counters = {};
        
        counters.page_offset = (smartTableObject.max_rows_to_show * (smartTableObject.pager_page - 1));
        counters.show_rows = ((smartTableObject.max_rows_to_show + counters.page_offset) > smartTableObject.body.children.length) ? smartTableObject.body.children.length : smartTableObject.max_rows_to_show + counters.page_offset;

        for (pointers.rows_i = counters.page_offset; pointers.rows_i < counters.show_rows; pointers.rows_i += 1) {
            smartTableObject.body.children[pointers.rows_i].rowSelected = true;
            
            if (smartTableObject.table.childNodes[1].childNodes[pointers.rows_i]) {
                smartTableObject.table.childNodes[1].childNodes[pointers.rows_i].childNodes[0].childNodes[0].checked = true;
            }
        }
    }
    
    // Used to update URL Parameters with column sorting and filter values to allow user to share links that include their view selections
    function updateParams(key, value) {
        var orig_hash = window.location.hash, new_hash = false, param;

        if (!orig_hash) {
            orig_hash = "#";
        }
        
        param = (orig_hash.indexOf(key + '=') !== -1) ? orig_hash.substring(orig_hash.indexOf(key + '=')) : false;
        param = (param && param.indexOf('&') !== -1) ? param.substring(0, param.indexOf('&')) : param;

        if (param) {
            if (value) {
                if (param !== (key + '=' + value)) {
                    new_hash = orig_hash.substring(0, orig_hash.indexOf(param)) + (key + '=' + value) + orig_hash.substring(orig_hash.indexOf(param) + param.length);
                }
            }
            else {
                new_hash = orig_hash.substring(0, orig_hash.indexOf(param)) + orig_hash.substring(orig_hash.indexOf(param) + param.length);
            }
        }
        else if (orig_hash.indexOf('?') !== -1 && value) {
            if (orig_hash.substring(-1) === "&") {
                new_hash = orig_hash + (key + '=' + value);
            }
            else {
                new_hash = orig_hash + ("&" + key + '=' + value);
            }
        }
        else if (value) {
            new_hash = orig_hash + ("?" + key + '=' + value);
        }

        // lets make sure we didnt make the url ugly
        new_hash = (new_hash) ? new_hash.replace("?&", "?") : new_hash;

        if (new_hash) {window.history.replaceState({}, '', new_hash);}
    }
  
    function getParam(key, value) {
        var param = false, orig_hash = window.location.hash;

            param = (orig_hash.indexOf(key + '=') !== -1) ? orig_hash.substring(orig_hash.indexOf(key + '=')) : false;
            param = (param && param.indexOf('&') !== -1) ? param.substring(0, param.indexOf('&')) : param;
            if (param) {
                value = param.split("=")[1];
            }
            
        return value;
    }
    
    function filterHightlighter(filter_string, string) {
        var formatted_string = "",
            before_string = string.substring(0, string.indexOf(filter_string)),
            after_string = string.substring(string.indexOf(filter_string) + filter_string.length);

        formatted_string = before_string + "<span class'highlight'>" + filter_string + "</span>" + after_string;

        return formatted_string;
    }
    
    function checkPagerPage(pager_val, data_length, max_rows_to_show) {
        var max_pages = Math.ceil(data_length / max_rows_to_show);
        // current page cannot be larger than the last available page of data/rows
        if (max_pages < pager_val) {
            pager_val = max_pages;
        }
        return pager_val;
    }
    
    function calculateSomeTotals(smartTableObject) {
        smartTableObject.totals.columns = (smartTableObject && smartTableObject.hasOwnProperty('body') && smartTableObject.body.hasOwnProperty('children') && smartTableObject.body.children && smartTableObject.body.children[0] && smartTableObject.body.children[0].children) ? smartTableObject.body.children[0].children.length : 0;
        smartTableObject.totals.dataObjIds = objSize(smartTableObject.data.origData[0]);
        return smartTableObject;
    }
    
    function calculateSortBy(cell_obj, row_data, sortby_value) {
        var sortby_result;
        // this is used to control how sorting works for this column (you may not want to sort simply by the original data object but by some formatted version of it)
        if (cell_obj.hasOwnProperty('sortby_function') && cell_obj.sortby_function && typeof cell_obj.sortby_function === 'function') {
            sortby_result = cell_obj.sortby_function(row_data, sortby_value); // (writable object, data for the row, current TD element, current TR element)
            if (sortby_result || sortby_result === 0) {
                sortby_value = sortby_result;
            }
        }
        else if (cell_obj.dataObjId) {
            if (row_data[cell_obj.dataObjId]) {
                sortby_value = row_data[cell_obj.dataObjId];
            }
            else {
                sortby_value = (cell_obj.hasOwnProperty('sortby')) ? cell_obj.sortby : '';
            }
        }
        else if (cell_obj.storeID) {
            if (row_data[cell_obj.storeID]) {
                sortby_value = row_data[cell_obj.storeID];
            }
            else {
                sortby_value = (cell_obj.hasOwnProperty('sortby')) ? cell_obj.sortby : '';
            }
        }
        else if (cell_obj.hasOwnProperty('innerHTML') && cell_obj.innerHTML) {
            sortby_value = cell_obj.innerHTML;
        }
        if (typeof sortby_value === "string" && (/^[\d\.]{3,}$/.test(sortby_value))) {sortby_value = parseFloat(sortby_value);} // if is a string but should be a number
        return sortby_value;
    }
    
    // we can format the innerhtml string via a chosen supported format passed in the bodymap column object
    function formatHtml(obj){
        var html = obj.innerHTML;
        switch(obj.format){
            case 'currency':
                html = parseFloat(html);
                if (html >= 0) {
                    obj.innerHTML = "$" + html.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    obj.className = "number currency";
                }
                else {
                    obj.innerHTML = "($" + html.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/-/g, "") + ")";
                    obj.className = "number currency negative";
                }
                break;
            case 'decimal':
                html = parseFloat(html);
                if (html >= 0) {
                    obj.innerHTML = html.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    obj.className = "number";
                }
                else {
                    obj.innerHTML = "(" + html.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/-/g, "") + ")";
                    obj.className = "number negative";
                }
                break;
            case 'percentage':
                html = parseFloat(html);
                if (html >= 0) {
                    obj.innerHTML = html.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "%";
                    obj.className = "number";
                }
                else {
                    obj.innerHTML = "(" + html.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/-/g, "") + "%)";
                    obj.className = "number negative";
                }
                break;
            case 'number':
                html = parseFloat(html);
                if (html >= 0) {
                    obj.innerHTML = html.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    obj.className = "number";
                }
                else {
                    obj.innerHTML = "(" + html.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/-/g, "") + ")";
                    obj.className = "number negative";
                }
                break;
            case 'boolean':
                if (html === true || html === "true" || parseFloat(html) === 1) {
                    obj.innerHTML = "True";
                }
                else if (html === false || html === "false" || parseFloat(html) === 0) {
                    obj.innerHTML = "False";
                }
                else {
                    obj.innerHTML = "";
                }
                break;
            default:
                break;
        }
        return obj;
    }
    
    function calculateExportBy(cell_obj, row_data, exportby_value) {
        var exportby_result;
        // this is used to control how exporting looks for this column (you may not want to export simply by the original data object but by some formatted version of it)
        if (cell_obj.hasOwnProperty('exportby_function') && cell_obj.exportby_function && typeof cell_obj.exportby_function === 'function') {
            exportby_result = cell_obj.exportby_function(row_data, exportby_value); // (writable object, data for the row, current TD element, current TR element)
            if (exportby_result || exportby_result === 0) {
                exportby_value = exportby_result;
            }
        }
        else if (cell_obj.dataObjId) {
            if (row_data[cell_obj.dataObjId]) {
                exportby_value = row_data[cell_obj.dataObjId];
            }
            else {
                exportby_value = (cell_obj.hasOwnProperty('exportby')) ? cell_obj.exportby : '';
            }
            if (cell_obj.hasOwnProperty('format') && cell_obj.format && (cell_obj.hasOwnProperty('dataObjId') && cell_obj.dataObjId && (row_data[cell_obj.dataObjId] || row_data[cell_obj.dataObjId] === 0))) { // if we wanted to format the data-object lets handle it here
                cell_obj.innerHTML = row_data[cell_obj.dataObjId];
                // we wanted to format the data-object so lets handle it here
                cell_obj = formatHtml(cell_obj);
                exportby_value = cell_obj.innerHTML;
            }
        }
        else if (cell_obj.storeID) {
            if (row_data[cell_obj.storeID]) {
                exportby_value = row_data[cell_obj.storeID];
            }
            else {
                exportby_value = (cell_obj.hasOwnProperty('exportby')) ? cell_obj.exportby : '';
            }
        }
        else if (cell_obj.hasOwnProperty('innerHTML') && cell_obj.innerHTML) {
            exportby_value = cell_obj.innerHTML;
        }
        return exportby_value;
    }

    // make sure table rows have proper amount of cells
    function fixTableCells(table) {
        var pointers = {},
            max_length = 0,
            table_body_rows = (table.hasOwnProperty('tBodies') && table.tBodies && table.tBodies[0]) ? table.tBodies[0].children : false;

        if (table_body_rows) {
            // get max length of cells in each row in the table
            for (pointers.row_i = 0; pointers.row_i < table_body_rows.length; pointers.row_i += 1) {
                max_length = (table_body_rows[pointers.row_i].children.length > max_length) ? table_body_rows[pointers.row_i].children.length : max_length;
            }
            // now check if each row has the same amount of cells, if not then add as many new TD elements as needed
            for (pointers.row_i = 0; pointers.row_i < table_body_rows.length; pointers.row_i += 1) {
                if (table_body_rows[pointers.row_i].children.length < max_length) {
                    for (pointers.cell_i = 0; pointers.cell_i < (max_length - table_body_rows[pointers.row_i].children.length + 1); pointers.cell_i += 1) {
                        table.tBodies[0].childNodes[pointers.row_i].appendChild(document.createElement("td"));
                    }
                }
            }
        }
    }

    // this is used to add header cells for unmapped items in the data set ONLY IF displayNonMapData is set to true
    function tableAddHeader(smartTableObject, string) {
        var cell_object = {};

        cell_object.tag = "th";
        cell_object.rowSpan = (smartTableObject.header && smartTableObject.header.hasOwnProperty('children') && smartTableObject.header.children && smartTableObject.header.children.length) ? smartTableObject.header.children.length : 0;
        cell_object.dataObjId = string;
        cell_object.innerHTML = string;
        cell_object.sortable = true;
        
        cell_object.col = smartTableObject.header.children[0].children.length;
        
        cell_object.body_column = (smartTableObject.header.children[0].children[smartTableObject.header.children[0].children.length - 1]) ? smartTableObject.header.children[0].children[smartTableObject.header.children[0].children.length - 1].body_column + 1 : 0;
        
        // now place inside the curren row (TR)
        smartTableObject.header.children[0].children.push(cell_object);

        return smartTableObject;
    }
    SmartTable.tableHeaderSetup = function(smartTableObject) {
        var pointers = {},
            counters = {},
            elements = {},
            sorted_header_array = [];

        if (smartTableObject.header.objMap) {
            // FIRST WE RUN THROUGH THE OBJMAP AND BUILD THE HEADERS WE ARE TOLD TO --------------------------------------------------
            for (pointers.row_i = 0; pointers.row_i < smartTableObject.header.objMap.length; pointers.row_i += 1) {
                // create an array with [row] and [column] with the object for that row and column (we can then sort and draw)
                if (smartTableObject.header.objMap[pointers.row_i].col >= 0) {
                    if (smartTableObject.header.objMap[pointers.row_i].row >= 0) {
                        if (!sorted_header_array[smartTableObject.header.objMap[pointers.row_i].row]) {sorted_header_array[smartTableObject.header.objMap[pointers.row_i].row] = [];}
                        sorted_header_array[smartTableObject.header.objMap[pointers.row_i].row][smartTableObject.header.objMap[pointers.row_i].col] = smartTableObject.header.objMap[pointers.row_i];
                    }
                    else {
                        if (!sorted_header_array[0]) {sorted_header_array[0] = [];}
                        sorted_header_array[0][smartTableObject.header.objMap[pointers.row_i].col] = smartTableObject.header.objMap[pointers.row_i];
                    }
                }
            }
            // now we have an array by row which has an array of each column that hold the object for that cell

            // if user wants to drawn checkboxes for selecting rows
            if (smartTableObject.selection && sorted_header_array && sorted_header_array[0]) {
                // move all column values over by one
                for (pointers.cell_i = 0; pointers.cell_i < sorted_header_array[0].length; pointers.cell_i += 1) {
                    if (sorted_header_array[0][pointers.cell_i] && sorted_header_array[0][pointers.cell_i].hasOwnProperty('col')) {
                        sorted_header_array[0][pointers.cell_i].col += 1;
                    }
                }
                // add our new initial column for the selectors
                sorted_header_array[0].splice(0, 0, {col: 0, row: 0, innerHTML: '', sortable: true});
            }

            smartTableObject.header.objMap_sorted = sorted_header_array;

            // get total valid rows in header
            counters.valid_rows = 0;
            for (pointers.row_i = 0; pointers.row_i < sorted_header_array.length; pointers.row_i += 1) {
                if (sorted_header_array[pointers.row_i]) { // make sure we have something in this header row
                    counters.valid_rows += 1;
                }
            }

            counters.current_rows = 0;
            counters.body_columns = -1;
            for (pointers.row_i = 0; pointers.row_i < sorted_header_array.length; pointers.row_i += 1) { // row
                if (sorted_header_array[pointers.row_i]) { // make sure we have something in this row
                    elements.header_row = {};
                    elements.header_row.children = [];
                    elements.header_row.tag = "tr";

                    for (pointers.cell_i = 0; pointers.cell_i < sorted_header_array[pointers.row_i].length; pointers.cell_i += 1) { // columns
                        if (sorted_header_array[pointers.row_i][pointers.cell_i]) { // make sure we have some values at this column
                            elements.header_row_cell = {};
                            elements.header_row_cell.tag = (!sorted_header_array[pointers.row_i][pointers.cell_i].hasOwnProperty('sortable') || (sorted_header_array[pointers.row_i][pointers.cell_i].hasOwnProperty('sortable') && sorted_header_array[pointers.row_i][pointers.cell_i].sortable)) ? 'th' : 'td';
                            elements.header_row_cell.colSpan = (sorted_header_array[pointers.row_i][pointers.cell_i].hasOwnProperty('colSpan')) ? sorted_header_array[pointers.row_i][pointers.cell_i].colSpan : 1;

                            // identify header official column locations relative to what the body will have (the DOM is dumb this way)
                            if (pointers.row_i === 0) {
                                counters.body_columns += 1;
                                elements.header_row_cell.body_column = counters.body_columns;
                                if (elements.header_row_cell.colSpan > 1) {counters.body_columns += (elements.header_row_cell.colSpan - 1);}
                            }

                            // rowSpan logic
                            elements.header_row_cell.rowSpan = (elements.header_row_cell.colSpan === 1) ? (sorted_header_array[pointers.row_i][pointers.cell_i].hasOwnProperty('rowSpan')) ? sorted_header_array[pointers.row_i][pointers.cell_i].rowSpan : (counters.valid_rows - counters.current_rows) : (sorted_header_array[pointers.row_i][pointers.cell_i].hasOwnProperty('rowSpan')) ? sorted_header_array[pointers.row_i][pointers.cell_i].rowSpan : 1;
                            elements.header_row_cell.innerHTML = sorted_header_array[pointers.row_i][pointers.cell_i].hasOwnProperty('innerHTML') ? sorted_header_array[pointers.row_i][pointers.cell_i].innerHTML : '';

                            // now lets merge any other property passed for this cell
                            elements.header_row_cell = mergeObjects(elements.header_row_cell, sorted_header_array[pointers.row_i][pointers.cell_i]);
                            if (sorted_header_array[pointers.row_i][pointers.cell_i].hasOwnProperty('style')) {
                                applyStyles({
                                    element: elements.header_row_cell,
                                    styleObj: sorted_header_array[pointers.row_i][pointers.cell_i].style
                                });
                            }
                            // now place inside the curren row (TR)
                            elements.header_row.children.push(elements.header_row_cell);
                        }
                    }

                    // add current row to the header now
                    smartTableObject.header.children.push(elements.header_row);
                    counters.current_rows += 1;
                }
            }            
            
            // because the DOM is stupid and does not create relationships with headers and the body columns NOR even between the different rows in the header itself, we have to do all the work
            for (pointers.row_i = 1; pointers.row_i < smartTableObject.header.children.length; pointers.row_i += 1) { // go through the rest of the rows now
                counters.col_span = 0;
                counters.col_spans = 0;
                counters.col_span_sections = 0;
                pointers.col_span_loc = -1; 
                for (pointers.cell_i = 0; pointers.cell_i < smartTableObject.header.children[pointers.row_i].children.length; pointers.cell_i += 1) {
                    
                    if (counters.col_span === 0) { // find the next col_span in the first row of the header 
                        for (pointers.col_i = (pointers.col_span_loc + 1); pointers.col_i < smartTableObject.header.children[0].children.length; pointers.col_i += 1) {
                            if (smartTableObject.header.children[0].children[pointers.col_i].colSpan > 1) {
                                pointers.col_span_loc = pointers.col_i;
                                counters.col_span = smartTableObject.header.children[0].children[pointers.col_i].colSpan;
                                counters.col_spans += smartTableObject.header.children[0].children[pointers.col_i].colSpan;
                                counters.col_span_sections += 1;
                                break;
                            }
                        }
                    }
                    
                    smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].body_column = pointers.col_span_loc + (counters.col_spans - counters.col_span) - (counters.col_span_sections - 1);
                    counters.col_span -= 1;
                }
            }
        }
        else {
            elements.header_row = {};
            elements.header_row.children = [];
            elements.header_row.tag = "tr";

            // add current row to the header now
            smartTableObject.header.children.push(elements.header_row);
            counters.current_rows += 1;
        }

        // return our new built header element
        return smartTableObject;
    };

    SmartTable.tableBodySetup = function(smartTableObject) {
        var pointers = {};
        
        smartTableObject.body.children = []; // empty the children array and start over
        
        if (!smartTableObject.body.objMap_sorted || !smartTableObject.body.objMap_sorted.length) {
            smartTableObject.body.objMap_sorted = [];
            smartTableObject.body.objMap_unsorted = [];
            // if user did not put the mapping in the right order by column, we deal with this here (user is not required as we can handle this)
            for (pointers.i = 0; pointers.i < smartTableObject.body.objMap.length; pointers.i += 1) {
                if (smartTableObject.body.objMap[pointers.i].col >= 0) { // place in our sorted array for objects with specific col value setting
                    smartTableObject.body.objMap_sorted[smartTableObject.body.objMap[pointers.i].col] = smartTableObject.body.objMap[pointers.i];
                }
                else if (objSize(smartTableObject.body.objMap[pointers.i]) > 0) { // place in an unsorted array for objects with no specific column value (these will be drawn with new headers)
                    smartTableObject.body.objMap_unsorted.push(smartTableObject.body.objMap[pointers.i]);
                }
            }
            
            // if user wants to drawn checkboxes for selecting rows
            if (smartTableObject.selection && smartTableObject.body.objMap_sorted && smartTableObject.body.objMap_sorted[0]) {
                // move all column values over by one
                for (pointers.col_i = 0; pointers.col_i < smartTableObject.body.objMap_sorted.length; pointers.col_i += 1) {
                    if (smartTableObject.body.objMap_sorted[pointers.col_i].hasOwnProperty('col')) {
                        smartTableObject.body.objMap_sorted[pointers.col_i].col += 1;
                    }
                }
                // add in our new initial column for the selector
                smartTableObject.body.objMap_sorted.splice(0, 0, {col: 0, sortby: 1});
            }
        }
        
        for (pointers.data_i = 0; pointers.data_i < smartTableObject.body.data.length; pointers.data_i += 1) { // loop the data and have the row created
            smartTableObject = SmartTable.setupRow(smartTableObject, {data: smartTableObject.body.data[pointers.data_i], row_index: pointers.data_i});
        }

        // return our new built header element
        return smartTableObject;
    };
    
    function appendToRow(cell, row){
        var cols_length, pointers = {};
        // logic to place the item at correct location in the table
        if (cell.hasOwnProperty('col')) {
            if (row.children[cell.col]) {
                row.children.splice(cell.col, 1, cell);
            }
            else {
                cols_length = row.children.length - (cell.col - 1);
                if (cols_length < 0) {
                    for (pointers.cell_i = 0; pointers.cell_i < (-cols_length); pointers.cell_i += 1) {
                        row.children.push({tag: 'td'});
                    }
                }
                row.children.push(cell);
            }

        }
        else {
            // now place inside the curren row (TR)
            row.children.push(cell);
        }
    }

    SmartTable.setupRow = function(smartTableObject, obj) {
        var data = (obj.hasOwnProperty('data')) ? obj.data : false,
            row_index = (obj.hasOwnProperty('row_index')) ? obj.row_index : false,
            elements = {},
            pointers = {},
            key,
            unmapped_data = [],
            draw_new_header = false,
            filter_valid = true;

        // new row object (with some common basics needed)
        elements.row = {
            tag: "tr", 
            children: [],
            static_row: false,
            className: ''
        };
        
        // we need to create a seperate data set for mapping the unmapped data
        if (smartTableObject.displayNonMapData) {
            for (key in data) {
                if (data.hasOwnProperty(key)) {
                    unmapped_data[key] = data[key];
                }
            }
        }

        // first run though the object map (objMap) for the table body for any that have a position (COL) set
        for (pointers.i = 0; pointers.i < smartTableObject.body.objMap_sorted.length; pointers.i += 1) {
            if (smartTableObject.body.objMap_sorted[pointers.i]) { // make sure we have some values at this row
                elements.cell = SmartTable.createTDs({
                    columnData: smartTableObject.body.objMap_sorted[pointers.i],
                    row: elements.row,
                    row_data: data
                });
                appendToRow(elements.cell, elements.row);
                delete unmapped_data[smartTableObject.body.objMap_sorted[pointers.i].dataObjId];
            }
        }

        // run through the object map for the body for any other object that did not have a COL set
        for (pointers.i = 0; pointers.i < smartTableObject.body.objMap_unsorted.length; pointers.i += 1) {
            if (smartTableObject.body.objMap_unsorted[pointers.i]) { // make sure we have some values at this row
                elements.cell = SmartTable.createTDs({
                    columnData: smartTableObject.body.objMap_unsorted[pointers.i],
                    row: elements.row,
                    row_data: data
                });
                appendToRow(elements.cell, elements.row);
                delete unmapped_data[smartTableObject.body.objMap_unsorted[pointers.i].dataObjId];
            }
        }

        // if displayNonMapData is set then we want to show a column for each data item even if not set in the object map. We will draw headers also if needed based on the data item name
        if (smartTableObject.displayNonMapData) {
            for (key in unmapped_data) {
                if (unmapped_data.hasOwnProperty(key)) {
                    draw_new_header = true;
                    // find the header for this cell to place it under
                    for (pointers.header_i = 0; pointers.header_i < smartTableObject.header.children[0].children.length; pointers.header_i += 1) {
                        if (smartTableObject.header.children[0].children[pointers.header_i].dataObjId === key) {
                            // add a new cell now
                            elements.cell = SmartTable.createTDs({
                                columnData: {
                                    col: pointers.header_i + 1,
                                    dataObjId: key,
                                    id: key,
                                    className: 'dynamic',
                                    innerHTML: unmapped_data[key]
                                },
                                row: elements.row,
                                row_data: data
                            });
                            appendToRow(elements.cell, elements.row);
                            draw_new_header = false; // header was found and all is done with this item
                            break;
                        }

                    }
                    if (draw_new_header) { // header not found so lets create the header than the cell to be placed under it
                        // add a new header
                        smartTableObject = tableAddHeader(smartTableObject, key);
                        // add a new cell now
                        elements.cell = SmartTable.createTDs({
                            columnData: {
                                col: smartTableObject.header.children[0].children.length,
                                dataObjId: key,
                                id: key,
                                className: 'dynamic',
                                innerHTML: data[key]
                            },
                            row: elements.row,
                            row_data: data
                        });
                        appendToRow(elements.cell, elements.row);
                    }
                }
            }
        }

        // check if should be shown based on any set filter by the user
        if (smartTableObject.filter_string) {
            filter_valid = false;
            for (pointers.filter_i = 0; pointers.filter_i < elements.row.children.length; pointers.filter_i += 1) {
                if ((elements.row.children[pointers.filter_i].hasOwnProperty('innerHTML') && elements.row.children[pointers.filter_i].innerHTML && elements.row.children[pointers.filter_i].innerHTML.toString().toLowerCase().indexOf(smartTableObject.filter_string.toLowerCase()) !== -1) || (elements.row.children[pointers.filter_i].hasOwnProperty('sortby_value') && typeof elements.row.children[pointers.filter_i].sortby_value === "string" && elements.row.children[pointers.filter_i].sortby_value.toLowerCase().indexOf(smartTableObject.filter_string.toLowerCase()) !== -1)) {
                    filter_valid = true;
                }
            }
        }

        if (filter_valid && smartTableObject.body && smartTableObject.body.hasOwnProperty('children')) {
            // wrap up and add to the table now
            if ((row_index || row_index === 0) && smartTableObject.body.children[row_index]) { // if supposed to place this new row in specific loction
                smartTableObject.body.children.splice((row_index), 0, elements.row);
            }
            else {
                smartTableObject.body.children.push(elements.row);
            }
        }
        
        // return total rows available for drawing
        smartTableObject.totals.rows = (smartTableObject.body.hasOwnProperty('children') && smartTableObject.body.children && smartTableObject.body.children.length) ? smartTableObject.body.children.length : 0;
        return smartTableObject;
    };
    
    function formatExportArray(export_values, export_array){
        var pointers = {},  values = {cells: []};
        // each header/value row
        for (pointers.row_i = 0; pointers.row_i < export_values.length; pointers.row_i += 1) {
            values.cells = [];
            values.lastcol = 0;
            // each header cell
            for (pointers.cell_i = 0; pointers.cell_i < export_values[pointers.row_i].length; pointers.cell_i += 1) {
                // insert blank columns if the new current column is to be further down the line
                if (export_values[pointers.row_i][pointers.cell_i].col > (values.lastcol + 1)) {
                    pointers.start_point = (pointers.cell_i > 0) ? values.lastcol + 1 : values.lastcol;
                    for (pointers.span_i = pointers.start_point; pointers.span_i < export_values[pointers.row_i][pointers.cell_i].col; pointers.span_i += 1) {
                        values.cells.push("");
                    }
                }
                // append the new label now
                values.cells.push('"' + export_values[pointers.row_i][pointers.cell_i].label + '"');
                /*
                // insert new blank columns if we have a span greater than 1
                for (pointers.span_i = 0; pointers.span_i < (export_values[pointers.row_i][pointers.cell_i].span - 1); pointers.span_i += 1) {
                    values.cells.push("");
                }
                */
                // keep track of last column position
                values.lastcol = export_values[pointers.row_i][pointers.cell_i].col;
            }
            export_array.push(values.cells);
        }
        return export_array;
    }
    
    SmartTable.getExportArray = function(smartTableObject) {
        var export_values = SmartTable.getExportValues(smartTableObject), export_array = [];

        export_array = formatExportArray(export_values.header, export_array);
        export_array = formatExportArray(export_values.values, export_array);
        
        return export_array;
    };
    
    SmartTable.getExportValues = function(smartTableObject) {
        var pointers = {}, values = {rows: [], cells: []}, result = {header: [], values: []};

        // get current header values
        for (pointers.row_i = 0; pointers.row_i < smartTableObject.header.children.length; pointers.row_i += 1) {
            values.cells = [];
            for (pointers.cell_i = 0; pointers.cell_i < smartTableObject.header.children[pointers.row_i].children.length; pointers.cell_i += 1) {
                values.tmp = {label: smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].innerHTML, col: smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].body_column, span: smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].colSpan};
                values.cells.push(values.tmp);
            }
            values.rows.push(values.cells);
        }
        result.header = values.rows;
        // get current rows of data
        values.rows = [];
        values.cells = [];
        for (pointers.row_i = 0; pointers.row_i < smartTableObject.body.children.length; pointers.row_i += 1) {
            values.cells = [];
            for (pointers.cell_i = 0; pointers.cell_i < smartTableObject.body.children[pointers.row_i].children.length; pointers.cell_i += 1) {
                values.tmp = {label: smartTableObject.body.children[pointers.row_i].children[pointers.cell_i].exportby_value || '', col: smartTableObject.body.children[pointers.row_i].children[pointers.cell_i].col, span: smartTableObject.body.children[pointers.row_i].children[pointers.cell_i].colSpan || 1};
                values.cells.push(values.tmp);
            }
            values.rows.push(values.cells);
        }
        result.values = values.rows;
        
        return result;
    };

    SmartTable.handleFilter = function(smartTableObject, filter_val) {
        var key, pointers = {}, tmp_editData = [];

        smartTableObject.filter_string = (filter_val && filter_val !== "") ? filter_val : false;

        // make sure input element has same string in it
        if (smartTableObject.filter_string && smartTableObject.filter) {
            smartTableObject.filter.value = smartTableObject.filter_string;
        }

        // get original data but break relationship
        if (smartTableObject.data.origData && smartTableObject.data.origData.length) {
            for (pointers.rows_i = 0; pointers.rows_i < smartTableObject.data.origData.length; pointers.rows_i += 1) {
                tmp_editData[pointers.rows_i] = {};
                for (key in smartTableObject.data.origData[pointers.rows_i]) {
                    if (smartTableObject.data.origData[pointers.rows_i].hasOwnProperty(key)) {
                        tmp_editData[pointers.rows_i][key] = smartTableObject.data.origData[pointers.rows_i][key];
                    }
                }
            }
        }

        // setup rows again with filter
        SmartTable.tableBodySetup.data = tmp_editData;
        smartTableObject = SmartTable.tableBodySetup(smartTableObject);

        // if we are using a pager, lets redraw it based on new data set
        if (smartTableObject.builder_obj.hasOwnProperty('table') && smartTableObject.builder_obj.table && smartTableObject.builder_obj.table.hasOwnProperty('attributes') && smartTableObject.builder_obj.table.attributes && smartTableObject.builder_obj.table.attributes.hasOwnProperty('pagination') && smartTableObject.builder_obj.table.attributes.pagination) {
            smartTableObject = SmartTable.drawPager(smartTableObject);
        }

        // draw the body again
        smartTableObject = SmartTable.drawBody(smartTableObject);
        fixTableCells(smartTableObject.table);
        
        // Update Filter in URL HASH if user enabled
        if (smartTableObject.hasOwnProperty('use_url_params') && smartTableObject.use_url_params) {
            updateParams(smartTableObject.id + "_filter", smartTableObject.filter_string);
        }
        return smartTableObject;
    };

    SmartTable.drawFilter = function(smartTableObject) {
        var elements = {};

        elements.div = document.createElement("div");

        elements.div.setAttribute("class", "stfilter");
        elements.span = document.createElement("span");
        elements.span.innerHTML = "Filter";
        elements.div.appendChild(elements.span);
        elements.input = document.createElement("input");
        elements.input.setAttribute("class", "stfilter");
        elements.input.setAttribute("type", "text");
        elements.input.setAttribute("maxlength", "200");
        elements.input.onchange = function(e) {
            smartTableObject = SmartTable.handleFilter(smartTableObject, e.target.value);
        };

        elements.div.appendChild(elements.input);

        if (smartTableObject.filter.hasOwnProperty('style')) {
            applyStyles({
                element: elements.div,
                styleObj: smartTableObject.filter.style
            });
        }
        
        smartTableObject.builder_obj.target.appendChild(elements.div);
        
        smartTableObject.filter = elements.input;
        
        return smartTableObject;
    };

    SmartTable.drawPager = function(smartTableObject) {
        var elements = {},
            pointers = {},
            init_size = smartTableObject.max_rows_to_show,
            data_size = (smartTableObject.data.hasOwnProperty('origData') && smartTableObject.data.origData && smartTableObject.data.origData.length) ? smartTableObject.data.origData.length : 0,
            last_scale_used = init_size,
            scales = (smartTableObject.builder_obj.table.attributes.pagination.hasOwnProperty('scales')) ? smartTableObject.builder_obj.table.attributes.pagination.scales : [25, 50, 100, 200, 400, 800, 1000];

        function redrawPage() {
            smartTableObject = SmartTable.drawBody(smartTableObject);
            fixTableCells(smartTableObject.table);
        }

        if (init_size > data_size) {
            init_size = data_size;
        }
        
        // remove any existing pager element
        if (smartTableObject.hasOwnProperty('pager') && smartTableObject.pager) {
            smartTableObject.pager.parentNode.removeChild(smartTableObject.pager);
        }

        elements.pager_container = document.createElement("div");
        elements.pager_container.id = smartTableObject.id + "_pager";
        elements.pager_container.setAttribute("class", "pager");
        elements.form = document.createElement("form");
        elements.form.setAttribute("class", "pager-form");
        elements.first_arrow = document.createElement("span");
        elements.first_arrow.setAttribute("class", "pager-first");
        elements.first_arrow.innerHTML = "|&lsaquo;";
        elements.form.appendChild(elements.first_arrow);
        elements.prev_arrow = document.createElement("span");
        elements.prev_arrow.setAttribute("class", "pager-previous");
        elements.prev_arrow.innerHTML = "&lsaquo;";
        elements.form.appendChild(elements.prev_arrow);
        
        elements.inner_span = document.createElement("span");
        elements.inner_span.setAttribute("class", "pager-inner");
        elements.rows_span = document.createElement("span");
        elements.rows_span.setAttribute("class", "pager-text");
        elements.rows_span.innerHTML = "Showing ";
        elements.inner_span.appendChild(elements.rows_span);
        elements.select = document.createElement("select");
        elements.select.setAttribute("class", "pager-select");
        elements.select_option = document.createElement("option");
        elements.select_option.setAttribute("value", init_size);
        elements.select_option.innerHTML = init_size;
        elements.select_option.setAttribute("selected", "selected");
        elements.select.appendChild(elements.select_option);
        // for each desired page size scale lets draw the option if its greater than the initial size desired
        for (pointers.scales_i = 0; pointers.scales_i < scales.length; pointers.scales_i += 1) {
            if ((scales[pointers.scales_i] > (init_size + 10)) && (scales[pointers.scales_i] < data_size)) {
                elements.select_option = document.createElement("option");
                elements.select_option.setAttribute("value", scales[pointers.scales_i]);
                elements.select_option.innerHTML = scales[pointers.scales_i];
                elements.select.appendChild(elements.select_option);
                last_scale_used = scales[pointers.scales_i];
            }
        }
        // if the data size is still larger than our scale, lets give the user an option to see everything on one page
        if (data_size > last_scale_used) {
            elements.select_option = document.createElement("option");
            elements.select_option.setAttribute("value", data_size);
            elements.select_option.innerHTML = data_size;
            elements.select.appendChild(elements.select_option);
        }
        elements.inner_span.appendChild(elements.select);
        elements.rows_span = document.createElement("span");
        elements.rows_span.setAttribute("class", "pager-rows");
        elements.rows_span.innerHTML = " rows on page ";
        elements.inner_span.appendChild(elements.rows_span);
        elements.input = document.createElement("input");
        elements.input.setAttribute("class", "pager-input");
        elements.input.setAttribute("type", "text");
        elements.input.value = smartTableObject.pager_page;
        elements.inner_span.appendChild(elements.input);
        elements.of_span = document.createElement("span");
        elements.of_span.setAttribute("class", "pager-total");
        elements.of_span.innerHTML = " of " + Math.ceil(smartTableObject.body.children.length / smartTableObject.max_rows_to_show);
        elements.inner_span.appendChild(elements.of_span);
        elements.form.appendChild(elements.inner_span);
        
        elements.next_arrow = document.createElement("span");
        elements.next_arrow.setAttribute("class", "pager-next");
        elements.next_arrow.innerHTML = "&rsaquo;";
        elements.form.appendChild(elements.next_arrow);
        elements.last_arrow = document.createElement("span");
        elements.last_arrow.setAttribute("class", "pager-last");
        elements.last_arrow.innerHTML = "&rsaquo;|";
        elements.form.appendChild(elements.last_arrow);

        // USER EVENTS IN THE PAGER
        elements.first_arrow.onclick = function(e) {
            smartTableObject.pager_page = 1;
            elements.input.value = smartTableObject.pager_page;
            if (smartTableObject.use_url_params) {updateParams(smartTableObject.id + "_pager_page", smartTableObject.pager_page);}
            redrawPage();
        };
        elements.next_arrow.onclick = function(e) {
            smartTableObject.pager_page = checkPagerPage(smartTableObject.pager_page + 1, smartTableObject.body.children.length, smartTableObject.max_rows_to_show);
            elements.input.value = smartTableObject.pager_page;
            if (smartTableObject.use_url_params) {updateParams(smartTableObject.id + "_pager_page", smartTableObject.pager_page);}
            redrawPage();
        };
        elements.prev_arrow.onclick = function(e) {
            if (smartTableObject.pager_page !== 1) {
                smartTableObject.pager_page = checkPagerPage(smartTableObject.pager_page - 1, smartTableObject.body.children.length, smartTableObject.max_rows_to_show);
                elements.input.value = smartTableObject.pager_page;
                if (smartTableObject.use_url_params) {updateParams(smartTableObject.id + "_pager_page", smartTableObject.pager_page);}
                redrawPage();
            }
        };
        elements.last_arrow.onclick = function(e) {
            smartTableObject.pager_page = Math.ceil(smartTableObject.body.children.length / smartTableObject.max_rows_to_show);
            elements.input.value = smartTableObject.pager_page;
            if (smartTableObject.use_url_params) {updateParams(smartTableObject.id + "_pager_page", smartTableObject.pager_page);}
            redrawPage();
        };
        elements.select.onchange = function(e) {
            // reset the pager back to page 1 since odd things could happen
            smartTableObject.pager_page = 1;
            elements.input.value = smartTableObject.pager_page;
            // whatever is selected is the max rows per page
            smartTableObject.max_rows_to_show = parseFloat(e.target.value);
            elements.of_span.innerHTML = "of " + Math.ceil(smartTableObject.body.children.length / smartTableObject.max_rows_to_show);
        };
        elements.input.onchange = function(e) {
            smartTableObject.pager_page = checkPagerPage(e.target.value, smartTableObject.body.children.length, smartTableObject.max_rows_to_show);
            elements.input.value = smartTableObject.pager_page;
        };
        elements.input.onfocus = function(e) {
            // simple hightlighter
            this.select();
        };
        elements.input.onmouseup = function(e) {
            // simple hightlighter support
            e.preventDefault();
        };
        elements.form.onchange = function(e) {
            if (smartTableObject.use_url_params) {
                updateParams(smartTableObject.id + "_pager_page", smartTableObject.pager_page);
                updateParams(smartTableObject.id + "_pager_rows", smartTableObject.max_rows_to_show);
            }
            // redraw the body
            redrawPage();
        };

        elements.pager_container.appendChild(elements.form);

        // applying any styling passed in the pager object from the builder object
        if (smartTableObject.builder_obj.table.attributes.pagination.hasOwnProperty('style')) {
            applyStyles({
                element: elements.pager_container,
                styleObj: smartTableObject.builder_obj.table.attributes.pagination.style
            });
        }

        // place in container
        if (!smartTableObject.hasOwnProperty('controls')) {
            smartTableObject.controls = document.createElement('div');
            smartTableObject.controls.className = "table-controls";
            smartTableObject.builder_obj.target.appendChild(smartTableObject.controls);
        }
        smartTableObject.controls.appendChild(elements.pager_container);
        
        // if user enabled url parameter usage, we update the params with the current parger page and max rows per page
        if (smartTableObject.use_url_params) {
            updateParams(smartTableObject.id + "_pager_page", smartTableObject.pager_page);
            updateParams(smartTableObject.id + "_pager_rows", smartTableObject.max_rows_to_show);
        }
        
        smartTableObject.pager = elements.pager_container;
        
        return smartTableObject;
    };
    
    SmartTable.drawSelector = function(smartTableObject) {
        var elements = {}, pointers = {}, my_funcs = false;
        
        // remove any existing selector element
        if (smartTableObject.hasOwnProperty('selector') && smartTableObject.selector) {
            smartTableObject.selector.parentNode.removeChild(smartTableObject.selector);
        }

        elements.selector_container = document.createElement("div");
        elements.selector_container.id = smartTableObject.id + "_selector";
        elements.selector_container.setAttribute("class", "table-selector");
        elements.ul_list = document.createElement("ul");
        elements.ul_list.setAttribute("class", "table-list");
        
        elements.li = document.createElement("li");
        elements.li.setAttribute("class", "table-list-item");
        elements.li.innerHTML = "Select:";
        elements.ul_list.appendChild(elements.li);
        elements.li = document.createElement("li");
        elements.li.setAttribute("class", "table-list-item");
        elements.select_option = document.createElement("a");
        elements.select_option.setAttribute("name", "none");
        elements.select_option.innerHTML = "None";
        elements.select_option.onclick = function(e){
            e.preventDefault();
            selectAllRows(smartTableObject, false);
        };
        elements.li.appendChild(elements.select_option);
        elements.ul_list.appendChild(elements.li);
        elements.li = document.createElement("li");
        elements.li.setAttribute("class", "table-list-item");
        elements.select_option = document.createElement("a");
        elements.select_option.setAttribute("name", "all");
        elements.select_option.innerHTML = "All";
        elements.select_option.onclick = function(e){
            e.preventDefault();
            selectAllRows(smartTableObject, true);
        };
        elements.li.appendChild(elements.select_option);
        elements.ul_list.appendChild(elements.li);
        elements.li = document.createElement("li");
        elements.li.setAttribute("class", "table-list-item");
        elements.select_option = document.createElement("a");
        elements.select_option.setAttribute("name", "page");
        elements.select_option.innerHTML = "Page";
        elements.select_option.onclick = function(e){
            e.preventDefault();
            selectPageRows(smartTableObject);
        };
        elements.li.appendChild(elements.select_option);
        elements.ul_list.appendChild(elements.li);

        // for each desired selector option the user has passed if any
        if (smartTableObject.builder_obj.table.attributes.selection.hasOwnProperty('options') && smartTableObject.builder_obj.table.attributes.selection.options) {
            my_funcs = function(e){
                var rows = [], data = {};
                data[e.target.dataObjId] = e.target.dataObjValue;
                rows = SmartTable.getBodyRowsByData(smartTableObject, data);
                SmartTable.selectRows(smartTableObject, rows);
            };
            for (pointers.options_i = 0; pointers.options_i < smartTableObject.builder_obj.table.attributes.selection.options.length; pointers.options_i += 1) {
                elements.li = document.createElement("li");
                elements.li.setAttribute("class", "table-list-item");
                elements.select_option = document.createElement("a");
                elements.select_option.setAttribute("name", smartTableObject.builder_obj.table.attributes.selection.options[pointers.options_i].dataObjId);
                elements.select_option.objMap = smartTableObject.builder_obj.table.attributes.selection.options[pointers.options_i];
                elements.select_option.innerHTML = smartTableObject.builder_obj.table.attributes.selection.options[pointers.options_i].label;
                elements.select_option.dataObjId = smartTableObject.builder_obj.table.attributes.selection.options[pointers.options_i].dataObjId;
                elements.select_option.dataObjValue = smartTableObject.builder_obj.table.attributes.selection.options[pointers.options_i].value;
                elements.select_option.onclick = my_funcs;
                elements.li.appendChild(elements.select_option);
                elements.ul_list.appendChild(elements.li);
            }
        }
        /*
        elements.select.onchange = function(e) {
            
        };
        */
        elements.selector_container.appendChild(elements.ul_list);

        // applying any styling passed in the selector object from the builder object
        if (smartTableObject.builder_obj.table.attributes.selection.hasOwnProperty('style')) {
            applyStyles({
                element: elements.selector_container,
                styleObj: smartTableObject.builder_obj.table.attributes.selection.style
            });
        }

        // place in container
        if (!smartTableObject.hasOwnProperty('controls')) {
            smartTableObject.controls = document.createElement('div');
            smartTableObject.controls.className = "table-controls";
            smartTableObject.builder_obj.target.appendChild(smartTableObject.controls);
        }
        smartTableObject.controls.appendChild(elements.selector_container);
        
        smartTableObject.selector = elements.selector_container;
        
        return smartTableObject;
    };

    SmartTable.createTDs = function(obj) {
        var elements = {},
            key;

        elements.row = obj.row;
        elements.cell_obj = {};
        elements.cell = {};
        elements.cell.tag = "td";

        // break object relationship so we can do bad things to this new object
        for (key in obj.columnData) {
            if (obj.columnData.hasOwnProperty(key)) {
                elements.cell_obj[key] = obj.columnData[key];
            }
        }

        if (elements.cell_obj.hasOwnProperty('sortby') && typeof elements.cell_obj.sortby === 'function') { // a sortby callback was passed so lets handle this on creation
            elements.cell_obj.sortby_function = elements.cell_obj.sortby;
        }
        else {
            elements.cell_obj.sortby_function = false;
            elements.cell_obj.sortby_value = elements.cell_obj.sortby;
        }
        
        if (elements.cell_obj.hasOwnProperty('exportby') && typeof elements.cell_obj.exportby === 'function') { // an exportby callback was passed so lets handle this on creation
            elements.cell_obj.exportby_function = elements.cell_obj.exportby;
        }
        else {
            elements.cell_obj.exportby_function = false;
            elements.cell_obj.exportby_value = elements.cell_obj.exportby;
        }

        // lets handle the sortby object now
        elements.cell_obj.sortby_value = calculateSortBy(elements.cell_obj, obj.row_data, elements.cell_obj.sortby_value);
        
        // lets handle the exportBy object now
        elements.cell_obj.exportby_value = calculateExportBy(elements.cell_obj, obj.row_data, elements.cell_obj.exportby_value);
        
        // store original data to the cell
        elements.cell_obj.data = obj.row_data;

        if (elements.cell_obj.hasOwnProperty('dataObjId') && elements.cell_obj.dataObjId && obj.row_data[elements.cell_obj.dataObjId]) {
            // identified to have an ID associated and a value inside the data-object so lets replace/place an innerHTML value
            elements.cell_obj.innerHTML = obj.row_data[elements.cell_obj.dataObjId];
            if (elements.cell_obj.hasOwnProperty('format') && elements.cell_obj.format) { // if we wanted to format the data-object lets handle it here
                elements.cell_obj = formatHtml(elements.cell_obj);
            }
        }
        
        // now lets merge any other property passed for this cell
        elements.cell = mergeObjects(elements.cell, elements.cell_obj);
        if (elements.cell_obj.hasOwnProperty('style')) {
            applyStyles({
                element: elements.cell,
                styleObj: elements.cell_obj.style
            });
        }
        
        // if user passed a callback, lets run now
        if (elements.cell_obj.hasOwnProperty('callback') && typeof elements.cell_obj.callback === 'function') {
            elements.cell_obj.callback(obj.row_data, elements.cell, elements.row);
        }
        
        return elements.cell;
    };

    SmartTable.handleSort = function(smartTableObject, e) {
        var pointers = {},
            append = true,
            values = {},
            dataset = {sortable: [], static_row: []};
            
        if (e) {
            values = {
                shift_click: (e) ? e.shiftKey : false,
                col_num: (e) ? e.target.body_column : false,
                neg_col_num: (e) ? "-" + e.target.body_column : false
            };

            // reverse sort order if needed (could not user faster indexof due to its inherent issues with false finds)
            for (pointers.check_i = 0; pointers.check_i < smartTableObject.sort_columns.length; pointers.check_i += 1) {
                if (smartTableObject.sort_columns[pointers.check_i] === values.neg_col_num) {
                    smartTableObject.sort_columns[pointers.check_i] = values.col_num;
                    append = false;
                }
                else if (smartTableObject.sort_columns[pointers.check_i] === values.col_num) {
                    smartTableObject.sort_columns[pointers.check_i] = values.neg_col_num;
                    append = false;
                }
            }

            // if has not already been found and inverted OR if user single clicked after having a multisort set (this is to reset the multisort)
            if (append || (!values.shift_click && smartTableObject.sort_columns.length > 1)) {
                // if shift + click then we append this new sort column into our array of columns to sort
                if (values.shift_click) {
                    smartTableObject.sort_columns.push(values.col_num);
                }
                else {
                    smartTableObject.sort_columns = [values.col_num];
                }
            }
            // smartTableObject.sort_columns now holds an array of columns to be sorted in the order they were selected by the user

            // if user enabled url parameter usage, we update the params with the current columns sort info
            if (smartTableObject.use_url_params) {
                updateParams(smartTableObject.id + "_sort", smartTableObject.sort_columns.join(":"));
            }
        }
        
        // make sure something to sort
        if (smartTableObject.hasOwnProperty('body') && smartTableObject.body && smartTableObject.body.hasOwnProperty('children') && smartTableObject.body.children && smartTableObject.body.children.length) {
            
            // first remove any static rows (we do not sort those)
            for (pointers.rows_i = 0; pointers.rows_i < smartTableObject.body.children.length; pointers.rows_i += 1) {
                if (!smartTableObject.body.children[pointers.rows_i].hasOwnProperty('static_row') || (smartTableObject.body.children[pointers.rows_i].hasOwnProperty('static_row') && !smartTableObject.body.children[pointers.rows_i].static_row)) {
                    dataset.sortable.push(smartTableObject.body.children[pointers.rows_i]);
                }
                else {
                    dataset.static_row.push({row_index: pointers.rows_i, row: smartTableObject.body.children[pointers.rows_i]});
                }
            }
            smartTableObject.body.children = dataset.sortable;
            
            // loop all header (if its a th) clear all styling if its the up/down arrow (if is in sort column then apply correct arrow direction class
            for (pointers.sortable_header_i = 0; pointers.sortable_header_i < smartTableObject.sortable_header.length; pointers.sortable_header_i += 1){
                if (smartTableObject.sortable_header[pointers.sortable_header_i]) { 
                    smartTableObject.sortable_header[pointers.sortable_header_i].className = smartTableObject.sortable_header[pointers.sortable_header_i].className.replace(' headerSortUp','').replace('headerSortUp','').replace(' headerSortDown','').replace('headerSortDown','');
                }
            }
            for (pointers.sort_columns_i = 0; pointers.sort_columns_i < smartTableObject.sort_columns.length; pointers.sort_columns_i += 1){
                values.current_sort_val = parseFloat(smartTableObject.sort_columns[pointers.sort_columns_i]);
                values.current_sort_index_val = (values.current_sort_val < 0) ? values.current_sort_val * -1 : values.current_sort_val;
                if (smartTableObject.sortable_header[values.current_sort_index_val]) {
                    if (values.current_sort_val < 0 || smartTableObject.sort_columns[pointers.sort_columns_i] === '-0') {
                        smartTableObject.sortable_header[values.current_sort_index_val].className += " headerSortDown";
                    }
                    else {
                        smartTableObject.sortable_header[values.current_sort_index_val].className += " headerSortUp";
                    }
                }
            }
            
            // sort now
            smartTableObject.body.children.sort(dynamicSortMultiple(smartTableObject.sort_columns));
            
            // add back the static rows to original position
            for (pointers.rows_i = 0; pointers.rows_i < dataset.static_row.length; pointers.rows_i += 1) {
                smartTableObject.body.children.splice(dataset.static_row[pointers.rows_i].row_index, 0, dataset.static_row[pointers.rows_i].row);
            }
            
            // redraw the body
            smartTableObject = SmartTable.drawBody(smartTableObject);
            fixTableCells(smartTableObject.table);
        }
        return smartTableObject;
    };

    SmartTable.drawHeader = function(smartTableObject) {
        var elements = {},
            pointers = {},
            key,
            values = {},
            my_funcs = false,
            header_cell_tag;
            
        smartTableObject.sortable_header = []; // object to hold all clickable header cells
        
        // DRAW THE TABLE
        smartTableObject.table = document.createElement("table");
        // first if we passed any styling for the table, apply it
        if (smartTableObject.hasOwnProperty('style') && smartTableObject.style !== "" && smartTableObject.style) {
            applyStyles({
                element: smartTableObject.table,
                styleObj: smartTableObject.style
            });
        }
        // now for every attribute lets apply to the table
        for (key in smartTableObject) {
            if (smartTableObject.hasOwnProperty(key)) {
                if (smartTableObject[key] !== "body" && smartTableObject[key] !== "header") {
                    smartTableObject.table[key] = smartTableObject[key];
                }
            }
        }

        // DRAW THE HEADER
        elements.header = (smartTableObject.hasOwnProperty('header') && smartTableObject.header && smartTableObject.header.hasOwnProperty('tag') && smartTableObject.header.tag) ? document.createElement(smartTableObject.header.tag) : document.createElement("thead");
        // loop through the header children (rows) and draw each row and column cell
        if (smartTableObject.hasOwnProperty('header') && smartTableObject.header && smartTableObject.header.hasOwnProperty('children') && smartTableObject.header.children) {
            my_funcs = function(e) {
                if (values.old) {
                    values.old.onclick(e);
                }
                smartTableObject = SmartTable.handleSort(smartTableObject, e);
            };
            // EACH ROW
            for (pointers.row_i = 0; pointers.row_i < smartTableObject.header.children.length; pointers.row_i += 1) {
                elements.tmprow = (smartTableObject.header.children[pointers.row_i].hasOwnProperty('tag') && smartTableObject.header.children[pointers.row_i].tag) ? document.createElement(smartTableObject.header.children[pointers.row_i].tag) : document.createElement("tr");

                // first if we passed any styling for the row, apply it
                if (smartTableObject.header.children[pointers.row_i].hasOwnProperty('style') && smartTableObject.header.children[pointers.row_i].style !== "" && smartTableObject.header.children[pointers.row_i].style) {
                    applyStyles({
                        element: elements.tmprow,
                        styleObj: smartTableObject.header.children[pointers.row_i].style
                    });
                }
                // now for every attribute lets apply to the row
                for (key in smartTableObject.header.children[pointers.row_i]) {
                    if (smartTableObject.header.children[pointers.row_i].hasOwnProperty(key)) {
                        if (smartTableObject.header.children[pointers.row_i][key] !== "children") {
                            elements.tmprow[key] = smartTableObject.header.children[pointers.row_i][key];
                        }
                    }
                }

                // EACH CELL
                for (pointers.cell_i = 0; pointers.cell_i < smartTableObject.header.children[pointers.row_i].children.length; pointers.cell_i += 1) {
                    header_cell_tag = (smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].hasOwnProperty('tag') && smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].tag) ? smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].tag : "td";
                    elements.tmpcell = document.createElement(header_cell_tag);

                    // first if we passed any styling for the cell, apply it
                    if (smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].hasOwnProperty('style') && smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].style !== "" && smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].style) {
                        applyStyles({
                            element: elements.tmpcell,
                            styleObj: smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].style
                        });
                    }
                    // now for every attribute lets apply to the cell
                    for (key in smartTableObject.header.children[pointers.row_i].children[pointers.cell_i]) {
                        if (smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].hasOwnProperty(key)) {
                            if (smartTableObject.header.children[pointers.row_i].children[pointers.cell_i][key] !== "children") {
                                elements.tmpcell[key] = smartTableObject.header.children[pointers.row_i].children[pointers.cell_i][key];
                            }
                        }
                    }
                    
                    // now if tag is th and if attribute sortable is set to true then we can make this header cell clickable
                    if (header_cell_tag === "th" && (!smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].hasOwnProperty('sortable') || (smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].hasOwnProperty('sortable') && smartTableObject.header.children[pointers.row_i].children[pointers.cell_i].sortable))) {
                        if (elements.tmpcell.onclick) {
                            pointers.onclick = 'onclick';
                            values.old = {onclick: elements.tmpcell[pointers.onclick]};
                        }
                        elements.tmpcell.onclick = my_funcs;
                        /*
                        // collapsable button
                        elements.colapsable_button = document.createElement('text');
                        elements.colapsable_button.innerHTML = " X";
                        elements.colapsable_button.onclick = function(e){
                            console.log("hideme");
                            console.log({cell: elements.tmpcell});
                        };
                        elements.tmpcell.appendChild(elements.colapsable_button);
                        */
                        // create object map of all header cells so we can switch classing on them for sorting
                        smartTableObject.sortable_header[elements.tmpcell.body_column] = elements.tmpcell;
                    }
                    // put cell in row
                    elements.tmprow.appendChild(elements.tmpcell);
                }
                // put row in header
                elements.header.appendChild(elements.tmprow);
            }
        }
        // put header in table
        smartTableObject.table.appendChild(elements.header);
        // put table in html target
        smartTableObject.builder_obj.target.appendChild(smartTableObject.table);

        return smartTableObject;
    };
    
    SmartTable.setupCell = function(smartTableObject, cell_index, cell_obj, row_element, cell_element){
        var elements = {}, key, 
            cell_callback_result = false,
            cell_callback = (cell_obj.hasOwnProperty('renderCallback') && cell_obj.renderCallback) ? cell_obj.renderCallback : false;
    
        elements.tmpcellobject = {};
            
        // for every attribute lets apply to the cell
        for (key in cell_obj) {
            if (cell_obj.hasOwnProperty(key)) {
                if (cell_obj[key] !== "children") {
                    elements.tmpcellobject[key] = cell_obj[key];
                }
            }
        }

        // lets handle any renderCallback now
        if (cell_callback && typeof cell_callback === 'function') {
            cell_callback_result = cell_callback(elements.tmpcellobject, cell_obj.data, cell_element, row_element); // (writable object, data for the row, current TD element, current TR element)
            if (cell_callback_result || cell_callback_result === 0) {
                elements.tmpcellobject = cell_callback_result;
            }
        }

        // if there is a filter we can highlight the filtered string so user knows what was found
        if (smartTableObject.filter_string && (elements.tmpcellobject.hasOwnProperty('innerHTML') && elements.tmpcellobject.innerHTML && elements.tmpcellobject.innerHTML.toString().indexOf(smartTableObject.filter_string) !== -1)) {
            elements.tmpcellobject.innerHTML = filterHightlighter(smartTableObject.filter_string, elements.tmpcellobject.innerHTML.toString());
        }

        cell_element = mergeObjects(cell_element, elements.tmpcellobject);

        // apply any styles passed originally into this cell
        if (elements.tmpcellobject.hasOwnProperty('style')) {
            applyStyles({
                element: cell_element,
                styleObj: elements.tmpcellobject.style
            });
        }

        // if user wants to drawn checkboxes for selecting rows
        if (smartTableObject.selection && cell_index === 0) {
            elements.selector = document.createElement('input');
            elements.selector.type = "checkbox";
            elements.selector.parentRow = row_element;
            elements.selector.parentCol = cell_element;
            elements.selector.onchange_function = function(target){
                target.parentRow.rowSelected = target.checked;
                target.parentRow.className = (target.checked) ? target.parentRow.className + " selected" : target.parentRow.className = target.parentRow.className.replace(" selected","").replace("selected","");
                smartTableObject.body.children[target.parentRow.bodyRow].rowSelected = target.checked;
                smartTableObject.body.children[target.parentRow.bodyRow].children[0].sortby_value = (target.checked) ? 0 : 1;
                smartTableObject.body.children[target.parentRow.bodyRow].children[0].sortby = (target.checked) ? 0 : 1;
            };
            elements.selector.onchange = function(e){
                e.target.onchange_function(e.target);
            };
            cell_element.appendChild(elements.selector);
            
            // used for selector (tip: you can set row.rowSelected in a callback in your bodymap object based on any condition you create)
            if (row_element.hasOwnProperty('rowSelected') && row_element.rowSelected) {
                elements.selector.checked = row_element.rowSelected;
                if (row_element.className.indexOf("selected") === -1) {row_element.className += " selected";}
                smartTableObject.body.children[row_element.bodyRow].rowSelected = row_element.rowSelected;
            }
            // make the entire cell a hitbox because checkboxes suck
            cell_element.onclick = function(e){
                if (e.target.nodeName !== "INPUT") {
                    elements.selector.checked = !elements.selector.checked;
                    elements.selector.onchange_function(elements.selector);
                }
            };
        }
        return cell_element;
    };

    SmartTable.drawBody = function(smartTableObject) {
        var elements = {}, pointers = {zebra_odd: true}, key, counters = {};

        if (smartTableObject.table) {
            // DRAW THE BODY (or grab a body if exists)
            elements.body = (smartTableObject.table.hasOwnProperty('tBodies') && smartTableObject.table.tBodies && smartTableObject.table.tBodies.length > 0) ? smartTableObject.table.tBodies[0] : (smartTableObject.hasOwnProperty('body') && smartTableObject.body && smartTableObject.body.hasOwnProperty('tag') && smartTableObject.body.tag) ? document.createElement(smartTableObject.body.tag) : document.createElement("tbody");
            elements.body.innerHTML = "";
            // loop through the body children (rows) and draw each row and column cell
            if (smartTableObject.hasOwnProperty('body') && smartTableObject.body && smartTableObject.body.hasOwnProperty('children') && smartTableObject.body.children) {
                // EACH ROW
                counters.page_offset = (smartTableObject.max_rows_to_show * (smartTableObject.pager_page - 1));
                counters.show_rows = ((smartTableObject.max_rows_to_show + counters.page_offset) > smartTableObject.body.children.length) ? smartTableObject.body.children.length : smartTableObject.max_rows_to_show + counters.page_offset;

                for (pointers.row_i = counters.page_offset; pointers.row_i < counters.show_rows; pointers.row_i += 1) {
                    if (smartTableObject.body.children[pointers.row_i]) { 
                        elements.tmprow = (smartTableObject.body.children[pointers.row_i].hasOwnProperty('tag') && smartTableObject.body.children[pointers.row_i].tag) ? document.createElement(smartTableObject.body.children[pointers.row_i].tag) : document.createElement("tr");

                        elements.tmprow.bodyRow = pointers.row_i;

                        // first if we passed any styling for the row, apply it
                        if (smartTableObject.body.children[pointers.row_i].hasOwnProperty('style') && smartTableObject.body.children[pointers.row_i].style !== "" && smartTableObject.body.children[pointers.row_i].style) {
                            applyStyles({
                                element: elements.tmprow,
                                styleObj: smartTableObject.body.children[pointers.row_i].style
                            });
                        }
                        // now for every attribute lets apply to the row
                        for (key in smartTableObject.body.children[pointers.row_i]) {
                            if (smartTableObject.body.children[pointers.row_i].hasOwnProperty(key)) {
                                if (smartTableObject.body.children[pointers.row_i][key] !== "children") {
                                    elements.tmprow[key] = smartTableObject.body.children[pointers.row_i][key];
                                }
                            }
                        }

                        // EACH CELL
                        for (pointers.cell_i = 0; pointers.cell_i < smartTableObject.body.children[pointers.row_i].children.length; pointers.cell_i += 1) {
                            elements.tmpcell = (smartTableObject.body.children[pointers.row_i].children[pointers.cell_i].hasOwnProperty('tag') && smartTableObject.body.children[pointers.row_i].children[pointers.cell_i].tag) ? document.createElement(smartTableObject.body.children[pointers.row_i].children[pointers.cell_i].tag) : document.createElement("td");
                            elements.tmpcell = SmartTable.setupCell(smartTableObject, pointers.cell_i, smartTableObject.body.children[pointers.row_i].children[pointers.cell_i], elements.tmprow, elements.tmpcell);
                            // put cell in row
                            elements.tmprow.appendChild(elements.tmpcell);
                        }
                        // add zebra style ability to rows
                        elements.tmprow.className = elements.tmprow.className.replace(" odd", "").replace("odd", "").replace(" even", "").replace("even", "");
                        elements.tmprow.className += (pointers.zebra_odd) ? " odd" : " even";
                        pointers.zebra_odd = !pointers.zebra_odd;

                        // put row in body
                        elements.body.appendChild(elements.tmprow);
                    }
                }
            }
            if (!smartTableObject.table.hasOwnProperty('tBodies') || (smartTableObject.table.hasOwnProperty('tBodies') && smartTableObject.table.tBodies && smartTableObject.table.tBodies.length === 0)) {
                // put body in table
                smartTableObject.table.appendChild(elements.body);
            }
        }
        
        return smartTableObject;
    };

    SmartTable.buildSmartTable = function(builder_obj) {
        var smartTableObject = {};
        // make sure some items present in the builder object
        builder_obj.table = (builder_obj.hasOwnProperty('table') && builder_obj.table) ? builder_obj.table : {};
        builder_obj.table.headerMap = (builder_obj.table.hasOwnProperty('headerMap')) ? builder_obj.table.headerMap : false;
        builder_obj.table.bodyMap = (builder_obj.table.hasOwnProperty('bodyMap')) ? builder_obj.table.bodyMap : false;
        builder_obj.data = (builder_obj.hasOwnProperty('data') && builder_obj.data) ? builder_obj.data : [];
        builder_obj.displayNonMapData = (builder_obj.hasOwnProperty('displayNonMapData') && (builder_obj.displayNonMapData === true || builder_obj.displayNonMapData === false)) ? builder_obj.displayNonMapData : true;
        
        smartTableObject = {
            builder_obj: builder_obj,
            displayNonMapData: builder_obj.displayNonMapData,
            header: {
                objMap: builder_obj.table.headerMap, 
                objMap_sorted: [],
                children: [],
                tag: 'thead'
            },
            body: {
                objMap: builder_obj.table.bodyMap, 
                objMap_sorted: [],
                objMap_unsorted: [],
                children: [],
                tag: "tbody",
                data: builder_obj.data
            },
            table: {},
            totals: {
                rows: 0,
                columns: 0
            },
            data: {
                origData: builder_obj.data
            },
            max_rows_to_show: builder_obj.data.length,
            pager_page: 1,
            sort_columns: [],
            spinner_element: false,
            filter_string: false,
            use_url_params : false,
            selection: false,
            filter: false,
            pagination: false
        };
        
        // move attributes into parent level
        if (builder_obj.table.hasOwnProperty('attributes') && builder_obj.table.attributes) { 
            smartTableObject = mergeObjects(smartTableObject, builder_obj.table.attributes);
        }

        //Should display a loader here in case this takes a while
        spinner(smartTableObject, true);

        // place rest of builder into setTimeout event because the browser will be too busy to draw the spinner
        setTimeout(function() {          
            // draw filter if requested
            if (smartTableObject.filter) {
                smartTableObject = SmartTable.drawFilter(smartTableObject);
            }
            smartTableObject = SmartTable.tableHeaderSetup(smartTableObject); // setup what will be the table header
            smartTableObject = SmartTable.tableBodySetup(smartTableObject); // setup what will be the table body and rows available to be drawn

            smartTableObject = calculateSomeTotals(smartTableObject);

            // draw the table and header now
            smartTableObject = SmartTable.drawHeader(smartTableObject);

            //build a pager if pagination is to be included
            if (smartTableObject.pagination) {
                smartTableObject.max_rows_to_show = (smartTableObject.pagination.hasOwnProperty('size') && smartTableObject.pagination.size) ? smartTableObject.pagination.size : smartTableObject.max_rows_to_show;
                // if user set to allow use of url parameters, we will see if url has values for the paginator 
                if (smartTableObject.use_url_params) {
                    smartTableObject.max_rows_to_show = parseFloat(getParam(smartTableObject.id + "_pager_rows", smartTableObject.max_rows_to_show));
                    smartTableObject.pager_page = parseFloat(getParam(smartTableObject.id + "_pager_page", smartTableObject.pager_page));
                    smartTableObject.pager_page = checkPagerPage(smartTableObject.pager_page, smartTableObject.body.children.length, smartTableObject.max_rows_to_show);
                }
                smartTableObject = SmartTable.drawPager(smartTableObject);
            }

            // draw the body and update the table
            smartTableObject = SmartTable.drawBody(smartTableObject);
            // make sure table rows have proper amount of cells
            fixTableCells(smartTableObject.table);
            
            //build a selector if is to be included
            if (smartTableObject.selection) {
                smartTableObject = SmartTable.drawSelector(smartTableObject);
            }

            // if user set to allow use of url parameters, we will get and update the url when user filters and sorts to allow sharing of the url
            if (smartTableObject.use_url_params) {
                if (smartTableObject.filter) { 
                    // if a filter ({table.id}_filter) was passed in url lets handle it
                    smartTableObject.filter_string = getParam(smartTableObject.id + "_filter");
                    if (smartTableObject.filter_string) {smartTableObject = SmartTable.handleFilter(smartTableObject, smartTableObject.filter_string);}
                }
                // if a column sort value ({table.id}_sort) was passed in url lets handle it
                smartTableObject.sort_columns = getParam(smartTableObject.id + "_sort", smartTableObject.sort_columns.join(":"));
                smartTableObject.sort_columns = smartTableObject.sort_columns.split(":");
            }
            if (smartTableObject.sort_columns && smartTableObject.sort_columns.length) {smartTableObject = SmartTable.handleSort(smartTableObject);}
            
            spinner(smartTableObject, false);
            
            // main callback called only once and after we complete building this smartTableObject and table
            if (builder_obj.hasOwnProperty('callback') && builder_obj.callback) {
                builder_obj.callback(smartTableObject);
            }
        }
        , 5);

        return smartTableObject;
    };

    SmartTable.alterTable = function(smartTableObject, obj) {
        var action = (obj && obj.hasOwnProperty('action')) ? obj.action : false,
            row = (obj && obj.hasOwnProperty('row')) ? obj.row : 1, // row is the rowIndex value from the table (this starts at 1)
            cell = (obj && obj.hasOwnProperty('cell')) ? obj.cell : false, 
            data = (obj && obj.hasOwnProperty('data')) ? obj.data : false,
            display_only = (obj && obj.hasOwnProperty('display_only')) ? obj.display_only : false,
            builder_obj = (obj && obj.hasOwnProperty('builder_obj')) ? obj.builder_obj : false,
            pointers = {};
            
        if (smartTableObject) {
            switch (action) {
                case 'reload':
                    // resetup rows
                    if (!data) {
                        data = smartTableObject.data.origData;
                    }
                    if (!builder_obj) {
                        builder_obj = smartTableObject.builder_obj;
                    }
                    
                    builder_obj.callback = false;
                    builder_obj.data = data;
                    builder_obj.target.innerHTML = "";
                    
                    SmartTable.buildSmartTable(builder_obj);
                    break;
                case 'update':
                    // if okay to save (not display only) then save in origdata
                    pointers.origData_index = false;
                    if (data) {
                        pointers.child_i = (cell || cell === 0) ? cell : 0;
                        // will modify smartTableObject.data.origData
                        if (smartTableObject.body.children[row-1] && smartTableObject.body.children[row-1].children[pointers.child_i] && smartTableObject.body.children[row-1].children[pointers.child_i].hasOwnProperty('data') && smartTableObject.body.children[row-1].children[pointers.child_i].data) {
                            for (pointers.data_i = 0; pointers.data_i < smartTableObject.data.origData.length; pointers.data_i += 1) {
                                // we need to find the exact location in to origData that this row exists (we can match the exact data objects)
                                if (objectEquals(smartTableObject.data.origData[pointers.data_i], smartTableObject.body.children[row-1].children[pointers.child_i].data)) {
                                    if (!display_only) {smartTableObject.data.origData[pointers.data_i] = mergeObjects(smartTableObject.data.origData[pointers.data_i], data);}
                                    pointers.origData_index = pointers.data_i;
                                    break;
                                }
                            }
                        }
                        // update the table body data
                        if (pointers.origData_index || pointers.origData_index === 0) {
                            // get new data object
                            data = mergeObjects(smartTableObject.data.origData[pointers.data_i], data);

                            for (pointers.body_i = pointers.child_i; pointers.body_i < smartTableObject.body.children[row-1].children.length; pointers.body_i += 1) {
                                // redraw the cell object
                               smartTableObject.body.children[row-1].children[pointers.body_i] = SmartTable.createTDs({
                                    columnData: smartTableObject.body.children[row-1].children[pointers.body_i],
                                    row: smartTableObject.body.children[row-1],
                                    row_data: data
                                });

                                // if there is a drawn table row for this smarttable body row, then lets run the cell creation again
                                if (smartTableObject.table.childNodes[1].childNodes[row-1] && smartTableObject.table.childNodes[1].childNodes[row-1].childNodes[pointers.body_i]) {
                                    smartTableObject.table.childNodes[1].childNodes[row-1].childNodes[pointers.body_i].innerHTML = "";
                                    smartTableObject.table.childNodes[1].childNodes[row-1].childNodes[pointers.body_i] = SmartTable.setupCell(smartTableObject, pointers.body_i, smartTableObject.body.children[row-1].children[pointers.body_i], smartTableObject.table.childNodes[1].childNodes[row-1], smartTableObject.table.childNodes[1].childNodes[row-1].childNodes[pointers.body_i]);
                                }
                                
                                if (cell || cell === 0) {break;}
                            }
                        }
                    }
                    break;
                case 'append':
                    for (pointers.data_i = 0; pointers.data_i < data.length; pointers.data_i += 1) { // loop data
                        smartTableObject = SmartTable.setupRow(smartTableObject, {data: data[pointers.data_i], row_index: (pointers.data_i + (row-1))});
                        if (!display_only) {
                            // will save it to smartTableObject.data.origData
                            smartTableObject.data.origData.splice((pointers.data_i + (row-1)), 0, data[pointers.data_i]);
                        }
                    }
                    // since we appended, we need to make sure the data is visible, so lets bump up the rows visible
                    if (smartTableObject.max_rows_to_show || smartTableObject.max_rows_to_show === 0) {smartTableObject.max_rows_to_show += data.length;}

                    // if we are using a pager, lets redraw it based on new data set
                    if (smartTableObject.builder_obj.hasOwnProperty('table') && smartTableObject.builder_obj.table && smartTableObject.builder_obj.table.hasOwnProperty('attributes') && smartTableObject.builder_obj.table.attributes && smartTableObject.builder_obj.table.attributes.hasOwnProperty('pagination') && smartTableObject.builder_obj.table.attributes.pagination) {
                        smartTableObject = SmartTable.drawPager(smartTableObject);
                    }
                    // redraw the body
                    smartTableObject = SmartTable.drawBody(smartTableObject);
                    fixTableCells(smartTableObject.table);
                    smartTableObject = calculateSomeTotals(smartTableObject);
                    break;
                case 'remove':
                    if (!display_only) {
                        // will modify smartTableObject.data.origData
                        if (smartTableObject.body.children[row-1] && smartTableObject.body.children[row-1].children[0] && smartTableObject.body.children[row-1].children[0].hasOwnProperty('data') && smartTableObject.body.children[row-1].children[0].data) {
                            for (pointers.data_i = 0; pointers.data_i < smartTableObject.data.origData.length; pointers.data_i += 1) {
                                // we need to find the exact location in to origData that this row exists (we can match the exact data objects)
                                if (objectEquals(smartTableObject.data.origData[pointers.data_i], smartTableObject.body.children[row-1].children[0].data)) {
                                    smartTableObject.data.origData.splice(pointers.data_i, 1);
                                    break;
                                }
                            }
                        }
                    }
                    // remove from the table body
                    smartTableObject.body.children.splice(row-1, 1);

                    // reduce rows visible
                    if (smartTableObject.max_rows_to_show) {smartTableObject.max_rows_to_show -= 1;}

                    // if we are using a pager, lets redraw it based on new data set
                    if (smartTableObject.builder_obj.hasOwnProperty('table') && smartTableObject.builder_obj.table && smartTableObject.builder_obj.table.hasOwnProperty('attributes') && smartTableObject.builder_obj.table.attributes && smartTableObject.builder_obj.table.attributes.hasOwnProperty('pagination') && smartTableObject.builder_obj.table.attributes.pagination) {
                        smartTableObject = SmartTable.drawPager(smartTableObject);
                    }
                    // redraw the body
                    smartTableObject = SmartTable.drawBody(smartTableObject);
                    fixTableCells(smartTableObject.table);
                    smartTableObject = calculateSomeTotals(smartTableObject);
                    break;
                default:
                    break;
            }

            // callback
            if (obj.hasOwnProperty('callback') && obj.callback) {
                obj.callback(smartTableObject);
            }
        }
    };
    
    // get the rows in the original data by matching data
    SmartTable.getOrigDataRowsByData = function(smartTableObject, obj) {
        var pointers = {}, key, counters = {need: objSize(obj), found: 0}, results = false;
        
        if (counters.need) {
            for (pointers.data_i = 0; pointers.data_i < smartTableObject.body.children.length; pointers.data_i += 1) {
                counters.found = 0;
                objectloop:
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (smartTableObject.data.origData[pointers.data_i].hasOwnProperty(key) && smartTableObject.data.origData[pointers.data_i][key] === obj[key]) {
                            counters.found += 1;
                            if (counters.found === counters.need) {
                                if (!results) {results = [];}
                                results.push(pointers.data_i);
                                break objectloop;
                            }
                        }
                    }
                }
            }
        }
        return results;
    };
    
    // get row location by looking at the data in the row to match all items passed in the obj
    SmartTable.getBodyRowsByData = function(smartTableObject, obj) {
        var pointers = {}, key, counters = {need: objSize(obj), found: 0}, results = false;
        
        if (counters.need) {
            for (pointers.body_i = 0; pointers.body_i < smartTableObject.body.children.length; pointers.body_i += 1) {
                counters.found = 0;
                objectloop:
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (smartTableObject.body.children[pointers.body_i].children[0].data.hasOwnProperty(key) && smartTableObject.body.children[pointers.body_i].children[0].data[key] === obj[key]) {
                            counters.found += 1;
                            if (counters.found === counters.need) {
                                if (!results) {results = [];}
                                results.push(pointers.body_i + 1);
                                break objectloop;
                            }
                        }
                    }
                }
            }
        }
        return results;
    };
    
    // get the data for a given row
    SmartTable.getDatabyRow = function(smartTableObject, row_index) {
        var results = false;
        
        if (smartTableObject.body.children[row_index] && smartTableObject.body.children[row_index].children[0] && smartTableObject.body.children[row_index].children[0].hasOwnProperty('data')) {
            results = smartTableObject.body.children[row_index].children[0].data;
        }
            
        return results;
    };
    
    // get all selected rows from the body object (this will include visible and non visible rows)
    SmartTable.getSelectedRows = function(smartTableObject) {
        var pointers = {}, results = false;
        
        for (pointers.body_i = 0; pointers.body_i < smartTableObject.body.children.length; pointers.body_i += 1) {
            if (smartTableObject.body.children[pointers.body_i].hasOwnProperty('rowSelected') && smartTableObject.body.children[pointers.body_i].rowSelected) {
                if (!results) {results = [];}
                results.push({row: pointers.body_i, data: smartTableObject.body.children[pointers.body_i].children[0].data});
            }
        }
        
        return results;
    };
    
    // get all selected rows from the body object (this will include visible and non visible rows)
    SmartTable.selectRows = function(smartTableObject, rows_arr) {
        var pointers = {};
        
        for (pointers.rows_i = 0; pointers.rows_i < rows_arr.length; pointers.rows_i += 1) {
            smartTableObject.body.children[rows_arr[pointers.rows_i] - 1].rowSelected = true;
            
            if (smartTableObject.table.childNodes[1].childNodes[rows_arr[pointers.rows_i] - 1]) {
                smartTableObject.table.childNodes[1].childNodes[rows_arr[pointers.rows_i] - 1].childNodes[0].childNodes[0].checked = true;
            }
        }
    };

}());
