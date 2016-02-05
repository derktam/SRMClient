#!/bin/bash


function install_start(){
check_node=$(which node)
    if [ "$check_node" == "" ]; then
        echo "nodejs를 설치합니다"
        tar -xvf node-v0.10.28.tar.gz
        sleep 1
        cd node-v0.10.28
        sleep 1
        ./configure
        sleep 1
        make;make install
        sleep 1
        cd ..
        sleep 1
    fi
    node -v
    sleep 1
    check_forever=$(which forever)
    if [ "$check_forever" == "" ]; then
        echo "forever를 설치합니다"
        npm install -g forever
        sleep 1
    fi
    node bin/main.js
    sleep 1
    ./srm_start.sh
    sleep 1
    mkdir garbage
    rm -rf node-v0.10.28/
    rm -rf node-v0.10.28.tar.gz
    mv install.sh garbage/
    echo "실행 완료! crontab에 srm_start 를 등록 시켜 주세요!"
}


install_start
