#!/bin/bash

function check_start(){
    is_run=$(forever list | wc -l)
    if [ "$is_run" == "1" ]; then
        echo "실행 중이 아님!"
        forever start /root/SRMClient/bin/main.js
    fi
}


check_start
