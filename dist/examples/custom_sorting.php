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
                var data = [{id: 'test row A', aaa: '40', bbb: 12.345, ccc: 'Ut placerat mi id justo.'},{id: 'test row B', aaa: '123452', bbb: 4.5, ccc: 'Aliquam non iaculis metus, eu convallis mauris.'},{id: 'test row C', aaa: '0', bbb: 324, ccc: 'Phasellus massa magna.'}],
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
                                {col: 0, row: 0, innerHTML: '', sortable: true, width: '150'},
                                {col: 1, row: 0, innerHTML: 'ints', sortable: true, className: 'number'},
                                {col: 2, row: 0, innerHTML: 'decs', sortable: true, className: 'number'},
                                {col: 3, row: 0, innerHTML: 'memo'}
                            ],
                            bodyMap: [
                                {
                                    col: 0,
                                    dataObjId: 'id'
                                },
                                {
                                    col: 1,
                                    dataObjId: 'aaa',
                                    format: 'number'
                                },
                                {
                                    col: 2,
                                    dataObjId: 'bbb',
                                    format: 'decimal'
                                },
                                {
                                    col: 3, 
                                    dataObjId: 'ccc'
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
