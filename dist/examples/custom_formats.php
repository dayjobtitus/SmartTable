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
                                sortable: true
                            },
                            headerMap: [
                                {col: 0, row: 0, innerHTML: 'integer', sortable: true, className: 'number'},
                                {col: 1, row: 0, innerHTML: 'number', sortable: true, className: 'number'},
                                {col: 2, row: 0, innerHTML: 'percentage', sortable: true, className: 'number'},
                                {col: 3, row: 0, innerHTML: 'boolean', sortable: true}
                            ],
                            bodyMap: [
                                {
                                    col: 0,
                                    dataObjId: 'id',
                                    className: 'number'
                                },
                                {
                                    col: 1, 
                                    dataObjId: 'ccc',
                                    format: 'currency'
                                },
                                {
                                    col: 2, 
                                    dataObjId: 'ddd',
                                    format: 'percentage',
                                    renderCallback: function(obj, data, col, row){
                                        var tmp_element;
                                        // if we only want to edit the above format under a condition
                                        if (!data.eee) {
                                            delete obj.innerHTML; // since we want to deal with the cell ourselves we remove the generated html
                                            tmp_element = document.createElement('i');
                                            tmp_element.innerHTML = "BAD";
                                            col.appendChild(tmp_element);
                                        }
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
