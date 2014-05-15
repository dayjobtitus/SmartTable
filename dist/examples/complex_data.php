<?php error_reporting(E_ALL ^ E_NOTICE); ?>
<!DOCTYPE html><html lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>SmartTable - <?=preg_replace('/\.php$/', '', basename(__FILE__));?></title>
        
        <link href="../css/SmartTable-2.2a.dev.css" rel="stylesheet" type="text/css"/>
        <script type="text/javascript" src="../js/SmartTable-2.2a.dev.js"></script>
    </head>
    <body>
        <div id="tablediv"></div>
        <script type="text/javascript">
            /*
            * This example is similar to custom formats example but additionally we access the pre-handling callback to create a new data object item based on some row specific logic, for which is then accessable as if it existed previous
            * - You can use this type of workflow to access the row to maybe apply some css tag pre-render or pretty much anything can be done here
            * - additionally we display the use of some attributes like filer and pagination and sorting
            */
            (function() {
                var data = [{id: 454845, aaa: '40', bbb: 12.345, ccc: 45.25, ddd: 45.25, eee: false},{id: 434556, aaa: '123452', bbb: 4.5, ccc: 8526.1, ddd: 8526.1, eee: true},{id: 1123441, aaa: '0', bbb: 324, ccc: 741, ddd: 741, eee: true},{id: 10, aaa: '0', bbb: 324, ccc: 0.32, ddd: 0.32, eee: false}],
                    smarttableobject = {},
                    target = document.getElementById('tablediv'),
                    builder_obj = {
                        target: target,
                        data: data,
                        displayNonMapData: false,
                        
                        table: {
                            attributes: {
                                cellSpacing: '0',
                                cellPadding: '2',
                                className: 'tablesorter',
                                id: 'sampleSt',
                                filter: true,
                                sort_columns: [1, 0],
                                pagination: {size: 2},
                            },
                            headerMap: [
                                {col: 0, row: 0, innerHTML: 'integer', sortable: true, className: 'number'},
                                {col: 1, row: 0, innerHTML: 'number', sortable: true, className: 'number'},
                                {col: 2, row: 0, innerHTML: 'math', sortable: true},
                                {col: 3, row: 0, innerHTML: 'boolean', sortable: true}
                            ],
                            bodyMap: [
                                {
                                    col: 0,
                                    dataObjId: 'id',
                                    className: 'number',
                                    callback: function(data, cell_obj, row_obj){
                                        data.newitem = data.id * 2;
                                    },
                                },
                                {
                                    col: 1, 
                                    dataObjId: 'newitem',
                                    format: 'number'
                                },
                                {
                                    col: 2, 
                                    exportby: function(data, value) {
                                        return data.bbb + " + " + data.ccc + " = " + (data.bbb + data.ccc);
                                    },
                                    sortby: function(data, value) {
                                        return data.bbb + " + " + data.ccc + " = " + (data.bbb + data.ccc);
                                    },
                                    renderCallback: function(obj, data, col, row){
                                        obj.innerHTML = data.bbb + " + " + data.ccc + " = " + (data.bbb + data.ccc);
                                    }
                                },
                                {
                                    col: 3, 
                                    renderCallback: function(obj, data, col, row){
                                        // here we didnt assign any object so we just want to create something all our own
                                        obj.innerHTML = 'False';
                                        if (data.eee) {
                                            obj.innerHTML = 'True';
                                        }
                                    }
                                }
                            ]
                        }
                    };
            
                target.innerHTML = "";

                smarttableobject = SmartTable.buildSmartTable(builder_obj);
            }());
        </script>
    </body>
</html>
