<?php error_reporting(E_ALL ^ E_NOTICE); ?>
<!DOCTYPE html><html lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>SmartTable Examples</title>
        <link href="a.css" rel="stylesheet" type="text/css"/>
    </head>
    <body>
        <?php
            $examples = scandir("./examples");
            foreach($examples as $link){ 
                if ($link != "." && $link != "..") {?>
                <a href='./examples/<?=$link?>'><?=$link?></a>
            <?php 
                }
            } ?>
    </body>
</html>